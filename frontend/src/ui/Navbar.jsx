import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="nav-wrap">
      <div className="nav">
        {/* === Brand === */}
        <Link to="/" className="brand">
          <img
            src="/img/logo.png"
            alt="PawFolio logo"
            className="brand-logo"
          />
          <span className="brand-wordmark">PawFolio</span>
        </Link>

        {/* === Navigation Links === */}
        <div className="nav-links">
          <NavLink to="/" className="nav-link">
            Home
          </NavLink>
          <NavLink to="/about" className="nav-link">
            About
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className="nav-link">
              Dashboard
            </NavLink>
          )}
        </div>

        {/* === Right Side Actions === */}
        <div className="nav-right">
          {user ? (
            <details className="nav-user">
              <summary className="nav-user-btn">
                <span className="avatar-sm">
                  {user.username ? user.username[0].toUpperCase() : "U"}
                </span>
                <span className="nav-user-name">{user.username}</span>
              </summary>
              <div className="nav-menu">
                <button className="nav-menu-item" onClick={logout}>
                  Logout
                </button>
              </div>
            </details>
          ) : (
            <Link to="/login" className="btn-signin btn">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
