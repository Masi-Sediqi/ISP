import { useState } from "react";
import { Link } from "react-router-dom";

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 20h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 6h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 6V4h8v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 6l1 15h10l1-15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 16v-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 8h.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
import "./Suppliers.css";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import TablePagination from "../components/TablePagination";
import { useTablePagination } from "../hooks/useTablePagination";

function Suppliers() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [openAction, setOpenAction] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const toggleActionMenu = (event, index) => {
  const rect = event.currentTarget.getBoundingClientRect();

  setActionMenuPosition({
    top: rect.bottom + 8,
    left: rect.right - 150,
  });

  setOpenAction(openAction === index ? null : index);
};

  const [actionMenuPosition, setActionMenuPosition] = useState({
  top: 0,
  left: 0,
});

  const emptyForm = {
    supplierName: "",
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    taxNumber: "",
    openingBalance: "",
    status: "Active",
    note: "",
  };

  const [suppliers, setSuppliers] = useJsonCollection("suppliers");
  const [formData, setFormData] = useState(emptyForm);

  const filteredSuppliers = suppliers
    .map((supplier, originalIndex) => ({ ...supplier, originalIndex }))
    .filter((supplier) =>
      (supplier.supplierName || "").toLowerCase().includes(search.toLowerCase()) ||
      (supplier.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
      (supplier.contactPerson || "").toLowerCase().includes(search.toLowerCase()) ||
      (supplier.phone || "").toLowerCase().includes(search.toLowerCase()) ||
      (supplier.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (supplier.status || "").toLowerCase().includes(search.toLowerCase())
    );

  const supplierPagination = useTablePagination(filteredSuppliers, search);

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((supplier) => supplier.status === "Active").length;
  const inactiveSuppliers = suppliers.filter((supplier) => supplier.status === "Inactive").length;
  const totalOpeningBalance = suppliers.reduce(
    (sum, supplier) => sum + Number(supplier.openingBalance || 0),
    0
  );

  const money = (value) => Number(value || 0).toLocaleString("en-US");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditIndex(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    
    event.preventDefault();
    
    const cleanData = {
      ...formData,
      supplierName: formData.supplierName.trim(),
      companyName: formData.companyName.trim(),
      contactPerson: formData.contactPerson.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      taxNumber: formData.taxNumber.trim(),
      openingBalance: Number(formData.openingBalance || 0),
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editIndex !== null) {
  const updatedSuppliers = [...suppliers];
  updatedSuppliers[editIndex] = cleanData;

  const saved = await setSuppliers(updatedSuppliers);

  if (saved) {
    notify("Supplier updated successfully.");
    resetForm();
    setShowModal(false);
  }

  return;
}

const saved = await setSuppliers([...suppliers, cleanData]);

if (saved) {
  notify("Supplier saved successfully.");
  resetForm();
  setShowModal(false);
}

    resetForm();
    setShowModal(false);
  };

  const editSupplier = (index) => {
    setEditIndex(index);
    setFormData({
      ...emptyForm,
      ...suppliers[index],
    });
    setShowModal(true);
    setOpenAction(null);
  };

  const openDeleteModal = (index) => {
  setDeleteIndex(index);
  setDeleteModalOpen(true);
  setOpenAction(null);
};

const cancelDelete = () => {
  setDeleteIndex(null);
  setDeleteModalOpen(false);
};

const confirmDelete = () => {
  if (deleteIndex === null) return;

  setSuppliers(suppliers.filter((_, supplierIndex) => supplierIndex !== deleteIndex));
  setDeleteIndex(null);
  setDeleteModalOpen(false);
  notify("Supplier deleted successfully.");
};

  return (
    <div className="drivers-page suppliers-page">
      <div className="drivers-header">
        <div>
          <h1>Supplier Management</h1>
          <p>Save, edit, delete, and manage all supplier records.</p>
        </div>

        <button className="driver-add-btn" onClick={openCreateModal}>
          + Add Supplier
        </button>
      </div>

      <div className="drivers-stats">
        <div className="driver-stat-card">
          <span>Total Suppliers</span>
          <strong>{totalSuppliers}</strong>
          <p>All registered suppliers</p>
        </div>

        <div className="driver-stat-card">
          <span>Active Suppliers</span>
          <strong>{activeSuppliers}</strong>
          <p>Currently active suppliers</p>
        </div>

        <div className="driver-stat-card">
          <span>Inactive Suppliers</span>
          <strong>{inactiveSuppliers}</strong>
          <p>Disabled supplier records</p>
        </div>

        <div className="driver-stat-card">
          <span>Opening Balance</span>
          <strong>{money(totalOpeningBalance)}</strong>
          <p>Total supplier opening balance</p>
        </div>
      </div>

      <div className="drivers-table-card">
        <div className="drivers-table-header">
          <div>
            <h3>Supplier List</h3>
            <p>All suppliers saved in the system</p>
          </div>

          <input
            placeholder="Search supplier..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="drivers-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Supplier Name</th>
                <th>Company</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Opening Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {supplierPagination.pageItems.map((supplier) => {
                const index = supplier.originalIndex;

                return (
                  <tr key={index}>
                    <td className="driver-name">{supplier.supplierName}</td>
                    <td>{supplier.companyName || "-"}</td>
                    <td>{supplier.contactPerson || "-"}</td>
                    <td>{supplier.phone || "-"}</td>
                    <td>{supplier.email || "-"}</td>
                    <td>{money(supplier.openingBalance)} AFN</td>
                    <td>
                      <span
                        className={
                          supplier.status === "Active"
                            ? "driver-badge active"
                            : "driver-badge inactive"
                        }
                      >
                        {supplier.status}
                      </span>
                    </td>
                    <td>
  <div className="supplier-action-cell">
    <button
      type="button"
      className="action-btn"
      onClick={(event) => toggleActionMenu(event, index)}
    >
      ⋮
    </button>

    {openAction === index && (
      <div
        className="supplier-floating-menu"
        style={{
          top: `${actionMenuPosition.top}px`,
          left: `${actionMenuPosition.left}px`,
        }}
      >
        <Link
  className="supplier-menu-link"
  to={`/suppliers/${index}`}
  onClick={() => setOpenAction(null)}
>
  <InfoIcon />
  <span>Full Detail</span>
</Link>

<button type="button" onClick={() => editSupplier(index)}>
  <EditIcon />
  <span>Edit</span>
</button>

<button
  type="button"
  className="danger-action"
  onClick={() => openDeleteModal(index)}
>
  <TrashIcon />
  <span>Delete</span>
</button>
      </div>
    )}
  </div>
</td>
                  </tr>
                );
              })}

              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan="8" className="employee-empty">
                    No supplier has been registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={supplierPagination.page}
          totalPages={supplierPagination.totalPages}
          setPage={supplierPagination.setPage}
          totalItems={filteredSuppliers.length}
          pageSize={supplierPagination.pageSize}
        />
      </div>

      {showModal && (
        <div className="driver-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="driver-modal" onClick={(event) => event.stopPropagation()}>
            <div className="driver-modal-header">
              <div>
                <h3>{editIndex !== null ? "Edit Supplier" : "Add New Supplier"}</h3>
                <p>Enter complete supplier information.</p>
              </div>

              <button
                className="driver-close-btn"
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="driver-form-grid">
                <div className="form-group">
                  <label>Supplier Name</label>
                  <input
                    name="supplierName"
                    value={formData.supplierName}
                    onChange={handleChange}
                    placeholder="Example: Netlink Technologies"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Company Name</label>
                  <input
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Example: Netlink Ltd"
                  />
                </div>

                <div className="form-group">
                  <label>Contact Person</label>
                  <input
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    placeholder="Example: Ahmad"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Example: 0799000000"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Example: info@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>TIN / Tax Number</label>
                  <input
                    name="taxNumber"
                    value={formData.taxNumber}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="form-group">
                  <label>Opening Balance</label>
                  <input
                    type="number"
                    min="0"
                    name="openingBalance"
                    value={formData.openingBalance}
                    onChange={handleChange}
                    placeholder="Example: 5000"
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="form-group form-full">
                  <label>Address</label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Supplier address"
                  />
                </div>

                <div className="form-group form-full">
                  <label>Notes</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    placeholder="Additional supplier notes..."
                  />
                </div>
              </div>

              <div className="driver-modal-actions">
                <button
                  type="button"
                  className="driver-cancel-btn"
                  onClick={() => {
                    resetForm();
                    setShowModal(false);
                  }}
                >
                  Cancel
                </button>

                <button type="submit" className="driver-save-btn">
                  {editIndex !== null ? "Save Changes" : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteModalOpen && (
  <div className="supplier-delete-backdrop" onClick={cancelDelete}>
    <div className="supplier-delete-modal" onClick={(event) => event.stopPropagation()}>
      <div className="supplier-delete-icon">
        <TrashIcon />
      </div>

      <h3>Delete Supplier</h3>

      <p>
        Are you sure you want to delete this supplier? This action cannot be undone.
      </p>

      <div className="supplier-delete-actions">
        <button
          type="button"
          className="supplier-delete-cancel"
          onClick={cancelDelete}
        >
          Cancel
        </button>

        <button
          type="button"
          className="supplier-delete-confirm"
          onClick={confirmDelete}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default Suppliers;