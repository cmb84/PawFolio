import { useMemo } from "react";
import { useAuth } from "../auth/AuthProvider";

export default function Home() {
  const { user } = useAuth();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // Static sample content (no API)
  const petOfTheDay = {
    name: "Luna",
    species: "Cat",
    description: "Sunbeam nap specialist and laser-dot hunter.",
    imageUrl:
      "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=1200&auto=format&fit=crop",
  };

  const samplePets = [
    {
      id: 1,
      name: "Milo",
      species: "Dog",
      username: "milo_owner",
      description: "Ball enthusiast. Will sit for treats.",
      imageUrl:
        "https://images.unsplash.com/photo-1507149833265-60c372daea22?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 2,
      name: "Willow",
      species: "Rabbit",
      username: "bunclub",
      description: "Expert in leafy greens.",
      imageUrl:
        "https://images.unsplash.com/photo-1518792399576-eaf0a5b2d395?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 3,
      name: "Rio",
      species: "Bird",
      username: "feather_fam",
      description: "Morning singer. Loves sunflower seeds.",
      imageUrl:
        "https://images.unsplash.com/photo-1518020961727-3d0e1a6d27f3?q=80&w=800&auto=format&fit=crop",
    },
    {
      id: 4,
      name: "Cleo",
      species: "Reptile",
      username: "scaled_buddy",
      description: "Sun lamp enjoyer.",
      imageUrl:
        "https://images.unsplash.com/photo-1615222288255-d8ab271aac3f?q=80&w=800&auto=format&fit=crop",
    },
  ];

  return (
    <div className="page">
      <header className="hero">
        <div className="container">
          <h1 className="hero-title">
            {greeting}
            {user?.username ? `, ${user.username}` : ""}! Welcome to{" "}
            <span className="accent">PawFolio</span>
          </h1>
          <p className="hero-sub">
            Browse adorable pets, share yours soon, and enjoy a calm, cozy gallery.
          </p>
        </div>
      </header>

      <main className="container">
        {/* Pet of the Day (static for now) */}
        <section className="card">
          <div className="card-header">
            <h3> Pet of the Day</h3>
          </div>
          <div className="card-body">
            {petOfTheDay ? (
              <div className="potd">
                <img
                  className="potd-img"
                  src={petOfTheDay.imageUrl}
                  alt={petOfTheDay.name}
                />
                <div className="potd-meta">
                  <h4>
                    {petOfTheDay.name}{" "}
                    <span className="badge">{petOfTheDay.species}</span>
                  </h4>
                  <p>{petOfTheDay.description || "No description yet."}</p>
                </div>
              </div>
            ) : (
              <p>No pets yet—come back soon!</p>
            )}
          </div>
        </section>

        {/* Upload placeholder (no API yet) */}
        <section className="card">
          <div className="card-header">
            <h3>📤 Upload a Pet (coming soon)</h3>
          </div>
          <div className="card-body">
            <p style={{ margin: 0 }}>
              We’re polishing the uploader. For now, enjoy the gallery below. 
            </p>
          </div>
        </section>

        {/* Static Gallery */}
        <section>
          <h3 className="section-title">Gallery</h3>
          <div className="grid">
            {samplePets.map((p) => (
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
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
