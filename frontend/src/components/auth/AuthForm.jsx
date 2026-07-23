import { useState } from "react";

/* Reusable, brand-styled auth form (login + signup toggle).
   Parent supplies onLogin / onRegister handlers so the same UI works for
   customers (signup + login) and admins (login only — admin accounts are
   created for them by a Super Admin or Manager). */
const C = {
  teal: "#0E5F63", tealDeep: "#062B2D", panel: "#0B1717", panel2: "#0F2122",
  gold: "#C9A24B", goldLite: "#E6CD8C", ink: "#070C0C",
  ivory: "#F6F3EC", dim: "#8FA0A0", line: "rgba(246,243,236,0.12)", red: "#D9646A",
};
const serif = { fontFamily: "'Playfair Display', Georgia, serif" };
const sans = { fontFamily: "'Inter', system-ui, sans-serif" };

export default function AuthForm({
  onLogin, onRegister, onSuccess,
  admin = false, allowSignup = true,
  title = "Welcome back", subtitle = "Sign in to your account",
}) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    setErr(""); setBusy(true);
    try {
      let user;
      if (mode === "login") {
        user = await onLogin(f.email, f.password);
      } else {
        user = await onRegister({ full_name: f.full_name, email: f.email, password: f.password, phone: f.phone });
      }
      onSuccess && onSuccess(user);
    } catch (e) {
      setErr(e.message || "Something went wrong");
      setBusy(false);
    }
  };

  const box = { ...sans, width: "100%", boxSizing: "border-box", background: C.panel2, border: `1px solid ${C.line}`, color: C.ivory, borderRadius: 8, padding: "12px 14px", fontSize: 14, outline: "none", marginBottom: 12 };
  const isLogin = mode === "login";

  return (
    <div style={{ width: 400, maxWidth: "100%", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: 34 }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ ...serif, color: C.ivory, fontSize: 24, letterSpacing: 4 }}>STYLE</div>
        <div style={{ ...sans, color: C.gold, fontSize: 9, letterSpacing: 6 }}>
          STATEMENTS{admin ? " · ADMIN" : ""}
        </div>
      </div>

      <h2 style={{ ...serif, color: C.ivory, fontSize: 22, textAlign: "center", margin: "0 0 4px" }}>
        {isLogin ? title : (admin ? "Create an admin account" : "Create your account")}
      </h2>
      <p style={{ ...sans, color: C.dim, fontSize: 13, textAlign: "center", margin: "0 0 22px" }}>
        {isLogin ? subtitle : "It only takes a moment."}
      </p>

      {!isLogin && (
        <input value={f.full_name} onChange={set("full_name")} placeholder="Full name" style={box} />
      )}
      <input value={f.email} onChange={set("email")} placeholder="Email address" type="email" style={box} />
      <input value={f.password} onChange={set("password")} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Password" type="password" style={box} />

      {!isLogin && (
        <input value={f.phone} onChange={set("phone")} placeholder="Phone (optional)" style={box} />
      )}

      {err && <div style={{ ...sans, color: C.red, fontSize: 12.5, marginBottom: 12 }}>{err}</div>}

      <button onClick={submit} disabled={busy} style={{ ...sans, width: "100%", cursor: busy ? "wait" : "pointer", background: `linear-gradient(135deg, ${C.goldLite}, ${C.gold})`, color: C.ink, border: "none", padding: 13, borderRadius: 8, fontWeight: 600, fontSize: 14, letterSpacing: .5 }}>
        {busy ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
      </button>

      {allowSignup && (
        <div style={{ ...sans, color: C.dim, fontSize: 13, textAlign: "center", marginTop: 18 }}>
          {isLogin ? "New here? " : "Already have an account? "}
          <button onClick={() => { setErr(""); setMode(isLogin ? "register" : "login"); }}
            style={{ background: "none", border: "none", color: C.gold, cursor: "pointer", fontWeight: 600, ...sans, fontSize: 13 }}>
            {isLogin ? "Create an account" : "Sign in"}
          </button>
        </div>
      )}
    </div>
  );
}
