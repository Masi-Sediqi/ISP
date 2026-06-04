import { useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { notify } from "../utils/notify";
import "./Accounts.css";

const emptyForm = { fullName: "", email: "", password: "", confirmPassword: "" };

function Accounts({ accounts, setAccounts, currentUser }) {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");

  const openEdit = (account) => {
    setEditId(account.id);
    setForm({ fullName: account.fullName || "", email: account.email || "", password: "", confirmPassword: "" });
    setShowModal(true);
  };
  const close = () => { setShowModal(false); setEditId(null); setForm(emptyForm); };
  const save = (event) => {
    event.preventDefault();
    if (form.password && form.password.length < 4) return notify("رمز عبور باید حداقل چهار حرف باشد.", "error");
    if (form.password !== form.confirmPassword) return notify("تکرار رمز عبور یکسان نیست.", "error");
    const email = form.email.trim().toLowerCase();
    if (accounts.some((item) => item.id !== editId && String(item.email || "").toLowerCase() === email)) return notify("ایمیل تکراری است.", "error");
    if (editId) {
      setAccounts(accounts.map((item) => item.id === editId ? { ...item, fullName: form.fullName.trim(), email, ...(form.password ? { password: form.password } : {}) } : item));
      notify("اکونت ویرایش شد.");
    } else {
      setAccounts([...accounts, { id: Date.now(), fullName: form.fullName.trim(), email, password: form.password, role: "مدیر کامل", createdAt: new Date().toISOString().slice(0, 10) }]);
      notify("اکونت جدید ساخته شد.");
    }
    close();
  };
  const remove = (account) => {
    if (account.id === currentUser.id) return notify("اکونت فعال خود را نمی‌توانید حذف کنید.", "error");
    if (!window.confirm(`اکونت ${account.fullName || account.email || account.username} حذف شود؟`)) return;
    setAccounts(accounts.filter((item) => item.id !== account.id));
    notify("اکونت حذف شد.");
  };
  const filtered = accounts.filter((account) => (account.fullName || "").includes(search) || (account.email || account.username || "").includes(search));

  return <div className="accounts-page">
    <div className="accounts-header"><div><h1>مدیریت اکونت‌ها</h1><p>تمام اکونت‌ها فعلاً صلاحیت کامل سیستم را دارند.</p></div><button onClick={() => setShowModal(true)}><UserPlus size={17} /> ساخت اکونت</button></div>
    <div className="accounts-card">
      <div className="accounts-card-header"><div><h3>لیست اکونت‌ها</h3><p>{accounts.length} اکونت ثبت‌شده</p></div><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی اکونت..." /></div>
      <div className="accounts-grid">{filtered.map((account) => <article key={account.id} className="account-item"><div className="account-avatar">{(account.fullName || account.email || account.username).slice(0,1)}</div><div className="account-info"><h3>{account.fullName || account.email || account.username}</h3><p>{account.email || `اکونت قدیمی: ${account.username}`}</p><span>{account.role || "مدیر کامل"}</span></div><div className="account-actions"><button onClick={() => openEdit(account)}><Pencil size={15} /></button><button className="danger" onClick={() => remove(account)}><Trash2 size={15} /></button></div></article>)}</div>
    </div>
    {showModal && <div className="account-modal-backdrop" onClick={close}><div className="account-modal" onClick={(e) => e.stopPropagation()}><div className="account-modal-header"><div><h3>{editId ? "ویرایش اکونت" : "ساخت اکونت جدید"}</h3><p>این اکونت صلاحیت کامل خواهد داشت.</p></div><button onClick={close}>×</button></div><form onSubmit={save}><label>نام کامل<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></label><label>ایمیل<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" required /></label><label>{editId ? "رمز جدید (اختیاری)" : "رمز عبور"}<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editId} /></label><label>تکرار رمز<input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required={!editId || Boolean(form.password)} /></label><div><button type="button" onClick={close}>لغو</button><button type="submit">ذخیره اکونت</button></div></form></div></div>}
  </div>;
}

export default Accounts;
