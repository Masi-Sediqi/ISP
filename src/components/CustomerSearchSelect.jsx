import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { customerDisplayName, filterCustomers } from "../utils/projectSalesLogic";
import "./CustomerSearchSelect.css";

export default function CustomerSearchSelect({ customers = [], value = "", onChange, placeholder = "Search customer..." }) {
  const selected = customers.find((item) => String(item.id || item.customerId || "") === String(value || ""));
  const [query, setQuery] = useState(selected ? customerDisplayName(selected) : "");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const next = selected ? customerDisplayName(selected) : "";
    setQuery(next);
  }, [value, selected]);

  useEffect(() => {
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const results = useMemo(() => filterCustomers(customers, query), [customers, query]);

  function choose(customer) {
    const id = customer.id || customer.customerId || "";
    setQuery(customerDisplayName(customer));
    setOpen(false);
    onChange?.(id, customer);
  }

  function handleInput(event) {
    const next = event.target.value;
    setQuery(next);
    setOpen(true);
    if (!next.trim() && value) onChange?.("", null);
  }

  return (
    <div className="customer-search-select" ref={rootRef}>
      <div className="customer-search-input-wrap">
        <Search size={15} />
        <input
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
      {open && (
        <div className="customer-search-dropdown">
          {results.length ? results.map((customer) => {
            const id = customer.id || customer.customerId || customer.phone || customerDisplayName(customer);
            return (
              <button type="button" key={id} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(customer)}>
                <strong>{customerDisplayName(customer)}</strong>
                <small>{[customer.phone || customer.customerPhone, customer.customerId].filter(Boolean).join(" • ") || "Customer"}</small>
              </button>
            );
          }) : <div className="customer-search-empty">No customer found</div>}
        </div>
      )}
    </div>
  );
}
