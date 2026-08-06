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
import { useLocalCollection } from "../hooks/useLocalCollection";
import "./Reports.css";
import "./ReportFinancial.css";

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

const money = (value) =>
  `${Number(value || 0).toLocaleString("en-US")} AFN`;

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-GB");
};

const normalizeCategory = (category) => {
  if (!category) return "Other";

  if (typeof category === "string") {
    return category;
  }

  return (
    category.title ||
    category.name ||
    category.label ||
    String(category.id || "Other")
  );
};

const getRecordDate = (record) =>
  record.date ||
  record.paymentDate ||
  record.createdAt ||
  record.updatedAt ||
  "";

const makeRecord = ({
  id,
  type,
  title,
  amount,
  date,
  category,
  source,
  description = "",
  createdAt,
}) => ({
  id,
  type:
    normalize(type) === "expense"
      ? "expense"
      : "income",
  title: title || "Financial Record",
  amount: Number(amount || 0),
  date: date || createdAt || "",
  category: normalizeCategory(category),
  source: source || "system",
  description,
  createdAt:
    createdAt || date || new Date().toISOString(),
});

export default function ReportFinancial({
  company = {},
}) {
  const navigate = useNavigate();

  const [transactions] =
    useJsonCollection("transactions");

  const [employeeAdjustments] =
    useLocalCollection("employeeAdjustments");

  const [customerPayments] =
    useJsonCollection("customerPayments");

  const [customerTravels] =
    useJsonCollection("customerTravels");

  const [travelExpenses] =
    useJsonCollection("travelExpenses");

  const [carRepairs] =
    useJsonCollection("carRepairs");

  const [employeePayments] =
    useJsonCollection("employeePayments");

  const [supplierPayments] =
    useJsonCollection("supplierPayments");

  const [assetMovements] =
    useJsonCollection("assetMovements");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState("all");
  const [categoryFilter, setCategoryFilter] =
    useState("all");
  const [sourceFilter, setSourceFilter] =
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
      rowsPerPage: 20,
    });

  const systemName =
    company.companyName ||
    company.systemName ||
    "ISP Smart";

  const systemLogo =
    company.logo ||
    company.logoUrl ||
    "";

  const allRecords = useMemo(() => {
    const existingKeys = new Set(
      transactions.map(
        (record) =>
          `${record.source || ""}|${record.referenceId || record.id || ""}`
      )
    );

    const result = transactions.map(
      (record) =>
        makeRecord({
          ...record,
          id: record.id,
          title: record.title,
          category: record.category,
          source: record.source,
        })
    );

    const pushLegacy = (
      source,
      referenceId,
      record
    ) => {
      const key =
        `${source}|${referenceId || ""}`;

      if (existingKeys.has(key)) return;

      result.push(
        makeRecord({
          ...record,
          id:
            record.id ||
            `${source}-${referenceId}`,
          source,
        })
      );
    };

    customerTravels.forEach((record) => {
      if (!(Number(record.paidAmount || 0) > 0)) {
        return;
      }

      pushLegacy(
        "customer-travel",
        record.id,
        {
          id: `travel-${record.id}`,
          type: "income",
          title:
            `Travel Payment ${record.travelName || record.customerName || ""}`.trim(),
          amount: record.paidAmount,
          date: getRecordDate(record),
          category: "Travel Income",
          description:
            "Customer travel payment",
          createdAt:
            record.createdAt ||
            record.updatedAt,
        }
      );
    });

    customerPayments.forEach((payment) => {
      if (
        payment.source ===
        "deposit-refund-offset"
      ) {
        return;
      }

      const isExpense =
        normalize(
          payment.direction ||
          payment.paymentDirection
        ) === "us-to-customer";

      pushLegacy(
        "customer-payment",
        payment.id,
        {
          id: `customer-payment-${payment.id}`,
          type: isExpense
            ? "expense"
            : "income",
          title:
            payment.title ||
            (isExpense
              ? `Paid to Customer ${payment.customerName || ""}`.trim()
              : `Customer Payment ${payment.customerName || ""}`.trim()),
          amount: payment.amount,
          date: getRecordDate(payment),
          category: isExpense
            ? "Customer Refund"
            : "Customer Payment",
          description:
            payment.description ||
            payment.notes ||
            "",
          createdAt:
            payment.createdAt ||
            payment.updatedAt,
        }
      );
    });

    travelExpenses.forEach((expense) => {
      pushLegacy(
        "travel-expense",
        expense.id,
        {
          id: `travel-expense-${expense.id}`,
          type: "expense",
          title:
            `Travel Expense ${expense.travelName || ""}${expense.title ? `: ${expense.title}` : ""}`.trim(),
          amount: expense.amount,
          date: getRecordDate(expense),
          category:
            expense.category ||
            "Travel Expense",
          description:
            expense.description || "",
          createdAt:
            expense.createdAt ||
            expense.updatedAt,
        }
      );
    });

    carRepairs.forEach((expense) => {
      if (
        expense.source ===
        "travel-expense"
      ) {
        return;
      }

      pushLegacy(
        "car-expense",
        expense.id,
        {
          id: `car-expense-${expense.id}`,
          type: "expense",
          title:
            `Vehicle Expense ${expense.carPlate || ""}${expense.title ? `: ${expense.title}` : ""}`.trim(),
          amount: expense.amount,
          date: getRecordDate(expense),
          category:
            expense.category ||
            "Vehicle Expense",
          description:
            expense.description || "",
          createdAt:
            expense.createdAt ||
            expense.updatedAt,
        }
      );
    });

    employeePayments.forEach((payment) => {
      pushLegacy(
        "employee-payment",
        payment.id,
        {
          id: `employee-payment-${payment.id}`,
          type: "expense",
          title:
            `Employee Payment ${payment.employeeName || ""}`.trim(),
          amount: payment.amount,
          date: getRecordDate(payment),
          category: "Salary",
          description:
            payment.description || "",
          createdAt:
            payment.createdAt ||
            payment.updatedAt,
        }
      );
    });

    supplierPayments.forEach((payment) => {
      const isBalance =
        normalize(
          payment.recordType ||
          payment.type
        ) === "balance";

      if (isBalance) return;

      const supplierPaysUs =
        payment.direction ===
        "supplier_pays_us";

      pushLegacy(
        "supplier-payment",
        payment.id,
        {
          id: `supplier-payment-${payment.id}`,
          type: supplierPaysUs
            ? "income"
            : "expense",
          title: supplierPaysUs
            ? `Supplier Payment to Us ${payment.supplierName || ""}`.trim()
            : `Supplier Payment ${payment.supplierName || ""}`.trim(),
          amount: payment.amount,
          date: getRecordDate(payment),
          category:
            "Supplier Payment",
          description:
            payment.notes || "",
          createdAt:
            payment.createdAt ||
            payment.updatedAt,
        }
      );
    });

    assetMovements.forEach((movement) => {
      const movementType =
        normalize(
          movement.movementType
        );

      const isCustomerSale =
        movementType === "transfer" &&
        normalize(
          movement.dealType
        ) === "sold" &&
        Number(
          movement.paidAmount || 0
        ) > 0;

      if (isCustomerSale) {
        pushLegacy(
          "customer-device-sale",
          movement.id,
          {
            id: `device-sale-${movement.id}`,
            type: "income",
            title:
              `Device Sale ${movement.deviceName || movement.assetId || ""}`.trim(),
            amount:
              movement.paidAmount,
            date:
              getRecordDate(movement),
            category:
              "Customer Payment",
            description:
              movement.destinationName
                ? `Customer: ${movement.destinationName}`
                : "",
            createdAt:
              movement.createdAt ||
              movement.updatedAt,
          }
        );
      }

      if (
        movementType === "purchase"
      ) {
        pushLegacy(
          "asset-purchase",
          movement.id,
          {
            id: `asset-purchase-${movement.id}`,
            type: "expense",
            title:
              `Asset Purchase ${movement.deviceName || movement.assetId || ""}`.trim(),
            amount:
              movement.paidAmount ||
              movement.totalAmount,
            date:
              getRecordDate(movement),
            category: "Purchases",
            description:
              movement.supplierName
                ? `Supplier: ${movement.supplierName}`
                : "",
            createdAt:
              movement.createdAt ||
              movement.updatedAt,
          }
        );
      }
    });

    employeeAdjustments.forEach(
      (adjustment) => {
        const adjustmentType =
          normalize(adjustment.type);

        const isIncome = [
          "penalty",
          "debit",
        ].includes(adjustmentType);

        const typeLabel =
          adjustmentType
            ? adjustmentType
                .charAt(0)
                .toUpperCase() +
              adjustmentType.slice(1)
            : "Adjustment";

        pushLegacy(
          "employee-adjustment",
          adjustment.id,
          {
            id:
              `employee-adjustment-${adjustment.id}`,
            type: isIncome
              ? "income"
              : "expense",
            title:
              `Employee ${typeLabel} - ${adjustment.employeeName || ""}`.trim(),
            amount:
              adjustment.amount,
            date:
              adjustment.date ||
              String(
                adjustment.createdAt ||
                ""
              ).slice(0, 10),
            category:
              adjustmentType ===
              "salary"
                ? "Salary"
                : "Employee Adjustment",
            description:
              adjustment.reason || "",
            createdAt:
              adjustment.createdAt ||
              adjustment.updatedAt,
          }
        );
      }
    );

    return result
      .filter(
        (record) =>
          Number(record.amount || 0) >
          0
      )
      .sort(
        (first, second) =>
          new Date(
            second.createdAt ||
            second.date ||
            0
          ) -
          new Date(
            first.createdAt ||
            first.date ||
            0
          )
      );
  }, [
    transactions,
    employeeAdjustments,
    customerPayments,
    customerTravels,
    travelExpenses,
    carRepairs,
    employeePayments,
    supplierPayments,
    assetMovements,
  ]);

  const categoryOptions = useMemo(
    () =>
      [
        ...new Set(
          allRecords
            .map(
              (record) =>
                record.category
            )
            .filter(Boolean)
        ),
      ].sort((a, b) =>
        a.localeCompare(b)
      ),
    [allRecords]
  );

  const sourceOptions = useMemo(
    () =>
      [
        ...new Set(
          allRecords
            .map(
              (record) =>
                record.source
            )
            .filter(Boolean)
        ),
      ].sort((a, b) =>
        a.localeCompare(b)
      ),
    [allRecords]
  );

  const filteredRecords = useMemo(() => {
    const query = normalize(search);

    return allRecords.filter(
      (record) => {
        if (
          typeFilter !== "all" &&
          record.type !== typeFilter
        ) {
          return false;
        }

        if (
          categoryFilter !== "all" &&
          record.category !==
            categoryFilter
        ) {
          return false;
        }

        if (
          sourceFilter !== "all" &&
          record.source !== sourceFilter
        ) {
          return false;
        }

        const recordDate = String(
          record.date ||
          record.createdAt ||
          ""
        ).slice(0, 10);

        if (
          startDate &&
          recordDate &&
          recordDate < startDate
        ) {
          return false;
        }

        if (
          endDate &&
          recordDate &&
          recordDate > endDate
        ) {
          return false;
        }

        if (!query) return true;

        return [
          record.title,
          record.category,
          record.source,
          record.description,
          record.type,
          record.amount,
        ].some((value) =>
          normalize(value).includes(query)
        );
      }
    );
  }, [
    allRecords,
    search,
    typeFilter,
    categoryFilter,
    sourceFilter,
    startDate,
    endDate,
  ]);

  const summary = useMemo(() => {
    const income =
      filteredRecords
        .filter(
          (record) =>
            record.type === "income"
        )
        .reduce(
          (sum, record) =>
            sum +
            Number(record.amount || 0),
          0
        );

    const expenses =
      filteredRecords
        .filter(
          (record) =>
            record.type === "expense"
        )
        .reduce(
          (sum, record) =>
            sum +
            Number(record.amount || 0),
          0
        );

    const supplierExpenses =
      filteredRecords
        .filter(
          (record) =>
            record.type === "expense" &&
            normalize(record.source).includes(
              "supplier"
            )
        )
        .reduce(
          (sum, record) =>
            sum +
            Number(record.amount || 0),
          0
        );

    const employeeExpenses =
      filteredRecords
        .filter(
          (record) =>
            record.type === "expense" &&
            (normalize(record.source).includes(
              "employee"
            ) ||
              normalize(
                record.category
              ) === "salary")
        )
        .reduce(
          (sum, record) =>
            sum +
            Number(record.amount || 0),
          0
        );

    return {
      income,
      expenses,
      net: income - expenses,
      supplierExpenses,
      employeeExpenses,
      records:
        filteredRecords.length,
    };
  }, [filteredRecords]);

  const printPages = useMemo(() => {
    const rowsPerPage = Math.max(
      1,
      Number(
        printOptions.rowsPerPage
      ) || 20
    );

    if (!filteredRecords.length) {
      return [[]];
    }

    const pages = [];

    for (
      let index = 0;
      index <
      filteredRecords.length;
      index += rowsPerPage
    ) {
      pages.push(
        filteredRecords.slice(
          index,
          index + rowsPerPage
        )
      );
    }

    return pages;
  }, [
    filteredRecords,
    printOptions.rowsPerPage,
  ]);

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setSourceFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const applyPrintSettings = () => {
    const styleId =
      "financial-report-print-settings";

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
          ".financial-report-print-page"
        )
      );

      if (!pages.length) {
        throw new Error(
          "No financial report pages found."
        );
      }

      const pdf = new jsPDF({
        orientation:
          printOptions.orientation,
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
          pageWidth /
            canvas.width,
          pageHeight /
            canvas.height
        );

        if (index > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          image,
          "JPEG",
          (pageWidth -
            canvas.width * ratio) /
            2,
          (pageHeight -
            canvas.height * ratio) /
            2,
          canvas.width * ratio,
          canvas.height * ratio,
          undefined,
          "FAST"
        );
      }

      pdf.save(
        `Financial-Report-${new Date()
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

  const renderRow = (
    record,
    rowNumber
  ) => (
    <tr key={record.id || rowNumber}>
      <td>{rowNumber}</td>

      <td>
        <strong>
          {record.title}
        </strong>

        <small>
          {record.description || "-"}
        </small>
      </td>

      <td>
        <span
          className={`financial-report-type ${record.type}`}
        >
          {record.type}
        </span>
      </td>

      <td>{record.category}</td>

      <td>{record.source}</td>

      <td
        className={
          record.type === "income"
            ? "financial-report-income"
            : "financial-report-expense"
        }
      >
        {money(record.amount)}
      </td>

      <td>
        {formatDate(
          record.date ||
          record.createdAt
        )}
      </td>
    </tr>
  );

  return (
    <div className="reports-page financial-report-page">
      <header className="reports-page-heading no-print">
        <div>
          <span>REPORTING CENTER</span>

          <h1>Financial Report</h1>

          <p>
            Review income, expenses,
            categories, sources, and net
            financial results.
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

      <section className="financial-report-summary reports-screen-summary">
        <div>
          <span>Total Income</span>

          <strong>
            {money(summary.income)}
          </strong>
        </div>

        <div>
          <span>Total Expenses</span>

          <strong>
            {money(summary.expenses)}
          </strong>
        </div>

        <div>
          <span>
            {summary.net >= 0
              ? "Net Profit"
              : "Net Loss"}
          </span>

          <strong>
            {money(
              Math.abs(summary.net)
            )}
          </strong>
        </div>

        <div>
          <span>Supplier Expenses</span>

          <strong>
            {money(
              summary.supplierExpenses
            )}
          </strong>
        </div>

        <div>
          <span>Employee Expenses</span>

          <strong>
            {money(
              summary.employeeExpenses
            )}
          </strong>
        </div>

        <div>
          <span>Total Records</span>

          <strong>
            {summary.records}
          </strong>
        </div>
      </section>

      <section className="reports-filter-panel financial-report-filters no-print">
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
            placeholder="Search title, category or source..."
          />
        </div>

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Types
          </option>

          <option value="income">
            Income
          </option>

          <option value="expense">
            Expense
          </option>
        </select>

        <select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Categories
          </option>

          {categoryOptions.map(
            (category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            )
          )}
        </select>

        <select
          value={sourceFilter}
          onChange={(event) =>
            setSourceFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Sources
          </option>

          {sourceOptions.map(
            (source) => (
              <option
                key={source}
                value={source}
              >
                {source}
              </option>
            )
          )}
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

      <section className="reports-table-card reports-screen-table financial-report-table-card">
        <div className="reports-table-heading">
          <div>
            <h2>
              Financial Records
            </h2>

            <p>
              Showing{" "}
              {filteredRecords.length}{" "}
              financial records
            </p>
          </div>
        </div>

        <div className="reports-table-wrap">
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Record</th>
                <th>Type</th>
                <th>Category</th>
                <th>Source</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map(
                (record, index) =>
                  renderRow(
                    record,
                    index + 1
                  )
              )}

              {!filteredRecords.length && (
                <tr>
                  <td
                    colSpan="7"
                    className="reports-empty-state"
                  >
                    No financial records match
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
          (pageRecords, pageIndex) => (
            <article
              key={pageIndex}
              className="reports-print-page financial-report-print-page"
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
                    Financial Report
                  </h1>

                  <p>
                    Income, expenses and net
                    financial result
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
                <section className="financial-report-summary reports-print-summary">
                  <div>
                    <span>Total Income</span>

                    <strong>
                      {money(
                        summary.income
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total Expenses
                    </span>

                    <strong>
                      {money(
                        summary.expenses
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      {summary.net >= 0
                        ? "Net Profit"
                        : "Net Loss"}
                    </span>

                    <strong>
                      {money(
                        Math.abs(
                          summary.net
                        )
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Total Records</span>

                    <strong>
                      {summary.records}
                    </strong>
                  </div>
                </section>
              )}

              <section className="reports-table-card reports-print-table-card financial-report-print-table">
                <div className="reports-table-heading">
                  <div>
                    <h2>
                      Financial Records
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
                        <th>Record</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Source</th>
                        <th>Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pageRecords.map(
                        (
                          record,
                          rowIndex
                        ) => (
                          <tr
                            key={
                              record.id ||
                              rowIndex
                            }
                          >
                            <td>
                              {pageIndex *
                                Number(
                                  printOptions.rowsPerPage
                                ) +
                                rowIndex +
                                1}
                            </td>

                            <td>
                              <strong>
                                {record.title}
                              </strong>

                              <small>
                                {record.description ||
                                  "-"}
                              </small>
                            </td>

                            <td>
                              {record.type}
                            </td>

                            <td>
                              {record.category}
                            </td>

                            <td>
                              {record.source}
                            </td>

                            <td>
                              {money(
                                record.amount
                              )}
                            </td>

                            <td>
                              {formatDate(
                                record.date ||
                                record.createdAt
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <footer className="reports-print-page-footer">
                <span>{systemName}</span>
                <span>
                  Financial Report
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
                  Financial Report
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
                      Financial Report
                    </h1>

                    <p>
                      Income, expenses and net
                      result
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
                        Total Income
                      </span>

                      <strong>
                        {money(
                          summary.income
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Total Expenses
                      </span>

                      <strong>
                        {money(
                          summary.expenses
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        {summary.net >= 0
                          ? "Net Profit"
                          : "Net Loss"}
                      </span>

                      <strong>
                        {money(
                          Math.abs(
                            summary.net
                          )
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Total Records
                      </span>

                      <strong>
                        {summary.records}
                      </strong>
                    </div>
                  </section>
                )}

                <section className="simple-print-table financial-simple-print-table">
                  <header>
                    <strong>
                      Financial Records
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
                        <th>Record</th>
                        <th>Type</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(
                        printPages[
                          printPage
                        ] || []
                      ).map(
                        (
                          record,
                          rowIndex
                        ) => (
                          <tr
                            key={
                              record.id ||
                              rowIndex
                            }
                          >
                            <td>
                              {printPage *
                                Number(
                                  printOptions.rowsPerPage
                                ) +
                                rowIndex +
                                1}
                            </td>

                            <td>
                              <strong>
                                {record.title}
                              </strong>

                              <small>
                                {record.source}
                              </small>
                            </td>

                            <td>
                              {record.type}
                            </td>

                            <td>
                              {record.category}
                            </td>

                            <td>
                              {money(
                                record.amount
                              )}
                            </td>

                            <td>
                              {formatDate(
                                record.date ||
                                record.createdAt
                              )}
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
                    Financial Report
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