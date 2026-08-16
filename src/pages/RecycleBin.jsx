import { useMemo, useState } from "react";
import { ArchiveRestore, Search, Trash2 } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { fetchRemoteCollection, pushRemoteChanges } from "../services/supabaseRest";
import { currentActorSnapshot } from "../sync/collectionSync";
import { getCollectionLabel, getRecordIdentity } from "../utils/recycleBin";
import { notify } from "../utils/notify";
import "./RecycleBin.css";

const normalize = (value) => String(value || "").trim().toLowerCase();

function itemRecordType(item) {
  return (
    item?.recordType ||
    item?.sourceCollectionLabel ||
    getCollectionLabel(item?.sourceCollection)
  );
}

function formatDeletedAt(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString("en-US", { timeZone: "Asia/Kabul" });
}

export default function RecycleBin() {
  const [items, setItems, , loaded] = useJsonCollection("recycleBin", {
    silentLoadErrors: true,
  });
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [busyId, setBusyId] = useState("");

  const allItems = useMemo(
    () =>
      [...items].sort(
        (first, second) =>
          new Date(second.deletedAt || 0) - new Date(first.deletedAt || 0)
      ),
    [items]
  );

  const sources = useMemo(
    () => [...new Set(allItems.map((item) => item.sourceCollection).filter(Boolean))].sort(),
    [allItems]
  );

  const visibleItems = useMemo(() => {
    const query = normalize(search);
    return allItems.filter((item) => {
      if (sourceFilter !== "all" && item.sourceCollection !== sourceFilter) return false;
      if (!query) return true;
      return [
        item.recordLabel,
        item.sourceCollection,
        item.sourceCollectionLabel,
        item.recordType,
        item.recordId,
        item.deletedByName,
        item.deletedByEmail,
        item.deletedByRole,
      ].some((value) => normalize(value).includes(query));
    });
  }, [allItems, search, sourceFilter]);

  async function removeRecycleEntry(item) {
    return setItems(items.filter((entry) => String(entry.id) !== String(item.id)));
  }

  async function restoreItem(item) {
    if (busyId) return;
    setBusyId(String(item.id));

    try {
      if (!item?.sourceCollection || !item?.record) {
        throw new Error("The recycle record is incomplete.");
      }

      const currentItems = await fetchRemoteCollection(item.sourceCollection);
      const alreadyExists = currentItems.some(
        (record) => getRecordIdentity(record) === item.recordId
      );

      if (!alreadyExists) {
        const actor = currentActorSnapshot();
        await pushRemoteChanges({
          collection: item.sourceCollection,
          upserts: [item.record],
          deletes: [],
          actorId: actor.id || actor.employeeId || "",
          ownerId: actor.employeeId || actor.id || "",
          identityFn: getRecordIdentity,
        });
      }

      const removed = await removeRecycleEntry(item);
      if (removed === false) {
        notify("Record restored, but its recycle entry could not be removed.", "warning");
        return;
      }

      window.dispatchEvent(new Event(`isp-supabase:${item.sourceCollection}`));
      notify("Record restored successfully.", "success");
    } catch (error) {
      console.error("Unable to restore recycle record:", error);
      notify(error?.message || "Unable to restore this record.", "error");
    } finally {
      setBusyId("");
    }
  }

  async function permanentlyDelete(item) {
    if (busyId) return;
    const confirmed = window.confirm(
      `Permanently delete “${item.recordLabel || "this record"}”? This cannot be undone.`
    );
    if (!confirmed) return;

    setBusyId(String(item.id));
    try {
      const removed = await removeRecycleEntry(item);
      if (removed !== false) notify("Record permanently deleted.", "success");
    } finally {
      setBusyId("");
    }
  }

  if (!loaded) return <div className="page-loading">Loading Recycle Bin...</div>;

  return (
    <div className="recycle-bin-page">
      <header className="recycle-bin-heading">
        <div>
          <span>DATA RECOVERY</span>
          <h1>Recycle Bin</h1>
          <p>Restore deleted Supabase records or remove them permanently.</p>
        </div>
        <strong>{allItems.length} deleted record(s)</strong>
      </header>

      <section className="recycle-bin-card">
        <header className="recycle-bin-toolbar">
          <label>
            <Search size={16} />
            <input
              type="search"
              placeholder="Search deleted records..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
            <option value="all">All sections</option>
            {sources.map((source) => (
              <option key={source} value={source}>{getCollectionLabel(source)}</option>
            ))}
          </select>
        </header>

        <div className="recycle-bin-table-wrap">
          <table className="recycle-bin-table">
            <thead>
              <tr>
                <th>Record</th><th>Section</th><th>Deleted By</th><th>Deleted At</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.recordLabel || "Record"}</strong><small>{itemRecordType(item)}</small></td>
                  <td>{getCollectionLabel(item.sourceCollection)}</td>
                  <td>{item.deletedByName || item.deletedByEmail || "-"}</td>
                  <td>{formatDeletedAt(item.deletedAt)}</td>
                  <td>
                    <div className="recycle-bin-actions">
                      <button type="button" disabled={busyId === String(item.id)} onClick={() => restoreItem(item)} title="Restore"><ArchiveRestore size={16} /> Restore</button>
                      <button type="button" className="danger" disabled={busyId === String(item.id)} onClick={() => permanentlyDelete(item)} title="Delete permanently"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibleItems.length && (
                <tr><td colSpan="5" className="recycle-bin-empty">No deleted records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
