import { useMemo } from "react";
import { useAuth } from "../auth/AuthProvider";
import { Link } from "react-router-dom";


export default function Home() {
  const { user } = useAuth();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Local photos from public/img (served from site root)
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

  // Pet of the Day (still local for now)
  const potd = samplePets[0];

  return (
    <div className="page">
      {/* Hero banner */}
      <header className="hero pawfolio-hero">
        <div className="container">
          <h1 className="hero-title">
            {greeting}
            {user?.username ? `, ${user.username}` : ""}! Welcome to{" "}
            <span className="accent">PawFolio</span>
          </h1>

          <p className="hero-sub">
            Share adorable pets, discover new friends, and react with emojis. 🐾
          </p>

          {!user && (
            <div style={{ marginTop: 16 }}>
              <Link to="/login" className="btn btn-cta">
                Sign in to explore the gallery
              </Link>
            </div>
          )}

          {user && (
            <div style={{ marginTop: 16 }}>
              <Link to="/upload" className="btn btn-cta">
                Upload a pet
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="container">
        {/* 🐶 Pet of the Day — ALWAYS visible */}
        <section
          className="card"
          style={{
            background: "var(--bg-0)",
            borderRadius: 14,
            padding: 16,
            marginTop: 22,
          }}
        >
          <div className="card-header">
            <h3>🐶 Pet of the Day</h3>
          </div>

          <div className="card-body">
            <div className="potd">
              <img className="potd-img" src={potd.image} alt={potd.name} />
              <div className="potd-meta">
                <h4>
                  {potd.name} <span className="badge">{potd.species}</span>
                </h4>
                <p>{potd.description}</p>
                <p className="byline">by @{potd.username}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 🔐 Gallery — ONLY visible when signed in */}
        {user && (
          <section style={{ marginTop: 24 }}>
            <h3 className="section-title">Gallery</h3>
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
          </section>
        )}
      </main>
    </div>
  );
}