import { useAuth } from "../auth/AuthProvider";

export default function Home() {
  const { user } = useAuth();

  const samplePets = [
    {
      name: "Bella",
      species: "Dog",
      description: "Golden Retriever who loves the beach 🐾",
      image: "/img/sample-dog.jpg",
    },
    {
      name: "Milo",
      species: "Cat",
      description: "Enjoys long naps and head scratches 😺",
      image: "/img/sample-cat.jpg",
    },
    {
      name: "Luna",
      species: "Bunny",
      description: "Fluffy and full of energy 🌙",
      image: "/img/sample-bunny.jpg",
    },
  ];

  return (
    <div className="page">
      {/* Hero section */}
      <header className="hero pawfolio-hero">
        <div className="container">
          <h1 className="hero-title">
            Welcome{user?.username ? `, ${user.username}` : ""} to{" "}
            <span className="accent">PawFolio</span>
          </h1>
          <p className="hero-sub">
            Discover adorable pets, upload your own soon, and enjoy a cozy
            gallery made for animal lovers.
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="container">
        {/* Pet of the Day */}
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

        {/* Gallery Section */}
        <section>
          <h3 className="section-title">Pet Gallery</h3>
          <div className="grid">
            {samplePets.map((pet, i) => (
              <div key={i} className="pet-card">
                <img src={pet.image} alt={pet.name} />
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
