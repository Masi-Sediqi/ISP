import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Search,
  X,
} from "lucide-react";

import { useJsonCollection } from "../hooks/useJsonCollection";
import "./Reports.css";
import "./SupplierReport.css";

const normalizeText = (value) =>
  String(value || "").trim().toLowerCase();

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString("en-US")} AFN`;

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-GB");
};

const getSupplierTypes = (supplier) => {
  if (Array.isArray(supplier.supplierTypes)) {
    return supplier.supplierTypes.filter(Boolean);
  }

  if (supplier.supplierType) {
    return [supplier.supplierType];
  }

  return [];
};

const isBalanceRecord = (record) =>
  normalizeText(
    record.recordType || record.type
  ) === "balance";

const getPurchaseTotal = (purchase) => {
  const directTotal = Number(
    purchase.totalPurchaseValue ??
      purchase.totalAmount ??
      purchase.purchaseAmount ??
      0
  );

  if (directTotal) return directTotal;

  return (
    Number(purchase.quantity || 0) *
    Number(purchase.unitPrice || 0)
  );
};

const getPurchasePaid = (purchase) =>
  Number(
    purchase.paidAmount ??
      purchase.amountPaid ??
      0
  );

export default function SupplierReport({
  company = {},
}) {
  const navigate = useNavigate();

  const [suppliers] =
    useJsonCollection("suppliers");

  const [supplierPurchases] =
    useJsonCollection("supplierPurchases");

  const [supplierPayments] =
    useJsonCollection("supplierPayments");

  const [assetMovements] =
    useJsonCollection("assetMovements");

  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState("all");
  const [supplierType, setSupplierType] =
    useState("all");
  const [balanceStatus, setBalanceStatus] =
    useState("all");
  const [startDate, setStartDate] =
    useState("");
  const [endDate, setEndDate] =
    useState("");

  const [printOpen, setPrintOpen] =
    useState(false);

  const [printPage, setPrintPage] =
    useState(0);

  const [printOptions, setPrintOptions] =
    useState({
      paperSize: "A4",
      orientation: "landscape",
      rowsPerPage: 18,
    });

  const systemName =
    company.companyName ||
    company.systemName ||
    "ISP Smart";

  const systemLogo =
    company.logo ||
    company.logoUrl ||
    "";

  const supplierTypeOptions = useMemo(
    () =>
      [
        ...new Set(
          suppliers.flatMap(
            getSupplierTypes
          )
        ),
      ].sort((first, second) =>
        first.localeCompare(second)
      ),
    [suppliers]
  );

  const supplierRows = useMemo(() => {
    return suppliers.map(
      (supplier, supplierIndex) => {
        const supplierId = String(
          supplier.id || ""
        );

        const supplierName =
          normalizeText(
            supplier.supplierName
          );

        const matchesSupplier = (record) => {
          const recordSupplierId = String(
            record.supplierRecordId ||
              record.supplierId ||
              ""
          );

          const recordSupplierIndex =
            record.supplierIndex;

          const recordSupplierName =
            normalizeText(
              record.supplierName
            );

          return (
            (supplierId &&
              recordSupplierId ===
                supplierId) ||
            Number(recordSupplierIndex) ===
              Number(supplierIndex) ||
            (supplierName &&
              recordSupplierName ===
                supplierName)
          );
        };

        const legacyPurchases =
          supplierPurchases.filter(
            matchesSupplier
          );

        const movementPurchases =
          assetMovements.filter(
            (movement) =>
              normalizeText(
                movement.movementType
              ) === "purchase" &&
              matchesSupplier(movement)
          );

        const repairPurchases =
          assetMovements
            .filter((movement) => {
              const repairResult =
                movement.repairResult ||
                {};

              return matchesSupplier({
                supplierRecordId:
                  repairResult.supplierRecordId,
                supplierName:
                  repairResult.supplierName,
              });
            })
            .map((movement) => ({
              ...movement.repairResult,
              createdAt:
                movement.createdAt,
              updatedAt:
                movement.updatedAt,
              purchaseDate:
                movement.repairResult
                  ?.repairDate,
              totalPurchaseValue:
                movement.repairResult
                  ?.repairCost,
              paidAmount:
                movement.repairResult
                  ?.paidAmount,
            }));

        const purchases = [
          ...legacyPurchases,
          ...movementPurchases,
          ...repairPurchases,
        ];

        const paymentRecords =
          supplierPayments.filter(
            matchesSupplier
          );

        const balanceRecords =
          paymentRecords.filter(
            isBalanceRecord
          );

        const payments =
          paymentRecords.filter(
            (record) =>
              !isBalanceRecord(record)
          );

        const totalPurchases =
          purchases.reduce(
            (sum, purchase) =>
              sum +
              getPurchaseTotal(purchase),
            0
          );

        const purchasePaid =
          purchases.reduce(
            (sum, purchase) =>
              sum +
              getPurchasePaid(purchase),
            0
          );

        const paidToSupplier =
          payments.reduce(
            (sum, payment) =>
              payment.direction ===
              "supplier_pays_us"
                ? sum
                : sum +
                  Number(
                    payment.amount || 0
                  ),
            0
          );

        const supplierPaidUs =
          payments.reduce(
            (sum, payment) =>
              payment.direction ===
              "supplier_pays_us"
                ? sum +
                  Number(
                    payment.amount || 0
                  )
                : sum,
            0
          );

        const openingWeOwe =
          balanceRecords.reduce(
            (sum, balance) =>
              balance.balanceSide ===
              "we_owe_supplier"
                ? sum +
                  Number(
                    balance.amount || 0
                  )
                : sum,
            0
          );

        const openingSupplierOwes =
          balanceRecords.reduce(
            (sum, balance) =>
              balance.balanceSide ===
              "supplier_owes_us"
                ? sum +
                  Number(
                    balance.amount || 0
                  )
                : sum,
            0
          );

        const fallbackOpeningBalance =
          balanceRecords.length
            ? 0
            : Number(
                supplier.openingBalance ||
                  0
              );

        const openingDebt =
          fallbackOpeningBalance < 0
            ? Math.abs(
                fallbackOpeningBalance
              )
            : 0;

        const openingCredit =
          fallbackOpeningBalance > 0
            ? fallbackOpeningBalance
            : 0;

        const totalPaid =
          purchasePaid + paidToSupplier;

        const netBalance =
          totalPurchases +
          openingWeOwe +
          openingDebt +
          supplierPaidUs -
          totalPaid -
          openingSupplierOwes -
          openingCredit;

        const weOweSupplier =
          netBalance > 0
            ? netBalance
            : 0;

        const supplierOwesUs =
          netBalance < 0
            ? Math.abs(netBalance)
            : 0;

        const latestActivity =
          [
            ...purchases.map(
              (purchase) =>
                purchase.purchaseDate ||
                purchase.date ||
                purchase.createdAt
            ),
            ...paymentRecords.map(
              (payment) =>
                payment.paymentDate ||
                payment.balanceDate ||
                payment.createdAt
            ),
          ]
            .filter(Boolean)
            .sort()
            .at(-1) ||
          supplier.updatedAt ||
          supplier.createdAt ||
          "";

        return {
          ...supplier,
          supplierIndex,
          supplierTypes:
            getSupplierTypes(supplier),
          totalPurchases,
          totalPaid,
          supplierPaidUs,
          weOweSupplier,
          supplierOwesUs,
          netBalance,
          purchaseCount:
            purchases.length,
          paymentCount:
            payments.length,
          latestActivity,
        };
      }
    );
  }, [
    suppliers,
    supplierPurchases,
    supplierPayments,
    assetMovements,
  ]);

  const filteredSuppliers = useMemo(() => {
    const query = normalizeText(search);

    return supplierRows
      .filter((supplier) => {
        if (
          status !== "all" &&
          normalizeText(
            supplier.status
          ) !== status
        ) {
          return false;
        }

        if (
          supplierType !== "all" &&
          !supplier.supplierTypes.includes(
            supplierType
          )
        ) {
          return false;
        }

        if (
          balanceStatus === "we-owe" &&
          !(supplier.weOweSupplier > 0)
        ) {
          return false;
        }

        if (
          balanceStatus ===
            "supplier-owes" &&
          !(supplier.supplierOwesUs > 0)
        ) {
          return false;
        }

        if (
          balanceStatus === "settled" &&
          Math.abs(
            supplier.netBalance
          ) > 0.0001
        ) {
          return false;
        }

        const createdDate = String(
          supplier.createdAt || ""
        ).slice(0, 10);

        if (
          startDate &&
          createdDate &&
          createdDate < startDate
        ) {
          return false;
        }

        if (
          endDate &&
          createdDate &&
          createdDate > endDate
        ) {
          return false;
        }

        if (!query) return true;

        return [
          supplier.supplierName,
          supplier.companyName,
          supplier.contactPerson,
          supplier.phone,
          supplier.email,
          supplier.address,
          supplier.taxNumber,
          supplier.supplierTypes.join(
            " "
          ),
          supplier.status,
        ].some((value) =>
          normalizeText(value).includes(query)
        );
      })
      .sort((first, second) =>
        String(
          first.supplierName || ""
        ).localeCompare(
          String(
            second.supplierName || ""
          )
        )
      );
  }, [
    supplierRows,
    search,
    status,
    supplierType,
    balanceStatus,
    startDate,
    endDate,
  ]);

  const summary = useMemo(() => {
    const active =
      filteredSuppliers.filter(
        (supplier) =>
          normalizeText(
            supplier.status
          ) === "active"
      ).length;

    const totalPurchases =
      filteredSuppliers.reduce(
        (sum, supplier) =>
          sum +
          supplier.totalPurchases,
        0
      );

    const totalPaid =
      filteredSuppliers.reduce(
        (sum, supplier) =>
          sum + supplier.totalPaid,
        0
      );

    const totalWeOwe =
      filteredSuppliers.reduce(
        (sum, supplier) =>
          sum +
          supplier.weOweSupplier,
        0
      );

    const totalSupplierOwes =
      filteredSuppliers.reduce(
        (sum, supplier) =>
          sum +
          supplier.supplierOwesUs,
        0
      );

    return {
      active,
      inactive:
        filteredSuppliers.length -
        active,
      totalPurchases,
      totalPaid,
      totalWeOwe,
      totalSupplierOwes,
    };
  }, [filteredSuppliers]);

  const printPages = useMemo(() => {
    const rowsPerPage = Math.max(
      1,
      Number(
        printOptions.rowsPerPage
      ) || 18
    );

    if (!filteredSuppliers.length) {
      return [[]];
    }

    const pages = [];

    for (
      let index = 0;
      index <
      filteredSuppliers.length;
      index += rowsPerPage
    ) {
      pages.push(
        filteredSuppliers.slice(
          index,
          index + rowsPerPage
        )
      );
    }

    return pages;
  }, [
    filteredSuppliers,
    printOptions.rowsPerPage,
  ]);

  const resetFilters = () => {
    setSearch("");
    setStatus("all");
    setSupplierType("all");
    setBalanceStatus("all");
    setStartDate("");
    setEndDate("");
  };

  const applyPrintSettings = () => {
    const styleId =
      "supplier-report-print-settings";

    let style =
      document.getElementById(
        styleId
      );

    if (!style) {
      style =
        document.createElement(
          "style"
        );

      style.id = styleId;
      document.head.appendChild(
        style
      );
    }

    style.textContent = `
      @media print {
        @page {
          size: ${printOptions.paperSize}
            ${printOptions.orientation};
          margin: 7mm;
        }
      }
    `;
  };

  const printReport = () => {
    applyPrintSettings();
    setPrintOpen(false);

    window.setTimeout(() => {
      window.print();
    }, 120);
  };

  const exportPdf = async () => {
    applyPrintSettings();

    try {
      const [
        { default: html2canvas },
        { jsPDF },
      ] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      document.body.classList.add(
        "reports-pdf-exporting"
      );

      await new Promise((resolve) =>
        window.setTimeout(
          resolve,
          160
        )
      );

      const pages = Array.from(
        document.querySelectorAll(
          ".supplier-report-print-page"
        )
      );

      if (!pages.length) {
        throw new Error(
          "No supplier report pages found."
        );
      }

      const landscape =
        printOptions.orientation ===
        "landscape";

      const pdf = new jsPDF({
        orientation: landscape
          ? "landscape"
          : "portrait",
        unit: "mm",
        format:
          printOptions.paperSize.toLowerCase(),
        compress: true,
      });

      for (
        let index = 0;
        index < pages.length;
        index += 1
      ) {
        const canvas =
          await html2canvas(
            pages[index],
            {
              scale: 2,
              useCORS: true,
              backgroundColor:
                "#ffffff",
              logging: false,
            }
          );

        const image =
          canvas.toDataURL(
            "image/jpeg",
            0.96
          );

        const pageWidth =
          pdf.internal.pageSize.getWidth();

        const pageHeight =
          pdf.internal.pageSize.getHeight();

        const ratio = Math.min(
          pageWidth / canvas.width,
          pageHeight / canvas.height
        );

        const width =
          canvas.width * ratio;

        const height =
          canvas.height * ratio;

        if (index > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          image,
          "JPEG",
          (pageWidth - width) / 2,
          (pageHeight - height) / 2,
          width,
          height,
          undefined,
          "FAST"
        );
      }

      pdf.save(
        `Suppliers-Report-${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`
      );
    } catch (error) {
      console.error(error);

      window.alert(
        "PDF export requires html2canvas and jspdf. Run: npm install html2canvas jspdf"
      );
    } finally {
      document.body.classList.remove(
        "reports-pdf-exporting"
      );
    }
  };

  const getBalanceLabel = (
    supplier
  ) => {
    if (supplier.weOweSupplier > 0) {
      return "We Owe Supplier";
    }

    if (supplier.supplierOwesUs > 0) {
      return "Supplier Owes Us";
    }

    return "Settled";
  };

  const renderSupplierRow = (
    supplier,
    rowNumber
  ) => (
    <tr
      key={
        supplier.id ||
        supplier.supplierIndex
      }
    >
      <td>{rowNumber}</td>

      <td>
        <div className="reports-customer-cell">
          <span>
            {String(
              supplier.supplierName ||
                "S"
            )
              .charAt(0)
              .toUpperCase()}
          </span>

          <div>
            <strong>
              {supplier.supplierName ||
                "Unnamed Supplier"}
            </strong>

            <small>
              {supplier.companyName ||
                supplier.email ||
                "-"}
            </small>
          </div>
        </div>
      </td>

      <td>
        {supplier.contactPerson ||
          "-"}
      </td>

      <td>
        {supplier.phone || "-"}
      </td>

      <td>
        {supplier.supplierTypes.length
          ? supplier.supplierTypes.join(
              ", "
            )
          : "-"}
      </td>

      <td>
        <span
          className={`supplier-report-status ${normalizeText(
            supplier.status ||
              "Unspecified"
          ).replace(/\s+/g, "-")}`}
        >
          {supplier.status ||
            "Unspecified"}
        </span>
      </td>

      <td>
        {supplier.purchaseCount}
      </td>

      <td>
        {formatMoney(
          supplier.totalPurchases
        )}
      </td>

      <td className="supplier-report-paid">
        {formatMoney(
          supplier.totalPaid
        )}
      </td>

      <td
        className={
          supplier.weOweSupplier > 0
            ? "supplier-report-debt"
            : supplier.supplierOwesUs >
                0
              ? "supplier-report-credit"
              : ""
        }
      >
        {getBalanceLabel(supplier)}
        <small>
          {formatMoney(
            supplier.weOweSupplier ||
              supplier.supplierOwesUs
          )}
        </small>
      </td>

      <td>
        {formatDate(
          supplier.latestActivity
        )}
      </td>
    </tr>
  );

  return (
    <div className="reports-page supplier-report-page">
      <header className="reports-page-heading no-print">
        <div>
          <span>REPORTING CENTER</span>

          <h1>Suppliers Report</h1>

          <p>
            Review supplier records,
            purchases, payments, and current
            balances.
          </p>
        </div>

        <div className="reports-heading-actions">
          <button
            type="button"
            className="reports-back-button"
            onClick={() =>
              navigate("/reports")
            }
          >
            Reports
          </button>

          <button
            type="button"
            className="reports-print-button"
            onClick={() => {
              setPrintPage(0);
              setPrintOpen(true);
            }}
          >
            <Printer size={16} />
            Print Report
          </button>
        </div>
      </header>

      <section className="supplier-report-summary reports-screen-summary">
        <div>
          <span>Total Suppliers</span>
          <strong>
            {filteredSuppliers.length}
          </strong>
        </div>

        <div>
          <span>Active</span>
          <strong>
            {summary.active}
          </strong>
        </div>

        <div>
          <span>Total Purchases</span>
          <strong>
            {formatMoney(
              summary.totalPurchases
            )}
          </strong>
        </div>

        <div>
          <span>Total Paid</span>
          <strong>
            {formatMoney(
              summary.totalPaid
            )}
          </strong>
        </div>

        <div>
          <span>We Owe Suppliers</span>
          <strong>
            {formatMoney(
              summary.totalWeOwe
            )}
          </strong>
        </div>

        <div>
          <span>Suppliers Owe Us</span>
          <strong>
            {formatMoney(
              summary.totalSupplierOwes
            )}
          </strong>
        </div>
      </section>

      <section className="reports-filter-panel supplier-report-filters no-print">
        <div className="reports-search-box">
          <Search size={17} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search supplier, company or phone..."
          />
        </div>

        <select
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value
            )
          }
        >
          <option value="all">
            All Statuses
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>
        </select>

        <select
          value={supplierType}
          onChange={(event) =>
            setSupplierType(
              event.target.value
            )
          }
        >
          <option value="all">
            All Supplier Types
          </option>

          {supplierTypeOptions.map(
            (type) => (
              <option
                key={type}
                value={type}
              >
                {type}
              </option>
            )
          )}
        </select>

        <select
          value={balanceStatus}
          onChange={(event) =>
            setBalanceStatus(
              event.target.value
            )
          }
        >
          <option value="all">
            All Balances
          </option>

          <option value="we-owe">
            We Owe Supplier
          </option>

          <option value="supplier-owes">
            Supplier Owes Us
          </option>

          <option value="settled">
            Settled
          </option>
        </select>

        <label className="reports-date-filter">
          <CalendarDays size={15} />

          <input
            type="date"
            value={startDate}
            onChange={(event) =>
              setStartDate(
                event.target.value
              )
            }
            aria-label="Supplier start date"
          />
        </label>

        <label className="reports-date-filter">
          <CalendarDays size={15} />

          <input
            type="date"
            value={endDate}
            onChange={(event) =>
              setEndDate(
                event.target.value
              )
            }
            aria-label="Supplier end date"
          />
        </label>

        <button
          type="button"
          className="reports-reset-button"
          onClick={resetFilters}
          title="Clear filters"
        >
          <X size={16} />
        </button>
      </section>

      <section className="reports-table-card reports-screen-table supplier-report-table-card">
        <div className="reports-table-heading">
          <div>
            <h2>Supplier Records</h2>

            <p>
              Showing{" "}
              {filteredSuppliers.length}{" "}
              supplier records
            </p>
          </div>
        </div>

        <div className="reports-table-wrap">
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Supplier</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Supply Type</th>
                <th>Status</th>
                <th>Purchases</th>
                <th>Total Purchase</th>
                <th>Total Paid</th>
                <th>Balance</th>
                <th>Last Activity</th>
              </tr>
            </thead>

            <tbody>
              {filteredSuppliers.map(
                (supplier, index) =>
                  renderSupplierRow(
                    supplier,
                    index + 1
                  )
              )}

              {!filteredSuppliers.length && (
                <tr>
                  <td
                    colSpan="11"
                    className="reports-empty-state"
                  >
                    No supplier records match
                    the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="reports-print-pages">
        {printPages.map(
          (pageSuppliers, pageIndex) => (
            <article
              className="reports-print-page supplier-report-print-page"
              key={`supplier-page-${pageIndex}`}
            >
              <section className="reports-print-page-header">
                <div className="reports-print-logo">
                  {systemLogo ? (
                    <img
                      src={systemLogo}
                      alt={systemName}
                    />
                  ) : (
                    <span>
                      {systemName.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="reports-print-title">
                  <small>
                    OFFICIAL REPORT
                  </small>

                  <h1>
                    Suppliers Report
                  </h1>

                  <p>
                    Supplier records,
                    purchases and balances
                  </p>
                </div>

                <div className="reports-print-company">
                  <strong>
                    {systemName}
                  </strong>

                  <span>
                    {new Date().toLocaleDateString(
                      "en-GB"
                    )}
                  </span>
                </div>
              </section>

              {pageIndex === 0 && (
                <section className="supplier-report-summary reports-print-summary">
                  <div>
                    <span>
                      Total Suppliers
                    </span>

                    <strong>
                      {
                        filteredSuppliers.length
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total Purchases
                    </span>

                    <strong>
                      {formatMoney(
                        summary.totalPurchases
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Total Paid</span>

                    <strong>
                      {formatMoney(
                        summary.totalPaid
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      We Owe Suppliers
                    </span>

                    <strong>
                      {formatMoney(
                        summary.totalWeOwe
                      )}
                    </strong>
                  </div>
                </section>
              )}

              <section className="reports-table-card reports-print-table-card supplier-report-print-table">
                <div className="reports-table-heading">
                  <div>
                    <h2>
                      Supplier Records
                    </h2>

                    <p>
                      Page {pageIndex + 1} of{" "}
                      {printPages.length}
                    </p>
                  </div>
                </div>

                <div className="reports-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>Supplier</th>
                        <th>Contact</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Purchases</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Last Activity</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pageSuppliers.map(
                        (
                          supplier,
                          rowIndex
                        ) => (
                          <tr
                            key={
                              supplier.id ||
                              supplier.supplierIndex
                            }
                          >
                            <td>
                              {pageIndex *
                                Number(
                                  printOptions.rowsPerPage ||
                                    18
                                ) +
                                rowIndex +
                                1}
                            </td>

                            <td>
                              <strong>
                                {supplier.supplierName ||
                                  "Unnamed Supplier"}
                              </strong>

                              <small>
                                {supplier.companyName ||
                                  supplier.email ||
                                  "-"}
                              </small>
                            </td>

                            <td>
                              {supplier.contactPerson ||
                                "-"}
                              <small>
                                {supplier.phone ||
                                  "-"}
                              </small>
                            </td>

                            <td>
                              {supplier.supplierTypes.join(
                                ", "
                              ) || "-"}
                            </td>

                            <td>
                              {supplier.status ||
                                "Unspecified"}
                            </td>

                            <td>
                              {
                                supplier.purchaseCount
                              }
                            </td>

                            <td>
                              {formatMoney(
                                supplier.totalPurchases
                              )}
                            </td>

                            <td>
                              {formatMoney(
                                supplier.totalPaid
                              )}
                            </td>

                            <td>
                              {getBalanceLabel(
                                supplier
                              )}
                              <small>
                                {formatMoney(
                                  supplier.weOweSupplier ||
                                    supplier.supplierOwesUs
                                )}
                              </small>
                            </td>

                            <td>
                              {formatDate(
                                supplier.latestActivity
                              )}
                            </td>
                          </tr>
                        )
                      )}

                      {!pageSuppliers.length && (
                        <tr>
                          <td
                            colSpan="10"
                            className="reports-empty-state"
                          >
                            No supplier records
                            match the selected
                            filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <footer className="reports-print-page-footer">
                <span>{systemName}</span>
                <span>
                  Suppliers Report
                </span>
                <span>
                  Page {pageIndex + 1} of{" "}
                  {printPages.length}
                </span>
              </footer>
            </article>
          )
        )}
      </section>

      {printOpen && (
        <div
          className="simple-print-backdrop no-print"
          onMouseDown={() =>
            setPrintOpen(false)
          }
        >
          <section
            className="simple-print-studio"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="simple-print-toolbar">
              <div className="simple-print-title">
                <Printer size={17} />

                <strong>
                  Suppliers Report
                </strong>
              </div>

              <div className="simple-print-orientation">
                <button
                  type="button"
                  className={
                    printOptions.orientation ===
                    "portrait"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setPrintOptions(
                      (current) => ({
                        ...current,
                        orientation:
                          "portrait",
                      })
                    )
                  }
                >
                  Portrait
                </button>

                <button
                  type="button"
                  className={
                    printOptions.orientation ===
                    "landscape"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setPrintOptions(
                      (current) => ({
                        ...current,
                        orientation:
                          "landscape",
                      })
                    )
                  }
                >
                  Landscape
                </button>
              </div>

              <div className="simple-print-actions">
                <button
                  type="button"
                  onClick={() =>
                    setPrintPage((page) =>
                      Math.max(
                        0,
                        page - 1
                      )
                    )
                  }
                  disabled={printPage === 0}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>

                <span>
                  {printPage + 1}/
                  {printPages.length}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPrintPage((page) =>
                      Math.min(
                        printPages.length - 1,
                        page + 1
                      )
                    )
                  }
                  disabled={
                    printPage >=
                    printPages.length - 1
                  }
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>

                <button
                  type="button"
                  className="pdf"
                  onClick={exportPdf}
                >
                  <Download size={15} />
                  PDF
                </button>

                <button
                  type="button"
                  className="primary"
                  onClick={printReport}
                >
                  <Printer size={15} />
                  Print
                </button>

                <button
                  type="button"
                  className="close"
                  onClick={() =>
                    setPrintOpen(false)
                  }
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </header>

            <main className="simple-print-preview">
              <article
                className={`simple-print-paper ${printOptions.orientation}`}
              >
                <header className="simple-print-report-header">
                  <div className="simple-print-logo">
                    {systemLogo ? (
                      <img
                        src={systemLogo}
                        alt={systemName}
                      />
                    ) : (
                      <span>
                        {systemName.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div>
                    <small>
                      OFFICIAL REPORT
                    </small>

                    <h1>
                      Suppliers Report
                    </h1>

                    <p>
                      Supplier records,
                      purchases and balances
                    </p>
                  </div>

                  <aside>
                    <strong>
                      {systemName}
                    </strong>

                    <span>
                      {new Date().toLocaleDateString(
                        "en-GB"
                      )}
                    </span>
                  </aside>
                </header>

                {printPage === 0 && (
                  <section className="simple-print-summary">
                    <div>
                      <span>
                        Total Suppliers
                      </span>

                      <strong>
                        {
                          filteredSuppliers.length
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Purchases
                      </span>

                      <strong>
                        {formatMoney(
                          summary.totalPurchases
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Total Paid</span>

                      <strong>
                        {formatMoney(
                          summary.totalPaid
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        We Owe
                      </span>

                      <strong>
                        {formatMoney(
                          summary.totalWeOwe
                        )}
                      </strong>
                    </div>
                  </section>
                )}

                <section className="simple-print-table supplier-simple-print-table">
                  <header>
                    <strong>
                      Supplier Records
                    </strong>

                    <span>
                      Page {printPage + 1} of{" "}
                      {printPages.length}
                    </span>
                  </header>

                  <table>
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>Supplier</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th>Purchases</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Balance</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(
                        printPages[
                          printPage
                        ] || []
                      ).map(
                        (
                          supplier,
                          rowIndex
                        ) => (
                          <tr
                            key={
                              supplier.id ||
                              supplier.supplierIndex
                            }
                          >
                            <td>
                              {printPage *
                                Number(
                                  printOptions.rowsPerPage ||
                                    18
                                ) +
                                rowIndex +
                                1}
                            </td>

                            <td>
                              <strong>
                                {supplier.supplierName ||
                                  "Unnamed Supplier"}
                              </strong>

                              <small>
                                {supplier.companyName ||
                                  "-"}
                              </small>
                            </td>

                            <td>
                              {supplier.contactPerson ||
                                "-"}
                              <small>
                                {supplier.phone ||
                                  "-"}
                              </small>
                            </td>

                            <td>
                              {supplier.status ||
                                "Unspecified"}
                            </td>

                            <td>
                              {
                                supplier.purchaseCount
                              }
                            </td>

                            <td>
                              {formatMoney(
                                supplier.totalPurchases
                              )}
                            </td>

                            <td>
                              {formatMoney(
                                supplier.totalPaid
                              )}
                            </td>

                            <td>
                              {getBalanceLabel(
                                supplier
                              )}
                              <small>
                                {formatMoney(
                                  supplier.weOweSupplier ||
                                    supplier.supplierOwesUs
                                )}
                              </small>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </section>

                <footer className="simple-print-footer">
                  <span>{systemName}</span>
                  <span>
                    Suppliers Report
                  </span>
                  <span>
                    Page {printPage + 1} of{" "}
                    {printPages.length}
                  </span>
                </footer>
              </article>
            </main>
          </section>
        </div>
      )}
    </div>
  );
}