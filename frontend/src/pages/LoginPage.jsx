import "./LoginPage.css";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? "/dashboard";

  if (loading) {
    return <p role="status">Checking your session…</p>;
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-page">
      <section className="panel login-page-card">
        <h1>Log in</h1>
        <p className="muted login-page-intro">
          Track certificates, domains, API keys and licenses before they expire.
        </p>
        <aside className="login-page-demo" aria-labelledby="demo-heading">
          <h2 id="demo-heading">Try the demo account</h2>
          <dl>
            <div>
              <dt>Email</dt>
              <dd>
                <code>demo@expirywatch.dev</code>
              </dd>
            </div>
            <div>
              <dt>Password</dt>
              <dd>
                <code>ExpiryDemo2026</code>
              </dd>
            </div>
          </dl>
          <p>It comes with 1,200 sample assets to explore.</p>
        </aside>
        <LoginForm onSuccess={() => navigate(from, { replace: true })} />
        <p className="login-page-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </div>
  );
}

LoginPage.propTypes = {};

export default LoginPage;
