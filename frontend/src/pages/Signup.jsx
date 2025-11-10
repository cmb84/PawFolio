import { Link, useNavigate } from "react-router-dom";
import Footer from "../ui/Footer";
import { useAuth } from "../auth/AuthProvider";
import { useState, useEffect } from "react";

export default function Signup() {
  const nav = useNavigate();
  const { registerOk, user } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (user) nav("/dashboard", { replace: true });
  }, [user, nav]);

  const submit = async () => {
    setMsg("");
    if (!username || !email || !password || !confirm) {
      setMsg("All fields are required.");
      return;
    }
    if (password.length < 8) {
      setMsg("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(password) || 
        !/[a-z]/.test(password) || 
        !/[0-9]/.test(password)) {
      setMsg('Password must include upper, lower, and numeric characters');
      return
    }
    if (password !== confirm) {
      setMsg("Passwords do not match.");
      return;
    }
    try {
      await registerOk(email, password, username);
      nav("/dashboard");
    } catch (err) {
      setMsg(err?.message || "Registration failed.");
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
      <Link to="/login" className="login-back-btn" aria-label="Back to sign in">
        Back
      </Link>

      <div className="login-card" role="form" aria-label="Create account">
        <div className="login-logo-wrap">
          <img src="/logo.png" alt="Moodvies" className="login-logo" />
        </div>

        <h1 className="login-title">Create account</h1>

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
          <input
            type="password"
            placeholder="Password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onKeyDown}
            required
          />
        </label>

        <label className="login-input-wrap">
          <span className="login-input-label">Confirm password</span>
          <input
            type="password"
            placeholder="Confirm password"
            autoComplete="new-password"
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={onKeyDown}
            required
          />
        </label>

        <button className="btn login-btn" type="button" onClick={submit}>
          Create Account
        </button>

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
