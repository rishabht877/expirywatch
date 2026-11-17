import "./RenewalFilters.css";
import PropTypes from "prop-types";
import { ASSET_TYPES } from "../assetOptions.js";

function RenewalFilters({ filters, onChange, onReset }) {
  function handleChange(event) {
    const { name, value } = event.target;
    onChange({ ...filters, [name]: value });
  }

  return (
    <form
      className="renewal-filters"
      role="search"
      aria-label="Filter renewals"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="field renewal-filters-search">
        <label htmlFor="renewal-filter-q">Search by asset name</label>
        <input
          id="renewal-filter-q"
          name="q"
          type="search"
          placeholder="Search renewals…"
          maxLength={100}
          value={filters.q}
          onChange={handleChange}
        />
      </div>

      <div className="field renewal-filters-type">
        <label htmlFor="renewal-filter-type">Type</label>
        <select
          id="renewal-filter-type"
          name="type"
          value={filters.type}
          onChange={handleChange}
        >
          <option value="">All types</option>
          {ASSET_TYPES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field renewal-filters-renewedBy">
        <label htmlFor="renewal-filter-renewedBy">Renewed by</label>
        <input
          id="renewal-filter-renewedBy"
          name="renewedBy"
          type="text"
          maxLength={80}
          placeholder="e.g. Priya Patel"
          value={filters.renewedBy}
          onChange={handleChange}
          aria-describedby="renewal-filter-renewedBy-hint"
        />
        <p id="renewal-filter-renewedBy-hint" className="visually-hidden">
          Enter the full name.
        </p>
      </div>

      <div className="field renewal-filters-from">
        <label htmlFor="renewal-filter-from">Renewed from</label>
        <input
          id="renewal-filter-from"
          name="from"
          type="date"
          value={filters.from}
          onChange={handleChange}
        />
      </div>

      <div className="field renewal-filters-to">
        <label htmlFor="renewal-filter-to">Renewed to</label>
        <input
          id="renewal-filter-to"
          name="to"
          type="date"
          value={filters.to}
          onChange={handleChange}
        />
      </div>

      <div className="renewal-filters-reset">
        <button type="button" className="secondary" onClick={onReset}>
          Reset filters
        </button>
      </div>
    </form>
  );
}

RenewalFilters.propTypes = {
  filters: PropTypes.shape({
    q: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    renewedBy: PropTypes.string.isRequired,
    from: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

export default RenewalFilters;
