import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="nav-wrap">
      <header className="nav" role="navigation" aria-label="Main">
        {/* Left side: brand */}
        <Link to="/" className="brand brand-logo-only" aria-label="Moodvies Home">
          <img className="brand-logo" src="/logo.png" alt="Moodvies logo" loading="eager" />
        </Link>

        {/* Right side: links + sign in/out */}
        <div className="nav-right">
          <nav className="nav-links">
            {!isAuthenticated ? (
              <>
                <NavLink
                  to="/"
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  Home
                </NavLink>
                <NavLink
                  to="/about"
                  className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
                >
                  About
                </NavLink>
              </>
            ) : (
              <NavLink
                to="/dashboard"
                className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              >
                Dashboard
              </NavLink>
            )}
          </nav>

          <div className="nav-actions">
            {!isAuthenticated ? (
              <Link to="/login" className="btn btn-signin">
                Sign In
              </Link>
            ) : (
              <button className="btn btn-signin" onClick={handleLogout}>
                Logout
              </button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
