import { useEffect, useMemo } from "react";
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

  if (loading) return null;

  const trending = [
    {
      t: "Blade Runner 2049",
      y: 2017,
      img: "https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
      imdb: "https://www.imdb.com/title/tt1856101/",
    },
    {
      t: "The Dark Knight",
      y: 2008,
      img: "https://image.tmdb.org/t/p/w500/1hRoyzDtpgMU7Dz4JF22RANzQO7.jpg",
      imdb: "https://www.imdb.com/title/tt0468569/",
    },
    {
      t: "The Godfather",
      y: 1972,
      img: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
      imdb: "https://www.imdb.com/title/tt0068646/",
    },
    {
      t: "Joker",
      y: 2019,
      img: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
      imdb: "https://www.imdb.com/title/tt7286456/",
    },
    {
      t: "Spirited Away",
      y: 2001,
      img: "https://image.tmdb.org/t/p/w500/oRvMaJOmapypFUcQqpgHMZA6qL9.jpg",
      imdb: "https://www.imdb.com/title/tt0245429/",
    },
    {
      t: "Frozen",
      y: 2013,
      img: "https://image.tmdb.org/t/p/w500/kgwjIb2JDHRhNk13lmSxiClFjVk.jpg",
      imdb: "https://www.imdb.com/title/tt2294629/",
    },
  ];

  const topRated = [
    {
      t: "Schindler’s List",
      y: 1993,
      img: "https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
      imdb: "https://www.imdb.com/title/tt0108052/",
    },
    {
      t: "The Lord of the Rings: The Return of the King",
      y: 2003,
      img: "https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
      imdb: "https://www.imdb.com/title/tt0167260/",
    },
    {
      t: "Terminator 2: Judgment Day",
      y: 1991,
      img: "https://image.tmdb.org/t/p/w500/weVXMD5QBGeQil4HEATZqAkXeEc.jpg",
      imdb: "https://www.imdb.com/title/tt0103064/",
    },
    {
      t: "Fight Club",
      y: 1999,
      img: "https://image.tmdb.org/t/p/w500/bptfVGEQuv6vDTIMVCHjJ9Dz8PX.jpg",
      imdb: "https://www.imdb.com/title/tt0137523/",
    },
    {
      t: "Interstellar",
      y: 2014,
      img: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      imdb: "https://www.imdb.com/title/tt0816692/",
    },
  ];

  const MoodChip = ({ label, emoji }) => (
    <button className="mood-chip" type="button">
      <span style={{ marginRight: 8 }}>{emoji}</span>
      {label}
    </button>
  );

  const Poster = ({ m }) => (
    <a href={m.imdb} target="_blank" rel="noopener noreferrer" className="poster-card">
      <img src={m.img} alt={m.t} className="poster-img" loading="lazy" />
      <div className="poster-info">
        <div className="poster-title">{m.t}</div>
        <div className="poster-year">{m.y}</div>
      </div>
    </a>
  );

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
              What’s your <span className="accent">mood</span> today?
            </h2>

            <div className="mood-bar">
              <MoodChip emoji="😊" label="Happy" />
              <MoodChip emoji="😔" label="Sad" />
              <MoodChip emoji="💘" label="Romantic" />
              <MoodChip emoji="😎" label="Chill" />
              <MoodChip emoji="🧭" label="Adventurous" />
              <button className="btn-cta">Continue →</button>
            </div>
          </div>
        </div>
      </section>

      <section className="movie-section">
        <h3 className="feature-title">Trending Now</h3>
        <div className="poster-grid">
          {trending.map((m) => (
            <Poster key={m.imdb} m={m} />
          ))}
        </div>
      </section>

      <section className="movie-section">
        <h3 className="feature-title">Top Rated Across Platforms</h3>
        <div className="poster-grid">
          {topRated.map((m) => (
            <Poster key={m.imdb} m={m} />
          ))}
        </div>
      </section>
    </main>
  );
}
