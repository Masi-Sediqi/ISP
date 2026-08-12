import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";

import { notify } from "../utils/notify";
import { apiUrl } from "../utils/api";
import {
  archiveLocalRemovedRecords,
  getRecordIdentity,
} from "../utils/recycleBin";

const DISABLED_COLLECTIONS = new Set();
const SERVER_ERROR_NOTIFICATION_COOLDOWN_MS = 10000;
const ACTIVITY_COLLECTION = "employeeActivities";
const ACTIVITY_IGNORED_COLLECTIONS = new Set([
  ACTIVITY_COLLECTION,
  "employeeReports",
  "recycleBin",
]);
let lastServerErrorNotificationAt = 0;

function notifyServerError(message) {
  const now = Date.now();

  if (now - lastServerErrorNotificationAt < SERVER_ERROR_NOTIFICATION_COOLDOWN_MS) {
    return;
  }

  lastServerErrorNotificationAt = now;
  notify(message, "error");
}

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

function itemKey(item) {
  return String(
    item?.id ||
      item?._id ||
      item?.customerId ||
      item?.assetId ||
      item?.invoiceNumber ||
      item?.billNumber ||
      item?.createdAt ||
      ""
  );
}

function isFullAdminAccount(account) {
  const roles = [
    account?.role,
    account?.primaryRole,
    ...(Array.isArray(account?.roles) ? account.roles : []),
  ]
    .filter(Boolean)
    .map(normalize);

  return (
    account?.isDefaultAdmin === true ||
    account?.isFullAdmin === true ||
    account?.permissions?.all === true ||
    roles.some((role) =>
      ["full admin", "administrator", "admin"].includes(role)
    )
  );
}

function actorName(account) {
  return (
    account?.fullName ||
    account?.employeeName ||
    account?.username ||
    account?.email ||
    "Employee"
  );
}

function detectCollectionChange(previousItems, nextItems) {
  const previousByKey = new Map(
    previousItems.map((item) => [itemKey(item), item])
  );

  const nextByKey = new Map(
    nextItems.map((item) => [itemKey(item), item])
  );

  let createdCount = 0;
  let updatedCount = 0;
  let deletedCount = 0;
  const createdIds = [];
  const updatedIds = [];
  const deletedIds = [];

  nextByKey.forEach((item, key) => {
    const previous = previousByKey.get(key);

    if (!previous) {
      createdCount += 1;
      createdIds.push(key);
      return;
    }

    if (JSON.stringify(previous) !== JSON.stringify(item)) {
      updatedCount += 1;
      updatedIds.push(key);
    }
  });

  previousByKey.forEach((_, key) => {
    if (!nextByKey.has(key)) {
      deletedCount += 1;
      deletedIds.push(key);
    }
  });

  const action =
    createdCount && !updatedCount && !deletedCount
      ? "created"
      : updatedCount && !createdCount && !deletedCount
        ? "updated"
        : deletedCount && !createdCount && !updatedCount
          ? "deleted"
          : "changed";

  return {
    action,
    createdCount,
    updatedCount,
    deletedCount,
    createdIds,
    updatedIds,
    deletedIds,
    changedIds: [
      ...createdIds,
      ...updatedIds,
      ...deletedIds,
    ],
    totalChanged:
      createdCount + updatedCount + deletedCount,
  };
}

async function recordEmployeeActivity(
  collectionName,
  previousItems,
  nextItems
) {
  if (ACTIVITY_IGNORED_COLLECTIONS.has(collectionName)) {
    return;
  }

  const sessionId =
    localStorage.getItem("isp-system-session");

  if (!sessionId) return;

  const change = detectCollectionChange(
    previousItems,
    nextItems
  );

  if (!change.totalChanged) return;

  try {
    const accountsResponse = await axios.get(
      apiUrl("accounts")
    );

    const accounts = Array.isArray(accountsResponse.data)
      ? accountsResponse.data
      : [];

    const actor = accounts.find(
      (account) =>
        String(account.id) === String(sessionId)
    );

    if (!actor || isFullAdminAccount(actor)) {
      return;
    }

    const activitiesResponse = await axios.get(
      apiUrl(ACTIVITY_COLLECTION)
    );

    const activities = Array.isArray(
      activitiesResponse.data
    )
      ? activitiesResponse.data
      : [];

    const now = new Date().toISOString();

    const record = {
      id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      type: "employee-action",
      collection: collectionName,
      action: change.action,
      createdCount: change.createdCount,
      updatedCount: change.updatedCount,
      deletedCount: change.deletedCount,
      createdIds: change.createdIds,
      updatedIds: change.updatedIds,
      deletedIds: change.deletedIds,
      changedIds: change.changedIds,
      primaryRecordId:
        change.changedIds?.[0] || "",
      totalChanged: change.totalChanged,
      actorId: actor.id,
      actorEmployeeId: actor.employeeId || "",
      actorName: actorName(actor),
      actorEmail: actor.email || "",
      actorRole:
        actor.primaryRole ||
        actor.role ||
        "Employee",
      adminNotificationType: "employee-action",
      adminNotificationAt: now,
      adminNotificationSound: false,
      createdAt: now,
    };

    await axios.put(apiUrl(ACTIVITY_COLLECTION), [
      ...activities,
      record,
    ]);

    window.dispatchEvent(
      new CustomEvent("isp-employee-activity-updated", {
        detail: record,
      })
    );
  } catch (error) {
    console.warn(
      "Unable to record employee activity:",
      error
    );
  }
}

export function useJsonCollection(name, options = {}) {
  const silentLoadErrors = options.silentLoadErrors === true;
  const disabled =
    DISABLED_COLLECTIONS.has(name);

  const [items, setItemsState] =
    useState([]);

  const [loaded, setLoaded] =
    useState(disabled);

  const itemsRef = useRef([]);

  const load = useCallback(async () => {
    if (disabled) {
      itemsRef.current = [];
      setItemsState([]);
      setLoaded(true);

      return [];
    }

    try {
      const response = await axios.get(
        apiUrl(name)
      );

      const data = Array.isArray(
        response.data
      )
        ? response.data
        : [];

      itemsRef.current = data;
      setItemsState(data);
      setLoaded(true);

      return data;
    } catch (error) {
      console.error(
        `Unable to load ${name}:`,
        error
      );

      itemsRef.current = [];
      setItemsState([]);
      setLoaded(true);

      if (!silentLoadErrors) {
        notifyServerError("Unable to load data. Please check the server connection.");
      }

      return [];
    }
  }, [disabled, name, silentLoadErrors]);

  useEffect(() => {
    load();
  }, [load]);

  const setItems = useCallback(
    async (nextValue) => {
      if (disabled) {
        return false;
      }

      const previousItems =
        itemsRef.current;

      const nextItems =
        typeof nextValue === "function"
          ? nextValue(previousItems)
          : nextValue;

      if (!Array.isArray(nextItems)) {
        notify(
          `Invalid data format for ${name}.`,
          "error"
        );

        return false;
      }

      itemsRef.current = nextItems;
      setItemsState(nextItems);

      try {
        if (name !== "recycleBin") {
          const nextIdentities = new Set(
            nextItems.map(getRecordIdentity)
          );
          const hasRemovedItems = previousItems.some(
            (item) => !nextIdentities.has(getRecordIdentity(item))
          );

          if (hasRemovedItems) {
            try {
              await axios.get(apiUrl("recycleBin"));
            } catch {
              archiveLocalRemovedRecords(
                name,
                previousItems,
                nextItems,
                "server-fallback"
              );
            }
          }
        }

        const response = await axios.put(
          apiUrl(name),
          nextItems
        );

        const savedData = Array.isArray(
          response.data
        )
          ? response.data
          : nextItems;

        itemsRef.current = savedData;
        setItemsState(savedData);

        recordEmployeeActivity(
          name,
          previousItems,
          savedData
        );

        return true;
      } catch (error) {
        console.error(
          `Unable to save ${name}:`,
          error
        );

        itemsRef.current =
          previousItems;

        setItemsState(previousItems);

        notifyServerError("Unable to save data. Please check the server connection.");

        return false;
      }
    },
    [disabled, name]
  );

  return [
    items,
    setItems,
    load,
    loaded,
  ];
}
