export const customerStageOptions = [
  "None",
  "New Lead",
  "Contacted",
  "Documents Collected",
  "Application Submitted",
  "Under Review",
  "Approved",
  "Rejected",
  "Completed",
  "On Hold",
];

export const CUSTOM_STAGE_VALUE = "Custom Stage";

export function normalizeCustomerStage(value) {
  const stage = String(value || "").trim();
  return stage || "None";
}

export function stageLabel(value) {
  return normalizeCustomerStage(value);
}

export function resolveCustomerStage(selectedStage, customStage = "") {
  if (selectedStage === CUSTOM_STAGE_VALUE) {
    return normalizeCustomerStage(customStage);
  }
  return normalizeCustomerStage(selectedStage);
}

function actorIdOf(actor) {
  return String(actor?.id || actor?.accountId || actor?.employeeId || "");
}

function actorNameOf(actor) {
  return String(
    actor?.fullName ||
      actor?.username ||
      actor?.email ||
      actor?.name ||
      "System User"
  );
}

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `stage-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createCustomerStageHistoryRecord({
  customerId,
  customerName,
  fromStage,
  toStage,
  note = "",
  actor,
  now = new Date().toISOString(),
  id = makeId(),
}) {
  const date = new Date(now);
  const validDate = Number.isFinite(date.getTime()) ? date : new Date();

  return {
    id,
    customerId: String(customerId || ""),
    customerName: String(customerName || ""),
    fromStage: normalizeCustomerStage(fromStage),
    toStage: normalizeCustomerStage(toStage),
    note: String(note || "").trim(),
    changedById: actorIdOf(actor),
    changedByName: actorNameOf(actor),
    createdAt: validDate.toISOString(),
    date: new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kabul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(validDate),
    time: new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kabul",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(validDate),
  };
}

function normalizeStageList(values) {
  const seen = new Set();
  const out = [];
  for (const value of Array.isArray(values) ? values : []) {
    const stage = normalizeCustomerStage(value);
    const key = stage.toLocaleLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(stage);
    }
  }
  return out;
}

export function normalizeCustomerStageConfig(config) {
  return {
    id: String(config?.id || "global"),
    customStages: normalizeStageList(config?.customStages).filter((stage) => stage !== "None"),
    hiddenStages: normalizeStageList(config?.hiddenStages).filter((stage) => stage !== "None"),
  };
}

export function buildCustomerStageOptions(config) {
  const normalized = normalizeCustomerStageConfig(config);
  const hidden = new Set(normalized.hiddenStages.map((stage) => stage.toLocaleLowerCase()));
  const defaults = customerStageOptions.filter((stage) => !hidden.has(stage.toLocaleLowerCase()));
  return normalizeStageList([...defaults, ...normalized.customStages]);
}

export function addCustomerStageOption(config, value) {
  const normalized = normalizeCustomerStageConfig(config);
  const stage = normalizeCustomerStage(value);
  if (stage === "None") return normalized;

  const key = stage.toLocaleLowerCase();
  const customStages = normalizeStageList([...normalized.customStages, stage]);
  const hiddenStages = normalized.hiddenStages.filter((item) => item.toLocaleLowerCase() !== key);
  return { ...normalized, customStages, hiddenStages };
}

export function removeCustomerStageOption(config, value) {
  const normalized = normalizeCustomerStageConfig(config);
  const stage = normalizeCustomerStage(value);
  if (stage === "None") return normalized;

  const key = stage.toLocaleLowerCase();
  const isDefault = customerStageOptions.some((item) => item.toLocaleLowerCase() === key);
  const customStages = normalized.customStages.filter((item) => item.toLocaleLowerCase() !== key);
  const hiddenStages = isDefault
    ? normalizeStageList([...normalized.hiddenStages, stage])
    : normalized.hiddenStages;

  return { ...normalized, customStages, hiddenStages };
}

export function stageAfterHistoryDeletion(history, deletedRecord) {
  const deletedId = String(deletedRecord?.id || "");
  const remaining = (Array.isArray(history) ? history : [])
    .filter((record) => String(record?.id || "") !== deletedId)
    .slice()
    .sort((a, b) => {
      const aTime = new Date(a?.createdAt || 0).getTime();
      const bTime = new Date(b?.createdAt || 0).getTime();
      return bTime - aTime;
    });

  if (remaining.length) return normalizeCustomerStage(remaining[0]?.toStage);
  return normalizeCustomerStage(deletedRecord?.fromStage);
}
