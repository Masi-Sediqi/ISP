import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BriefcaseBusiness, Eye, GraduationCap, Mail, Pencil, Phone, Plus, Search, Trash2, UserCheck, Users, X } from "lucide-react";
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
  educationLevel: "",
  institutionName: "",
  sourceEmployeeId: "",
  sourceEmployeeName: "",
  assignedEmployeeId: "",
  assignedEmployeeName: "",
  purpose: "",
  city: "",
  language: "Dari",
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



function ConsultantCustomers({ mode = "consultant" }) {
  const isTravel = mode === "travel";
  const isTechnology = mode === "technology";
  const isMedia = mode === "media";

  const legacyCollectionName = isTravel
    ? "travelCustomers"
    : isTechnology
      ? "technologyCustomers"
      : isMedia
        ? "mediaProducts"
        : "consultantCustomers";

  const typeLabel = isTravel
    ? "Travel Customer"
    : isTechnology
      ? "Technology Customer"
      : isMedia
        ? "Media Production Customer"
        : "Consultant Customer";

  const typeLabelPlural = isTravel
    ? "Travel Customers"
    : isTechnology
      ? "Technology Customers"
      : isMedia
        ? "Media Production Customers"
        : "Consultant Customers";

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

  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] =
    useState(false);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [viewCustomer, setViewCustomer] =
    useState(null);
  const [
    deleteCustomer,
    setDeleteCustomer,
  ] = useState(null);

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
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
  };

  const save = async (event) => {
    event.preventDefault();

    if (!form.passportFullName.trim()) {
      notify(
        isMedia
          ? "Person name is required."
          : "Full name is required.",
        "error"
      );
      return;
    }

    if (isMedia && !String(form.brandName || "").trim()) {
      notify("Brand name is required.", "error");
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
      customerType: mode,
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
        ? `${typeLabel} updated successfully.`
        : `${typeLabel} registered successfully.`,
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
      `${typeLabel} deleted successfully.`,
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
    setShowForm(true);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(true);
  };

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
    <div className="consultant-page">
      <div className="consultant-heading">
        <div>
          <span>Customer Services</span>
          <h1>{typeLabelPlural}</h1>
          <p>
            Register and manage customer
            information from one workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
        >
          <Plus size={17} />
          Add {typeLabel}
        </button>
      </div>

      <section className="consultant-list-card">
        <div className="consultant-list-header">
          <div>
            <h2>{typeLabel} List</h2>
            <p>Registered customer records</p>
          </div>

          <div>
            <Search size={15} />
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search customers..."
            />
          </div>
        </div>

        <div className="consultant-table-wrap">
          <table>
            <thead>
              {isMedia ? (
                <tr>
                  <th>Full Name</th>
                  <th>Phone Number</th>
                  <th>Brand Name</th>
                  <th>Purpose</th>
                  <th>Note</th>
                  <th>Registered</th>
                  <th>Action</th>
                </tr>
              ) : (
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Country</th>

                  {isTechnology && (
                    <th>Service</th>
                  )}

                  {!isTravel &&
                    !isTechnology && (
                      <th>Scholarship</th>
                    )}

                  <th>Unit / Price</th>
                  <th>Purpose</th>
                  <th>Follow-up</th>
                  <th>Registered</th>
                  <th>Action</th>
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
                            <small>View details</small>
                          </span>
                        </button>
                      </td>

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
                            title="View details"
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            className="edit"
                            type="button"
                            onClick={() =>
                              openEdit(customer)
                            }
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            className="delete"
                            type="button"
                            onClick={() =>
                              setDeleteCustomer(customer)
                            }
                            title="Delete"
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
                          <small>View details</small>
                        </span>
                      </button>
                    </td>

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
                      {customer.country
                        ? getCountryLabel(customer.country)
                        : "-"}
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
                          ? "Required"
                          : "No"}
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
                          title="View details"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          className="edit"
                          type="button"
                          onClick={() =>
                            openEdit(customer)
                          }
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          className="delete"
                          type="button"
                          onClick={() =>
                            setDeleteCustomer(customer)
                          }
                          title="Delete"
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
                    No customers registered yet.
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
                    ? `Edit ${typeLabel}`
                    : isMedia
                      ? "Add Media Product"
                      : `Add ${typeLabel}`}
                </h2>

                <p>
                  {isMedia
                    ? "Select the registration type and complete the required information."
                    : `This record will also appear in the general ${mode} customer list.`}
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
                      <span>Full Name</span>
                      <input
                        name="passportFullName"
                        value={form.passportFullName}
                        onChange={update}
                        placeholder="Enter full name"
                      />
                    </label>

                    <label>
                      <span>Phone Number</span>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={update}
                        placeholder="Enter phone number"
                      />
                    </label>

                    <label>
                      <span>Brand Name</span>
                      <input
                        name="brandName"
                        value={form.brandName || ""}
                        onChange={update}
                        placeholder="Enter brand name"
                      />
                    </label>

                    <label>
                      <span>Purpose</span>
                      <select
                        name="mediaPurpose"
                        value={form.mediaPurpose || "Video"}
                        onChange={update}
                      >
                        <option value="Video">Video</option>
                        <option value="Photo">Photo</option>
                        <option value="Logo">Logo</option>
                        <option value="Poster">Poster</option>
                        <option value="Banner">Banner</option>
                        <option value="Social Media Post">
                          Social Media Post
                        </option>
                        <option value="Advertisement">
                          Advertisement
                        </option>
                        <option value="Animation">
                          Animation
                        </option>
                        <option value="Other">Other</option>
                      </select>
                    </label>

                    <label className="consultant-form-full">
                      <span>Note</span>
                      <textarea
                        name="note"
                        value={form.note}
                        onChange={update}
                        rows="4"
                        placeholder="Write additional notes"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      <span>Full Name</span>
                      <input
                        name="passportFullName"
                        value={form.passportFullName}
                        onChange={update}
                      />
                    </label>

                    <label>
                      <span>Phone Number</span>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={update}
                      />
                    </label>

                    <label>
                      <span>City / Province</span>
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
                      <span>Country</span>
                      <select
                        name="country"
                        value={form.country}
                        onChange={update}
                      >
                        <option value="">
                          Select country
                        </option>

                        {countries.map((country) => (
                          <option
                            key={country}
                            value={country}
                          >
                            {getCountryLabel(country)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>Language</span>
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

                    <label>
                      <span>Call Type</span>
                      <select
                        name="callType"
                        value={form.callType}
                        onChange={update}
                      >
                        <option>Incoming</option>
                        <option>Outgoing</option>
                      </select>
                    </label>

                    <label>
                      <span>Unit</span>
                      <select
                        name="unit"
                        value={form.unit}
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
                      <span>Price</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        name="price"
                        value={form.price}
                        onChange={update}
                        placeholder="Enter price"
                      />
                    </label>

                    {!isTravel && !isTechnology && (
                      <label>
                        <span>Scholarship Type</span>
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

                    {isTechnology && (
                      <>
                        <label>
                          <span>Business Type</span>
                          <input
                            name="businessType"
                            value={form.businessType}
                            onChange={update}
                          />
                        </label>

                        <label>
                          <span>Service Type</span>
                          <select
                            name="technologyPurpose"
                            value={form.technologyPurpose}
                            onChange={update}
                          >
                            <option>Database</option>
                            <option>Website</option>
                            <option>Application</option>
                            <option>Networking</option>
                            <option>Other</option>
                          </select>
                        </label>
                      </>
                    )}

                    <label className="consultant-form-full">
                      <span>Purpose</span>
                      <textarea
                        name="purpose"
                        value={form.purpose}
                        onChange={update}
                        rows="3"
                        placeholder="Enter customer purpose"
                      />
                    </label>

                    <label className="followup-field">
                      <span>Need Follow-up</span>
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

                    <label className="consultant-form-full">
                      <span>Note</span>
                      <textarea
                        name="note"
                        value={form.note}
                        onChange={update}
                        rows="4"
                        placeholder="Write additional customer notes..."
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
                  Cancel
                </button>

                <button type="submit">
                  {editId
                    ? "Save Changes"
                    : isMedia
                      ? "Save Media Product"
                      : "Save Customer"}
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
                ["Phone Number", viewCustomer.phone],
                ["Brand Name", viewCustomer.brandName],
                [
                  "Purpose",
                  viewCustomer.mediaPurpose ||
                    viewCustomer.purpose,
                ],
                ["Email", viewCustomer.email],
                ["City / Province", viewCustomer.city],
                [
                  "Country",
                  viewCustomer.country
                    ? getCountryLabel(
                        viewCustomer.country
                      )
                    : "",
                ],
                ["Language", viewCustomer.language],
                ["Call Type", viewCustomer.callType],
                ["Business Type", viewCustomer.businessType],
                ["Scholarship Type", viewCustomer.scholarshipType],
                ["Unit", viewCustomer.unit || viewCustomer.currencyUnit],
                ["Price", formatPrice(viewCustomer)],
                ["Purpose", viewCustomer.purpose],
                ["Need Follow-up", viewCustomer.needFollowup],
                ["Note", viewCustomer.note],
                [
                  "Registration Date",
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
                  "Registration Time",
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
                      ["Purpose", "Note"].includes(
                        label
                      )
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
                Edit Information
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

            <h2>Delete {typeLabel}?</h2>

            <p>
              You are about to permanently
              delete{" "}
              <strong>
                {deleteCustomer.fullName ||
                  deleteCustomer.passportFullName ||
                  `this ${typeLabel.toLowerCase()}`}
              </strong>
              . This action cannot be undone.
            </p>

            <div>
              <button
                type="button"
                onClick={() =>
                  setDeleteCustomer(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={remove}
              >
                <Trash2 size={15} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsultantCustomers;