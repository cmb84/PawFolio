import { useEffect, useState } from "react";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("You are not logged in.");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load user.");
        } else {
          setUser(data.user);
        }
      } catch (err) {
        setError("Unexpected error.");
      }

      setLoading(false);
    }

    fetchUser();
  }, []);

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

          <div>
            <label className="text-slate-400 text-sm">Member Since</label>
            <p className="text-lg">{new Date(user.created_at).toLocaleString()}</p>
          </div>
        </div>

      </section>
    </main>
  );
}