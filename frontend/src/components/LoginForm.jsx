import "./LoginForm.css";
import PropTypes from "prop-types";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ email, password }) {
  const errors = {};
  if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (password === "") {
    errors.password = "Enter your password.";
  }
  return errors;
}

function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const [values, setValues] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = validate(values);
    setFieldErrors(errors);
    setServerErrors([]);
    if (Object.keys(errors).length > 0) {
      return;
    }
    setSubmitting(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
      onSuccess();
    } catch (err) {
      setServerErrors(err.errors ?? [err.message]);
      setSubmitting(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      {serverErrors.length > 0 && (
        <div className="alert alert-error" role="alert">
          <ul>
            {serverErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="field">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
          required
        />
        {fieldErrors.email && (
          <p id="login-email-error" className="field-error">
            {fieldErrors.email}
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={
            fieldErrors.password ? "login-password-error" : undefined
          }
          required
        />
        {fieldErrors.password && (
          <p id="login-password-error" className="field-error">
            {fieldErrors.password}
          </p>
        )}
      </div>
      <button type="submit" className="login-submit" disabled={submitting}>
        {submitting ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}

LoginForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
};

export default LoginForm;
