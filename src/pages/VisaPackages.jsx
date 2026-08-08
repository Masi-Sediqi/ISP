import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CircleDollarSign,
  Edit3,
  Eye,
  FileText,
  Landmark,
  PackagePlus,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { useJsonCollection } from "../hooks/useJsonCollection";
import { useLocalCollection } from "../hooks/useLocalCollection";
import { usePackageAvailabilityDate } from "../hooks/usePackageAvailabilityDate";
import { createRecordId } from "../utils/ids";
import { notify } from "../utils/notify";
import {
  isPackageAvailable,
  isPackageManuallyAvailable,
  packageAvailabilityLabel,
} from "../utils/packageAvailability";
import "./VisaPackages.css";

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
  "Zimbabwe",
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

function VisaCountrySelect({
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
      className={`visa-country-select ${
        open ? "open" : ""
      }`}
      ref={wrapperRef}
    >
      <button
        type="button"
        className="visa-country-trigger"
        onClick={() =>
          setOpen((current) => !current)
        }
      >
        {value ? (
          <span className="visa-country-selected">
            <img
              className="visa-country-flag-image"
              src={getCountryFlagUrl(value)}
              alt=""
            />

            <span>{value}</span>
          </span>
        ) : (
          <span className="visa-country-placeholder">
            Select country
          </span>
        )}

        <span className="visa-country-arrow">
          ▾
        </span>
      </button>

      {open && (
        <div className="visa-country-menu">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search country..."
            autoFocus
          />

          <div className="visa-country-options">
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
                  className="visa-country-flag-image"
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
].filter((item) => ["AFN", "USD"].includes(item.code));

const defaultCategories = [
  "Medical",
  "Tourism",
  "Checkup",
  "Business",
  "Study",
  "Family Visit",
];

const defaultDocuments = [
  "TOEFL",
  "IELTS",
  "Duolingo",
];

const emptyForm = {
  packageName: "",
  country: "",
  startDate: "",
  endDate: "",
  category: "",
  currency: "AFN",
  availability: "Available",
  costPrice: "",
  sellingPrice: "",
  bankStatementRequired: "No",
  bankStatementAmount: "",
  documentationRequired: "No",
  documents: [],
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

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB");
};

export default function VisaPackages() {
  const packageAvailabilityDate = usePackageAvailabilityDate();
  const [
    packages,
    setPackages,
    ,
    packagesLoaded,
  ] = useJsonCollection("visaPackages");

  const [
    legacyLocalPackages,
    setLegacyLocalPackages,
  ] = useLocalCollection("visaPackages", {
    archiveDeletes: false,
  });

  const [categories, setCategories] =
    useState(defaultCategories);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [newCategory, setNewCategory] = useState("");
  const [categoryCreatorOpen, setCategoryCreatorOpen] =
    useState(false);
  const [documentOptions, setDocumentOptions] =
    useState(defaultDocuments);
  const [newDocument, setNewDocument] = useState("");
  const [documentCreatorOpen, setDocumentCreatorOpen] =
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

      if (!exists) {
        merged.push(localItem);
      }
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
          item.note,
          item.bankStatementRequired,
          item.costPrice,
          item.sellingPrice,
          item.currency,
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

  const stats = useMemo(() => ({
    total: packages.length,
    totalCostLabel: totalsByCurrency(
      packages,
      "costPrice"
    ),
    totalSalesLabel: totalsByCurrency(
      packages,
      "sellingPrice"
    ),
    totalProfitLabel: totalsByCurrency(
      packages.map((item) => ({
        ...item,
        profit:
          Number(item.sellingPrice || 0) -
          Number(item.costPrice || 0),
      })),
      "profit"
    ),
  }), [packages]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setNewCategory("");
    setCategoryCreatorOpen(false);
    setNewDocument("");
    setDocumentCreatorOpen(false);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      packageName: item.packageName || "",
      country: item.country || "",
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      category: item.category || "",
      currency: ["AFN", "USD"].includes(item.currency)
        ? item.currency
        : "AFN",
      availability: isPackageManuallyAvailable(item)
        ? "Available"
        : "Not Available",
      costPrice: String(item.costPrice ?? ""),
      sellingPrice: String(item.sellingPrice ?? ""),
      bankStatementRequired:
        item.bankStatementRequired || "No",
      bankStatementAmount: String(
        item.bankStatementAmount ?? ""
      ),
      documentationRequired:
        item.documentationRequired || "No",
      documents: Array.isArray(item.documents)
        ? item.documents
        : [],
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

    if (Array.isArray(item.documents)) {
      item.documents.forEach((documentName) => {
        setDocumentOptions((current) =>
          current.some(
            (entry) =>
              normalize(entry) === normalize(documentName)
          )
            ? current
            : [...current, documentName]
        );
      });
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
    setNewDocument("");
    setDocumentCreatorOpen(false);
  };

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "bankStatementRequired" &&
      value === "No"
        ? { bankStatementAmount: "" }
        : {}),
      ...(name === "documentationRequired" &&
      value === "No"
        ? { documents: [] }
        : {}),
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

  const toggleDocument = (documentName) => {
    setForm((current) => {
      const selected = Array.isArray(current.documents)
        ? current.documents
        : [];

      const exists = selected.some(
        (item) =>
          normalize(item) === normalize(documentName)
      );

      return {
        ...current,
        documents: exists
          ? selected.filter(
              (item) =>
                normalize(item) !==
                normalize(documentName)
            )
          : [...selected, documentName],
      };
    });
  };

  const addDocument = () => {
    const value = newDocument.trim();

    if (!value) {
      notify("Enter a document name.", "error");
      return;
    }

    setDocumentOptions((current) =>
      current.some(
        (item) => normalize(item) === normalize(value)
      )
        ? current
        : [...current, value]
    );

    setForm((current) => ({
      ...current,
      documents: Array.isArray(current.documents) &&
        current.documents.some(
          (item) => normalize(item) === normalize(value)
        )
        ? current.documents
        : [...(current.documents || []), value],
    }));

    setNewDocument("");
    setDocumentCreatorOpen(false);
    notify("Document added.", "success");
  };

  const savePackage = async (event) => {
    event.preventDefault();

    const packageName = form.packageName.trim();

    if (!packageName) {
      notify("Package name is required.", "error");
      return;
    }

    if (!form.country) {
      notify("Country is required.", "error");
      return;
    }

    if (!form.startDate || !form.endDate) {
      notify("Start date and end date are required.", "error");
      return;
    }

    if (
      new Date(form.endDate) <
      new Date(form.startDate)
    ) {
      notify(
        "End date cannot be earlier than start date.",
        "error"
      );
      return;
    }

    if (
      form.availability === "Available" &&
      form.endDate <= packageAvailabilityDate
    ) {
      notify(
        "An available package must have an end date after today.",
        "error"
      );
      return;
    }

    if (!form.category) {
      notify("Category is required.", "error");
      return;
    }

    const costPrice = Number(form.costPrice);
    const sellingPrice = Number(form.sellingPrice);

    if (!(costPrice >= 0) || !(sellingPrice >= 0)) {
      notify("Enter valid prices.", "error");
      return;
    }

    const bankStatementAmount =
      form.bankStatementRequired === "Yes"
        ? Number(form.bankStatementAmount)
        : 0;

    if (
      form.bankStatementRequired === "Yes" &&
      !(bankStatementAmount > 0)
    ) {
      notify(
        "Enter the required bank statement amount.",
        "error"
      );
      return;
    }

    const now = new Date().toISOString();

    const record = {
      id: editingId || createRecordId(),
      packageName,
      country: form.country,
      startDate: form.startDate,
      endDate: form.endDate,
      category: form.category,
      currency: ["AFN", "USD"].includes(form.currency)
        ? form.currency
        : "AFN",
      availability: form.availability,
      isAvailable: form.availability === "Available",
      costPrice,
      sellingPrice,
      profit: sellingPrice - costPrice,
      bankStatementRequired:
        form.bankStatementRequired,
      bankStatementAmount,
      documentationRequired:
        form.documentationRequired,
      documents:
        form.documentationRequired === "Yes"
          ? form.documents
          : [],
      note: form.note.trim(),
      status: "Active",
      createdAt:
        packages.find(
          (item) => String(item.id) === String(editingId)
        )?.createdAt || now,
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
        ? "Visa package updated."
        : "Visa package created.",
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

    notify("Visa package deleted.", "success");
    setDeleteItem(null);
  };


  if (!packagesLoaded) {
    return (
      <div className="page-loading">
        Loading visa packages...
      </div>
    );
  }

  return (
    <div className="visa-packages-page">
      <header className="visa-packages-header">
        <div>
          <span>PACKAGE MANAGEMENT</span>
          <h1>Visa Packages</h1>
          <p>
            Create and manage visa packages, prices,
            countries, dates, and bank requirements.
          </p>
        </div>

        <button
          type="button"
          className="visa-package-primary-btn"
          onClick={openCreate}
        >
          <PackagePlus size={17} />
          Add Visa Package
        </button>
      </header>

      <section className="visa-package-stats">
        <article>
          <PackagePlus size={18} />
          <div>
            <span>Total Packages</span>
            <strong>{stats.total}</strong>
          </div>
        </article>

        <article>
          <CircleDollarSign size={18} />
          <div>
            <span>Total Cost</span>
            <strong>{stats.totalCostLabel}</strong>
          </div>
        </article>

        <article>
          <Landmark size={18} />
          <div>
            <span>Total Selling</span>
            <strong>{stats.totalSalesLabel}</strong>
          </div>
        </article>

        <article>
          <FileText size={18} />
          <div>
            <span>Expected Profit</span>
            <strong>{stats.totalProfitLabel}</strong>
          </div>
        </article>
      </section>

      <section className="visa-package-table-card">
        <header>
          <div>
            <h2>Visa Package List</h2>
            <p>{filteredPackages.length} package records</p>
          </div>

          <label className="visa-package-search">
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

        <div className="visa-package-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Package</th>
                <th>Country</th>
                <th>Category</th>
                <th>Start / End</th>
                <th>Availability</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Profit</th>
                <th>Bank Statement</th>
                <th>Documentation</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPackages.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.packageName}</strong>
                    <small>{item.note || "No note"}</small>
                    <span className="visa-package-currency">
                      {item.currency || "AFN"}
                    </span>
                  </td>

                  <td>{item.country}</td>

                  <td>
                    <span className="visa-package-category">
                      {item.category}
                    </span>
                  </td>

                  <td>
                    <strong>{formatDate(item.startDate)}</strong>
                    <small>{formatDate(item.endDate)}</small>
                  </td>

                  <td>
                    <span
                      className={`visa-package-availability ${
                        isPackageAvailable(item, packageAvailabilityDate)
                          ? "available"
                          : "unavailable"
                      }`}
                    >
                      {packageAvailabilityLabel(item, packageAvailabilityDate)}
                    </span>
                  </td>

                  <td>{money(item.costPrice, item.currency)}</td>
                  <td>{money(item.sellingPrice, item.currency)}</td>

                  <td
                    className={
                      Number(item.profit || 0) >= 0
                        ? "visa-profit-positive"
                        : "visa-profit-negative"
                    }
                  >
                    {money(item.profit, item.currency)}
                  </td>

                  <td>
                    <span
                      className={`visa-package-bank ${
                        item.bankStatementRequired === "Yes"
                          ? "required"
                          : "not-required"
                      }`}
                    >
                      {item.bankStatementRequired === "Yes"
                        ? money(
                            item.bankStatementAmount,
                            item.currency
                          )
                        : "Not Required"}
                    </span>
                  </td>

                  <td>
                    {item.documentationRequired === "Yes" ? (
                      <div className="visa-package-documents-cell">
                        {(item.documents || []).map((documentName) => (
                          <span key={documentName}>
                            {documentName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="visa-package-bank not-required">
                        None
                      </span>
                    )}
                  </td>

                  <td>
                    <div className="visa-package-actions">
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
                    colSpan="11"
                    className="visa-package-empty"
                  >
                    No visa packages found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div
          className="visa-package-modal-backdrop"
          onMouseDown={closeModal}
        >
          <form
            className="visa-package-modal"
            onSubmit={savePackage}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header>
              <div>
                <h2>
                  {editingId
                    ? "Edit Visa Package"
                    : "Add Visa Package"}
                </h2>
                <p>
                  Complete the package information below.
                </p>
              </div>

              <button
                type="button"
                className="visa-package-close-btn"
                onClick={closeModal}
              >
                <X size={19} />
              </button>
            </header>

            <div className="visa-package-form-grid">
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

                <VisaCountrySelect
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

              <label>
                <span>Availability</span>
                <select
                  name="availability"
                  value={form.availability}
                  onChange={updateField}
                >
                  <option value="Available">Available</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </label>

              <label>
                <span>Start Date</span>
                <div className="visa-date-control">
                  <CalendarDays size={15} />
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={updateField}
                  />
                </div>
              </label>

              <label>
                <span>End Date</span>
                <div className="visa-date-control">
                  <CalendarDays size={15} />
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={updateField}
                  />
                </div>
              </label>

              <label className="visa-category-field">
                <span>Category</span>
                <div className="visa-category-control">
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
                      setCategoryCreatorOpen((current) => !current)
                    }
                  >
                    <Plus size={17} />
                  </button>
                </div>

                {categoryCreatorOpen && (
                  <div className="visa-new-category">
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
                <span>Cost Price ({form.currency})</span>
                <input
                  type="number"
                  min="0"
                  name="costPrice"
                  value={form.costPrice}
                  onChange={updateField}
                  placeholder="0"
                />
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
                <span>Expected Profit</span>
                <input
                  value={money(
                    Number(form.sellingPrice || 0) -
                      Number(form.costPrice || 0),
                    form.currency
                  )}
                  readOnly
                />
              </label>

              <fieldset className="visa-bank-fieldset">
                <legend>Bank Statement Required</legend>

                <label>
                  <input
                    type="radio"
                    name="bankStatementRequired"
                    value="Yes"
                    checked={
                      form.bankStatementRequired === "Yes"
                    }
                    onChange={updateField}
                  />
                  Yes
                </label>

                <label>
                  <input
                    type="radio"
                    name="bankStatementRequired"
                    value="No"
                    checked={
                      form.bankStatementRequired === "No"
                    }
                    onChange={updateField}
                  />
                  No
                </label>
              </fieldset>

              {form.bankStatementRequired === "Yes" && (
                <label>
                  <span>Bank Statement Amount (AFN)</span>
                  <input
                    type="number"
                    min="1"
                    name="bankStatementAmount"
                    value={form.bankStatementAmount}
                    onChange={updateField}
                    placeholder="Required amount"
                  />
                </label>
              )}

              <fieldset className="visa-bank-fieldset visa-form-full">
                <legend>Documentation Required</legend>

                <label>
                  <input
                    type="radio"
                    name="documentationRequired"
                    value="Yes"
                    checked={
                      form.documentationRequired === "Yes"
                    }
                    onChange={updateField}
                  />
                  Yes
                </label>

                <label>
                  <input
                    type="radio"
                    name="documentationRequired"
                    value="No"
                    checked={
                      form.documentationRequired === "No"
                    }
                    onChange={updateField}
                  />
                  No
                </label>
              </fieldset>

              {form.documentationRequired === "Yes" && (
                <div className="visa-form-full visa-documentation-box">
                  <div className="visa-documentation-header">
                    <span>Required Documents</span>

                    <button
                      type="button"
                      title="Add document"
                      onClick={() =>
                        setDocumentCreatorOpen(
                          (current) => !current
                        )
                      }
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="visa-documentation-options">
                    {documentOptions.map((documentName) => {
                      const checked = form.documents.some(
                        (item) =>
                          normalize(item) ===
                          normalize(documentName)
                      );

                      return (
                        <button
                          key={documentName}
                          type="button"
                          className={`visa-document-option ${
                            checked ? "selected" : ""
                          }`}
                          onClick={() =>
                            toggleDocument(documentName)
                          }
                          aria-pressed={checked}
                        >
                          <span className="visa-document-check">
                            {checked ? "✓" : ""}
                          </span>

                          <span className="visa-document-name">
                            {documentName}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {documentCreatorOpen && (
                    <div className="visa-new-category">
                      <input
                        value={newDocument}
                        onChange={(event) =>
                          setNewDocument(event.target.value)
                        }
                        placeholder="New document"
                      />

                      <button
                        type="button"
                        onClick={addDocument}
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              )}

              <label className="visa-form-full">
                <span>Note</span>
                <textarea
                  name="note"
                  rows="4"
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
          className="visa-package-modal-backdrop"
          onMouseDown={() => setDetailsItem(null)}
        >
          <section
            className="visa-package-details-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header>
              <div>
                <h2>{detailsItem.packageName}</h2>
                <p>Complete visa package information.</p>
              </div>

              <button
                type="button"
                className="visa-package-close-btn"
                onClick={() => setDetailsItem(null)}
              >
                <X size={19} />
              </button>
            </header>

            <div className="visa-package-details-grid">
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
                <span>Availability</span>
                <strong>
                  {packageAvailabilityLabel(
                    detailsItem,
                    packageAvailabilityDate
                  )}
                </strong>
              </div>

              <div>
                <span>Category</span>
                <strong>{detailsItem.category}</strong>
              </div>

              <div>
                <span>Start Date</span>
                <strong>
                  {formatDate(detailsItem.startDate)}
                </strong>
              </div>

              <div>
                <span>End Date</span>
                <strong>
                  {formatDate(detailsItem.endDate)}
                </strong>
              </div>

              <div>
                <span>Cost Price</span>
                <strong>
                  {money(
                    detailsItem.costPrice,
                    detailsItem.currency
                  )}
                </strong>
              </div>

              <div>
                <span>Selling Price</span>
                <strong>
                  {money(
                    detailsItem.sellingPrice,
                    detailsItem.currency
                  )}
                </strong>
              </div>

              <div>
                <span>Profit</span>
                <strong>
                  {money(
                    detailsItem.profit,
                    detailsItem.currency
                  )}
                </strong>
              </div>

              <div>
                <span>Bank Statement</span>
                <strong>
                  {detailsItem.bankStatementRequired === "Yes"
                    ? money(
                        detailsItem.bankStatementAmount,
                        detailsItem.currency
                      )
                    : "Not Required"}
                </strong>
              </div>

              <div>
                <span>Documentation</span>
                <strong>
                  {detailsItem.documentationRequired === "Yes"
                    ? (detailsItem.documents || []).join(", ") ||
                      "Required"
                    : "None"}
                </strong>
              </div>
            </div>

            <div className="visa-package-note-box">
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
          className="visa-package-modal-backdrop"
          onMouseDown={() => setDeleteItem(null)}
        >
          <section
            className="visa-package-delete-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div>
              <Trash2 size={24} />
            </div>

            <h2>Delete Visa Package?</h2>

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
