import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Settings() {
  const nav = useNavigate();
  const { user, apiFetch, refresh, logout } = useAuth();

  const [email, setEmail] = useState(user?.email || "");
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const [delPassword, setDelPassword] = useState("");
  const [delConfirm, setDelConfirm] = useState("");
  const [delMsg, setDelMsg] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setEmail(user?.email || "");
  }, [user]);

  useEffect(() => {
    refresh?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveEmail(e) {
    e.preventDefault();
    setEmailMsg("");

    if (!email.trim()) return setEmailMsg("Email is required.");
    if (!currentPasswordForEmail) {
      return setEmailMsg("Enter your current password to change your email.");
    }

    setSavingEmail(true);
    try {
      const data = await apiFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          email: email.trim(),
          currentPassword: currentPasswordForEmail,
        }),
      });

      if (data?.token) localStorage.setItem("pawfolio_token", data.token);
      await refresh?.();
      setCurrentPasswordForEmail("");
      setEmailMsg("Email updated ✅");
    } catch (err) {
      setEmailMsg(err?.message || "Failed to update email");
    } finally {
      setSavingEmail(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwMsg("");

    if (!currentPassword) return setPwMsg("Enter your current password.");
    if (!newPassword) return setPwMsg("Enter a new password.");
    if (newPassword.length < 8) return setPwMsg("New password must be at least 8 characters.");
    if (newPassword !== confirmNewPassword) return setPwMsg("New passwords do not match.");

    setSavingPw(true);
    try {
      const data = await apiFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (data?.token) localStorage.setItem("pawfolio_token", data.token);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPwMsg("Password updated ✅");
    } catch (err) {
      setPwMsg(err?.message || "Failed to update password");
    } finally {
      setSavingPw(false);
    }
  }

  async function deleteAccount() {
    setDelMsg("");

    if (!delPassword) return setDelMsg("Enter your password to confirm.");
    if (delConfirm.trim() !== "DELETE") return setDelMsg('Type "DELETE" to confirm.');

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
      setDelMsg(err?.message || "Failed to delete account");
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
          <p className="hero-sub">Change your email/password or delete your account.</p>
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

              <div className="settings-head-actions">
                <Link className="btn btn-ghost" to="/profile">
                  Back to Profile
                </Link>
              </div>
            </div>

            <div className="settings-split">
              <form className="settings-form" onSubmit={saveEmail}>
                <div className="settings-section-title">Change Email</div>

                <label className="form-row">
                  <span className="form-label">New Email</span>
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
                  <span className="form-label">Current Password</span>
                  <input
                    className="form-input"
                    type="password"
                    value={currentPasswordForEmail}
                    onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter current password"
                  />
                </label>

                <div className="settings-actions">
                  <button className="btn btn-cta" type="submit" disabled={savingEmail}>
                    {savingEmail ? "Saving…" : "Update Email"}
                  </button>
                </div>

                {emailMsg ? <div className="form-message">{emailMsg}</div> : null}
              </form>

              <div className="settings-divider" />

              <form className="settings-form" onSubmit={savePassword}>
                <div className="settings-section-title">Change Password</div>

                <label className="form-row">
                  <span className="form-label">Current Password</span>
                  <input
                    className="form-input"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter current password"
                  />
                </label>

                <label className="form-row">
                  <span className="form-label">New Password</span>
                  <input
                    className="form-input"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                  />
                </label>

                <label className="form-row">
                  <span className="form-label">Confirm New Password</span>
                  <input
                    className="form-input"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Re-type new password"
                  />
                </label>

                <div className="settings-actions">
                  <button className="btn btn-cta" type="submit" disabled={savingPw}>
                    {savingPw ? "Saving…" : "Update Password"}
                  </button>
                </div>

                {pwMsg ? <div className="form-message">{pwMsg}</div> : null}
              </form>
            </div>
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

              {delMsg ? <div className="danger-message">{delMsg}</div> : null}
            </div>

            <div className="settings-note">
              Tip: If you just want to take a break, you can log out from the menu.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
