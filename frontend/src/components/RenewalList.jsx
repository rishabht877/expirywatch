import "./RenewalList.css";
import PropTypes from "prop-types";
import { typeLabel } from "../assetOptions.js";
import { formatDate } from "../dates.js";

function RenewalList({ renewals, editingId, busyId, onEdit, onDelete }) {
  function handleDelete(renewal) {
    if (
      window.confirm(
        `Delete the renewal of “${renewal.assetName}”? This cannot be undone.`,
      )
    ) {
      onDelete(renewal);
    }
  }

  return (
    <table className="renewal-list stack-table">
      <caption className="visually-hidden">Your renewals</caption>
      <thead>
        <tr>
          <th scope="col">Asset</th>
          <th scope="col">Type</th>
          <th scope="col">Renewed by</th>
          <th scope="col">Renewed on</th>
          <th scope="col">New expiry</th>
          <th scope="col">
            <span className="visually-hidden">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {renewals.map((renewal) => (
          <tr
            key={renewal.id}
            className={renewal.id === editingId ? "renewal-list-editing" : ""}
          >
            <td data-label="Asset">
              {/* One wrapper per cell keeps the content in a single column
                  when the table stacks into cards on narrow screens. */}
              <div>
                <span className="renewal-list-name">{renewal.assetName}</span>
                {renewal.notes && (
                  <span className="renewal-list-notes" title={renewal.notes}>
                    {renewal.notes}
                  </span>
                )}
              </div>
            </td>
            <td data-label="Type">{typeLabel(renewal.type)}</td>
            <td data-label="Renewed by">{renewal.renewedBy}</td>
            <td data-label="Renewed on">{formatDate(renewal.renewedAt)}</td>
            <td data-label="New expiry">{formatDate(renewal.newExpiryDate)}</td>
            <td data-label="Actions" className="renewal-list-actions">
              <div className="renewal-list-buttons">
                <button
                  type="button"
                  className="secondary"
                  onClick={(event) => onEdit(renewal, event.currentTarget)}
                  disabled={busyId === renewal.id}
                >
                  Edit
                  <span className="visually-hidden">
                    {" "}
                    renewal of {renewal.assetName}
                  </span>
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => handleDelete(renewal)}
                  disabled={busyId === renewal.id}
                >
                  {busyId === renewal.id ? "Deleting…" : "Delete"}
                  <span className="visually-hidden">
                    {" "}
                    renewal of {renewal.assetName}
                  </span>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

RenewalList.propTypes = {
  renewals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      assetName: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      renewedBy: PropTypes.string.isRequired,
      renewedAt: PropTypes.string.isRequired,
      newExpiryDate: PropTypes.string.isRequired,
      notes: PropTypes.string,
    }),
  ).isRequired,
  editingId: PropTypes.string,
  busyId: PropTypes.string,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default RenewalList;
