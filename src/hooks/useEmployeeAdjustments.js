import { useEffect, useRef } from "react";

import { useJsonCollection } from "./useJsonCollection";

const LOCAL_STORAGE_KEY =
  "isp-local-collection:employeeAdjustments";

const recordKey = (entry) =>
  String(
    entry?.id ||
      [
        entry?.employeeId,
        entry?.employeeAccountId,
        entry?.employeeName,
        entry?.type,
        entry?.amount,
        entry?.createdAt,
      ]
        .filter(Boolean)
        .join("|")
  );

export function useEmployeeAdjustments(options = {}) {
  const collection = useJsonCollection(
    "employeeAdjustments",
    options
  );
  const [items, setItems, , loaded] = collection;
  const migratedRef = useRef(false);

  useEffect(() => {
    if (
      !loaded ||
      migratedRef.current ||
      typeof window === "undefined"
    ) {
      return undefined;
    }

    migratedRef.current = true;
    let cancelled = false;

    const migrateLocalLedger = async () => {
      let localItems = [];

      try {
        const parsed = JSON.parse(
          localStorage.getItem(LOCAL_STORAGE_KEY) ||
            "[]"
        );

        localItems = Array.isArray(parsed)
          ? parsed
          : [];
      } catch {
        localItems = [];
      }

      if (!localItems.length || cancelled) {
        return;
      }

      const existingKeys = new Set(
        items.map(recordKey)
      );
      const nextKeys = new Set(existingKeys);
      const missingItems = [];

      localItems.forEach((entry) => {
        const key = recordKey(entry);

        if (!key || nextKeys.has(key)) {
          return;
        }

        nextKeys.add(key);
        missingItems.push(entry);
      });

      if (!missingItems.length || cancelled) {
        return;
      }

      const saved = await setItems([
        ...items,
        ...missingItems,
      ]);

      if (saved && !cancelled) {
        window.dispatchEvent(
          new CustomEvent(
            "isp-employee-ledger-updated",
            {
              detail: {
                migrated: missingItems.length,
              },
            }
          )
        );
      }
    };

    migrateLocalLedger();

    return () => {
      cancelled = true;
    };
  }, [items, loaded, setItems]);

  return collection;
}
