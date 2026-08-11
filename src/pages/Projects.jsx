import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FolderKanban,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { createId } from "../utils/createId";
import "./Projects.css";

const emptyProject = {
  projectMode: "new",
  projectName: "",
  customerId: "",
  customerName: "",
  customerPhone: "",
  orderedBy: "",
  priority: "Medium",
  status: "Planning",
  budget: "",
  currency: "AFN",
  startDate: "",
  dueDate: "",
  deliveryDate: "",
  location: "",
  liveUrl: "",
  requirements: "",
  notes: "",
};

const statusOptions = ["Planning", "In Progress", "Review", "Delivered", "On Hold", "Cancelled"];
const modeOptions = [
  {
    key: "existing",
    title: "Already Built Product",
    description: "This product is ready and can be sold to customers.",
  },
  {
    key: "new",
    title: "Build New Project",
    description: "This project will be built after customer request.",
  },
];
const emptyCustomer = {
  customerName: "",
  phone: "",
  email: "",
  address: "",
};

function money(value, currency) {
  const amount = Number(value || 0);
  if (!amount) return "-";
  return `${amount.toLocaleString("en-US")} ${currency || "AFN"}`;
}

function daysLeft(date) {
  if (!date) return null;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

function Projects() {
  const [projects, setProjects] = useJsonCollection("projects");
  const [customers, setCustomers] = useJsonCollection("customers");
  const [form, setForm] = useState(emptyProject);
  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesStatus = statusFilter === "All" || project.status === statusFilter;
      const matchesQuery =
        !query ||
        [
          project.projectName,
          project.customerName,
          project.customerPhone,
          project.status,
          project.priority,
        ].some((value) => String(value || "").toLowerCase().includes(query));

      return matchesStatus && matchesQuery;
    });
  }, [projects, search, statusFilter]);

  const activeCount = projects.filter((project) =>
    (project.projectMode || "new") === "new" &&
    ["Planning", "In Progress", "Review"].includes(project.status)
  ).length;
  const deliveredCount = projects.filter((project) => project.status === "Delivered" || project.projectMode === "existing").length;
  const urgentCount = projects.filter((project) => ["High", "Urgent"].includes(project.priority)).length;

  const isExistingProduct = form.projectMode === "existing";

  function updateField(event) {
    const { name, value } = event.target;

    if (name === "customerId") {
      const customer = customers.find((item) => String(item.id) === String(value));
      setForm((current) => ({
        ...current,
        customerId: value,
        customerName: customer?.customerName || "",
        customerPhone: customer?.phone || "",
      }));
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
  }

  function setProjectMode(projectMode) {
    setForm((current) => ({
      ...current,
      projectMode,
      status: projectMode === "existing" ? "Delivered" : current.status || "Planning",
      priority: projectMode === "existing" ? "Medium" : current.priority || "Medium",
      customerId: projectMode === "existing" ? "" : current.customerId,
      customerName: projectMode === "existing" ? "" : current.customerName,
      customerPhone: projectMode === "existing" ? "" : current.customerPhone,
      startDate: projectMode === "existing" ? "" : current.startDate,
      dueDate: projectMode === "existing" ? "" : current.dueDate,
      requirements: projectMode === "existing" ? "" : current.requirements,
    }));
    if (projectMode === "existing") {
      setShowCustomerForm(false);
      setCustomerForm(emptyCustomer);
    }
  }

  function openCreate() {
    setForm(emptyProject);
    setCustomerForm(emptyCustomer);
    setShowCustomerForm(false);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(project) {
    setForm({ ...emptyProject, ...project });
    setCustomerForm(emptyCustomer);
    setShowCustomerForm(false);
    setEditId(project.id);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setShowCustomerForm(false);
    setEditId(null);
    setForm(emptyProject);
    setCustomerForm(emptyCustomer);
  }

  function updateCustomerField(event) {
    const { name, value } = event.target;
    setCustomerForm((current) => ({ ...current, [name]: value }));
  }

  async function saveInlineCustomer() {
    if (!customerForm.customerName.trim()) {
      notify("Customer name is required.", "error");
      return;
    }

    const newCustomer = {
      ...customerForm,
      customerName: customerForm.customerName.trim(),
      phone: customerForm.phone.trim(),
      id: createId(),
      status: "Active",
      customerType: "Project",
      createdAt: new Date().toISOString(),
    };

    const saved = await setCustomers([...customers, newCustomer]);
    if (!saved) return;

    setForm((current) => ({
      ...current,
      customerId: newCustomer.id,
      customerName: newCustomer.customerName,
      customerPhone: newCustomer.phone,
    }));
    setCustomerForm(emptyCustomer);
    setShowCustomerForm(false);
    notify("Customer registered successfully.", "success");
  }

  async function saveProject(event) {
    event.preventDefault();

    if (!form.projectName.trim()) {
      notify("Project name is required.", "error");
      return;
    }

    if (!isExistingProduct && !form.customerName.trim()) {
      notify("Project name and customer are required.", "error");
      return;
    }

    const payload = {
      ...form,
      projectName: form.projectName.trim(),
      customerName: form.customerName.trim(),
      orderedBy: form.orderedBy.trim(),
      updatedAt: new Date().toISOString(),
    };

    const nextProjects = editId
      ? projects.map((project) =>
          String(project.id) === String(editId) ? { ...project, ...payload } : project
        )
      : [
          ...projects,
          {
            ...payload,
            id: createId(),
            createdAt: new Date().toISOString(),
          },
        ];

    const saved = await setProjects(nextProjects);
    if (!saved) return;

    notify(editId ? "Project updated successfully." : "Project registered successfully.", "success");
    closeForm();
  }

  async function deleteProject() {
    if (!deleteTarget) return;
    const saved = await setProjects(projects.filter((project) => project.id !== deleteTarget.id));
    if (!saved) return;
    notify("Project deleted successfully.", "success");
    setDeleteTarget(null);
  }

  return (
    <div className="projects-page">
      <header className="projects-heading">
        <div>
          <span>Project Workspace</span>
          <h1>Projects</h1>
          <p>Register customer projects, timelines, budgets, responsibilities, and delivery details.</p>
        </div>
        <button type="button" onClick={openCreate}>
          <Plus size={17} />
          Add Project
        </button>
      </header>

      <section className="project-stats">
        <div><FolderKanban /><span>Total Projects</span><strong>{projects.length}</strong><small>All customer projects</small></div>
        <div><Clock3 /><span>Active Projects</span><strong>{activeCount}</strong><small>Planning, progress, and review</small></div>
        <div><CheckCircle2 /><span>Delivered Projects</span><strong>{deliveredCount}</strong><small>Completed delivery records</small></div>
        <div><AlertTriangle /><span>Priority Projects</span><strong>{urgentCount}</strong><small>High and urgent work</small></div>
      </section>

      <section className="project-toolbar">
        <div className="project-search">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects..." />
        </div>
        <div className="project-status-tabs">
          {["All", ...statusOptions].map((status) => (
            <button
              type="button"
              key={status}
              className={statusFilter === status ? "active" : ""}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </section>

      <section className="project-list">
        {filteredProjects.map((project) => {
          const remaining = daysLeft(project.dueDate);
          const projectMode = project.projectMode || "new";
          const isProduct = projectMode === "existing";
          return (
            <article className="project-item" key={project.id}>
              <div className="project-item-main">
                <span className={`project-priority ${isProduct ? "product" : String(project.priority).toLowerCase()}`}>
                  {isProduct ? "Ready Product" : project.priority}
                </span>
                <h2>{project.projectName}</h2>
                <p>{project.requirements || project.notes || "No description added."}</p>
                <div className="project-meta-grid">
                  <span><BriefcaseBusiness size={14} />{isProduct ? project.orderedBy || "-" : project.customerName || "-"}</span>
                  <span><Phone size={14} />{isProduct ? "Product for sale" : project.customerPhone || "-"}</span>
                  <span><CircleDollarSign size={14} />{money(project.budget, project.currency)}</span>
                  <span><CalendarDays size={14} />{isProduct ? project.liveUrl || "-" : `${project.startDate || "-"} to ${project.dueDate || "-"}`}</span>
                </div>
              </div>
              <div className="project-item-side">
                <span className={`project-status ${String(project.status).toLowerCase().replaceAll(" ", "-")}`}>{project.status}</span>
                <strong>{isProduct ? "Available" : remaining === null ? "-" : remaining < 0 ? "Overdue" : `${remaining} days left`}</strong>
                <small>{isProduct ? "Already Built Product" : project.deliveryDate || "No delivery date"}</small>
                <div className="project-actions">
                  <button type="button" onClick={() => openEdit(project)} title="Edit project" aria-label="Edit project">
                    <Pencil size={15} />
                  </button>
                  <button type="button" className="danger" onClick={() => setDeleteTarget(project)} title="Delete project" aria-label="Delete project">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {!filteredProjects.length && (
          <div className="project-empty">
            <FolderKanban size={34} />
            <strong>No projects registered yet.</strong>
            <span>Add the first customer project from the button above.</span>
          </div>
        )}
      </section>

      {showForm && (
        <div className="project-modal-backdrop" onMouseDown={closeForm}>
          <div className="project-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="project-modal-header">
              <div>
                <h2>{editId ? "Edit Project" : "Register Project"}</h2>
                <p>Complete the standard project information before delivery or licensing.</p>
              </div>
              <button type="button" onClick={closeForm} aria-label="Close"><X size={19} /></button>
            </div>

            <form onSubmit={saveProject}>
              <div className="project-form-grid">
                <div className="project-mode-selector project-form-full">
                  {modeOptions.map((mode) => (
                    <button
                      type="button"
                      key={mode.key}
                      className={form.projectMode === mode.key ? "active" : ""}
                      onClick={() => setProjectMode(mode.key)}
                    >
                      <strong>{mode.title}</strong>
                      <span>{mode.description}</span>
                    </button>
                  ))}
                </div>
                <label><span>Project Name</span><input name="projectName" value={form.projectName} onChange={updateField} required /></label>

                {isExistingProduct ? (
                  <>
                    <label><span>Ordered By</span><input name="orderedBy" value={form.orderedBy} onChange={updateField} /></label>
                    <label><span>Unit</span><select name="currency" value={form.currency} onChange={updateField}><option>AFN</option><option>USD</option><option>EUR</option></select></label>
                    <label><span>Price</span><input type="number" min="0" name="budget" value={form.budget} onChange={updateField} /></label>
                    <label><span>Live URL</span><input name="liveUrl" value={form.liveUrl} onChange={updateField} /></label>
                    <label className="project-form-full"><span>Notes</span><textarea name="notes" value={form.notes} onChange={updateField} rows="4" /></label>
                  </>
                ) : (
                  <>
                    <div className="project-customer-field">
                      <span>Customer</span>
                      <div className="project-customer-control">
                        <select name="customerId" value={form.customerId} onChange={updateField}>
                          <option value="">Select customer</option>
                          {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                              {customer.customerName || customer.fullName || customer.phone}
                            </option>
                          ))}
                        </select>
                        <button
  type="button"
  onClick={() => {
    setCustomerForm(emptyCustomer);
    setShowCustomerForm(true);
  }}
  title="Add customer"
  aria-label="Add customer"
>
  <Plus size={17} />
</button>
                      </div>
                    </div>
                    <label><span>Customer Name</span><input name="customerName" value={form.customerName} onChange={updateField} required /></label>
                    <label><span>Start Date</span><input type="date" name="startDate" value={form.startDate} onChange={updateField} /></label>
                    <label><span>Due Date</span><input type="date" name="dueDate" value={form.dueDate} onChange={updateField} min={form.startDate} /></label>
                    <label><span>Unit</span><select name="currency" value={form.currency} onChange={updateField}><option>AFN</option><option>USD</option><option>EUR</option></select></label>
                    <label><span>Price</span><input type="number" min="0" name="budget" value={form.budget} onChange={updateField} /></label>
                    <label className="project-form-full"><span>Requirements</span><textarea name="requirements" value={form.requirements} onChange={updateField} rows="4" /></label>
                    <label className="project-form-full"><span>Notes</span><textarea name="notes" value={form.notes} onChange={updateField} rows="3" /></label>
                  </>
                )}
              </div>
              <div className="project-modal-actions">
                <button type="button" onClick={closeForm}>Cancel</button>
                <button type="submit">{editId ? "Save Changes" : "Register Project"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCustomerForm && (
  <div
    className="customer-modal-backdrop"
    onMouseDown={() => setShowCustomerForm(false)}
  >
    <div
      className="customer-modal"
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="customer-modal-header">
        <div>
          <span className="customer-modal-icon">
            <UserPlus size={19} />
          </span>

          <div>
            <h2>Register Customer</h2>
            <p>
              Add a new customer and select it automatically for this project.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowCustomerForm(false)}
          aria-label="Close customer form"
        >
          <X size={18} />
        </button>
      </div>

      <div className="customer-modal-body">
        <div className="customer-modal-grid">
          <label>
            <span>Customer Name</span>
            <input
              name="customerName"
              value={customerForm.customerName}
              onChange={updateCustomerField}
              placeholder="Enter customer name"
              autoFocus
            />
          </label>

          <label>
            <span>Customer Phone</span>
            <input
              name="phone"
              value={customerForm.phone}
              onChange={updateCustomerField}
              placeholder="Enter phone number"
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={customerForm.email}
              onChange={updateCustomerField}
              placeholder="Enter email address"
            />
          </label>

          <label>
            <span>Address</span>
            <input
              name="address"
              value={customerForm.address}
              onChange={updateCustomerField}
              placeholder="Enter customer address"
            />
          </label>
        </div>
      </div>

      <div className="customer-modal-actions">
        <button
          type="button"
          onClick={() => {
            setCustomerForm(emptyCustomer);
            setShowCustomerForm(false);
          }}
        >
          Cancel
        </button>

        <button
          type="button"
          className="primary"
          onClick={saveInlineCustomer}
        >
          <UserPlus size={16} />
          Save Customer
        </button>
      </div>
    </div>
  </div>
)}

      {deleteTarget && (
        <div className="project-modal-backdrop" onMouseDown={() => setDeleteTarget(null)}>
          <div className="project-delete-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div><AlertTriangle size={26} /></div>
            <span>Delete Project</span>
            <h2>Delete this project?</h2>
            <p>You are about to delete <strong>{deleteTarget.projectName}</strong>. This action cannot be undone.</p>
            <div>
              <button type="button" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button type="button" onClick={deleteProject}><Trash2 size={15} /> Delete Project</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
