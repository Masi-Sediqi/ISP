import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BadgeDollarSign,
  BarChart3,
  CalendarDays,
  FileText,
  HandCoins,
  History,
  Mail,
  MapPin,
  Phone,
  Plus,
  ReceiptText,
  TrendingUp,
  Trash2,
  X,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { getRecordIdentity } from "../utils/recycleBin";
import {
  normalizeCustomerName,
  normalizeCustomerPhone,
} from "../utils/customerIdentity";
import {
  addCustomerStageOption,
  buildCustomerStageOptions,
  createCustomerStageHistoryRecord,
  removeCustomerStageOption,
  stageAfterHistoryDeletion,
  stageLabel,
} from "../utils/customerStage";
import { formatCurrencyAmount } from "../utils/currencyDisplay";
import "./CustomerDetails.css";

const TABS = [
  ["overview", "Overview", UserRound],
  ["visits", "Visits", CalendarDays],
  ["contracts", "Contracts", FileText],
  ["payments", "Payments", HandCoins],
  ["profit", "Profit", TrendingUp],
  ["analyze", "Analyze", BarChart3],
  ["stage-history", "Stage History", History],
  ["activity", "Activity", Activity],
];

function nameOf(record) {
  return (
    record?.fullName ||
    record?.passportFullName ||
    record?.customerName ||
    record?.personName ||
    record?.name ||
    ""
  );
}

function phoneOf(record) {
  return record?.phone || record?.customerPhone || record?.phoneNumber || "";
}

function numberOf(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function dateOf(record) {
  return (
    record?.date ||
    record?.saleDate ||
    record?.startDate ||
    record?.afghanistanDate ||
    (record?.createdAt ? String(record.createdAt).slice(0, 10) : "") ||
    "-"
  );
}

function timeOf(record) {
  return record?.time || record?.afghanistanTime || "";
}

function money(value, currency = "AFN") {
  return formatCurrencyAmount(value, currency || "AFN");
}

function customerMatches(record, customer) {
  if (!record || !customer) return false;

  const recordCustomerId = record.customerId;
  const customerId = customer.id || customer.customerId;
  if (recordCustomerId && customerId && String(recordCustomerId) === String(customerId)) {
    return true;
  }

  const customerName = normalizeCustomerName(nameOf(customer));
  const customerPhone = normalizeCustomerPhone(phoneOf(customer));
  const recordName = normalizeCustomerName(nameOf(record));
  const recordPhone = normalizeCustomerPhone(phoneOf(record));

  if (recordName && customerName && recordPhone && customerPhone) {
    return recordName === customerName && recordPhone === customerPhone;
  }

  return false;
}

function eventTimestamp(record) {
  const value = record?.createdAt || record?.updatedAt || record?.saleDate || record?.date || record?.startDate;
  const parsed = value ? new Date(value).getTime() : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function EmptyState({ text }) {
  return <div className="customer-portal-empty">{text}</div>;
}

export default function CustomerDetails({ currentUser }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteRequest, setDeleteRequest] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const [stageChoice, setStageChoice] = useState("");
  const [newStageName, setNewStageName] = useState("");
  const [stageNote, setStageNote] = useState("");
  const [stageSaving, setStageSaving] = useState(false);
  const [stageOptionSaving, setStageOptionSaving] = useState(false);

  const [customers, setCustomers, , customersLoaded] = useJsonCollection("customers");
  const [visits, setVisits] = useJsonCollection("customerVisits");
  const [projects, setProjects] = useJsonCollection("projects");
  const [sales, setSales] = useJsonCollection("projectSales");
  const [transactions, setTransactions] = useJsonCollection("transactions");
  const [customerPayments, setCustomerPayments] = useJsonCollection("customerPayments");
  const [stageHistory, setStageHistory] = useJsonCollection("customerStageHistory");
  const [stageConfigs, setStageConfigs] = useJsonCollection("customerStageConfig");

  const customer = useMemo(
    () => customers.find((item) => String(item.id || item.customerId || "") === String(id || "")),
    [customers, id]
  );

  const linkedVisits = useMemo(
    () => visits.filter((record) => String(record.customerId || "") === String(id || "") || customerMatches(record, customer)),
    [visits, id, customer]
  );

  const linkedProjects = useMemo(
    () => projects.filter((record) => customerMatches(record, customer)),
    [projects, customer]
  );

  const linkedSales = useMemo(
    () => sales.filter((record) => customerMatches(record, customer)),
    [sales, customer]
  );

  const saleIds = useMemo(() => new Set(linkedSales.map((sale) => String(sale.id || ""))), [linkedSales]);

  const linkedTransactions = useMemo(
    () => transactions.filter((record) => {
      if (record.source === "project-sale" && saleIds.has(String(record.referenceId || ""))) return true;
      return customerMatches(record, customer);
    }),
    [transactions, customer, saleIds]
  );

  const linkedLegacyPayments = useMemo(
    () => customerPayments.filter((record) => customerMatches(record, customer)),
    [customerPayments, customer]
  );

  const linkedStageHistory = useMemo(
    () =>
      stageHistory
        .filter((record) =>
          String(record.customerId || "") === String(id || "") || customerMatches(record, customer)
        )
        .sort((a, b) => eventTimestamp(b) - eventTimestamp(a)),
    [stageHistory, id, customer]
  );

  const totalSales = linkedSales.reduce((sum, sale) => sum + numberOf(sale.total, sale.price), 0);
  const paidFromSales = linkedSales.reduce((sum, sale) => sum + numberOf(sale.paid), 0);
  const remainingFromSales = linkedSales.reduce((sum, sale) => sum + numberOf(sale.remaining), 0);

  const extraPayments = linkedLegacyPayments.reduce((sum, payment) => {
    const direction = String(payment.direction || payment.paymentDirection || "").toLowerCase();
    return direction === "us-to-customer" ? sum : sum + numberOf(payment.amount, payment.paidAmount);
  }, 0);

  const linkedIncome = linkedTransactions
    .filter((record) => String(record.type || "").toLowerCase() === "income")
    .reduce((sum, record) => sum + numberOf(record.amount), 0);

  const linkedExpense = linkedTransactions
    .filter((record) => String(record.type || "").toLowerCase() === "expense")
    .reduce((sum, record) => sum + numberOf(record.amount), 0);

  const displayedPaid = Math.max(paidFromSales + extraPayments, linkedIncome);
  const displayedRemaining = Math.max(remainingFromSales - extraPayments, 0);
  const profit = linkedIncome - linkedExpense;
  const currency = linkedSales[0]?.currency || customer?.unit || customer?.currencyUnit || "AFN";

  const activityRows = useMemo(() => {
    const rows = [
      ...linkedVisits.map((record) => ({ ...record, sourceCollection: "customerVisits", activityType: "Visit", activityTitle: record.purpose || "Customer visit" })),
      ...linkedProjects.map((record) => ({ ...record, sourceCollection: "projects", activityType: "Contract", activityTitle: record.projectName || record.name || "Project contract" })),
      ...linkedSales.map((record) => ({ ...record, sourceCollection: "projectSales", activityType: "Sale", activityTitle: record.projectName || "Project sale" })),
      ...linkedTransactions.map((record) => ({ ...record, sourceCollection: "transactions", activityType: record.type === "expense" ? "Expense" : "Payment", activityTitle: record.title || record.category || "Financial activity" })),
    ];
    return rows.sort((a, b) => eventTimestamp(b) - eventTimestamp(a));
  }, [linkedVisits, linkedProjects, linkedSales, linkedTransactions]);

  const firstActivity = activityRows.length ? activityRows[activityRows.length - 1] : customer;
  const lastActivity = activityRows.length ? activityRows[0] : customer;
  const paymentRate = totalSales > 0 ? Math.min(100, Math.round((displayedPaid / totalSales) * 100)) : 0;
  const deliveredContracts = linkedProjects.filter((record) => String(record.status || "").toLowerCase() === "delivered").length;
  const currentStage = stageLabel(customer?.customerStage);
  const stageConfig = stageConfigs.find((record) => String(record?.id || "") === "global") || { id: "global", customStages: [], hiddenStages: [] };
  const availableStages = buildCustomerStageOptions(stageConfig);

  const openStageEditor = () => {
    setStageChoice(availableStages.includes(currentStage) ? currentStage : "");
    setNewStageName("");
    setStageNote("");
    setStageOpen(true);
  };

  const persistStageConfig = async (nextConfig) => {
    const nextConfigs = stageConfigs.some((record) => String(record?.id || "") === "global")
      ? stageConfigs.map((record) => String(record?.id || "") === "global" ? nextConfig : record)
      : [nextConfig, ...stageConfigs];
    return setStageConfigs(nextConfigs);
  };

  const addStageOption = async () => {
    const stage = String(newStageName || "").trim();
    if (!stage || stageOptionSaving) return;
    if (availableStages.some((item) => item.toLocaleLowerCase() === stage.toLocaleLowerCase())) {
      notify("This stage already exists.", "info");
      setStageChoice(availableStages.find((item) => item.toLocaleLowerCase() === stage.toLocaleLowerCase()) || stage);
      setNewStageName("");
      return;
    }

    setStageOptionSaving(true);
    try {
      const nextConfig = addCustomerStageOption(stageConfig, stage);
      const saved = await persistStageConfig(nextConfig);
      if (saved) {
        setStageChoice(stage);
        setNewStageName("");
        notify("Stage added successfully.", "success");
      }
    } finally {
      setStageOptionSaving(false);
    }
  };

  const deleteStageOption = async (stage) => {
    if (!stage || stage === "None" || stageOptionSaving) return;
    setStageOptionSaving(true);
    try {
      const nextConfig = removeCustomerStageOption(stageConfig, stage);
      const saved = await persistStageConfig(nextConfig);
      if (saved) {
        if (stageChoice === stage) setStageChoice("");
        notify("Stage removed from future choices.", "success");
      }
    } finally {
      setStageOptionSaving(false);
    }
  };

  const updateCustomerStage = async () => {
    if (!customer || stageSaving) return;
    if (!stageChoice) {
      notify("Please select a stage.", "error");
      return;
    }

    const nextStage = stageLabel(stageChoice);
    if (nextStage === currentStage) {
      notify("The customer is already in this stage.", "info");
      setStageOpen(false);
      return;
    }

    const customerKey = String(customer.id || customer.customerId || "");
    const updatedAt = new Date().toISOString();
    const previousCustomers = customers;
    const nextCustomers = customers.map((item) =>
      String(item.id || item.customerId || "") === customerKey
        ? { ...item, customerStage: nextStage, updatedAt }
        : item
    );
    const historyRecord = createCustomerStageHistoryRecord({
      customerId: customerKey,
      customerName: nameOf(customer),
      fromStage: currentStage,
      toStage: nextStage,
      note: stageNote,
      actor: currentUser,
      now: updatedAt,
    });

    setStageSaving(true);
    try {
      const customerSaved = await setCustomers(nextCustomers);
      if (!customerSaved) return;

      const historySaved = await setStageHistory([historyRecord, ...stageHistory]);
      if (!historySaved) {
        await setCustomers(previousCustomers);
        notify("Stage history could not be saved. The customer stage was restored.", "error");
        return;
      }

      setStageOpen(false);
      setStageChoice("");
      setNewStageName("");
      setStageNote("");
      notify("Customer stage updated successfully.", "success");
    } finally {
      setStageSaving(false);
    }
  };

  const requestDeleteRecord = (collection, record, label) => {
    setDeleteRequest({ collection, record, label });
  };

  const removeRecord = (items, record) => {
    const targetId = getRecordIdentity(record);
    return items.filter((item) => getRecordIdentity(item) !== targetId);
  };

  const handleDeleteRecord = async () => {
    if (!deleteRequest || deleting) return;
    const { collection, record } = deleteRequest;
    setDeleting(true);

    try {
      let saved = false;

      if (collection === "customerVisits") {
        saved = await setVisits(removeRecord(visits, record));
      } else if (collection === "projects") {
        saved = await setProjects(removeRecord(projects, record));
      } else if (collection === "customerPayments") {
        saved = await setCustomerPayments(removeRecord(customerPayments, record));
      } else if (collection === "transactions") {
        saved = await setTransactions(removeRecord(transactions, record));
      } else if (collection === "customerStageHistory") {
        const rollbackStage = stageAfterHistoryDeletion(linkedStageHistory, record);
        const customerKey = String(customer?.id || customer?.customerId || "");
        const previousCustomers = customers;
        const nextCustomers = customers.map((item) =>
          String(item.id || item.customerId || "") === customerKey
            ? { ...item, customerStage: rollbackStage, updatedAt: new Date().toISOString() }
            : item
        );
        const customerSaved = await setCustomers(nextCustomers);
        if (!customerSaved) {
          saved = false;
        } else {
          saved = await setStageHistory(removeRecord(stageHistory, record));
          if (!saved) await setCustomers(previousCustomers);
        }
      } else if (collection === "projectSales") {
        const saleId = String(record?.id || "");
        const relatedTransactions = transactions.filter(
          (item) =>
            item?.source === "project-sale" &&
            String(item?.referenceId || "") === saleId
        );
        const previousTransactions = transactions;
        const transactionsSaved = relatedTransactions.length
          ? await setTransactions(
              transactions.filter((item) => !relatedTransactions.includes(item))
            )
          : true;

        if (!transactionsSaved) {
          saved = false;
        } else {
          saved = await setSales(removeRecord(sales, record));
          if (!saved && relatedTransactions.length) {
            await setTransactions(previousTransactions);
          }
        }
      }

      if (saved) {
        notify("Record deleted successfully.", "success");
        setDeleteRequest(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  if (!customersLoaded) {
    return <div className="customer-portal-loading">Loading customer information...</div>;
  }

  if (!customer) {
    return (
      <div className="customer-portal-not-found">
        <h2>Customer not found</h2>
        <button type="button" onClick={() => navigate("/customers")}>Back to Customers</button>
      </div>
    );
  }

  const customerName = nameOf(customer) || "Unnamed Customer";
  const summaryCards = [
    ["Visits", linkedVisits.length + 1, CalendarDays],
    ["Contracts", linkedProjects.length, FileText],
    ["Total Sales", money(totalSales, currency), ReceiptText],
    ["Paid", money(displayedPaid, currency), WalletCards],
    ["Remaining", money(displayedRemaining, currency), BadgeDollarSign],
    ["Profit", money(profit, currency), TrendingUp],
  ];

  return (
    <div className="customer-portal-page">
      <div className="customer-portal-topbar">
        <button type="button" className="customer-back-button" onClick={() => navigate("/customers")}>
          <ArrowLeft size={17} /> Back to Customers
        </button>
      </div>

      <section className="customer-portal-hero">
        <div className="customer-avatar">{customerName.slice(0, 1).toUpperCase()}</div>
        <div className="customer-hero-copy">
          <span>Customer 360°</span>
          <h1>{customerName}</h1>
          <div className="customer-hero-meta">
            {phoneOf(customer) && <span><Phone size={14} /> {phoneOf(customer)}</span>}
            {customer.email && <span><Mail size={14} /> {customer.email}</span>}
            {(customer.city || customer.country) && <span><MapPin size={14} /> {[customer.city, customer.country].filter(Boolean).join(", ")}</span>}
          </div>
        </div>
        <div className="customer-stage-box">
          <div>
            <small>Current Stage</small>
            <strong>{currentStage}</strong>
          </div>
          <button
            type="button"
            onClick={openStageEditor}
            aria-label="Change customer stage"
            title="Change customer stage"
          >
            <Plus size={17} />
          </button>
        </div>
        <div className="customer-status-box">
          <small>Customer Type</small>
          <strong>{customer.customerType || "General"}</strong>
          <span>{customer.needFollowup === "Yes" ? "Follow-up required" : "Active record"}</span>
        </div>
      </section>

      <div className="customer-summary-grid">
        {summaryCards.map(([label, value, Icon]) => (
          <div className="customer-summary-card" key={label}>
            <span><Icon size={17} /></span>
            <div><small>{label}</small><strong>{value}</strong></div>
          </div>
        ))}
      </div>

      <div className="customer-tabs" role="tablist">
        {TABS.map(([key, label, Icon]) => (
          <button key={key} type="button" className={activeTab === key ? "active" : ""} onClick={() => setActiveTab(key)}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <section className="customer-tab-panel">
        {activeTab === "overview" && (
          <div className="customer-overview-layout">
            <div className="customer-info-card">
              <h3>Customer Information</h3>
              <div className="customer-info-grid">
                {[
                  ["Full Name", customerName],
                  ["Phone", phoneOf(customer) || "-"],
                  ["Email", customer.email || "-"],
                  ["Source", customer.source || "-"],
                  ["City / Province", customer.city || "-"],
                  ["Country", customer.country || "-"],
                  ["Language", customer.language || "-"],
                  ["Call Type", customer.callType || "-"],
                  ["Service", customer.technologyPurpose || customer.scholarshipType || customer.mediaPurpose || customer.businessType || "-"],
                  ["Unit / Price", customer.price ? money(customer.price, customer.unit || "AFN") : "-"],
                  ["Registered", `${customer.afghanistanDate || dateOf(customer)} ${customer.afghanistanTime || timeOf(customer)}`.trim()],
                  ["Created By", customer.createdByName || customer.sourceEmployeeName || "-"],
                ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
              </div>
            </div>
            <div className="customer-note-card">
              <h3>Purpose & Notes</h3>
              <label>Purpose</label>
              <p>{customer.purpose || customer.technologyPurpose || "No purpose recorded."}</p>
              <label>Notes</label>
              <p>{customer.note || customer.notes || "No notes recorded."}</p>
            </div>
          </div>
        )}

        {activeTab === "visits" && (
          <div className="customer-data-table"><table><thead><tr><th>Date</th><th>Employee</th><th>Purpose</th><th>Follow-up</th><th>Notes</th><th>Action</th></tr></thead><tbody>
            <tr><td>{dateOf(customer)} {timeOf(customer)}</td><td>{customer.createdByName || "-"}</td><td>{customer.purpose || "Initial registration"}</td><td>{customer.needFollowup || "No"}</td><td>{customer.note || "-"}</td><td><span className="customer-record-core">Main</span></td></tr>
            {linkedVisits.map((visit) => <tr key={visit.id}><td>{dateOf(visit)} {timeOf(visit)}</td><td>{visit.sourceEmployeeName || "-"}</td><td>{visit.purpose || "Revisit"}</td><td>{visit.needFollowup || "No"}</td><td>{visit.note || "-"}</td><td><button type="button" className="customer-record-delete" title="Delete visit" onClick={() => requestDeleteRecord("customerVisits", visit, "visit record")}><Trash2 size={15} /></button></td></tr>)}
          </tbody></table></div>
        )}

        {activeTab === "contracts" && (
          linkedProjects.length ? <div className="customer-data-table"><table><thead><tr><th>Project</th><th>Status</th><th>Start</th><th>Due</th><th>Price</th><th>Action</th></tr></thead><tbody>
            {linkedProjects.map((project) => <tr key={project.id}><td><strong>{project.projectName || project.name || "Project"}</strong></td><td>{project.status || "-"}</td><td>{project.startDate || dateOf(project)}</td><td>{project.dueDate || "-"}</td><td>{money(numberOf(project.price, project.totalAmount), project.unit || project.currency || "AFN")}</td><td><button type="button" className="customer-record-delete" title="Delete contract" onClick={() => requestDeleteRecord("projects", project, "contract / project")}><Trash2 size={15} /></button></td></tr>)}
          </tbody></table></div> : <EmptyState text="No contracts or projects are linked to this customer yet." />
        )}

        {activeTab === "payments" && (
          linkedSales.length || linkedLegacyPayments.length ? <div className="customer-data-table"><table><thead><tr><th>Date</th><th>Reference</th><th>Total</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Action</th></tr></thead><tbody>
            {linkedSales.map((sale) => <tr key={sale.id}><td>{sale.saleDate || dateOf(sale)}</td><td>{sale.projectName || "Project Sale"}</td><td>{money(numberOf(sale.total, sale.price), sale.currency)}</td><td>{money(numberOf(sale.paid), sale.currency)}</td><td>{money(numberOf(sale.remaining), sale.currency)}</td><td><span className={`customer-payment-status ${Number(sale.remaining || 0) > 0 ? "loan" : "paid"}`}>{sale.paymentStatus || (Number(sale.remaining || 0) > 0 ? "Loan" : "Paid")}</span></td><td><button type="button" className="customer-record-delete" title="Delete sale" onClick={() => requestDeleteRecord("projectSales", sale, "project sale / bill")}><Trash2 size={15} /></button></td></tr>)}
            {linkedLegacyPayments.map((payment) => <tr key={`payment-${payment.id}`}><td>{dateOf(payment)}</td><td>{payment.title || "Customer Payment"}</td><td>-</td><td>{money(numberOf(payment.amount, payment.paidAmount), payment.currency || currency)}</td><td>-</td><td><span className="customer-payment-status paid">Payment</span></td><td><button type="button" className="customer-record-delete" title="Delete payment" onClick={() => requestDeleteRecord("customerPayments", payment, "customer payment")}><Trash2 size={15} /></button></td></tr>)}
          </tbody></table></div> : <EmptyState text="No payments are recorded for this customer yet." />
        )}

        {activeTab === "profit" && (
          <div className="customer-profit-grid">
            <div><span>Linked Income</span><strong>{money(linkedIncome, currency)}</strong><small>Income records directly linked to this customer or their project sales.</small></div>
            <div><span>Linked Expenses</span><strong>{money(linkedExpense, currency)}</strong><small>Only expenses that are directly linked to the customer are included.</small></div>
            <div className="profit-total"><span>Net Profit</span><strong>{money(profit, currency)}</strong><small>Income minus linked expenses.</small></div>
          </div>
        )}

        {activeTab === "analyze" && (
          <div className="customer-analyze-grid">
            <div><span>Payment Completion</span><strong>{paymentRate}%</strong><div className="customer-progress"><i style={{ width: `${paymentRate}%` }} /></div></div>
            <div><span>Delivered Contracts</span><strong>{deliveredContracts} / {linkedProjects.length}</strong><small>Projects marked Delivered.</small></div>
            <div><span>Total Visits</span><strong>{linkedVisits.length + 1}</strong><small>Includes the original registration.</small></div>
            <div><span>First Activity</span><strong>{dateOf(firstActivity)}</strong><small>Earliest linked customer activity.</small></div>
            <div><span>Last Activity</span><strong>{dateOf(lastActivity)}</strong><small>Most recent linked customer activity.</small></div>
            <div><span>Outstanding Balance</span><strong>{money(displayedRemaining, currency)}</strong><small>Current unpaid amount from project sales.</small></div>
          </div>
        )}

        {activeTab === "stage-history" && (
          linkedStageHistory.length ? (
            <div className="customer-data-table">
              <table>
                <thead><tr><th>Date & Time</th><th>Previous Stage</th><th>New Stage</th><th>Changed By</th><th>Notes</th><th>Action</th></tr></thead>
                <tbody>
                  {linkedStageHistory.map((record) => (
                    <tr key={record.id}>
                      <td>{record.date || dateOf(record)} {record.time || timeOf(record)}</td>
                      <td>{stageLabel(record.fromStage)}</td>
                      <td><strong>{stageLabel(record.toStage)}</strong></td>
                      <td>{record.changedByName || "-"}</td>
                      <td>{record.note || "-"}</td>
                      <td><button type="button" className="customer-record-delete" title="Delete stage history" onClick={() => requestDeleteRecord("customerStageHistory", record, "stage history record")}><Trash2 size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <EmptyState text="No customer stage changes have been recorded yet." />
        )}

        {activeTab === "activity" && (
          activityRows.length ? <div className="customer-activity-list">
            {activityRows.map((row, index) => <div className="customer-activity-item" key={`${row.activityType}-${row.id || index}`}><span className="activity-dot" /><div><strong>{row.activityTitle}</strong><small>{row.activityType} • {dateOf(row)} {timeOf(row)}</small><p>{row.description || row.note || row.notes || row.status || ""}</p></div>{row.amount != null && <b>{money(row.amount, row.currency || currency)}</b>}<button type="button" className="customer-record-delete activity-delete" title="Delete activity record" onClick={() => requestDeleteRecord(row.sourceCollection, row, row.activityTitle || "activity record")}><Trash2 size={15} /></button></div>)}
          </div> : <EmptyState text="No linked activity is available yet." />
        )}
      </section>

      {stageOpen && (
        <div className="customer-stage-dialog-backdrop" role="presentation" onMouseDown={() => !stageSaving && setStageOpen(false)}>
          <div className="customer-stage-dialog" role="dialog" aria-modal="true" aria-labelledby="customer-stage-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="customer-stage-dialog-head">
              <div>
                <h3 id="customer-stage-title">Change Customer Stage</h3>
                <p>Choose a stage or enter your own custom stage.</p>
              </div>
              <button type="button" onClick={() => !stageSaving && setStageOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>

            <label className="customer-stage-field">
              <span>Stage</span>
              <select value={stageChoice} onChange={(event) => setStageChoice(event.target.value)}>
                <option value="" disabled>Select stage</option>
                {availableStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
              </select>
            </label>

            <div className="customer-stage-manager">
              <div className="customer-stage-manager-title">
                <div><strong>Add / Manage Stages</strong><small>Create a new stage or remove stages you no longer need.</small></div>
              </div>
              <div className="customer-stage-add-row">
                <input value={newStageName} onChange={(event) => setNewStageName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addStageOption(); } }} placeholder="Enter new stage name..." />
                <button type="button" onClick={addStageOption} disabled={!String(newStageName || "").trim() || stageOptionSaving}><Plus size={16} /> Add</button>
              </div>
              <div className="customer-stage-option-list">
                {availableStages.map((stage) => (
                  <div className={`customer-stage-option-item ${stageChoice === stage ? "selected" : ""}`} key={stage}>
                    <button type="button" className="stage-name" onClick={() => setStageChoice(stage)}>{stage}</button>
                    {stage !== "None" && <button type="button" className="stage-delete" title={`Delete ${stage}`} aria-label={`Delete ${stage}`} disabled={stageOptionSaving} onClick={() => deleteStageOption(stage)}><Trash2 size={14} /></button>}
                  </div>
                ))}
              </div>
            </div>

            <label className="customer-stage-field">
              <span>Notes <small>(optional)</small></span>
              <textarea value={stageNote} onChange={(event) => setStageNote(event.target.value)} placeholder="Reason or note for this stage change..." rows={3} />
            </label>

            <div className="customer-stage-dialog-actions">
              <button type="button" className="cancel" disabled={stageSaving} onClick={() => setStageOpen(false)}>Cancel</button>
              <button type="button" className="save" disabled={stageSaving || !stageChoice} onClick={updateCustomerStage}>{stageSaving ? "Saving..." : "Save Stage"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteRequest && (
        <div className="customer-delete-dialog-backdrop" role="presentation" onMouseDown={() => !deleting && setDeleteRequest(null)}>
          <div className="customer-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="customer-delete-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="customer-delete-dialog-icon"><Trash2 size={21} /></div>
            <h3 id="customer-delete-title">Delete record?</h3>
            <p>{deleteRequest.collection === "customerStageHistory" ? "Deleting this stage history record will also restore the customer to the latest previous stage." : `Are you sure you want to delete this ${deleteRequest.label || "record"}? It will be moved to Recycle Bin.`}</p>
            <div className="customer-delete-dialog-actions">
              <button type="button" className="cancel" disabled={deleting} onClick={() => setDeleteRequest(null)}>Cancel</button>
              <button type="button" className="delete" disabled={deleting} onClick={handleDeleteRecord}>{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
