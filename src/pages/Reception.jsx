import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Clapperboard,
  Cpu,
  Eye,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plane,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { usePackageAvailabilityDate } from "../hooks/usePackageAvailabilityDate";
import { notify } from "../utils/notify";
import { isPackageAvailable } from "../utils/packageAvailability";
import "./Reception.css";

const today = () => new Date().toISOString().slice(0, 10);

const registrationTypes = [
  {
    key: "consultant",
    title: "Register Consultant Customer",
    description: "Register an educational or consulting customer.",
    icon: BriefcaseBusiness,
  },
  {
    key: "travel",
    title: "Register Travel Customer",
    description: "Register a customer for travel services.",
    icon: Plane,
  },
  {
    key: "technology",
    title: "Register Technology Customer",
    description: "Register a technology service customer.",
    icon: Cpu,
  },
  {
    key: "media",
    title: "Add Media Product",
    description: "Register video or social media content.",
    icon: Clapperboard,
  },
];

const educationLevels = [
  "12 Pass",
  "14 Pass",
  "Bachelor",
  "Master",
  "PhD",
  "Student",
  "Other",
];

const consultantMajors = [
  "Accounting",
  "Agriculture",
  "Architecture",
  "Artificial Intelligence",
  "Biology",
  "Business Administration",
  "Chemical Engineering",
  "Chemistry",
  "Civil Engineering",
  "Computer Engineering",
  "Computer Science",
  "Dentistry",
  "Economics",
  "Education",
  "Electrical Engineering",
  "English Language and Literature",
  "Environmental Science",
  "Finance",
  "Information Technology",
  "International Relations",
  "Islamic Studies",
  "Journalism",
  "Law",
  "Management",
  "Marketing",
  "Mathematics",
  "Mechanical Engineering",
  "Medicine",
  "Nursing",
  "Pharmacy",
  "Physics",
  "Political Science",
  "Psychology",
  "Public Administration",
  "Public Health",
  "Software Engineering",
  "Sociology",
  "Statistics",
  "Telecommunication Engineering",
  "Other",
];

const technologyPurposes = [
  "Website",
  "Application",
  "Software",
  "Other",
];

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

function getCountryFlagUrl(countryName) {
  const code = getCountryCode(countryName);

  if (!code) return "";

  return `https://flagcdn.com/24x18/${code.toLowerCase()}.png`;
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

function CountrySelect({
  value,
  onChange,
  name = "country",
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
    function closeOnOutside(event) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        closeOnOutside
      );
  }, []);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return countries;

    return countries.filter((country) =>
      country.toLowerCase().includes(query)
    );
  }, [search]);

  function chooseCountry(country) {
    onChange({
      target: {
        name,
        value: country,
      },
    });

    setSearch("");
    setOpen(false);
  }

  return (
    <div
      className={`reception-country-select ${
        open ? "open" : ""
      }`}
      ref={wrapperRef}
    >
      <button
        type="button"
        className="reception-country-trigger"
        onClick={() => setOpen((current) => !current)}
      >
        {value ? (
          <span>
            <img
              src={getCountryFlagUrl(value)}
              alt=""
            />
            {value}
          </span>
        ) : (
          <span>
            {tx(
              "Select country",
              "کشور را انتخاب کنید",
              "هېواد وټاکئ"
            )}
          </span>
        )}

        <b>▾</b>
      </button>

      {open && (
        <div className="reception-country-menu">
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

          <div>
            {filteredCountries.map((country) => (
              <button
                type="button"
                key={country}
                className={
                  value === country ? "selected" : ""
                }
                onClick={() => chooseCountry(country)}
              >
                <img
                  src={getCountryFlagUrl(country)}
                  alt=""
                />
                <span>{country}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


function SearchablePackageSelect({
  label,
  packages,
  value,
  onChange,
  placeholder,
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
    const closeOnOutside = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        closeOnOutside
      );
    };
  }, []);

  const selectedItem = useMemo(
    () =>
      packages.find(
        (item) =>
          String(item.id) === String(value)
      ) || null,
    [packages, value]
  );

  const filteredPackages = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return packages;

    return packages.filter((item) =>
      [
        item.packageName,
        item.country,
        item.category,
        item.currency,
        item.note,
      ].some((entry) =>
        String(entry || "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [packages, search]);

  const choosePackage = (item) => {
    onChange({
      target: {
        name: "selectedPackageId",
        value: item.id,
      },
    });

    setSearch("");
    setOpen(false);
  };

  return (
    <div
      className={`reception-package-searchable ${
        open ? "open" : ""
      }`}
      ref={wrapperRef}
    >
      <span className="reception-package-searchable-label">
        {label}
      </span>

      <button
        type="button"
        className="reception-package-searchable-trigger"
        onClick={() =>
          setOpen((current) => !current)
        }
      >
        <span className="reception-package-searchable-value">
          {selectedItem ? (
            <>
              {selectedItem.country && (
                <img
                  src={getCountryFlagUrl(
                    selectedItem.country
                  )}
                  alt=""
                />
              )}

              <span>
                {selectedItem.packageName}
              </span>

              {selectedItem.country && (
                <small>
                  {selectedItem.country}
                </small>
              )}
            </>
          ) : (
            <span className="placeholder">
              {placeholder}
            </span>
          )}
        </span>

        <b>▾</b>
      </button>

      {open && (
        <div className="reception-package-searchable-menu">
          <div className="reception-package-search-box">
            <Search size={15} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={tx(
                "Search package, country or category...",
                "جستجوی پکیج، کشور یا کتگوری...",
                "بسته، هېواد یا کټګوري ولټوئ..."
              )}
              autoFocus
            />
          </div>

          <div className="reception-package-searchable-options">
            {filteredPackages.map((item) => {
              const isSelected =
                String(item.id) === String(value);

              return (
                <button
                  type="button"
                  key={item.id}
                  className={
                    isSelected ? "selected" : ""
                  }
                  onClick={() =>
                    choosePackage(item)
                  }
                >
                  <span className="reception-package-option-main">
                    {item.country ? (
                      <img
                        src={getCountryFlagUrl(
                          item.country
                        )}
                        alt=""
                      />
                    ) : (
                      <span className="reception-package-option-icon">
                        ▣
                      </span>
                    )}

                    <span>
                      <strong>
                        {item.packageName ||
                          tx(
                            "Unnamed Package",
                            "پکیج بدون نام",
                            "بې نومه بسته"
                          )}
                      </strong>

                      <small>
                        {[
                          item.country,
                          item.category,
                          item.currency,
                        ]
                          .filter(Boolean)
                          .join(" • ") || "Package"}
                      </small>
                    </span>
                  </span>

                  <strong className="reception-package-option-price">
                    {packageMoney(
                      item.sellingPrice,
                      item.currency || "AFN"
                    )}
                  </strong>
                </button>
              );
            })}

            {!filteredPackages.length && (
              <p className="reception-package-search-empty">
                {tx(
                  "No matching package found.",
                  "پکیج مطابق پیدا نشد.",
                  "مطابقه بسته ونه موندل شوه."
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function packageMoney(value, currency = "AFN") {
  return `${Number(value || 0).toLocaleString("en-US")} ${
    currency || "AFN"
  }`;
}

function ReceptionPackagePreview({
  title,
  packageItem,
  showCountry = false,
  showCategory = false,
  showDates = false,
  showBankStatement = false,
  showDocumentation = false,
  interfaceLanguage = "en",
}) {
  const tx = (en, dr, ps) =>
    interfaceLanguage === "dr"
      ? dr
      : interfaceLanguage === "ps"
        ? ps
        : en;
  if (!packageItem) return null;

  const currency = packageItem.currency || "AFN";

  return (
    <section className="reception-package-preview reception-form-full">
      <header>
        <div>
          <span>{title}</span>
          <h3>{packageItem.packageName || "Package"}</h3>
        </div>

        <strong>
          {packageMoney(packageItem.sellingPrice, currency)}
        </strong>
      </header>

      <div className="reception-package-preview-grid">
        {showCountry && (
          <div>
            <span>{tx("Country", "کشور", "هېواد")}</span>

            <strong className="reception-package-country">
              {packageItem.country ? (
                <>
                  <img
                    src={getCountryFlagUrl(
                      packageItem.country
                    )}
                    alt=""
                  />

                  <span>{packageItem.country}</span>
                </>
              ) : (
                "-"
              )}
            </strong>
          </div>
        )}

        {showCategory && (
          <div>
            <span>{tx("Category", "کتگوری", "کټګوري")}</span>
            <strong>{packageItem.category || "-"}</strong>
          </div>
        )}

        <div>
          <span>{tx("Unit", "واحد", "واحد")}</span>
          <strong>{currency}</strong>
        </div>

        <div>
          <span>{tx("Selling Price", "قیمت فروش", "د پلور بیه")}</span>
          <strong>
            {packageMoney(packageItem.sellingPrice, currency)}
          </strong>
        </div>

        {showDates && (
          <>
            <div>
              <span>{tx("Start Date", "تاریخ شروع", "د پیل نېټه")}</span>
              <strong>{packageItem.startDate || "-"}</strong>
            </div>

            <div>
              <span>{tx("End Date", "تاریخ ختم", "د پای نېټه")}</span>
              <strong>{packageItem.endDate || "-"}</strong>
            </div>
          </>
        )}

        {showBankStatement && (
          <div>
            <span>{tx("Bank Statement", "استیتمنت بانکی", "بانکي سټېټمنټ")}</span>
            <strong>
              {packageItem.bankStatementRequired === "Yes"
                ? packageMoney(
                    packageItem.bankStatementAmount,
                    currency
                  )
                : "Not Required"}
            </strong>
          </div>
        )}

        {showDocumentation && (
          <div className="reception-package-documentation">
            <span>{tx("Documentation", "اسناد", "اسناد")}</span>

            <strong>
              {packageItem.documentationRequired === "Yes"
                ? "Required"
                : "Not Required"}
            </strong>

            {packageItem.documentationRequired === "Yes" &&
              Array.isArray(packageItem.documents) &&
              packageItem.documents.length > 0 && (
                <div className="reception-package-document-list">
                  {packageItem.documents.map(
                    (documentName) => (
                      <b key={documentName}>
                        {documentName}
                      </b>
                    )
                  )}
                </div>
              )}
          </div>
        )}
      </div>

      {packageItem.note && (
        <div className="reception-package-preview-note">
          <span>{tx("Package Note", "یادداشت پکیج", "د بستې یادښت")}</span>
          <p>{packageItem.note}</p>
        </div>
      )}
    </section>
  );
}

function createConsultantForm() {
  return {
    selectedPackageId: "",
    fullName: "",
    phone: "",
    email: "",
    source: "",
    assignedEmployeeId: "",
    assignedEmployeeName: "",
    purpose: "",
  };
}

function createTravelForm() {
  return {
    selectedPackageId: "",
    fullName: "",
    phone: "",
    source: "",
    assignedEmployeeId: "",
    assignedEmployeeName: "",
    purpose: "",
  };
}

function createTechnologyForm() {
  return {
    selectedPackageId: "",
    fullName: "",
    companyName: "",
    contactNumber: "",
    technologyPurpose: "Website",
    source: "",
    assignedEmployeeId: "",
    assignedEmployeeName: "",
    note: "",
  };
}

function createMediaForm() {
  return {
    selectedPackageId: "",
    personName: "",
    phone: "",
    brandName: "",
    source: "",
    assignedEmployeeId: "",
    assignedEmployeeName: "",
    note: "",
  };
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function getRegistrationTitle(type) {
  return (
    registrationTypes.find((item) => item.key === type)
      ?.title || "Register Customer"
  );
}

function getEmployeeName(employee) {
  return (
    employee.fullName ||
    employee.employeeName ||
    employee.name ||
    employee.email ||
    "Unnamed Employee"
  );
}

/*
 * Assignment Accept/Reject must replace the initial Pending
 * status immediately. A later completed follow-up decision
 * such as Approved or Rejected has the highest priority.
 */
function getLatestAssignmentTransfer(customer) {
  const transfers = Array.isArray(
    customer?.assignmentTransfers
  )
    ? customer.assignmentTransfers
    : [];

  if (!transfers.length) {
    return null;
  }

  return transfers[transfers.length - 1] || null;
}

function getCustomerDisplayStatus(customer) {
  const latestTransfer =
    getLatestAssignmentTransfer(customer);

  /*
   * When an admin or employee forwards the customer to
   * another employee, Reception must see who forwarded it
   * and who currently owns the request.
   */
  if (
    latestTransfer?.toEmployeeName &&
    latestTransfer?.transferredByName
  ) {
    return `${latestTransfer.transferredByName} assigned to ${latestTransfer.toEmployeeName}`;
  }

  if (latestTransfer?.toEmployeeName) {
    return `Assigned to ${latestTransfer.toEmployeeName}`;
  }

  const decisionStatus = String(
    customer?.followUpDecisionStatus || ""
  ).trim();

  const assignmentStatus = String(
    customer?.assignmentStatus || ""
  ).trim();

  const followUpStatus = String(
    customer?.followUpStatus || ""
  ).trim();

  if (
    decisionStatus &&
    !["pending", "none"].includes(
      decisionStatus.toLowerCase()
    )
  ) {
    return decisionStatus;
  }

  if (
    assignmentStatus &&
    !["pending", "none", "assigned"].includes(
      assignmentStatus.toLowerCase()
    )
  ) {
    return assignmentStatus;
  }

  return (
    assignmentStatus ||
    followUpStatus ||
    decisionStatus ||
    "None"
  );
}

export default function Reception({ currentUser }) {
  const [
    customers,
    setCustomers,
    loadCustomers,
    customersLoaded,
  ] = useJsonCollection("customers");

  const [mediaProducts, setMediaProducts] =
    useJsonCollection("mediaProducts");

  const [employees] = useJsonCollection("employees");
  const [accounts] = useJsonCollection("accounts");

  const [educationInstitutions, setEducationInstitutions] =
    useJsonCollection("educationInstitutions");

  const [visaPackages, , , visaPackagesLoaded] =
    useJsonCollection("visaPackages");
  const [travelPackages, , , travelPackagesLoaded] =
    useJsonCollection("travelPackages");
  const [technologyPackages, , , technologyPackagesLoaded] =
    useJsonCollection("technologyPackages");
  const [mediaPackages, , , mediaPackagesLoaded] =
    useJsonCollection("mediaPackages");
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

  const [showForm, setShowForm] = useState(false);
  const [registrationType, setRegistrationType] =
    useState("consultant");

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

  const registrationTypeText = {
    consultant: {
      title: tx(
        "Register Consultant Customer",
        "ثبت مشتری مشاوره",
        "مشورتي پېرودونکی ثبت کړئ"
      ),
      description: tx(
        "Register an educational or consulting customer.",
        "مشتری خدمات تحصیلی یا مشاوره را ثبت کنید.",
        "تعلیمي یا مشورتي پېرودونکی ثبت کړئ."
      ),
    },
    travel: {
      title: tx(
        "Register Travel Customer",
        "ثبت مشتری سفر",
        "د سفر پېرودونکی ثبت کړئ"
      ),
      description: tx(
        "Register a customer for travel services.",
        "مشتری خدمات سفر را ثبت کنید.",
        "د سفر خدماتو پېرودونکی ثبت کړئ."
      ),
    },
    technology: {
      title: tx(
        "Register Technology Customer",
        "ثبت مشتری تکنالوژی",
        "د ټکنالوژۍ پېرودونکی ثبت کړئ"
      ),
      description: tx(
        "Register a technology service customer.",
        "مشتری خدمات تکنالوژی را ثبت کنید.",
        "د ټکنالوژۍ خدماتو پېرودونکی ثبت کړئ."
      ),
    },
    media: {
      title: tx(
        "Add Media Product",
        "افزودن محصول رسانه‌ای",
        "رسنیز محصول زیات کړئ"
      ),
      description: tx(
        "Register video or social media content.",
        "ویدیو یا محتوای شبکه‌های اجتماعی را ثبت کنید.",
        "ویډیو یا د ټولنیزو رسنیو محتوا ثبت کړئ."
      ),
    },
  };

  const translateReceptionValue = (value) => {
    const labels = {
      consultant: tx("Consultant", "مشاوره", "مشوره"),
      travel: tx("Travel", "سفر", "سفر"),
      technology: tx("Technology", "تکنالوژی", "ټکنالوژي"),
      media: tx("Media", "رسانه", "رسنۍ"),
      Website: tx("Website", "وب‌سایت", "وېب‌سایټ"),
      Application: tx("Application", "اپلیکیشن", "اپلېکېشن"),
      Software: tx("Software", "نرم‌افزار", "سافټویر"),
      Other: tx("Other", "دیگر", "نور"),
      None: tx("None", "هیچ", "هیڅ"),
      Pending: tx("Pending", "در انتظار", "په تمه"),
      Approved: tx("Approved", "تأییدشده", "تأیید شوی"),
      Rejected: tx("Rejected", "ردشده", "رد شوی"),
      Assigned: tx("Assigned", "ارجاع‌شده", "سپارل شوی"),
      "Walk in Customer": tx(
        "Walk in Customer",
        "مشتری حضوری",
        "حضوري پېرودونکی"
      ),
    };

    return labels[String(value || "")] || value;
  };

  const [consultantForm, setConsultantForm] = useState(
    createConsultantForm
  );

  const [travelForm, setTravelForm] = useState(
    createTravelForm
  );

  const [technologyForm, setTechnologyForm] = useState(
    createTechnologyForm
  );

  const [mediaForm, setMediaForm] = useState(
    createMediaForm
  );

  const selectedVisaPackage = useMemo(
    () =>
      availableVisaPackages.find(
        (item) =>
          String(item.id) ===
          String(consultantForm.selectedPackageId)
      ) || null,
    [availableVisaPackages, consultantForm.selectedPackageId]
  );

  const selectedTravelPackage = useMemo(
    () =>
      availableTravelPackages.find(
        (item) =>
          String(item.id) ===
          String(travelForm.selectedPackageId)
      ) || null,
    [availableTravelPackages, travelForm.selectedPackageId]
  );

  const selectedTechnologyPackage = useMemo(
    () =>
      technologyPackages.find(
        (item) =>
          String(item.id) ===
          String(technologyForm.selectedPackageId)
      ) || null,
    [technologyPackages, technologyForm.selectedPackageId]
  );

  const selectedMediaPackage = useMemo(
    () =>
      mediaPackages.find(
        (item) =>
          String(item.id) ===
          String(mediaForm.selectedPackageId)
      ) || null,
    [mediaPackages, mediaForm.selectedPackageId]
  );

  const [showInstitutionForm, setShowInstitutionForm] =
    useState(false);

  const [newInstitutionName, setNewInstitutionName] =
    useState("");

  const [majorOptions, setMajorOptions] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("isp-consultant-majors") || "[]"
      );

      return [
        ...new Set([
          ...consultantMajors,
          ...(Array.isArray(saved) ? saved : []),
        ]),
      ];
    } catch {
      return consultantMajors;
    }
  });

  const [showMajorForm, setShowMajorForm] =
    useState(false);

  const [newMajorName, setNewMajorName] =
    useState("");

  const [search, setSearch] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] =
    useState("all");

  const [editingCustomerId, setEditingCustomerId] =
    useState(null);

  const [viewCustomer, setViewCustomer] =
    useState(null);

  const [deleteCustomer, setDeleteCustomer] =
    useState(null);

  const [assignTarget, setAssignTarget] =
  useState(null);

const [assignEmployeeId, setAssignEmployeeId] =
  useState("");

const [assignEmployeeName, setAssignEmployeeName] =
  useState("");

  const [assigningRecord, setAssigningRecord] =
    useState(false);

  const customerRefreshRunningRef =
    useRef(false);
  

  /*
   * Keep Reception records synchronized without requiring
   * Ctrl+R. Polling covers changes made in another account,
   * tab or browser. Custom events update the same tab
   * immediately.
   */
  useEffect(() => {
    if (!customersLoaded) {
      return undefined;
    }

    const refreshCustomers = async () => {
      if (customerRefreshRunningRef.current) {
        return;
      }

      customerRefreshRunningRef.current = true;

      try {
        await loadCustomers();
      } finally {
        customerRefreshRunningRef.current = false;
      }
    };

    const intervalId = window.setInterval(
      refreshCustomers,
      1000
    );

    const handleImmediateRefresh = () => {
      refreshCustomers();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshCustomers();
      }
    };

    window.addEventListener(
      "isp-customer-assignment-updated",
      handleImmediateRefresh
    );

    window.addEventListener(
      "focus",
      handleImmediateRefresh
    );

    window.addEventListener(
      "storage",
      handleImmediateRefresh
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.clearInterval(intervalId);

      window.removeEventListener(
        "isp-customer-assignment-updated",
        handleImmediateRefresh
      );

      window.removeEventListener(
        "focus",
        handleImmediateRefresh
      );

      window.removeEventListener(
        "storage",
        handleImmediateRefresh
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [customersLoaded, loadCustomers]);

  function openAssignModal(customer) {
    setAssignTarget(customer);

    setAssignEmployeeId(
      customer.assignedEmployeeId || ""
    );

    setAssignEmployeeName(
      customer.assignedEmployeeName || ""
    );
  }

  function closeAssignModal() {
    if (assigningRecord) return;

    setAssignTarget(null);
    setAssignEmployeeId("");
    setAssignEmployeeName("");
  }

  function updateAssignEmployee(event) {
    const employeeId = event.target.value;

    const selectedEmployee = employeeOptions.find(
      (employee) =>
        String(
          employee.id ||
          employee.employeeId ||
          ""
        ) === String(employeeId)
    );

    setAssignEmployeeId(employeeId);

    setAssignEmployeeName(
      selectedEmployee
        ? getEmployeeName(selectedEmployee)
        : ""
    );
  }

  async function saveCustomerAssignment(event) {
    event.preventDefault();

    if (!assignTarget) return;

    if (!assignEmployeeId) {
      notify(
        "Please select an employee.",
        "error"
      );
      return;
    }

    setAssigningRecord(true);

    try {
      const assignedAt =
        new Date().toISOString();

      const nextCustomers = customers.map(
        (customer) =>
          String(customer.id) === String(assignTarget.id)
            ? {
              ...customer,

              assignedEmployeeId: assignEmployeeId,
              assignedEmployeeName: assignEmployeeName,
              assignedAt,

              assignedByAccountId:
                currentUser?.id || "",

              assignedByEmployeeId:
                currentUser?.employeeId ||
                currentUser?.id ||
                "",

              assignedByName:
                currentUser?.fullName ||
                currentUser?.username ||
                currentUser?.email ||
                "Current User",

              /*
               * هر بار که پذیرش مشتری را راجع می‌کند،
               * درخواست باید از حالت Pending آغاز شود.
               * بعداً کارمند آن را قبول یا رد می‌کند.
               */
              assignmentStatus: "Pending",
              followUpStatus: "Pending",
              followUpDecisionStatus: "Pending",
              followUpCompleted: false,
              acceptedAt: "",
              rejectedAt: "",

              updatedAt: assignedAt,
            }
            : customer
      );

      const saved =
        await setCustomers(nextCustomers);

      if (!saved) return;

      notify(
        `Customer assigned to ${assignEmployeeName}.`,
        "success"
      );

      closeAssignModal();
    } finally {
      setAssigningRecord(false);
    }
  }
const employeeOptions = useMemo(() => {
  const employeeMap = new Map();

  const addEmployee = (item) => {
    if (!item) return;

    /*
      برای حساب کارمند، employeeId شناسه اصلی کارمند است.
      برای ریکارد employees، خود id شناسه اصلی است.
    */
    const employeeId =
      item.employeeId ||
      item.id ||
      "";

    const email = String(item.email || "")
      .trim()
      .toLowerCase();

    const employeeName = String(
      getEmployeeName(item) || ""
    )
      .trim()
      .toLowerCase();

    const uniqueKey = employeeId
      ? `employee-${employeeId}`
      : email
        ? `email-${email}`
        : `name-${employeeName}`;

    if (!uniqueKey || uniqueKey === "name-") {
      return;
    }

    const existing = employeeMap.get(uniqueKey);

    if (!existing) {
      employeeMap.set(uniqueKey, {
        ...item,
        id: employeeId,
        employeeId,
      });

      return;
    }

    /*
      معلومات اصلی employees بر معلومات ناقص account ترجیح داده می‌شود.
    */
    employeeMap.set(uniqueKey, {
      ...item,
      ...existing,
      id: employeeId,
      employeeId,
      fullName:
        existing.fullName ||
        item.fullName ||
        item.employeeName ||
        item.name ||
        "",
    });
  };

  employees.forEach(addEmployee);

  accounts
    .filter((account) => {
      return (
        account.accountType === "employee" ||
        Boolean(account.employeeId) ||
        String(account.role || "")
          .trim()
          .toLowerCase()
          .includes("employee")
      );
    })
    .forEach(addEmployee);

  return Array.from(employeeMap.values()).sort(
    (first, second) =>
      getEmployeeName(first).localeCompare(
        getEmployeeName(second)
      )
  );
}, [employees, accounts]);

/*
 * Only records created from the Reception workspace belong
 * to the Reception cards and Recent Customers table.
 * Customers created by Call Center, Employee Dashboard or
 * any other module are intentionally excluded.
 */
const receptionRegisteredCustomers = useMemo(
  () =>
    customers.filter(
      (customer) =>
        String(
          customer.registeredFrom || ""
        )
          .trim()
          .toLowerCase() === "reception"
    ),
  [customers]
);

const receptionCustomers = useMemo(() => {
  const query = search.trim().toLowerCase();

  return receptionRegisteredCustomers
    .filter((customer) => {
      if (
        customerTypeFilter !== "all" &&
        customer.customerType !==
          customerTypeFilter
      ) {
        return false;
      }

      if (!query) return true;

      return [
        customer.fullName,
        customer.customerName,
        customer.phone,
        customer.contactNumber,
        customer.email,
        customer.companyName,
        customer.customerType,
        customer.source,
        customer.sourceEmployeeName,
        customer.assignedEmployeeName,
        customer.assignmentTransfers?.[
          customer.assignmentTransfers.length - 1
        ]?.transferredByName,
        customer.assignmentTransfers?.[
          customer.assignmentTransfers.length - 1
        ]?.toEmployeeName,
        customer.purpose,
        customer.technologyPurpose,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
    })
    .sort(
      (first, second) =>
        new Date(
          second.createdAt ||
            second.date ||
            0
        ) -
        new Date(
          first.createdAt ||
            first.date ||
            0
        )
    );
}, [
  receptionRegisteredCustomers,
  search,
  customerTypeFilter,
]);

const consultantCount =
  receptionRegisteredCustomers.filter(
    (customer) =>
      customer.customerType === "consultant"
  ).length;

const travelCount =
  receptionRegisteredCustomers.filter(
    (customer) =>
      customer.customerType === "travel"
  ).length;

const technologyCount =
  receptionRegisteredCustomers.filter(
    (customer) =>
      customer.customerType === "technology"
  ).length;

const mediaCount =
  receptionRegisteredCustomers.filter(
    (customer) =>
      customer.customerType === "media"
  ).length;


  function resetForms() {
    setConsultantForm(createConsultantForm());
    setTravelForm(createTravelForm());
    setTechnologyForm(createTechnologyForm());
    setMediaForm(createMediaForm());
    setShowInstitutionForm(false);
    setNewInstitutionName("");
    setShowMajorForm(false);
    setNewMajorName("");
  }

  function openAddForm() {
    resetForms();
    setEditingCustomerId(null);
    setRegistrationType("consultant");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingCustomerId(null);
    resetForms();
  }

  function selectRegistrationType(type) {
    if (editingCustomerId) return;

    setRegistrationType(type);
    resetForms();
  }

  function openEditCustomer(customer) {
    const type = String(
      customer.customerType || "consultant"
    ).toLowerCase();

    setEditingCustomerId(customer.id);
    setRegistrationType(type);

    if (type === "travel") {
      setTravelForm({
        ...createTravelForm(),
        fullName:
          customer.fullName ||
          customer.customerName ||
          "",
        phone:
          customer.phone ||
          customer.contactNumber ||
          "",
        passportNumber: customer.passportNumber || "",
        maritalStatus: customer.maritalStatus || "Single",
        selectedPackageId:
          customer.travelPackageId ||
          customer.selectedTravelPackageId ||
          "",
        source:
          customer.source ||
          (customer.sourceEmployeeName ===
          "External Customer"
            ? ""
            : customer.sourceEmployeeName) ||
          "",
        assignedEmployeeId:
          customer.assignedEmployeeId || "",
        assignedEmployeeName:
          customer.assignedEmployeeName || "",
        purpose: customer.purpose || "",
        date:
          customer.date ||
          customer.createdAt?.slice(0, 10) ||
          today(),
      });
    } else if (type === "technology") {
      setTechnologyForm({
        ...createTechnologyForm(),
        selectedPackageId:
          customer.technologyPackageId ||
          customer.selectedTechnologyPackageId ||
          "",
        fullName:
          customer.fullName ||
          customer.customerName ||
          "",
        companyName: customer.companyName || "",
        contactNumber:
          customer.contactNumber ||
          customer.phone ||
          "",
        technologyPurpose:
          customer.technologyPurpose ||
          customer.purpose ||
          "Website",
        source:
          customer.source ||
          (customer.sourceEmployeeName ===
          "External Customer"
            ? ""
            : customer.sourceEmployeeName) ||
          "",
        assignedEmployeeId:
          customer.assignedEmployeeId || "",
        assignedEmployeeName:
          customer.assignedEmployeeName || "",
        note:
          customer.note ||
          customer.notes ||
          "",
        date:
          customer.date ||
          customer.createdAt?.slice(0, 10) ||
          today(),
      });
    } else if (type === "media") {
      setMediaForm({
        ...createMediaForm(),
        selectedPackageId:
          customer.mediaPackageId ||
          customer.selectedMediaPackageId ||
          "",
        personName:
          customer.personName ||
          customer.fullName ||
          customer.customerName ||
          "",
        phone:
          customer.phone ||
          customer.contactNumber ||
          "",
        brandName: customer.brandName || "",
        source:
          customer.source ||
          (customer.sourceEmployeeName ===
          "External Customer"
            ? ""
            : customer.sourceEmployeeName) ||
          "",
        assignedEmployeeId:
          customer.assignedEmployeeId || "",
        assignedEmployeeName:
          customer.assignedEmployeeName || "",
        note:
          customer.note ||
          customer.notes ||
          "",
      });
    } else {
      setConsultantForm({
        ...createConsultantForm(),
        fullName:
          customer.fullName ||
          customer.passportFullName ||
          customer.customerName ||
          "",
        phone:
          customer.phone ||
          customer.contactNumber ||
          "",
        passportNumber: customer.passportNumber || "",
        maritalStatus: customer.maritalStatus || "Single",
        selectedPackageId:
          customer.visaPackageId ||
          customer.selectedVisaPackageId ||
          "",
        email: customer.email || "",
        graduatedMajor: customer.graduatedMajor || "",
        universityName:
          customer.universityName ||
          customer.schoolUniversity ||
          "",
        graduationPercentage:
          customer.graduationPercentage ?? "",
        graduationYear: customer.graduationYear || "",
        desiredMajor: customer.desiredMajor || "",
        source:
          customer.source ||
          (customer.sourceEmployeeName ===
          "External Customer"
            ? ""
            : customer.sourceEmployeeName) ||
          "",
        assignedEmployeeId:
          customer.assignedEmployeeId || "",
        assignedEmployeeName:
          customer.assignedEmployeeName || "",
        purpose: customer.purpose || "",
        date:
          customer.date ||
          customer.createdAt?.slice(0, 10) ||
          today(),
      });
    }

    setShowForm(true);
  }

  async function confirmDeleteCustomer() {
    if (!deleteCustomer) return;

    const latestCustomers =
      await loadCustomers();

    const nextCustomers = latestCustomers.filter(
      (customer) =>
        String(customer.id) !==
        String(deleteCustomer.id)
    );

    const saved = await setCustomers(nextCustomers);

    if (!saved) return;

    notify(
      "Customer deleted successfully.",
      "success"
    );

    setDeleteCustomer(null);
    setViewCustomer(null);
  }

  function updateConsultantField(event) {
    const { name, value } = event.target;

    if (name === "assignedEmployeeId") {
      const employee = employeeOptions.find(
        (item) =>
          String(item.id || item.employeeId) ===
          String(value)
      );

      setConsultantForm((current) => ({
        ...current,
        assignedEmployeeId: value,
        assignedEmployeeName: employee
          ? getEmployeeName(employee)
          : "",
      }));

      return;
    }

    setConsultantForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateTravelField(event) {
    const { name, value } = event.target;

    if (name === "assignedEmployeeId") {
      const employee = employeeOptions.find(
        (item) =>
          String(item.id || item.employeeId) ===
          String(value)
      );

      setTravelForm((current) => ({
        ...current,
        assignedEmployeeId: value,
        assignedEmployeeName: employee
          ? getEmployeeName(employee)
          : "",
      }));

      return;
    }

    setTravelForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateTechnologyField(event) {
    const { name, value } = event.target;

    if (name === "assignedEmployeeId") {
      const employee = employeeOptions.find(
        (item) =>
          String(item.id || item.employeeId) ===
          String(value)
      );

      setTechnologyForm((current) => ({
        ...current,
        assignedEmployeeId: value,
        assignedEmployeeName: employee
          ? getEmployeeName(employee)
          : "",
      }));

      return;
    }

    setTechnologyForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateMediaField(event) {
    const { name, value } = event.target;

    if (name === "assignedEmployeeId") {
      const employee = employeeOptions.find(
        (item) =>
          String(item.id || item.employeeId) ===
          String(value)
      );

      setMediaForm((current) => ({
        ...current,
        assignedEmployeeId: value,
        assignedEmployeeName: employee
          ? getEmployeeName(employee)
          : "",
      }));

      return;
    }

    setMediaForm((current) => ({
      ...current,
      [name]: value,
    }));
  }


  function addConsultantMajor() {
    const majorName = newMajorName.trim();

    if (!majorName) {
      notify("Please enter a major name.", "error");
      return;
    }

    const existingMajor = majorOptions.find(
      (major) =>
        String(major).trim().toLowerCase() ===
        majorName.toLowerCase()
    );

    const finalMajorName =
      existingMajor || majorName;

    const nextMajors = existingMajor
      ? majorOptions
      : [...majorOptions, majorName];

    setMajorOptions(nextMajors);

    localStorage.setItem(
      "isp-consultant-majors",
      JSON.stringify(
        nextMajors.filter(
          (major) => !consultantMajors.includes(major)
        )
      )
    );

    setConsultantForm((current) => ({
      ...current,
      graduatedMajor: finalMajorName,
    }));

    setNewMajorName("");
    setShowMajorForm(false);

    notify(
      existingMajor
        ? "This major already exists and has been selected."
        : "Major added successfully.",
      "success"
    );
  }

  async function addEducationInstitution() {
    const institutionName =
      newInstitutionName.trim();

    if (!institutionName) {
      notify(
        "School or university name is required.",
        "error"
      );
      return;
    }

    const alreadyExists = educationInstitutions.some(
      (institution) =>
        String(
          institution.name ||
            institution.institutionName ||
            ""
        ).toLowerCase() ===
        institutionName.toLowerCase()
    );

    if (alreadyExists) {
      notify(
        "This school or university already exists.",
        "error"
      );
      return;
    }

    const afghanistanTime =
      getAfghanistanDateTime();

    const record = {
      id: createId(),
      name: institutionName,
      createdAt: new Date().toISOString(),
    };

    const saved = await setEducationInstitutions([
      ...educationInstitutions,
      record,
    ]);

    if (!saved) return;

    setConsultantForm((current) => ({
      ...current,
      schoolUniversity: institutionName,
    }));

    setNewInstitutionName("");
    setShowInstitutionForm(false);

    notify(
      "School or university added successfully.",
      "success"
    );
  }

  async function saveReceptionRecord(event) {
    event.preventDefault();

    if (registrationType === "consultant") {
      await saveConsultantCustomer();
      return;
    }

    if (registrationType === "travel") {
      await saveTravelCustomer();
      return;
    }

    if (registrationType === "technology") {
      await saveTechnologyCustomer();
      return;
    }

    await saveMediaProduct();
  }

  async function saveConsultantCustomer() {
    if (!consultantForm.fullName.trim()) {
      notify(
        "Full name in passport is required.",
        "error"
      );
      return;
    }

    if (!consultantForm.phone.trim()) {
      notify("Phone number is required.", "error");
      return;
    }

    const latestCustomers =
      await loadCustomers();

    const existingCustomer = editingCustomerId
      ? latestCustomers.find(
          (customer) =>
            String(customer.id) ===
            String(editingCustomerId)
        )
      : null;

    const afghanistanTime =
      getAfghanistanDateTime();
    const now = afghanistanTime.iso;
    const assignmentChanged =
      Boolean(consultantForm.assignedEmployeeId) &&
      (!existingCustomer ||
        String(existingCustomer.assignedEmployeeId || "") !==
          String(consultantForm.assignedEmployeeId));

    const record = {
      ...(existingCustomer || {}),

      id: editingCustomerId || createId(),

      fullName: consultantForm.fullName.trim(),
      passportFullName:
        consultantForm.fullName.trim(),
      customerName: consultantForm.fullName.trim(),

      phone: consultantForm.phone.trim(),
      email: consultantForm.email.trim(),

      selectedVisaPackageId:
        consultantForm.selectedPackageId,
      visaPackageId: consultantForm.selectedPackageId,
      visaPackageName:
        selectedVisaPackage?.packageName || "",
      applicationType:
        selectedVisaPackage?.category ||
        selectedVisaPackage?.packageName ||
        "Visa Package",
      country: selectedVisaPackage?.country || "",
      packageCategory:
        selectedVisaPackage?.category || "",
      packageCurrency:
        selectedVisaPackage?.currency || "AFN",
      packageSellingPrice: Number(
        selectedVisaPackage?.sellingPrice || 0
      ),
      packageStartDate:
        selectedVisaPackage?.startDate || "",
      packageEndDate:
        selectedVisaPackage?.endDate || "",
      packageBankStatementRequired:
        selectedVisaPackage?.bankStatementRequired || "No",
      packageBankStatementAmount: Number(
        selectedVisaPackage?.bankStatementAmount || 0
      ),

      source: consultantForm.source.trim(),
      assignedEmployeeId:
        consultantForm.assignedEmployeeId,
      assignedEmployeeName:
        consultantForm.assignedEmployeeName,
      assignedAt: consultantForm.assignedEmployeeId
        ? assignmentChanged
          ? now
          : existingCustomer?.assignedAt || now
        : "",

      /*
       * اگر هنگام ثبت یا ویرایش، مشتری به کارمندی راجع شود،
       * درخواست باید ابتدا در حالت Pending ذخیره شود.
       * وضعیت Accepted/Approved/Rejected فقط بعداً توسط
       * کارمند در Application Follow-Up تغییر می‌کند.
       */
      assignmentStatus:
        consultantForm.assignedEmployeeId
          ? (
              !existingCustomer ||
              String(
                existingCustomer.assignedEmployeeId || ""
              ) !== String(
                consultantForm.assignedEmployeeId
              )
                ? "Pending"
                : existingCustomer.assignmentStatus ||
                  "Pending"
            )
          : "None",

      followUpStatus:
        consultantForm.assignedEmployeeId
          ? (
              !existingCustomer ||
              String(
                existingCustomer.assignedEmployeeId || ""
              ) !== String(
                consultantForm.assignedEmployeeId
              )
                ? "Pending"
                : existingCustomer.followUpStatus ||
                  existingCustomer.assignmentStatus ||
                  "Pending"
            )
          : "None",

      followUpDecisionStatus:
        consultantForm.assignedEmployeeId
          ? (
              !existingCustomer ||
              String(
                existingCustomer.assignedEmployeeId || ""
              ) !== String(
                consultantForm.assignedEmployeeId
              )
                ? "Pending"
                : existingCustomer.followUpDecisionStatus ||
                  existingCustomer.followUpStatus ||
                  existingCustomer.assignmentStatus ||
                  "Pending"
            )
          : "None",

      followUpCompleted:
        consultantForm.assignedEmployeeId
          ? (
              !existingCustomer ||
              String(
                existingCustomer.assignedEmployeeId || ""
              ) !== String(
                consultantForm.assignedEmployeeId
              )
                ? false
                : Boolean(
                    existingCustomer.followUpCompleted
                  )
            )
          : false,

      acceptedAt:
        consultantForm.assignedEmployeeId &&
        existingCustomer &&
        String(
          existingCustomer.assignedEmployeeId || ""
        ) === String(
          consultantForm.assignedEmployeeId
        )
          ? existingCustomer.acceptedAt || ""
          : "",

      rejectedAt:
        consultantForm.assignedEmployeeId &&
        existingCustomer &&
        String(
          existingCustomer.assignedEmployeeId || ""
        ) === String(
          consultantForm.assignedEmployeeId
        )
          ? existingCustomer.rejectedAt || ""
          : "",

      purpose: consultantForm.purpose.trim(),
      /*
       * تاریخ و ساعت ثبت اولیه ثابت می‌ماند.
       * هنگام Edit فقط updatedAt تغییر می‌کند.
       */
      date:
        existingCustomer?.date ||
        existingCustomer?.afghanistanDate ||
        afghanistanTime.date,
      time:
        existingCustomer?.time ||
        existingCustomer?.afghanistanTime ||
        afghanistanTime.time,
      afghanistanDate:
        existingCustomer?.afghanistanDate ||
        existingCustomer?.date ||
        afghanistanTime.date,
      afghanistanTime:
        existingCustomer?.afghanistanTime ||
        existingCustomer?.time ||
        afghanistanTime.time,
      afghanistanDateTime:
        existingCustomer?.afghanistanDateTime ||
        (existingCustomer?.afghanistanDate &&
        existingCustomer?.afghanistanTime
          ? `${existingCustomer.afghanistanDate}T${existingCustomer.afghanistanTime}+04:30`
          : existingCustomer?.date &&
              existingCustomer?.time
            ? `${existingCustomer.date}T${existingCustomer.time}+04:30`
            : afghanistanTime.dateTime),

      customerType: "consultant",
      specializedCustomer: true,
      registeredFrom:
        existingCustomer?.registeredFrom ||
        "reception",
      adminNotificationType: assignmentChanged
        ? "reception-assignment"
        : existingCustomer?.adminNotificationType ||
          (!editingCustomerId
            ? "customer-created"
            : ""),
      adminNotificationSection: "Consultant Customer",
      adminNotificationAt: assignmentChanged
        ? now
        : existingCustomer?.adminNotificationAt ||
          (!editingCustomerId ? now : ""),
      adminNotificationSound: assignmentChanged,

      /*
       * Source determines who brought this customer.
       * Walk in Customer has no employee commission.
       */
      sourceEmployeeId:
        consultantForm.source &&
        consultantForm.source !== "Walk in Customer"
          ? employeeOptions.find(
              (employee) =>
                getEmployeeName(employee) ===
                consultantForm.source
            )?.id || ""
          : "",

      sourceEmployeeName:
        consultantForm.source ||
        "External Customer",

      createdByAccountId:
        existingCustomer?.createdByAccountId ||
        currentUser?.id ||
        "",
      createdByName:
        existingCustomer?.createdByName ||
        currentUser?.fullName ||
        currentUser?.username ||
        currentUser?.email ||
        "Reception",

      createdAt:
        existingCustomer?.createdAt || now,
      updatedAt: now,
    };

    const nextCustomers = editingCustomerId
      ? latestCustomers.map((customer) =>
          String(customer.id) ===
          String(editingCustomerId)
            ? record
            : customer
        )
      : [...latestCustomers, record];

    const saved = await setCustomers(nextCustomers);

    if (!saved) return;

    window.dispatchEvent(
      new CustomEvent(
        "isp-customer-assignment-updated",
        {
          detail: {
            action: editingCustomerId
              ? "updated"
              : "created",
            customerId: record.id,
            updatedAt: now,
          },
        }
      )
    );

    notify(
      editingCustomerId
        ? "Consultant customer updated successfully."
        : "Consultant customer registered successfully.",
      "success"
    );

    closeForm();
  }

  async function saveTravelCustomer() {
    if (!travelForm.fullName.trim()) {
      notify(
        "Full name in passport is required.",
        "error"
      );
      return;
    }

    if (!travelForm.phone.trim()) {
      notify("Phone number is required.", "error");
      return;
    }

    const latestCustomers =
      await loadCustomers();

    const existingCustomer = editingCustomerId
      ? latestCustomers.find(
          (customer) =>
            String(customer.id) ===
            String(editingCustomerId)
        )
      : null;

    const afghanistanTime =
      getAfghanistanDateTime();
    const now = afghanistanTime.iso;
    const assignmentChanged =
      Boolean(travelForm.assignedEmployeeId) &&
      (!existingCustomer ||
        String(existingCustomer.assignedEmployeeId || "") !==
          String(travelForm.assignedEmployeeId));

    const record = {
      ...(existingCustomer || {}),

      id: editingCustomerId || createId(),

      fullName: travelForm.fullName.trim(),
      passportFullName:
        travelForm.fullName.trim(),
      customerName: travelForm.fullName.trim(),

      phone: travelForm.phone.trim(),

      selectedTravelPackageId:
        travelForm.selectedPackageId,
      travelPackageId: travelForm.selectedPackageId,
      travelPackageName:
        selectedTravelPackage?.packageName || "",
      applicationType:
        selectedTravelPackage?.category ||
        selectedTravelPackage?.packageName ||
        "Travel Package",
      country: selectedTravelPackage?.country || "",
      packageCategory:
        selectedTravelPackage?.category || "",
      packageCurrency:
        selectedTravelPackage?.currency || "AFN",
      packageSellingPrice: Number(
        selectedTravelPackage?.sellingPrice || 0
      ),
      packageStartDate:
        selectedTravelPackage?.startDate || "",
      packageEndDate:
        selectedTravelPackage?.endDate || "",
      packageBankStatementRequired:
        selectedTravelPackage?.bankStatementRequired || "No",
      packageBankStatementAmount: Number(
        selectedTravelPackage?.bankStatementAmount || 0
      ),

      source: travelForm.source.trim(),

      assignedEmployeeId:
        travelForm.assignedEmployeeId,
      assignedEmployeeName:
        travelForm.assignedEmployeeName,
      assignedAt: travelForm.assignedEmployeeId
        ? assignmentChanged
          ? now
          : existingCustomer?.assignedAt || now
        : "",

      /*
       * اگر هنگام ثبت یا ویرایش، مشتری به کارمندی راجع شود،
       * درخواست باید ابتدا در حالت Pending ذخیره شود.
       * وضعیت Accepted/Approved/Rejected فقط بعداً توسط
       * کارمند در Application Follow-Up تغییر می‌کند.
       */
      assignmentStatus:
        travelForm.assignedEmployeeId
          ? (
              !existingCustomer ||
              String(
                existingCustomer.assignedEmployeeId || ""
              ) !== String(
                travelForm.assignedEmployeeId
              )
                ? "Pending"
                : existingCustomer.assignmentStatus ||
                  "Pending"
            )
          : "None",

      followUpStatus:
        travelForm.assignedEmployeeId
          ? (
              !existingCustomer ||
              String(
                existingCustomer.assignedEmployeeId || ""
              ) !== String(
                travelForm.assignedEmployeeId
              )
                ? "Pending"
                : existingCustomer.followUpStatus ||
                  existingCustomer.assignmentStatus ||
                  "Pending"
            )
          : "None",

      followUpDecisionStatus:
        travelForm.assignedEmployeeId
          ? (
              !existingCustomer ||
              String(
                existingCustomer.assignedEmployeeId || ""
              ) !== String(
                travelForm.assignedEmployeeId
              )
                ? "Pending"
                : existingCustomer.followUpDecisionStatus ||
                  existingCustomer.followUpStatus ||
                  existingCustomer.assignmentStatus ||
                  "Pending"
            )
          : "None",

      followUpCompleted:
        travelForm.assignedEmployeeId
          ? (
              !existingCustomer ||
              String(
                existingCustomer.assignedEmployeeId || ""
              ) !== String(
                travelForm.assignedEmployeeId
              )
                ? false
                : Boolean(
                    existingCustomer.followUpCompleted
                  )
            )
          : false,

      acceptedAt:
        travelForm.assignedEmployeeId &&
        existingCustomer &&
        String(
          existingCustomer.assignedEmployeeId || ""
        ) === String(
          travelForm.assignedEmployeeId
        )
          ? existingCustomer.acceptedAt || ""
          : "",

      rejectedAt:
        travelForm.assignedEmployeeId &&
        existingCustomer &&
        String(
          existingCustomer.assignedEmployeeId || ""
        ) === String(
          travelForm.assignedEmployeeId
        )
          ? existingCustomer.rejectedAt || ""
          : "",

      purpose: travelForm.purpose.trim(),
      /*
       * تاریخ و ساعت ثبت اولیه ثابت می‌ماند.
       * هنگام Edit فقط updatedAt تغییر می‌کند.
       */
      date:
        existingCustomer?.date ||
        existingCustomer?.afghanistanDate ||
        afghanistanTime.date,
      time:
        existingCustomer?.time ||
        existingCustomer?.afghanistanTime ||
        afghanistanTime.time,
      afghanistanDate:
        existingCustomer?.afghanistanDate ||
        existingCustomer?.date ||
        afghanistanTime.date,
      afghanistanTime:
        existingCustomer?.afghanistanTime ||
        existingCustomer?.time ||
        afghanistanTime.time,
      afghanistanDateTime:
        existingCustomer?.afghanistanDateTime ||
        (existingCustomer?.afghanistanDate &&
        existingCustomer?.afghanistanTime
          ? `${existingCustomer.afghanistanDate}T${existingCustomer.afghanistanTime}+04:30`
          : existingCustomer?.date &&
              existingCustomer?.time
            ? `${existingCustomer.date}T${existingCustomer.time}+04:30`
            : afghanistanTime.dateTime),

      customerType: "travel",
      specializedCustomer: true,
      registeredFrom:
        existingCustomer?.registeredFrom ||
        "reception",
      adminNotificationType: assignmentChanged
        ? "reception-assignment"
        : existingCustomer?.adminNotificationType ||
          (!editingCustomerId
            ? "customer-created"
            : ""),
      adminNotificationSection: "Travel Customer",
      adminNotificationAt: assignmentChanged
        ? now
        : existingCustomer?.adminNotificationAt ||
          (!editingCustomerId ? now : ""),
      adminNotificationSound: assignmentChanged,

      /*
       * Source determines who brought this customer.
       * Walk in Customer has no employee commission.
       */
      sourceEmployeeId:
        travelForm.source &&
        travelForm.source !== "Walk in Customer"
          ? employeeOptions.find(
              (employee) =>
                getEmployeeName(employee) ===
                travelForm.source
            )?.id || ""
          : "",

      sourceEmployeeName:
        travelForm.source ||
        "External Customer",

      createdByAccountId:
        existingCustomer?.createdByAccountId ||
        currentUser?.id ||
        "",
      createdByName:
        existingCustomer?.createdByName ||
        currentUser?.fullName ||
        currentUser?.username ||
        currentUser?.email ||
        "Reception",

      createdAt:
        existingCustomer?.createdAt || now,
      updatedAt: now,
    };

    const nextCustomers = editingCustomerId
      ? latestCustomers.map((customer) =>
          String(customer.id) ===
          String(editingCustomerId)
            ? record
            : customer
        )
      : [...latestCustomers, record];

    const saved = await setCustomers(nextCustomers);

    if (!saved) return;

    window.dispatchEvent(
      new CustomEvent(
        "isp-customer-assignment-updated",
        {
          detail: {
            action: editingCustomerId
              ? "updated"
              : "created",
            customerId: record.id,
            updatedAt: now,
          },
        }
      )
    );

    notify(
      editingCustomerId
        ? "Travel customer updated successfully."
        : "Travel customer registered successfully.",
      "success"
    );

    closeForm();
  }

  async function saveTechnologyCustomer() {
    if (!technologyForm.fullName.trim()) {
      notify("Full name is required.", "error");
      return;
    }

    if (!technologyForm.contactNumber.trim()) {
      notify("Contact number is required.", "error");
      return;
    }

    const latestCustomers =
      await loadCustomers();

    const existingCustomer = editingCustomerId
      ? latestCustomers.find(
          (customer) =>
            String(customer.id) ===
            String(editingCustomerId)
        )
      : null;

    const afghanistanTime =
      getAfghanistanDateTime();
    const now = afghanistanTime.iso;
    const assignmentChanged =
      Boolean(technologyForm.assignedEmployeeId) &&
      (!existingCustomer ||
        String(existingCustomer.assignedEmployeeId || "") !==
          String(technologyForm.assignedEmployeeId));

    const record = {
      ...(existingCustomer || {}),

      id: editingCustomerId || createId(),

      fullName: technologyForm.fullName.trim(),
      customerName:
        technologyForm.fullName.trim(),

      companyName:
        technologyForm.companyName.trim(),

      contactNumber:
        technologyForm.contactNumber.trim(),

      selectedTechnologyPackageId:
        technologyForm.selectedPackageId,
      technologyPackageId:
        technologyForm.selectedPackageId,
      technologyPackageName:
        selectedTechnologyPackage?.packageName || "",
      packageCurrency:
        selectedTechnologyPackage?.currency || "AFN",
      packageSellingPrice: Number(
        selectedTechnologyPackage?.sellingPrice || 0
      ),
      packageNote:
        selectedTechnologyPackage?.note || "",

      phone:
        technologyForm.contactNumber.trim(),

      technologyPurpose:
        technologyForm.technologyPurpose,

      purpose:
        technologyForm.technologyPurpose,

      source: technologyForm.source.trim(),

      assignedEmployeeId:
        technologyForm.assignedEmployeeId,

      assignedEmployeeName:
        technologyForm.assignedEmployeeName,
      assignedAt: technologyForm.assignedEmployeeId
        ? assignmentChanged
          ? now
          : existingCustomer?.assignedAt || now
        : "",

      /*
       * اگر هنگام ثبت یا ویرایش، مشتری به کارمندی راجع شود،
       * درخواست باید ابتدا در حالت Pending ذخیره شود.
       * وضعیت Accepted/Approved/Rejected فقط بعداً توسط
       * کارمند در Application Follow-Up تغییر می‌کند.
       */
      assignmentStatus:
        technologyForm.assignedEmployeeId
          ? (
              !existingCustomer ||
              String(
                existingCustomer.assignedEmployeeId || ""
              ) !== String(
                technologyForm.assignedEmployeeId
              )
                ? "Pending"
                : existingCustomer.assignmentStatus ||
                  "Pending"
            )
          : "None",

      followUpStatus:
        technologyForm.assignedEmployeeId
          ? (
              !existingCustomer ||
              String(
                existingCustomer.assignedEmployeeId || ""
              ) !== String(
                technologyForm.assignedEmployeeId
              )
                ? "Pending"
                : existingCustomer.followUpStatus ||
                  existingCustomer.assignmentStatus ||
                  "Pending"
            )
          : "None",

      followUpDecisionStatus:
        technologyForm.assignedEmployeeId
          ? (
              !existingCustomer ||
              String(
                existingCustomer.assignedEmployeeId || ""
              ) !== String(
                technologyForm.assignedEmployeeId
              )
                ? "Pending"
                : existingCustomer.followUpDecisionStatus ||
                  existingCustomer.followUpStatus ||
                  existingCustomer.assignmentStatus ||
                  "Pending"
            )
          : "None",

      followUpCompleted:
        technologyForm.assignedEmployeeId
          ? (
              !existingCustomer ||
              String(
                existingCustomer.assignedEmployeeId || ""
              ) !== String(
                technologyForm.assignedEmployeeId
              )
                ? false
                : Boolean(
                    existingCustomer.followUpCompleted
                  )
            )
          : false,

      acceptedAt:
        technologyForm.assignedEmployeeId &&
        existingCustomer &&
        String(
          existingCustomer.assignedEmployeeId || ""
        ) === String(
          technologyForm.assignedEmployeeId
        )
          ? existingCustomer.acceptedAt || ""
          : "",

      rejectedAt:
        technologyForm.assignedEmployeeId &&
        existingCustomer &&
        String(
          existingCustomer.assignedEmployeeId || ""
        ) === String(
          technologyForm.assignedEmployeeId
        )
          ? existingCustomer.rejectedAt || ""
          : "",

      note: technologyForm.note.trim(),
      notes: technologyForm.note.trim(),
      /*
       * تاریخ و ساعت ثبت اولیه ثابت می‌ماند.
       * هنگام Edit فقط updatedAt تغییر می‌کند.
       */
      date:
        existingCustomer?.date ||
        existingCustomer?.afghanistanDate ||
        afghanistanTime.date,
      time:
        existingCustomer?.time ||
        existingCustomer?.afghanistanTime ||
        afghanistanTime.time,
      afghanistanDate:
        existingCustomer?.afghanistanDate ||
        existingCustomer?.date ||
        afghanistanTime.date,
      afghanistanTime:
        existingCustomer?.afghanistanTime ||
        existingCustomer?.time ||
        afghanistanTime.time,
      afghanistanDateTime:
        existingCustomer?.afghanistanDateTime ||
        (existingCustomer?.afghanistanDate &&
        existingCustomer?.afghanistanTime
          ? `${existingCustomer.afghanistanDate}T${existingCustomer.afghanistanTime}+04:30`
          : existingCustomer?.date &&
              existingCustomer?.time
            ? `${existingCustomer.date}T${existingCustomer.time}+04:30`
            : afghanistanTime.dateTime),

      customerType: "technology",
      specializedCustomer: true,
      registeredFrom:
        existingCustomer?.registeredFrom ||
        "reception",
      adminNotificationType: assignmentChanged
        ? "reception-assignment"
        : existingCustomer?.adminNotificationType ||
          (!editingCustomerId
            ? "customer-created"
            : ""),
      adminNotificationSection: "Technology Customer",
      adminNotificationAt: assignmentChanged
        ? now
        : existingCustomer?.adminNotificationAt ||
          (!editingCustomerId ? now : ""),
      adminNotificationSound: assignmentChanged,

      /*
       * Source determines who brought this customer.
       * Walk in Customer has no employee commission.
       */
      sourceEmployeeId:
        technologyForm.source &&
        technologyForm.source !== "Walk in Customer"
          ? employeeOptions.find(
              (employee) =>
                getEmployeeName(employee) ===
                technologyForm.source
            )?.id || ""
          : "",

      sourceEmployeeName:
        technologyForm.source ||
        "External Customer",

      createdByAccountId:
        existingCustomer?.createdByAccountId ||
        currentUser?.id ||
        "",
      createdByName:
        existingCustomer?.createdByName ||
        currentUser?.fullName ||
        currentUser?.username ||
        currentUser?.email ||
        "Reception",

      createdAt:
        existingCustomer?.createdAt || now,
      updatedAt: now,
    };

    const nextCustomers = editingCustomerId
      ? latestCustomers.map((customer) =>
          String(customer.id) ===
          String(editingCustomerId)
            ? record
            : customer
        )
      : [...latestCustomers, record];

    const saved = await setCustomers(nextCustomers);

    if (!saved) return;

    window.dispatchEvent(
      new CustomEvent(
        "isp-customer-assignment-updated",
        {
          detail: {
            action: editingCustomerId
              ? "updated"
              : "created",
            customerId: record.id,
            updatedAt: now,
          },
        }
      )
    );

    notify(
      editingCustomerId
        ? "Technology customer updated successfully."
        : "Technology customer registered successfully.",
      "success"
    );

    closeForm();
  }

  async function saveMediaProduct() {
    if (!mediaForm.personName.trim()) {
      notify("Person name is required.", "error");
      return;
    }

    if (!mediaForm.phone.trim()) {
      notify("Phone number is required.", "error");
      return;
    }

    if (!mediaForm.brandName.trim()) {
      notify("Brand name is required.", "error");
      return;
    }

    if (!mediaForm.assignedEmployeeId) {
      notify(
        "Please select an employee in Assign To.",
        "error"
      );
      return;
    }

    const latestCustomers =
      await loadCustomers();

    const existingCustomer = editingCustomerId
      ? latestCustomers.find(
          (customer) =>
            String(customer.id) ===
            String(editingCustomerId)
        )
      : null;

    if (editingCustomerId && !existingCustomer) {
      notify(
        "The selected customer could not be found for editing.",
        "error"
      );
      return;
    }

    const afghanistanTime =
      getAfghanistanDateTime();

    const sourceEmployee =
      mediaForm.source &&
      mediaForm.source !== "Walk in Customer"
        ? employeeOptions.find(
            (employee) =>
              getEmployeeName(employee) ===
              mediaForm.source
          )
        : null;

    const customerId =
      existingCustomer?.id ||
      editingCustomerId ||
      createId();

    const assignmentChanged =
      Boolean(existingCustomer) &&
      String(
        existingCustomer.assignedEmployeeId || ""
      ) !== String(
        mediaForm.assignedEmployeeId || ""
      );

    const customerRecord = {
      ...(existingCustomer || {}),

      id: customerId,
      fullName: mediaForm.personName.trim(),
      customerName: mediaForm.personName.trim(),
      personName: mediaForm.personName.trim(),
      phone: mediaForm.phone.trim(),
      contactNumber: mediaForm.phone.trim(),
      brandName: mediaForm.brandName.trim(),

      selectedMediaPackageId:
        mediaForm.selectedPackageId,
      mediaPackageId: mediaForm.selectedPackageId,
      mediaPackageName:
        selectedMediaPackage?.packageName || "",
      country: selectedMediaPackage?.country || "",
      packageCategory:
        selectedMediaPackage?.category || "",
      packageCurrency:
        selectedMediaPackage?.currency || "AFN",
      packageSellingPrice: Number(
        selectedMediaPackage?.sellingPrice || 0
      ),
      packageNote:
        selectedMediaPackage?.note || "",

      customerType: "media",
      specializedCustomer: true,
      registeredFrom:
        existingCustomer?.registeredFrom ||
        "reception",
      adminNotificationType:
        !existingCustomer || assignmentChanged
          ? "reception-assignment"
          : existingCustomer.adminNotificationType ||
            "customer-created",
      adminNotificationSection: "Media Customer",
      adminNotificationAt:
        !existingCustomer || assignmentChanged
          ? afghanistanTime.iso
          : existingCustomer.adminNotificationAt ||
            afghanistanTime.iso,
      adminNotificationSound:
        !existingCustomer || assignmentChanged,

      source: mediaForm.source.trim(),
      sourceEmployeeId:
        sourceEmployee?.id ||
        sourceEmployee?.employeeId ||
        "",
      sourceEmployeeName:
        mediaForm.source ||
        "External Customer",

      assignedEmployeeId:
        mediaForm.assignedEmployeeId,
      assignedEmployeeName:
        mediaForm.assignedEmployeeName,

      assignedAt:
        !existingCustomer || assignmentChanged
          ? afghanistanTime.iso
          : existingCustomer.assignedAt ||
            afghanistanTime.iso,

      assignmentStatus:
        !existingCustomer || assignmentChanged
          ? "Pending"
          : existingCustomer.assignmentStatus ||
            "Pending",

      followUpStatus:
        !existingCustomer || assignmentChanged
          ? "Pending"
          : existingCustomer.followUpStatus ||
            existingCustomer.assignmentStatus ||
            "Pending",

      followUpDecisionStatus:
        !existingCustomer || assignmentChanged
          ? "Pending"
          : existingCustomer.followUpDecisionStatus ||
            existingCustomer.followUpStatus ||
            existingCustomer.assignmentStatus ||
            "Pending",

      followUpCompleted:
        !existingCustomer || assignmentChanged
          ? false
          : Boolean(
              existingCustomer.followUpCompleted
            ),

      acceptedAt:
        !existingCustomer || assignmentChanged
          ? ""
          : existingCustomer.acceptedAt || "",

      rejectedAt:
        !existingCustomer || assignmentChanged
          ? ""
          : existingCustomer.rejectedAt || "",

      note: mediaForm.note.trim(),
      notes: mediaForm.note.trim(),

      date:
        existingCustomer?.date ||
        existingCustomer?.afghanistanDate ||
        afghanistanTime.date,

      time:
        existingCustomer?.time ||
        existingCustomer?.afghanistanTime ||
        afghanistanTime.time,

      afghanistanDate:
        existingCustomer?.afghanistanDate ||
        existingCustomer?.date ||
        afghanistanTime.date,

      afghanistanTime:
        existingCustomer?.afghanistanTime ||
        existingCustomer?.time ||
        afghanistanTime.time,

      afghanistanDateTime:
        existingCustomer?.afghanistanDateTime ||
        afghanistanTime.dateTime,

      createdByAccountId:
        existingCustomer?.createdByAccountId ||
        currentUser?.id ||
        "",

      createdByName:
        existingCustomer?.createdByName ||
        currentUser?.fullName ||
        "",

      createdAt:
        existingCustomer?.createdAt ||
        afghanistanTime.iso,

      updatedAt: afghanistanTime.iso,
    };

    const nextCustomers = existingCustomer
      ? latestCustomers.map((customer) =>
          String(customer.id) ===
          String(customerId)
            ? customerRecord
            : customer
        )
      : [...latestCustomers, customerRecord];

    const customerSaved =
      await setCustomers(nextCustomers);

    if (!customerSaved) return;

    const existingProduct = mediaProducts.find(
      (product) =>
        String(product.customerId || "") ===
        String(customerId)
    );

    const productRecord = {
      ...(existingProduct || {}),

      id:
        existingProduct?.id ||
        createId(),

      customerId,
      personName: mediaForm.personName.trim(),
      brandName: mediaForm.brandName.trim(),

      selectedMediaPackageId:
        mediaForm.selectedPackageId,
      mediaPackageId: mediaForm.selectedPackageId,
      mediaPackageName:
        selectedMediaPackage?.packageName || "",
      country: selectedMediaPackage?.country || "",
      packageCategory:
        selectedMediaPackage?.category || "",
      packageCurrency:
        selectedMediaPackage?.currency || "AFN",
      packageSellingPrice: Number(
        selectedMediaPackage?.sellingPrice || 0
      ),
      packageNote:
        selectedMediaPackage?.note || "",
      source: mediaForm.source.trim(),

      assignedEmployeeId:
        mediaForm.assignedEmployeeId,

      assignedEmployeeName:
        mediaForm.assignedEmployeeName,

      assignmentStatus:
        customerRecord.assignmentStatus,

      note: mediaForm.note.trim(),

      date:
        existingProduct?.date ||
        customerRecord.date,

      time:
        existingProduct?.time ||
        customerRecord.time,

      afghanistanDate:
        existingProduct?.afghanistanDate ||
        customerRecord.afghanistanDate,

      afghanistanTime:
        existingProduct?.afghanistanTime ||
        customerRecord.afghanistanTime,

      afghanistanDateTime:
        existingProduct?.afghanistanDateTime ||
        customerRecord.afghanistanDateTime,

      registeredFrom: "reception",

      createdByAccountId:
        existingProduct?.createdByAccountId ||
        currentUser?.id ||
        "",

      createdByName:
        existingProduct?.createdByName ||
        currentUser?.fullName ||
        "",

      createdAt:
        existingProduct?.createdAt ||
        afghanistanTime.iso,

      updatedAt: afghanistanTime.iso,
    };

    const nextMediaProducts = existingProduct
      ? mediaProducts.map((product) =>
          String(product.id) ===
          String(existingProduct.id)
            ? productRecord
            : product
        )
      : [...mediaProducts, productRecord];

    const productSaved =
      await setMediaProducts(nextMediaProducts);

    if (!productSaved) return;

    window.dispatchEvent(
      new CustomEvent(
        "isp-customer-assignment-updated",
        {
          detail: {
            action: existingCustomer
              ? "updated"
              : "created",
            customerId,
            updatedAt: afghanistanTime.iso,
          },
        }
      )
    );

    notify(
      existingCustomer
        ? "Media customer updated successfully."
        : `Media customer assigned to ${mediaForm.assignedEmployeeName} with Pending status.`,
      "success"
    );

    closeForm();
  }

  return (
    <div className={`reception-page ${interfaceLanguage !== "en" ? "reception-page-rtl" : ""}`}>
      <header className="reception-heading">
        <div>
          <span>{tx("Customer Registration", "ثبت مشتریان", "د پېرودونکو ثبت")}</span>
          <h1>{tx("Reception", "پذیرش", "استقبال")}</h1>

          <p>
            {tx(
              "Register consultant, travel, technology customers and media products from one workspace.",
              "مشتریان مشاوره، سفر، تکنالوژی و محصولات رسانه‌ای را از یک بخش ثبت کنید.",
              "مشورتي، سفري، ټکنالوژۍ پېرودونکي او رسنیز محصولات له یوه ځایه ثبت کړئ."
            )}
          </p>
        </div>

        <button type="button" onClick={openAddForm}>
          <Plus size={17} />
          {tx("Add Customer", "افزودن مشتری", "پېرودونکی زیاتول")}
        </button>
      </header>

      <section className="reception-stats">
  <button
    type="button"
    className={customerTypeFilter === "all" ? "active" : ""}
    onClick={() => setCustomerTypeFilter("all")}
  >
    <Users />
    <span>{tx("Total Customers", "مجموع مشتریان", "ټول پېرودونکي")}</span>
    <strong>{receptionRegisteredCustomers.length}</strong>
    <small>{tx("Registered through reception", "ثبت‌شده از طریق پذیرش", "د استقبال له لارې ثبت شوي")}</small>
  </button>

  <button
    type="button"
    className={customerTypeFilter === "consultant" ? "active" : ""}
    onClick={() => setCustomerTypeFilter("consultant")}
  >
    <BriefcaseBusiness />
    <span>{tx("Consultant Customers", "مشتریان مشاوره", "مشورتي پېرودونکي")}</span>
    <strong>{consultantCount}</strong>
    <small>{tx("Consultation records", "سوابق مشاوره", "د مشورې ریکارډونه")}</small>
  </button>

  <button
    type="button"
    className={customerTypeFilter === "travel" ? "active" : ""}
    onClick={() => setCustomerTypeFilter("travel")}
  >
    <Plane />
    <span>{tx("Travel Customers", "مشتریان سفر", "د سفر پېرودونکي")}</span>
    <strong>{travelCount}</strong>
    <small>{tx("Travel service records", "سوابق خدمات سفر", "د سفر خدماتو ریکارډونه")}</small>
  </button>

  <button
    type="button"
    className={customerTypeFilter === "technology" ? "active" : ""}
    onClick={() => setCustomerTypeFilter("technology")}
  >
    <Cpu />
    <span>{tx("Technology Customers", "مشتریان تکنالوژی", "د ټکنالوژۍ پېرودونکي")}</span>
    <strong>{technologyCount}</strong>
    <small>{tx("Technology service records", "سوابق خدمات تکنالوژی", "د ټکنالوژۍ خدماتو ریکارډونه")}</small>
  </button>

  <button
    type="button"
    className={`reception-media-stat ${
      customerTypeFilter === "media"
        ? "active"
        : ""
    }`}
    onClick={() =>
      setCustomerTypeFilter("media")
    }
  >
    <Clapperboard />
    <span>{tx("Media Products", "محصولات رسانه‌ای", "رسنیز محصولات")}</span>
    <strong>{mediaCount}</strong>
    <small>{tx("Videos and posts", "ویدیوها و پست‌ها", "ویډیوګانې او پوسټونه")}</small>
  </button>
</section>

      <section className="reception-records">
        <div className="reception-records-header">
          <div>
            <h2>
              {customerTypeFilter === "all"
                ? tx("Recent Customers", "مشتریان اخیر", "وروستي پېرودونکي")
                : customerTypeFilter === "consultant"
                  ? tx("Consultant Customers", "مشتریان مشاوره", "مشورتي پېرودونکي")
                  : customerTypeFilter === "travel"
                    ? tx("Travel Customers", "مشتریان سفر", "د سفر پېرودونکي")
                    : customerTypeFilter === "media"
                      ? tx("Media Products", "محصولات رسانه‌ای", "رسنیز محصولات")
                      : tx("Technology Customers", "مشتریان تکنالوژی", "د ټکنالوژۍ پېرودونکي")}
            </h2>

            <p>
              {tx(
                "Customers registered from the Reception page.",
                "مشتریانی که از صفحه پذیرش ثبت شده‌اند.",
                "هغه پېرودونکي چې د استقبال له پاڼې ثبت شوي."
              )}
            </p>
          </div>

          <label className="reception-search">
            <Search size={16} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={tx("Search customers...", "جستجوی مشتریان...", "پېرودونکي ولټوئ...")}
            />
          </label>
        </div>

        <div className="reception-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{tx("Customer", "مشتری", "پېرودونکی")}</th>
                <th>{tx("Phone", "شماره تماس", "د تلیفون شمېره")}</th>
                <th>{tx("Customer Type", "نوع مشتری", "د پېرودونکي ډول")}</th>
                <th>{tx("Source", "منبع", "سرچینه")}</th>
                <th>{tx("Assigned To", "ارجاع به", "سپارل شوی")}</th>
                <th>{tx("Purpose", "هدف", "موخه")}</th>
                <th>{tx("Date", "تاریخ", "نېټه")}</th>
                <th>{tx("Status", "وضعیت", "حالت")}</th>
                <th>{tx("Action", "عملیات", "عمل")}</th>
              </tr>
            </thead>

            <tbody>
              {receptionCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="reception-customer-name">
                      <span>
                        <UserRound size={15} />
                      </span>

                      <strong>
                        {customer.fullName ||
                          customer.customerName ||
                          "-"}
                      </strong>
                    </div>
                  </td>

                  <td>
                    <Phone size={14} />
                    {customer.phone ||
                      customer.contactNumber ||
                      "-"}
                  </td>

                  <td>
                    <span
                      className={`reception-type-badge ${customer.customerType}`}
                    >
                      {translateReceptionValue(customer.customerType) || "-"}
                    </span>
                  </td>

                  <td>
                    {customer.sourceEmployeeName ||
                      customer.source ||
                      customer.createdByName ||
                      "-"}
                  </td>

                  <td>
  {customer.assignedEmployeeName ? (
    <button
      type="button"
      className="reception-assigned-employee"
      onClick={() =>
        openAssignModal(customer)
      }
      title={tx("Change assigned employee", "تغییر کارمند ارجاع‌شده", "سپارل شوی کارکوونکی بدلول")}
    >
      <UserRound size={13} />

      <span>
        {customer.assignedEmployeeName}
      </span>
    </button>
  ) : (
    <button
      type="button"
      className="reception-assign-arrow"
      onClick={() =>
        openAssignModal(customer)
      }
      title={tx("Assign this customer", "ارجاع این مشتری", "دا پېرودونکی سپارل")}
      aria-label={tx("Assign customer", "ارجاع مشتری", "پېرودونکی سپارل")}
    >
      <ArrowRight size={17} />
    </button>
  )}
</td>

                  <td>
                    {customer.technologyPurpose ||
                      customer.purpose ||
                      "-"}
                  </td>

                  <td>
                    <div className="reception-record-datetime">
                      <CalendarDays size={14} />

                      <span>
                        <strong>
                          {customer.afghanistanDate ||
                          customer.date
                            ? new Date(
                                `${
                                  customer.afghanistanDate ||
                                  customer.date
                                }T00:00:00`
                              ).toLocaleDateString()
                            : customer.createdAt
                              ? new Date(
                                  customer.createdAt
                                ).toLocaleDateString()
                              : "-"}
                        </strong>

                        <small>
                          {customer.afghanistanTime ||
                            customer.time ||
                            (customer.createdAt
                              ? new Date(
                                  customer.createdAt
                                ).toLocaleTimeString(
                                  "en-US",
                                  {
                                    timeZone:
                                      "Asia/Kabul",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: true,
                                  }
                                )
                              : "-")}
                        </small>
                      </span>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`reception-status-badge ${getCustomerDisplayStatus(
                        customer
                      )
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {translateReceptionValue(getCustomerDisplayStatus(customer))}
                    </span>
                  </td>

                  <td>
                    <div className="reception-row-actions">
                      <button
                        type="button"
                        className="view"
                        onClick={() =>
                          setViewCustomer(customer)
                        }
                        title={tx("View customer", "نمایش مشتری", "پېرودونکی کتل")}
                        aria-label={tx("View customer", "نمایش مشتری", "پېرودونکی کتل")}
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        type="button"
                        className="edit"
                        onClick={() =>
                          openEditCustomer(customer)
                        }
                        title={tx("Edit customer", "ویرایش مشتری", "پېرودونکی سمول")}
                        aria-label={tx("Edit customer", "ویرایش مشتری", "پېرودونکی سمول")}
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        className="delete"
                        onClick={() =>
                          setDeleteCustomer(customer)
                        }
                        title={tx("Delete customer", "حذف مشتری", "پېرودونکی حذف کول")}
                        aria-label={tx("Delete customer", "حذف مشتری", "پېرودونکی حذف کول")}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!receptionCustomers.length && (
                <tr>
                  <td
                    colSpan="9"
                    className="reception-empty"
                  >
                    {tx(
                      "No reception customers registered yet.",
                      "هنوز هیچ مشتری از طریق پذیرش ثبت نشده است.",
                      "تر اوسه د استقبال له لارې هېڅ پېرودونکی نه دی ثبت شوی."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {assignTarget && (
        <div
          className="reception-modal-backdrop"
          onMouseDown={closeAssignModal}
        >
          <div
            className="reception-assign-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="reception-assign-header">
              <div>
                <span>Customer Assignment</span>

                <h2>Assign Customer</h2>

                <p>
                  Review the registration information and
                  assign this customer to an employee.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAssignModal}
                disabled={assigningRecord}
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={saveCustomerAssignment}>
              <div className="reception-assign-grid">
                <label>
                  <span>Customer Name</span>

                  <input
                    value={
                      assignTarget.fullName ||
                      assignTarget.customerName ||
                      "-"
                    }
                    readOnly
                  />
                </label>

                <label>
                  <span>{tx("Phone Number", "شماره تماس", "د تلیفون شمېره")}</span>

                  <input
                    value={
                      assignTarget.phone ||
                      assignTarget.contactNumber ||
                      "-"
                    }
                    readOnly
                  />
                </label>
{assignTarget.applicationType && (
  <label>
    <span>Application Type</span>

    <input
      value={
        assignTarget.applicationType
      }
      readOnly
    />
  </label>
)}


                <label>
                  <span>Customer Type</span>

                  <input
                    value={
                      assignTarget.customerType || "-"
                    }
                    readOnly
                  />
                </label>

                <label>
                  <span>{tx("Source", "منبع", "سرچینه")}</span>

                  <input
                    value={
                      assignTarget.source ||
                      assignTarget.sourceEmployeeName ||
                      "-"
                    }
                    readOnly
                  />
                </label>

                <label>
                  <span>Registered Date</span>

                  <input
                    value={
                      assignTarget.date ||
                      assignTarget.createdAt?.slice(
                        0,
                        10
                      ) ||
                      "-"
                    }
                    readOnly
                  />
                </label>

                <label>
                  <span>Registered Time</span>

                  <input
                    value={
                      assignTarget.createdAt
                        ? new Date(
                          assignTarget.createdAt
                        ).toLocaleTimeString()
                        : "-"
                    }
                    readOnly
                  />
                </label>

                {assignTarget.email && (
                  <label>
                    <span>{tx("Email", "ایمیل", "برېښنالیک")}</span>

                    <input
                      value={assignTarget.email}
                      readOnly
                    />
                  </label>
                )}

                {assignTarget.educationalLevel && (
                  <label>
                    <span>Educational Level</span>

                    <input
                      value={
                        assignTarget.educationalLevel
                      }
                      readOnly
                    />
                  </label>
                )}

                {assignTarget.schoolUniversity && (
                  <label>
                    <span>School / University</span>

                    <input
                      value={
                        assignTarget.schoolUniversity
                      }
                      readOnly
                    />
                  </label>
                )}

                {assignTarget.companyName && (
                  <label>
                    <span>{tx("Company Name", "نام شرکت", "د شرکت نوم")}</span>

                    <input
                      value={
                        assignTarget.companyName
                      }
                      readOnly
                    />
                  </label>
                )}

                <label className="reception-assign-full">
                  <span>{tx("Purpose", "هدف", "موخه")}</span>

                  <textarea
                    value={
                      assignTarget.technologyPurpose ||
                      assignTarget.purpose ||
                      "-"
                    }
                    rows="3"
                    readOnly
                  />
                </label>
<label className="reception-assign-full reception-assign-select">
                  <span>{tx("Assign To", "ارجاع به", "سپارل")}</span>

                  <select
                    value={assignEmployeeId}
                    onChange={updateAssignEmployee}
                    autoFocus
                  >
                    <option value="">
                      Select responsible employee
                    </option>

                    {employeeOptions.map(
                      (employee) => {
                        const employeeId =
                          employee.id ||
                          employee.employeeId;

                        return (
                          <option
                            key={employeeId}
                            value={employeeId}
                          >
                            {getEmployeeName(
                              employee
                            )}
                          </option>
                        );
                      }
                    )}
                  </select>
                </label>
              </div>

              <footer className="reception-assign-actions">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  disabled={assigningRecord}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary"
                  disabled={assigningRecord}
                >
                  <ArrowRight size={15} />

                  {assigningRecord
                    ? "Assigning..."
                    : "Assign Customer"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {viewCustomer && (
        <div
          className="reception-modal-backdrop"
          onMouseDown={() => setViewCustomer(null)}
        >
          <div
            className="reception-view-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="reception-view-header">
              <div>
                <span>Customer Information</span>

                <h2>
                  {viewCustomer.fullName ||
                    viewCustomer.customerName ||
                    "Customer Details"}
                </h2>

                <p>
                  Complete information for this customer
                  record.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewCustomer(null)}
                aria-label="Close customer details"
              >
                <X size={18} />
              </button>
            </header>

            <div className="reception-view-grid">
              {[
                [
                  "Customer Name",
                  viewCustomer.fullName ||
                    viewCustomer.customerName,
                ],
                [
                  "Phone Number",
                  viewCustomer.phone ||
                    viewCustomer.contactNumber,
                ],
                [
                  "Customer Type",
                  viewCustomer.customerType,
                ],
                [
                  "Source",
                  viewCustomer.sourceEmployeeName ||
                    viewCustomer.source ||
                    "External Customer",
                ],
                [
                  "Assigned To",
                  viewCustomer.assignedEmployeeName ||
                    "Unassigned",
                ],
                ["Email", viewCustomer.email],
                [
                  "Education",
                  viewCustomer.educationalLevel ||
                    viewCustomer.educationLevel,
                ],
                [
                  "School / University",
                  viewCustomer.schoolUniversity ||
                    viewCustomer.institutionName,
                ],
                [
                  "Company Name",
                  viewCustomer.companyName,
                ],
                [
                  "Purpose",
                  viewCustomer.technologyPurpose ||
                    viewCustomer.purpose,
                ],
                [
                  "Registered Date",
                  viewCustomer.date ||
                    viewCustomer.createdAt?.slice(0, 10),
                ],
                [
                  "Registered Time",
                  viewCustomer.createdAt
                    ? new Date(
                        viewCustomer.createdAt
                      ).toLocaleTimeString()
                    : "",
                ],
                [
                  "Notes",
                  viewCustomer.note ||
                    viewCustomer.notes,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className={
                    label === "Purpose" ||
                    label === "Notes"
                      ? "reception-view-full"
                      : ""
                  }
                >
                  <span>{label}</span>
                  <strong>{value || "-"}</strong>
                </div>
              ))}
            </div>

            <footer className="reception-view-actions">
              <button
                type="button"
                onClick={() => setViewCustomer(null)}
              >
                Close
              </button>

              <button
                type="button"
                className="primary"
                onClick={() => {
                  const customer = viewCustomer;
                  setViewCustomer(null);
                  openEditCustomer(customer);
                }}
              >
                <Pencil size={15} />
                Edit Customer
              </button>
            </footer>
          </div>
        </div>
      )}

      {deleteCustomer && (
        <div
          className="reception-modal-backdrop"
          onMouseDown={() => setDeleteCustomer(null)}
        >
          <div
            className="reception-delete-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="reception-delete-icon">
              <AlertTriangle size={27} />
            </div>

            <h2>Delete Customer?</h2>

            <p>
              You are about to permanently delete{" "}
              <strong>
                {deleteCustomer.fullName ||
                  deleteCustomer.customerName ||
                  "this customer"}
              </strong>
              . This action cannot be undone.
            </p>

            <div className="reception-delete-actions">
              <button
                type="button"
                onClick={() => setDeleteCustomer(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger"
                onClick={confirmDeleteCustomer}
              >
                <Trash2 size={15} />
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div
          className="reception-modal-backdrop"
          onMouseDown={closeForm}
        >
          <div
            className="reception-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="reception-modal-header">
              <div>
                <span>{tx("Reception Registration", "ثبت از پذیرش", "د استقبال ثبت")}</span>

                <h2>
                  {registrationTypeText[registrationType]?.title ||
                    tx("Register Customer", "ثبت مشتری", "پېرودونکی ثبت کړئ")}
                </h2>

                <p>
                  {tx(
                    "Select the registration type and complete the required information.",
                    "نوع ثبت را انتخاب کرده و معلومات مورد نیاز را تکمیل کنید.",
                    "د ثبت ډول وټاکئ او اړین معلومات بشپړ کړئ."
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label={tx("Close", "بستن", "تړل")}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={saveReceptionRecord}>
              <div className="reception-form-body">
                <div className="reception-type-selector">
                  {registrationTypes.map((type) => {
                    const Icon = type.icon;

                    return (
                      <button
                        key={type.key}
                        type="button"
                        className={
                          registrationType === type.key
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          selectRegistrationType(type.key)
                        }
                      >
                        <Icon size={18} />

                        <span>
                          <strong>
                            {registrationTypeText[type.key]?.title ||
                              type.title}
                          </strong>
                          <small>
                            {registrationTypeText[type.key]?.description ||
                              type.description}
                          </small>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {registrationType ===
                  "consultant" && (
                    <div className="reception-form-grid">
                      <div className="reception-package-section reception-form-full">
                        <SearchablePackageSelect
                          label={tx("Visa Package", "پکیج ویزه", "د ویزې بسته")}
                          packages={availableVisaPackages}
                          value={consultantForm.selectedPackageId}
                          onChange={updateConsultantField}
                          placeholder={tx("Select registered visa package", "پکیج ویزه ثبت‌شده را انتخاب کنید", "ثبت شوې د ویزې بسته وټاکئ")}
                          interfaceLanguage={interfaceLanguage}
                        />

                        {!visaPackagesLoaded && (
                          <p className="reception-package-message">{tx("Loading Visa Packages...", "در حال بارگذاری پکیج‌های ویزه...", "د ویزې بستې بارېږي...")}</p>
                        )}
                        {visaPackagesLoaded && !availableVisaPackages.length && (
                          <p className="reception-package-message">{tx("No available Visa Packages found.", "هیچ پکیج ویزه موجود پیدا نشد.", "د ویزې شته بسته ونه موندل شوه.")}</p>
                        )}

                        <ReceptionPackagePreview
                          title={tx("SELECTED VISA PACKAGE", "پکیج ویزه انتخاب‌شده", "ټاکل شوې د ویزې بسته")}
                          packageItem={selectedVisaPackage}
                          interfaceLanguage={interfaceLanguage}
                          showCountry
                          showCategory
                          showDates
                          showBankStatement
                          showDocumentation
                        />
                      </div>

                      <label>
                        <span>{tx("Full Name In Passport", "نام کامل مطابق پاسپورت", "بشپړ نوم د پاسپورټ مطابق")}</span>
                        <input
                          name="fullName"
                          value={consultantForm.fullName}
                          onChange={updateConsultantField}
                          placeholder={tx("Enter full name in passport", "نام کامل مطابق پاسپورت را وارد کنید", "بشپړ نوم د پاسپورټ مطابق ولیکئ")}
                          autoFocus
                        />
                      </label>

                      <label>
                        <span>{tx("Phone Number", "شماره تماس", "د تلیفون شمېره")}</span>
                        <input
                          name="phone"
                          value={consultantForm.phone}
                          onChange={updateConsultantField}
                          placeholder={tx("Enter phone number", "شماره تماس را وارد کنید", "د تلیفون شمېره ولیکئ")}
                        />
                      </label>

                      <label>
                        <span>{tx("Email", "ایمیل", "برېښنالیک")}</span>
                        <input
                          type="email"
                          name="email"
                          value={consultantForm.email}
                          onChange={updateConsultantField}
                          placeholder={tx("Enter email address", "آدرس ایمیل را وارد کنید", "برېښنالیک ولیکئ")}
                        />
                      </label>

                      <label>
                        <span>{tx("Source", "منبع", "سرچینه")}</span>
                        <select
                          name="source"
                          value={consultantForm.source}
                          onChange={updateConsultantField}
                        >
                          <option value="">{tx("Select source employee", "کارمند منبع را انتخاب کنید", "د سرچینې کارکوونکی وټاکئ")}</option>
                          <option value="Walk in Customer">{tx("Walk in Customer", "مشتری حضوری", "حضوري پېرودونکی")}</option>
                          {employeeOptions.map((employee) => {
                            const employeeName = getEmployeeName(employee);
                            return (
                              <option
                                key={`consultant-source-${employee.id || employee.employeeId || employee.email}`}
                                value={employeeName}
                              >
                                {employeeName}
                              </option>
                            );
                          })}
                        </select>
                      </label>

                      <label>
                        <span>{tx("Assign To", "ارجاع به", "سپارل")}</span>
                        <select
                          name="assignedEmployeeId"
                          value={consultantForm.assignedEmployeeId}
                          onChange={updateConsultantField}
                        >
                          <option value="">{tx("Select employee", "کارمند را انتخاب کنید", "کارکوونکی وټاکئ")}</option>
                          {employeeOptions.map((employee) => (
                            <option
                              key={employee.id || employee.employeeId || employee.email}
                              value={employee.id || employee.employeeId}
                            >
                              {getEmployeeName(employee)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="reception-form-full">
                        <span>{tx("Purpose", "هدف", "موخه")}</span>
                        <textarea
                          name="purpose"
                          value={consultantForm.purpose}
                          onChange={updateConsultantField}
                          placeholder={tx("Enter customer purpose", "هدف مشتری را وارد کنید", "د پېرودونکي موخه ولیکئ")}
                          rows="4"
                        />
                      </label>
                    </div>
                  )}

                {registrationType === "travel" && (
                  <div className="reception-form-grid">
                    <div className="reception-package-section reception-form-full">
                      <SearchablePackageSelect
                        label={tx("Travel Package", "پکیج سفر", "د سفر بسته")}
                        packages={availableTravelPackages}
                        value={travelForm.selectedPackageId}
                        onChange={updateTravelField}
                        placeholder={tx("Select registered travel package", "پکیج سفر ثبت‌شده را انتخاب کنید", "ثبت شوې د سفر بسته وټاکئ")}
                        interfaceLanguage={interfaceLanguage}
                      />

                      {!travelPackagesLoaded && (
                        <p className="reception-package-message">{tx("Loading Travel Packages...", "در حال بارگذاری پکیج‌های سفر...", "د سفر بستې بارېږي...")}</p>
                      )}
                      {travelPackagesLoaded && !availableTravelPackages.length && (
                        <p className="reception-package-message">{tx("No available Travel Packages found.", "هیچ پکیج سفر موجود پیدا نشد.", "د سفر شته بسته ونه موندل شوه.")}</p>
                      )}

                      <ReceptionPackagePreview
                        title={tx("SELECTED TRAVEL PACKAGE", "پکیج سفر انتخاب‌شده", "ټاکل شوې د سفر بسته")}
                        packageItem={selectedTravelPackage}
                        interfaceLanguage={interfaceLanguage}
                        showCountry
                        showCategory
                        showDates
                        showBankStatement
                      />
                    </div>

                    <label>
                      <span>{tx("Full Name In Passport", "نام کامل مطابق پاسپورت", "بشپړ نوم د پاسپورټ مطابق")}</span>
                      <input
                        name="fullName"
                        value={travelForm.fullName}
                        onChange={updateTravelField}
                        placeholder={tx("Enter full name in passport", "نام کامل مطابق پاسپورت را وارد کنید", "بشپړ نوم د پاسپورټ مطابق ولیکئ")}
                        autoFocus
                      />
                    </label>

                    <label>
                      <span>{tx("Phone Number", "شماره تماس", "د تلیفون شمېره")}</span>
                      <input
                        name="phone"
                        value={travelForm.phone}
                        onChange={updateTravelField}
                        placeholder={tx("Enter phone number", "شماره تماس را وارد کنید", "د تلیفون شمېره ولیکئ")}
                      />
                    </label>

                    <label>
                      <span>{tx("Source", "منبع", "سرچینه")}</span>
                      <select
                        name="source"
                        value={travelForm.source}
                        onChange={updateTravelField}
                      >
                        <option value="">{tx("Select source employee", "کارمند منبع را انتخاب کنید", "د سرچینې کارکوونکی وټاکئ")}</option>
                        <option value="Walk in Customer">{tx("Walk in Customer", "مشتری حضوری", "حضوري پېرودونکی")}</option>
                        {employeeOptions.map((employee) => {
                          const employeeName = getEmployeeName(employee);
                          return (
                            <option
                              key={`travel-source-${employee.id || employee.employeeId || employee.email}`}
                              value={employeeName}
                            >
                              {employeeName}
                            </option>
                          );
                        })}
                      </select>
                    </label>

                    <label>
                      <span>{tx("Assign To", "ارجاع به", "سپارل")}</span>
                      <select
                        name="assignedEmployeeId"
                        value={travelForm.assignedEmployeeId}
                        onChange={updateTravelField}
                      >
                        <option value="">{tx("Select employee", "کارمند را انتخاب کنید", "کارکوونکی وټاکئ")}</option>
                        {employeeOptions.map((employee) => (
                          <option
                            key={employee.id || employee.employeeId || employee.email}
                            value={employee.id || employee.employeeId}
                          >
                            {getEmployeeName(employee)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="reception-form-full">
                      <span>{tx("Purpose", "هدف", "موخه")}</span>
                      <textarea
                        name="purpose"
                        value={travelForm.purpose}
                        onChange={updateTravelField}
                        placeholder={tx("Enter customer purpose", "هدف مشتری را وارد کنید", "د پېرودونکي موخه ولیکئ")}
                        rows="4"
                      />
                    </label>
                  </div>
                )}

                {registrationType ===
                  "technology" && (
                    <div className="reception-form-grid">
                      <div className="reception-package-section reception-form-full">
                        <SearchablePackageSelect
                          label={tx("Technology Package", "پکیج تکنالوژی", "د ټکنالوژۍ بسته")}
                          packages={technologyPackages}
                          value={technologyForm.selectedPackageId}
                          onChange={updateTechnologyField}
                          placeholder={tx("Select registered technology package", "پکیج تکنالوژی ثبت‌شده را انتخاب کنید", "ثبت شوې د ټکنالوژۍ بسته وټاکئ")}
                          interfaceLanguage={interfaceLanguage}
                        />

                        {!technologyPackagesLoaded && (
                          <p className="reception-package-message">{tx("Loading Technology Packages...", "در حال بارگذاری پکیج‌های تکنالوژی...", "د ټکنالوژۍ بستې بارېږي...")}</p>
                        )}
                        {technologyPackagesLoaded && !technologyPackages.length && (
                          <p className="reception-package-message">{tx("No Technology Packages have been registered yet.", "هنوز هیچ پکیج تکنالوژی ثبت نشده است.", "تر اوسه د ټکنالوژۍ هېڅ بسته نه ده ثبت شوې.")}</p>
                        )}

                        <ReceptionPackagePreview
                          title={tx("SELECTED TECHNOLOGY PACKAGE", "پکیج تکنالوژی انتخاب‌شده", "ټاکل شوې د ټکنالوژۍ بسته")}
                          packageItem={selectedTechnologyPackage}
                          interfaceLanguage={interfaceLanguage}
                        />
                      </div>

                      <label>
                        <span>{tx("Full Name", "نام کامل", "بشپړ نوم")}</span>
                        <input
                          name="fullName"
                          value={technologyForm.fullName}
                          onChange={updateTechnologyField}
                          placeholder={tx("Enter full name", "نام کامل را وارد کنید", "بشپړ نوم ولیکئ")}
                          autoFocus
                        />
                      </label>

                      <label>
                        <span>{tx("Company Name", "نام شرکت", "د شرکت نوم")}</span>
                        <input
                          name="companyName"
                          value={technologyForm.companyName}
                          onChange={updateTechnologyField}
                          placeholder={tx("Enter company name", "نام شرکت را وارد کنید", "د شرکت نوم ولیکئ")}
                        />
                      </label>

                      <label>
                        <span>{tx("Contact Number", "شماره تماس", "د اړیکې شمېره")}</span>
                        <input
                          name="contactNumber"
                          value={technologyForm.contactNumber}
                          onChange={updateTechnologyField}
                          placeholder={tx("Enter contact number", "شماره تماس را وارد کنید", "د اړیکې شمېره ولیکئ")}
                        />
                      </label>

                      <label>
                        <span>{tx("Purpose", "هدف", "موخه")}</span>
                        <select
                          name="technologyPurpose"
                          value={technologyForm.technologyPurpose}
                          onChange={updateTechnologyField}
                        >
                          {technologyPurposes.map((purpose) => (
                            <option key={purpose} value={purpose}>
                              {translateReceptionValue(purpose)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label>
                        <span>{tx("Source", "منبع", "سرچینه")}</span>
                        <select
                          name="source"
                          value={technologyForm.source}
                          onChange={updateTechnologyField}
                        >
                          <option value="">{tx("Select source employee", "کارمند منبع را انتخاب کنید", "د سرچینې کارکوونکی وټاکئ")}</option>
                          <option value="Walk in Customer">{tx("Walk in Customer", "مشتری حضوری", "حضوري پېرودونکی")}</option>
                          {employeeOptions.map((employee) => {
                            const employeeName = getEmployeeName(employee);
                            return (
                              <option
                                key={`technology-source-${employee.id || employee.employeeId || employee.email}`}
                                value={employeeName}
                              >
                                {employeeName}
                              </option>
                            );
                          })}
                        </select>
                      </label>

                      <label>
                        <span>{tx("Assign To", "ارجاع به", "سپارل")}</span>
                        <select
                          name="assignedEmployeeId"
                          value={technologyForm.assignedEmployeeId}
                          onChange={updateTechnologyField}
                        >
                          <option value="">{tx("Select employee", "کارمند را انتخاب کنید", "کارکوونکی وټاکئ")}</option>
                          {employeeOptions.map((employee) => (
                            <option
                              key={employee.id || employee.employeeId || employee.email}
                              value={employee.id || employee.employeeId}
                            >
                              {getEmployeeName(employee)}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="reception-form-full">
                        <span>{tx("Note", "یادداشت", "یادښت")}</span>
                        <textarea
                          name="note"
                          value={technologyForm.note}
                          onChange={updateTechnologyField}
                          placeholder={tx("Write additional notes", "یادداشت اضافی بنویسید", "اضافي یادښت ولیکئ")}
                          rows="4"
                        />
                      </label>
                    </div>
                  )}

                {registrationType === "media" && (
                  <div className="reception-form-grid">
                    <div className="reception-package-section reception-form-full">
                      <SearchablePackageSelect
                        label={tx("Media Package", "پکیج رسانه", "رسنیزه بسته")}
                        packages={mediaPackages}
                        value={mediaForm.selectedPackageId}
                        onChange={updateMediaField}
                        placeholder={tx("Select registered media package", "پکیج رسانه ثبت‌شده را انتخاب کنید", "ثبت شوې رسنیزه بسته وټاکئ")}
                        interfaceLanguage={interfaceLanguage}
                      />

                      {!mediaPackagesLoaded && (
                        <p className="reception-package-message">{tx("Loading Media Packages...", "در حال بارگذاری پکیج‌های رسانه...", "رسنیزې بستې بارېږي...")}</p>
                      )}
                      {mediaPackagesLoaded && !mediaPackages.length && (
                        <p className="reception-package-message">{tx("No Media Packages have been registered yet.", "هنوز هیچ پکیج رسانه ثبت نشده است.", "تر اوسه هېڅ رسنیزه بسته نه ده ثبت شوې.")}</p>
                      )}

                      <ReceptionPackagePreview
                        title={tx("SELECTED MEDIA PACKAGE", "پکیج رسانه انتخاب‌شده", "ټاکل شوې رسنیزه بسته")}
                        packageItem={selectedMediaPackage}
                        interfaceLanguage={interfaceLanguage}
                        showCountry
                        showCategory
                      />
                    </div>

                    <label>
                      <span>{tx("Person Name", "نام شخص", "د شخص نوم")}</span>
                      <input
                        name="personName"
                        value={mediaForm.personName}
                        onChange={updateMediaField}
                        placeholder={tx("Enter person name", "نام شخص را وارد کنید", "د شخص نوم ولیکئ")}
                        autoFocus
                      />
                    </label>

                    <label>
                      <span>{tx("Phone Number", "شماره تماس", "د تلیفون شمېره")}</span>
                      <input
                        type="tel"
                        name="phone"
                        value={mediaForm.phone}
                        onChange={updateMediaField}
                        placeholder={tx("Enter phone number", "شماره تماس را وارد کنید", "د تلیفون شمېره ولیکئ")}
                      />
                    </label>

                    <label>
                      <span>{tx("Brand Name", "نام برند", "د برانډ نوم")}</span>
                      <input
                        name="brandName"
                        value={mediaForm.brandName}
                        onChange={updateMediaField}
                        placeholder={tx("Enter brand name", "نام برند را وارد کنید", "د برانډ نوم ولیکئ")}
                      />
                    </label>

                    <label>
                      <span>{tx("Source", "منبع", "سرچینه")}</span>
                      <select
                        name="source"
                        value={mediaForm.source}
                        onChange={updateMediaField}
                      >
                        <option value="">{tx("Select source employee", "کارمند منبع را انتخاب کنید", "د سرچینې کارکوونکی وټاکئ")}</option>
                        <option value="Walk in Customer">{tx("Walk in Customer", "مشتری حضوری", "حضوري پېرودونکی")}</option>
                        {employeeOptions.map((employee) => {
                          const employeeName = getEmployeeName(employee);
                          return (
                            <option
                              key={`media-source-${employee.id || employee.employeeId || employee.email}`}
                              value={employeeName}
                            >
                              {employeeName}
                            </option>
                          );
                        })}
                      </select>
                    </label>

                    <label>
                      <span>{tx("Assign To", "ارجاع به", "سپارل")}</span>
                      <select
                        name="assignedEmployeeId"
                        value={mediaForm.assignedEmployeeId}
                        onChange={updateMediaField}
                      >
                        <option value="">{tx("Select employee", "کارمند را انتخاب کنید", "کارکوونکی وټاکئ")}</option>
                        {employeeOptions.map((employee) => {
                          const employeeId = employee.id || employee.employeeId || "";
                          return (
                            <option key={`media-assign-${employeeId}`} value={employeeId}>
                              {getEmployeeName(employee)}
                            </option>
                          );
                        })}
                      </select>
                    </label>

                    <label className="reception-form-full">
                      <span>{tx("Note", "یادداشت", "یادښت")}</span>
                      <textarea
                        name="note"
                        value={mediaForm.note}
                        onChange={updateMediaField}
                        placeholder={tx("Write additional notes", "یادداشت اضافی بنویسید", "اضافي یادښت ولیکئ")}
                        rows="4"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="reception-modal-actions">
                <button
                  type="button"
                  onClick={closeForm}
                >
                  {tx("Cancel", "لغو", "لغوه")}
                </button>

                <button type="submit">
                  <Plus size={15} />

                  {registrationType === "media"
                    ? tx("Save Media Product", "ذخیره محصول رسانه‌ای", "رسنیز محصول خوندي کړئ")
                    : tx("Register Customer", "ثبت مشتری", "پېرودونکی ثبت کړئ")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}