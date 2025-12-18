import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";

export default function UserProfile() {
  const { user, loading, refresh } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    // If we have a token but user isn't loaded yet, try to refresh once.
    if (!loading && !user) {
      const token = localStorage.getItem("pawfolio_token");
      if (token) {
        refresh().catch(() => {});
      } else {
        setError("You are not logged in.");
      }
    }
  }, [loading, user, refresh]);

  const memberSince = useMemo(() => {
    const v = user?.created_at || user?.createdAt || user?.created;
    if (!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString();
  }, [user]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <p>Loading profile…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-red-400">
        <p>{error}</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <p>No profile available.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex justify-center bg-slate-950 text-slate-100 px-4 py-8">
      <section className="w-full max-w-xl bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl">
        <h1 className="text-2xl font-bold mb-4">Your Profile</h1>

        <div className="space-y-3">
          <div>
            <label className="text-slate-400 text-sm">Username</label>
            <p className="text-lg">{user.username}</p>
          </div>

          <div>
            <label className="text-slate-400 text-sm">Email</label>
            <p className="text-lg">{user.email}</p>
          </div>

          {memberSince && (
            <div>
              <label className="text-slate-400 text-sm">Member Since</label>
              <p className="text-lg">{memberSince}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
