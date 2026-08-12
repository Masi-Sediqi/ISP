import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArchiveRestore,
  Search,
  Trash2,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { apiUrl } from "../utils/api";
import { notify } from "../utils/notify";
import {
  getCollectionLabel,
  getRecordIdentity,
  LOCAL_COLLECTION_PREFIX,
  readLocalRecycleBin,
  writeLocalRecycleBin,
} from "../utils/recycleBin";
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
  const [serverItems, setServerItems, , serverLoaded] =
    useJsonCollection("recycleBin", { silentLoadErrors: true });
  const [localItems, setLocalItems] = useState(readLocalRecycleBin);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    const reload = () => setLocalItems(readLocalRecycleBin());
    window.addEventListener("isp-local-recycle-bin-updated", reload);
    window.addEventListener("storage", reload);

    return () => {
      window.removeEventListener("isp-local-recycle-bin-updated", reload);
      window.removeEventListener("storage", reload);
    };
  }, []);

  const allItems = useMemo(
    () =>
      [...serverItems, ...localItems].sort(
        (first, second) =>
          new Date(second.deletedAt || 0) -
          new Date(first.deletedAt || 0)
      ),
    [serverItems, localItems]
  );

  const sources = useMemo(
    () =>
      [...new Set(allItems.map((item) => item.sourceCollection).filter(Boolean))]
        .sort(),
    [allItems]
  );

  const visibleItems = useMemo(() => {
    const query = normalize(search);

    return allItems.filter((item) => {
      if (
        sourceFilter !== "all" &&
        item.sourceCollection !== sourceFilter
      ) {
        return false;
      }

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
    if (
      item.recycleStorage === "local" ||
      item.sourceType === "local" ||
      item.sourceType === "server-fallback"
    ) {
      const nextItems = readLocalRecycleBin().filter(
        (entry) => String(entry.id) !== String(item.id)
      );
      writeLocalRecycleBin(nextItems);
      setLocalItems(nextItems);
      return true;
    }

    return setServerItems(
      serverItems.filter(
        (entry) => String(entry.id) !== String(item.id)
      )
    );
  }

  async function restoreItem(item) {
    if (busyId) return;
    setBusyId(String(item.id));

    try {
      if (item.sourceType === "local") {
        const storageKey = `${LOCAL_COLLECTION_PREFIX}${item.sourceCollection}`;
        let currentItems = [];

        try {
          const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
          currentItems = Array.isArray(parsed) ? parsed : [];
        } catch {
          currentItems = [];
        }

        if (
          !currentItems.some(
            (record) => getRecordIdentity(record) === item.recordId
          )
        ) {
          currentItems.push(item.record);
          localStorage.setItem(storageKey, JSON.stringify(currentItems));
          window.dispatchEvent(
            new Event(`isp-local:${item.sourceCollection}`)
          );
        }
      } else {
        const response = await axios.get(apiUrl(item.sourceCollection));
        const currentItems = Array.isArray(response.data) ? response.data : [];

        if (
          !currentItems.some(
            (record) => getRecordIdentity(record) === item.recordId
          )
        ) {
          await axios.put(apiUrl(item.sourceCollection), [
            ...currentItems,
            item.record,
          ]);
        }
      }

      const removed = await removeRecycleEntry(item);
      if (removed === false) {
        notify("Record restored, but its recycle entry could not be removed.", "warning");
        return;
      }

      notify("Record restored successfully.", "success");
    } catch (error) {
      console.error("Unable to restore recycle record:", error);
      notify("Unable to restore this record.", "error");
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
      if (removed !== false) {
        notify("Record permanently deleted.", "success");
      }
    } finally {
      setBusyId("");
    }
  }

  if (!serverLoaded) {
    return <div className="page-loading">Loading Recycle Bin...</div>;
  }

  return (
    <div className="recycle-bin-page">
      <header className="recycle-bin-heading">
        <div>
          <span>DATA RECOVERY</span>
          <h1>Recycle Bin</h1>
          <p>Restore deleted records or remove them permanently.</p>
        </div>

        <strong>{allItems.length} deleted record(s)</strong>
      </header>

      <section className="recycle-bin-card">
        <header className="recycle-bin-toolbar">
          <label>
            <Search size={16} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search deleted records..."
            />
          </label>

          <select
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value)}
          >
            <option value="all">All record types</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {getCollectionLabel(source)}
              </option>
            ))}
          </select>
        </header>

        <div className="recycle-bin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Record</th>
                <th>Record Type</th>
                <th>Deleted By</th>
                <th>Deleted At</th>
                <th>Storage</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {visibleItems.map((item) => {
                const busy = busyId === String(item.id);
                const recordType = itemRecordType(item);
                const deletedByInfo = [
                  item.deletedByRole,
                  item.deletedByEmail,
                ]
                  .filter(Boolean)
                  .join(" / ");

                return (
                  <tr key={`${item.sourceType}-${item.id}`}>
                    <td>
                      <strong>{item.recordLabel || "Deleted Record"}</strong>
                      <small>{item.recordId || "No identifier"}</small>
                      <details className="recycle-bin-record-details">
                        <summary>View deleted data</summary>
                        <pre>{JSON.stringify(item.record || {}, null, 2)}</pre>
                      </details>
                    </td>
                    <td>
                      <span className="recycle-bin-type">{recordType}</span>
                      <small>{item.sourceCollection || "-"}</small>
                    </td>
                    <td>
                      <strong>{item.deletedByName || "Unknown user"}</strong>
                      <small>
                        {deletedByInfo || item.deletedByAccountId || "-"}
                      </small>
                    </td>
                    <td>{formatDeletedAt(item.deletedAt)}</td>
                    <td>
                      <span className="recycle-bin-storage">
                        {item.sourceType === "local" ? "Local" : "System"}
                      </span>
                    </td>
                    <td>
                      <div className="recycle-bin-actions">
                        <button
                          type="button"
                          className="restore"
                          disabled={busy}
                          onClick={() => restoreItem(item)}
                        >
                          <ArchiveRestore size={15} />
                          Restore
                        </button>
                        <button
                          type="button"
                          className="delete"
                          disabled={busy}
                          onClick={() => permanentlyDelete(item)}
                        >
                          <Trash2 size={15} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!visibleItems.length && (
                <tr>
                  <td colSpan="6" className="recycle-bin-empty">
                    <Trash2 size={32} />
                    <strong>Recycle Bin is empty</strong>
                    <span>Deleted records will appear here automatically.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
