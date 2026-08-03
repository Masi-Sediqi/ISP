import { useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Clapperboard,
  Cpu,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  Plane,
  Plus,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
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

const technologyPurposes = [
  "Website",
  "Application",
  "Software",
  "Other",
];

function createConsultantForm() {
  return {
    fullName: "",
    phone: "",
    educationalLevel: "",
    schoolUniversity: "",
    email: "",
    source: "",
    assignedEmployeeId: "",
    assignedEmployeeName: "",
    purpose: "",
    date: today(),
  };
}

function createTravelForm() {
  return {
    fullName: "",
    phone: "",
    source: "",
    assignedEmployeeId: "",
    assignedEmployeeName: "",
    purpose: "",
    date: today(),
  };
}

function createTechnologyForm() {
  return {
    fullName: "",
    companyName: "",
    contactNumber: "",
    technologyPurpose: "Website",
    source: "",
    assignedEmployeeId: "",
    assignedEmployeeName: "",
    note: "",
    date: today(),
  };
}

function createMediaForm() {
  return {
    personName: "",
    brandName: "",
    purpose: "Video",
    source: "",
    about: "",
    date: today(),
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

export default function Reception({ currentUser }) {
  const [customers, setCustomers] =
    useJsonCollection("customers");

  const [mediaProducts, setMediaProducts] =
    useJsonCollection("mediaProducts");

  const [employees] = useJsonCollection("employees");
  const [accounts] = useJsonCollection("accounts");

  const [educationInstitutions, setEducationInstitutions] =
    useJsonCollection("educationInstitutions");

  const [showForm, setShowForm] = useState(false);
  const [registrationType, setRegistrationType] =
    useState("consultant");

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

  const [showInstitutionForm, setShowInstitutionForm] =
    useState(false);

  const [newInstitutionName, setNewInstitutionName] =
    useState("");

  const [search, setSearch] = useState("");

  const [assignTarget, setAssignTarget] =
  useState(null);

const [assignEmployeeId, setAssignEmployeeId] =
  useState("");

const [assignEmployeeName, setAssignEmployeeName] =
  useState("");

const [assigningRecord, setAssigningRecord] =
  useState(false);
  

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
        String(customer.id) ===
        String(assignTarget.id)
          ? {
              ...customer,

              assignedEmployeeId:
                assignEmployeeId,

              assignedEmployeeName:
                assignEmployeeName,

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

              assignmentStatus: "Assigned",

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
    const accountEmployees = accounts.filter(
      (account) =>
        account.accountType === "employee" ||
        account.employeeId ||
        String(account.role || "")
          .toLowerCase()
          .includes("employee")
    );

    const combined = [...employees, ...accountEmployees];
    const seen = new Set();

    return combined.filter((employee) => {
      const key = String(
        employee.id ||
          employee.employeeId ||
          employee.email ||
          getEmployeeName(employee)
      );

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
  }, [employees, accounts]);

  const receptionCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return customers
    .filter((customer) => {
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
          customer.assignedEmployeeName,
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
          new Date(second.createdAt || second.date || 0) -
          new Date(first.createdAt || first.date || 0)
      );
  }, [customers, search]);

  const consultantCount = receptionCustomers.filter(
    (customer) =>
      customer.customerType === "consultant"
  ).length;

  const travelCount = receptionCustomers.filter(
    (customer) => customer.customerType === "travel"
  ).length;

  const technologyCount = receptionCustomers.filter(
    (customer) =>
      customer.customerType === "technology"
  ).length;

  function resetForms() {
    setConsultantForm(createConsultantForm());
    setTravelForm(createTravelForm());
    setTechnologyForm(createTechnologyForm());
    setMediaForm(createMediaForm());
    setShowInstitutionForm(false);
    setNewInstitutionName("");
  }

  function openAddForm() {
    resetForms();
    setRegistrationType("consultant");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForms();
  }

  function selectRegistrationType(type) {
    setRegistrationType(type);
    resetForms();
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

    setMediaForm((current) => ({
      ...current,
      [name]: value,
    }));
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

    const record = {
      id: createId(),

      fullName: consultantForm.fullName.trim(),
      passportFullName:
        consultantForm.fullName.trim(),
      customerName: consultantForm.fullName.trim(),

      phone: consultantForm.phone.trim(),
      educationalLevel:
        consultantForm.educationalLevel,
      schoolUniversity:
        consultantForm.schoolUniversity,
      email: consultantForm.email.trim(),

      source: consultantForm.source.trim(),
      assignedEmployeeId:
        consultantForm.assignedEmployeeId,
      assignedEmployeeName:
        consultantForm.assignedEmployeeName,

      purpose: consultantForm.purpose.trim(),
      date: consultantForm.date,

      customerType: "consultant",
      specializedCustomer: true,
      registeredFrom: "reception",

      sourceEmployeeId:
        currentUser?.employeeId ||
        currentUser?.id ||
        "",

      sourceEmployeeName:
        currentUser?.fullName || "",

      createdByAccountId:
        currentUser?.id || "",

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await setCustomers([
      ...customers,
      record,
    ]);

    if (!saved) return;

    notify(
      "Consultant customer registered successfully.",
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

    const record = {
      id: createId(),

      fullName: travelForm.fullName.trim(),
      passportFullName:
        travelForm.fullName.trim(),
      customerName: travelForm.fullName.trim(),

      phone: travelForm.phone.trim(),
      source: travelForm.source.trim(),

      assignedEmployeeId:
        travelForm.assignedEmployeeId,
      assignedEmployeeName:
        travelForm.assignedEmployeeName,

      purpose: travelForm.purpose.trim(),
      date: travelForm.date,

      customerType: "travel",
      specializedCustomer: true,
      registeredFrom: "reception",

      sourceEmployeeId:
        currentUser?.employeeId ||
        currentUser?.id ||
        "",

      sourceEmployeeName:
        currentUser?.fullName || "",

      createdByAccountId:
        currentUser?.id || "",

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await setCustomers([
      ...customers,
      record,
    ]);

    if (!saved) return;

    notify(
      "Travel customer registered successfully.",
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

    const record = {
      id: createId(),

      fullName: technologyForm.fullName.trim(),
      customerName:
        technologyForm.fullName.trim(),

      companyName:
        technologyForm.companyName.trim(),

      contactNumber:
        technologyForm.contactNumber.trim(),

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

      note: technologyForm.note.trim(),
      notes: technologyForm.note.trim(),
      date: technologyForm.date,

      customerType: "technology",
      specializedCustomer: true,
      registeredFrom: "reception",

      sourceEmployeeId:
        currentUser?.employeeId ||
        currentUser?.id ||
        "",

      sourceEmployeeName:
        currentUser?.fullName || "",

      createdByAccountId:
        currentUser?.id || "",

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await setCustomers([
      ...customers,
      record,
    ]);

    if (!saved) return;

    notify(
      "Technology customer registered successfully.",
      "success"
    );

    closeForm();
  }

  async function saveMediaProduct() {
    if (!mediaForm.personName.trim()) {
      notify("Person name is required.", "error");
      return;
    }

    if (!mediaForm.brandName.trim()) {
      notify("Brand name is required.", "error");
      return;
    }

    const record = {
      id: createId(),

      personName: mediaForm.personName.trim(),
      brandName: mediaForm.brandName.trim(),
      purpose: mediaForm.purpose,
      source: mediaForm.source.trim(),
      about: mediaForm.about.trim(),
      date: mediaForm.date,
      note: mediaForm.note.trim(),

      registeredFrom: "reception",

      createdByAccountId:
        currentUser?.id || "",

      createdByName:
        currentUser?.fullName || "",

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await setMediaProducts([
      ...mediaProducts,
      record,
    ]);

    if (!saved) return;

    notify(
      "Media product added successfully.",
      "success"
    );

    closeForm();
  }

  return (
    <div className="reception-page">
      <header className="reception-heading">
        <div>
          <span>Customer Registration</span>
          <h1>Reception</h1>

          <p>
            Register consultant, travel, technology
            customers and media products from one
            workspace.
          </p>
        </div>

        <button type="button" onClick={openAddForm}>
          <Plus size={17} />
          Add Customer
        </button>
      </header>

      <section className="reception-stats">
        <div>
          <Users />
          <span>Total Customers</span>
          <strong>{receptionCustomers.length}</strong>
          <small>Registered through reception</small>
        </div>

        <div>
          <BriefcaseBusiness />
          <span>Consultant Customers</span>
          <strong>{consultantCount}</strong>
          <small>Consultation records</small>
        </div>

        <div>
          <Plane />
          <span>Travel Customers</span>
          <strong>{travelCount}</strong>
          <small>Travel service records</small>
        </div>

        <div>
          <Cpu />
          <span>Technology Customers</span>
          <strong>{technologyCount}</strong>
          <small>Technology service records</small>
        </div>

        <div>
          <Clapperboard />
          <span>Media Products</span>
          <strong>{mediaProducts.length}</strong>
          <small>Videos and posts</small>
        </div>
      </section>

      <section className="reception-records">
        <div className="reception-records-header">
          <div>
            <h2>Recent Customers</h2>

            <p>
              Customers registered from the Reception
              page.
            </p>
          </div>

          <label className="reception-search">
            <Search size={16} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search customers..."
            />
          </label>
        </div>

        <div className="reception-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Customer Type</th>
                <th>Source</th>
                <th>Assigned To</th>
                <th>Purpose</th>
                <th>Date</th>
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
                      {customer.customerType || "-"}
                    </span>
                  </td>

                  <td>
                    {customer.source || "-"}
                  </td>

                  <td>
  {customer.assignedEmployeeName ? (
    <button
      type="button"
      className="reception-assigned-employee"
      onClick={() =>
        openAssignModal(customer)
      }
      title="Change assigned employee"
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
      title="Assign this customer"
      aria-label="Assign customer"
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
                    <CalendarDays size={14} />
                    {customer.date
                      ? new Date(
                          `${customer.date}T00:00:00`
                        ).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}

              {!receptionCustomers.length && (
                <tr>
                  <td
                    colSpan="7"
                    className="reception-empty"
                  >
                    No reception customers registered
                    yet.
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
            <span>Phone Number</span>

            <input
              value={
                assignTarget.phone ||
                assignTarget.contactNumber ||
                "-"
              }
              readOnly
            />
          </label>

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
            <span>Source</span>

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
              <span>Email</span>

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
              <span>Company Name</span>

              <input
                value={
                  assignTarget.companyName
                }
                readOnly
              />
            </label>
          )}

          <label className="reception-assign-full">
            <span>Purpose</span>

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
            <span>Assign To</span>

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
                <span>Reception Registration</span>

                <h2>
                  {getRegistrationTitle(
                    registrationType
                  )}
                </h2>

                <p>
                  Select the registration type and
                  complete the required information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Close"
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
                          <strong>{type.title}</strong>
                          <small>
                            {type.description}
                          </small>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {registrationType ===
                  "consultant" && (
                  <div className="reception-form-grid">
                    <label>
                      <span>
                        Full Name In Passport
                      </span>

                      <input
                        name="fullName"
                        value={
                          consultantForm.fullName
                        }
                        onChange={
                          updateConsultantField
                        }
                        placeholder="Enter full name in passport"
                        autoFocus
                      />
                    </label>

                    <label>
                      <span>Phone Number</span>

                      <input
                        name="phone"
                        value={consultantForm.phone}
                        onChange={
                          updateConsultantField
                        }
                        placeholder="Enter phone number"
                      />
                    </label>

                    <label>
                      <span>Educational Level</span>

                      <select
                        name="educationalLevel"
                        value={
                          consultantForm.educationalLevel
                        }
                        onChange={
                          updateConsultantField
                        }
                      >
                        <option value="">
                          Select educational level
                        </option>

                        {educationLevels.map(
                          (level) => (
                            <option
                              key={level}
                              value={level}
                            >
                              {level}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <div className="reception-institution-field">
                      <span>School / University</span>

                      <div className="reception-institution-control">
                        <select
                          name="schoolUniversity"
                          value={
                            consultantForm.schoolUniversity
                          }
                          onChange={
                            updateConsultantField
                          }
                        >
                          <option value="">
                            Select school or university
                          </option>

                          {educationInstitutions.map(
                            (institution) => {
                              const name =
                                institution.name ||
                                institution.institutionName;

                              return (
                                <option
                                  key={
                                    institution.id ||
                                    name
                                  }
                                  value={name}
                                >
                                  {name}
                                </option>
                              );
                            }
                          )}
                        </select>

                        <button
                          type="button"
                          onClick={() =>
                            setShowInstitutionForm(
                              (open) => !open
                            )
                          }
                          title="Add school or university"
                          aria-label="Add school or university"
                        >
                          <Plus size={17} />
                        </button>
                      </div>
                    </div>

                    {showInstitutionForm && (
                      <div className="reception-add-institution reception-form-full">
                        <div>
                          <GraduationCap size={17} />

                          <input
                            value={newInstitutionName}
                            onChange={(event) =>
                              setNewInstitutionName(
                                event.target.value
                              )
                            }
                            placeholder="Enter school or university name"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={
                            addEducationInstitution
                          }
                        >
                          Add Institution
                        </button>
                      </div>
                    )}

                    <label>
                      <span>Email</span>

                      <input
                        type="email"
                        name="email"
                        value={consultantForm.email}
                        onChange={
                          updateConsultantField
                        }
                        placeholder="Enter email address"
                      />
                    </label>

                    <label>
  <span>Source</span>

  <select
    name="source"
    value={consultantForm.source}
    onChange={updateConsultantField}
  >
    <option value="">Select source employee</option>

    {employeeOptions.map((employee) => {
      const employeeName = getEmployeeName(employee);

      return (
        <option
          key={`consultant-source-${
            employee.id ||
            employee.employeeId ||
            employee.email
          }`}
          value={employeeName}
        >
          {employeeName}
        </option>
      );
    })}
  </select>
</label>

                    <label>
                      <span>Assign To</span>

                      <select
                        name="assignedEmployeeId"
                        value={
                          consultantForm.assignedEmployeeId
                        }
                        onChange={
                          updateConsultantField
                        }
                      >
                        <option value="">
                          Select employee
                        </option>

                        {employeeOptions.map(
                          (employee) => (
                            <option
                              key={
                                employee.id ||
                                employee.employeeId ||
                                employee.email
                              }
                              value={
                                employee.id ||
                                employee.employeeId
                              }
                            >
                              {getEmployeeName(
                                employee
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      <span>Date</span>

                      <input
                        type="date"
                        name="date"
                        value={consultantForm.date}
                        onChange={
                          updateConsultantField
                        }
                      />
                    </label>

                    <label className="reception-form-full">
                      <span>Purpose</span>

                      <textarea
                        name="purpose"
                        value={
                          consultantForm.purpose
                        }
                        onChange={
                          updateConsultantField
                        }
                        placeholder="Enter customer purpose"
                        rows="4"
                      />
                    </label>
                  </div>
                )}

                {registrationType === "travel" && (
                  <div className="reception-form-grid">
                    <label>
                      <span>
                        Full Name In Passport
                      </span>

                      <input
                        name="fullName"
                        value={travelForm.fullName}
                        onChange={updateTravelField}
                        placeholder="Enter full name in passport"
                        autoFocus
                      />
                    </label>

                    <label>
                      <span>Phone Number</span>

                      <input
                        name="phone"
                        value={travelForm.phone}
                        onChange={updateTravelField}
                        placeholder="Enter phone number"
                      />
                    </label>

                    <label>
  <span>Source</span>

  <select
    name="source"
    value={travelForm.source}
    onChange={updateTravelField}
  >
    <option value="">Select source employee</option>

    {employeeOptions.map((employee) => {
      const employeeName = getEmployeeName(employee);

      return (
        <option
          key={`travel-source-${
            employee.id ||
            employee.employeeId ||
            employee.email
          }`}
          value={employeeName}
        >
          {employeeName}
        </option>
      );
    })}
  </select>
</label>

                    <label>
                      <span>Assign To</span>

                      <select
                        name="assignedEmployeeId"
                        value={
                          travelForm.assignedEmployeeId
                        }
                        onChange={updateTravelField}
                      >
                        <option value="">
                          Select employee
                        </option>

                        {employeeOptions.map(
                          (employee) => (
                            <option
                              key={
                                employee.id ||
                                employee.employeeId ||
                                employee.email
                              }
                              value={
                                employee.id ||
                                employee.employeeId
                              }
                            >
                              {getEmployeeName(
                                employee
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      <span>Date</span>

                      <input
                        type="date"
                        name="date"
                        value={travelForm.date}
                        onChange={updateTravelField}
                      />
                    </label>

                    <label className="reception-form-full">
                      <span>Purpose</span>

                      <textarea
                        name="purpose"
                        value={travelForm.purpose}
                        onChange={updateTravelField}
                        placeholder="Enter customer purpose"
                        rows="4"
                      />
                    </label>
                  </div>
                )}

                {registrationType ===
                  "technology" && (
                  <div className="reception-form-grid">
                    <label>
                      <span>Full Name</span>

                      <input
                        name="fullName"
                        value={
                          technologyForm.fullName
                        }
                        onChange={
                          updateTechnologyField
                        }
                        placeholder="Enter full name"
                        autoFocus
                      />
                    </label>

                    <label>
                      <span>Company Name</span>

                      <input
                        name="companyName"
                        value={
                          technologyForm.companyName
                        }
                        onChange={
                          updateTechnologyField
                        }
                        placeholder="Enter company name"
                      />
                    </label>

                    <label>
                      <span>Contact Number</span>

                      <input
                        name="contactNumber"
                        value={
                          technologyForm.contactNumber
                        }
                        onChange={
                          updateTechnologyField
                        }
                        placeholder="Enter contact number"
                      />
                    </label>

                    <label>
                      <span>Purpose</span>

                      <select
                        name="technologyPurpose"
                        value={
                          technologyForm.technologyPurpose
                        }
                        onChange={
                          updateTechnologyField
                        }
                      >
                        {technologyPurposes.map(
                          (purpose) => (
                            <option
                              key={purpose}
                              value={purpose}
                            >
                              {purpose}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
  <span>Source</span>

  <select
    name="source"
    value={technologyForm.source}
    onChange={updateTechnologyField}
  >
    <option value="">Select source employee</option>

    {employeeOptions.map((employee) => {
      const employeeName = getEmployeeName(employee);

      return (
        <option
          key={`technology-source-${
            employee.id ||
            employee.employeeId ||
            employee.email
          }`}
          value={employeeName}
        >
          {employeeName}
        </option>
      );
    })}
  </select>
</label>
                    <label>
                      <span>Assign To</span>

                      <select
                        name="assignedEmployeeId"
                        value={
                          technologyForm.assignedEmployeeId
                        }
                        onChange={
                          updateTechnologyField
                        }
                      >
                        <option value="">
                          Select employee
                        </option>

                        {employeeOptions.map(
                          (employee) => (
                            <option
                              key={
                                employee.id ||
                                employee.employeeId ||
                                employee.email
                              }
                              value={
                                employee.id ||
                                employee.employeeId
                              }
                            >
                              {getEmployeeName(
                                employee
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label>
                      <span>Date</span>

                      <input
                        type="date"
                        name="date"
                        value={technologyForm.date}
                        onChange={
                          updateTechnologyField
                        }
                      />
                    </label>

                    <label className="reception-form-full">
                      <span>Note</span>

                      <textarea
                        name="note"
                        value={technologyForm.note}
                        onChange={
                          updateTechnologyField
                        }
                        placeholder="Write additional notes"
                        rows="4"
                      />
                    </label>
                  </div>
                )}

                {registrationType === "media" && (
                  <div className="reception-form-grid">
                    <label>
                      <span>Person Name</span>

                      <input
                        name="personName"
                        value={mediaForm.personName}
                        onChange={updateMediaField}
                        placeholder="Enter person name"
                        autoFocus
                      />
                    </label>

                    <label>
                      <span>Brand Name</span>

                      <input
                        name="brandName"
                        value={mediaForm.brandName}
                        onChange={updateMediaField}
                        placeholder="Enter brand name"
                      />
                    </label>

                    <label>
                      <span>Purpose</span>

                      <select
                        name="purpose"
                        value={mediaForm.purpose}
                        onChange={updateMediaField}
                      >
                        <option value="Video">
                          Video
                        </option>

                        <option value="Post">
                          Post
                        </option>
                      </select>
                    </label>

                    <label>
  <span>Source</span>

  <select
    name="source"
    value={mediaForm.source}
    onChange={updateMediaField}
  >
    <option value="">Select source employee</option>

    {employeeOptions.map((employee) => {
      const employeeName = getEmployeeName(employee);

      return (
        <option
          key={`media-source-${
            employee.id ||
            employee.employeeId ||
            employee.email
          }`}
          value={employeeName}
        >
          {employeeName}
        </option>
      );
    })}
  </select>
</label>

                    <label>
                      <span>Date</span>

                      <input
                        type="date"
                        name="date"
                        value={mediaForm.date}
                        onChange={updateMediaField}
                      />
                    </label>

                    <label className="reception-form-full">
                      <span>About</span>

                      <textarea
                        name="about"
                        value={mediaForm.about}
                        onChange={updateMediaField}
                        placeholder="Write information about the media product"
                        rows="4"
                      />
                    </label>

                    <label className="reception-form-full">
                      <span>Note</span>

                      <textarea
                        name="note"
                        value={mediaForm.note}
                        onChange={updateMediaField}
                        placeholder="Write additional notes"
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
                  Cancel
                </button>

                <button type="submit">
                  <Plus size={15} />

                  {registrationType === "media"
                    ? "Save Media Product"
                    : "Register Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}