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
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="brand">🐾 PawCloud</Link>
        <div className="nav-links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/dashboard">My Pets</NavLink>
          <NavLink to="/about">About</NavLink>
        </div>
        <div className="nav-auth">
          {isAuthenticated ? (
            <button className="btn" onClick={handleLogout}>Logout</button>
          ) : (
            <>
              <NavLink className="btn" to="/login">Login</NavLink>
              <NavLink className="btn btn-primary" to="/signup">Sign up</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
