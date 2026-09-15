import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  Mail,
  Minus,
  Plus,
  Printer,
  ReceiptText,
  Search,
  ShoppingCart,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { useEmployeeAdjustments } from "../hooks/useEmployeeAdjustments";
import { createId } from "../utils/createId";
import CustomerSearchSelect from "../components/CustomerSearchSelect";
import {
  applyLicensePackage,
  applySaleType,
  buildSaleItem,
  calculateSalePayment,
  saleToEditableForm,
} from "../utils/projectSalesLogic";
import { notify } from "../utils/notify";
import { clearFieldError, hasFormErrors, validateRequiredFields } from "../utils/formValidation";
import { formatCurrencyAmount } from "../utils/currencyDisplay";
import "./ProjectSales.css";

function money(value, currency = "AFN") {
  return formatCurrencyAmount(value, currency);
}

function projectPrice(project) {
  return Number(project?.budget || project?.price || project?.amount || 0);
}

function lineTotal(item) {
  return Math.max(
    Number(item.price || 0) * Number(item.quantity || 0) - Number(item.discount || 0),
    0
  );
}

const emptyCustomer = {
  customerId: "",
  customerName: "",
  customerPhone: "",
  notes: "",
};

const emptyNewCustomer = {
  customerName: "",
  phone: "",
  email: "",
  address: "",
  sourceEmployeeId: "",
};

function customerNameOf(customer) {
  return (
    customer?.customerName ||
    customer?.fullName ||
    customer?.name ||
    customer?.passportFullName ||
    customer?.phone ||
    "Unnamed Customer"
  );
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function ProjectSales() {
  const navigate = useNavigate();
  const [projects] = useJsonCollection("projects");
  const [technologyPackages] = useJsonCollection("technologyPackages");
  const [customers, setCustomers] = useJsonCollection("customers");
  const [employees] = useJsonCollection("employees");
  const [sales, setSales] = useJsonCollection("projectSales");
  const [transactions, setTransactions] = useJsonCollection("transactions");
  const [cashWalletTransactions, setCashWalletTransactions] = useJsonCollection("cashWalletTransactions");
  const [employeeAdjustments, setEmployeeAdjustments] = useEmployeeAdjustments();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [customer, setCustomer] = useState(emptyCustomer);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState(emptyNewCustomer);
  const [formErrors, setFormErrors] = useState({});
  const [newCustomerErrors, setNewCustomerErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [paymentMode, setPaymentMode] = useState("paid");
  const [loanPaidAmount, setLoanPaidAmount] = useState("");
  const [editingSaleId, setEditingSaleId] = useState("");

  const filteredProjects = useMemo(() => {
    const search = query.trim().toLowerCase();
    const rows = [...projects].sort((a, b) =>
      String(a.projectName || "").localeCompare(String(b.projectName || ""))
    );

    if (!search) return rows.slice(0, 10);

    return rows.filter((project) =>
      [
        project.projectName,
        project.customerName,
        project.customerPhone,
        project.status,
        project.priority,
        project.notes,
      ].some((value) => String(value || "").toLowerCase().includes(search))
    );
  }, [projects, query]);

  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
    const discount = items.reduce((sum, item) => sum + Number(item.discount || 0), 0);
    const total = items.reduce((sum, item) => sum + lineTotal(item), 0);
    const quantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

    return { subtotal, discount, total, quantity };
  }, [items]);

  const currency = items[0]?.currency || "AFN";
  const selectedCustomer = customers.find(
    (item) => String(item.id || item.customerId || "") === String(customer.customerId || "")
  );
  const sourceEmployee = findSourceEmployee(selectedCustomer);
  const sourcePercentage = Number(
    sourceEmployee?.salaryPercentage || sourceEmployee?.percentage || 0
  );
  const sourceShare =
    sourceEmployee &&
    normalize(sourceEmployee.salaryType) === "percentage" &&
    sourcePercentage > 0 &&
    sourcePercentage <= 100
      ? Math.round(totals.total * sourcePercentage) / 100
      : 0;

  useEffect(() => {
    const editId = sessionStorage.getItem("projectSaleEditId");
    if (!editId || !sales.length) return;

    const sale = sales.find((item) => String(item.id) === String(editId));
    sessionStorage.removeItem("projectSaleEditId");

    if (!sale) {
      notify("Selected bill was not found.", "error");
      return;
    }

    const editable = saleToEditableForm(sale);
    setEditingSaleId(sale.id);
    setItems(editable.items);
    setCustomer(editable.customer);
    setPaymentMode(editable.paymentMode);
    setLoanPaidAmount(editable.loanPaidAmount);
    setQuery("");
  }, [sales]);

  function findSourceEmployee(customerRecord) {
    if (!customerRecord) return null;
    const sourceEmployeeId = String(customerRecord.sourceEmployeeId || "");

    if (sourceEmployeeId) {
      const byId = employees.find(
        (employee) => String(employee.id || employee.employeeId || "") === sourceEmployeeId
      );
      if (byId) return byId;
    }

    const sourceName = normalize(
      customerRecord.sourceEmployeeName ||
        customerRecord.source ||
        customerRecord.createdByName
    );

    if (!sourceName) return null;

    return (
      employees.find((employee) =>
        [
          employee.fullName,
          employee.employeeName,
          employee.name,
          employee.email,
          employee.username,
        ]
          .map(normalize)
          .includes(sourceName)
      ) || null
    );
  }

  function selectProject(project) {
    setFormErrors((current) => clearFieldError(clearFieldError(current, "items"), "total"));
    const id = String(project.id || project.projectId || project.projectName);
    const existing = items.find((item) => String(item.projectId) === id);

    if (existing) {
      setItems((current) =>
        current.map((item) =>
          String(item.projectId) === id
            ? { ...item, quantity: Number(item.quantity || 0) + 1 }
            : item
        )
      );
      return;
    }

    setItems((current) => [...current, buildSaleItem(project)]);
  }

  function updateItem(projectId, field, value) {
    setFormErrors((current) => clearFieldError(current, "total"));
    setItems((current) =>
      current.map((item) => {
        if (String(item.projectId) !== String(projectId)) return item;
        const nextValue =
          field === "quantity"
            ? Math.max(1, Number(value || 1))
            : Math.max(0, Number(value || 0));
        return { ...item, [field]: nextValue };
      })
    );
  }

  function projectLicensePackages(projectId) {
    return technologyPackages.filter(
      (item) => String(item.projectId || "") === String(projectId || "")
    );
  }

  function updateSaleType(projectId, saleType) {
    setItems((current) =>
      current.map((item) =>
        String(item.projectId) === String(projectId) ? applySaleType(item, saleType) : item
      )
    );
  }

  function updateLicensePackage(projectId, packageId) {
    const pkg = technologyPackages.find((item) => String(item.id) === String(packageId));
    if (!pkg) return;
    setItems((current) =>
      current.map((item) =>
        String(item.projectId) === String(projectId) ? applyLicensePackage(item, pkg) : item
      )
    );
  }

  function removeItem(projectId) {
    setItems((current) =>
      current.filter((item) => String(item.projectId) !== String(projectId))
    );
  }

  function updateCustomer(event) {
    const { name, value } = event.target;

    if (name === "customerId") {
      setFormErrors((current) => clearFieldError(current, "customerId"));
      const record = customers.find(
        (item) => String(item.id || item.customerId || "") === String(value)
      );
      setCustomer({
        customerId: value,
        customerName: customerNameOf(record),
        customerPhone: record?.phone || record?.customerPhone || "",
        notes: customer.notes,
      });
      return;
    }

    setCustomer((current) => ({ ...current, [name]: value }));
  }

  function updateNewCustomer(event) {
    const { name, value } = event.target;
    setNewCustomerErrors((current) => clearFieldError(current, name));
    setNewCustomer((current) => ({ ...current, [name]: value }));
  }

  async function saveNewCustomer(event) {
    event.preventDefault();

    const errors = validateRequiredFields(newCustomer, ["customerName"]);
    setNewCustomerErrors(errors);
    if (hasFormErrors(errors)) {
      return;
    }

    const source = employees.find(
      (employee) => String(employee.id || employee.employeeId || "") === String(newCustomer.sourceEmployeeId)
    );
    const record = {
      id: createId(),
      customerId: `CUST-${Date.now().toString().slice(-6)}`,
      customerName: newCustomer.customerName.trim(),
      phone: newCustomer.phone.trim(),
      email: newCustomer.email.trim(),
      address: newCustomer.address.trim(),
      sourceEmployeeId: source?.id || source?.employeeId || "",
      sourceEmployeeName:
        source?.fullName || source?.employeeName || source?.name || "",
      status: "Active",
      registrationDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await setCustomers([...customers, record]);
    if (!saved) return;

    setCustomer({
      customerId: record.id,
      customerName: record.customerName,
      customerPhone: record.phone,
      notes: customer.notes,
    });
    setNewCustomer(emptyNewCustomer);
    setNewCustomerErrors({});
    setShowCustomerForm(false);
    notify("Customer registered successfully.", "success");
  }

  async function saveSale({ print = false } = {}) {
    const errors = validateRequiredFields(
      {
        items,
        customerId: selectedCustomer ? customer.customerId : "",
        total: totals.total,
      },
      [
        "items",
        "customerId",
        { field: "total", invalid: (value) => Number(value || 0) <= 0 },
      ]
    );

    if (items.some((item) => item.saleType === "license" && !item.licensePackageId)) {
      errors.items = "Select a license package for every project sold as a license.";
    }

    setFormErrors(errors);
    if (hasFormErrors(errors)) return;

    setSaving(true);

    const payment = calculateSalePayment(totals.total, paymentMode, loanPaidAmount);
    const now = new Date().toISOString();
    const saleId = editingSaleId || createId();
    const firstItem = items[0];
    const previousSale = sales.find((sale) => String(sale.id) === String(saleId));
    const saleRecord = {
      ...previousSale,
      id: saleId,
      projectId: firstItem.projectId,
      projectName:
        items.length === 1 ? firstItem.projectName : `${firstItem.projectName} +${items.length - 1}`,
      customerId: selectedCustomer.id || selectedCustomer.customerId || customer.customerId,
      customerName: customerNameOf(selectedCustomer),
      customerPhone: selectedCustomer.phone || selectedCustomer.customerPhone || "",
      customerEmail: selectedCustomer.email || "",
      sourceEmployeeId: selectedCustomer.sourceEmployeeId || sourceEmployee?.id || "",
      sourceEmployeeName:
        selectedCustomer.sourceEmployeeName ||
        sourceEmployee?.fullName ||
        sourceEmployee?.employeeName ||
        sourceEmployee?.name ||
        "",
      price: String(totals.total),
      paid: String(payment.paidAmount),
      remaining: String(payment.remainingAmount),
      paymentMode,
      paymentStatus: payment.paymentStatus,
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: totals.total,
      quantity: totals.quantity,
      currency,
      saleType: items.length === 1 ? items[0].saleType || "lifetime" : "mixed",
      licensePackageId: items.length === 1 ? items[0].licensePackageId || "" : "",
      licensePackageName: items.length === 1 ? items[0].licensePackageName || "" : "",
      notes: customer.notes,
      items: items.map((item) => ({
        ...item,
        subtotal: Number(item.price || 0) * Number(item.quantity || 0),
        total: lineTotal(item),
      })),
      saleDate: new Date().toISOString().slice(0, 10),
      createdAt: previousSale?.createdAt || now,
      updatedAt: now,
    };

    const nextSales = editingSaleId
      ? sales.map((sale) => (String(sale.id) === String(saleId) ? saleRecord : sale))
      : [...sales, saleRecord];
    const saved = await setSales(nextSales);

    if (!saved) {
      setSaving(false);
      return;
    }

    const transactionsWithoutSale = transactions.filter(
      (transaction) =>
        !(
          transaction.source === "project-sale" &&
          String(transaction.referenceId || "") === String(saleId)
        )
    );

    if (payment.paidAmount > 0) {
      await setTransactions([
        ...transactionsWithoutSale,
        {
        id: `project-sale-income-${saleId}`,
        type: "income",
        title: `Project Sale - ${saleRecord.projectName}`,
        category: "Project Sales",
        amount: payment.paidAmount,
        currency,
        date: saleRecord.saleDate,
        description: [
          saleRecord.customerName ? `Customer: ${saleRecord.customerName}` : "",
          saleRecord.customerPhone ? `Phone: ${saleRecord.customerPhone}` : "",
          `Projects: ${items.map((item) => item.projectName).join(", ")}`,
          `Total: ${totals.total} ${currency}`,
          `Paid: ${payment.paidAmount} ${currency}`,
          `Remaining: ${payment.remainingAmount} ${currency}`,
        ]
          .filter(Boolean)
          .join(" | "),
        source: "project-sale",
        referenceId: saleId,
        projectId: saleRecord.projectId,
        projectName: saleRecord.projectName,
        customerName: saleRecord.customerName,
        createdAt: now,
        updatedAt: now,
        },
      ]);
    } else if (editingSaleId) {
      await setTransactions(transactionsWithoutSale);
    }

    const walletWithoutSale = cashWalletTransactions.filter(
      (record) =>
        !(
          record.source === "project-sale" &&
          String(record.referenceId || "") === String(saleId)
        )
    );

    const nextWalletTransactions = payment.paidAmount > 0
      ? [
          ...walletWithoutSale,
          {
            id: `project-sale-wallet-${saleId}`,
            type: "deposit",
            amount: payment.paidAmount,
            currency,
            date: saleRecord.saleDate,
            description: `Project sale payment - ${saleRecord.projectName}${saleRecord.customerName ? ` | Customer: ${saleRecord.customerName}` : ""}`,
            source: "project-sale",
            referenceId: saleId,
            projectId: saleRecord.projectId,
            projectName: saleRecord.projectName,
            customerId: saleRecord.customerId,
            customerName: saleRecord.customerName,
            createdAt: previousSale?.createdAt || now,
            updatedAt: now,
          },
        ]
      : walletWithoutSale;

    const walletSaved = await setCashWalletTransactions(nextWalletTransactions);
    if (!walletSaved) {
      await setSales(sales);
      await setTransactions(transactions);
      setSaving(false);
      notify("Sale could not be added to Cash Wallet. Please try again.", "error");
      return;
    }

    const adjustmentsWithoutSale = employeeAdjustments.filter(
      (adjustment) =>
        !(
          adjustment.source === "project-sale-commission" &&
          String(adjustment.referenceId || "") === String(saleId)
        )
    );

    if (sourceShare > 0 && sourceEmployee) {
      await setEmployeeAdjustments([
        ...adjustmentsWithoutSale,
        {
          id: `project-sale-commission-${saleId}`,
          employeeId: sourceEmployee.id,
          employeeName:
            sourceEmployee.fullName ||
            sourceEmployee.employeeName ||
            sourceEmployee.name ||
            saleRecord.sourceEmployeeName,
          employeeEmail: sourceEmployee.email || "",
          employeeUsername: sourceEmployee.username || "",
          type: "credit",
          amount: sourceShare,
          currency,
          source: "project-sale-commission",
          referenceId: saleId,
          projectId: saleRecord.projectId,
          projectName: saleRecord.projectName,
          customerId: saleRecord.customerId,
          customerName: saleRecord.customerName,
          paidAmount: payment.paidAmount,
          salaryPercentage: sourcePercentage,
          reason: `${sourcePercentage}% commission from project sale`,
          createdAt: now,
          updatedAt: now,
        },
      ]);
    } else if (editingSaleId) {
      await setEmployeeAdjustments(adjustmentsWithoutSale);
    }

    if (print) {
      sessionStorage.setItem("projectSalePrintId", saleId);
      navigate("/project-sales-bills");
    }

    setItems([]);
    setCustomer(emptyCustomer);
    setFormErrors({});
    setQuery("");
    setPaymentMode("paid");
    setLoanPaidAmount("");
    setEditingSaleId("");
    setSaving(false);
    notify(
      editingSaleId
        ? "Sale bill updated successfully."
        : print
          ? "Sale registered. Opening bill for print."
          : "Sale registered successfully.",
      "success"
    );
  }

  return (
    <div className="project-sales-page">
      <header className="project-sales-heading compact">
        <div>
          <span>Project Sales</span>
          <h1>{editingSaleId ? "Edit Project Sale" : "Register Project Sale"}</h1>
          <p>Search registered projects, select one or more, then enter price, discount and quantity.</p>
        </div>
      </header>

      <section className="project-sale-grid">
        <div className="project-sale-col-8">
          <section className="project-sale-panel">
            <div className="project-sale-panel-title">
              <div>
                <Search size={17} />
                <h2>Search Projects</h2>
              </div>
              <small>{filteredProjects.length} found</small>
            </div>

            <label className="project-sale-search">
              <Search size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search registered projects..."
              />
            </label>

            <div className="project-search-results">
              {filteredProjects.map((project) => {
                const id = String(project.id || project.projectId || project.projectName);
                const selected = items.some((item) => String(item.projectId) === id);

                return (
                  <button
                    type="button"
                    key={id}
                    className={`project-search-card ${selected ? "selected" : ""}`}
                    onClick={() => selectProject(project)}
                  >
                    <div>
                      <strong>{project.projectName || "Unnamed Project"}</strong>
                      <small>{project.customerName || project.status || "Registered project"}</small>
                    </div>
                    <span>{money(projectPrice(project), project.currency || "AFN")}</span>
                  </button>
                );
              })}

              {!filteredProjects.length && (
                <div className="project-sale-empty">No registered project found.</div>
              )}
            </div>
          </section>

          <section className="project-sale-panel">
            <div className="project-sale-panel-title">
              <div>
                <ShoppingCart size={17} />
                <h2>Selected Projects</h2>
              </div>
              <small>Price, discount, quantity</small>
            </div>

            {items.length ? (
              <div className="project-sale-items">
                {items.map((item) => (
                  <article className="project-sale-item" key={item.projectId}>
                    <div className="project-sale-item-head">
                      <div>
                        <span>{item.quantity}</span>
                        <strong>{item.projectName}</strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.projectId)}
                        title="Remove"
                        aria-label="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="project-sale-license-row">
                      <label>
                        <span>Sale Type</span>
                        <select
                          value={item.saleType || "lifetime"}
                          onChange={(event) => updateSaleType(item.projectId, event.target.value)}
                        >
                          <option value="lifetime">Lifetime / Permanent</option>
                          <option value="license">License</option>
                        </select>
                      </label>

                      {item.saleType === "license" && (
                        <label>
                          <span>License Package</span>
                          <select
                            value={item.licensePackageId || ""}
                            onChange={(event) => updateLicensePackage(item.projectId, event.target.value)}
                          >
                            <option value="">Select license package</option>
                            {projectLicensePackages(item.projectId).map((pkg) => (
                              <option key={pkg.id} value={pkg.id}>
                                {pkg.packageName} — {money(pkg.sellingPrice, pkg.currency || "AFN")}
                              </option>
                            ))}
                          </select>
                          {!projectLicensePackages(item.projectId).length && (
                            <small className="project-sale-license-empty">
                              No Technology Package is linked to this project.
                            </small>
                          )}
                        </label>
                      )}
                    </div>

                    <div className="project-sale-three-inputs">
                      <label>
                        <span>Price</span>
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(event) => updateItem(item.projectId, "price", event.target.value)}
                        />
                      </label>
                      <label>
                        <span>Discount</span>
                        <input
                          type="number"
                          min="0"
                          value={item.discount}
                          onChange={(event) =>
                            updateItem(item.projectId, "discount", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        <span>Quantity</span>
                        <div className="project-sale-qty-control">
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(item.projectId, "quantity", Number(item.quantity || 1) - 1)
                            }
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(item.projectId, "quantity", event.target.value)
                            }
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateItem(item.projectId, "quantity", Number(item.quantity || 1) + 1)
                            }
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </label>
                    </div>

                    <div className="project-sale-line-total">
                      <span>Line total</span>
                      <strong>{money(lineTotal(item), item.currency || currency)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={`project-sale-cart-empty ${formErrors.items ? "has-error" : ""}`}>
                <ShoppingCart size={30} />
                <strong>No project selected</strong>
                <p>Search and click a project to add it to the sale form.</p>
                {formErrors.items && <span className="form-error-text">{formErrors.items}</span>}
              </div>
            )}
            {formErrors.total && <span className="form-error-text">{formErrors.total}</span>}
          </section>
        </div>

        <aside className="project-sale-col-4">
          <section className="project-sale-panel sale-summary-panel">
            <div className="project-sale-panel-title">
              <div>
                <Calculator size={17} />
                <h2>Calculation</h2>
              </div>
            </div>

            <label className={`project-sale-side-field ${formErrors.customerId ? "has-error" : ""}`}>
              <span>Customer</span>
              <div className="project-sale-select-row">
                <CustomerSearchSelect
                  customers={customers}
                  value={customer.customerId}
                  placeholder="Search customer by name, phone or ID..."
                  onChange={(id, record) => {
                    setFormErrors((current) => clearFieldError(current, "customerId"));
                    setCustomer((current) => ({
                      ...current,
                      customerId: id,
                      customerName: record ? customerNameOf(record) : "",
                      customerPhone: record?.phone || record?.customerPhone || "",
                    }));
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCustomerForm(true)}
                  title="Add customer"
                  aria-label="Add customer"
                >
                  <Plus size={17} />
                </button>
              </div>
              {formErrors.customerId && <span className="form-error-text">{formErrors.customerId}</span>}
            </label>

            {selectedCustomer && (
              <div className="project-sale-customer-summary">
                <div>
                  <UserRound size={18} />
                  <span>
                    <small>Full Name</small>
                    <strong>{customerNameOf(selectedCustomer)}</strong>
                  </span>
                </div>
                <div>
                  <Mail size={18} />
                  <span>
                    <small>Email</small>
                    <strong>{selectedCustomer.email || "-"}</strong>
                  </span>
                </div>
                <div>
                  <ReceiptText size={18} />
                  <span>
                    <small>Source</small>
                    <strong>
                      {selectedCustomer.sourceEmployeeName ||
                        sourceEmployee?.fullName ||
                        sourceEmployee?.employeeName ||
                        sourceEmployee?.name ||
                        "-"}
                    </strong>
                  </span>
                </div>
                <div>
                  <Calculator size={18} />
                  <span>
                    <small>Source Share</small>
                    <strong>
                      {sourceShare > 0
                        ? `${money(sourceShare, currency)} (${sourcePercentage}%)`
                        : "-"}
                    </strong>
                  </span>
                </div>
              </div>
            )}

            <label className="project-sale-side-field">
              <span>Phone</span>
              <input
                name="customerPhone"
                value={customer.customerPhone}
                onChange={updateCustomer}
                readOnly
                placeholder="Selected customer phone"
              />
            </label>

            <div className="project-sale-payment-mode">
              <span>Payment</span>
              <div className="project-sale-payment-options">
                <button type="button" className={paymentMode === "paid" ? "active" : ""} onClick={() => { setPaymentMode("paid"); setLoanPaidAmount(""); }}>Paid</button>
                <button type="button" className={paymentMode === "loan" ? "active" : ""} onClick={() => setPaymentMode("loan")}>Loan</button>
              </div>
            </div>

            {paymentMode === "loan" && (
              <label className="project-sale-side-field">
                <span>Paid Amount</span>
                <input
                  type="number"
                  min="0"
                  max={totals.total}
                  value={loanPaidAmount}
                  onChange={(event) => setLoanPaidAmount(event.target.value)}
                  placeholder="0"
                />
                <small className="project-sale-payment-hint">Remaining: {money(Math.max(0, totals.total - Math.min(totals.total, Math.max(0, Number(loanPaidAmount || 0)))), currency)}</small>
              </label>
            )}

            <label className="project-sale-side-field">
              <span>Notes</span>
              <textarea
                name="notes"
                rows="3"
                value={customer.notes}
                onChange={updateCustomer}
              />
            </label>

            <div className="project-sale-calculation">
              <div>
                <span>Projects</span>
                <strong>{items.length}</strong>
              </div>
              <div>
                <span>Quantity</span>
                <strong>{totals.quantity}</strong>
              </div>
              <div>
                <span>Subtotal</span>
                <strong>{money(totals.subtotal, currency)}</strong>
              </div>
              <div className="discount-row">
                <span>Discount</span>
                <strong>{money(totals.discount, currency)}</strong>
              </div>
              <div className="grand-total">
                <span>Total</span>
                <strong>{money(totals.total, currency)}</strong>
              </div>
            </div>

            <div className="project-sale-final-actions">
              <button
                type="button"
                className="sale-only-btn"
                onClick={() => saveSale({ print: false })}
                disabled={saving}
              >
                <ReceiptText size={16} />
                {editingSaleId ? "Update" : "Sale"}
              </button>
              <button
                type="button"
                className="sale-print-btn"
                onClick={() => saveSale({ print: true })}
                disabled={saving}
              >
                <Printer size={16} />
                {editingSaleId ? "Update & Print" : "Sale & Print"}
              </button>
            </div>
          </section>
        </aside>
      </section>

      {showCustomerForm && (
        <div className="project-sale-modal-backdrop" onMouseDown={() => setShowCustomerForm(false)}>
          <form
            className="project-sale-customer-modal"
            onSubmit={saveNewCustomer}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="project-sale-modal-header">
              <div>
                <span>New Customer</span>
                <h2>Register Customer</h2>
              </div>
              <button type="button" onClick={() => setShowCustomerForm(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <label className={newCustomerErrors.customerName ? "has-error" : ""}>
              <span>Full Name</span>
              <input name="customerName" value={newCustomer.customerName} onChange={updateNewCustomer} />
              {newCustomerErrors.customerName && <span className="form-error-text">{newCustomerErrors.customerName}</span>}
            </label>
            <label>
              <span>Phone</span>
              <input name="phone" value={newCustomer.phone} onChange={updateNewCustomer} />
            </label>
            <label>
              <span>Email</span>
              <input type="email" name="email" value={newCustomer.email} onChange={updateNewCustomer} />
            </label>
            <label>
              <span>Source</span>
              <select
                name="sourceEmployeeId"
                value={newCustomer.sourceEmployeeId}
                onChange={updateNewCustomer}
              >
                <option value="">No source</option>
                {employees.map((employee) => {
                  const id = employee.id || employee.employeeId;
                  return (
                    <option key={id || employee.email} value={id}>
                      {employee.fullName || employee.employeeName || employee.name || employee.email}
                    </option>
                  );
                })}
              </select>
            </label>
            <label>
              <span>Address</span>
              <textarea name="address" rows="3" value={newCustomer.address} onChange={updateNewCustomer} />
            </label>

            <div className="project-sale-actions">
              <button type="button" onClick={() => setShowCustomerForm(false)}>
                Cancel
              </button>
              <button type="submit">
                <Plus size={15} />
                Save Customer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default ProjectSales;
