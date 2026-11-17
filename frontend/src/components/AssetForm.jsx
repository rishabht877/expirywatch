import "./AssetForm.css";
import PropTypes from "prop-types";
import { useState } from "react";
import { ASSET_TYPES, ENVIRONMENTS } from "../assetOptions.js";
import { toDateInputValue } from "../dates.js";

const EMPTY_VALUES = {
  name: "",
  type: "",
  environment: "",
  owner: "",
  expiresAt: "",
  notes: "",
};

function initialValues(asset) {
  if (!asset) {
    return EMPTY_VALUES;
  }
  return {
    name: asset.name,
    type: asset.type,
    environment: asset.environment,
    owner: asset.owner,
    expiresAt: toDateInputValue(asset.expiresAt),
    notes: asset.notes ?? "",
  };
}

// Same limits and allowed values as backend/lib/validation.js.
function validate(values) {
  const errors = {};
  const name = values.name.trim();
  if (name.length < 1 || name.length > 120) {
    errors.name = "Name must be between 1 and 120 characters.";
  }
  if (!ASSET_TYPES.some((option) => option.value === values.type)) {
    errors.type = "Choose a type.";
  }
  if (!ENVIRONMENTS.some((option) => option.value === values.environment)) {
    errors.environment = "Choose an environment.";
  }
  const owner = values.owner.trim();
  if (owner.length < 1 || owner.length > 80) {
    errors.owner = "Owner must be between 1 and 80 characters.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.expiresAt)) {
    errors.expiresAt = "Choose an expiry date.";
  }
  if (values.notes.trim().length > 1000) {
    errors.notes = "Notes must be at most 1000 characters.";
  }
  return errors;
}

// Used for both creating and editing. The parent mounts a fresh copy each time
// the panel opens, so the initial state always matches the asset being edited.
function AssetForm({ asset, onSave, onCancel }) {
  const editing = Boolean(asset);
  const [values, setValues] = useState(() => initialValues(asset));
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

    // Keep the exact stored time when the date was not changed.
    const expiresAt =
      editing && values.expiresAt === toDateInputValue(asset.expiresAt)
        ? asset.expiresAt
        : values.expiresAt;

    setSubmitting(true);
    try {
      // PUT replaces the whole asset, so every field is sent on edit too.
      await onSave({
        name: values.name.trim(),
        type: values.type,
        environment: values.environment,
        owner: values.owner.trim(),
        expiresAt,
        notes: values.notes.trim(),
      });
    } catch (err) {
      setServerErrors(err.errors ?? [err.message]);
    } finally {
      setSubmitting(false);
    }
  }

  function fieldProps(name) {
    const error = fieldErrors[name];
    return {
      id: `asset-${name}`,
      name,
      value: values[name],
      onChange: handleChange,
      "aria-invalid": Boolean(error),
      "aria-describedby": error ? `asset-${name}-error` : undefined,
    };
  }

  function errorFor(name) {
    return (
      fieldErrors[name] && (
        <p id={`asset-${name}-error`} className="field-error">
          {fieldErrors[name]}
        </p>
      )
    );
  }

  return (
    <form className="asset-form" onSubmit={handleSubmit} noValidate>
      <h2 id="asset-form-title">
        {editing ? `Edit “${asset.name}”` : "Add an asset"}
      </h2>

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
        <label htmlFor="asset-name">Name</label>
        <input type="text" required {...fieldProps("name")} />
        {errorFor("name")}
      </div>

      <div className="asset-form-row">
        <div className="field">
          <label htmlFor="asset-type">Type</label>
          <select required {...fieldProps("type")}>
            <option value="">Choose…</option>
            {ASSET_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errorFor("type")}
        </div>

        <div className="field">
          <label htmlFor="asset-environment">Environment</label>
          <select required {...fieldProps("environment")}>
            <option value="">Choose…</option>
            {ENVIRONMENTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errorFor("environment")}
        </div>
      </div>

      <div className="asset-form-row">
        <div className="field">
          <label htmlFor="asset-owner">Owner</label>
          <input type="text" required {...fieldProps("owner")} />
          {errorFor("owner")}
        </div>

        <div className="field">
          <label htmlFor="asset-expiresAt">Expiry date</label>
          <input type="date" required {...fieldProps("expiresAt")} />
          {errorFor("expiresAt")}
        </div>
      </div>

      <div className="field">
        <label htmlFor="asset-notes">Notes (optional)</label>
        <textarea rows={3} {...fieldProps("notes")} />
        {errorFor("notes")}
      </div>

      <div className="asset-form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : editing ? "Save changes" : "Add asset"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

AssetForm.propTypes = {
  asset: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    environment: PropTypes.string.isRequired,
    owner: PropTypes.string.isRequired,
    expiresAt: PropTypes.string.isRequired,
    notes: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default AssetForm;
