import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AlertTriangle, BriefcaseBusiness, Check, ChevronDown, FileBadge, FileUp, ImagePlus, Mail, Pencil, Phone, Plus, Trash2, UserRoundCog, X } from "lucide-react";
import { notify } from "../utils/notify";
import { apiUrl } from "../utils/api";
import { useNavigate } from "react-router-dom";
import "./Employees.css";

const emptyEmployee = {
  fullName: "",
  phone: "",
  email: "",
  image: "",
  nicNumber: "",
  tazkiraFile: "",
  tazkiraFileName: "",
  startDate: "",
  endDate: "",
  contractFile: "",
  contractFileName: "",
  departments: [],
  roles: [],
  status: "",
  notes: "",
};

const defaultDepartments = ["Consultant", "Travel", "Technology", "Media"];
const defaultRoles = ["Full Admin", "Manager", "Project Manager", "Finance Manager", "HR Officer", "Supervisor", "Accountant", "Employee"];

const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const employeeStorageKey = "isp-employees-fallback";

function readLocalEmployees() {
  try {
    const records = JSON.parse(localStorage.getItem(employeeStorageKey) || "[]");
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployeesState] = useState(readLocalEmployees);
  const [storageMode, setStorageMode] = useState("local");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyEmployee);
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [departments, setDepartments] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("isp-employee-departments") || "[]");
      return [...new Set([...defaultDepartments, ...(Array.isArray(saved) ? saved : [])])];
    } catch {
      return defaultDepartments;
    }
  });
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState("");
  const [roles, setRoles] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("isp-employee-roles") || "[]");
      return [...new Set([...defaultRoles, ...(Array.isArray(saved) ? saved : [])])];
    } catch {
      return defaultRoles;
    }
  });
  const [roleOpen, setRoleOpen] = useState(false);
  const [newRole, setNewRole] = useState("");

  useEffect(() => {
    let active = true;
    axios.get(apiUrl("employees"))
      .then((response) => {
        if (!active) return;
        const records = Array.isArray(response.data) ? response.data : [];
        setEmployeesState(records);
        localStorage.setItem(employeeStorageKey, JSON.stringify(records));
        setStorageMode("server");
      })
      .catch(() => {
        if (!active) return;
        setEmployeesState(readLocalEmployees());
        setStorageMode("local");
      });
    return () => { active = false; };
  }, []);

  const saveEmployees = async (records) => {
    if (storageMode === "server") {
      try {
        const response = await axios.put(apiUrl("employees"), records);
        const saved = Array.isArray(response.data) ? response.data : records;
        setEmployeesState(saved);
        localStorage.setItem(employeeStorageKey, JSON.stringify(saved));
        return true;
      } catch {
        setStorageMode("local");
      }
    }

    try {
      localStorage.setItem(employeeStorageKey, JSON.stringify(records));
      setEmployeesState(records);
      return true;
    } catch {
      notify("The selected files are too large. Please choose smaller files.", "error");
      return false;
    }
  };

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((employee) =>
      [employee.fullName, employee.phone, employee.email, employee.nicNumber, employee.role, employee.roles?.join(" "), employee.departments?.join(" ")]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [employees, search]);

  const activeEmployees = employees.filter((employee) => employee.status === "Active").length;
  const contractsEnding = employees.filter((employee) => {
    if (!employee.endDate) return false;
    const remaining = new Date(employee.endDate).getTime() - Date.now();
    return remaining >= 0 && remaining <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFile = async (event, field) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const value = await readFile(file);
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "tazkiraFile" ? { tazkiraFileName: file.name } : {}),
      ...(field === "contractFile" ? { contractFileName: file.name } : {}),
    }));
  };

  const saveEmployee = async (event) => {
    event.preventDefault();
    const hasValue = [
      form.fullName, form.phone, form.email, form.image, form.nicNumber,
      form.tazkiraFile, form.startDate, form.endDate, form.contractFile,
      form.departments.join(" "), form.roles.join(" "), form.status, form.notes,
    ].some((value) => String(value || "").trim());

    if (!hasValue) {
      notify("Please complete at least one field.", "error");
      return;
    }

    const nextEmployees = editId
      ? employees.map((employee) => employee.id === editId
        ? { ...employee, ...form, updatedAt: new Date().toISOString() }
        : employee)
      : [...employees, {
          ...form,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }];
    const saved = await saveEmployees(nextEmployees);
    if (!saved) return;
    setForm(emptyEmployee);
    setShowForm(false);
    setEditId(null);
    notify(editId ? "Employee updated successfully." : "Employee registered successfully.", "success");
  };

  const deleteEmployee = () => {
    if (!deleteTarget) return;
    saveEmployees(employees.filter((employee) => employee.id !== deleteTarget.id)).then((saved) => {
      if (saved) {
        setDeleteTarget(null);
        notify("Employee record deleted.", "success");
      }
    });
  };

  const openCreate = () => {
    setForm(emptyEmployee);
    setEditId(null);
    setDepartmentOpen(false);
    setRoleOpen(false);
    setShowForm(true);
  };

  const openEdit = (employee) => {
    setForm({
      ...emptyEmployee,
      ...employee,
      departments: Array.isArray(employee.departments) ? employee.departments : [],
      roles: Array.isArray(employee.roles)
        ? employee.roles
        : employee.role ? [employee.role] : [],
    });
    setEditId(employee.id);
    setDepartmentOpen(false);
    setRoleOpen(false);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(emptyEmployee);
    setDepartmentOpen(false);
    setRoleOpen(false);
  };

  const toggleDepartment = (department) => {
    setForm((current) => ({
      ...current,
      departments: current.departments.includes(department)
        ? current.departments.filter((item) => item !== department)
        : [...current.departments, department],
    }));
  };

  const addDepartment = () => {
    const department = newDepartment.trim();
    if (!department) return;
    const nextDepartments = departments.some((item) => item.toLowerCase() === department.toLowerCase())
      ? departments
      : [...departments, department];
    setDepartments(nextDepartments);
    localStorage.setItem("isp-employee-departments", JSON.stringify(nextDepartments));
    setForm((current) => ({
      ...current,
      departments: current.departments.includes(department)
        ? current.departments
        : [...current.departments, department],
    }));
    setNewDepartment("");
  };

  const toggleRole = (role) => {
    setForm((current) => ({
      ...current,
      roles: current.roles.includes(role)
        ? current.roles.filter((item) => item !== role)
        : [...current.roles, role],
    }));
  };

  const addRole = () => {
    const role = newRole.trim();
    if (!role) return;
    const nextRoles = roles.some((item) => item.toLowerCase() === role.toLowerCase()) ? roles : [...roles, role];
    setRoles(nextRoles);
    localStorage.setItem("isp-employee-roles", JSON.stringify(nextRoles));
    setForm((current) => ({ ...current, roles: current.roles.includes(role) ? current.roles : [...current.roles, role] }));
    setNewRole("");
  };

  return (
    <div className="employees-page">
      <div className="employees-heading">
        <div>
          <span>Human Resources</span>
          <h1>Employee Management</h1>
          <p>Register employees and manage their contracts and access roles.</p>
        </div>
        <button type="button" onClick={openCreate}>
          <Plus size={17} /> Add Employee
        </button>
      </div>

      <section className="employee-stats">
        <div><UserRoundCog /><span>Total Employees</span><strong>{employees.length}</strong><small>All registered employees</small></div>
        <div><BriefcaseBusiness /><span>Active Employees</span><strong>{activeEmployees}</strong><small>Currently active team members</small></div>
        <div><FileBadge /><span>Contracts Ending</span><strong>{contractsEnding}</strong><small>Ending within 30 days</small></div>
      </section>

      <section className="employee-list-card">
        <div className="employee-list-header">
          <div><h2>Employee List</h2><p>Registered staff and contract information</p></div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employees..." />
        </div>

        <div className="employee-table-wrap">
          <table>
            <thead><tr><th>Employee</th><th>Contact</th><th>NIC Number</th><th>Role</th><th>Contract</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td><button type="button" className="employee-person employee-person-link" onClick={() => navigate(`/employees/${employee.id}`)}>{employee.image ? <img src={employee.image} alt="" /> : <span>{String(employee.fullName || "E").slice(0, 1).toUpperCase()}</span>}<div><strong>{employee.fullName || "Unnamed Employee"}</strong><small>{employee.email || "No email"}</small></div></button></td>
                  <td><div className="employee-contact"><span><Phone size={13} />{employee.phone}</span><span><Mail size={13} />{employee.email || "-"}</span></div></td>
                  <td>{employee.nicNumber}</td>
                  <td><div className="employee-role-wrap"><span className="employee-role">{employee.roles?.length ? employee.roles.join(", ") : employee.role || "No role"}</span>{employee.departments?.length > 0 && <small>{employee.departments.join(", ")}</small>}</div></td>
                  <td>
                    <div className="employee-contract-range">
                      <span>{employee.startDate || "-"}</span>
                      <small>to</small>
                      <span>{employee.endDate || "-"}</span>
                    </div>
                  </td>
                  <td><span className={`employee-status ${String(employee.status || "unspecified").toLowerCase().replace(" ", "-")}`}>{employee.status || "Unspecified"}</span></td>
                  <td>
                    <div className="employee-row-actions">
                      <button className="employee-edit" type="button" onClick={() => openEdit(employee)} title="Edit">
                        <Pencil size={15} />
                      </button>
                      <button className="employee-delete" type="button" onClick={() => setDeleteTarget(employee)} title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredEmployees.length && <tr><td colSpan="7" className="employee-empty">No employees have been registered yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <div className="employee-modal-backdrop" onMouseDown={closeForm}>
          <div className="employee-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="employee-modal-header">
              <div><h2>{editId ? "Edit Employee" : "Register Employee"}</h2><p>Complete the employee and contract information.</p></div>
              <button type="button" onClick={closeForm}><X size={19} /></button>
            </div>
            <form onSubmit={saveEmployee}>
              <div className="employee-form-grid">
                <label><span>Full Name</span><input name="fullName" value={form.fullName} onChange={updateField} /></label>
                <label><span>Phone Number</span><input name="phone" value={form.phone} onChange={updateField} /></label>
                <label><span>Email</span><input type="email" name="email" value={form.email} onChange={updateField} /></label>
                <label><span>NIC Number</span><input name="nicNumber" value={form.nicNumber} onChange={updateField} /></label>
                <div className="employee-upload-field"><span>Profile Image</span><input id="employee-image-upload" className="employee-file-input" type="file" accept="image/*" onChange={(event) => handleFile(event, "image")} /><label htmlFor="employee-image-upload" className={`employee-upload-card ${form.image ? "has-file" : ""}`}>{form.image ? <img src={form.image} alt="Employee preview" /> : <ImagePlus size={24} />}<span><strong>{form.image ? "Image selected" : "Upload profile image"}</strong><small>PNG, JPG or WEBP</small></span></label></div>
                <div className="employee-upload-field"><span>Tazkira File / Image</span><input id="employee-tazkira-upload" className="employee-file-input" type="file" accept="image/*,.pdf" onChange={(event) => handleFile(event, "tazkiraFile")} /><label htmlFor="employee-tazkira-upload" className={`employee-upload-card ${form.tazkiraFile ? "has-file" : ""}`}><FileUp size={24} /><span><strong>{form.tazkiraFileName || "Upload Tazkira document"}</strong><small>Image or PDF file</small></span></label></div>
                <label><span>Contract Start Date</span><input type="date" name="startDate" value={form.startDate} onChange={updateField} /></label>
                <label><span>Contract End Date</span><input type="date" name="endDate" value={form.endDate} onChange={updateField} min={form.startDate} /></label>
                <div className="employee-upload-field employee-contract-upload"><span>Contract File / Image</span><input id="employee-contract-upload" className="employee-file-input" type="file" accept="image/*,.pdf" onChange={(event) => handleFile(event, "contractFile")} /><label htmlFor="employee-contract-upload" className={`employee-upload-card ${form.contractFile ? "has-file" : ""}`}><FileBadge size={24} /><span><strong>{form.contractFileName || "Upload contract document"}</strong><small>Contract image or PDF</small></span></label></div>
                <div className="employee-department-field">
                  <span>Department</span>
                  <button type="button" className="employee-department-trigger" onClick={() => setDepartmentOpen((open) => !open)}>
                    <span>{form.departments.length ? `${form.departments.length} selected` : "Select departments"}</span><ChevronDown size={15} />
                  </button>
                  {form.departments.length > 0 && <div className="employee-department-chips">{form.departments.map((department) => <button type="button" key={department} onClick={() => toggleDepartment(department)}>{department}<X size={11} /></button>)}</div>}
                  {departmentOpen && <div className="employee-department-menu">
                    <div className="employee-department-options">{departments.map((department) => <button type="button" key={department} className={form.departments.includes(department) ? "active" : ""} onClick={() => toggleDepartment(department)}><span>{department}</span>{form.departments.includes(department) && <Check size={14} />}</button>)}</div>
                    <div className="employee-department-add"><input value={newDepartment} onChange={(event) => setNewDepartment(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addDepartment(); } }} placeholder="New department..." /><button type="button" onClick={addDepartment}><Plus size={14} /></button></div>
                  </div>}
                </div>
                <div className="employee-department-field employee-role-field">
                  <span>Role</span>
                  <button type="button" className="employee-department-trigger" onClick={() => setRoleOpen((open) => !open)}><span>{form.roles.length ? `${form.roles.length} selected` : "Select roles"}</span><ChevronDown size={15} /></button>
                  {form.roles.length > 0 && <div className="employee-department-chips employee-role-chips">{form.roles.map((role) => <button type="button" key={role} onClick={() => toggleRole(role)}>{role}<X size={11} /></button>)}</div>}
                  {roleOpen && <div className="employee-department-menu"><div className="employee-department-options">{roles.map((role) => <button type="button" key={role} className={form.roles.includes(role) ? "active" : ""} onClick={() => toggleRole(role)}><span>{role}</span>{form.roles.includes(role) && <Check size={14} />}</button>)}</div><div className="employee-department-add"><input value={newRole} onChange={(event) => setNewRole(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addRole(); } }} placeholder="New role..." /><button type="button" onClick={addRole}><Plus size={14} /></button></div></div>}
                </div>
                <label><span>Status</span><select name="status" value={form.status} onChange={updateField}><option value="">Select status</option><option>Active</option><option>On Leave</option><option>Inactive</option></select></label>
                <label className="employee-form-full"><span>Notes</span><textarea name="notes" value={form.notes} onChange={updateField} rows="4" /></label>
              </div>
              <div className="employee-modal-actions">
                <button type="button" onClick={closeForm}>Cancel</button>
                <button type="submit">{editId ? "Save Changes" : "Register Employee"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="employee-modal-backdrop" onMouseDown={() => setDeleteTarget(null)}>
          <div className="employee-delete-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="employee-delete-icon"><AlertTriangle size={28} /></div>
            <span>Delete employee</span>
            <h2>Delete this employee?</h2>
            <p>
              You are about to permanently delete
              <strong>{deleteTarget.fullName || "this employee"}</strong>.
              This action cannot be undone.
            </p>
            <div className="employee-delete-actions">
              <button type="button" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" onClick={deleteEmployee}><Trash2 size={15} /> Delete Employee</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;
