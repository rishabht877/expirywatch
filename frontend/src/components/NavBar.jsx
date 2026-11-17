import "./NavBar.css";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    setError(null);
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      setError(err.errors?.join(" ") ?? err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="navbar">
      <nav className="navbar-inner" aria-label="Main">
        <Link to={user ? "/dashboard" : "/login"} className="navbar-brand">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          ExpiryWatch
        </Link>
        {user ? (
          <>
            <ul className="navbar-links">
              <li>
                <NavLink to="/dashboard">Dashboard</NavLink>
              </li>
              <li>
                <NavLink to="/assets">Assets</NavLink>
              </li>
              <li>
                <NavLink to="/renewals">Renewals</NavLink>
              </li>
            </ul>
            <div className="navbar-user">
              <span className="navbar-name">Signed in as {user.name}</span>
              <button
                type="button"
                className="secondary"
                onClick={handleLogout}
                disabled={busy}
              >
                {busy ? "Logging out…" : "Log out"}
              </button>
            </div>
          </>
        ) : (
          <ul className="navbar-links navbar-links-guest">
            <li>
              <NavLink to="/login">Log in</NavLink>
            </li>
            <li>
              <NavLink to="/register">Register</NavLink>
            </li>
          </ul>
        )}
      </nav>
      {error && (
        <p className="navbar-error" role="alert">
          {error}
        </p>
      )}
    </header>
  );
}

NavBar.propTypes = {};

export default NavBar;
