import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { apiUrl } from "../lib/api";

export default function Home() {
  const { user } = useAuth();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Fallback demo content (used only if API isn't ready)
  const samplePets = [
    {
      name: "Aki",
      species: "Hamster",
      image: "/img/aki.jpg",
      username: "carlos",
      description: "Master burrower. Accepts rent in carrot coins only. 🥕💰",
    },
    {
      name: "Momo (Silly Cam)",
      species: "Cat",
      image: "/img/momosilly.jpg",
      username: "alex",
      description: "Accidentally opened selfie mode. Regrets nothing. 📸😼",
    },
    {
      name: "Momo (Model Pose)",
      species: "Cat",
      image: "/img/momo.jpg",
      username: "riley",
      description: "Sits like a gentleman. Demands treats like a dragon. 🍗🐉",
    },
    {
      name: "Charlie",
      species: "Sun Conure",
      image: "/img/charliebird.jpg",
      username: "cmb84",
      description: "Volume set to 11, colors set to WOW. 🔊🟠🟢",
    },
    {
      name: "Cosho",
      species: "Cat",
      image: "/img/cosho.jpg",
      username: "ari",
      description: "Certified floral inspector. Sniffs, approves, supervises. 🌻👃",
    },
    {
      name: "Minerva",
      species: "Cat",
      image: "/img/minerva.jpg",
      username: "sam",
      description: "Void with whiskers. Appears when snacks are mentioned. 🌑✨",
    },
    {
      name: "Golden",
      species: "Dog",
      image: "/img/Golden.jpg",
      username: "team",
      description: "Beach zoomies champion. Will trade ball for compliments. 🏖️🎾",
    },
  ];

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiUrl("/api/posts/recent?limit=24"));
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok && Array.isArray(data?.posts)) {
          setPosts(data.posts);
        }
      } catch {
        // ignore; will fall back to sample pets
      } finally {
        if (!cancelled) setLoadingPosts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasPosts = posts.length > 0;

  // Pet of the Day = most recent upload (or demo)
  const potd = hasPosts
    ? posts[0]
    : {
        petName: samplePets[0].name,
        species: samplePets[0].species,
        imageUrl: samplePets[0].image,
        caption: samplePets[0].description,
        user: { username: samplePets[0].username },
      };

  return (
    <div className="page">
      {/* Hero banner */}
      <header className="hero pawfolio-hero">
        <div className="container">
          <h1 className="hero-title">
            {greeting}{user?.username ? `, ${user.username}` : ""}! Welcome to{" "}
            <span className="accent">PawFolio</span>
          </h1>
          <p className="hero-sub">
            Share adorable pets, discover new friends, and react with emojis. 🐾
          </p>
          <div style={{ marginTop: 16 }}>
            <a href="/about" className="btn btn-cta">Learn More</a>
          </div>
        </div>
      </header>

      <main className="container">
        {/* Pet of the Day */}
        <section className="home-card">
          <div className="home-card-header"><h3>🐶 Pet of the Day</h3></div>
          <div className="home-card-body">
            <div className="potd">
              <img className="potd-img" src={potd.imageUrl} alt={potd.petName} />
              <div className="potd-meta">
                <h4>
                  {potd.petName} <span className="badge">{potd.species}</span>
                </h4>
                <p>{potd.caption}</p>
                {potd.user?.username ? (
                  <p className="byline">
                    by <Link className="byline-link" to={`/u/${potd.user.username}`}>@{potd.user.username}</Link>
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Recent uploads */}
        <section style={{ marginTop: 24 }}>
          <h3 className="section-title">Recent</h3>

          {loadingPosts ? (
            <div className="section-note">Loading recent uploads…</div>
          ) : hasPosts ? (
            <div className="ig-grid">
              {posts.map((p) => (
                <article key={p.id} className="ig-card">
                  <img src={p.imageUrl} alt={p.petName} className="ig-img" loading="lazy" />
                  <div className="ig-meta">
                    <div className="ig-title-row">
                      <div className="ig-title">{p.petName}</div>
                      <span className="badge">{p.species}</span>
                    </div>
                    <div className="ig-byline">
                      by <Link className="byline-link" to={`/u/${p.user.username}`}>@{p.user.username}</Link>
                    </div>
                    {p.caption ? <p className="ig-caption">{p.caption}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid">
              {samplePets.map((p, i) => (
                <div key={i} className="pet-card">
                  <img src={p.image} alt={p.name} className="pet-img" />
                  <div className="pet-meta">
                    <h4>{p.name}</h4>
                    <div className="row">
                      <span className="badge">{p.species}</span>
                      <span className="byline">by @{p.username}</span>
                    </div>
                    <p>{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
