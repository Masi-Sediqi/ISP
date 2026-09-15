import { useEffect, useMemo, useState } from "react";
import { Pencil, Printer, Search, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEmployeeAdjustments } from "../hooks/useEmployeeAdjustments";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { salePaymentSummary } from "../utils/projectSalesLogic";
import { notify } from "../utils/notify";
import { formatCurrencyAmount } from "../utils/currencyDisplay";
import "./ProjectSales.css";

const money = (value, currency = "AFN") =>
  formatCurrencyAmount(value, currency);

const itemsOf = (sale) =>
  Array.isArray(sale.items) && sale.items.length
    ? sale.items
    : [
        {
          projectId: sale.projectId,
          projectName: sale.projectName || "Project",
          price: Number(sale.price || 0),
          quantity: Number(sale.quantity || 1),
          discount: Number(sale.discount || 0),
          subtotal: Number(sale.subtotal || sale.price || 0),
          total: Number(sale.total || sale.price || 0),
        },
      ];

function ProjectSalesBills() {
  const navigate = useNavigate();
  const [sales, setSales] = useJsonCollection("projectSales");
  const [transactions, setTransactions] = useJsonCollection("transactions");
  const [employeeAdjustments, setEmployeeAdjustments] = useEmployeeAdjustments();
  const [settings] = useJsonCollection("settings");
  const [query, setQuery] = useState("");
  const [receiptSale, setReceiptSale] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const company = settings[0] || {};

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = [...sales].sort(
      (a, b) =>
        new Date(b.createdAt || b.saleDate || 0) -
        new Date(a.createdAt || a.saleDate || 0)
    );

    if (!q) return rows;

    return rows.filter((sale) =>
      [
        sale.projectName,
        sale.customerName,
        sale.customerPhone,
        sale.saleDate,
        ...itemsOf(sale).map((item) => item.projectName),
      ].some((value) => String(value || "").toLowerCase().includes(q))
    );
  }, [sales, query]);

  useEffect(() => {
    const id = sessionStorage.getItem("projectSalePrintId");
    if (!id || !sales.length) return;

    const found = sales.find((sale) => String(sale.id) === String(id));
    if (found) {
      setReceiptSale(found);
      sessionStorage.removeItem("projectSalePrintId");
      setTimeout(() => window.print(), 250);
    }
  }, [sales]);

  function editSale(sale) {
    sessionStorage.setItem("projectSaleEditId", sale.id);
    navigate("/project-sales");
  }

  async function deleteSale() {
    if (!deleteTarget) return;

    const id = deleteTarget.id;
    const saved = await setSales(
      sales.filter((sale) => String(sale.id) !== String(id))
    );
    if (!saved) return;

    await setTransactions(
      transactions.filter(
        (transaction) =>
          !(
            transaction.source === "project-sale" &&
            String(transaction.referenceId || "") === String(id)
          )
      )
    );
    await setEmployeeAdjustments(
      employeeAdjustments.filter(
        (adjustment) =>
          !(
            adjustment.source === "project-sale-commission" &&
            String(adjustment.referenceId || "") === String(id)
          )
      )
    );
    setDeleteTarget(null);
    notify("Sale deleted successfully.", "success");
  }

  const receiptItems = receiptSale ? itemsOf(receiptSale) : [];
  const receiptPayment = receiptSale ? salePaymentSummary(receiptSale) : null;
  const receiptProjectNames = receiptItems.map((item) => item.projectName).join(", ");
  const contractNo = String(receiptSale?.id || "").slice(-10).toUpperCase();

  return (
    <div className="project-sales-page project-bills-page">
      <div className="project-sales-heading">
        <div>
          <span>Sales / Bills</span>
          <h1>Project Sales Records</h1>
          <p>All completed project sales are stored here. Search, review, print or delete a bill.</p>
        </div>
      </div>

      <div className="project-bills-toolbar">
        <label>
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search bill, customer or project..."
          />
        </label>
        <strong>{filtered.length} bills</strong>
      </div>

      <div className="project-bills-table-wrap">
        <table className="project-bills-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Projects</th>
              <th>Qty</th>
              <th>Subtotal</th>
              <th>Discount</th>
              <th>Paid Amount</th>
              <th>Remaining Amount</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((sale, index) => {
                const items = itemsOf(sale);
                const subtotal = Number(sale.subtotal ?? sale.price ?? 0);
                const discount = Number(sale.discount || 0);
                const payment = salePaymentSummary(sale);
                const qty = Number(
                  sale.quantity ||
                    items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
                );

                return (
                  <tr key={sale.id}>
                    <td>{index + 1}</td>
                    <td>{sale.saleDate || "-"}</td>
                    <td>
                      <strong>{sale.customerName || "Walk-in Customer"}</strong>
                      <small>{sale.customerPhone || ""}</small>
                    </td>
                    <td>
                      <strong>{items[0]?.projectName || "-"}</strong>
                      {items.length > 1 && <small>+{items.length - 1} more</small>}
                    </td>
                    <td>{qty}</td>
                    <td>{money(subtotal, payment.currency)}</td>
                    <td>{money(discount, payment.currency)}</td>
                    <td>
                      <strong>{money(payment.paid, payment.currency)}</strong>
                    </td>
                    <td>
                      <strong>{money(payment.remaining, payment.currency)}</strong>
                    </td>
                    <td>
                      <strong>{money(payment.total, payment.currency)}</strong>
                    </td>
                    <td>
                      <div className="project-bill-actions">
                        <button
                          type="button"
                          onClick={() => setReceiptSale(sale)}
                          title="Print"
                          aria-label="Print contract"
                        >
                          <Printer size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => editSale(sale)}
                          title="Edit"
                          aria-label="Edit bill"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => setDeleteTarget(sale)}
                          title="Delete"
                          aria-label="Delete bill"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="11">
                  <div className="project-sale-empty">No sales found.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {receiptSale && (
        <div className="project-receipt-backdrop" onMouseDown={() => setReceiptSale(null)}>
          <section
            className="project-receipt-modal project-contract-preview"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="project-receipt-toolbar no-print">
              <strong>Contract Print Preview</strong>
              <div>
                <button type="button" onClick={() => window.print()}>
                  <Printer size={16} /> Print
                </button>
                <button type="button" onClick={() => setReceiptSale(null)} aria-label="Close">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="project-contract-pages">
              <article className="project-contract-page">
                <header className="project-contract-cover">
                  <div>
                    <h1>CONTRACT AGREEMENT</h1>
                  </div>
                  <img src="/logo.png" alt="Afghan Power" />
                </header>
                <div className="project-contract-summary">
                  <div>
                    <strong>Contract No: {contractNo || "-"}</strong>
                    <strong>Date: {receiptSale.saleDate || "-"}</strong>
                  </div>
                  <div>
                    <strong>Software/System Name: {receiptItems[0]?.projectName || "-"}</strong>
                    <strong>Total Price: {money(receiptPayment.total, receiptPayment.currency)}</strong>
                  </div>
                </div>

                <ContractSection number="1" title="Parties">
                  <div className="project-contract-parties">
                    <div>
                      <h3>Party A</h3>
                      <p>{company.companyName || company.name || "AFGHAN POWER TECH DEVELOPMENT COMPANY"}</p>
                      <p>{company.phone || "+93 78 382 8054"}</p>
                      <p>{company.address || "Shahr-e-Naw, Yaqoob Square, Office No. 73"}</p>
                    </div>
                    <div>
                      <h3>Party B</h3>
                      <p><strong>{receiptSale.customerName || "Walk-in Customer"}</strong></p>
                      <p>{receiptSale.customerPhone || "-"}</p>
                      <p>{receiptSale.customerEmail || receiptSale.customerAddress || "-"}</p>
                    </div>
                  </div>
                </ContractSection>

                <ContractSection number="2" title="Purpose">
                  <p>
                    The purpose of this Agreement is the sale, setup, delivery, and handover of the project or system named <strong>{receiptProjectNames || "Project"}</strong> with the agreed scope and features.
                  </p>
                </ContractSection>

                <ContractSection number="3" title="Price & Payment">
                  <p>Total Contract Price: {money(receiptPayment.total, receiptPayment.currency)}</p>
                  <p>Advance Payment: {money(receiptPayment.paid, receiptPayment.currency)}</p>
                  <p>Remaining Balance: <strong>{money(receiptPayment.remaining, receiptPayment.currency)}</strong></p>
                  <p>The final delivery or activation shall be completed according to the agreed payment status and written arrangement between both parties.</p>
                </ContractSection>

                <ContractSection number="4" title="System Acceptance">
                  <p>The Customer confirms that the project has been demonstrated, reviewed, or explained before purchase and accepts its current features and functionality.</p>
                </ContractSection>
                <div className="project-contract-sign-row">
                  <strong>PARTY A</strong>
                  <strong>PARTY B</strong>
                </div>
              </article>

              <article className="project-contract-page">
                <ContractSection number="5" title="Project Details">
                  <table className="project-contract-table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Discount</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptItems.map((item, index) => (
                        <tr key={`${item.projectId || item.projectName}-${index}`}>
                          <td>{item.projectName}</td>
                          <td>{money(item.price, receiptPayment.currency)}</td>
                          <td>{item.quantity || 1}</td>
                          <td>{money(item.discount || 0, receiptPayment.currency)}</td>
                          <td>{money(item.total ?? Number(item.price || 0) * Number(item.quantity || 1) - Number(item.discount || 0), receiptPayment.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ContractSection>

                <ContractSection number="6" title="Software Ownership & Source Code">
                  <p>All intellectual property rights, source code, system architecture, design, modules, and core components remain the exclusive property of Afghan Power Tech Development Company unless separately agreed in writing.</p>
                  <p>Purchase of the project grants the Customer the right to use the delivered system for its intended business purposes and does not transfer ownership of source code.</p>
                </ContractSection>

                <ContractSection number="7" title="Software Use Conditions">
                  <p>The Customer may use the purchased project for its own business operations. Without written permission from the Company, the Customer may not:</p>
                  <ul>
                    <li>Resell or redistribute the software.</li>
                    <li>Copy the software for another company or person.</li>
                    <li>Transfer the software to a third party for resale.</li>
                    <li>Reverse engineer, crack, or unlawfully duplicate the software.</li>
                  </ul>
                </ContractSection>

                <ContractSection number="8" title="Customization & Additional Development">
                  <p>Any new feature, module, report, interface, integration, or customization outside the agreed scope shall be quoted and charged separately.</p>
                </ContractSection>

                <ContractSection number="9" title="Support">
                  <p>Free technical support shall be provided for 7 days from the activation date. After that period, maintenance and support services may be charged according to the Company's applicable service rates.</p>
                </ContractSection>
              </article>

              <article className="project-contract-page">
                <ContractSection number="10" title="Hosting & Third-party Services">
                  <p>Unless specifically included in this Agreement, costs related to hosting, VPS, domain, SSL, SMS, APIs, WhatsApp, email, cloud services, and other third-party services shall be paid by the Customer.</p>
                </ContractSection>

                <ContractSection number="11" title="Customer Data & Backup">
                  <p>The Customer is responsible for the accuracy of information entered into the system and for protecting account credentials.</p>
                </ContractSection>

                <ContractSection number="12" title="Refund Policy">
                  <p>After installation, setup, or final project delivery, payments are non-refundable unless otherwise approved in writing by the Company.</p>
                </ContractSection>

                <ContractSection number="13" title="Suspension Of Service">
                  <p>If the Customer fails to complete the agreed payment or violates the terms of this Agreement, the Company reserves the right to suspend technical services or restrict access until the issue is resolved.</p>
                </ContractSection>

                <ContractSection number="14" title="Dispute Resolution">
                  <p>Any dispute arising from this Agreement shall first be resolved through mutual negotiation. If no settlement is reached, the matter shall be handled according to the applicable laws of Afghanistan.</p>
                </ContractSection>

                <ContractSection number="15" title="Acceptance">
                  <p>By signing this Agreement, both Parties confirm that they have read, understood, and accepted all terms and conditions stated herein.</p>
                </ContractSection>

                <div className="project-contract-final-signatures">
                  <div>
                    <strong>PARTY A - COMPANY</strong>
                    <span>NAME: {company.ownerName || "SAMIM MEYAKHIL"}</span>
                    <span>POSITION: {company.ownerPosition || "FOUNDER"}</span>
                    <span>SIGNATURE: ____________</span>
                    <span>COMPANY STAMP: ________</span>
                  </div>
                  <div>
                    <strong>PARTY B - CUSTOMER</strong>
                    <span>NAME: {receiptSale.customerName || "CUSTOMER"}</span>
                    <span>POSITION: ____________</span>
                    <span>SIGNATURE: ____________</span>
                    <span>STAMP/FINGERPRINT: _____</span>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="project-receipt-backdrop" onMouseDown={() => setDeleteTarget(null)}>
          <section
            className="project-delete-dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <Trash2 size={26} />
            <h3>Delete Sale?</h3>
            <p>This will remove the bill and its linked income/commission records.</p>
            <div>
              <button type="button" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button type="button" className="danger" onClick={deleteSale}>
                Delete
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function ContractSection({ number, title, children }) {
  return (
    <section className="project-contract-section">
      <h2>{number}. {title.toUpperCase()}</h2>
      {children}
    </section>
  );
}

export default ProjectSalesBills;
