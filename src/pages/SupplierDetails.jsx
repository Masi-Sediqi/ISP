import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import "./SupplierDetails.css";

const emptyPurchaseForm = {
  purchaseDate: "",
  invoiceNumber: "",
  assetId: "",
  deviceName: "",
  category: "",
  brand: "",
  model: "",
  macAddress: "",
  serialNumber: "",
  quantity: "1",
  unitPrice: "",
  paidAmount: "",
  remainAmount: "",
  location: "Main Stock",
  status: "In Stock",
  notes: "",
};

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

function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 8h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

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

function PrintIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M7 8V3h10v5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M7 14h10v7H7v-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function SupplierDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const supplierIndex = Number(id);

  const [suppliers] = useJsonCollection("suppliers");
  const [assets, setAssets] = useJsonCollection("assets");
  const [supplierPurchases, setSupplierPurchases] = useJsonCollection("supplierPurchases");
  const [customCategories, setCustomCategories] = useJsonCollection("assetCategories");

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm);
  const [categoryMode, setCategoryMode] = useState("select");
  const [newCategory, setNewCategory] = useState("");

  const [editPurchaseId, setEditPurchaseId] = useState(null);
  const [detailPurchase, setDetailPurchase] = useState(null);
  const [deletePurchaseId, setDeletePurchaseId] = useState(null);

  const [openPurchaseAction, setOpenPurchaseAction] = useState(null);
  const [purchaseActionPosition, setPurchaseActionPosition] = useState({
    top: 0,
    left: 0,
  });

  const supplier = suppliers[supplierIndex];

  const money = (value) => Number(value || 0).toLocaleString("en-US");

  const supplierName = supplier?.supplierName || "";

  const purchases = supplierPurchases.filter(
    (purchase) =>
      Number(purchase.supplierIndex) === Number(supplierIndex) ||
      purchase.supplierName === supplierName
  );

  const supplierAssets = assets.filter(
    (asset) => asset.supplierName === supplierName
  );

  const totalPurchaseValue = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.totalPurchaseValue || 0),
    0
  );

  const totalQuantity = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.quantity || 0),
    0
  );

  const categoryOptions = [
  ...defaultCategories,
  ...customCategories
    .map((item) => item.name)
    .filter(Boolean)
    .filter((name) => !defaultCategories.includes(name)),
];

const togglePurchaseActionMenu = (event, purchaseId) => {
  const rect = event.currentTarget.getBoundingClientRect();

  setPurchaseActionPosition({
    top: rect.bottom + 8,
    left: rect.right - 160,
  });

  setOpenPurchaseAction(openPurchaseAction === purchaseId ? null : purchaseId);
};

const printPurchaseDetail = (purchase) => {
  const printWindow = window.open("", "_blank", "width=900,height=700");

  if (!printWindow) {
    notify("Unable to open print window. Please allow pop-ups.", "error");
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>Purchase Detail</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #111827;
            padding: 28px;
          }

          .header {
            border-bottom: 2px solid #111827;
            padding-bottom: 14px;
            margin-bottom: 20px;
          }

          h1 {
            margin: 0 0 6px;
            font-size: 24px;
          }

          p {
            margin: 0;
            color: #64748b;
            font-size: 13px;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .item {
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 12px;
          }

          .item span {
            display: block;
            color: #64748b;
            font-size: 12px;
            margin-bottom: 5px;
          }

          .item strong {
            font-size: 14px;
          }

          .notes {
            margin-top: 12px;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 12px;
          }

          @media print {
            body {
              padding: 18px;
            }
          }
        </style>
      </head>

      <body>
        <div class="header">
          <h1>Purchase Full Detail</h1>
          <p>Supplier: ${supplierName || "-"}</p>
        </div>

        <div class="grid">
          <div class="item"><span>Purchase Date</span><strong>${purchase.purchaseDate || "-"}</strong></div>
          <div class="item"><span>Invoice No</span><strong>${purchase.invoiceNumber || "-"}</strong></div>
          <div class="item"><span>Asset ID</span><strong>${purchase.assetId || "-"}</strong></div>
          <div class="item"><span>Device Name</span><strong>${purchase.deviceName || "-"}</strong></div>
          <div class="item"><span>Category</span><strong>${purchase.category || "-"}</strong></div>
          <div class="item"><span>Brand</span><strong>${purchase.brand || "-"}</strong></div>
          <div class="item"><span>Model</span><strong>${purchase.model || "-"}</strong></div>
          <div class="item"><span>MAC Address</span><strong>${purchase.macAddress || "-"}</strong></div>
          <div class="item"><span>Serial Number</span><strong>${purchase.serialNumber || "-"}</strong></div>
          <div class="item"><span>Quantity</span><strong>${purchase.quantity || 1}</strong></div>
          <div class="item"><span>Unit Price</span><strong>${money(purchase.unitPrice)} AFN</strong></div>
          <div class="item"><span>Total Value</span><strong>${money(purchase.totalPurchaseValue)} AFN</strong></div>
          <div class="item"><span>Paid Amount</span><strong>${money(purchase.paidAmount)} AFN</strong></div>
          <div class="item"><span>Remain Amount</span><strong>${money(purchase.remainAmount)} AFN</strong></div>
          <div class="item"><span>Location</span><strong>${purchase.location || "-"}</strong></div>
          <div class="item"><span>Status</span><strong>${purchase.status || "-"}</strong></div>
        </div>

        <div class="notes">
          <span>Notes</span>
          <p>${purchase.notes || "No notes have been added for this purchase."}</p>
        </div>

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

const handleCategoryChange = (event) => {
  const value = event.target.value;

  setPurchaseForm((previous) => ({
    ...previous,
    category: value,
  }));
};

const saveCustomCategory = async () => {
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

  const saved = await setCustomCategories([
    ...customCategories,
    {
      id: Date.now(),
      name: cleanCategory,
      createdAt: new Date().toISOString(),
    },
  ]);

  if (!saved) return;

  setPurchaseForm((previous) => ({
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

  const averagePurchaseValue =
    purchases.length > 0 ? totalPurchaseValue / purchases.length : 0;

  const recentPurchases = [...purchases]
    .sort((a, b) => String(b.purchaseDate || "").localeCompare(String(a.purchaseDate || "")))
    .slice(0, 8);

  const statusSummary = useMemo(() => {
    return supplierAssets.reduce((summary, asset) => {
      const status = asset.status || "Unknown";
      summary[status] = (summary[status] || 0) + 1;
      return summary;
    }, {});
  }, [supplierAssets]);

  const statusChartData = Object.entries(statusSummary).map(([status, count]) => ({
  status,
  count,
}));

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

    setPurchaseForm((previous) => ({
      ...previous,
      assetId: nextAssetId,
    }));

    notify(`Asset ID generated: ${nextAssetId}`);
  };

  const handlePurchaseChange = (event) => {
    const { name, value } = event.target;

    setPurchaseForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetPurchaseForm = () => {
    setPurchaseForm(emptyPurchaseForm);
    setCategoryMode("select");
    setNewCategory("");
  };

const closePurchaseModal = () => {
  resetPurchaseForm();
  setEditPurchaseId(null);
  setShowPurchaseModal(false);
};

  const identityExists = (data) => {
    return assets.some((asset) => {
      const sameAssetId =
        data.assetId &&
        asset.assetId &&
        data.assetId.trim().toLowerCase() === asset.assetId.trim().toLowerCase();

      const sameMac =
        data.macAddress &&
        asset.macAddress &&
        data.macAddress.trim().toLowerCase() === asset.macAddress.trim().toLowerCase();

      const sameSerial =
        data.serialNumber &&
        asset.serialNumber &&
        data.serialNumber.trim().toLowerCase() === asset.serialNumber.trim().toLowerCase();

      return sameAssetId || sameMac || sameSerial;
    });
  };

const savePurchase = async (event) => {
  event.preventDefault();

  const quantity = Number(purchaseForm.quantity || 1);
  const unitPrice = Number(purchaseForm.unitPrice || 0);
  const totalPurchaseValue = quantity * unitPrice;
  const paidAmount = Number(purchaseForm.paidAmount || 0);
  const remainAmount = Math.max(totalPurchaseValue - paidAmount, 0);

  const cleanPurchase = {
    id: editPurchaseId || Date.now(),
    supplierIndex,
    supplierName,
    purchaseDate: purchaseForm.purchaseDate,
    invoiceNumber: purchaseForm.invoiceNumber.trim(),
    assetId: purchaseForm.assetId.trim(),
    deviceName: purchaseForm.deviceName.trim(),
    category: purchaseForm.category.trim(),
    brand: purchaseForm.brand.trim(),
    model: purchaseForm.model.trim(),
    macAddress: purchaseForm.macAddress.trim(),
    serialNumber: purchaseForm.serialNumber.trim(),
    quantity,
    unitPrice,
    totalPurchaseValue,
    paidAmount,
    remainAmount,
    location: purchaseForm.location,
    status: purchaseForm.status,
    notes: purchaseForm.notes.trim(),
    createdAt:
      supplierPurchases.find((purchase) => purchase.id === editPurchaseId)?.createdAt ||
      new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!cleanPurchase.assetId && !cleanPurchase.macAddress && !cleanPurchase.serialNumber) {
    notify(
      "Please enter at least one unique identity: Asset ID, MAC Address, or Serial Number.",
      "error"
    );
    return;
  }

  const duplicateIdentity = assets.some((asset) => {
    if (editPurchaseId && asset.purchaseId === editPurchaseId) return false;

    const sameAssetId =
      cleanPurchase.assetId &&
      asset.assetId &&
      cleanPurchase.assetId.toLowerCase() === asset.assetId.toLowerCase();

    const sameMac =
      cleanPurchase.macAddress &&
      asset.macAddress &&
      cleanPurchase.macAddress.toLowerCase() === asset.macAddress.toLowerCase();

    const sameSerial =
      cleanPurchase.serialNumber &&
      asset.serialNumber &&
      cleanPurchase.serialNumber.toLowerCase() === asset.serialNumber.toLowerCase();

    return sameAssetId || sameMac || sameSerial;
  });

  if (duplicateIdentity) {
    notify("Asset ID, MAC Address, or Serial Number already exists.", "error");
    return;
  }

  let nextPurchases;

  if (editPurchaseId) {
    nextPurchases = supplierPurchases.map((purchase) =>
      purchase.id === editPurchaseId ? cleanPurchase : purchase
    );
  } else {
    nextPurchases = [...supplierPurchases, cleanPurchase];
  }

  const existingAsset = assets.find((asset) => asset.purchaseId === cleanPurchase.id);
  let nextAssets;

  if (existingAsset) {
    nextAssets = assets.map((asset) =>
      asset.purchaseId === cleanPurchase.id
        ? buildAssetFromPurchase(cleanPurchase, asset)
        : asset
    );
  } else {
    nextAssets = [...assets, buildAssetFromPurchase(cleanPurchase)];
  }

  const purchasesSaved = await setSupplierPurchases(nextPurchases);
  const assetsSaved = await setAssets(nextAssets);

  if (purchasesSaved && assetsSaved) {
    notify(
      editPurchaseId
        ? "Purchase updated successfully."
        : "Purchase saved and asset added to inventory successfully."
    );

    setEditPurchaseId(null);
    closePurchaseModal();
  }
};


  const openCreatePurchaseModal = () => {
  setEditPurchaseId(null);
  setPurchaseForm({
    ...emptyPurchaseForm,
    assetId: generateNextAssetId(),
  });
  setCategoryMode("select");
  setNewCategory("");
  setShowPurchaseModal(true);
};

const openEditPurchaseModal = (purchase) => {
  setEditPurchaseId(purchase.id);

  setPurchaseForm({
    purchaseDate: purchase.purchaseDate || "",
    invoiceNumber: purchase.invoiceNumber || "",
    assetId: purchase.assetId || "",
    deviceName: purchase.deviceName || "",
    category: purchase.category || "",
    brand: purchase.brand || "",
    model: purchase.model || "",
    macAddress: purchase.macAddress || "",
    serialNumber: purchase.serialNumber || "",
    quantity: String(purchase.quantity || 1),
    unitPrice: String(purchase.unitPrice || ""),
    paidAmount: String(purchase.paidAmount || ""),
    remainAmount: String(purchase.remainAmount || ""),
    location: purchase.location || "Main Stock",
    status: purchase.status || "In Stock",
    notes: purchase.notes || "",
  });

  setCategoryMode("select");
  setNewCategory("");
  setShowPurchaseModal(true);
};

const buildAssetFromPurchase = (purchase, existingAsset = {}) => ({
  ...existingAsset,
  assetId: purchase.assetId,
  deviceName: purchase.deviceName,
  category: purchase.category,
  brand: purchase.brand,
  model: purchase.model,
  macAddress: purchase.macAddress,
  serialNumber: purchase.serialNumber,
  quantity: purchase.quantity,
  unitPrice: purchase.unitPrice,
  totalPurchaseValue: purchase.totalPurchaseValue,
  paidAmount: purchase.paidAmount,
  remainAmount: purchase.remainAmount,
  purchaseDate: purchase.purchaseDate,
  supplierName: purchase.supplierName,
  location: purchase.location,
  status: purchase.status,
  notes: purchase.notes,
  source: "supplier-purchase",
  purchaseId: purchase.id,
  createdAt: existingAsset.createdAt || new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const openDeletePurchaseModal = (purchaseId) => {
  setDeletePurchaseId(purchaseId);
};

const cancelDeletePurchase = () => {
  setDeletePurchaseId(null);
};

const confirmDeletePurchase = async () => {
  if (!deletePurchaseId) return;

  const nextPurchases = supplierPurchases.filter(
    (purchase) => purchase.id !== deletePurchaseId
  );

  const nextAssets = assets.filter(
    (asset) => asset.purchaseId !== deletePurchaseId
  );

  const purchasesSaved = await setSupplierPurchases(nextPurchases);
  const assetsSaved = await setAssets(nextAssets);

  if (purchasesSaved && assetsSaved) {
    notify("Purchase deleted successfully.");
    setDeletePurchaseId(null);
  }
};

  if (!supplier) {
    return (
      <div className="supplier-details-page">
        <div className="supplier-not-found">
          <h1>Supplier Not Found</h1>
          <p>The selected supplier record does not exist.</p>
          <button type="button" onClick={() => navigate("/suppliers")}>
            Back to Suppliers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="supplier-details-page">
      <div className="supplier-details-header">
        <div>
          <Link className="supplier-back-link" to="/suppliers">
            ← Back to Suppliers
          </Link>
          <h1>{supplier.supplierName}</h1>
          <p>
            Complete supplier dashboard, purchase history, and inventory contribution.
          </p>
        </div>

        <button
          type="button"
          className="supplier-purchase-btn"
          onClick={openCreatePurchaseModal}
        >
          + Purchase
        </button>
      </div>

      <div className="supplier-profile-card">
        <div>
          <span>Company</span>
          <strong>{supplier.companyName || "-"}</strong>
        </div>

        <div>
          <span>Contact Person</span>
          <strong>{supplier.contactPerson || "-"}</strong>
        </div>

        <div>
          <span>Phone</span>
          <strong>{supplier.phone || "-"}</strong>
        </div>

        <div>
          <span>Email</span>
          <strong>{supplier.email || "-"}</strong>
        </div>
      </div>

      <div className="supplier-dashboard-stats">
        <div className="supplier-dashboard-card">
          <span>Total Purchases</span>
          <strong>{purchases.length}</strong>
          <p>Purchase records from this supplier</p>
        </div>

        <div className="supplier-dashboard-card">
          <span>Total Purchase Value</span>
          <strong>{money(totalPurchaseValue)} AFN</strong>
          <p>Quantity × unit price</p>
        </div>

        <div className="supplier-dashboard-card">
          <span>Total Quantity</span>
          <strong>{totalQuantity}</strong>
          <p>Total purchased device quantity</p>
        </div>

        <div className="supplier-dashboard-card">
          <span>Inventory Items</span>
          <strong>{supplierAssets.length}</strong>
          <p>Assets added to inventory</p>
        </div>

        <div className="supplier-dashboard-card">
          <span>Average Purchase</span>
          <strong>{money(averagePurchaseValue)} AFN</strong>
          <p>Average value per purchase</p>
        </div>
      </div>

      <div className="supplier-analysis-grid">
        <div className="supplier-analysis-card">
          <div className="supplier-analysis-title">
            <h3>Inventory Status Analysis</h3>
            <span>Dynamic</span>
          </div>

         <div className="supplier-status-chart">
  {statusChartData.length > 0 ? (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={statusChartData}>
        <CartesianGrid strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="status" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" name="Assets" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <p className="supplier-empty-message">
      No inventory status data has been recorded yet.
    </p>
  )}
</div>
        </div>

        <div className="supplier-analysis-card">
          <div className="supplier-analysis-title">
            <h3>Supplier Notes</h3>
          </div>

          <p className="supplier-note-box">
            {supplier.note || "No supplier notes have been added yet."}
          </p>
        </div>
      </div>

      <div className="supplier-purchase-table-card">
        <div className="supplier-purchase-table-header">
          <div>
            <h3>Recent Purchase History</h3>
            <p>Latest purchases recorded for this supplier</p>
          </div>
        </div>

        <div className="supplier-purchase-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Purchase Date</th>
                <th>Invoice No</th>
                <th>Asset ID</th>
                <th>Device Name</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total Value</th>
                <th>Paid Amount</th>
                <th>Remain Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {recentPurchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td>{purchase.purchaseDate || "-"}</td>
                  <td>{purchase.invoiceNumber || "-"}</td>
                  <td>{purchase.assetId || "-"}</td>
                  <td>{purchase.deviceName || "-"}</td>
                  <td>{purchase.category || "-"}</td>
                  <td>{purchase.quantity || 1}</td>
                  <td>{money(purchase.unitPrice)} AFN</td>
                  <td>{money(purchase.totalPurchaseValue)} AFN</td>
                  <td>{money(purchase.paidAmount)} AFN</td>
                  <td>{money(purchase.remainAmount)} AFN</td>
                  <td>{purchase.status || "-"}</td>
                  <td>
  <div className="supplier-purchase-action-cell">
  <button
    type="button"
    className="supplier-purchase-action-btn"
    onClick={(event) => togglePurchaseActionMenu(event, purchase.id)}
  >
    ⋮
  </button>

  {openPurchaseAction === purchase.id && (
    <div
      className="supplier-purchase-action-menu"
      style={{
        top: `${purchaseActionPosition.top}px`,
        left: `${purchaseActionPosition.left}px`,
      }}
    >
      <button
        type="button"
        onClick={() => {
          setDetailPurchase(purchase);
          setOpenPurchaseAction(null);
        }}
      >
        <InfoIcon />
        <span>Full Detail</span>
      </button>

      <button
        type="button"
        onClick={() => {
          openEditPurchaseModal(purchase);
          setOpenPurchaseAction(null);
        }}
      >
        <EditIcon />
        <span>Edit</span>
      </button>

      <button
        type="button"
        className="danger-action"
        onClick={() => {
          openDeletePurchaseModal(purchase.id);
          setOpenPurchaseAction(null);
        }}
      >
        <TrashIcon />
        <span>Delete</span>
      </button>
    </div>
  )}
</div>
</td>
                </tr>
              ))}

              {recentPurchases.length === 0 && (
                <tr>
                  <td colSpan="12" className="supplier-empty-message">
                    No purchase has been recorded for this supplier yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPurchaseModal && (
        <div className="supplier-purchase-modal-backdrop" onClick={closePurchaseModal}>
          <div
            className="supplier-purchase-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="supplier-purchase-modal-header">
              <div>
                <h3>{editPurchaseId ? "Edit Purchase" : "New Purchase"}</h3>
                <p>Record a purchase from {supplier.supplierName}.</p>
              </div>

              <button type="button" onClick={closePurchaseModal}>
                ×
              </button>
            </div>

            <form onSubmit={savePurchase}>
              <div className="supplier-purchase-form-grid">
                <div className="supplier-form-group">
                  <label>Purchase Date</label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={purchaseForm.purchaseDate}
                    onChange={handlePurchaseChange}
                    required
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Invoice / Reference Number</label>
                  <input
                    name="invoiceNumber"
                    value={purchaseForm.invoiceNumber}
                    onChange={handlePurchaseChange}
                    placeholder="Example: INV-1001"
                    required
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Asset ID</label>
                  <div className="supplier-asset-id-field">
                    <input
                      name="assetId"
                      value={purchaseForm.assetId}
                      onChange={handlePurchaseChange}
                      placeholder="Example: AST-0001"
                    />

                    <button type="button" onClick={handleGenerateAssetId}>
                      Generate
                    </button>
                  </div>
                </div>

                <div className="supplier-form-group">
                  <label>Device Name</label>
                  <input
                    name="deviceName"
                    value={purchaseForm.deviceName}
                    onChange={handlePurchaseChange}
                    placeholder="Example: MikroTik Router"
                    required
                  />
                </div>

                <div className="supplier-form-group">
                  <div className="supplier-label-row">
                    <label>Category</label>

                    {categoryMode === "select" && (
                      <button
                        type="button"
                        className="supplier-category-plus"
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
                      value={purchaseForm.category}
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
                    <div className="supplier-custom-category">
                      <input
                        value={newCategory}
                        onChange={(event) => setNewCategory(event.target.value)}
                        placeholder="Enter new category"
                        autoFocus
                      />

                      <button
                        type="button"
                        className="supplier-category-save"
                        onClick={saveCustomCategory}
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        className="supplier-category-back"
                        onClick={backToCategorySelect}
                      >
                        Back
                      </button>
                    </div>
                  )}
                </div>
                <div className="supplier-form-group">
                  <label>Brand</label>
                  <input
                    name="brand"
                    value={purchaseForm.brand}
                    onChange={handlePurchaseChange}
                    placeholder="Example: MikroTik"
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Model</label>
                  <input
                    name="model"
                    value={purchaseForm.model}
                    onChange={handlePurchaseChange}
                    placeholder="Example: RB750Gr3"
                  />
                </div>

                <div className="supplier-form-group">
                  <label>MAC Address</label>
                  <input
                    name="macAddress"
                    value={purchaseForm.macAddress}
                    onChange={handlePurchaseChange}
                    placeholder="Example: AA:BB:CC:DD:EE:FF"
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Serial Number</label>
                  <input
                    name="serialNumber"
                    value={purchaseForm.serialNumber}
                    onChange={handlePurchaseChange}
                    placeholder="Example: SN-123456"
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    value={purchaseForm.quantity}
                    onChange={handlePurchaseChange}
                    required
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    name="unitPrice"
                    value={purchaseForm.unitPrice}
                    onChange={handlePurchaseChange}
                    placeholder="Example: 2500"
                    required
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Total Purchase Value</label>
                  <input
                    value={`${money(Number(purchaseForm.quantity || 0) * Number(purchaseForm.unitPrice || 0))} AFN`}
                    readOnly
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Paid Amount</label>
                  <input
                    type="number"
                    min="0"
                    name="paidAmount"
                    value={purchaseForm.paidAmount}
                    onChange={handlePurchaseChange}
                    placeholder="Example: 1000"
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Remain Amount</label>
                  <input
                    value={`${money(
                      Math.max(
                        Number(purchaseForm.quantity || 0) * Number(purchaseForm.unitPrice || 0) -
                          Number(purchaseForm.paidAmount || 0),
                        0
                      )
                    )} AFN`}
                    readOnly
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Location</label>
                  <select
                    name="location"
                    value={purchaseForm.location}
                    onChange={handlePurchaseChange}
                    required
                  >
                    <option value="Main Stock">Main Stock</option>
                    <option value="Tower">Tower</option>
                    <option value="Customer">Customer</option>
                    <option value="Repair">Repair</option>
                    <option value="Returned Stock">Returned Stock</option>
                  </select>
                </div>

                <div className="supplier-form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={purchaseForm.status}
                    onChange={handlePurchaseChange}
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

                <div className="supplier-form-group supplier-form-full">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={purchaseForm.notes}
                    onChange={handlePurchaseChange}
                    placeholder="Additional purchase notes..."
                  />
                </div>
              </div>

              <div className="supplier-purchase-modal-actions">
                <button type="button" className="supplier-cancel-btn" onClick={closePurchaseModal}>
                  Cancel
                </button>

                <button type="submit" className="supplier-save-btn">
                  {editPurchaseId ? "Save Changes" : "Save Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {detailPurchase && (
  <div className="supplier-detail-modal-backdrop" onClick={() => setDetailPurchase(null)}>
    <div
      className="supplier-detail-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="supplier-detail-modal-header">
        <div>
          <h3>Purchase Full Detail</h3>
          <p>Complete purchase and inventory information.</p>
        </div>

        <button type="button" onClick={() => setDetailPurchase(null)}>
          ×
        </button>
      </div>

      <div className="supplier-detail-grid">
        <div><span>Purchase Date</span><strong>{detailPurchase.purchaseDate || "-"}</strong></div>
        <div><span>Invoice No</span><strong>{detailPurchase.invoiceNumber || "-"}</strong></div>
        <div><span>Asset ID</span><strong>{detailPurchase.assetId || "-"}</strong></div>
        <div><span>Device Name</span><strong>{detailPurchase.deviceName || "-"}</strong></div>
        <div><span>Category</span><strong>{detailPurchase.category || "-"}</strong></div>
        <div><span>Brand</span><strong>{detailPurchase.brand || "-"}</strong></div>
        <div><span>Model</span><strong>{detailPurchase.model || "-"}</strong></div>
        <div><span>MAC Address</span><strong>{detailPurchase.macAddress || "-"}</strong></div>
        <div><span>Serial Number</span><strong>{detailPurchase.serialNumber || "-"}</strong></div>
        <div><span>Quantity</span><strong>{detailPurchase.quantity || 1}</strong></div>
        <div><span>Unit Price</span><strong>{money(detailPurchase.unitPrice)} AFN</strong></div>
        <div><span>Total Value</span><strong>{money(detailPurchase.totalPurchaseValue)} AFN</strong></div>
        <div><span>Paid Amount</span><strong>{money(detailPurchase.paidAmount)} AFN</strong></div>
        <div><span>Remain Amount</span><strong>{money(detailPurchase.remainAmount)} AFN</strong></div>
        <div><span>Location</span><strong>{detailPurchase.location || "-"}</strong></div>
        <div><span>Status</span><strong>{detailPurchase.status || "-"}</strong></div>
      </div>

      <div className="supplier-detail-notes">
        <span>Notes</span>
        <p>{detailPurchase.notes || "No notes have been added for this purchase."}</p>
      </div>

      <div className="supplier-detail-actions">
  <button
    type="button"
    className="supplier-print-btn"
    onClick={() => printPurchaseDetail(detailPurchase)}
  >
    <PrintIcon />
    <span>Print</span>
  </button>

  <button type="button" onClick={() => setDetailPurchase(null)}>
    Close
  </button>
</div>
    </div>
  </div>
)}

{deletePurchaseId && (
  <div className="supplier-delete-backdrop" onClick={cancelDeletePurchase}>
    <div
      className="supplier-delete-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <h3>Delete Purchase</h3>
      <p>
        Are you sure you want to delete this purchase? The related asset record
        will also be removed from inventory.
      </p>

      <div className="supplier-delete-actions">
        <button type="button" className="supplier-delete-cancel" onClick={cancelDeletePurchase}>
          Cancel
        </button>

        <button type="button" className="supplier-delete-confirm" onClick={confirmDeletePurchase}>
          Delete
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default SupplierDetails;