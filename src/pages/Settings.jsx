import { useEffect, useState } from "react";
import axios from "axios";
import { Database, Download, Image, Save, Trash2, Upload } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { apiUrl } from "../utils/api";
import { notify } from "../utils/notify";
import "./Settings.css";

const defaultSystemName = "ISP Smart";
const defaultSystemSubtitle = "Asset & Inventory Management";

function Settings() {
  const [settings, setSettings] = useJsonCollection("settings");
  const current = settings[0] || {};

  const [activeTab, setActiveTab] = useState("identity");
  const [companyName, setCompanyName] = useState(defaultSystemName);
  const [systemSubtitle, setSystemSubtitle] = useState(defaultSystemSubtitle);
  const [logo, setLogo] = useState("");
  const [appDataBusy, setAppDataBusy] = useState(false);
  const [clearConfirm, setClearConfirm] = useState("");

  useEffect(() => {
    setCompanyName(current.companyName || defaultSystemName);
    setSystemSubtitle(current.systemSubtitle || defaultSystemSubtitle);
    setLogo(current.logo || "");
  }, [
    current.companyName,
    current.systemSubtitle,
    current.logo,
  ]);

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      notify("Please select an image file for the logo.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const save = async (event) => {
    event.preventDefault();

    const nextSettings = [
      {
        ...current,
        companyName: companyName.trim() || defaultSystemName,
        systemSubtitle: systemSubtitle.trim() || defaultSystemSubtitle,
        logo,
        updatedAt: new Date().toISOString(),
      },
    ];

    const saved = await setSettings(nextSettings);
    if (!saved) return;

    window.dispatchEvent(new Event("company-settings-updated"));
    notify("System settings saved successfully.");
  };

  const loadCollectionNames = async () => {
    const response = await axios.get(apiUrl("collections"));
    return Array.isArray(response.data) ? response.data : [];
  };

  const exportData = async () => {
    try {
      setAppDataBusy(true);
      const collections = await loadCollectionNames();
      const entries = await Promise.all(
        collections.map(async (name) => {
          const response = await axios.get(apiUrl(name));
          return [name, Array.isArray(response.data) ? response.data : []];
        })
      );
      const payload = {
        app: "ISP Smart",
        exportedAt: new Date().toISOString(),
        collections: Object.fromEntries(entries),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `isp-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      notify("App data exported successfully.");
    } catch (error) {
      console.error("Unable to export app data:", error);
      notify("Unable to export app data.", "error");
    } finally {
      setAppDataBusy(false);
    }
  };

  const importData = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setAppDataBusy(true);
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed.collections && typeof parsed.collections === "object"
        ? parsed.collections
        : parsed;
      const collections = await loadCollectionNames();
      const importable = collections.filter((name) => Array.isArray(data[name]));

      if (!importable.length) {
        notify("This file does not contain valid app data.", "error");
        return;
      }

      const ok = window.confirm(
        `Import will replace ${importable.length} data table(s). Continue?`
      );
      if (!ok) return;

      await Promise.all(
        importable.map((name) => axios.put(apiUrl(name), data[name]))
      );
      notify("App data imported successfully. Refresh the app to see all changes.");
    } catch (error) {
      console.error("Unable to import app data:", error);
      notify("Unable to import app data. Please select a valid JSON file.", "error");
    } finally {
      setAppDataBusy(false);
    }
  };

  const clearData = async () => {
    if (clearConfirm.trim().toUpperCase() !== "CLEAR") {
      notify("Type CLEAR to confirm data clearing.", "error");
      return;
    }

    const ok = window.confirm(
      "This will clear all saved app data, including settings. This cannot be undone. Continue?"
    );
    if (!ok) return;

    try {
      setAppDataBusy(true);
      const collections = await loadCollectionNames();
      await Promise.all(collections.map((name) => axios.put(apiUrl(name), [])));
      setClearConfirm("");
      notify("App data cleared successfully. Refresh the app to start clean.");
    } catch (error) {
      console.error("Unable to clear app data:", error);
      notify("Unable to clear app data.", "error");
    } finally {
      setAppDataBusy(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Choose the system name, logo, and global values used across the app.</p>
      </div>

      <div className="settings-tabs">
        <button
          type="button"
          className={activeTab === "identity" ? "active" : ""}
          onClick={() => setActiveTab("identity")}
        >
          System Identity
        </button>
        <button
          type="button"
          className={activeTab === "app-data" ? "active" : ""}
          onClick={() => setActiveTab("app-data")}
        >
          App Data
        </button>
      </div>

      {activeTab === "identity" && (
        <form className="settings-card" onSubmit={save}>
          <div className="settings-preview tab-visible">
            <div className="settings-logo">
              {logo ? (
                <img src={logo} alt="System logo preview" />
              ) : (
                <span>{(companyName || defaultSystemName).slice(0, 1)}</span>
              )}
            </div>

            <div>
              <h2>{companyName || defaultSystemName}</h2>
              <p>{systemSubtitle || defaultSystemSubtitle}</p>
            </div>
          </div>

          <div className="settings-form">
            <section className="settings-panel">
              <div className="settings-section-title">
                <h3>System Identity</h3>
                <p>This logo and name are used in the sidebar, login page, receipts, and reports.</p>
              </div>

              <label>
                System Name
                <input
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder={defaultSystemName}
                />
              </label>

              <label>
                System Subtitle
                <input
                  value={systemSubtitle}
                  onChange={(event) => setSystemSubtitle(event.target.value)}
                  placeholder={defaultSystemSubtitle}
                />
              </label>

              <label>
                Logo
                <span className="settings-file-control">
                  <Image size={16} />
                  <input type="file" accept="image/*" onChange={handleLogoChange} />
                </span>
              </label>

              {logo && (
                <button
                  type="button"
                  className="settings-remove"
                  onClick={() => setLogo("")}
                >
                  <Trash2 size={15} />
                  Remove Logo
                </button>
              )}
            </section>

            <button type="submit" className="settings-save">
              <Save size={16} />
              Save Settings
            </button>
          </div>
        </form>
      )}

      {activeTab === "app-data" && (
        <div className="settings-data-card">
          <section className="settings-panel">
            <div className="settings-section-title">
              <h3>App Data</h3>
              <p>Export a backup, import a backup, or clear all saved app data.</p>
            </div>

            <div className="settings-data-actions">
              <button type="button" onClick={exportData} disabled={appDataBusy}>
                <Download size={16} />
                Export Data
              </button>

              <label className={appDataBusy ? "disabled" : ""}>
                <Upload size={16} />
                Import Data
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={importData}
                  disabled={appDataBusy}
                />
              </label>
            </div>

            <div className="settings-clear-zone">
              <div>
                <Database size={18} />
                <strong>Clear Data</strong>
                <span>Type CLEAR, then press Clear Data.</span>
              </div>

              <input
                value={clearConfirm}
                onChange={(event) => setClearConfirm(event.target.value)}
                placeholder="CLEAR"
                disabled={appDataBusy}
              />

              <button type="button" onClick={clearData} disabled={appDataBusy}>
                <Trash2 size={16} />
                Clear Data
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Settings;
