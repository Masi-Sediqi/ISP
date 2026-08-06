import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Search,
  UserRoundCheck,
  X,
} from "lucide-react";

import { useJsonCollection } from "../hooks/useJsonCollection";
import { useLocalCollection } from "../hooks/useLocalCollection";
import "./Reports.css";
import "./EmployeeReport.css";

const normalizeText = (value) =>
  String(value || "").trim().toLowerCase();

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-GB");
};

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString("en-US")} AFN`;

const getEmployeeDepartments = (employee) => {
  if (Array.isArray(employee.departments)) {
    return employee.departments.filter(Boolean);
  }

  if (employee.department) {
    return [employee.department];
  }

  return [];
};

const getEmployeeRoles = (employee) => {
  if (Array.isArray(employee.roles)) {
    return employee.roles.filter(Boolean);
  }

  if (employee.role) {
    return [employee.role];
  }

  return [];
};

const getEmployeeStatus = (employee) =>
  employee.status || "Unspecified";

const getEmployeeSalary = (employee) => {
  if (employee.salaryType === "percentage") {
    return {
      label: `${Number(
        employee.salaryPercentage || 0
      ).toLocaleString("en-US")}%`,
      numeric: 0,
    };
  }

  return {
    label: formatMoney(employee.fixedSalary),
    numeric: Number(employee.fixedSalary || 0),
  };
};

export default function EmployeeReport({
  company = {},
}) {
  const navigate = useNavigate();

  const [employees] =
    useJsonCollection("employees");

  const [customers] =
    useJsonCollection("customers");

  const [adjustments] =
    useLocalCollection("employeeAdjustments");

  const [search, setSearch] = useState("");
  const [department, setDepartment] =
    useState("all");
  const [status, setStatus] =
    useState("all");
  const [salaryType, setSalaryType] =
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

  const departmentOptions = useMemo(
    () =>
      [
        ...new Set(
          employees.flatMap(
            getEmployeeDepartments
          )
        ),
      ].sort((first, second) =>
        first.localeCompare(second)
      ),
    [employees]
  );

  const customerCounts = useMemo(() => {
    const counts = new Map();

    employees.forEach((employee) => {
      const employeeId = String(
        employee.id || ""
      );

      const employeeName = normalizeText(
        employee.fullName
      );

      const count = customers.filter(
        (customer) => {
          const possibleIds = [
            customer.sourceEmployeeId,
            customer.assignedByEmployeeId,
            customer.assignedEmployeeId,
            customer.createdByEmployeeId,
          ]
            .filter(Boolean)
            .map(String);

          const possibleNames = [
            customer.sourceEmployeeName,
            customer.assignedEmployeeName,
            customer.createdByName,
            customer.source,
          ]
            .filter(Boolean)
            .map(normalizeText);

          return (
            possibleIds.includes(employeeId) ||
            (employeeName &&
              possibleNames.includes(employeeName))
          );
        }
      ).length;

      counts.set(employeeId, count);
    });

    return counts;
  }, [employees, customers]);

  const adjustmentSummary = useMemo(() => {
    const summary = new Map();

    adjustments.forEach((entry) => {
      const employeeId = String(
        entry.employeeId || ""
      );

      const current =
        summary.get(employeeId) || {
          credit: 0,
          debit: 0,
          bonus: 0,
          penalty: 0,
          salary: 0,
        };

      const amount = Number(
        entry.amount || 0
      );

      if (
        Object.prototype.hasOwnProperty.call(
          current,
          entry.type
        )
      ) {
        current[entry.type] += amount;
      }

      summary.set(employeeId, current);
    });

    return summary;
  }, [adjustments]);

  const reportRows = useMemo(() => {
    return employees.map((employee) => {
      const employeeId = String(
        employee.id || ""
      );

      const ledger =
        adjustmentSummary.get(employeeId) || {
          credit: 0,
          debit: 0,
          bonus: 0,
          penalty: 0,
          salary: 0,
        };

      const totalCredit =
        ledger.credit +
        ledger.bonus +
        ledger.salary;

      const totalDebit =
        ledger.debit +
        ledger.penalty;

      const salary = getEmployeeSalary(
        employee
      );

      return {
        ...employee,
        departments:
          getEmployeeDepartments(employee),
        roles: getEmployeeRoles(employee),
        statusLabel:
          getEmployeeStatus(employee),
        salaryLabel: salary.label,
        fixedSalaryNumeric:
          salary.numeric,
        customerCount:
          customerCounts.get(employeeId) || 0,
        ledger,
        totalCredit,
        totalDebit,
        netBalance:
          totalCredit - totalDebit,
      };
    });
  }, [
    employees,
    adjustmentSummary,
    customerCounts,
  ]);

  const filteredEmployees = useMemo(() => {
    const query = normalizeText(search);

    return reportRows
      .filter((employee) => {
        if (
          department !== "all" &&
          !employee.departments.includes(
            department
          )
        ) {
          return false;
        }

        if (
          status !== "all" &&
          normalizeText(
            employee.statusLabel
          ) !== status
        ) {
          return false;
        }

        if (
          salaryType !== "all" &&
          String(
            employee.salaryType || "fixed"
          ) !== salaryType
        ) {
          return false;
        }

        const contractStart =
          employee.startDate || "";

        const contractEnd =
          employee.endDate || "";

        if (
          startDate &&
          contractStart &&
          contractStart < startDate
        ) {
          return false;
        }

        if (
          endDate &&
          contractEnd &&
          contractEnd > endDate
        ) {
          return false;
        }

        if (!query) return true;

        return [
          employee.fullName,
          employee.phone,
          employee.email,
          employee.nicNumber,
          employee.departments.join(" "),
          employee.roles.join(" "),
          employee.statusLabel,
        ].some((value) =>
          normalizeText(value).includes(query)
        );
      })
      .sort((first, second) =>
        String(first.fullName || "")
          .localeCompare(
            String(second.fullName || "")
          )
      );
  }, [
    reportRows,
    search,
    department,
    status,
    salaryType,
    startDate,
    endDate,
  ]);

  const summary = useMemo(() => {
    const active = filteredEmployees.filter(
      (employee) =>
        normalizeText(employee.statusLabel) ===
        "active"
    ).length;

    const inactive =
      filteredEmployees.length - active;

    const fixed = filteredEmployees.filter(
      (employee) =>
        employee.salaryType !== "percentage"
    ).length;

    const percentage =
      filteredEmployees.length - fixed;

    const totalCustomers =
      filteredEmployees.reduce(
        (sum, employee) =>
          sum + employee.customerCount,
        0
      );

    const totalSalary =
      filteredEmployees.reduce(
        (sum, employee) =>
          sum +
          employee.ledger.salary +
          employee.fixedSalaryNumeric,
        0
      );

    const totalNet =
      filteredEmployees.reduce(
        (sum, employee) =>
          sum + employee.netBalance,
        0
      );

    return {
      active,
      inactive,
      fixed,
      percentage,
      totalCustomers,
      totalSalary,
      totalNet,
    };
  }, [filteredEmployees]);

  const printPages = useMemo(() => {
    const rowsPerPage = Math.max(
      1,
      Number(printOptions.rowsPerPage) ||
        18
    );

    if (!filteredEmployees.length) {
      return [[]];
    }

    const pages = [];

    for (
      let index = 0;
      index < filteredEmployees.length;
      index += rowsPerPage
    ) {
      pages.push(
        filteredEmployees.slice(
          index,
          index + rowsPerPage
        )
      );
    }

    return pages;
  }, [
    filteredEmployees,
    printOptions.rowsPerPage,
  ]);

  const resetFilters = () => {
    setSearch("");
    setDepartment("all");
    setStatus("all");
    setSalaryType("all");
    setStartDate("");
    setEndDate("");
  };

  const applyPrintSettings = () => {
    const styleId =
      "employee-report-print-settings";

    let style =
      document.getElementById(styleId);

    if (!style) {
      style =
        document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
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
        window.setTimeout(resolve, 160)
      );

      const pages = Array.from(
        document.querySelectorAll(
          ".employee-report-print-page"
        )
      );

      if (!pages.length) {
        throw new Error(
          "No employee report pages found."
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
          await html2canvas(pages[index], {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
          });

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
        `Employees-Report-${new Date()
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

  const renderEmployeeRow = (
    employee,
    rowNumber
  ) => (
    <tr key={employee.id || rowNumber}>
      <td>{rowNumber}</td>

      <td>
        <div className="reports-customer-cell">
          <span>
            {String(
              employee.fullName || "E"
            )
              .charAt(0)
              .toUpperCase()}
          </span>

          <div>
            <strong>
              {employee.fullName ||
                "Unnamed Employee"}
            </strong>

            <small>
              {employee.email || "-"}
            </small>
          </div>
        </div>
      </td>

      <td>{employee.phone || "-"}</td>

      <td>
        {employee.departments.length
          ? employee.departments.join(", ")
          : "-"}
      </td>

      <td>
        {employee.roles.length
          ? employee.roles.join(", ")
          : "-"}
      </td>

      <td>
        <span
          className={`employee-report-status ${normalizeText(
            employee.statusLabel
          ).replace(/\s+/g, "-")}`}
        >
          {employee.statusLabel}
        </span>
      </td>

      <td>{employee.salaryLabel}</td>

      <td>{employee.customerCount}</td>

      <td className="employee-report-credit">
        {formatMoney(
          employee.totalCredit
        )}
      </td>

      <td className="employee-report-debit">
        {formatMoney(
          employee.totalDebit
        )}
      </td>

      <td
        className={
          employee.netBalance < 0
            ? "employee-report-debit"
            : "employee-report-credit"
        }
      >
        {formatMoney(
          employee.netBalance
        )}
      </td>

      <td>
        <div className="reports-date-cell">
          <strong>
            {formatDate(
              employee.startDate
            )}
          </strong>

          <small>
            to{" "}
            {formatDate(
              employee.endDate
            )}
          </small>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="reports-page employee-report-page">
      <header className="reports-page-heading no-print">
        <div>
          <span>REPORTING CENTER</span>
          <h1>Employees Report</h1>
          <p>
            Review employee records,
            departments, salaries, customers,
            and ledger balances.
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

      <section className="employee-report-summary reports-screen-summary">
        <div>
          <span>Total Employees</span>
          <strong>
            {filteredEmployees.length}
          </strong>
        </div>

        <div>
          <span>Active</span>
          <strong>{summary.active}</strong>
        </div>

        <div>
          <span>Inactive / Other</span>
          <strong>{summary.inactive}</strong>
        </div>

        <div>
          <span>Registered Customers</span>
          <strong>
            {summary.totalCustomers}
          </strong>
        </div>

        <div>
          <span>Total Salary</span>
          <strong>
            {formatMoney(
              summary.totalSalary
            )}
          </strong>
        </div>

        <div>
          <span>Net Ledger</span>
          <strong>
            {formatMoney(
              summary.totalNet
            )}
          </strong>
        </div>
      </section>

      <section className="reports-filter-panel employee-report-filters no-print">
        <div className="reports-search-box">
          <Search size={17} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search employee, role or department..."
          />
        </div>

        <select
          value={department}
          onChange={(event) =>
            setDepartment(
              event.target.value
            )
          }
        >
          <option value="all">
            All Departments
          </option>

          {departmentOptions.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            )
          )}
        </select>

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
        >
          <option value="all">
            All Statuses
          </option>
          <option value="active">
            Active
          </option>
          <option value="on leave">
            On Leave
          </option>
          <option value="inactive">
            Inactive
          </option>
          <option value="unspecified">
            Unspecified
          </option>
        </select>

        <select
          value={salaryType}
          onChange={(event) =>
            setSalaryType(
              event.target.value
            )
          }
        >
          <option value="all">
            All Salary Types
          </option>
          <option value="fixed">
            Fixed Salary
          </option>
          <option value="percentage">
            Percentage Salary
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
            aria-label="Contract start date"
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
            aria-label="Contract end date"
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

      <section className="reports-table-card reports-screen-table employee-report-table-card">
        <div className="reports-table-heading">
          <div>
            <h2>Employee Records</h2>
            <p>
              Showing{" "}
              {filteredEmployees.length}{" "}
              employee records
            </p>
          </div>
        </div>

        <div className="reports-table-wrap">
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Employee</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Salary</th>
                <th>Customers</th>
                <th>Credit</th>
                <th>Debit</th>
                <th>Net Balance</th>
                <th>Contract</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map(
                (employee, index) =>
                  renderEmployeeRow(
                    employee,
                    index + 1
                  )
              )}

              {!filteredEmployees.length && (
                <tr>
                  <td
                    colSpan="12"
                    className="reports-empty-state"
                  >
                    No employee records match
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
          (pageEmployees, pageIndex) => (
            <article
              className="reports-print-page employee-report-print-page"
              key={`employee-page-${pageIndex}`}
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
                    Employees Report
                  </h1>
                  <p>
                    Employee records,
                    departments and financial
                    activity
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
                <section className="employee-report-summary reports-print-summary">
                  <div>
                    <span>
                      Total Employees
                    </span>
                    <strong>
                      {
                        filteredEmployees.length
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Active</span>
                    <strong>
                      {summary.active}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Registered Customers
                    </span>
                    <strong>
                      {
                        summary.totalCustomers
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Net Ledger
                    </span>
                    <strong>
                      {formatMoney(
                        summary.totalNet
                      )}
                    </strong>
                  </div>
                </section>
              )}

              <section className="reports-table-card reports-print-table-card employee-report-print-table">
                <div className="reports-table-heading">
                  <div>
                    <h2>
                      Employee Records
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
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Salary</th>
                        <th>Customers</th>
                        <th>Credit</th>
                        <th>Debit</th>
                        <th>Balance</th>
                        <th>Contract</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pageEmployees.map(
                        (
                          employee,
                          rowIndex
                        ) => (
                          <tr
                            key={
                              employee.id ||
                              rowIndex
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
                                {employee.fullName ||
                                  "Unnamed Employee"}
                              </strong>
                              <small>
                                {employee.email ||
                                  "-"}
                              </small>
                            </td>

                            <td>
                              {employee.departments.join(
                                ", "
                              ) || "-"}
                            </td>

                            <td>
                              {employee.roles.join(
                                ", "
                              ) || "-"}
                            </td>

                            <td>
                              {
                                employee.statusLabel
                              }
                            </td>

                            <td>
                              {
                                employee.salaryLabel
                              }
                            </td>

                            <td>
                              {
                                employee.customerCount
                              }
                            </td>

                            <td>
                              {formatMoney(
                                employee.totalCredit
                              )}
                            </td>

                            <td>
                              {formatMoney(
                                employee.totalDebit
                              )}
                            </td>

                            <td>
                              {formatMoney(
                                employee.netBalance
                              )}
                            </td>

                            <td>
                              {formatDate(
                                employee.startDate
                              )}
                              <small>
                                {" "}
                                -{" "}
                                {formatDate(
                                  employee.endDate
                                )}
                              </small>
                            </td>
                          </tr>
                        )
                      )}

                      {!pageEmployees.length && (
                        <tr>
                          <td
                            colSpan="11"
                            className="reports-empty-state"
                          >
                            No employee records
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
                  Employees Report
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
                  Employees Report
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
                      Employees Report
                    </h1>
                    <p>
                      Employee records,
                      departments and financial
                      activity
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
                        Total Employees
                      </span>
                      <strong>
                        {
                          filteredEmployees.length
                        }
                      </strong>
                    </div>

                    <div>
                      <span>Active</span>
                      <strong>
                        {summary.active}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Customers
                      </span>
                      <strong>
                        {
                          summary.totalCustomers
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Net Ledger
                      </span>
                      <strong>
                        {formatMoney(
                          summary.totalNet
                        )}
                      </strong>
                    </div>
                  </section>
                )}

                <section className="simple-print-table employee-simple-print-table">
                  <header>
                    <strong>
                      Employee Records
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
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Salary</th>
                        <th>Customers</th>
                        <th>Credit</th>
                        <th>Debit</th>
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
                          employee,
                          rowIndex
                        ) => (
                          <tr
                            key={
                              employee.id ||
                              rowIndex
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
                                {employee.fullName ||
                                  "Unnamed Employee"}
                              </strong>

                              <small>
                                {employee.email ||
                                  "-"}
                              </small>
                            </td>

                            <td>
                              {employee.departments.join(
                                ", "
                              ) || "-"}
                            </td>

                            <td>
                              {
                                employee.statusLabel
                              }
                            </td>

                            <td>
                              {
                                employee.salaryLabel
                              }
                            </td>

                            <td>
                              {
                                employee.customerCount
                              }
                            </td>

                            <td>
                              {formatMoney(
                                employee.totalCredit
                              )}
                            </td>

                            <td>
                              {formatMoney(
                                employee.totalDebit
                              )}
                            </td>

                            <td>
                              {formatMoney(
                                employee.netBalance
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
                    Employees Report
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