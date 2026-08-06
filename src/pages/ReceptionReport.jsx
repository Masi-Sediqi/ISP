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
import "./ReceptionReport.css";

const normalize = (value) =>
  String(value || "").trim().toLowerCase();

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-GB");
};

const getName = (customer) =>
  customer.fullName ||
  customer.customerName ||
  customer.personName ||
  customer.companyName ||
  "Unnamed Customer";

const getType = (customer) =>
  normalize(
    customer.customerType ||
    customer.registrationType ||
    customer.type ||
    "consultant"
  );

const getStatus = (customer) => {
  const decision = String(
    customer.followUpDecisionStatus ||
    customer.followUp?.decisionStatus ||
    ""
  ).trim();

  if (
    decision &&
    !["none", "pending"].includes(
      decision.toLowerCase()
    )
  ) {
    return decision;
  }

  return (
    customer.assignmentStatus ||
    customer.followUpStatus ||
    decision ||
    "Pending"
  );
};

export default function ReceptionReport({
  company = {},
}) {
  const navigate = useNavigate();

  const [customers] =
    useJsonCollection("customers");
  const [mediaProducts] =
    useJsonCollection("mediaProducts");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState("all");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [followUpFilter, setFollowUpFilter] =
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

  const records = useMemo(() => {
    const customerRows = customers.map(
      (customer) => ({
        ...customer,
        recordId: customer.id,
        displayName: getName(customer),
        displayType: getType(customer),
        displayStatus: getStatus(customer),
        phone:
          customer.phone ||
          customer.contactNumber ||
          "-",
        source:
          customer.sourceEmployeeName ||
          customer.source ||
          customer.createdByName ||
          "External Customer",
        assignedTo:
          customer.assignedEmployeeName ||
          customer.assignedToName ||
          "-",
        country:
          customer.country ||
          customer.followUp?.country ||
          "-",
        purpose:
          customer.purpose ||
          customer.technologyPurpose ||
          customer.mediaPurpose ||
          customer.note ||
          "-",
        needsFollowUp:
          customer.needFollowup === "Yes" ||
          customer.needFollowUp === true ||
          customer.followUpStatus ||
          customer.followUp,
        createdDate:
          customer.createdAt ||
          customer.date ||
          customer.registrationDate ||
          "",
      })
    );

    const mediaRows = mediaProducts.map(
      (product) => ({
        ...product,
        recordId: product.id,
        displayName:
          product.personName ||
          product.brandName ||
          product.title ||
          "Media Product",
        displayType: "media",
        displayStatus:
          product.status || "Registered",
        phone: product.phone || "-",
        source:
          product.sourceEmployeeName ||
          product.source ||
          "External Customer",
        assignedTo:
          product.assignedEmployeeName ||
          "-",
        country: product.country || "-",
        purpose:
          product.mediaPurpose ||
          product.note ||
          "-",
        needsFollowUp:
          product.needFollowup === "Yes" ||
          product.needFollowUp === true,
        createdDate:
          product.createdAt ||
          product.date ||
          "",
      })
    );

    return [...customerRows, ...mediaRows];
  }, [customers, mediaProducts]);

  const filteredRecords = useMemo(() => {
    const query = normalize(search);

    return records
      .filter((record) => {
        if (
          typeFilter !== "all" &&
          record.displayType !== typeFilter
        ) {
          return false;
        }

        if (
          statusFilter !== "all" &&
          normalize(record.displayStatus) !==
            statusFilter
        ) {
          return false;
        }

        if (
          followUpFilter === "yes" &&
          !record.needsFollowUp
        ) {
          return false;
        }

        if (
          followUpFilter === "no" &&
          record.needsFollowUp
        ) {
          return false;
        }

        const date = String(
          record.createdDate || ""
        ).slice(0, 10);

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
          record.displayName,
          record.phone,
          record.displayType,
          record.displayStatus,
          record.source,
          record.assignedTo,
          record.country,
          record.purpose,
        ].some((value) =>
          normalize(value).includes(query)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdDate || 0) -
          new Date(a.createdDate || 0)
      );
  }, [
    records,
    search,
    typeFilter,
    statusFilter,
    followUpFilter,
    startDate,
    endDate,
  ]);

  const summary = useMemo(() => {
    const countType = (type) =>
      filteredRecords.filter(
        (record) =>
          record.displayType === type
      ).length;

    const countStatus = (status) =>
      filteredRecords.filter(
        (record) =>
          normalize(record.displayStatus) ===
          status
      ).length;

    return {
      consultant: countType("consultant"),
      travel: countType("travel"),
      technology: countType("technology"),
      media: countType("media"),
      pending: countStatus("pending"),
      completed:
        filteredRecords.filter(
          (record) =>
            record.needsFollowUp ||
            !["pending", "none", "assigned"].includes(
              normalize(
                record.displayStatus
              )
            )
        ).length,
    };
  }, [filteredRecords]);

  const printPages = useMemo(() => {
    const size = Math.max(
      1,
      Number(printOptions.rowsPerPage) ||
        18
    );

    if (!filteredRecords.length) {
      return [[]];
    }

    const pages = [];

    for (
      let index = 0;
      index < filteredRecords.length;
      index += size
    ) {
      pages.push(
        filteredRecords.slice(
          index,
          index + size
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
    setStatusFilter("all");
    setFollowUpFilter("all");
    setStartDate("");
    setEndDate("");
  };

  const applyPrintSettings = () => {
    const id =
      "reception-report-print-settings";

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
    setTimeout(() => window.print(), 120);
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
        setTimeout(resolve, 160)
      );

      const pages = Array.from(
        document.querySelectorAll(
          ".reception-report-print-page"
        )
      );

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
          await html2canvas(pages[index], {
            scale: 2,
            useCORS: true,
            backgroundColor: "#fff",
          });

        const image =
          canvas.toDataURL(
            "image/jpeg",
            0.95
          );

        const width =
          pdf.internal.pageSize.getWidth();
        const height =
          pdf.internal.pageSize.getHeight();
        const ratio = Math.min(
          width / canvas.width,
          height / canvas.height
        );

        if (index > 0) pdf.addPage();

        pdf.addImage(
          image,
          "JPEG",
          (width -
            canvas.width * ratio) /
            2,
          (height -
            canvas.height * ratio) /
            2,
          canvas.width * ratio,
          canvas.height * ratio,
          undefined,
          "FAST"
        );
      }

      pdf.save(
        `Reception-Report-${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`
      );
    } catch (error) {
      console.error(error);
      alert(
        "PDF export requires html2canvas and jspdf."
      );
    } finally {
      document.body.classList.remove(
        "reports-pdf-exporting"
      );
    }
  };

  const renderRow = (record, index) => (
    <tr key={record.recordId || index}>
      <td>{index}</td>
      <td>
        <strong>
          {record.displayName}
        </strong>
      </td>
      <td>{record.phone}</td>
      <td>
        <span
          className={`reception-report-type ${record.displayType}`}
        >
          {record.displayType}
        </span>
      </td>
      <td>{record.source}</td>
      <td>{record.assignedTo}</td>
      <td>{record.country}</td>
      <td>{record.purpose}</td>
      <td>
        <span
          className={`reception-report-status ${normalize(
            record.displayStatus
          ).replace(/\s+/g, "-")}`}
        >
          {record.displayStatus}
        </span>
      </td>
      <td>
        {record.needsFollowUp
          ? "Yes"
          : "No"}
      </td>
      <td>
        {formatDate(record.createdDate)}
      </td>
    </tr>
  );

  return (
    <div className="reports-page reception-report-page">
      <header className="reports-page-heading no-print">
        <div>
          <span>REPORTING CENTER</span>
          <h1>Reception Report</h1>
          <p>
            Review registrations,
            assignments, follow-ups, and
            customer statuses.
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

      <section className="reception-report-summary reports-screen-summary">
        <div>
          <span>Total Registrations</span>
          <strong>
            {filteredRecords.length}
          </strong>
        </div>
        <div>
          <span>Consultant</span>
          <strong>
            {summary.consultant}
          </strong>
        </div>
        <div>
          <span>Travel</span>
          <strong>{summary.travel}</strong>
        </div>
        <div>
          <span>Technology</span>
          <strong>
            {summary.technology}
          </strong>
        </div>
        <div>
          <span>Media</span>
          <strong>{summary.media}</strong>
        </div>
        <div>
          <span>Follow-up / Completed</span>
          <strong>
            {summary.completed}
          </strong>
        </div>
      </section>

      <section className="reports-filter-panel reception-report-filters no-print">
        <div className="reports-search-box">
          <Search size={17} />
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search customer, source or employee..."
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
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Statuses
          </option>
          <option value="pending">
            Pending
          </option>
          <option value="accepted">
            Accepted
          </option>
          <option value="approved">
            Approved
          </option>
          <option value="rejected">
            Rejected
          </option>
          <option value="completed">
            Completed
          </option>
        </select>

        <select
          value={followUpFilter}
          onChange={(event) =>
            setFollowUpFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Follow-ups
          </option>
          <option value="yes">
            Follow-up Required
          </option>
          <option value="no">
            No Follow-up
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
        >
          <X size={16} />
        </button>
      </section>

      <section className="reports-table-card reports-screen-table reception-report-table-card">
        <div className="reports-table-heading">
          <div>
            <h2>Reception Records</h2>
            <p>
              Showing{" "}
              {filteredRecords.length}{" "}
              records
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
                <th>Type</th>
                <th>Source</th>
                <th>Assigned To</th>
                <th>Country</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Follow-up</th>
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
                    colSpan="11"
                    className="reports-empty-state"
                  >
                    No reception records match
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
              className="reports-print-page reception-report-print-page"
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
                    Reception Report
                  </h1>
                  <p>
                    Registrations,
                    assignments and follow-up
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
                <section className="reception-report-summary reports-print-summary">
                  <div>
                    <span>Total</span>
                    <strong>
                      {
                        filteredRecords.length
                      }
                    </strong>
                  </div>
                  <div>
                    <span>Consultant</span>
                    <strong>
                      {summary.consultant}
                    </strong>
                  </div>
                  <div>
                    <span>Travel</span>
                    <strong>
                      {summary.travel}
                    </strong>
                  </div>
                  <div>
                    <span>Technology / Media</span>
                    <strong>
                      {summary.technology +
                        summary.media}
                    </strong>
                  </div>
                </section>
              )}

              <section className="reports-table-card reports-print-table-card reception-report-print-table">
                <div className="reports-table-heading">
                  <div>
                    <h2>
                      Reception Records
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
                        <th>Customer</th>
                        <th>Type</th>
                        <th>Source</th>
                        <th>Assigned To</th>
                        <th>Country</th>
                        <th>Status</th>
                        <th>Follow-up</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRecords.map(
                        (record, rowIndex) => (
                          <tr
                            key={
                              record.recordId ||
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
                                {
                                  record.displayName
                                }
                              </strong>
                              <small>
                                {record.phone}
                              </small>
                            </td>
                            <td>
                              {
                                record.displayType
                              }
                            </td>
                            <td>
                              {record.source}
                            </td>
                            <td>
                              {
                                record.assignedTo
                              }
                            </td>
                            <td>
                              {record.country}
                            </td>
                            <td>
                              {
                                record.displayStatus
                              }
                            </td>
                            <td>
                              {record.needsFollowUp
                                ? "Yes"
                                : "No"}
                            </td>
                            <td>
                              {formatDate(
                                record.createdDate
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
                <span>Reception Report</span>
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
                  Reception Report
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
                      Math.max(0, page - 1)
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
                      Reception Report
                    </h1>
                    <p>
                      Registrations and
                      follow-up activity
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
                      <span>Total</span>
                      <strong>
                        {
                          filteredRecords.length
                        }
                      </strong>
                    </div>
                    <div>
                      <span>Consultant</span>
                      <strong>
                        {summary.consultant}
                      </strong>
                    </div>
                    <div>
                      <span>Travel</span>
                      <strong>
                        {summary.travel}
                      </strong>
                    </div>
                    <div>
                      <span>
                        Technology / Media
                      </span>
                      <strong>
                        {summary.technology +
                          summary.media}
                      </strong>
                    </div>
                  </section>
                )}

                <section className="simple-print-table reception-simple-print-table">
                  <header>
                    <strong>
                      Reception Records
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
                        <th>Customer</th>
                        <th>Type</th>
                        <th>Source</th>
                        <th>Assigned</th>
                        <th>Status</th>
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
                              record.recordId ||
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
                                {
                                  record.displayName
                                }
                              </strong>
                              <small>
                                {record.phone}
                              </small>
                            </td>
                            <td>
                              {
                                record.displayType
                              }
                            </td>
                            <td>
                              {record.source}
                            </td>
                            <td>
                              {
                                record.assignedTo
                              }
                            </td>
                            <td>
                              {
                                record.displayStatus
                              }
                            </td>
                            <td>
                              {formatDate(
                                record.createdDate
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
                  <span>Reception Report</span>
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