import "./RegisterForm.css";
import PropTypes from "prop-types";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same limits as the server: name 1-80, valid email, password 8-72.
function validate({ name, email, password, confirmPassword }) {
  const errors = {};
  const trimmedName = name.trim();
  if (trimmedName.length < 1 || trimmedName.length > 80) {
    errors.name = "Name must be between 1 and 80 characters.";
  }
  const trimmedEmail = email.trim();
  if (trimmedEmail.length > 254 || !EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "Enter a valid email address.";
  }
  if (password.length < 8 || password.length > 72) {
    errors.password = "Password must be between 8 and 72 characters.";
  }
  if (confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
}

const FIELDS = [
  { name: "name", label: "Name", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  {
    name: "password",
    label: "Password",
    type: "password",
    autoComplete: "new-password",
    hint: "8 to 72 characters.",
  },
  {
    name: "confirmPassword",
    label: "Confirm password",
    type: "password",
    autoComplete: "new-password",
  },
];

function RegisterForm({ onSuccess }) {
  const { register } = useAuth();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
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
      // confirmPassword is checked here only; the server rejects unknown fields.
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      onSuccess();
    } catch (err) {
      setServerErrors(err.errors ?? [err.message]);
      setSubmitting(false);
    }
  }

  return (
    <form className="register-form" onSubmit={handleSubmit} noValidate>
      {serverErrors.length > 0 && (
        <div className="alert alert-error" role="alert">
          <ul>
            {serverErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      {FIELDS.map((field) => {
        const id = `register-${field.name}`;
        const error = fieldErrors[field.name];
        const describedBy = [
          field.hint ? `${id}-hint` : null,
          error ? `${id}-error` : null,
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <div className="field" key={field.name}>
            <label htmlFor={id}>{field.label}</label>
            <input
              id={id}
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              value={values[field.name]}
              onChange={handleChange}
              aria-invalid={Boolean(error)}
              aria-describedby={describedBy || undefined}
              required
            />
            {field.hint && (
              <p id={`${id}-hint`} className="field-hint">
                {field.hint}
              </p>
            )}
            {error && (
              <p id={`${id}-error`} className="field-error">
                {error}
              </p>
            )}
          </div>
        );
      })}
      <button type="submit" className="register-submit" disabled={submitting}>
        {submitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

RegisterForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
};

export default RegisterForm;
