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
  interfaceLanguage = "en",
}) {
  const tx = (en, dr, ps) =>
    interfaceLanguage === "dr"
      ? dr
      : interfaceLanguage === "ps"
        ? ps
        : en;
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
            {tx(
              "Select country",
              "کشور را انتخاب کنید",
              "هېواد وټاکئ"
            )}
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
            placeholder={tx(
              "Search country...",
              "جستجوی کشور...",
              "هېواد ولټوئ..."
            )}
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
              <p>
                {tx(
                  "No country found.",
                  "کشوری پیدا نشد.",
                  "هېواد ونه موندل شو."
                )}
              </p>
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

  const [interfaceLanguage, setInterfaceLanguage] = useState(
    () => localStorage.getItem("isp-language") || "en"
  );

  useEffect(() => {
    const syncInterfaceLanguage = (event) => {
      const nextLanguage =
        event?.detail ||
        localStorage.getItem("isp-language") ||
        "en";

      setInterfaceLanguage(nextLanguage);
    };

    window.addEventListener(
      "isp-language-changed",
      syncInterfaceLanguage
    );
    window.addEventListener(
      "storage",
      syncInterfaceLanguage
    );

    return () => {
      window.removeEventListener(
        "isp-language-changed",
        syncInterfaceLanguage
      );
      window.removeEventListener(
        "storage",
        syncInterfaceLanguage
      );
    };
  }, []);

  const tx = (en, dr, ps) =>
    interfaceLanguage === "dr"
      ? dr
      : interfaceLanguage === "ps"
        ? ps
        : en;

  const translatePackageValue = (value) => {
    const key = String(value || "");

    const labels = {
      Available: tx("Available", "موجود", "شته"),
      "Not Available": tx("Not Available", "ناموجود", "نشته"),
      Yes: tx("Yes", "بلی", "هو"),
      No: tx("No", "نخیر", "نه"),
      Medical: tx("Medical", "طبی", "طبي"),
      Tourism: tx("Tourism", "گردشگری", "سیاحت"),
      Checkup: tx("Checkup", "معاینه", "معاینه"),
      Business: tx("Business", "تجارتی", "سوداګریز"),
      Study: tx("Study", "تحصیلی", "تحصیلي"),
      "Family Visit": tx("Family Visit", "دیدار خانواده", "د کورنۍ لیدنه"),
    };

    return labels[key] || value;
  };

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
      notify(tx("Enter a category name.", "نام کتگوری را وارد کنید.", "د کټګورۍ نوم ولیکئ."), "error");
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
    notify(tx("Category added.", "کتگوری اضافه شد.", "کټګوري زیاته شوه."), "success");
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
      notify(tx("Enter a document name.", "نام سند را وارد کنید.", "د سند نوم ولیکئ."), "error");
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
    notify(tx("Document added.", "سند اضافه شد.", "سند زیات شو."), "success");
  };

  const savePackage = async (event) => {
    event.preventDefault();

    const packageName = form.packageName.trim();

    if (!packageName) {
      notify(tx("Package name is required.", "نام پکیج ضروری است.", "د بستې نوم اړین دی."), "error");
      return;
    }

    if (!form.country) {
      notify(tx("Country is required.", "انتخاب کشور ضروری است.", "د هېواد ټاکل اړین دي."), "error");
      return;
    }

    if (!form.startDate || !form.endDate) {
      notify(tx("Start date and end date are required.", "تاریخ شروع و ختم ضروری است.", "د پیل او پای نېټې اړینې دي."), "error");
      return;
    }

    if (
      new Date(form.endDate) <
      new Date(form.startDate)
    ) {
      notify(
        tx("End date cannot be earlier than start date.", "تاریخ ختم نمی‌تواند قبل از تاریخ شروع باشد.", "د پای نېټه د پیل له نېټې مخکې نه شي کېدای."),
        "error"
      );
      return;
    }

    if (
      form.availability === "Available" &&
      form.endDate <= packageAvailabilityDate
    ) {
      notify(
        tx("An available package must have an end date after today.", "پکیج موجود باید تاریخ ختم بعد از امروز داشته باشد.", "شته بسته باید له نن وروسته د پای نېټه ولري."),
        "error"
      );
      return;
    }

    if (!form.category) {
      notify(tx("Category is required.", "کتگوری ضروری است.", "کټګوري اړینه ده."), "error");
      return;
    }

    const costPrice = Number(form.costPrice);
    const sellingPrice = Number(form.sellingPrice);

    if (!(costPrice >= 0) || !(sellingPrice >= 0)) {
      notify(tx("Enter valid prices.", "قیمت‌های معتبر وارد کنید.", "معتبرې بیې ولیکئ."), "error");
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
        tx("Enter the required bank statement amount.", "مبلغ مورد نیاز استیتمنت بانکی را وارد کنید.", "د بانکي سټېټمنټ اړینه اندازه ولیکئ."),
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
        ? tx("Visa package updated.", "پکیج ویزه ویرایش شد.", "د ویزې بسته سمه شوه.")
        : tx("Visa package created.", "پکیج ویزه ایجاد شد.", "د ویزې بسته جوړه شوه."),
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

    notify(tx("Visa package deleted.", "پکیج ویزه حذف شد.", "د ویزې بسته حذف شوه."), "success");
    setDeleteItem(null);
  };


  if (!packagesLoaded) {
    return (
      <div className="page-loading">
        {tx(
          "Loading visa packages...",
          "در حال بارگذاری پکیج‌های ویزه...",
          "د ویزې بستې بارېږي..."
        )}
      </div>
    );
  }

  return (
    <div className={`visa-packages-page ${interfaceLanguage !== "en" ? "visa-packages-page-rtl" : ""}`}>
      <header className="visa-packages-header">
        <div>
          <span>{tx("PACKAGE MANAGEMENT", "مدیریت پکیج‌ها", "د بستو مدیریت")}</span>
          <h1>{tx("Visa Packages", "پکیج‌های ویزه", "د ویزې بستې")}</h1>
          <p>
            {tx(
              "Create and manage visa packages, prices, countries, dates, and bank requirements.",
              "پکیج‌های ویزه، قیمت‌ها، کشورها، تاریخ‌ها و شرایط بانکی را مدیریت کنید.",
              "د ویزې بستې، بیې، هېوادونه، نېټې او بانکي شرایط مدیریت کړئ."
            )}
          </p>
        </div>

        <button
          type="button"
          className="visa-package-primary-btn"
          onClick={openCreate}
        >
          <PackagePlus size={17} />
          {tx("Add Visa Package", "افزودن پکیج ویزه", "د ویزې بسته زیاتول")}
        </button>
      </header>

      <section className="visa-package-stats">
        <article>
          <PackagePlus size={18} />
          <div>
            <span>{tx("Total Packages", "مجموع پکیج‌ها", "ټولې بستې")}</span>
            <strong>{stats.total}</strong>
          </div>
        </article>

        <article>
          <CircleDollarSign size={18} />
          <div>
            <span>{tx("Total Cost", "مجموع هزینه", "ټول لګښت")}</span>
            <strong>{stats.totalCostLabel}</strong>
          </div>
        </article>

        <article>
          <Landmark size={18} />
          <div>
            <span>{tx("Total Selling", "مجموع فروش", "ټول پلور")}</span>
            <strong>{stats.totalSalesLabel}</strong>
          </div>
        </article>

        <article>
          <FileText size={18} />
          <div>
            <span>{tx("Expected Profit", "سود مورد انتظار", "تمه شوې ګټه")}</span>
            <strong>{stats.totalProfitLabel}</strong>
          </div>
        </article>
      </section>

      <section className="visa-package-table-card">
        <header>
          <div>
            <h2>{tx("Visa Package List", "فهرست پکیج‌های ویزه", "د ویزې بستو لېست")}</h2>
            <p>{filteredPackages.length} {tx("package records", "رکورد پکیج", "د بستې ریکارډونه")}</p>
          </div>

          <label className="visa-package-search">
            <Search size={16} />
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={tx("Search package, country or category...", "جستجوی پکیج، کشور یا کتگوری...", "بسته، هېواد یا کټګوري ولټوئ...")}
            />
          </label>
        </header>

        <div className="visa-package-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{tx("Package", "پکیج", "بسته")}</th>
                <th>{tx("Country", "کشور", "هېواد")}</th>
                <th>{tx("Category", "کتگوری", "کټګوري")}</th>
                <th>{tx("Start / End", "شروع / ختم", "پیل / پای")}</th>
                <th>{tx("Availability", "موجودیت", "شتون")}</th>
                <th>{tx("Cost Price", "قیمت خرید", "د لګښت بیه")}</th>
                <th>{tx("Selling Price", "قیمت فروش", "د پلور بیه")}</th>
                <th>{tx("Profit", "سود", "ګټه")}</th>
                <th>{tx("Bank Statement", "استیتمنت بانکی", "بانکي سټېټمنټ")}</th>
                <th>{tx("Documentation", "اسناد", "اسناد")}</th>
                <th>{tx("Actions", "عملیات", "عملونه")}</th>
              </tr>
            </thead>

            <tbody>
              {filteredPackages.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.packageName}</strong>
                    <small>{item.note || tx("No note", "بدون یادداشت", "یادښت نشته")}</small>
                    <span className="visa-package-currency">
                      {item.currency || "AFN"}
                    </span>
                  </td>

                  <td>{item.country}</td>

                  <td>
                    <span className="visa-package-category">
                      {translatePackageValue(item.category)}
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
                      {translatePackageValue(packageAvailabilityLabel(item, packageAvailabilityDate))}
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
                        : tx("Not Required", "ضروری نیست", "اړین نه دی")}
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
                        {tx("None", "هیچ", "هیڅ")}
                      </span>
                    )}
                  </td>

                  <td>
                    <div className="visa-package-actions">
                      <button
                        type="button"
                        title={tx("View", "نمایش", "کتل")}
                        onClick={() => setDetailsItem(item)}
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
                        title={tx("Edit", "ویرایش", "سمول")}
                        onClick={() => openEdit(item)}
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        className="delete"
                        title={tx("Delete", "حذف", "حذف")}
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
                    {tx("No visa packages found.", "هیچ پکیج ویزه پیدا نشد.", "د ویزې هېڅ بسته ونه موندل شوه.")}
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
                    ? tx("Edit Visa Package", "ویرایش پکیج ویزه", "د ویزې بسته سمول")
                    : tx("Add Visa Package", "افزودن پکیج ویزه", "د ویزې بسته زیاتول")}
                </h2>
                <p>
                  {tx(
                    "Complete the package information below.",
                    "معلومات پکیج را در پایین تکمیل کنید.",
                    "د بستې معلومات لاندې بشپړ کړئ."
                  )}
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
                <span>{tx("Package Name", "نام پکیج", "د بستې نوم")}</span>
                <input
                  name="packageName"
                  value={form.packageName}
                  onChange={updateField}
                  placeholder={tx("Enter package name", "نام پکیج را وارد کنید", "د بستې نوم ولیکئ")}
                  autoFocus
                />
              </label>

              <label>
                <span>{tx("Country", "کشور", "هېواد")}</span>

                <VisaCountrySelect
                  value={form.country}
                  onChange={updateField}
                  interfaceLanguage={interfaceLanguage}
                />
              </label>

              <label>
                <span>{tx("Unit", "واحد", "واحد")}</span>

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
                <span>{tx("Availability", "موجودیت", "شتون")}</span>
                <select
                  name="availability"
                  value={form.availability}
                  onChange={updateField}
                >
                  <option value="Available">{tx("Available", "موجود", "شته")}</option>
                  <option value="Not Available">{tx("Not Available", "ناموجود", "نشته")}</option>
                </select>
              </label>

              <label>
                <span>{tx("Start Date", "تاریخ شروع", "د پیل نېټه")}</span>
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
                <span>{tx("End Date", "تاریخ ختم", "د پای نېټه")}</span>
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
                <span>{tx("Category", "کتگوری", "کټګوري")}</span>
                <div className="visa-category-control">
                  <select
                    name="category"
                    value={form.category}
                    onChange={updateField}
                  >
                    <option value="">{tx("Select category", "کتگوری را انتخاب کنید", "کټګوري وټاکئ")}</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {translatePackageValue(category)}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    title={tx("Add category", "افزودن کتگوری", "کټګوري زیاتول")}
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
                      placeholder={tx("New category", "کتگوری جدید", "نوې کټګوري")}
                    />

                    <button
                      type="button"
                      onClick={addCategory}
                    >
                      {tx("Add", "افزودن", "زیاتول")}
                    </button>
                  </div>
                )}
              </label>

              <label>
                <span>{tx("Cost Price", "قیمت خرید", "د لګښت بیه")} ({form.currency})</span>
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
                <span>{tx("Selling Price", "قیمت فروش", "د پلور بیه")} ({form.currency})</span>
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
                <span>{tx("Expected Profit", "سود مورد انتظار", "تمه شوې ګټه")}</span>
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
                <legend>{tx("Bank Statement Required", "استیتمنت بانکی ضروری است", "بانکي سټېټمنټ اړین دی")}</legend>

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
                  {tx("Yes", "بلی", "هو")}
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
                  {tx("No", "نخیر", "نه")}
                </label>
              </fieldset>

              {form.bankStatementRequired === "Yes" && (
                <label>
                  <span>{tx("Bank Statement Amount (AFN)", "مبلغ استیتمنت بانکی (AFN)", "د بانکي سټېټمنټ اندازه (AFN)")}</span>
                  <input
                    type="number"
                    min="1"
                    name="bankStatementAmount"
                    value={form.bankStatementAmount}
                    onChange={updateField}
                    placeholder={tx("Required amount", "مبلغ مورد نیاز", "اړینه اندازه")}
                  />
                </label>
              )}

              <fieldset className="visa-bank-fieldset visa-form-full">
                <legend>{tx("Documentation Required", "اسناد ضروری است", "اسناد اړین دي")}</legend>

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
                  {tx("Yes", "بلی", "هو")}
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
                  {tx("No", "نخیر", "نه")}
                </label>
              </fieldset>

              {form.documentationRequired === "Yes" && (
                <div className="visa-form-full visa-documentation-box">
                  <div className="visa-documentation-header">
                    <span>{tx("Required Documents", "اسناد مورد نیاز", "اړین اسناد")}</span>

                    <button
                      type="button"
                      title={tx("Add document", "افزودن سند", "سند زیاتول")}
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
                        placeholder={tx("New document", "سند جدید", "نوی سند")}
                      />

                      <button
                        type="button"
                        onClick={addDocument}
                      >
                        {tx("Add", "افزودن", "زیاتول")}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <label className="visa-form-full">
                <span>{tx("Note", "یادداشت", "یادښت")}</span>
                <textarea
                  name="note"
                  rows="4"
                  value={form.note}
                  onChange={updateField}
                  placeholder={tx("Write package notes...", "یادداشت پکیج را بنویسید...", "د بستې یادښت ولیکئ...")}
                />
              </label>
            </div>

            <footer>
              <button
                type="button"
                onClick={closeModal}
              >
                {tx("Cancel", "لغو", "لغوه")}
              </button>

              <button
                type="submit"
                className="primary"
              >
                {editingId
                  ? tx("Update Package", "ویرایش پکیج", "بسته تازه کول")
                  : tx("Save Package", "ذخیره پکیج", "بسته خوندي کول")}
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
                <p>{tx("Complete visa package information.", "معلومات کامل پکیج ویزه.", "د ویزې بستې بشپړ معلومات.")}</p>
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
                <span>{tx("Country", "کشور", "هېواد")}</span>
                <strong>{detailsItem.country}</strong>
              </div>

              <div>
                <span>{tx("Unit", "واحد", "واحد")}</span>
                <strong>
                  {detailsItem.currency || "AFN"}
                </strong>
              </div>

              <div>
                <span>{tx("Availability", "موجودیت", "شتون")}</span>
                <strong>
                  {translatePackageValue(
                    packageAvailabilityLabel(
                      detailsItem,
                      packageAvailabilityDate
                    )
                  )}
                </strong>
              </div>

              <div>
                <span>{tx("Category", "کتگوری", "کټګوري")}</span>
                <strong>{detailsItem.category}</strong>
              </div>

              <div>
                <span>{tx("Start Date", "تاریخ شروع", "د پیل نېټه")}</span>
                <strong>
                  {formatDate(detailsItem.startDate)}
                </strong>
              </div>

              <div>
                <span>{tx("End Date", "تاریخ ختم", "د پای نېټه")}</span>
                <strong>
                  {formatDate(detailsItem.endDate)}
                </strong>
              </div>

              <div>
                <span>{tx("Cost Price", "قیمت خرید", "د لګښت بیه")}</span>
                <strong>
                  {money(
                    detailsItem.costPrice,
                    detailsItem.currency
                  )}
                </strong>
              </div>

              <div>
                <span>{tx("Selling Price", "قیمت فروش", "د پلور بیه")}</span>
                <strong>
                  {money(
                    detailsItem.sellingPrice,
                    detailsItem.currency
                  )}
                </strong>
              </div>

              <div>
                <span>{tx("Profit", "سود", "ګټه")}</span>
                <strong>
                  {money(
                    detailsItem.profit,
                    detailsItem.currency
                  )}
                </strong>
              </div>

              <div>
                <span>{tx("Bank Statement", "استیتمنت بانکی", "بانکي سټېټمنټ")}</span>
                <strong>
                  {detailsItem.bankStatementRequired === "Yes"
                    ? money(
                        detailsItem.bankStatementAmount,
                        detailsItem.currency
                      )
                    : tx("Not Required", "ضروری نیست", "اړین نه دی")}
                </strong>
              </div>

              <div>
                <span>{tx("Documentation", "اسناد", "اسناد")}</span>
                <strong>
                  {detailsItem.documentationRequired === "Yes"
                    ? (detailsItem.documents || []).join(", ") ||
                      tx("Required", "ضروری", "اړین")
                    : tx("None", "هیچ", "هیڅ")}
                </strong>
              </div>
            </div>

            <div className="visa-package-note-box">
              <span>{tx("Note", "یادداشت", "یادښت")}</span>
              <p>{detailsItem.note || tx("No note", "بدون یادداشت", "یادښت نشته")}</p>
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
                {tx("Edit Package", "ویرایش پکیج", "بسته سمول")}
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

            <h2>{tx("Delete Visa Package?", "پکیج ویزه حذف شود؟", "د ویزې بسته حذف شي؟")}</h2>

            <p>
              {tx(
                "This will permanently delete",
                "این مورد به‌طور دایمی حذف می‌شود:",
                "دا به د تل لپاره حذف شي:"
              )}{" "}
              <strong>{deleteItem.packageName}</strong>.
            </p>

            <footer>
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
              >
                {tx("Cancel", "لغو", "لغوه")}
              </button>

              <button
                type="button"
                className="delete"
                onClick={confirmDelete}
              >
                {tx("Delete", "حذف", "حذف")}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
