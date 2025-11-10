import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function About() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      nav("/dashboard", { replace: true });
    }
  }, [loading, user, nav]);

  const team = [
    {
      name: "Peter Redfern",
      role: "Back End 1",
      email: "par36@njit.edu",
      img: "/team/peter-redfern.jpg",
    },
    {
      name: "Tom Kolawole",
      role: "Back End 2",
      email: "ook2@njit.edu",
      img: "/team/tom-kolawole.jpg",
    },
    {
      name: "Justin Chung",
      role: "Databases",
      email: "jjc88@njit.edu",
      img: "/team/justin-chung.jpg",
    },
    {
      name: "Min Namgung",
      role: "RabbitMQ",
      email: "mn548@njit.edu",
      img: "/team/min-namgung.jpg",
    },
    {
      name: "Riley MacFarlane",
      role: "Front End",
      email: "rbm@njit.edu",
      img: "/team/riley-macfarlane.jpg",
    },
  ];

  return (
    <main className="page content" role="main">
      <section className="about-wrap1">
        <h1 className="about-h1">
          About <span className="accent">Moodvies</span>
        </h1>
        <p className="about-lead">
          Moodvies is a movie discovery app that recommends films based on how you feel.
          Start with a mood—not just a genre—and we’ll find titles that match that
          emotional tone. See where each movie is streaming, read summaries, and save them
          to watch later or share with friends.
        </p>
      </section>

      <section className="about-wrap2">
        <h2 className="about-h2">What we built</h2>
        <ul className="about-list">
          <li>
            <strong className="accent">Mood-based discovery:</strong> recommendations driven by how you feel.
          </li>
          <li>
            <strong className="accent">Movie info:</strong> ratings, descriptions, and streaming availability in
            one place.
          </li>
          <li>
            <strong className="accent">Lists & sharing:</strong> save favorites, build watchlists, and send them
            to friends.
          </li>
          <li>
            <strong className="accent">Social voting:</strong> let friends vote on movies to quickly choose what
            to watch next.
          </li>
        </ul>
      </section>

      <section className="about-wrap3">
        <h2 className="about-h2 accent">Meet the Team</h2>
        <div className="team-grid">
          {team.map((m) => (
            <article className="feature team-article" key={m.name}>
              <div className="team-avatar">
                <img
                  src={m.img}
                  alt={`${m.name} headshot`}
                  className="team-img-el"
                  loading="lazy"
                />
              </div>
              <div className="team-info">
                <h3 className="team-name accent">{m.name}</h3>
                <p className="team-role">{m.role}</p>
                <p className="team-email">{m.email}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
