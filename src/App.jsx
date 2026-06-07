import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const DISCORD = import.meta.env.VITE_DISCORD_URL || "https://discord.gg/your-invite-here";
const STORE_EMAIL = import.meta.env.VITE_STORE_EMAIL || "your@email.com";

function api(path, opts = {}) {
  const token = localStorage.getItem("aurora_token");
  return fetch(API + path, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  }).then(r => r.json()).catch(() => ({}));
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);
  return { toasts, push };
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#07070f;--bg2:#0d0d1a;--bg3:#12121f;--card:#141424;--border:#1e1e35;--border2:#252540;
    --purple:#7c5cfc;--purple2:#9d7fff;--purple-dim:#2a1f5e;--green:#00e5a0;--red:#ff4d6d;
    --text:#f0f0ff;--text2:#9090b0;--text3:#50506a;--gold:#ffd166;
    --card-hover:#181830;
  }
  body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif}
  h1,h2,h3,h4{font-family:'Syne',sans-serif}
  input,select,textarea{outline:none;font-family:'DM Sans',sans-serif}
  input:focus,select:focus,textarea:focus{border-color:var(--purple)!important;box-shadow:0 0 0 3px rgba(124,92,252,.15)!important}
  select option{background:var(--bg2);color:var(--text)}
  ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:var(--bg2)}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}
  @keyframes toastIn{from{transform:translateX(110px);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(124,92,252,.3)}50%{box-shadow:0 0 40px rgba(124,92,252,.6)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  .anim{animation:fadeUp .35s cubic-bezier(.22,1,.36,1)}
  .btn{cursor:pointer;font-weight:600;border:none;transition:all .2s cubic-bezier(.22,1,.36,1);font-family:'DM Sans',sans-serif}
  .btn:hover{opacity:.88;transform:translateY(-1px)}.btn:active{transform:scale(.96) translateY(0)}
  .card-hover{transition:all .3s cubic-bezier(.22,1,.36,1)}
  .card-hover:hover{transform:translateY(-5px);box-shadow:0 24px 64px rgba(0,0,0,.6),0 0 0 1px var(--purple-dim)}
  .glass{background:rgba(20,20,36,.7);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
  @media(max-width:768px){.hm{display:none!important}.mf{width:100%!important}.mc{grid-template-columns:1fr!important;flex-direction:column!important}}
`;

/* ── tiny helpers ── */
function Toast({ toasts }) {
  return (
    <div style={{position:"fixed",top:20,right:20,zIndex:9999,display:"flex",flexDirection:"column",gap:8,maxWidth:320}}>
      {toasts.map(n=>(
        <div key={n.id} style={{background:n.type==="success"?"linear-gradient(135deg,#00c97a,#00e5a0)":n.type==="error"?"linear-gradient(135deg,#e02040,#ff4d6d)":"linear-gradient(135deg,#5c5cfc,#7c5cfc)",color:"#fff",padding:"13px 18px",borderRadius:14,fontSize:14,fontWeight:500,display:"flex",alignItems:"center",gap:10,boxShadow:"0 8px 32px rgba(0,0,0,.4)",animation:"toastIn .3s cubic-bezier(.22,1,.36,1)"}}>
          <span style={{fontSize:16}}>{n.type==="success"?"✓":n.type==="error"?"✗":"ℹ"}</span><span>{n.msg}</span>
        </div>
      ))}
    </div>
  );
}
function Sp({ size=18,color="#fff" }) {
  return <div style={{width:size,height:size,border:`2px solid ${color}3`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"spin .7s linear infinite",display:"inline-block",flexShrink:0}}/>;
}
function Stars({ rating,size=14,interactive=false,onRate }) {
  const [hov,setHov]=useState(0);
  return (
    <div style={{display:"flex",gap:2}}>
      {[1,2,3,4,5].map(s=>(
        <span key={s} onClick={()=>interactive&&onRate?.(s)} onMouseEnter={()=>interactive&&setHov(s)} onMouseLeave={()=>interactive&&setHov(0)}
          style={{fontSize:size,color:s<=(hov||rating)?"var(--gold)":"var(--border2)",cursor:interactive?"pointer":"default",lineHeight:1,transition:"color .15s"}}>★</span>
      ))}
    </div>
  );
}
function Badge({ children,color="purple" }) {
  const colors={purple:"rgba(124,92,252,.15)",green:"rgba(0,229,160,.1)",red:"rgba(255,77,109,.1)",gold:"rgba(255,209,102,.1)"};
  const texts={purple:"var(--purple2)",green:"var(--green)",red:"var(--red)",gold:"var(--gold)"};
  return <span style={{background:colors[color],color:texts[color],padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,letterSpacing:.5}}>{children}</span>;
}
function Tag({ children }) {
  return <span style={{background:"var(--bg2)",border:"1px solid var(--border2)",color:"var(--text2)",padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:500}}>{children}</span>;
}
function Inp({ label,...p }) {
  return (
    <div style={{marginBottom:14}}>
      {label&&<label style={{display:"block",color:"var(--text2)",fontSize:12,marginBottom:6,fontWeight:600,letterSpacing:.5,textTransform:"uppercase"}}>{label}</label>}
      <input {...p} style={{width:"100%",background:"var(--bg2)",border:"1px solid var(--border2)",color:"var(--text)",padding:"11px 14px",borderRadius:10,fontSize:14,transition:"all .2s",...p.style}}/>
    </div>
  );
}

/* ── image util ── */
const isUrl = s => s && (s.startsWith("http") || s.startsWith("/"));

/* ── Header ── */
function Header({ page,setPage,user,cart,wishlist,logout }) {
  const [mob,setMob]=useState(false);
  const count=cart.reduce((a,b)=>a+b.qty,0);
  return (
    <header style={{background:"rgba(7,7,15,.9)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:"1px solid var(--border)",padding:"0 20px",display:"flex",alignItems:"center",gap:16,height:64,position:"sticky",top:0,zIndex:200}}>
      <div onClick={()=>setPage("home")} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",flexShrink:0}}>
        <div style={{width:32,height:32,background:"linear-gradient(135deg,var(--purple),#b06fff)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,boxShadow:"0 0 20px rgba(124,92,252,.4)"}}>◈</div>
        <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:"var(--text)",letterSpacing:-.5}}>Aurora</span>
      </div>
      <nav className="hm" style={{display:"flex",gap:2,marginLeft:8}}>
        {[["home","Home"],["products","Products"],["orders","Orders"]].map(([p,l])=>(
          <button key={p} className="btn" onClick={()=>setPage(p)} style={{background:page===p?"var(--purple-dim)":"transparent",color:page===p?"var(--purple2)":"var(--text2)",padding:"7px 14px",borderRadius:8,fontSize:14,fontWeight:page===p?700:400,border:page===p?"1px solid rgba(124,92,252,.3)":"1px solid transparent"}}>{l}</button>
        ))}
        {user?.role==="admin"&&(
          <button className="btn" onClick={()=>setPage("admin")} style={{background:page==="admin"?"var(--purple-dim)":"transparent",color:"var(--purple2)",padding:"7px 14px",borderRadius:8,fontSize:14,border:"1px solid rgba(124,92,252,.3)"}}>⚡ Admin</button>
        )}
      </nav>
      <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
        <button className="btn" onClick={()=>setPage("search")} style={{background:"var(--card)",color:"var(--text2)",width:38,height:38,borderRadius:10,fontSize:15,border:"1px solid var(--border)"}}>🔍</button>
        {user&&(
          <button className="btn" onClick={()=>setPage("wishlist")} style={{background:"var(--card)",color:"var(--red)",width:38,height:38,borderRadius:10,fontSize:15,position:"relative",border:"1px solid var(--border)"}}>
            ♥{wishlist.length>0&&<span style={{position:"absolute",top:-5,right:-5,background:"var(--red)",color:"#fff",borderRadius:"50%",width:18,height:18,fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>{wishlist.length}</span>}
          </button>
        )}
        <button className="btn" onClick={()=>setPage("cart")} style={{background:"var(--card)",color:"var(--green)",width:38,height:38,borderRadius:10,fontSize:15,position:"relative",border:"1px solid var(--border)"}}>
          🛒{count>0&&<span style={{position:"absolute",top:-5,right:-5,background:"var(--green)",color:"#000",borderRadius:"50%",width:18,height:18,fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>{count}</span>}
        </button>
        <a className="hm" href={DISCORD} target="_blank" rel="noopener noreferrer" style={{background:"#5865f2",color:"#fff",padding:"7px 14px",borderRadius:10,fontSize:13,fontWeight:700,textDecoration:"none",display:"flex",alignItems:"center",gap:6}}>Discord</a>
        {user ? (
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,var(--purple),#b06fff)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:800,boxShadow:"0 0 12px rgba(124,92,252,.4)"}}>{user.name[0].toUpperCase()}</div>
            <button className="btn hm" onClick={logout} style={{background:"transparent",color:"var(--text3)",fontSize:13,border:"1px solid var(--border)",padding:"6px 12px",borderRadius:8}}>Sign out</button>
          </div>
        ) : (
          <button className="btn" onClick={()=>setPage("auth")} style={{background:"linear-gradient(135deg,var(--purple),#9d6fff)",color:"#fff",padding:"8px 18px",borderRadius:10,fontSize:13,boxShadow:"0 4px 20px rgba(124,92,252,.3)"}}>Sign In</button>
        )}
        <button className="btn" id="mb" onClick={()=>setMob(!mob)} style={{background:"var(--card)",color:"var(--text2)",width:38,height:38,borderRadius:10,fontSize:18,display:"none",alignItems:"center",justifyContent:"center",border:"1px solid var(--border)"}}>☰</button>
      </div>
      <style>{`@media(max-width:768px){#mb{display:flex!important}}`}</style>
      {mob&&(
        <div onClick={()=>setMob(false)} style={{position:"fixed",inset:0,top:64,background:"rgba(7,7,15,.97)",zIndex:150,padding:20,display:"flex",flexDirection:"column",gap:8,backdropFilter:"blur(20px)"}}>
          {[["home","🏠 Home"],["products","🛍 Products"],["orders","📦 Orders"],["wishlist","♥ Wishlist"],["faq","❓ FAQ"],["contact","✉️ Contact"]].map(([p,l])=>(
            <button key={p} className="btn" onClick={()=>{setPage(p);setMob(false);}} style={{background:"var(--card)",border:"1px solid var(--border)",color:"var(--text)",padding:"16px 20px",borderRadius:12,fontSize:15,textAlign:"left",fontFamily:"'Syne',sans-serif"}}>{l}</button>
          ))}
          {user?.role==="admin"&&<button className="btn" onClick={()=>{setPage("admin");setMob(false);}} style={{background:"var(--purple-dim)",border:"1px solid rgba(124,92,252,.4)",color:"var(--purple2)",padding:"16px 20px",borderRadius:12,fontSize:15,textAlign:"left"}}>⚡ Admin</button>}
          <a href={DISCORD} target="_blank" rel="noopener noreferrer" style={{background:"#5865f2",color:"#fff",padding:"16px 20px",borderRadius:12,fontSize:15,fontWeight:700,textDecoration:"none"}}>🎮 Join Discord</a>
          {user&&<button className="btn" onClick={logout} style={{background:"var(--card)",color:"var(--text3)",padding:"16px 20px",borderRadius:12,fontSize:15,textAlign:"left",border:"1px solid var(--border)"}}>Sign Out</button>}
        </div>
      )}
    </header>
  );
}

/* ── Product Card ── */
function Card({ p,setPage,cart,setCart,toast,wishlist,toggleWishlist,user }) {
  const inCart=cart.find(i=>(i._id||i.id)===(p._id||p.id));
  const inWish=wishlist.includes(p._id||p.id);
  const disc=p.originalPrice>p.price?Math.round((1-p.price/p.originalPrice)*100):0;
  return (
    <div className="card-hover" onClick={()=>setPage("product-"+(p._id||p.id))}
      style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:18,overflow:"hidden",cursor:"pointer",position:"relative",display:"flex",flexDirection:"column"}}>
      {disc>0&&<div style={{position:"absolute",top:12,left:12,background:"linear-gradient(135deg,#e02040,var(--red))",color:"#fff",fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:20,zIndex:1,letterSpacing:.5}}>-{disc}%</div>}
      {p.featured&&<div style={{position:"absolute",top:12,right:48,background:"rgba(255,209,102,.15)",color:"var(--gold)",fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:20,zIndex:1,border:"1px solid rgba(255,209,102,.2)"}}>★ TOP</div>}
      {p.isBundle&&!disc&&<div style={{position:"absolute",top:12,left:12,background:"rgba(0,229,160,.15)",color:"var(--green)",fontSize:10,fontWeight:800,padding:"3px 9px",borderRadius:20,zIndex:1,border:"1px solid rgba(0,229,160,.2)"}}>BUNDLE</div>}
      {/* Wishlist heart */}
      <button className="btn" onClick={e=>{e.stopPropagation();if(!user){setPage("auth");return;}toggleWishlist(p._id||p.id);}}
        style={{position:"absolute",top:10,right:10,zIndex:2,background:"rgba(7,7,15,.65)",backdropFilter:"blur(4px)",color:inWish?"var(--red)":"var(--text3)",width:32,height:32,borderRadius:9,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid var(--border)",transition:"all .2s"}}>
        {inWish?"♥":"♡"}
      </button>
      <div style={{height:148,background:"linear-gradient(135deg,#0c0c1e,#160d30)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",position:"relative"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 50%,rgba(124,92,252,.18) 0%,transparent 70%)"}}/>
        {isUrl(p.image)
          ? <img src={p.image} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover",transition:"transform .4s ease"}}/>
          : <span style={{fontSize:60,filter:"drop-shadow(0 0 20px rgba(124,92,252,.5))",position:"relative",animation:"float 4s ease-in-out infinite"}}>{p.image||"📦"}</span>}
      </div>
      <div style={{padding:"14px 16px",flex:1,display:"flex",flexDirection:"column",gap:7}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:10,color:"var(--purple2)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,background:"rgba(124,92,252,.1)",padding:"2px 8px",borderRadius:6}}>{p.category}</div>
          <div style={{display:"flex",alignItems:"center",gap:4}}><Stars rating={p.rating||0} size={11}/><span style={{fontSize:10,color:"var(--text3)"}}>({p.reviewCount||0})</span></div>
        </div>
        <div style={{fontSize:15,fontWeight:700,color:"var(--text)",lineHeight:1.3,fontFamily:"'Syne',sans-serif"}}>{p.name}</div>
        {p.isBundle&&p.bundleItems?.length>0&&(
          <div style={{fontSize:11,color:"var(--green)",background:"rgba(0,229,160,.08)",borderRadius:6,padding:"4px 8px",border:"1px solid rgba(0,229,160,.15)"}}>
            Includes {p.bundleItems.length} products
          </div>
        )}
        <div style={{marginTop:"auto",paddingTop:8,borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <span style={{fontSize:19,fontWeight:800,color:"var(--text)",fontFamily:"'Syne',sans-serif"}}>₹{p.price}</span>
            {p.originalPrice>p.price&&<span style={{fontSize:11,color:"var(--text3)",textDecoration:"line-through",marginLeft:5}}>₹{p.originalPrice}</span>}
          </div>
          <button className="btn" onClick={e=>{e.stopPropagation();if(inCart){setPage("cart");return;}setCart(c=>[...c,{...p,qty:1}]);toast("Added to cart! 🎉");}}
            style={{background:inCart?"var(--purple-dim)":"var(--purple)",color:inCart?"var(--purple2)":"#fff",padding:"6px 13px",borderRadius:8,fontSize:12,border:inCart?"1px solid rgba(124,92,252,.4)":"none",boxShadow:inCart?"none":"0 4px 14px rgba(124,92,252,.35)"}}>
            {inCart?"✓ Added":"+ Cart"}
          </button>
        </div>
        <div style={{fontSize:10,color:"var(--text3)"}}>{(p.downloads||0).toLocaleString()} downloads</div>
      </div>
    </div>
  );
}

/* ── Image Gallery component ── */
function Gallery({ images,name }) {
  const [idx,setIdx]=useState(0);
  const all=images?.filter(Boolean)||[];
  if(!all.length) return null;
  return (
    <div>
      <div style={{borderRadius:16,overflow:"hidden",border:"1px solid var(--border)",background:"#0d0d20",height:260,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 50% 50%,rgba(124,92,252,.1) 0%,transparent 70%)"}}/>
        {isUrl(all[idx])
          ? <img src={all[idx]} alt={`${name} ${idx+1}`} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          : <span style={{fontSize:100,filter:"drop-shadow(0 0 30px rgba(124,92,252,.5))"}}>{all[idx]}</span>}
        {all.length>1&&<>
          <button className="btn" onClick={()=>setIdx(i=>(i-1+all.length)%all.length)}
            style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",background:"rgba(7,7,15,.8)",color:"var(--text)",width:32,height:32,borderRadius:8,fontSize:16,border:"1px solid var(--border)"}}>‹</button>
          <button className="btn" onClick={()=>setIdx(i=>(i+1)%all.length)}
            style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"rgba(7,7,15,.8)",color:"var(--text)",width:32,height:32,borderRadius:8,fontSize:16,border:"1px solid var(--border)"}}>›</button>
          <div style={{position:"absolute",bottom:10,left:"50%",transform:"translateX(-50%)",background:"rgba(7,7,15,.7)",borderRadius:12,padding:"3px 10px",fontSize:11,color:"var(--text2)"}}>{idx+1}/{all.length}</div>
        </>}
      </div>
      {all.length>1&&(
        <div style={{display:"flex",gap:8,marginTop:10,overflowX:"auto",paddingBottom:4}}>
          {all.map((img,i)=>(
            <div key={i} onClick={()=>setIdx(i)}
              style={{width:56,height:56,borderRadius:8,overflow:"hidden",border:`2px solid ${i===idx?"var(--purple)":"var(--border)"}`,flexShrink:0,cursor:"pointer",background:"#0d0d20",display:"flex",alignItems:"center",justifyContent:"center",transition:"border-color .2s"}}>
              {isUrl(img)
                ? <img src={img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                : <span style={{fontSize:24}}>{img}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Home ── */
function Home({ setPage,products,cart,setCart,toast,wishlist,toggleWishlist,user }) {
  const feat=products.filter(p=>p.featured).slice(0,4);
  const top=[...products].sort((a,b)=>(b.downloads||0)-(a.downloads||0)).slice(0,4);
  const bundles=products.filter(p=>p.isBundle).slice(0,3);
  return (
    <div className="anim">
      <div style={{position:"relative",overflow:"hidden",padding:"110px 20px 90px",textAlign:"center"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 90% 60% at 50% -10%,rgba(124,92,252,.22) 0%,transparent 65%)"}}/>
        <div style={{position:"absolute",top:"15%",left:"8%",width:500,height:500,background:"rgba(124,92,252,.05)",borderRadius:"50%",filter:"blur(90px)"}}/>
        <div style={{position:"absolute",top:"5%",right:"3%",width:360,height:360,background:"rgba(0,229,160,.04)",borderRadius:"50%",filter:"blur(70px)"}}/>
        <div style={{position:"relative",maxWidth:740,margin:"0 auto"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(124,92,252,.1)",border:"1px solid rgba(124,92,252,.25)",color:"var(--purple2)",padding:"7px 18px",borderRadius:20,fontSize:12,fontWeight:600,marginBottom:32,letterSpacing:1}}>
            <span style={{width:7,height:7,background:"var(--green)",borderRadius:"50%",animation:"pulse 2s infinite"}}/>PREMIUM DIGITAL PRODUCTS
          </div>
          <h1 style={{fontSize:"clamp(36px,7vw,74px)",fontWeight:800,color:"var(--text)",margin:"0 0 18px",lineHeight:1.04,letterSpacing:"-2.5px"}}>
            Your Digital<br/>
            <span style={{background:"linear-gradient(135deg,var(--purple) 0%,#c084fc 50%,var(--purple2) 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Product Vault</span>
          </h1>
          <p style={{color:"var(--text2)",fontSize:"clamp(15px,2vw,18px)",maxWidth:480,margin:"0 auto 38px",lineHeight:1.65}}>Instant downloads. Lifetime access. Secured by Razorpay.</p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <button className="btn" onClick={()=>setPage("products")} style={{background:"linear-gradient(135deg,var(--purple),#9d6fff)",color:"#fff",padding:"14px 34px",borderRadius:14,fontSize:15,fontWeight:700,boxShadow:"0 8px 32px rgba(124,92,252,.45)",letterSpacing:.3}}>Browse Products →</button>
            <a href={DISCORD} target="_blank" rel="noopener noreferrer" style={{background:"rgba(88,101,242,.12)",border:"1px solid rgba(88,101,242,.35)",color:"#7289da",padding:"14px 34px",borderRadius:14,fontSize:15,fontWeight:700,textDecoration:"none",display:"inline-flex",alignItems:"center",gap:8}}>Join Discord</a>
          </div>
          <div style={{display:"flex",gap:0,justifyContent:"center",marginTop:60,flexWrap:"wrap",borderTop:"1px solid var(--border)",paddingTop:40}}>
            {[["12+","Products"],["50k+","Downloads"],["4.8★","Avg Rating"],["24/7","Support"]].map(([n,l],i)=>(
              <div key={l} style={{textAlign:"center",padding:"0 32px",borderRight:i<3?"1px solid var(--border)":"none"}}>
                <div style={{fontSize:28,fontWeight:800,color:"var(--text)",fontFamily:"'Syne',sans-serif",letterSpacing:"-1px"}}>{n}</div>
                <div style={{fontSize:12,color:"var(--text3)",marginTop:4,fontWeight:500}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{padding:"0 20px 60px",maxWidth:1160,margin:"0 auto"}}>
        {feat.length>0&&(
          <section style={{marginBottom:56}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
              <div><h2 style={{fontSize:22,fontWeight:800,color:"var(--text)",letterSpacing:"-0.5px"}}>Featured Products</h2><p style={{color:"var(--text3)",fontSize:13,marginTop:4}}>Handpicked for you</p></div>
              <button className="btn" onClick={()=>setPage("products")} style={{background:"transparent",border:"1px solid var(--border2)",color:"var(--text2)",padding:"8px 18px",borderRadius:10,fontSize:13}}>View all →</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
              {feat.map(p=><Card key={p._id||p.id} p={p} setPage={setPage} cart={cart} setCart={setCart} toast={toast} wishlist={wishlist} toggleWishlist={toggleWishlist} user={user}/>)}
            </div>
          </section>
        )}
        {top.length>0&&(
          <section style={{marginBottom:56}}>
            <div style={{marginBottom:24}}><h2 style={{fontSize:22,fontWeight:800,color:"var(--text)",letterSpacing:"-0.5px"}}>🔥 Top Downloads</h2><p style={{color:"var(--text3)",fontSize:13,marginTop:4}}>Most popular this month</p></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
              {top.map(p=><Card key={p._id||p.id} p={p} setPage={setPage} cart={cart} setCart={setCart} toast={toast} wishlist={wishlist} toggleWishlist={toggleWishlist} user={user}/>)}
            </div>
          </section>
        )}
        {bundles.length>0&&(
          <section style={{marginBottom:56}}>
            <div style={{marginBottom:24}}><h2 style={{fontSize:22,fontWeight:800,color:"var(--text)",letterSpacing:"-0.5px"}}>📦 Bundle Deals</h2><p style={{color:"var(--text3)",fontSize:13,marginTop:4}}>Save more with our curated bundles</p></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
              {bundles.map(p=><Card key={p._id||p.id} p={p} setPage={setPage} cart={cart} setCart={setCart} toast={toast} wishlist={wishlist} toggleWishlist={toggleWishlist} user={user}/>)}
            </div>
          </section>
        )}
        <div style={{background:"linear-gradient(135deg,rgba(88,101,242,.12),rgba(124,92,252,.08))",border:"1px solid rgba(88,101,242,.25)",borderRadius:20,padding:"32px",display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
          <div style={{width:52,height:52,background:"rgba(88,101,242,.2)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>🎮</div>
          <div style={{flex:1,minWidth:200}}>
            <h3 style={{fontSize:18,fontWeight:800,color:"var(--text)",marginBottom:4,fontFamily:"'Syne',sans-serif"}}>Join the Aurora Community</h3>
            <p style={{color:"var(--text2)",margin:0,fontSize:14}}>Get support, exclusive deals, and connect with 5,000+ members.</p>
          </div>
          <a href={DISCORD} target="_blank" rel="noopener noreferrer" style={{background:"#5865f2",color:"#fff",padding:"12px 24px",borderRadius:12,fontSize:14,fontWeight:700,textDecoration:"none",flexShrink:0}}>Join Discord →</a>
        </div>
        <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap",marginTop:48,paddingTop:24,borderTop:"1px solid var(--border)"}}>
          {[["faq","FAQ"],["policy","Privacy"],["terms","Terms"],["contact","Contact"]].map(([p,l])=>(
            <button key={p} className="btn" onClick={()=>setPage(p)} style={{background:"transparent",color:"var(--text3)",fontSize:13,padding:"4px 8px"}}>{l}</button>
          ))}
        </div>
        <p style={{textAlign:"center",color:"var(--text3)",fontSize:12,marginTop:16}}>© 2025 Aurora Store · {STORE_EMAIL}</p>
      </div>
    </div>
  );
}

/* ── Products Page ── */
function Products({ products,setPage,cart,setCart,toast,wishlist,toggleWishlist,user,categories }) {
  const [cat,setCat]=useState("All");
  const [sort,setSort]=useState("popular");
  const [q,setQ]=useState("");
  const [max,setMax]=useState(5000);
  const [showBundles,setShowBundles]=useState(false);

  let list=products.filter(p=>{
    if(showBundles&&!p.isBundle)return false;
    if(cat!=="All"&&p.category!==cat)return false;
    if(q&&!p.name.toLowerCase().includes(q.toLowerCase())&&!(p.tags||[]).some(t=>t.toLowerCase().includes(q.toLowerCase())))return false;
    if(p.price>max)return false;
    return true;
  });
  if(sort==="popular")list=[...list].sort((a,b)=>(b.downloads||0)-(a.downloads||0));
  if(sort==="asc")list=[...list].sort((a,b)=>a.price-b.price);
  if(sort==="desc")list=[...list].sort((a,b)=>b.price-a.price);
  if(sort==="rating")list=[...list].sort((a,b)=>(b.rating||0)-(a.rating||0));
  if(sort==="new")list=[...list].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  const inpStyle={background:"var(--card)",border:"1px solid var(--border2)",color:"var(--text)",padding:"10px 14px",borderRadius:10,fontSize:14,fontFamily:"'DM Sans',sans-serif"};
  return (
    <div className="anim" style={{maxWidth:1200,margin:"0 auto",padding:"32px 20px"}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:30,fontWeight:800,color:"var(--text)",letterSpacing:"-1px",marginBottom:4}}>All Products</h1>
        <p style={{color:"var(--text3)",fontSize:14}}>{products.length} products available</p>
      </div>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:18,padding:"16px 18px",marginBottom:20}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Search products..." style={{...inpStyle,flex:1,minWidth:160,background:"var(--bg2)"}}/>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{...inpStyle,background:"var(--bg2)"}}>
            <option value="popular">Most Popular</option><option value="new">Newest</option>
            <option value="rating">Top Rated</option><option value="asc">Price: Low → High</option><option value="desc">Price: High → Low</option>
          </select>
          <div style={{...inpStyle,background:"var(--bg2)",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <span style={{color:"var(--text2)",fontSize:13,whiteSpace:"nowrap"}}>Max ₹{max}</span>
            <input type="range" min={50} max={5000} step={50} value={max} onChange={e=>setMax(+e.target.value)} style={{width:80,accentColor:"var(--purple)"}}/>
          </div>
          <button className="btn" onClick={()=>setShowBundles(!showBundles)}
            style={{background:showBundles?"var(--green)":"var(--bg2)",color:showBundles?"#000":"var(--text2)",padding:"10px 16px",borderRadius:10,fontSize:13,border:`1px solid ${showBundles?"var(--green)":"var(--border2)"}`}}>
            📦 Bundles only
          </button>
        </div>
        <div style={{display:"flex",gap:7,marginTop:14,flexWrap:"wrap"}}>
          {categories.map(c=>(
            <button key={c} className="btn" onClick={()=>setCat(c)} style={{background:cat===c?"var(--purple)":"var(--bg2)",color:cat===c?"#fff":"var(--text2)",padding:"6px 16px",borderRadius:20,fontSize:12,fontWeight:cat===c?700:500,border:cat===c?"none":"1px solid var(--border2)",boxShadow:cat===c?"0 4px 16px rgba(124,92,252,.35)":"none",transition:"all .2s"}}>{c}</button>
          ))}
        </div>
      </div>
      <div style={{color:"var(--text3)",fontSize:13,marginBottom:16,fontWeight:500}}>{list.length} result{list.length!==1?"s":""}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
        {list.map(p=><Card key={p._id||p.id} p={p} setPage={setPage} cart={cart} setCart={setCart} toast={toast} wishlist={wishlist} toggleWishlist={toggleWishlist} user={user}/>)}
      </div>
      {list.length===0&&(
        <div style={{textAlign:"center",padding:"80px 0",color:"var(--text3)"}}>
          <div style={{fontSize:56,marginBottom:16,opacity:.3}}>🔍</div><p style={{fontSize:16}}>No products found</p>
        </div>
      )}
    </div>
  );
}

/* ── Product Detail ── */
function Detail({ productId,products,setPage,cart,setCart,toast,user,wishlist,toggleWishlist }) {
  const p=products.find(x=>(x._id||x.id)===productId);
  const [revs,setRevs]=useState([]);const [rat,setRat]=useState(0);const [rtxt,setRtxt]=useState("");const [sub,setSub]=useState(false);
  useEffect(()=>{if(p?._id)api("/reviews/"+p._id).then(d=>Array.isArray(d)&&setRevs(d));},[p?._id]);
  if(!p)return<div style={{padding:80,textAlign:"center",color:"var(--text3)"}}>Product not found.</div>;
  const inCart=cart.find(i=>(i._id||i.id)===(p._id||p.id));
  const inWish=wishlist.includes(p._id||p.id);
  const disc=p.originalPrice>p.price?Math.round((1-p.price/p.originalPrice)*100):0;
  const related=products.filter(x=>x.category===p.category&&(x._id||x.id)!==(p._id||p.id)).slice(0,3);
  // Build gallery: [image, ...images] deduped
  const galleryImages=[p.image,...(p.images||[])].filter((v,i,a)=>v&&a.indexOf(v)===i);

  async function submitRev(){
    if(!user){setPage("auth");return;}if(!rat||!rtxt.trim())return;setSub(true);
    try{await api("/reviews",{method:"POST",body:{productId:p._id,rating:rat,text:rtxt}});const u=await api("/reviews/"+p._id);if(Array.isArray(u))setRevs(u);toast("Review submitted!");setRat(0);setRtxt("");}catch{toast("Failed","error");}setSub(false);
  }

  return (
    <div className="anim" style={{maxWidth:1040,margin:"0 auto",padding:"32px 20px"}}>
      <button className="btn" onClick={()=>setPage("products")} style={{background:"transparent",color:"var(--purple2)",fontSize:14,marginBottom:24,display:"flex",alignItems:"center",gap:6}}>← Back to Products</button>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:40}} className="mc">
        <div>
          {/* Gallery */}
          <Gallery images={galleryImages} name={p.name}/>
          {p.tags?.length>0&&(
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:16}}>
              {p.tags.map(t=><Tag key={t}>{t}</Tag>)}
            </div>
          )}
        </div>
        <div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:11,color:"var(--purple2)",fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{p.category}{p.isBundle&&<span style={{marginLeft:8,color:"var(--green)"}}>· BUNDLE</span>}</div>
            <button className="btn" onClick={()=>{if(!user){setPage("auth");return;}toggleWishlist(p._id||p.id);}}
              style={{background:"transparent",color:inWish?"var(--red)":"var(--text3)",fontSize:20,border:"none"}}>
              {inWish?"♥":"♡"}
            </button>
          </div>
          <h1 style={{fontSize:"clamp(22px,3vw,30px)",fontWeight:800,color:"var(--text)",marginBottom:12,letterSpacing:"-0.5px"}}>{p.name}</h1>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            <Stars rating={p.rating||0} size={16}/>
            <span style={{color:"var(--text2)",fontSize:14}}>{p.rating||0} · {revs.length} reviews</span>
            <span style={{color:"var(--text3)"}}>·</span>
            <span style={{color:"var(--text3)",fontSize:13}}>{(p.downloads||0).toLocaleString()} downloads</span>
          </div>
          <p style={{color:"var(--text2)",fontSize:15,lineHeight:1.7,marginBottom:20}}>{p.description}</p>
          {/* Bundle contents */}
          {p.isBundle&&p.bundleItems?.length>0&&(
            <div style={{background:"rgba(0,229,160,.05)",border:"1px solid rgba(0,229,160,.2)",borderRadius:12,padding:14,marginBottom:20}}>
              <div style={{fontSize:12,color:"var(--green)",fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>What's included</div>
              {p.bundleItems.map((bi,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid rgba(0,229,160,.1)",color:"var(--text2)",fontSize:13}}>
                  <span style={{color:"var(--green)"}}>✓</span>
                  <span style={{fontSize:18}}>{bi.image||"📦"}</span>
                  <span>{bi.name}</span>
                  <span style={{marginLeft:"auto",color:"var(--text3)"}}>₹{bi.price}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:20}}>
            <span style={{fontSize:36,fontWeight:800,color:"var(--text)",fontFamily:"'Syne',sans-serif",letterSpacing:"-1px"}}>₹{p.price}</span>
            {p.originalPrice>p.price&&<><span style={{fontSize:16,color:"var(--text3)",textDecoration:"line-through"}}>₹{p.originalPrice}</span><Badge color="red">SAVE {disc}%</Badge></>}
          </div>
          <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
            <button className="btn mf" onClick={()=>{if(!inCart)setCart(c=>[...c,{...p,qty:1}]);toast(inCart?"Already in cart!":"Added! 🎉");}}
              style={{flex:1,background:inCart?"var(--purple-dim)":"var(--purple)",color:inCart?"var(--purple2)":"#fff",padding:"14px",borderRadius:12,fontSize:14,fontWeight:700,border:inCart?"1px solid rgba(124,92,252,.3)":"none",boxShadow:inCart?"none":"0 8px 24px rgba(124,92,252,.35)"}}>
              {inCart?"✓ In Cart":"Add to Cart"}
            </button>
            <button className="btn mf" onClick={()=>{if(!inCart)setCart(c=>[...c,{...p,qty:1}]);setPage("cart");}}
              style={{flex:1,background:"transparent",border:"2px solid var(--purple)",color:"var(--purple2)",padding:"14px",borderRadius:12,fontSize:14,fontWeight:700}}>
              Buy Now
            </button>
          </div>
          <div style={{background:"var(--bg2)",borderRadius:14,padding:16,border:"1px solid var(--border)"}}>
            {[["⚡","Instant download after payment"],["♾️","Lifetime access included"],["🔄","Free future updates"],["📧","Download link sent to email"]].map(([ic,tx])=>(
              <div key={tx} style={{display:"flex",alignItems:"center",gap:12,padding:"7px 0",color:"var(--text2)",fontSize:13,borderBottom:"1px solid var(--border)"}}>
                <span style={{fontSize:16,flexShrink:0}}>{ic}</span>{tx}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div style={{marginTop:48}}>
        <h2 style={{fontSize:20,fontWeight:800,color:"var(--text)",marginBottom:20,letterSpacing:"-0.5px"}}>Reviews ({revs.length})</h2>
        <div style={{background:"var(--card)",borderRadius:16,padding:20,marginBottom:20,border:"1px solid var(--border)"}}>
          <h3 style={{color:"var(--text)",fontSize:15,marginBottom:14,fontFamily:"'Syne',sans-serif"}}>Write a Review</h3>
          <Stars rating={rat} size={30} interactive onRate={setRat}/>
          <textarea value={rtxt} onChange={e=>setRtxt(e.target.value)} placeholder="Share your experience..." rows={3}
            style={{width:"100%",background:"var(--bg2)",border:"1px solid var(--border2)",color:"var(--text)",borderRadius:10,padding:12,fontSize:14,marginTop:12,resize:"vertical",fontFamily:"'DM Sans',sans-serif"}}/>
          <button className="btn" onClick={submitRev} disabled={sub}
            style={{background:"var(--purple)",color:"#fff",padding:"10px 22px",borderRadius:10,fontSize:14,marginTop:12,display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 16px rgba(124,92,252,.3)"}}>
            {sub?<Sp/>:"Submit Review"}
          </button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {revs.map(r=>(
            <div key={r._id} style={{background:"var(--card)",borderRadius:12,padding:16,border:"1px solid var(--border)"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,var(--purple-dim),var(--purple))",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:700,flexShrink:0}}>{r.userName?.[0]?.toUpperCase()}</div>
                <div>
                  <div style={{color:"var(--text)",fontSize:14,fontWeight:600}}>{r.userName}</div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}><Stars rating={r.rating} size={12}/><span style={{fontSize:11,color:"var(--text3)"}}>{new Date(r.createdAt).toLocaleDateString()}</span></div>
                </div>
              </div>
              <p style={{color:"var(--text2)",fontSize:14,margin:0,lineHeight:1.6}}>{r.text}</p>
            </div>
          ))}
          {revs.length===0&&<div style={{color:"var(--text3)",textAlign:"center",padding:24,background:"var(--card)",borderRadius:12,border:"1px solid var(--border)"}}>No reviews yet — be the first!</div>}
        </div>
      </div>

      {related.length>0&&(
        <div style={{marginTop:48}}>
          <h2 style={{fontSize:20,fontWeight:800,color:"var(--text)",marginBottom:20,letterSpacing:"-0.5px"}}>Related Products</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
            {related.map(x=><Card key={x._id||x.id} p={x} setPage={setPage} cart={cart} setCart={setCart} toast={toast} wishlist={wishlist} toggleWishlist={toggleWishlist} user={user}/>)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Wishlist Page ── */
function WishlistPage({ wishlistIds,products,setPage,cart,setCart,toast,toggleWishlist,user }) {
  const items=products.filter(p=>wishlistIds.includes(p._id||p.id));
  if(!user)return(
    <div style={{maxWidth:400,margin:"100px auto",textAlign:"center",padding:"0 20px"}}>
      <div style={{fontSize:64,marginBottom:20,opacity:.3}}>♥</div>
      <h2 style={{color:"var(--text)",marginBottom:16,fontFamily:"'Syne',sans-serif"}}>Sign in to view wishlist</h2>
      <button className="btn" onClick={()=>setPage("auth")} style={{background:"var(--purple)",color:"#fff",padding:"13px 32px",borderRadius:12,fontSize:15,boxShadow:"0 8px 24px rgba(124,92,252,.3)"}}>Sign In</button>
    </div>
  );
  return(
    <div className="anim" style={{maxWidth:1000,margin:"0 auto",padding:"32px 20px"}}>
      <h1 style={{fontSize:28,fontWeight:800,color:"var(--text)",marginBottom:24,letterSpacing:"-1px",fontFamily:"'Syne',sans-serif"}}>My Wishlist <span style={{color:"var(--text3)",fontWeight:400,fontSize:20}}>({items.length})</span></h1>
      {items.length===0?(
        <div style={{textAlign:"center",padding:"80px 0"}}>
          <div style={{fontSize:64,marginBottom:20,opacity:.3}}>♡</div>
          <p style={{color:"var(--text3)",fontSize:16,marginBottom:24}}>No saved products yet</p>
          <button className="btn" onClick={()=>setPage("products")} style={{background:"var(--purple)",color:"#fff",padding:"13px 32px",borderRadius:12,fontSize:15,boxShadow:"0 8px 24px rgba(124,92,252,.3)"}}>Browse Products</button>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
          {items.map(p=><Card key={p._id||p.id} p={p} setPage={setPage} cart={cart} setCart={setCart} toast={toast} wishlist={wishlistIds} toggleWishlist={toggleWishlist} user={user}/>)}
        </div>
      )}
    </div>
  );
}

/* ── Cart ── */
function CartPage({ cart,setCart,setPage,toast,user }) {
  const [code,setCode]=useState("");const [coup,setCoup]=useState(null);const [chk,setChk]=useState(false);
  const sub=cart.reduce((a,b)=>a+b.price*b.qty,0);
  const disc=coup?(coup.type==="percent"?sub*coup.discount/100:coup.discount):0;
  const total=Math.max(0,sub-disc);
  async function apply(){setChk(true);const r=await api("/coupons/validate",{method:"POST",body:{code,total:sub}});setChk(false);if(r.error){toast(r.error,"error");return;}setCoup(r);toast("Coupon applied! 🎉");}
  if(!cart.length)return(
    <div style={{maxWidth:480,margin:"100px auto",textAlign:"center",padding:"0 20px"}}>
      <div style={{fontSize:80,marginBottom:20,opacity:.4}}>🛒</div>
      <h2 style={{color:"var(--text)",fontSize:24,marginBottom:8,fontFamily:"'Syne',sans-serif"}}>Your cart is empty</h2>
      <p style={{color:"var(--text3)",marginBottom:28}}>Explore our digital products!</p>
      <button className="btn" onClick={()=>setPage("products")} style={{background:"var(--purple)",color:"#fff",padding:"13px 32px",borderRadius:12,fontSize:15,boxShadow:"0 8px 24px rgba(124,92,252,.3)"}}>Browse Products</button>
    </div>
  );
  const btnSt={background:"var(--bg2)",border:"1px solid var(--border2)",color:"var(--text)",padding:"0",width:30,height:30,borderRadius:8,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"};
  return(
    <div className="anim" style={{maxWidth:940,margin:"0 auto",padding:"32px 20px"}}>
      <h1 style={{fontSize:28,fontWeight:800,color:"var(--text)",marginBottom:24,letterSpacing:"-1px"}}>Cart <span style={{color:"var(--text3)",fontWeight:400,fontSize:20}}>({cart.reduce((a,b)=>a+b.qty,0)} items)</span></h1>
      <div style={{display:"grid",gridTemplateColumns:"1fr 320px",gap:20}} className="mc">
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {cart.map(item=>(
            <div key={item._id||item.id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:16,display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
              <div style={{width:56,height:56,background:"var(--bg2)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0,border:"1px solid var(--border)",overflow:"hidden"}}>
                {isUrl(item.image)?<img src={item.image} style={{width:56,height:56,objectFit:"cover",borderRadius:12}} alt=""/>:item.image||"📦"}
              </div>
              <div style={{flex:1,minWidth:120}}>
                <div style={{color:"var(--text)",fontWeight:700,fontSize:15,fontFamily:"'Syne',sans-serif"}}>{item.name}</div>
                <div style={{color:"var(--purple2)",fontSize:12,marginTop:2}}>{item.category}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <button className="btn" onClick={()=>item.qty<=1?setCart(c=>c.filter(i=>(i._id||i.id)!==(item._id||item.id))):setCart(c=>c.map(i=>(i._id||i.id)===(item._id||item.id)?{...i,qty:i.qty-1}:i))} style={btnSt}>−</button>
                <span style={{color:"var(--text)",minWidth:24,textAlign:"center",fontWeight:700,fontSize:16}}>{item.qty}</span>
                <button className="btn" onClick={()=>setCart(c=>c.map(i=>(i._id||i.id)===(item._id||item.id)?{...i,qty:i.qty+1}:i))} style={btnSt}>+</button>
              </div>
              <div style={{color:"var(--text)",fontWeight:800,fontSize:16,minWidth:70,textAlign:"right",fontFamily:"'Syne',sans-serif"}}>₹{(item.price*item.qty).toFixed(0)}</div>
              <button className="btn" onClick={()=>setCart(c=>c.filter(i=>(i._id||i.id)!==(item._id||item.id)))} style={{background:"transparent",color:"var(--text3)",fontSize:20,width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
            </div>
          ))}
        </div>
        <div>
          <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:20,position:"sticky",top:80}}>
            <h3 style={{color:"var(--text)",fontWeight:800,marginBottom:18,fontSize:16,fontFamily:"'Syne',sans-serif"}}>Order Summary</h3>
            <div style={{display:"flex",justifyContent:"space-between",color:"var(--text2)",fontSize:14,marginBottom:10}}><span>Subtotal</span><span>₹{sub.toFixed(0)}</span></div>
            {disc>0&&<div style={{display:"flex",justifyContent:"space-between",color:"var(--green)",fontSize:14,marginBottom:10}}><span>Discount</span><span>-₹{disc.toFixed(0)}</span></div>}
            <div style={{borderTop:"1px solid var(--border)",paddingTop:14,display:"flex",justifyContent:"space-between",color:"var(--text)",fontWeight:800,fontSize:20,marginBottom:18,fontFamily:"'Syne',sans-serif"}}><span>Total</span><span>₹{total.toFixed(0)}</span></div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <input value={code} onChange={e=>setCode(e.target.value)} placeholder="Coupon code" style={{flex:1,background:"var(--bg2)",border:"1px solid var(--border2)",color:"var(--text)",padding:"10px 12px",borderRadius:8,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}/>
              <button className="btn" onClick={apply} disabled={chk} style={{background:"var(--bg2)",color:"var(--text)",padding:"10px 14px",borderRadius:8,fontSize:13,border:"1px solid var(--border2)"}}>{chk?<Sp size={14}/>:"Apply"}</button>
            </div>
            {coup&&<div style={{color:"var(--green)",fontSize:12,marginBottom:14,display:"flex",alignItems:"center",gap:6}}><span>✓</span> "{coup.code}" applied!</div>}
            <button className="btn mf" onClick={()=>{if(!user){setPage("auth");return;}setPage("checkout");}}
              style={{width:"100%",background:"linear-gradient(135deg,var(--purple),#9d6fff)",color:"#fff",padding:"14px",borderRadius:12,fontSize:15,fontWeight:700,marginBottom:10,boxShadow:"0 8px 24px rgba(124,92,252,.35)"}}>Checkout →</button>
            <button className="btn" onClick={()=>setPage("products")} style={{width:"100%",background:"transparent",border:"1px solid var(--border2)",color:"var(--text2)",padding:"11px",borderRadius:12,fontSize:14}}>Continue Shopping</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Checkout ── */
function Checkout({ cart,setCart,setPage,toast,user }) {
  const [form,setForm]=useState({name:user?.name||"",email:user?.email||""});
  const [step,setStep]=useState(1);const [paying,setPaying]=useState(false);const [ordId,setOrdId]=useState(null);
  const total=cart.reduce((a,b)=>a+b.price*b.qty,0);
  async function pay(){
    setPaying(true);
    try{
      const ord=await api("/payment/create-order",{method:"POST",body:{amount:total,currency:"INR"}});
      if(ord.error){toast(ord.error,"error");setPaying(false);return;}
      if(!window.Razorpay){await new Promise(res=>{const s=document.createElement("script");s.src="https://checkout.razorpay.com/v1/checkout.js";s.onload=res;document.head.appendChild(s);});}
      const key=await api("/razorpay-key");
      new window.Razorpay({
        key:key.key,amount:ord.amount,currency:ord.currency,name:"Aurora Store",
        description:`${cart.length} item(s)`,order_id:ord.id,
        prefill:{name:form.name,email:form.email},theme:{color:"#7c5cfc"},
        handler:async r=>{
          const v=await api("/payment/verify",{method:"POST",body:{razorpayOrderId:r.razorpay_order_id,razorpayPaymentId:r.razorpay_payment_id,razorpaySignature:r.razorpay_signature,items:cart,total}});
          if(v.success){setOrdId(v.orderId);setCart([]);setStep(3);}else toast("Verification failed. Contact support.","error");
        },
        modal:{ondismiss:()=>{setPaying(false);toast("Payment cancelled","error");}}
      }).open();
    }catch(e){toast("Payment error: "+e.message,"error");setPaying(false);}
  }
  if(step===3)return(
    <div className="anim" style={{maxWidth:500,margin:"100px auto",textAlign:"center",padding:"0 20px"}}>
      <div style={{width:80,height:80,borderRadius:"50%",background:"rgba(0,229,160,.15)",border:"2px solid var(--green)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 24px",animation:"glow 2s infinite"}}>🎉</div>
      <h2 style={{color:"var(--text)",fontSize:28,marginBottom:10,fontFamily:"'Syne',sans-serif",fontWeight:800}}>Order Confirmed!</h2>
      <p style={{color:"var(--text2)",marginBottom:8}}>Download links sent to <strong style={{color:"var(--purple2)"}}>{form.email}</strong></p>
      <p style={{color:"var(--text3)",fontSize:13,marginBottom:32,fontFamily:"monospace"}}>#{ordId}</p>
      <button className="btn" onClick={()=>setPage("orders")} style={{background:"var(--purple)",color:"#fff",padding:"13px 32px",borderRadius:12,fontSize:15,boxShadow:"0 8px 24px rgba(124,92,252,.3)"}}>View My Orders</button>
    </div>
  );
  const inpSt={width:"100%",background:"var(--bg2)",border:"1px solid var(--border2)",color:"var(--text)",padding:"12px 14px",borderRadius:10,fontSize:14,marginBottom:14,fontFamily:"'DM Sans',sans-serif"};
  return(
    <div className="anim" style={{maxWidth:580,margin:"0 auto",padding:"40px 20px"}}>
      <h1 style={{fontSize:28,fontWeight:800,color:"var(--text)",marginBottom:8,letterSpacing:"-1px",fontFamily:"'Syne',sans-serif"}}>Checkout</h1>
      <div style={{display:"flex",gap:6,marginBottom:32}}>
        {[1,2].map(s=>(<div key={s} style={{height:3,flex:1,borderRadius:3,background:step>=s?"var(--purple)":"var(--border2)",transition:"background .3s",boxShadow:step>=s?"0 0 8px rgba(124,92,252,.5)":"none"}}/>))}
      </div>
      {step===1&&(
        <div>
          <h2 style={{color:"var(--text)",fontSize:18,marginBottom:20,fontFamily:"'Syne',sans-serif"}}>Your Information</h2>
          <label style={{display:"block",color:"var(--text2)",fontSize:12,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Full Name</label>
          <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name" style={inpSt}/>
          <label style={{display:"block",color:"var(--text2)",fontSize:12,fontWeight:600,letterSpacing:.5,textTransform:"uppercase",marginBottom:6}}>Email</label>
          <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@email.com" style={inpSt}/>
          <div style={{background:"var(--card)",borderRadius:12,padding:16,marginBottom:20,border:"1px solid var(--border)"}}>
            {cart.map(i=>(<div key={i._id||i.id} style={{display:"flex",justifyContent:"space-between",color:"var(--text2)",fontSize:14,padding:"5px 0"}}><span>{i.image} {i.name} ×{i.qty}</span><span style={{color:"var(--text)"}}>₹{(i.price*i.qty).toFixed(0)}</span></div>))}
            <div style={{borderTop:"1px solid var(--border)",paddingTop:12,marginTop:10,display:"flex",justifyContent:"space-between",color:"var(--text)",fontWeight:800,fontFamily:"'Syne',sans-serif"}}><span>Total</span><span>₹{total.toFixed(0)}</span></div>
          </div>
          <button className="btn" onClick={()=>form.name&&form.email&&setStep(2)} style={{width:"100%",background:"linear-gradient(135deg,var(--purple),#9d6fff)",color:"#fff",padding:"14px",borderRadius:12,fontSize:15,fontWeight:700,boxShadow:"0 8px 24px rgba(124,92,252,.3)"}}>Continue →</button>
        </div>
      )}
      {step===2&&(
        <div>
          <h2 style={{color:"var(--text)",fontSize:18,marginBottom:20,fontFamily:"'Syne',sans-serif"}}>Payment</h2>
          <div style={{background:"rgba(124,92,252,.08)",border:"1px solid rgba(124,92,252,.2)",borderRadius:12,padding:14,marginBottom:20,display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:20}}>🔒</span><span style={{color:"var(--purple2)",fontSize:13}}>Secured by Razorpay · UPI · Cards · Netbanking · Wallets</span>
          </div>
          <div style={{background:"var(--card)",borderRadius:14,padding:24,marginBottom:20,textAlign:"center",border:"1px solid var(--border)"}}>
            <div style={{fontSize:44,marginBottom:12}}>💳</div>
            <div style={{color:"var(--text)",fontWeight:800,fontSize:22,fontFamily:"'Syne',sans-serif"}}>₹{total.toFixed(0)}</div>
            <div style={{color:"var(--text3)",fontSize:13,marginTop:6}}>Click below to open Razorpay</div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn" onClick={()=>setStep(1)} style={{flex:1,background:"transparent",border:"1px solid var(--border2)",color:"var(--text2)",padding:"14px",borderRadius:12,fontSize:14}}>← Back</button>
            <button className="btn" onClick={pay} disabled={paying}
              style={{flex:2,background:"linear-gradient(135deg,var(--purple),#9d6fff)",color:"#fff",padding:"14px",borderRadius:12,fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 8px 24px rgba(124,92,252,.3)"}}>
              {paying?<><Sp/>Processing...</>:`Pay ₹${total.toFixed(0)} →`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Orders ── */
function Orders({ setPage,user }) {
  const [ords,setOrds]=useState([]);const [loading,setLoading]=useState(true);
  useEffect(()=>{if(!user)return;api("/orders/my").then(d=>Array.isArray(d)&&setOrds(d)).finally(()=>setLoading(false));},[user]);
  if(!user)return(
    <div style={{maxWidth:400,margin:"100px auto",textAlign:"center",padding:"0 20px"}}>
      <div style={{fontSize:64,marginBottom:20,opacity:.3}}>🔐</div>
      <h2 style={{color:"var(--text)",marginBottom:16,fontFamily:"'Syne',sans-serif"}}>Sign in to view orders</h2>
      <button className="btn" onClick={()=>setPage("auth")} style={{background:"var(--purple)",color:"#fff",padding:"13px 32px",borderRadius:12,fontSize:15,boxShadow:"0 8px 24px rgba(124,92,252,.3)"}}>Sign In</button>
    </div>
  );
  return(
    <div className="anim" style={{maxWidth:820,margin:"0 auto",padding:"32px 20px"}}>
      <h1 style={{fontSize:28,fontWeight:800,color:"var(--text)",marginBottom:24,letterSpacing:"-1px",fontFamily:"'Syne',sans-serif"}}>My Orders</h1>
      {loading?<div style={{textAlign:"center",padding:80}}><Sp size={32} color="var(--purple)"/></div>:ords.length===0?(
        <div style={{textAlign:"center",padding:"80px 0"}}>
          <div style={{fontSize:64,marginBottom:20,opacity:.3}}>📦</div>
          <p style={{color:"var(--text3)",fontSize:16}}>No orders yet</p>
          <button className="btn" onClick={()=>setPage("products")} style={{background:"var(--purple)",color:"#fff",padding:"13px 32px",borderRadius:12,fontSize:15,marginTop:20,boxShadow:"0 8px 24px rgba(124,92,252,.3)"}}>Browse Products</button>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {ords.map(o=>(
            <div key={o._id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,flexWrap:"wrap",gap:10}}>
                <div>
                  <div style={{color:"var(--text)",fontWeight:700,fontSize:15,fontFamily:"monospace"}}>{o.orderId}</div>
                  <div style={{color:"var(--text3)",fontSize:12,marginTop:3}}>{new Date(o.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <Badge color="green">{o.status}</Badge>
                  <span style={{color:"var(--text)",fontWeight:800,fontSize:16,fontFamily:"'Syne',sans-serif"}}>₹{o.total?.toFixed(0)}</span>
                </div>
              </div>
              <div style={{borderTop:"1px solid var(--border)",paddingTop:12,display:"flex",flexDirection:"column",gap:8}}>
                {o.items?.map((it,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
                    <span style={{fontSize:22}}>{it.image||"📦"}</span>
                    <span style={{color:"var(--text2)",fontSize:14,flex:1}}>{it.name}</span>
                    <span style={{color:"var(--text3)",fontSize:13}}>×{it.qty}</span>
                    {it.downloadLink&&<a href={it.downloadLink} target="_blank" rel="noopener noreferrer" style={{background:"var(--purple-dim)",color:"var(--purple2)",padding:"5px 14px",borderRadius:8,fontSize:12,textDecoration:"none",fontWeight:600,border:"1px solid rgba(124,92,252,.3)"}}>⬇ Download</a>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Auth ── */
function Auth({ setUser,setPage,toast,resetTok }) {
  const [tab,setTab]=useState("login");
  const [form,setForm]=useState({name:"",email:"",password:""});
  const [fe,setFe]=useState("");const [np2,setNp2]=useState("");
  const [loading,setLoading]=useState(false);const [sent,setSent]=useState(false);
  const [providers,setProviders]=useState({google:false,github:false});
  useEffect(()=>{api("/auth/providers").then(d=>d&&setProviders(d));},[]);

  async function submit(){
    setLoading(true);
    const r=await api("/auth/"+(tab==="login"?"login":"register"),{method:"POST",body:tab==="login"?{email:form.email,password:form.password}:form});
    setLoading(false);
    if(r.error)toast(r.error,"error");else{localStorage.setItem("aurora_token",r.token);setUser(r.user);toast("Welcome, "+r.user.name+"! 👋");setPage("home");}
  }
  async function forgot(){setLoading(true);await api("/auth/forgot-password",{method:"POST",body:{email:fe}});setLoading(false);setSent(true);toast("Reset link sent!");}
  async function reset(){
    setLoading(true);const r=await api("/auth/reset-password",{method:"POST",body:{token:resetTok,password:np2}});setLoading(false);
    if(r.error)toast(r.error,"error");else{toast("Password reset! Sign in.");setTab("login");window.history.replaceState({},"",window.location.pathname);}
  }

  const inpSt={width:"100%",background:"var(--bg2)",border:"1px solid var(--border2)",color:"var(--text)",padding:"12px 14px",borderRadius:10,fontSize:14,marginBottom:14,fontFamily:"'DM Sans',sans-serif"};
  const oauthBtnBase={width:"100%",padding:"12px",borderRadius:10,fontSize:14,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:10,cursor:"pointer",border:"1px solid var(--border2)",marginBottom:10,transition:"all .2s",fontFamily:"'DM Sans',sans-serif"};

  if(resetTok)return(
    <div className="anim" style={{maxWidth:420,margin:"80px auto",padding:"0 20px"}}>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:32}}>
        <h2 style={{textAlign:"center",fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:"var(--text)",marginBottom:24}}>Reset Password</h2>
        <input type="password" value={np2} onChange={e=>setNp2(e.target.value)} placeholder="New password" style={inpSt}/>
        <button className="btn" onClick={reset} disabled={loading} style={{width:"100%",background:"var(--purple)",color:"#fff",padding:"13px",borderRadius:12,fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>{loading?<Sp/>:"Reset Password"}</button>
      </div>
    </div>
  );

  return(
    <div className="anim" style={{maxWidth:420,margin:"80px auto",padding:"0 20px"}}>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:32}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:48,height:48,background:"linear-gradient(135deg,var(--purple),#b06fff)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,margin:"0 auto 14px",boxShadow:"0 8px 24px rgba(124,92,252,.4)"}}>◈</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:"var(--text)",marginBottom:20}}>Aurora Store</h2>
          <div style={{display:"flex",background:"var(--bg2)",borderRadius:12,padding:4,border:"1px solid var(--border)"}}>
            {[["login","Sign In"],["register","Sign Up"],["forgot","Forgot?"]].map(([t,l])=>(
              <button key={t} className="btn" onClick={()=>setTab(t)} style={{flex:1,background:tab===t?"var(--purple)":"transparent",color:tab===t?"#fff":"var(--text2)",padding:"8px",borderRadius:8,fontSize:13,fontWeight:tab===t?700:400,boxShadow:tab===t?"0 4px 12px rgba(124,92,252,.3)":"none"}}>{l}</button>
            ))}
          </div>
        </div>

        {/* OAuth Buttons — shown on login and register tabs */}
        {tab!=="forgot"&&(providers.google||providers.github)&&(
          <div style={{marginBottom:16}}>
            {providers.google&&(
              <a href={API+"/auth/google"} style={{...oauthBtnBase,background:"var(--bg2)",color:"var(--text)",textDecoration:"none"}}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continue with Google
              </a>
            )}
            {providers.github&&(
              <a href={API+"/auth/github"} style={{...oauthBtnBase,background:"#24292e",color:"#fff",textDecoration:"none"}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
                Continue with GitHub
              </a>
            )}
            <div style={{display:"flex",alignItems:"center",gap:12,margin:"14px 0"}}>
              <div style={{flex:1,height:1,background:"var(--border)"}}/>
              <span style={{color:"var(--text3)",fontSize:12}}>or</span>
              <div style={{flex:1,height:1,background:"var(--border)"}}/>
            </div>
          </div>
        )}

        {tab==="forgot"?(
          sent
            ? <div style={{textAlign:"center",color:"var(--green)",fontSize:14}}>
                <div style={{fontSize:48,marginBottom:12}}>📧</div>
                <p>Check your email for the reset link.</p>
                <button className="btn" onClick={()=>setTab("login")} style={{display:"block",margin:"16px auto 0",background:"transparent",color:"var(--purple2)",fontSize:13}}>← Back to Sign In</button>
              </div>
            : <>
                <p style={{color:"var(--text2)",fontSize:14,marginBottom:16}}>Enter your email to receive a password reset link.</p>
                <input type="email" value={fe} onChange={e=>setFe(e.target.value)} placeholder="you@email.com" style={inpSt}/>
                <button className="btn" onClick={forgot} disabled={loading} style={{width:"100%",background:"var(--purple)",color:"#fff",padding:"13px",borderRadius:12,fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 8px 24px rgba(124,92,252,.3)"}}>{loading?<Sp/>:"Send Reset Link"}</button>
              </>
        ):(
          <>
            {tab==="register"&&<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Full name" style={inpSt}/>}
            <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="Email address" style={inpSt}/>
            <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Password" style={inpSt}/>
            <button className="btn" onClick={submit} disabled={loading} style={{width:"100%",background:"linear-gradient(135deg,var(--purple),#9d6fff)",color:"#fff",padding:"13px",borderRadius:12,fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 8px 24px rgba(124,92,252,.3)"}}>
              {loading?<Sp/>:tab==="login"?"Sign In →":"Create Account →"}
            </button>
            {/* Admin hint box REMOVED */}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Search ── */
function Search({ products,setPage,cart,setCart,toast,wishlist,toggleWishlist,user }) {
  const [q,setQ]=useState("");
  const res=q.length>1?products.filter(p=>p.name.toLowerCase().includes(q.toLowerCase())||(p.tags||[]).some(t=>t.toLowerCase().includes(q.toLowerCase()))):[];
  return(
    <div className="anim" style={{maxWidth:840,margin:"0 auto",padding:"32px 20px"}}>
      <h1 style={{fontSize:28,fontWeight:800,color:"var(--text)",marginBottom:20,letterSpacing:"-1px",fontFamily:"'Syne',sans-serif"}}>Search</h1>
      <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search products, tags..."
        style={{width:"100%",background:"var(--card)",border:"2px solid var(--purple)",color:"var(--text)",padding:"14px 20px",borderRadius:14,fontSize:16,marginBottom:20,fontFamily:"'DM Sans',sans-serif",boxShadow:"0 0 0 4px rgba(124,92,252,.1)"}}/>
      {q.length>1&&<div style={{color:"var(--text3)",fontSize:13,marginBottom:16}}>{res.length} results for "{q}"</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:16}}>
        {res.map(p=><Card key={p._id||p.id} p={p} setPage={setPage} cart={cart} setCart={setCart} toast={toast} wishlist={wishlist} toggleWishlist={toggleWishlist} user={user}/>)}
      </div>
    </div>
  );
}

/* ── Revenue mini-chart (SVG) ── */
function RevenueChart({ data }) {
  if(!data||data.length===0)return<div style={{color:"var(--text3)",textAlign:"center",padding:40}}>No revenue data yet.</div>;
  const values=data.map(d=>d.revenue);
  const max=Math.max(...values,1);
  const W=600,H=160,pad=8;
  const pts=values.map((v,i)=>({x:pad+(i/(values.length-1||1))*(W-2*pad),y:H-pad-(v/max)*(H-2*pad)}));
  const pathD=pts.map((p,i)=>i===0?`M${p.x},${p.y}`:`L${p.x},${p.y}`).join(" ");
  const fillD=pathD+` L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;
  const total=values.reduce((a,b)=>a+b,0);
  const nonZero=values.filter(v=>v>0).length;
  return(
    <div>
      <div style={{display:"flex",gap:20,marginBottom:16,flexWrap:"wrap"}}>
        {[["Total (30d)","₹"+total.toFixed(0),"var(--purple2)"],["Peak Day","₹"+Math.max(...values).toFixed(0),"var(--green)"],["Active Days",nonZero+" / "+values.length,"var(--gold)"]].map(([l,v,c])=>(
          <div key={l} style={{background:"var(--bg2)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 18px",flex:1,minWidth:110}}>
            <div style={{color:"var(--text3)",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>{l}</div>
            <div style={{color:c,fontWeight:800,fontSize:18,fontFamily:"'Syne',sans-serif"}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{background:"var(--bg2)",borderRadius:16,padding:"16px 8px 8px",border:"1px solid var(--border)",overflowX:"auto"}}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",minWidth:320,height:"auto",display:"block"}}>
          <defs>
            <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c5cfc" stopOpacity=".4"/>
              <stop offset="100%" stopColor="#7c5cfc" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d={fillD} fill="url(#rg)"/>
          <path d={pathD} fill="none" stroke="#7c5cfc" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
          {pts.map((p,i)=>values[i]>0&&(
            <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#7c5cfc" stroke="#07070f" strokeWidth="2"/>
          ))}
        </svg>
        <div style={{display:"flex",justifyContent:"space-between",paddingTop:4,fontSize:9,color:"var(--text3)",paddingLeft:8,paddingRight:8}}>
          <span>{data[0]?.date?.slice(5)}</span>
          <span>Last 30 days</span>
          <span>{data[data.length-1]?.date?.slice(5)}</span>
        </div>
      </div>
    </div>
  );
}

/* ── FAQ ── */
function FAQ({ setPage }) {
  const [open,setOpen]=useState(null);
  const qs=[
    ["How do I receive my purchase?","After Razorpay payment, download links are sent instantly to your email and shown in your Orders page."],
    ["What payment methods are accepted?","UPI, Credit/Debit Cards, Net Banking, and all wallets via Razorpay."],
    ["Are products delivered instantly?","Yes! All digital products are delivered instantly after payment."],
    ["Can I get a refund?","7-day refund if the product doesn't work as described. Email: "+STORE_EMAIL],
    ["How long is my access?","Lifetime — including all future updates."],
    ["What if I don't get the download link?","Check spam. Still missing? Join our Discord or email us."],
    ["Is my payment secure?","Yes. Razorpay is PCI DSS compliant. We never store card details."],
    ["Commercial use allowed?","Check individual product pages. Contact us if unsure."],
    ["How to contact support?","Discord (fastest) or email "+STORE_EMAIL+". Response within 24hrs."],
    ["Bulk discounts?","Yes! Contact us on Discord for 5+ items."],
  ];
  return(
    <div className="anim" style={{maxWidth:720,margin:"0 auto",padding:"40px 20px"}}>
      <button className="btn" onClick={()=>setPage("home")} style={{background:"transparent",color:"var(--purple2)",fontSize:14,marginBottom:20}}>← Back</button>
      <h1 style={{fontSize:30,fontWeight:800,color:"var(--text)",marginBottom:6,letterSpacing:"-1px",fontFamily:"'Syne',sans-serif"}}>FAQ</h1>
      <p style={{color:"var(--text3)",marginBottom:32,fontSize:15}}>Everything you need to know about Aurora Store.</p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {qs.map(([q,a],i)=>(
          <div key={i} style={{background:"var(--card)",border:"1px solid",borderColor:open===i?"rgba(124,92,252,.4)":"var(--border)",borderRadius:14,overflow:"hidden",transition:"border-color .2s"}}>
            <button className="btn" onClick={()=>setOpen(open===i?null:i)}
              style={{width:"100%",background:"transparent",color:"var(--text)",padding:"16px 20px",textAlign:"left",fontSize:15,fontWeight:600,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,fontFamily:"'Syne',sans-serif"}}>
              <span>{q}</span>
              <span style={{color:"var(--purple2)",fontSize:18,flexShrink:0,transition:"transform .2s",transform:open===i?"rotate(45deg)":"rotate(0)"}}>{open===i?"×":"+"}</span>
            </button>
            {open===i&&<div style={{padding:"0 20px 16px",color:"var(--text2)",fontSize:14,lineHeight:1.7,borderTop:"1px solid var(--border)"}}>{a}</div>}
          </div>
        ))}
      </div>
      <div style={{background:"rgba(124,92,252,.08)",border:"1px solid rgba(124,92,252,.2)",borderRadius:16,padding:24,marginTop:32,textAlign:"center"}}>
        <h3 style={{color:"var(--text)",marginBottom:16,fontFamily:"'Syne',sans-serif"}}>Still have questions?</h3>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <a href={DISCORD} target="_blank" rel="noopener noreferrer" style={{background:"#5865f2",color:"#fff",padding:"11px 22px",borderRadius:12,fontSize:14,fontWeight:600,textDecoration:"none"}}>Discord (fastest)</a>
          <button className="btn" onClick={()=>setPage("contact")} style={{background:"var(--purple)",color:"#fff",padding:"11px 22px",borderRadius:12,fontSize:14,boxShadow:"0 4px 16px rgba(124,92,252,.3)"}}>Email us</button>
        </div>
      </div>
    </div>
  );
}

/* ── Static pages ── */
function StaticPage({ setPage,title,icon,sections }) {
  return(
    <div className="anim" style={{maxWidth:720,margin:"0 auto",padding:"40px 20px"}}>
      <button className="btn" onClick={()=>setPage("home")} style={{background:"transparent",color:"var(--purple2)",fontSize:14,marginBottom:20}}>← Back</button>
      <h1 style={{fontSize:30,fontWeight:800,color:"var(--text)",marginBottom:6,letterSpacing:"-1px",fontFamily:"'Syne',sans-serif"}}>{icon} {title}</h1>
      <p style={{color:"var(--text3)",fontSize:13,marginBottom:32}}>Last updated: January 2025</p>
      {sections.map(([h,b])=>(
        <div key={h} style={{marginBottom:24,paddingBottom:24,borderBottom:"1px solid var(--border)"}}>
          <h2 style={{color:"var(--purple2)",fontSize:14,fontWeight:700,marginBottom:8,letterSpacing:.5,textTransform:"uppercase"}}>{h}</h2>
          <p style={{color:"var(--text2)",fontSize:15,lineHeight:1.7}}>{b}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Contact ── */
function Contact({ setPage,toast }) {
  const [form,setForm]=useState({name:"",email:"",subject:"",message:""});const [sending,setSending]=useState(false);const [done,setDone]=useState(false);
  async function send(){
    if(!form.name||!form.email||!form.message){toast("Please fill all fields","error");return;}
    setSending(true);const r=await api("/contact",{method:"POST",body:form});setSending(false);
    if(r.success){setDone(true);toast("Message sent!");}else toast("Failed. Try Discord instead.","error");
  }
  const inpSt={width:"100%",background:"var(--bg2)",border:"1px solid var(--border2)",color:"var(--text)",padding:"12px 14px",borderRadius:10,fontSize:14,fontFamily:"'DM Sans',sans-serif"};
  if(done)return(
    <div className="anim" style={{maxWidth:480,margin:"100px auto",textAlign:"center",padding:"0 20px"}}>
      <div style={{fontSize:64,marginBottom:20}}>✅</div>
      <h2 style={{color:"var(--text)",marginBottom:8,fontFamily:"'Syne',sans-serif",fontSize:24}}>Message Sent!</h2>
      <p style={{color:"var(--text2)",marginBottom:28}}>We'll reply within 24 hours.</p>
      <button className="btn" onClick={()=>setPage("home")} style={{background:"var(--purple)",color:"#fff",padding:"13px 32px",borderRadius:12,fontSize:15,boxShadow:"0 8px 24px rgba(124,92,252,.3)"}}>Back to Home</button>
    </div>
  );
  return(
    <div className="anim" style={{maxWidth:640,margin:"0 auto",padding:"40px 20px"}}>
      <button className="btn" onClick={()=>setPage("home")} style={{background:"transparent",color:"var(--purple2)",fontSize:14,marginBottom:20}}>← Back</button>
      <h1 style={{fontSize:30,fontWeight:800,color:"var(--text)",marginBottom:6,letterSpacing:"-1px",fontFamily:"'Syne',sans-serif"}}>Contact Us</h1>
      <p style={{color:"var(--text3)",marginBottom:28}}>Discord is the fastest way to get help.</p>
      <div style={{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"}}>
        <a href={DISCORD} target="_blank" rel="noopener noreferrer" style={{flex:1,background:"#5865f2",color:"#fff",padding:"14px",borderRadius:12,textDecoration:"none",textAlign:"center",fontWeight:700,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>Discord (Fastest)</a>
        <a href={"mailto:"+STORE_EMAIL} style={{flex:1,background:"var(--card)",border:"1px solid var(--border)",color:"var(--text2)",padding:"14px",borderRadius:12,textDecoration:"none",textAlign:"center",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>{STORE_EMAIL}</a>
      </div>
      <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:24}}>
        <h3 style={{color:"var(--text)",marginBottom:18,fontSize:16,fontFamily:"'Syne',sans-serif"}}>Send a Message</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="mc">
          <div><label style={{display:"block",color:"var(--text2)",fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name" style={inpSt}/></div>
          <div><label style={{display:"block",color:"var(--text2)",fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@email.com" style={inpSt}/></div>
        </div>
        <div style={{marginBottom:14}}><label style={{display:"block",color:"var(--text2)",fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Subject</label><input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="How can we help?" style={inpSt}/></div>
        <div style={{marginBottom:18}}><label style={{display:"block",color:"var(--text2)",fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:.5,marginBottom:6}}>Message</label><textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Describe your issue..." rows={5} style={{...inpSt,resize:"vertical"}}/></div>
        <button className="btn" onClick={send} disabled={sending} style={{width:"100%",background:"linear-gradient(135deg,var(--purple),#9d6fff)",color:"#fff",padding:"13px",borderRadius:12,fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 8px 24px rgba(124,92,252,.3)"}}>{sending?<Sp/>:"Send Message →"}</button>
      </div>
    </div>
  );
}

/* ── Admin ── */
function Admin({ user,setPage,toast,categories,setCategories }) {
  const [tab,setTab]=useState("overview");
  const [prods,setProds]=useState([]);const [ords,setOrds]=useState([]);const [users,setUsers]=useState([]);
  const [coups,setCoups]=useState([]);const [stats,setStats]=useState({});const [revData,setRevData]=useState([]);
  const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);
  const [np,setNp]=useState({name:"",category:"",price:"",originalPrice:"",image:"📦",images:"",description:"",tags:"",featured:false,downloadLink:"",isBundle:false,bundleItems:""});
  const [newCat,setNewCat]=useState("");
  const [nc,setNc]=useState({code:"",discount:"",type:"percent",minOrder:"0",active:true});
  const [editing,setEditing]=useState(null);const [ep,setEp]=useState({});

  useEffect(()=>{
    if(!user||user.role!=="admin")return;
    Promise.all([
      api("/products").then(d=>Array.isArray(d)&&setProds(d)),
      api("/orders").then(d=>Array.isArray(d)&&setOrds(d)),
      api("/users").then(d=>Array.isArray(d)&&setUsers(d)),
      api("/coupons").then(d=>Array.isArray(d)&&setCoups(d)),
      api("/stats").then(setStats),
      api("/stats/revenue").then(d=>Array.isArray(d)&&setRevData(d))
    ]).finally(()=>setLoading(false));
  },[user]);

  if(!user||user.role!=="admin")return(
    <div style={{maxWidth:400,margin:"100px auto",textAlign:"center",padding:"0 20px"}}>
      <div style={{fontSize:64,marginBottom:20,opacity:.3}}>🔐</div>
      <h2 style={{color:"var(--text)",marginBottom:16,fontFamily:"'Syne',sans-serif"}}>Admin Only</h2>
      <button className="btn" onClick={()=>setPage("auth")} style={{background:"var(--purple)",color:"#fff",padding:"13px 32px",borderRadius:12,fontSize:15,boxShadow:"0 8px 24px rgba(124,92,252,.3)"}}>Sign In</button>
    </div>
  );

  const TABS=[["overview","📊","Overview"],["products","📦","Products"],["orders","🧾","Orders"],["coupons","🏷️","Coupons"],["categories","🗂️","Categories"],["users","👥","Users"]];

  // Category helpers
  async function addCat(){
    const v=newCat.trim();if(!v)return;
    const r=await api("/categories",{method:"POST",body:{name:v}});
    if(r.error){toast(r.error,"error");return;}
    // Optimistic: add immediately, then confirm with server
    setCategories(prev=>[...prev.filter(c=>c!=="All"),"All"===prev[0]?prev[0]:prev[0],...(prev.includes(v)?prev:[...prev,v])].filter((x,i,a)=>a.indexOf(x)===i));
    const updated=await api("/categories");
    if(Array.isArray(updated))setCategories(updated);
    setNewCat("");toast("Category '"+v+"' added!");
  }
  async function delCat(c){
    if(c==="All")return;
    await api("/categories/"+encodeURIComponent(c),{method:"DELETE"});
    const updated=await api("/categories");
    if(Array.isArray(updated))setCategories(updated);
    toast("Category '"+c+"' deleted");
  }

  // Product helpers
  function parseImages(str){return str.split(",").map(s=>s.trim()).filter(Boolean);}

  async function addProd(){
    if(!np.name||!np.price){toast("Name and price required","error");return;}
    setSaving(true);
    const body={...np,price:+np.price,originalPrice:+np.originalPrice||+np.price,tags:np.tags.split(",").map(t=>t.trim()).filter(Boolean),images:parseImages(np.images),bundleItems:np.bundleItems?np.bundleItems.split(",").map(s=>s.trim()).filter(Boolean):[]};
    const r=await api("/products",{method:"POST",body});
    setSaving(false);
    if(r._id){setProds(p=>[...p,r]);toast("Product added! ✓");setNp({name:"",category:catList[0]||"",price:"",originalPrice:"",image:"📦",images:"",description:"",tags:"",featured:false,downloadLink:"",isBundle:false,bundleItems:""});window.dispatchEvent(new Event("refresh-products"));}
    else toast(r.error||"Failed","error");
  }
  async function delProd(id){await api("/products/"+id,{method:"DELETE"});setProds(p=>p.filter(x=>x._id!==id));toast("Deleted");}
  function openEdit(p){
    const cat=catList.includes(p.category)?p.category:(catList[0]||"");
    setEp({name:p.name||"",category:cat,price:p.price||"",originalPrice:p.originalPrice||"",image:p.image||"📦",images:(p.images||[]).join(", "),description:p.description||"",tags:(p.tags||[]).join(", "),featured:p.featured||false,downloadLink:p.downloadLink||"",isBundle:p.isBundle||false,bundleItems:(p.bundleItems||[]).map(b=>b._id||b).join(", ")});
    setEditing(p);
  }
  async function saveEdit(){
    if(!ep.name||!ep.price){toast("Name and price required","error");return;}
    setSaving(true);
    const body={...ep,price:+ep.price,originalPrice:+ep.originalPrice||+ep.price,tags:ep.tags.split(",").map(t=>t.trim()).filter(Boolean),images:parseImages(ep.images),bundleItems:ep.bundleItems?ep.bundleItems.split(",").map(s=>s.trim()).filter(Boolean):[]};
    const r=await api("/products/"+editing._id,{method:"PUT",body});
    setSaving(false);
    if(r._id){setProds(p=>p.map(x=>x._id===r._id?r:x));toast("Updated! ✓");setEditing(null);}
    else toast(r.error||"Failed","error");
  }

  async function addCoup(){if(!nc.code||!nc.discount){toast("Code and discount required","error");return;}const r=await api("/coupons",{method:"POST",body:{...nc,discount:+nc.discount,minOrder:+nc.minOrder}});if(r._id){setCoups(c=>[...c,r]);toast("Created!");setNc({code:"",discount:"",type:"percent",minOrder:"0",active:true});}else toast(r.error||"Failed","error");}
  async function togCoup(c){const r=await api("/coupons/"+c._id,{method:"PATCH",body:{active:!c.active}});setCoups(cs=>cs.map(x=>x._id===c._id?r:x));}
  async function delCoup(id){await api("/coupons/"+id,{method:"DELETE"});setCoups(c=>c.filter(x=>x._id!==id));toast("Deleted");}

  const inpSt={width:"100%",background:"var(--bg)",border:"1px solid var(--border2)",color:"var(--text)",padding:"9px 12px",borderRadius:8,fontSize:14,fontFamily:"'DM Sans',sans-serif"};
  const lb={display:"block",color:"var(--text2)",fontSize:11,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:.5};
  const catList=categories.filter(c=>c!=="All");

  // AUTO-FIX: sync np.category to first valid category when catList changes
  useEffect(()=>{
    if(catList.length>0&&(!np.category||!catList.includes(np.category))){
      setNp(prev=>({...prev,category:catList[0]}));
    }
  },[catList]);

  return(
    <div style={{display:"flex",minHeight:"calc(100vh - 64px)"}}>
      {/* Sidebar */}
      <div className="hm" style={{width:200,background:"var(--bg2)",borderRight:"1px solid var(--border)",padding:"20px 12px",flexShrink:0,position:"sticky",top:64,height:"calc(100vh - 64px)",overflowY:"auto"}}>
        <div style={{color:"var(--text3)",fontSize:9,fontWeight:700,letterSpacing:2,marginBottom:14,paddingLeft:8}}>ADMIN PANEL</div>
        {TABS.map(([t,icon,label])=>(
          <button key={t} className="btn" onClick={()=>setTab(t)}
            style={{display:"flex",alignItems:"center",gap:10,width:"100%",background:tab===t?"var(--purple-dim)":"transparent",color:tab===t?"var(--purple2)":"var(--text2)",padding:"10px 12px",borderRadius:10,fontSize:13,textAlign:"left",marginBottom:3,fontWeight:tab===t?700:400,border:tab===t?"1px solid rgba(124,92,252,.25)":"1px solid transparent"}}>
            <span style={{fontSize:16}}>{icon}</span>{label}
          </button>
        ))}
        <div style={{borderTop:"1px solid var(--border)",marginTop:16,paddingTop:12}}>
          <button className="btn" onClick={()=>setPage("home")} style={{display:"flex",alignItems:"center",gap:8,width:"100%",background:"transparent",color:"var(--text3)",padding:"10px 12px",fontSize:12}}>← Back to Store</button>
        </div>
      </div>

      <style>{`@media(max-width:768px){.adm{display:flex!important}}`}</style>
      <div className="adm" style={{display:"none",position:"fixed",bottom:0,left:0,right:0,background:"var(--bg2)",borderTop:"1px solid var(--border)",zIndex:100,justifyContent:"space-around"}}>
        {TABS.map(([t,icon])=>(<button key={t} className="btn" onClick={()=>setTab(t)} style={{flex:1,background:"transparent",color:tab===t?"var(--purple2)":"var(--text3)",padding:"12px 4px",fontSize:18}}>{icon}</button>))}
      </div>

      <div style={{flex:1,padding:"24px 20px",overflowX:"hidden",paddingBottom:80}}>
        {loading?<div style={{textAlign:"center",padding:80}}><Sp size={36} color="var(--purple)"/></div>:<>

        {/* OVERVIEW */}
        {tab==="overview"&&(
          <div className="anim">
            <h1 style={{fontSize:24,fontWeight:800,color:"var(--text)",marginBottom:24,fontFamily:"'Syne',sans-serif",letterSpacing:"-0.5px"}}>Dashboard</h1>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:28}}>
              {[["💰","Revenue","₹"+(stats.revenue||0).toFixed(0),"var(--purple2)","rgba(124,92,252,.2)"],["📦","Products",stats.products||0,"var(--green)","rgba(0,229,160,.15)"],["👥","Users",stats.users||0,"#60a5fa","rgba(96,165,250,.15)"],["🧾","Orders",stats.orders||0,"#f472b6","rgba(244,114,182,.15)"],["🏷️","Coupons",stats.coupons||0,"var(--gold)","rgba(255,209,102,.15)"]].map(([ic,lbl,val,col,bg])=>(
                <div key={lbl} style={{background:"var(--card)",border:`1px solid ${bg}`,borderRadius:14,padding:16}}>
                  <div style={{fontSize:22,marginBottom:8}}>{ic}</div>
                  <div style={{fontSize:11,color:"var(--text3)",fontWeight:600,textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>{lbl}</div>
                  <div style={{fontSize:22,fontWeight:800,color:col,fontFamily:"'Syne',sans-serif"}}>{val}</div>
                </div>
              ))}
            </div>
            {/* Revenue Chart */}
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:20,marginBottom:20}}>
              <h3 style={{color:"var(--text)",marginBottom:16,fontSize:15,fontFamily:"'Syne',sans-serif"}}>📈 Revenue — Last 30 Days</h3>
              <RevenueChart data={revData}/>
            </div>
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:20}}>
              <h3 style={{color:"var(--text)",marginBottom:16,fontSize:15,fontFamily:"'Syne',sans-serif"}}>Recent Orders</h3>
              {ords.length===0?<div style={{color:"var(--text3)",fontSize:14}}>No orders yet.</div>:ords.slice(0,8).map(o=>(
                <div key={o._id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--border)",flexWrap:"wrap",gap:8}}>
                  <span style={{color:"var(--text2)",fontSize:13,fontFamily:"monospace"}}>{o.orderId}</span>
                  <span style={{color:"var(--text3)",fontSize:12}}>{o.userEmail}</span>
                  <Badge color="green">{o.status}</Badge>
                  <span style={{color:"var(--purple2)",fontWeight:700,fontFamily:"'Syne',sans-serif"}}>₹{o.total?.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PRODUCTS */}
        {tab==="products"&&(
          <div className="anim">
            <h1 style={{fontSize:24,fontWeight:800,color:"var(--text)",marginBottom:24,fontFamily:"'Syne',sans-serif",letterSpacing:"-0.5px"}}>Products</h1>
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:20,marginBottom:20}}>
              <h3 style={{color:"var(--text)",marginBottom:16,fontSize:15,fontFamily:"'Syne',sans-serif"}}>Add New Product</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}} className="mc">
                {[["name","Name"],["price","Price (₹)"],["originalPrice","Original Price (₹)"],["image","Main Image URL or Emoji"]].map(([f,l])=>(
                  <div key={f}><label style={lb}>{l}</label><input value={np[f]} onChange={e=>setNp({...np,[f]:e.target.value})} style={inpSt}/></div>
                ))}
              </div>
              {/* Gallery images */}
              <div style={{marginBottom:12}}>
                <label style={lb}>📷 Gallery Images <span style={{color:"var(--text3)",textTransform:"none",letterSpacing:0}}>(comma-separated URLs — shows as thumbnail strip)</span></label>
                <input value={np.images} onChange={e=>setNp({...np,images:e.target.value})} placeholder="https://i.imgbb.co/x.jpg, https://i.imgbb.co/y.jpg" style={inpSt}/>
              </div>
              <p style={{color:"var(--text3)",fontSize:11,marginBottom:10}}>💡 Upload images to <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" style={{color:"var(--purple2)"}}>imgbb.com</a> → copy Direct Link</p>
              <div style={{marginBottom:12}}><label style={lb}>Description</label><textarea value={np.description} onChange={e=>setNp({...np,description:e.target.value})} rows={3} style={{...inpSt,minHeight:72,resize:"vertical"}}/></div>
              <div style={{marginBottom:12}}>
                <label style={lb}>🔗 Download Link <span style={{color:"var(--green)",textTransform:"none",letterSpacing:0}}>(sent to customer after payment)</span></label>
                <input value={np.downloadLink} onChange={e=>setNp({...np,downloadLink:e.target.value})} placeholder="https://drive.google.com/..." style={inpSt}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}} className="mc">
                <div><label style={lb}>Category</label><select value={np.category} onChange={e=>setNp({...np,category:e.target.value})} style={inpSt}>{catList.map(c=><option key={c}>{c}</option>)}</select></div>
                <div><label style={lb}>Tags (comma-separated)</label><input value={np.tags} onChange={e=>setNp({...np,tags:e.target.value})} placeholder="React, UI, Design" style={inpSt}/></div>
              </div>
              {/* Bundle */}
              <div style={{marginBottom:12}}>
                <label style={lb}>Bundle Product IDs <span style={{color:"var(--text3)",textTransform:"none",letterSpacing:0}}>(comma-separated MongoDB IDs of included products)</span></label>
                <input value={np.bundleItems} onChange={e=>setNp({...np,bundleItems:e.target.value})} placeholder="64abc..., 64def..." style={inpSt}/>
              </div>
              <div style={{display:"flex",gap:20,marginBottom:16,flexWrap:"wrap"}}>
                <label style={{display:"flex",alignItems:"center",gap:8,color:"var(--text2)",fontSize:13,cursor:"pointer"}}>
                  <input type="checkbox" checked={np.featured} onChange={e=>setNp({...np,featured:e.target.checked})} style={{accentColor:"var(--purple)",width:16,height:16}}/> Mark as Featured
                </label>
                <label style={{display:"flex",alignItems:"center",gap:8,color:"var(--green)",fontSize:13,cursor:"pointer"}}>
                  <input type="checkbox" checked={np.isBundle} onChange={e=>setNp({...np,isBundle:e.target.checked})} style={{accentColor:"var(--green)",width:16,height:16}}/> This is a Bundle
                </label>
              </div>
              <button className="btn" onClick={addProd} disabled={saving}
                style={{background:"var(--purple)",color:"#fff",padding:"11px 24px",borderRadius:10,fontSize:14,display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 16px rgba(124,92,252,.3)"}}>
                {saving?<Sp/>:"+ Add Product"}
              </button>
            </div>

            {/* Products Table */}
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <h3 style={{color:"var(--text)",margin:0,fontSize:15,fontFamily:"'Syne',sans-serif"}}>All Products</h3>
                <Badge color="purple">{prods.length} total</Badge>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:620}}>
                  <thead><tr style={{background:"var(--bg)"}}>
                    {["","Name","Price","Category","Gallery","Download","Featured","Bundle","",""].map((h,i)=>(
                      <th key={i} style={{padding:"10px 14px",color:"var(--text3)",fontSize:11,fontWeight:600,textAlign:"left",whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:.5}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {prods.map(p=>(
                      <tr key={p._id} style={{borderTop:"1px solid var(--border)"}}>
                        <td style={{padding:"12px 14px",fontSize:22}}>{isUrl(p.image)?<img src={p.image} style={{width:36,height:36,borderRadius:8,objectFit:"cover"}} alt=""/>:p.image}</td>
                        <td style={{padding:"12px 14px",color:"var(--text)",fontSize:14,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:600}}>{p.name}</td>
                        <td style={{padding:"12px 14px",color:"var(--purple2)",fontWeight:700,fontSize:14,fontFamily:"'Syne',sans-serif"}}>₹{p.price}</td>
                        <td style={{padding:"12px 14px"}}><Badge color="purple">{p.category}</Badge></td>
                        <td style={{padding:"12px 14px"}}><span style={{color:(p.images||[]).length>0?"var(--green)":"var(--text3)",fontSize:12}}>{(p.images||[]).length} imgs</span></td>
                        <td style={{padding:"12px 14px"}}>{p.downloadLink?<span style={{color:"var(--green)",fontSize:12,fontWeight:600}}>✓ Set</span>:<span style={{color:"var(--red)",fontSize:12}}>✗ Missing</span>}</td>
                        <td style={{padding:"12px 14px"}}><Badge color={p.featured?"gold":"purple"}>{p.featured?"★ Yes":"No"}</Badge></td>
                        <td style={{padding:"12px 14px"}}>{p.isBundle?<Badge color="green">Bundle</Badge>:<span style={{color:"var(--text3)",fontSize:11}}>—</span>}</td>
                        <td style={{padding:"12px 14px"}}><button className="btn" onClick={()=>openEdit(p)} style={{background:"var(--purple-dim)",color:"var(--purple2)",padding:"5px 12px",borderRadius:8,fontSize:12,border:"1px solid rgba(124,92,252,.3)"}}>✏ Edit</button></td>
                        <td style={{padding:"12px 14px"}}><button className="btn" onClick={()=>delProd(p._id)} style={{background:"rgba(255,77,109,.1)",color:"var(--red)",padding:"5px 12px",borderRadius:8,fontSize:12}}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit Modal */}
            {editing&&(
              <div onClick={e=>e.target===e.currentTarget&&setEditing(null)}
                style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(8px)"}}>
                <div style={{background:"var(--card)",border:"1px solid var(--border2)",borderRadius:20,padding:28,width:"100%",maxWidth:600,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 40px 80px rgba(0,0,0,.6)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
                    <h2 style={{color:"var(--text)",fontSize:18,fontWeight:800,margin:0,fontFamily:"'Syne',sans-serif"}}>✏ Edit Product</h2>
                    <button className="btn" onClick={()=>setEditing(null)} style={{background:"var(--bg2)",color:"var(--text2)",width:32,height:32,borderRadius:8,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center",border:"1px solid var(--border)"}}>×</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    {[["name","Name"],["price","Price (₹)"],["originalPrice","Original Price (₹)"],["image","Main Image URL or Emoji"]].map(([f,l])=>(
                      <div key={f}><label style={lb}>{l}</label><input value={ep[f]} onChange={e=>setEp({...ep,[f]:e.target.value})} style={inpSt}/></div>
                    ))}
                  </div>
                  <div style={{marginTop:12}}><label style={lb}>📷 Gallery Images (comma-separated URLs)</label><input value={ep.images} onChange={e=>setEp({...ep,images:e.target.value})} style={inpSt}/></div>
                  <div style={{marginTop:12}}><label style={lb}>Description</label><textarea value={ep.description} onChange={e=>setEp({...ep,description:e.target.value})} rows={3} style={{...inpSt,minHeight:80,resize:"vertical"}}/></div>
                  <div style={{marginTop:12}}><label style={lb}>🔗 Download Link</label><input value={ep.downloadLink} onChange={e=>setEp({...ep,downloadLink:e.target.value})} placeholder="https://drive.google.com/..." style={inpSt}/></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
                    <div><label style={lb}>Category</label><select value={ep.category} onChange={e=>setEp({...ep,category:e.target.value})} style={inpSt}>{catList.map(c=><option key={c}>{c}</option>)}</select></div>
                    <div><label style={lb}>Tags</label><input value={ep.tags} onChange={e=>setEp({...ep,tags:e.target.value})} placeholder="React, UI" style={inpSt}/></div>
                  </div>
                  <div style={{marginTop:12}}><label style={lb}>Bundle Item IDs (comma-separated)</label><input value={ep.bundleItems} onChange={e=>setEp({...ep,bundleItems:e.target.value})} style={inpSt}/></div>
                  <div style={{display:"flex",gap:20,marginTop:14,flexWrap:"wrap"}}>
                    <label style={{display:"flex",alignItems:"center",gap:8,color:"var(--text2)",fontSize:13,cursor:"pointer"}}>
                      <input type="checkbox" checked={ep.featured} onChange={e=>setEp({...ep,featured:e.target.checked})} style={{accentColor:"var(--purple)",width:16,height:16}}/> Featured
                    </label>
                    <label style={{display:"flex",alignItems:"center",gap:8,color:"var(--green)",fontSize:13,cursor:"pointer"}}>
                      <input type="checkbox" checked={ep.isBundle} onChange={e=>setEp({...ep,isBundle:e.target.checked})} style={{accentColor:"var(--green)",width:16,height:16}}/> Is Bundle
                    </label>
                  </div>
                  <div style={{display:"flex",gap:10,marginTop:22}}>
                    <button className="btn" onClick={()=>setEditing(null)} style={{flex:1,background:"transparent",border:"1px solid var(--border2)",color:"var(--text2)",padding:"12px",borderRadius:10,fontSize:14}}>Cancel</button>
                    <button className="btn" onClick={saveEdit} disabled={saving}
                      style={{flex:2,background:"linear-gradient(135deg,var(--purple),#9d6fff)",color:"#fff",padding:"12px",borderRadius:10,fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 8px 24px rgba(124,92,252,.3)"}}>
                      {saving?<Sp/>:"💾 Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ORDERS */}
        {tab==="orders"&&(
          <div className="anim">
            <h1 style={{fontSize:24,fontWeight:800,color:"var(--text)",marginBottom:24,fontFamily:"'Syne',sans-serif",letterSpacing:"-0.5px"}}>Orders <Badge color="purple">{ords.length}</Badge></h1>
            {ords.length===0?<div style={{color:"var(--text3)",textAlign:"center",padding:60,fontSize:16}}>No orders yet.</div>:(
              <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {ords.map(o=>(
                  <div key={o._id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:16}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
                      <div>
                        <span style={{color:"var(--text)",fontWeight:700,fontSize:14,fontFamily:"monospace"}}>{o.orderId}</span>
                        <span style={{color:"var(--text3)",fontSize:12,marginLeft:12}}>{new Date(o.createdAt).toLocaleDateString()}</span>
                        <div style={{color:"var(--text2)",fontSize:12,marginTop:4}}>{o.userEmail}</div>
                      </div>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <Badge color="green">{o.status}</Badge>
                        <span style={{color:"var(--text)",fontWeight:800,fontFamily:"'Syne',sans-serif"}}>₹{o.total?.toFixed(0)}</span>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>
                      {o.items?.map((it,i)=><span key={i} style={{background:"var(--bg2)",color:"var(--text2)",padding:"4px 10px",borderRadius:8,fontSize:12,border:"1px solid var(--border)"}}>{it.image} {it.name}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COUPONS */}
        {tab==="coupons"&&(
          <div className="anim">
            <h1 style={{fontSize:24,fontWeight:800,color:"var(--text)",marginBottom:24,fontFamily:"'Syne',sans-serif",letterSpacing:"-0.5px"}}>Coupons</h1>
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:20,marginBottom:16}}>
              <h3 style={{color:"var(--text)",marginBottom:14,fontSize:15,fontFamily:"'Syne',sans-serif"}}>Create Coupon</h3>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}} className="mc">
                {[["code","Code"],["discount","Discount"],["minOrder","Min Order (₹)"]].map(([f,l])=>(<div key={f}><label style={lb}>{l}</label><input value={nc[f]} onChange={e=>setNc({...nc,[f]:e.target.value})} style={inpSt}/></div>))}
                <div><label style={lb}>Type</label><select value={nc.type} onChange={e=>setNc({...nc,type:e.target.value})} style={inpSt}><option value="percent">% Off</option><option value="fixed">₹ Off</option></select></div>
              </div>
              <button className="btn" onClick={addCoup} style={{marginTop:14,background:"var(--purple)",color:"#fff",padding:"10px 24px",borderRadius:10,fontSize:14,boxShadow:"0 4px 16px rgba(124,92,252,.3)"}}>+ Create Coupon</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {coups.map(c=>(
                <div key={c._id} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:16,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                  <div style={{background:"var(--purple-dim)",border:"1px dashed rgba(124,92,252,.4)",borderRadius:8,padding:"6px 16px",fontFamily:"monospace",fontSize:15,fontWeight:700,color:"var(--purple2)"}}>{c.code}</div>
                  <div style={{color:"var(--green)",fontWeight:700,fontSize:14}}>{c.type==="percent"?c.discount+"% OFF":"₹"+c.discount+" OFF"}</div>
                  <div style={{color:"var(--text3)",fontSize:12}}>Min ₹{c.minOrder} · {c.uses} uses</div>
                  <div style={{marginLeft:"auto",display:"flex",gap:8}}>
                    <button className="btn" onClick={()=>togCoup(c)} style={{background:c.active?"rgba(0,229,160,.1)":"var(--bg2)",color:c.active?"var(--green)":"var(--text3)",padding:"6px 14px",borderRadius:8,fontSize:12,border:`1px solid ${c.active?"rgba(0,229,160,.3)":"var(--border2)"}`}}>{c.active?"Active":"Off"}</button>
                    <button className="btn" onClick={()=>delCoup(c._id)} style={{background:"rgba(255,77,109,.1)",color:"var(--red)",padding:"6px 14px",borderRadius:8,fontSize:12}}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIES — now hitting MongoDB */}
        {tab==="categories"&&(
          <div className="anim">
            <h1 style={{fontSize:24,fontWeight:800,color:"var(--text)",marginBottom:6,fontFamily:"'Syne',sans-serif",letterSpacing:"-0.5px"}}>Categories</h1>
            <p style={{color:"var(--text3)",fontSize:13,marginBottom:24}}>Categories are stored in MongoDB and sync across all devices automatically.</p>
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:20,marginBottom:20}}>
              <h3 style={{color:"var(--text)",marginBottom:14,fontSize:15,fontFamily:"'Syne',sans-serif"}}>Add New Category</h3>
              <div style={{display:"flex",gap:10}}>
                <input value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCat()} placeholder="e.g. Video, Templates, SaaS..." style={{...inpSt,flex:1}}/>
                <button className="btn" onClick={addCat} style={{background:"linear-gradient(135deg,var(--purple),#9d6fff)",color:"#fff",padding:"9px 22px",borderRadius:8,fontSize:14,whiteSpace:"nowrap",boxShadow:"0 4px 16px rgba(124,92,252,.3)"}}>+ Add</button>
              </div>
            </div>
            {catList.length===0?(
              <div style={{textAlign:"center",padding:"60px 20px",background:"var(--card)",borderRadius:16,border:"1px dashed var(--border2)"}}>
                <div style={{fontSize:40,marginBottom:12,opacity:.4}}>🗂️</div>
                <p style={{color:"var(--text3)",fontSize:15,marginBottom:8}}>No categories yet</p>
                <p style={{color:"var(--text3)",fontSize:12}}>Add your first category above — products won't be able to use a category dropdown until at least one exists.</p>
              </div>
            ):(
              <div>
                <div style={{color:"var(--text3)",fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:.5,marginBottom:12}}>{catList.length} Categories</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:10}}>
                  {catList.map(c=>(
                    <div key={c} style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:8,height:8,background:"var(--purple)",borderRadius:"50%",flexShrink:0}}/>
                        <span style={{color:"var(--text)",fontSize:14,fontWeight:600}}>{c}</span>
                      </div>
                      <button className="btn" onClick={()=>delCat(c)} style={{background:"rgba(255,77,109,.1)",color:"var(--red)",width:26,height:26,borderRadius:6,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* USERS */}
        {tab==="users"&&(
          <div className="anim">
            <h1 style={{fontSize:24,fontWeight:800,color:"var(--text)",marginBottom:24,fontFamily:"'Syne',sans-serif",letterSpacing:"-0.5px"}}>Users <Badge color="purple">{users.length}</Badge></h1>
            <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:500}}>
                  <thead><tr style={{background:"var(--bg)"}}>
                    {["User","Email","Role","Auth","Joined"].map(h=>(<th key={h} style={{padding:"12px 14px",color:"var(--text3)",fontSize:11,fontWeight:600,textAlign:"left",textTransform:"uppercase",letterSpacing:.5}}>{h}</th>))}
                  </tr></thead>
                  <tbody>
                    {users.map(u=>(
                      <tr key={u._id} style={{borderTop:"1px solid var(--border)"}}>
                        <td style={{padding:"12px 14px"}}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,var(--purple-dim),var(--purple))",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,fontWeight:700,flexShrink:0}}>{u.name?.[0]?.toUpperCase()}</div>
                            <span style={{color:"var(--text)",fontSize:14,fontWeight:600}}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{padding:"12px 14px",color:"var(--text2)",fontSize:13}}>{u.email}</td>
                        <td style={{padding:"12px 14px"}}><Badge color={u.role==="admin"?"gold":"purple"}>{u.role}</Badge></td>
                        <td style={{padding:"12px 14px"}}><Badge color={u.oauthProvider?"green":"purple"}>{u.oauthProvider||"email"}</Badge></td>
                        <td style={{padding:"12px 14px",color:"var(--text3)",fontSize:13}}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        </>}
      </div>
    </div>
  );
}

/* ══ APP ROOT ══ */
export default function App() {
  const [page,setPage]=useState("home");
  const [user,setUser]=useState(null);
  const [cart,setCart]=useState([]);
  const [products,setProducts]=useState([]);
  const [categories,setCategories]=useState(["All"]);
  const [wishlist,setWishlist]=useState([]); // array of product IDs
  const {toasts,push:toast}=useToast();
  const resetTok=new URLSearchParams(window.location.search).get("reset");
  const oauthToken=new URLSearchParams(window.location.search).get("oauth_token");

  // Load products & categories
  useEffect(()=>{
    const loadProducts=()=>api("/products").then(d=>{if(Array.isArray(d))setProducts(d);});
    const loadCats=()=>api("/categories").then(d=>{if(Array.isArray(d))setCategories(d);});
    loadProducts();loadCats();
    const interval=setInterval(loadProducts,10000);
    window.addEventListener("refresh-products",loadProducts);
    return()=>{clearInterval(interval);window.removeEventListener("refresh-products",loadProducts);};
  },[]);

  // Restore session
  useEffect(()=>{
    // OAuth token from redirect
    if(oauthToken){
      try{
        const pl=JSON.parse(atob(oauthToken.split(".")[1]));
        if(pl.exp*1000>Date.now()){
          localStorage.setItem("aurora_token",oauthToken);
          setUser({id:pl.id,name:pl.name,email:pl.email,role:pl.role});
          toast("Welcome, "+pl.name+"! 👋");
          window.history.replaceState({},"",window.location.pathname);
        }
      }catch(e){console.log("OAuth token parse error",e);}
    }

    const tok=localStorage.getItem("aurora_token");
    if(tok){try{const pl=JSON.parse(atob(tok.split(".")[1]));if(pl.exp*1000>Date.now())setUser({id:pl.id,name:pl.name,email:pl.email,role:pl.role});else localStorage.removeItem("aurora_token");}catch{localStorage.removeItem("aurora_token");}}
    const sv=localStorage.getItem("aurora_cart");if(sv)try{setCart(JSON.parse(sv));}catch{}
    if(resetTok)setPage("auth");
  },[resetTok,oauthToken]);

  // Persist cart
  useEffect(()=>{localStorage.setItem("aurora_cart",JSON.stringify(cart));},[cart]);

  // Load wishlist when user logs in
  useEffect(()=>{
    if(!user)return;
    api("/wishlist").then(d=>{
      if(Array.isArray(d))setWishlist(d.map(p=>p._id||p.id));
    });
  },[user]);

  function logout(){localStorage.removeItem("aurora_token");setUser(null);setCart([]);setWishlist([]);setPage("home");toast("Signed out");}

  async function toggleWishlist(productId){
    if(!user)return;
    if(wishlist.includes(productId)){
      setWishlist(w=>w.filter(x=>x!==productId));
      await api("/wishlist/"+productId,{method:"DELETE"});
      toast("Removed from wishlist");
    }else{
      setWishlist(w=>[...w,productId]);
      await api("/wishlist/"+productId,{method:"POST"});
      toast("Saved to wishlist ♥");
    }
  }

  const policySection=[["Information We Collect","Name, email, and order details. Payments via Razorpay — we never store card/UPI data."],["How We Use Your Info","Email used only for order confirmations and download links. We never sell your data."],["Data Security","Encrypted database with SSL for all transmissions."],["Cookies","Only essential cookies for sessions and cart. No advertising cookies."],["Third-Party Services","Razorpay for payments, Nodemailer for emails."],["Your Rights","Request account deletion: "+STORE_EMAIL],["Contact","Privacy concerns: "+STORE_EMAIL+" or Discord."]];
  const termsSection=[["Acceptance","By using Aurora Store, you agree to these terms."],["Digital Products","Personal, non-exclusive, non-transferable license. No redistribution or resale."],["Payment","All prices in INR. Processed via Razorpay. Prices may change without notice."],["Refund Policy","7-day refund if product doesn't work as described. Contact: "+STORE_EMAIL],["Intellectual Property","All products protected by copyright. Unauthorized copying is prohibited."],["Prohibited Use","No illegal use. We may terminate violating accounts."],["Liability","Not liable for indirect damages. Liability limited to purchase price."],["Governing Law","Governed by Indian law."],["Contact","Questions: "+STORE_EMAIL]];

  const shared={setPage,cart,setCart,toast,wishlist,toggleWishlist,user};

  function render(){
    if(page==="home")return<Home {...shared} products={products}/>;
    if(page==="products")return<Products {...shared} products={products} categories={categories}/>;
    if(page==="cart")return<CartPage {...shared}/>;
    if(page==="checkout")return<Checkout {...shared}/>;
    if(page==="orders")return<Orders setPage={setPage} user={user}/>;
    if(page==="auth")return<Auth setUser={setUser} setPage={setPage} toast={toast} resetTok={resetTok}/>;
    if(page==="search")return<Search {...shared} products={products}/>;
    if(page==="wishlist")return<WishlistPage wishlistIds={wishlist} products={products} setPage={setPage} cart={cart} setCart={setCart} toast={toast} toggleWishlist={toggleWishlist} user={user}/>;
    if(page==="admin")return<Admin user={user} setPage={setPage} toast={toast} categories={categories} setCategories={setCategories}/>;
    if(page==="faq")return<FAQ setPage={setPage}/>;
    if(page==="policy")return<StaticPage setPage={setPage} title="Privacy Policy" icon="📋" sections={policySection}/>;
    if(page==="terms")return<StaticPage setPage={setPage} title="Terms & Conditions" icon="📄" sections={termsSection}/>;
    if(page==="contact")return<Contact setPage={setPage} toast={toast}/>;
    if(page?.startsWith("product-"))return<Detail productId={page.slice(8)} products={products} setPage={setPage} cart={cart} setCart={setCart} toast={toast} user={user} wishlist={wishlist} toggleWishlist={toggleWishlist}/>;
    return<Home {...shared} products={products}/>;
  }

  return(
    <div style={{background:"var(--bg)",minHeight:"100vh"}}>
      <style>{css}</style>
      <Header page={page} setPage={setPage} user={user} cart={cart} wishlist={wishlist} logout={logout}/>
      <Toast toasts={toasts}/>
      <main>{render()}</main>
    </div>
  );
}
