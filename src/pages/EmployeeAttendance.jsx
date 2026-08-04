import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronRight,
  Edit3,
  Search,
  Trash2,
  UserCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { useJsonCollection } from "../hooks/useJsonCollection";
import { useLocalCollection } from "../hooks/useLocalCollection";
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

export default function EmployeeAttendance() {
  const [employees] = useJsonCollection("employees");
  const [attendances, setAttendances] =
    useLocalCollection("employeeAttendances");

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
      notify("Attendance name is required.", "error");
      return;
    }

    if (!form.startDate || !form.endDate) {
      notify("Start date and end date are required.", "error");
      return;
    }

    if (form.startDate > form.endDate) {
      notify("End date cannot be before start date.", "error");
      return;
    }

    if (!form.employeeIds.length) {
      notify("Select at least one employee.", "error");
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
        ? "Attendance updated successfully."
        : "Attendance created successfully.",
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
    notify("Attendance deleted successfully.", "success");
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
        `${employeeName(employee)} marked present.`,
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
      notify("Leave reason is required.", "error");
      return;
    }

    if (
      statusModal.status === "Absent" &&
      statusForm.absenceType === "Hourly" &&
      !(Number(statusForm.hours) > 0)
    ) {
      notify(
        "Enter the number of absent hours.",
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
    notify("Employee attendance status saved.", "success");
  };

  const attendanceDates = currentAttendance
    ? getDatesBetween(
        currentAttendance.startDate,
        currentAttendance.endDate
      )
    : [];

  return (
    <div className="employee-attendance-page">
      <header className="employee-attendance-heading">
        <div>
          <span>Human Resources</span>
          <h1>Employee Attendance</h1>
          <p>
            Create attendance periods and record daily employee
            presence, absence and leave.
          </p>
        </div>

        <button type="button" onClick={openCreate}>
          <UserCheck size={17} />
          Add Attendance
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
            placeholder="Search attendance records..."
          />
        </label>

        <div>
          <strong>{attendances.length}</strong>
          <span>Attendance Records</span>
        </div>

        <div>
          <strong>{activeEmployees.length}</strong>
          <span>Active Employees</span>
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
                  alt="Attendance register"
                />

                <span>
                  <CalendarDays size={15} />
                  {dayCount} Days
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
                  Open Attendance
                  <ChevronRight size={16} />
                </button>
              </div>
            </article>
          );
        })}

        {!filteredAttendances.length && (
          <div className="employee-attendance-empty">
            <CalendarDays size={34} />
            <h2>No attendance records found</h2>
            <p>
              Create an attendance period to begin recording
              daily employee attendance.
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
                <span>Attendance Setup</span>
                <h2>
                  {editId
                    ? "Edit Attendance"
                    : "Add Employee Attendance"}
                </h2>
                <p>
                  Select the date range and active employees.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </header>

            <div className="employee-attendance-form-grid">
              <label className="full">
                <span>Attendance Name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="Example: January 2026 Attendance"
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
                    <span>Select Active Employees</span>
                    <small>
                      {form.employeeIds.length} selected
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={selectAllVisible}
                  >
                    Select Visible
                  </button>
                </div>

                <label className="employee-attendance-search">
                  <Search size={16} />
                  <input
                    value={employeeSearch}
                    onChange={(event) =>
                      setEmployeeSearch(event.target.value)
                    }
                    placeholder="Search active employees..."
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
                              "Employee"}
                          </small>
                        </span>

                        <i>
                          {selected && <Check size={14} />}
                        </i>
                      </button>
                    );
                  })}

                  {!filteredEmployees.length && (
                    <p>No active employees found.</p>
                  )}
                </div>
              </div>

              <label className="full">
                <span>Note</span>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={updateField}
                  rows="4"
                  placeholder="Write an optional note..."
                />
              </label>
            </div>

            <footer>
              <button type="button" onClick={closeForm}>
                Cancel
              </button>

              <button type="submit" className="primary">
                {editId ? "Save Changes" : "Create Attendance"}
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
                <span>Daily Attendance</span>
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
                <h3>Attendance Dates</h3>

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
                            recorded
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
                    <span>Selected Date</span>
                    <h3>{formatDate(selectedDate)}</h3>
                  </div>

                  <div>
                    <Users size={16} />
                    {selectedEmployees.length} Employees
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
                                    record.status,
                                    record.status === "Absent"
                                      ? record.absenceType
                                      : "",
                                    record.status === "Absent" &&
                                    record.absenceType === "Hourly" &&
                                    record.hours
                                      ? `${record.hours} hour(s)`
                                      : "",
                                    record.reason,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")
                                : "Not recorded"}
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
                            Present
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
                            Absent
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
                            Leave
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
                <span>Attendance Status</span>
                <h2>
                  {employeeName(statusModal.employee)}
                </h2>
                <p>
                  {statusModal.status} · {formatDate(selectedDate)}
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
                <span>Leave Reason</span>
                <textarea
                  rows="3"
                  value={statusForm.reason}
                  onChange={(event) =>
                    setStatusForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  placeholder="Enter the leave reason..."
                  autoFocus
                />
              </label>
            )}

            {statusModal.status === "Absent" && (
              <>
                <label>
                  <span>Absence Type</span>

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
                          {type}
                        </button>
                      )
                    )}
                  </div>
                </label>

                {statusForm.absenceType === "Hourly" && (
                  <label>
                    <span>Absent Hours</span>
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
                      placeholder="Example: 2"
                      autoFocus
                    />
                  </label>
                )}

                <label>
                  <span>Note / Reason</span>
                  <textarea
                    rows="3"
                    value={statusForm.reason}
                    onChange={(event) =>
                      setStatusForm((current) => ({
                        ...current,
                        reason: event.target.value,
                      }))
                    }
                    placeholder="Optional absence note..."
                  />
                </label>
              </>
            )}

            <footer>
              <button
                type="button"
                onClick={() => setStatusModal(null)}
              >
                Cancel
              </button>

              <button type="submit" className="primary">
                Save Status
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

            <h2>Delete attendance?</h2>

            <p>
              “{deleteTarget.name}” and all of its daily
              records will be permanently deleted.
            </p>

            <div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger"
                onClick={removeAttendance}
              >
                <Trash2 size={15} />
                Delete Attendance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}