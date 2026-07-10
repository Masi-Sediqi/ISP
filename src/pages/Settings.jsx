import { useEffect, useState } from "react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import "./Settings.css";

function Settings() {
  const [settings, setSettings] = useJsonCollection("settings");
  const current = settings[0] || {};
  const [cargoPricePerKg, setCargoPricePerKg] = useState("");
  const [cargoThresholdKg, setCargoThresholdKg] = useState("");
  const [cargoDescription, setCargoDescription] = useState("");
  useEffect(() => {
    setCargoPricePerKg(current.cargoPricePerKg || "");
    setCargoThresholdKg(current.cargoThresholdKg || "");
    setCargoDescription(current.cargoDescription || "");
  }, [current.cargoPricePerKg, current.cargoThresholdKg, current.cargoDescription]);

  const save = async (event) => {
    event.preventDefault();
    const nextSettings = [{
      ...current,
      cargoPricePerKg: Number(cargoPricePerKg || 0),
      cargoThresholdKg: Number(cargoThresholdKg || 0),
      cargoDescription,
    }];
    await setSettings(nextSettings);
    window.dispatchEvent(new Event("company-settings-updated"));
    notify("تنظیمات سیستم ذخیره شد.");
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>تنظیمات سیستم</h1>
        <p>قیمت بار مشتریان را برای محاسبه خودکار در ثبت سفر تنظیم کنید.</p>
      </div>
      <form className="settings-card settings-card-single" onSubmit={save}>
        <div className="settings-form">
          <section className="settings-panel">
            <div className="settings-section-title">
              <h3>ثبت قیمت فی کیلو بار</h3>
              <p>اگر مقدار بار مشتری از حد تعیین‌شده بیشتر شود، قیمت فی کیلو در مجموع قیمت سفر اضافه می‌شود.</p>
            </div>
            <label>
              مقدار فی کیلو بار
              <input type="number" min="0" dir="ltr" value={cargoPricePerKg} onChange={(event) => setCargoPricePerKg(event.target.value)} placeholder="2" />
            </label>
            <label>
              از چه مقدار بیشتر شود
              <input type="number" min="0" dir="ltr" value={cargoThresholdKg} onChange={(event) => setCargoThresholdKg(event.target.value)} placeholder="20" />
            </label>
            <label>
              توضیحات
              <textarea value={cargoDescription} onChange={(event) => setCargoDescription(event.target.value)} placeholder="مثلاً از 20 کیلو بالا، هر کیلو 2 افغانی حساب شود." />
            </label>
          </section>
          <button type="submit" className="settings-save">ذخیره تنظیمات</button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
