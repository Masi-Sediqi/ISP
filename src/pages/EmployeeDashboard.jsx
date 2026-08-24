import { useEffect, useMemo, useRef, useState } from "react";
import {
  Filter,
  Plus,
  Users,
  WalletCards,
  Gift,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { useEmployeeAdjustments } from "../hooks/useEmployeeAdjustments";
import { usePackageAvailabilityDate } from "../hooks/usePackageAvailabilityDate";
import { createRecordId } from "../utils/ids";
import { notify } from "../utils/notify";
import { isPackageAvailable } from "../utils/packageAvailability";
import "./EmployeeDashboard.css";

const provinces = ["Badakhshan", "Badghis", "Baghlan", "Balkh", "Bamyan", "Daykundi", "Farah", "Faryab", "Ghazni", "Ghor", "Helmand", "Herat", "Jowzjan", "Kabul", "Kandahar", "Kapisa", "Khost", "Kunar", "Kunduz", "Laghman", "Logar", "Nangarhar", "Nimroz", "Nuristan", "Paktia", "Paktika", "Panjshir", "Parwan", "Samangan", "Sar-e Pol", "Takhar", "Uruzgan", "Wardak", "Zabul"];
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
  "Congo, Democratic Republic of the",
  "Congo, Republic of the",
  "Costa Rica",
  "Côte d'Ivoire",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia",
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
  "São Tomé and Príncipe",
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
  "Turkey",
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
const baseForm = {
  fullName: "",
  phone: "",
  city: "",
  language: "Dari",
  callType: "Incoming",
  purpose: "",
  needFollowup: "No",
  businessType: "",
  technologyPurpose: "",
  note: "",
  country: "",
  scholarshipType: "",
  currencyUnit: "AFN",
  price: "",
  selectedVisaPackageId: "",
  selectedTravelPackageId: "",
  selectedTechnologyPackageId: "",
  selectedMediaPackageId: "",
};

const normalize = (value) => String(value || "").trim().toLowerCase();

const normalizeDepartment = (value) => {
  const text = String(value || "Consultant").toLowerCase();

  if (text.includes("media")) return "media";
  if (text.includes("tech")) return "technology";
  if (text.includes("travel")) return "travel";

  return "consultant";
};

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
  congodemocraticrepublicofthe: "CD",
  congiorepublicofthe: "CG",
  congorepublicofthe: "CG",
  "cote d ivoire": "CI",
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

      const name = displayNames.of(code);

      if (name && name !== code) {
        map.set(normalizeCountryName(name), code);
      }
    }
  }

  return map;
}

const countryCodeMap = buildCountryCodeMap();

function getCountryCode(countryName) {
  const normalized = normalizeCountryName(countryName);

  return (
    countryNameAliases[normalized] ||
    countryCodeMap.get(normalized) ||
    ""
  );
}

function countryCodeToFlag(code) {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐";

  return String.fromCodePoint(
    ...code
      .split("")
      .map(
        (letter) =>
          127397 + letter.charCodeAt(0)
      )
  );
}

function getCountryLabel(countryName) {
  return `${countryCodeToFlag(
    getCountryCode(countryName)
  )} ${countryName}`;
}

function getCountryFlagUrl(countryName) {
  const code = getCountryCode(countryName);

  if (!code) return "";

  return `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;
}


function CountrySelect({
  value,
  onChange,
  countries: countryList,
  labels = {},
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return countryList;

    return countryList.filter((country) =>
      country.toLowerCase().includes(query)
    );
  }, [countryList, search]);

  function chooseCountry(country) {
    onChange({
      target: {
        name: "country",
        value: country,
      },
    });

    setSearch("");
    setOpen(false);
  }

  return (
    <div
      className={`employee-country-select ${
        open ? "open" : ""
      }`}
      ref={wrapperRef}
    >
      <button
        type="button"
        className="employee-country-trigger"
        onClick={() =>
          setOpen((current) => !current)
        }
      >
        {value ? (
          <span className="employee-country-selected">
            <img
              src={getCountryFlagUrl(value)}
              alt=""
            />

            <span>{value}</span>
          </span>
        ) : (
          <span>
            {labels.selectCountry || "Select country"}
          </span>
        )}

        <span className="employee-country-arrow">
          v
        </span>
      </button>

      {open && (
        <div className="employee-country-menu">
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder={
              labels.searchCountry || "Search country..."
            }
            autoFocus
          />

          <div className="employee-country-options">
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
                  src={getCountryFlagUrl(country)}
                  alt=""
                />

                <span>{country}</span>
              </button>
            ))}

            {!filteredCountries.length && (
              <p>
                {labels.noCountryFound ||
                  "No country found."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getAfghanistanDateTime() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kabul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }
  );

  const parts = Object.fromEntries(
    formatter
      .formatToParts(now)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const date =
    `${parts.year}-${parts.month}-${parts.day}`;
  const time =
    `${parts.hour}:${parts.minute}:${parts.second}`;

  return {
    date,
    time,
    dateTime: `${date}T${time}+04:30`,
    iso: now.toISOString(),
  };
}

function getModeTitle(mode) {
  if (mode === "media") {
    return "Media Production";
  }

  if (mode === "technology") {
    return "Technology";
  }

  if (mode === "travel") {
    return "Travel";
  }

  return "Consultant";
}

function getCallCenterSectionLabel(mode) {
  return `${getModeTitle(mode)} Call Center`;
}

export default function EmployeeDashboard({
  currentUser,
}) {
  const departmentModes = useMemo(() => {
    const departments = [
      ...(Array.isArray(currentUser.departments)
        ? currentUser.departments
        : []),
      currentUser.department,
    ].filter(Boolean);

    const modes = departments.map(
      normalizeDepartment
    );

    return Array.from(new Set(modes)).length
      ? Array.from(new Set(modes))
      : ["consultant"];
  }, [
    currentUser.departments,
    currentUser.department,
  ]);

  const [activeMode, setActiveMode] =
    useState(departmentModes[0]);

  const [interfaceLanguage, setInterfaceLanguage] =
    useState(
      () => localStorage.getItem("isp-language") || "en"
    );

  useEffect(() => {
    const syncInterfaceLanguage = (event) => {
      setInterfaceLanguage(
        event?.detail ||
          localStorage.getItem("isp-language") ||
          "en"
      );
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

  const modeLabel = (value) => {
    const labels = {
      consultant: tx(
        "Consultant",
        "\u0645\u0634\u0627\u0648\u0631",
        "\u0645\u0634\u0627\u0648\u0631"
      ),
      travel: tx(
        "Travel",
        "\u0633\u0641\u0631",
        "\u0633\u0641\u0631"
      ),
      technology: tx(
        "Technology",
        "\u062a\u06a9\u0646\u0627\u0644\u0648\u0698\u06cc",
        "\u067c\u06a9\u0646\u0627\u0644\u0648\u0698\u064a"
      ),
      media: tx(
        "Media Production",
        "\u062a\u0648\u0644\u06cc\u062f \u0631\u0633\u0627\u0646\u0647",
        "\u062f \u0631\u0633\u0646\u06cc\u0648 \u062a\u0648\u0644\u06cc\u062f"
      ),
    };

    return labels[value] || getModeTitle(value);
  };

  const callTypeLabel = (value) => {
    const normalized = normalize(String(value || ""));

    if (normalized === "incoming") {
      return tx(
        "Incoming",
        "\u0648\u0627\u0631\u062f\u0647",
        "\u0631\u0627\u062a\u0644\u0648\u0646\u06a9\u06cc"
      );
    }

    if (normalized === "outgoing") {
      return tx(
        "Outgoing",
        "\u062e\u0627\u0631\u062c\u0647",
        "\u062a\u0644\u0648\u0646\u06a9\u06cc"
      );
    }

    return value || "-";
  };

  const yesNoLabel = (value) => {
    const normalized = normalize(String(value || ""));

    if (normalized === "yes") {
      return tx("Yes", "\u0628\u0644\u06cc", "\u0647\u0648");
    }

    if (normalized === "no") {
      return tx("No", "\u0646\u062e\u06cc\u0631", "\u0646\u0647");
    }

    return value || "-";
  };

  useEffect(() => {
    if (!departmentModes.includes(activeMode)) {
      setActiveMode(departmentModes[0]);
    }
  }, [activeMode, departmentModes]);

  const mode = departmentModes.includes(
    activeMode
  )
    ? activeMode
    : departmentModes[0];

  const currentEmployeeId =
    currentUser.employeeId ||
    currentUser.id ||
    "";

  const currentEmployeeName =
    currentUser.fullName ||
    currentUser.username ||
    currentUser.email ||
    tx("Employee", "\u06a9\u0627\u0631\u0645\u0646\u062f", "\u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u06cc");

  const [
    serverCustomers,
    setServerCustomers,
    ,
    customersLoaded,
  ] = useJsonCollection("customers");

  const [localCustomers] =
    useJsonCollection("employeeCustomers");

  const [legacyCustomers] =
    useJsonCollection(`${mode}Customers`);

  const [transactions] =
    useJsonCollection("transactions");

  const [adjustments] =
    useEmployeeAdjustments();

  const [
    visaPackages,
    ,
    ,
    visaPackagesLoaded,
  ] = useJsonCollection("visaPackages");

  const [
    travelPackages,
    ,
    ,
    travelPackagesLoaded,
  ] = useJsonCollection("travelPackages");

  const [
    technologyPackages,
    ,
    ,
    technologyPackagesLoaded,
  ] = useJsonCollection("technologyPackages");

  const [
    mediaPackages,
    ,
    ,
    mediaPackagesLoaded,
  ] = useJsonCollection("mediaPackages");

  const [form, setForm] =
    useState(baseForm);
  const packageAvailabilityDate = usePackageAvailabilityDate();

  const availableVisaPackages = useMemo(
    () =>
      visaPackages.filter((item) =>
        isPackageAvailable(item, packageAvailabilityDate)
      ),
    [visaPackages, packageAvailabilityDate]
  );

  const availableTravelPackages = useMemo(
    () =>
      travelPackages.filter((item) =>
        isPackageAvailable(item, packageAvailabilityDate)
      ),
    [travelPackages, packageAvailabilityDate]
  );

  const selectedVisaPackage = useMemo(
    () =>
      availableVisaPackages.find(
        (item) =>
          String(item.id) ===
          String(form.selectedVisaPackageId)
      ) || null,
    [availableVisaPackages, form.selectedVisaPackageId]
  );

  const selectedTravelPackage = useMemo(
    () =>
      availableTravelPackages.find(
        (item) =>
          String(item.id) ===
          String(form.selectedTravelPackageId)
      ) || null,
    [availableTravelPackages, form.selectedTravelPackageId]
  );

  const selectedTechnologyPackage = useMemo(
    () =>
      technologyPackages.find(
        (item) =>
          String(item.id) ===
          String(form.selectedTechnologyPackageId)
      ) || null,
    [
      technologyPackages,
      form.selectedTechnologyPackageId,
    ]
  );

  const selectedMediaPackage = useMemo(
    () =>
      mediaPackages.find(
        (item) =>
          String(item.id) ===
          String(form.selectedMediaPackageId)
      ) || null,
    [mediaPackages, form.selectedMediaPackageId]
  );

  const [open, setOpen] =
    useState(false);

  const [filter, setFilter] =
    useState("all");

  const [editId, setEditId] =
    useState(null);

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [deleting, setDeleting] =
    useState(false);

  useEffect(() => {
    if (!customersLoaded) return;

    const localRecords = [
      ...localCustomers,
      ...legacyCustomers,
    ].map((item) => ({
      ...item,
      customerType:
        item.customerType || mode,
      specializedCustomer: true,
    }));

    const missing = localRecords.filter(
      (item) =>
        !serverCustomers.some(
          (saved) =>
            String(saved.id) ===
            String(item.id)
        )
    );

    if (missing.length) {
      setServerCustomers([
        ...serverCustomers,
        ...missing,
      ]);
    }
  }, [
    customersLoaded,
    legacyCustomers,
    localCustomers,
    mode,
    serverCustomers,
    setServerCustomers,
  ]);

  const customers = useMemo(
    () =>
      serverCustomers.filter(
        (item) =>
          item.specializedCustomer &&
          item.customerType === mode
      ),
    [serverCustomers, mode]
  );

  const mine = useMemo(
    () =>
      customers.filter(
        (customer) =>
          String(
            customer.sourceEmployeeId || ""
          ) === String(currentEmployeeId) ||
          String(
            customer.createdByAccountId || ""
          ) === String(currentUser.id || "")
      ),
    [
      customers,
      currentEmployeeId,
      currentUser.id,
    ]
  );

  const filtered = mine.filter(
    (customer) =>
      filter === "all" ||
      customer.callType?.toLowerCase() ===
        filter
  );

  const income = transactions
    .filter(
      (transaction) =>
        String(transaction.employeeId) ===
          String(currentUser.employeeId) &&
        String(transaction.type || "")
          .toLowerCase() === "income"
    )
    .reduce(
      (sum, transaction) =>
        sum + Number(transaction.amount || 0),
      0
    );

  const bonus = adjustments
    .filter(
      (adjustment) =>
        String(adjustment.employeeId) ===
        String(currentUser.employeeId)
    )
    .reduce(
      (sum, adjustment) =>
        sum +
        (adjustment.type === "penalty"
          ? -1
          : 1) *
          Number(adjustment.amount || 0),
      0
    );

  const update = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      ...baseForm,
      technologyPurpose:
        mode === "technology"
          ? "Database"
          : "",
    });
  };

  useEffect(() => {
    setFilter("all");
    setOpen(false);
    setEditId(null);
    setDeleteTarget(null);
    resetForm();
  }, [mode]);

  const switchDepartmentMode = (nextMode) => {
    if (nextMode === mode) return;

    setActiveMode(nextMode);
  };

  const openCreateModal = () => {
    setEditId(null);
    resetForm();
    setOpen(true);
  };

  const openEditModal = (customer) => {
    const ownsRecord =
      String(
        customer.sourceEmployeeId || ""
      ) === String(currentEmployeeId) ||
      String(
        customer.createdByAccountId || ""
      ) === String(currentUser.id || "");

    if (!ownsRecord) {
      notify(
        "You can only edit records registered by your account.",
        "error"
      );
      return;
    }

    setEditId(customer.id);

    setForm({
      ...baseForm,
      fullName:
        customer.fullName ||
        customer.customerName ||
        "",
      phone:
        customer.phone ||
        customer.contactNumber ||
        "",
      city: customer.city || "",
      language:
        customer.language || "Dari",
      callType:
        customer.callType || "Incoming",
      purpose:
        customer.purpose || "",
      needFollowup:
        customer.needFollowup || "No",
      businessType:
        customer.businessType || "",
      technologyPurpose:
        customer.technologyPurpose ||
        (mode === "technology"
          ? "Database"
          : ""),
      note:
        customer.note ||
        customer.notes ||
        "",
      country:
        customer.country || "",
      scholarshipType:
        customer.scholarshipType || "",
      currencyUnit:
        customer.currencyUnit ||
        customer.unit ||
        "AFN",
      price:
        customer.price ?? "",
      selectedVisaPackageId:
        customer.selectedVisaPackageId ||
        customer.visaPackageId ||
        "",
      selectedTravelPackageId:
        customer.selectedTravelPackageId ||
        customer.travelPackageId ||
        "",
      selectedTechnologyPackageId:
        customer.selectedTechnologyPackageId ||
        customer.technologyPackageId ||
        "",
      selectedMediaPackageId:
        customer.selectedMediaPackageId ||
        customer.mediaPackageId ||
        "",
    });

    setOpen(true);
  };

  const closeCustomerModal = () => {
    setOpen(false);
    setEditId(null);
    resetForm();
  };

  const save = async (event) => {
    event.preventDefault();

    if (
      !form.fullName.trim() ||
      !form.phone.trim()
    ) {
      notify(
        "Full name and phone number are required.",
        "error"
      );
      return;
    }

    const afghanistanTime =
      getAfghanistanDateTime();

    const existingRecord = editId
      ? serverCustomers.find(
          (customer) =>
            String(customer.id) ===
            String(editId)
        )
      : null;

    if (editId && !existingRecord) {
      notify(
        "Customer record was not found.",
        "error"
      );
      return;
    }

    if (existingRecord) {
      const ownsRecord =
        String(
          existingRecord.sourceEmployeeId || ""
        ) === String(currentEmployeeId) ||
        String(
          existingRecord.createdByAccountId || ""
        ) === String(currentUser.id || "");

      if (!ownsRecord) {
        notify(
          "You can only edit records registered by your account.",
          "error"
        );
        return;
      }
    }

    const record = {
      ...(existingRecord || {}),
      ...form,

      id:
        existingRecord?.id ||
        createRecordId(),

      fullName: form.fullName.trim(),
      customerName: form.fullName.trim(),
      phone: form.phone.trim(),

      country:
        mode === "travel"
          ? selectedTravelPackage?.country || ""
          : mode === "media"
            ? selectedMediaPackage?.country || ""
            : "",

      scholarshipType:
        mode === "consultant"
          ? form.scholarshipType
          : "",

      currencyUnit:
        form.currencyUnit || "AFN",

      unit:
        form.currencyUnit || "AFN",

      price:
        mode === "travel"
          ? Number(
              selectedTravelPackage?.sellingPrice || 0
            )
          : mode === "technology"
            ? Number(
                selectedTechnologyPackage?.sellingPrice || 0
              )
            : mode === "media"
              ? Number(
                  selectedMediaPackage?.sellingPrice || 0
                )
              : Number(form.price || 0),

      selectedVisaPackageId:
        mode === "consultant"
          ? form.selectedVisaPackageId
          : "",

      visaPackageId:
        mode === "consultant"
          ? form.selectedVisaPackageId
          : "",

      visaPackageName:
        mode === "consultant"
          ? selectedVisaPackage?.packageName || ""
          : "",

      selectedTravelPackageId:
        mode === "travel"
          ? form.selectedTravelPackageId
          : "",

      travelPackageId:
        mode === "travel"
          ? form.selectedTravelPackageId
          : "",

      travelPackageName:
        mode === "travel"
          ? selectedTravelPackage?.packageName || ""
          : "",

      selectedTechnologyPackageId:
        mode === "technology"
          ? form.selectedTechnologyPackageId
          : "",

      technologyPackageId:
        mode === "technology"
          ? form.selectedTechnologyPackageId
          : "",

      technologyPackageName:
        mode === "technology"
          ? selectedTechnologyPackage?.packageName || ""
          : "",

      selectedMediaPackageId:
        mode === "media"
          ? form.selectedMediaPackageId
          : "",

      mediaPackageId:
        mode === "media"
          ? form.selectedMediaPackageId
          : "",

      mediaPackageName:
        mode === "media"
          ? selectedMediaPackage?.packageName || ""
          : "",

      businessType:
        mode === "media"
          ? selectedMediaPackage?.category || ""
          : mode === "technology"
            ? form.businessType.trim()
            : "",

      technologyPurpose:
        mode === "technology"
          ? form.technologyPurpose
          : "",

      purpose:
        form.purpose.trim(),

      note:
        mode === "media"
          ? ""
          : form.note.trim(),

      notes:
        mode === "media"
          ? ""
          : form.note.trim(),

      needFollowup:
        mode === "media"
          ? "No"
          : form.needFollowup,

      customerType: mode,
      specializedCustomer: true,

      sourceEmployeeId:
        existingRecord?.sourceEmployeeId ||
        currentEmployeeId,

      sourceEmployeeName:
        existingRecord?.sourceEmployeeName ||
        currentEmployeeName,

      source:
        existingRecord?.source ||
        currentEmployeeName,

      assignedEmployeeId:
        existingRecord?.assignedEmployeeId ||
        "",

      assignedEmployeeName:
        existingRecord?.assignedEmployeeName ||
        "",

      assignedAccountId:
        existingRecord?.assignedAccountId ||
        "",

      assignedAt:
        existingRecord?.assignedAt ||
        "",

      assignmentStatus:
        existingRecord?.assignmentStatus ||
        "None",

      registeredFrom:
        existingRecord?.registeredFrom ||
        "employee-dashboard",

      adminNotificationType:
        existingRecord?.adminNotificationType ||
        (!editId ? "customer-created" : ""),

      adminNotificationSection:
        existingRecord?.adminNotificationSection ||
        getCallCenterSectionLabel(mode),

      adminNotificationAt:
        existingRecord?.adminNotificationAt ||
        (!editId ? afghanistanTime.iso : ""),

      adminNotificationSound:
        existingRecord?.adminNotificationSound ||
        false,

      date:
        existingRecord?.date ||
        afghanistanTime.date,

      time:
        existingRecord?.time ||
        afghanistanTime.time,

      afghanistanDate:
        existingRecord?.afghanistanDate ||
        afghanistanTime.date,

      afghanistanTime:
        existingRecord?.afghanistanTime ||
        afghanistanTime.time,

      afghanistanDateTime:
        existingRecord?.afghanistanDateTime ||
        afghanistanTime.dateTime,

      createdByAccountId:
        existingRecord?.createdByAccountId ||
        currentUser.id ||
        "",

      createdByName:
        existingRecord?.createdByName ||
        currentEmployeeName,

      createdAt:
        existingRecord?.createdAt ||
        afghanistanTime.iso,

      updatedAt:
        afghanistanTime.iso,

      updatedAfghanistanDateTime:
        afghanistanTime.dateTime,
    };

    const nextCustomers = existingRecord
      ? serverCustomers.map((customer) =>
          String(customer.id) ===
          String(existingRecord.id)
            ? record
            : customer
        )
      : [...serverCustomers, record];

    const saved =
      await setServerCustomers(
        nextCustomers
      );

    if (!saved) return;

    window.dispatchEvent(
      new CustomEvent(
        "isp-customer-assignment-updated",
        {
          detail: {
            action: existingRecord
              ? "updated"
              : "created",
            customerId: record.id,
            section: record.adminNotificationSection,
            updatedAt: afghanistanTime.iso,
          },
        }
      )
    );

    notify(
      existingRecord
        ? "Customer updated successfully."
        : "Customer saved successfully.",
      "success"
    );

    closeCustomerModal();
  };

  const requestDelete = (customer) => {
    const ownsRecord =
      String(
        customer.sourceEmployeeId || ""
      ) === String(currentEmployeeId) ||
      String(
        customer.createdByAccountId || ""
      ) === String(currentUser.id || "");

    if (!ownsRecord) {
      notify(
        "You can only delete records registered by your account.",
        "error"
      );
      return;
    }

    setDeleteTarget(customer);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;

    setDeleting(true);

    try {
      const saved =
        await setServerCustomers(
          serverCustomers.filter(
            (customer) =>
              String(customer.id) !==
              String(deleteTarget.id)
          )
        );

      if (!saved) return;

      notify(
        "Customer deleted successfully.",
        "success"
      );

      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const modeTitle = modeLabel(mode);

  const modalTitle = editId
    ? tx(
        `Edit ${modeTitle} Customer`,
        `\u0648\u06cc\u0631\u0627\u06cc\u0634 \u0645\u0634\u062a\u0631\u06cc ${modeTitle}`,
        `\u062f ${modeTitle} \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a \u0633\u0645\u0648\u0644`
      )
    : mode === "media"
      ? tx(
          "Add Media Production Customer",
          "\u062b\u0628\u062a \u0645\u0634\u062a\u0631\u06cc \u062a\u0648\u0644\u06cc\u062f \u0631\u0633\u0627\u0646\u0647",
          "\u062f \u0631\u0633\u0646\u06cc\u0648 \u062a\u0648\u0644\u06cc\u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u06cc \u062b\u0628\u062a"
        )
      : tx(
          `Add ${modeTitle} Customer`,
          `\u062b\u0628\u062a \u0645\u0634\u062a\u0631\u06cc ${modeTitle}`,
          `\u062f ${modeTitle} \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u06cc \u062b\u0628\u062a`
        );

  const tableColumnCount =
    mode === "media"
      ? 8
      : 10 +
        (mode === "consultant" ? 2 : 0) +
        (mode === "travel" ? 1 : 0);

  return (
    <div className="employee-dashboard">
      <header>
        <div>
          <span>
            {tx(
              `${modeTitle} Workspace`,
              `\u0641\u0636\u0627\u06cc \u06a9\u0627\u0631\u06cc ${modeTitle}`,
              `\u062f ${modeTitle} \u06a9\u0627\u0631\u064a \u0633\u0627\u062d\u0647`
            )}
          </span>

          <h1>
            {tx(
              `Welcome, ${currentUser.fullName || currentEmployeeName}`,
              `\u062e\u0648\u0634 \u0622\u0645\u062f\u06cc\u062f\u060c ${currentUser.fullName || currentEmployeeName}`,
              `\u069a\u0647 \u0631\u0627\u063a\u0644\u0627\u0633\u062a\u060c ${currentUser.fullName || currentEmployeeName}`
            )}
          </h1>

          <p>
            {tx(
              "Your private dashboard and customer records.",
              "\u062f\u0627\u0634\u0628\u0648\u0631\u062f \u062e\u0635\u0648\u0635\u06cc \u0648 \u0631\u06cc\u06a9\u0627\u0631\u062f\u0647\u0627\u06cc \u0645\u0634\u062a\u0631\u06cc\u0627\u0646 \u0634\u0645\u0627.",
              "\u0633\u062a\u0627\u0633\u0648 \u0634\u062e\u0635\u064a \u0689\u0634\u0628\u0648\u0631\u0689 \u0627\u0648 \u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u0648 \u0631\u06cc\u06a9\u0627\u0631\u0689\u0648\u0646\u0647."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
        >
          <Plus size={17} />
          {mode === "media"
            ? tx(
                "Add Media Production Customer",
                "\u062b\u0628\u062a \u0645\u0634\u062a\u0631\u06cc \u062a\u0648\u0644\u06cc\u062f \u0631\u0633\u0627\u0646\u0647",
                "\u062f \u0631\u0633\u0646\u06cc\u0648 \u062a\u0648\u0644\u06cc\u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u06cc \u062b\u0628\u062a"
              )
            : tx(
                `Add ${modeTitle} Customer`,
                `\u062b\u0628\u062a \u0645\u0634\u062a\u0631\u06cc ${modeTitle}`,
                `\u062f ${modeTitle} \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u06cc \u062b\u0628\u062a`
              )}
        </button>
      </header>

      {departmentModes.length > 1 && (
        <nav
          className="employee-workspace-tabs"
          aria-label={tx(
            "Department forms",
            "\u0641\u0648\u0631\u0645\u200c\u0647\u0627\u06cc \u062f\u06cc\u067e\u0627\u0631\u062a\u0645\u0646\u062a",
            "\u062f \u0689\u06cc\u067e\u0627\u0631\u067c\u0645\u0646\u067c \u0641\u0648\u0631\u0645\u0648\u0646\u0647"
          )}
        >
          {departmentModes.map((departmentMode) => (
            <button
              key={departmentMode}
              type="button"
              className={
                departmentMode === mode
                  ? "active"
                  : ""
              }
              onClick={() =>
                switchDepartmentMode(
                  departmentMode
                )
              }
            >
              {tx(
                `${modeLabel(departmentMode)} Form`,
                `\u0641\u0648\u0631\u0645 ${modeLabel(departmentMode)}`,
                `\u062f ${modeLabel(departmentMode)} \u0641\u0648\u0631\u0645`
              )}
            </button>
          ))}
        </nav>
      )}

      <section className="employee-dashboard-cards">
        <div>
          <Users />
          <span>
            {tx(
              "Total Customers",
              "\u0645\u062c\u0645\u0648\u0639 \u0645\u0634\u062a\u0631\u06cc\u0627\u0646",
              "\u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u0648 \u0645\u062c\u0645\u0648\u0639"
            )}
          </span>
          <strong>{mine.length}</strong>
        </div>

        <div>
          <WalletCards />
          <span>
            {tx(
              "Total Income",
              "\u0645\u062c\u0645\u0648\u0639 \u0639\u0648\u0627\u06cc\u062f",
              "\u062f \u0639\u0648\u0627\u06cc\u062f\u0648 \u0645\u062c\u0645\u0648\u0639"
            )}
          </span>
          <strong>
            {income.toLocaleString()} AFN
          </strong>
        </div>

        <div>
          <Gift />
          <span>
            {tx(
              "Bonus and Penalty",
              "\u0627\u0645\u062a\u06cc\u0627\u0632 \u0648 \u062c\u0631\u06cc\u0645\u0647",
              "\u0627\u0645\u062a\u06cc\u0627\u0632 \u0627\u0648 \u062c\u0631\u06cc\u0645\u0647"
            )}
          </span>
          <strong>
            {bonus.toLocaleString()} AFN
          </strong>
        </div>
      </section>

      <section className="employee-dashboard-list">
        <div className="employee-dashboard-list-head">
          <div>
            <h2>
              {tx(
                "My Customers",
                "\u0645\u0634\u062a\u0631\u06cc\u0627\u0646 \u0645\u0646",
                "\u0632\u0645\u0627 \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a"
              )}
            </h2>
            <p>
              {tx(
                "Every record is linked to your employee profile.",
                "\u0647\u0631 \u0631\u06cc\u06a9\u0627\u0631\u062f \u0628\u0647 \u067e\u0631\u0648\u0641\u0627\u06cc\u0644 \u06a9\u0627\u0631\u0645\u0646\u062f\u06cc \u0634\u0645\u0627 \u0648\u0635\u0644 \u0627\u0633\u062a.",
                "\u0647\u0631 \u0631\u06cc\u06a9\u0627\u0631\u0689 \u0633\u062a\u0627\u0633\u0648 \u062f \u06a9\u0627\u0631\u06a9\u0648\u0648\u0646\u06a9\u064a \u067e\u0631\u0648\u0641\u0627\u06cc\u0644 \u0633\u0631\u0647 \u062a\u0693\u0644\u06cc \u062f\u06cc."
              )}
            </p>
          </div>

          {mode !== "media" && (
            <label>
              <Filter size={15} />

              <select
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value)
                }
              >
                <option value="all">
                  {tx(
                    "All calls",
                    "\u0647\u0645\u0647 \u062a\u0645\u0627\u0633\u200c\u0647\u0627",
                    "\u067c\u0648\u0644 \u0632\u0646\u06ab\u0648\u0646\u0647"
                  )}
                </option>

                <option value="incoming">
                  {tx(
                    "Incoming",
                    "\u0648\u0627\u0631\u062f\u0647",
                    "\u0631\u0627\u062a\u0644\u0648\u0646\u06a9\u06cc"
                  )}
                </option>

                <option value="outgoing">
                  {tx(
                    "Outgoing",
                    "\u062e\u0627\u0631\u062c\u0647",
                    "\u062a\u0644\u0648\u0646\u06a9\u06cc"
                  )}
                </option>
              </select>
            </label>
          )}
        </div>

        <div className="employee-dashboard-table">
          <table>
            <thead>
              <tr>
                <th>{tx("Full Name", "\u0646\u0627\u0645 \u06a9\u0627\u0645\u0644", "\u0628\u0634\u067e\u0693 \u0646\u0648\u0645")}</th>
                <th>{tx("Phone", "\u062a\u0645\u0627\u0633", "\u062a\u0644\u06cc\u0641\u0648\u0646")}</th>
                <th>{tx("City", "\u0634\u0647\u0631", "\u069a\u0627\u0631")}</th>

                {(mode === "consultant" ||
                  mode === "travel") && (
                  <th>{tx("Country", "\u06a9\u0634\u0648\u0631", "\u0647\u06d0\u0648\u0627\u062f")}</th>
                )}

                {mode === "consultant" && (
                  <th>{tx("Scholarship", "\u0628\u0648\u0631\u0633\u06cc\u0647", "\u0628\u0648\u0631\u0633")}</th>
                )}

                <th>{tx("Unit", "\u0648\u0627\u062d\u062f", "\u0648\u0627\u062d\u062f")}</th>
                <th>{tx("Price", "\u0642\u06cc\u0645\u062a", "\u0628\u06cc\u0647")}</th>

                {mode !== "media" && (
                  <th>{tx("Call Type", "\u0646\u0648\u0639 \u062a\u0645\u0627\u0633", "\u062f \u0632\u0646\u06ab \u0689\u0648\u0644")}</th>
                )}

                <th>{tx("Purpose", "\u0647\u062f\u0641", "\u0645\u0648\u062e\u0647")}</th>

                {mode !== "media" && (
                  <th>{tx("Follow-up", "\u067e\u06cc\u06af\u06cc\u0631\u06cc", "\u062a\u0639\u0642\u06cc\u0628")}</th>
                )}

                <th>{tx("Date & Time", "\u062a\u0627\u0631\u06cc\u062e \u0648 \u0632\u0645\u0627\u0646", "\u0646\u06d0\u067c\u0647 \u0627\u0648 \u0648\u062e\u062a")}</th>
                <th>{tx("Actions", "\u0639\u0645\u0644\u06cc\u0627\u062a", "\u0639\u0645\u0644\u0648\u0646\u0647")}</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>
                      {customer.fullName ||
                        customer.customerName ||
                        "-"}
                    </strong>
                  </td>

                  <td>
                    {customer.phone || "-"}
                  </td>

                  <td>
                    {customer.city || "-"}
                  </td>

                  {(mode === "consultant" ||
                    mode === "travel") && (
                    <td>
                      {customer.country ? (
                        <span className="employee-table-country">
                          <img
                            src={getCountryFlagUrl(
                              customer.country
                            )}
                            alt=""
                          />

                          <span>
                            {customer.country}
                          </span>
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                  )}

                  {mode === "consultant" && (
                    <td>
                      {customer.scholarshipType ||
                        "-"}
                    </td>
                  )}

                  <td>
                    {customer.currencyUnit ||
                      customer.unit ||
                      "AFN"}
                  </td>

                  <td>
                    {Number(customer.price || 0)
                      ? Number(
                          customer.price
                        ).toLocaleString("en-US")
                      : "-"}
                  </td>

                  {mode !== "media" && (
                    <td>
                      {callTypeLabel(customer.callType)}
                    </td>
                  )}

                  <td className="employee-purpose-cell">
                    <span
                      title={
                        mode === "technology"
                          ? customer.technologyPurpose ||
                            "-"
                          : customer.purpose || "-"
                      }
                    >
                      {mode === "technology"
                        ? customer.technologyPurpose ||
                          "-"
                        : customer.purpose || "-"}
                    </span>
                  </td>

                  {mode !== "media" && (
                    <td>
                      {yesNoLabel(customer.needFollowup)}
                    </td>
                  )}

                  <td>
                    <div className="employee-table-datetime">
                      <strong>
                        {customer.afghanistanDate ||
                          customer.date ||
                          "-"}
                      </strong>

                      <span>
                        {customer.afghanistanTime ||
                          customer.time ||
                          "-"}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className="employee-record-actions">
                      <button
                        type="button"
                        className="edit"
                        onClick={() =>
                          openEditModal(customer)
                        }
                        title={tx(
                          "Edit customer",
                          "\u0648\u06cc\u0631\u0627\u06cc\u0634 \u0645\u0634\u062a\u0631\u06cc",
                          "\u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a \u0633\u0645\u0648\u0644"
                        )}
                        aria-label={tx(
                          "Edit customer",
                          "\u0648\u06cc\u0631\u0627\u06cc\u0634 \u0645\u0634\u062a\u0631\u06cc",
                          "\u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a \u0633\u0645\u0648\u0644"
                        )}
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        className="delete"
                        onClick={() =>
                          requestDelete(customer)
                        }
                        title={tx(
                          "Delete customer",
                          "\u062d\u0630\u0641 \u0645\u0634\u062a\u0631\u06cc",
                          "\u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a \u062d\u0630\u0641\u0648\u0644"
                        )}
                        aria-label={tx(
                          "Delete customer",
                          "\u062d\u0630\u0641 \u0645\u0634\u062a\u0631\u06cc",
                          "\u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a \u062d\u0630\u0641\u0648\u0644"
                        )}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filtered.length && (
                <tr>
                  <td
                    colSpan={tableColumnCount}
                    className="employee-empty-record"
                  >
                    {tx(
                      "No customer records yet.",
                      "\u0647\u0646\u0648\u0632 \u0647\u06cc\u0686 \u0631\u06cc\u06a9\u0627\u0631\u062f \u0645\u0634\u062a\u0631\u06cc \u062b\u0628\u062a \u0646\u0634\u062f\u0647 \u0627\u0633\u062a.",
                      "\u062a\u0631 \u0627\u0648\u0633\u0647 \u0647\u06d0\u0685 \u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a \u0631\u06cc\u06a9\u0627\u0631\u0689 \u0646\u0634\u062a\u0647."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {open && (
        <div
          className="employee-dashboard-modal"
          onMouseDown={closeCustomerModal}
        >
          <form
            onSubmit={save}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header>
              <div>
                <h2>{modalTitle}</h2>

                <p>
                  {editId
                    ? tx(
                        "Update the customer information.",
                        "\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0645\u0634\u062a\u0631\u06cc \u0631\u0627 \u0628\u0647\u200c\u0631\u0648\u0632 \u06a9\u0646\u06cc\u062f.",
                        "\u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a \u0645\u0639\u0644\u0648\u0645\u0627\u062a \u062a\u0627\u0632\u0647 \u06a9\u0693\u0626."
                      )
                    : tx(
                        `This record will also appear in the general ${modeTitle} customer list.`,
                        `\u0627\u06cc\u0646 \u0631\u06cc\u06a9\u0627\u0631\u062f \u062f\u0631 \u0644\u0633\u062a \u0639\u0645\u0648\u0645\u06cc \u0645\u0634\u062a\u0631\u06cc\u0627\u0646 ${modeTitle} \u0646\u06cc\u0632 \u0646\u0645\u0627\u06cc\u0634 \u062f\u0627\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f.`,
                        `\u062f\u0627 \u0631\u06cc\u06a9\u0627\u0631\u0689 \u0628\u0647 \u062f ${modeTitle} \u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u0648 \u067e\u0647 \u0639\u0645\u0648\u0645\u064a \u0644\u06cc\u0633\u062a \u06a9\u06d0 \u0647\u0645 \u0685\u0631\u06ab\u0646\u062f \u0634\u064a.`
                      )}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCustomerModal}
              >
                <X />
              </button>
            </header>

            <div className="employee-customer-grid">
              {mode === "consultant" && (
                <div className="employee-visa-package-section wide">
                  <label className="employee-package-select-field">
                    {tx("Visa Package", "\u067e\u06a9\u06cc\u062c \u0648\u06cc\u0632\u0647", "\u062f \u0648\u06cc\u0632\u06d0 \u067e\u06a9\u06cc\u062c")}

                    <select
                      name="selectedVisaPackageId"
                      value={form.selectedVisaPackageId}
                      onChange={update}
                    >
                      <option value="">
                        {tx(
                          "Select registered visa package",
                          "\u067e\u06a9\u06cc\u062c \u0648\u06cc\u0632\u0647 \u062b\u0628\u062a\u200c\u0634\u062f\u0647 \u0631\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f",
                          "\u062b\u0628\u062a \u0634\u0648\u06cc \u062f \u0648\u06cc\u0632\u06d0 \u067e\u06a9\u06cc\u062c \u0648\u067c\u0627\u06a9\u0626"
                        )}
                      </option>

                      {availableVisaPackages.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.packageName}
                        </option>
                      ))}
                    </select>
                  </label>

                  {!visaPackagesLoaded && (
                    <p className="employee-package-empty-note">
                      {tx("Loading Visa Packages...", "\u067e\u06a9\u06cc\u062c\u200c\u0647\u0627\u06cc \u0648\u06cc\u0632\u0647 \u062f\u0631 \u062d\u0627\u0644 \u0628\u0627\u0631\u06af\u06cc\u0631\u06cc \u0627\u0633\u062a...", "\u062f \u0648\u06cc\u0632\u06d0 \u067e\u06a9\u06cc\u062c\u0648\u0646\u0647 \u0628\u0627\u0631\u06d0\u0696\u064a...")}
                    </p>
                  )}

                  {visaPackagesLoaded &&
                    !availableVisaPackages.length && (
                      <p className="employee-package-empty-note">
                        {tx("No available Visa Packages found.", "\u0647\u06cc\u0686 \u067e\u06a9\u06cc\u062c \u0648\u06cc\u0632\u0647 \u062f\u0631 \u062f\u0633\u062a\u0631\u0633 \u06cc\u0627\u0641\u062a \u0646\u0634\u062f.", "\u0647\u06d0\u0685 \u0634\u062a\u0647 \u062f \u0648\u06cc\u0632\u06d0 \u067e\u06a9\u06cc\u062c \u0648\u0646\u0647 \u0645\u0648\u0646\u062f\u0644 \u0634\u0648.")}
                      </p>
                    )}

                  {selectedVisaPackage && (
                    <section className="employee-package-preview">
                      <header>
                        <div>
                          <span>{tx("Selected Visa Package", "\u067e\u06a9\u06cc\u062c \u0648\u06cc\u0632\u0647 \u0627\u0646\u062a\u062e\u0627\u0628\u200c\u0634\u062f\u0647", "\u067c\u0627\u06a9\u0644 \u0634\u0648\u06cc \u062f \u0648\u06cc\u0632\u06d0 \u067e\u06a9\u06cc\u062c")}</span>
                          <h3>
                            {selectedVisaPackage.packageName}
                          </h3>
                        </div>

                        <strong>
                          {Number(
                            selectedVisaPackage.sellingPrice || 0
                          ).toLocaleString()} {selectedVisaPackage.currency || "AFN"}
                        </strong>
                      </header>

                      <div className="employee-package-preview-grid">
                        <div>
                          <span>{tx("Country", "\u06a9\u0634\u0648\u0631", "\u0647\u06d0\u0648\u0627\u062f")}</span>
                          <strong>
                            {selectedVisaPackage.country || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>{tx("Category", "\u06a9\u062a\u06af\u0648\u0631\u06cc", "\u06a9\u067c\u06ab\u0648\u0631\u064a")}</span>
                          <strong>
                            {selectedVisaPackage.category || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>{tx("Start Date", "\u062a\u0627\u0631\u06cc\u062e \u0634\u0631\u0648\u0639", "\u062f \u067e\u06cc\u0644 \u0646\u06d0\u067c\u0647")}</span>
                          <strong>
                            {selectedVisaPackage.startDate || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>{tx("End Date", "\u062a\u0627\u0631\u06cc\u062e \u062e\u062a\u0645", "\u062f \u067e\u0627\u06cc \u0646\u06d0\u067c\u0647")}</span>
                          <strong>
                            {selectedVisaPackage.endDate || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>{tx("Bank Statement", "\u0627\u0633\u062a\u06cc\u062a\u0645\u0646\u062a \u0628\u0627\u0646\u06a9", "\u062f \u0628\u0627\u0646\u06a9 \u0627\u0633\u067c\u06cc\u067c\u0645\u0646\u067c")}</span>
                          <strong>
                            {selectedVisaPackage.bankStatementRequired === "Yes"
                              ? `${Number(
                                  selectedVisaPackage.bankStatementAmount || 0
                                ).toLocaleString()} ${selectedVisaPackage.currency || "AFN"}`
                              : tx("Not Required", "\u0636\u0631\u0648\u0631\u062a \u0646\u062f\u0627\u0631\u062f", "\u0627\u0693\u062a\u06cc\u0627 \u0646\u0634\u062a\u0647")}
                          </strong>
                        </div>

                        <div>
                          <span>{tx("Documentation", "\u0627\u0633\u0646\u0627\u062f", "\u0627\u0633\u0646\u0627\u062f")}</span>
                          <strong>
                            {selectedVisaPackage.documentationRequired === "Yes"
                              ? (selectedVisaPackage.documents || []).join(", ") ||
                                tx("Required", "\u0636\u0631\u0648\u0631\u06cc", "\u0627\u0693\u06cc\u0646")
                              : tx("Not Required", "\u0636\u0631\u0648\u0631\u062a \u0646\u062f\u0627\u0631\u062f", "\u0627\u0693\u062a\u06cc\u0627 \u0646\u0634\u062a\u0647")}
                          </strong>
                        </div>
                      </div>

                      {selectedVisaPackage.note && (
                        <div className="employee-package-preview-note">
                          <span>{tx("Package Note", "\u06cc\u0627\u062f\u062f\u0627\u0634\u062a \u067e\u06a9\u06cc\u062c", "\u062f \u067e\u06a9\u06cc\u062c \u06cc\u0627\u062f\u069a\u062a")}</span>
                          <p>{selectedVisaPackage.note}</p>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              )}

              {mode === "travel" && (
                <div className="employee-visa-package-section wide">
                  <label className="employee-package-select-field">
                    {tx("Travel Package", "\u067e\u06a9\u06cc\u062c \u0633\u0641\u0631", "\u062f \u0633\u0641\u0631 \u067e\u06a9\u06cc\u062c")}

                    <select
                      name="selectedTravelPackageId"
                      value={form.selectedTravelPackageId}
                      onChange={update}
                    >
                      <option value="">
                        {tx("Select registered travel package", "\u067e\u06a9\u06cc\u062c \u0633\u0641\u0631 \u062b\u0628\u062a\u200c\u0634\u062f\u0647 \u0631\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f", "\u062b\u0628\u062a \u0634\u0648\u06cc \u062f \u0633\u0641\u0631 \u067e\u06a9\u06cc\u062c \u0648\u067c\u0627\u06a9\u0626")}
                      </option>

                      {availableTravelPackages.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.packageName}
                        </option>
                      ))}
                    </select>
                  </label>

                  {!travelPackagesLoaded && (
                    <p className="employee-package-empty-note">
                      {tx("Loading Travel Packages...", "\u067e\u06a9\u06cc\u062c\u200c\u0647\u0627\u06cc \u0633\u0641\u0631 \u062f\u0631 \u062d\u0627\u0644 \u0628\u0627\u0631\u06af\u06cc\u0631\u06cc \u0627\u0633\u062a...", "\u062f \u0633\u0641\u0631 \u067e\u06a9\u06cc\u062c\u0648\u0646\u0647 \u0628\u0627\u0631\u06d0\u0696\u064a...")}
                    </p>
                  )}

                  {travelPackagesLoaded &&
                    !availableTravelPackages.length && (
                      <p className="employee-package-empty-note">
                        {tx("No available Travel Packages found.", "\u0647\u06cc\u0686 \u067e\u06a9\u06cc\u062c \u0633\u0641\u0631 \u062f\u0631 \u062f\u0633\u062a\u0631\u0633 \u06cc\u0627\u0641\u062a \u0646\u0634\u062f.", "\u0647\u06d0\u0685 \u0634\u062a\u0647 \u062f \u0633\u0641\u0631 \u067e\u06a9\u06cc\u062c \u0648\u0646\u0647 \u0645\u0648\u0646\u062f\u0644 \u0634\u0648.")}
                      </p>
                    )}

                  {selectedTravelPackage && (
                    <section className="employee-package-preview">
                      <header>
                        <div>
                          <span>{tx("Selected Travel Package", "\u067e\u06a9\u06cc\u062c \u0633\u0641\u0631 \u0627\u0646\u062a\u062e\u0627\u0628\u200c\u0634\u062f\u0647", "\u067c\u0627\u06a9\u0644 \u0634\u0648\u06cc \u062f \u0633\u0641\u0631 \u067e\u06a9\u06cc\u062c")}</span>

                          <h3>
                            {selectedTravelPackage.packageName}
                          </h3>
                        </div>

                        <strong>
                          {Number(
                            selectedTravelPackage.sellingPrice || 0
                          ).toLocaleString()} {selectedTravelPackage.currency || "AFN"}
                        </strong>
                      </header>

                      <div className="employee-package-preview-grid">
                        <div>
                          <span>{tx("Country", "\u06a9\u0634\u0648\u0631", "\u0647\u06d0\u0648\u0627\u062f")}</span>

                          <strong>
                            {selectedTravelPackage.country || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>{tx("Category", "\u06a9\u062a\u06af\u0648\u0631\u06cc", "\u06a9\u067c\u06ab\u0648\u0631\u064a")}</span>

                          <strong>
                            {selectedTravelPackage.category || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>{tx("Start Date", "\u062a\u0627\u0631\u06cc\u062e \u0634\u0631\u0648\u0639", "\u062f \u067e\u06cc\u0644 \u0646\u06d0\u067c\u0647")}</span>

                          <strong>
                            {selectedTravelPackage.startDate || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>{tx("End Date", "\u062a\u0627\u0631\u06cc\u062e \u062e\u062a\u0645", "\u062f \u067e\u0627\u06cc \u0646\u06d0\u067c\u0647")}</span>

                          <strong>
                            {selectedTravelPackage.endDate || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>{tx("Bank Statement", "\u0627\u0633\u062a\u06cc\u062a\u0645\u0646\u062a \u0628\u0627\u0646\u06a9", "\u062f \u0628\u0627\u0646\u06a9 \u0627\u0633\u067c\u06cc\u067c\u0645\u0646\u067c")}</span>

                          <strong>
                            {selectedTravelPackage.bankStatementRequired ===
                            "Yes"
                              ? `${Number(
                                  selectedTravelPackage.bankStatementAmount ||
                                    0
                                ).toLocaleString()} ${selectedTravelPackage.currency || "AFN"}`
                              : tx("Not Required", "\u0636\u0631\u0648\u0631\u062a \u0646\u062f\u0627\u0631\u062f", "\u0627\u0693\u062a\u06cc\u0627 \u0646\u0634\u062a\u0647")}
                          </strong>
                        </div>
                      </div>

                      {selectedTravelPackage.note && (
                        <div className="employee-package-preview-note">
                          <span>{tx("Package Note", "\u06cc\u0627\u062f\u062f\u0627\u0634\u062a \u067e\u06a9\u06cc\u062c", "\u062f \u067e\u06a9\u06cc\u062c \u06cc\u0627\u062f\u069a\u062a")}</span>

                          <p>
                            {selectedTravelPackage.note}
                          </p>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              )}

              {mode === "technology" && (
                <div className="employee-visa-package-section wide">
                  <label className="employee-package-select-field">
                    {tx("Technology Package", "\u067e\u06a9\u06cc\u062c \u062a\u06a9\u0646\u0627\u0644\u0648\u0698\u06cc", "\u062f \u067c\u06a9\u0646\u0627\u0644\u0648\u0698\u06d0 \u067e\u06a9\u06cc\u062c")}

                    <select
                      name="selectedTechnologyPackageId"
                      value={form.selectedTechnologyPackageId}
                      onChange={update}
                    >
                      <option value="">
                        {tx("Select registered technology package", "\u067e\u06a9\u06cc\u062c \u062a\u06a9\u0646\u0627\u0644\u0648\u0698\u06cc \u062b\u0628\u062a\u200c\u0634\u062f\u0647 \u0631\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f", "\u062b\u0628\u062a \u0634\u0648\u06cc \u062f \u067c\u06a9\u0646\u0627\u0644\u0648\u0698\u06d0 \u067e\u06a9\u06cc\u062c \u0648\u067c\u0627\u06a9\u0626")}
                      </option>

                      {technologyPackages.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.packageName}
                        </option>
                      ))}
                    </select>
                  </label>

                  {!technologyPackagesLoaded && (
                    <p className="employee-package-empty-note">
                      {tx("Loading Technology Packages...", "\u067e\u06a9\u06cc\u062c\u200c\u0647\u0627\u06cc \u062a\u06a9\u0646\u0627\u0644\u0648\u0698\u06cc \u062f\u0631 \u062d\u0627\u0644 \u0628\u0627\u0631\u06af\u06cc\u0631\u06cc \u0627\u0633\u062a...", "\u062f \u067c\u06a9\u0646\u0627\u0644\u0648\u0698\u06d0 \u067e\u06a9\u06cc\u062c\u0648\u0646\u0647 \u0628\u0627\u0631\u06d0\u0696\u064a...")}
                    </p>
                  )}

                  {technologyPackagesLoaded &&
                    !technologyPackages.length && (
                      <p className="employee-package-empty-note">
                        {tx("No Technology Packages have been registered yet.", "\u0647\u0646\u0648\u0632 \u0647\u06cc\u0686 \u067e\u06a9\u06cc\u062c \u062a\u06a9\u0646\u0627\u0644\u0648\u0698\u06cc \u062b\u0628\u062a \u0646\u0634\u062f\u0647 \u0627\u0633\u062a.", "\u062a\u0631 \u0627\u0648\u0633\u0647 \u0647\u06d0\u0685 \u062f \u067c\u06a9\u0646\u0627\u0644\u0648\u0698\u06d0 \u067e\u06a9\u06cc\u062c \u0646\u0647 \u062f\u06cc \u062b\u0628\u062a \u0634\u0648\u06cc.")}
                      </p>
                    )}

                  {selectedTechnologyPackage && (
                    <section className="employee-package-preview">
                      <header>
                        <div>
                          <span>{tx("Selected Technology Package", "\u067e\u06a9\u06cc\u062c \u062a\u06a9\u0646\u0627\u0644\u0648\u0698\u06cc \u0627\u0646\u062a\u062e\u0627\u0628\u200c\u0634\u062f\u0647", "\u067c\u0627\u06a9\u0644 \u0634\u0648\u06cc \u062f \u067c\u06a9\u0646\u0627\u0644\u0648\u0698\u06d0 \u067e\u06a9\u06cc\u062c")}</span>

                          <h3>
                            {selectedTechnologyPackage.packageName}
                          </h3>
                        </div>

                        <strong>
                          {Number(
                            selectedTechnologyPackage.sellingPrice || 0
                          ).toLocaleString()} AFN
                        </strong>
                      </header>

                      {selectedTechnologyPackage.note && (
                        <div className="employee-package-preview-note">
                          <span>{tx("Package Note", "\u06cc\u0627\u062f\u062f\u0627\u0634\u062a \u067e\u06a9\u06cc\u062c", "\u062f \u067e\u06a9\u06cc\u062c \u06cc\u0627\u062f\u069a\u062a")}</span>
                          <p>{selectedTechnologyPackage.note}</p>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              )}

              {mode === "media" && (
                <div className="employee-visa-package-section wide">
                  <label className="employee-package-select-field">
                    {tx("Media Package", "\u067e\u06a9\u06cc\u062c \u0631\u0633\u0627\u0646\u0647", "\u062f \u0631\u0633\u0646\u06cc\u0648 \u067e\u06a9\u06cc\u062c")}

                    <select
                      name="selectedMediaPackageId"
                      value={form.selectedMediaPackageId}
                      onChange={update}
                    >
                      <option value="">
                        {tx("Select registered media package", "\u067e\u06a9\u06cc\u062c \u0631\u0633\u0627\u0646\u0647 \u062b\u0628\u062a\u200c\u0634\u062f\u0647 \u0631\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f", "\u062b\u0628\u062a \u0634\u0648\u06cc \u062f \u0631\u0633\u0646\u06cc\u0648 \u067e\u06a9\u06cc\u062c \u0648\u067c\u0627\u06a9\u0626")}
                      </option>

                      {mediaPackages.map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.packageName}
                        </option>
                      ))}
                    </select>
                  </label>

                  {!mediaPackagesLoaded && (
                    <p className="employee-package-empty-note">
                      {tx("Loading Media Packages...", "\u067e\u06a9\u06cc\u062c\u200c\u0647\u0627\u06cc \u0631\u0633\u0627\u0646\u0647 \u062f\u0631 \u062d\u0627\u0644 \u0628\u0627\u0631\u06af\u06cc\u0631\u06cc \u0627\u0633\u062a...", "\u062f \u0631\u0633\u0646\u06cc\u0648 \u067e\u06a9\u06cc\u062c\u0648\u0646\u0647 \u0628\u0627\u0631\u06d0\u0696\u064a...")}
                    </p>
                  )}

                  {mediaPackagesLoaded &&
                    !mediaPackages.length && (
                      <p className="employee-package-empty-note">
                        {tx("No Media Packages have been registered yet.", "\u0647\u0646\u0648\u0632 \u0647\u06cc\u0686 \u067e\u06a9\u06cc\u062c \u0631\u0633\u0627\u0646\u0647 \u062b\u0628\u062a \u0646\u0634\u062f\u0647 \u0627\u0633\u062a.", "\u062a\u0631 \u0627\u0648\u0633\u0647 \u0647\u06d0\u0685 \u062f \u0631\u0633\u0646\u06cc\u0648 \u067e\u06a9\u06cc\u062c \u0646\u0647 \u062f\u06cc \u062b\u0628\u062a \u0634\u0648\u06cc.")}
                      </p>
                    )}

                  {selectedMediaPackage && (
                    <section className="employee-package-preview">
                      <header>
                        <div>
                          <span>{tx("Selected Media Package", "\u067e\u06a9\u06cc\u062c \u0631\u0633\u0627\u0646\u0647 \u0627\u0646\u062a\u062e\u0627\u0628\u200c\u0634\u062f\u0647", "\u067c\u0627\u06a9\u0644 \u0634\u0648\u06cc \u062f \u0631\u0633\u0646\u06cc\u0648 \u067e\u06a9\u06cc\u062c")}</span>

                          <h3>
                            {selectedMediaPackage.packageName}
                          </h3>
                        </div>

                        <strong>
                          {Number(
                            selectedMediaPackage.sellingPrice || 0
                          ).toLocaleString()} AFN
                        </strong>
                      </header>

                      <div className="employee-package-preview-grid">
                        <div>
                          <span>{tx("Country", "\u06a9\u0634\u0648\u0631", "\u0647\u06d0\u0648\u0627\u062f")}</span>
                          <strong>
                            {selectedMediaPackage.country || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>{tx("Category", "\u06a9\u062a\u06af\u0648\u0631\u06cc", "\u06a9\u067c\u06ab\u0648\u0631\u064a")}</span>
                          <strong>
                            {selectedMediaPackage.category || "-"}
                          </strong>
                        </div>
                      </div>

                      {selectedMediaPackage.note && (
                        <div className="employee-package-preview-note">
                          <span>{tx("Package Note", "\u06cc\u0627\u062f\u062f\u0627\u0634\u062a \u067e\u06a9\u06cc\u062c", "\u062f \u067e\u06a9\u06cc\u062c \u06cc\u0627\u062f\u069a\u062a")}</span>
                          <p>{selectedMediaPackage.note}</p>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              )}

              <label>
                {tx("Full Name", "\u0646\u0627\u0645 \u06a9\u0627\u0645\u0644", "\u0628\u0634\u067e\u0693 \u0646\u0648\u0645")}

                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={update}
                />
              </label>

              <label>
                {tx("Phone Number", "\u0646\u0645\u0628\u0631 \u062a\u0645\u0627\u0633", "\u062f \u062a\u0644\u06cc\u0641\u0648\u0646 \u0634\u0645\u06d0\u0631\u0647")}

                <input
                  name="phone"
                  value={form.phone}
                  onChange={update}
                />
              </label>

              {(mode === "technology" ||
                mode === "media") && (
                <label>
                  {tx("Business Type", "\u0646\u0648\u0639 \u062a\u062c\u0627\u0631\u062a", "\u062f \u0633\u0648\u062f\u0627\u06ab\u0631\u06cd \u0689\u0648\u0644")}

                  <input
                    name="businessType"
                    value={form.businessType}
                    onChange={update}
                    placeholder={tx("Enter business type", "\u0646\u0648\u0639 \u062a\u062c\u0627\u0631\u062a \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f", "\u062f \u0633\u0648\u062f\u0627\u06ab\u0631\u06cd \u0689\u0648\u0644 \u0648\u0644\u06cc\u06a9\u0626")}
                  />
                </label>
              )}

              <label>
                {tx("City / Province", "\u0634\u0647\u0631 / \u0648\u0644\u0627\u06cc\u062a", "\u069a\u0627\u0631 / \u0648\u0644\u0627\u06cc\u062a")}

                <select
                  name="city"
                  value={form.city}
                  onChange={update}
                >
                  <option value="">
                    {tx("Select province", "\u0648\u0644\u0627\u06cc\u062a \u0631\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f", "\u0648\u0644\u0627\u06cc\u062a \u0648\u067c\u0627\u06a9\u0626")}
                  </option>

                  {provinces.map((province) => (
                    <option
                      key={province}
                      value={province}
                    >
                      {province}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {tx("Language", "\u0632\u0628\u0627\u0646", "\u0698\u0628\u0647")}

                <select
                  name="language"
                  value={form.language}
                  onChange={update}
                >
                  <option value="Dari">
                    {tx("Dari", "\u062f\u0631\u06cc", "\u062f\u0631\u064a")}
                  </option>
                  <option value="Pashto">
                    {tx("Pashto", "\u067e\u0634\u062a\u0648", "\u067e\u069a\u062a\u0648")}
                  </option>
                  <option value="English">
                    {tx("English", "\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc", "\u0627\u0646\u06ab\u0644\u06cc\u0633\u064a")}
                  </option>
                  <option value="Other">
                    {tx("Other", "\u062f\u06cc\u06af\u0631", "\u0628\u0644")}
                  </option>
                </select>
              </label>

              {mode !== "media" && (
                <label>
                  {tx("Call Type", "\u0646\u0648\u0639 \u062a\u0645\u0627\u0633", "\u062f \u0632\u0646\u06ab \u0689\u0648\u0644")}

                  <select
                    name="callType"
                    value={form.callType}
                    onChange={update}
                  >
                    <option value="Incoming">{tx("Incoming", "\u0648\u0627\u0631\u062f\u0647", "\u0631\u0627\u062a\u0644\u0648\u0646\u06a9\u06cc")}</option>
                    <option value="Outgoing">{tx("Outgoing", "\u062e\u0627\u0631\u062c\u0647", "\u062a\u0644\u0648\u0646\u06a9\u06cc")}</option>
                  </select>
                </label>
              )}

              <label>
                {tx("Unit", "\u0648\u0627\u062d\u062f", "\u0648\u0627\u062d\u062f")}

                <select
                  name="currencyUnit"
                  value={form.currencyUnit}
                  onChange={update}
                >
                  <option value="AFN">
                    AFN - {tx("Afghani", "\u0627\u0641\u063a\u0627\u0646\u06cc", "\u0627\u0641\u063a\u0627\u0646\u06cd")}
                  </option>

                  <option value="USD">
                    USD - {tx("Dollar", "\u062f\u0627\u0644\u0631", "\u0689\u0627\u0644\u0631")}
                  </option>
                </select>
              </label>

              <label>
                {tx("Price", "\u0642\u06cc\u0645\u062a", "\u0628\u06cc\u0647")}

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="price"
                  value={
                    mode === "travel" && selectedTravelPackage
                      ? selectedTravelPackage.sellingPrice || ""
                      : mode === "technology" &&
                          selectedTechnologyPackage
                        ? selectedTechnologyPackage.sellingPrice || ""
                        : mode === "media" &&
                            selectedMediaPackage
                          ? selectedMediaPackage.sellingPrice || ""
                          : form.price
                  }
                  onChange={update}
                  readOnly={
                    (mode === "travel" &&
                      Boolean(selectedTravelPackage)) ||
                    (mode === "technology" &&
                      Boolean(selectedTechnologyPackage)) ||
                    (mode === "media" &&
                      Boolean(selectedMediaPackage))
                  }
                  placeholder={tx("Enter price", "\u0642\u06cc\u0645\u062a \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f", "\u0628\u06cc\u0647 \u0648\u0644\u06cc\u06a9\u0626")}
                />
              </label>

              {mode === "consultant" && (
                <label>
                  {tx("Scholarship Type", "\u0646\u0648\u0639 \u0628\u0648\u0631\u0633\u06cc\u0647", "\u062f \u0628\u0648\u0631\u0633 \u0689\u0648\u0644")}

                  <select
                    name="scholarshipType"
                    value={form.scholarshipType}
                    onChange={update}
                  >
                    <option value="">
                      {tx("Select scholarship", "\u0628\u0648\u0631\u0633\u06cc\u0647 \u0631\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f", "\u0628\u0648\u0631\u0633 \u0648\u067c\u0627\u06a9\u0626")}
                    </option>

                    <option value="Fully Funded">
                      {tx("Fully Funded", "\u0641\u0648\u0644 \u0641\u0646\u062f", "\u0628\u0634\u067e\u0693 \u062a\u0645\u0648\u06cc\u0644")}
                    </option>

                    <option value="Partial Funded">
                      {tx("Partial Funded", "\u0642\u0633\u0645\u06cc \u0641\u0646\u062f", "\u0642\u0633\u0645\u064a \u062a\u0645\u0648\u06cc\u0644")}
                    </option>

                    <option value="Private">
                      {tx("Private", "\u062e\u0635\u0648\u0635\u06cc", "\u0634\u062e\u0635\u064a")}
                    </option>
                  </select>
                </label>
              )}

              {mode === "technology" && (
                <label>
                  {tx("Purpose", "\u0647\u062f\u0641", "\u0645\u0648\u062e\u0647")}

                  <select
                    name="technologyPurpose"
                    value={form.technologyPurpose}
                    onChange={update}
                  >
                    <option value="Database">
                      {tx("Database", "\u062f\u06cc\u062a\u0627\u0628\u06cc\u0633", "\u0689\u06cc\u067c\u0627\u0628\u06cc\u0633")}
                    </option>

                    <option value="Web">
                      {tx("Web", "\u0648\u06cc\u0628", "\u0648\u06cc\u0628")}
                    </option>

                    <option value="Application">
                      {tx("Application", "\u0627\u067e\u0644\u06cc\u06a9\u06cc\u0634\u0646", "\u0627\u067e\u0644\u06cc\u06a9\u06cc\u0634\u0646")}
                    </option>
                  </select>
                </label>
              )}

              {mode !== "technology" && (
                <label className="wide">
                  {tx("Purpose", "\u0647\u062f\u0641", "\u0645\u0648\u062e\u0647")}

                  <textarea
                    name="purpose"
                    value={form.purpose}
                    onChange={update}
                    placeholder={tx("Enter customer purpose", "\u0647\u062f\u0641 \u0645\u0634\u062a\u0631\u06cc \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f", "\u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a \u0645\u0648\u062e\u0647 \u0648\u0644\u06cc\u06a9\u0626")}
                  />
                </label>
              )}

              {mode !== "media" && (
                <label className="followup-field wide">
                  {tx("Need Follow-up", "\u0646\u06cc\u0627\u0632 \u0628\u0647 \u067e\u06cc\u06af\u06cc\u0631\u06cc", "\u062a\u0639\u0642\u06cc\u0628 \u062a\u0647 \u0627\u0693\u062a\u06cc\u0627")}

                  <button
                    type="button"
                    role="switch"
                    aria-checked={
                      form.needFollowup === "Yes"
                    }
                    className={`followup-switch ${
                      form.needFollowup === "Yes"
                        ? "on"
                        : "off"
                    }`}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        needFollowup:
                          current.needFollowup === "Yes"
                            ? "No"
                            : "Yes",
                      }))
                    }
                  >
                    <span />

                    <b>
                      {form.needFollowup === "Yes"
                        ? tx("ON", "\u0641\u0639\u0627\u0644", "\u0641\u0639\u0627\u0644")
                        : tx("OFF", "\u063a\u06cc\u0631\u0641\u0639\u0627\u0644", "\u063a\u06cc\u0631 \u0641\u0639\u0627\u0644")}
                    </b>
                  </button>
                </label>
              )}

              {mode !== "media" && (
                <label className="wide">
                  {tx("Note", "\u06cc\u0627\u062f\u062f\u0627\u0634\u062a", "\u06cc\u0627\u062f\u069a\u062a")}

                  <textarea
                    name="note"
                    value={form.note}
                    onChange={update}
                    placeholder={tx("Write additional customer notes...", "\u06cc\u0627\u062f\u062f\u0627\u0634\u062a\u200c\u0647\u0627\u06cc \u0627\u0636\u0627\u0641\u06cc \u0645\u0634\u062a\u0631\u06cc \u0631\u0627 \u0628\u0646\u0648\u06cc\u0633\u06cc\u062f...", "\u062f \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u064a \u0627\u0636\u0627\u0641\u064a \u06cc\u0627\u062f\u069a\u062a\u0648\u0646\u0647 \u0648\u0644\u06cc\u06a9\u0626...")}
                    rows={4}
                  />
                </label>
              )}
            </div>

            <footer>
              <button
                type="button"
                onClick={closeCustomerModal}
              >
                {tx("Cancel", "\u0644\u063a\u0648", "\u0644\u063a\u0648\u0647")}
              </button>

              <button
                type="submit"
                className="primary"
              >
                {editId
                  ? tx("Save Changes", "\u0630\u062e\u06cc\u0631\u0647 \u062a\u063a\u06cc\u06cc\u0631\u0627\u062a", "\u0628\u062f\u0644\u0648\u0646\u0648\u0646\u0647 \u062e\u0648\u0646\u062f\u064a \u06a9\u0693\u0626")
                  : tx("Save Customer", "\u0630\u062e\u06cc\u0631\u0647 \u0645\u0634\u062a\u0631\u06cc", "\u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u06cc \u062e\u0648\u0646\u062f\u064a \u06a9\u0693\u0626")}
              </button>
            </footer>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div
          className="employee-delete-backdrop"
          onMouseDown={() => {
            if (!deleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            className="employee-delete-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="employee-delete-icon">
              <Trash2 size={22} />
            </div>

            <h2>{tx("Delete Customer", "\u062d\u0630\u0641 \u0645\u0634\u062a\u0631\u06cc", "\u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u06cc \u062d\u0630\u0641\u0648\u0644")}</h2>

            <p>
              {tx(
                "Are you sure you want to delete",
                "\u0622\u06cc\u0627 \u0645\u0637\u0645\u0626\u0646 \u0647\u0633\u062a\u06cc\u062f \u06a9\u0647 \u0645\u06cc\u200c\u062e\u0648\u0627\u0647\u06cc\u062f \u062d\u0630\u0641 \u06a9\u0646\u06cc\u062f",
                "\u0627\u06cc\u0627 \u062a\u0627\u0633\u0648 \u0628\u0627\u0648\u0631\u064a \u06cc\u0627\u0633\u062a \u0686\u06d0 \u062d\u0630\u0641\u0648\u0644 \u063a\u0648\u0627\u0693\u0626"
              )}{" "}
              <strong>
                {deleteTarget.fullName ||
                  deleteTarget.customerName ||
                  tx("this customer", "\u0627\u06cc\u0646 \u0645\u0634\u062a\u0631\u06cc", "\u062f\u0627 \u067e\u06d0\u0631\u0648\u062f\u0648\u0646\u06a9\u06cc")}
              </strong>
              ?
            </p>

            <div className="employee-delete-actions">
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteTarget(null)
                }
              >
                {tx("Cancel", "\u0644\u063a\u0648", "\u0644\u063a\u0648\u0647")}
              </button>

              <button
                type="button"
                className="danger"
                disabled={deleting}
                onClick={confirmDelete}
              >
                <Trash2 size={14} />

                {deleting
                  ? tx("Deleting...", "\u062f\u0631 \u062d\u0627\u0644 \u062d\u0630\u0641...", "\u062d\u0630\u0641\u06d0\u0696\u064a...")
                  : tx("Delete", "\u062d\u0630\u0641", "\u062d\u0630\u0641\u0648\u0644")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
