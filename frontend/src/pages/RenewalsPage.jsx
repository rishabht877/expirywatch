import "./RenewalsPage.css";
import { useEffect, useRef, useState } from "react";
import {
  createRenewal,
  deleteRenewal,
  listRenewals,
  updateRenewal,
} from "../api.js";
import Pagination from "../components/Pagination.jsx";
import RenewalFilters from "../components/RenewalFilters.jsx";
import RenewalForm from "../components/RenewalForm.jsx";
import RenewalList from "../components/RenewalList.jsx";

const PAGE_SIZE = 10;
const FILTER_DELAY_MS = 300;
const DEFAULT_FILTERS = {
  q: "",
  type: "",
  renewedBy: "",
  from: "",
  to: "",
};

function RenewalsPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // null when the side panel is closed, otherwise { renewal } (null = add).
  const [panel, setPanel] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(null);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const editing = panel?.renewal ?? null;

  // Wait until typing pauses before querying the server.
  useEffect(() => {
    const timer = setTimeout(() => setAppliedFilters(filters), FILTER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    listRenewals({ ...appliedFilters, page, limit: PAGE_SIZE })
      .then((data) => {
        if (!active) return;
        // After deleting the last item on the last page, step back a page.
        if (data.items.length === 0 && page > 1 && data.totalPages > 0) {
          setPage(data.totalPages);
          return;
        }
        setResult(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.errors ?? [err.message]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [appliedFilters, page, reloadKey]);

  // The side panel is a native modal <dialog>: it traps focus and closes on Esc.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (panel && !dialog.open) {
      dialog.showModal();
      dialog.querySelector("#renewal-assetName")?.focus();
    } else if (!panel && dialog.open) {
      dialog.close();
    }
    // Once closed, return focus to the button that opened the panel.
    if (!panel && openerRef.current?.isConnected) {
      openerRef.current.focus();
      openerRef.current = null;
    }
  }, [panel]);

  function openPanel(renewal, opener) {
    openerRef.current = opener;
    setNotice(null);
    setPanel({ renewal });
  }

  function closePanel() {
    setPanel(null);
  }

  function handleFiltersChange(next) {
    setFilters(next);
    setPage(1);
  }

  function handleReset() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  async function handleSave(values) {
    if (editing) {
      const saved = await updateRenewal(editing.id, values);
      setNotice(`Saved changes to the renewal of “${saved.assetName}”.`);
    } else {
      const saved = await createRenewal(values);
      setNotice(`Logged a renewal of “${saved.assetName}”.`);
    }
    closePanel();
    setReloadKey((key) => key + 1);
  }

  async function handleDelete(renewal) {
    setBusyId(renewal.id);
    setNotice(null);
    setError(null);
    try {
      await deleteRenewal(renewal.id);
      setNotice(`Deleted the renewal of “${renewal.assetName}”.`);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(err.errors ?? [err.message]);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="renewals-page">
      <header className="renewals-page-header">
        <div>
          <h1>Renewals</h1>
          <p className="muted">
            A log of every renewal, newest first, with who renewed it and the
            new expiry date.
          </p>
        </div>
        <button
          type="button"
          className="renewals-page-add"
          onClick={(event) => openPanel(null, event.currentTarget)}
        >
          <span aria-hidden="true">+</span> Log renewal
        </button>
      </header>

      <section className="panel renewals-page-filters" aria-label="Filters">
        <RenewalFilters
          filters={filters}
          onChange={handleFiltersChange}
          onReset={handleReset}
        />
      </section>

      <div role="status" aria-live="polite">
        {notice && <p className="alert alert-success">{notice}</p>}
      </div>
      {error && (
        <div className="alert alert-error" role="alert">
          <p>Something went wrong:</p>
          <ul>
            {error.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="panel renewals-page-list" aria-label="Renewal list">
        {loading && !result && (
          <p className="renewals-page-message" role="status">
            Loading renewals…
          </p>
        )}
        {result && result.items.length === 0 && !loading && (
          <p className="renewals-page-message">
            No renewals match these filters. Change the filters or log a
            renewal.
          </p>
        )}
        {result && result.items.length > 0 && (
          <div className="renewals-page-table" aria-busy={loading}>
            {loading && (
              <p className="visually-hidden" role="status">
                Updating the list…
              </p>
            )}
            <RenewalList
              renewals={result.items}
              editingId={editing?.id ?? null}
              busyId={busyId}
              onEdit={(renewal, opener) => openPanel(renewal, opener)}
              onDelete={handleDelete}
            />
          </div>
        )}
        {result && result.total > 0 && (
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            onPageChange={setPage}
            itemName="renewal"
          />
        )}
      </section>

      <dialog
        ref={dialogRef}
        className="renewals-page-drawer"
        aria-labelledby="renewal-form-title"
        onClose={() => panel && closePanel()}
        onClick={(event) => {
          // A click on the dimmed backdrop lands on the dialog itself.
          if (event.target === event.currentTarget) closePanel();
        }}
      >
        <div className="renewals-page-drawer-body">
          <button
            type="button"
            className="renewals-page-drawer-close secondary"
            onClick={closePanel}
          >
            <span aria-hidden="true">✕</span>
            <span className="visually-hidden">Close panel</span>
          </button>
          {panel && (
            <RenewalForm
              key={editing?.id ?? "new"}
              renewal={editing}
              onSave={handleSave}
              onCancel={closePanel}
            />
          )}
        </div>
      </dialog>
    </div>
  );
}

RenewalsPage.propTypes = {};

export default RenewalsPage;
