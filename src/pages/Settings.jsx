import { useEffect, useState } from "react";
import axios from "axios";
import { Copy, Database, Download, Globe2, Image, Router, Save, Trash2, Upload, Wifi } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { apiUrl } from "../utils/api";
import { notify } from "../utils/notify";
import "./Settings.css";

const defaultSystemName = "Afghan Power";

const defaultSystemSubtitle =
  "Afghan Power Companies Group";


const BACKUP_SETTINGS_KEY = "isp-auto-backup-settings";

const defaultBackupSettings = {
  enabled: false,
  frequency: "daily",
  time: "18:00",
  weekDay: "1",
  monthDay: "1",
  customDays: "3",
  lastBackupAt: "",
};

function readBackupSettings() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(BACKUP_SETTINGS_KEY) || "{}"
    );

    return {
      ...defaultBackupSettings,
      ...parsed,
    };
  } catch {
    return defaultBackupSettings;
  }
}

function saveBackupSettings(settings) {
  localStorage.setItem(
    BACKUP_SETTINGS_KEY,
    JSON.stringify(settings)
  );
}

function getNextBackupDate(settings, from = new Date()) {
  const [hour, minute] = String(settings.time || "18:00")
    .split(":")
    .map(Number);

  const base = settings.lastBackupAt
    ? new Date(settings.lastBackupAt)
    : new Date(from);

  if (Number.isNaN(base.getTime())) {
    return new Date(from);
  }

  const next = new Date(base);

  if (settings.frequency === "daily") {
    next.setDate(next.getDate() + (settings.lastBackupAt ? 1 : 0));
    next.setHours(hour || 0, minute || 0, 0, 0);

    if (next <= from) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  if (settings.frequency === "weekly") {
    const targetDay = Number(settings.weekDay || 1);
    next.setHours(hour || 0, minute || 0, 0, 0);

    let diff = (targetDay - next.getDay() + 7) % 7;

    if (diff === 0 && next <= from) {
      diff = 7;
    }

    next.setDate(next.getDate() + diff);
    return next;
  }

  if (settings.frequency === "monthly") {
    const targetDate = Math.max(
      1,
      Math.min(28, Number(settings.monthDay || 1))
    );

    next.setDate(targetDate);
    next.setHours(hour || 0, minute || 0, 0, 0);

    if (next <= from) {
      next.setMonth(next.getMonth() + 1);
      next.setDate(targetDate);
    }

    return next;
  }

  const customDays = Math.max(
    1,
    Number(settings.customDays || 1)
  );

  next.setDate(
    next.getDate() +
      (settings.lastBackupAt ? customDays : 0)
  );
  next.setHours(hour || 0, minute || 0, 0, 0);

  if (next <= from) {
    next.setDate(next.getDate() + customDays);
  }

  return next;
}

function formatBackupDate(value) {
  if (!value) return "Not yet";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function Settings() {
  const [settings, setSettings] = useJsonCollection("settings");
  const current = settings[0] || {};

  const [activeTab, setActiveTab] = useState("identity");
  const [companyName, setCompanyName] = useState(defaultSystemName);
  const [systemSubtitle, setSystemSubtitle] = useState(defaultSystemSubtitle);
  const [logo, setLogo] = useState("");
  const [routerName, setRouterName] = useState("");
  const [networkIp, setNetworkIp] = useState("");
  const [networkInfo, setNetworkInfo] = useState(null);
  const [appDataBusy, setAppDataBusy] = useState(false);
  const [clearConfirm, setClearConfirm] = useState("");
  const [backupSettings, setBackupSettings] = useState(
    () => readBackupSettings()
  );
  const [backupStatus, setBackupStatus] = useState("");


  useEffect(() => {
    setCompanyName(current.companyName || defaultSystemName);
    setSystemSubtitle(current.systemSubtitle || defaultSystemSubtitle);
    setLogo(current.logo || "");
    setRouterName(current.routerName || "");
    setNetworkIp(current.networkIp || "");
  }, [
    current.companyName,
    current.systemSubtitle,
    current.logo,
    current.routerName,
    current.networkIp,
  ]);

  useEffect(() => {
    let active = true;

    axios
      .get(apiUrl("network-info"))
      .then((response) => {
        if (!active) return;

        const info = response.data || {};
        setNetworkInfo(info);

        if (!current.networkIp && info.ipAddress) {
          setNetworkIp(info.ipAddress);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [current.networkIp]);

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
        routerName: routerName.trim(),
        networkIp:
          networkIp.trim() ||
          networkInfo?.ipAddress ||
          "",
        updatedAt: new Date().toISOString(),
      },
    ];

    const saved = await setSettings(nextSettings);
    if (!saved) return;

    window.dispatchEvent(new Event("company-settings-updated"));
    notify("System settings saved successfully.");
  };

  const publicIp =
    networkIp.trim() ||
    networkInfo?.ipAddress ||
    window.location.hostname ||
    "";

  const webPort = networkInfo?.webPort || 5173;
  const apiPort = networkInfo?.apiPort || 5050;
  const accessUrl = publicIp
    ? `http://${publicIp}:${webPort}`
    : "";
  const apiAccessUrl = publicIp
    ? `http://${publicIp}:${apiPort}/api`
    : "";

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      notify("Copied to clipboard.");
    } catch {
      notify("Unable to copy.", "error");
    }
  };

  const loadCollectionNames = async () => {
    const response = await axios.get(apiUrl("collections"));
    return Array.isArray(response.data) ? response.data : [];
  };

  const exportData = async ({
    automatic = false,
  } = {}) => {
    try {
      setAppDataBusy(true);

      if (automatic) {
        setBackupStatus("Creating automatic backup...");
      }

      const collections = await loadCollectionNames();

      const entries = await Promise.all(
        collections.map(async (name) => {
          const response = await axios.get(apiUrl(name));

          return [
            name,
            Array.isArray(response.data)
              ? response.data
              : [],
          ];
        })
      );

      const exportedAt = new Date().toISOString();

      const payload = {
        app: "Afghan Power",
        exportedAt,
        backupType: automatic
          ? "automatic"
          : "manual",
        collections: Object.fromEntries(entries),
      };

      const blob = new Blob(
        [JSON.stringify(payload, null, 2)],
        {
          type: "application/json",
        }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `afghan-power-data-${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19)}.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      if (automatic) {
        const nextSettings = {
          ...backupSettings,
          lastBackupAt: exportedAt,
        };

        setBackupSettings(nextSettings);
        saveBackupSettings(nextSettings);
        setBackupStatus("Automatic backup completed.");

        window.setTimeout(
          () => setBackupStatus(""),
          3000
        );
      }

      notify(
        automatic
          ? "Automatic backup created successfully."
          : "App data exported successfully."
      );

      return true;
    } catch (error) {
      console.error(
        "Unable to export app data:",
        error
      );

      setBackupStatus("");

      notify(
        automatic
          ? "Unable to create automatic backup."
          : "Unable to export app data.",
        "error"
      );

      return false;
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


  const updateBackupSetting = (name, value) => {
    setBackupSettings((currentSettings) => {
      const nextSettings = {
        ...currentSettings,
        [name]: value,
      };

      saveBackupSettings(nextSettings);
      return nextSettings;
    });
  };

  const toggleAutomaticBackup = () => {
    setBackupSettings((currentSettings) => {
      const nextSettings = {
        ...currentSettings,
        enabled: !currentSettings.enabled,
      };

      saveBackupSettings(nextSettings);

      notify(
        nextSettings.enabled
          ? "Automatic backup enabled."
          : "Automatic backup disabled."
      );

      return nextSettings;
    });
  };

  const backupNow = async () => {
    const success = await exportData({
      automatic: true,
    });

    if (!success) return;
  };

  const nextBackupAt = backupSettings.enabled
    ? getNextBackupDate(
        backupSettings,
        new Date()
      )
    : null;

  useEffect(() => {
    if (!backupSettings.enabled) {
      return undefined;
    }

    let running = false;

    const checkBackupSchedule = async () => {
      if (running || appDataBusy) return;

      const nextBackup = getNextBackupDate(
        backupSettings,
        new Date()
      );

      if (new Date() < nextBackup) {
        return;
      }

      running = true;

      try {
        await exportData({
          automatic: true,
        });
      } finally {
        running = false;
      }
    };

    checkBackupSchedule();

    const intervalId = window.setInterval(
      checkBackupSchedule,
      60 * 1000
    );

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    backupSettings.enabled,
    backupSettings.frequency,
    backupSettings.time,
    backupSettings.weekDay,
    backupSettings.monthDay,
    backupSettings.customDays,
    backupSettings.lastBackupAt,
    appDataBusy,
  ]);

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
        <button
          type="button"
          className={activeTab === "network" ? "active" : ""}
          onClick={() => setActiveTab("network")}
        >
          Network Access
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
              <button type="button" onClick={() => exportData()} disabled={appDataBusy}>
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


            <div className="settings-auto-backup">
              <div className="settings-auto-backup-head">
                <div>
                  <span>Automatic Backup</span>
                  <h4>Scheduled App Backup</h4>
                  <p>
                    Create backup files automatically while ISP Smart is open.
                  </p>
                </div>

                <button
                  type="button"
                  className={`settings-backup-toggle ${
                    backupSettings.enabled
                      ? "active"
                      : ""
                  }`}
                  onClick={toggleAutomaticBackup}
                >
                  <i></i>
                  {backupSettings.enabled
                    ? "Enabled"
                    : "Disabled"}
                </button>
              </div>

              <div className="settings-backup-grid">
                <label>
                  Backup Frequency
                  <select
                    value={backupSettings.frequency}
                    onChange={(event) =>
                      updateBackupSetting(
                        "frequency",
                        event.target.value
                      )
                    }
                    disabled={!backupSettings.enabled}
                  >
                    <option value="daily">
                      Daily
                    </option>
                    <option value="weekly">
                      Weekly
                    </option>
                    <option value="monthly">
                      Monthly
                    </option>
                    <option value="custom">
                      Custom
                    </option>
                  </select>
                </label>

                <label>
                  Backup Time
                  <input
                    type="time"
                    value={backupSettings.time}
                    onChange={(event) =>
                      updateBackupSetting(
                        "time",
                        event.target.value
                      )
                    }
                    disabled={!backupSettings.enabled}
                  />
                </label>

                {backupSettings.frequency ===
                  "weekly" && (
                  <label>
                    Day of Week
                    <select
                      value={backupSettings.weekDay}
                      onChange={(event) =>
                        updateBackupSetting(
                          "weekDay",
                          event.target.value
                        )
                      }
                      disabled={
                        !backupSettings.enabled
                      }
                    >
                      <option value="0">
                        Sunday
                      </option>
                      <option value="1">
                        Monday
                      </option>
                      <option value="2">
                        Tuesday
                      </option>
                      <option value="3">
                        Wednesday
                      </option>
                      <option value="4">
                        Thursday
                      </option>
                      <option value="5">
                        Friday
                      </option>
                      <option value="6">
                        Saturday
                      </option>
                    </select>
                  </label>
                )}

                {backupSettings.frequency ===
                  "monthly" && (
                  <label>
                    Day of Month
                    <select
                      value={backupSettings.monthDay}
                      onChange={(event) =>
                        updateBackupSetting(
                          "monthDay",
                          event.target.value
                        )
                      }
                      disabled={
                        !backupSettings.enabled
                      }
                    >
                      {Array.from(
                        { length: 28 },
                        (_, index) => index + 1
                      ).map((day) => (
                        <option
                          key={day}
                          value={String(day)}
                        >
                          Day {day}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                {backupSettings.frequency ===
                  "custom" && (
                  <label>
                    Every Number of Days
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={
                        backupSettings.customDays
                      }
                      onChange={(event) =>
                        updateBackupSetting(
                          "customDays",
                          event.target.value
                        )
                      }
                      disabled={
                        !backupSettings.enabled
                      }
                    />
                  </label>
                )}
              </div>

              <div className="settings-backup-status-grid">
                <div>
                  <span>Last Backup</span>
                  <strong>
                    {formatBackupDate(
                      backupSettings.lastBackupAt
                    )}
                  </strong>
                </div>

                <div>
                  <span>Next Backup</span>
                  <strong>
                    {backupSettings.enabled
                      ? formatBackupDate(
                          nextBackupAt
                        )
                      : "Automatic backup is off"}
                  </strong>
                </div>
              </div>

              <div className="settings-backup-footer">
                <div>
                  {backupStatus ? (
                    <span className="settings-backup-status">
                      {backupStatus}
                    </span>
                  ) : (
                    <span>
                      Backups are downloaded as JSON
                      files.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={backupNow}
                  disabled={appDataBusy}
                >
                  <Download size={16} />
                  Backup Now
                </button>
              </div>
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

      {activeTab === "network" && (
        <form className="settings-network-card" onSubmit={save}>
          <section className="settings-panel">
            <div className="settings-section-title">
              <h3>Network Access</h3>
              <p>Save the router name and share the system address with users connected to the same router.</p>
            </div>

            <div className="settings-network-grid">
              <label>
                Router / Wi-Fi Name
                <input
                  value={routerName}
                  onChange={(event) => setRouterName(event.target.value)}
                  placeholder="Example: Afghan Power Office"
                />
              </label>

              <label>
                System IP Address
                <input
                  value={networkIp}
                  onChange={(event) => setNetworkIp(event.target.value)}
                  placeholder={networkInfo?.ipAddress || "192.168.100.86"}
                />
              </label>
            </div>

            <div className="settings-network-summary">
              <div>
                <Wifi size={18} />
                <span>Router / Network</span>
                <strong>{routerName || "Not set"}</strong>
              </div>

              <div>
                <Router size={18} />
                <span>Detected Device</span>
                <strong>{networkInfo?.hostname || "-"}</strong>
              </div>

              <div>
                <Globe2 size={18} />
                <span>Share This Address</span>
                <strong>{accessUrl || "No IP address"}</strong>
                {accessUrl && (
                  <button
                    type="button"
                    onClick={() => copyText(accessUrl)}
                    aria-label="Copy system address"
                    title="Copy system address"
                  >
                    <Copy size={14} />
                  </button>
                )}
              </div>

              <div>
                <Database size={18} />
                <span>Backend API</span>
                <strong>{apiAccessUrl || "No API address"}</strong>
                {apiAccessUrl && (
                  <button
                    type="button"
                    onClick={() => copyText(apiAccessUrl)}
                    aria-label="Copy API address"
                    title="Copy API address"
                  >
                    <Copy size={14} />
                  </button>
                )}
              </div>
            </div>

            <button type="submit" className="settings-save">
              <Save size={16} />
              Save Network Settings
            </button>
          </section>
        </form>
      )}
    </div>
  );
}

export default Settings;