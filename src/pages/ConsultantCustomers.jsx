import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BriefcaseBusiness, ChevronDown, Eye, GraduationCap, Mail, Pencil, Phone, Plus, Search, Trash2, UserCheck, Users, X } from "lucide-react";
import axios from "axios";
import { apiUrl } from "../utils/api";
import { notify } from "../utils/notify";
import "./ConsultantCustomers.css";

const employeeKey = "isp-employees-fallback";

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
};

const readList = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

function EmployeePicker({ label, employees, value, selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const results = employees.filter((employee) =>
    [employee.fullName, employee.email, employee.phone, employee.role, employee.roles?.join(" ")]
      .some((field) => String(field || "").toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    const close = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="consultant-employee-picker" ref={ref}>
      <span>{label}</span>
      <button type="button" onClick={() => setOpen((current) => !current)}>
        <span>{value || "Select employee"}</span><ChevronDown size={15} />
      </button>
      {open && (
        <div className="consultant-picker-menu">
          <div><Search size={14} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employee..." /></div>
          <div className="consultant-picker-results">
            {results.map((employee) => (
              <button
                type="button"
                key={employee.id}
                className={String(selectedId) === String(employee.id) ? "selected" : ""}
                aria-selected={String(selectedId) === String(employee.id)}
                onClick={() => { onSelect(employee); setOpen(false); setQuery(""); }}
              >
                <b>{String(employee.fullName || "E").slice(0, 1).toUpperCase()}</b>
                <span><strong>{employee.fullName || "Unnamed Employee"}</strong><small>{employee.role || employee.email || employee.phone || "Employee"}</small></span>
                <i aria-hidden="true">✓</i>
              </button>
            ))}
            {!results.length && <p>No employee found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function ConsultantCustomers({ mode = "consultant" }) {
  const isTravel = mode === "travel";
  const customerKey = isTravel ? "isp-travel-customers" : "isp-consultant-customers";
  const typeLabel = isTravel ? "Travel Customer" : "Consultant Customer";
  const typeLabelPlural = isTravel ? "Travel Customers" : "Consultant Customers";
  const [customers, setCustomers] = useState(() => readList(customerKey));
  const [employees, setEmployees] = useState(() => readList(employeeKey));
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [deleteCustomer, setDeleteCustomer] = useState(null);

  useEffect(() => {
    axios.get(apiUrl("employees")).then((response) => {
      if (Array.isArray(response.data)) setEmployees(response.data);
    }).catch(() => setEmployees(readList(employeeKey)));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      [customer.passportFullName, customer.phone, customer.email, customer.institutionName, customer.sourceEmployeeName, customer.assignedEmployeeName, customer.purpose]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [customers, search]);

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "educationLevel" ? { institutionName: "" } : {}),
    }));
  };

  const save = (event) => {
    event.preventDefault();
    if (!Object.values(form).some((value) => String(value || "").trim())) {
      notify("Please complete at least one field.", "error");
      return;
    }
    const next = editId
      ? customers.map((customer) => customer.id === editId ? { ...customer, ...form, updatedAt: new Date().toISOString() } : customer)
      : [...customers, { ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString() }];
    localStorage.setItem(customerKey, JSON.stringify(next));
    setCustomers(next);
    setForm(emptyForm);
    setShowForm(false);
    setEditId(null);
    notify(editId ? "Consultant customer updated successfully." : "Consultant customer registered successfully.", "success");
  };

  const remove = () => {
    if (!deleteCustomer) return;
    const next = customers.filter((customer) => customer.id !== deleteCustomer.id);
    localStorage.setItem(customerKey, JSON.stringify(next));
    setCustomers(next);
    setDeleteCustomer(null);
    notify("Consultant customer deleted.", "success");
  };

  const openEdit = (customer) => {
    setForm({ ...emptyForm, ...customer });
    setEditId(customer.id);
    setShowForm(true);
  };

  return (
    <div className="consultant-page">
      <div className="consultant-heading">
        <div><span>Customer Services</span><h1>{typeLabelPlural}</h1><p>Register customers and assign them to responsible employees.</p></div>
        <button type="button" onClick={() => { setForm(emptyForm); setEditId(null); setShowForm(true); }}><Plus size={17} /> Add {typeLabel}</button>
      </div>

      <section className="consultant-stats">
        <div><Users /><span>Total {typeLabelPlural}</span><strong>{customers.length}</strong><small>All registered customers</small></div>
        <div>{isTravel ? <BriefcaseBusiness /> : <GraduationCap />}<span>{isTravel ? "With Source" : "University"}</span><strong>{isTravel ? customers.filter((item) => item.sourceEmployeeId).length : customers.filter((item) => item.educationLevel === "University").length}</strong><small>{isTravel ? "Customers received from employees" : "University education"}</small></div>
        <div><UserCheck /><span>Assigned</span><strong>{customers.filter((item) => item.assignedEmployeeId).length}</strong><small>Assigned to employees</small></div>
      </section>

      <section className="consultant-list-card">
        <div className="consultant-list-header"><div><h2>{typeLabel} List</h2><p>Registered customer records</p></div><div><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customers..." /></div></div>
        <div className="consultant-table-wrap"><table><thead><tr><th>Full Name</th><th>Contact</th>{!isTravel && <th>Education</th>}<th>Source</th><th>Assigned To</th><th>Purpose</th><th>Action</th></tr></thead>
          <tbody>{filtered.map((customer) => <tr key={customer.id}><td><strong>{customer.passportFullName || `Unnamed ${typeLabel}`}</strong></td><td><div className="consultant-contact"><span><Phone size={13} />{customer.phone || "-"}</span><span><Mail size={13} />{customer.email || "-"}</span></div></td>{!isTravel && <td>{customer.educationLevel || "-"}<small>{customer.institutionName || ""}</small></td>}<td>{customer.sourceEmployeeName || "-"}</td><td><span className="consultant-assigned">{customer.assignedEmployeeName || "Unassigned"}</span></td><td>{customer.purpose || "-"}</td><td><div className="consultant-row-actions"><button className="view" type="button" onClick={() => setViewCustomer(customer)} title="View details"><Eye size={14} /></button><button className="edit" type="button" onClick={() => openEdit(customer)} title="Edit"><Pencil size={14} /></button><button className="delete" type="button" onClick={() => setDeleteCustomer(customer)} title="Delete"><Trash2 size={14} /></button></div></td></tr>)}{!filtered.length && <tr><td colSpan={isTravel ? 6 : 7} className="consultant-empty">No customers registered yet.</td></tr>}</tbody>
        </table></div>
      </section>

      {showForm && <div className="consultant-modal-backdrop" onMouseDown={() => setShowForm(false)}><div className="consultant-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="consultant-modal-header"><div><h2>{editId ? `Edit ${typeLabel}` : `Register ${typeLabel}`}</h2><p>Complete the customer information and employee assignment.</p></div><button type="button" onClick={() => setShowForm(false)}><X size={19} /></button></div>
        <form onSubmit={save}><div className="consultant-form-grid">
          <label><span>Full Name in Passport</span><input name="passportFullName" value={form.passportFullName} onChange={update} /></label>
          <label><span>Phone Number</span><input name="phone" value={form.phone} onChange={update} /></label>
          <label><span>Email</span><input type="email" name="email" value={form.email} onChange={update} /></label>
          {!isTravel && <label><span>Education Level</span><select name="educationLevel" value={form.educationLevel} onChange={update}><option value="">Select education</option><option>School</option><option>University</option><option>Institute</option><option>Other</option></select></label>}
          {!isTravel && (form.educationLevel === "School" || form.educationLevel === "University") && <label className="consultant-institution"><span>{form.educationLevel === "School" ? "School Name" : "University Name"}</span><input name="institutionName" value={form.institutionName} onChange={update} placeholder={`Enter ${form.educationLevel.toLowerCase()} name`} /></label>}
          <EmployeePicker label="Source" employees={employees} value={form.sourceEmployeeName} selectedId={form.sourceEmployeeId} onSelect={(employee) => setForm((current) => ({ ...current, sourceEmployeeId: employee.id, sourceEmployeeName: employee.fullName }))} />
          <EmployeePicker label="Assign To" employees={employees} value={form.assignedEmployeeName} selectedId={form.assignedEmployeeId} onSelect={(employee) => setForm((current) => ({ ...current, assignedEmployeeId: employee.id, assignedEmployeeName: employee.fullName }))} />
          <label className="consultant-form-full"><span>Purpose</span><textarea name="purpose" value={form.purpose} onChange={update} rows="4" /></label>
        </div><div className="consultant-modal-actions"><button type="button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit">{editId ? "Save Changes" : `Register ${typeLabel}`}</button></div></form>
      </div></div>}

      {viewCustomer && <div className="consultant-modal-backdrop" onMouseDown={() => setViewCustomer(null)}><div className="consultant-detail-modal" onMouseDown={(event) => event.stopPropagation()}><div className="consultant-detail-hero"><div><b>{String(viewCustomer.passportFullName || "C").slice(0,1).toUpperCase()}</b><span><small>Consultant Customer</small><h2>{viewCustomer.passportFullName || "Unnamed Consultant"}</h2></span></div><button type="button" onClick={() => setViewCustomer(null)}><X size={18}/></button></div><div className="consultant-detail-grid">{[["Phone Number",viewCustomer.phone],["Email",viewCustomer.email],["Education Level",viewCustomer.educationLevel],["School / University",viewCustomer.institutionName],["Source",viewCustomer.sourceEmployeeName],["Assigned To",viewCustomer.assignedEmployeeName],["Purpose",viewCustomer.purpose],["Registered",viewCustomer.createdAt ? new Date(viewCustomer.createdAt).toLocaleDateString() : ""]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value || "-"}</strong></div>)}</div><div className="consultant-detail-actions"><button type="button" onClick={() => { setViewCustomer(null); openEdit(viewCustomer); }}><Pencil size={15}/> Edit Information</button></div></div></div>}

      {deleteCustomer && <div className="consultant-modal-backdrop" onMouseDown={() => setDeleteCustomer(null)}><div className="consultant-delete-modal" onMouseDown={(event) => event.stopPropagation()}><div className="consultant-delete-icon"><AlertTriangle size={26}/></div><h2>Delete Consultant?</h2><p>You are about to permanently delete <strong>{deleteCustomer.passportFullName || "this consultant"}</strong>. This action cannot be undone.</p><div><button type="button" onClick={() => setDeleteCustomer(null)}>Cancel</button><button type="button" onClick={remove}><Trash2 size={15}/> Delete Consultant</button></div></div></div>}
    </div>
  );
}

export default ConsultantCustomers;
