import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  Check,
  ChevronDown,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";

import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { createId } from "../utils/createId";
import "./OfficeAssets.css";

const defaultAssetTypes = [
  "Desk",
  "Chair",
  "Computer",
  "Laptop",
  "Printer",
  "Monitor",
  "Table",
  "Cabinet",
  "Air Conditioner",
  "Projector",
  "Other",
];

const emptyAsset = {
  name: "",
  type: "",
  quantity: "",
  note: "",
};

const parseQuantity = (value) => {
  const quantity = Number.parseInt(value, 10);
  return Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
};

const normalizeCodePart = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 4) || "AST";

function generateAssetItems(asset, quantity, existingItems = []) {
  const currentItems = existingItems.filter(
    (item) => String(item.assetId) === String(asset.id)
  );

  const existingNumbers = currentItems
    .map((item) => {
      const match = String(item.code || "").match(/-(\d+)$/);
      return match ? Number(match[1]) : 0;
    })
    .filter(Boolean);

  let nextNumber = existingNumbers.length
    ? Math.max(...existingNumbers) + 1
    : 1;

  const prefix = normalizeCodePart(asset.type || asset.name);

  return Array.from({ length: quantity }, () => {
    const number = nextNumber++;

    return {
      id: createId(),
      assetId: asset.id,
      assetName: asset.name,
      type: asset.type,
      code: `${prefix}-${String(number).padStart(4, "0")}`,
      status: "Available",
      location: "",
      assignedTo: "",
      note: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

function OfficeAssets() {
  const navigate = useNavigate();

  const [assets, setAssets] = useJsonCollection("officeAssets");
  const [assetItems, setAssetItems] = useJsonCollection("officeAssetItems");
  const [savedTypes, setSavedTypes] = useJsonCollection(
    "officeAssetCategories"
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyAsset);
  const [editingAsset, setEditingAsset] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [search, setSearch] = useState("");
  const [typeOpen, setTypeOpen] = useState(false);
  const [newType, setNewType] = useState("");

  const assetTypes = useMemo(() => {
    const customTypes = savedTypes
      .map((item) => item.name || item)
      .filter(Boolean);

    const usedTypes = assets.map((asset) => asset.type).filter(Boolean);

    return [
      ...new Set([
        ...defaultAssetTypes,
        ...customTypes,
        ...usedTypes,
      ]),
    ].sort((a, b) => a.localeCompare(b));
  }, [assets, savedTypes]);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return assets;
    }

    return assets.filter((asset) =>
      [asset.name, asset.type, asset.note]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [assets, search]);

  const totalQuantity = assets.reduce(
    (sum, asset) => sum + parseQuantity(asset.quantity),
    0
  );

  const availableCount = assetItems.filter(
    (item) => item.status === "Available"
  ).length;

  const assignedCount = assetItems.filter(
    (item) => item.status === "Assigned"
  ).length;

  const openCreate = () => {
    setForm(emptyAsset);
    setEditingAsset(null);
    setTypeOpen(false);
    setNewType("");
    setShowForm(true);
  };

  const openEdit = (asset) => {
    setForm({
      name: asset.name || "",
      type: asset.type || "",
      quantity: String(asset.quantity || ""),
      note: asset.note || "",
    });

    setEditingAsset(asset);
    setTypeOpen(false);
    setNewType("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAsset(null);
    setForm(emptyAsset);
    setTypeOpen(false);
    setNewType("");
  };

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const addCustomType = async () => {
    const cleanType = newType.trim();

    if (!cleanType) {
      notify("Please enter the asset type.", "error");
      return;
    }

    const existingType = assetTypes.find(
      (type) => type.toLowerCase() === cleanType.toLowerCase()
    );

    const finalType = existingType || cleanType;

    if (!existingType) {
      const saved = await setSavedTypes((current) => [
        ...current,
        {
          id: createId(),
          name: cleanType,
          createdAt: new Date().toISOString(),
        },
      ]);

      if (!saved) return;
    }

    setForm((current) => ({
      ...current,
      type: finalType,
    }));

    setNewType("");
  };

  const saveAsset = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const type = form.type.trim();
    const quantity = parseQuantity(form.quantity);

    if (!name) {
      notify("Please enter the asset name.", "error");
      return;
    }

    if (!type) {
      notify("Please select or add the asset type.", "error");
      return;
    }

    if (quantity < 1) {
      notify("Quantity must be at least 1.", "error");
      return;
    }

    if (editingAsset) {
      const previousQuantity = parseQuantity(editingAsset.quantity);
      const quantityDifference = quantity - previousQuantity;

      const updatedAsset = {
        ...editingAsset,
        name,
        type,
        quantity,
        note: form.note.trim(),
        updatedAt: new Date().toISOString(),
      };

      const assetSaved = await setAssets((current) =>
        current.map((asset) =>
          String(asset.id) === String(editingAsset.id)
            ? updatedAsset
            : asset
        )
      );

      if (!assetSaved) return;

      if (quantityDifference > 0) {
        const newItems = generateAssetItems(
          updatedAsset,
          quantityDifference,
          assetItems
        );

        await setAssetItems((current) => [
          ...current.map((item) =>
            String(item.assetId) === String(updatedAsset.id)
              ? {
                  ...item,
                  assetName: updatedAsset.name,
                  type: updatedAsset.type,
                }
              : item
          ),
          ...newItems,
        ]);
      } else if (quantityDifference < 0) {
        const relatedItems = assetItems.filter(
          (item) => String(item.assetId) === String(updatedAsset.id)
        );

        const removableItems = relatedItems
          .filter((item) => item.status !== "Assigned")
          .slice(0, Math.abs(quantityDifference));

        if (removableItems.length < Math.abs(quantityDifference)) {
          notify(
            "Some records are assigned. Their quantity cannot be reduced.",
            "error"
          );

          await setAssets((current) =>
            current.map((asset) =>
              String(asset.id) === String(editingAsset.id)
                ? editingAsset
                : asset
            )
          );

          return;
        }

        const removableIds = new Set(
          removableItems.map((item) => String(item.id))
        );

        await setAssetItems((current) =>
          current
            .filter((item) => !removableIds.has(String(item.id)))
            .map((item) =>
              String(item.assetId) === String(updatedAsset.id)
                ? {
                    ...item,
                    assetName: updatedAsset.name,
                    type: updatedAsset.type,
                  }
                : item
            )
        );
      } else {
        await setAssetItems((current) =>
          current.map((item) =>
            String(item.assetId) === String(updatedAsset.id)
              ? {
                  ...item,
                  assetName: updatedAsset.name,
                  type: updatedAsset.type,
                  updatedAt: new Date().toISOString(),
                }
              : item
          )
        );
      }

      notify("Asset updated successfully.", "success");
      closeForm();
      return;
    }

    const assetId = createId();

    const newAsset = {
      id: assetId,
      name,
      type,
      quantity,
      note: form.note.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createdItems = generateAssetItems(
      newAsset,
      quantity,
      assetItems
    );

    const assetSaved = await setAssets((current) => [
      newAsset,
      ...current,
    ]);

    if (!assetSaved) return;

    const itemsSaved = await setAssetItems((current) => [
      ...createdItems,
      ...current,
    ]);

    if (!itemsSaved) {
      await setAssets((current) =>
        current.filter((asset) => String(asset.id) !== String(assetId))
      );

      return;
    }

    notify(
      `${quantity} asset record${quantity === 1 ? "" : "s"} created successfully.`,
      "success"
    );

    closeForm();
  };

  const deleteAsset = async () => {
    if (!deleteTarget) return;

    const assetSaved = await setAssets((current) =>
      current.filter(
        (asset) => String(asset.id) !== String(deleteTarget.id)
      )
    );

    if (!assetSaved) return;

    await setAssetItems((current) =>
      current.filter(
        (item) => String(item.assetId) !== String(deleteTarget.id)
      )
    );

    setDeleteTarget(null);
    notify("Asset and all related labels were deleted.", "success");
  };

  return (
    <div className="office-assets-page">
      <div className="office-assets-heading">
        <div>
          <span>Office Inventory</span>
          <h1>Asset Management</h1>
          <p>
            Register office equipment and generate a separate label for
            every individual item.
          </p>
        </div>

        <button type="button" onClick={openCreate}>
          <Plus size={17} />
          Add Asset
        </button>
      </div>

      <section className="office-assets-stats">
        <div>
          <Boxes />
          <span>Asset Groups</span>
          <strong>{assets.length}</strong>
          <small>Registered asset categories</small>
        </div>

        <div>
          <Tags />
          <span>Total Items</span>
          <strong>{totalQuantity}</strong>
          <small>All generated asset labels</small>
        </div>

        <div>
          <PackagePlus />
          <span>Available Items</span>
          <strong>{availableCount}</strong>
          <small>{assignedCount} currently assigned</small>
        </div>
      </section>

      <section className="office-assets-list-card">
        <div className="office-assets-list-header">
          <div>
            <h2>Office Assets</h2>
            <p>
              Open a record to view individual items and their unique
              labels.
            </p>
          </div>

          <label className="office-assets-search">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assets..."
            />
          </label>
        </div>

        <div className="office-assets-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Available</th>
                <th>Assigned</th>
                <th>Note</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredAssets.map((asset) => {
                const relatedItems = assetItems.filter(
                  (item) =>
                    String(item.assetId) === String(asset.id)
                );

                const available = relatedItems.filter(
                  (item) => item.status === "Available"
                ).length;

                const assigned = relatedItems.filter(
                  (item) => item.status === "Assigned"
                ).length;

                return (
                  <tr key={asset.id}>
                    <td>
                      <button
                        type="button"
                        className="office-asset-name"
                        onClick={() =>
                          navigate(`/office-assets/${asset.id}`)
                        }
                      >
                        <span>
                          {String(asset.name || "A")
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>

                        <div>
                          <strong>
                            {asset.name || "Unnamed Asset"}
                          </strong>
                          <small>
                            Click to view {relatedItems.length} records
                          </small>
                        </div>
                      </button>
                    </td>

                    <td>
                      <span className="office-asset-type">
                        {asset.type || "Unspecified"}
                      </span>
                    </td>

                    <td>
                      <strong>{asset.quantity}</strong>
                    </td>

                    <td>
                      <span className="office-asset-available">
                        {available}
                      </span>
                    </td>

                    <td>{assigned}</td>

                    <td className="office-asset-note">
                      {asset.note || "No note"}
                    </td>

                    <td>
                      <div className="office-asset-actions">
                        <button
                          type="button"
                          className="office-asset-edit"
                          onClick={() => openEdit(asset)}
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          className="office-asset-delete"
                          onClick={() => setDeleteTarget(asset)}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filteredAssets.length && (
                <tr>
                  <td colSpan="7" className="office-assets-empty">
                    No office assets have been registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <div
          className="office-asset-modal-backdrop"
          onMouseDown={closeForm}
        >
          <div
            className="office-asset-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="office-asset-modal-header">
              <div>
                <h2>
                  {editingAsset ? "Edit Asset" : "Register Asset"}
                </h2>
                <p>
                  Enter the office asset information and quantity.
                </p>
              </div>

              <button type="button" onClick={closeForm}>
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveAsset}>
              <div className="office-asset-form-grid">
                <label>
                  <span>Asset Name *</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    placeholder="For example: Manager Chair"
                  />
                </label>

                <div className="office-asset-type-field">
                  <span>Asset Type *</span>

                  <button
                    type="button"
                    className="office-asset-type-trigger"
                    onClick={() =>
                      setTypeOpen((current) => !current)
                    }
                  >
                    <span>
                      {form.type || "Select asset type"}
                    </span>

                    <ChevronDown
                      size={16}
                      className={typeOpen ? "open" : ""}
                    />
                  </button>

                  {typeOpen && (
                    <div className="office-asset-type-menu">
                      <div className="office-asset-type-options">
                        {assetTypes.map((type) => (
                          <button
                            type="button"
                            key={type}
                            className={
                              form.type === type ? "active" : ""
                            }
                            onClick={() => {
                              setForm((current) => ({
                                ...current,
                                type,
                              }));

                              setTypeOpen(false);
                            }}
                          >
                            <span>{type}</span>

                            {form.type === type && (
                              <Check size={14} />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="office-asset-type-add">
                        <input
                          value={newType}
                          onChange={(event) =>
                            setNewType(event.target.value)
                          }
                          placeholder="Add custom type"
                        />

                        <button
                          type="button"
                          onClick={addCustomType}
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <label>
                  <span>Quantity *</span>
                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    value={form.quantity}
                    onChange={updateField}
                    placeholder="For example: 10"
                  />
                  <small>
                    A separate record and label will be generated for
                    every item.
                  </small>
                </label>

                <label className="office-asset-form-full">
                  <span>Note</span>
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={updateField}
                    placeholder="Additional information about this asset..."
                  />
                </label>
              </div>

              <div className="office-asset-modal-actions">
                <button type="button" onClick={closeForm}>
                  Cancel
                </button>

                <button type="submit">
                  {editingAsset ? "Save Changes" : "Register Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="office-asset-modal-backdrop"
          onMouseDown={() => setDeleteTarget(null)}
        >
          <div
            className="office-asset-delete-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="office-asset-delete-icon">
              <Trash2 size={25} />
            </div>

            <span>Delete Asset</span>
            <h2>Are you sure?</h2>

            <p>
              The asset
              <strong>{deleteTarget.name}</strong>
              and all generated item labels will be deleted.
            </p>

            <div className="office-asset-delete-actions">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button type="button" onClick={deleteAsset}>
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

export default OfficeAssets;