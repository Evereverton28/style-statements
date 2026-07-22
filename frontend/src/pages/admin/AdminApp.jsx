import React, { useState, useMemo, useEffect } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Megaphone, Star,
  BarChart3, MessageSquare, FileText, ShieldCheck, Settings as Cog,
  Search, Bell, Plus, Pencil, Trash2, X, TrendingUp, TrendingDown,
  AlertTriangle, DollarSign, Eye, Percent, Check, Menu, LogOut, Filter, Sun, Moon,
} from "lucide-react";
import { authService } from "../../services/authService";
import { productService } from "../../services/productService";
import { orderService } from "../../services/orderService";
import { api } from "../../services/api";
import AuthForm from "../../components/auth/AuthForm";
import { useTheme } from "../../context/ThemeContext";

/* ---------- API <-> UI mapping (backend uses snake_case statuses) ---------- */
const STATUS_DISPLAY = {
  pending: "Pending", processing: "Processing", ready_for_delivery: "Ready for Delivery",
  delivered: "Delivered", cancelled: "Cancelled", refund_requested: "Refund", refunded: "Refunded",
};
const STATUS_API = Object.fromEntries(Object.entries(STATUS_DISPLAY).map(([k, v]) => [v, k]));
const REVIEW_DISPLAY = { pending: "Pending", approved: "Approved", rejected: "Rejected" };

const mapApiProduct = (p) => ({ id: p.id, name: p.name, cat: p.category, price: p.price, stock: p.stock, status: "Active" });
const mapApiOrder = (o) => ({ id: o.order_number, apiId: o.id, customer: o.customer, total: o.total, status: STATUS_DISPLAY[o.status] || o.status, date: (o.placed_at || "").slice(5, 10), items: o.item_count });
const mapApiReview = (r) => ({ id: r.id, product: r.product_id, author: r.author, rating: r.rating, text: r.body, status: REVIEW_DISPLAY[r.status] || r.status });

/* ---------- Brand tokens (shared with the storefront) ---------- */
/* ---------- Brand tokens → CSS variables (themeable) ---------- */
const C = {
  teal: "var(--ss-teal)", tealDeep: "var(--ss-teal-deep)", tealBright: "var(--ss-teal-bright)",
  panel: "var(--ss-panel)", panel2: "var(--ss-panel2)", cyan: "var(--ss-cyan)",
  gold: "var(--ss-gold)", goldLite: "var(--ss-gold-lite)", ink: "var(--ss-ink)",
  ivory: "var(--ss-ivory)", dim: "var(--ss-dim)", line: "var(--ss-line)",
  green: "var(--ss-green)", red: "var(--ss-red)", amber: "var(--ss-amber)",
  bg: "var(--ss-bg)", topbar: "var(--ss-topbar)",
};
const serif = { fontFamily: "'Playfair Display', Georgia, serif" };
const sans = { fontFamily: "'Inter', system-ui, sans-serif" };
const KES = (n) => "KES " + Number(n).toLocaleString("en-KE");

/* ---------- Role permissions ---------- */
const ROLES = {
  "Super Admin": ["dashboard", "products", "orders", "customers", "marketing", "reviews", "analytics", "messages", "content", "users", "settings"],
  Manager: ["dashboard", "products", "orders", "customers", "marketing", "reviews", "analytics", "messages", "content"],
  Staff: ["dashboard", "products", "orders", "reviews", "messages"],
};

const NAV = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["products", "Products", Package],
  ["orders", "Orders", ShoppingCart],
  ["customers", "Customers", Users],
  ["marketing", "Marketing", Megaphone],
  ["reviews", "Reviews", Star],
  ["analytics", "Analytics", BarChart3],
  ["messages", "Messages", MessageSquare],
  ["content", "Content", FileText],
  ["users", "Users & Roles", ShieldCheck],
  ["settings", "Settings", Cog],
];

/* ---------- Starting state: everything empty (real data comes from the API) ---------- */
const seedProducts = [];
const seedOrders = [];
const seedReviews = [];
const seedCoupons = [];
const seedMessages = [];

// Charts start flat/empty; they fill in as real orders and visits arrive.
const revenueData = [];
const catData = [];
const trafficData = [];
const PIE = [C.gold, C.cyan, C.tealBright, C.goldLite];

/* =================================================================== */
export default function Admin() {
  const [role, setRole] = useState("Super Admin");
  const [section, setSection] = useState("dashboard");
  const [sidebar, setSidebar] = useState(() => (typeof window !== "undefined" ? window.innerWidth > 900 : true));
  const [products, setProducts] = useState(seedProducts);
  const [orders, setOrders] = useState(seedOrders);
  const [reviews, setReviews] = useState(seedReviews);
  const [coupons, setCoupons] = useState(seedCoupons);
  const [modal, setModal] = useState(null); // {mode, product}
  const [orderTab, setOrderTab] = useState("All");
  const [pq, setPq] = useState("");
  const { isLight, toggle } = useTheme();

  // ---- live backend integration ----
  const seededUser = authService.currentUser();
  const [authed, setAuthed] = useState(!!seededUser && seededUser.role !== "customer");
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    if (!authed) return;
    let alive = true;
    // Public catalog
    productService.list().then((list) => {
      if (alive && list.length) setProducts(list.map((p) => ({ id: p.id, name: p.name, cat: p.cat, price: p.price, stock: p.stock, status: "Active" })));
    }).catch(() => {});
    // Admin-only data (needs a valid admin JWT)
    orderService.allOrders().then((d) => { if (alive && d.orders) { setOrders(d.orders.map(mapApiOrder)); setApiOnline(true); } }).catch(() => {});
    api.get("/api/admin/reviews", true).then((d) => { if (alive && d.reviews) setReviews(d.reviews.map(mapApiReview)); }).catch(() => {});
    api.get("/api/customers", true).then((d) => {
      if (alive && d.customers) setCustomers(d.customers.map((c) => ({
        name: c.full_name, email: c.email, orders: c.orders,
        spent: Math.round((c.lifetime_spend_cents || 0) / 100),
        tier: c.orders >= 5 ? "VIP" : c.orders >= 2 ? "Returning" : "New",
      })));
    }).catch(() => {});
    orderService.analyticsSummary().then((s) => { if (alive) setSummary(s); }).catch(() => {});
    return () => { alive = false; };
  }, [authed]);

  const allowed = ROLES[role];
  const canSee = (s) => allowed.includes(s);
  // redirect if current section not allowed for role
  const view = canSee(section) ? section : "dashboard";

  /* ---------- shared UI ---------- */
  const Panel = ({ children, style, pad = 20 }) => (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: pad, ...style }}>{children}</div>
  );
  const H = ({ children }) => <h1 style={{ ...serif, color: C.ivory, fontSize: 26, margin: 0 }}>{children}</h1>;
  const Sub = ({ children }) => <p style={{ ...sans, color: C.dim, fontSize: 13, margin: "4px 0 22px" }}>{children}</p>;
  const Btn = ({ children, onClick, ghost }) => (
    <button onClick={onClick} style={{ ...sans, display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 12.5, fontWeight: 600, letterSpacing: .5, padding: "9px 15px", borderRadius: 6, border: ghost ? `1px solid ${C.line}` : "none", background: ghost ? "transparent" : `linear-gradient(135deg, ${C.goldLite}, ${C.gold})`, color: ghost ? C.ivory : C.ink }}>{children}</button>
  );
  const Pill = ({ status }) => {
    const map = { Active: C.green, Approved: C.green, Delivered: C.green, Pending: C.amber, Processing: C.cyan, "Ready for Delivery": C.gold, Scheduled: C.cyan, Cancelled: C.red, Rejected: C.red, Low: C.red };
    const c = map[status] || C.dim;
    return <span style={{ ...sans, fontSize: 11, fontWeight: 600, color: c, background: c + "22", border: `1px solid ${c}44`, padding: "3px 10px", borderRadius: 999 }}>{status}</span>;
  };

  /* ---------- KPI card ---------- */
  const KPI = ({ icon: Icon, label, value, delta, up }) => (
    <Panel>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(201,162,75,0.14)", display: "grid", placeItems: "center" }}><Icon size={19} color={C.gold} /></div>
        <span style={{ ...sans, fontSize: 12, fontWeight: 600, color: up ? C.green : C.red, display: "inline-flex", alignItems: "center", gap: 3 }}>{up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{delta}</span>
      </div>
      <div style={{ ...serif, color: C.ivory, fontSize: 25, marginTop: 14 }}>{value}</div>
      <div style={{ ...sans, color: C.dim, fontSize: 12, letterSpacing: .5, marginTop: 2 }}>{label}</div>
    </Panel>
  );

  const tooltipStyle = { background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 8, color: C.ivory, fontFamily: "Inter, sans-serif", fontSize: 12 };

  /* ---------- Dashboard ---------- */
  const Dashboard = () => (
    <>
      <H>Good morning</H><Sub>Here's how Style Statements is performing today.</Sub>
      <div className="ss-kpi">
        <KPI icon={DollarSign} label="Revenue" value={summary ? KES(Math.round(summary.revenue_cents / 100)) : KES(0)} delta="—" up />
        <KPI icon={ShoppingCart} label="Orders" value={summary ? String(summary.orders) : "0"} delta="—" up />
        <KPI icon={Eye} label="Visitors (30d)" value="0" delta="—" up />
        <KPI icon={Users} label="Customers" value={summary ? String(summary.customers) : "0"} delta="—" up />
        <KPI icon={Percent} label="Conversion" value="0%" delta="—" up />
        <KPI icon={TrendingUp} label="Avg Order Value" value={summary ? KES(Math.round(summary.avg_order_value_cents / 100)) : KES(0)} delta="—" up />
      </div>

      <div className="ss-two" style={{ marginTop: 18 }}>
        <Panel>
          <PanelHead title="Revenue" note="Last 7 months · KES '000" />
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData} margin={{ left: -18, top: 10 }}>
              <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.gold} stopOpacity={0.5} /><stop offset="100%" stopColor={C.gold} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey="m" stroke={C.dim} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={C.dim} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="rev" stroke={C.gold} strokeWidth={2} fill="url(#g)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
        <Panel>
          <PanelHead title="Traffic sources" note="Where visitors come from" />
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={trafficData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82} paddingAngle={3}>
                {trafficData.map((e, i) => <Cell key={i} fill={PIE[i]} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", marginTop: 6 }}>
            {trafficData.map((t, i) => <span key={i} style={{ ...sans, fontSize: 11.5, color: C.dim, display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: PIE[i] }} />{t.name} {t.value}%</span>)}
          </div>
        </Panel>
      </div>

      <div className="ss-two" style={{ marginTop: 18 }}>
        <Panel>
          <PanelHead title="Recent orders" note="Latest activity" action={() => setSection("orders")} actionLabel="View all" />
          <Table cols={["Order", "Customer", "Total", "Status"]}>
            {orders.slice(0, 5).map((o) => (
              <tr key={o.id}>
                <Td><span style={{ color: C.gold }}>{o.id}</span></Td>
                <Td>{o.customer}</Td><Td>{KES(o.total)}</Td><Td><Pill status={o.status} /></Td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel>
          <PanelHead title="Low stock alerts" note="Restock soon" action={() => setSection("products")} actionLabel="Inventory" />
          {products.filter((p) => p.stock <= 5).map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${C.line}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AlertTriangle size={16} color={C.red} />
                <span style={{ ...sans, color: C.ivory, fontSize: 13.5 }}>{p.name}</span>
              </div>
              <span style={{ ...sans, color: C.red, fontSize: 12.5, fontWeight: 600 }}>{p.stock} left</span>
            </div>
          ))}
        </Panel>
      </div>
    </>
  );

  const PanelHead = ({ title, note, action, actionLabel }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
      <div><div style={{ ...serif, color: C.ivory, fontSize: 17 }}>{title}</div>{note && <div style={{ ...sans, color: C.dim, fontSize: 11.5, marginTop: 2 }}>{note}</div>}</div>
      {action && <button onClick={action} style={{ ...sans, background: "none", border: "none", color: C.gold, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>{actionLabel}</button>}
    </div>
  );
  const Table = ({ cols, children }) => (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead><tr>{cols.map((c) => <th key={c} style={{ ...sans, textAlign: "left", color: C.dim, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, padding: "0 10px 10px 0", borderBottom: `1px solid ${C.line}` }}>{c}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
  const Td = ({ children }) => <td style={{ ...sans, color: C.ivory, fontSize: 13, padding: "12px 10px 12px 0", borderBottom: `1px solid ${C.line}` }}>{children}</td>;

  /* ---------- Products ---------- */
  const saveProduct = (data) => {
    const payload = { name: data.name, category: data.cat, price_cents: Math.round(+data.price * 100), stock: +data.stock };
    if (data.id) {
      setProducts((ps) => ps.map((p) => (p.id === data.id ? { ...p, ...data, price: +data.price, stock: +data.stock } : p)));
      api.put(`/api/products/${data.id}`, payload, true).catch(() => {});
    } else {
      const tempId = "tmp-" + Date.now();
      setProducts((ps) => [...ps, { ...data, id: tempId, price: +data.price, stock: +data.stock, status: "Active" }]);
      api.post("/api/products", payload, true)
        .then((r) => r.product && setProducts((ps) => ps.map((p) => (p.id === tempId ? mapApiProduct(r.product) : p))))
        .catch(() => {});
    }
    setModal(null);
  };
  const deleteProduct = (id) => {
    setProducts((ps) => ps.filter((x) => x.id !== id));
    api.del(`/api/products/${id}`, true).catch(() => {});
  };
  const Products = () => {
    const list = products.filter((p) => (p.name + p.cat).toLowerCase().includes(pq.toLowerCase()));
    const readOnly = role === "Staff";
    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div><H>Products</H><Sub>{products.length} products · {products.filter(p=>p.stock<=5).length} low on stock{readOnly ? " · view only for Staff" : ""}</Sub></div>
          {!readOnly && <Btn onClick={() => setModal({ mode: "add", product: { name: "", cat: "Jewelry", price: "", stock: "" } })}><Plus size={15} /> Add Product</Btn>}
        </div>
        <Panel pad={0}>
          <div style={{ padding: 16, display: "flex", gap: 10, borderBottom: `1px solid ${C.line}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 6, padding: "8px 12px", flex: 1 }}>
              <Search size={15} color={C.dim} />
              <input value={pq} onChange={(e) => setPq(e.target.value)} placeholder="Search products…" style={{ ...sans, background: "none", border: "none", color: C.ivory, outline: "none", width: "100%", fontSize: 13 }} />
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <Table cols={["Product", "Category", "Price", "Stock", "Status", ""]}>
              {list.map((p) => (
                <tr key={p.id}>
                  <Td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 34, height: 34, borderRadius: 5, background: `linear-gradient(135deg, ${C.tealBright}, ${C.tealDeep})` }} />{p.name}</div></Td>
                  <Td>{p.cat}</Td><Td>{KES(p.price)}</Td>
                  <Td><span style={{ color: p.stock <= 5 ? C.red : C.ivory }}>{p.stock}</span></Td>
                  <Td><Pill status={p.stock <= 5 ? "Low" : p.status} /></Td>
                  <Td>
                    {!readOnly && <div style={{ display: "flex", gap: 6 }}>
                      <IconBtn onClick={() => setModal({ mode: "edit", product: p })}><Pencil size={14} color={C.dim} /></IconBtn>
                      <IconBtn onClick={() => deleteProduct(p.id)}><Trash2 size={14} color={C.red} /></IconBtn>
                    </div>}
                  </Td>
                </tr>
              ))}
            </Table>
          </div>
        </Panel>
      </>
    );
  };
  const IconBtn = ({ children, onClick }) => <button onClick={onClick} style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 6, padding: 7, cursor: "pointer", display: "grid", placeItems: "center" }}>{children}</button>;

  /* ---------- Orders ---------- */
  const stages = ["All", "Pending", "Processing", "Ready for Delivery", "Delivered", "Cancelled"];
  const Orders = () => {
    const list = orders.filter((o) => orderTab === "All" || o.status === orderTab);
    const setStatus = (order, s) => {
      setOrders((os) => os.map((o) => (o.id === order.id ? { ...o, status: s } : o)));
      if (order.apiId && STATUS_API[s]) orderService.updateStatus(order.apiId, STATUS_API[s]).catch(() => {});
    };
    return (
      <>
        <H>Orders</H><Sub>Manage the full fulfilment pipeline.</Sub>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {stages.map((s) => (
            <button key={s} onClick={() => setOrderTab(s)} style={{ ...sans, cursor: "pointer", fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 999, border: `1px solid ${orderTab === s ? C.gold : C.line}`, background: orderTab === s ? "rgba(201,162,75,0.15)" : "transparent", color: orderTab === s ? C.gold : C.dim }}>{s}{s !== "All" && ` · ${orders.filter(o=>o.status===s).length}`}</button>
          ))}
        </div>
        <Panel pad={16}>
          <Table cols={["Order", "Customer", "Items", "Total", "Date", "Status", "Update"]}>
            {list.map((o) => (
              <tr key={o.id}>
                <Td><span style={{ color: C.gold }}>{o.id}</span></Td>
                <Td>{o.customer}</Td><Td>{o.items}</Td><Td>{KES(o.total)}</Td><Td>{o.date}</Td>
                <Td><Pill status={o.status} /></Td>
                <Td>
                  <select value={o.status} onChange={(e) => setStatus(o, e.target.value)} style={{ ...sans, background: C.panel2, color: C.ivory, border: `1px solid ${C.line}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}>
                    {stages.slice(1).map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Td>
              </tr>
            ))}
          </Table>
        </Panel>
      </>
    );
  };

  /* ---------- Customers (loaded from /api/customers) ---------- */
  const Customers = () => (
    <>
      <H>Customers</H><Sub>{customers.length} customers · order history & profiles.</Sub>
      <Panel pad={16}>
        <Table cols={["Customer", "Email", "Orders", "Lifetime spend", "Tier"]}>
          {customers.map((c) => (
            <tr key={c.email}>
              <Td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={c.name} />{c.name}</div></Td>
              <Td><span style={{ color: C.dim }}>{c.email}</span></Td><Td>{c.orders}</Td><Td>{KES(c.spent)}</Td>
              <Td><Pill status={c.tier === "VIP" ? "Active" : c.tier === "New" ? "Processing" : "Scheduled"} /></Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
  const Avatar = ({ name }) => <div style={{ width: 32, height: 32, borderRadius: 999, background: `linear-gradient(135deg, ${C.gold}, ${C.tealBright})`, display: "grid", placeItems: "center", ...sans, color: C.ink, fontSize: 12, fontWeight: 700 }}>{name[0]}</div>;

  /* ---------- Reviews ---------- */
  const setReview = (id, status) => {
    setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    const apiStatus = status.toLowerCase();
    api.patch(`/api/admin/reviews/${id}`, { status: apiStatus }, true).catch(() => {});
  };
  const removeReview = (id) => {
    setReviews((rs) => rs.filter((x) => x.id !== id));
    api.del(`/api/admin/reviews/${id}`, true).catch(() => {});
  };
  const Reviews = () => (
    <>
      <H>Reviews</H><Sub>Approve, reject, or remove customer reviews.</Sub>
      <div style={{ display: "grid", gap: 12 }}>
        {reviews.map((r) => (
          <Panel key={r.id}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ ...sans, color: C.ivory, fontWeight: 600, fontSize: 14 }}>{r.author}</span>
                  <span style={{ display: "flex", gap: 2 }}>{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} color={C.gold} fill={i < r.rating ? C.gold : "none"} />)}</span>
                  <Pill status={r.status} />
                </div>
                <div style={{ ...sans, color: C.dim, fontSize: 12, marginBottom: 4 }}>on {r.product}</div>
                <p style={{ ...sans, color: C.ivory, fontSize: 13.5, margin: 0 }}>{r.text}</p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <IconBtn onClick={() => setReview(r.id, "Approved")}><Check size={15} color={C.green} /></IconBtn>
                <IconBtn onClick={() => setReview(r.id, "Rejected")}><X size={15} color={C.amber} /></IconBtn>
                <IconBtn onClick={() => removeReview(r.id)}><Trash2 size={15} color={C.red} /></IconBtn>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );

  /* ---------- Marketing ---------- */
  const Marketing = () => (
    <>
      <H>Marketing</H><Sub>Coupons, flash sales, banners & featured products.</Sub>
      <div className="ss-two">
        <Panel>
          <PanelHead title="Coupons" note="Active discount codes" action={() => setCoupons((c) => [...c, { id: Date.now(), code: "NEW" + Math.floor(Math.random()*90+10), type: "10% off", uses: 0, status: "Scheduled" }])} actionLabel="+ New coupon" />
          <Table cols={["Code", "Type", "Uses", "Status"]}>
            {coupons.map((c) => (
              <tr key={c.id}><Td><span style={{ color: C.gold, fontFamily: "monospace" }}>{c.code}</span></Td><Td>{c.type}</Td><Td>{c.uses}</Td><Td><Pill status={c.status} /></Td></tr>
            ))}
          </Table>
        </Panel>
        <div style={{ display: "grid", gap: 12 }}>
          <Panel>
            <PanelHead title="Homepage banner" note="Live now" />
            <div style={{ borderRadius: 8, padding: 22, background: `linear-gradient(135deg, ${C.tealBright}, ${C.tealDeep})`, textAlign: "center" }}>
              <div style={{ ...serif, color: C.ivory, fontSize: 18 }}>Complimentary delivery within Nairobi</div>
              <div style={{ ...sans, color: C.goldLite, fontSize: 12, marginTop: 4 }}>On orders over KES 5,000</div>
            </div>
            <Btn ghost onClick={() => {}} ><Pencil size={13} /> Edit banner</Btn>
          </Panel>
          <Panel>
            <PanelHead title="Flash sale" note="None scheduled" />
            <div style={{ ...sans, color: C.dim, fontSize: 13 }}>No flash sale scheduled yet.</div>
          </Panel>
        </div>
      </div>
    </>
  );

  /* ---------- Analytics ---------- */
  const Analytics = () => (
    <>
      <H>Analytics</H><Sub>Sales performance & customer behaviour.</Sub>
      <div className="ss-kpi" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <KPI icon={DollarSign} label="Daily sales" value={KES(0)} delta="—" up />
        <KPI icon={TrendingUp} label="Monthly sales" value={summary ? KES(Math.round(summary.revenue_cents / 100)) : KES(0)} delta="—" up />
        <KPI icon={Users} label="Returning customers" value="0%" delta="—" up />
        <KPI icon={ShoppingCart} label="Avg order value" value={summary ? KES(Math.round(summary.avg_order_value_cents / 100)) : KES(0)} delta="—" up />
      </div>
      <div className="ss-two" style={{ marginTop: 18 }}>
        <Panel>
          <PanelHead title="Best selling categories" note="Units sold" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={catData} margin={{ left: -18, top: 10 }}>
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey="name" stroke={C.dim} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={C.dim} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(201,162,75,0.08)" }} />
              <Bar dataKey="sales" radius={[6, 6, 0, 0]}>{catData.map((e, i) => <Cell key={i} fill={PIE[i]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel>
          <PanelHead title="Revenue trend" note="Monthly, KES '000" />
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData} margin={{ left: -18, top: 10 }}>
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey="m" stroke={C.dim} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={C.dim} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="rev" stroke={C.gold} strokeWidth={2.5} dot={{ fill: C.gold, r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </>
  );

  /* ---------- Messages ---------- */
  const Messages = () => (
    <>
      <H>Messages</H><Sub>Contact form, WhatsApp orders & enquiries in one inbox.</Sub>
      <div style={{ display: "grid", gap: 12 }}>
        {seedMessages.map((m) => (
          <Panel key={m.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <Avatar name={m.name} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ ...sans, color: C.ivory, fontWeight: 600, fontSize: 14 }}>{m.name}</span>
                    <span style={{ ...sans, fontSize: 10.5, color: C.cyan, background: "rgba(37,194,199,0.14)", padding: "2px 8px", borderRadius: 999 }}>{m.channel}</span>
                  </div>
                  <p style={{ ...sans, color: C.dim, fontSize: 13, margin: "6px 0 0", maxWidth: 620 }}>{m.text}</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <span style={{ ...sans, color: C.dim, fontSize: 11 }}>{m.time}</span>
                <Btn ghost onClick={() => {}}>Reply</Btn>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );

  /* ---------- Content / Users / Settings ---------- */
  const Field = ({ label, value, area }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ ...sans, color: C.dim, fontSize: 12, display: "block", marginBottom: 6 }}>{label}</label>
      {area
        ? <textarea defaultValue={value} rows={3} style={inp} />
        : <input defaultValue={value} style={inp} />}
    </div>
  );
  const inp = { ...sans, width: "100%", boxSizing: "border-box", background: C.panel2, border: `1px solid ${C.line}`, color: C.ivory, borderRadius: 6, padding: "10px 12px", fontSize: 13, outline: "none" };

  const Content = () => (
    <>
      <H>Website Content</H><Sub>Edit page copy without touching code.</Sub>
      <div className="ss-two">
        <Panel><PanelHead title="Homepage" /><Field label="Hero tagline" value="Your Style, Our Statement." /><Field label="Promo banner" value="Complimentary delivery within Nairobi" /><Btn onClick={() => {}}>Save changes</Btn></Panel>
        <Panel><PanelHead title="About" /><Field label="Story" area value="Style Statements began in Nairobi with a simple belief…" /><Btn onClick={() => {}}>Save changes</Btn></Panel>
        <Panel><PanelHead title="Contact" /><Field label="Phone" value="0704358866" /><Field label="Instagram" value="@style_statements__" /><Btn onClick={() => {}}>Save changes</Btn></Panel>
        <Panel><PanelHead title="Policies & FAQs" /><Field label="Returns policy" area value="Items may be returned within 7 days…" /><Btn onClick={() => {}}>Save changes</Btn></Panel>
      </div>
    </>
  );

  const UsersRoles = () => (
    <>
      <H>Users & Roles</H><Sub>Team access with role-based permissions.</Sub>
      <Panel pad={16}>
        <Table cols={["Member", "Email", "Role", "Access"]}>
          {[["Shine", "owner@stylestatements.co.ke", "Super Admin"], ["Store Manager", "manager@stylestatements.co.ke", "Manager"], ["Sales Staff", "staff@stylestatements.co.ke", "Staff"]].map(([n, e, r]) => (
            <tr key={e}>
              <Td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={n} />{n}</div></Td>
              <Td><span style={{ color: C.dim }}>{e}</span></Td>
              <Td><Pill status={r === "Super Admin" ? "Active" : r === "Manager" ? "Scheduled" : "Processing"} /></Td>
              <Td><span style={{ ...sans, color: C.dim, fontSize: 12 }}>{ROLES[r].length} sections</span></Td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );

  const SettingsView = () => (
    <>
      <H>Settings</H><Sub>Store configuration, payments & security.</Sub>
      <div className="ss-two">
        <Panel><PanelHead title="Store details" /><Field label="Store name" value="Style Statements" /><Field label="Location" value="Nairobi, Kenya" /><Field label="Currency" value="KES (Kenyan Shilling)" /></Panel>
        <Panel><PanelHead title="Payment methods" note="Placeholders — connect in backend phase" />
          {[["M-Pesa (Daraja STK Push)", true], ["Card payments", false], ["Cash on delivery", true]].map(([m, on]) => (
            <div key={m} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.line}` }}>
              <span style={{ ...sans, color: C.ivory, fontSize: 13 }}>{m}</span>
              <span style={{ ...sans, fontSize: 11, color: on ? C.green : C.dim, background: (on ? C.green : C.dim) + "22", padding: "3px 10px", borderRadius: 999 }}>{on ? "Enabled" : "Not connected"}</span>
            </div>
          ))}
        </Panel>
        <Panel><PanelHead title="Shipping & taxes" /><Field label="Nairobi delivery fee" value="KES 300 (free over 5,000)" /><Field label="VAT" value="16%" /></Panel>
        <Panel><PanelHead title="Security & backups" /><Field label="Two-factor auth" value="Enabled for Super Admin" /><Field label="Auto backup" value="Daily · 02:00 EAT" /></Panel>
      </div>
    </>
  );

  const views = { dashboard: Dashboard, products: Products, orders: Orders, customers: Customers, marketing: Marketing, reviews: Reviews, analytics: Analytics, messages: Messages, content: Content, users: UsersRoles, settings: SettingsView };
  const Active = views[view];

  if (!authed) return <LoginGate onAuthed={(u) => { setRole(u.role === "super_admin" ? "Super Admin" : u.role === "manager" ? "Manager" : "Staff"); setAuthed(true); }} />;

  return (
    <div className={`ss-theme ${isLight ? "light" : ""}`} style={{ display: "flex", minHeight: "100vh", background: C.bg, ...sans }}>
      {!apiOnline && (
        <div style={{ position: "fixed", bottom: 14, left: 14, zIndex: 90, ...sans, fontSize: 11.5, color: C.amber, background: "rgba(217,164,65,0.12)", border: `1px solid rgba(217,164,65,0.4)`, borderRadius: 8, padding: "8px 12px" }}>
          Backend offline — showing demo data. Start the API at {api.base}
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
        .ss-theme {
          --ss-teal:#0A4548; --ss-teal-deep:#062B2D; --ss-teal-bright:#0E5F63;
          --ss-panel:#0B1717; --ss-panel2:#0F2122; --ss-cyan:#25C2C7;
          --ss-gold:#C9A24B; --ss-gold-lite:#E6CD8C; --ss-ink:#070C0C;
          --ss-ivory:#F6F3EC; --ss-dim:#8FA0A0; --ss-line:rgba(246,243,236,0.09);
          --ss-green:#2FB37A; --ss-red:#D9646A; --ss-amber:#D9A441;
          --ss-bg:#070C0C; --ss-topbar:rgba(11,23,23,0.9);
        }
        .ss-theme.light {
          --ss-panel:#FFFFFF; --ss-panel2:#F2EFE8; --ss-gold-lite:#8A6D22;
          --ss-ivory:#14201F; --ss-dim:#61706E; --ss-line:rgba(7,12,12,0.10);
          --ss-bg:#ECE8E0; --ss-topbar:rgba(255,255,255,0.9);
        }
        * { box-sizing: border-box; }
        .ss-kpi { display:grid; grid-template-columns: repeat(6, 1fr); gap:14px; }
        .ss-two { display:grid; grid-template-columns: 1fr 1fr; gap:18px; }
        .ss-sb-backdrop { display:none; }
        ::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-thumb{background:${C.line};border-radius:4px}
        @media (max-width:1050px){ .ss-kpi{grid-template-columns:repeat(3,1fr)} .ss-two{grid-template-columns:1fr} }
        @media (max-width:900px){
          .ss-sidebar { position: fixed !important; z-index: 100; height: 100vh; }
          .ss-sb-backdrop { display:block; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:99; }
        }
        @media (max-width:640px){ .ss-kpi{grid-template-columns:repeat(2,1fr)} }
      `}</style>
      {sidebar && <div className="ss-sb-backdrop" onClick={() => setSidebar(false)} />}

      {/* SIDEBAR */}
      <aside className="ss-sidebar" style={{ width: sidebar ? 236 : 0, flexShrink: 0, overflow: "hidden", background: C.panel, borderRight: `1px solid ${C.line}`, transition: "width .25s ease", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ width: 236, height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.line}` }}>
            <div style={{ ...serif, color: C.ivory, fontSize: 18, letterSpacing: 3 }}>STYLE</div>
            <div style={{ ...sans, color: C.gold, fontSize: 8.5, letterSpacing: 5 }}>STATEMENTS · ADMIN</div>
          </div>
          <nav style={{ padding: 12, flex: 1, overflowY: "auto" }}>
            {NAV.filter(([k]) => canSee(k)).map(([k, label, Icon]) => (
              <button key={k} onClick={() => setSection(k)} style={{ ...sans, width: "100%", display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", marginBottom: 3, borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: view === k ? 600 : 500, color: view === k ? C.ink : C.dim, background: view === k ? `linear-gradient(135deg, ${C.goldLite}, ${C.gold})` : "transparent", textAlign: "left" }}>
                <Icon size={17} /> {label}
              </button>
            ))}
          </nav>
          <div style={{ padding: 12, borderTop: `1px solid ${C.line}` }}>
            <button onClick={() => {}} style={{ ...sans, width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 7, border: `1px solid ${C.line}`, background: "transparent", color: C.dim, cursor: "pointer", fontSize: 13 }}><LogOut size={16} /> Sign out</button>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* TOPBAR */}
        <header style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--ss-topbar)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}`, padding: "12px 22px", display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setSidebar((s) => !s)} style={{ background: "none", border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}><Menu size={20} color={C.ivory} /></button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 7, padding: "8px 12px", flex: 1, maxWidth: 380 }}>
            <Search size={15} color={C.dim} /><input placeholder="Search orders, products, customers…" style={{ ...sans, background: "none", border: "none", color: C.ivory, outline: "none", width: "100%", fontSize: 13 }} />
          </div>
          <div style={{ flex: 1 }} />
          {/* Role switcher — demonstrates permission gating */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ ...sans, color: C.dim, fontSize: 11, letterSpacing: .5 }}>VIEW AS</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ ...sans, background: C.panel2, color: C.gold, border: `1px solid ${C.line}`, borderRadius: 7, padding: "8px 10px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              {Object.keys(ROLES).map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <button onClick={toggle} aria-label="Toggle light or dark mode" style={{ background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 8, padding: 9, cursor: "pointer", display: "grid", placeItems: "center" }}>
            {isLight ? <Moon size={17} color={C.ivory} /> : <Sun size={17} color={C.ivory} />}
          </button>
          <button style={{ position: "relative", background: C.panel2, border: `1px solid ${C.line}`, borderRadius: 8, padding: 9, cursor: "pointer", display: "grid", placeItems: "center" }}>
            <Bell size={17} color={C.ivory} />
            <span style={{ position: "absolute", top: 5, right: 6, width: 7, height: 7, borderRadius: 999, background: C.red }} />
          </button>
          <Avatar name="Shine" />
        </header>

        <main style={{ padding: 24, maxWidth: 1240 }}>
          <Active />
        </main>
      </div>

      {/* PRODUCT MODAL */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(7,12,12,0.7)", zIndex: 80, display: "grid", placeItems: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: "100%", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <span style={{ ...serif, color: C.ivory, fontSize: 20 }}>{modal.mode === "add" ? "Add product" : "Edit product"}</span>
              <button onClick={() => setModal(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={20} color={C.dim} /></button>
            </div>
            <ProductForm initial={modal.product} onSave={saveProduct} inp={inp} />
          </div>
        </div>
      )}
    </div>
  );
}

function ProductForm({ initial, onSave, inp }) {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const L = ({ label, children }) => (<div style={{ marginBottom: 14 }}><label style={{ ...sans, color: C.dim, fontSize: 12, display: "block", marginBottom: 6 }}>{label}</label>{children}</div>);
  return (
    <div>
      <L label="Product name"><input value={f.name} onChange={set("name")} style={inp} placeholder="e.g. Aurora Clover Studs" /></L>
      <L label="Category">
        <select value={f.cat} onChange={set("cat")} style={inp}>{["Jewelry", "Sunglasses", "Perfumes"].map((c) => <option key={c}>{c}</option>)}</select>
      </L>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><L label="Price (KES)"><input value={f.price} onChange={set("price")} type="number" style={inp} /></L></div>
        <div style={{ flex: 1 }}><L label="Stock"><input value={f.stock} onChange={set("stock")} type="number" style={inp} /></L></div>
      </div>
      <button onClick={() => onSave(f)} disabled={!f.name || f.price === ""} style={{ ...sans, width: "100%", marginTop: 6, cursor: f.name ? "pointer" : "not-allowed", opacity: f.name ? 1 : 0.5, background: `linear-gradient(135deg, ${C.goldLite}, ${C.gold})`, color: C.ink, border: "none", padding: "12px", borderRadius: 7, fontWeight: 600, fontSize: 13 }}>{initial.id ? "Save changes" : "Add product"}</button>
    </div>
  );
}

/* ---------- Admin login/signup gate ---------- */
function LoginGate({ onAuthed }) {
  const { isLight } = useTheme();
  return (
    <div className={`ss-theme ${isLight ? "light" : ""}`} style={{ minHeight: "100vh", background: C.bg, display: "grid", placeItems: "center", padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
        .ss-theme {
          --ss-teal:#0A4548; --ss-teal-deep:#062B2D; --ss-teal-bright:#0E5F63;
          --ss-panel:#0B1717; --ss-panel2:#0F2122; --ss-cyan:#25C2C7;
          --ss-gold:#C9A24B; --ss-gold-lite:#E6CD8C; --ss-ink:#070C0C;
          --ss-ivory:#F6F3EC; --ss-dim:#8FA0A0; --ss-line:rgba(246,243,236,0.09);
          --ss-green:#2FB37A; --ss-red:#D9646A; --ss-amber:#D9A441;
          --ss-bg:#070C0C; --ss-topbar:rgba(11,23,23,0.9);
        }
        .ss-theme.light {
          --ss-panel:#FFFFFF; --ss-panel2:#F2EFE8; --ss-gold-lite:#8A6D22;
          --ss-ivory:#14201F; --ss-dim:#61706E; --ss-line:rgba(7,12,12,0.10);
          --ss-bg:#ECE8E0; --ss-topbar:rgba(255,255,255,0.9);
        }
      `}</style>
      <AuthForm
        admin
        title="Admin sign in"
        subtitle="Manage your store"
        onLogin={(email, password) => authService.login(email, password)}
        onRegister={(payload) => authService.adminRegister(payload)}
        onSuccess={(user) => {
          if (user.role === "customer") throw new Error("This account is not an admin.");
          onAuthed(user);
        }}
      />
    </div>
  );
}
