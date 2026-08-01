import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Copy,
  Fingerprint,
  FolderKanban,
  KeyRound,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import "./ProjectLicense.css";

const licenseTypes = [
  { key: "one-day", label: "One Day" },
  { key: "three-days", label: "Three Days" },
  { key: "one-week", label: "One Week" },
  { key: "one-month", label: "One Month" },
  { key: "one-year", label: "One Year" },
  { key: "custom", label: "Custom Date" },
  { key: "forever", label: "Forever" },
];

function getLicenseState(license) {
  if (license.licenseType === "forever") return "Forever";
  if (!license.endDate) return "Draft";
  const today = new Date().toISOString().slice(0, 10);
  if (license.endDate < today) return "Expired";
  return license.status || "Active";
}

function getRemainingHours(license) {
  if (license.licenseType === "forever") return Infinity;
  if (!license.endDate) return null;
  const end = new Date(`${license.endDate}T23:59:59`);
  return Math.ceil((end.getTime() - Date.now()) / 36e5);
}

function getRemainingText(license) {
  const hours = getRemainingHours(license);
  if (hours === Infinity) return "Forever";
  if (hours === null) return "-";
  if (hours <= 0) return "Expired";
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return days ? `${days}d ${restHours}h` : `${hours}h`;
}

function money(value, currency = "AFN") {
  if (value === undefined || value === null || value === "") return "-";
  return `${Number(value || 0).toLocaleString("en-US")} ${currency}`;
}

function ProjectLicense() {
  const [projects] = useJsonCollection("projects");
  const [sales] = useJsonCollection("projectSales");
  const [licenses] = useJsonCollection("projectLicenses");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const reportRows = useMemo(() => {
    return licenses
      .map((license) => {
        const project = projects.find((item) => String(item.id) === String(license.projectId));
        const sale = sales.find((item) => String(item.id) === String(license.saleId));
        const state = getLicenseState(license);
        return {
          ...license,
          state,
          projectName: license.projectName || project?.projectName || "-",
          customerName: license.customerName || sale?.customerName || project?.customerName || "-",
          customerPhone: sale?.customerPhone || "-",
          price: sale?.price,
          currency: sale?.currency || "AFN",
          remainingText: getRemainingText(license),
          remainingHours: getRemainingHours(license),
          licenseTypeLabel: licenseTypes.find((type) => type.key === license.licenseType)?.label || license.licenseType || "-",
        };
      })
      .sort((a, b) => {
        const first = a.remainingHours ?? Number.MAX_SAFE_INTEGER;
        const second = b.remainingHours ?? Number.MAX_SAFE_INTEGER;
        return first - second;
      });
  }, [licenses, projects, sales]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return reportRows.filter((row) => {
      const matchesSearch = !query || [
        row.projectName,
        row.customerName,
        row.customerPhone,
        row.deviceId,
        row.licenseKey,
        row.licenseTypeLabel,
        row.state,
      ].some((value) => String(value || "").toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || row.state === statusFilter;
      const matchesType = typeFilter === "all" || row.licenseType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [reportRows, search, statusFilter, typeFilter]);

  const licensedProjects = new Set(licenses.map((license) => license.projectId).filter(Boolean)).size;
  const activeCount = reportRows.filter((row) => ["Active", "Forever"].includes(row.state)).length;
  const expiredCount = reportRows.filter((row) => row.state === "Expired").length;
  const expiringSoonCount = reportRows.filter((row) => row.remainingHours > 0 && row.remainingHours <= 168).length;

  function copyLicense(licenseKey) {
    if (!licenseKey) return;
    navigator.clipboard?.writeText(licenseKey);
    notify("License key copied.", "success");
  }

  return (
    <div className="license-page">
      <header className="license-heading report-only">
        <div>
          <span>License Report</span>
          <h1>Project License</h1>
          <p>Review every project license, customer, device, expiry time, and status from one reporting page.</p>
        </div>
      </header>

      <section className="license-stats">
        <div><FolderKanban /><span>Licensed Projects</span><strong>{licensedProjects}</strong><small>Projects with generated licenses</small></div>
        <div><ShieldCheck /><span>Active Licenses</span><strong>{activeCount}</strong><small>Currently usable licenses</small></div>
        <div><AlertTriangle /><span>Expiring Soon</span><strong>{expiringSoonCount}</strong><small>Ending within seven days</small></div>
        <div><CalendarClock /><span>Expired Licenses</span><strong>{expiredCount}</strong><small>Need renewal or review</small></div>
      </section>

      <section className="license-list report-table project-sale-list">
        <div className="license-list-header">
          <div>
            <h2>License Records</h2>
            <p>All generated project licenses.</p>
          </div>
          <div className="license-header-search">
            <Search size={15} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search licenses..." />
          </div>
        </div>

        <div className="license-report-toolbar">
          <span>{filteredRows.length} record(s)</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Forever">Forever</option>
            <option value="Expired">Expired</option>
            <option value="Suspended">Suspended</option>
            <option value="Revoked">Revoked</option>
            <option value="Draft">Draft</option>
          </select>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">All Types</option>
            {licenseTypes.map((type) => <option key={type.key} value={type.key}>{type.label}</option>)}
          </select>
        </div>

        <div className="license-report-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Customer</th>
                <th>Device ID</th>
                <th>License Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Remaining Time</th>
                <th>Status</th>
                <th>Price</th>
                <th>License Key</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((license) => (
                <tr key={license.id}>
                  <td><strong>{license.projectName}</strong></td>
                  <td><span>{license.customerName}</span><small>{license.customerPhone}</small></td>
                  <td><span className="license-device"><Fingerprint size={13} />{license.deviceId || "-"}</span></td>
                  <td>{license.licenseTypeLabel}</td>
                  <td>{license.startDate || "-"}</td>
                  <td>{license.licenseType === "forever" ? "Forever" : license.endDate || "-"}</td>
                  <td><span className={`license-time ${license.remainingHours > 0 && license.remainingHours <= 168 ? "soon" : ""}`}>{license.remainingText}</span></td>
                  <td><span className={`license-state ${license.state.toLowerCase()}`}>{license.state}</span></td>
                  <td>{money(license.price, license.currency)}</td>
                  <td>
                    <div className="license-key-field">
                      <input data-no-translate value={license.licenseKey || "-"} readOnly title={license.licenseKey || ""} />
                      <button type="button" className="license-copy-btn" onClick={() => copyLicense(license.licenseKey)} title="Copy license" aria-label="Copy license" disabled={!license.licenseKey}>
                        <Copy size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredRows.length && (
                <tr>
                  <td colSpan="10" className="license-empty-row">
                    <KeyRound size={34} />
                    <strong>No license has been generated yet.</strong>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default ProjectLicense;
