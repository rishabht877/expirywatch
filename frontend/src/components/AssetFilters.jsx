import "./AssetFilters.css";
import PropTypes from "prop-types";
import { ASSET_TYPES, ENVIRONMENTS, SORTS, STATUSES } from "../assetOptions.js";

function AssetFilters({ filters, onChange, onReset }) {
  function handleChange(event) {
    const { name, value } = event.target;
    onChange({ ...filters, [name]: value });
  }

  return (
    <form
      className="asset-filters"
      role="search"
      aria-label="Filter assets"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="field asset-filters-search">
        <label htmlFor="filter-q">Search by name</label>
        <input
          id="filter-q"
          name="q"
          type="search"
          placeholder="Search assets…"
          maxLength={100}
          value={filters.q}
          onChange={handleChange}
        />
      </div>

      <div className="field asset-filters-type">
        <label htmlFor="filter-type">Type</label>
        <select
          id="filter-type"
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

      <div className="field asset-filters-environment">
        <label htmlFor="filter-environment">Environment</label>
        <select
          id="filter-environment"
          name="environment"
          value={filters.environment}
          onChange={handleChange}
        >
          <option value="">All environments</option>
          {ENVIRONMENTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field asset-filters-owner">
        <label htmlFor="filter-owner">Owner</label>
        <input
          id="filter-owner"
          name="owner"
          type="text"
          maxLength={80}
          value={filters.owner}
          onChange={handleChange}
          placeholder="e.g. Platform Team"
          aria-describedby="filter-owner-hint"
        />
        <p id="filter-owner-hint" className="visually-hidden">
          Enter the full owner name.
        </p>
      </div>

      <div className="field asset-filters-status">
        <label htmlFor="filter-status">Status</label>
        <select
          id="filter-status"
          name="status"
          value={filters.status}
          onChange={handleChange}
        >
          <option value="">All statuses</option>
          {STATUSES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field asset-filters-sort">
        <label htmlFor="filter-sort">Sort by</label>
        <select
          id="filter-sort"
          name="sort"
          value={filters.sort}
          onChange={handleChange}
        >
          {SORTS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="asset-filters-reset">
        <button type="button" className="secondary" onClick={onReset}>
          Reset filters
        </button>
      </div>
    </form>
  );
}

AssetFilters.propTypes = {
  filters: PropTypes.shape({
    q: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    environment: PropTypes.string.isRequired,
    owner: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    sort: PropTypes.string.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

export default AssetFilters;
