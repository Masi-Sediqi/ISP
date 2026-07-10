import { useState } from "react";
import { LockKeyhole, UserPlus } from "lucide-react";
import { notify } from "../utils/notify";
import { todayDateValue } from "../utils/afghanDate";
import "./Auth.css";

function Login({ accounts, setAccounts, onLogin, company }) {
  const firstAccount = accounts.length === 0;
  const [mode, setMode] = useState(firstAccount ? "create" : "login");
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });

  const submit = async (event) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();

    if (!email || !form.password) {
      return notify("لطفاً ایمیل و رمز عبور را وارد کنید.", "error");
    }

    if (mode === "login") {
      const account = accounts.find((item) =>
        (String(item.email || "").toLowerCase() === email || String(item.username || "").toLowerCase() === email) &&
        item.password === form.password
      );
      if (!account) return notify("ایمیل یا رمز عبور نادرست است.", "error");
      onLogin(account);
      return;
    }
    if (!form.fullName.trim()) return notify("لطفاً نام کامل را وارد کنید.", "error");
    if (form.password.length < 4) return notify("رمز عبور باید حداقل چهار حرف باشد.", "error");
    if (form.password !== form.confirmPassword) return notify("تکرار رمز عبور یکسان نیست.", "error");
    if (accounts.some((item) => String(item.email || "").toLowerCase() === email)) return notify("این ایمیل قبلاً استفاده شده است.", "error");
    const account = { id: Date.now(), fullName: form.fullName.trim(), email, password: form.password, role: "مدیر کامل", createdAt: todayDateValue() };
    const saved = await setAccounts([...accounts, account]);
    if (!saved) return;
    onLogin(account);
  };

  return (
    <div className="auth-page" dir="rtl">
      <div className="auth-brand-panel">
        <div className="auth-logo">{company.logo ? <img src={company.logo} alt="لوگو" /> : (company.companyName || "T").slice(0, 1)}</div>
        <h1>{company.companyName || "سیستم مدیریت سفر"}</h1>
        <p>مدیریت یک‌پارچه سفرها، مشتری‌ها، موترها و امور مالی</p>
      </div>
      <div className="auth-form-panel">
        <form className="auth-card" onSubmit={submit} noValidate>
          <div className="auth-card-icon">{mode === "login" ? <LockKeyhole /> : <UserPlus />}</div>
          <h2>{mode === "login" ? "ورود به سیستم" : "ساخت اکونت مدیر"}</h2>
          <p>{firstAccount ? "برای آغاز استفاده، اولین اکونت مدیر را بسازید." : mode === "login" ? "معلومات اکونت خود را وارد کنید." : "یک اکونت جدید با صلاحیت کامل بسازید."}</p>
          {mode === "create" && <label>نام کامل<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></label>}
          <label>ایمیل<input type={mode === "login" ? "text" : "email"} inputMode="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" required /></label>
          <label>رمز عبور<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
          {mode === "create" && <label>تکرار رمز عبور<input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required /></label>}
          <button type="submit">{mode === "login" ? "ورود" : "ساخت اکونت و ورود"}</button>
          {!firstAccount && <button type="button" className="auth-switch" onClick={() => setMode(mode === "login" ? "create" : "login")}>{mode === "login" ? "ساخت اکونت جدید" : "برگشت به ورود"}</button>}
        </form>
      </div>
    </div>
  );
}

export default Login;
