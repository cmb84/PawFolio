import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useEffect, useState } from "react";

export default function Signup() {
  const nav = useNavigate();
  const { registerOk, user } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [msg, setMsg]           = useState("");
  const [pending, setPending]   = useState(false);

  useEffect(() => {
    if (user) nav("/dashboard", { replace: true });
  }, [user, nav]);

  const submit = async (e) => {
    e?.preventDefault();
    setMsg("");

    if (!username || !email || !password || !confirm) {
      setMsg("All fields are required.");
      return;
    }
    if (password.length < 8) {
      setMsg("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setMsg("Password must include upper, lower, and numeric characters.");
      return;
    }
    if (password !== confirm) {
      setMsg("Passwords do not match.");
      return;
    }

    try {
      setPending(true);
      await registerOk(email, password, username);
      nav("/dashboard");
    } catch (err) {
      setMsg(err?.message || "Registration failed.");
    } finally {
      setPending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") submit(e);
  };

  return (
    <main className="page auth-page">

      <Link to="/login" className="login-back-btn" aria-label="Back to sign in">
        Back
      </Link>

      <div className="login-card" role="form" aria-label="Create PawFolio account">
        <div className="login-logo-wrap">
          {/* served from frontend/public/img/logo.png */}
          <img src="/img/logo.png" alt="PawFolio" className="login-logo" />
        </div>

        <h1 className="login-title">Create account</h1>

        <form onSubmit={submit} style={{ width: "100%" }}>
          <label className="login-input-wrap">
            <span className="login-input-label">Username</span>
            <input
              type="text"
              placeholder="Username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={onKeyDown}
              required
            />
          </label>

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
            />
          </label>

          <label className="login-input-wrap">
            <span className="login-input-label">Password</span>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                placeholder="Password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onKeyDown}
                required
                style={{ paddingRight: 96 }}
              />
            </div>
          </label>

          <label className="login-input-wrap">
            <span className="login-input-label">Confirm password</span>
            <div style={{ position: "relative" }}>
              <input
                type="password"
                placeholder="Confirm password"
                autoComplete="new-password"
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={onKeyDown}
                required
                style={{ paddingRight: 96 }}
              />
            </div>
          </label>

          <button className="btn login-btn" type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create Account"}
          </button>
        </form>

        {msg && (
          <div className="notice" role="alert" style={{ marginTop: "0.75rem" }}>
            {msg}
          </div>
        )}

        <p className="login-signup-cta">
          Already have an account?{" "}
          <Link to="/login" className="login-signup-link">
            Sign in →
          </Link>
        </p>
      </div>
    </main>
  );
}
