import "./DashboardPage.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSummary, listAssets } from "../api.js";
import ExpiryDashboard from "../components/ExpiryDashboard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const ATTENTION_COUNT = 8;

function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      getSummary(),
      listAssets({ sort: "expiresAt", limit: ATTENTION_COUNT }),
    ])
      .then(([summary, list]) => {
        if (active) setData({ summary, attention: list.items });
      })
      .catch((err) => {
        if (active) setError(err.errors ?? [err.message]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="dashboard-page">
      <h1>Welcome, {user.name}</h1>

      <section className="panel dashboard-help" aria-labelledby="help-heading">
        <h2 id="help-heading">How to use this app</h2>
        <ol>
          <li>
            Go to <Link to="/assets">Assets</Link> and add each certificate,
            domain, API key or license with its expiry date and owner.
          </li>
          <li>
            Check this dashboard: anything expired or expiring within 30 days is
            counted below and listed under “Needs attention first”.
          </li>
          <li>
            Use the filters on the Assets page to find items by type,
            environment, owner or status, then edit the expiry date once it is
            renewed.
          </li>
        </ol>
      </section>

      {error && (
        <div className="alert alert-error" role="alert">
          <p>The dashboard could not be loaded:</p>
          <ul>
            {error.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}
      {!error && !data && <p role="status">Loading your dashboard…</p>}
      {data && (
        <ExpiryDashboard summary={data.summary} attention={data.attention} />
      )}
    </div>
  );
}

DashboardPage.propTypes = {};

export default DashboardPage;
