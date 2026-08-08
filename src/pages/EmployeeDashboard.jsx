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
import { useLocalCollection } from "../hooks/useLocalCollection";
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
          <span>Select country</span>
        )}

        <span className="employee-country-arrow">
          ▾
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
            placeholder="Search country..."
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
              <p>No country found.</p>
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

export default function EmployeeDashboard({
  currentUser,
}) {
  const mode = normalizeDepartment(
    currentUser.department
  );

  const currentEmployeeId =
    currentUser.employeeId ||
    currentUser.id ||
    "";

  const currentEmployeeName =
    currentUser.fullName ||
    currentUser.username ||
    currentUser.email ||
    "Employee";

  const [
    serverCustomers,
    setServerCustomers,
    ,
    customersLoaded,
  ] = useJsonCollection("customers");

  const [localCustomers] =
    useLocalCollection("employeeCustomers");

  const [legacyCustomers] =
    useLocalCollection(`${mode}Customers`);

  const [transactions] =
    useJsonCollection("transactions");

  const [adjustments] =
    useLocalCollection("employeeAdjustments");

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
      mode === "travel" &&
      !form.selectedTravelPackageId
    ) {
      notify(
        "Please select a Travel Package.",
        "error"
      );
      return;
    }

    if (
      mode === "technology" &&
      !form.selectedTechnologyPackageId
    ) {
      notify(
        "Please select a Technology Package.",
        "error"
      );
      return;
    }

    if (
      mode === "media" &&
      !form.selectedMediaPackageId
    ) {
      notify(
        "Please select a Media Package.",
        "error"
      );
      return;
    }

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

  const modeTitle = getModeTitle(mode);

  const modalTitle = editId
    ? `Edit ${modeTitle} Customer`
    : mode === "media"
      ? "Add Media Production Customer"
      : `Add ${modeTitle} Customer`;

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
          <span>{mode} workspace</span>

          <h1>
            Welcome, {currentUser.fullName}
          </h1>

          <p>
            Your private dashboard and customer records.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
        >
          <Plus size={17} />
          {mode === "media"
            ? "Add Media Production Customer"
            : `Add ${modeTitle} Customer`}
        </button>
      </header>

      <section className="employee-dashboard-cards">
        <div>
          <Users />
          <span>Total Customers</span>
          <strong>{mine.length}</strong>
        </div>

        <div>
          <WalletCards />
          <span>Total Income</span>
          <strong>
            {income.toLocaleString()} AFN
          </strong>
        </div>

        <div>
          <Gift />
          <span>Bonus and Penalty</span>
          <strong>
            {bonus.toLocaleString()} AFN
          </strong>
        </div>
      </section>

      <section className="employee-dashboard-list">
        <div className="employee-dashboard-list-head">
          <div>
            <h2>My Customers</h2>
            <p>
              Every record is linked to your employee profile.
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
                  All calls
                </option>

                <option value="incoming">
                  Incoming
                </option>

                <option value="outgoing">
                  Outgoing
                </option>
              </select>
            </label>
          )}
        </div>

        <div className="employee-dashboard-table">
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Phone</th>
                <th>City</th>

                {(mode === "consultant" ||
                  mode === "travel") && (
                  <th>Country</th>
                )}

                {mode === "consultant" && (
                  <th>Scholarship</th>
                )}

                <th>Unit</th>
                <th>Price</th>

                {mode !== "media" && (
                  <th>Call Type</th>
                )}

                <th>Purpose</th>

                {mode !== "media" && (
                  <th>Follow-up</th>
                )}

                <th>Date & Time</th>
                <th>Actions</th>
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
                      {customer.callType || "-"}
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
                      {customer.needFollowup ||
                        "-"}
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
                        title="Edit customer"
                        aria-label="Edit customer"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        className="delete"
                        onClick={() =>
                          requestDelete(customer)
                        }
                        title="Delete customer"
                        aria-label="Delete customer"
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
                    No customer records yet.
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
                    ? "Update the customer information."
                    : `This record will also appear in the general ${mode} customer list.`}
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
                    Visa Package

                    <select
                      name="selectedVisaPackageId"
                      value={form.selectedVisaPackageId}
                      onChange={update}
                    >
                      <option value="">
                        Select registered visa package
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
                      Loading Visa Packages...
                    </p>
                  )}

                  {visaPackagesLoaded &&
                    !availableVisaPackages.length && (
                      <p className="employee-package-empty-note">
                        No available Visa Packages found.
                      </p>
                    )}

                  {selectedVisaPackage && (
                    <section className="employee-package-preview">
                      <header>
                        <div>
                          <span>SELECTED VISA PACKAGE</span>
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
                          <span>Country</span>
                          <strong>
                            {selectedVisaPackage.country || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>Category</span>
                          <strong>
                            {selectedVisaPackage.category || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>Start Date</span>
                          <strong>
                            {selectedVisaPackage.startDate || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>End Date</span>
                          <strong>
                            {selectedVisaPackage.endDate || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>Bank Statement</span>
                          <strong>
                            {selectedVisaPackage.bankStatementRequired === "Yes"
                              ? `${Number(
                                  selectedVisaPackage.bankStatementAmount || 0
                                ).toLocaleString()} ${selectedVisaPackage.currency || "AFN"}`
                              : "Not Required"}
                          </strong>
                        </div>

                        <div>
                          <span>Documentation</span>
                          <strong>
                            {selectedVisaPackage.documentationRequired === "Yes"
                              ? (selectedVisaPackage.documents || []).join(", ") ||
                                "Required"
                              : "Not Required"}
                          </strong>
                        </div>
                      </div>

                      {selectedVisaPackage.note && (
                        <div className="employee-package-preview-note">
                          <span>Package Note</span>
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
                    Travel Package

                    <select
                      name="selectedTravelPackageId"
                      value={form.selectedTravelPackageId}
                      onChange={update}
                    >
                      <option value="">
                        Select registered travel package
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
                      Loading Travel Packages...
                    </p>
                  )}

                  {travelPackagesLoaded &&
                    !availableTravelPackages.length && (
                      <p className="employee-package-empty-note">
                        No available Travel Packages found.
                      </p>
                    )}

                  {selectedTravelPackage && (
                    <section className="employee-package-preview">
                      <header>
                        <div>
                          <span>SELECTED TRAVEL PACKAGE</span>

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
                          <span>Country</span>

                          <strong>
                            {selectedTravelPackage.country || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>Category</span>

                          <strong>
                            {selectedTravelPackage.category || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>Start Date</span>

                          <strong>
                            {selectedTravelPackage.startDate || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>End Date</span>

                          <strong>
                            {selectedTravelPackage.endDate || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>Bank Statement</span>

                          <strong>
                            {selectedTravelPackage.bankStatementRequired ===
                            "Yes"
                              ? `${Number(
                                  selectedTravelPackage.bankStatementAmount ||
                                    0
                                ).toLocaleString()} ${selectedTravelPackage.currency || "AFN"}`
                              : "Not Required"}
                          </strong>
                        </div>
                      </div>

                      {selectedTravelPackage.note && (
                        <div className="employee-package-preview-note">
                          <span>Package Note</span>

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
                    Technology Package

                    <select
                      name="selectedTechnologyPackageId"
                      value={form.selectedTechnologyPackageId}
                      onChange={update}
                    >
                      <option value="">
                        Select registered technology package
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
                      Loading Technology Packages...
                    </p>
                  )}

                  {technologyPackagesLoaded &&
                    !technologyPackages.length && (
                      <p className="employee-package-empty-note">
                        No Technology Packages have been registered yet.
                      </p>
                    )}

                  {selectedTechnologyPackage && (
                    <section className="employee-package-preview">
                      <header>
                        <div>
                          <span>SELECTED TECHNOLOGY PACKAGE</span>

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
                          <span>Package Note</span>
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
                    Media Package

                    <select
                      name="selectedMediaPackageId"
                      value={form.selectedMediaPackageId}
                      onChange={update}
                    >
                      <option value="">
                        Select registered media package
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
                      Loading Media Packages...
                    </p>
                  )}

                  {mediaPackagesLoaded &&
                    !mediaPackages.length && (
                      <p className="employee-package-empty-note">
                        No Media Packages have been registered yet.
                      </p>
                    )}

                  {selectedMediaPackage && (
                    <section className="employee-package-preview">
                      <header>
                        <div>
                          <span>SELECTED MEDIA PACKAGE</span>

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
                          <span>Country</span>
                          <strong>
                            {selectedMediaPackage.country || "-"}
                          </strong>
                        </div>

                        <div>
                          <span>Category</span>
                          <strong>
                            {selectedMediaPackage.category || "-"}
                          </strong>
                        </div>
                      </div>

                      {selectedMediaPackage.note && (
                        <div className="employee-package-preview-note">
                          <span>Package Note</span>
                          <p>{selectedMediaPackage.note}</p>
                        </div>
                      )}
                    </section>
                  )}
                </div>
              )}

              <label>
                Full Name

                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={update}
                />
              </label>

              <label>
                Phone Number

                <input
                  name="phone"
                  value={form.phone}
                  onChange={update}
                />
              </label>

              {(mode === "technology" ||
                mode === "media") && (
                <label>
                  Business Type

                  <input
                    name="businessType"
                    value={form.businessType}
                    onChange={update}
                    placeholder="Enter business type"
                  />
                </label>
              )}

              <label>
                City / Province

                <select
                  name="city"
                  value={form.city}
                  onChange={update}
                >
                  <option value="">
                    Select province
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
                Language

                <select
                  name="language"
                  value={form.language}
                  onChange={update}
                >
                  <option>Dari</option>
                  <option>Pashto</option>
                  <option>English</option>
                  <option>Other</option>
                </select>
              </label>

              {mode !== "media" && (
                <label>
                  Call Type

                  <select
                    name="callType"
                    value={form.callType}
                    onChange={update}
                  >
                    <option>Incoming</option>
                    <option>Outgoing</option>
                  </select>
                </label>
              )}

              <label>
                Unit

                <select
                  name="currencyUnit"
                  value={form.currencyUnit}
                  onChange={update}
                >
                  <option value="AFN">
                    AFN - افغانی
                  </option>

                  <option value="USD">
                    USD - Dollar
                  </option>
                </select>
              </label>

              <label>
                Price

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
                  placeholder="Enter price"
                />
              </label>

              {mode === "consultant" && (
                <label>
                  Scholarship Type

                  <select
                    name="scholarshipType"
                    value={form.scholarshipType}
                    onChange={update}
                  >
                    <option value="">
                      Select scholarship
                    </option>

                    <option value="Fully Funded">
                      Fully Funded
                    </option>

                    <option value="Partial Funded">
                      Partial Funded
                    </option>

                    <option value="Private">
                      Private
                    </option>
                  </select>
                </label>
              )}

              {mode === "technology" && (
                <label>
                  Purpose

                  <select
                    name="technologyPurpose"
                    value={form.technologyPurpose}
                    onChange={update}
                  >
                    <option>Database</option>
                    <option>Web</option>
                    <option>Application</option>
                  </select>
                </label>
              )}

              {mode !== "technology" && (
                <label className="wide">
                  Purpose

                  <textarea
                    name="purpose"
                    value={form.purpose}
                    onChange={update}
                    placeholder="Enter customer purpose"
                  />
                </label>
              )}

              {mode !== "media" && (
                <label className="followup-field wide">
                  Need Follow-up

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
                        ? "ON"
                        : "OFF"}
                    </b>
                  </button>
                </label>
              )}

              {mode !== "media" && (
                <label className="wide">
                  Note

                  <textarea
                    name="note"
                    value={form.note}
                    onChange={update}
                    placeholder="Write additional customer notes..."
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
                Cancel
              </button>

              <button
                type="submit"
                className="primary"
              >
                {editId
                  ? "Save Changes"
                  : "Save Customer"}
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

            <h2>Delete Customer</h2>

            <p>
              Are you sure you want to delete{" "}
              <strong>
                {deleteTarget.fullName ||
                  deleteTarget.customerName ||
                  "this customer"}
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
                Cancel
              </button>

              <button
                type="button"
                className="danger"
                disabled={deleting}
                onClick={confirmDelete}
              >
                <Trash2 size={14} />

                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
