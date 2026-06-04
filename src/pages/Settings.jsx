import { useEffect, useState } from "react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import "./Settings.css";

function Settings() {
  const [settings, setSettings] = useJsonCollection("settings");
  const current = settings[0] || {};
  const [companyName, setCompanyName] = useState("");
  const [logo, setLogo] = useState("");
  useEffect(() => {
    setCompanyName(current.companyName || "");
    setLogo(current.logo || "");
  }, [current.companyName, current.logo]);

  const selectLogo = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      notify("حجم لوگو باید کمتر از ۲ میگابایت باشد.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const save = async (event) => {
    event.preventDefault();
    const nextSettings = [{ companyName: companyName.trim() || "شرکت سیاحتی", logo }];
    await setSettings(nextSettings);
    window.dispatchEvent(new Event("company-settings-updated"));
    notify("نام و لوگوی شرکت ذخیره شد.");
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>تنظیمات سیستم</h1>
        <p>نام و لوگوی شرکت سیاحتی را برای نمایش در سیستم تنظیم کنید.</p>
      </div>
      <form className="settings-card" onSubmit={save}>
        <div className="settings-preview">
          <div className="settings-logo">
            {logo ? <img src={logo} alt="لوگوی شرکت" /> : <span>{(companyName || "T").slice(0, 1)}</span>}
          </div>
          <div>
            <h2>{companyName || "شرکت سیاحتی"}</h2>
            <p>سیستم مدیریت سفرها</p>
          </div>
        </div>
        <div className="settings-form">
          <label>
            نام شرکت سیاحتی
            <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="نام شرکت" required />
          </label>
          <label>
            لوگوی شرکت
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={selectLogo} />
          </label>
          {logo && <button type="button" className="settings-remove" onClick={() => setLogo("")}>حذف لوگو</button>}
          <button type="submit" className="settings-save">ذخیره تنظیمات</button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
