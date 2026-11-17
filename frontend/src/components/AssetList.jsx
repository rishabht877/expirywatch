import "./AssetList.css";
import PropTypes from "prop-types";
import { environmentLabel, typeLabel } from "../assetOptions.js";
import { daysLeftLabel, formatDate } from "../dates.js";
import StatusBadge from "./StatusBadge.jsx";

function AssetList({ assets, editingId, busyId, onEdit, onDelete }) {
  function handleDelete(asset) {
    if (window.confirm(`Delete “${asset.name}”? This cannot be undone.`)) {
      onDelete(asset);
    }
  }

  return (
    <table className="asset-list stack-table">
      <caption className="visually-hidden">Your assets</caption>
      <thead>
        <tr>
          <th scope="col">Asset</th>
          <th scope="col">Type</th>
          <th scope="col">Environment</th>
          <th scope="col">Owner</th>
          <th scope="col">Expires</th>
          <th scope="col">Status</th>
          <th scope="col">
            <span className="visually-hidden">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {assets.map((asset) => (
          <tr
            key={asset.id}
            className={asset.id === editingId ? "asset-list-editing" : ""}
          >
            <td data-label="Asset">
              <span className="asset-list-name">{asset.name}</span>
              {asset.notes && (
                <span className="asset-list-notes" title={asset.notes}>
                  {asset.notes}
                </span>
              )}
            </td>
            <td data-label="Type">{typeLabel(asset.type)}</td>
            <td data-label="Environment">
              <span className="asset-list-env">
                {environmentLabel(asset.environment)}
              </span>
            </td>
            <td data-label="Owner">{asset.owner}</td>
            <td data-label="Expires">
              <span className="asset-list-date">
                {formatDate(asset.expiresAt)}
              </span>
              <span className="asset-list-days">
                {daysLeftLabel(asset.expiresAt)}
              </span>
            </td>
            <td data-label="Status">
              <StatusBadge status={asset.status} />
            </td>
            <td data-label="Actions" className="asset-list-actions">
              <button
                type="button"
                className="secondary"
                onClick={(event) => onEdit(asset, event.currentTarget)}
                disabled={busyId === asset.id}
              >
                Edit<span className="visually-hidden"> {asset.name}</span>
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => handleDelete(asset)}
                disabled={busyId === asset.id}
              >
                {busyId === asset.id ? "Deleting…" : "Delete"}
                <span className="visually-hidden"> {asset.name}</span>
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

AssetList.propTypes = {
  assets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      environment: PropTypes.string.isRequired,
      owner: PropTypes.string.isRequired,
      expiresAt: PropTypes.string.isRequired,
      notes: PropTypes.string,
      status: PropTypes.oneOf(["expired", "expiring", "ok"]).isRequired,
    }),
  ).isRequired,
  editingId: PropTypes.string,
  busyId: PropTypes.string,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default AssetList;
