import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

function toAgeValue(v) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  const i = Math.floor(n);
  return i;
}

export default function Settings() {
  const nav = useNavigate();
  const { user, apiFetch, refresh, logout } = useAuth();

  const [email, setEmail] = useState(user?.email || "");
  const [age, setAge] = useState(user?.age ?? "");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [delPassword, setDelPassword] = useState("");
  const [delConfirm, setDelConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [delMessage, setDelMessage] = useState("");

  useEffect(() => {
    // Keep local form state in sync with the latest user info
    setEmail(user?.email || "");
    setAge(user?.age ?? "");
  }, [user]);

  useEffect(() => {
    // Ensure we load the freshest user info after navigation
    refresh?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e) {
    e.preventDefault();
    setMessage("");

    if (!email.trim()) {
      setMessage("Email is required.");
      return;
    }

    const ageVal = toAgeValue(age);
    if (ageVal === undefined) {
      setMessage("Age must be a number.");
      return;
    }
    if (ageVal !== null && (ageVal < 0 || ageVal > 130)) {
      setMessage("Age must be between 0 and 130.");
      return;
    }

    setSaving(true);
    try {
      const data = await apiFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({ email: email.trim(), age: ageVal }),
      });

      // If the backend returns a fresh token (e.g., after email change), store it.
      if (data?.token) {
        localStorage.setItem("pawfolio_token", data.token);
      }

      await refresh?.();
      setMessage("Saved ✅");
    } catch (err) {
      setMessage(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    setDelMessage("");

    if (!delPassword) {
      setDelMessage("Please enter your password to confirm.");
      return;
    }
    if (delConfirm.trim() !== "DELETE") {
      setDelMessage('Type "DELETE" to confirm account deletion.');
      return;
    }

    const ok = window.confirm(
      "This will permanently delete your account and all your posts. This cannot be undone. Continue?"
    );
    if (!ok) return;

    setDeleting(true);
    try {
      await apiFetch("/api/users/me", {
        method: "DELETE",
        body: JSON.stringify({ password: delPassword, confirm: delConfirm.trim() }),
      });

      logout?.();
      nav("/", { replace: true });
    } catch (err) {
      setDelMessage(err?.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="page">
      <header className="hero profile-hero">
        <div className="container">
          <h1 className="hero-title">
            Account <span className="accent">Settings</span>
          </h1>
          <p className="hero-sub">
            Update your profile details, or delete your account.
          </p>
        </div>
      </header>

      <section className="container" style={{ marginTop: 22, marginBottom: 28 }}>
        <div className="settings-grid">
          <div className="settings-card">
            <div className="settings-card-head">
              <div>
                <div className="settings-card-title">Profile</div>
                <div className="settings-card-sub">
                  Signed in as <span className="accent">@{user?.username || "user"}</span>
                </div>
              </div>

              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => nav("/profile")}
              >
                Back to Profile
              </button>
            </div>

            <form className="settings-form" onSubmit={save}>
              <label className="form-row">
                <span className="form-label">Email</span>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </label>

              <label className="form-row">
                <span className="form-label">Age</span>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  max={130}
                  value={age ?? ""}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="(optional)"
                />
              </label>

              <div className="settings-actions">
                <button className="btn btn-cta" type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>

              {message ? <div className="form-message">{message}</div> : null}

              <div className="settings-note">
                Username changes aren’t supported yet.
              </div>
            </form>
          </div>

          <div className="settings-card danger-card">
            <div className="settings-card-title">Danger Zone</div>
            <div className="settings-card-sub">
              Deleting your account removes your profile and posts permanently.
            </div>

            <div className="danger-box">
              <label className="form-row">
                <span className="form-label">Password</span>
                <input
                  className="form-input"
                  type="password"
                  value={delPassword}
                  onChange={(e) => setDelPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
              </label>

              <label className="form-row">
                <span className="form-label">Type DELETE to confirm</span>
                <input
                  className="form-input"
                  value={delConfirm}
                  onChange={(e) => setDelConfirm(e.target.value)}
                  placeholder="DELETE"
                />
              </label>

              <button
                className="btn btn-danger"
                type="button"
                onClick={deleteAccount}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete Account"}
              </button>

              {delMessage ? <div className="danger-message">{delMessage}</div> : null}
            </div>

            <div className="settings-note">
              Tip: If you just want to take a break, you can simply log out.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
