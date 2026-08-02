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
import { formatDateTime } from "../utils/afghanDate";
import "./SupplierDetails.css";
const emptyPurchaseForm = {
  purchaseDate: "",
  productName: "",
  productCode: "",
  billNumber: "",
  billImage: "",
  category: "",
  unit: "Piece",
  quantity: "1",
  unitPrice: "",
  paidAmount: "",
  notes: "",
};

const emptyPaymentForm = {
  paymentDate: new Date().toISOString().slice(0, 10),
  direction: "we_pay_supplier",
  amount: "",
  method: "Cash",
  notes: "",
};

const emptyBalanceForm = {
  balanceDate: new Date().toISOString().slice(0, 10),
  balanceSide: "we_owe_supplier",
  amount: "",
  notes: "",
};

const defaultCategories = [
  "Router",
  "ONU / ONT",
  "Modem",
  "Switch",
  "Access Point",
  "Radio",
  "Antenna",
  "Power Supply",
  "UPS",
  "Battery",
  "Server",
  "Rack",
  "Fiber Cable",
  "Ethernet Cable",
  "SFP Module",
  "Media Converter",
  "PoE Adapter",
  "Tower Equipment",
  "Tools",
  "Office Equipment",
  "Computers",
  "Printers",
  "Vehicles",
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
  const [assetMovements, setAssetMovements] = useJsonCollection("assetMovements");
  const [supplierPayments, setSupplierPayments] = useJsonCollection("supplierPayments");
  const [customCategories, setCustomCategories] = useJsonCollection("assetCategories");
  const [, setTransactions] = useJsonCollection("transactions");

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm);
  const [categoryMode, setCategoryMode] = useState("select");
  const [newCategory, setNewCategory] = useState("");

  const [editPurchaseId, setEditPurchaseId] = useState(null);
  const [detailPurchase, setDetailPurchase] = useState(null);
  const [deletePurchaseId, setDeletePurchaseId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showSupplierInfo, setShowSupplierInfo] = useState(false);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [balanceForm, setBalanceForm] = useState(emptyBalanceForm);
  const [editPayment, setEditPayment] = useState(null);
  const [editBalance, setEditBalance] = useState(null);
  const [deletePayment, setDeletePayment] = useState(null);
  const [deleteBalance, setDeleteBalance] = useState(null);
  const [editLedgerPurchase, setEditLedgerPurchase] = useState(null);
  const [editLedgerPurchaseForm, setEditLedgerPurchaseForm] = useState({});

  const [openPurchaseAction, setOpenPurchaseAction] = useState(null);
  const [purchaseActionPosition, setPurchaseActionPosition] = useState({
    top: 0,
    left: 0,
  });

  const supplier = suppliers[supplierIndex];

  const money = (value) => Number(value || 0).toLocaleString("en-US");

  const supplierName = supplier?.supplierName || "";

  const generateNextPurchaseReference = () => {
    const maxNumber = [...supplierPurchases, ...assetMovements].reduce((max, record) => {
      const value = record.referenceNumber || record.purchaseCode || record.invoiceNumber || "";
      const match = String(value).match(/^(?:REF|PUR)-(\d+)$/i);

      if (!match) return max;

      const number = Number(match[1] || 0);
      return number > max ? number : max;
    }, 0);

    return `REF-${String(maxNumber + 1).padStart(4, "0")}`;
  };

  const movementPurchases = assetMovements
    .filter((movement) => {
      const supplierKey = String(supplier?.id || supplierName || "");
      return (
        movement.movementType === "Purchase" &&
        (String(movement.supplierRecordId || "") === supplierKey ||
          movement.supplierName === supplierName)
      );
    })
    .map((movement) => {
      const relatedAsset = assets.find(
        (asset) =>
          String(asset.id || asset.assetId) ===
            String(movement.assetRecordId || movement.assetId) ||
          String(asset.assetId || "") === String(movement.assetId || "")
      );

      return {
        ...movement,
        source: "asset-movement",
        purchaseDate: movement.date || movement.purchaseDate || "",
        invoiceNumber: movement.invoiceNumber || movement.billNumber || "",
        assetId: relatedAsset?.assetId || movement.assetId || "-",
        deviceName: relatedAsset?.deviceName || movement.deviceName || "-",
        category: relatedAsset?.category || movement.category || "-",
        brand: relatedAsset?.brand || movement.brand || "-",
        model: relatedAsset?.model || movement.model || "-",
        macAddress: relatedAsset?.macAddress || movement.macAddress || "-",
        serialNumber: relatedAsset?.serialNumber || movement.serialNumber || "-",
        totalPurchaseValue: Number(movement.totalAmount || 0),
        remainAmount: Number(movement.remainingAmount || 0),
        status: movement.paymentStatus || "-",
      };
    });

  const repairPurchases = assetMovements
    .filter((movement) => {
      const repairResult = movement.repairResult || {};
      const supplierKey = String(supplier?.id || supplierName || "");

      return (
        repairResult.supplierRecordId || repairResult.supplierName
      ) && (
        String(repairResult.supplierRecordId || "") === supplierKey ||
        repairResult.supplierName === supplierName
      );
    })
    .map((movement) => {
      const relatedAsset = assets.find(
        (asset) =>
          String(asset.id || asset.assetId) ===
            String(movement.assetRecordId || movement.assetId) ||
          String(asset.assetId || "") === String(movement.assetId || "")
      );
      const repairResult = movement.repairResult || {};
      const repairCost = Number(repairResult.repairCost || 0);
      const paidAmount = Number(repairResult.paidAmount || 0);

      return {
        ...movement,
        source: "asset-repair",
        purchaseDate: repairResult.repairDate || movement.date || "",
        invoiceNumber: movement.referenceNumber || "",
        assetId: relatedAsset?.assetId || movement.assetId || "-",
        deviceName: `Repair - ${relatedAsset?.deviceName || movement.deviceName || "-"}`,
        category: relatedAsset?.category || movement.category || "-",
        brand: relatedAsset?.brand || movement.brand || "-",
        model: relatedAsset?.model || movement.model || "-",
        macAddress: relatedAsset?.macAddress || movement.macAddress || "-",
        serialNumber: relatedAsset?.serialNumber || movement.serialNumber || "-",
        quantity: 1,
        totalPurchaseValue: repairCost,
        paidAmount,
        remainAmount: Math.max(repairCost - paidAmount, 0),
        status: repairCost - paidAmount <= 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Unpaid",
      };
    });

  const legacyPurchases = supplierPurchases
    .filter(
      (purchase) =>
        Number(purchase.supplierIndex) === Number(supplierIndex) ||
        purchase.supplierName === supplierName
    )
    .map((purchase) => ({
      ...purchase,
      source: "legacy-supplier-purchase",
    }));

  const purchases = [...movementPurchases, ...repairPurchases, ...legacyPurchases];

  const supplierPaymentRecords = supplierPayments.filter(
    (payment) =>
      Number(payment.supplierIndex) === Number(supplierIndex) ||
      payment.supplierName === supplierName
  );

  const isBalanceRecord = (record) =>
    String(record.recordType || record.type || "").toLowerCase() === "balance";

  const balanceRecords = supplierPaymentRecords.filter(isBalanceRecord);
  const latestBalanceRecord = [...balanceRecords]
  .sort(
    (a, b) =>
      new Date(b.createdAt || b.balanceDate).getTime() -
      new Date(a.createdAt || a.balanceDate).getTime()
  )[0];

const latestOpeningBalance = latestBalanceRecord
  ? latestBalanceRecord.balanceSide === "we_owe_supplier"
    ? -Math.abs(Number(latestBalanceRecord.amount || 0))
    : Math.abs(Number(latestBalanceRecord.amount || 0))
  : Number(supplier?.openingBalance || 0);
  const payments = supplierPaymentRecords.filter((record) => !isBalanceRecord(record));

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

  const purchasePaidTotal = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.paidAmount || 0),
    0
  );

  const supplierPaymentTotal = payments.reduce(
    (sum, payment) =>
      payment.direction === "supplier_pays_us"
        ? sum
        : sum + Number(payment.amount || 0),
    0
  );

  const supplierPaidUsTotal = payments.reduce(
    (sum, payment) =>
      payment.direction === "supplier_pays_us"
        ? sum + Number(payment.amount || 0)
        : sum,
    0
  );

  const openingWeOweSupplier = balanceRecords.reduce(
    (sum, balance) =>
      balance.balanceSide === "we_owe_supplier"
        ? sum + Number(balance.amount || 0)
        : sum,
    0
  );

  const openingSupplierOwesUs = balanceRecords.reduce(
    (sum, balance) =>
      balance.balanceSide === "supplier_owes_us"
        ? sum + Number(balance.amount || 0)
        : sum,
    0
  );

  const totalPaidToSupplier = purchasePaidTotal + supplierPaymentTotal;
  const supplierBalance =
    totalPurchaseValue +
    openingWeOweSupplier +
    supplierPaidUsTotal -
    totalPaidToSupplier -
    openingSupplierOwesUs;
  const weOweSupplier = supplierBalance > 0 ? supplierBalance : 0;
  const supplierOwesUs = supplierBalance < 0 ? Math.abs(supplierBalance) : 0;
  const averagePurchaseValue =
    purchases.length > 0 ? totalPurchaseValue / purchases.length : 0;
  const hasSupplierFinancialRecords =
    purchases.length > 0 || payments.length > 0 || balanceRecords.length > 0;

  const ledgerRows = [
    ...balanceRecords.map((balance) => ({
      id: `balance-${balance.id}`,
      type: "Balance",
      date: balance.balanceDate || balance.createdAt?.slice(0, 10) || "-",
      timeSource: balance.createdAt || balance.updatedAt || "",
      description: balance.notes || "Opening balance",
      debit:
        balance.balanceSide === "we_owe_supplier"
          ? Number(balance.amount || 0)
          : 0,
      credit:
        balance.balanceSide === "supplier_owes_us"
          ? Number(balance.amount || 0)
          : 0,
      status:
        balance.balanceSide === "we_owe_supplier"
          ? "We Owe Supplier"
          : "Supplier Owes Us",
      record: balance,
      recordType: "balance",
    })),
    ...purchases.map((purchase) => ({
      id: `purchase-${purchase.source}-${purchase.id}`,
      type: "Purchase",
      date: purchase.purchaseDate || purchase.createdAt?.slice(0, 10) || "-",
      timeSource: purchase.createdAt || purchase.updatedAt || "",
      description: `${purchase.deviceName || "-"} / ${purchase.invoiceNumber || purchase.purchaseCode || "-"}`,
      debit: Number(purchase.totalPurchaseValue || 0),
      credit: Number(purchase.paidAmount || 0),
      status: purchase.status || purchase.paymentStatus || "-",
      record: purchase,
      recordType: "purchase",
    })),
    ...payments.map((payment) => ({
      id: `payment-${payment.id}`,
      type: "Payment",
      date: payment.paymentDate || payment.createdAt?.slice(0, 10) || "-",
      timeSource: payment.createdAt || payment.updatedAt || "",
      description: payment.notes || "Supplier payment",
      direction:
        payment.direction === "supplier_pays_us"
          ? "Supplier Pays Us"
          : "We Pay Supplier",
      debit: payment.direction === "supplier_pays_us" ? Number(payment.amount || 0) : 0,
      credit: payment.direction === "supplier_pays_us" ? 0 : Number(payment.amount || 0),
      status: payment.method || "Cash",
      record: payment,
      recordType: "payment",
    })),
  ].sort((a, b) => {
  const getTimestamp = (row) => {
    const date = row.date && row.date !== "-" ? row.date : "";
    const timeSource = row.timeSource || "";

    if (date) {
      const timePart =
        timeSource && timeSource.includes("T")
          ? timeSource.split("T")[1]
          : "00:00:00";

      const timestamp = new Date(`${date}T${timePart}`).getTime();

      if (!Number.isNaN(timestamp)) {
        return timestamp;
      }
    }

    const fallbackTimestamp = new Date(timeSource).getTime();

    return Number.isNaN(fallbackTimestamp)
      ? 0
      : fallbackTimestamp;
  };

  return getTimestamp(b) - getTimestamp(a);
});

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
          <div class="item"><span>Purchase Date</span><strong>${formatDateTime(purchase.purchaseDate, purchase.createdAt || purchase.updatedAt)}</strong></div>
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

  const recentPurchases = [...purchases]
    .sort((a, b) => String(b.purchaseDate || "").localeCompare(String(a.purchaseDate || "")));

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



  const handleBillImageChange = (event) => {
    const file = event.target.files?.[0];
  
    if (!file) return;
  
    const reader = new FileReader();
  
    reader.onload = () => {
      setPurchaseForm((previous) => ({
        ...previous,
        billImage: reader.result,
      }));
    };
  
    reader.readAsDataURL(file);
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

const openPaymentModal = () => {
  setEditPayment(null);
  setPaymentForm(emptyPaymentForm);
  setShowPaymentModal(true);
};

const closePaymentModal = () => {
  setEditPayment(null);
  setPaymentForm(emptyPaymentForm);
  setShowPaymentModal(false);
};

const openBalanceModal = () => {
  if (hasSupplierFinancialRecords) {
    notify("Opening balance can only be added before any supplier record exists.", "error");
    return;
  }

  setEditBalance(null);
  setBalanceForm(emptyBalanceForm);
  setShowBalanceModal(true);
};

const closeBalanceModal = () => {
  setEditBalance(null);
  setBalanceForm(emptyBalanceForm);
  setShowBalanceModal(false);
};

const handlePaymentChange = (event) => {
  const { name, value } = event.target;
  setPaymentForm((previous) => ({
    ...previous,
    [name]: value,
  }));
};

const upsertSupplierPaymentTransaction = async (payment) => {
  const createdAt = payment.createdAt || new Date().toISOString();
  const supplierPaysUs = payment.direction === "supplier_pays_us";
  const transaction = {
    id: `supplier-payment-${supplierPaysUs ? "income" : "expense"}-${payment.id}`,
    type: supplierPaysUs ? "income" : "expense",
    title: supplierPaysUs
      ? `Supplier Payment Received - ${payment.supplierName || "Supplier"}`
      : `Supplier Payment - ${payment.supplierName || "Supplier"}`,
    category: supplierPaysUs ? "Supplier Payment Received" : "Supplier Payment",
    amount: Number(payment.amount || 0),
    date: payment.paymentDate,
    description: [
      supplierPaysUs ? "Direction: Supplier Pays Us" : "Direction: We Pay Supplier",
      payment.method ? `Method: ${payment.method}` : "",
      payment.notes || "",
    ]
      .filter(Boolean)
      .join(" | "),
    source: "supplier-payment",
    referenceId: payment.id,
    supplierRecordId: payment.supplierRecordId || "",
    supplierName: payment.supplierName || "",
    createdAt,
    updatedAt: new Date().toISOString(),
  };

  return setTransactions((previousTransactions) => [
    ...previousTransactions.filter(
      (transaction) =>
        !(
          transaction.source === "supplier-payment" &&
          String(transaction.referenceId || "") === String(payment.id)
        )
    ),
    transaction,
  ]);
};

const removeSupplierPaymentExpense = async (paymentId) =>
  setTransactions((previousTransactions) =>
    previousTransactions.filter(
      (transaction) =>
        !(
          transaction.source === "supplier-payment" &&
          String(transaction.referenceId || "") === String(paymentId)
        )
    )
  );

const handleBalanceChange = (event) => {
  const { name, value } = event.target;
  setBalanceForm((previous) => ({
    ...previous,
    [name]: value,
  }));
};

const saveSupplierBalance = async (event) => {
  event.preventDefault();

  if (!editBalance && hasSupplierFinancialRecords) {
    notify("Opening balance is locked because this supplier already has records.", "error");
    return;
  }

  const amount = Number(balanceForm.amount || 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    notify("Balance amount must be greater than zero.", "error");
    return;
  }

  const cleanBalance = {
    id: editBalance?.id || Date.now(),
    recordType: "balance",
    type: "Balance",
    supplierIndex,
    supplierRecordId: supplier?.id || "",
    supplierName,
    balanceDate: balanceForm.balanceDate,
    balanceSide: balanceForm.balanceSide,
    amount,
    notes: balanceForm.notes.trim(),
    createdAt: editBalance?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nextRecords = editBalance
    ? supplierPayments.map((record) =>
        record.id === editBalance.id ? cleanBalance : record
      )
    : [...supplierPayments, cleanBalance];

  const saved = await setSupplierPayments(nextRecords);

  if (!saved) return;

  notify(editBalance ? "Balance updated successfully." : "Opening balance saved successfully.");
  closeBalanceModal();
};

const saveSupplierPayment = async (event) => {
  event.preventDefault();

  const amount = Number(paymentForm.amount || 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    notify("Payment amount must be greater than zero.", "error");
    return;
  }

  const cleanPayment = {
    id: editPayment?.id || Date.now(),
    supplierIndex,
    supplierRecordId: supplier?.id || "",
    supplierName,
    paymentDate: paymentForm.paymentDate,
    direction: paymentForm.direction || "we_pay_supplier",
    amount,
    method: paymentForm.method,
    notes: paymentForm.notes.trim(),
    createdAt: editPayment?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nextPayments = editPayment
    ? supplierPayments.map((payment) =>
        payment.id === editPayment.id ? cleanPayment : payment
      )
    : [...supplierPayments, cleanPayment];

  const saved = await setSupplierPayments(nextPayments);

  if (!saved) return;

  const transactionSaved = await upsertSupplierPaymentTransaction(cleanPayment);

  if (!transactionSaved) {
    notify("Payment saved, but its Financial transaction could not be linked.", "error");
    return;
  }

  notify(editPayment ? "Payment updated successfully." : "Payment saved successfully.");
  closePaymentModal();
};

const openEditPaymentModal = (payment) => {
  setEditPayment(payment);
  setPaymentForm({
    paymentDate: payment.paymentDate || "",
    direction: payment.direction || "we_pay_supplier",
    amount: String(payment.amount || ""),
    method: payment.method || "Cash",
    notes: payment.notes || "",
  });
  setShowPaymentModal(true);
};

const openEditBalanceModal = (balance) => {
  setEditBalance(balance);
  setBalanceForm({
    balanceDate: balance.balanceDate || "",
    balanceSide: balance.balanceSide || "we_owe_supplier",
    amount: String(balance.amount || ""),
    notes: balance.notes || "",
  });
  setShowBalanceModal(true);
};

const confirmDeletePayment = async () => {
  if (!deletePayment) return;

  const saved = await setSupplierPayments(
    supplierPayments.filter((payment) => payment.id !== deletePayment.id)
  );

  if (!saved) return;

  const expenseRemoved = await removeSupplierPaymentExpense(deletePayment.id);

  if (!expenseRemoved) {
    notify("Payment deleted, but its expense could not be removed from Financial.", "error");
    return;
  }

  notify("Payment deleted successfully.");
  setDeletePayment(null);
};

const confirmDeleteBalance = async () => {
  if (!deleteBalance) return;

  const saved = await setSupplierPayments(
    supplierPayments.filter((record) => record.id !== deleteBalance.id)
  );

  if (!saved) return;

  notify("Balance deleted successfully.");
  setDeleteBalance(null);
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

const upsertPurchaseExpense = async (purchase, source = "supplier-purchase") => {
  const referenceId = purchase.id;
  const totalAmount = Number(
    purchase.totalPurchaseValue ?? purchase.totalAmount ?? 0
  );
  const paidAmount = Number(purchase.paidAmount || 0);
  const remainingAmount = Number(
    purchase.remainAmount ?? purchase.remainingAmount ?? Math.max(totalAmount - paidAmount, 0)
  );
  const date = purchase.purchaseDate || purchase.date || new Date().toISOString().slice(0, 10);
  const createdAt = purchase.createdAt || new Date().toISOString();

  if (paidAmount <= 0) {
    return removePurchaseExpense(source, referenceId);
  }

  const expense = {
    id: `${source}-expense-${referenceId}`,
    type: "expense",
    title: `Asset Purchase - ${purchase.deviceName || purchase.assetName || "Asset"}`,
    category: "Purchases",
    amount: paidAmount,
    date,
    description: [
      purchase.supplierName ? `Supplier: ${purchase.supplierName}` : "",
      purchase.invoiceNumber || purchase.billNumber
        ? `Bill: ${purchase.invoiceNumber || purchase.billNumber}`
        : "",
      `Quantity: ${purchase.quantity || 0}`,
      `Unit Price: ${money(purchase.unitPrice)} AFN`,
      `Paid: ${money(paidAmount)} AFN`,
      `Remaining: ${money(remainingAmount)} AFN`,
      purchase.notes || "",
    ]
      .filter(Boolean)
      .join(" | "),
    source,
    referenceId,
    assetId: purchase.assetId || "",
    supplierName: purchase.supplierName || "",
    createdAt,
    updatedAt: new Date().toISOString(),
  };

  return setTransactions((previousTransactions) => [
    ...previousTransactions.filter(
      (transaction) =>
        !(
          transaction.source === source &&
          String(transaction.referenceId || "") === String(referenceId)
        )
    ),
    expense,
  ]);
};

const removePurchaseExpense = async (source, referenceId) =>
  setTransactions((previousTransactions) =>
    previousTransactions.filter(
      (transaction) =>
        !(
          transaction.source === source &&
          String(transaction.referenceId || "") === String(referenceId)
        )
    )
  );

  const savePurchase = async (event) => {
    event.preventDefault();
  
    const quantity = Number(purchaseForm.quantity || 0);
    const unitPrice = Number(purchaseForm.unitPrice || 0);
    const paidAmount = Number(purchaseForm.paidAmount || 0);
  
    const totalPurchaseValue = quantity * unitPrice;
    const remainAmount = totalPurchaseValue - paidAmount;
  
    if (!purchaseForm.productName?.trim()) {
      notify("Please enter the product name.", "error");
      return;
    }
  
    if (!Number.isFinite(quantity) || quantity <= 0) {
      notify("Quantity must be greater than zero.", "error");
      return;
    }
  
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      notify("Purchase price is invalid.", "error");
      return;
    }
  
    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      notify("Paid amount is invalid.", "error");
      return;
    }
  
    if (paidAmount > totalPurchaseValue) {
      notify("Paid amount cannot be greater than total.", "error");
      return;
    }
  
    const existingPurchase = supplierPurchases.find(
      (purchase) => purchase.id === editPurchaseId
    );
  
    const cleanPurchase = {
      ...existingPurchase,
  
      id: editPurchaseId || crypto.randomUUID(),
  
      supplierIndex,
      supplierRecordId: supplier?.id || "",
      supplierName,
  
      purchaseDate:
        purchaseForm.purchaseDate ||
        new Date().toISOString().slice(0, 10),
  
      productName: purchaseForm.productName.trim(),
      productCode: purchaseForm.productCode.trim(),
      billNumber: purchaseForm.billNumber.trim(),
      billImage: purchaseForm.billImage || "",
      category: purchaseForm.category.trim(),
      unit: purchaseForm.unit,
  
      quantity,
      unitPrice,
      paidAmount,
      totalPurchaseValue,
      remainAmount,
  
      notes: purchaseForm.notes.trim(),
  
      /* برای سازگاری با جدول فعلی */
      deviceName: purchaseForm.productName.trim(),
      invoiceNumber: purchaseForm.billNumber.trim(),
  
      status:
        remainAmount === 0
          ? "Paid"
          : paidAmount > 0
            ? "Partial"
            : "Unpaid",
  
      createdAt:
        existingPurchase?.createdAt || new Date().toISOString(),
  
      updatedAt: new Date().toISOString(),
    };
  
    const nextPurchases = editPurchaseId
      ? supplierPurchases.map((purchase) =>
          purchase.id === editPurchaseId ? cleanPurchase : purchase
        )
      : [...supplierPurchases, cleanPurchase];
  
    const saved = await setSupplierPurchases(nextPurchases);
  
    if (!saved) return;
  
    notify(
      editPurchaseId
        ? "Purchase updated successfully."
        : "Purchase saved successfully."
    );
  
    setEditPurchaseId(null);
    closePurchaseModal();
  };

  const openCreatePurchaseModal = () => {
    setEditPurchaseId(null);
    setPurchaseForm(emptyPurchaseForm);
    setCategoryMode("select");
    setNewCategory("");
    setShowPurchaseModal(true);
  };

const openEditPurchaseModal = (purchase) => {
  if (purchase.source === "asset-movement") {
    setEditLedgerPurchase(purchase);
    setEditLedgerPurchaseForm({
      purchaseDate: purchase.purchaseDate || "",
      invoiceNumber: purchase.invoiceNumber || "",
      quantity: String(purchase.quantity || 1),
      unitPrice: String(purchase.unitPrice || ""),
      paidAmount: String(purchase.paidAmount || ""),
      notes: purchase.notes || "",
    });
    return;
  }

  setEditPurchaseId(purchase.id);

  setPurchaseForm({
    purchaseDate: purchase.purchaseDate || "",
    referenceNumber: purchase.referenceNumber || purchase.purchaseCode || "",
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

const handleEditLedgerPurchaseChange = (event) => {
  const { name, value } = event.target;
  setEditLedgerPurchaseForm((previous) => ({
    ...previous,
    [name]: value,
  }));
};

const saveEditedLedgerPurchase = async (event) => {
  event.preventDefault();

  if (!editLedgerPurchase) return;

  const quantity = Number(editLedgerPurchaseForm.quantity || 0);
  const unitPrice = Number(editLedgerPurchaseForm.unitPrice || 0);
  const paidAmount = Number(editLedgerPurchaseForm.paidAmount || 0);
  const totalAmount = quantity * unitPrice;
  const remainingAmount = Math.max(totalAmount - paidAmount, 0);

  if (quantity <= 0 || unitPrice < 0 || paidAmount < 0) {
    notify("Quantity, unit price, and paid amount must be valid.", "error");
    return;
  }

  if (paidAmount > totalAmount) {
    notify("Paid amount cannot be greater than total amount.", "error");
    return;
  }

  const updatedMovement = {
    ...editLedgerPurchase,
    date: editLedgerPurchaseForm.purchaseDate,
    purchaseDate: editLedgerPurchaseForm.purchaseDate,
    invoiceNumber: editLedgerPurchaseForm.invoiceNumber.trim(),
    billNumber: editLedgerPurchaseForm.invoiceNumber.trim(),
    quantity,
    unitPrice,
    totalAmount,
    totalPurchaseValue: totalAmount,
    paidAmount,
    remainingAmount,
    remainAmount: remainingAmount,
    paymentStatus:
      remainingAmount === 0
        ? "Paid"
        : paidAmount > 0
          ? "Partial"
          : "Unpaid",
    notes: editLedgerPurchaseForm.notes.trim(),
    updatedAt: new Date().toISOString(),
  };

  const saved = await setAssetMovements(
    assetMovements.map((movement) =>
      movement.id === editLedgerPurchase.id
        ? updatedMovement
        : movement
    )
  );

  if (!saved) return;

  const financeSaved = await upsertPurchaseExpense(updatedMovement, "asset-purchase");

  if (!financeSaved) {
    notify("Purchase updated, but its expense could not be updated in Financial.", "error");
  }

  notify("Purchase record updated successfully.");
  setEditLedgerPurchase(null);
  setEditLedgerPurchaseForm({});
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

  const movementPurchase = purchases.find(
    (purchase) =>
      purchase.source === "asset-movement" &&
      String(purchase.id) === String(deletePurchaseId)
  );

  if (movementPurchase) {
    const saved = await setAssetMovements(
      assetMovements.filter((movement) => movement.id !== deletePurchaseId)
    );

    if (saved) {
      await removePurchaseExpense("asset-purchase", deletePurchaseId);
      notify("Purchase record deleted successfully.");
      setDeletePurchaseId(null);
    }

    return;
  }

  const nextPurchases = supplierPurchases.filter(
    (purchase) => purchase.id !== deletePurchaseId
  );

  const nextAssets = assets.filter(
    (asset) => asset.purchaseId !== deletePurchaseId
  );

  const purchasesSaved = await setSupplierPurchases(nextPurchases);
  const assetsSaved = await setAssets(nextAssets);

  if (purchasesSaved && assetsSaved) {
    await removePurchaseExpense("supplier-purchase", deletePurchaseId);
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

        <div className="supplier-header-actions">

        <button
  type="button"
  className="supplier-secondary-btn"
  onClick={openCreatePurchaseModal}
>
  Purchase
</button>
          <button
            type="button"
            className="supplier-secondary-btn"
            onClick={openBalanceModal}
            disabled={hasSupplierFinancialRecords}
            title={
              hasSupplierFinancialRecords
                ? "Opening balance is locked because this supplier already has records."
                : "Add opening balance"
            }
          >
            Add Balance
          </button>

          <button
            type="button"
            className="supplier-secondary-btn"
            onClick={() => setShowSupplierInfo((value) => !value)}
          >
            {showSupplierInfo ? "Hide Supplier Info" : "Show Supplier Info"}
          </button>

          <button
            type="button"
            className="supplier-purchase-btn"
            onClick={openPaymentModal}
          >
            Add Payment
          </button>
        </div>
      </div>

      {showSupplierInfo && (
        <>
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
        </>
      )}

      <div className="supplier-dashboard-stats supplier-account-stats">
        <div className="supplier-dashboard-card">
          <span>We Owe Supplier</span>
          <strong>{money(weOweSupplier)} AFN</strong>
          <p>Remaining payable balance</p>
        </div>

        <div className="supplier-dashboard-card">
          <span>Supplier Owes Us</span>
          <strong>{money(supplierOwesUs)} AFN</strong>
          <p>Overpaid supplier balance</p>
        </div>
        <div className="supplier-dashboard-card">
  <span>Latest Opening Balance</span>

  <strong>
    {money(latestOpeningBalance)} AFN
  </strong>

  <p>
    {latestOpeningBalance < 0
      ? "We Owe Supplier"
      : latestOpeningBalance > 0
        ? "Supplier Owes Us"
        : "No opening balance recorded"}
  </p>
</div>

        <div className="supplier-dashboard-card">
          <span>Total Paid</span>
          <strong>{money(totalPaidToSupplier)} AFN</strong>
          <p>Purchase paid + later payments</p>
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

      {showSupplierInfo && <div className="supplier-analysis-grid">
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
      </div>}

      <div className="supplier-purchase-table-card">
        <div className="supplier-purchase-table-header">
          <div>
            <h3>Recent Purchase History</h3>
            <p>Purchases and payments recorded for this supplier</p>
          </div>
        </div>

        <div className="supplier-purchase-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Purchase Date</th>
                <th>Type</th>
                <th>Direction</th>
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
              {ledgerRows.map((row) => {
                const purchase = row.recordType === "purchase" ? row.record : null;
                const payment = row.recordType === "payment" ? row.record : null;
                const balance = row.recordType === "balance" ? row.record : null;

                return (
                <tr key={row.id}>
                  <td>{formatDateTime(row.date, row.timeSource)}</td>
                  <td>
                    <span
                      className={
                        row.recordType === "payment"
                          ? "supplier-ledger-type payment"
                          : row.recordType === "balance"
                            ? "supplier-ledger-type balance"
                            : "supplier-ledger-type purchase"
                      }
                    >
                      {row.type}
                    </span>
                  </td>
                  <td>{row.direction || "-"}</td>
                  <td>{purchase?.invoiceNumber || "-"}</td>
                  <td>{purchase?.assetId || "-"}</td>
                  <td>
                    {purchase?.deviceName ||
                      payment?.notes ||
                      balance?.notes ||
                      (balance ? "Opening Balance" : "-")}
                  </td>
                  <td>{purchase?.category || "-"}</td>
                  <td>{purchase?.quantity || "-"}</td>
                  <td>{purchase ? `${money(purchase.unitPrice)} AFN` : "-"}</td>
                  <td>
                    {purchase
                      ? `${money(purchase.totalPurchaseValue)} AFN`
                      : row.debit
                        ? `${money(row.debit)} AFN`
                        : "-"}
                  </td>
                  <td>
  {row.credit ? (
    <span className="supplier-amount-badge paid">
      {money(row.credit)} AFN
    </span>
  ) : (
    "-"
  )}
</td>

<td>
  {purchase ? (
    <span
      className={`supplier-amount-badge ${
        Number(purchase.remainAmount || 0) > 0
          ? "remaining"
          : "cleared"
      }`}
    >
      {money(purchase.remainAmount)} AFN
    </span>
  ) : (
    balance ? `${money(balance.amount)} AFN` : "-"
  )}
</td>
                  <td>{row.status || "-"}</td>
                  <td>
  <div className="supplier-purchase-action-cell">
  <button
    type="button"
    className="supplier-purchase-action-btn"
    onClick={(event) => togglePurchaseActionMenu(event, row.id)}
  >
    ⋮
  </button>

  {openPurchaseAction === row.id && (
    <div
      className="supplier-purchase-action-menu"
      style={{
        top: `${purchaseActionPosition.top}px`,
        left: `${purchaseActionPosition.left}px`,
      }}
    >
      {row.recordType === "purchase" ? (
        <>
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
            onClick={() => {
              printPurchaseDetail(purchase);
              setOpenPurchaseAction(null);
            }}
          >
            <PrintIcon />
            <span>Receipt</span>
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
        </>
      ) : row.recordType === "balance" ? (
        <>
          <button
            type="button"
            onClick={() => {
              openEditBalanceModal(balance);
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
              setDeleteBalance(balance);
              setOpenPurchaseAction(null);
            }}
          >
            <TrashIcon />
            <span>Delete</span>
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              openEditPaymentModal(payment);
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
              setDeletePayment(payment);
              setOpenPurchaseAction(null);
            }}
          >
            <TrashIcon />
            <span>Delete</span>
          </button>
        </>
      )}
    </div>
  )}
</div>
</td>
                </tr>
              );
              })}

              {ledgerRows.length === 0 && (
                <tr>
                  <td colSpan="14" className="supplier-empty-message">
                    No purchase, payment, or balance has been recorded for this supplier yet.
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
    <label>Product Name</label>
    <input
      name="productName"
      value={purchaseForm.productName}
      onChange={handlePurchaseChange}
      placeholder="Enter product name"
      required
    />
  </div>

  <div className="supplier-form-group">
    <label>Product Code</label>
    <input
      name="productCode"
      value={purchaseForm.productCode}
      onChange={handlePurchaseChange}
      placeholder="Enter product code"
    />
  </div>

  <div className="supplier-form-group">
    <label>Bill Number</label>
    <input
      name="billNumber"
      value={purchaseForm.billNumber}
      onChange={handlePurchaseChange}
      placeholder="Enter bill number"
    />
  </div>

  <div className="supplier-form-group supplier-form-full">
    <label>Bill Image</label>
    <input
      type="file"
      accept="image/*"
      onChange={handleBillImageChange}
    />

    {purchaseForm.billImage && (
      <img
        src={purchaseForm.billImage}
        alt="Bill preview"
        style={{
          width: "130px",
          height: "90px",
          marginTop: "8px",
          borderRadius: "10px",
          objectFit: "cover",
        }}
      />
    )}
  </div>

  <div className="supplier-form-group supplier-form-full">
    <div className="supplier-label-row">
      <label>Category</label>

      <button
        type="button"
        className="supplier-category-plus"
        onClick={() => {
          setCategoryMode("custom");
          setNewCategory("");
        }}
        title="Add category"
      >
        +
      </button>
    </div>

    {categoryMode === "custom" && (
      <div className="supplier-custom-category">
        <input
          value={newCategory}
          onChange={(event) => setNewCategory(event.target.value)}
          placeholder="Enter category name"
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
          Cancel
        </button>
      </div>
    )}

    {purchaseForm.category && (
      <div className="supplier-selected-category">
        {purchaseForm.category}
      </div>
    )}
  </div>

  <div className="supplier-form-group">
    <label>Unit</label>
    <select
      name="unit"
      value={purchaseForm.unit}
      onChange={handlePurchaseChange}
      required
    >
      <option value="Piece">Piece</option>
      <option value="Box">Box</option>
      <option value="Meter">Meter</option>
      <option value="Kilogram">Kilogram</option>
      <option value="Set">Set</option>
      <option value="Roll">Roll</option>
    </select>
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
    <label>Purchase Price</label>
    <input
      type="number"
      min="0"
      name="unitPrice"
      value={purchaseForm.unitPrice}
      onChange={handlePurchaseChange}
      placeholder="Price of one unit"
      required
    />
  </div>

  <div className="supplier-form-group">
    <label>Total</label>
    <input
      value={`${money(
        Number(purchaseForm.quantity || 0) *
          Number(purchaseForm.unitPrice || 0)
      )} AFN`}
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
      placeholder="Enter paid amount"
    />
  </div>

  <div className="supplier-form-group">
    <label>Remain</label>
    <input
      value={`${money(
        Math.max(
          Number(purchaseForm.quantity || 0) *
            Number(purchaseForm.unitPrice || 0) -
            Number(purchaseForm.paidAmount || 0),
          0
        )
      )} AFN`}
      readOnly
    />
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

      {showBalanceModal && (
        <div className="supplier-purchase-modal-backdrop" onClick={closeBalanceModal}>
          <div
            className="supplier-purchase-modal supplier-payment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="supplier-purchase-modal-header">
              <div>
                <h3>{editBalance ? "Edit Opening Balance" : "Add Opening Balance"}</h3>
                <p>Set who owes money before purchases or payments are recorded.</p>
              </div>

              <button
  type="button"
  className="supplier-modal-close-btn"
  onClick={closeBalanceModal}
  aria-label="Close"
  title="Close"
>
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M6 6L18 18M18 6L6 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
</button>
            </div>

            <form onSubmit={saveSupplierBalance}>
              <div className="supplier-purchase-form-grid">
                <div className="supplier-form-group">
                  <label>Balance Date</label>
                  <input
                    type="date"
                    name="balanceDate"
                    value={balanceForm.balanceDate}
                    onChange={handleBalanceChange}
                    required
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Balance Type</label>
                  <select
                    name="balanceSide"
                    value={balanceForm.balanceSide}
                    onChange={handleBalanceChange}
                    required
                  >
                    <option value="we_owe_supplier">We Owe Supplier</option>
                    <option value="supplier_owes_us">Supplier Owes Us</option>
                  </select>
                </div>

                <div className="supplier-form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    min="1"
                    name="amount"
                    value={balanceForm.amount}
                    onChange={handleBalanceChange}
                    placeholder="Example: 5000"
                    required
                  />
                </div>

                <div className="supplier-form-group supplier-form-full">
                  <label>Description</label>
                  <textarea
                    name="notes"
                    value={balanceForm.notes}
                    onChange={handleBalanceChange}
                    placeholder="Opening balance description..."
                  />
                </div>
              </div>

              <div className="supplier-purchase-modal-actions">
                <button type="button" className="supplier-cancel-btn" onClick={closeBalanceModal}>
                  Cancel
                </button>

                <button type="submit" className="supplier-save-btn">
                  {editBalance ? "Save Changes" : "Save Balance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="supplier-purchase-modal-backdrop" onClick={closePaymentModal}>
          <div
            className="supplier-purchase-modal supplier-payment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="supplier-purchase-modal-header">
              <div>
                <h3>{editPayment ? "Edit Payment" : "Add Payment"}</h3>
                <p>Current payable balance: {money(weOweSupplier)} AFN.</p>
              </div>

              <button type="button" onClick={closePaymentModal}>
                ×
              </button>
            </div>

            <form onSubmit={saveSupplierPayment}>
              <div className="supplier-purchase-form-grid">
                <div className="supplier-form-group">
                  <label>Payment Date</label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={paymentForm.paymentDate}
                    onChange={handlePaymentChange}
                    required
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Payment Direction</label>
                  <select
                    name="direction"
                    value={paymentForm.direction}
                    onChange={handlePaymentChange}
                  >
                    <option value="we_pay_supplier">We Pay Supplier</option>
                    <option value="supplier_pays_us">Supplier Pays Us</option>
                  </select>
                </div>

                <div className="supplier-form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    min="1"
                    name="amount"
                    value={paymentForm.amount}
                    onChange={handlePaymentChange}
                    placeholder="Example: 500"
                    required
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Payment Method</label>
                  <select
                    name="method"
                    value={paymentForm.method}
                    onChange={handlePaymentChange}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Account">Bank Account</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="supplier-form-group supplier-form-full">
                  <label>Description</label>
                  <textarea
                    name="notes"
                    value={paymentForm.notes}
                    onChange={handlePaymentChange}
                    placeholder="Payment description..."
                  />
                </div>
              </div>

              <div className="supplier-purchase-modal-actions">
                <button type="button" className="supplier-cancel-btn" onClick={closePaymentModal}>
                  Cancel
                </button>

                <button type="submit" className="supplier-save-btn">
                  {editPayment ? "Save Changes" : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editLedgerPurchase && (
        <div
          className="supplier-purchase-modal-backdrop"
          onClick={() => setEditLedgerPurchase(null)}
        >
          <div
            className="supplier-purchase-modal supplier-payment-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="supplier-purchase-modal-header">
              <div>
                <h3>Edit Purchase Record</h3>
                <p>Update the purchase values recorded from Asset Inventory.</p>
              </div>

              <button type="button" onClick={() => setEditLedgerPurchase(null)}>
                ×
              </button>
            </div>

            <form onSubmit={saveEditedLedgerPurchase}>
              <div className="supplier-purchase-form-grid">
                <div className="supplier-form-group">
                  <label>Purchase Date</label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={editLedgerPurchaseForm.purchaseDate || ""}
                    onChange={handleEditLedgerPurchaseChange}
                    required
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Invoice Number</label>
                  <input
                    name="invoiceNumber"
                    value={editLedgerPurchaseForm.invoiceNumber || ""}
                    onChange={handleEditLedgerPurchaseChange}
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    value={editLedgerPurchaseForm.quantity || ""}
                    onChange={handleEditLedgerPurchaseChange}
                    required
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    name="unitPrice"
                    value={editLedgerPurchaseForm.unitPrice || ""}
                    onChange={handleEditLedgerPurchaseChange}
                    required
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Paid Amount</label>
                  <input
                    type="number"
                    min="0"
                    name="paidAmount"
                    value={editLedgerPurchaseForm.paidAmount || ""}
                    onChange={handleEditLedgerPurchaseChange}
                  />
                </div>

                <div className="supplier-form-group">
                  <label>Remaining Amount</label>
                  <input
                    value={`${money(
                      Math.max(
                        Number(editLedgerPurchaseForm.quantity || 0) *
                          Number(editLedgerPurchaseForm.unitPrice || 0) -
                          Number(editLedgerPurchaseForm.paidAmount || 0),
                        0
                      )
                    )} AFN`}
                    readOnly
                  />
                </div>

                <div className="supplier-form-group supplier-form-full">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={editLedgerPurchaseForm.notes || ""}
                    onChange={handleEditLedgerPurchaseChange}
                  />
                </div>
              </div>

              <div className="supplier-purchase-modal-actions">
                <button
                  type="button"
                  className="supplier-cancel-btn"
                  onClick={() => setEditLedgerPurchase(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="supplier-save-btn">
                  Save Changes
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
        <div>
          <span>Purchase Date</span>
          <strong>
            {formatDateTime(
              detailPurchase.purchaseDate,
              detailPurchase.createdAt || detailPurchase.updatedAt
            )}
          </strong>
        </div>
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

{deletePayment && (
  <div className="supplier-delete-backdrop" onClick={() => setDeletePayment(null)}>
    <div
      className="supplier-delete-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <h3>Delete Payment</h3>
      <p>Are you sure you want to delete this supplier payment?</p>

      <div className="supplier-delete-actions">
        <button
          type="button"
          className="supplier-delete-cancel"
          onClick={() => setDeletePayment(null)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="supplier-delete-confirm"
          onClick={confirmDeletePayment}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

{deleteBalance && (
  <div className="supplier-delete-backdrop" onClick={() => setDeleteBalance(null)}>
    <div
      className="supplier-delete-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <h3>Delete Balance</h3>
      <p>Are you sure you want to delete this supplier opening balance?</p>

      <div className="supplier-delete-actions">
        <button
          type="button"
          className="supplier-delete-cancel"
          onClick={() => setDeleteBalance(null)}
        >
          Cancel
        </button>

        <button
          type="button"
          className="supplier-delete-confirm"
          onClick={confirmDeleteBalance}
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

export default SupplierDetails;
