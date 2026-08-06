import { useEffect, useMemo, useState } from "react";
import {
  Edit3,
  Eye,
  PackagePlus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useJsonCollection } from "../hooks/useJsonCollection";
import { useLocalCollection } from "../hooks/useLocalCollection";
import { createRecordId } from "../utils/ids";
import { notify } from "../utils/notify";
import "./TechnologyPackages.css";


const currencyOptions = [
  { code: "AFN", label: "AFN - افغانی" },
  { code: "USD", label: "USD - US Dollar" },
  { code: "EUR", label: "EUR - Euro" },
  { code: "GBP", label: "GBP - British Pound" },
  { code: "AED", label: "AED - UAE Dirham" },
  { code: "SAR", label: "SAR - Saudi Riyal" },
  { code: "TRY", label: "TRY - Turkish Lira" },
  { code: "PKR", label: "PKR - Pakistani Rupee" },
  { code: "INR", label: "INR - Indian Rupee" },
  { code: "IRR", label: "IRR - Iranian Rial" },
  { code: "CAD", label: "CAD - Canadian Dollar" },
  { code: "AUD", label: "AUD - Australian Dollar" },
  { code: "RUB", label: "RUB - Russian Ruble" },
  { code: "CNY", label: "CNY - Chinese Yuan" },
];

const emptyForm = {
  packageName: "",
  currency: "AFN",
  sellingPrice: "",
  note: "",
};

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

const money = (value, currency = "AFN") =>
  `${Number(value || 0).toLocaleString("en-US")} ${
    currency || "AFN"
  }`;

const totalsByCurrency = (items, fieldName) => {
  const totals = items.reduce((result, item) => {
    const currency = item.currency || "AFN";

    result[currency] =
      (result[currency] || 0) +
      Number(item[fieldName] || 0);

    return result;
  }, {});

  const entries = Object.entries(totals);

  if (!entries.length) return "0 AFN";

  return entries
    .map(([currency, amount]) =>
      money(amount, currency)
    )
    .join(" • ");
};

export default function TechnologyPackages() {
  const [
    packages,
    setPackages,
    ,
    packagesLoaded,
  ] = useJsonCollection("technologyPackages");

  const [
    legacyLocalPackages,
    setLegacyLocalPackages,
  ] = useLocalCollection("technologyPackages");

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!packagesLoaded || !legacyLocalPackages.length) {
      return;
    }

    const merged = [...packages];

    legacyLocalPackages.forEach((localItem) => {
      const exists = merged.some(
        (serverItem) =>
          String(serverItem.id) === String(localItem.id)
      );

      if (!exists) merged.push(localItem);
    });

    if (merged.length === packages.length) {
      setLegacyLocalPackages([]);
      return;
    }

    Promise.resolve(setPackages(merged)).then((saved) => {
      if (saved !== false) {
        setLegacyLocalPackages([]);
      }
    });
  }, [
    legacyLocalPackages,
    packages,
    packagesLoaded,
    setLegacyLocalPackages,
    setPackages,
  ]);

  const filteredPackages = useMemo(() => {
    const query = normalize(search);

    return packages
      .filter((item) => {
        if (!query) return true;

        return [
          item.packageName,
          item.sellingPrice,
          item.currency,
          item.note,
        ].some((value) =>
          normalize(value).includes(query)
        );
      })
      .sort(
        (first, second) =>
          new Date(second.updatedAt || second.createdAt || 0) -
          new Date(first.updatedAt || first.createdAt || 0)
      );
  }, [packages, search]);

  const summary = useMemo(() => ({
    total: packages.length,
    totalSellingLabel: totalsByCurrency(
      packages,
      "sellingPrice"
    ),
  }), [packages]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      packageName: item.packageName || "",
      currency: item.currency || "AFN",
      sellingPrice: String(item.sellingPrice ?? ""),
      note: item.note || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const savePackage = async (event) => {
    event.preventDefault();

    const packageName = form.packageName.trim();
    const sellingPrice = Number(form.sellingPrice);

    if (!packageName) {
      notify("Package name is required.", "error");
      return;
    }

    if (!(sellingPrice >= 0)) {
      notify("Enter a valid selling price.", "error");
      return;
    }

    const now = new Date().toISOString();

    const currentRecord = packages.find(
      (item) => String(item.id) === String(editingId)
    );

    const record = {
      id: editingId || createRecordId(),
      packageName,
      currency: form.currency || "AFN",
      sellingPrice,
      note: form.note.trim(),
      status: "Active",
      createdAt: currentRecord?.createdAt || now,
      updatedAt: now,
    };

    const nextPackages = editingId
      ? packages.map((item) =>
          String(item.id) === String(editingId)
            ? record
            : item
        )
      : [...packages, record];

    const saved = await Promise.resolve(
      setPackages(nextPackages)
    );

    if (saved === false) return;

    notify(
      editingId
        ? "Technology package updated."
        : "Technology package created.",
      "success"
    );

    closeModal();
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;

    const nextPackages = packages.filter(
      (item) =>
        String(item.id) !== String(deleteItem.id)
    );

    const saved = await Promise.resolve(
      setPackages(nextPackages)
    );

    if (saved === false) return;

    notify("Technology package deleted.", "success");
    setDeleteItem(null);
  };

  if (!packagesLoaded) {
    return (
      <div className="page-loading">
        Loading technology packages...
      </div>
    );
  }

  return (
    <div className="technology-packages-page">
      <header className="technology-packages-header">
        <div>
          <span>PACKAGE MANAGEMENT</span>
          <h1>Technology Packages</h1>
          <p>
            Create and manage technology package names,
            selling prices, and notes.
          </p>
        </div>

        <button
          type="button"
          className="technology-package-primary-btn"
          onClick={openCreate}
        >
          <PackagePlus size={17} />
          Add Technology Package
        </button>
      </header>

      <section className="technology-package-stats">
        <article>
          <span>Total Packages</span>
          <strong>{summary.total}</strong>
          <p>Registered technology packages</p>
        </article>

        <article>
          <span>Total Selling Value</span>
          <strong>{summary.totalSellingLabel}</strong>
          <p>Combined selling price</p>
        </article>

        <article>
          <span>Average Price</span>
          <strong>{money(summary.averagePrice)}</strong>
          <p>Average package selling price</p>
        </article>
      </section>

      <section className="technology-package-table-card">
        <header>
          <div>
            <h2>Technology Package List</h2>
            <p>{filteredPackages.length} package records</p>
          </div>

          <label className="technology-package-search">
            <Search size={16} />
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search package or note..."
            />
          </label>
        </header>

        <div className="technology-package-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Package Name</th>
                <th>Unit</th>
                <th>Selling Price</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPackages.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.packageName}</strong>
                  </td>

                  <td>
                    <span className="technology-package-currency">
                      {item.currency || "AFN"}
                    </span>
                  </td>

                  <td className="technology-package-price">
                    {money(item.sellingPrice, item.currency)}
                  </td>

                  <td>
                    <span className="technology-package-note">
                      {item.note || "No note"}
                    </span>
                  </td>

                  <td>
                    <div className="technology-package-actions">
                      <button
                        type="button"
                        title="View"
                        onClick={() => setDetailsItem(item)}
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
                        title="Edit"
                        onClick={() => openEdit(item)}
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        className="delete"
                        title="Delete"
                        onClick={() => setDeleteItem(item)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredPackages.length && (
                <tr>
                  <td
                    colSpan="5"
                    className="technology-package-empty"
                  >
                    No technology packages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div
          className="technology-package-modal-backdrop"
          onMouseDown={closeModal}
        >
          <form
            className="technology-package-modal"
            onSubmit={savePackage}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header>
              <div>
                <h2>
                  {editingId
                    ? "Edit Technology Package"
                    : "Add Technology Package"}
                </h2>
                <p>
                  Complete the three package fields below.
                </p>
              </div>

              <button
                type="button"
                className="technology-package-close-btn"
                onClick={closeModal}
              >
                <X size={19} />
              </button>
            </header>

            <div className="technology-package-form">
              <label>
                <span>Package Name</span>
                <input
                  name="packageName"
                  value={form.packageName}
                  onChange={updateField}
                  placeholder="Enter package name"
                  autoFocus
                />
              </label>

              <label>
                <span>Unit</span>

                <select
                  name="currency"
                  value={form.currency}
                  onChange={updateField}
                >
                  {currencyOptions.map((item) => (
                    <option
                      key={item.code}
                      value={item.code}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Selling Price ({form.currency})</span>
                <input
                  type="number"
                  min="0"
                  name="sellingPrice"
                  value={form.sellingPrice}
                  onChange={updateField}
                  placeholder="0"
                />
              </label>

              <label>
                <span>Note</span>
                <textarea
                  name="note"
                  rows="5"
                  value={form.note}
                  onChange={updateField}
                  placeholder="Write package notes..."
                />
              </label>
            </div>

            <footer>
              <button
                type="button"
                onClick={closeModal}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary"
              >
                {editingId
                  ? "Update Package"
                  : "Save Package"}
              </button>
            </footer>
          </form>
        </div>
      )}

      {detailsItem && (
        <div
          className="technology-package-modal-backdrop"
          onMouseDown={() => setDetailsItem(null)}
        >
          <section
            className="technology-package-details-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header>
              <div>
                <h2>{detailsItem.packageName}</h2>
                <p>Technology package information.</p>
              </div>

              <button
                type="button"
                className="technology-package-close-btn"
                onClick={() => setDetailsItem(null)}
              >
                <X size={19} />
              </button>
            </header>

            <div className="technology-package-details-grid">
              <div>
                <span>Package Name</span>
                <strong>{detailsItem.packageName}</strong>
              </div>

              <div>
                <span>Unit</span>
                <strong>
                  {detailsItem.currency || "AFN"}
                </strong>
              </div>

              <div>
                <span>Selling Price</span>
                <strong>
                  {money(detailsItem.sellingPrice)}
                </strong>
              </div>
            </div>

            <div className="technology-package-note-box">
              <span>Note</span>
              <p>{detailsItem.note || "No note"}</p>
            </div>

            <footer>
              <button
                type="button"
                onClick={() => {
                  setDetailsItem(null);
                  openEdit(detailsItem);
                }}
              >
                <Edit3 size={15} />
                Edit Package
              </button>
            </footer>
          </section>
        </div>
      )}

      {deleteItem && (
        <div
          className="technology-package-modal-backdrop"
          onMouseDown={() => setDeleteItem(null)}
        >
          <section
            className="technology-package-delete-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div>
              <Trash2 size={24} />
            </div>

            <h2>Delete Technology Package?</h2>

            <p>
              This will permanently delete{" "}
              <strong>{deleteItem.packageName}</strong>.
            </p>

            <footer>
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}