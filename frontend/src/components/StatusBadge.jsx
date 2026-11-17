import "./StatusBadge.css";
import PropTypes from "prop-types";

// Each status has a word and a symbol so it never relies on color alone.
const STATUS_DISPLAY = {
  expired: { symbol: "✕", label: "Expired" },
  expiring: { symbol: "!", label: "Expiring soon" },
  ok: { symbol: "✓", label: "OK" },
};

function StatusBadge({ status }) {
  const { symbol, label } = STATUS_DISPLAY[status];
  return (
    <span className={`status-badge status-${status}`}>
      <span className="status-symbol" aria-hidden="true">
        {symbol}
      </span>
      {label}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.oneOf(["expired", "expiring", "ok"]).isRequired,
};

export default StatusBadge;
