import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../../hooks/useProducts";
import { useAuth } from "../../context/AuthContext";
import AuthForm from "../../components/auth/AuthForm";
import {
  ShoppingBag, Heart, Search, Menu, X, Plus, Minus, Star,
  Instagram, Phone, MessageCircle, ChevronRight, MapPin, Mail,
  ArrowRight, Sparkles, Truck, ShieldCheck, Check, Home as HomeIcon,
  User as UserIcon, LogOut, Package,
} from "lucide-react";

/* ---------- Brand tokens (pulled from the Style Statements Instagram) ---------- */
const C = {
  teal: "#0A4548",
  tealDeep: "#062B2D",
  tealBright: "#0E5F63",
  cyan: "#25C2C7",
  gold: "#C9A24B",
  goldLite: "#E6CD8C",
  ink: "#070C0C",
  ivory: "#F6F3EC",
  dim: "#B9C2C1",
};

/* Recreates the teal satin sheen from the brand's posts without image assets */
const satin = (a = 135, deep = false) => ({
  backgroundColor: deep ? C.tealDeep : C.teal,
  backgroundImage: `
    radial-gradient(120% 90% at 22% 18%, rgba(37,194,199,0.28), rgba(37,194,199,0) 46%),
    radial-gradient(120% 120% at 82% 88%, rgba(6,43,45,0.85), rgba(6,43,45,0) 55%),
    linear-gradient(${a}deg, ${C.tealBright} 0%, ${C.teal} 38%, ${C.tealDeep} 100%)`,
});

const serif = { fontFamily: "'Playfair Display', Georgia, serif" };
const script = { fontFamily: "'Cormorant Garamond', Georgia, serif" };
const sans = { fontFamily: "'Inter', system-ui, sans-serif" };

/* ---------- Corner-bracket frame: the brand's signature device ---------- */
function Frame({ pad = 14, color = "rgba(246,243,236,0.7)", w = 2, len = 34, children, style }) {
  const L = (pos) => {
    const base = { position: "absolute", pointerEvents: "none" };
    const arm = { position: "absolute", background: color };
    const map = {
      tl: { top: pad, left: pad, h: { top: 0, left: 0, width: len, height: w }, v: { top: 0, left: 0, width: w, height: len } },
      br: { bottom: pad, right: pad, h: { bottom: 0, right: 0, width: len, height: w }, v: { bottom: 0, right: 0, width: w, height: len } },
    }[pos];
    return (
      <div style={{ ...base, ...(pos === "tl" ? { top: map.top, left: map.left } : { bottom: map.bottom, right: map.right }), width: len, height: len }}>
        <span style={{ ...arm, ...map.h }} />
        <span style={{ ...arm, ...map.v }} />
      </div>
    );
  };
  return (
    <div style={{ position: "relative", ...style }}>
      {L("tl")}{L("br")}
      {children}
    </div>
  );
}

/* ---------- Product catalog ---------- */
const CATS = {
  Jewelry: ["Rings", "Earrings", "Necklaces", "Bracelets", "Anklets"],
  Sunglasses: ["Aviator", "Cat Eye", "Oversized", "Classic"],
  Perfumes: ["Men's", "Women's", "Unisex", "Gift Sets"],
};

// Offline fallback catalog — empty by default so nothing fake ever renders.
// The storefront loads the real catalog from the backend (/api/products).
const SEED_PRODUCTS = [];

const KES = (n) => "KES " + n.toLocaleString("en-KE");

/* ---------- Product tile ----------
   Renders the real photo when a product has `img`; otherwise falls back
   to the on-brand teal-satin tile. Drop a URL into a product's `img`
   field (see PRODUCTS below) and it upgrades automatically — no other
   changes needed. Photos should be square-ish; they're cropped to fill. */
function ProductVisual({ name, sub, tall, img }) {
  const [broken, setBroken] = useState(false);
  const showPhoto = img && !broken;
  return (
    <Frame pad={12} len={26} color="rgba(246,243,236,0.55)" style={{ ...satin(130), width: "100%", height: tall ? 360 : 260, borderRadius: 4, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {showPhoto && (
        <img src={img} alt={name} loading="lazy" onError={() => setBroken(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      )}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(6,43,45,0.55) 100%)" }} />
      {!showPhoto && (
        <div style={{ textAlign: "center", zIndex: 1, padding: 20 }}>
          <div style={{ ...script, color: C.goldLite, fontSize: 13, letterSpacing: 3, textTransform: "uppercase" }}>{sub}</div>
          <div style={{ ...serif, color: C.ivory, fontSize: 22, marginTop: 6, lineHeight: 1.2 }}>{name}</div>
        </div>
      )}
    </Frame>
  );
}

/* =================================================================== */
export default function StyleStatements() {
  // Live catalog from the backend; SEED_PRODUCTS renders if the API is offline.
  const { products: PRODUCTS, online } = useProducts(SEED_PRODUCTS);
  const { user, login, register, logout } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState("home");
  const [active, setActive] = useState(null);
  const [cart, setCart] = useState([]);
  const [wish, setWish] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("featured");
  const [query, setQuery] = useState("");
  const [qty, setQty] = useState(1);

  const go = (v, p = null) => { setView(v); setActive(p); setQty(1); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const addToCart = (p, n = 1) => {
    setCart((c) => {
      const f = c.find((i) => i.id === p.id);
      return f ? c.map((i) => (i.id === p.id ? { ...i, qty: i.qty + n } : i)) : [...c, { ...p, qty: n }];
    });
    setCartOpen(true);
  };
  const setLine = (id, n) => setCart((c) => c.map((i) => (i.id === id ? { ...i, qty: Math.max(1, n) } : i)));
  const removeLine = (id) => setCart((c) => c.filter((i) => i.id !== id));
  const toggleWish = (p) => setWish((w) => (w.includes(p.id) ? w.filter((x) => x !== p.id) : [...w, p.id]));

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0);

  const shown = useMemo(() => {
    let list = PRODUCTS.filter((p) => (filter === "All" ? true : p.cat === filter));
    if (query.trim()) list = list.filter((p) => (p.name + p.cat + p.sub).toLowerCase().includes(query.toLowerCase()));
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [filter, sort, query, PRODUCTS]);

  const product = PRODUCTS.find((p) => p.id === active);

  /* ---------- small building blocks ---------- */
  const Eyebrow = ({ children, light }) => (
    <div style={{ ...sans, fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: light ? C.goldLite : C.gold, fontWeight: 600 }}>{children}</div>
  );

  const GoldBtn = ({ children, onClick, block }) => (
    <button onClick={onClick} className="ss-gold" style={{ ...sans, display: block ? "block" : "inline-flex", width: block ? "100%" : "auto", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(135deg, ${C.goldLite}, ${C.gold})`, color: C.ink, border: "none", padding: "13px 26px", borderRadius: 2, fontWeight: 600, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>{children}</button>
  );
  const GhostBtn = ({ children, onClick, block }) => (
    <button onClick={onClick} className="ss-ghost" style={{ ...sans, display: block ? "block" : "inline-flex", width: block ? "100%" : "auto", alignItems: "center", justifyContent: "center", gap: 8, background: "transparent", color: C.ivory, border: `1px solid rgba(246,243,236,0.35)`, padding: "13px 26px", borderRadius: 2, fontWeight: 600, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer" }}>{children}</button>
  );

  function Card({ p }) {
    const wished = wish.includes(p.id);
    return (
      <div className="ss-card" style={{ cursor: "pointer" }}>
        <div style={{ position: "relative" }} onClick={() => go("product", p.id)}>
          <ProductVisual name={p.name} sub={p.sub} img={p.img} />
          {p.badge && (
            <span style={{ ...sans, position: "absolute", top: 12, left: 12, background: C.ink, color: C.goldLite, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", padding: "5px 10px", borderRadius: 2, fontWeight: 600 }}>{p.badge}</span>
          )}
          <button onClick={(e) => { e.stopPropagation(); toggleWish(p); }} aria-label="Wishlist"
            style={{ position: "absolute", top: 10, right: 10, width: 36, height: 36, borderRadius: 999, border: "none", background: "rgba(7,12,12,0.5)", backdropFilter: "blur(6px)", display: "grid", placeItems: "center", cursor: "pointer" }}>
            <Heart size={16} color={wished ? C.gold : C.ivory} fill={wished ? C.gold : "none"} />
          </button>
        </div>
        <div style={{ paddingTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Star size={12} color={C.gold} fill={C.gold} />
            <span style={{ ...sans, fontSize: 12, color: C.dim }}>{p.rating} · {p.reviews}</span>
          </div>
          <h4 onClick={() => go("product", p.id)} style={{ ...serif, color: C.ivory, fontSize: 18, margin: "6px 0 2px" }}>{p.name}</h4>
          <div style={{ ...sans, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.dim }}>{p.cat} · {p.sub}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
            <span style={{ ...serif, color: C.goldLite, fontSize: 17 }}>{KES(p.price)}</span>
            <button onClick={() => addToCart(p)} className="ss-add" aria-label="Add to cart"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.gold}`, color: C.gold, ...sans, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", padding: "8px 12px", borderRadius: 2, cursor: "pointer", fontWeight: 600 }}>
              <Plus size={13} /> Add
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Section = ({ children, style }) => (
    <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", ...style }}>{children}</section>
  );

  const Wordmark = ({ size = 1 }) => (
    <div style={{ ...serif, color: C.ivory, textAlign: "center", lineHeight: 1 }}>
      <div style={{ fontSize: 34 * size, letterSpacing: 8 * size, fontWeight: 500 }}>STYLE</div>
      <div style={{ ...sans, fontSize: 12 * size, letterSpacing: 10 * size, marginTop: 6 * size, color: C.dim }}>STATEMENTS</div>
    </div>
  );

  /* ---------- VIEWS ---------- */
  const Home = () => (
    <>
      {/* Hero */}
      <div style={{ ...satin(140), minHeight: 620, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(180deg, rgba(7,12,12,0.35), rgba(6,43,45,0.6))" }} />
        <Frame pad={40} len={80} w={2} color="rgba(246,243,236,0.6)" style={{ position: "relative", zIndex: 1, padding: "70px 60px", textAlign: "center" }}>
          <div className="ss-rise">
            <Eyebrow light>Fashion Accessories · Nairobi</Eyebrow>
            <div style={{ margin: "22px 0" }}><Wordmark size={1.5} /></div>
            <p style={{ ...script, color: C.goldLite, fontSize: 26, fontStyle: "italic", marginTop: 8 }}>Your Style, Our Statement.</p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 34, flexWrap: "wrap" }}>
              <GoldBtn onClick={() => go("shop")}>Shop the Collection</GoldBtn>
              <GhostBtn onClick={() => { setFilter("All"); setSort("rating"); go("shop"); }}>New Arrivals</GhostBtn>
            </div>
          </div>
        </Frame>
      </div>

      {/* Trust bar */}
      <div style={{ background: C.ink, borderBottom: `1px solid rgba(201,162,75,0.2)` }}>
        <Section style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-around", padding: "18px 24px" }}>
          {[[Truck, "Delivery across Kenya"], [ShieldCheck, "Authentic & curated"], [Sparkles, "Gift-ready packaging"], [MessageCircle, "Order on WhatsApp"]].map(([Icon, t], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon size={17} color={C.gold} />
              <span style={{ ...sans, fontSize: 12, letterSpacing: 1, color: C.dim, textTransform: "uppercase" }}>{t}</span>
            </div>
          ))}
        </Section>
      </div>

      {/* Categories */}
      <Section style={{ padding: "70px 24px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Eyebrow>Explore</Eyebrow>
          <h2 style={{ ...serif, color: C.ivory, fontSize: 34, marginTop: 10 }}>Featured Categories</h2>
        </div>
        <div className="ss-grid3">
          {Object.keys(CATS).map((cat) => (
            <div key={cat} className="ss-cat" onClick={() => { setFilter(cat); go("shop"); }} style={{ cursor: "pointer" }}>
              <Frame pad={16} len={34} style={{ ...satin(120), height: 300, borderRadius: 4, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(6,43,45,0.75) 100%)" }} />
                <div style={{ position: "relative", padding: 26 }}>
                  <h3 style={{ ...serif, color: C.ivory, fontSize: 26 }}>{cat}</h3>
                  <span style={{ ...sans, fontSize: 12, letterSpacing: 1, color: C.goldLite, display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6 }}>Shop now <ArrowRight size={14} /></span>
                </div>
              </Frame>
            </div>
          ))}
        </div>
      </Section>

      {/* New arrivals */}
      <Section style={{ padding: "50px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 30 }}>
          <div><Eyebrow>Just landed</Eyebrow><h2 style={{ ...serif, color: C.ivory, fontSize: 30, marginTop: 8 }}>New Arrivals</h2></div>
          <button onClick={() => go("shop")} style={{ ...sans, background: "none", border: "none", color: C.gold, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, letterSpacing: 1 }}>View all <ChevronRight size={16} /></button>
        </div>
        <div className="ss-grid4">{PRODUCTS.filter((p) => p.badge === "New").concat(PRODUCTS.filter(p=>!p.badge)).slice(0, 4).map((p) => <Card key={p.id} p={p} />)}</div>
      </Section>

      {/* Promo banner */}
      <div style={{ ...satin(160, true), margin: "30px 0" }}>
        <Section style={{ padding: "56px 24px", textAlign: "center" }}>
          <Eyebrow light>The Statement Edit</Eyebrow>
          <h2 style={{ ...serif, color: C.ivory, fontSize: 32, margin: "14px 0" }}>Complimentary delivery within Nairobi</h2>
          <p style={{ ...sans, color: C.dim, maxWidth: 520, margin: "0 auto 24px", fontSize: 15 }}>On every order over KES 5,000. Because a statement should arrive beautifully.</p>
          <GoldBtn onClick={() => go("shop")}>Discover the Edit</GoldBtn>
        </Section>
      </div>

      {/* Best sellers */}
      <Section style={{ padding: "20px 24px 50px" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}><Eyebrow>Loved by our clients</Eyebrow><h2 style={{ ...serif, color: C.ivory, fontSize: 30, marginTop: 8 }}>Best Sellers</h2></div>
        <div className="ss-grid4">{PRODUCTS.filter((p) => p.badge === "Best seller").concat(PRODUCTS.filter(p=>p.rating>=4.8)).slice(0, 4).map((p) => <Card key={p.id} p={p} />)}</div>
      </Section>

      {/* Instagram gallery */}
      <Section style={{ padding: "40px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <Eyebrow>@style_statements__</Eyebrow>
          <h2 style={{ ...serif, color: C.ivory, fontSize: 28, marginTop: 8 }}>Follow the Statement</h2>
        </div>
        <div className="ss-grid6">
          {Array.from({ length: 6 }).map((_, i) => (
            <a key={i} href="https://instagram.com/style_statements__" target="_blank" rel="noreferrer" className="ss-ig" style={{ display: "block" }}>
              <Frame pad={10} len={20} color="rgba(246,243,236,0.5)" style={{ ...satin(120 + i * 12), aspectRatio: "1 / 1", borderRadius: 3, display: "grid", placeItems: "center" }}>
                <Instagram size={22} color="rgba(246,243,236,0.85)" />
              </Frame>
            </a>
          ))}
        </div>
      </Section>

      {/* Newsletter */}
      <div style={{ ...satin(150, true) }}>
        <Section style={{ padding: "60px 24px", textAlign: "center" }}>
          <Eyebrow light>Join the list</Eyebrow>
          <h2 style={{ ...serif, color: C.ivory, fontSize: 30, margin: "14px 0 8px" }}>First access to every drop</h2>
          <p style={{ ...sans, color: C.dim, marginBottom: 22 }}>Early access, private sales, and styling notes.</p>
          <div style={{ display: "flex", gap: 10, maxWidth: 460, margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
            <input placeholder="Your email address" style={{ ...sans, flex: 1, minWidth: 220, background: "rgba(7,12,12,0.4)", border: `1px solid rgba(246,243,236,0.25)`, color: C.ivory, padding: "13px 16px", borderRadius: 2, outline: "none" }} />
            <GoldBtn onClick={() => {}}>Subscribe</GoldBtn>
          </div>
        </Section>
      </div>
    </>
  );

  const Shop = () => (
    <Section style={{ padding: "50px 24px" }}>
      <Eyebrow>The Boutique</Eyebrow>
      <h1 style={{ ...serif, color: C.ivory, fontSize: 36, margin: "10px 0 24px" }}>Shop All</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 30 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(14,95,99,0.18)", border: `1px solid rgba(246,243,236,0.15)`, borderRadius: 2, padding: "10px 14px", flex: 1, minWidth: 220 }}>
          <Search size={16} color={C.dim} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search rings, aviators, perfume…" style={{ ...sans, background: "transparent", border: "none", color: C.ivory, outline: "none", width: "100%" }} />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ ...sans, background: "rgba(14,95,99,0.18)", color: C.ivory, border: `1px solid rgba(246,243,236,0.15)`, borderRadius: 2, padding: "11px 14px", cursor: "pointer" }}>
          <option value="featured">Sort: Featured</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 34 }}>
        {["All", ...Object.keys(CATS)].map((c) => (
          <button key={c} onClick={() => setFilter(c)} style={{ ...sans, cursor: "pointer", padding: "9px 18px", borderRadius: 999, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 600, border: `1px solid ${filter === c ? C.gold : "rgba(246,243,236,0.2)"}`, background: filter === c ? `linear-gradient(135deg, ${C.goldLite}, ${C.gold})` : "transparent", color: filter === c ? C.ink : C.dim }}>{c}</button>
        ))}
      </div>

      {shown.length ? (
        <div className="ss-grid4">{shown.map((p) => <Card key={p.id} p={p} />)}</div>
      ) : (
        <div style={{ textAlign: "center", padding: "60px 0", color: C.dim, ...sans }}>Nothing matches that yet. Try another category or clear your search.</div>
      )}
    </Section>
  );

  const Product = () => {
    if (!product) return null;
    const wished = wish.includes(product.id);
    const related = PRODUCTS.filter((p) => p.cat === product.cat && p.id !== product.id).slice(0, 4);
    return (
      <Section style={{ padding: "36px 24px 60px" }}>
        <button onClick={() => go("shop")} style={{ ...sans, background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 13, letterSpacing: 1, marginBottom: 24, display: "inline-flex", alignItems: "center", gap: 6 }}><ChevronRight size={14} style={{ transform: "rotate(180deg)" }} /> Back to shop</button>
        <div className="ss-detail">
          <ProductVisual name={product.name} sub={product.sub} tall img={product.img} />
          <div>
            <Eyebrow>{product.cat} · {product.sub}</Eyebrow>
            <h1 style={{ ...serif, color: C.ivory, fontSize: 34, margin: "10px 0 8px" }}>{product.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              {Array.from({ length: 5 }).map((_, s) => <Star key={s} size={15} color={C.gold} fill={s < Math.round(product.rating) ? C.gold : "none"} />)}
              <span style={{ ...sans, color: C.dim, fontSize: 13 }}>{product.rating} · {product.reviews} reviews</span>
            </div>
            <div style={{ ...serif, color: C.goldLite, fontSize: 28, marginBottom: 18 }}>{KES(product.price)}</div>
            <p style={{ ...sans, color: C.dim, lineHeight: 1.7, fontSize: 15, marginBottom: 22 }}>{product.desc}</p>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", border: `1px solid rgba(246,243,236,0.25)`, borderRadius: 2 }}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ background: "none", border: "none", color: C.ivory, padding: "10px 14px", cursor: "pointer" }}><Minus size={15} /></button>
                <span style={{ ...sans, color: C.ivory, minWidth: 30, textAlign: "center" }}>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} style={{ background: "none", border: "none", color: C.ivory, padding: "10px 14px", cursor: "pointer" }}><Plus size={15} /></button>
              </div>
              <button onClick={() => toggleWish(product)} style={{ ...sans, display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: `1px solid rgba(246,243,236,0.25)`, color: wished ? C.gold : C.ivory, padding: "11px 18px", borderRadius: 2, cursor: "pointer", fontSize: 12, letterSpacing: 1 }}>
                <Heart size={15} fill={wished ? C.gold : "none"} /> {wished ? "Saved" : "Wishlist"}
              </button>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 30 }}>
              <GoldBtn onClick={() => addToCart(product, qty)}><ShoppingBag size={15} /> Add to Cart</GoldBtn>
              <GhostBtn onClick={() => { addToCart(product, qty); setView("checkout"); setCartOpen(false); }}>Buy Now</GhostBtn>
            </div>

            <div style={{ borderTop: `1px solid rgba(246,243,236,0.12)`, paddingTop: 20 }}>
              <h3 style={{ ...sans, color: C.gold, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Specifications</h3>
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid rgba(246,243,236,0.08)` }}>
                  <span style={{ ...sans, color: C.dim, fontSize: 14 }}>{k}</span>
                  <span style={{ ...sans, color: C.ivory, fontSize: 14, textAlign: "right" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 64 }}>
          <h2 style={{ ...serif, color: C.ivory, fontSize: 26, marginBottom: 24 }}>You may also like</h2>
          <div className="ss-grid4">{related.map((p) => <Card key={p.id} p={p} />)}</div>
        </div>
      </Section>
    );
  };

  const Checkout = () => (
    <Section style={{ padding: "50px 24px", maxWidth: 720 }}>
      <Eyebrow>Almost yours</Eyebrow>
      <h1 style={{ ...serif, color: C.ivory, fontSize: 34, margin: "10px 0 24px" }}>Checkout</h1>
      {cart.length === 0 ? (
        <p style={{ ...sans, color: C.dim }}>Your cart is empty. <button onClick={() => go("shop")} style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", textDecoration: "underline" }}>Continue shopping</button></p>
      ) : (
        <>
          <div style={{ border: `1px solid rgba(246,243,236,0.12)`, borderRadius: 4, padding: 20, marginBottom: 24 }}>
            {cart.map((i) => (
              <div key={i.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", ...sans, color: C.ivory }}>
                <span>{i.name} <span style={{ color: C.dim }}>× {i.qty}</span></span>
                <span style={{ color: C.goldLite }}>{KES(i.price * i.qty)}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid rgba(246,243,236,0.12)`, marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
              <span style={{ ...sans, color: C.dim }}>Subtotal</span>
              <span style={{ ...serif, color: C.goldLite, fontSize: 20 }}>{KES(subtotal)}</span>
            </div>
          </div>
          <div style={{ ...sans, color: C.dim, fontSize: 13, background: "rgba(14,95,99,0.15)", border: `1px dashed rgba(201,162,75,0.4)`, padding: 16, borderRadius: 4, marginBottom: 20 }}>
            Payment placeholders ready for <strong style={{ color: C.goldLite }}>M-Pesa</strong>, card, and cash on delivery — these connect to the backend in the next build phase.
          </div>
          <GoldBtn block onClick={() => { alert("Order flow placeholder — this connects to M-Pesa / payment API in production."); }}>Place Order · {KES(subtotal)}</GoldBtn>
        </>
      )}
    </Section>
  );

  const About = () => (
    <Section style={{ padding: "60px 24px", maxWidth: 760 }}>
      <Eyebrow>Our story</Eyebrow>
      <h1 style={{ ...serif, color: C.ivory, fontSize: 36, margin: "12px 0 20px" }}>Elegance, made accessible</h1>
      <p style={{ ...sans, color: C.dim, lineHeight: 1.8, fontSize: 16, marginBottom: 18 }}>Style Statements began in Nairobi with a simple belief: the right accessory doesn't just complete a look — it announces who you are. We curate jewelry, sunglasses and fragrance for people who lead with confidence and dress with intention.</p>
      <p style={{ ...sans, color: C.dim, lineHeight: 1.8, fontSize: 16 }}>Every piece is chosen for quality you can feel and design that lasts beyond a season. Your style, our statement.</p>
      <div className="ss-grid3" style={{ marginTop: 40 }}>
        {[["Confidence", "Pieces that let you walk in sure of yourself."], ["Exclusivity", "Curated, never mass — small drops, big impact."], ["Simplicity", "Elegance is what's left when nothing is excessive."]].map(([t, d]) => (
          <div key={t} style={{ border: `1px solid rgba(201,162,75,0.25)`, borderRadius: 4, padding: 24 }}>
            <h3 style={{ ...serif, color: C.goldLite, fontSize: 20, marginBottom: 8 }}>{t}</h3>
            <p style={{ ...sans, color: C.dim, fontSize: 14, lineHeight: 1.6 }}>{d}</p>
          </div>
        ))}
      </div>
    </Section>
  );

  const Contact = () => (
    <Section style={{ padding: "60px 24px", maxWidth: 900 }}>
      <div className="ss-detail">
        <div>
          <Eyebrow>Say hello</Eyebrow>
          <h1 style={{ ...serif, color: C.ivory, fontSize: 34, margin: "12px 0 24px" }}>Get in touch</h1>
          {[[MapPin, "Nairobi, Kenya"], [Phone, "0704358866"], [MessageCircle, "WhatsApp: 0704358866"], [Instagram, "@style_statements__"]].map(([Icon, t], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: `1px solid rgba(246,243,236,0.1)` }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, display: "grid", placeItems: "center", background: "rgba(201,162,75,0.15)" }}><Icon size={17} color={C.gold} /></div>
              <span style={{ ...sans, color: C.ivory, fontSize: 15 }}>{t}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{ display: "grid", gap: 12 }}>
            <input placeholder="Full name" style={inp} />
            <input placeholder="Email or phone" style={inp} />
            <textarea placeholder="How can we help?" rows={4} style={{ ...inp, resize: "vertical" }} />
            <GoldBtn block onClick={() => {}}>Send message</GoldBtn>
          </div>
        </div>
      </div>
    </Section>
  );

  const inp = { ...sans, background: "rgba(14,95,99,0.18)", border: `1px solid rgba(246,243,236,0.15)`, color: C.ivory, padding: "13px 16px", borderRadius: 2, outline: "none", width: "100%", boxSizing: "border-box" };

  const isAdmin = user && user.role !== "customer";
  const Account = () => (
    <Section style={{ padding: "56px 24px", maxWidth: 460 }}>
      {!user ? (
        <div style={{ display: "grid", placeItems: "center" }}>
          <AuthForm
            title="Welcome back"
            subtitle="Sign in to shop faster and track orders"
            onLogin={(email, password) => login(email, password)}
            onRegister={(payload) => register(payload)}
            onSuccess={(u) => { if (u && u.role !== "customer") navigate("/admin"); else go("home"); }}
          />
        </div>
      ) : (
        <>
          <Eyebrow>My account</Eyebrow>
          <h1 style={{ ...serif, color: C.ivory, fontSize: 32, margin: "10px 0 6px" }}>Hello, {user.full_name.split(" ")[0]}</h1>
          <p style={{ ...sans, color: C.dim, fontSize: 14, marginBottom: 26 }}>{user.email}</p>
          <div style={{ display: "grid", gap: 12 }}>
            {isAdmin && (
              <button onClick={() => navigate("/admin")} style={{ ...sans, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: `linear-gradient(135deg, ${C.goldLite}, ${C.gold})`, color: C.ink, border: "none", padding: "14px", borderRadius: 2, cursor: "pointer", fontSize: 13, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
                <Package size={15} /> Go to Admin Dashboard
              </button>
            )}
            {[[Package, "My Orders"], [Heart, "Wishlist"], [MapPin, "Saved Addresses"], [UserIcon, "Account Settings"]].map(([Icon, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", border: `1px solid rgba(201,162,75,0.25)`, borderRadius: 6, cursor: "pointer" }}>
                <Icon size={18} color={C.gold} />
                <span style={{ ...sans, color: C.ivory, fontSize: 15 }}>{label}</span>
                <ChevronRight size={16} color={C.dim} style={{ marginLeft: "auto" }} />
              </div>
            ))}
            <button onClick={() => { logout(); go("home"); }} style={{ ...sans, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, background: "transparent", color: C.ivory, border: `1px solid rgba(246,243,236,0.25)`, padding: "13px", borderRadius: 2, cursor: "pointer", fontSize: 13, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </>
      )}
    </Section>
  );

  const nav = [["Home", "home"], ["Shop", "shop"], ["About", "about"], ["Contact", "contact"]];

  return (
    <div style={{ background: C.ink, minHeight: "100vh", ...sans, overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        .ss-card .ss-add:hover, .ss-gold:hover { filter: brightness(1.06); }
        .ss-ghost:hover { border-color: rgba(246,243,236,0.7); }
        .ss-card, .ss-cat, .ss-ig { transition: transform .4s ease; }
        .ss-card:hover, .ss-cat:hover { transform: translateY(-5px); }
        .ss-ig:hover { transform: scale(1.03); }
        .ss-add:hover { background: rgba(201,162,75,0.12); }
        .ss-grid3 { display:grid; grid-template-columns: repeat(3,1fr); gap:20px; }
        .ss-grid4 { display:grid; grid-template-columns: repeat(4,1fr); gap:22px; }
        .ss-grid6 { display:grid; grid-template-columns: repeat(6,1fr); gap:12px; }
        .ss-detail { display:grid; grid-template-columns: 1fr 1fr; gap:44px; align-items:start; }
        .ss-rise { animation: rise .9s ease both; }
        @keyframes rise { from{opacity:0; transform:translateY(18px);} to{opacity:1; transform:none;} }
        @media (max-width: 900px){
          .ss-grid4 { grid-template-columns: repeat(2,1fr); }
          .ss-grid3 { grid-template-columns: 1fr; }
          .ss-grid6 { grid-template-columns: repeat(3,1fr); }
          .ss-detail { grid-template-columns: 1fr; }
          .ss-navlinks { display: none !important; }
          .ss-burger { display: grid !important; }
        }
        @media (max-width: 560px){
          .ss-grid4 { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce){
          .ss-card, .ss-cat, .ss-ig, .ss-rise { transition:none; animation:none; }
        }
      `}</style>

      {/* NAV */}
      <header style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(7,12,12,0.85)", backdropFilter: "blur(12px)", borderBottom: `1px solid rgba(201,162,75,0.18)` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <button onClick={() => go("home")} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
            <div style={{ ...serif, color: C.ivory, fontSize: 20, letterSpacing: 4, lineHeight: 1 }}>STYLE</div>
            <div style={{ ...sans, color: C.gold, fontSize: 9, letterSpacing: 6 }}>STATEMENTS</div>
          </button>

          <nav className="ss-navlinks" style={{ display: "flex", gap: 30 }}>
            {nav.map(([label, v]) => (
              <button key={v} onClick={() => go(v)} style={{ ...sans, background: "none", border: "none", cursor: "pointer", fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", color: view === v ? C.gold : C.dim, fontWeight: 600, paddingBottom: 4, borderBottom: view === v ? `1px solid ${C.gold}` : "1px solid transparent" }}>{label}</button>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => go("shop")} aria-label="Search" style={ic}><Search size={19} color={C.ivory} /></button>
            <button onClick={() => go("shop")} aria-label="Wishlist" style={{ ...ic, position: "relative" }}>
              <Heart size={19} color={C.ivory} />
              {wish.length > 0 && <Badge n={wish.length} />}
            </button>
            <button onClick={() => setCartOpen(true)} aria-label="Cart" style={{ ...ic, position: "relative" }}>
              <ShoppingBag size={19} color={C.ivory} />
              {cartCount > 0 && <Badge n={cartCount} />}
            </button>
            <button onClick={() => go("account")} aria-label="Account" style={{ ...ic, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <UserIcon size={19} color={view === "account" ? C.gold : C.ivory} />
              {user && <span style={{ ...sans, color: view === "account" ? C.gold : C.ivory, fontSize: 12.5, fontWeight: 600 }}>{user.full_name.split(" ")[0]}</span>}
            </button>
            <button className="ss-burger" onClick={() => setMenuOpen((m) => !m)} aria-label="Menu" style={{ ...ic, display: "none" }}>{menuOpen ? <X size={20} color={C.ivory} /> : <Menu size={20} color={C.ivory} />}</button>
          </div>
        </div>
        {menuOpen && (
          <div style={{ borderTop: `1px solid rgba(201,162,75,0.15)`, padding: "10px 24px 16px" }}>
            {nav.map(([label, v]) => (
              <button key={v} onClick={() => go(v)} style={{ ...sans, display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "12px 0", color: view === v ? C.gold : C.ivory, fontSize: 15, letterSpacing: 1 }}>{label}</button>
            ))}
          </div>
        )}
      </header>

      {/* VIEWS */}
      {view === "home" && <Home />}
      {view === "shop" && <Shop />}
      {view === "product" && <Product />}
      {view === "about" && <About />}
      {view === "contact" && <Contact />}
      {view === "checkout" && <Checkout />}
      {view === "account" && <Account />}

      {/* FOOTER */}
      <footer style={{ ...satin(150, true), marginTop: 40, borderTop: `1px solid rgba(201,162,75,0.2)` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "50px 24px 30px" }}>
          <div className="ss-grid4" style={{ gap: 30 }}>
            <div>
              <div style={{ ...serif, color: C.ivory, fontSize: 22, letterSpacing: 4 }}>STYLE</div>
              <div style={{ ...sans, color: C.gold, fontSize: 10, letterSpacing: 6, marginBottom: 14 }}>STATEMENTS</div>
              <p style={{ ...script, fontStyle: "italic", color: C.goldLite, fontSize: 18 }}>Your Style, Our Statement.</p>
            </div>
            <FooterCol title="Shop" items={Object.keys(CATS)} onClick={(c) => { setFilter(c); go("shop"); }} />
            <FooterCol title="Company" items={["About", "Contact"]} onClick={(t) => go(t.toLowerCase())} />
            <div>
              <h4 style={{ ...sans, color: C.gold, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Reach us</h4>
              {[[MapPin, "Nairobi, Kenya"], [Phone, "0704358866"], [Instagram, "@style_statements__"]].map(([Icon, t], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, ...sans, color: C.dim, fontSize: 13 }}><Icon size={15} color={C.gold} /> {t}</div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: `1px solid rgba(246,243,236,0.12)`, marginTop: 30, paddingTop: 20, ...sans, color: C.dim, fontSize: 12, textAlign: "center" }}>© {new Date().getFullYear()} Style Statements · Nairobi, Kenya</div>
        </div>
      </footer>

      {/* CART DRAWER */}
      {cartOpen && <div onClick={() => setCartOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(7,12,12,0.6)", zIndex: 60 }} />}
      <aside style={{ position: "fixed", top: 0, right: 0, height: "100%", width: 380, maxWidth: "90vw", background: C.tealDeep, zIndex: 70, transform: cartOpen ? "translateX(0)" : "translateX(102%)", transition: "transform .35s ease", boxShadow: "-20px 0 60px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 20, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid rgba(246,243,236,0.12)` }}>
          <span style={{ ...serif, color: C.ivory, fontSize: 20 }}>Your Cart ({cartCount})</span>
          <button onClick={() => setCartOpen(false)} style={ic}><X size={20} color={C.ivory} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {cart.length === 0 ? (
            <p style={{ ...sans, color: C.dim, textAlign: "center", marginTop: 40 }}>Your cart is empty.</p>
          ) : cart.map((i) => (
            <div key={i.id} style={{ display: "flex", gap: 12, marginBottom: 18, borderBottom: `1px solid rgba(246,243,236,0.08)`, paddingBottom: 18 }}>
              <div style={{ width: 64, height: 64, borderRadius: 3, flexShrink: 0, ...satin(120) }} />
              <div style={{ flex: 1 }}>
                <div style={{ ...serif, color: C.ivory, fontSize: 15 }}>{i.name}</div>
                <div style={{ ...sans, color: C.goldLite, fontSize: 13, margin: "4px 0" }}>{KES(i.price)}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", border: `1px solid rgba(246,243,236,0.2)`, borderRadius: 2 }}>
                    <button onClick={() => setLine(i.id, i.qty - 1)} style={{ background: "none", border: "none", color: C.ivory, padding: "4px 8px", cursor: "pointer" }}><Minus size={12} /></button>
                    <span style={{ ...sans, color: C.ivory, fontSize: 13, minWidth: 22, textAlign: "center" }}>{i.qty}</span>
                    <button onClick={() => setLine(i.id, i.qty + 1)} style={{ background: "none", border: "none", color: C.ivory, padding: "4px 8px", cursor: "pointer" }}><Plus size={12} /></button>
                  </div>
                  <button onClick={() => removeLine(i.id)} style={{ ...sans, background: "none", border: "none", color: C.dim, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div style={{ padding: 20, borderTop: `1px solid rgba(246,243,236,0.12)` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ ...sans, color: C.dim, letterSpacing: 1, textTransform: "uppercase", fontSize: 12 }}>Subtotal</span>
              <span style={{ ...serif, color: C.goldLite, fontSize: 20 }}>{KES(subtotal)}</span>
            </div>
            <GoldBtn block onClick={() => { setCartOpen(false); setView("checkout"); window.scrollTo({ top: 0 }); }}>Checkout</GoldBtn>
          </div>
        )}
      </aside>

      {/* FLOATING WHATSAPP */}
      <a href="https://wa.me/254704358866" target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"
        style={{ position: "fixed", bottom: 22, right: 22, zIndex: 50, width: 56, height: 56, borderRadius: 999, background: "#25D366", display: "grid", placeItems: "center", boxShadow: "0 10px 30px rgba(37,211,102,0.4)", textDecoration: "none" }}>
        <MessageCircle size={26} color="#fff" fill="#fff" />
      </a>
    </div>
  );

  function Badge({ n }) {
    return <span style={{ position: "absolute", top: -6, right: -8, background: C.gold, color: C.ink, borderRadius: 999, minWidth: 17, height: 17, fontSize: 10, fontWeight: 700, display: "grid", placeItems: "center", padding: "0 4px", ...sans }}>{n}</span>;
  }
  function FooterCol({ title, items, onClick }) {
    return (
      <div>
        <h4 style={{ ...sans, color: C.gold, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>{title}</h4>
        {items.map((it) => (
          <button key={it} onClick={() => onClick(it)} style={{ ...sans, display: "block", background: "none", border: "none", color: C.dim, cursor: "pointer", padding: "5px 0", fontSize: 13, textAlign: "left" }}>{it}</button>
        ))}
      </div>
    );
  }
}

const ic = { background: "none", border: "none", cursor: "pointer", padding: 4, display: "grid", placeItems: "center" };
