import {
    useEffect,
    useMemo,
    useRef,
    useState,
  } from "react";
  
  import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    FileCheck2,
    Landmark,
    LockKeyhole,
    Plus,
    Save,
    X,
  } from "lucide-react";
  
  import {
    useNavigate,
    useParams,
  } from "react-router-dom";
  
  import { useJsonCollection } from "../hooks/useJsonCollection";
  import { useEmployeeAdjustments } from "../hooks/useEmployeeAdjustments";
  import { notify } from "../utils/notify";
  import "./CustomerFollowUp.css";
  
  const defaultEnglishTests = [
    "TOEFL",
    "IELTS",
    "Duolingo",
    "None",
  ];
  
  const defaultCountries = [
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
  
  const scholarshipTypes = [
    "Government",
    "Semi-Government",
    "Private",
  ];
  
  const intakes = [
    "January",
    "September",
  ];
  

  const guaranteeTypes = [
    "Exchange",
    "Jewelry",
    "Property",
    "Bank Guarantee",
    "Personal Guarantee",
    "Custom",
  ];

  const followUpStatuses = [
    "Pending",
    "Approved",
    "Rejected",
  ];

  const defaultMediaPurposes = [
    "Video",
    "Photo",
    "Logo",
    "Poster",
    "Social Media Post",
    "Banner",
    "Animation",
    "Custom",
  ];

  const normalizeCountryName = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-zA-Z]/g, "")
      .toLowerCase();

  const countryAliases = {
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
    const normalized =
      normalizeCountryName(countryName);

    return (
      countryAliases[normalized] ||
      countryCodeMap.get(normalized) ||
      ""
    );
  }

  function getFlagUrl(countryName) {
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
      function closeOnOutsideClick(event) {
        if (
          wrapperRef.current &&
          !wrapperRef.current.contains(event.target)
        ) {
          setOpen(false);
        }
      }

      document.addEventListener(
        "mousedown",
        closeOnOutsideClick
      );

      return () =>
        document.removeEventListener(
          "mousedown",
          closeOnOutsideClick
        );
    }, []);

    const filtered = useMemo(() => {
      const query = search.trim().toLowerCase();

      if (!query) return countryList;

      return countryList.filter((country) =>
        country.toLowerCase().includes(query)
      );
    }, [countryList, search]);

    function selectCountry(country) {
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
        className={`followup-country-select ${
          open ? "open" : ""
        }`}
        ref={wrapperRef}
      >
        <button
          type="button"
          className="followup-country-trigger"
          onClick={() =>
            setOpen((current) => !current)
          }
        >
          {value ? (
            <span>
              <img src={getFlagUrl(value)} alt="" />
              <b>{value}</b>
            </span>
          ) : (
            <span>Select country</span>
          )}

          <i>▾</i>
        </button>

        {open && (
          <div className="followup-country-menu">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search country..."
              autoFocus
            />

            <div>
              {filtered.map((country) => (
                <button
                  type="button"
                  key={country}
                  className={
                    value === country
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    selectCountry(country)
                  }
                >
                  <img
                    src={getFlagUrl(country)}
                    alt=""
                  />
                  <span>{country}</span>
                </button>
              ))}

              {!filtered.length && (
                <p>No country found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () =>
        reject(
          new Error("Unable to read the selected file.")
        );

      reader.readAsDataURL(file);
    });
  }

  function createInitialForm(customer) {
    const followUp = customer?.followUp || {};
  
    return {
      englishTests:
        Array.isArray(followUp.englishTests)
          ? followUp.englishTests
          : followUp.englishTest
            ? [followUp.englishTest]
            : [],
      bankStatementOwner:
        followUp.bankStatementOwner || "",
      bankStatementAmount:
        followUp.bankStatementAmount || "",
      passportNumber:
        followUp.passportNumber ||
        customer?.passportNumber ||
        "",
      maritalStatus:
        followUp.maritalStatus ||
        customer?.maritalStatus ||
        "Single",
      graduatedMajor:
        followUp.graduatedMajor ||
        customer?.graduatedMajor ||
        "",
      country:
        followUp.country ||
        customer?.country ||
        "",
      scholarshipType:
        followUp.scholarshipType ||
        customer?.scholarshipType ||
        "",
      graduationPercentage:
        followUp.graduationPercentage ??
        customer?.graduationPercentage ??
        "",
      graduationYear:
        followUp.graduationYear ||
        customer?.graduationYear ||
        "",
      desiredMajor:
        followUp.desiredMajor ||
        customer?.desiredMajor ||
        "",
      intake:
        followUp.intake ||
        customer?.intake ||
        "",
      customIntake:
        followUp.customIntake || "",
      currencyUnit:
        followUp.currencyUnit ||
        customer?.currencyUnit ||
        customer?.unit ||
        "AFN",
      totalAmount:
        followUp.totalAmount ??
        customer?.totalAmount ??
        "",
      paidAmount:
        followUp.paidAmount ??
        customer?.paidAmount ??
        "",
      guaranteeType:
        followUp.guaranteeType || "",
      customGuaranteeType:
        followUp.customGuaranteeType || "",
      guaranteeDocument:
        followUp.guaranteeDocument || null,
      passportDocument:
        followUp.passportDocument ||
        customer?.passportDocument ||
        null,
      projectId:
        followUp.projectId ||
        customer?.projectId ||
        "",
      projectName:
        followUp.projectName ||
        customer?.projectName ||
        "",
      mediaPurpose:
        followUp.mediaPurpose ||
        customer?.mediaPurpose ||
        "",
      customMediaPurpose:
        followUp.customMediaPurpose ||
        "",
      brandName:
        followUp.brandName ||
        customer?.brandName ||
        "",
      decisionStatus:
        followUp.decisionStatus ||
        customer?.followUpDecisionStatus ||
        "Pending",
    };
  }
  
  function getCustomerName(customer) {
    return (
      customer?.fullName ||
      customer?.customerName ||
      "Unnamed Customer"
    );
  }

  function getCustomerSourceName(customer) {
    return (
      customer?.source ||
      customer?.sourceEmployeeName ||
      "Not specified"
    );
  }

  function hasAdminAccess(account) {
    const roles = [
      account?.role,
      account?.primaryRole,
      ...(Array.isArray(account?.roles) ? account.roles : []),
    ]
      .filter(Boolean)
      .map((role) => String(role).trim().toLowerCase());

    return (
      account?.isDefaultAdmin === true ||
      account?.isAdmin === true ||
      account?.isFullAdmin === true ||
      account?.permissions?.all === true ||
      account?.accountType === "admin" ||
      roles.some((role) =>
        ["admin", "full admin", "administrator"].includes(role)
      )
    );
  }
  
  export default function CustomerFollowUp({
    currentUser,
  }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const isAdminAccount = hasAdminAccess(currentUser);
  
    const [
      customers,
      setCustomers,
      loadCustomers,
      customersLoaded,
    ] = useJsonCollection("customers");


    const [employees] =
      useJsonCollection("employees");

    const [projects] =
      useJsonCollection("projects");

    const [
      transactions,
      setTransactions,
    ] = useJsonCollection("transactions");

    const [
      employeeAdjustments,
      setEmployeeAdjustments,
    ] = useEmployeeAdjustments();
  
    const customer = useMemo(
      () =>
        customers.find(
          (item) =>
            String(item.id) === String(id)
        ),
      [customers, id]
    );
  
    const savedEnglishTests = useMemo(
      () =>
        customers.flatMap((item) => {
          const tests =
            item.followUp?.englishTests;
  
          if (Array.isArray(tests)) {
            return tests;
          }
  
          return item.followUp?.englishTest
            ? [item.followUp.englishTest]
            : [];
        }),
      [customers]
    );
  
    const savedCountries = useMemo(
      () =>
        customers
          .map(
            (item) =>
              item.followUp?.country
          )
          .filter(Boolean),
      [customers]
    );
  
    const [form, setForm] = useState(
      createInitialForm(null)
    );
  
    const [englishTests, setEnglishTests] =
      useState(defaultEnglishTests);
  
    const [countries, setCountries] =
      useState(defaultCountries);
  
    const [showTestAdder, setShowTestAdder] =
      useState(false);
  
    const [showCountryAdder, setShowCountryAdder] =
      useState(false);
  
    const [newTest, setNewTest] =
      useState("");
  
    const [newCountry, setNewCountry] =
      useState("");
  
    const [saving, setSaving] =
      useState(false);


    const remainingAmount = Math.max(
      Number(form.totalAmount || 0) -
        Number(form.paidAmount || 0),
      0
    );

    function getProjectId(project) {
      return String(
        project?.id ||
        project?.projectId ||
        project?._id ||
        ""
      );
    }

    function getProjectName(project) {
      return (
        project?.projectName ||
        project?.name ||
        project?.title ||
        "Unnamed Project"
      );
    }

    function getProjectPrice(project) {
      return Number(
        project?.price ??
        project?.projectPrice ??
        project?.totalPrice ??
        project?.amount ??
        0
      );
    }

    function getProjectCurrency(project) {
      return (
        project?.currencyUnit ||
        project?.unit ||
        project?.currency ||
        "AFN"
      );
    }

    const selectedProject = projects.find(
      (project) =>
        getProjectId(project) ===
        String(form.projectId || "")
    );

    const sourceEmployeeForPreview =
      findSourceEmployee();

    const sourceEmployeePercentage = Number(
      sourceEmployeeForPreview?.salaryPercentage ||
        sourceEmployeeForPreview?.percentage ||
        0
    );

    const sourceEmployeeSalaryType = String(
      sourceEmployeeForPreview?.salaryType || ""
    )
      .trim()
      .toLowerCase();

    const previewCommission =
      sourceEmployeeSalaryType === "percentage" &&
      sourceEmployeePercentage > 0 &&
      sourceEmployeePercentage <= 100
        ? Math.round(
            Number(form.totalAmount || 0) *
              sourceEmployeePercentage
          ) / 100
        : 0;

    const previewEmployeeName =
      sourceEmployeeForPreview?.fullName ||
      sourceEmployeeForPreview?.employeeName ||
      sourceEmployeeForPreview?.name ||
      customer?.sourceEmployeeName ||
      customer?.source ||
      "Source Employee";

    const sourceIsWalkIn =
      isWalkInCustomerSource();

    async function updateGuaranteeDocument(event) {
      const file = event.target.files?.[0];

      if (!file) return;

      if (file.size > 4 * 1024 * 1024) {
        notify(
          "Guarantee document must be smaller than 4 MB.",
          "error"
        );
        event.target.value = "";
        return;
      }

      try {
        const dataUrl =
          await readFileAsDataUrl(file);

        setForm((current) => ({
          ...current,
          guaranteeDocument: {
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl,
          },
        }));
      } catch (error) {
        notify(error.message, "error");
      }
    }
  

    async function updatePassportDocument(event) {
      const file = event.target.files?.[0];

      if (!file) return;

      if (file.size > 4 * 1024 * 1024) {
        notify(
          "Passport document must be smaller than 4 MB.",
          "error"
        );
        event.target.value = "";
        return;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);

        setForm((current) => ({
          ...current,
          passportDocument: {
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl,
          },
        }));
      } catch (error) {
        notify(error.message, "error");
      }
    }

    useEffect(() => {
      if (!customer) return;
  
      setForm(createInitialForm(customer));
    }, [customer]);
  
    useEffect(() => {
      setEnglishTests([
        ...new Set([
          ...defaultEnglishTests,
          ...savedEnglishTests,
        ]),
      ]);
    }, [savedEnglishTests]);
  
    useEffect(() => {
      setCountries([
        ...new Set([
          ...defaultCountries,
          ...savedCountries,
        ]),
      ]);
    }, [savedCountries]);
  
    function updateField(event) {
      const { name, value } = event.target;

      if (name === "projectId") {
        const project = projects.find(
          (item) =>
            getProjectId(item) === String(value)
        );

        setForm((current) => ({
          ...current,
          projectId: value,
          projectName: project
            ? getProjectName(project)
            : "",
          totalAmount: project
            ? getProjectPrice(project)
            : "",
          currencyUnit: project
            ? getProjectCurrency(project)
            : current.currencyUnit,
        }));

        return;
      }

      setForm((current) => ({
        ...current,
        [name]: value,
        ...(name === "bankStatementOwner" &&
        value === "None"
          ? { bankStatementAmount: "" }
          : {}),
      }));
    }
  
    function toggleEnglishTest(test) {
      setForm((current) => {
        const selected = Array.isArray(
          current.englishTests
        )
          ? current.englishTests
          : [];
  
        const exists = selected.includes(test);
  
        return {
          ...current,
          englishTests: exists
            ? selected.filter(
                (item) => item !== test
              )
            : [...selected, test],
        };
      });
    }
  
    function addEnglishTest() {
      const value = newTest.trim();
  
      if (!value) {
        notify(
          "Please enter the document name.",
          "error"
        );
        return;
      }
  
      setEnglishTests((current) => [
        ...new Set([...current, value]),
      ]);
  
      setForm((current) => ({
        ...current,
        englishTests: [
          ...new Set([
            ...(Array.isArray(
              current.englishTests
            )
              ? current.englishTests
              : []),
            value,
          ]),
        ],
      }));
  
      setNewTest("");
      setShowTestAdder(false);
    }
  
    function addCountry() {
      const value = newCountry.trim();
  
      if (!value) {
        notify(
          "Please enter the country name.",
          "error"
        );
        return;
      }
  
      setCountries((current) => [
        ...new Set([...current, value]),
      ]);
  
      setForm((current) => ({
        ...current,
        country: value,
      }));
  
      setNewCountry("");
      setShowCountryAdder(false);
    }
  

    function isWalkInCustomerSource() {
      const sourceName = String(
        customer?.sourceEmployeeName ||
          customer?.source ||
          ""
      )
        .trim()
        .toLowerCase();

      return sourceName === "walk in customer";
    }

    /*
     * فیصدی فقط برای همان کارمندی محاسبه می‌شود
     * که در Reception داخل فیلد Source انتخاب شده است.
     * Assigned To در محاسبه فیصدی هیچ نقشی ندارد.
     */
    function findSourceEmployee() {
      if (isWalkInCustomerSource()) {
        return null;
      }

      const sourceEmployeeId = String(
        customer?.sourceEmployeeId || ""
      );

      if (sourceEmployeeId) {
        const byId = employees.find(
          (employee) =>
            String(
              employee.id ||
                employee.employeeId ||
                ""
            ) === sourceEmployeeId
        );

        if (byId) return byId;
      }

      const sourceName = String(
        customer?.sourceEmployeeName ||
          customer?.source ||
          ""
      )
        .trim()
        .toLowerCase();

      if (!sourceName) return null;

      return (
        employees.find((employee) =>
          [
            employee.fullName,
            employee.employeeName,
            employee.name,
            employee.email,
          ]
            .map((value) =>
              String(value || "")
                .trim()
                .toLowerCase()
            )
            .includes(sourceName)
        ) || null
      );
    }

    function createLinkedRecordId(prefix) {
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
      ) {
        return `${prefix}-${crypto.randomUUID()}`;
      }

      return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;
    }

    function getAfghanistanDateParts() {
      const now = new Date();

      return {
        iso: now.toISOString(),
        date: new Intl.DateTimeFormat(
          "en-CA",
          {
            timeZone: "Asia/Kabul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }
        ).format(now),
        time: new Intl.DateTimeFormat(
          "en-GB",
          {
            timeZone: "Asia/Kabul",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }
        ).format(now),
      };
    }

    async function syncCustomerPaymentIncome(
      paidAmount,
      totalAmount,
      currencyUnit
    ) {
      const source =
        "customer-follow-up-payment";
      const referenceId =
        String(customer.id);

      const existing = transactions.find(
        (entry) =>
          entry.source === source &&
          String(entry.referenceId || "") ===
            referenceId
      );

      const withoutCurrent =
        transactions.filter(
          (entry) =>
            !(
              entry.source === source &&
              String(entry.referenceId || "") ===
                referenceId
            )
        );

      const amount = Number(paidAmount || 0);

      if (!(amount > 0)) {
        return setTransactions(withoutCurrent);
      }

      const afghanistan =
        getAfghanistanDateParts();

      const record = {
        ...(existing || {}),
        id:
          existing?.id ||
          createLinkedRecordId(
            "follow-up-income"
          ),
        type: "income",
        title:
          `${customer.customerType || "Customer"} Payment - ${getCustomerName(
            customer
          )}`,
        category: "Customer Payment",
        amount,
        currencyUnit:
          currencyUnit || "AFN",
        currency:
          currencyUnit || "AFN",
        totalAmount:
          Number(totalAmount || 0),
        remainingAmount: Math.max(
          Number(totalAmount || 0) - amount,
          0
        ),
        customerId: customer.id,
        customerName:
          getCustomerName(customer),
        customerType:
          customer.customerType || "",
        sourceEmployeeId:
          customer.sourceEmployeeId || "",
        sourceEmployeeName:
          customer.sourceEmployeeName ||
          customer.source ||
          "",
        source,
        referenceId: customer.id,
        description:
          `Payment received from ${getCustomerName(
            customer
          )} through Application Follow-Up Form.`,
        date:
          existing?.date ||
          afghanistan.date,
        time:
          existing?.time ||
          afghanistan.time,
        afghanistanDate:
          existing?.afghanistanDate ||
          afghanistan.date,
        afghanistanTime:
          existing?.afghanistanTime ||
          afghanistan.time,
        createdAt:
          existing?.createdAt ||
          afghanistan.iso,
        updatedAt: afghanistan.iso,
      };

      return setTransactions([
        ...withoutCurrent,
        record,
      ]);
    }

    async function syncCallCenterCommission(
      status,
      totalAmount
    ) {
      const referenceId =
        String(customer.id);

      const withoutCurrent =
        employeeAdjustments.filter(
          (entry) =>
            !(
              entry.source ===
                "follow-up-approval-commission" &&
              String(entry.referenceId || "") ===
                referenceId
            )
        );

      if (
        status !== "Approved" ||
        isWalkInCustomerSource()
      ) {
        return setEmployeeAdjustments(
          withoutCurrent
        );
      }

      const employee =
        findSourceEmployee();

      if (!employee) {
        notify(
          "Approved, but the employee selected in Reception Source was not found.",
          "warning"
        );

        return setEmployeeAdjustments(
          withoutCurrent
        );
      }

      const salaryType = String(
        employee.salaryType || ""
      )
        .trim()
        .toLowerCase();

      const percentage = Number(
        employee.salaryPercentage ||
          employee.percentage ||
          0
      );

      if (
        salaryType !== "percentage" ||
        percentage <= 0 ||
        percentage > 100
      ) {
        return setEmployeeAdjustments(
          withoutCurrent
        );
      }

      const commission =
        Math.round(
          Number(totalAmount || 0) *
            percentage
        ) / 100;

      if (commission <= 0) {
        return setEmployeeAdjustments(
          withoutCurrent
        );
      }

      const previous =
        employeeAdjustments.find(
          (entry) =>
            entry.source ===
              "follow-up-approval-commission" &&
            String(entry.referenceId || "") ===
              referenceId
        );

      const now =
        new Date().toISOString();

      const commissionRecord = {
        id:
          previous?.id ||
          `follow-up-commission-${customer.id}`,
        employeeId:
          employee.id ||
          employee.employeeId,
        employeeName:
          employee.fullName ||
          employee.employeeName ||
          employee.name ||
          customer.sourceEmployeeName ||
          "Call Center",
        employeeEmail: employee.email || "",
        employeeUsername: employee.username || "",
        type: "credit",
        amount: commission,
        currencyUnit:
          form.currencyUnit || "AFN",
        currency:
          form.currencyUnit || "AFN",
        salaryPercentage: percentage,
        source:
          "follow-up-approval-commission",
        referenceId: customer.id,
        customerId: customer.id,
        customerName:
          getCustomerName(customer),
        reason:
          `${percentage}% commission for Source employee ${customer.sourceEmployeeName || customer.source || ""} from approved application total amount`,
        createdAt:
          previous?.createdAt || now,
        updatedAt: now,
        ...(!previous
          ? {
              employeeNotificationType:
                "ledger-credit",
              employeeNotificationAt: now,
            }
          : {}),
      };

      const saved = await setEmployeeAdjustments([
        ...withoutCurrent,
        commissionRecord,
      ]);

      if (saved) {
        window.dispatchEvent(
          new CustomEvent(
            "isp-employee-ledger-updated",
            {
              detail: {
                entryId: commissionRecord.id,
                employeeId:
                  commissionRecord.employeeId,
                updatedAt:
                  commissionRecord.updatedAt,
              },
            }
          )
        );
      }

      return saved;
    }

    async function saveFollowUp(event) {
      event.preventDefault();
  
      if (!customer || saving) return;
  
      if (
        customer.customerType === "consultant" &&
        (
          !Array.isArray(form.englishTests) ||
          !form.englishTests.length
        )
      ) {
        notify(
          "Please select at least one English test document.",
          "error"
        );
        return;
      }
  
      if (
        ["consultant", "travel"].includes(
          customer.customerType
        ) &&
        !form.bankStatementOwner
      ) {
        notify(
          "Please select the bank statement owner.",
          "error"
        );
        return;
      }
  
      if (
        ["consultant", "travel"].includes(
          customer.customerType
        ) &&
        form.bankStatementOwner !== "None" &&
        !String(form.bankStatementAmount).trim()
      ) {
        notify(
          "Please enter the bank statement amount.",
          "error"
        );
        return;
      }
  
      if (
        customer.customerType === "consultant" &&
        form.graduationPercentage !== "" &&
        (
          Number(form.graduationPercentage) < 0 ||
          Number(form.graduationPercentage) > 100
        )
      ) {
        notify(
          "Graduation percentage must be between 0 and 100.",
          "error"
        );
        return;
      }

      if (
        customer.customerType === "consultant" &&
        form.graduationYear &&
        (
          Number(form.graduationYear) < 1950 ||
          Number(form.graduationYear) > 2100
        )
      ) {
        notify(
          "Please enter a valid graduation year.",
          "error"
        );
        return;
      }

      if (
        ["consultant", "travel"].includes(
          customer.customerType
        ) &&
        !form.country
      ) {
        notify(
          "Please select a country.",
          "error"
        );
        return;
      }
  
      if (
        ["consultant", "travel"].includes(
          customer.customerType
        ) &&
        !form.scholarshipType
      ) {
        notify(
          "Please select a scholarship type.",
          "error"
        );
        return;
      }
  
      if (
        customer.customerType === "consultant" &&
        !form.intake
      ) {
        notify(
          "Please select an intake.",
          "error"
        );
        return;
      }
  
      if (
        isAdminAccount &&
        customer.customerType === "technology" &&
        !form.projectId
      ) {
        notify(
          "Please select a project.",
          "error"
        );
        return;
      }

      if (
        customer.customerType === "media" &&
        !form.mediaPurpose
      ) {
        notify(
          "Please select a media purpose.",
          "error"
        );
        return;
      }

      if (
        customer.customerType === "media" &&
        form.mediaPurpose === "Custom" &&
        !form.customMediaPurpose.trim()
      ) {
        notify(
          "Please enter the custom media purpose.",
          "error"
        );
        return;
      }

      const totalAmount =
        Number(form.totalAmount || 0);
      const paidAmount =
        Number(form.paidAmount || 0);

      if (isAdminAccount && totalAmount <= 0) {
        notify(
          "Please enter a valid total amount.",
          "error"
        );
        return;
      }

      if (
        isAdminAccount &&
        (paidAmount < 0 || paidAmount > totalAmount)
      ) {
        notify(
          "Paid amount cannot exceed total amount.",
          "error"
        );
        return;
      }

      if (
        isAdminAccount &&
        ["consultant", "travel"].includes(
          customer.customerType
        ) &&
        !form.guaranteeType
      ) {
        notify(
          "Please select a guarantee type.",
          "error"
        );
        return;
      }

      if (
        isAdminAccount &&
        ["consultant", "travel"].includes(
          customer.customerType
        ) &&
        form.guaranteeType === "Custom" &&
        !form.customGuaranteeType.trim()
      ) {
        notify(
          "Please enter the custom guarantee type.",
          "error"
        );
        return;
      }

      if (isAdminAccount && !form.decisionStatus) {
        notify(
          "Please select Pending, Approved or Rejected.",
          "error"
        );
        return;
      }

      setSaving(true);
  
      try {
        const now = new Date().toISOString();
  
        const latestCustomers =
          await loadCustomers();
  
        const nextCustomers = latestCustomers.map((item) => {
          if (String(item.id) !== String(customer.id)) {
            return item;
          }

          const existingFollowUp = item.followUp || {};

          if (!isAdminAccount) {
            const protectedFinancial = {
              currencyUnit:
                existingFollowUp.currencyUnit ||
                item.currencyUnit ||
                item.unit ||
                "AFN",
              totalAmount:
                existingFollowUp.totalAmount ??
                item.totalAmount ??
                "",
              paidAmount:
                existingFollowUp.paidAmount ??
                item.paidAmount ??
                "",
              guaranteeType:
                existingFollowUp.guaranteeType || "",
              customGuaranteeType:
                existingFollowUp.customGuaranteeType || "",
              guaranteeDocument:
                existingFollowUp.guaranteeDocument || null,
              projectId:
                existingFollowUp.projectId || item.projectId || "",
              projectName:
                existingFollowUp.projectName || item.projectName || "",
              decisionStatus:
                existingFollowUp.decisionStatus ||
                item.followUpDecisionStatus ||
                "Pending",
            };

            return {
              ...item,
              passportNumber: form.passportNumber.trim(),
              maritalStatus: form.maritalStatus,
              graduatedMajor: form.graduatedMajor.trim(),
              graduationPercentage:
                form.graduationPercentage === ""
                  ? ""
                  : Number(form.graduationPercentage),
              graduationYear: form.graduationYear,
              desiredMajor: form.desiredMajor.trim(),
              country: form.country,
              passportDocument: form.passportDocument,
              mediaPurpose: form.mediaPurpose,
              customMediaPurpose:
                form.mediaPurpose === "Custom"
                  ? form.customMediaPurpose.trim()
                  : "",
              brandName: form.brandName.trim(),
              followUp: {
                ...existingFollowUp,
                ...form,
                ...protectedFinancial,
                graduationPercentage:
                  form.graduationPercentage === ""
                    ? ""
                    : Number(form.graduationPercentage),
                graduatedMajor: form.graduatedMajor.trim(),
                desiredMajor: form.desiredMajor.trim(),
                submittedForAdminAt: now,
                submittedByAccountId: currentUser?.id || "",
                submittedByEmployeeId:
                  currentUser?.employeeId || "",
                submittedByName:
                  currentUser?.fullName ||
                  currentUser?.username ||
                  currentUser?.email ||
                  "Reception",
              },
              followUpCompleted: false,
              followUpWorkflowStatus: "Awaiting Admin",
              followUpStatus: "Awaiting Admin",
              followUpUpdatedAt: now,
              updatedAt: now,
            };
          }

          return {
            ...item,
            currencyUnit: form.currencyUnit || "AFN",
            unit: form.currencyUnit || "AFN",
            totalAmount,
            paidAmount,
            remainingAmount: Math.max(totalAmount - paidAmount, 0),
            guaranteeType: form.guaranteeType,
            customGuaranteeType:
              form.customGuaranteeType.trim(),
            guaranteeDocument: form.guaranteeDocument,
            projectId: form.projectId,
            projectName: form.projectName,
            followUpDecisionStatus: form.decisionStatus,
            assignmentStatus: form.decisionStatus,
            acceptedAt:
              form.decisionStatus === "Approved"
                ? item.acceptedAt || now
                : item.acceptedAt || "",
            followUp: {
              ...existingFollowUp,
              currencyUnit: form.currencyUnit || "AFN",
              totalAmount,
              paidAmount,
              guaranteeType: form.guaranteeType,
              customGuaranteeType:
                form.customGuaranteeType.trim(),
              guaranteeDocument: form.guaranteeDocument,
              projectId: form.projectId,
              projectName: form.projectName,
              decisionStatus: form.decisionStatus,
              completedAt: now,
              completedByAccountId: currentUser?.id || "",
              completedByName:
                currentUser?.fullName ||
                currentUser?.username ||
                currentUser?.email ||
                "Admin",
            },
            followUpCompleted: true,
            followUpWorkflowStatus: "Completed",
            followUpStatus: form.decisionStatus,
            followUpUpdatedAt: now,
            updatedAt: now,
          };
        });
  
        const saved =
          await setCustomers(nextCustomers);
  
        if (!saved) {
          notify(
            "Unable to save the follow-up form.",
            "error"
          );
          return;
        }

        const incomeSaved = isAdminAccount
          ? await syncCustomerPaymentIncome(
              paidAmount,
              totalAmount,
              form.currencyUnit || "AFN"
            )
          : true;

        const commissionSaved = isAdminAccount
          ? await syncCallCenterCommission(
              form.decisionStatus,
              totalAmount
            )
          : true;

        if (!incomeSaved) {
          notify(
            "Follow-up saved, but the payment could not be linked with Financial Income.",
            "warning"
          );
        }

        if (!commissionSaved) {
          notify(
            "Follow-up saved, but the approved commission could not be linked with the employee ledger.",
            "warning"
          );
        }

        window.dispatchEvent(
          new CustomEvent("isp-customer-assignment-updated")
        );

        notify(
          !isAdminAccount
            ? "Follow-up was sent to the admin for financial review."
            : form.decisionStatus === "Approved"
            ? "Follow-up, income and employee ledger were updated successfully."
            : paidAmount > 0
              ? "Follow-up and customer income were saved successfully."
              : "Customer follow-up saved successfully.",
          "success"
        );

        navigate(isAdminAccount ? "/" : "/my-account");
      } finally {
        setSaving(false);
      }
    }
  
    if (!customersLoaded) {
      return (
        <div className="customer-followup-page">
          <div className="customer-followup-not-found">
            <FileCheck2 size={38} />
            <h1>Loading Customer...</h1>
          </div>
        </div>
      );
    }
  
    if (!customer) {
      return (
        <div className="customer-followup-page">
          <div className="customer-followup-not-found">
            <FileCheck2 size={38} />
  
            <h1>Customer Not Found</h1>
  
            <p>
              The requested customer record does not
              exist.
            </p>
  
            <button
              type="button"
              onClick={() =>
                navigate("/my-account")
              }
            >
              <ArrowLeft size={16} />
              Back to My Account
            </button>
          </div>
        </div>
      );
    }
  
    return (
      <div className="customer-followup-page">
        <header className="customer-followup-heading">
          <div>
            <button
              type="button"
              className="customer-followup-back"
              onClick={() =>
                navigate("/my-account")
              }
            >
              <ArrowLeft size={16} />
              My Account
            </button>
  
            <span>Customer Follow Up</span>
  
            <h1>Application Follow-Up Form</h1>
  
            <p>
              Complete the next-stage information for
              the accepted customer.
            </p>
          </div>
  
          <div className="customer-followup-customer">
            <div>
              {String(
                getCustomerName(customer)
              )
                .charAt(0)
                .toUpperCase()}
            </div>
  
            <span>
              <div className="customer-followup-name-source">
                <strong>
                  {getCustomerName(customer)}
                </strong>

                <em>
                  Source:{" "}
                  {getCustomerSourceName(customer)}
                </em>
              </div>

              <small>
                {customer.customerType ||
                  "Customer"}
              </small>
            </span>
          </div>
        </header>
  
        <form
          className="customer-followup-form"
          onSubmit={saveFollowUp}
        >
          <div className="customer-followup-workflow-note">
            {isAdminAccount ? (
              <>
                <LockKeyhole size={18} />
                <span>
                  Reception information is read-only. Complete the
                  financial section and save the final decision.
                </span>
              </>
            ) : (
              <>
                <LockKeyhole size={18} />
                <span>
                  The financial and guarantee section is locked for
                  Reception and will be completed by an admin.
                </span>
              </>
            )}
          </div>

          <fieldset
            className="customer-followup-role-section"
            disabled={isAdminAccount}
          >
          {customer.customerType === "consultant" && (
          <section className="customer-followup-card">
            <header>
              <FileCheck2 size={20} />
  
              <div>
                <h2>Document Information</h2>
  
                <p>
                  Select the available English test
                  document.
                </p>
              </div>
            </header>
  
            <div className="customer-followup-field">
              <label htmlFor="englishTest">
                English Test Documents
              </label>
  
              <small className="customer-followup-help">
                You can select more than one document.
              </small>
  
              <div className="customer-followup-document-picker">
                <div className="customer-followup-document-options">
                  {englishTests.map((test) => {
                    const selected =
                      form.englishTests.includes(
                        test
                      );
  
                    return (
                      <button
                        key={test}
                        type="button"
                        className={
                          selected
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          toggleEnglishTest(test)
                        }
                      >
                        <span>{test}</span>
  
                        {selected && (
                          <CheckCircle2
                            size={15}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
  
                <button
                  type="button"
                  onClick={() =>
                    setShowTestAdder(
                      (open) => !open
                    )
                  }
                  title="Add another document"
                >
                  <Plus size={17} />
                </button>
              </div>
  
              {showTestAdder && (
                <div className="customer-followup-inline-adder">
                  <input
                    value={newTest}
                    onChange={(event) =>
                      setNewTest(
                        event.target.value
                      )
                    }
                    placeholder="Enter document name"
                    autoFocus
                  />
  
                  <button
                    type="button"
                    onClick={addEnglishTest}
                  >
                    Add
                  </button>
  
                  <button
                    type="button"
                    className="close"
                    onClick={() => {
                      setShowTestAdder(false);
                      setNewTest("");
                    }}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </section>
  
          )}

          {customer.customerType === "media" && (
            <section className="customer-followup-card">
              <header>
                <Building2 size={20} />

                <div>
                  <h2>Media Production Information</h2>
                  <p>
                    Select the requested media service and confirm the brand.
                  </p>
                </div>
              </header>

              <div className="customer-followup-grid">
                <div className="customer-followup-field">
                  <label htmlFor="mediaPurpose">
                    Purpose
                  </label>

                  <select
                    id="mediaPurpose"
                    name="mediaPurpose"
                    value={form.mediaPurpose}
                    onChange={updateField}
                  >
                    <option value="">
                      Select purpose
                    </option>

                    {defaultMediaPurposes.map((purpose) => (
                      <option
                        key={purpose}
                        value={purpose}
                      >
                        {purpose}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="customer-followup-field">
                  <label htmlFor="brandName">
                    Brand Name
                  </label>

                  <input
                    id="brandName"
                    name="brandName"
                    value={form.brandName}
                    onChange={updateField}
                    placeholder="Enter brand name"
                  />
                </div>

                {form.mediaPurpose === "Custom" && (
                  <div className="customer-followup-field customer-followup-full">
                    <label htmlFor="customMediaPurpose">
                      Custom Purpose
                    </label>

                    <input
                      id="customMediaPurpose"
                      name="customMediaPurpose"
                      value={form.customMediaPurpose}
                      onChange={updateField}
                      placeholder="Enter custom media purpose"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {["consultant", "travel"].includes(
            customer.customerType
          ) && (
            <section className="customer-followup-card">
              <header>
                <Landmark size={20} />

                <div>
                  <h2>Bank Statement</h2>

                  <p>
                    Choose the statement owner and enter
                    the available amount.
                  </p>
                </div>
              </header>

              <div className="customer-followup-grid">
                <div className="customer-followup-field customer-followup-statement-owner">
                  <label>Statement Owner</label>

                  <div className="customer-followup-options">
                    {["Self", "Family", "None"].map(
                      (owner) => (
                        <label key={owner}>
                          <input
                            type="radio"
                            name="bankStatementOwner"
                            value={owner}
                            checked={
                              form.bankStatementOwner ===
                              owner
                            }
                            onChange={updateField}
                          />

                          <span>{owner}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                <div className="customer-followup-field customer-followup-bank-amount">
                  <label htmlFor="bankStatementAmount">
                    Bank Statement Amount
                  </label>

                  <input
                    id="bankStatementAmount"
                    name="bankStatementAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.bankStatementAmount}
                    onChange={updateField}
                    disabled={
                      form.bankStatementOwner === "None"
                    }
                    placeholder={
                      form.bankStatementOwner === "None"
                        ? "No bank statement"
                        : "Enter amount"
                    }
                  />
                </div>
              </div>
            </section>
          )}

          {["consultant", "travel"].includes(
            customer.customerType
          ) && (
            <section className="customer-followup-card">
            <header>
              <Building2 size={20} />
  
              <div>
                <h2>
                  {customer.customerType === "travel"
                    ? "Travel Destination"
                    : "Study Preferences"}
                </h2>
  
                <p>
                  Select the destination, scholarship,
                  and intake.
                </p>
              </div>
            </header>
  
            <div className="customer-followup-grid">
              <div className="customer-followup-field">
                <label>Country</label>

                <CountrySelect
                  value={form.country}
                  onChange={updateField}
                  countries={countries}
                />
              </div>

              <div className="customer-followup-field customer-followup-scholarship-field">
                <label htmlFor="scholarshipType">
                  {customer.customerType === "travel"
                    ? "Visa Type"
                    : "Scholarship Type"}
                </label>
  
                <select
                  id="scholarshipType"
                  name="scholarshipType"
                  value={form.scholarshipType}
                  onChange={updateField}
                >
                  <option value="">
                    {customer.customerType === "travel"
                      ? "Select visa type"
                      : "Select scholarship type"}
                  </option>
  
                  {scholarshipTypes.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    )
                  )}
                </select>
              </div>
  
              {customer.customerType === "consultant" && (
              <div className="customer-followup-field customer-followup-full">
                <label>Intake</label>

                <div className="customer-followup-options intake">
                  {[...intakes, "Custom"].map((intake) => (
                    <label key={intake}>
                      <input
                        type="radio"
                        name="intake"
                        value={intake}
                        checked={
                          form.intake === intake
                        }
                        onChange={updateField}
                      />

                      <span>{intake}</span>
                    </label>
                  ))}
                </div>

                {form.intake === "Custom" && (
                  <input
                    name="customIntake"
                    value={form.customIntake}
                    onChange={updateField}
                    placeholder="Enter custom intake"
                  />
                )}
              </div>
              )}
            </div>
          </section>
  
          )}

          {(customer.customerType === "consultant" ||
            customer.customerType === "travel") && (
            <section className="customer-followup-card">
              <header>
                <Building2 size={20} />

                <div>
                  <h2>Application Information</h2>
                  <p>
                    Complete the customer passport and
                    application details.
                  </p>
                </div>
              </header>

              <div className="customer-followup-grid">
                <div className="customer-followup-field">
                  <label htmlFor="passportNumber">
                    Passport Number
                  </label>

                  <input
                    id="passportNumber"
                    name="passportNumber"
                    value={form.passportNumber}
                    onChange={updateField}
                    placeholder="Enter passport number"
                  />
                </div>

                <div className="customer-followup-field">
                  <label htmlFor="maritalStatus">
                    Marital Status
                  </label>

                  <select
                    id="maritalStatus"
                    name="maritalStatus"
                    value={form.maritalStatus}
                    onChange={updateField}
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                <div className="customer-followup-field customer-followup-full">
                  <label htmlFor="passportDocument">
                    Passport Upload
                  </label>

                  <input
                    id="passportDocument"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={updatePassportDocument}
                  />

                  {form.passportDocument?.name && (
                    <small className="customer-followup-help">
                      {form.passportDocument.name}
                    </small>
                  )}
                </div>

                {customer.customerType === "consultant" && (
                  <>
                    <div className="customer-followup-field">
                      <label htmlFor="graduatedMajor">
                        Graduated Major
                      </label>

                      <input
                        id="graduatedMajor"
                        name="graduatedMajor"
                        value={form.graduatedMajor}
                        onChange={updateField}
                        placeholder="Enter graduated major"
                      />
                    </div>

                    <div className="customer-followup-field">
                      <label htmlFor="graduationPercentage">
                        Graduation Percentage
                      </label>

                      <input
                        id="graduationPercentage"
                        name="graduationPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={form.graduationPercentage}
                        onChange={updateField}
                        placeholder="Enter percentage"
                      />
                    </div>

                    <div className="customer-followup-field">
                      <label htmlFor="graduationYear">
                        Graduation Year
                      </label>

                      <input
                        id="graduationYear"
                        name="graduationYear"
                        type="number"
                        min="1950"
                        max="2100"
                        value={form.graduationYear}
                        onChange={updateField}
                        placeholder="Enter graduation year"
                      />
                    </div>

                    <div className="customer-followup-field">
                      <label htmlFor="desiredMajor">
                        Desired Major
                      </label>

                      <input
                        id="desiredMajor"
                        name="desiredMajor"
                        value={form.desiredMajor}
                        onChange={updateField}
                        placeholder="Enter desired major"
                      />
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          </fieldset>

          <fieldset
            className="customer-followup-role-section"
            disabled={!isAdminAccount}
          >
          <section className={`customer-followup-card customer-followup-financial-card${!isAdminAccount ? " locked" : ""}`}>
            <header>
              <Landmark size={20} />

              <div>
                <h2>Financial and Guarantee Information</h2>
                <p>
                  Record amounts, guarantee details,
                  document and final decision.
                </p>
              </div>

              {!isAdminAccount && (
                <span className="customer-followup-lock-badge">
                  <LockKeyhole size={14} />
                  Admin only
                </span>
              )}
            </header>

            <div className="customer-followup-grid">
              {customer.customerType === "technology" && (
                <>
                  <div className="customer-followup-field">
                    <label htmlFor="projectId">
                      Select Project
                    </label>

                    <select
                      id="projectId"
                      name="projectId"
                      value={form.projectId}
                      onChange={updateField}
                    >
                      <option value="">
                        Select project
                      </option>

                      {projects.map((project) => (
                        <option
                          key={getProjectId(project)}
                          value={getProjectId(project)}
                        >
                          {getProjectName(project)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="customer-followup-field">
                    <label>Customer</label>
                    <input
                      value={getCustomerName(customer)}
                      readOnly
                    />
                  </div>

                  <div className="customer-followup-field">
                    <label>Source</label>
                    <input
                      value={getCustomerSourceName(customer)}
                      readOnly
                    />
                  </div>

                  <div className="customer-followup-field">
                    <label htmlFor="technologyProjectAmount">
                      Project Amount
                    </label>

                    <input
                      id="technologyProjectAmount"
                      name="totalAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.totalAmount}
                      onChange={updateField}
                      placeholder="Enter or change project amount"
                    />
                  </div>
                </>
              )}

              <div className="customer-followup-field">
                <label htmlFor="currencyUnit">
                  Currency Unit
                </label>

                <select
                  id="currencyUnit"
                  name="currencyUnit"
                  value={form.currencyUnit}
                  onChange={updateField}
                >
                  <option value="AFN">
                    AFN - Afghani
                  </option>

                  <option value="USD">
                    USD - Dollar
                  </option>
                </select>
              </div>

              {customer.customerType !== "technology" && (
                <div className="customer-followup-field">
                  <label htmlFor="totalAmount">
                    Total Amount
                  </label>

                  <input
                    id="totalAmount"
                    name="totalAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.totalAmount}
                    onChange={updateField}
                    placeholder="Enter total amount"
                  />
                </div>
              )}

              <div className="customer-followup-field">
                <label htmlFor="paidAmount">
                  Paid Amount
                </label>

                <input
                  id="paidAmount"
                  name="paidAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.paidAmount}
                  onChange={updateField}
                  placeholder="Enter paid amount"
                />
              </div>

              <div className="customer-followup-field">
                <label>Remaining Amount</label>

                <input
                  value={`${remainingAmount.toLocaleString(
                    "en-US"
                  )} ${form.currencyUnit || "AFN"}`}
                  readOnly
                />
              </div>

              {!["technology", "media"].includes(
                customer.customerType
              ) && (
                <>
              <div className="customer-followup-field">
                <label htmlFor="guaranteeType">
                  Guarantee Type
                </label>

                <select
                  id="guaranteeType"
                  name="guaranteeType"
                  value={form.guaranteeType}
                  onChange={updateField}
                >
                  <option value="">
                    Select guarantee type
                  </option>

                  {guaranteeTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {form.guaranteeType === "Custom" && (
                <div className="customer-followup-field">
                  <label htmlFor="customGuaranteeType">
                    Custom Guarantee
                  </label>

                  <input
                    id="customGuaranteeType"
                    name="customGuaranteeType"
                    value={form.customGuaranteeType}
                    onChange={updateField}
                    placeholder="Enter guarantee type"
                  />
                </div>
              )}

              <div className="customer-followup-field">
                <label htmlFor="guaranteeDocument">
                  Guarantee Document
                </label>

                <input
                  id="guaranteeDocument"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={updateGuaranteeDocument}
                />

                {form.guaranteeDocument?.name && (
                  <small className="customer-followup-help">
                    {form.guaranteeDocument.name}
                  </small>
                )}
              </div>

                </>
              )}

              <div className="customer-followup-field customer-followup-full">
                <label>Application Status</label>

                <div className="customer-followup-options followup-status-options">
                  {followUpStatuses.map((status) => (
                    <label
                      key={status}
                      className={status.toLowerCase()}
                    >
                      <input
                        type="radio"
                        name="decisionStatus"
                        value={status}
                        checked={
                          form.decisionStatus === status
                        }
                        onChange={updateField}
                      />

                      <span>{status}</span>
                    </label>
                  ))}
                </div>

                {form.decisionStatus === "Approved" && (
                  <div className="followup-commission-preview">
                    {previewCommission > 0 ? (
                      <>
                        <strong>
                          {sourceEmployeePercentage}% of the
                          total amount will be credited to{" "}
                          {previewEmployeeName}.
                        </strong>

                        <span>
                          {previewCommission.toLocaleString(
                            "en-US"
                          )}{" "}
                          {form.currencyUnit || "AFN"} will be
                          added to the employee ledger after
                          saving this approved application.
                        </span>
                      </>
                    ) : (
                      <span>
                        {sourceIsWalkIn
                          ? "Source is Walk in Customer, so no employee commission will be created."
                          : "No percentage commission will be created because the employee selected in Reception Source does not have a valid percentage salary."}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
          </fieldset>

          <footer className="customer-followup-actions">
            <button
              type="button"
              onClick={() =>
                navigate("/my-account")
              }
              disabled={saving}
            >
              Cancel
            </button>
  
            <button
              type="submit"
              className="primary"
              disabled={saving}
            >
              {isAdminAccount && customer.followUpCompleted ? (
                <CheckCircle2 size={17} />
              ) : (
                <Save size={17} />
              )}
  
              {saving
                ? "Saving..."
                : isAdminAccount
                  ? customer.followUpCompleted
                    ? "Update Follow Up"
                    : "Complete & Save Follow Up"
                  : "Send to Admin"}
            </button>
          </footer>
        </form>
      </div>
    );
  }
