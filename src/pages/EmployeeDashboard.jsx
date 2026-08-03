import { useEffect, useMemo, useState } from "react";
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
import { createRecordId } from "../utils/ids";
import { notify } from "../utils/notify";
import "./EmployeeDashboard.css";

const provinces = ["Badakhshan", "Badghis", "Baghlan", "Balkh", "Bamyan", "Daykundi", "Farah", "Faryab", "Ghazni", "Ghor", "Helmand", "Herat", "Jowzjan", "Kabul", "Kandahar", "Kapisa", "Khost", "Kunar", "Kunduz", "Laghman", "Logar", "Nangarhar", "Nimroz", "Nuristan", "Paktia", "Paktika", "Panjshir", "Parwan", "Samangan", "Sar-e Pol", "Takhar", "Uruzgan", "Wardak", "Zabul"];
const baseForm = {
  fullName: "",
  phone: "",
  city: "",
  language: "Dari",
  callType: "Incoming",
  purpose: "",
  needFollowup: "No",
  businessType: "",
  companyName: "",
  technologyPurpose: "",
  note: "",
};


const normalizeDepartment = (value) => { const text = String(value || "Consultant").toLowerCase(); return text.includes("tech") ? "technology" : text.includes("travel") ? "travel" : "consultant"; };

export default function EmployeeDashboard({ currentUser }) {
  const mode = normalizeDepartment(currentUser.department);
  const currentEmployeeId =
  currentUser.employeeId ||
  currentUser.id ||
  "";

const currentEmployeeName =
  currentUser.fullName ||
  currentUser.username ||
  currentUser.email ||
  "Employee";
  const [serverCustomers, setServerCustomers, , customersLoaded] = useJsonCollection("customers");
  const [localCustomers] = useLocalCollection("employeeCustomers");
  const [legacyCustomers] = useLocalCollection(`${mode}Customers`);
  const [transactions] = useJsonCollection("transactions");
  const [adjustments] = useLocalCollection("employeeAdjustments");
  const [form, setForm] = useState(baseForm);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (!customersLoaded) return;
    const localRecords = [...localCustomers, ...legacyCustomers].map((item) => ({ ...item, customerType: item.customerType || mode, specializedCustomer: true }));
    const missing = localRecords.filter((item) => !serverCustomers.some((saved) => String(saved.id) === String(item.id)));
    if (missing.length) setServerCustomers([...serverCustomers, ...missing]);
  }, [customersLoaded, legacyCustomers, localCustomers, mode, serverCustomers, setServerCustomers]);
  const customers = useMemo(() => serverCustomers.filter((item) => item.specializedCustomer && item.customerType === mode), [serverCustomers, mode]);
  const mine = useMemo(
  () =>
    customers.filter(
      (customer) =>
        String(customer.sourceEmployeeId || "") ===
          String(currentEmployeeId) ||
        String(customer.createdByAccountId || "") ===
          String(currentUser.id || "")
    ),
  [
    customers,
    currentEmployeeId,
    currentUser.id,
  ]
);
  const filtered = mine.filter(c => filter === "all" || c.callType?.toLowerCase() === filter);
  const income = transactions.filter(t => String(t.employeeId) === String(currentUser.employeeId) && String(t.type || "").toLowerCase() === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
  const bonus = adjustments.filter(a => String(a.employeeId) === String(currentUser.employeeId)).reduce((s, a) => s + (a.type === "penalty" ? -1 : 1) * Number(a.amount || 0), 0);
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openCreateModal = () => {
  setEditId(null);

  setForm({
    ...baseForm,
    technologyPurpose:
      mode === "technology"
        ? "Database"
        : "",
  });

  setOpen(true);
};

const openEditModal = (customer) => {
  const ownsRecord =
    String(customer.sourceEmployeeId || "") ===
      String(currentEmployeeId) ||
    String(customer.createdByAccountId || "") ===
      String(currentUser.id || "");

  if (!ownsRecord) {
    notify(
      "You can only edit records registered by your account.",
      "error"
    );

    return;
  }

  setEditId(customer.id);

  setForm({
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

    companyName:
      customer.companyName || "",

    technologyPurpose:
      customer.technologyPurpose ||
      (mode === "technology"
        ? "Database"
        : ""),

    note:
      customer.note ||
      customer.notes ||
      "",
  });

  setOpen(true);
};

const closeCustomerModal = () => {
  setOpen(false);
  setEditId(null);

  setForm({
    ...baseForm,
    technologyPurpose:
      mode === "technology"
        ? "Database"
        : "",
  });
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

  const now = new Date().toISOString();

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

    purpose: form.purpose.trim(),

    note: form.note.trim(),
    notes: form.note.trim(),

    customerType: mode,
    specializedCustomer: true,

    /*
     * Source همیشه همان شخصی می‌ماند
     * که ریکارد را نخست ثبت کرده است.
     */
    sourceEmployeeId:
      existingRecord?.sourceEmployeeId ||
      currentEmployeeId,

    sourceEmployeeName:
      existingRecord?.sourceEmployeeName ||
      currentEmployeeName,

    source:
      existingRecord?.source ||
      currentEmployeeName,

    /*
     * هنگام Edit معلومات Assign تغییر نکند.
     */
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
      now.slice(0, 10),

    createdByAccountId:
      existingRecord?.createdByAccountId ||
      currentUser.id ||
      "",

    createdByName:
      existingRecord?.createdByName ||
      currentEmployeeName,

    createdAt:
      existingRecord?.createdAt ||
      now,

    updatedAt: now,
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
    String(customer.sourceEmployeeId || "") ===
      String(currentEmployeeId) ||
    String(customer.createdByAccountId || "") ===
      String(currentUser.id || "");

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
    const ownsRecord =
      String(
        deleteTarget.sourceEmployeeId || ""
      ) === String(currentEmployeeId) ||
      String(
        deleteTarget.createdByAccountId || ""
      ) === String(currentUser.id || "");

    if (!ownsRecord) {
      notify(
        "You can only delete records registered by your account.",
        "error"
      );

      setDeleteTarget(null);
      return;
    }

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
return <div className="employee-dashboard"><header><div><span>{mode} workspace</span><h1>Welcome, {currentUser.fullName}</h1><p>Your private dashboard and customer records.</p></div>
<button
  type="button"
  onClick={openCreateModal}
>
  <Plus size={17} /> Add {mode === "consultant" ? "Consultant" : mode === "travel" ? "Travel" : "Technology"} Customer</button></header>
    <section className="employee-dashboard-cards"><div><Users /><span>Total Customers</span><strong>{mine.length}</strong></div><div><WalletCards /><span>Total Income</span><strong>{income.toLocaleString()} AFN</strong></div><div><Gift /><span>Bonus and Penalty</span><strong>{bonus.toLocaleString()} AFN</strong></div></section>
    <section className="employee-dashboard-list"><div className="employee-dashboard-list-head"><div><h2>My Customers</h2><p>Every record is linked to your employee profile.</p></div><label><Filter size={15} /><select value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All calls</option><option value="incoming">Incoming</option><option value="outgoing">Outgoing</option></select></label></div>
    <div className="employee-dashboard-table">
  <table>
    <thead>
      <tr>
        <th>Full Name</th>
        <th>Phone</th>
        <th>City</th>
        <th>Call Type</th>
        <th>Purpose</th>
        <th>Follow-up</th>
        <th>Status</th>
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

          <td>
            {customer.callType || "-"}
          </td>

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

          <td>
            {customer.needFollowup || "-"}
          </td>

          <td>
            <span
              className={`employee-customer-status ${String(
                customer.assignmentStatus ||
                  "None"
              ).toLowerCase()}`}
            >
              {customer.assignmentStatus ||
                "None"}
            </span>
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
            colSpan="8"
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
    {open && <div
  className="employee-dashboard-modal"
  onMouseDown={closeCustomerModal}
><form onSubmit={save} onMouseDown={e => e.stopPropagation()}><header><div><h2>
  {editId
    ? "Edit Customer"
    : "Add Customer"}
</h2><p>
  {editId
    ? "Update the customer information."
    : `This record will also appear in the general ${mode} customer list.`}
</p>
</div><button
  type="button"
  onClick={closeCustomerModal}
>
  <X />
</button>
</header>
    <div className="employee-customer-grid">
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

  <label>
    City / Province
    <select
      name="city"
      value={form.city}
      onChange={update}
    >
      <option value="">Select province</option>

      {provinces.map((province) => (
        <option key={province} value={province}>
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

  {mode !== "technology" && (
    <label className="wide">
      Purpose
      <textarea
        name="purpose"
        value={form.purpose}
        onChange={update}
      />
    </label>
  )}

  {mode === "technology" && (
    <>
      <label>
        Business Type
        <input
          name="businessType"
          value={form.businessType}
          onChange={update}
        />
      </label>

      <label>
        Company Name
        <input
          name="companyName"
          value={form.companyName}
          onChange={update}
        />
      </label>

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
    </>
  )}

  <label className="followup-field wide">
    Need Follow-up

    <button
      type="button"
      role="switch"
      aria-checked={form.needFollowup === "Yes"}
      className={`followup-switch ${
        form.needFollowup === "Yes" ? "on" : "off"
      }`}
      onClick={() =>
        setForm({
          ...form,
          needFollowup:
            form.needFollowup === "Yes" ? "No" : "Yes",
        })
      }
    >
      <span />
      <b>{form.needFollowup === "Yes" ? "ON" : "OFF"}</b>
    </button>
  </label>

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
</div>
    <footer><button type="button" onClick={() => setOpen(false)}>Cancel</button><button
  type="submit"
  className="primary"
>
  {editId
    ? "Save Changes"
    : "Save Customer"}
</button></footer></form></div>}
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
        Are you sure you want to delete
        <strong>
          {" "}
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
  </div>;
}
