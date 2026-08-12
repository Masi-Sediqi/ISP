export const LOCAL_COLLECTION_PREFIX = "isp-local-collection:";
export const LOCAL_RECYCLE_BIN_KEY = "isp-local-recycle-bin";

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

function readCurrentUserSnapshot() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem("isp-current-user") || "null"
    );

    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function currentUserName(user) {
  return (
    user?.fullName ||
    user?.employeeName ||
    user?.username ||
    user?.email ||
    "Unknown user"
  );
}

export function readLocalRecycleBin() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(LOCAL_RECYCLE_BIN_KEY) || "[]"
    );

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalRecycleBin(items) {
  localStorage.setItem(LOCAL_RECYCLE_BIN_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("isp-local-recycle-bin-updated"));
}

export function archiveLocalRemovedRecords(
  collection,
  previousItems,
  nextItems,
  sourceType = "local"
) {
  const remainingIdentities = new Set(nextItems.map(getRecordIdentity));
  const removedItems = previousItems.filter(
    (item) => !remainingIdentities.has(getRecordIdentity(item))
  );

  if (!removedItems.length) return;

  const deletedAt = new Date().toISOString();
  const currentUser = readCurrentUserSnapshot();
  const recordType = getCollectionLabel(collection);
  const entries = removedItems.map((record, index) => ({
    id: `local-recycle-${Date.now()}-${index}-${Math.random()
      .toString(36)
      .slice(2, 9)}`,
    sourceCollection: collection,
    sourceCollectionLabel: recordType,
    recordType,
    sourceType,
    recycleStorage: "local",
    recordId: getRecordIdentity(record),
    recordLabel: getRecordLabel(record, collection),
    record,
    deletedAt,
    deletedByAccountId:
      currentUser?.id ||
      localStorage.getItem("isp-system-session") ||
      "",
    deletedByEmployeeId: currentUser?.employeeId || "",
    deletedByName: currentUserName(currentUser),
    deletedByEmail: currentUser?.email || "",
    deletedByRole:
      currentUser?.primaryRole ||
      currentUser?.role ||
      currentUser?.accountType ||
      "",
  }));

  writeLocalRecycleBin([...readLocalRecycleBin(), ...entries]);
}
