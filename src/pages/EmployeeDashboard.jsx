import { useEffect, useMemo, useState } from "react";
import { Filter, Plus, Users, WalletCards, Gift, X } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { useLocalCollection } from "../hooks/useLocalCollection";
import { createRecordId } from "../utils/ids";
import { notify } from "../utils/notify";
import "./EmployeeDashboard.css";

const provinces = ["Badakhshan","Badghis","Baghlan","Balkh","Bamyan","Daykundi","Farah","Faryab","Ghazni","Ghor","Helmand","Herat","Jowzjan","Kabul","Kandahar","Kapisa","Khost","Kunar","Kunduz","Laghman","Logar","Nangarhar","Nimroz","Nuristan","Paktia","Paktika","Panjshir","Parwan","Samangan","Sar-e Pol","Takhar","Uruzgan","Wardak","Zabul"];
const baseForm = { fullName:"", phone:"", city:"", language:"Dari", callType:"Incoming", purpose:"", needFollowup:"No", businessType:"", companyName:"", technologyPurpose:"" };
const normalizeDepartment = (value) => { const text=String(value||"Consultant").toLowerCase(); return text.includes("tech")?"technology":text.includes("travel")?"travel":"consultant"; };

export default function EmployeeDashboard({ currentUser }) {
  const mode = normalizeDepartment(currentUser.department);
  const [serverCustomers,setServerCustomers, , customersLoaded] = useJsonCollection("customers");
  const [localCustomers] = useLocalCollection("employeeCustomers");
  const [legacyCustomers] = useLocalCollection(`${mode}Customers`);
  const [transactions] = useJsonCollection("transactions");
  const [adjustments] = useLocalCollection("employeeAdjustments");
  const [form,setForm] = useState(baseForm);
  const [open,setOpen] = useState(false);
  const [filter,setFilter] = useState("all");
  useEffect(() => {
    if (!customersLoaded) return;
    const localRecords = [...localCustomers, ...legacyCustomers].map((item) => ({ ...item, customerType: item.customerType || mode, specializedCustomer: true }));
    const missing = localRecords.filter((item) => !serverCustomers.some((saved) => String(saved.id) === String(item.id)));
    if (missing.length) setServerCustomers([...serverCustomers, ...missing]);
  }, [customersLoaded, legacyCustomers, localCustomers, mode, serverCustomers, setServerCustomers]);
  const customers = useMemo(() => serverCustomers.filter((item) => item.specializedCustomer && item.customerType === mode), [serverCustomers, mode]);
  const mine = useMemo(()=>customers.filter(c=>String(c.sourceEmployeeId)===String(currentUser.employeeId)),[customers,currentUser.employeeId]);
  const filtered = mine.filter(c=>filter==="all" || c.callType?.toLowerCase()===filter);
  const income = transactions.filter(t=>String(t.employeeId)===String(currentUser.employeeId) && String(t.type||"").toLowerCase()==="income").reduce((s,t)=>s+Number(t.amount||0),0);
  const bonus = adjustments.filter(a=>String(a.employeeId)===String(currentUser.employeeId)).reduce((s,a)=>s+(a.type==="penalty"?-1:1)*Number(a.amount||0),0);
  const update=(e)=>setForm({...form,[e.target.name]:e.target.value});
  const save=async(e)=>{e.preventDefault();if(!form.fullName.trim()||!form.phone.trim())return notify("Full name and phone number are required.","error");const record={...form,id:createRecordId(),customerType:mode,specializedCustomer:true,sourceEmployeeId:currentUser.employeeId,sourceEmployeeName:currentUser.fullName,createdByAccountId:currentUser.id,createdAt:new Date().toISOString()};const ok=await setServerCustomers([...serverCustomers,record]);if(ok){setForm(baseForm);setOpen(false);notify("Customer saved successfully.","success");}};
  return <div className="employee-dashboard"><header><div><span>{mode} workspace</span><h1>Welcome, {currentUser.fullName}</h1><p>Your private dashboard and customer records.</p></div><button onClick={()=>{setForm({...baseForm,technologyPurpose:mode==="technology"?"Database":""});setOpen(true);}}><Plus size={17}/> Add {mode==="consultant"?"Consultant":mode==="travel"?"Travel":"Technology"} Customer</button></header>
    <section className="employee-dashboard-cards"><div><Users/><span>Total Customers</span><strong>{mine.length}</strong></div><div><WalletCards/><span>Total Income</span><strong>{income.toLocaleString()} AFN</strong></div><div><Gift/><span>Bonus and Penalty</span><strong>{bonus.toLocaleString()} AFN</strong></div></section>
    <section className="employee-dashboard-list"><div className="employee-dashboard-list-head"><div><h2>My Customers</h2><p>Every record is linked to your employee profile.</p></div><label><Filter size={15}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All calls</option><option value="incoming">Incoming</option><option value="outgoing">Outgoing</option></select></label></div><div className="employee-dashboard-table"><table><thead><tr><th>Full Name</th><th>Phone</th><th>City</th><th>Call Type</th><th>Purpose</th><th>Follow-up</th></tr></thead><tbody>{filtered.map(c=><tr key={c.id}><td><strong>{c.fullName}</strong></td><td>{c.phone}</td><td>{c.city||"-"}</td><td>{c.callType||"-"}</td><td>{mode==="technology"?c.technologyPurpose||"-":c.purpose||"-"}</td><td>{c.needFollowup||"-"}</td></tr>)}{!filtered.length&&<tr><td colSpan="6">No customer records yet.</td></tr>}</tbody></table></div></section>
    {open&&<div className="employee-dashboard-modal" onMouseDown={()=>setOpen(false)}><form onSubmit={save} onMouseDown={e=>e.stopPropagation()}><header><div><h2>Add Customer</h2><p>This record will also appear in the general {mode} customer list.</p></div><button type="button" onClick={()=>setOpen(false)}><X/></button></header><div className="employee-customer-grid"><label>Full Name<input name="fullName" value={form.fullName} onChange={update}/></label><label>Phone Number<input name="phone" value={form.phone} onChange={update}/></label><label>City / Province<select name="city" value={form.city} onChange={update}><option value="">Select province</option>{provinces.map(p=><option key={p}>{p}</option>)}</select></label><label>Language<select name="language" value={form.language} onChange={update}><option>Dari</option><option>Pashto</option><option>English</option><option>Other</option></select></label><label>Call Type<select name="callType" value={form.callType} onChange={update}><option>Incoming</option><option>Outgoing</option></select></label><label className="followup-field">Need Follow-up<button type="button" role="switch" aria-checked={form.needFollowup==="Yes"} className={`followup-switch ${form.needFollowup==="Yes"?"on":"off"}`} onClick={()=>setForm({...form,needFollowup:form.needFollowup==="Yes"?"No":"Yes"})}><span/><b>{form.needFollowup==="Yes"?"ON":"OFF"}</b></button></label>{mode!=="technology"&&<label className="wide">Purpose<textarea name="purpose" value={form.purpose} onChange={update}/></label>}{mode==="technology"&&<><label>Business Type<input name="businessType" value={form.businessType} onChange={update}/></label><label>Company Name<input name="companyName" value={form.companyName} onChange={update}/></label><label>Purpose<select name="technologyPurpose" value={form.technologyPurpose} onChange={update}><option>Database</option><option>Web</option><option>Application</option></select></label></>}</div><footer><button type="button" onClick={()=>setOpen(false)}>Cancel</button><button className="primary">Save Customer</button></footer></form></div>}
  </div>;
}
