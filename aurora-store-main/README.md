# ◈ Aurora Store — Full Stack Digital Product Store Template

A fully-featured ecommerce template for selling digital products, built with **React + Vite** (frontend) and **Node.js + Express + MongoDB** (backend).

## ✨ Features

- 💳 Razorpay payment gateway (UPI, Cards, Netbanking, Wallets)
- 📧 Instant download link delivery via email after payment
- 🗄️ MongoDB database (users, products, orders, coupons, reviews)
- 🔐 JWT auth + Forgot/Reset password via email
- 🌐 Google & GitHub OAuth (optional)
- 📱 Mobile-friendly responsive design
- 🛡️ Admin dashboard (products, orders, users, coupons)
- 🏷️ Coupon / discount system
- ⭐ Product reviews
- 🤝 Discord community integration

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/aurora-store.git
cd aurora-store
```

### 2. Install dependencies

```bash
# Frontend
npm install

# Backend
cd backend && npm install
```

### 3. Configure environment variables

**Backend** — copy and fill in:
```bash
cp .env.example backend/.env
```

**Frontend** — copy and fill in:
```bash
cp .env.example.frontend .env
```

See `.env.example` and `.env.example.frontend` for all required variables with descriptions.

### 4. Run locally

```bash
# Backend (from /backend folder)
node server.js
# → http://localhost:3001

# Frontend (from root folder)
npm run dev
# → http://localhost:5173
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `RAZORPAY_KEY_ID` | Razorpay Key ID (from dashboard) |
| `RAZORPAY_KEY_SECRET` | Razorpay Key Secret |
| `EMAIL` | Gmail address for sending order emails |
| `EMAIL_PASS` | Gmail App Password (not your regular password) |
| `JWT_SECRET` | Long random string for signing tokens |
| `ADMIN_PASSWORD` | Password for the admin panel |
| `PORT` | Backend port (default: 3001) |
| `FRONTEND_URL` | Your frontend URL (for CORS) |

### Frontend (`.env` in root)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Your backend API URL |
| `VITE_STORE_EMAIL` | Contact email shown in footer/terms |
| `VITE_DISCORD_URL` | Discord invite link |

---

## 🔐 Admin Login

- Email: `admin`
- Password: whatever you set in `ADMIN_PASSWORD`

---

## 📧 Gmail App Password Setup

1. Go to **Google Account → Security → 2-Step Verification**
2. Scroll down to **App passwords**
3. Generate one for "Mail"
4. Use that as `EMAIL_PASS` (not your regular Gmail password)

---

## 🚢 Deployment

**Frontend:** Deploy to [Vercel](https://vercel.com) — `vercel.json` is already configured.

**Backend:** Deploy to [Render](https://render.com), [Railway](https://railway.app), or any Node.js host. Set all environment variables in the host's dashboard.

---

## 📄 License

MIT — free to use, modify, and build on.
