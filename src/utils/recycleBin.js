export function getRecordIdentity(record) {
  const keys = [
    "id",
    "_id",
    "assetId",
    "customerId",
    "employeeId",
    "projectId",
    "transactionId",
    "transferId",
  ];

  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null) {
      return `${key}:${String(record[key])}`;
    }
  }

  return `data:${JSON.stringify(record)}`;
}

export function getRecordLabel(record, collection = "Record") {
  return String(
    record?.packageName ||
      record?.customerName ||
      record?.fullName ||
      record?.projectName ||
      record?.supplierName ||
      record?.name ||
      record?.title ||
      record?.assetId ||
      record?.id ||
      collection
  );
}

export function getCollectionLabel(value) {
  const labels = {
    customers: "Customer",
    employees: "Employee",
    employeeReports: "Daily Report",
    employeeAdjustments: "Employee Ledger",
    projects: "Project",
    projectSales: "Project Sale",
    projectLicenses: "Project License",
    transactions: "Finance Record",
    suppliers: "Supplier",
    supplierPurchases: "Supplier Purchase",
    assets: "Asset",
    towerAssets: "Tower Asset",
    officeAssets: "Office Asset",
    customerPackages: "Customer Package",
    securityDeposits: "Security Deposit",
    employeeAttendances: "Employee Attendance",
  };

  return (
    labels[value] ||
    String(value || "Record")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (letter) => letter.toUpperCase())
  );
}
