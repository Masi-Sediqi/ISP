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

const money = (value) =>
  Number(value || 0).toLocaleString("en-US");

function normalizeDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-GB");
}

function formatTime(value, fallback) {
  const raw = String(value || "").trim();

  if (/\b(?:AM|PM)\b/i.test(raw)) {
    return raw.toUpperCase();
  }

  if (raw) {
    const match = raw.match(
      /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/
    );

    if (match) {
      let hour = Number(match[1]);
      const minute = match[2];
      const second = match[3] || "00";
      const meridiem = hour >= 12 ? "PM" : "AM";

      hour %= 12;
      if (hour === 0) hour = 12;

      return `${String(hour).padStart(
        2,
        "0"
      )}:${minute}:${second} ${meridiem}`;
    }
  }

  const date = new Date(fallback || value);

  if (Number.isNaN(date.getTime())) {
    return raw || "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kabul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

function firstValue(...values) {
  return values.find(
    (value) =>
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
  );
}

function getId(record) {
  return firstValue(
    record?.id,
    record?._id,
    record?.uuid
  );
}

function getSaleDate(sale) {
  return firstValue(
    sale.afghanistanDate,
    sale.saleDate,
    sale.date,
    sale.createdAt
  );
}

function getSaleTime(sale) {
  return firstValue(
    sale.afghanistanTime,
    sale.time
  );
}

function getProjectName(sale, project) {
  return firstValue(
    sale.projectName,
    sale.projectTitle,
    sale.project,
    project?.name,
    project?.projectName,
    project?.title,
    "Unnamed Project"
  );
}

function getCustomerName(sale, customer) {
  return firstValue(
    sale.customerName,
    sale.fullName,
    customer?.fullName,
    customer?.customerName,
    customer?.personName,
    "Unnamed Customer"
  );
}

function getSourceName(sale, customer) {
  return firstValue(
    sale.sourceEmployeeName,
    sale.sourceName,
    sale.source,
    customer?.sourceEmployeeName,
    customer?.source,
    "Not specified"
  );
}

function getUnit(sale, project) {
  return firstValue(
    sale.unit,
    sale.currency,
    sale.currencyUnit,
    project?.unit,
    project?.currency,
    "AFN"
  );
}

function getPrice(sale, project) {
  return Number(
    firstValue(
      sale.price,
      sale.projectAmount,
      sale.totalAmount,
      sale.amount,
      project?.price,
      project?.amount,
      0
    )
  );
}

function getPaid(sale) {
  return Number(
    firstValue(
      sale.paid,
      sale.paidAmount,
      sale.payment,
      0
    )
  );
}

function getRemaining(sale, project) {
  const explicit = firstValue(
    sale.remaining,
    sale.remainingAmount,
    sale.balance
  );

  if (explicit !== undefined) {
    return Number(explicit || 0);
  }

  return Math.max(
    0,
    getPrice(sale, project) - getPaid(sale)
  );
}

export default function ProjectReport({
  company = {},
}) {
  const [projectSales] =
    useJsonCollection("projectSales");
  const [projects] =
    useJsonCollection("projects");
  const [customers] =
    useJsonCollection("customers");

  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [source, setSource] =
    useState("all");
  const [projectFilter, setProjectFilter] =
    useState("all");
  const [startDate, setStartDate] =
    useState("");
  const [endDate, setEndDate] =
    useState("");
  const [printOpen, setPrintOpen] =
    useState(false);
  const [orientation, setOrientation] =
    useState("landscape");
  const [previewPage, setPreviewPage] =
    useState(0);

  const systemName =
    company.companyName ||
    company.systemName ||
    "ISP Smart";

  const systemLogo =
    company.logo ||
    company.logoUrl ||
    "";

  const normalizedSales = useMemo(() => {
    return projectSales.map((sale) => {
      const projectId = firstValue(
        sale.projectId,
        sale.project_id
      );
      const customerId = firstValue(
        sale.customerId,
        sale.customer_id
      );

      const project = projects.find(
        (item) =>
          String(getId(item)) ===
          String(projectId || "")
      );

      const customer = customers.find(
        (item) =>
          String(getId(item)) ===
          String(customerId || "")
      );

      return {
        ...sale,
        _project: project,
        _customer: customer,
        _projectName: getProjectName(
          sale,
          project
        ),
        _customerName: getCustomerName(
          sale,
          customer
        ),
        _sourceName: getSourceName(
          sale,
          customer
        ),
        _unit: getUnit(sale, project),
        _price: getPrice(sale, project),
        _paid: getPaid(sale),
        _remaining: getRemaining(
          sale,
          project
        ),
        _date: getSaleDate(sale),
        _time: getSaleTime(sale),
      };
    });
  }, [projectSales, projects, customers]);

  const sourceOptions = useMemo(
    () =>
      [
        ...new Set(
          normalizedSales
            .map((sale) => sale._sourceName)
            .filter(Boolean)
        ),
      ].sort((a, b) =>
        a.localeCompare(b)
      ),
    [normalizedSales]
  );

  const projectOptions = useMemo(
    () =>
      [
        ...new Set(
          normalizedSales
            .map((sale) => sale._projectName)
            .filter(Boolean)
        ),
      ].sort((a, b) =>
        a.localeCompare(b)
      ),
    [normalizedSales]
  );

  const filteredSales = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return normalizedSales
      .filter((sale) => {
        if (
          source !== "all" &&
          sale._sourceName !== source
        ) {
          return false;
        }

        if (
          projectFilter !== "all" &&
          sale._projectName !== projectFilter
        ) {
          return false;
        }

        const date =
          normalizeDate(sale._date);

        if (
          startDate &&
          date &&
          date < startDate
        ) {
          return false;
        }

        if (
          endDate &&
          date &&
          date > endDate
        ) {
          return false;
        }

        if (!query) return true;

        return [
          sale._projectName,
          sale._customerName,
          sale._sourceName,
          sale._unit,
          sale.reference,
          sale.invoiceNumber,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query)
        );
      })
      .sort(
        (first, second) =>
          new Date(
            second.createdAt ||
              second._date ||
              0
          ) -
          new Date(
            first.createdAt ||
              first._date ||
              0
          )
      );
  }, [
    normalizedSales,
    search,
    source,
    projectFilter,
    startDate,
    endDate,
  ]);

  const totalSold = filteredSales.reduce(
    (sum, sale) => sum + sale._price,
    0
  );

  const totalPaid = filteredSales.reduce(
    (sum, sale) => sum + sale._paid,
    0
  );

  const totalRemaining =
    filteredSales.reduce(
      (sum, sale) =>
        sum + sale._remaining,
      0
    );

  const printPages = useMemo(() => {
    const pageSize =
      orientation === "landscape"
        ? 22
        : 18;

    if (!filteredSales.length) {
      return [[]];
    }

    const pages = [];

    for (
      let index = 0;
      index < filteredSales.length;
      index += pageSize
    ) {
      pages.push(
        filteredSales.slice(
          index,
          index + pageSize
        )
      );
    }

    return pages;
  }, [filteredSales, orientation]);

  const openPrint = () => {
    setPreviewPage(0);
    setPrintOpen(true);
  };

  const applyPrintSettings = () => {
    const id =
      "project-report-print-page-style";

    let style =
      document.getElementById(id);

    if (!style) {
      style =
        document.createElement("style");
      style.id = id;
      document.head.appendChild(style);
    }

    style.textContent = `
      @media print {
        @page {
          size: A4 ${orientation};
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
        "project-report-pdf-exporting"
      );

      await new Promise((resolve) =>
        window.setTimeout(resolve, 140)
      );

      const pages = Array.from(
        document.querySelectorAll(
          ".project-report-print-page"
        )
      );

      const pdf = new jsPDF({
        orientation,
        unit: "mm",
        format: "a4",
        compress: true,
      });

      for (
        let index = 0;
        index < pages.length;
        index += 1
      ) {
        const canvas = await html2canvas(
          pages[index],
          {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
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
        `Projects-Report-${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`
      );
    } catch (error) {
      console.error(error);
      window.alert(
        "Run: npm install html2canvas jspdf"
      );
    } finally {
      document.body.classList.remove(
        "project-report-pdf-exporting"
      );
    }
  };

  return (
    <div className="reports-page project-report-page">
      <header className="reports-page-heading no-print">
        <div>
          <span>REPORTING CENTER</span>
          <h1>Projects Report</h1>
          <p>
            View sold projects, customers,
            sources and payment balances.
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
            onClick={openPrint}
          >
            <Printer size={16} />
            Print Report
          </button>
        </div>
      </header>

      <section className="project-report-summary no-print">
        <div>
          <span>Sold Projects</span>
          <strong>
            {filteredSales.length}
          </strong>
        </div>

        <div>
          <span>Total Amount</span>
          <strong>
            {money(totalSold)}
          </strong>
        </div>

        <div>
          <span>Total Paid</span>
          <strong>
            {money(totalPaid)}
          </strong>
        </div>

        <div>
          <span>Total Remaining</span>
          <strong>
            {money(totalRemaining)}
          </strong>
        </div>
      </section>

      <section className="reports-filter-panel project-report-filters no-print">
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
            placeholder="Search project, customer or source..."
          />
        </div>

        <select
          value={projectFilter}
          onChange={(event) =>
            setProjectFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Projects
          </option>

          {projectOptions.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

        <select
          value={source}
          onChange={(event) =>
            setSource(
              event.target.value
            )
          }
        >
          <option value="all">
            All Sources
          </option>

          {sourceOptions.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
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
          onClick={() => {
            setSearch("");
            setSource("all");
            setProjectFilter("all");
            setStartDate("");
            setEndDate("");
          }}
        >
          <X size={16} />
        </button>
      </section>

      <section className="reports-table-card no-print">
        <div className="reports-table-heading">
          <h2>Project Sales Records</h2>
          <p>
            {filteredSales.length} sold
            project records
          </p>
        </div>

        <div className="reports-table-wrap">
          <table className="project-report-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Project</th>
                <th>Customer</th>
                <th>Source</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Date & Time</th>
              </tr>
            </thead>

            <tbody>
              {filteredSales.map(
                (sale, index) => (
                  <tr
                    key={
                      getId(sale) ||
                      index
                    }
                  >
                    <td>{index + 1}</td>
                    <td>
                      <strong>
                        {sale._projectName}
                      </strong>
                    </td>
                    <td>
                      <strong>
                        {sale._customerName}
                      </strong>
                    </td>
                    <td>
                      {sale._sourceName}
                    </td>
                    <td>
                      {money(sale._price)}{" "}
                      {sale._unit}
                    </td>
                    <td>
                      {money(sale._paid)}{" "}
                      {sale._unit}
                    </td>
                    <td>
                      <span
                        className={
                          sale._remaining > 0
                            ? "project-balance-due"
                            : "project-balance-clear"
                        }
                      >
                        {money(
                          sale._remaining
                        )}{" "}
                        {sale._unit}
                      </span>
                    </td>
                    <td>
                      <div className="reports-date-cell">
                        <strong>
                          {formatDate(
                            sale._date
                          )}
                        </strong>
                        <small>
                          {formatTime(
                            sale._time,
                            sale.createdAt ||
                              sale._date
                          )}
                        </small>
                      </div>
                    </td>
                  </tr>
                )
              )}

              {!filteredSales.length && (
                <tr>
                  <td
                    colSpan="8"
                    className="reports-empty-state"
                  >
                    No project sale records
                    match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="project-report-print-pages">
        {printPages.map(
          (pageSales, pageIndex) => (
            <article
              className="project-report-print-page"
              key={pageIndex}
            >
              <header className="project-report-print-header">
                <div>
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

                <section>
                  <small>
                    OFFICIAL REPORT
                  </small>
                  <h1>Projects Report</h1>
                  <p>
                    Sold projects and payment
                    balances
                  </p>
                </section>

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

              {pageIndex === 0 && (
                <section className="project-report-print-summary">
                  <div>
                    <span>Sold Projects</span>
                    <strong>
                      {filteredSales.length}
                    </strong>
                  </div>

                  <div>
                    <span>Total Amount</span>
                    <strong>
                      {money(totalSold)}
                    </strong>
                  </div>

                  <div>
                    <span>Total Paid</span>
                    <strong>
                      {money(totalPaid)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Total Remaining
                    </span>
                    <strong>
                      {money(totalRemaining)}
                    </strong>
                  </div>
                </section>
              )}

              <section className="project-report-print-table">
                <header>
                  <strong>
                    Project Sales Records
                  </strong>
                  <span>
                    Page {pageIndex + 1} of{" "}
                    {printPages.length}
                  </span>
                </header>

                <table>
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Project</th>
                      <th>Customer</th>
                      <th>Source</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Remaining</th>
                      <th>Date & Time</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageSales.map(
                      (sale, rowIndex) => (
                        <tr
                          key={
                            getId(sale) ||
                            rowIndex
                          }
                        >
                          <td>
                            {pageIndex *
                              (orientation ===
                              "landscape"
                                ? 22
                                : 18) +
                              rowIndex +
                              1}
                          </td>
                          <td>
                            {sale._projectName}
                          </td>
                          <td>
                            {sale._customerName}
                          </td>
                          <td>
                            {sale._sourceName}
                          </td>
                          <td>
                            {money(
                              sale._price
                            )}{" "}
                            {sale._unit}
                          </td>
                          <td>
                            {money(
                              sale._paid
                            )}{" "}
                            {sale._unit}
                          </td>
                          <td>
                            {money(
                              sale._remaining
                            )}{" "}
                            {sale._unit}
                          </td>
                          <td>
                            <strong>
                              {formatDate(
                                sale._date
                              )}
                            </strong>
                            <small>
                              {formatTime(
                                sale._time,
                                sale.createdAt ||
                                  sale._date
                              )}
                            </small>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </section>

              <footer>
                <span>{systemName}</span>
                <span>Projects Report</span>
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
            className="simple-print-studio project-print-studio"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <header className="simple-print-toolbar">
              <div className="simple-print-title">
                <Printer size={17} />
                <strong>
                  Projects Report
                </strong>
              </div>

              <div className="simple-print-orientation project-print-orientation">
                <button
                  type="button"
                  className={
                    orientation ===
                    "portrait"
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setOrientation(
                      "portrait"
                    );
                    setPreviewPage(0);
                  }}
                >
                  Portrait
                </button>

                <button
                  type="button"
                  className={
                    orientation ===
                    "landscape"
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    setOrientation(
                      "landscape"
                    );
                    setPreviewPage(0);
                  }}
                >
                  Landscape
                </button>
              </div>

              <div className="simple-print-actions">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewPage(
                      (page) =>
                        Math.max(
                          0,
                          page - 1
                        )
                    )
                  }
                  disabled={
                    previewPage === 0
                  }
                >
                  <ChevronLeft size={16} />
                </button>

                <span>
                  {previewPage + 1}/
                  {printPages.length}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPreviewPage(
                      (page) =>
                        Math.min(
                          printPages.length -
                            1,
                          page + 1
                        )
                    )
                  }
                  disabled={
                    previewPage >=
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

            <main className="simple-print-preview project-print-preview">
              <article
                className={`simple-print-paper project-print-paper ${orientation}`}
              >
                <header className="simple-print-report-header project-print-report-header">
                  <div className="simple-print-logo">
                    {systemLogo ? (
                      <img
                        src={systemLogo}
                        alt={systemName}
                      />
                    ) : (
                      <span>
                        {systemName.charAt(
                          0
                        )}
                      </span>
                    )}
                  </div>

                  <div>
                    <small>
                      OFFICIAL REPORT
                    </small>
                    <h1>
                      Projects Report
                    </h1>
                    <p>
                      Sold projects and
                      payment balances
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

                {previewPage === 0 && (
                  <section className="simple-print-summary project-print-summary">
                    <div>
                      <span>
                        Sold Projects
                      </span>
                      <strong>
                        {filteredSales.length}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Total Amount
                      </span>
                      <strong>
                        {money(totalSold)}
                      </strong>
                    </div>

                    <div>
                      <span>Total Paid</span>
                      <strong>
                        {money(totalPaid)}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Total Remaining
                      </span>
                      <strong>
                        {money(
                          totalRemaining
                        )}
                      </strong>
                    </div>
                  </section>
                )}

                <section className="simple-print-table project-print-table">
                  <header>
                    <strong>
                      Project Sales Records
                    </strong>
                    <span>
                      Page {previewPage + 1}{" "}
                      of {printPages.length}
                    </span>
                  </header>

                  <table>
                    <thead>
                      <tr>
                        <th>No.</th>
                        <th>Project</th>
                        <th>Customer</th>
                        <th>Source</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Remaining</th>
                        <th>
                          Date & Time
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {(
                        printPages[
                          previewPage
                        ] || []
                      ).map(
                        (
                          sale,
                          rowIndex
                        ) => (
                          <tr
                            key={
                              getId(sale) ||
                              rowIndex
                            }
                          >
                            <td>
                              {previewPage *
                                (orientation ===
                                "landscape"
                                  ? 22
                                  : 18) +
                                rowIndex +
                                1}
                            </td>
                            <td>
                              {sale._projectName}
                            </td>
                            <td>
                              {sale._customerName}
                            </td>
                            <td>
                              {sale._sourceName}
                            </td>
                            <td>
                              {money(
                                sale._price
                              )}{" "}
                              {sale._unit}
                            </td>
                            <td>
                              {money(
                                sale._paid
                              )}{" "}
                              {sale._unit}
                            </td>
                            <td>
                              {money(
                                sale._remaining
                              )}{" "}
                              {sale._unit}
                            </td>
                            <td>
                              <strong>
                                {formatDate(
                                  sale._date
                                )}
                              </strong>
                              <small>
                                {formatTime(
                                  sale._time,
                                  sale.createdAt ||
                                    sale._date
                                )}
                              </small>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </section>

                <footer className="simple-print-footer project-print-footer">
                  <span>{systemName}</span>
                  <span>
                    Projects Report
                  </span>
                  <span>
                    Page {previewPage + 1}{" "}
                    of {printPages.length}
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