import "./RegisterPage.css";
import { Link, Navigate, useNavigate } from "react-router-dom";
import RegisterForm from "../components/RegisterForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function RegisterPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <p role="status">Checking your session…</p>;
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="register-page">
      <section className="panel register-page-card">
        <h1>Create an account</h1>
        <p className="muted register-page-intro">
          You will be logged in as soon as your account is created.
        </p>
        <aside className="register-page-demo" aria-label="Demo account">
          <p>
            Just looking around? <Link to="/login">Log in</Link> with the demo
            account: <code>demo@expirywatch.dev</code> /{" "}
            <code>ExpiryDemo2026</code>
          </p>
        </aside>
        <RegisterForm
          onSuccess={() => navigate("/dashboard", { replace: true })}
        />
        <p className="register-page-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </div>
  );
}

RegisterPage.propTypes = {};

export default RegisterPage;
