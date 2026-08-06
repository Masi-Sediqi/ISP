import { useEffect, useMemo, useRef, useState } from "react";
import {
  Edit3,
  Eye,
  PackagePlus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useJsonCollection } from "../hooks/useJsonCollection";
import { useLocalCollection } from "../hooks/useLocalCollection";
import { createRecordId } from "../utils/ids";
import { notify } from "../utils/notify";
import "./MediaPackages.css";

const countries = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Cote d'Ivoire",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkiye",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe"
];

const normalizeCountryName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();

const countryNameAliases = {
  bolivia: "BO",
  brunei: "BN",
  caboverde: "CV",
  congo: "CG",
  democraticrepublicofthecongo: "CD",
  cotedivoire: "CI",
  czechia: "CZ",
  eswatini: "SZ",
  iran: "IR",
  laos: "LA",
  micronesia: "FM",
  moldova: "MD",
  northkorea: "KP",
  palestine: "PS",
  russia: "RU",
  southkorea: "KR",
  syria: "SY",
  taiwan: "TW",
  tanzania: "TZ",
  turkiye: "TR",
  turkey: "TR",
  unitedstates: "US",
  vaticancity: "VA",
  venezuela: "VE",
  vietnam: "VN",
};

function buildCountryCodeMap() {
  const map = new Map();

  if (
    typeof Intl === "undefined" ||
    typeof Intl.DisplayNames !== "function"
  ) {
    return map;
  }

  const displayNames = new Intl.DisplayNames(
    ["en"],
    { type: "region" }
  );

  for (let first = 65; first <= 90; first += 1) {
    for (let second = 65; second <= 90; second += 1) {
      const code =
        String.fromCharCode(first) +
        String.fromCharCode(second);

      const countryName = displayNames.of(code);

      if (countryName && countryName !== code) {
        map.set(
          normalizeCountryName(countryName),
          code
        );
      }
    }
  }

  return map;
}

const countryCodeMap = buildCountryCodeMap();

function getCountryCode(countryName) {
  const normalized =
    normalizeCountryName(countryName);

  return (
    countryNameAliases[normalized] ||
    countryCodeMap.get(normalized) ||
    ""
  );
}

function getCountryFlagUrl(countryName) {
  const code = getCountryCode(countryName);

  if (!code) return "";

  return `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;
}

function MediaCountrySelect({
  value,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      closeOnOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        closeOnOutsideClick
      );
    };
  }, []);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return countries;

    return countries.filter((country) =>
      country.toLowerCase().includes(query)
    );
  }, [search]);

  const chooseCountry = (country) => {
    onChange({
      target: {
        name: "country",
        value: country,
      },
    });

    setSearch("");
    setOpen(false);
  };

  return (
    <div
      className={`media-country-select ${
        open ? "open" : ""
      }`}
      ref={wrapperRef}
    >
      <button
        type="button"
        className="media-country-trigger"
        onClick={() =>
          setOpen((current) => !current)
        }
      >
        {value ? (
          <span className="media-country-selected">
            <img
              className="media-country-flag-image"
              src={getCountryFlagUrl(value)}
              alt=""
            />

            <span>{value}</span>
          </span>
        ) : (
          <span className="media-country-placeholder">
            Select country
          </span>
        )}

        <span className="media-country-arrow">▾</span>
      </button>

      {open && (
        <div className="media-country-menu">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search country..."
            autoFocus
          />

          <div className="media-country-options">
            {filteredCountries.map((country) => (
              <button
                type="button"
                key={country}
                className={
                  value === country
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  chooseCountry(country)
                }
              >
                <img
                  className="media-country-flag-image"
                  src={getCountryFlagUrl(country)}
                  alt=""
                />

                <span>{country}</span>
              </button>
            ))}

            {!filteredCountries.length && (
              <p>No country found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


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
  country: "",
  category: "",
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

export default function MediaPackages() {
  const [
    packages,
    setPackages,
    ,
    packagesLoaded,
  ] = useJsonCollection("mediaPackages");

  const [
    legacyLocalPackages,
    setLegacyLocalPackages,
  ] = useLocalCollection("mediaPackages");

  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [newCategory, setNewCategory] = useState("");
  const [categoryCreatorOpen, setCategoryCreatorOpen] =
    useState(false);

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
          item.country,
          item.category,
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
    averagePriceLabel:
      packages.length
        ? totalsByCurrency(
            packages.map((item) => ({
              ...item,
              averageValue:
                Number(item.sellingPrice || 0) /
                packages.filter(
                  (row) =>
                    (row.currency || "AFN") ===
                    (item.currency || "AFN")
                ).length,
            })),
            "averageValue"
          )
        : "0 AFN",
  }), [packages]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setNewCategory("");
    setCategoryCreatorOpen(false);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      packageName: item.packageName || "",
      country: item.country || "",
      category: item.category || "",
      currency: item.currency || "AFN",
      sellingPrice: String(item.sellingPrice ?? ""),
      note: item.note || "",
    });

    if (
      item.category &&
      !categories.includes(item.category)
    ) {
      setCategories((current) => [
        ...current,
        item.category,
      ]);
    }

    setNewCategory("");
    setCategoryCreatorOpen(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setNewCategory("");
    setCategoryCreatorOpen(false);
  };

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const addCategory = () => {
    const value = newCategory.trim();

    if (!value) {
      notify("Enter a category name.", "error");
      return;
    }

    const duplicate = categories.some(
      (item) => normalize(item) === normalize(value)
    );

    if (!duplicate) {
      setCategories((current) => [...current, value]);
    }

    setForm((current) => ({
      ...current,
      category: value,
    }));

    setNewCategory("");
    setCategoryCreatorOpen(false);
    notify("Category added.", "success");
  };

  const savePackage = async (event) => {
    event.preventDefault();

    const packageName = form.packageName.trim();
    const sellingPrice = Number(form.sellingPrice);

    if (!packageName) {
      notify("Package name is required.", "error");
      return;
    }

    if (!form.country) {
      notify("Country is required.", "error");
      return;
    }

    if (!form.category) {
      notify("Category is required.", "error");
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
      country: form.country,
      category: form.category,
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
        ? "Media package updated."
        : "Media package created.",
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

    notify("Media package deleted.", "success");
    setDeleteItem(null);
  };

  if (!packagesLoaded) {
    return (
      <div className="page-loading">
        Loading media packages...
      </div>
    );
  }

  return (
    <div className="media-packages-page">
      <header className="media-packages-header">
        <div>
          <span>PACKAGE MANAGEMENT</span>
          <h1>Media Packages</h1>
          <p>
            Create and manage media package names,
            countries, categories, selling prices, and notes.
          </p>
        </div>

        <button
          type="button"
          className="media-package-primary-btn"
          onClick={openCreate}
        >
          <PackagePlus size={17} />
          Add Media Package
        </button>
      </header>

      <section className="media-package-stats">
        <article>
          <span>Total Packages</span>
          <strong>{summary.total}</strong>
          <p>Registered media packages</p>
        </article>

        <article>
          <span>Total Selling Value</span>
          <strong>{summary.totalSellingLabel}</strong>
          <p>Combined selling price</p>
        </article>

        <article>
          <span>Average Price</span>
          <strong>{summary.averagePriceLabel}</strong>
          <p>Average package selling price</p>
        </article>
      </section>

      <section className="media-package-table-card">
        <header>
          <div>
            <h2>Media Package List</h2>
            <p>{filteredPackages.length} package records</p>
          </div>

          <label className="media-package-search">
            <Search size={16} />
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search package, country or category..."
            />
          </label>
        </header>

        <div className="media-package-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Package Name</th>
                <th>Country</th>
                <th>Category</th>
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

                  <td>{item.country}</td>

                  <td>
                    <span className="media-package-category">
                      {item.category}
                    </span>
                  </td>

                  <td>
                    <span className="media-package-currency">
                      {item.currency || "AFN"}
                    </span>
                  </td>

                  <td className="media-package-price">
                    {money(item.sellingPrice, item.currency)}
                  </td>

                  <td>
                    <span className="media-package-note">
                      {item.note || "No note"}
                    </span>
                  </td>

                  <td>
                    <div className="media-package-actions">
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
                    colSpan="7"
                    className="media-package-empty"
                  >
                    No media packages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div
          className="media-package-modal-backdrop"
          onMouseDown={closeModal}
        >
          <form
            className="media-package-modal"
            onSubmit={savePackage}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header>
              <div>
                <h2>
                  {editingId
                    ? "Edit Media Package"
                    : "Add Media Package"}
                </h2>
                <p>
                  Complete the media package information below.
                </p>
              </div>

              <button
                type="button"
                className="media-package-close-btn"
                onClick={closeModal}
              >
                <X size={19} />
              </button>
            </header>

            <div className="media-package-form-grid">
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
                <span>Country</span>

                <MediaCountrySelect
                  value={form.country}
                  onChange={updateField}
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

              <label className="media-category-field">
                <span>Category</span>

                <div className="media-category-control">
                  <select
                    name="category"
                    value={form.category}
                    onChange={updateField}
                  >
                    <option value="">Select category</option>

                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    title="Add category"
                    onClick={() =>
                      setCategoryCreatorOpen(
                        (current) => !current
                      )
                    }
                  >
                    <Plus size={17} />
                  </button>
                </div>

                {categoryCreatorOpen && (
                  <div className="media-new-category">
                    <input
                      value={newCategory}
                      onChange={(event) =>
                        setNewCategory(event.target.value)
                      }
                      placeholder="New category"
                    />

                    <button
                      type="button"
                      onClick={addCategory}
                    >
                      Add
                    </button>
                  </div>
                )}
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

              <label className="media-form-full">
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
          className="media-package-modal-backdrop"
          onMouseDown={() => setDetailsItem(null)}
        >
          <section
            className="media-package-details-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header>
              <div>
                <h2>{detailsItem.packageName}</h2>
                <p>Media package information.</p>
              </div>

              <button
                type="button"
                className="media-package-close-btn"
                onClick={() => setDetailsItem(null)}
              >
                <X size={19} />
              </button>
            </header>

            <div className="media-package-details-grid">
              <div>
                <span>Country</span>
                <strong>{detailsItem.country}</strong>
              </div>

              <div>
                <span>Unit</span>
                <strong>
                  {detailsItem.currency || "AFN"}
                </strong>
              </div>

              <div>
                <span>Category</span>
                <strong>{detailsItem.category}</strong>
              </div>

              <div>
                <span>Selling Price</span>
                <strong>
                  {money(detailsItem.sellingPrice)}
                </strong>
              </div>
            </div>

            <div className="media-package-note-box">
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
          className="media-package-modal-backdrop"
          onMouseDown={() => setDeleteItem(null)}
        >
          <section
            className="media-package-delete-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div>
              <Trash2 size={24} />
            </div>

            <h2>Delete Media Package?</h2>

            <p>
              This will permanently delete 
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