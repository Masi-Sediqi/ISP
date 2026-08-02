import { useCallback, useEffect, useState } from "react";
import { notify } from "../utils/notify";

const prefix = "isp-local-collection:";

function read(name) {
  try {
    const value = JSON.parse(localStorage.getItem(`${prefix}${name}`) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function useLocalCollection(name) {
  const [items, setItemsState] = useState(() => read(name));

  useEffect(() => {
    const reload = () => setItemsState(read(name));
    window.addEventListener(`isp-local:${name}`, reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener(`isp-local:${name}`, reload);
      window.removeEventListener("storage", reload);
    };
  }, [name]);

  const setItems = useCallback(async (nextValue) => {
    try {
      const current = read(name);
      const next = typeof nextValue === "function" ? nextValue(current) : nextValue;
      if (!Array.isArray(next)) return false;
      localStorage.setItem(`${prefix}${name}`, JSON.stringify(next));
      setItemsState(next);
      window.dispatchEvent(new Event(`isp-local:${name}`));
      return true;
    } catch {
      notify(`Unable to save ${name}.`, "error");
      return false;
    }
  }, [name]);

  return [items, setItems];
}
