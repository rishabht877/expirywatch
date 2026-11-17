import "./ExpiryDashboard.css";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { environmentLabel, typeLabel } from "../assetOptions.js";
import { daysLeftLabel, formatDate } from "../dates.js";
import StatusBadge from "./StatusBadge.jsx";

const numberFormat = new Intl.NumberFormat("en-US");

const CARDS = [
  { status: "expired", title: "Expired", linkText: "View expired assets" },
  {
    status: "expiring",
    title: "Expiring within 30 days",
    linkText: "View expiring assets",
  },
  { status: "ok", title: "OK", linkText: "View OK assets" },
];

function ExpiryDashboard({ summary, attention }) {
  return (
    <div className="expiry-dashboard">
      <section aria-labelledby="counts-heading">
        <h2 id="counts-heading" className="visually-hidden">
          Asset counts by status
        </h2>
        <ul className="expiry-cards">
          {CARDS.map((card) => (
            <li
              key={card.status}
              className={`expiry-card expiry-card-${card.status}`}
            >
              <StatusBadge status={card.status} />
              <p className="expiry-card-count">
                {numberFormat.format(summary[card.status])}
              </p>
              <p className="expiry-card-title">{card.title}</p>
              <Link to={`/assets?status=${card.status}`}>{card.linkText}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel" aria-labelledby="attention-heading">
        <h2 id="attention-heading">Needs attention first</h2>
        {attention.length > 0 && (
          <p className="muted expiry-attention-intro">
            The {attention.length} assets with the soonest expiry dates, overdue
            ones first.
          </p>
        )}
        {attention.length === 0 ? (
          <p>
            No assets yet. <Link to="/assets">Add your first asset</Link>.
          </p>
        ) : (
          <table className="stack-table">
            <thead>
              <tr>
                <th scope="col">Asset</th>
                <th scope="col">Type</th>
                <th scope="col">Environment</th>
                <th scope="col">Owner</th>
                <th scope="col">Expires</th>
                <th scope="col">Days left</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {attention.map((asset) => (
                <tr key={asset.id}>
                  <td data-label="Asset" className="expiry-asset-name">
                    {asset.name}
                  </td>
                  <td data-label="Type">{typeLabel(asset.type)}</td>
                  <td data-label="Environment">
                    {environmentLabel(asset.environment)}
                  </td>
                  <td data-label="Owner">{asset.owner}</td>
                  <td data-label="Expires" className="expiry-nowrap">
                    {formatDate(asset.expiresAt)}
                  </td>
                  <td data-label="Days left" className="expiry-nowrap">
                    {daysLeftLabel(asset.expiresAt)}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={asset.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

ExpiryDashboard.propTypes = {
  summary: PropTypes.shape({
    expired: PropTypes.number.isRequired,
    expiring: PropTypes.number.isRequired,
    ok: PropTypes.number.isRequired,
  }).isRequired,
  attention: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      environment: PropTypes.string.isRequired,
      owner: PropTypes.string.isRequired,
      expiresAt: PropTypes.string.isRequired,
      status: PropTypes.oneOf(["expired", "expiring", "ok"]).isRequired,
    }),
  ).isRequired,
};

export default ExpiryDashboard;
