import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Razorpay from 'razorpay';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import session from 'express-session';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ─── CONFIG ───────────────────────────────────────────────────────────────
const MONGO_URI         = process.env.MONGO_URI;
const JWT_SECRET        = process.env.JWT_SECRET;
const RAZORPAY_KEY_ID   = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const EMAIL             = process.env.EMAIL;
const ADMIN_PASSWORD    = process.env.ADMIN_PASSWORD;
const FRONTEND_URL      = process.env.FRONTEND_URL      || 'http://localhost:5173';
const DISCORD_URL       = process.env.DISCORD_URL       || 'https://discord.gg/your-invite-here';

// Google / GitHub OAuth (optional — only activate if env vars are set)
const GOOGLE_CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GITHUB_CLIENT_ID     = process.env.GITHUB_CLIENT_ID     || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

// ─── RAZORPAY ─────────────────────────────────────────────────────────────
const razorpay = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });

// ─── NODEMAILER ───────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL, pass: process.env.EMAIL_PASS || '' }
});

// ─── SESSION (needed for OAuth) ───────────────────────────────────────────
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(passport.initialize());
app.use(passport.session());

// ─── MONGOOSE MODELS ──────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:    { type: String },          // optional for OAuth users
  role:        { type: String, default: 'user' },
  oauthProvider: String,                  // 'google' | 'github'
  oauthId:     String,
  resetToken:  String,
  resetExpiry: Date,
  wishlist:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name:          String,
  category:      String,
  price:         Number,
  originalPrice: Number,
  image:         { type: String, default: '📦' },
  images:        [String],               // ← gallery: array of image URLs
  description:   String,
  tags:          [String],
  featured:      { type: Boolean, default: false },
  downloadLink:  String,
  downloads:     { type: Number, default: 0 },
  rating:        { type: Number, default: 0 },
  reviewCount:   { type: Number, default: 0 },
  isBundle:      { type: Boolean, default: false },   // ← bundle flag
  bundleItems:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // products in bundle
  active:        { type: Boolean, default: true },
  createdAt:     { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema({
  orderId:          String,
  razorpayOrderId:  String,
  razorpayPaymentId:String,
  userId:           mongoose.Schema.Types.ObjectId,
  userEmail:        String,
  userName:         String,
  items:            Array,
  total:            Number,
  status:           { type: String, default: 'pending' },
  downloadsSent:    { type: Boolean, default: false },
  createdAt:        { type: Date, default: Date.now }
});

const CouponSchema = new mongoose.Schema({
  code:     { type: String, unique: true, uppercase: true },
  discount: Number,
  type:     { type: String, enum: ['percent', 'fixed'] },
  minOrder: { type: Number, default: 0 },
  active:   { type: Boolean, default: true },
  uses:     { type: Number, default: 0 }
});

const ReviewSchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId,
  userId:    mongoose.Schema.Types.ObjectId,
  userName:  String,
  rating:    Number,
  text:      String,
  createdAt: { type: Date, default: Date.now }
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, unique: true, trim: true }
});

const AbandonedCartSchema = new mongoose.Schema({
  userId:    mongoose.Schema.Types.ObjectId,
  email:     String,
  cart:      Array,
  emailSent: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

const User         = mongoose.model('User',         UserSchema);
const Product      = mongoose.model('Product',      ProductSchema);
const Order        = mongoose.model('Order',        OrderSchema);
const Coupon       = mongoose.model('Coupon',       CouponSchema);
const Review       = mongoose.model('Review',       ReviewSchema);
const Category     = mongoose.model('Category',     CategorySchema);
const AbandonedCart= mongoose.model('AbandonedCart',AbandonedCartSchema);

// ─── CONNECT DB ───────────────────────────────────────────────────────────
mongoose.connect(MONGO_URI).then(async () => {
  console.log('MongoDB connected');
  try {
    await mongoose.connection.collection('products').dropIndex('slug_1');
    console.log('Dropped legacy slug_1 index');
  } catch (e) { /* Index didn't exist — fine */ }

  const count = await Category.countDocuments();
  if (count === 0) {
    const defaults = ['Design','Courses','Graphics','Tools','Audio','eBooks','Photography','Code'];
    await Category.insertMany(defaults.map(name => ({ name })));
    console.log('Seeded default categories');
  }
}).catch(e => console.log('DB error:', e.message));

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

function adminAuth(req, res, next) {
  auth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
  });
}

// ─── HELPER: make JWT for a user ─────────────────────────────────────────
function makeToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ─── PASSPORT OAUTH SETUP ─────────────────────────────────────────────────
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try { done(null, await User.findById(id)); } catch (e) { done(e); }
});

async function findOrCreateOAuthUser({ provider, id, email, name }) {
  let user = await User.findOne({ oauthProvider: provider, oauthId: id });
  if (!user && email) user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    user = await User.create({
      name, email: email?.toLowerCase() || `${provider}_${id}@aurora.store`,
      oauthProvider: provider, oauthId: id
    });
  } else if (!user.oauthId) {
    user.oauthProvider = provider; user.oauthId = id;
    await user.save();
  }
  return user;
}

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID, clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: `/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const user = await findOrCreateOAuthUser({ provider: 'google', id: profile.id, email, name: profile.displayName });
      done(null, user);
    } catch (e) { done(e); }
  }));
}

if (GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: GITHUB_CLIENT_ID, clientSecret: GITHUB_CLIENT_SECRET,
    callbackURL: `/api/auth/github/callback`, scope: ['user:email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const user = await findOrCreateOAuthUser({ provider: 'github', id: String(profile.id), email, name: profile.displayName || profile.username });
      done(null, user);
    } catch (e) { done(e); }
  }));
}

// ─── OAUTH ROUTES ─────────────────────────────────────────────────────────
app.get('/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
app.get('/api/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: FRONTEND_URL + '?oauth=fail' }),
  (req, res) => {
    const token = makeToken(req.user);
    res.redirect(`${FRONTEND_URL}?oauth_token=${token}`);
  }
);

app.get('/api/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);
app.get('/api/auth/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: FRONTEND_URL + '?oauth=fail' }),
  (req, res) => {
    const token = makeToken(req.user);
    res.redirect(`${FRONTEND_URL}?oauth_token=${token}`);
  }
);

// Expose which OAuth providers are configured
app.get('/api/auth/providers', (req, res) => {
  res.json({
    google: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
    github: !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET)
  });
});

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(400).json({ error: 'Email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: hash });
    const token = makeToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'Email already registered' });
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'All fields required' });

    // Admin shortcut login (username: "admin")
    if (email === 'admin' && password === ADMIN_PASSWORD) {
      let admin = await User.findOne({ role: 'admin' });
      if (!admin) admin = await User.create({
        name: 'Aurora Admin', email: 'admin@aurora.store',
        password: await bcrypt.hash(ADMIN_PASSWORD, 10), role: 'admin'
      });
      const token = makeToken({ ...admin.toObject(), role: 'admin' });
      return res.json({ token, user: { id: admin._id, name: admin.name, email: admin.email, role: 'admin' } });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.password) return res.status(400).json({ error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });
    const token = makeToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.json({ message: 'If this email exists, a reset link has been sent.' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token; user.resetExpiry = new Date(Date.now() + 3600000);
    await user.save();
    const resetUrl = `${req.headers.origin || FRONTEND_URL}?reset=${token}`;
    try {
      await transporter.sendMail({
        from: `Aurora Store <${EMAIL}>`, to: user.email, subject: 'Reset Your Aurora Store Password',
        html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0f0f23;color:#f9fafb;padding:32px;border-radius:16px">
          <h2 style="color:#a78bfa">◈ Aurora Store</h2><p>Hi ${user.name},</p>
          <p>Click below to reset your password. Expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;margin:16px 0">Reset Password</a>
          <p style="color:#6b7280;font-size:13px">If you didn't request this, ignore this email.</p></div>`
      });
    } catch (mailErr) { console.log('Mail error:', mailErr.message); }
    res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
    const user = await User.findOne({ resetToken: token, resetExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });
    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined; user.resetExpiry = undefined;
    await user.save();
    res.json({ message: 'Password reset successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PRODUCTS ─────────────────────────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ active: true }).populate('bundleItems', 'name price image');
    res.json(products);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', adminAuth, async (req, res) => {
  try { res.json(await Product.create(req.body)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', adminAuth, async (req, res) => {
  try { res.json(await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', adminAuth, async (req, res) => {
  try { await Product.findByIdAndUpdate(req.params.id, { active: false }); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── CATEGORIES (MongoDB — not localStorage) ──────────────────────────────
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await Category.find().sort({ name: 1 });
    res.json(['All', ...cats.map(c => c.name)]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/categories', adminAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name required' });
    const cat = await Category.create({ name: name.trim() });
    res.json(cat);
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ error: 'Category already exists' });
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/categories/:name', adminAuth, async (req, res) => {
  try { await Category.deleteOne({ name: req.params.name }); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── WISHLIST ─────────────────────────────────────────────────────────────
app.get('/api/wishlist', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist');
    res.json(user.wishlist || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/wishlist/:productId', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { wishlist: req.params.productId } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/wishlist/:productId', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $pull: { wishlist: req.params.productId } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── ABANDONED CART ───────────────────────────────────────────────────────
app.post('/api/cart/track', auth, async (req, res) => {
  try {
    const { cart } = req.body;
    await AbandonedCart.findOneAndUpdate(
      { userId: req.user.id },
      { userId: req.user.id, email: req.user.email, cart, emailSent: false, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/cart/track', auth, async (req, res) => {
  try { await AbandonedCart.deleteOne({ userId: req.user.id }); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Check every 5 minutes for carts abandoned over 1 hour
setInterval(async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const abandoned = await AbandonedCart.find({ emailSent: false, updatedAt: { $lt: oneHourAgo } });
    for (const entry of abandoned) {
      if (!entry.cart || !entry.cart.length) continue;
      try {
        const itemsList = entry.cart.map(i =>
          `<li style="padding:4px 0;color:#d1d5db">${i.image || '📦'} ${i.name} — ₹${i.price}</li>`
        ).join('');
        await transporter.sendMail({
          from: `Aurora Store <${EMAIL}>`, to: entry.email,
          subject: '🛒 You left something behind at Aurora Store!',
          html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;background:#0f0f23;color:#f9fafb;padding:32px;border-radius:16px">
            <h2 style="color:#a78bfa">◈ Aurora Store</h2>
            <p>Hey! You left some items in your cart:</p>
            <ul style="list-style:none;padding:16px;margin:16px 0;background:#111827;border-radius:10px">${itemsList}</ul>
            <p style="color:#9ca3af;font-size:14px">These are waiting for you — complete your purchase!</p>
            <a href="${FRONTEND_URL}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;margin-top:16px">Complete Purchase →</a>
            <p style="color:#4b5563;font-size:12px;margin-top:24px">Aurora Store · ${EMAIL}</p></div>`
        });
        entry.emailSent = true; await entry.save();
        console.log('Abandoned cart email sent to', entry.email);
      } catch (mailErr) { console.log('Abandoned cart mail error:', mailErr.message); }
    }
  } catch (e) { console.log('Abandoned cart check error:', e.message); }
}, 5 * 60 * 1000);

// ─── COUPONS ──────────────────────────────────────────────────────────────
app.get('/api/coupons', adminAuth, async (req, res) => {
  res.json(await Coupon.find());
});

app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code, total } = req.body;
    const c = await Coupon.findOne({ code: code.toUpperCase(), active: true });
    if (!c) return res.status(400).json({ error: 'Invalid or expired coupon' });
    if (total < c.minOrder) return res.status(400).json({ error: `Minimum order ₹${c.minOrder} required` });
    res.json(c);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/coupons', adminAuth, async (req, res) => {
  try { res.json(await Coupon.create({ ...req.body, code: req.body.code.toUpperCase() })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/coupons/:id', adminAuth, async (req, res) => {
  try { res.json(await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/coupons/:id', adminAuth, async (req, res) => {
  try { await Coupon.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── RAZORPAY PAYMENT ─────────────────────────────────────────────────────
app.post('/api/payment/create-order', auth, async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    const order = await razorpay.orders.create({ amount: Math.round(amount * 100), currency, receipt: `rcpt_${Date.now()}` });
    res.json(order);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/payment/verify', auth, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, items, total, couponCode } = req.body;
    const sign = razorpayOrderId + '|' + razorpayPaymentId;
    const expected = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(sign).digest('hex');
    if (expected !== razorpaySignature) return res.status(400).json({ error: 'Payment verification failed' });

    const orderId = `ORD-${Date.now()}`;
    const order = await Order.create({
      orderId, razorpayOrderId, razorpayPaymentId,
      userId: req.user.id, userEmail: req.user.email, userName: req.user.name,
      items, total, status: 'completed'
    });

    for (const item of items) {
      await Product.findByIdAndUpdate(item._id || item.id, { $inc: { downloads: 1 } });
    }
    if (couponCode) await Coupon.findOneAndUpdate({ code: couponCode.toUpperCase() }, { $inc: { uses: 1 } });

    await AbandonedCart.deleteOne({ userId: req.user.id });

    const downloadLinks = items.map(i => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #1f2937;color:#f9fafb">${i.image || '📦'} ${i.name}</td>
        <td style="padding:12px;border-bottom:1px solid #1f2937;text-align:right">
          ${i.downloadLink
            ? `<a href="${i.downloadLink}" style="background:#7c3aed;color:#fff;padding:6px 14px;border-radius:8px;text-decoration:none;font-weight:600">⬇ Download</a>`
            : '<span style="color:#6b7280">Link coming soon</span>'}
        </td>
      </tr>`).join('');

    try {
      await transporter.sendMail({
        from: `Aurora Store <${EMAIL}>`,
        to: req.user.email,
        subject: `✅ Order Confirmed — Aurora Store #${orderId}`,
        html: `<div style="font-family:sans-serif;max-width:580px;margin:auto;background:#0f0f23;color:#f9fafb;padding:32px;border-radius:16px">
          <h2 style="color:#a78bfa;margin:0 0 4px">◈ Aurora Store</h2>
          <p style="color:#6b7280;margin:0 0 24px">Order Confirmation</p>
          <div style="background:#10b981;border-radius:10px;padding:16px;margin-bottom:24px;text-align:center">
            <div style="font-size:28px">🎉</div>
            <div style="font-weight:700;font-size:18px">Payment Successful!</div>
            <div style="color:#d1fae5;font-size:14px">Order ${orderId} · ₹${total}</div>
          </div>
          <p style="margin:0 0 16px;font-size:15px">Hi <strong>${req.user.name}</strong>, thank you for your purchase!</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:8px">
            <tr><td style="color:#9ca3af;padding:4px 0">Order ID</td><td style="color:#f9fafb;font-family:monospace">${orderId}</td></tr>
            <tr><td style="color:#9ca3af;padding:4px 0">Date</td><td style="color:#f9fafb">${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</td></tr>
            <tr><td style="color:#9ca3af;padding:4px 0">Total Paid</td><td style="color:#a78bfa;font-weight:700">₹${total}</td></tr>
          </table>
          <h3 style="color:#f9fafb;margin:20px 0 12px">Your Downloads</h3>
          <table style="width:100%;border-collapse:collapse;background:#111827;border-radius:10px;overflow:hidden">${downloadLinks}</table>
          <div style="background:#1f2937;border-radius:10px;padding:16px;margin-top:24px;font-size:13px;color:#9ca3af">
            <p style="margin:0 0 8px">📌 Download links are always available in your <strong style="color:#a78bfa">Orders</strong> page.</p>
            <p style="margin:0">Need help? Join our <a href="${DISCORD_URL}" style="color:#a78bfa">Discord</a> or email ${EMAIL}.</p>
          </div>
          <p style="color:#4b5563;font-size:12px;margin-top:24px">Aurora Store · ${EMAIL}</p>
        </div>`
      });
    } catch (mailErr) { console.log('Order email error:', mailErr.message); }

    res.json({ success: true, orderId, order });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── ORDERS ───────────────────────────────────────────────────────────────
app.get('/api/orders/my', auth, async (req, res) => {
  try { res.json(await Order.find({ userId: req.user.id }).sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/orders', adminAuth, async (req, res) => {
  try { res.json(await Order.find().sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── REVIEWS ──────────────────────────────────────────────────────────────
app.get('/api/reviews/:productId', async (req, res) => {
  try { res.json(await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/reviews', auth, async (req, res) => {
  try {
    const { productId, rating, text } = req.body;
    const review = await Review.create({ productId, userId: req.user.id, userName: req.user.name, rating, text });
    const reviews = await Review.find({ productId });
    const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, { rating: Math.round(avg * 10) / 10, reviewCount: reviews.length });
    res.json(review);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── USERS (admin) ────────────────────────────────────────────────────────
app.get('/api/users', adminAuth, async (req, res) => {
  try { res.json(await User.find({}, '-password').sort({ createdAt: -1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── STATS (admin) ────────────────────────────────────────────────────────
app.get('/api/stats', adminAuth, async (req, res) => {
  try {
    const [products, users, orders, coupons] = await Promise.all([
      Product.countDocuments({ active: true }),
      User.countDocuments(),
      Order.find({ status: 'completed' }),
      Coupon.countDocuments()
    ]);
    const revenue = orders.reduce((a, o) => a + (o.total || 0), 0);
    res.json({ products, users, orders: orders.length, revenue, coupons });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Revenue chart — last 30 days
app.get('/api/stats/revenue', adminAuth, async (req, res) => {
  try {
    const days = 30;
    const since = new Date(Date.now() - days * 86400000);
    const orders = await Order.find({ createdAt: { $gte: since }, status: 'completed' });
    const byDay = {};
    orders.forEach(o => {
      const d = new Date(o.createdAt).toISOString().slice(0, 10);
      byDay[d] = (byDay[d] || 0) + (o.total || 0);
    });
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      result.push({ date: d, revenue: byDay[d] || 0 });
    }
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── CONTACT ──────────────────────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    await transporter.sendMail({
      from: `Aurora Store Contact <${EMAIL}>`, to: EMAIL,
      subject: `[Contact] ${subject}`,
      html: `<p><b>From:</b> ${name} (${email})</p><p><b>Message:</b></p><p>${message}</p>`
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/razorpay-key', (req, res) => {
  res.json({ key: RAZORPAY_KEY_ID });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Aurora Store API running on port ${PORT}`));
