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
  const entries = removedItems.map((record, index) => ({
    id: `local-recycle-${Date.now()}-${index}-${Math.random()
      .toString(36)
      .slice(2, 9)}`,
    sourceCollection: collection,
    sourceType,
    recycleStorage: "local",
    recordId: getRecordIdentity(record),
    recordLabel: getRecordLabel(record, collection),
    record,
    deletedAt,
  }));

  writeLocalRecycleBin([...readLocalRecycleBin(), ...entries]);
}
