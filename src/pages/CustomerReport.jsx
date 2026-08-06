import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FolderKanban,
  Download,
  FileText,
  Landmark,
  Minus,
  Plus,
  Printer,
  Search,
  Settings2,
  Share2,
  Truck,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import "./Reports.css";

const reportCards = [
  {
    key: "customers",
    title: "Customers",
    description: "All customers from every department",
    icon: Users,
  },
  {
    key: "projects",
    title: "Projects",
    description: "Project records and current status",
    icon: FolderKanban,
  },
  {
    key: "employees",
    title: "Employee",
    description: "Employee records and departments",
    icon: UserRoundCheck,
  },
  {
    key: "suppliers",
    title: "Suppliers",
    description: "Suppliers, purchases and balances",
    icon: Truck,
  },
  {
    key: "reception",
    title: "Reception",
    description: "Reception registrations and referrals",
    icon: Building2,
  },
  {
    key: "financial",
    title: "Financial",
    description: "Income, expenses and balances",
    icon: Landmark,
  },
];

const departmentLabels = {
  consultant: "Consultant",
  travel: "Travel",
  technology: "Technology",
  media: "Media",
};

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

function getCustomerName(customer) {
  return (
    customer.fullName ||
    customer.customerName ||
    customer.personName ||
    "Unnamed Customer"
  );
}

function getCustomerPhone(customer) {
  return (
    customer.phone ||
    customer.contactNumber ||
    customer.phoneNumber ||
    "-"
  );
}

function getCustomerDepartment(customer) {
  return String(
    customer.customerType ||
      customer.department ||
      "other"
  ).toLowerCase();
}

function getCustomerSource(customer) {
  return (
    customer.source ||
    customer.sourceEmployeeName ||
    "Not specified"
  );
}

function getCustomerDate(customer) {
  return (
    customer.afghanistanDate ||
    customer.date ||
    customer.createdAt ||
    ""
  );
}

function getCustomerTime(customer) {
  return (
    customer.afghanistanTime ||
    customer.time ||
    ""
  );
}

function formatTimeWithMeridiem(value, fallbackDate) {
  if (!value && !fallbackDate) return "-";

  const rawValue = String(value || "").trim();

  if (/\b(?:AM|PM)\b/i.test(rawValue)) {
    return rawValue.toUpperCase();
  }

  if (rawValue) {
    const match = rawValue.match(
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

  const date = new Date(fallbackDate || value);

  if (Number.isNaN(date.getTime())) {
    return rawValue || "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kabul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

export default function CustomerReport({
  company = {},
}) {
  const [customers] =
    useJsonCollection("customers");

  const navigate = useNavigate();

  const activeReport = "customers";

  const openReport = () => {
    navigate("/reports/customers");
  };

  const closeReport = () => {
    navigate("/reports");
  };

  const [search, setSearch] = useState("");
  const [department, setDepartment] =
    useState("all");
  const [source, setSource] =
    useState("all");
  const [startDate, setStartDate] =
    useState("");
  const [endDate, setEndDate] =
    useState("");

  const [printOptionsOpen, setPrintOptionsOpen] =
    useState(false);

  const [printOptions, setPrintOptions] =
    useState({
      paperSize: "A4",
      orientation: "portrait",
      margin: "narrow",
      rowsPerPage: 20,
      template: "blue",
      zoom: 82,
      titleSize: 22,
      subtitleSize: 11,
      headerSize: 9,
      bodySize: 9,
      footerSize: 8,
    });

  const [printPreviewPage, setPrintPreviewPage] =
    useState(0);

  const systemName =
    company.companyName ||
    company.systemName ||
    "ISP Smart";

  const systemLogo =
    company.logo ||
    company.logoUrl ||
    "";

  const sourceOptions = useMemo(
    () =>
      [...new Set(
        customers
          .map(getCustomerSource)
          .filter(Boolean)
      )].sort((a, b) =>
        a.localeCompare(b)
      ),
    [customers]
  );

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers
      .filter((customer) => {
        const customerDepartment =
          getCustomerDepartment(customer);

        if (
          department !== "all" &&
          customerDepartment !== department
        ) {
          return false;
        }

        const customerSource =
          getCustomerSource(customer);

        if (
          source !== "all" &&
          customerSource !== source
        ) {
          return false;
        }

        const customerDate =
          normalizeDate(getCustomerDate(customer));

        if (
          startDate &&
          customerDate &&
          customerDate < startDate
        ) {
          return false;
        }

        if (
          endDate &&
          customerDate &&
          customerDate > endDate
        ) {
          return false;
        }

        if (!query) return true;

        return [
          getCustomerName(customer),
          getCustomerPhone(customer),
          customer.email,
          customerSource,
          customer.assignedEmployeeName,
          customerDepartment,
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
    customers,
    department,
    source,
    startDate,
    endDate,
    search,
  ]);

  const printPages = useMemo(() => {
    if (!filteredCustomers.length) {
      return [[]];
    }

    const rowsPerPage = Math.max(
      1,
      Number(printOptions.rowsPerPage) || 25
    );

    const pages = [];

    for (
      let index = 0;
      index < filteredCustomers.length;
      index += rowsPerPage
    ) {
      pages.push(
        filteredCustomers.slice(
          index,
          index + rowsPerPage
        )
      );
    }

    return pages;
  }, [
    filteredCustomers,
    printOptions.rowsPerPage,
  ]);

  function resetFilters() {
    setSearch("");
    setDepartment("all");
    setSource("all");
    setStartDate("");
    setEndDate("");
  }

  function applyPrintSettings() {
    const styleId =
      "reports-dynamic-print-settings";

    let styleElement =
      document.getElementById(styleId);

    if (!styleElement) {
      styleElement =
        document.createElement("style");

      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const marginMap = {
      narrow: "7mm",
      normal: "14mm",
      wide: "20mm",
    };

    styleElement.textContent = `
      @media print {
        @page {
          size: ${printOptions.paperSize} ${printOptions.orientation};
          margin: ${
            marginMap[printOptions.margin] ||
            marginMap.normal
          };
        }

        .reports-print-title h1 {
          font-size: ${printOptions.titleSize}px !important;
        }

        .reports-print-title p {
          font-size: ${printOptions.subtitleSize}px !important;
        }

        .reports-print-table-card th {
          font-size: ${printOptions.headerSize}px !important;
        }

        .reports-print-table-card td {
          font-size: ${printOptions.bodySize}px !important;
        }

        .reports-print-page-footer {
          font-size: ${printOptions.footerSize}px !important;
        }
      }
    `;

    document.body.dataset.reportTemplate =
      printOptions.template;
  }

  function printReport() {
    applyPrintSettings();
    setPrintOptionsOpen(false);

    window.setTimeout(() => {
      window.print();
    }, 120);
  }

  async function exportPdf() {
    applyPrintSettings();

    try {
      const [{ default: html2canvas }, { jsPDF }] =
        await Promise.all([
          import("html2canvas"),
          import("jspdf"),
        ]);

      document.body.classList.add(
        "reports-pdf-exporting"
      );

      await new Promise((resolve) =>
        window.setTimeout(resolve, 160)
      );

      const pages = Array.from(
        document.querySelectorAll(
          ".reports-print-page"
        )
      );

      if (!pages.length) {
        throw new Error(
          "No report pages were found."
        );
      }

      const isLandscape =
        printOptions.orientation === "landscape";

      const pdf = new jsPDF({
        orientation: isLandscape
          ? "landscape"
          : "portrait",
        unit: "mm",
        format: printOptions.paperSize.toLowerCase(),
        compress: true,
      });

      for (let index = 0; index < pages.length; index += 1) {
        const page = pages[index];

        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });

        const image = canvas.toDataURL(
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

        const imageWidth = canvas.width * ratio;
        const imageHeight = canvas.height * ratio;
        const x = (pageWidth - imageWidth) / 2;
        const y = (pageHeight - imageHeight) / 2;

        if (index > 0) {
          pdf.addPage();
        }

        pdf.addImage(
          image,
          "JPEG",
          x,
          y,
          imageWidth,
          imageHeight,
          undefined,
          "FAST"
        );
      }

      pdf.save(
        `Customers-Report-${new Date()
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
  }

  if (activeReport === "customers") {
    return (
      <div className="reports-page">
        <header className="reports-page-heading no-print">
          <div>
            <span>REPORTING CENTER</span>
            <h1>Customer Report</h1>
            <p>
              Review customers from all departments,
              sources and registration dates.
            </p>
          </div>

          <div className="reports-heading-actions">
            <button
              type="button"
              className="reports-back-button"
              onClick={closeReport}
            >
              Reports
            </button>

            <button
              type="button"
              className="reports-print-button"
              onClick={() =>
                setPrintOptionsOpen(true)
              }
            >
              <Printer size={16} />
              Print Report
            </button>
          </div>
        </header>

        <section className="reports-print-header reports-screen-print-header">
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
            <small>OFFICIAL REPORT</small>
            <h1>Customers Report</h1>
            <p>
              Generated customer records from all
              departments
            </p>
          </div>

          <div className="reports-print-company">
            <strong>{systemName}</strong>
            <span>
              {new Date().toLocaleDateString(
                "en-GB"
              )}
            </span>
          </div>
        </section>

        <section className="reports-customer-summary reports-screen-summary">
          <div>
            <span>Total Customers</span>
            <strong>
              {filteredCustomers.length}
            </strong>
          </div>

          <div>
            <span>Consultant</span>
            <strong>
              {
                filteredCustomers.filter(
                  (customer) =>
                    getCustomerDepartment(
                      customer
                    ) === "consultant"
                ).length
              }
            </strong>
          </div>

          <div>
            <span>Travel</span>
            <strong>
              {
                filteredCustomers.filter(
                  (customer) =>
                    getCustomerDepartment(
                      customer
                    ) === "travel"
                ).length
              }
            </strong>
          </div>

          <div>
            <span>Technology & Media</span>
            <strong>
              {
                filteredCustomers.filter(
                  (customer) =>
                    ["technology", "media"].includes(
                      getCustomerDepartment(
                        customer
                      )
                    )
                ).length
              }
            </strong>
          </div>
        </section>

        <section className="reports-filter-panel no-print">
          <div className="reports-search-box">
            <Search size={17} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by customer name..."
            />
          </div>

          <select
            value={department}
            onChange={(event) =>
              setDepartment(event.target.value)
            }
          >
            <option value="all">
              All Departments
            </option>
            <option value="consultant">
              Consultant
            </option>
            <option value="travel">
              Travel
            </option>
            <option value="technology">
              Technology
            </option>
            <option value="media">
              Media
            </option>
          </select>

          <select
            value={source}
            onChange={(event) =>
              setSource(event.target.value)
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
                setStartDate(event.target.value)
              }
              aria-label="Start date"
            />
          </label>

          <label className="reports-date-filter">
            <CalendarDays size={15} />
            <input
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
              aria-label="End date"
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

        <section className="reports-table-card reports-screen-table">
          <div className="reports-table-heading">
            <div>
              <h2>Customer Records</h2>
              <p>
                Showing {filteredCustomers.length}{" "}
                customer records
              </p>
            </div>
          </div>

          <div className="reports-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Source</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map(
                  (customer, index) => {
                    const customerDepartment =
                      getCustomerDepartment(
                        customer
                      );

                    return (
                      <tr key={customer.id || index}>
                        <td>{index + 1}</td>

                        <td>
                          <div className="reports-customer-cell">
                            <span>
                              {getCustomerName(
                                customer
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </span>

                            <div>
                              <strong>
                                {getCustomerName(
                                  customer
                                )}
                              </strong>
                              <small>
                                {customer.email || "-"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td>
                          {getCustomerPhone(
                            customer
                          )}
                        </td>

                        <td>
                          <span
                            className={`reports-department-badge ${customerDepartment}`}
                          >
                            {departmentLabels[
                              customerDepartment
                            ] || "Other"}
                          </span>
                        </td>

                        <td>
                          {getCustomerSource(
                            customer
                          )}
                        </td>

                        <td>
                          {customer.assignedEmployeeName ||
                            "-"}
                        </td>

                        <td>
                          <span
                            className={`reports-status-badge ${String(
                              customer.followUpDecisionStatus ||
                                customer.followUpStatus ||
                                customer.assignmentStatus ||
                                "None"
                            )
                              .trim()
                              .toLowerCase()}`}
                          >
                            {customer.followUpDecisionStatus ||
                              customer.followUpStatus ||
                              customer.assignmentStatus ||
                              "None"}
                          </span>
                        </td>

                        <td>
                          <div className="reports-date-cell">
                            <strong>
                              {formatDate(
                                getCustomerDate(
                                  customer
                                )
                              )}
                            </strong>
                            <small>
                              {formatTimeWithMeridiem(
                                getCustomerTime(customer),
                                customer.createdAt ||
                                  customer.date
                              )}
                            </small>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}

                {!filteredCustomers.length && (
                  <tr>
                    <td
                      colSpan="8"
                      className="reports-empty-state"
                    >
                      No customer records match the
                      selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="reports-print-pages">
          {printPages.map((pageCustomers, pageIndex) => {
            const firstRecordNumber =
              pageIndex *
                Number(
                  printOptions.rowsPerPage || 20
                ) +
              1;

            return (
              <article
                className="reports-print-page"
                key={`print-page-${pageIndex}`}
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
                    <small>OFFICIAL REPORT</small>
                    <h1>Customers Report</h1>
                    <p>
                      Generated customer records from all
                      departments
                    </p>
                  </div>

                  <div className="reports-print-company">
                    <strong>{systemName}</strong>
                    <span>
                      {new Date().toLocaleDateString(
                        "en-GB"
                      )}
                    </span>
                  </div>
                </section>

                {pageIndex === 0 && (
                  <section className="reports-customer-summary reports-print-summary">
                    <div>
                      <span>Total Customers</span>
                      <strong>
                        {filteredCustomers.length}
                      </strong>
                    </div>

                    <div>
                      <span>Consultant</span>
                      <strong>
                        {
                          filteredCustomers.filter(
                            (customer) =>
                              getCustomerDepartment(
                                customer
                              ) === "consultant"
                          ).length
                        }
                      </strong>
                    </div>

                    <div>
                      <span>Travel</span>
                      <strong>
                        {
                          filteredCustomers.filter(
                            (customer) =>
                              getCustomerDepartment(
                                customer
                              ) === "travel"
                          ).length
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Technology & Media
                      </span>
                      <strong>
                        {
                          filteredCustomers.filter(
                            (customer) =>
                              [
                                "technology",
                                "media",
                              ].includes(
                                getCustomerDepartment(
                                  customer
                                )
                              )
                          ).length
                        }
                      </strong>
                    </div>
                  </section>
                )}

                <section className="reports-table-card reports-print-table-card">
                  <div className="reports-table-heading">
                    <div>
                      <h2>Customer Records</h2>
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
                          <th>Customer</th>
                          <th>Phone</th>
                          <th>Department</th>
                          <th>Source</th>
                          <th>Assigned To</th>
                          <th>Status</th>
                          <th>Date & Time</th>
                        </tr>
                      </thead>

                      <tbody>
                        {pageCustomers.map(
                          (customer, rowIndex) => {
                            const customerDepartment =
                              getCustomerDepartment(
                                customer
                              );

                            const absoluteIndex =
                              firstRecordNumber +
                              rowIndex;

                            return (
                              <tr
                                key={
                                  customer.id ||
                                  `${pageIndex}-${rowIndex}`
                                }
                              >
                                <td>{absoluteIndex}</td>

                                <td>
                                  <div className="reports-customer-cell">
                                    <span>
                                      {getCustomerName(
                                        customer
                                      )
                                        .charAt(0)
                                        .toUpperCase()}
                                    </span>

                                    <div>
                                      <strong>
                                        {getCustomerName(
                                          customer
                                        )}
                                      </strong>
                                      <small>
                                        {customer.email ||
                                          "-"}
                                      </small>
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  {getCustomerPhone(
                                    customer
                                  )}
                                </td>

                                <td>
                                  <span
                                    className={`reports-department-badge ${customerDepartment}`}
                                  >
                                    {departmentLabels[
                                      customerDepartment
                                    ] || "Other"}
                                  </span>
                                </td>

                                <td>
                                  {getCustomerSource(
                                    customer
                                  )}
                                </td>

                                <td>
                                  {customer.assignedEmployeeName ||
                                    "-"}
                                </td>

                                <td>
                                  <span
                                    className={`reports-status-badge ${String(
                                      customer.followUpDecisionStatus ||
                                        customer.followUpStatus ||
                                        customer.assignmentStatus ||
                                        "None"
                                    )
                                      .trim()
                                      .toLowerCase()}`}
                                  >
                                    {customer.followUpDecisionStatus ||
                                      customer.followUpStatus ||
                                      customer.assignmentStatus ||
                                      "None"}
                                  </span>
                                </td>

                                <td>
                                  <div className="reports-date-cell">
                                    <strong>
                                      {formatDate(
                                        getCustomerDate(
                                          customer
                                        )
                                      )}
                                    </strong>
                                    <small>
                                      {formatTimeWithMeridiem(
                                        getCustomerTime(
                                          customer
                                        ),
                                        customer.createdAt ||
                                          customer.date
                                      )}
                                    </small>
                                  </div>
                                </td>
                              </tr>
                            );
                          }
                        )}

                        {!pageCustomers.length && (
                          <tr>
                            <td
                              colSpan="8"
                              className="reports-empty-state"
                            >
                              No customer records match
                              the selected filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <footer className="reports-print-page-footer">
                  <span>{systemName}</span>
                  <span>Customers Report</span>
                  <span>
                    Page {pageIndex + 1} of{" "}
                    {printPages.length}
                  </span>
                </footer>
              </article>
            );
          })}
        </section>

        {printOptionsOpen && (
          <div
            className="simple-print-backdrop no-print"
            onMouseDown={() =>
              setPrintOptionsOpen(false)
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
                  <strong>Customers Report</strong>
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
                      setPrintOptions((current) => ({
                        ...current,
                        orientation: "portrait",
                      }))
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
                      setPrintOptions((current) => ({
                        ...current,
                        orientation: "landscape",
                      }))
                    }
                  >
                    Landscape
                  </button>
                </div>

                <div className="simple-print-actions">
                  <button
                    type="button"
                    onClick={() =>
                      setPrintPreviewPage((page) =>
                        Math.max(0, page - 1)
                      )
                    }
                    disabled={printPreviewPage === 0}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span>
                    {printPreviewPage + 1}/
                    {printPages.length}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPrintPreviewPage((page) =>
                        Math.min(
                          printPages.length - 1,
                          page + 1
                        )
                      )
                    }
                    disabled={
                      printPreviewPage >=
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
                      setPrintOptionsOpen(false)
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
                      <small>OFFICIAL REPORT</small>
                      <h1>Customers Report</h1>
                      <p>
                        Generated customer records from
                        all departments
                      </p>
                    </div>

                    <aside>
                      <strong>{systemName}</strong>
                      <span>
                        {new Date().toLocaleDateString(
                          "en-GB"
                        )}
                      </span>
                    </aside>
                  </header>

                  {printPreviewPage === 0 && (
                    <section className="simple-print-summary">
                      <div>
                        <span>Total Customers</span>
                        <strong>
                          {filteredCustomers.length}
                        </strong>
                      </div>

                      <div>
                        <span>Consultant</span>
                        <strong>
                          {
                            filteredCustomers.filter(
                              (customer) =>
                                getCustomerDepartment(
                                  customer
                                ) === "consultant"
                            ).length
                          }
                        </strong>
                      </div>

                      <div>
                        <span>Travel</span>
                        <strong>
                          {
                            filteredCustomers.filter(
                              (customer) =>
                                getCustomerDepartment(
                                  customer
                                ) === "travel"
                            ).length
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Technology & Media
                        </span>
                        <strong>
                          {
                            filteredCustomers.filter(
                              (customer) =>
                                [
                                  "technology",
                                  "media",
                                ].includes(
                                  getCustomerDepartment(
                                    customer
                                  )
                                )
                            ).length
                          }
                        </strong>
                      </div>
                    </section>
                  )}

                  <section className="simple-print-table">
                    <header>
                      <strong>Customer Records</strong>
                      <span>
                        Page {printPreviewPage + 1} of{" "}
                        {printPages.length}
                      </span>
                    </header>

                    <table>
                      <thead>
                        <tr>
                          <th>No.</th>
                          <th>Customer</th>
                          <th>Phone</th>
                          <th>Department</th>
                          <th>Source</th>
                          <th>Assigned To</th>
                          <th>Status</th>
                          <th>Date & Time</th>
                        </tr>
                      </thead>

                      <tbody>
                        {(
                          printPages[
                            printPreviewPage
                          ] || []
                        ).map(
                          (customer, rowIndex) => {
                            const customerDepartment =
                              getCustomerDepartment(
                                customer
                              );

                            return (
                              <tr
                                key={
                                  customer.id ||
                                  rowIndex
                                }
                              >
                                <td>
                                  {printPreviewPage *
                                    Number(
                                      printOptions.rowsPerPage ||
                                        20
                                    ) +
                                    rowIndex +
                                    1}
                                </td>

                                <td>
                                  <strong>
                                    {getCustomerName(
                                      customer
                                    )}
                                  </strong>
                                  <small>
                                    {customer.email ||
                                      "-"}
                                  </small>
                                </td>

                                <td>
                                  {getCustomerPhone(
                                    customer
                                  )}
                                </td>

                                <td>
                                  {departmentLabels[
                                    customerDepartment
                                  ] || "Other"}
                                </td>

                                <td>
                                  {getCustomerSource(
                                    customer
                                  )}
                                </td>

                                <td>
                                  {customer.assignedEmployeeName ||
                                    "-"}
                                </td>

                                <td>
                                  {customer.followUpDecisionStatus ||
                                    customer.followUpStatus ||
                                    customer.assignmentStatus ||
                                    "None"}
                                </td>

                                <td>
                                  <strong>
                                    {formatDate(
                                      getCustomerDate(
                                        customer
                                      )
                                    )}
                                  </strong>
                                  <small>
                                    {formatTimeWithMeridiem(
                                      getCustomerTime(
                                        customer
                                      ),
                                      customer.createdAt ||
                                        customer.date
                                    )}
                                  </small>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </section>

                  <footer className="simple-print-footer">
                    <span>{systemName}</span>
                    <span>Customers Report</span>
                    <span>
                      Page {printPreviewPage + 1} of{" "}
                      {printPages.length}
                    </span>
                  </footer>
                </article>
              </main>
            </section>
          </div>
        )}

        <footer className="reports-print-footer reports-screen-footer">
          <span>{systemName}</span>
          <span>Customers Report</span>
          <span>
            Printed on{" "}
            {new Date().toLocaleString("en-GB")}
          </span>
        </footer>
      </div>
    );
  }

}