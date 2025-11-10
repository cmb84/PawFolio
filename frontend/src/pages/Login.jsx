import { Link, useNavigate } from "react-router-dom";
import Footer from "../ui/Footer";
import { useAuth } from "../auth/AuthProvider";
import { useState, useEffect } from "react";

export default function Login() {
  const nav = useNavigate();
  const { loginOk, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (user) nav("/dashboard", { replace: true });
  }, [user, nav]);

  const submit = async () => {
    setMsg("");
    if (!email || !password) {
      setMsg("Enter email and password.");
      return;
    }
    try {
      await loginOk(email, password);
      nav("/dashboard");
    } catch (err) {
      setMsg(err?.message || "Login failed.");
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <main className="page login-page">
      <Link to="/" className="login-back-btn" aria-label="Go back">
        Back
      </Link>

      <div className="login-card" role="form" aria-label="Sign in">
        <div className="login-logo-wrap">
          <img src="/logo.png" alt="Moodvies" className="login-logo" />
        </div>

        <h1 className="login-title">Sign in</h1>

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
          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKeyDown}
            required
          />
        </label>

        <button className="btn login-btn" type="button" onClick={submit}>
          Sign In
        </button>

        {msg && (
          <div className="notice" role="alert" style={{ marginTop: "0.75rem" }}>
            {msg}
          </div>
        )}

        <p className="login-signup-cta">
          New to Moodvies?{" "}
          <Link to="/signup" className="login-signup-link">
            Create an account →
          </Link>
        </p>
      </div>

    </main>
  );
}
