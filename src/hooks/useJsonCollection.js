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
let lastServerErrorNotificationAt = 0;

function notifyServerError(message) {
  const now = Date.now();

  if (now - lastServerErrorNotificationAt < SERVER_ERROR_NOTIFICATION_COOLDOWN_MS) {
    return;
  }

  lastServerErrorNotificationAt = now;
  notify(message, "error");
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
