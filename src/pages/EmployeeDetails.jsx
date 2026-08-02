import { useMemo, useState } from "react";
import { ArrowLeft, Gift, KeyRound, Pencil, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { useLocalCollection } from "../hooks/useLocalCollection";
import { createRecordId } from "../utils/ids";
import { notify } from "../utils/notify";
import "./EmployeeDetails.css";

const accountDefaults = { username: "", email: "", password: "", confirmPassword: "" };
const adjustmentDefaults = { type: "bonus", amount: "", reason: "" };
const slug = (value) => String(value || "employee").trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "employee";

export default function EmployeeDetails({ accounts, setAccounts }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employees, , , loaded] = useJsonCollection("employees");
  const [adjustments, setAdjustments] = useLocalCollection("employeeAdjustments");
  const [accountOpen, setAccountOpen] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [accountForm, setAccountForm] = useState(accountDefaults);
  const [adjustmentForm, setAdjustmentForm] = useState(adjustmentDefaults);
  const employee = useMemo(() => employees.find((item) => String(item.id) === String(id)), [employees, id]);
  const employeeAccount = accounts.find((item) => String(item.employeeId) === String(id));
  const employeeAdjustments = adjustments.filter((item) => String(item.employeeId) === String(id));
  const totalBonus = employeeAdjustments.filter((item) => item.type === "bonus").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalPenalty = employeeAdjustments.filter((item) => item.type === "penalty").reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const openAccount = () => {
    const suggestedEmail = employeeAccount?.email || employee?.email || "";
    setAccountForm({ username: employeeAccount?.username || (suggestedEmail ? suggestedEmail.split("@")[0] : slug(employee?.fullName)), email: suggestedEmail, password: "", confirmPassword: "" });
    setAccountOpen(true);
  };

  const saveAccount = async (event) => {
    event.preventDefault();
    const username = accountForm.username.trim().toLowerCase();
    const email = accountForm.email.trim().toLowerCase();
    if (!username) return notify("Username is required.", "error");
    if (!employeeAccount && !accountForm.password) return notify("Password is required.", "error");
    if (accountForm.password !== accountForm.confirmPassword) return notify("Password confirmation does not match.", "error");
    if (accounts.some((item) => item.id !== employeeAccount?.id && (String(item.username || "").toLowerCase() === username || (email && String(item.email || "").toLowerCase() === email)))) return notify("Username or email is already in use.", "error");
    const department = employee.departments?.[0] || "Consultant";
    const record = { ...(employeeAccount || {}), id: employeeAccount?.id || createRecordId(), employeeId: employee.id, fullName: employee.fullName, username, email, role: "Employee", accountType: "employee", department, status: "Active", permissions: { dashboard: { view: true } }, createdAt: employeeAccount?.createdAt || new Date().toISOString(), ...(accountForm.password ? { password: accountForm.password } : {}) };
    const saved = await setAccounts(employeeAccount ? accounts.map((item) => item.id === employeeAccount.id ? record : item) : [...accounts, record]);
    if (saved) { notify(employeeAccount ? "Employee account updated." : "Employee account created.", "success"); setAccountOpen(false); }
  };

  const saveAdjustment = async (event) => {
    event.preventDefault();
    const amount = Number(adjustmentForm.amount);
    if (!(amount > 0)) return notify("Enter a valid amount.", "error");
    const saved = await setAdjustments([...adjustments, { id: createRecordId(), employeeId: employee.id, employeeName: employee.fullName, ...adjustmentForm, amount, createdAt: new Date().toISOString() }]);
    if (saved) { notify("Bonus / penalty saved.", "success"); setAdjustmentForm(adjustmentDefaults); setAdjustmentOpen(false); }
  };

  if (!loaded) return <div className="page-loading">Loading employee...</div>;
  if (!employee) return <div className="employee-profile-page"><button onClick={() => navigate("/employees")}>Back to Employees</button><h2>Employee not found.</h2></div>;

  const details = [["Phone", employee.phone], ["Email", employee.email], ["NIC Number", employee.nicNumber], ["Departments", employee.departments?.join(", ")], ["Roles", employee.roles?.join(", ") || employee.role], ["Status", employee.status], ["Contract Start", employee.startDate], ["Contract End", employee.endDate], ["Notes", employee.notes]];
  return <div className="employee-profile-page">
    <header className="employee-profile-header"><div><button className="employee-profile-back" onClick={() => navigate("/employees")}><ArrowLeft size={17}/> Employees</button><h1>Employee Profile</h1><p>Complete information, login account, bonus and penalty.</p></div><div className="employee-profile-actions"><button onClick={() => setAdjustmentOpen(true)}><Gift size={17}/> Bonus and Penalty</button><button className="primary" onClick={openAccount}>{employeeAccount ? <Pencil size={17}/> : <KeyRound size={17}/>} {employeeAccount ? "Edit Account" : "Create Account"}</button></div></header>
    <section className="employee-profile-hero"><div className="employee-profile-photo">{employee.image ? <img src={employee.image} alt={employee.fullName}/> : String(employee.fullName || "E").slice(0,1)}</div><div><span>{employee.status || "Unspecified"}</span><h2>{employee.fullName || "Unnamed Employee"}</h2><p>{employee.departments?.join(" • ") || "No department"}</p></div><aside><small>Bonus balance</small><strong>{(totalBonus-totalPenalty).toLocaleString("en-US")} AFN</strong><em>Bonus {totalBonus.toLocaleString()} · Penalty {totalPenalty.toLocaleString()}</em></aside></section>
    <section className="employee-profile-card"><h3>Employee Information</h3><div className="employee-detail-list">{details.map(([label,value]) => <div key={label}><span>{label}</span><strong>{value || "-"}</strong></div>)}</div></section>
    {employeeAccount && <section className="employee-profile-card"><h3>System Account</h3><div className="employee-detail-list"><div><span>Username</span><strong>{employeeAccount.username}</strong></div><div><span>Email</span><strong>{employeeAccount.email || "-"}</strong></div><div><span>Department dashboard</span><strong>{employeeAccount.department}</strong></div></div></section>}
    {accountOpen && <div className="employee-profile-modal" onMouseDown={() => setAccountOpen(false)}><form onSubmit={saveAccount} onMouseDown={(e) => e.stopPropagation()}><header><div><h2>{employeeAccount ? "Edit Account" : "Create Account"}</h2><p>Username and email are suggested automatically and remain editable.</p></div><button type="button" onClick={() => setAccountOpen(false)}><X/></button></header><label>Username<input value={accountForm.username} onChange={(e) => setAccountForm({...accountForm,username:e.target.value})}/></label><label>Email<input type="email" value={accountForm.email} onChange={(e) => setAccountForm({...accountForm,email:e.target.value})}/></label><label>{employeeAccount ? "New password (optional)" : "Password"}<input type="password" value={accountForm.password} onChange={(e) => setAccountForm({...accountForm,password:e.target.value})} placeholder="Enter any password"/></label><label>Confirm password<input type="password" value={accountForm.confirmPassword} onChange={(e) => setAccountForm({...accountForm,confirmPassword:e.target.value})}/></label><footer><button type="button" onClick={() => setAccountOpen(false)}>Cancel</button><button className="primary">Save Account</button></footer></form></div>}
    {adjustmentOpen && <div className="employee-profile-modal" onMouseDown={() => setAdjustmentOpen(false)}><form onSubmit={saveAdjustment} onMouseDown={(e) => e.stopPropagation()}><header><div><h2>Bonus and Penalty</h2><p>Add a financial adjustment for {employee.fullName}.</p></div><button type="button" onClick={() => setAdjustmentOpen(false)}><X/></button></header><label>Type<select value={adjustmentForm.type} onChange={(e) => setAdjustmentForm({...adjustmentForm,type:e.target.value})}><option value="bonus">Bonus</option><option value="penalty">Penalty</option></select></label><label>Amount (AFN)<input type="number" min="1" value={adjustmentForm.amount} onChange={(e) => setAdjustmentForm({...adjustmentForm,amount:e.target.value})}/></label><label>Reason<textarea rows="3" value={adjustmentForm.reason} onChange={(e) => setAdjustmentForm({...adjustmentForm,reason:e.target.value})}/></label><footer><button type="button" onClick={() => setAdjustmentOpen(false)}>Cancel</button><button className="primary">Save</button></footer></form></div>}
  </div>;
}
