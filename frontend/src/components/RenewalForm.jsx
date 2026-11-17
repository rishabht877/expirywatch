import "./RenewalForm.css";
import PropTypes from "prop-types";
import { useState } from "react";
import { ASSET_TYPES } from "../assetOptions.js";
import { toDateInputValue } from "../dates.js";

const DATE_INPUT = /^\d{4}-\d{2}-\d{2}$/;

function initialValues(renewal) {
  if (!renewal) {
    return {
      assetName: "",
      type: "",
      renewedBy: "",
      renewedAt: toDateInputValue(new Date().toISOString()),
      newExpiryDate: "",
      notes: "",
    };
  }
  return {
    assetName: renewal.assetName,
    type: renewal.type,
    renewedBy: renewal.renewedBy,
    renewedAt: toDateInputValue(renewal.renewedAt),
    newExpiryDate: toDateInputValue(renewal.newExpiryDate),
    notes: renewal.notes ?? "",
  };
}

// Same limits and allowed values as backend/lib/renewalValidation.js.
function validate(values) {
  const errors = {};
  const assetName = values.assetName.trim();
  if (assetName.length < 1 || assetName.length > 120) {
    errors.assetName = "Asset name must be between 1 and 120 characters.";
  }
  if (!ASSET_TYPES.some((option) => option.value === values.type)) {
    errors.type = "Choose a type.";
  }
  const renewedBy = values.renewedBy.trim();
  if (renewedBy.length < 1 || renewedBy.length > 80) {
    errors.renewedBy = "Renewed by must be between 1 and 80 characters.";
  }
  if (!DATE_INPUT.test(values.renewedAt)) {
    errors.renewedAt = "Choose the renewal date.";
  }
  if (!DATE_INPUT.test(values.newExpiryDate)) {
    errors.newExpiryDate = "Choose the new expiry date.";
  } else if (
    DATE_INPUT.test(values.renewedAt) &&
    values.newExpiryDate <= values.renewedAt
  ) {
    errors.newExpiryDate = "New expiry date must be after the renewal date.";
  }
  if (values.notes.trim().length > 1000) {
    errors.notes = "Notes must be at most 1000 characters.";
  }
  return errors;
}

// Keeps the exact stored time when a date field was not changed.
function keepStoredTime(inputValue, storedIso) {
  return storedIso && inputValue === toDateInputValue(storedIso)
    ? storedIso
    : inputValue;
}

// Used for both creating and editing. The parent mounts a fresh copy each time
// the panel opens, so the initial state always matches the renewal being edited.
function RenewalForm({ renewal, onSave, onCancel }) {
  const editing = Boolean(renewal);
  const [values, setValues] = useState(() => initialValues(renewal));
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
      // PUT replaces the whole renewal, so every field is sent on edit too.
      await onSave({
        assetName: values.assetName.trim(),
        type: values.type,
        renewedBy: values.renewedBy.trim(),
        renewedAt: keepStoredTime(values.renewedAt, renewal?.renewedAt),
        newExpiryDate: keepStoredTime(
          values.newExpiryDate,
          renewal?.newExpiryDate,
        ),
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
      id: `renewal-${name}`,
      name,
      value: values[name],
      onChange: handleChange,
      "aria-invalid": Boolean(error),
      "aria-describedby": error ? `renewal-${name}-error` : undefined,
    };
  }

  function errorFor(name) {
    return (
      fieldErrors[name] && (
        <p id={`renewal-${name}-error`} className="field-error">
          {fieldErrors[name]}
        </p>
      )
    );
  }

  return (
    <form className="renewal-form" onSubmit={handleSubmit} noValidate>
      <h2 id="renewal-form-title">
        {editing ? `Edit renewal of “${renewal.assetName}”` : "Log a renewal"}
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
        <label htmlFor="renewal-assetName">Asset name</label>
        <input type="text" required {...fieldProps("assetName")} />
        {errorFor("assetName")}
      </div>

      <div className="renewal-form-row">
        <div className="field">
          <label htmlFor="renewal-type">Type</label>
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
          <label htmlFor="renewal-renewedBy">Renewed by</label>
          <input type="text" required {...fieldProps("renewedBy")} />
          {errorFor("renewedBy")}
        </div>
      </div>

      <div className="renewal-form-row">
        <div className="field">
          <label htmlFor="renewal-renewedAt">Renewed on</label>
          <input type="date" required {...fieldProps("renewedAt")} />
          {errorFor("renewedAt")}
        </div>

        <div className="field">
          <label htmlFor="renewal-newExpiryDate">New expiry date</label>
          <input type="date" required {...fieldProps("newExpiryDate")} />
          {errorFor("newExpiryDate")}
        </div>
      </div>

      <div className="field">
        <label htmlFor="renewal-notes">Notes (optional)</label>
        <textarea rows={3} {...fieldProps("notes")} />
        {errorFor("notes")}
      </div>

      <div className="renewal-form-actions">
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : editing ? "Save changes" : "Log renewal"}
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

RenewalForm.propTypes = {
  renewal: PropTypes.shape({
    id: PropTypes.string.isRequired,
    assetName: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    renewedBy: PropTypes.string.isRequired,
    renewedAt: PropTypes.string.isRequired,
    newExpiryDate: PropTypes.string.isRequired,
    notes: PropTypes.string,
  }),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default RenewalForm;
