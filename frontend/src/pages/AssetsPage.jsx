import "./AssetsPage.css";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createAsset, deleteAsset, listAssets, updateAsset } from "../api.js";
import { STATUSES } from "../assetOptions.js";
import AssetFilters from "../components/AssetFilters.jsx";
import AssetForm from "../components/AssetForm.jsx";
import AssetList from "../components/AssetList.jsx";
import Pagination from "../components/Pagination.jsx";

const PAGE_SIZE = 10;
const FILTER_DELAY_MS = 300;
const DEFAULT_FILTERS = {
  q: "",
  type: "",
  environment: "",
  owner: "",
  status: "",
  sort: "expiresAt",
};

// The dashboard cards link here with ?status=..., which seeds the filter.
function filtersFromUrl(searchParams) {
  const status = searchParams.get("status");
  return STATUSES.some((option) => option.value === status)
    ? { ...DEFAULT_FILTERS, status }
    : DEFAULT_FILTERS;
}

function AssetsPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => filtersFromUrl(searchParams));
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // null when the side panel is closed, otherwise { asset } (asset null = add).
  const [panel, setPanel] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(null);
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const editing = panel?.asset ?? null;

  // Wait until typing pauses before querying the server.
  useEffect(() => {
    const timer = setTimeout(() => setAppliedFilters(filters), FILTER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [filters]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    listAssets({ ...appliedFilters, page, limit: PAGE_SIZE })
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
      dialog.querySelector("#asset-name")?.focus();
    } else if (!panel && dialog.open) {
      dialog.close();
    }
    // Once closed, return focus to the button that opened the panel.
    if (!panel && openerRef.current?.isConnected) {
      openerRef.current.focus();
      openerRef.current = null;
    }
  }, [panel]);

  function openPanel(asset, opener) {
    openerRef.current = opener;
    setNotice(null);
    setPanel({ asset });
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
      const saved = await updateAsset(editing.id, values);
      setNotice(`Saved changes to “${saved.name}”.`);
    } else {
      const saved = await createAsset(values);
      setNotice(`Added “${saved.name}”.`);
    }
    closePanel();
    setReloadKey((key) => key + 1);
  }

  async function handleDelete(asset) {
    setBusyId(asset.id);
    setNotice(null);
    setError(null);
    try {
      await deleteAsset(asset.id);
      setNotice(`Deleted “${asset.name}”.`);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(err.errors ?? [err.message]);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="assets-page">
      <header className="assets-page-header">
        <div>
          <h1>Assets</h1>
          <p className="muted">
            Every certificate, domain, API key and license you track.
          </p>
        </div>
        <button
          type="button"
          className="assets-page-add"
          onClick={(event) => openPanel(null, event.currentTarget)}
        >
          <span aria-hidden="true">+</span> Add asset
        </button>
      </header>

      <section className="panel assets-page-filters" aria-label="Filters">
        <AssetFilters
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

      <section className="panel assets-page-list" aria-label="Asset list">
        {loading && !result && (
          <p className="assets-page-message" role="status">
            Loading assets…
          </p>
        )}
        {result && result.items.length === 0 && !loading && (
          <p className="assets-page-message">
            No assets match these filters. Change the filters or add an asset.
          </p>
        )}
        {result && result.items.length > 0 && (
          <div className="assets-page-table" aria-busy={loading}>
            {loading && (
              <p className="visually-hidden" role="status">
                Updating the list…
              </p>
            )}
            <AssetList
              assets={result.items}
              editingId={editing?.id ?? null}
              busyId={busyId}
              onEdit={(asset, opener) => openPanel(asset, opener)}
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
          />
        )}
      </section>

      <dialog
        ref={dialogRef}
        className="assets-page-drawer"
        aria-labelledby="asset-form-title"
        onClose={() => panel && closePanel()}
        onClick={(event) => {
          // A click on the dimmed backdrop lands on the dialog itself.
          if (event.target === event.currentTarget) closePanel();
        }}
      >
        <div className="assets-page-drawer-body">
          <button
            type="button"
            className="assets-page-drawer-close secondary"
            onClick={closePanel}
          >
            <span aria-hidden="true">✕</span>
            <span className="visually-hidden">Close panel</span>
          </button>
          {panel && (
            <AssetForm
              key={editing?.id ?? "new"}
              asset={editing}
              onSave={handleSave}
              onCancel={closePanel}
            />
          )}
        </div>
      </dialog>
    </div>
  );
}

AssetsPage.propTypes = {};

export default AssetsPage;
