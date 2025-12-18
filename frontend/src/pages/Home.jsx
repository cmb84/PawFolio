import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { apiUrl } from "../lib/api";
import EmojiReactions from "../components/EmojiReactions";

export default function Home() {
  const { user } = useAuth();

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  /* ---------- Demo fallback ---------- */
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
        // fallback used below
      } finally {
        if (!cancelled) setLoadingPosts(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasPosts = posts.length > 0;

  /* ---------- Pet of the Day ---------- */
  const potd = hasPosts
    ? posts[0]
    : {
        id: "potd",
        petName: samplePets[0].name,
        species: samplePets[0].species,
        imageUrl: samplePets[0].image,
        caption: samplePets[0].description,
        user: { username: samplePets[0].username },
      };

  return (
    <div className="page">
      {/* Hero */}
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
                Sign in to explore more pets
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
        {/* 🐶 Pet of the Day */}
        <section className="home-card">
          <div className="home-card-header">
            <h3>🐶 Pet of the Day</h3>
          </div>

          <div className="home-card-body">
            <div className="potd">
              <img
                className="potd-img"
                src={apiUrl(potd.imagePath || potd.imageUrl)}
                alt={potd.petName}
              />

              <div className="potd-meta">
                <h4>
                  {potd.petName}{" "}
                  <span className="badge">{potd.species}</span>
                </h4>

                <p>{potd.caption}</p>

                {potd.user?.username && (
                  <p className="byline">
                    by{" "}
                    <Link
                      className="byline-link"
                      to={`/u/${potd.user.username}`}
                    >
                      @{potd.user.username}
                    </Link>
                  </p>
                )}

                {/* ✅ Reactions tied to potd.id */}
                <EmojiReactions postId={potd.id} />
              </div>
            </div>
          </div>
        </section>

        {/* 🔐 Recent uploads */}
        {user && (
          <section style={{ marginTop: 24 }}>
            <h3 className="section-title">Recent</h3>

            {loadingPosts ? (
              <div className="section-note">Loading recent uploads…</div>
            ) : hasPosts ? (
              <div className="ig-grid">
                {posts.map((p) => (
                  <article key={p.id} className="ig-card">
                    <img
                      src={apiUrl(p.imagePath || p.imageUrl)}
                      alt={p.petName}
                      className="ig-img"
                    />

                    <div className="ig-meta">
                      <div className="ig-title-row">
                        <div className="ig-title">{p.petName}</div>
                        <span className="badge">{p.species}</span>
                      </div>

                      <div className="ig-byline">
                        by{" "}
                        <Link
                          className="byline-link"
                          to={`/u/${p.user.username}`}
                        >
                          @{p.user.username}
                        </Link>
                      </div>

                      {p.caption && (
                        <p className="ig-caption">{p.caption}</p>
                      )}

                      {/* ✅ Reactions tied to post.id */}
                      <EmojiReactions postId={p.id} />
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
}