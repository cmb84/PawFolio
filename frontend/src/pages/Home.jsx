import FeaturesRow from "../ui/FeaturesRow";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../auth/AuthProvider";

export default function Home() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      nav("/dashboard", { replace: true });
    }
  }, [loading, user, nav]);

  return (
    <main className="page home">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <h1 className="hero-title">
              Give us your <span className="accent">mood</span>,<br />
              we give you<br />
              the <span className="accent">movies</span>
            </h1>

            <div className="search" role="search">
              <input
                type="text"
                placeholder=" "
                aria-label="Enter a mood"
              />
              <div className="ph" aria-hidden="true">
                <span className="ph-white">Enter a </span>
                <span className="ph-accent">mood</span>
              </div>

              <Link
                to={user ? "/dashboard" : "/login"}
                className="btn-cta"
                role="button"
              >
                Find Movies
              </Link>
            </div>
          </div>

          <div className="hero-right" aria-hidden="true">
            <div className="posters">
              <img className="poster" src="https://image.tmdb.org/t/p/w500/1hRoyzDtpgMU7Dz4JF22RANzQO7.jpg" alt="The Dark Knight" />
              <img className="poster" src="https://image.tmdb.org/t/p/w500/2H1TmgdfNtsKlU9jKdeNyYL5y8T.jpg" alt="Inside Out" />
              <img className="poster" src="https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg" alt="Joker" />
              <img className="poster" src="https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg" alt="The Shawshank Redemption" />
            </div>
          </div>
        </div>
      </section>

      <FeaturesRow />
    </main>
  );
}
