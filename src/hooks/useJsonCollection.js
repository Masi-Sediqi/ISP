import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { notify } from "../utils/notify";

const API_ROOT = "http://localhost:5000/api";

export function useJsonCollection(name) {
  const [items, setItemsState] = useState([]);
  const itemsRef = useRef(items);

  const load = useCallback(async () => {
    try {
      const response = await axios.get(`${API_ROOT}/${name}`);
      itemsRef.current = response.data;
      setItemsState(response.data);
    } catch (error) {
      console.error(`Unable to load ${name}:`, error);
    }
  }, [name]);

  useEffect(() => {
    load();
  }, [load]);

  const setItems = useCallback(async (nextValue) => {
    const nextItems = typeof nextValue === "function" ? nextValue(itemsRef.current) : nextValue;
    itemsRef.current = nextItems;
    setItemsState(nextItems);
    try {
      await axios.put(`${API_ROOT}/${name}`, nextItems);
    } catch (error) {
      console.error(`Unable to save ${name}:`, error);
      await load();
      notify("ذخیره اطلاعات انجام نشد. لطفاً سرور را بررسی کنید.", "error");
    }
  }, [load, name]);

  return [items, setItems, load];
}
