import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useState, useEffect, useMemo } from "react";

export default function Login() {
  const nav = useNavigate();
  const { loginOk, verifyMfa, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [mfaToken, setMfaToken] = useState("");
  const [step, setStep] = useState("login"); // "login" | "mfa"
  const [msg, setMsg] = useState("");
  const [pending, setPending] = useState(false);

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

    try {
      setPending(true);

      if (step === "login") {
        if (!email || !password) {
          setMsg("Enter email and password.");
          return;
        }

        const result = await loginOk(email, password);

        if (result?.mfaRequired) {
          setMfaToken(result.mfaToken);
          setStep("mfa");
          setMsg(
            result.message ||
              "We’ve sent a 6-digit verification code to your email."
          );
        } else {
          nav("/dashboard");
        }
      } else {
        // step === "mfa"
        if (!code.trim()) {
          setMsg("Enter the verification code from your email.");
          return;
        }

        await verifyMfa(code.trim(), mfaToken);
        nav("/dashboard");
      }
    } catch (err) {
      setMsg(err?.message || "Login failed.");
    } finally {
      setPending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") submit(e);
  };

  const resetToLogin = () => {
    setStep("login");
    setCode("");
    setMfaToken("");
    setMsg("");
  };

  const isLoginStep = step === "login";

  return (
    <main className="page auth-page">
      <Link to="/" className="login-back-btn" aria-label="Go back home">
        Back
      </Link>

      <div
        className="login-card"
        role="form"
        aria-label={
          isLoginStep
            ? "Sign in to PawFolio"
            : "Verify your PawFolio login with a code"
        }
      >
        <div className="login-logo-wrap">
          <img src="/img/logo.png" alt="PawFolio" className="login-logo" />
        </div>

        <h1 className="login-title">
          {isLoginStep ? "Sign in" : "Check your email"}
        </h1>

        {isLoginStep ? (
          <p
            className="about-lead"
            style={{ textAlign: "center", marginTop: -6 }}
          >
            {greeting}! Welcome back to{" "}
            <span className="accent">PawFolio</span>.
          </p>
        ) : (
          <p
            className="about-lead"
            style={{ textAlign: "center", marginTop: -6 }}
          >
            We’ve sent a 6-digit code to <span className="accent">{email}</span>
            . Enter it below to finish signing in.
          </p>
        )}

        <form onSubmit={submit} style={{ width: "100%" }}>
          {isLoginStep ? (
            <>
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
            </>
          ) : (
            <>
              <label className="login-input-wrap">
                <span className="login-input-label">Verification code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  onKeyDown={onKeyDown}
                  required
                  aria-required="true"
                />
              </label>

              <button
                type="button"
                className="link-button"
                style={{ marginBottom: "0.75rem" }}
                onClick={resetToLogin}
              >
                Use a different account
              </button>
            </>
          )}

          <button className="btn login-btn" type="submit" disabled={pending}>
            {pending
              ? isLoginStep
                ? "Signing in…"
                : "Verifying…"
              : isLoginStep
              ? "Sign In"
              : "Verify Code"}
          </button>
        </form>

        {msg && (
          <div
            className="notice"
            role="alert"
            style={{ marginTop: "0.75rem" }}
          >
            {msg}
          </div>
        )}

        {isLoginStep && (
          <p className="login-signup-cta">
            New to PawFolio?{" "}
            <Link to="/signup" className="login-signup-link">
              Create an account →
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
