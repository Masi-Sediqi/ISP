import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    ArrowLeft,
    Check,
    Copy,
    Pencil,
    Printer,
    Search,
    Tag,
    Trash2,
    X,
} from "lucide-react";

import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import "./OfficeAssets.css";

const statusOptions = [
    { value: "Available", label: "Available" },
    { value: "Assigned", label: "Assigned" },
    { value: "Under Repair", label: "Under Repair" },
    { value: "Damaged", label: "Damaged" },
    { value: "Lost", label: "Lost" },
];

function OfficeAssetDetails() {
    const navigate = useNavigate();
    const { assetId } = useParams();

    const [assets] = useJsonCollection("officeAssets");
    const [assetItems, setAssetItems] =
        useJsonCollection("officeAssetItems");

    const [search, setSearch] = useState("");
    const [editingItem, setEditingItem] = useState(null);
    const [deleteItem, setDeleteItem] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);

    const asset = assets.find(
        (item) => String(item.id) === String(assetId)
    );

    const relatedItems = useMemo(
        () =>
            assetItems.filter(
                (item) => String(item.assetId) === String(assetId)
            ),
        [assetId, assetItems]
    );

    const filteredItems = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return relatedItems;

        return relatedItems.filter((item) =>
            [
                item.code,
                item.status,
                item.location,
                item.assignedTo,
                item.note,
            ]
                .join(" ")
                .toLowerCase()
                .includes(query)
        );
    }, [relatedItems, search]);

    const selectedItemRecords = useMemo(
        () =>
            relatedItems.filter((item) =>
                selectedItems.includes(String(item.id))
            ),
        [relatedItems, selectedItems]
    );

    const allVisibleSelected =
        filteredItems.length > 0 &&
        filteredItems.every((item) =>
            selectedItems.includes(String(item.id))
        );

    const toggleItemSelection = (itemId) => {
        const id = String(itemId);

        setSelectedItems((current) =>
            current.includes(id)
                ? current.filter((selectedId) => selectedId !== id)
                : [...current, id]
        );
    };

    const toggleAllVisibleItems = () => {
        const visibleIds = filteredItems.map((item) => String(item.id));

        setSelectedItems((current) => {
            if (allVisibleSelected) {
                return current.filter((id) => !visibleIds.includes(id));
            }

            return [...new Set([...current, ...visibleIds])];
        });
    };

    const clearSelection = () => {
        setSelectedItems([]);
    };

    const availableCount = relatedItems.filter(
        (item) => item.status === "Available"
    ).length;

    const assignedCount = relatedItems.filter(
        (item) => item.status === "Assigned"
    ).length;

    const otherCount =
        relatedItems.length - availableCount - assignedCount;

    const updateEditingField = (field, value) => {
        setEditingItem((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const saveItem = async (event) => {
        event.preventDefault();

        const saved = await setAssetItems((current) =>
            current.map((item) =>
                String(item.id) === String(editingItem.id)
                    ? {
                        ...item,
                        ...editingItem,
                        updatedAt: new Date().toISOString(),
                    }
                    : item
            )
        );

        if (!saved) return;

        setEditingItem(null);
        notify("Asset item updated successfully.", "success");
    };

    const confirmDeleteItem = async () => {
        if (!deleteItem) return;

        const saved = await setAssetItems((current) =>
            current.filter(
                (item) => String(item.id) !== String(deleteItem.id)
            )
        );

        if (!saved) return;

        setSelectedItems((current) =>
            current.filter((id) => id !== String(deleteItem.id))
        );

        setDeleteItem(null);
        notify("Asset item deleted successfully.", "success");
    };

    const copyCode = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
            notify("Asset code copied.", "success");
        } catch {
            notify("Unable to copy the asset code.", "error");
        }
    };

    const printLabels = (items, title = "Asset Labels") => {
        if (!items.length) {
            notify("Please select at least one asset record.", "error");
            return;
        }

        const printWindow = window.open(
            "",
            "_blank",
            "width=900,height=1000"
        );

        if (!printWindow) {
            notify("The print window could not be opened.", "error");
            return;
        }

        const escapeHtml = (value) =>
            String(value ?? "")
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;")
                .replaceAll("'", "&#039;");

        const labels = items
            .map(
                (item) => `
        <div class="label">
          <div class="company">Office Asset Label</div>

          <h2>${escapeHtml(asset?.name || item.assetName)}</h2>

          <p>${escapeHtml(asset?.type || item.type)}</p>

          <div class="code">${escapeHtml(item.code)}</div>

          <div class="label-info">
            <span>Status</span>
            <strong>${escapeHtml(item.status || "Available")}</strong>
          </div>

          ${item.location
                        ? `
                <div class="label-info">
                  <span>Location</span>
                  <strong>${escapeHtml(item.location)}</strong>
                </div>
              `
                        : ""
                    }

          ${item.assignedTo
                        ? `
                <div class="label-info">
                  <span>Assigned To</span>
                  <strong>${escapeHtml(item.assignedTo)}</strong>
                </div>
              `
                        : ""
                    }
        </div>
      `
            )
            .join("");

        printWindow.document.write(`
    <!doctype html>

    <html>
      <head>
        <meta charset="UTF-8" />

        <title>${escapeHtml(title)}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            margin: 0;
            font-family: Arial, sans-serif;
            color: #111827;
            background: #ffffff;
          }

          .labels {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }

          .label {
            min-height: 210px;
            padding: 18px;
            border: 2px solid #111827;
            border-radius: 12px;
            text-align: center;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .company {
            margin-bottom: 10px;
            color: #64748b;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
          }

          h2 {
            margin: 0 0 6px;
            font-size: 20px;
          }

          p {
            margin: 4px 0;
            color: #64748b;
            font-size: 12px;
          }

          .code {
            margin: 16px 0;
            padding: 12px;
            border: 1px dashed #111827;
            font-family: Consolas, monospace;
            font-size: 21px;
            font-weight: 900;
            letter-spacing: 2px;
          }

          .label-info {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-top: 6px;
            font-size: 10px;
            text-align: left;
          }

          .label-info span {
            color: #64748b;
          }

          .label-info strong {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          @media print {
            .labels {
              gap: 10px;
            }
          }
        </style>
      </head>

      <body>
        <div class="labels">${labels}</div>

        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

        printWindow.document.close();
    };

    const printAllLabels = () => {
        printLabels(
            relatedItems,
            `${asset?.name || "Asset"} - All Labels`
        );
    };

    const printSelectedLabels = () => {
        printLabels(
            selectedItemRecords,
            `${asset?.name || "Asset"} - Selected Labels`
        );
    };


    if (!asset) {
        return (
            <div className="office-assets-page">
                <section className="office-assets-not-found">
                    <Tag size={34} />
                    <h2>Asset record not found</h2>
                    <button
                        type="button"
                        onClick={() => navigate("/office-assets")}
                    >
                        Return to Assets
                    </button>
                </section>
            </div>
        );
    }

    return (
        <div className="office-assets-page">
            <div className="office-asset-detail-heading">
                <div>
                    <button
                        type="button"
                        className="office-asset-back"
                        onClick={() => navigate("/office-assets")}
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <div>
                        <span>Asset Details</span>
                        <h1>{asset.name}</h1>
                        <p>
                            {asset.type} · {relatedItems.length} individual records
                        </p>
                    </div>
                </div>

                <div className="office-asset-detail-actions">
                    {selectedItems.length > 0 && (
                        <button
                            type="button"
                            className="office-asset-clear-selection"
                            onClick={clearSelection}
                        >
                            Clear Selection
                        </button>
                    )}

                    {selectedItems.length > 0 && (
                        <button
                            type="button"
                            className="office-asset-print-selected"
                            onClick={printSelectedLabels}
                        >
                            <Printer size={16} />
                            Print Selected Labels
                            <span>{selectedItems.length}</span>
                        </button>
                    )}

                    <button
                        type="button"
                        className="office-asset-print-all"
                        onClick={printAllLabels}
                    >
                        <Printer size={16} />
                        Print All Labels
                    </button>
                </div>
            </div>

            <section className="office-assets-stats">
                <div>
                    <Tag />
                    <span>Total Labels</span>
                    <strong>{relatedItems.length}</strong>
                    <small>All individual records</small>
                </div>

                <div>
                    <Check />
                    <span>Available</span>
                    <strong>{availableCount}</strong>
                    <small>Ready for use</small>
                </div>

                <div>
                    <Tag />
                    <span>Other Status</span>
                    <strong>{assignedCount + otherCount}</strong>
                    <small>
                        {assignedCount} assigned, {otherCount} other
                    </small>
                </div>
            </section>

            <section className="office-assets-list-card">
                <div className="office-assets-list-header">
                    <div>
                        <h2>{asset.name} Records</h2>
                        <p>
                            Every physical item has a unique code and printable label.
                        </p>
                    </div>

                    <label className="office-assets-search">
                        <Search size={15} />

                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search labels..."
                        />
                    </label>
                </div>

                <div className="office-assets-table-wrap">
                    <table className="office-asset-items-table">
                        <thead>
                            <tr>
                                <th className="office-asset-checkbox-column">
                                    <label className="office-asset-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={allVisibleSelected}
                                            onChange={toggleAllVisibleItems}
                                            aria-label="Select all visible records"
                                        />

                                        <span />
                                    </label>
                                </th>

                                <th>Label Code</th>
                                <th>Status</th>
                                <th>Location</th>
                                <th>Assigned To</th>
                                <th>Note</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredItems.map((item) => {
                                const selected = selectedItems.includes(String(item.id));

                                return (
                                    <tr
                                        key={item.id}
                                        className={selected ? "office-asset-row-selected" : ""}
                                    >
                                        <td className="office-asset-checkbox-column">
                                            <label className="office-asset-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() => toggleItemSelection(item.id)}
                                                    aria-label={`Select ${item.code}`}
                                                />

                                                <span />
                                            </label>
                                        </td>

                                        <td>
                                            <div className="office-asset-code">
                                                <Tag size={15} />

                                                <strong>{item.code}</strong>

                                                <button
                                                    type="button"
                                                    onClick={() => copyCode(item.code)}
                                                    title="Copy code"
                                                >
                                                    <Copy size={13} />
                                                </button>
                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                className={`office-asset-item-status ${String(
                                                    item.status || "available"
                                                )
                                                    .toLowerCase()
                                                    .replaceAll(" ", "-")}`}
                                            >
                                                {item.status || "Available"}
                                            </span>
                                        </td>

                                        <td>{item.location || "-"}</td>

                                        <td>{item.assignedTo || "-"}</td>

                                        <td className="office-asset-note">
                                            {item.note || "No note"}
                                        </td>

                                        <td>
                                            <div className="office-asset-actions">
                                                <button
                                                    type="button"
                                                    className="office-asset-edit"
                                                    onClick={() => setEditingItem({ ...item })}
                                                    title="Edit"
                                                >
                                                    <Pencil size={15} />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="office-asset-print"
                                                    onClick={() => printLabel(item)}
                                                    title="Print label"
                                                >
                                                    <Printer size={15} />
                                                </button>

                                                <button
                                                    type="button"
                                                    className="office-asset-delete"
                                                    onClick={() => setDeleteItem(item)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {!filteredItems.length && (
                                <tr>
                                    <td colSpan="7" className="office-assets-empty">
                                        No asset labels found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {editingItem && (
                <div
                    className="office-asset-modal-backdrop"
                    onMouseDown={() => setEditingItem(null)}
                >
                    <div
                        className="office-asset-modal office-asset-item-modal"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="office-asset-modal-header">
                            <div>
                                <h2>Edit Asset Item</h2>
                                <p>{editingItem.code}</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setEditingItem(null)}
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <form onSubmit={saveItem}>
                            <div className="office-asset-form-grid">
                                <label>
                                    <span>Label Code</span>
                                    <input value={editingItem.code} disabled />
                                </label>

                                <label>
                                    <span>Status</span>

                                    <div className="office-asset-select-wrap">
                                        <select
                                            value={editingItem.status || "Available"}
                                            onChange={(event) =>
                                                updateEditingField("status", event.target.value)
                                            }
                                        >
                                            {statusOptions.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>

                                        <span className="office-asset-select-arrow">
                                            <svg
                                                width="14"
                                                height="14"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="m6 9 6 6 6-6"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </span>
                                    </div>
                                </label>

                                <label>
                                    <span>Location</span>
                                    <input
                                        value={editingItem.location || ""}
                                        onChange={(event) =>
                                            updateEditingField(
                                                "location",
                                                event.target.value
                                            )
                                        }
                                        placeholder="For example: Main Office"
                                    />
                                </label>

                                <label>
                                    <span>Assigned To</span>
                                    <input
                                        value={editingItem.assignedTo || ""}
                                        onChange={(event) =>
                                            updateEditingField(
                                                "assignedTo",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Employee or department"
                                    />
                                </label>

                                <label className="office-asset-form-full">
                                    <span>Note</span>
                                    <textarea
                                        value={editingItem.note || ""}
                                        onChange={(event) =>
                                            updateEditingField(
                                                "note",
                                                event.target.value
                                            )
                                        }
                                    />
                                </label>
                            </div>

                            <div className="office-asset-modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setEditingItem(null)}
                                >
                                    Cancel
                                </button>

                                <button type="submit">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {deleteItem && (
  <div
    className="office-asset-modal-backdrop"
    onMouseDown={() => setDeleteItem(null)}
  >
    <div
      className="office-asset-delete-modal"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="office-asset-delete-icon">
        <Trash2 size={25} />
      </div>

      <span>Delete Asset Record</span>

      <h2>Are you sure?</h2>

      <p>
        The asset record
        <strong>{deleteItem.code}</strong>
        will be permanently deleted.
      </p>

      <div className="office-asset-delete-actions">
        <button
          type="button"
          onClick={() => setDeleteItem(null)}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={confirmDeleteItem}
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
    </div>
  </div>
)}
        </div>
    );
}

export default OfficeAssetDetails;