import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav("/login", { replace: true });
  }, [loading, user, nav]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // NEW: Load pets from API (falls back to sample data if unavailable)
  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/pets_list.php", { credentials: "include" });
        const j = await r.json().catch(() => ({}));
        if (!cancelled && j?.ok && Array.isArray(j.pets)) {
          // Map API to our card format while keeping original field names used below
          const mapped = j.pets.map((p) => ({
            t: p.name,                  // title -> pet name
            y: p.species,               // "year" slot -> species text
            img: p.imageUrl,            // image url
            imdb: p.imageUrl,           // link to open the image in a new tab
            by: p.username || "user",   // optional owner
          }));
          setPets(mapped);
        } else if (!cancelled) {
          setPets(samplePets);
        }
      } catch {
        if (!cancelled) setPets(samplePets);
      } finally {
        if (!cancelled) setLoadingPets(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return null;

  // Keep original UI chips, but make them species “filters” (non-functional placeholder)
  const MoodChip = ({ label, emoji }) => (
    <button className="mood-chip" type="button" title={`Filter by ${label}`}>
      <span style={{ marginRight: 8 }}>{emoji}</span>
      {label}
    </button>
  );

  // Keep the original "Poster" component & classes so CSS doesn't break.
  // It now renders pets instead of movies.
  const Poster = ({ m }) => (
    <a href={m.imdb} target="_blank" rel="noopener noreferrer" className="poster-card">
      <img src={m.img} alt={m.t} className="poster-img" loading="lazy" />
      <div className="poster-info">
        <div className="poster-title">{m.t}</div>
        <div className="poster-year">{m.y}</div>
      </div>
    </a>
  );

  // Derive sections (keeping your "trending" and "topRated" section structure/names)
  const trending = pets.slice(0, 6);
  const topRated = pets.slice(6, 11);

  return (
    <main className="page dashboard">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="accent">{greeting}</span>
              {user?.username ? `, ${user.username}` : ""}.
            </h1>
            <h2 className="hero-sub">
              Share & discover adorable pets on <span className="accent">PawFolio</span>.
            </h2>

            <div className="mood-bar">
              <MoodChip emoji="🐶" label="Dogs" />
              <MoodChip emoji="🐱" label="Cats" />
              <MoodChip emoji="🐰" label="Rabbits" />
              <MoodChip emoji="🐦" label="Birds" />
              <MoodChip emoji="🦎" label="Reptiles" />
              <button className="btn-cta">Upload a Pet →</button>
            </div>
          </div>
        </div>
      </section>

      <section className="movie-section">
        <h3 className="feature-title">Recently Added</h3>
        {loadingPets ? (
          <div style={{ padding: "1rem" }}>Loading pets…</div>
        ) : pets.length === 0 ? (
          <div style={{ padding: "1rem" }}>No pets yet — be the first to upload!</div>
        ) : (
          <div className="poster-grid">
            {trending.map((m, i) => (
              <Poster key={(m.img || m.t) + i} m={m} />
            ))}
          </div>
        )}
      </section>

      <section className="movie-section">
        <h3 className="feature-title">Top Loved</h3>
        {loadingPets ? (
          <div style={{ padding: "1rem" }}>Loading pets…</div>
        ) : (
          <div className="poster-grid">
            {topRated.map((m, i) => (
              <Poster key={(m.img || m.t) + i} m={m} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

/** Fallback demo content (used only if API isn't ready) */
const samplePets = [
  {
    t: "Luna",
    y: "Cat",
    img: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=800&auto=format&fit=crop",
    imdb: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=1600&auto=format&fit=crop",
  },
  {
    t: "Milo",
    y: "Dog",
    img: "https://images.unsplash.com/photo-1507149833265-60c372daea22?q=80&w=800&auto=format&fit=crop",
    imdb: "https://images.unsplash.com/photo-1507149833265-60c372daea22?q=80&w=1600&auto=format&fit=crop",
  },
  {
    t: "Willow",
    y: "Rabbit",
    img: "https://images.unsplash.com/photo-1518792399576-eaf0a5b2d395?q=80&w=800&auto=format&fit=crop",
    imdb: "https://images.unsplash.com/photo-1518792399576-eaf0a5b2d395?q=80&w=1600&auto=format&fit=crop",
  },
  {
    t: "Rio",
    y: "Bird",
    img: "https://images.unsplash.com/photo-1518020961727-3d0e1a6d27f3?q=80&w=800&auto=format&fit=crop",
    imdb: "https://images.unsplash.com/photo-1518020961727-3d0e1a6d27f3?q=80&w=1600&auto=format&fit=crop",
  },
  {
    t: "Cleo",
    y: "Reptile",
    img: "https://images.unsplash.com/photo-1615222288255-d8ab271aac3f?q=80&w=800&auto=format&fit=crop",
    imdb: "https://images.unsplash.com/photo-1615222288255-d8ab271aac3f?q=80&w=1600&auto=format&fit=crop",
  },
  {
    t: "Nala",
    y: "Cat",
    img: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?q=80&w=800&auto=format&fit=crop",
    imdb: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?q=80&w=1600&auto=format&fit=crop",
  },
  {
    t: "Buddy",
    y: "Dog",
    img: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800&auto=format&fit=crop",
    imdb: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1600&auto=format&fit=crop",
  },
  {
    t: "Poppy",
    y: "Rabbit",
    img: "https://images.unsplash.com/photo-1494253109108-2e30c049369b?q=80&w=800&auto=format&fit=crop",
    imdb: "https://images.unsplash.com/photo-1494253109108-2e30c049369b?q=80&w=1600&auto=format&fit=crop",
  },
  {
    t: "Skye",
    y: "Bird",
    img: "https://images.unsplash.com/photo-1501706362039-c06b2d715385?q=80&w=800&auto=format&fit=crop",
    imdb: "https://images.unsplash.com/photo-1501706362039-c06b2d715385?q=80&w=1600&auto=format&fit=crop",
  },
  {
    t: "Spike",
    y: "Reptile",
    img: "https://images.unsplash.com/photo-1570716899235-5c4f7bcac28e?q=80&w=800&auto=format&fit=crop",
    imdb: "https://images.unsplash.com/photo-1570716899235-5c4f7bcac28e?q=80&w=1600&auto=format&fit=crop",
  },
];
