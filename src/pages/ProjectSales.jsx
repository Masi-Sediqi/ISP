import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BadgeDollarSign,
  CalendarClock,
  Copy,
  CreditCard,
  FileKey2,
  FolderKanban,
  Infinity as InfinityIcon,
  KeyRound,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Send,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { calculateLicenseEndDate } from "../utils/licenseDuration";
import { apiUrl } from "../utils/api";
import { notify } from "../utils/notify";
import "./ProjectSales.css";

const emptySale = {
  projectId: "",
  projectName: "",
  customerId: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  sourceEmployeeName: "",
  assignedEmployeeName: "",
  price: "",
  paid: "",
  remaining: "",
  currency: "AFN",
  saleType: "license",
  notes: "",
  saleDate: new Date().toISOString().slice(0, 10),
};

const licenseTypes = [
  { key: "one-day", label: "One Day" },
  { key: "three-days", label: "Three Days" },
  { key: "one-week", label: "One Week" },
  { key: "one-month", label: "One Month" },
  { key: "one-year", label: "One Year" },
  { key: "custom", label: "Custom Date", days: null },
  { key: "forever", label: "Forever", days: null },
];

const emptyLicenseForm = {
  deviceId: "",
  licenseType: "one-month",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  notes: "",
};

function money(value, currency = "AFN") {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("en-US")} ${currency}`;
}

function customerLabel(customer) {
  return customer.customerName || customer.passportFullName || customer.fullName || customer.name || customer.phone || "Unnamed Customer";
}

function createEmptyLicenseForm() {
  const base = { ...emptyLicenseForm };
  base.endDate = calculateLicenseEndDate(base.startDate, base.licenseType);
  return base;
}

function normalizeDeviceId(deviceId) {
  return String(deviceId || "").trim().toUpperCase();
}

function isEndBeforeStart(startDate, endDate) {
  if (!startDate || !endDate) return false;
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T00:00:00.000Z`).getTime();
  return Number.isFinite(start) && Number.isFinite(end) && end < start;
}

function toDateOnly(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function ProjectSales() {
  const [projects] = useJsonCollection("projects");
  const [customers] = useJsonCollection("customers");
  const [sales, setSales] = useJsonCollection("projectSales");
  const [licenses, setLicenses] = useJsonCollection("projectLicenses");
  const [transactions, setTransactions] =
  useJsonCollection("transactions");
  const [form, setForm] = useState(emptySale);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [licenseSale, setLicenseSale] = useState(null);
  const [licenseForm, setLicenseForm] = useState(createEmptyLicenseForm);
  const [generatedLicense, setGeneratedLicense] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [licenseGenerationError, setLicenseGenerationError] = useState("");
  const [search, setSearch] = useState("");

  const [deleteTarget, setDeleteTarget] =
  useState(null);

const [deletingSale, setDeletingSale] =
  useState(false);

  const customerOptions = useMemo(() => {
    const rows = customers;
    const seen = new Set();
    return rows.filter((customer) => {
      const key = String(customer.id || customer.customerId || customer.phone || customerLabel(customer));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [customers]);

  const selectedProject = projects.find((project) => String(project.id) === String(form.projectId));
  const selectedCustomer = customerOptions.find((customer) => String(customer.id || customer.customerId) === String(form.customerId));

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sales;
    return sales.filter((sale) =>
      [sale.projectName, sale.customerName, sale.customerPhone, sale.saleType, sale.notes]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [sales, search]);

  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.price || 0), 0);
  const totalPaid = sales.reduce((sum, sale) => sum + Number(sale.paid || 0), 0);
  const totalRemaining = sales.reduce((sum, sale) => sum + Number(sale.remaining || 0), 0);
  useEffect(() => {
    document.body.classList.toggle("project-modal-open", showForm || !!licenseSale);
    return () => document.body.classList.remove("project-modal-open");
  }, [showForm, licenseSale]);

  function updateField(event) {
    const { name, value } = event.target;

    if (name === "projectId") {
      const project = projects.find((item) => String(item.id) === String(value));
      setForm((current) => ({
        ...current,
        projectId: value,
        projectName: project?.projectName || "",
        currency: project?.currency || current.currency,
        price: current.price || project?.budget || "",
        remaining: String(Number(current.price || project?.budget || 0) - Number(current.paid || 0)),
      }));
      return;
    }

    if (name === "customerId") {
      const customer = customerOptions.find((item) => String(item.id || item.customerId) === String(value));
      setForm((current) => ({
        ...current,
        customerId: value,
        customerName: customerLabel(customer || {}),
        customerPhone: customer?.phone || "",
        customerEmail: customer?.email || "",
        sourceEmployeeName: customer?.sourceEmployeeName || customer?.createdByName || "",
        assignedEmployeeName: customer?.assignedEmployeeName || "",
      }));
      return;
    }

    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "price" || name === "paid") {
        next.remaining = String(Math.max(0, Number(next.price || 0) - Number(next.paid || 0)));
      }
      return next;
    });
  }

  function resetForm() {
    setForm(emptySale);
    setEditId(null);
    setShowForm(false);
  }

  function openCreateForm() {
    setForm(emptySale);
    setEditId(null);
    setShowForm(true);
  }

  async function upsertProjectSaleIncome(sale) {
  const paidAmount = Number(sale.paid || 0);

  /*
   * اگر هیچ مبلغی دریافت نشده باشد،
   * عاید قبلی مربوط به این فروش حذف می‌شود.
   */
  if (paidAmount <= 0) {
    return setTransactions(
      transactions.filter(
        (transaction) =>
          !(
            transaction.source ===
              "project-sale" &&
            String(
              transaction.referenceId || ""
            ) === String(sale.id)
          )
      )
    );
  }

  const now = new Date().toISOString();

  const incomeRecord = {
    id: `project-sale-income-${sale.id}`,

    type: "income",

    title: `Project Sale - ${
      sale.projectName || "Project"
    }`,

    category: "Project Sales",

    amount: paidAmount,

    currency: sale.currency || "AFN",

    date:
      sale.saleDate ||
      new Date().toISOString().slice(0, 10),

    description: [
      sale.customerName
        ? `Customer: ${sale.customerName}`
        : "",

      sale.customerPhone
        ? `Phone: ${sale.customerPhone}`
        : "",

      `Project Price: ${Number(
        sale.price || 0
      ).toLocaleString("en-US")} ${
        sale.currency || "AFN"
      }`,

      `Paid: ${paidAmount.toLocaleString(
        "en-US"
      )} ${sale.currency || "AFN"}`,

      `Remaining: ${Number(
        sale.remaining || 0
      ).toLocaleString("en-US")} ${
        sale.currency || "AFN"
      }`,

      sale.saleType
        ? `Sale Type: ${sale.saleType}`
        : "",

      sale.notes || "",
    ]
      .filter(Boolean)
      .join(" | "),

    source: "project-sale",
    referenceId: sale.id,

    projectId: sale.projectId || "",
    projectName: sale.projectName || "",

    customerId: sale.customerId || "",
    customerName: sale.customerName || "",

    createdAt:
      transactions.find(
        (transaction) =>
          transaction.source ===
            "project-sale" &&
          String(
            transaction.referenceId || ""
          ) === String(sale.id)
      )?.createdAt || now,

    updatedAt: now,
  };

  const nextTransactions = [
    ...transactions.filter(
      (transaction) =>
        !(
          transaction.source ===
            "project-sale" &&
          String(
            transaction.referenceId || ""
          ) === String(sale.id)
        )
    ),

    incomeRecord,
  ];

  return setTransactions(nextTransactions);
}
async function saveSale(event) {
  event.preventDefault();

  if (!form.projectId || !form.customerId) {
    notify(
      "Please select project and customer.",
      "error"
    );
    return;
  }

  const price = Number(form.price || 0);
  const paid = Number(form.paid || 0);

  if (price <= 0) {
    notify(
      "Project price must be greater than zero.",
      "error"
    );
    return;
  }

  if (paid < 0) {
    notify(
      "Paid amount cannot be negative.",
      "error"
    );
    return;
  }

  if (paid > price) {
    notify(
      "Paid amount cannot be greater than project price.",
      "error"
    );
    return;
  }

  const now = new Date().toISOString();
  const saleId =
    editId || crypto.randomUUID();

  const oldSale = sales.find(
    (sale) =>
      String(sale.id) === String(editId)
  );

  const saleRecord = {
    ...(oldSale || {}),

    ...form,

    id: saleId,

    price: String(price),
    paid: String(paid),

    remaining: String(
      Math.max(price - paid, 0)
    ),

    saleDate:
      form.saleDate ||
      new Date().toISOString().slice(0, 10),

    createdAt:
      oldSale?.createdAt || now,

    updatedAt: now,
  };

  const nextSales = editId
    ? sales.map((sale) =>
        String(sale.id) === String(editId)
          ? saleRecord
          : sale
      )
    : [...sales, saleRecord];

  const saleSaved =
    await setSales(nextSales);

  if (!saleSaved) return;

  /*
   * مبلغ Paid را در بخش عواید ثبت می‌کند.
   */
  const incomeSaved =
    await upsertProjectSaleIncome(
      saleRecord
    );

  if (!incomeSaved) {
    notify(
      "Sale was saved, but the income record could not be linked.",
      "error"
    );
    return;
  }

  notify(
    editId
      ? "Project sale and income updated successfully."
      : "Project sale and income registered successfully.",
    "success"
  );

  resetForm();
}

async function deleteSale() {
  if (!deleteTarget || deletingSale) return;

  setDeletingSale(true);

  try {
    const saleId = deleteTarget.id;

    const nextSales = sales.filter(
      (sale) =>
        String(sale.id) !== String(saleId)
    );

    const saleDeleted =
      await setSales(nextSales);

    if (!saleDeleted) {
      notify(
        "Unable to delete the project sale.",
        "error"
      );
      return;
    }

    /*
     * عاید مرتبط با فروش نیز حذف می‌شود.
     */
    const incomeDeleted =
      await setTransactions(
        (previousTransactions) =>
          previousTransactions.filter(
            (transaction) =>
              !(
                transaction.source ===
                  "project-sale" &&
                String(
                  transaction.referenceId || ""
                ) === String(saleId)
              )
          )
      );

    if (!incomeDeleted) {
      notify(
        "Sale was deleted, but its linked income could not be removed.",
        "error"
      );
      return;
    }

    /*
     * لایسنس‌های مرتبط با این فروش نیز حذف شوند.
     */
    const nextLicenses = licenses.filter(
      (license) =>
        String(license.saleId || "") !==
        String(saleId)
    );

    const licensesDeleted =
      await setLicenses(nextLicenses);

    if (!licensesDeleted) {
      notify(
        "Sale and income were deleted, but linked licenses could not be removed.",
        "error"
      );
      return;
    }

    notify(
      "Project sale and linked records deleted successfully.",
      "success"
    );

    setDeleteTarget(null);
  } finally {
    setDeletingSale(false);
  }
}
  function editSale(sale) {
    setEditId(sale.id);
    setForm({ ...emptySale, ...sale });
    setShowForm(true);
  }

  function openLicenseModal(sale) {
    setLicenseSale(sale);
    setLicenseForm(createEmptyLicenseForm());
    setGeneratedLicense(null);
    setLicenseGenerationError("");
  }

  function closeLicenseModal() {
    setLicenseSale(null);
    setGeneratedLicense(null);
    setLicenseGenerationError("");
    setLicenseForm(createEmptyLicenseForm());
  }

  function updateLicenseField(event) {
    const { name, value } = event.target;
    setGeneratedLicense(null);
    setLicenseGenerationError("");
    setLicenseForm((current) => {
      const next = { ...current, [name]: value };
      const type = licenseTypes.find((item) => item.key === (name === "licenseType" ? value : next.licenseType));
      if (name === "licenseType" && value === "forever") {
        next.endDate = "";
      } else if ((name === "licenseType" || name === "startDate") && type?.key !== "custom") {
        next.endDate = calculateLicenseEndDate(name === "startDate" ? value : next.startDate, type?.key || next.licenseType, next.endDate);
      }
      return next;
    });
  }

async function generateLicenseCode() {
  if (!licenseSale || generating) return;

  const deviceId = normalizeDeviceId(licenseForm.deviceId);

  if (!deviceId) {
    notify("Device ID is required.", "error");
    return;
  }

  if (deviceId.startsWith("WEB-")) {
    const message =
      "Browser Device IDs cannot be used for production licenses. Copy the Device ID from the customer Electron application.";

    setLicenseGenerationError(message);
    notify(message, "error");
    return;
  }

  if (
    licenseForm.licenseType !== "forever" &&
    !licenseForm.endDate
  ) {
    notify("License end date is required.", "error");
    return;
  }

  if (
    licenseForm.licenseType !== "forever" &&
    isEndBeforeStart(
      licenseForm.startDate,
      licenseForm.endDate
    )
  ) {
    notify(
      "License end date cannot be before the start date.",
      "error"
    );
    return;
  }

  const request = {
    projectId: licenseSale.projectId,
    projectName: licenseSale.projectName,
    customerId: licenseSale.customerId,
    customerName: licenseSale.customerName,
    deviceId,
    licenseType: licenseForm.licenseType,
    startDate: licenseForm.startDate,
    endDate: licenseForm.endDate,
    status: "Active",
    features: ["all"],
  };

  setGenerating(true);
  setGeneratedLicense(null);
  setLicenseGenerationError("");

  try {
    const response = await axios.post(
      apiUrl("license/generate"),
      request,
      {
        headers: {
          "X-ISP-Session-Id":
            localStorage.getItem("isp-system-session") || "",
        },
      }
    );

    const result = response.data;

    if (!result?.success) {
      throw new Error(
        result?.error || "License generation failed."
      );
    }

    const generated = {
      ...licenseForm,
      ...request,
      endDate:
        toDateOnly(
          result.certificate?.payload?.expiresAt
        ) || licenseForm.endDate,
      status: "Active",
      licenseId: result.certificate.payload.licenseId,
      licenseKey: result.licenseCode,
      certificate: result.certificate,
      saleId: licenseSale.id,
      updatedAt: new Date().toISOString(),
    };

    setGeneratedLicense(generated);
    notify(
      "License code generated successfully.",
      "success"
    );
  } catch (error) {
    const message =
      error?.response?.data?.error ||
      error?.message ||
      "License generation failed.";

    setGeneratedLicense(null);
    setLicenseGenerationError(message);
    notify(message, "error");
  } finally {
    setGenerating(false);
  }
}

async function saveLicense(event) {
  event.preventDefault();

  if (!licenseSale) return;

  if (!generatedLicense?.licenseKey) {
    notify(
      "Please generate the license code first.",
      "error"
    );
    return;
  }

  const payload = {
    ...generatedLicense,
    notes: licenseForm.notes,
    saleId: licenseSale.id,
    projectId: licenseSale.projectId,
    projectName: licenseSale.projectName,
    customerId: licenseSale.customerId,
    customerName: licenseSale.customerName,
    updatedAt: new Date().toISOString(),
  };

  const saved = await setLicenses([
    ...licenses,
    {
      ...payload,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    },
  ]);

  if (!saved) return;

  notify("Sale and license saved successfully.", "success");
  closeLicenseModal();
}

  function copyLicense(licenseKey) {
    navigator.clipboard?.writeText(licenseKey);
    notify("License key copied.", "success");
  }

  function shareLicense(channel) {
    if (!generatedLicense?.licenseKey) return;
    const text = `Project: ${generatedLicense.projectName}\nCustomer: ${generatedLicense.customerName || "-"}\nDevice ID: ${generatedLicense.deviceId}\nLicense Code: ${generatedLicense.licenseKey}\nValid Until: ${generatedLicense.licenseType === "forever" ? "Forever" : generatedLicense.endDate || "-"}`;
    navigator.clipboard?.writeText(generatedLicense.licenseKey);
    notify("License key copied.", "success");
    const encoded = encodeURIComponent(text);
    const urls = {
      whatsapp: `https://wa.me/?text=${encoded}`,
      email: `mailto:?subject=${encodeURIComponent("Project License Code")}&body=${encoded}`,
      telegram: `https://t.me/share/url?url=&text=${encoded}`,
    };
    window.open(urls[channel], "_blank", "noopener,noreferrer");
  }

  return (
    <div className="project-sales-page">
      <header className="project-sales-heading">
        <div>
          <span>Sales Workspace</span>
          <h1>Project Sales</h1>
          <p>Select a project and customer, then record price, payment, remaining balance, and sale type.</p>
        </div>
        <button type="button" onClick={openCreateForm}>
          <Plus size={17} />
          Register Sale
        </button>
      </header>

      <section className="project-sales-stats">
        <div><ReceiptText /><span>Total Sales</span><strong>{sales.length}</strong><small>Registered project sales</small></div>
        <div><BadgeDollarSign /><span>Sales Value</span><strong>{money(totalSales, "AFN")}</strong><small>Total project price</small></div>
        <div><CreditCard /><span>Total Paid</span><strong>{money(totalPaid, "AFN")}</strong><small>Received payments</small></div>
        <div><CalendarClock /><span>Remaining</span><strong>{money(totalRemaining, "AFN")}</strong><small>Outstanding amount</small></div>
      </section>

      {showForm && (
        <div className="project-sale-modal-backdrop" role="presentation" onMouseDown={resetForm}>
          <div className="project-sale-modal" role="dialog" aria-modal="true" aria-labelledby="project-sale-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="project-sale-modal-header">
              <div>
                <span>Sale Information</span>
                <h2 id="project-sale-modal-title">{editId ? "Edit Sale" : "Register Sale"}</h2>
              </div>
              <button type="button" onClick={resetForm} title="Close" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <section className="project-sales-workspace in-modal">
              <form className="project-sale-form" onSubmit={saveSale}>
                <div className="project-sale-form-title">
                  <span><FolderKanban size={17} />Sale Information</span>
                  <strong>{editId ? "Edit Sale" : "Register Sale"}</strong>
                </div>

                <div className="project-sale-grid">
                  <label><span>Project</span><select name="projectId" value={form.projectId} onChange={updateField}><option value="">Choose project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.projectName}</option>)}</select></label>
                  <label><span>Customer</span><select name="customerId" value={form.customerId} onChange={updateField}><option value="">Select customer</option>{customerOptions.map((customer) => <option key={customer.id || customer.customerId || customer.phone} value={customer.id || customer.customerId}>{customerLabel(customer)}</option>)}</select></label>

                  {selectedCustomer && (
                    <div className="project-sale-customer-card project-sale-full">
                      <div><UserRound size={20} /><span><small>Customer Name</small><strong>{form.customerName}</strong></span></div>
                      <div><span><small>Phone Number</small><strong>{form.customerPhone || "-"}</strong></span></div>
                      <div><span><small>Email</small><strong>{form.customerEmail || "-"}</strong></span></div>
                      <div><span><small>Source Employee</small><strong>{form.sourceEmployeeName || "-"}</strong></span></div>
                      <div><span><small>Assigned To</small><strong>{form.assignedEmployeeName || "-"}</strong></span></div>
                    </div>
                  )}

                  <label><span>Price</span><input type="number" min="0" name="price" value={form.price} onChange={updateField} /></label>
                  <label><span>Paid</span><input type="number" min="0" name="paid" value={form.paid} onChange={updateField} /></label>
                  <label><span>Remaining</span><input name="remaining" value={form.remaining} readOnly /></label>
                  <label><span>Unit</span><select name="currency" value={form.currency} onChange={updateField}><option>AFN</option><option>USD</option><option>EUR</option></select></label>

                  <div className="project-sale-type project-sale-full">
                    <button type="button" className={form.saleType === "forever" ? "active" : ""} onClick={() => updateField({ target: { name: "saleType", value: "forever" } })}>
                      <InfinityIcon size={17} /><span><strong>Permanent Sale</strong><small>Sold forever</small></span>
                    </button>
                    <button type="button" className={form.saleType === "license" ? "active" : ""} onClick={() => updateField({ target: { name: "saleType", value: "license" } })}>
                      <KeyRound size={17} /><span><strong>License Sale</strong><small>Customer needs a license code</small></span>
                    </button>
                  </div>

                  <label className="project-sale-full"><span>Notes</span><textarea name="notes" value={form.notes} onChange={updateField} rows="3" /></label>
                </div>

              <div className="project-sale-actions">
  <button
    type="button"
    onClick={resetForm}
  >
    Cancel
  </button>

  <button type="submit">
    <ReceiptText size={15} />

    {editId ? "Save Changes" : "Register Sale"}
  </button>
</div>
              </form>

              <aside className="project-sale-preview">
                <span>Selected Project</span>
                <h2>{selectedProject?.projectName || "Choose project"}</h2>
                <p>{selectedProject?.notes || selectedProject?.requirements || "Project details will appear here after selection."}</p>
                <div>
                  <small>Price</small>
                  <strong>{money(form.price || selectedProject?.budget, form.currency)}</strong>
                </div>
                <div>
                  <small>Sale Type</small>
                  <strong>{form.saleType === "forever" ? "Permanent Sale" : "License Sale"}</strong>
                </div>
              </aside>
            </section>
          </div>
        </div>
      )}

      {licenseSale && (
        <div className="project-sale-modal-backdrop" role="presentation" onMouseDown={closeLicenseModal}>
          <div className="project-license-modal" role="dialog" aria-modal="true" aria-labelledby="project-license-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="project-sale-modal-header">
              <div>
                <span>Device License</span>
                <h2 id="project-license-modal-title">Generate License</h2>
              </div>
              <button type="button" onClick={closeLicenseModal} title="Close" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form className="project-license-form" onSubmit={saveLicense}>
              <div className="project-license-summary">
                <div><span>Project</span><strong>{licenseSale.projectName}</strong></div>
                <div><span>Customer</span><strong>{licenseSale.customerName || "-"}</strong></div>
                <div><span>Phone Number</span><strong>{licenseSale.customerPhone || "-"}</strong></div>
                <div><span>Price</span><strong>{money(licenseSale.price, licenseSale.currency)}</strong></div>
              </div>

              <label className="project-license-field project-sale-full">
                <span>Device ID</span>
                <input name="deviceId" value={licenseForm.deviceId} onChange={updateLicenseField} placeholder="Example: PC-01-HDD-ABC123" />
                <small>Paste the Device ID copied from the License page of the installed Customer Electron application.</small>
              </label>

              <label className="project-license-output project-sale-full">
  <span>License Output</span>

  <div className="project-license-output-control">
    <input
      value={generatedLicense?.licenseKey || ""}
      readOnly
      data-no-translate
      placeholder={
        generating
          ? "Generating license code..."
          : "Click Generate License to create code"
      }
    />

    <button
      type="button"
      className="generate-license-button"
      onClick={generateLicenseCode}
      disabled={generating}
    >
      <KeyRound size={15} />

      {generating
        ? "Generating..."
        : "Generate License"}
    </button>

    <button
      type="button"
      className="copy-license-button"
      disabled={!generatedLicense?.licenseKey}
      onClick={() =>
        copyLicense(generatedLicense.licenseKey)
      }
      title="Copy license"
      aria-label="Copy license"
    >
      <Copy size={15} />
    </button>
  </div>
</label>

              {licenseGenerationError && (
                <div className="project-license-error project-sale-full">
                  {licenseGenerationError}
                </div>
              )}

              {generatedLicense?.licenseKey && (
                <div className="project-license-share project-sale-full">
                  <button type="button" onClick={() => shareLicense("whatsapp")}><MessageCircle size={15} />WhatsApp</button>
                  <button type="button" onClick={() => shareLicense("email")}><Mail size={15} />Email</button>
                  <button type="button" onClick={() => shareLicense("telegram")}><Send size={15} />Telegram</button>
                </div>
              )}

              <div className="project-license-types project-sale-full">
                {licenseTypes.map((type) => {
                  const Icon = type.key === "forever" ? InfinityIcon : CalendarClock;
                  return (
                    <button
                      type="button"
                      key={type.key}
                      className={licenseForm.licenseType === type.key ? "active" : ""}
                      onClick={() => updateLicenseField({ target: { name: "licenseType", value: type.key } })}
                    >
                      <Icon size={16} />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="project-license-date-grid project-sale-full">
                <label><span>Start Date</span><input type="date" name="startDate" value={licenseForm.startDate} onChange={updateLicenseField} /></label>
                <label><span>End Date</span><input type="date" name="endDate" value={licenseForm.endDate} onChange={updateLicenseField} disabled={licenseForm.licenseType !== "custom"} /></label>
              </div>

              <label className="project-license-field project-sale-full">
                <span>Notes</span>
                <textarea name="notes" value={licenseForm.notes} onChange={updateLicenseField} rows="3" />
              </label>

              <div className="project-sale-actions">
                <button type="button" onClick={closeLicenseModal}>Cancel</button>
                <button type="submit" disabled={generating}>
                  <Plus size={15} />
                  {generating ? "Generating..." : "Generate License"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="project-sale-list">
        <div className="project-sale-list-header">
          <div><h2>Sales Records</h2><p>Project sales and licensing actions.</p></div>
          <div><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sales..." /></div>
        </div>
        <div className="project-sale-table-wrap">
          <table>
            <thead><tr><th>Project</th><th>Customer</th><th>Price</th><th>Paid</th><th>Remaining</th><th>Sale Type</th><th>Notes</th><th>Action</th></tr></thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id}>
                  <td><strong>{sale.projectName}</strong></td>
                  <td><span>{sale.customerName}</span><small>{sale.customerPhone || "-"}</small></td>
                  <td>{money(sale.price, sale.currency)}</td>
                  <td>{money(sale.paid, sale.currency)}</td>
                  <td>{money(sale.remaining, sale.currency)}</td>
                  <td><span className={`project-sale-pill ${sale.saleType}`}>{sale.saleType === "forever" ? "Permanent Sale" : "License Sale"}</span></td>
                  <td>{sale.notes || "-"}</td>
                  <td>
                    <div className="project-sale-row-actions">
                      {sale.saleType === "license" && (
                        <button type="button" onClick={() => openLicenseModal(sale)} title="Give License" aria-label="Give License">
                          <FileKey2 size={14} />
                        </button>
                      )}
                      <button type="button" onClick={() => editSale(sale)} title="Edit" aria-label="Edit"><Pencil size={14} /></button>
                      <button
  type="button"
  className="danger"
  onClick={() => setDeleteTarget(sale)}
  title="Delete"
  aria-label="Delete"
>
  <Trash2 size={14} />
</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredSales.length && <tr><td colSpan="8" className="project-sale-empty">No project sales registered yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {deleteTarget && (
  <div
    className="project-sale-delete-backdrop"
    role="presentation"
    onMouseDown={() => {
      if (!deletingSale) {
        setDeleteTarget(null);
      }
    }}
  >
    <div
      className="project-sale-delete-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-sale-title"
      onMouseDown={(event) =>
        event.stopPropagation()
      }
    >
      <div className="project-sale-delete-icon">
        <Trash2 size={25} />
      </div>

      <span>Delete Project Sale</span>

      <h2 id="delete-sale-title">
        Delete this sale record?
      </h2>

      <p>
        You are about to permanently delete the
        sale of
        <strong>
          {deleteTarget.projectName ||
            "this project"}
        </strong>
        for
        <strong>
          {deleteTarget.customerName ||
            "this customer"}
        </strong>
        .
      </p>

      <div className="project-sale-delete-summary">
        <div>
          <span>Project</span>
          <strong>
            {deleteTarget.projectName || "-"}
          </strong>
        </div>

        <div>
          <span>Customer</span>
          <strong>
            {deleteTarget.customerName || "-"}
          </strong>
        </div>

        <div>
          <span>Price</span>
          <strong>
            {money(
              deleteTarget.price,
              deleteTarget.currency
            )}
          </strong>
        </div>

        <div>
          <span>Paid</span>
          <strong>
            {money(
              deleteTarget.paid,
              deleteTarget.currency
            )}
          </strong>
        </div>
      </div>

      <div className="project-sale-delete-warning">
        The linked income record and generated
        licenses will also be deleted. This action
        cannot be undone.
      </div>

      <div className="project-sale-delete-actions">
        <button
          type="button"
          disabled={deletingSale}
          onClick={() =>
            setDeleteTarget(null)
          }
        >
          Cancel
        </button>

        <button
          type="button"
          className="danger"
          disabled={deletingSale}
          onClick={deleteSale}
        >
          <Trash2 size={15} />

          {deletingSale
            ? "Deleting..."
            : "Delete Sale"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default ProjectSales;
