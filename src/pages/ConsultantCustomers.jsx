import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BriefcaseBusiness, Check, ChevronDown, Clapperboard, Cpu, Eye, Mail, Pencil, Phone, Plane, Plus, Search, Trash2, Users, X } from "lucide-react";
import { notify } from "../utils/notify";
import { useLocalCollection } from "../hooks/useLocalCollection";
import { useJsonCollection } from "../hooks/useJsonCollection";
import "./ConsultantCustomers.css";

const provinces = ["Badakhshan","Badghis","Baghlan","Balkh","Bamyan","Daykundi","Farah","Faryab","Ghazni","Ghor","Helmand","Herat","Jowzjan","Kabul","Kandahar","Kapisa","Khost","Kunar","Kunduz","Laghman","Logar","Nangarhar","Nimroz","Nuristan","Paktia","Paktika","Panjshir","Parwan","Samangan","Sar-e Pol","Takhar","Uruzgan","Wardak","Zabul"];
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
  "Côte d\'Ivoire",
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

const countryCodes = {
  "Afghanistan": "AF",
  "Albania": "AL",
  "Algeria": "DZ",
  "Andorra": "AD",
  "Angola": "AO",
  "Antigua and Barbuda": "AG",
  "Argentina": "AR",
  "Armenia": "AM",
  "Australia": "AU",
  "Austria": "AT",
  "Azerbaijan": "AZ",
  "Bahamas": "BS",
  "Bahrain": "BH",
  "Bangladesh": "BD",
  "Barbados": "BB",
  "Belarus": "BY",
  "Belgium": "BE",
  "Belize": "BZ",
  "Benin": "BJ",
  "Bhutan": "BT",
  "Bolivia": "BO",
  "Bosnia and Herzegovina": "BA",
  "Botswana": "BW",
  "Brazil": "BR",
  "Brunei": "BN",
  "Bulgaria": "BG",
  "Burkina Faso": "BF",
  "Burundi": "BI",
  "Cabo Verde": "CV",
  "Cambodia": "KH",
  "Cameroon": "CM",
  "Canada": "CA",
  "Central African Republic": "CF",
  "Chad": "TD",
  "Chile": "CL",
  "China": "CN",
  "Colombia": "CO",
  "Comoros": "KM",
  "Congo, Democratic Republic of the": "CD",
  "Congo, Republic of the": "CG",
  "Costa Rica": "CR",
  "Côte d'Ivoire": "CI",
  "Croatia": "HR",
  "Cuba": "CU",
  "Cyprus": "CY",
  "Czechia": "CZ",
  "Denmark": "DK",
  "Djibouti": "DJ",
  "Dominica": "DM",
  "Dominican Republic": "DO",
  "Ecuador": "EC",
  "Egypt": "EG",
  "El Salvador": "SV",
  "Equatorial Guinea": "GQ",
  "Eritrea": "ER",
  "Estonia": "EE",
  "Eswatini": "SZ",
  "Ethiopia": "ET",
  "Fiji": "FJ",
  "Finland": "FI",
  "France": "FR",
  "Gabon": "GA",
  "Gambia": "GM",
  "Georgia": "GE",
  "Germany": "DE",
  "Ghana": "GH",
  "Greece": "GR",
  "Grenada": "GD",
  "Guatemala": "GT",
  "Guinea": "GN",
  "Guinea-Bissau": "GW",
  "Guyana": "GY",
  "Haiti": "HT",
  "Honduras": "HN",
  "Hungary": "HU",
  "Iceland": "IS",
  "India": "IN",
  "Indonesia": "ID",
  "Iran": "IR",
  "Iraq": "IQ",
  "Ireland": "IE",
  "Israel": "IL",
  "Italy": "IT",
  "Jamaica": "JM",
  "Japan": "JP",
  "Jordan": "JO",
  "Kazakhstan": "KZ",
  "Kenya": "KE",
  "Kiribati": "KI",
  "Kuwait": "KW",
  "Kyrgyzstan": "KG",
  "Laos": "LA",
  "Latvia": "LV",
  "Lebanon": "LB",
  "Lesotho": "LS",
  "Liberia": "LR",
  "Libya": "LY",
  "Liechtenstein": "LI",
  "Lithuania": "LT",
  "Luxembourg": "LU",
  "Madagascar": "MG",
  "Malawi": "MW",
  "Malaysia": "MY",
  "Maldives": "MV",
  "Mali": "ML",
  "Malta": "MT",
  "Marshall Islands": "MH",
  "Mauritania": "MR",
  "Mauritius": "MU",
  "Mexico": "MX",
  "Micronesia": "FM",
  "Moldova": "MD",
  "Monaco": "MC",
  "Mongolia": "MN",
  "Montenegro": "ME",
  "Morocco": "MA",
  "Mozambique": "MZ",
  "Myanmar": "MM",
  "Namibia": "NA",
  "Nauru": "NR",
  "Nepal": "NP",
  "Netherlands": "NL",
  "New Zealand": "NZ",
  "Nicaragua": "NI",
  "Niger": "NE",
  "Nigeria": "NG",
  "North Korea": "KP",
  "North Macedonia": "MK",
  "Norway": "NO",
  "Oman": "OM",
  "Pakistan": "PK",
  "Palau": "PW",
  "Palestine": "PS",
  "Panama": "PA",
  "Papua New Guinea": "PG",
  "Paraguay": "PY",
  "Peru": "PE",
  "Philippines": "PH",
  "Poland": "PL",
  "Portugal": "PT",
  "Qatar": "QA",
  "Romania": "RO",
  "Russia": "RU",
  "Rwanda": "RW",
  "Saint Kitts and Nevis": "KN",
  "Saint Lucia": "LC",
  "Saint Vincent and the Grenadines": "VC",
  "Samoa": "WS",
  "San Marino": "SM",
  "São Tomé and Príncipe": "ST",
  "Saudi Arabia": "SA",
  "Senegal": "SN",
  "Serbia": "RS",
  "Seychelles": "SC",
  "Sierra Leone": "SL",
  "Singapore": "SG",
  "Slovakia": "SK",
  "Slovenia": "SI",
  "Solomon Islands": "SB",
  "Somalia": "SO",
  "South Africa": "ZA",
  "South Korea": "KR",
  "South Sudan": "SS",
  "Spain": "ES",
  "Sri Lanka": "LK",
  "Sudan": "SD",
  "Suriname": "SR",
  "Sweden": "SE",
  "Switzerland": "CH",
  "Syria": "SY",
  "Taiwan": "TW",
  "Tajikistan": "TJ",
  "Tanzania": "TZ",
  "Thailand": "TH",
  "Timor-Leste": "TL",
  "Togo": "TG",
  "Tonga": "TO",
  "Trinidad and Tobago": "TT",
  "Tunisia": "TN",
  "Turkey": "TR",
  "Turkmenistan": "TM",
  "Tuvalu": "TV",
  "Uganda": "UG",
  "Ukraine": "UA",
  "United Arab Emirates": "AE",
  "United Kingdom": "GB",
  "United States": "US",
  "Uruguay": "UY",
  "Uzbekistan": "UZ",
  "Vanuatu": "VU",
  "Vatican City": "VA",
  "Venezuela": "VE",
  "Vietnam": "VN",
  "Yemen": "YE",
  "Zambia": "ZM",
  "Zimbabwe": "ZW"
};

function getCountryFlag(countryName) {
  const code = countryCodes[countryName];

  if (!code) return "🌐";

  return code
    .toUpperCase()
    .split("")
    .map((letter) =>
      String.fromCodePoint(
        127397 + letter.charCodeAt(0)
      )
    )
    .join("");
}

function getCountryLabel(countryName) {
  return `${getCountryFlag(countryName)} ${countryName}`;
}

function getCountryFlagUrl(countryName) {
  const code = countryCodes[countryName];
  return code ? `https://flagcdn.com/w40/${code.toLowerCase()}.png` : "";
}

function getCountryFlagFallbackUrl(countryName) {
  const code = countryCodes[countryName];
  return code ? `https://hatscripts.github.io/circle-flags/flags/${code.toLowerCase()}.svg` : "";
}

function handleCountryFlagError(event, countryName) {
  const image = event.currentTarget;

  if (image.dataset.fallbackApplied === "true") {
    image.style.display = "none";
    return;
  }

  image.dataset.fallbackApplied = "true";
  image.src = getCountryFlagFallbackUrl(countryName);
}

function CountryFlag({ country, className = "" }) {
  if (!country) return null;

  return (
    <span className={`consultant-country-flag-image-wrap ${className}`.trim()} aria-hidden="true">
      <img
        src={getCountryFlagUrl(country)}
        alt=""
        className="consultant-country-flag-image"
        onError={(event) => handleCountryFlagError(event, country)}
        referrerPolicy="no-referrer"
      />
    </span>
  );
}

function getAfghanistanDateTime() {
  const now = new Date();

  const date = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kabul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(now);

  const time = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: "Asia/Kabul",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }
  ).format(now);

  return {
    iso: now.toISOString(),
    date,
    time,
    dateTime: `${date}, ${time}`,
  };
}

function formatCustomerDateTime(customer) {
  const date =
    customer.afghanistanDate ||
    customer.date ||
    "";

  const time =
    customer.afghanistanTime ||
    customer.time ||
    "";

  if (date && time) {
    const normalizedTime = /\b(?:AM|PM)\b/i.test(time)
      ? time
      : new Intl.DateTimeFormat(
          "en-US",
          {
            timeZone: "Asia/Kabul",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }
        ).format(
          new Date(`1970-01-01T${time}`)
        );

    return (
      <span
        className="consultant-date-time"
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "3px",
          lineHeight: 1.2,
        }}
      >
        <strong>{date}</strong>
        <small>{normalizedTime}</small>
      </span>
    );
  }

  if (customer.createdAt) {
    const created = new Date(customer.createdAt);

    const formattedDate =
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kabul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(created);

    const formattedTime =
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kabul",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(created);

    return (
      <span
        className="consultant-date-time"
        style={{
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "3px",
          lineHeight: 1.2,
        }}
      >
        <strong>{formattedDate}</strong>
        <small>{formattedTime}</small>
      </span>
    );
  }

  return "-";
}


const emptyForm = {
  passportFullName: "",
  phone: "",
  email: "",
  source: "",
  educationLevel: "",
  institutionName: "",
  sourceEmployeeId: "",
  sourceEmployeeName: "",
  assignedEmployeeId: "",
  assignedEmployeeName: "",
  purpose: "",
  city: "",
  language: "Dari",
  otherLanguage: "",
  callType: "Incoming",
  needFollowup: "No",
  businessType: "",
  companyName: "",
  technologyPurpose: "Database",
  price: "",
  unit: "AFN",
  scholarshipType: "",
  country: "",
  note: "",
};

const departmentTypes = [
  {
    key: "consultant",
    icon: BriefcaseBusiness,
    label: "Consultant Customers",
    labelDr: "مشتریان مشاوره",
    labelPs: "مشورتي پېرودونکي",
    description: "Consulting service customers",
    descriptionDr: "مشتریان بخش خدمات مشاوره",
    descriptionPs: "د مشورتي خدمتونو پېرودونکي",
  },
  {
    key: "travel",
    icon: Plane,
    label: "Travel Customers",
    labelDr: "مشتریان سفر",
    labelPs: "د سفر پېرودونکي",
    description: "Travel and visa service customers",
    descriptionDr: "مشتریان بخش خدمات سفر",
    descriptionPs: "د سفر خدمتونو پېرودونکي",
  },
  {
    key: "technology",
    icon: Cpu,
    label: "Technology Customers",
    labelDr: "مشتریان تکنالوژی",
    labelPs: "د ټکنالوژۍ پېرودونکي",
    description: "Technology service customers",
    descriptionDr: "مشتریان بخش خدمات تکنالوژی",
    descriptionPs: "د ټکنالوژۍ خدمتونو پېرودونکي",
  },
  {
    key: "media",
    icon: Clapperboard,
    label: "Media Customers",
    labelDr: "مشتریان رسانه",
    labelPs: "د رسنیو پېرودونکي",
    description: "Media production customers",
    descriptionDr: "مشتریان بخش خدمات رسانه",
    descriptionPs: "د رسنیو خدمتونو پېرودونکي",
  },
];



function ConsultantCustomers({ mode = "consultant", currentUser }) {
  const [activeMode, setActiveMode] = useState(mode);
  const isTravel = activeMode === "travel";
  const isTechnology = activeMode === "technology";
  const isMedia = activeMode === "media";

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

  useEffect(() => {
    setActiveMode(mode);
    setSearch("");
    resetForm();
  }, [mode]);

  const typeLabel = isTravel
    ? tx("Travel Customer", "مشتری سفر", "د سفر پېرودونکی")
    : isTechnology
      ? tx("Technology Customer", "مشتری تکنالوژی", "د ټکنالوژۍ پېرودونکی")
      : isMedia
        ? tx("Media Production Customer", "مشتری تولیدات رسانه‌ای", "د رسنیزو تولیداتو پېرودونکی")
        : tx("Consultant Customer", "مشتری مشاوره", "مشورتي پېرودونکی");

  const typeLabelPlural = isTravel
    ? tx("Travel Customers", "مشتریان سفر", "د سفر پېرودونکي")
    : isTechnology
      ? tx("Technology Customers", "مشتریان تکنالوژی", "د ټکنالوژۍ پېرودونکي")
      : isMedia
        ? tx("Media Production Customers", "مشتریان تولیدات رسانه‌ای", "د رسنیزو تولیداتو پېرودونکي")
        : tx("Consultant Customers", "مشتریان مشاوره", "مشورتي پېرودونکي");

  const legacyCollectionName = isTravel
    ? "travelCustomers"
    : isTechnology
      ? "technologyCustomers"
      : isMedia
        ? "mediaProducts"
        : "consultantCustomers";

  const [
    serverCustomers,
    setServerCustomers,
    ,
    customersLoaded,
  ] = useJsonCollection("customers");

  const [localCustomers] =
    useLocalCollection("employeeCustomers");

  const [
    legacyCustomers,
    setLegacyCustomers,
  ] = useLocalCollection(legacyCollectionName);

  useEffect(() => {
    if (!customersLoaded) return;

    const localRecords = [
      ...localCustomers,
      ...legacyCustomers,
    ].map((item) => ({
      ...item,
      customerType:
        item.customerType || activeMode,
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
    activeMode,
    serverCustomers,
    setServerCustomers,
  ]);

  const customers = useMemo(
    () =>
      serverCustomers.filter(
        (item) =>
          item.specializedCustomer &&
          item.customerType === activeMode
      ),
    [serverCustomers, activeMode]
  );

  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] =
    useState(false);
  const [search, setSearch] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const countryPickerRef = useRef(null);
  const countrySearchRef = useRef(null);
  const [editId, setEditId] = useState(null);
  const [viewCustomer, setViewCustomer] =
    useState(null);
  const [
    deleteCustomer,
    setDeleteCustomer,
  ] = useState(null);

  const filteredCountries = useMemo(() => {
    const query = countrySearch.trim().toLowerCase();
    if (!query) return countries;

    return [...countries]
      .filter((country) => country.toLowerCase().includes(query))
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(query) ? 0 : 1;
        const bStarts = b.toLowerCase().startsWith(query) ? 0 : 1;
        return aStarts - bStarts || a.localeCompare(b);
      });
  }, [countrySearch]);

  useEffect(() => {
    if (!countryOpen) return undefined;

    const handleOutsideCountry = (event) => {
      if (countryPickerRef.current && !countryPickerRef.current.contains(event.target)) {
        setCountryOpen(false);
        setCountrySearch("");
      }
    };

    document.addEventListener("mousedown", handleOutsideCountry, true);
    return () => document.removeEventListener("mousedown", handleOutsideCountry, true);
  }, [countryOpen]);

  useEffect(() => {
    if (countryOpen) {
      requestAnimationFrame(() => countrySearchRef.current?.focus());
    }
  }, [countryOpen]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter((customer) =>
      [
        customer.fullName,
        customer.passportFullName,
        customer.phone,
        customer.city,
        customer.email,
        customer.source,
        customer.createdByName,
        customer.country,
        customer.scholarshipType,
        customer.businessType,
        customer.brandName,
        customer.mediaPurpose,
        customer.phone,
        customer.note,
        customer.technologyPurpose,
        customer.purpose,
        customer.price,
        customer.unit,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [customers, search]);

  const update = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "language" && value !== "Other"
        ? { otherLanguage: "" }
        : {}),
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setCountryOpen(false);
    setCountrySearch("");
    setShowForm(false);
  };

  const save = async (event) => {
    event.preventDefault();

    if (!form.passportFullName.trim()) {
      notify(
        isMedia
          ? tx("Person name is required.", "نام شخص ضروری است.", "د شخص نوم اړین دی.")
          : tx("Full name is required.", "نام کامل ضروری است.", "بشپړ نوم اړین دی."),
        "error"
      );
      return;
    }

    if (isMedia && !String(form.brandName || "").trim()) {
      notify(tx("Brand name is required.", "نام برند ضروری است.", "د برانډ نوم اړین دی."), "error");
      return;
    }

    if (
      form.language === "Other" &&
      !String(form.otherLanguage || "").trim()
    ) {
      notify(tx("Please enter the language name.", "لطفاً نام زبان را وارد کنید.", "مهرباني وکړئ د ژبې نوم ولیکئ."), "error");
      return;
    }

    const afghanistan =
      getAfghanistanDateTime();

    const now = afghanistan.iso;

    const existingRecord = editId
      ? customers.find(
          (customer) =>
            String(customer.id) ===
            String(editId)
        )
      : null;

    const normalizedForm = {
      ...form,
      fullName: form.passportFullName.trim(),
      passportFullName:
        form.passportFullName.trim(),
      personName: form.passportFullName.trim(),
      brandName: String(form.brandName || "").trim(),
      mediaPurpose: String(
        form.mediaPurpose || "Video"
      ).trim(),
      purpose: isMedia
        ? String(form.mediaPurpose || "Video").trim()
        : form.purpose,
      customerType: activeMode,
      specializedCustomer: true,
      registeredFrom:
        form.registeredFrom ||
        existingRecord?.registeredFrom ||
        "employee-dashboard",

      afghanistanDate:
        existingRecord?.afghanistanDate ||
        existingRecord?.date ||
        afghanistan.date,

      afghanistanTime:
        existingRecord?.afghanistanTime ||
        existingRecord?.time ||
        afghanistan.time,

      afghanistanDateTime:
        existingRecord?.afghanistanDateTime ||
        afghanistan.dateTime,

      date:
        existingRecord?.date ||
        existingRecord?.afghanistanDate ||
        afghanistan.date,

      time:
        existingRecord?.time ||
        existingRecord?.afghanistanTime ||
        afghanistan.time,

      updatedAt: now,
    };

    const record = editId
      ? {
          ...(existingRecord || {}),
          ...normalizedForm,
          createdAt:
            existingRecord?.createdAt ||
            now,
        }
      : {
          ...normalizedForm,
          id:
            typeof crypto !== "undefined" &&
            crypto.randomUUID
              ? crypto.randomUUID()
              : `${Date.now()}`,
          adminNotificationType: "customer-created",
          adminNotificationSection: typeLabel,
          adminNotificationAt: now,
          createdByAccountId: currentUser?.id || "",
          createdByEmployeeId: currentUser?.employeeId || "",
          createdByName:
            currentUser?.fullName ||
            currentUser?.username ||
            currentUser?.email ||
            "Call Center",
          createdAt: now,
        };

    const next = editId
      ? serverCustomers.map((customer) =>
          String(customer.id) ===
          String(editId)
            ? record
            : customer
        )
      : [...serverCustomers, record];

    const saved =
      await setServerCustomers(next);

    if (!saved) return;

    if (
      editId &&
      legacyCustomers.some(
        (customer) =>
          String(customer.id) ===
          String(editId)
      )
    ) {
      await setLegacyCustomers(
        legacyCustomers.filter(
          (customer) =>
            String(customer.id) !==
            String(editId)
        )
      );
    }

    notify(
      editId
        ? `${typeLabel} ${tx("updated successfully.", "با موفقیت ویرایش شد.", "په بریالیتوب سره سم شو.")}`
        : `${typeLabel} ${tx("registered successfully.", "با موفقیت ثبت شد.", "په بریالیتوب سره ثبت شو.")}`,
      "success"
    );

    resetForm();
  };

  const remove = async () => {
    if (!deleteCustomer) return;

    const next = serverCustomers.filter(
      (customer) =>
        String(customer.id) !==
        String(deleteCustomer.id)
    );

    const saved =
      await setServerCustomers(next);

    if (!saved) return;

    if (
      legacyCustomers.some(
        (customer) =>
          String(customer.id) ===
          String(deleteCustomer.id)
      )
    ) {
      await setLegacyCustomers(
        legacyCustomers.filter(
          (customer) =>
            String(customer.id) !==
            String(deleteCustomer.id)
        )
      );
    }

    setDeleteCustomer(null);
    notify(
      `${typeLabel} ${tx("deleted successfully.", "با موفقیت حذف شد.", "په بریالیتوب سره حذف شو.")}`,
      "success"
    );
  };

  const openEdit = (customer) => {
    setForm({
      ...emptyForm,
      ...customer,
      passportFullName:
        customer.passportFullName ||
        customer.fullName ||
        "",
      unit:
        customer.unit ||
        customer.currencyUnit ||
        "AFN",
    });

    setEditId(customer.id);
    setCountryOpen(false);
    setCountrySearch("");
    setShowForm(true);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setCountryOpen(false);
    setCountrySearch("");
    setShowForm(true);
  };

  const selectDepartment = (nextMode) => {
    if (nextMode === activeMode) return;

    setActiveMode(nextMode);
    setSearch("");
    setViewCustomer(null);
    setDeleteCustomer(null);
    resetForm();
  };

  const departmentCards = departmentTypes.map((department) => ({
    ...department,
    count: serverCustomers.filter(
      (item) =>
        item.specializedCustomer &&
        item.customerType === department.key
    ).length,
  }));

  const formatPrice = (customer) => {
    const price = Number(
      customer.price ||
      customer.totalAmount ||
      0
    );

    if (!price) return "-";

    return `${price.toLocaleString("en-US")} ${
      customer.unit ||
      customer.currencyUnit ||
      "AFN"
    }`;
  };

  return (
    <div className={`consultant-page ${interfaceLanguage !== "en" ? "consultant-page-rtl" : ""}`}>
      <div className="consultant-heading">
        <div>
          <span>{tx("Customer Services", "خدمات مشتریان", "د پېرودونکو خدمتونه")}</span>
          <h1>{typeLabelPlural}</h1>
          <p>
            {tx(
              "Register and manage customer information from one workspace.",
              "معلومات مشتریان را از یک بخش ثبت و مدیریت کنید.",
              "د پېرودونکو معلومات له یوه ځایه ثبت او مدیریت کړئ."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
        >
          <Plus size={17} />
          {tx("Add", "افزودن", "زیاتول")} {typeLabel}
        </button>
      </div>

      <div className="consultant-department-cards" aria-label="Customer departments">
        {departmentCards.map((department) => {
          const Icon = department.icon;
          const isActive = department.key === activeMode;

          return (
            <button
              key={department.key}
              type="button"
              className={`consultant-department-card ${isActive ? "active" : ""}`}
              onClick={() => selectDepartment(department.key)}
              aria-pressed={isActive}
            >
              <span className="consultant-department-icon">
                <Icon size={19} />
              </span>

              <span className="consultant-department-copy">
                <strong>{tx(department.label, department.labelDr, department.labelPs)}</strong>
                <small>{tx(department.description, department.descriptionDr, department.descriptionPs)}</small>
              </span>

              <b>{department.count}</b>
            </button>
          );
        })}
      </div>

      <section className="consultant-list-card">
        <div className="consultant-list-header">
          <div>
            <h2>{typeLabel} {tx("List", "فهرست", "لېست")}</h2>
            <p>{tx(
              "Registered customer records",
              "سوابق مشتریان ثبت‌شده",
              "د ثبت شوو پېرودونکو ریکارډونه"
            )}</p>
          </div>

          <div>
            <Search size={15} />
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={tx(
                "Search customers...",
                "جستجوی مشتریان...",
                "پېرودونکي ولټوئ..."
              )}
            />
          </div>
        </div>

        <div className="consultant-table-wrap">
          <table>
            <thead>
              {isMedia ? (
                <tr>
                  <th>{tx("Employee Name", "نام کارمند", "د کارکوونکي نوم")}</th>
                  <th>{tx("Full Name", "نام کامل", "بشپړ نوم")}</th>
                  <th>{tx("Source", "منبع", "سرچینه")}</th>
                  <th>{tx("Phone Number", "شماره تماس", "د تلیفون شمېره")}</th>
                  <th>{tx("Brand Name", "نام برند", "د برانډ نوم")}</th>
                  <th>{tx("Purpose", "هدف", "موخه")}</th>
                  <th>{tx("Note", "یادداشت", "یادښت")}</th>
                  <th>{tx("Registered", "تاریخ ثبت", "ثبت شوی")}</th>
                  <th>{tx("Action", "عملیات", "عمل")}</th>
                </tr>
              ) : (
                <tr>
                  <th>{tx("Employee Name", "نام کارمند", "د کارکوونکي نوم")}</th>
                  <th>{tx("Customer", "مشتری", "پېرودونکی")}</th>
                  <th>{tx("Source", "منبع", "سرچینه")}</th>
                  <th>{tx("Contact", "تماس", "اړیکه")}</th>
                  <th>{tx("Location", "موقعیت", "ځای")}</th>
                  <th>{tx("Country", "کشور", "هېواد")}</th>

                  {isTechnology && (
                    <th>{tx("Service", "خدمت", "خدمت")}</th>
                  )}

                  {!isTravel &&
                    !isTechnology && (
                      <th>{tx("Scholarship", "بورسیه", "بورس")}</th>
                    )}

                  <th>{tx("Unit / Price", "واحد / قیمت", "واحد / بیه")}</th>
                  <th>{tx("Purpose", "هدف", "موخه")}</th>
                  <th>{tx("Follow-up", "پیگیری", "تعقیب")}</th>
                  <th>{tx("Registered", "تاریخ ثبت", "ثبت شوی")}</th>
                  <th>{tx("Action", "عملیات", "عمل")}</th>
                </tr>
              )}
            </thead>

            <tbody>
              {filtered.map((customer) => {
                const customerName =
                  customer.fullName ||
                  customer.passportFullName ||
                  customer.personName ||
                  `Unnamed ${typeLabel}`;

                if (isMedia) {
                  return (
                    <tr key={customer.id}>
                      <td className="consultant-employee-name">
                        {customer.createdByName || customer.createdByEmployeeName || customer.employeeName || "-"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="consultant-name-preview"
                          onClick={() =>
                            setViewCustomer(customer)
                          }
                        >
                          <span className="consultant-name-avatar">
                            {String(customerName)
                              .slice(0, 1)
                              .toUpperCase()}
                          </span>

                          <span className="consultant-name-copy">
                            <strong>{customerName}</strong>
                            <small>{tx("View details", "نمایش جزئیات", "تفصیل وګورئ")}</small>
                          </span>
                        </button>
                      </td>

                      <td>{customer.source || "-"}</td>

                      <td>{customer.phone || "-"}</td>

                      <td>{customer.brandName || "-"}</td>

                      <td>
                        {customer.mediaPurpose ||
                          customer.purpose ||
                          "-"}
                      </td>

                      <td>
                        {customer.note ||
                          customer.notes ||
                          "-"}
                      </td>

                      <td>
                        {formatCustomerDateTime(
                          customer
                        )}
                      </td>

                      <td>
                        <div className="consultant-row-actions">
                          <button
                            className="view"
                            type="button"
                            onClick={() =>
                              setViewCustomer(customer)
                            }
                            title={tx("View details", "نمایش جزئیات", "تفصیل وګورئ")}
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            className="edit"
                            type="button"
                            onClick={() =>
                              openEdit(customer)
                            }
                            title={tx("Edit", "ویرایش", "سمول")}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            className="delete"
                            type="button"
                            onClick={() =>
                              setDeleteCustomer(customer)
                            }
                            title={tx("Delete", "حذف", "حذف")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={customer.id}>
                    <td className="consultant-employee-name">
                      {customer.createdByName || customer.createdByEmployeeName || customer.employeeName || "-"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="consultant-name-preview"
                        onClick={() =>
                          setViewCustomer(customer)
                        }
                      >
                        <span className="consultant-name-avatar">
                          {String(customerName)
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>

                        <span className="consultant-name-copy">
                          <strong>{customerName}</strong>
                          <small>{tx("View details", "نمایش جزئیات", "تفصیل وګورئ")}</small>
                        </span>
                      </button>
                    </td>

                    <td>{customer.source || "-"}</td>

                    <td>
                      <div className="consultant-contact">
                        <span>
                          <Phone size={13} />
                          {customer.phone || "-"}
                        </span>

                        <span>
                          <Mail size={13} />
                          {customer.email || "-"}
                        </span>
                      </div>
                    </td>

                    <td>{customer.city || "-"}</td>

                    <td>
                      {customer.country ? (
                        <span className="consultant-country-table-value">
                          <CountryFlag country={customer.country} className="table-flag" />
                          <span>{customer.country}</span>
                        </span>
                      ) : "-"}
                    </td>

                    {isTechnology && (
                      <td>
                        {customer.technologyPurpose || "-"}
                      </td>
                    )}

                    {!isTravel &&
                      !isTechnology && (
                        <td>
                          {customer.scholarshipType || "-"}
                        </td>
                      )}

                    <td>{formatPrice(customer)}</td>

                    <td>
                      {customer.purpose ||
                        customer.technologyPurpose ||
                        "-"}
                    </td>

                    <td>
                      <span
                        className={`consultant-followup-badge ${
                          customer.needFollowup === "Yes"
                            ? "yes"
                            : "no"
                        }`}
                      >
                        {customer.needFollowup === "Yes"
                          ? tx("Required", "ضروری", "اړین")
                          : tx("No", "نخیر", "نه")}
                      </span>
                    </td>

                    <td>
                      {formatCustomerDateTime(
                        customer
                      )}
                    </td>

                    <td>
                      <div className="consultant-row-actions">
                        <button
                          className="view"
                          type="button"
                          onClick={() =>
                            setViewCustomer(customer)
                          }
                          title={tx("View details", "نمایش جزئیات", "تفصیل وګورئ")}
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          className="edit"
                          type="button"
                          onClick={() =>
                            openEdit(customer)
                          }
                          title={tx("Edit", "ویرایش", "سمول")}
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          className="delete"
                          type="button"
                          onClick={() =>
                            setDeleteCustomer(customer)
                          }
                          title={tx("Delete", "حذف", "حذف")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filtered.length && (
                <tr>
                  <td
                    colSpan={isMedia ? 7 : 10}
                    className="consultant-empty"
                  >
                    {tx(
                      "No customers registered yet.",
                      "هنوز هیچ مشتری ثبت نشده است.",
                      "تر اوسه هېڅ پېرودونکی نه دی ثبت شوی."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <div
          className="consultant-modal-backdrop"
          onMouseDown={resetForm}
        >
          <div
            className="consultant-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="consultant-modal-header">
              <div>
                <h2>
                  {editId
                    ? `${tx("Edit", "ویرایش", "سمول")} ${typeLabel}`
                    : isMedia
                      ? tx(
                          "Add Media Product",
                          "افزودن محصول رسانه‌ای",
                          "رسنیز محصول زیاتول"
                        )
                      : `${tx("Add", "افزودن", "زیاتول")} ${typeLabel}`}
                </h2>

                <p>
                  {isMedia
                    ? tx(
                        "Select the registration type and complete the required information.",
                        "نوع ثبت را انتخاب کرده و معلومات مورد نیاز را تکمیل کنید.",
                        "د ثبت ډول وټاکئ او اړین معلومات بشپړ کړئ."
                      )
                    : tx(
                        "This record will also appear in the general customer list.",
                        "این مورد در فهرست عمومی مشتریان نیز نمایش داده می‌شود.",
                        "دا ریکارډ به د پېرودونکو په عمومي لېست کې هم ښکاره شي."
                      )}
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={save}>
              <div className="consultant-form-grid">
                {isMedia ? (
                  <>
                    <label>
                      <span>{tx("Full Name", "نام کامل", "بشپړ نوم")}</span>
                      <input
                        name="passportFullName"
                        value={form.passportFullName}
                        onChange={update}
                        placeholder={tx("Enter full name", "نام کامل را وارد کنید", "بشپړ نوم ولیکئ")}
                      />
                    </label>

<label>
  <span>{tx("Phone Number", "شماره تماس", "د تلیفون شمېره")}</span>
  <input
    type="text"
    name="phone"
    value={form.phone}
    inputMode="numeric"
    pattern="[0-9]*"
    onChange={(event) => {
      const value = event.target.value.replace(/\D/g, "");

      setForm((current) => ({
        ...current,
        phone: value,
      }));
    }}
    placeholder={tx("Enter phone number", "شماره تماس را وارد کنید", "د تلیفون شمېره ولیکئ")}
  />
</label>

                    <label>
                      <span>{tx("Source", "منبع", "سرچینه")}</span>
                      <input
                        name="source"
                        value={form.source || ""}
                        onChange={update}
                        placeholder={tx("Who referred/requested this customer?", "این مشتری به درخواست یا معرفی چه کسی آمده؟", "دا پېرودونکی د چا په غوښتنه یا معرفۍ راغلی؟")}
                      />
                    </label>

                    <label>
                      <span>{tx("Brand Name", "نام برند", "د برانډ نوم")}</span>
                      <input
                        name="brandName"
                        value={form.brandName || ""}
                        onChange={update}
                        placeholder={tx("Enter brand name", "نام برند را وارد کنید", "د برانډ نوم ولیکئ")}
                      />
                    </label>

                    <label>
                      <span>{tx("Purpose", "هدف", "موخه")}</span>
                      <select
                        name="mediaPurpose"
                        value={form.mediaPurpose || "Video"}
                        onChange={update}
                      >
                        <option value="Video">{tx("Video", "ویدیو", "ویډیو")}</option>
                        <option value="Photo">{tx("Photo", "عکس", "انځور")}</option>
                        <option value="Logo">{tx("Logo", "لوگو", "لوګو")}</option>
                        <option value="Poster">{tx("Poster", "پوستر", "پوستر")}</option>
                        <option value="Banner">{tx("Banner", "بنر", "بینر")}</option>
                        <option value="Social Media Post">{tx("Social Media Post", "پست شبکه‌های اجتماعی", "د ټولنیزو رسنیو پوسټ")}</option>
                        <option value="Advertisement">{tx("Advertisement", "اعلان", "اعلان")}</option>
                        <option value="Animation">{tx("Animation", "انیمیشن", "انیمېشن")}</option>
                        <option value="Other">{tx("Other", "دیگر", "نور")}</option>
                      </select>
                    </label>

                    <label className="consultant-form-full">
                      <span>{tx("Note", "یادداشت", "یادښت")}</span>
                      <textarea
                        name="note"
                        value={form.note}
                        onChange={update}
                        rows="4"
                        placeholder={tx("Write additional notes", "یادداشت اضافی بنویسید", "اضافي یادښت ولیکئ")}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      <span>{tx("Full Name", "نام کامل", "بشپړ نوم")}</span>
                      <input
                        name="passportFullName"
                        value={form.passportFullName}
                        onChange={update}
                      />
                    </label>
<label>
  <span>{tx("Phone Number", "شماره تماس", "د تلیفون شمېره")}</span>
  <input
    type="text"
    name="phone"
    value={form.phone}
    inputMode="numeric"
    pattern="[0-9]*"
    onChange={(event) => {
      const value = event.target.value.replace(/\D/g, "");

      setForm((current) => ({
        ...current,
        phone: value,
      }));
    }}
    placeholder={tx("Enter phone number", "شماره تماس را وارد کنید", "د تلیفون شمېره ولیکئ")}
  />
</label>

                    <label>
                      <span>{tx("Source", "منبع", "سرچینه")}</span>
                      <input
                        name="source"
                        value={form.source || ""}
                        onChange={update}
                        placeholder={tx("Who referred/requested this customer?", "این مشتری به درخواست یا معرفی چه کسی آمده؟", "دا پېرودونکی د چا په غوښتنه یا معرفۍ راغلی؟")}
                      />
                    </label>

                    <label>
                      <span>{tx("City / Province", "شهر / ولایت", "ښار / ولایت")}</span>
                      <select
                        name="city"
                        value={form.city}
                        onChange={update}
                      >
                        <option value="">
                          {tx("Select province", "ولایت را انتخاب کنید", "ولایت وټاکئ")}
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

                    <div className="consultant-country-picker" ref={countryPickerRef}>
                      <span>{tx("Country", "کشور", "هېواد")}</span>
                      <button
                        type="button"
                        className={`consultant-country-trigger ${countryOpen ? "open" : ""}`}
                        onClick={() => {
                          setCountryOpen((open) => !open);
                          setCountrySearch("");
                        }}
                        onKeyDown={(event) => {
                          if (/^[a-zA-Z]$/.test(event.key)) {
                            event.preventDefault();
                            setCountryOpen(true);
                            setCountrySearch(event.key);
                          }
                        }}
                        aria-expanded={countryOpen}
                      >
                        <span className={`consultant-country-trigger-value ${form.country ? "has-country" : ""}`}>
                          {form.country ? (
                            <>
                              <CountryFlag country={form.country} />
                              <span className="consultant-country-trigger-name">{form.country}</span>
                            </>
                          ) : (
                            tx("Select country", "کشور را انتخاب کنید", "هېواد وټاکئ")
                          )}
                        </span>
                        <ChevronDown size={15} />
                      </button>

                      {countryOpen && (
                        <div className="consultant-country-menu">
                          <div className="consultant-country-search">
                            <Search size={15} />
                            <input
                              ref={countrySearchRef}
                              value={countrySearch}
                              onChange={(event) => setCountrySearch(event.target.value)}
                              placeholder={tx("Search country...", "جستجوی کشور...", "هېواد ولټوئ...")}
                              autoComplete="off"
                              onKeyDown={(event) => {
                                if (event.key === "Escape") {
                                  setCountryOpen(false);
                                  setCountrySearch("");
                                }
                              }}
                            />
                            {countrySearch && (
                              <button type="button" onClick={() => setCountrySearch("")} aria-label={tx("Clear country search", "پاک کردن جستجوی کشور", "د هېواد لټون پاکول")}>
                                <X size={13} />
                              </button>
                            )}
                          </div>

                          <div className="consultant-country-results">
                            {filteredCountries.map((country) => (
                              <button
                                type="button"
                                key={country}
                                className={form.country === country ? "selected" : ""}
                                onClick={() => {
                                  setForm((current) => ({ ...current, country }));
                                  setCountryOpen(false);
                                  setCountrySearch("");
                                }}
                              >
                                <CountryFlag country={country} />
                                <strong>{country}</strong>
                                {form.country === country && <Check size={15} />}
                              </button>
                            ))}

                            {!filteredCountries.length && (
                              <p>{tx("No country found", "کشوری پیدا نشد", "هېواد ونه موندل شو")}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <label>
                      <span>{tx("Language", "زبان", "ژبه")}</span>
                      <select
                        name="language"
                        value={form.language}
                        onChange={update}
                      >
                        <option value="Dari">
                          {tx("Dari", "دری", "دري")}
                        </option>
                        <option value="Pashto">
                          {tx("Pashto", "پشتو", "پښتو")}
                        </option>
                        <option value="English">
                          {tx("English", "انگلیسی", "انګلیسي")}
                        </option>
                        <option value="Other">
                          {tx("Other", "دیگر", "نور")}
                        </option>
                      </select>
                    </label>

                    {form.language === "Other" && (
                      <label className="consultant-other-language-field">
                        <span>{tx("Other Language", "زبان دیگر", "بله ژبه")}</span>
                        <input
                          name="otherLanguage"
                          value={form.otherLanguage || ""}
                          onChange={update}
                          placeholder={tx("Enter language name", "نام زبان را وارد کنید", "د ژبې نوم ولیکئ")}
                          autoFocus
                        />
                      </label>
                    )}

                    <label>
                      <span>{tx("Call Type", "نوع تماس", "د اړیکې ډول")}</span>
                      <select
                        name="callType"
                        value={form.callType}
                        onChange={update}
                      >
                        <option value="Incoming">
                          {tx("Incoming", "ورودی", "راتلونکی")}
                        </option>
                        <option value="Outgoing">
                          {tx("Outgoing", "خروجی", "وتونکی")}
                        </option>
                      </select>
                    </label>

                    <label>
                      <span>{tx("Unit", "واحد", "واحد")}</span>
                      <select
                        name="unit"
                        value={form.unit}
                        onChange={update}
                      >
                        <option value="AFN">
                          AFN - افغانی
                        </option>
                        <option value="USD">
                          {tx("USD - Dollar", "USD - دالر", "USD - ډالر")}
                        </option>
                      </select>
                    </label>

                    <label>
                      <span>{tx("Price", "قیمت", "بیه")}</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="price"
                        value={form.price}
                        onChange={update}
                        placeholder={tx("Enter price", "قیمت را وارد کنید", "بیه ولیکئ")}
                      />
                    </label>

                    {!isTravel && !isTechnology && (
                      <label>
                        <span>{tx("Scholarship Type", "نوع بورسیه", "د بورس ډول")}</span>
                        <select
                          name="scholarshipType"
                          value={form.scholarshipType}
                          onChange={update}
                        >
                          <option value="">
                            {tx("Select scholarship", "بورسیه را انتخاب کنید", "بورس وټاکئ")}
                          </option>
                          <option value="Fully Funded">
                            {tx("Fully Funded", "کاملاً تمویل‌شده", "بشپړ تمویل شوی")}
                          </option>
                          <option value="Partial Funded">
                            {tx("Partial Funded", "نیمه تمویل‌شده", "نیمه تمویل شوی")}
                          </option>
                          <option value="Private">
                            {tx("Private", "خصوصی", "خصوصي")}
                          </option>
                        </select>
                      </label>
                    )}

                    {isTechnology && (
                      <>
                        <label>
                          <span>{tx("Business Type", "نوع کسب‌وکار", "د سوداګرۍ ډول")}</span>
                          <input
                            name="businessType"
                            value={form.businessType}
                            onChange={update}
                          />
                        </label>

                        <label>
                          <span>{tx("Service Type", "نوع خدمت", "د خدمت ډول")}</span>
                          <select
                            name="technologyPurpose"
                            value={form.technologyPurpose}
                            onChange={update}
                          >
                            <option value="Database">{tx("Database", "دیتابیس", "ډیټابیس")}</option>
                            <option value="Website">{tx("Website", "وب‌سایت", "وېب‌سایټ")}</option>
                            <option value="Application">{tx("Application", "اپلیکیشن", "اپلېکېشن")}</option>
                            <option value="Networking">{tx("Networking", "شبکه‌سازی", "شبکه")}</option>
                            <option value="Other">{tx("Other", "دیگر", "نور")}</option>
                          </select>
                        </label>
                      </>
                    )}

                    <label className="consultant-form-full">
                      <span>{tx("Purpose", "هدف", "موخه")}</span>
                      <textarea
                        name="purpose"
                        value={form.purpose}
                        onChange={update}
                        rows="3"
                        placeholder={tx("Enter customer purpose", "هدف مشتری را وارد کنید", "د پېرودونکي موخه ولیکئ")}
                      />
                    </label>

                    <label className="followup-field">
                      <span>{tx("Need Follow-up", "نیاز به پیگیری", "تعقیب ته اړتیا")}</span>
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
                            ? tx("ON", "روشن", "فعال")
                            : tx("OFF", "خاموش", "بند")}
                        </b>
                      </button>
                    </label>

                    <label className="consultant-form-full">
                      <span>{tx("Note", "یادداشت", "یادښت")}</span>
                      <textarea
                        name="note"
                        value={form.note}
                        onChange={update}
                        rows="4"
                        placeholder={tx("Write additional customer notes...", "یادداشت اضافی مشتری را بنویسید...", "د پېرودونکي اضافي یادښت ولیکئ...")}
                      />
                    </label>
                  </>
                )}
              </div>

              <div className="consultant-modal-actions">
                <button
                  type="button"
                  onClick={resetForm}
                >
                  {tx("Cancel", "لغو", "لغوه")}
                </button>

                <button type="submit">
                  {editId
                    ? tx("Save Changes", "ذخیره تغییرات", "بدلونونه وساتئ")
                    : isMedia
                      ? tx("Save Media Product", "ذخیره محصول رسانه‌ای", "رسنیز محصول وساتئ")
                      : tx("Save Customer", "ذخیره مشتری", "پېرودونکی وساتئ")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewCustomer && (
        <div
          className="consultant-modal-backdrop"
          onMouseDown={() =>
            setViewCustomer(null)
          }
        >
          <div
            className="consultant-detail-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="consultant-detail-hero">
              <div>
                <b>
                  {String(
                    viewCustomer.fullName ||
                    viewCustomer.passportFullName ||
                    "C"
                  )
                    .slice(0, 1)
                    .toUpperCase()}
                </b>

                <span>
                  <small>{typeLabel}</small>
                  <h2>
                    {viewCustomer.fullName ||
                      viewCustomer.passportFullName ||
                      `Unnamed ${typeLabel}`}
                  </h2>
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewCustomer(null)
                }
              >
                <X size={18} />
              </button>
            </div>

            <div className="consultant-detail-grid">
              {[
                [tx("Employee Name", "نام کارمند", "د کارکوونکي نوم"), viewCustomer.createdByName || viewCustomer.createdByEmployeeName || viewCustomer.employeeName],
                [tx("Source", "منبع", "سرچینه"), viewCustomer.source],
                [tx("Phone Number", "شماره تماس", "د تلیفون شمېره"), viewCustomer.phone],
                [tx("Brand Name", "نام برند", "د برانډ نوم"), viewCustomer.brandName],
                [
                  tx("Purpose", "هدف", "موخه"),
                  viewCustomer.mediaPurpose ||
                    viewCustomer.purpose,
                ],
                [tx("Email", "ایمیل", "برېښنالیک"), viewCustomer.email],
                [tx("City / Province", "شهر / ولایت", "ښار / ولایت"), viewCustomer.city],
                [
                  tx("Country", "کشور", "هېواد"),
                  viewCustomer.country
                    ? getCountryLabel(
                        viewCustomer.country
                      )
                    : "",
                ],
                [tx("Language", "زبان", "ژبه"), viewCustomer.language],
                [tx("Call Type", "نوع تماس", "د اړیکې ډول"), viewCustomer.callType],
                [tx("Business Type", "نوع کسب‌وکار", "د سوداګرۍ ډول"), viewCustomer.businessType],
                [tx("Scholarship Type", "نوع بورسیه", "د بورس ډول"), viewCustomer.scholarshipType],
                [tx("Unit", "واحد", "واحد"), viewCustomer.unit || viewCustomer.currencyUnit],
                [tx("Price", "قیمت", "بیه"), formatPrice(viewCustomer)],
                [tx("Purpose", "هدف", "موخه"), viewCustomer.purpose],
                [tx("Need Follow-up", "نیاز به پیگیری", "تعقیب ته اړتیا"), viewCustomer.needFollowup],
                [tx("Note", "یادداشت", "یادښت"), viewCustomer.note],
                [
                  tx("Registration Date", "تاریخ ثبت", "د ثبت نېټه"),
                  viewCustomer.afghanistanDate ||
                    viewCustomer.date ||
                    (viewCustomer.createdAt
                      ? new Intl.DateTimeFormat(
                          "en-CA",
                          {
                            timeZone: "Asia/Kabul",
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          }
                        ).format(
                          new Date(
                            viewCustomer.createdAt
                          )
                        )
                      : ""),
                ],
                [
                  tx("Registration Time", "زمان ثبت", "د ثبت وخت"),
                  viewCustomer.afghanistanTime ||
                    viewCustomer.time ||
                    (viewCustomer.createdAt
                      ? new Intl.DateTimeFormat(
                          "en-US",
                          {
                            timeZone: "Asia/Kabul",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          }
                        ).format(
                          new Date(
                            viewCustomer.createdAt
                          )
                        )
                      : ""),
                ],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div
                    key={label}
                    className={
                      [
                        tx("Purpose", "هدف", "موخه"),
                        tx("Note", "یادداشت", "یادښت"),
                      ].includes(label)
                        ? "wide"
                        : ""
                    }
                  >
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
            </div>

            <div className="consultant-detail-actions">
              <button
                type="button"
                onClick={() => {
                  setViewCustomer(null);
                  openEdit(viewCustomer);
                }}
              >
                <Pencil size={15} />
                {tx("Edit Information", "ویرایش معلومات", "معلومات سمول")}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteCustomer && (
        <div
          className="consultant-modal-backdrop"
          onMouseDown={() =>
            setDeleteCustomer(null)
          }
        >
          <div
            className="consultant-delete-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="consultant-delete-icon">
              <AlertTriangle size={26} />
            </div>

            <h2>
              {tx("Delete", "حذف", "حذف")} {typeLabel}?
            </h2>

            <p>
              {tx(
                "You are about to permanently delete",
                "شما در حال حذف دایمی",
                "تاسو د تل لپاره حذف کوئ"
              )}{" "}
              <strong>
                {deleteCustomer.fullName ||
                  deleteCustomer.passportFullName ||
                  typeLabel}
              </strong>
              .{" "}
              {tx(
                "This action cannot be undone.",
                "این عمل قابل بازگشت نیست.",
                "دا عمل بېرته نه شي راګرځېدلی."
              )}
            </p>

            <div>
              <button
                type="button"
                onClick={() =>
                  setDeleteCustomer(null)
                }
              >
                {tx("Cancel", "لغو", "لغوه")}
              </button>

              <button
                type="button"
                onClick={remove}
              >
                <Trash2 size={15} />
                {tx("Delete", "حذف", "حذف")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsultantCustomers;
