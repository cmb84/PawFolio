import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useState, useEffect, useMemo } from "react";

export default function Login() {
  const nav = useNavigate();
  const { loginOk, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState(false);

  // friendly greeting (optional)
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    if (user) nav("/dashboard", { replace: true });
  }, [user, nav]);

  const submit = async (e) => {
    e?.preventDefault();
    setMsg("");

    if (!email || !password) {
      setMsg("Enter email and password.");
      return;
    }

    try {
      setPending(true);
      await loginOk(email, password);
      nav("/dashboard");
    } catch (err) {
      setMsg(err?.message || "Login failed.");
    } finally {
      setPending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") submit(e);
  };

  return (
    <main className="page auth-page">
      <Link to="/" className="login-back-btn" aria-label="Go back home">
        Back
      </Link>

      <div className="login-card" role="form" aria-label="Sign in to PawFolio">
        <div className="login-logo-wrap">
          {/* served from frontend/public/img/logo.png */}
          <img src="/img/logo.png" alt="PawFolio" className="login-logo" />
        </div>

        <h1 className="login-title">Sign in</h1>
        <p className="about-lead" style={{ textAlign: "center", marginTop: -6 }}>
          {greeting}! Welcome back to <span className="accent">PawFolio</span>.
        </p>

        <form onSubmit={submit} style={{ width: "100%" }}>
          <label className="login-input-wrap">
            <span className="login-input-label">Email</span>
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={onKeyDown}
              required
              aria-required="true"
            />
          </label>

          <label className="login-input-wrap">
            <span className="login-input-label">Password</span>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKeyDown}
                required
                aria-required="true"
                style={{ paddingRight: 96 }}
              />
            </div>
          </label>

          <button className="btn login-btn" type="submit" disabled={pending}>
            {pending ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {msg && (
          <div className="notice" role="alert" style={{ marginTop: "0.75rem" }}>
            {msg}
          </div>
        )}

        <p className="login-signup-cta">
          New to PawFolio?{" "}
          <Link to="/signup" className="login-signup-link">
            Create an account →
          </Link>
        </p>
      </div>
    </main>
  );
}
