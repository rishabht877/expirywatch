import "./Pagination.css";
import PropTypes from "prop-types";

const numberFormat = new Intl.NumberFormat("en-US");

// itemName is the singular noun shown in the count, e.g. "asset".
function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  itemName = "asset",
}) {
  const lastPage = Math.max(totalPages, 1);
  const label = itemName.charAt(0).toUpperCase() + itemName.slice(1);
  return (
    <nav className="pagination" aria-label={`${label} pages`}>
      <button
        type="button"
        className="secondary"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        ← Previous
      </button>
      <p className="pagination-status" aria-live="polite">
        Page {numberFormat.format(page)} of {numberFormat.format(lastPage)} (
        {numberFormat.format(total)} {total === 1 ? itemName : `${itemName}s`})
      </p>
      <button
        type="button"
        className="secondary"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= lastPage}
      >
        Next →
      </button>
    </nav>
  );
}

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  itemName: PropTypes.string,
};

export default Pagination;
