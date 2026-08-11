import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BriefcaseBusiness, Check, ChevronDown, FileBadge, FileUp, ImagePlus, Mail, Pencil, Phone, Plus, Trash2, UserRoundCog, X } from "lucide-react";
import { notify } from "../utils/notify";
import { useJsonCollection } from "../hooks/useJsonCollection";
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
  salaryType: "fixed",
  fixedSalary: "",
  salaryPercentage: "",
  status: "",
  notes: "",
};

const defaultDepartments = ["Consultant", "Travel", "Technology", "Media"];
const defaultRoles = [
  "Full Admin",
  "Manager",
  "Project Manager",
  "Finance Manager",
  "HR Officer",
  "Supervisor",
  "Accountant",
  "Employee",
  "Reception",
  "Call Center",
];
const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

function Employees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useJsonCollection("employees");
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
  const departmentFieldRef = useRef(null);
  const roleFieldRef = useRef(null);

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

    window.addEventListener("isp-language-changed", syncInterfaceLanguage);
    window.addEventListener("storage", syncInterfaceLanguage);

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

  const translateValue = (value) => {
    const labels = {
      Consultant: tx("Consultant", "مشاوره", "مشوره"),
      Travel: tx("Travel", "سفر", "سفر"),
      Technology: tx("Technology", "تکنالوژی", "ټکنالوژي"),
      Media: tx("Media", "رسانه", "رسنۍ"),
      "Full Admin": tx("Full Admin", "مدیر عمومی", "عمومي مدیر"),
      Manager: tx("Manager", "مدیر", "مدیر"),
      "Project Manager": tx("Project Manager", "مدیر پروژه", "د پروژې مدیر"),
      "Finance Manager": tx("Finance Manager", "مدیر مالی", "مالي مدیر"),
      "HR Officer": tx("HR Officer", "مسئول منابع بشری", "د بشري سرچینو مسئول"),
      Supervisor: tx("Supervisor", "سرپرست", "څارونکی"),
      Accountant: tx("Accountant", "حسابدار", "محاسب"),
      Employee: tx("Employee", "کارمند", "کارکوونکی"),
      Reception: tx("Reception", "پذیرش", "استقبال"),
      "Call Center": tx("Call Center", "مرکز تماس", "د اړیکو مرکز"),
      Active: tx("Active", "فعال", "فعال"),
      "On Leave": tx("On Leave", "در رخصتی", "په رخصتۍ"),
      Inactive: tx("Inactive", "غیرفعال", "غیرفعال"),
      Unspecified: tx("Unspecified", "مشخص‌نشده", "نامعلوم"),
    };

    return labels[value] || value;
  };

  useEffect(() => {
    if (!showForm) return undefined;

    const handleOutsideClick = (event) => {
      if (
        departmentOpen &&
        departmentFieldRef.current &&
        !departmentFieldRef.current.contains(event.target)
      ) {
        setDepartmentOpen(false);
      }

      if (
        roleOpen &&
        roleFieldRef.current &&
        !roleFieldRef.current.contains(event.target)
      ) {
        setRoleOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showForm, departmentOpen, roleOpen]);

  const saveEmployees = async (records) => {
    const saved = await setEmployees(records);

    if (!saved) {
      notify(tx("Employee data could not be saved to PostgreSQL.", "معلومات کارمند در PostgreSQL ذخیره نشد.", "د کارکوونکي معلومات په PostgreSQL کې خوندي نه شول."), "error");
    }

    return saved;
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

    setForm((current) => {
      if (name === "salaryType") {
        return {
          ...current,
          salaryType: value,
          fixedSalary: value === "fixed" ? current.fixedSalary : "",
          salaryPercentage: value === "percentage" ? current.salaryPercentage : "",
        };
      }

      return { ...current, [name]: value };
    });
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
      form.departments.join(" "), form.roles.join(" "), form.salaryType,
      form.fixedSalary, form.salaryPercentage, form.status, form.notes,
    ].some((value) => String(value || "").trim());

    if (!hasValue) {
      notify(tx("Please complete at least one field.", "لطفاً حداقل یک فیلد را خانه‌پری کنید.", "مهرباني وکړئ لږ تر لږه یو فیلډ ډک کړئ."), "error");
      return;
    }

    if (form.salaryType === "fixed") {
      const salary = Number(form.fixedSalary);

      if (!form.fixedSalary || !Number.isFinite(salary) || salary <= 0) {
        notify(tx("Please enter a valid fixed salary.", "لطفاً معاش ثابت معتبر وارد کنید.", "مهرباني وکړئ معتبر ثابت معاش ولیکئ."), "error");
        return;
      }
    }

    if (form.salaryType === "percentage") {
      const percentage = Number(form.salaryPercentage);

      if (
        !form.salaryPercentage ||
        !Number.isFinite(percentage) ||
        percentage <= 0 ||
        percentage > 100
      ) {
        notify(tx("Salary percentage must be between 1 and 100.", "فیصدی معاش باید بین ۱ تا ۱۰۰ باشد.", "د معاش سلنه باید د ۱ او ۱۰۰ ترمنځ وي."), "error");
        return;
      }
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
    notify(editId ? tx("Employee updated successfully.", "معلومات کارمند با موفقیت ویرایش شد.", "د کارکوونکي معلومات په بریالیتوب سره سم شول.") : tx("Employee registered successfully.", "کارمند با موفقیت ثبت شد.", "کارکوونکی په بریالیتوب سره ثبت شو."), "success");
  };

  const deleteEmployee = () => {
    if (!deleteTarget) return;
    saveEmployees(employees.filter((employee) => employee.id !== deleteTarget.id)).then((saved) => {
      if (saved) {
        setDeleteTarget(null);
        notify(tx("Employee record deleted.", "کارمند با موفقیت حذف شد.", "د کارکوونکي ریکارډ حذف شو."), "success");
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
    <div className={`employees-page ${interfaceLanguage !== "en" ? "employees-page-rtl" : ""}`}>
      <div className="employees-heading">
        <div>
          <span>{tx("Human Resources", "منابع بشری", "بشري سرچینې")}</span>
          <h1>{tx("Employee Management", "مدیریت کارمندان", "د کارکوونکو مدیریت")}</h1>
          <p>{tx("Register employees and manage their contracts and access roles.", "کارمندان، قراردادها و سطح دسترسی آنان را مدیریت کنید.", "کارکوونکي، قراردادونه او د لاسرسي دندې مدیریت کړئ.")}</p>
        </div>
        <button type="button" onClick={openCreate}>
          <Plus size={17} /> {tx("Add Employee", "افزودن کارمند", "کارکوونکی زیات کړئ")}
        </button>
      </div>

      <section className="employee-stats">
        <div><UserRoundCog /><span>{tx("Total Employees", "مجموع کارمندان", "ټول کارکوونکي")}</span><strong>{employees.length}</strong><small>{tx("All registered employees", "تمام کارمندان ثبت‌شده", "ټول ثبت شوي کارکوونکي")}</small></div>
        <div><BriefcaseBusiness /><span>{tx("Active Employees", "کارمندان فعال", "فعال کارکوونکي")}</span><strong>{activeEmployees}</strong><small>{tx("Currently active team members", "اعضای فعال فعلی تیم", "اوسني فعال ټیم غړي")}</small></div>
        <div><FileBadge /><span>{tx("Contracts Ending", "قراردادهای رو به پایان", "پای ته رسېدونکي قراردادونه")}</span><strong>{contractsEnding}</strong><small>{tx("Ending within 30 days", "پایان‌یابنده در ۳۰ روز آینده", "په راتلونکو ۳۰ ورځو کې پای ته رسېږي")}</small></div>
      </section>

      <section className="employee-list-card">
        <div className="employee-list-header">
          <div><h2>{tx("Employee List", "فهرست کارمندان", "د کارکوونکو لېست")}</h2><p>{tx("Registered staff and contract information", "معلومات کارمندان و قراردادهای ثبت‌شده", "د ثبت شوو کارکوونکو او قرارداد معلومات")}</p></div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tx("Search employees...", "جستجوی کارمندان...", "کارکوونکي ولټوئ...")} />
        </div>

        <div className="employee-table-wrap">
          <table>
            <thead><tr><th>{tx("Employee", "کارمند", "کارکوونکی")}</th><th>{tx("Contact", "اطلاعات تماس", "اړیکه")}</th><th>{tx("NIC Number", "شماره تذکره", "د تذکرې شمېره")}</th><th>{tx("Role", "وظیفه", "دنده")}</th><th>{tx("Contract", "قرارداد", "قرارداد")}</th><th>{tx("Status", "وضعیت", "حالت")}</th><th>{tx("Action", "عملیات", "عمل")}</th></tr></thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr
  key={employee.id}
  className="employee-clickable-row"
  tabIndex={0}
  role="link"
  onClick={() =>
    navigate(`/employees/${employee.id}`)
  }
  onKeyDown={(event) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      navigate(
        `/employees/${employee.id}`
      );
    }
  }}
>
                  <td>
  <div className="employee-person">
    {employee.image ? (
      <img
        src={employee.image}
        alt={employee.fullName || "Employee"}
      />
    ) : (
      <span>
        {String(
          employee.fullName || "E"
        )
          .slice(0, 1)
          .toUpperCase()}
      </span>
    )}

    <div>
      <strong>
        {employee.fullName ||
          tx("Unnamed Employee", "کارمند بدون نام", "بې نومه کارکوونکی")}
      </strong>

      <small>
        {employee.email || tx("No email", "بدون ایمیل", "برېښنالیک نشته")}
      </small>
    </div>
  </div>
</td>
                  <td><div className="employee-contact"><span><Phone size={13} />{employee.phone}</span><span><Mail size={13} />{employee.email || "-"}</span></div></td>
                  <td>{employee.nicNumber}</td>
                  <td><div className="employee-role-wrap"><span className="employee-role">{employee.roles?.length ? employee.roles.map(translateValue).join(", ") : translateValue(employee.role || "No role")}</span>{employee.departments?.length > 0 && <small>{employee.departments.map(translateValue).join(", ")}</small>}</div></td>
                  <td>
                    <div className="employee-contract-range">
                      <span>{employee.startDate || "-"}</span>
                      <small>{tx("to", "تا", "تر")}</small>
                      <span>{employee.endDate || "-"}</span>
                    </div>
                  </td>
                  <td><span className={`employee-status ${String(employee.status || "unspecified").toLowerCase().replace(" ", "-")}`}>{translateValue(employee.status || "Unspecified")}</span></td>
                  <td>
                    <div className="employee-row-actions">
                      <button
  className="employee-edit"
  type="button"
  onClick={(event) => {
    event.stopPropagation();
    openEdit(employee);
  }}
  title={tx("Edit", "ویرایش", "سمول")}
  aria-label={tx("Edit employee", "ویرایش کارمند", "کارکوونکی سمول")}
>
  <Pencil size={15} />
</button>
                      <button
  className="employee-delete"
  type="button"
  onClick={(event) => {
    event.stopPropagation();
    setDeleteTarget(employee);
  }}
  title={tx("Delete", "حذف", "حذف")}
  aria-label={tx("Delete employee", "حذف کارمند", "کارکوونکی حذف کول")}
>
  <Trash2 size={15} />
</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredEmployees.length && <tr><td colSpan="7" className="employee-empty">{tx("No employees have been registered yet.", "هنوز هیچ کارمندی ثبت نشده است.", "تر اوسه کوم کارکوونکی نه دی ثبت شوی.")}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <div className="employee-modal-backdrop" onMouseDown={closeForm}>
          <div className="employee-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="employee-modal-header">
              <div><h2>{editId ? tx("Edit Employee", "ویرایش کارمند", "کارکوونکی سمول") : tx("Register Employee", "ثبت کارمند", "کارکوونکی ثبت کړئ")}</h2><p>{tx("Complete the employee and contract information.", "معلومات کارمند و قرارداد را تکمیل کنید.", "د کارکوونکي او قرارداد معلومات بشپړ کړئ.")}</p></div>
              <button type="button" onClick={closeForm}><X size={19} /></button>
            </div>
            <form onSubmit={saveEmployee}>
              <div className="employee-form-grid">
                <label><span>{tx("Full Name", "نام کامل", "بشپړ نوم")}</span><input name="fullName" value={form.fullName} onChange={updateField} placeholder={tx("Enter full name", "نام کامل را وارد کنید", "بشپړ نوم ولیکئ")} /></label>
                <label><span>{tx("Phone Number", "شماره تماس", "د تلیفون شمېره")}</span><input name="phone" value={form.phone} onChange={updateField} inputMode="numeric" onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, ""); }} placeholder={tx("Enter phone number", "شماره تماس را وارد کنید", "د تلیفون شمېره ولیکئ")} /></label>
                <label><span>{tx("Email", "ایمیل", "برېښنالیک")}</span><input type="email" name="email" value={form.email} onChange={updateField} placeholder={tx("Enter email", "ایمیل را وارد کنید", "برېښنالیک ولیکئ")} /></label>
                <label><span>{tx("NIC Number", "شماره تذکره", "د تذکرې شمېره")}</span><input name="nicNumber" value={form.nicNumber} onChange={updateField} placeholder={tx("Enter NIC number", "شماره تذکره را وارد کنید", "د تذکرې شمېره ولیکئ")} /></label>
                <div className="employee-upload-field"><span>{tx("Profile Image", "تصویر پروفایل", "د پروفایل انځور")}</span><input id="employee-image-upload" className="employee-file-input" type="file" accept="image/*" onChange={(event) => handleFile(event, "image")} /><label htmlFor="employee-image-upload" className={`employee-upload-card ${form.image ? "has-file" : ""}`}>{form.image ? <img src={form.image} alt={tx("Employee preview", "پیش‌نمایش کارمند", "د کارکوونکي مخکتنه")} /> : <ImagePlus size={24} />}<span><strong>{form.image ? tx("Image selected", "تصویر انتخاب شد", "انځور وټاکل شو") : tx("Upload profile image", "بارگذاری تصویر پروفایل", "د پروفایل انځور پورته کړئ")}</strong><small>PNG, JPG or WEBP</small></span></label></div>
                <div className="employee-upload-field"><span>{tx("Tazkira File / Image", "فایل یا تصویر تذکره", "د تذکرې فایل یا انځور")}</span><input id="employee-tazkira-upload" className="employee-file-input" type="file" accept="image/*,.pdf" onChange={(event) => handleFile(event, "tazkiraFile")} /><label htmlFor="employee-tazkira-upload" className={`employee-upload-card ${form.tazkiraFile ? "has-file" : ""}`}><FileUp size={24} /><span><strong>{form.tazkiraFileName || tx("Upload Tazkira document", "بارگذاری سند تذکره", "د تذکرې سند پورته کړئ")}</strong><small>Image or PDF file</small></span></label></div>
                <label><span>{tx("Contract Start Date", "تاریخ شروع قرارداد", "د قرارداد پیل")}</span><input type="date" name="startDate" value={form.startDate} onChange={updateField} /></label>
                <label><span>{tx("Contract End Date", "تاریخ ختم قرارداد", "د قرارداد پای")}</span><input type="date" name="endDate" value={form.endDate} onChange={updateField} min={form.startDate} /></label>
                <div className="employee-upload-field employee-contract-upload"><span>{tx("Contract File / Image", "فایل یا تصویر قرارداد", "د قرارداد فایل یا انځور")}</span><input id="employee-contract-upload" className="employee-file-input" type="file" accept="image/*,.pdf" onChange={(event) => handleFile(event, "contractFile")} /><label htmlFor="employee-contract-upload" className={`employee-upload-card ${form.contractFile ? "has-file" : ""}`}><FileBadge size={24} /><span><strong>{form.contractFileName || tx("Upload contract document", "بارگذاری سند قرارداد", "د قرارداد سند پورته کړئ")}</strong><small>Contract image or PDF</small></span></label></div>
                <div className="employee-department-field" ref={departmentFieldRef}>
                  <span>{tx("Department", "دیپارتمنت", "څانګه")}</span>
                  <button
                    type="button"
                    className={`employee-department-trigger ${departmentOpen ? "is-open" : ""}`}
                    onClick={() => {
                      setDepartmentOpen((open) => !open);
                      setRoleOpen(false);
                    }}
                    aria-expanded={departmentOpen}
                  >
                    <span>{form.departments.length ? `${form.departments.length} ${tx("selected", "انتخاب‌شده", "ټاکل شوي")}` : tx("Select departments", "دیپارتمنت‌ها را انتخاب کنید", "څانګې وټاکئ")}</span>
                    <ChevronDown size={15} />
                  </button>
                  {form.departments.length > 0 && <div className="employee-department-chips">{form.departments.map((department) => <button type="button" key={department} onClick={() => toggleDepartment(department)}>{translateValue(department)}<X size={11} /></button>)}</div>}
                  {departmentOpen && <div className="employee-department-menu">
                    <div className="employee-department-options">{departments.map((department) => <button type="button" key={department} className={form.departments.includes(department) ? "active" : ""} onClick={() => toggleDepartment(department)}><span>{translateValue(department)}</span>{form.departments.includes(department) && <Check size={14} />}</button>)}</div>
                    <div className="employee-department-add"><input value={newDepartment} onChange={(event) => setNewDepartment(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addDepartment(); } }} placeholder={tx("New department...", "دیپارتمنت جدید...", "نوې څانګه...")} /><button type="button" onClick={addDepartment}><Plus size={14} /></button></div>
                  </div>}
                </div>
                <div className="employee-department-field employee-role-field" ref={roleFieldRef}>
                  <span>{tx("Role", "وظیفه", "دنده")}</span>
                  <button
                    type="button"
                    className={`employee-department-trigger ${roleOpen ? "is-open" : ""}`}
                    onClick={() => {
                      setRoleOpen((open) => !open);
                      setDepartmentOpen(false);
                    }}
                    aria-expanded={roleOpen}
                  >
                    <span>{form.roles.length ? `${form.roles.length} ${tx("selected", "انتخاب‌شده", "ټاکل شوي")}` : tx("Select roles", "وظیفه‌ها را انتخاب کنید", "دندې وټاکئ")}</span>
                    <ChevronDown size={15} />
                  </button>
                  {form.roles.length > 0 && <div className="employee-department-chips employee-role-chips">{form.roles.map((role) => <button type="button" key={role} onClick={() => toggleRole(role)}>{translateValue(role)}<X size={11} /></button>)}</div>}
                  {roleOpen && <div className="employee-department-menu"><div className="employee-department-options">{roles.map((role) => <button type="button" key={role} className={form.roles.includes(role) ? "active" : ""} onClick={() => toggleRole(role)}><span>{translateValue(role)}</span>{form.roles.includes(role) && <Check size={14} />}</button>)}</div><div className="employee-department-add"><input value={newRole} onChange={(event) => setNewRole(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addRole(); } }} placeholder={tx("New role...", "وظیفه جدید...", "نوې دنده...")} /><button type="button" onClick={addRole}><Plus size={14} /></button></div></div>}
                </div>
                <label className="employee-salary-field">
                  <span>{tx("Salary Type", "نوع معاش", "د معاش ډول")}</span>
                  <select
                    className="employee-salary-select"
                    name="salaryType"
                    value={form.salaryType}
                    onChange={updateField}
                  >
                    <option value="fixed">{tx("Fixed Salary", "معاش ثابت", "ثابت معاش")}</option>
                    <option value="percentage">{tx("Percentage Salary", "معاش فیصدی", "سلنه‌يي معاش")}</option>
                  </select>
                </label>

                {form.salaryType === "fixed" ? (
                  <label>
                    <span>{tx("Fixed Salary Amount", "مقدار معاش ثابت", "د ثابت معاش اندازه")}</span>
                    <input
                      type="number"
                      name="fixedSalary"
                      min="0"
                      step="0.01"
                      value={form.fixedSalary}
                      onChange={updateField}
                      placeholder={tx("Enter salary amount", "مقدار معاش را وارد کنید", "د معاش اندازه ولیکئ")}
                    />
                  </label>
                ) : (
                  <label>
                    <span>{tx("Salary Percentage", "فیصدی معاش", "د معاش سلنه")}</span>
                    <input
                      type="number"
                      name="salaryPercentage"
                      min="1"
                      max="100"
                      step="0.01"
                      value={form.salaryPercentage}
                      onChange={updateField}
                      placeholder={tx("Enter percentage", "فیصدی را وارد کنید", "سلنه ولیکئ")}
                    />
                  </label>
                )}

                <label><span>{tx("Status", "وضعیت", "حالت")}</span><select name="status" value={form.status} onChange={updateField}><option value="">{tx("Select status", "وضعیت را انتخاب کنید", "حالت وټاکئ")}</option><option value="Active">{tx("Active", "فعال", "فعال")}</option><option value="On Leave">{tx("On Leave", "در رخصتی", "په رخصتۍ")}</option><option value="Inactive">{tx("Inactive", "غیرفعال", "غیرفعال")}</option></select></label>
                <label className="employee-form-full"><span>{tx("Notes", "یادداشت", "یادښت")}</span><textarea name="notes" value={form.notes} onChange={updateField} rows="4" placeholder={tx("Write notes...", "یادداشت بنویسید...", "یادښت ولیکئ...")} /></label>
              </div>
              <div className="employee-modal-actions">
                <button type="button" onClick={closeForm}>{tx("Cancel", "لغو", "لغوه")}</button>
                <button type="submit">{editId ? tx("Save Changes", "ذخیره تغییرات", "بدلونونه وساتئ") : tx("Register Employee", "ثبت کارمند", "کارکوونکی ثبت کړئ")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="employee-modal-backdrop" onMouseDown={() => setDeleteTarget(null)}>
          <div className="employee-delete-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="employee-delete-icon"><AlertTriangle size={28} /></div>
            <span>{tx("Delete employee", "حذف کارمند", "کارکوونکی حذف کول")}</span>
            <h2>{tx("Delete this employee?", "این کارمند حذف شود؟", "دا کارکوونکی حذف شي؟")}</h2>
            <p>
              {tx("You are about to permanently delete", "شما در حال حذف دایمی", "تاسو د تل لپاره حذف کوئ")}
              <strong>{deleteTarget.fullName || tx("this employee", "این کارمند", "دا کارکوونکی")}</strong>.
              {tx("This action cannot be undone.", "این عمل قابل بازگشت نیست.", "دا عمل بېرته نه شي راګرځېدلی.")}
            </p>
            <div className="employee-delete-actions">
              <button type="button" onClick={() => setDeleteTarget(null)}>{tx("Cancel", "لغو", "لغوه")}</button>
              <button type="button" onClick={deleteEmployee}><Trash2 size={15} /> {tx("Delete Employee", "حذف کارمند", "کارکوونکی حذف کړئ")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;