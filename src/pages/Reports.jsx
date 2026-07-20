import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { formatDateTime } from "../utils/afghanDate";
import "./Reports.css";

const money = (value) => Number(value || 0).toLocaleString("en-US");
const text = (value) => String(value || "").trim();
const lower = (value) => text(value).toLowerCase();

const reportTypes = [
  { id: "supplier", title: "Supplier Reports", description: "Supplier list, balances, purchase value, and payments." },
  { id: "purchase", title: "Purchase Reports", description: "All recorded purchases with supplier, invoice, value, and payment status." },
  { id: "stock", title: "Stock Reports", description: "Asset stock summary across the inventory." },
  { id: "tower", title: "Tower-wise Reports", description: "Tower assets, installation status, and tower-held value." },
  { id: "customer", title: "Customer-wise Reports", description: "Customer assets, deposits, purchases, and account status." },
  { id: "movement", title: "Device Movement Reports", description: "Asset movement, waste, repairs, and stock changes." },
  { id: "history", title: "Device History Reports", description: "Locked device history and audit records." },
  { id: "transfer", title: "Transfer Reports", description: "Central transfers between stock, towers, customers, repair, damaged, lost, and disposal." },
  { id: "inactive", title: "Inactive Customer Reports", description: "Inactive, disconnected, and pending collection customers." },
  { id: "deposit", title: "Security Deposit Reports", description: "Held, refunded, outstanding, deducted, and forfeited deposits." },
  { id: "main-stock", title: "Current Main Stock Reports", description: "Current asset quantity and value in Main Stock." },
];

const emptyFilters = {
  fromDate: "",
  toDate: "",
  supplier: "All",
  customer: "All",
  tower: "All",
  category: "All",
  asset: "All",
  status: "All",
  location: "All",
  responsibleUser: "All",
  referenceNumber: "",
};

const columnSets = {
  supplier: ["date", "supplier", "company", "phone", "status", "purchaseValue", "paidAmount", "remainingAmount", "referenceNumber"],
  purchase: ["date", "referenceNumber", "invoiceNumber", "supplier", "asset", "category", "quantity", "unitPrice", "totalAmount", "paidAmount", "remainingAmount", "status"],
  stock: ["assetId", "asset", "category", "tracking", "location", "status", "quantity", "unitPrice", "totalAmount"],
  tower: ["date", "tower", "location", "asset", "category", "quantity", "unitPrice", "totalAmount", "status", "responsibleUser"],
  customer: ["date", "customer", "asset", "category", "deal", "quantity", "depositAmount", "paidAmount", "status", "location"],
  movement: ["date", "referenceNumber", "movement", "asset", "category", "source", "destination", "quantity", "totalAmount", "status", "responsibleUser"],
  history: ["date", "referenceNumber", "transferType", "asset", "source", "destination", "quantity", "previousStatus", "newStatus", "responsibleUser"],
  transfer: ["date", "referenceNumber", "transferType", "source", "destination", "asset", "category", "quantity", "status", "responsibleUser", "receivedBy"],
  inactive: ["date", "customer", "phone", "status", "pendingDevices", "location", "note"],
  deposit: ["date", "referenceNumber", "customer", "asset", "depositAmount", "paidAmount", "refundAmount", "remainingAmount", "status", "responsibleUser"],
  "main-stock": ["assetId", "asset", "category", "tracking", "location", "status", "quantity", "unitPrice", "totalAmount"],
};

const labels = {
  date: "Date",
  supplier: "Supplier",
  company: "Company",
  phone: "Phone",
  status: "Status",
  purchaseValue: "Purchase Value",
  paidAmount: "Paid Amount",
  remainingAmount: "Remaining",
  referenceNumber: "Reference Number",
  invoiceNumber: "Invoice Number",
  asset: "Asset",
  assetId: "Asset ID",
  category: "Category",
  quantity: "Quantity",
  unitPrice: "Unit Price",
  totalAmount: "Total Amount",
  tracking: "Tracking",
  location: "Location",
  tower: "Tower",
  responsibleUser: "Responsible User",
  customer: "Customer",
  deal: "Deal",
  depositAmount: "Deposit Amount",
  movement: "Movement",
  source: "Source",
  destination: "Destination",
  transferType: "Transfer Type",
  previousStatus: "Previous Status",
  newStatus: "New Status",
  receivedBy: "Received By",
  refundAmount: "Refund Amount",
  pendingDevices: "Pending Devices",
  note: "Note",
};

function getAssetKey(asset) {
  return asset.assetId || asset.id || "";
}

function getAssetName(asset) {
  return [asset.assetId, asset.deviceName || asset.name].filter(Boolean).join(" - ") || "-";
}

function getTrackingLabel(asset) {
  return lower(asset.identityTracking).includes("individual") ? "Individual" : "Single Model";
}

function getDate(row) {
  return row.date || row.transferDate || row.createdAt || row.createdDate || "";
}

function inDateRange(row, filters) {
  const date = String(getDate(row)).slice(0, 10);
  if (filters.fromDate && (!date || date < filters.fromDate)) return false;
  if (filters.toDate && (!date || date > filters.toDate)) return false;
  return true;
}

function matchesChoice(value, filterValue) {
  return filterValue === "All" || lower(value) === lower(filterValue);
}

function uniqueOptions(values) {
  return ["All", ...Array.from(new Set(values.map(text).filter(Boolean))).sort((a, b) => a.localeCompare(b))];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function Reports() {
  const [activeReport, setActiveReport] = useState("supplier");
  const [filters, setFilters] = useState(emptyFilters);

  const [settings] = useJsonCollection("settings");
  const [assets] = useJsonCollection("assets");
  const [suppliers] = useJsonCollection("suppliers");
  const [supplierPurchases] = useJsonCollection("supplierPurchases");
  const [supplierPayments] = useJsonCollection("supplierPayments");
  const [assetMovements] = useJsonCollection("assetMovements");
  const [customers] = useJsonCollection("customers");
  const [towerAssets] = useJsonCollection("towerAssets");
  const [deviceTransfers] = useJsonCollection("deviceTransfers");
  const [deviceHistory] = useJsonCollection("deviceHistory");
  const [securityDeposits] = useJsonCollection("securityDeposits");
  const [disconnections] = useJsonCollection("disconnections");

  const company = settings[0] || {};
  const systemName = company.companyName || "ISP Assets";
  const logo = company.logo || "";

  const assetById = useMemo(() => {
    const map = new Map();
    assets.forEach((asset) => {
      map.set(String(asset.assetId || asset.id || ""), asset);
      map.set(String(asset.id || asset.assetId || ""), asset);
    });
    return map;
  }, [assets]);

  const rowsByReport = useMemo(() => {
    const purchasesFromMovements = assetMovements
      .filter((movement) => /purchase/i.test(`${movement.movementType || movement.movement || movement.type || ""}`))
      .map((movement) => {
        const asset = assetById.get(String(movement.assetId || movement.assetRecordId || ""));
        return {
          date: movement.date || movement.purchaseDate || movement.createdAt || "",
          referenceNumber: movement.referenceNumber || movement.purchaseCode || "-",
          invoiceNumber: movement.invoiceNumber || "-",
          supplier: movement.supplierName || "-",
          customer: "",
          tower: "",
          asset: asset ? getAssetName(asset) : movement.deviceName || movement.assetId || "-",
          assetId: movement.assetId || asset?.assetId || "",
          category: movement.category || asset?.category || "-",
          quantity: Number(movement.quantity || 0),
          unitPrice: Number(movement.unitPrice || 0),
          totalAmount: Number(movement.totalAmount || movement.amount || 0),
          paidAmount: Number(movement.paidAmount || 0),
          remainingAmount: Number(movement.remainingAmount || movement.remainAmount || 0),
          status: movement.paymentStatus || movement.status || "-",
          location: movement.destination || movement.location || "Main Stock",
          responsibleUser: movement.responsiblePerson || movement.purchasedBy || "",
        };
      });

    const directPurchases = supplierPurchases.map((purchase) => {
      const asset = assetById.get(String(purchase.assetId || purchase.assetRecordId || ""));
      return {
        date: purchase.purchaseDate || purchase.date || purchase.createdAt || "",
        referenceNumber: purchase.referenceNumber || purchase.purchaseCode || "-",
        invoiceNumber: purchase.invoiceNumber || "-",
        supplier: purchase.supplierName || purchase.supplier || "-",
        customer: "",
        tower: "",
        asset: asset ? getAssetName(asset) : purchase.deviceName || purchase.assetId || "-",
        assetId: purchase.assetId || asset?.assetId || "",
        category: purchase.category || asset?.category || "-",
        quantity: Number(purchase.quantity || 0),
        unitPrice: Number(purchase.unitPrice || 0),
        totalAmount: Number(purchase.totalPurchaseValue || purchase.totalAmount || purchase.amount || 0),
        paidAmount: Number(purchase.paidAmount || 0),
        remainingAmount: Number(purchase.remainAmount || purchase.remainingAmount || 0),
        status:
          Number(purchase.remainAmount || purchase.remainingAmount || 0) <= 0
            ? "Paid"
            : Number(purchase.paidAmount || 0) > 0
              ? "Partial"
              : "Unpaid",
        location: purchase.location || "Main Stock",
        responsibleUser: purchase.purchasedBy || "",
      };
    });

    const purchaseRows = [...purchasesFromMovements, ...directPurchases];

    const supplierRows = suppliers.map((supplier) => {
      const supplierPurchaseRows = purchaseRows.filter((row) => lower(row.supplier) === lower(supplier.supplierName));
      const payments = supplierPayments.filter((payment) => lower(payment.supplierName) === lower(supplier.supplierName));
      const purchaseValue = supplierPurchaseRows.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);
      const paidAmount =
        supplierPurchaseRows.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0) +
        payments.reduce((sum, row) => sum + Number(row.amount || 0), 0);

      return {
        date: supplier.createdAt || "",
        supplier: supplier.supplierName || "-",
        company: supplier.companyName || "-",
        phone: supplier.phone || "-",
        status: supplier.status || "-",
        purchaseValue,
        paidAmount,
        remainingAmount: Math.max(purchaseValue - paidAmount + Number(supplier.openingBalance || 0), 0),
        referenceNumber: supplier.taxNumber || "-",
        location: supplier.address || "",
      };
    });

    const stockRows = assets.map((asset) => ({
      date: asset.createdAt || asset.updatedAt || "",
      assetId: asset.assetId || "-",
      asset: getAssetName(asset),
      category: asset.category || "-",
      tracking: getTrackingLabel(asset),
      location: asset.location || "Main Stock",
      status: asset.status || "-",
      quantity: Number(asset.quantity || 0),
      unitPrice: Number(asset.unitPrice || 0),
      totalAmount: Number(asset.quantity || 0) * Number(asset.unitPrice || 0),
      responsibleUser: asset.responsiblePerson || "",
    }));

    const transferRows = deviceTransfers.map((transfer) => {
      const asset = assetById.get(String(transfer.assetId || transfer.assetRecordId || ""));
      return {
        date: transfer.transferDate || transfer.date || transfer.createdAt || "",
        referenceNumber: transfer.referenceNumber || transfer.transferId || "-",
        transferType: transfer.transferType || "-",
        source: transfer.sourceLocation || "-",
        destination: transfer.destinationLocation || "-",
        supplier: "",
        customer: transfer.destinationType === "Customer" ? transfer.destinationLocation : transfer.sourceType === "Customer" ? transfer.sourceLocation : "",
        tower: transfer.destinationType === "Tower" ? transfer.destinationLocation : transfer.sourceType === "Tower" ? transfer.sourceLocation : "",
        asset: asset ? getAssetName(asset) : [transfer.assetId, transfer.deviceName].filter(Boolean).join(" - ") || "-",
        assetId: transfer.assetId || "",
        category: transfer.category || asset?.category || "-",
        quantity: `${money(transfer.quantity)} ${transfer.unit || ""}`.trim(),
        status: transfer.approvalStatus || transfer.newStatus || "-",
        location: transfer.destinationLocation || "-",
        responsibleUser: transfer.responsibleUser || "",
        receivedBy: transfer.receivedBy || "-",
        totalAmount: Number(transfer.totalAmount || 0),
        paidAmount: Number(transfer.paidAmount || transfer.depositReceivedAmount || 0),
        remainingAmount: Number(transfer.remainingAmount || transfer.remainingDeposit || 0),
        depositAmount: Number(transfer.depositAmount || 0),
      };
    });

    const towerRows = towerAssets.flatMap((tower) => {
      const directRows = transferRows.filter((row) => lower(row.tower).includes(lower(tower.towerName)));
      if (directRows.length) {
        return directRows.map((row) => ({
          ...row,
          tower: tower.towerName || row.tower,
          location: tower.towerLocation || row.location,
          unitPrice: Number(assetById.get(String(row.assetId))?.unitPrice || 0),
          totalAmount:
            Number(String(row.quantity).replace(/[^0-9.]/g, "") || 0) *
            Number(assetById.get(String(row.assetId))?.unitPrice || 0),
        }));
      }

      return [{
        date: tower.issueDate || tower.createdAt || "",
        tower: tower.towerName || "-",
        location: tower.towerLocation || "-",
        asset: "-",
        category: "-",
        quantity: Number(tower.assetCount || 0),
        unitPrice: 0,
        totalAmount: Number(tower.installationCost || 0),
        status: tower.installationStatus || "-",
        responsibleUser: tower.responsiblePerson || "",
      }];
    });

    const customerRows = customers.flatMap((customer) => {
      const related = transferRows.filter((row) => lower(row.customer).includes(lower(customer.customerName)));
      if (related.length) {
        return related.map((row) => ({
          ...row,
          customer: customer.customerName || row.customer,
          deal: row.dealType || row.deal || "-",
          depositAmount: Number(row.depositAmount || 0),
        }));
      }

      return [{
        date: customer.registrationDate || customer.createdAt || "",
        customer: customer.customerName || "-",
        asset: "-",
        category: "-",
        deal: "-",
        quantity: 0,
        depositAmount: 0,
        paidAmount: 0,
        status: customer.status || "-",
        location: customer.address || "-",
        phone: customer.phone || "-",
      }];
    });

    const movementRows = [
      ...assetMovements.map((movement) => {
        const asset = assetById.get(String(movement.assetId || movement.assetRecordId || ""));
        return {
          date: movement.date || movement.createdAt || "",
          referenceNumber: movement.referenceNumber || movement.purchaseCode || "-",
          movement: movement.movement || movement.movementType || movement.type || "-",
          asset: asset ? getAssetName(asset) : movement.deviceName || movement.assetId || "-",
          assetId: movement.assetId || "",
          category: movement.category || asset?.category || "-",
          source: movement.source || "-",
          destination: movement.destination || movement.location || "-",
          quantity: Number(movement.quantity || 0),
          totalAmount: Number(movement.totalAmount || movement.amount || 0),
          status: movement.status || movement.paymentStatus || "-",
          location: movement.destination || movement.location || "",
          responsibleUser: movement.responsiblePerson || movement.purchasedBy || "",
        };
      }),
      ...transferRows.map((row) => ({
        ...row,
        movement: row.transferType,
      })),
    ];

    const historyRows = deviceHistory.map((history) => ({
      date: history.transferDate || history.date || history.createdAt || history.createdDate || "",
      referenceNumber: history.referenceNumber || history.transferId || "-",
      transferType: history.transferType || history.historyType || "-",
      asset: [history.assetId, history.deviceName].filter(Boolean).join(" - ") || "-",
      assetId: history.assetId || "",
      category: history.category || assetById.get(String(history.assetId))?.category || "-",
      source: history.sourceLocation || "-",
      destination: history.destinationLocation || "-",
      quantity: `${money(history.quantity)} ${history.unit || ""}`.trim(),
      previousStatus: history.previousStatus || "-",
      newStatus: history.newStatus || "-",
      status: history.newStatus || "-",
      location: history.destinationLocation || "-",
      responsibleUser: history.responsibleUser || "-",
    }));

    const inactiveRows = [
      ...customers
        .filter((customer) => /inactive|disabled|disconnected/i.test(`${customer.status || ""}`))
        .map((customer) => ({
          date: customer.updatedAt || customer.registrationDate || customer.createdAt || "",
          customer: customer.customerName || "-",
          phone: customer.phone || "-",
          status: customer.status || "-",
          pendingDevices: transferRows.filter((row) => lower(row.customer).includes(lower(customer.customerName))).length,
          location: customer.address || "-",
          note: customer.notes || "-",
        })),
      ...disconnections.map((record) => ({
        date: record.disconnectionDate || record.createdAt || "",
        customer: record.customerName || record.customerId || "-",
        phone: record.phone || "-",
        status: record.recoveryStatus || record.status || "Disconnected",
        pendingDevices: Array.isArray(record.pendingDevices) ? record.pendingDevices.length : Number(record.pendingDevices || 0),
        location: record.address || "-",
        note: record.notes || record.disconnectionReason || "-",
      })),
    ];

    const depositRows = [
      ...securityDeposits.map((deposit) => ({
        date: deposit.receivedDate || deposit.refundDate || deposit.date || deposit.createdAt || "",
        referenceNumber: deposit.receiptNumber || deposit.refundReference || deposit.referenceNumber || "-",
        customer: deposit.customerName || "-",
        asset: deposit.deviceName || deposit.assetId || "-",
        assetId: deposit.assetId || "",
        depositAmount: Number(deposit.amount || deposit.depositAmount || 0),
        paidAmount: Number(deposit.receivedAmount || deposit.paidAmount || 0),
        refundAmount: Number(deposit.refundAmount || 0),
        remainingAmount: Number(deposit.remainingDeposit || deposit.remainingAmount || 0),
        status: deposit.status || deposit.depositStatus || "-",
        location: deposit.location || "",
        responsibleUser: deposit.receivedBy || deposit.refundedBy || "",
      })),
      ...transferRows
        .filter((row) => Number(row.depositAmount || row.paidAmount || row.remainingAmount || 0) > 0)
        .map((row) => ({
          ...row,
          customer: row.customer || row.destination,
          refundAmount: 0,
          status: row.status || "-",
        })),
    ];

    return {
      supplier: supplierRows,
      purchase: purchaseRows,
      stock: stockRows,
      tower: towerRows,
      customer: customerRows,
      movement: movementRows,
      history: historyRows,
      transfer: transferRows,
      inactive: inactiveRows,
      deposit: depositRows,
      "main-stock": stockRows.filter((row) => Number(row.quantity || 0) > 0 && /main stock/i.test(`${row.location || "Main Stock"}`)),
    };
  }, [assetById, assetMovements, assets, customers, deviceHistory, deviceTransfers, disconnections, securityDeposits, supplierPayments, supplierPurchases, suppliers, towerAssets]);

  const allRows = rowsByReport[activeReport] || [];

  const filterOptions = useMemo(() => ({
    supplier: uniqueOptions([...suppliers.map((item) => item.supplierName), ...allRows.map((row) => row.supplier)]),
    customer: uniqueOptions([...customers.map((item) => item.customerName), ...allRows.map((row) => row.customer)]),
    tower: uniqueOptions([...towerAssets.map((item) => item.towerName), ...allRows.map((row) => row.tower)]),
    category: uniqueOptions([...assets.map((item) => item.category), ...allRows.map((row) => row.category)]),
    asset: uniqueOptions([...assets.map(getAssetName), ...allRows.map((row) => row.asset)]),
    status: uniqueOptions(allRows.map((row) => row.status || row.newStatus || row.previousStatus)),
    location: uniqueOptions(allRows.map((row) => row.location || row.source || row.destination)),
    responsibleUser: uniqueOptions(allRows.map((row) => row.responsibleUser)),
  }), [allRows, assets, customers, suppliers, towerAssets]);

  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      if (!inDateRange(row, filters)) return false;
      if (!matchesChoice(row.supplier, filters.supplier)) return false;
      if (!matchesChoice(row.customer, filters.customer)) return false;
      if (!matchesChoice(row.tower, filters.tower)) return false;
      if (!matchesChoice(row.category, filters.category)) return false;
      if (!matchesChoice(row.asset, filters.asset)) return false;
      if (!matchesChoice(row.status || row.newStatus || row.previousStatus, filters.status)) return false;
      if (!matchesChoice(row.location || row.source || row.destination, filters.location)) return false;
      if (!matchesChoice(row.responsibleUser, filters.responsibleUser)) return false;
      if (filters.referenceNumber && !lower(row.referenceNumber).includes(lower(filters.referenceNumber))) return false;
      return true;
    });
  }, [allRows, filters]);

  const columns = columnSets[activeReport] || [];
  const activeMeta = reportTypes.find((report) => report.id === activeReport) || reportTypes[0];

  const summary = useMemo(() => {
    const totalQuantity = filteredRows.reduce((sum, row) => sum + Number(String(row.quantity || 0).replace(/[^0-9.-]/g, "") || 0), 0);
    const totalAmount = filteredRows.reduce(
      (sum, row) =>
        sum +
        Number(row.totalAmount || row.purchaseValue || row.depositAmount || 0),
      0
    );
    const totalPaid = filteredRows.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0);
    const totalRemaining = filteredRows.reduce((sum, row) => sum + Number(row.remainingAmount || 0), 0);

    return { totalQuantity, totalAmount, totalPaid, totalRemaining };
  }, [filteredRows]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const resetFilters = () => setFilters(emptyFilters);

  const exportCsv = () => {
    const lines = [
      columns.map((column) => labels[column] || column).join(","),
      ...filteredRows.map((row) =>
        columns
          .map((column) => `"${String(row[column] ?? "").replaceAll('"', '""')}"`)
          .join(",")
      ),
    ];

    downloadFile(`${activeMeta.title}.csv`, lines.join("\n"), "text/csv;charset=utf-8");
  };

  const exportExcel = () => {
    const table = buildReportHtml({ printable: false });
    downloadFile(
      `${activeMeta.title}.xls`,
      `\ufeff${table}`,
      "application/vnd.ms-excel;charset=utf-8"
    );
  };

  const buildReportHtml = ({ printable }) => {
    const firstPageRows = filteredRows.slice(0, 10);
    const remainingRows = filteredRows.slice(10);
    const chunks = [];

    for (let index = 0; index < remainingRows.length; index += 20) {
      chunks.push(remainingRows.slice(index, index + 20));
    }

    const summaryCards = `
      <div class="print-summary">
        <div><span>Total Records</span><strong>${filteredRows.length}</strong></div>
        <div><span>Total Quantity</span><strong>${money(summary.totalQuantity)}</strong></div>
        <div><span>Total Amount</span><strong>${money(summary.totalAmount)} AFN</strong></div>
        <div><span>Total Paid</span><strong>${money(summary.totalPaid)} AFN</strong></div>
        <div><span>Total Remaining</span><strong>${money(summary.totalRemaining)} AFN</strong></div>
      </div>
    `;

    const renderTable = (rows) => `
      <table>
        <thead><tr>${columns.map((column) => `<th>${escapeHtml(labels[column] || column)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(row[column] ?? "-")}</td>`).join("")}</tr>`).join("")}
          ${!rows.length ? `<tr><td colspan="${columns.length}">No records found.</td></tr>` : ""}
        </tbody>
      </table>
    `;

    const pages = [
      `<section class="report-print-page first-page">${summaryCards}${renderTable(firstPageRows)}</section>`,
      ...chunks.map((chunk) => `<section class="report-print-page">${renderTable(chunk)}</section>`),
    ].join("");

    const logoHtml = logo ? `<img src="${escapeHtml(logo)}" alt="Logo" />` : `<span class="print-logo-letter">${escapeHtml(systemName.slice(0, 1))}</span>`;

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(activeMeta.title)}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; color: #111827; font-family: Arial, sans-serif; background: #f7f7f5; }
            .report-print-shell { padding: 22px; }
            .print-header { display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 14px; align-items: center; padding: 16px 18px; margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 14px; background: #fff; }
            .print-brand-left { display: flex; align-items: center; gap: 10px; font-weight: 800; }
            .print-brand-left img { width: 46px; height: 46px; object-fit: cover; border-radius: 12px; }
            .print-logo-letter { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 12px; background: #111827; color: #fff; font-size: 22px; font-weight: 900; }
            .print-title { text-align: center; }
            .print-title h1 { margin: 0; font-size: 22px; }
            .print-title p { margin: 6px 0 0; color: #64748b; font-size: 12px; }
            .print-system { text-align: right; font-size: 18px; font-weight: 900; }
            .print-summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 14px; }
            .print-summary div { padding: 12px; border: 1px solid #e5e7eb; border-radius: 12px; background: #f8fafc; }
            .print-summary span { display: block; color: #64748b; font-size: 11px; }
            .print-summary strong { display: block; margin-top: 5px; font-size: 16px; }
            .report-print-page { padding: 0 0 16px; margin-bottom: 18px; page-break-after: always; }
            table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e5e7eb; }
            th, td { border: 1px solid #e5e7eb; padding: 8px 9px; text-align: left; font-size: 11px; vertical-align: top; }
            th { background: #f3f4f6; color: #334155; font-size: 10px; text-transform: uppercase; }
            tr:nth-child(even) td { background: #fbfbfa; }
            @media print {
              body { background: #fff; }
              .report-print-shell { padding: 0; }
              .print-header { border-radius: 0; border-left: 0; border-right: 0; }
              .report-print-page { page-break-after: always; }
              * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <main class="report-print-shell">
            <header class="print-header">
              <div class="print-brand-left">${logoHtml}</div>
              <div class="print-title"><h1>${escapeHtml(activeMeta.title)}</h1><p>${escapeHtml(activeMeta.description)}</p></div>
              <div class="print-system">${escapeHtml(systemName)}</div>
            </header>
            ${pages}
          </main>
          ${printable ? "<script>window.onload = () => setTimeout(() => window.print(), 250);</script>" : ""}
        </body>
      </html>
    `;
  };

  const printReport = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;
    printWindow.document.write(buildReportHtml({ printable: true }));
    printWindow.document.close();
  };

  const exportPdf = () => {
    printReport();
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <span>Reporting</span>
          <h1>Reporting Center</h1>
          <p>Open a report tab, apply filters, then export to Excel, PDF, CSV, or Print.</p>
        </div>
      </div>

      <div className="report-tabs">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            type="button"
            className={activeReport === report.id ? "active" : ""}
            onClick={() => {
              setActiveReport(report.id);
              setFilters(emptyFilters);
            }}
          >
            {report.title}
          </button>
        ))}
      </div>

      <section className="report-workspace">
        <div className="report-workspace-header">
          <div>
            <h2>{activeMeta.title}</h2>
            <p>{activeMeta.description}</p>
          </div>

          <div className="report-export-actions">
            <button type="button" onClick={exportExcel}><FileSpreadsheet size={16} /> Excel</button>
            <button type="button" onClick={exportPdf}><FileText size={16} /> PDF</button>
            <button type="button" onClick={exportCsv}><Download size={16} /> CSV</button>
            <button type="button" onClick={printReport}><Printer size={16} /> Print</button>
          </div>
        </div>

        <div className="report-filters pro-report-filters">
          <label><span>From Date</span><input type="date" value={filters.fromDate} onChange={(event) => updateFilter("fromDate", event.target.value)} /></label>
          <label><span>To Date</span><input type="date" value={filters.toDate} onChange={(event) => updateFilter("toDate", event.target.value)} /></label>
          <label><span>Supplier</span><select value={filters.supplier} onChange={(event) => updateFilter("supplier", event.target.value)}>{filterOptions.supplier.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label><span>Customer</span><select value={filters.customer} onChange={(event) => updateFilter("customer", event.target.value)}>{filterOptions.customer.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label><span>Tower</span><select value={filters.tower} onChange={(event) => updateFilter("tower", event.target.value)}>{filterOptions.tower.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label><span>Asset Category</span><select value={filters.category} onChange={(event) => updateFilter("category", event.target.value)}>{filterOptions.category.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label><span>Asset</span><select value={filters.asset} onChange={(event) => updateFilter("asset", event.target.value)}>{filterOptions.asset.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label><span>Status</span><select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>{filterOptions.status.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label><span>Location</span><select value={filters.location} onChange={(event) => updateFilter("location", event.target.value)}>{filterOptions.location.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label><span>Responsible User</span><select value={filters.responsibleUser} onChange={(event) => updateFilter("responsibleUser", event.target.value)}>{filterOptions.responsibleUser.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label><span>Reference Number</span><input value={filters.referenceNumber} onChange={(event) => updateFilter("referenceNumber", event.target.value)} placeholder="Reference..." /></label>
          <div className="report-filter-buttons">
            <button type="button" onClick={resetFilters}>Reset Filters</button>
          </div>
        </div>

        <div className="report-summary-cards">
          <div><span>Total Records</span><strong>{filteredRows.length}</strong></div>
          <div><span>Total Quantity</span><strong>{money(summary.totalQuantity)}</strong></div>
          <div><span>Total Amount</span><strong>{money(summary.totalAmount)} AFN</strong></div>
          <div><span>Total Paid</span><strong>{money(summary.totalPaid)} AFN</strong></div>
          <div><span>Total Remaining</span><strong>{money(summary.totalRemaining)} AFN</strong></div>
        </div>

        <div className="report-table-shell">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{labels[column] || column}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredRows.slice(0, 100).map((row, index) => (
                <tr key={`${activeReport}-${index}`}>
                  {columns.map((column) => (
                    <td key={column}>{row[column] ?? "-"}</td>
                  ))}
                </tr>
              ))}

              {!filteredRows.length && (
                <tr>
                  <td colSpan={columns.length} className="report-empty">
                    No report records found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredRows.length > 100 && (
          <p className="report-preview-note">
            Showing first 100 records in preview. Export includes all {filteredRows.length} records.
          </p>
        )}
      </section>
    </div>
  );
}

export default Reports;
