import { useAuth } from "../auth/AuthProvider";

export default function Home() {
  const { user } = useAuth();

  // ✅ Remote Unsplash placeholders (no setup required)
  const samplePets = [
    {
      name: "Bella",
      species: "Dog",
      description: "Golden Retriever who loves the beach 🐾",
      image:
        <img src="/images/Golden.png"alt="Golden Retriever" className="pet-img" />

    },
    {
      name: "Milo",
      species: "Cat",
      description: "Enjoys long naps and head scratches 😺",
      image:
        "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=800&auto=format&fit=crop",
    },
    {
      name: "Luna",
      species: "Bunny",
      description: "Fluffy and full of energy 🌙",
      image:
        "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&auto=format&fit=crop",
    },
    {
      name: "Sunny",
      species: "Bird",
      description: "Always singing cheerful tunes ☀️",
      image:
        "https://images.unsplash.com/photo-1525253086316-d0c936c814f8?q=80&w=800&auto=format&fit=crop",
    },
  ];

  return (
    <div className="page">
      {/* 🐾 Hero Section */}
      <header className="hero pawfolio-hero">
        <div className="container">
          <h1 className="hero-title">
            Welcome{user?.username ? `, ${user.username}` : ""} to{" "}
            <span className="accent">PawFolio</span>
          </h1>
          <p className="hero-sub">
            Discover adorable pets from all over the world, share your own soon,
            and explore our growing gallery of furry (and feathery) friends!
          </p>
        </div>
      </header>

      {/* 🐕 Pet of the Day */}
      <main className="container">
        <section className="card">
          <div className="card-header">
            <h3>🐾 Pet of the Day</h3>
          </div>
          <div className="card-body">
            <div className="potd">
              <img
                className="potd-img"
                src={samplePets[0].image}
                alt={samplePets[0].name}
              />
              <div className="potd-meta">
                <h4>
                  {samplePets[0].name}{" "}
                  <span className="badge">{samplePets[0].species}</span>
                </h4>
                <p>{samplePets[0].description}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 🐈 Pet Gallery */}
        <section>
          <h3 className="section-title">Pet Gallery</h3>
          <div className="grid">
            {samplePets.map((pet, i) => (
              <div key={i} className="pet-card">
                <img
                  src={pet.image}
                  alt={pet.name}
                  className="pet-img"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1507149833265-60c372daea22?q=80&w=800&auto=format&fit=crop";
                  }}
                />
                <div className="pet-meta">
                  <h4>{pet.name}</h4>
                  <div className="row">
                    <span className="badge">{pet.species}</span>
                    <span className="byline">shared by guest</span>
                  </div>
                  <p>{pet.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
