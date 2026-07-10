import { useState } from "react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import TablePagination from "../components/TablePagination";
import { useTablePagination } from "../hooks/useTablePagination";
import "./AssetInventory.css";

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 6l1 15h10l1-15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const emptyForm = {
  assetId: "",
  deviceName: "",
  category: "",
  brand: "",
  model: "",
  macAddress: "",
  serialNumber: "",
  quantity: "1",
  unitPrice: "",
  purchaseDate: "",
  supplierName: "",
  location: "Main Stock",
  status: "In Stock",
  notes: "",
};

function AssetInventory() {
  const [assets, setAssets] = useJsonCollection("assets");
  const [suppliers] = useJsonCollection("suppliers");

  const [formData, setFormData] = useState(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [search, setSearch] = useState("");
  const [openAction, setOpenAction] = useState(null);
const [actionMenuPosition, setActionMenuPosition] = useState({
  top: 0,
  left: 0,
});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

const defaultCategories = [
  "Router",
  "Switch",
  "Radio",
  "Antenna",
  "Cable",
  "ONU",
  "ONT",
  "Fiber Device",
  "Power Device",
];

const toggleActionMenu = (event, index) => {
  const rect = event.currentTarget.getBoundingClientRect();

  setActionMenuPosition({
    top: rect.bottom + 8,
    left: rect.right - 150,
  });

  setOpenAction(openAction === index ? null : index);
};

const [customCategories, setCustomCategories] = useJsonCollection("assetCategories");
const [categoryMode, setCategoryMode] = useState("select");
const [newCategory, setNewCategory] = useState("");

  const filteredAssets = assets
    .map((asset, originalIndex) => ({ ...asset, originalIndex }))
    .filter((asset) => {
      const keyword = search.toLowerCase();

      return (
        (asset.assetId || "").toLowerCase().includes(keyword) ||
        (asset.deviceName || "").toLowerCase().includes(keyword) ||
        (asset.category || "").toLowerCase().includes(keyword) ||
        (asset.brand || "").toLowerCase().includes(keyword) ||
        (asset.model || "").toLowerCase().includes(keyword) ||
        (asset.macAddress || "").toLowerCase().includes(keyword) ||
        (asset.serialNumber || "").toLowerCase().includes(keyword) ||
        (asset.supplierName || "").toLowerCase().includes(keyword) ||
        (asset.status || "").toLowerCase().includes(keyword)
      );
    });

  const assetPagination = useTablePagination(filteredAssets, search);

  const money = (value) => Number(value || 0).toLocaleString("en-US");

const generateNextAssetId = () => {
  const maxNumber = assets.reduce((max, asset) => {
    const match = String(asset.assetId || "").match(/^AST-(\d+)$/i);

    if (!match) return max;

    const number = Number(match[1] || 0);
    return number > max ? number : max;
  }, 0);

  return `AST-${String(maxNumber + 1).padStart(4, "0")}`;
};

const handleGenerateAssetId = () => {
  const nextAssetId = generateNextAssetId();

  setFormData((previous) => ({
    ...previous,
    assetId: nextAssetId,
  }));

  notify(`Asset ID generated: ${nextAssetId}`);
};


const categoryOptions = [
  ...defaultCategories,
  ...customCategories
    .map((item) => item.name)
    .filter(Boolean)
    .filter((name) => !defaultCategories.includes(name)),
];

const handleCategoryChange = (event) => {
  const value = event.target.value;

  setFormData((previous) => ({
    ...previous,
    category: value,
  }));
};

const saveCustomCategory = () => {
  const cleanCategory = newCategory.trim();

  if (!cleanCategory) {
    notify("Please enter a category name.", "error");
    return;
  }

  const alreadyExists = categoryOptions.some(
    (category) => category.toLowerCase() === cleanCategory.toLowerCase()
  );

  if (alreadyExists) {
    notify("This category already exists.", "error");
    return;
  }

  setCustomCategories([
    ...customCategories,
    {
      id: Date.now(),
      name: cleanCategory,
      createdAt: new Date().toISOString(),
    },
  ]);

  setFormData((previous) => ({
    ...previous,
    category: cleanCategory,
  }));

  setNewCategory("");
  setCategoryMode("select");
  notify("Category saved successfully.");
};

const backToCategorySelect = () => {
  setNewCategory("");
  setCategoryMode("select");
};

  const totalAssets = assets.length;
  const inStockAssets = assets.filter((asset) => asset.status === "In Stock").length;
  const issuedAssets = assets.filter((asset) => asset.status === "Issued").length;
  const installedAssets = assets.filter((asset) => asset.status === "Installed").length;
  const damagedOrLostAssets = assets.filter((asset) =>
    ["Damaged", "Lost"].includes(asset.status)
  ).length;

  const totalStockValue = assets.reduce((sum, asset) => {
    return sum + Number(asset.quantity || 0) * Number(asset.unitPrice || 0);
  }, 0);

    const resetForm = () => {
    setFormData(emptyForm);
    setEditIndex(null);
    setCategoryMode("select");
    setNewCategory("");
    };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const identityExists = (data) => {
    return assets.some((asset, index) => {
      if (editIndex !== null && index === editIndex) return false;

      const sameAssetId =
        data.assetId && asset.assetId && data.assetId.trim().toLowerCase() === asset.assetId.trim().toLowerCase();

      const sameMac =
        data.macAddress && asset.macAddress && data.macAddress.trim().toLowerCase() === asset.macAddress.trim().toLowerCase();

      const sameSerial =
        data.serialNumber && asset.serialNumber && data.serialNumber.trim().toLowerCase() === asset.serialNumber.trim().toLowerCase();

      return sameAssetId || sameMac || sameSerial;
    });
  };

const handleSubmit = async (event) => {
  event.preventDefault();

  const cleanData = {
    ...formData,
    assetId: formData.assetId.trim(),
    deviceName: formData.deviceName.trim(),
    category: formData.category.trim(),
    brand: formData.brand.trim(),
    model: formData.model.trim(),
    macAddress: formData.macAddress.trim(),
    serialNumber: formData.serialNumber.trim(),
    supplierName: formData.supplierName.trim(),
    location: formData.location.trim(),
    quantity: Number(formData.quantity || 1),
    unitPrice: Number(formData.unitPrice || 0),
    purchaseDate: formData.purchaseDate,
    status: formData.status,
    notes: formData.notes.trim(),
    updatedAt: new Date().toISOString(),
    createdAt: formData.createdAt || new Date().toISOString(),
  };

  if (!cleanData.assetId && !cleanData.macAddress && !cleanData.serialNumber) {
    notify(
      "Please enter at least one unique identity: Asset ID, MAC Address, or Serial Number.",
      "error"
    );
    return;
  }

  if (identityExists(cleanData)) {
    notify("Asset ID, MAC Address, or Serial Number already exists.", "error");
    return;
  }

  if (editIndex !== null) {
    const updatedAssets = [...assets];
    updatedAssets[editIndex] = cleanData;

    const saved = await setAssets(updatedAssets);

    if (saved) {
      notify("Asset updated successfully.");
      resetForm();
      setShowModal(false);
    }

    return;
  }

  const saved = await setAssets([...assets, cleanData]);

  if (saved) {
    notify("Asset saved successfully.");
    resetForm();
    setShowModal(false);
  }
};

  const editAsset = (index) => {
    setEditIndex(index);
    setFormData({
      ...emptyForm,
      ...assets[index],
    });
    setShowModal(true);
    setOpenAction(null);
  };

  const openDeleteModal = (index) => {
    setDeleteIndex(index);
    setDeleteModalOpen(true);
    setOpenAction(null);
  };

  const cancelDelete = () => {
    setDeleteIndex(null);
    setDeleteModalOpen(false);
  };

  const confirmDelete = () => {
    if (deleteIndex === null) return;

    setAssets(assets.filter((_, index) => index !== deleteIndex));
    setDeleteIndex(null);
    setDeleteModalOpen(false);
    notify("Asset deleted successfully.");
  };

  const getStatusClass = (status) => {
    if (status === "In Stock") return "asset-badge stock";
    if (status === "Issued") return "asset-badge issued";
    if (status === "Installed") return "asset-badge installed";
    if (status === "Returned") return "asset-badge returned";
    if (status === "Damaged") return "asset-badge damaged";
    if (status === "Lost") return "asset-badge lost";
    return "asset-badge";
  };

  return (
    <div className="asset-page">
      <div className="asset-header">
        <div>
          <h1>Asset & Inventory Management</h1>
          <p>Record purchased devices, manage main stock, and track current asset status.</p>
        </div>

        <button className="asset-add-btn" onClick={openCreateModal}>
          + Add Asset
        </button>
      </div>

      <div className="asset-stats">
        <div className="asset-stat-card">
          <span>Total Assets</span>
          <strong>{totalAssets}</strong>
          <p>All registered devices</p>
        </div>

        <div className="asset-stat-card">
          <span>In Stock</span>
          <strong>{inStockAssets}</strong>
          <p>Available in main stock</p>
        </div>

        <div className="asset-stat-card">
          <span>Issued / Installed</span>
          <strong>{issuedAssets + installedAssets}</strong>
          <p>Devices assigned or installed</p>
        </div>

        <div className="asset-stat-card">
          <span>Damaged / Lost</span>
          <strong>{damagedOrLostAssets}</strong>
          <p>Unavailable devices</p>
        </div>

        <div className="asset-stat-card asset-wide-stat">
          <span>Total Stock Value</span>
          <strong>{money(totalStockValue)} AFN</strong>
          <p>Quantity × unit price</p>
        </div>
      </div>

      <div className="asset-table-card">
        <div className="asset-table-header">
          <div>
            <h3>Main Stock Inventory</h3>
            <p>All purchased devices and their current status</p>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search asset..."
          />
        </div>

        <div className="asset-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Device Name</th>
                <th>Category</th>
                <th>MAC Address</th>
                <th>Serial Number</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {assetPagination.pageItems.map((asset) => {
                const index = asset.originalIndex;

                return (
                  <tr key={index}>
                    <td className="asset-strong">{asset.assetId || "-"}</td>
                    <td>{asset.deviceName || "-"}</td>
                    <td>{asset.category || "-"}</td>
                    <td>{asset.macAddress || "-"}</td>
                    <td>{asset.serialNumber || "-"}</td>
                    <td>{asset.quantity || 1}</td>
                    <td>{money(asset.unitPrice)} AFN</td>
                    <td>{asset.location || "Main Stock"}</td>
                    <td>
                      <span className={getStatusClass(asset.status)}>
                        {asset.status || "Unknown"}
                      </span>
                    </td>
                    <td>
                  
 <td>
  <div className="asset-action-cell">
    <button
      type="button"
      className="asset-action-btn"
      onClick={(event) => toggleActionMenu(event, index)}
    >
      ⋮
    </button>

    {openAction === index && (
      <div
        className="asset-action-menu"
        style={{
          top: `${actionMenuPosition.top}px`,
          left: `${actionMenuPosition.left}px`,
        }}
      >
        <button type="button" onClick={() => editAsset(index)}>
          <EditIcon />
          <span>Edit</span>
        </button>

        <button
          type="button"
          className="danger-action"
          onClick={() => openDeleteModal(index)}
        >
          <TrashIcon />
          <span>Delete</span>
        </button>
      </div>
    )}
  </div>
</td>
                    </td>
                  </tr>
                );
              })}

              {filteredAssets.length === 0 && (
                <tr>
                  <td colSpan="10" className="asset-empty">
                    No asset has been registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={assetPagination.page}
          totalPages={assetPagination.totalPages}
          setPage={assetPagination.setPage}
          totalItems={filteredAssets.length}
          pageSize={assetPagination.pageSize}
        />
      </div>

      {showModal && (
        <div className="asset-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="asset-modal" onClick={(event) => event.stopPropagation()}>
            <div className="asset-modal-header">
              <div>
                <h3>{editIndex !== null ? "Edit Asset" : "Add New Asset"}</h3>
                <p>Enter complete device specifications and identity information.</p>
              </div>

              <button
                type="button"
                className="asset-close-btn"
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="asset-form-grid">
                <div className="asset-form-group">
                    <label>Asset ID</label>

                    <div className="asset-id-field">
                        <input
                        name="assetId"
                        value={formData.assetId}
                        onChange={handleChange}
                        placeholder="Example: AST-0001"
                        />

                        <button
                        type="button"
                        className="asset-generate-btn"
                        onClick={handleGenerateAssetId}
                        title="Generate Asset ID"
                        >
                        Generate
                        </button>
                    </div>
                </div>

                <div className="asset-form-group">
                  <label>Device Name</label>
                  <input
                    name="deviceName"
                    value={formData.deviceName}
                    onChange={handleChange}
                    placeholder="Example: MikroTik Router"
                    required
                  />
                </div>

                <div className="asset-form-group">
                    <div className="asset-label-row">
                        <label>Category</label>

                        {categoryMode === "select" && (
                        <button
                            type="button"
                            className="asset-category-plus"
                            onClick={() => {
                            setCategoryMode("custom");
                            setNewCategory("");
                            }}
                            title="Add custom category"
                        >
                            +
                        </button>
                        )}
                    </div>

                    {categoryMode === "select" ? (
                        <select
                        name="category"
                        value={formData.category}
                        onChange={handleCategoryChange}
                        required
                        >
                        <option value="">Select Category</option>

                        {categoryOptions.map((category) => (
                            <option key={category} value={category}>
                            {category}
                            </option>
                        ))}
                        </select>
                    ) : (
                        <div className="asset-custom-category">
                        <input
                            value={newCategory}
                            onChange={(event) => setNewCategory(event.target.value)}
                            placeholder="Enter new category"
                            autoFocus
                        />

                        <button
                            type="button"
                            className="asset-category-save"
                            onClick={saveCustomCategory}
                        >
                            Save
                        </button>

                        <button
                            type="button"
                            className="asset-category-back"
                            onClick={backToCategorySelect}
                        >
                            Back
                        </button>
                        </div>
                    )}
                    </div>

                <div className="asset-form-group">
                  <label>Brand</label>
                  <input
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="Example: MikroTik"
                  />
                </div>

                <div className="asset-form-group">
                  <label>Model</label>
                  <input
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder="Example: RB750Gr3"
                  />
                </div>

                <div className="asset-form-group">
                  <label>MAC Address</label>
                  <input
                    name="macAddress"
                    value={formData.macAddress}
                    onChange={handleChange}
                    placeholder="Example: AA:BB:CC:DD:EE:FF"
                  />
                </div>

                <div className="asset-form-group">
                  <label>Serial Number</label>
                  <input
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    placeholder="Example: SN-123456"
                  />
                </div>

                <div className="asset-form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="asset-form-group">
                  <label>Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    name="unitPrice"
                    value={formData.unitPrice}
                    onChange={handleChange}
                    placeholder="Example: 2500"
                  />
                </div>

                <div className="asset-form-group">
                  <label>Purchase Date</label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="asset-form-group">
                  <label>Supplier</label>
                  <select
                    name="supplierName"
                    value={formData.supplierName}
                    onChange={handleChange}
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((supplier, index) => (
                      <option key={index} value={supplier.supplierName}>
                        {supplier.supplierName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="asset-form-group">
                  <label>Location</label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  >
                    <option value="Main Stock">Main Stock</option>
                    <option value="Tower">Tower</option>
                    <option value="Customer">Customer</option>
                    <option value="Repair">Repair</option>
                    <option value="Returned Stock">Returned Stock</option>
                  </select>
                </div>

                <div className="asset-form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Issued">Issued</option>
                    <option value="Installed">Installed</option>
                    <option value="Returned">Returned</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div className="asset-form-group asset-form-full">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional asset notes..."
                  />
                </div>
              </div>

              <div className="asset-modal-actions">
                <button
                  type="button"
                  className="asset-cancel-btn"
                  onClick={() => {
                    resetForm();
                    setShowModal(false);
                  }}
                >
                  Cancel
                </button>

                <button type="submit" className="asset-save-btn">
                  {editIndex !== null ? "Save Changes" : "Save Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteModalOpen && (
        <div className="asset-delete-backdrop" onClick={cancelDelete}>
          <div className="asset-delete-modal" onClick={(event) => event.stopPropagation()}>
            <div className="asset-delete-icon">
              <TrashIcon />
            </div>

            <h3>Delete Asset</h3>

            <p>
              Are you sure you want to delete this asset? This action cannot be undone.
            </p>

            <div className="asset-delete-actions">
              <button
                type="button"
                className="asset-delete-cancel"
                onClick={cancelDelete}
              >
                Cancel
              </button>

              <button
                type="button"
                className="asset-delete-confirm"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetInventory;