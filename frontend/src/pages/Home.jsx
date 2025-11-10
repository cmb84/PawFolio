import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [potd, setPotd] = useState(null);
  const [pets, setPets] = useState([]);
  const { user } = useAuth();

  async function fetchPotd() {
    const r = await fetch("/api/pet_of_the_day.php", { credentials: "include" });
    const j = await r.json();
    if (j.ok) setPotd(j.pet || null);
  }

  async function fetchPets() {
    const r = await fetch("/api/pets_list.php", { credentials: "include" });
    const j = await r.json();
    if (j.ok) setPets(j.pets || []);
  }

  useEffect(() => {
    (async () => {
      await Promise.all([fetchPotd(), fetchPets()]);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: "2rem" }}>Loading…</div>;

  return (
    <div className="page">
      <header className="hero">
        <div className="container">
          <h1 className="hero-title">
            Welcome{user?.username ? `, ${user.username}` : ""} to <span className="accent">PawCloud</span>
          </h1>
          <p className="hero-sub">Browse adorable pets, upload your own, and react with emojis!</p>
        </div>
      </header>

      <main className="container">
        <section className="card">
          <div className="card-header">
            <h3>🐶 Pet of the Day</h3>
          </div>
          <div className="card-body">
            {potd ? (
              <div className="potd">
                <img className="potd-img" src={potd.imageUrl} alt={potd.name} />
                <div className="potd-meta">
                  <h4>{potd.name} <span className="badge">{potd.species}</span></h4>
                  <p>{potd.description || "No description yet."}</p>
                </div>
              </div>
            ) : (
              <p>No pets yet—be the first to upload!</p>
            )}
          </div>
        </section>

        <UploadCard onUploaded={async () => { await fetchPotd(); await fetchPets(); }} />

        <section>
          <h3 className="section-title">Gallery</h3>
          <div className="grid">
            {pets.map((p) => (
              <div key={p.id} className="pet-card">
                <img src={p.imageUrl} alt={p.name} />
                <div className="pet-meta">
                  <h4>{p.name}</h4>
                  <div className="row">
                    <span className="badge">{p.species}</span>
                    <span className="byline">by @{p.username}</span>
                  </div>
                  {p.description ? <p>{p.description}</p> : null}
                </div>
                {/* Reactions/Comments can go here later */}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function UploadCard({ onUploaded }) {
  const { isAuthenticated } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthenticated) {
    return (
      <section className="card">
        <div className="card-body">
          <p>Login to upload your pet photos.</p>
        </div>
      </section>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setPending(true);

    const fd = new FormData(e.currentTarget);

    try {
      const r = await fetch("/api/pets_upload.php", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Upload failed");
      e.currentTarget.reset();
      await onUploaded?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <h3>📤 Upload a Pet</h3>
      </div>
      <div className="card-body">
        <form className="upload-form" onSubmit={submit}>
          <input name="name" placeholder="Name" required />
          <input name="species" placeholder="Species (Dog, Cat, …)" required />
          <input name="description" placeholder="Short description (optional)" />
          <input name="image" type="file" accept="image/*" required />
          <button className="btn btn-primary" disabled={pending}>
            {pending ? "Uploading…" : "Upload"}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </div>
    </section>
  );
}
