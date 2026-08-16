import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronRight,
  Edit3,
  Printer,
  Search,
  Trash2,
  UserCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { useJsonCollection } from "../hooks/useJsonCollection";
import { createRecordId } from "../utils/ids";
import { notify } from "../utils/notify";
import "./EmployeeAttendance.css";

const CARD_IMAGE =
  "https://m.media-amazon.com/images/I/711xqu+OFuL._AC_UF1000,1000_QL80_.jpg";

const emptyForm = {
  name: "",
  startDate: "",
  endDate: "",
  employeeIds: [],
  note: "",
};

const emptyStatus = {
  status: "",
  reason: "",
  absenceType: "Full Day",
  hours: "",
};

function dateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function getDatesBetween(startDate, endDate) {
  if (!startDate || !endDate) return [];

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [];
  }

  const dates = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(dateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB");
}

function employeeName(employee) {
  return (
    employee.fullName ||
    employee.employeeName ||
    employee.name ||
    employee.email ||
    "Unnamed Employee"
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function EmployeeAttendance() {
  const [employees] = useJsonCollection("employees");
  const [settings] = useJsonCollection("settings");
  const [attendances, setAttendances] =
    useJsonCollection("employeeAttendances");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openAttendance, setOpenAttendance] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [statusModal, setStatusModal] = useState(null);
  const [statusForm, setStatusForm] = useState(emptyStatus);

  const [interfaceLanguage, setInterfaceLanguage] = useState(
    () => localStorage.getItem("isp-language") || "en"
  );

  useEffect(() => {
    const syncInterfaceLanguage = (event) => {
      const nextLanguage =
        event?.detail ||
        localStorage.getItem("isp-language") ||
        "en";

      setInterfaceLanguage(nextLanguage);
    };

    window.addEventListener(
      "isp-language-changed",
      syncInterfaceLanguage
    );
    window.addEventListener(
      "storage",
      syncInterfaceLanguage
    );

    return () => {
      window.removeEventListener(
        "isp-language-changed",
        syncInterfaceLanguage
      );
      window.removeEventListener(
        "storage",
        syncInterfaceLanguage
      );
    };
  }, []);

  const tx = (en, dr, ps) =>
    interfaceLanguage === "dr"
      ? dr
      : interfaceLanguage === "ps"
        ? ps
        : en;

  const translateAttendanceValue = (value) => {
    const key = String(value || "");

    const values = {
      Present: tx("Present", "حاضر", "حاضر"),
      Absent: tx("Absent", "غایب", "غایب"),
      Leave: tx("Leave", "رخصتی", "رخصتي"),
      "Not Recorded": tx("Not Recorded", "ثبت‌نشده", "ثبت شوی نه دی"),
      "Full Day": tx("Full Day", "تمام روز", "ټوله ورځ"),
      "Half Day": tx("Half Day", "نیم روز", "نیمه ورځ"),
      Hourly: tx("Hourly", "ساعتی", "ساعتي"),
      Employee: tx("Employee", "کارمند", "کارکوونکی"),
    };

    return values[key] || value;
  };

  const activeEmployees = useMemo(
    () =>
      employees
        .filter(
          (employee) =>
            String(employee.status || "Active").toLowerCase() === "active"
        )
        .sort((first, second) =>
          employeeName(first).localeCompare(employeeName(second))
        ),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const query = employeeSearch.trim().toLowerCase();

    if (!query) return activeEmployees;

    return activeEmployees.filter((employee) =>
      [
        employeeName(employee),
        employee.email,
        employee.phone,
        employee.nicNumber,
        employee.departments?.join(" "),
        employee.roles?.join(" "),
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [activeEmployees, employeeSearch]);

  const filteredAttendances = useMemo(() => {
    const query = attendanceSearch.trim().toLowerCase();

    return [...attendances]
      .filter((attendance) => {
        if (!query) return true;

        return [
          attendance.name,
          attendance.note,
          attendance.startDate,
          attendance.endDate,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );
      })
      .sort(
        (first, second) =>
          new Date(second.createdAt || second.startDate || 0) -
          new Date(first.createdAt || first.startDate || 0)
      );
  }, [attendances, attendanceSearch]);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "startDate" &&
      current.endDate &&
      value > current.endDate
        ? { endDate: value }
        : {}),
    }));
  };

  const toggleEmployee = (id) => {
    setForm((current) => ({
      ...current,
      employeeIds: current.employeeIds.includes(id)
        ? current.employeeIds.filter((item) => item !== id)
        : [...current.employeeIds, id],
    }));
  };

  const selectAllVisible = () => {
    const ids = filteredEmployees.map((employee) =>
      String(employee.id)
    );

    setForm((current) => ({
      ...current,
      employeeIds: [
        ...new Set([...current.employeeIds, ...ids]),
      ],
    }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setEmployeeSearch("");
    setShowForm(true);
  };

  const openEdit = (attendance) => {
    setForm({
      ...emptyForm,
      ...attendance,
      employeeIds: Array.isArray(attendance.employeeIds)
        ? attendance.employeeIds.map(String)
        : [],
    });
    setEditId(attendance.id);
    setEmployeeSearch("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
    setEditId(null);
    setEmployeeSearch("");
  };

  const saveAttendance = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      notify(tx("Attendance name is required.", "نام حاضری ضروری است.", "د حاضرۍ نوم اړین دی."), "error");
      return;
    }

    if (!form.startDate || !form.endDate) {
      notify(tx("Start date and end date are required.", "تاریخ شروع و ختم ضروری است.", "د پیل او پای نېټه اړینه ده."), "error");
      return;
    }

    if (form.startDate > form.endDate) {
      notify(tx("End date cannot be before start date.", "تاریخ ختم نمی‌تواند قبل از تاریخ شروع باشد.", "د پای نېټه د پیل له نېټې مخکې نه شي کېدای."), "error");
      return;
    }

    if (!form.employeeIds.length) {
      notify(tx("Select at least one employee.", "حداقل یک کارمند را انتخاب کنید.", "لږ تر لږه یو کارکوونکی وټاکئ."), "error");
      return;
    }

    const existing = attendances.find(
      (attendance) => String(attendance.id) === String(editId)
    );

    const record = {
      ...(existing || {}),
      ...form,
      id: editId || createRecordId(),
      name: form.name.trim(),
      note: form.note.trim(),
      employeeIds: form.employeeIds.map(String),
      dailyRecords: existing?.dailyRecords || {},
      createdAt:
        existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const next = editId
      ? attendances.map((attendance) =>
          String(attendance.id) === String(editId)
            ? record
            : attendance
        )
      : [...attendances, record];

    const saved = await setAttendances(next);
    if (!saved) return;

    notify(
      editId
        ? tx("Attendance updated successfully.", "حاضری با موفقیت ویرایش شد.", "حاضري په بریالیتوب سره سمه شوه.")
        : tx("Attendance created successfully.", "حاضری با موفقیت ایجاد شد.", "حاضري په بریالیتوب سره جوړه شوه."),
      "success"
    );

    closeForm();
  };

  const removeAttendance = async () => {
    if (!deleteTarget) return;

    const saved = await setAttendances(
      attendances.filter(
        (attendance) =>
          String(attendance.id) !== String(deleteTarget.id)
      )
    );

    if (!saved) return;

    if (
      String(openAttendance?.id) === String(deleteTarget.id)
    ) {
      setOpenAttendance(null);
      setSelectedDate("");
    }

    setDeleteTarget(null);
    notify(tx("Attendance deleted successfully.", "حاضری با موفقیت حذف شد.", "حاضري په بریالیتوب سره حذف شوه."), "success");
  };

  const openAttendanceDetails = (attendance) => {
    const dates = getDatesBetween(
      attendance.startDate,
      attendance.endDate
    );

    const selectedEmployeeCount =
      Array.isArray(attendance.employeeIds)
        ? attendance.employeeIds.length
        : 0;

    const firstIncompleteDate = dates.find((date) => {
      const recordedEmployees = Object.keys(
        attendance.dailyRecords?.[date] || {}
      ).length;

      return recordedEmployees < selectedEmployeeCount;
    });

    setOpenAttendance(attendance);

    /*
     * به‌صورت خودکار اولین روزی انتخاب می‌شود که
     * حاضری تمام کارمندان آن تکمیل نشده باشد.
     * اگر همه روزها تکمیل شده باشند، روز اول باز می‌شود.
     */
    setSelectedDate(firstIncompleteDate || dates[0] || "");
  };

  const selectedEmployees = useMemo(() => {
    if (!openAttendance) return [];

    return activeEmployees.filter((employee) =>
      openAttendance.employeeIds?.map(String).includes(
        String(employee.id)
      )
    );
  }, [activeEmployees, openAttendance]);

  const currentAttendance = useMemo(() => {
    if (!openAttendance) return null;

    return attendances.find(
      (attendance) =>
        String(attendance.id) === String(openAttendance.id)
    ) || openAttendance;
  }, [attendances, openAttendance]);

  const persistEmployeeStatus = async (
    employee,
    status,
    details = {}
  ) => {
    if (!currentAttendance || !selectedDate) return false;

    const employeeId = String(employee.id);

    const record = {
      status,
      reason: String(details.reason || "").trim(),
      absenceType:
        status === "Absent"
          ? details.absenceType || "Full Day"
          : "",
      hours:
        status === "Absent" &&
        details.absenceType === "Hourly"
          ? Number(details.hours || 0)
          : "",
      updatedAt: new Date().toISOString(),
    };

    const updatedAttendance = {
      ...currentAttendance,
      dailyRecords: {
        ...(currentAttendance.dailyRecords || {}),
        [selectedDate]: {
          ...(currentAttendance.dailyRecords?.[selectedDate] ||
            {}),
          [employeeId]: record,
        },
      },
      updatedAt: new Date().toISOString(),
    };

    const next = attendances.map((attendance) =>
      String(attendance.id) ===
      String(updatedAttendance.id)
        ? updatedAttendance
        : attendance
    );

    const saved = await setAttendances(next);
    if (!saved) return false;

    setOpenAttendance(updatedAttendance);
    return true;
  };

  const markPresent = async (employee) => {
    const saved = await persistEmployeeStatus(
      employee,
      "Present"
    );

    if (saved) {
      notify(
        `${employeeName(employee)} ${tx("marked present.", "حاضر ثبت شد.", "حاضر ثبت شو.")}`,
        "success"
      );
    }
  };

  const openStatus = (employee, status) => {
    const current =
      currentAttendance?.dailyRecords?.[selectedDate]?.[
        String(employee.id)
      ] || {};

    setStatusModal({ employee, status });
    setStatusForm({
      ...emptyStatus,
      ...current,
      status,
      absenceType:
        current.absenceType || "Full Day",
      hours: current.hours || "",
    });
  };

  const saveEmployeeStatus = async (event) => {
    event.preventDefault();

    if (!statusModal) return;

    if (
      statusModal.status === "Leave" &&
      !statusForm.reason.trim()
    ) {
      notify(tx("Leave reason is required.", "دلیل رخصتی ضروری است.", "د رخصتۍ دلیل اړین دی."), "error");
      return;
    }

    if (
      statusModal.status === "Absent" &&
      statusForm.absenceType === "Hourly" &&
      !(Number(statusForm.hours) > 0)
    ) {
      notify(
        tx("Enter the number of absent hours.", "تعداد ساعات غیابت را وارد کنید.", "د غیابت ساعتونه ولیکئ."),
        "error"
      );
      return;
    }

    const saved = await persistEmployeeStatus(
      statusModal.employee,
      statusModal.status,
      statusForm
    );

    if (!saved) return;

    setStatusModal(null);
    setStatusForm(emptyStatus);
    notify(tx("Employee attendance status saved.", "وضعیت حاضری کارمند ذخیره شد.", "د کارکوونکي د حاضرۍ حالت خوندي شو."), "success");
  };

  const attendanceDates = currentAttendance
    ? getDatesBetween(
        currentAttendance.startDate,
        currentAttendance.endDate
      )
    : [];

  const printAttendance = (attendance) => {
    const dates = getDatesBetween(
      attendance.startDate,
      attendance.endDate
    );
    const employeeIds = Array.isArray(attendance.employeeIds)
      ? attendance.employeeIds.map(String)
      : [];
    const employeeById = new Map(
      employees.map((employee) => [String(employee.id), employee])
    );

    const reportEmployees = employeeIds.map((employeeId) => {
      const employee = employeeById.get(employeeId) || {
        id: employeeId,
        fullName: `Employee ${employeeId}`,
      };
      const totals = {
        Present: 0,
        Absent: 0,
        Leave: 0,
        "Not Recorded": 0,
      };

      const rows = dates.map((date) => {
        const record = attendance.dailyRecords?.[date]?.[employeeId] || {};
        const status = ["Present", "Absent", "Leave"].includes(
          record.status
        )
          ? record.status
          : "Not Recorded";

        totals[status] += 1;
        return { date, record, status };
      });

      return { employee, employeeId, rows, totals };
    });

    const grandTotals = reportEmployees.reduce(
      (result, item) => ({
        Present: result.Present + item.totals.Present,
        Absent: result.Absent + item.totals.Absent,
        Leave: result.Leave + item.totals.Leave,
        "Not Recorded":
          result["Not Recorded"] + item.totals["Not Recorded"],
      }),
      { Present: 0, Absent: 0, Leave: 0, "Not Recorded": 0 }
    );

    const company = settings[0] || {};
    const companyName =
      company.companyName || company.name || "ISP Smart";
    const companySubtitle =
      company.systemSubtitle || "Employee Attendance Report";
    const generatedAt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kabul",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());

    const employeeSections = reportEmployees
      .map(({ employee, employeeId, rows, totals }, employeeIndex) => {
        const departments = Array.isArray(employee.departments)
          ? employee.departments.join(", ")
          : employee.department || "-";
        const roles = Array.isArray(employee.roles)
          ? employee.roles.join(", ")
          : employee.role || "-";

        const dailyRows = rows
          .map(({ date, record, status }, index) => {
            const statusDetail =
              status === "Absent" && record.absenceType
                ? `${status} (${record.absenceType}${
                    record.absenceType === "Hourly" && record.hours
                      ? ` - ${record.hours}h`
                      : ""
                  })`
                : status;

            return `
              <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(formatDate(date))}</td>
                <td><span class="status ${status.toLowerCase().replace(" ", "-")}">${escapeHtml(statusDetail)}</span></td>
                <td>${escapeHtml(record.reason || "-")}</td>
              </tr>`;
          })
          .join("");

        return `
          <section class="employee-sheet">
            <header class="employee-heading">
              <div class="employee-number">${employeeIndex + 1}</div>
              <div>
                <h2>${escapeHtml(employeeName(employee))}</h2>
                <p>ID: ${escapeHtml(employeeId)} &nbsp;•&nbsp; Department: ${escapeHtml(departments)} &nbsp;•&nbsp; Role: ${escapeHtml(roles)}</p>
              </div>
            </header>

            <div class="employee-totals">
              <div class="present"><b>${totals.Present}</b><span>Present Days</span></div>
              <div class="absent"><b>${totals.Absent}</b><span>Absent Days</span></div>
              <div class="leave"><b>${totals.Leave}</b><span>Leave Days</span></div>
              <div class="unrecorded"><b>${totals["Not Recorded"]}</b><span>Not Recorded</span></div>
            </div>

            <table>
              <thead><tr><th>#</th><th>Date</th><th>Status</th><th>Reason / Details</th></tr></thead>
              <tbody>${dailyRows}</tbody>
            </table>
          </section>`;
      })
      .join("");

    const summaryRows = reportEmployees
      .map(
        ({ employee, employeeId, totals }, index) => `
          <tr>
            <td>${index + 1}</td>
            <td><strong>${escapeHtml(employeeName(employee))}</strong><small>${escapeHtml(employeeId)}</small></td>
            <td class="number present-text">${totals.Present}</td>
            <td class="number absent-text">${totals.Absent}</td>
            <td class="number leave-text">${totals.Leave}</td>
            <td class="number">${totals["Not Recorded"]}</td>
            <td class="number">${dates.length}</td>
          </tr>`
      )
      .join("");

    const printWindow = window.open(
      "",
      "_blank",
      "width=1400,height=900"
    );

    if (!printWindow) {
      notify(tx("Please allow pop-ups to print the attendance report.", "برای چاپ گزارش حاضری، Pop-up را اجازه دهید.", "د حاضرۍ راپور د چاپ لپاره Pop-up ته اجازه ورکړئ."), "error");
      return;
    }

    printWindow.document.write(`<!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(attendance.name)} - Attendance Report</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 8mm;
          }

          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
          }

          body {
            color: #172033;
            font: 9.4px/1.32 Arial, Helvetica, sans-serif;
          }

          .report {
            width: 100%;
            max-width: 281mm;
            margin: 0 auto;
          }

          .report-header {
            min-height: 24mm;
            padding: 10px 14px;
            border-radius: 11px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 18px;
            background: linear-gradient(135deg,#171923,#30334f);
            color: #fff;
          }

          .brand {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .brand img {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            object-fit: cover;
            background: #fff;
          }

          .brand h1 {
            margin: 0 0 2px;
            font-size: 16px;
          }

          .brand p,
          .report-header small {
            margin: 0;
            color: #d7daf7;
            font-size: 8px;
          }

          .report-header small {
            line-height: 1.5;
            text-align: right;
          }

          .report-title {
            margin: 9px 0 7px;
            text-align: center;
          }

          .report-title span {
            color: #5b5cf0;
            font-size: 7px;
            font-weight: 800;
            letter-spacing: 1px;
          }

          .report-title h2 {
            margin: 3px 0 2px;
            font-size: 17px;
          }

          .report-title p {
            margin: 0;
            color: #667085;
            font-size: 8px;
          }

          .period-grid,
          .employee-totals {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 6px;
          }

          .period-grid {
            margin-bottom: 9px;
          }

          .period-grid div,
          .employee-totals div {
            min-width: 0;
            padding: 7px 8px;
            border: 1px solid #e4e7ec;
            border-radius: 8px;
            background: #f8fafc;
          }

          .period-grid span,
          .employee-totals span {
            display: block;
            color: #667085;
            font-size: 7px;
          }

          .period-grid b,
          .employee-totals b {
            display: block;
            margin-top: 2px;
            font-size: 11px;
          }

          .employee-sheet {
            margin: 0 0 10px;
            page-break-inside: auto;
            break-inside: auto;
          }

          .employee-heading {
            padding: 7px 9px;
            border: 1px solid #dfe3ea;
            border-bottom: 0;
            border-radius: 9px 9px 0 0;
            display: flex;
            align-items: center;
            gap: 8px;
            background: #f8fafc;
            page-break-after: avoid;
            break-after: avoid-page;
          }

          .employee-number {
            width: 25px;
            height: 25px;
            flex: 0 0 25px;
            border-radius: 7px;
            display: grid;
            place-items: center;
            background: #5b5cf0;
            color: #fff;
            font-size: 9px;
            font-weight: 800;
          }

          .employee-heading h2 {
            margin: 0 0 1px;
            font-size: 11px;
          }

          .employee-heading p {
            margin: 0;
            color: #667085;
            font-size: 7px;
          }

          .employee-totals {
            padding: 6px;
            border-right: 1px solid #dfe3ea;
            border-left: 1px solid #dfe3ea;
            page-break-after: avoid;
            break-after: avoid-page;
          }

          .employee-totals div {
            padding: 5px 7px;
          }

          .employee-totals .present {
            background: #ecfdf3;
            color: #067647;
          }

          .employee-totals .absent {
            background: #fef3f2;
            color: #b42318;
          }

          .employee-totals .leave {
            background: #fffaeb;
            color: #b54708;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          thead {
            display: table-header-group;
          }

          tfoot {
            display: table-footer-group;
          }

          th,
          td {
            padding: 4px 6px;
            border: 1px solid #dfe3ea;
            text-align: left;
            vertical-align: middle;
            overflow-wrap: anywhere;
          }

          th {
            background: #eef2f6;
            color: #475467;
            font-size: 7px;
            font-weight: 800;
            text-transform: uppercase;
          }

          tbody tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .employee-sheet table th:nth-child(1),
          .employee-sheet table td:nth-child(1) {
            width: 6%;
            text-align: center;
          }

          .employee-sheet table th:nth-child(2),
          .employee-sheet table td:nth-child(2) {
            width: 16%;
          }

          .employee-sheet table th:nth-child(3),
          .employee-sheet table td:nth-child(3) {
            width: 22%;
          }

          .employee-sheet table th:nth-child(4),
          .employee-sheet table td:nth-child(4) {
            width: 56%;
          }

          .status {
            padding: 2px 6px;
            border-radius: 999px;
            display: inline-block;
            font-size: 7px;
            font-weight: 800;
            white-space: nowrap;
          }

          .status.present {
            background: #dcfae6;
            color: #067647;
          }

          .status.absent {
            background: #fee4e2;
            color: #b42318;
          }

          .status.leave {
            background: #fef0c7;
            color: #b54708;
          }

          .status.not-recorded {
            background: #eaecf0;
            color: #475467;
          }

          .final-summary {
            margin-top: 12px;
            page-break-before: always;
            break-before: page;
          }

          .final-summary > header {
            padding: 10px 12px;
            border-radius: 9px 9px 0 0;
            background: #312e81;
            color: #fff;
            page-break-after: avoid;
            break-after: avoid-page;
          }

          .final-summary h2 {
            margin: 0 0 2px;
            font-size: 14px;
          }

          .final-summary p {
            margin: 0;
            color: #c7d2fe;
            font-size: 8px;
          }

          .final-summary small {
            display: block;
            color: #667085;
            font-size: 7px;
            font-weight: 400;
          }

          .final-summary table th:nth-child(1),
          .final-summary table td:nth-child(1) {
            width: 5%;
          }

          .final-summary table th:nth-child(2),
          .final-summary table td:nth-child(2) {
            width: 35%;
          }

          .final-summary table th:nth-child(n+3),
          .final-summary table td:nth-child(n+3) {
            width: 12%;
          }

          .number {
            text-align: center;
            font-weight: 800;
          }

          .present-text {
            color: #067647;
          }

          .absent-text {
            color: #b42318;
          }

          .leave-text {
            color: #b54708;
          }

          .grand-total td {
            background: #f4f3ff;
            font-weight: 800;
          }

          .signatures {
            margin-top: 24px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 36px;
            text-align: center;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .signatures div {
            padding-top: 7px;
            border-top: 1px solid #667085;
            color: #475467;
            font-size: 8px;
          }

          .footer {
            margin-top: 14px;
            padding-top: 6px;
            border-top: 1px solid #e4e7ec;
            color: #98a2b3;
            text-align: center;
            font-size: 7px;
          }

          @media screen {
            body {
              padding: 16px;
              background: #eef2f7;
            }

            .report {
              padding: 12px;
              border-radius: 12px;
              background: #fff;
              box-shadow: 0 20px 60px rgba(15,23,42,.12);
            }
          }

          @media print {
            html,
            body {
              width: 297mm;
              min-height: 210mm;
              background: #fff !important;
            }

            body {
              padding: 0 !important;
            }

            .report {
              width: 100%;
              max-width: none;
              padding: 0;
              margin: 0;
              box-shadow: none;
            }

            .report-header,
            .period-grid,
            .employee-heading,
            .employee-totals,
            .final-summary > header {
              page-break-inside: avoid;
              break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <main class="report">
          <header class="report-header">
            <div class="brand">
              <img src="${window.location.origin}/icon.png" alt="" />
              <div><h1>${escapeHtml(companyName)}</h1><p>${escapeHtml(companySubtitle)}</p></div>
            </div>
            <small>Generated: ${escapeHtml(generatedAt)}<br/>Official Attendance Register</small>
          </header>

          <section class="report-title">
            <span>HUMAN RESOURCES • ATTENDANCE</span>
            <h2>${escapeHtml(attendance.name)}</h2>
            <p>${escapeHtml(attendance.note || "Employee attendance report")}</p>
          </section>

          <section class="period-grid">
            <div><span>{tx("Start Date", "تاریخ شروع", "د پیل نېټه")}</span><b>${escapeHtml(formatDate(attendance.startDate))}</b></div>
            <div><span>{tx("End Date", "تاریخ ختم", "د پای نېټه")}</span><b>${escapeHtml(formatDate(attendance.endDate))}</b></div>
            <div><span>Period Length</span><b>${dates.length} Days</b></div>
            <div><span>Employees</span><b>${reportEmployees.length}</b></div>
          </section>

          ${employeeSections}

          <section class="final-summary">
            <header><h2>Final Employee Attendance Summary</h2><p>Total present and absent days for each employee in this attendance period.</p></header>
            <table>
              <thead><tr><th>#</th><th>Employee</th><th>Present</th><th>Absent</th><th>Leave</th><th>Not Recorded</th><th>Total Days</th></tr></thead>
              <tbody>
                ${summaryRows}
                <tr class="grand-total"><td colspan="2">Overall Total</td><td class="number present-text">${grandTotals.Present}</td><td class="number absent-text">${grandTotals.Absent}</td><td class="number leave-text">${grandTotals.Leave}</td><td class="number">${grandTotals["Not Recorded"]}</td><td class="number">${dates.length * reportEmployees.length}</td></tr>
              </tbody>
            </table>
            <div class="signatures"><div>Prepared By</div><div>HR Manager</div><div>Authorized Signature</div></div>
          </section>

          <footer class="footer">${escapeHtml(companyName)} • Confidential Employee Attendance Report</footer>
        </main>
      </body>
      </html>`);

    printWindow.document.close();
    printWindow.focus();

    const runPrint = () => {
      window.setTimeout(() => {
        printWindow.print();
      }, 250);
    };

    if (printWindow.document.readyState === "complete") {
      runPrint();
    } else {
      printWindow.addEventListener("load", runPrint, {
        once: true,
      });

      window.setTimeout(runPrint, 900);
    }
  };

  return (
    <div className={`employee-attendance-page ${interfaceLanguage !== "en" ? "employee-attendance-page-rtl" : ""}`}>
      <header className="employee-attendance-heading">
        <div>
          <span>{tx("Human Resources", "منابع بشری", "بشري سرچینې")}</span>
          <h1>{tx("Employee Attendance", "حاضری کارمندان", "د کارکوونکو حاضري")}</h1>
          <p>
            {tx(
              "Create attendance periods and record daily employee presence, absence and leave.",
              "دوره‌های حاضری را ایجاد کرده و حضور، غیابت و رخصتی روزانه کارمندان را ثبت کنید.",
              "د حاضرۍ دورې جوړې کړئ او د کارکوونکو ورځنی حضور، غیابت او رخصتي ثبت کړئ."
            )}
          </p>
        </div>

        <button type="button" onClick={openCreate}>
          <UserCheck size={17} />
          {tx("Add Attendance", "افزودن حاضری", "حاضري زیاتول")}
        </button>
      </header>

      <section className="employee-attendance-toolbar">
        <label>
          <Search size={17} />
          <input
            value={attendanceSearch}
            onChange={(event) =>
              setAttendanceSearch(event.target.value)
            }
            placeholder={tx("Search attendance records...", "جستجوی سوابق حاضری...", "د حاضرۍ ریکارډونه ولټوئ...")}
          />
        </label>

        <div>
          <strong>{attendances.length}</strong>
          <span>{tx("Attendance Records", "سوابق حاضری", "د حاضرۍ ریکارډونه")}</span>
        </div>

        <div>
          <strong>{activeEmployees.length}</strong>
          <span>{tx("Active Employees", "کارمندان فعال", "فعال کارکوونکي")}</span>
        </div>
      </section>

      <section className="employee-attendance-card-grid">
        {filteredAttendances.map((attendance) => {
          const employeeCount =
            attendance.employeeIds?.length || 0;
          const dayCount = getDatesBetween(
            attendance.startDate,
            attendance.endDate
          ).length;

          return (
            <article
              className="employee-attendance-card"
              key={attendance.id}
            >
              <div className="employee-attendance-card-image">
                <img
                  src={CARD_IMAGE}
                  alt={tx("Attendance register", "ثبت حاضری", "د حاضرۍ ثبت")}
                />

                <span>
                  <CalendarDays size={15} />
                  {dayCount} {tx("Days", "روز", "ورځې")}
                </span>
              </div>

              <div className="employee-attendance-card-body">
                <div className="employee-attendance-card-title">
                  <div>
                    <small>Attendance Register</small>
                    <h2>{attendance.name}</h2>
                  </div>

                  <div className="employee-attendance-card-actions">
                    <button
                      type="button"
                      className="print"
                      onClick={() => printAttendance(attendance)}
                      aria-label="Print attendance report"
                      title="Print attendance report"
                    >
                      <Printer size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => openEdit(attendance)}
                      aria-label="Edit attendance"
                      title="Edit"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() =>
                        setDeleteTarget(attendance)
                      }
                      aria-label="Delete attendance"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="employee-attendance-meta">
                  <span>
                    <CalendarDays size={14} />
                    {formatDate(attendance.startDate)} -{" "}
                    {formatDate(attendance.endDate)}
                  </span>

                  <span>
                    <Users size={14} />
                    {employeeCount} Employees
                  </span>
                </div>

                <p>
                  {attendance.note ||
                    "No additional note was added."}
                </p>

                <button
                  type="button"
                  className="employee-attendance-open"
                  onClick={() =>
                    openAttendanceDetails(attendance)
                  }
                >
                  {tx("Open Attendance", "باز کردن حاضری", "حاضري پرانیستل")}
                  <ChevronRight size={16} />
                </button>
              </div>
            </article>
          );
        })}

        {!filteredAttendances.length && (
          <div className="employee-attendance-empty">
            <CalendarDays size={34} />
            <h2>{tx("No attendance records found", "هیچ سابقه حاضری پیدا نشد", "د حاضرۍ هېڅ ریکارډ ونه موندل شو")}</h2>
            <p>
              {tx(
                "Create an attendance period to begin recording daily employee attendance.",
                "برای شروع ثبت حاضری روزانه کارمندان، یک دوره حاضری ایجاد کنید.",
                "د کارکوونکو د ورځنۍ حاضرۍ د ثبت لپاره د حاضرۍ یوه دوره جوړه کړئ."
              )}
            </p>
          </div>
        )}
      </section>

      {showForm && (
        <div
          className="employee-attendance-modal-backdrop"
          onMouseDown={closeForm}
        >
          <form
            className="employee-attendance-form-modal"
            onSubmit={saveAttendance}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>{tx("Attendance Setup", "تنظیم حاضری", "د حاضرۍ تنظیم")}</span>
                <h2>
                  {editId
                    ? tx("Edit Attendance", "ویرایش حاضری", "حاضري سمول")
                    : tx("Add Employee Attendance", "افزودن حاضری کارمند", "د کارکوونکي حاضري زیاتول")}
                </h2>
                <p>
                  {tx(
                    "Select the date range and active employees.",
                    "محدوده تاریخ و کارمندان فعال را انتخاب کنید.",
                    "د نېټې موده او فعال کارکوونکي وټاکئ."
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label={tx("Close", "بستن", "تړل")}
              >
                <X size={18} />
              </button>
            </header>

            <div className="employee-attendance-form-grid">
              <label className="full">
                <span>{tx("Attendance Name", "نام حاضری", "د حاضرۍ نوم")}</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder={tx("Example: January 2026 Attendance", "مثال: حاضری جنوری ۲۰۲۶", "بېلګه: د ۲۰۲۶ جنوري حاضري")}
                  autoFocus
                />
              </label>

              <label>
                <span>Start Date</span>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={updateField}
                />
              </label>

              <label>
                <span>End Date</span>
                <input
                  type="date"
                  name="endDate"
                  min={form.startDate}
                  value={form.endDate}
                  onChange={updateField}
                />
              </label>

              <div className="employee-attendance-employees full">
                <div className="employee-attendance-employee-header">
                  <div>
                    <span>{tx("Select Active Employees", "انتخاب کارمندان فعال", "فعال کارکوونکي وټاکئ")}</span>
                    <small>
                      {form.employeeIds.length} {tx("selected", "انتخاب‌شده", "ټاکل شوي")}
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={selectAllVisible}
                  >
                    {tx("Select Visible", "انتخاب موارد قابل‌نمایش", "ښکاره موارد وټاکئ")}
                  </button>
                </div>

                <label className="employee-attendance-search">
                  <Search size={16} />
                  <input
                    value={employeeSearch}
                    onChange={(event) =>
                      setEmployeeSearch(event.target.value)
                    }
                    placeholder={tx("Search active employees...", "جستجوی کارمندان فعال...", "فعال کارکوونکي ولټوئ...")}
                  />
                </label>

                <div className="employee-attendance-employee-list">
                  {filteredEmployees.map((employee) => {
                    const id = String(employee.id);
                    const selected =
                      form.employeeIds.includes(id);

                    return (
                      <button
                        key={id}
                        type="button"
                        className={selected ? "selected" : ""}
                        onClick={() => toggleEmployee(id)}
                      >
                        <span className="employee-attendance-avatar">
                          {employee.image ? (
                            <img
                              src={employee.image}
                              alt={employeeName(employee)}
                            />
                          ) : (
                            employeeName(employee)
                              .slice(0, 1)
                              .toUpperCase()
                          )}
                        </span>

                        <span>
                          <strong>
                            {employeeName(employee)}
                          </strong>
                          <small>
                            {employee.departments?.join(", ") ||
                              employee.roles?.join(", ") ||
                              tx("Employee", "کارمند", "کارکوونکی")}
                          </small>
                        </span>

                        <i>
                          {selected && <Check size={14} />}
                        </i>
                      </button>
                    );
                  })}

                  {!filteredEmployees.length && (
                    <p>{tx("No active employees found.", "هیچ کارمند فعال پیدا نشد.", "فعال کارکوونکی ونه موندل شو.")}</p>
                  )}
                </div>
              </div>

              <label className="full">
                <span>{tx("Note", "یادداشت", "یادښت")}</span>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={updateField}
                  rows="4"
                  placeholder={tx("Write an optional note...", "یادداشت اختیاری بنویسید...", "اختیاري یادښت ولیکئ...")}
                />
              </label>
            </div>

            <footer>
              <button type="button" onClick={closeForm}>
                {tx("Cancel", "لغو", "لغوه")}
              </button>

              <button type="submit" className="primary">
                {editId
                  ? tx("Save Changes", "ذخیره تغییرات", "بدلونونه خوندي کړئ")
                  : tx("Create Attendance", "ایجاد حاضری", "حاضري جوړه کړئ")}
              </button>
            </footer>
          </form>
        </div>
      )}

      {currentAttendance && (
        <div
          className="employee-attendance-modal-backdrop"
          onMouseDown={() => {
            setOpenAttendance(null);
            setSelectedDate("");
          }}
        >
          <section
            className="employee-attendance-details-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>{tx("Daily Attendance", "حاضری روزانه", "ورځنۍ حاضري")}</span>
                <h2>{currentAttendance.name}</h2>
                <p>
                  {formatDate(currentAttendance.startDate)} -{" "}
                  {formatDate(currentAttendance.endDate)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpenAttendance(null);
                  setSelectedDate("");
                }}
              >
                <X size={18} />
              </button>
            </header>

            <div className="employee-attendance-details-layout">
              <aside className="employee-attendance-dates">
                <h3>{tx("Attendance Dates", "تاریخ‌های حاضری", "د حاضرۍ نېټې")}</h3>

                <div>
                  {attendanceDates.map((date) => {
                    const records =
                      currentAttendance.dailyRecords?.[date] ||
                      {};
                    const completed = Object.keys(records).length;

                    return (
                      <button
                        type="button"
                        key={date}
                        className={[
                          selectedDate === date ? "active" : "",
                          completed > 0 ? "recorded" : "",
                          completed === selectedEmployees.length &&
                          selectedEmployees.length > 0
                            ? "complete"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => setSelectedDate(date)}
                      >
                        <CalendarDays size={15} />

                        <span>
                          <strong>{formatDate(date)}</strong>
                          <small>
                            {completed}/{selectedEmployees.length}{" "}
                            {tx("recorded", "ثبت‌شده", "ثبت شوي")}
                          </small>
                        </span>

                        <ChevronRight size={14} />
                      </button>
                    );
                  })}
                </div>
              </aside>

              <main className="employee-attendance-daily">
                <div className="employee-attendance-daily-header">
                  <div>
                    <span>{tx("Selected Date", "تاریخ انتخاب‌شده", "ټاکل شوې نېټه")}</span>
                    <h3>{formatDate(selectedDate)}</h3>
                  </div>

                  <div>
                    <Users size={16} />
                    {selectedEmployees.length} {tx("Employees", "کارمند", "کارکوونکي")}
                  </div>
                </div>

                <div className="employee-attendance-daily-list">
                  {selectedEmployees.map((employee) => {
                    const record =
                      currentAttendance.dailyRecords?.[
                        selectedDate
                      ]?.[String(employee.id)];

                    return (
                      <article key={employee.id}>
                        <div className="employee-attendance-person">
                          <span>
                            {employee.image ? (
                              <img
                                src={employee.image}
                                alt={employeeName(employee)}
                              />
                            ) : (
                              <UserRound size={17} />
                            )}
                          </span>

                          <div>
                            <strong>
                              {employeeName(employee)}
                            </strong>

                            <small>
                              {record?.status
                                ? [
                                    translateAttendanceValue(record.status),
                                    record.status === "Absent"
                                      ? translateAttendanceValue(record.absenceType)
                                      : "",
                                    record.status === "Absent" &&
                                    record.absenceType === "Hourly" &&
                                    record.hours
                                      ? `${record.hours} ${tx("hour(s)", "ساعت", "ساعت")}`
                                      : "",
                                    record.reason,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")
                                : tx("Not recorded", "ثبت‌نشده", "ثبت شوی نه دی")}
                            </small>
                          </div>
                        </div>

                        <div className="employee-attendance-status-buttons">
                          <button
                            type="button"
                            className={
                              record?.status === "Present"
                                ? "present active"
                                : "present"
                            }
                            onClick={() =>
                              markPresent(employee)
                            }
                          >
                            {tx("Present", "حاضر", "حاضر")}
                          </button>

                          <button
                            type="button"
                            className={
                              record?.status === "Absent"
                                ? "absent active"
                                : "absent"
                            }
                            onClick={() =>
                              openStatus(employee, "Absent")
                            }
                          >
                            {tx("Absent", "غایب", "غایب")}
                          </button>

                          <button
                            type="button"
                            className={
                              record?.status === "Leave"
                                ? "leave active"
                                : "leave"
                            }
                            onClick={() =>
                              openStatus(employee, "Leave")
                            }
                          >
                            {tx("Leave", "رخصتی", "رخصتي")}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </main>
            </div>
          </section>
        </div>
      )}

      {statusModal && (
        <div
          className="employee-attendance-modal-backdrop elevated"
          onMouseDown={() => setStatusModal(null)}
        >
          <form
            className="employee-attendance-status-modal"
            onSubmit={saveEmployeeStatus}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>{tx("Attendance Status", "وضعیت حاضری", "د حاضرۍ حالت")}</span>
                <h2>
                  {employeeName(statusModal.employee)}
                </h2>
                <p>
                  {translateAttendanceValue(statusModal.status)} · {formatDate(selectedDate)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStatusModal(null)}
              >
                <X size={18} />
              </button>
            </header>

            {statusModal.status === "Leave" && (
              <label>
                <span>{tx("Leave Reason", "دلیل رخصتی", "د رخصتۍ دلیل")}</span>
                <textarea
                  rows="3"
                  value={statusForm.reason}
                  onChange={(event) =>
                    setStatusForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  placeholder={tx("Enter the leave reason...", "دلیل رخصتی را وارد کنید...", "د رخصتۍ دلیل ولیکئ...")}
                  autoFocus
                />
              </label>
            )}

            {statusModal.status === "Absent" && (
              <>
                <label>
                  <span>{tx("Absence Type", "نوع غیابت", "د غیابت ډول")}</span>

                  <div className="employee-attendance-absence-types">
                    {["Full Day", "Half Day", "Hourly"].map(
                      (type) => (
                        <button
                          key={type}
                          type="button"
                          className={
                            statusForm.absenceType === type
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            setStatusForm((current) => ({
                              ...current,
                              absenceType: type,
                              hours:
                                type === "Hourly"
                                  ? current.hours
                                  : "",
                            }))
                          }
                        >
                          {translateAttendanceValue(type)}
                        </button>
                      )
                    )}
                  </div>
                </label>

                {statusForm.absenceType === "Hourly" && (
                  <label>
                    <span>{tx("Absent Hours", "ساعات غیابت", "د غیابت ساعتونه")}</span>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={statusForm.hours}
                      onChange={(event) =>
                        setStatusForm((current) => ({
                          ...current,
                          hours: event.target.value,
                        }))
                      }
                      placeholder={tx("Example: 2", "مثال: ۲", "بېلګه: ۲")}
                      autoFocus
                    />
                  </label>
                )}

                <label>
                  <span>{tx("Note / Reason", "یادداشت / دلیل", "یادښت / دلیل")}</span>
                  <textarea
                    rows="3"
                    value={statusForm.reason}
                    onChange={(event) =>
                      setStatusForm((current) => ({
                        ...current,
                        reason: event.target.value,
                      }))
                    }
                    placeholder={tx("Optional absence note...", "یادداشت اختیاری غیابت...", "د غیابت اختیاري یادښت...")}
                  />
                </label>
              </>
            )}

            <footer>
              <button
                type="button"
                onClick={() => setStatusModal(null)}
              >
                {tx("Cancel", "لغو", "لغوه")}
              </button>

              <button type="submit" className="primary">
                {tx("Save Status", "ذخیره وضعیت", "حالت خوندي کړئ")}
              </button>
            </footer>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div
          className="employee-attendance-modal-backdrop elevated"
          onMouseDown={() => setDeleteTarget(null)}
        >
          <div
            className="employee-attendance-delete-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span>
              <AlertTriangle size={27} />
            </span>

            <h2>{tx("Delete attendance?", "حاضری حذف شود؟", "حاضري حذف شي؟")}</h2>

            <p>
              {tx(
                "This attendance and all of its daily records will be permanently deleted.",
                "این حاضری و تمام سوابق روزانه آن به‌طور دایمی حذف می‌شود.",
                "دا حاضري او د هغې ټول ورځني ریکارډونه به د تل لپاره حذف شي."
              )}
            </p>

            <div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
              >
                {tx("Cancel", "لغو", "لغوه")}
              </button>

              <button
                type="button"
                className="danger"
                onClick={removeAttendance}
              >
                <Trash2 size={15} />
                {tx("Delete Attendance", "حذف حاضری", "حاضري حذف کړئ")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}