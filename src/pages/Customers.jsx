import { useState } from "react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import "./Customers.css";

const emptyForm = {
  customerId: "",
  customerName: "",
  fatherName: "",
  phone: "",
  email: "",
  nationalId: "",
  address: "",
  registrationDate: "",
  status: "Active",
  notes: "",
};

const emptyPackageForm = {
  packageName: "",
  speed: "",
  packagePrice: "",
  paidAmount: "",
  remainAmount: "",
  startDate: "",
  endDate: "",
  status: "Active",
  notes: "",
};

function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 8h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 6l1 15h10l1-15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function money(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function Customers() {
  const [customers, setCustomers] = useJsonCollection("customers");
  const [customerPackages, setCustomerPackages] = useJsonCollection("customerPackages");

  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packageForm, setPackageForm] = useState(emptyPackageForm);
  const [packageCustomer, setPackageCustomer] = useState(null);

  const [formData, setFormData] = useState(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [search, setSearch] = useState("");
  const [detailRecord, setDetailRecord] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);

  const [openAction, setOpenAction] = useState(null);
  const [actionPosition, setActionPosition] = useState({ top: 0, left: 0 });

  const activeCustomers = customers.filter((item) => item.status === "Active").length;
  const inactiveCustomers = customers.filter((item) => item.status === "Inactive").length;
  const disconnectedCustomers = customers.filter((item) => item.status === "Disconnected").length;
  const activePackages = customerPackages.filter((item) => item.status === "Active");

const monthlyRevenue = activePackages.reduce(
  (sum, item) => sum + Number(item.packagePrice || 0),
  0
);

const getCustomerPackages = (customer) => {
  return customerPackages.filter(
    (item) =>
      String(item.customerId) === String(customer.customerId) ||
      String(item.customerRecordId) === String(customer.id)
  );
};

const openPackageModal = (customer) => {
  setPackageCustomer(customer);
  setPackageForm(emptyPackageForm);
  setShowPackageModal(true);
};

const closePackageModal = () => {
  setPackageCustomer(null);
  setPackageForm(emptyPackageForm);
  setShowPackageModal(false);
};

const handlePackageChange = (event) => {
  const { name, value } = event.target;

  setPackageForm((previous) => {
    const nextData = {
      ...previous,
      [name]: value,
    };

    const price =
      name === "packagePrice"
        ? Number(value || 0)
        : Number(nextData.packagePrice || 0);

    const paid =
      name === "paidAmount"
        ? Number(value || 0)
        : Number(nextData.paidAmount || 0);

    return {
      ...nextData,
      remainAmount: Math.max(price - paid, 0),
    };
  });
};

const saveCustomerPackage = async (event) => {
  event.preventDefault();

  if (!packageCustomer) return;

  const cleanPackage = {
    id: Date.now(),
    customerRecordId: packageCustomer.id,
    customerId: packageCustomer.customerId,
    customerName: packageCustomer.customerName,
    packageName: packageForm.packageName.trim(),
    speed: packageForm.speed.trim(),
    packagePrice: Number(packageForm.packagePrice || 0),
    paidAmount: Number(packageForm.paidAmount || 0),
    remainAmount: Number(packageForm.remainAmount || 0),
    startDate: packageForm.startDate,
    endDate: packageForm.endDate,
    status: packageForm.status,
    notes: packageForm.notes.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!cleanPackage.packageName && !cleanPackage.speed) {
    notify("Please enter package name or speed.", "error");
    return;
  }

  if (!cleanPackage.startDate || !cleanPackage.endDate) {
    notify("Please enter package start date and end date.", "error");
    return;
  }

  const updatedPackages = customerPackages.map((item) => {
    const sameCustomer =
      String(item.customerId) === String(packageCustomer.customerId) ||
      String(item.customerRecordId) === String(packageCustomer.id);

    if (sameCustomer && item.status === "Active") {
      return {
        ...item,
        status: "Expired",
        updatedAt: new Date().toISOString(),
      };
    }

    return item;
  });

  const saved = await setCustomerPackages([...updatedPackages, cleanPackage]);

  if (saved) {
    notify("Customer package saved successfully.");
    closePackageModal();
  }
};

  const filteredCustomers = customers
    .map((customer, originalIndex) => ({ ...customer, originalIndex }))
    .filter((customer) => {
      const keyword = search.toLowerCase();

      return (
        (customer.customerId || "").toLowerCase().includes(keyword) ||
        (customer.customerName || "").toLowerCase().includes(keyword) ||
        (customer.fatherName || "").toLowerCase().includes(keyword) ||
        (customer.phone || "").toLowerCase().includes(keyword) ||
        (customer.email || "").toLowerCase().includes(keyword) ||
        (customer.nationalId || "").toLowerCase().includes(keyword) ||
        (customer.address || "").toLowerCase().includes(keyword) ||
        (customer.status || "").toLowerCase().includes(keyword)
      );
    });

  const generateCustomerId = () => {
    const numbers = customers
      .map((item) => String(item.customerId || ""))
      .map((id) => Number(id.replace("CUS-", "")))
      .filter((number) => !Number.isNaN(number));

    const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;

    setFormData((previous) => ({
      ...previous,
      customerId: `CUS-${String(nextNumber).padStart(4, "0")}`,
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

  const closeModal = () => {
    resetForm();
    setShowModal(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const customerExists = (data) => {
    return customers.some((customer, index) => {
      if (editIndex !== null && index === editIndex) return false;

      const sameCustomerId =
        data.customerId &&
        customer.customerId &&
        data.customerId.toLowerCase() === customer.customerId.toLowerCase();

      const samePhone =
        data.phone &&
        customer.phone &&
        data.phone.toLowerCase() === customer.phone.toLowerCase();

      const sameNationalId =
        data.nationalId &&
        customer.nationalId &&
        data.nationalId.toLowerCase() === customer.nationalId.toLowerCase();

      return sameCustomerId || samePhone || sameNationalId;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanData = {
      id: editIndex !== null ? customers[editIndex]?.id || Date.now() : Date.now(),
      customerId: formData.customerId.trim(),
      customerName: formData.customerName.trim(),
      fatherName: formData.fatherName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      nationalId: formData.nationalId.trim(),
      address: formData.address.trim(),
      registrationDate: formData.registrationDate,
      status: formData.status,
      notes: formData.notes.trim(),
      createdAt: editIndex !== null ? customers[editIndex]?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!cleanData.customerId) {
      notify("Please enter or generate Customer ID.", "error");
      return;
    }

    if (!cleanData.customerName) {
      notify("Please enter customer name.", "error");
      return;
    }

    if (!cleanData.phone) {
      notify("Please enter customer phone.", "error");
      return;
    }

    if (customerExists(cleanData)) {
      notify("Customer ID, phone, or national ID already exists.", "error");
      return;
    }

    if (editIndex !== null) {
      const updatedCustomers = [...customers];
      updatedCustomers[editIndex] = cleanData;

      const saved = await setCustomers(updatedCustomers);

      if (saved) {
        notify("Customer updated successfully.");
        closeModal();
      }

      return;
    }

    const saved = await setCustomers([...customers, cleanData]);

    if (saved) {
      notify("Customer saved successfully.");
      closeModal();
    }
  };

  const openEditModal = (index) => {
    setEditIndex(index);
    setFormData({
      ...emptyForm,
      ...customers[index],
      monthlyFee: String(customers[index]?.monthlyFee || ""),
    });
    setShowModal(true);
    setOpenAction(null);
  };

  const openDeleteModal = (index) => {
    setDeleteIndex(index);
    setOpenAction(null);
  };

  const cancelDelete = () => {
    setDeleteIndex(null);
  };

  const confirmDelete = async () => {
    if (deleteIndex === null) return;

    const saved = await setCustomers(customers.filter((_, index) => index !== deleteIndex));

    if (saved) {
      notify("Customer deleted successfully.");
      setDeleteIndex(null);
    }
  };

  const toggleActionMenu = (event, index) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setActionPosition({
      top: rect.bottom + 8,
      left: rect.right - 160,
    });

    setOpenAction(openAction === index ? null : index);
  };

  const getStatusClass = (status) => {
    if (status === "Active") return "customer-badge active";
    if (status === "Inactive") return "customer-badge inactive";
    if (status === "Disconnected") return "customer-badge disconnected";
    return "customer-badge";
  };

  return (
    <div className="customers-page">
      <div className="customers-header">
        <div>
          <h1>Customer Management</h1>
          <p>Register, edit, delete, and manage ISP customer records.</p>
        </div>

        <button type="button" className="customer-add-btn" onClick={openCreateModal}>
          + Add Customer
        </button>
      </div>

      <div className="customer-stats">
        <div className="customer-stat-card">
          <span>Total Customers</span>
          <strong>{customers.length}</strong>
          <p>All registered customers</p>
        </div>

        <div className="customer-stat-card">
          <span>Active Customers</span>
          <strong>{activeCustomers}</strong>
          <p>Currently active customers</p>
        </div>

        <div className="customer-stat-card">
          <span>Inactive Customers</span>
          <strong>{inactiveCustomers}</strong>
          <p>Inactive customer records</p>
        </div>

        <div className="customer-stat-card">
          <span>Disconnected</span>
          <strong>{disconnectedCustomers}</strong>
          <p>Disconnected customers</p>
        </div>

        <div className="customer-stat-card">
          <span>Monthly Revenue</span>
          <strong>{money(monthlyRevenue)} AFN</strong>
          <p>Expected monthly fee</p>
        </div>
      </div>

      <div className="customer-table-card">
        <div className="customer-table-header">
          <div>
            <h3>Customer List</h3>
            <p>All customers saved in the system</p>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer..."
          />
        </div>

        <div className="customer-table-wrap">
          <table>
            <thead>
             <tr>
  <th>Customer ID</th>
  <th>Customer Name</th>
  <th>Phone</th>
  <th>Registration Date</th>
  <th>Status</th>
  <th>Actions</th>
</tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => {
                const index = customer.originalIndex;

                return (
                  <tr key={customer.id || index}>
                    <td className="customer-strong">{customer.customerId || "-"}</td>
                    <td>{customer.customerName || "-"}</td>
                    <td>{customer.phone || "-"}</td>
                    <td>{customer.registrationDate || "-"}</td>
                    <td>
                      <span className={getStatusClass(customer.status)}>
                        {customer.status || "Unknown"}
                      </span>
                    </td>
                    <td>
                      <div className="customer-action-cell">
                        <button
                          type="button"
                          className="customer-action-btn"
                          onClick={(event) => toggleActionMenu(event, index)}
                        >
                          ⋮
                        </button>

                        {openAction === index && (
                          <div
                            className="customer-action-menu"
                            style={{
                              top: `${actionPosition.top}px`,
                              left: `${actionPosition.left}px`,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setDetailRecord(customer);
                                setOpenAction(null);
                              }}
                            >
                              <InfoIcon />
                              <span>Full Detail</span>
                            </button>

                            <button type="button" onClick={() => openEditModal(index)}>
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

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="7" className="customer-empty">
                    No customer has been registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="customer-modal-backdrop" onClick={closeModal}>
          <div className="customer-modal" onClick={(event) => event.stopPropagation()}>
            <div className="customer-modal-header">
              <div>
                <h3>{editIndex !== null ? "Edit Customer" : "Add Customer"}</h3>
                <p>Enter customer identity, contact, package, and account information.</p>
              </div>

              <button type="button" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="customer-form-grid">
                <div className="customer-form-group">
                  <label>Customer ID</label>
                  <div className="customer-id-field">
                    <input
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleChange}
                      placeholder="Example: CUS-0001"
                      required
                    />

                    <button type="button" onClick={generateCustomerId}>
                      Generate
                    </button>
                  </div>
                </div>

                <div className="customer-form-group">
                  <label>Customer Name</label>
                  <input
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Example: Rahmatullah"
                    required
                  />
                </div>

                <div className="customer-form-group">
                  <label>Father Name</label>
                  <input
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    placeholder="Example: Ahmad"
                  />
                </div>

                <div className="customer-form-group">
                  <label>Phone</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Example: 0790000000"
                    required
                  />
                </div>

                <div className="customer-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Example: customer@email.com"
                  />
                </div>

                <div className="customer-form-group">
                  <label>National ID</label>
                  <input
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleChange}
                    placeholder="Example: Tazkira / NID"
                  />
                </div>


                <div className="customer-form-group">
                  <label>Registration Date</label>
                  <input
                    type="date"
                    name="registrationDate"
                    value={formData.registrationDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="customer-form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Disconnected">Disconnected</option>
                  </select>
                </div>

                <div className="customer-form-group customer-form-full">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Customer address..."
                  />
                </div>

                <div className="customer-form-group customer-form-full">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional customer notes..."
                  />
                </div>
              </div>

              <div className="customer-modal-actions">
                <button type="button" className="customer-cancel-btn" onClick={closeModal}>
                  Cancel
                </button>

                <button type="submit" className="customer-save-btn">
                  {editIndex !== null ? "Save Changes" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailRecord && (
        <div className="customer-detail-backdrop" onClick={() => setDetailRecord(null)}>
          <div className="customer-detail-modal" onClick={(event) => event.stopPropagation()}>
            <div className="customer-detail-header">
              <div>
                <h3>Customer Full Detail</h3>
                <p>Complete customer profile information.</p>
              </div>

              <button type="button" onClick={() => setDetailRecord(null)}>
                ×
              </button>
            </div>

            <div className="customer-detail-grid">
              <div><span>Customer ID</span><strong>{detailRecord.customerId || "-"}</strong></div>
              <div><span>Customer Name</span><strong>{detailRecord.customerName || "-"}</strong></div>
              <div><span>Father Name</span><strong>{detailRecord.fatherName || "-"}</strong></div>
              <div><span>Phone</span><strong>{detailRecord.phone || "-"}</strong></div>
              <div><span>Email</span><strong>{detailRecord.email || "-"}</strong></div>
              <div><span>National ID</span><strong>{detailRecord.nationalId || "-"}</strong></div>
              <div><span>Customer Type</span><strong>{detailRecord.customerType || "-"}</strong></div>
              <div><span>Package / Speed</span><strong>{detailRecord.packageSpeed || "-"}</strong></div>
              <div><span>Monthly Fee</span><strong>{money(detailRecord.monthlyFee)} AFN</strong></div>
              <div><span>Registration Date</span><strong>{detailRecord.registrationDate || "-"}</strong></div>
              <div><span>Status</span><strong>{detailRecord.status || "-"}</strong></div>
            </div>

            <div className="customer-detail-notes">
              <span>Address</span>
              <p>{detailRecord.address || "No address has been added for this customer."}</p>
            </div>

            <div className="customer-detail-notes">
              <span>Notes</span>
              <p>{detailRecord.notes || "No notes have been added for this customer."}</p>
            </div>
<div className="customer-package-history">
  <h4>Package History</h4>

  <div className="customer-package-table-wrap">
    <table>
      <thead>
        <tr>
          <th>Package</th>
          <th>Speed</th>
          <th>Price</th>
          <th>Paid</th>
          <th>Remain</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {getCustomerPackages(detailRecord).map((item) => (
          <tr key={item.id}>
            <td>{item.packageName || "-"}</td>
            <td>{item.speed || "-"}</td>
            <td>{money(item.packagePrice)} AFN</td>
            <td>{money(item.paidAmount)} AFN</td>
            <td>{money(item.remainAmount)} AFN</td>
            <td>{item.startDate || "-"}</td>
            <td>{item.endDate || "-"}</td>
            <td>{item.status || "-"}</td>
          </tr>
        ))}

        {getCustomerPackages(detailRecord).length === 0 && (
          <tr>
            <td colSpan="8" className="customer-empty">
              No package has been added for this customer yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>
            <div className="customer-detail-actions">
  <button
    type="button"
    className="customer-package-btn"
    onClick={() => openPackageModal(detailRecord)}
  >
    + Add Package
  </button>

  <button type="button" onClick={() => setDetailRecord(null)}>
    Close
  </button>
</div>
          </div>
        </div>
      )}
      {showPackageModal && packageCustomer && (
  <div className="customer-modal-backdrop" onClick={closePackageModal}>
    <div className="customer-modal" onClick={(event) => event.stopPropagation()}>
      <div className="customer-modal-header">
        <div>
          <h3>Add Package</h3>
          <p>Add a new internet package for {packageCustomer.customerName}.</p>
        </div>

        <button type="button" onClick={closePackageModal}>
          ×
        </button>
      </div>

      <form onSubmit={saveCustomerPackage}>
        <div className="customer-form-grid">
          <div className="customer-form-group">
            <label>Package Name</label>
            <input
              name="packageName"
              value={packageForm.packageName}
              onChange={handlePackageChange}
              placeholder="Example: Home Internet"
            />
          </div>

          <div className="customer-form-group">
            <label>Speed</label>
            <input
              name="speed"
              value={packageForm.speed}
              onChange={handlePackageChange}
              placeholder="Example: 10 Mbps"
            />
          </div>

          <div className="customer-form-group">
            <label>Package Price</label>
            <input
              type="number"
              min="0"
              name="packagePrice"
              value={packageForm.packagePrice}
              onChange={handlePackageChange}
              placeholder="Example: 1500"
              required
            />
          </div>

          <div className="customer-form-group">
            <label>Paid Amount</label>
            <input
              type="number"
              min="0"
              name="paidAmount"
              value={packageForm.paidAmount}
              onChange={handlePackageChange}
              placeholder="Example: 1000"
            />
          </div>

          <div className="customer-form-group">
            <label>Remain Amount</label>
            <input value={`${money(packageForm.remainAmount)} AFN`} readOnly />
          </div>

          <div className="customer-form-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={packageForm.startDate}
              onChange={handlePackageChange}
              required
            />
          </div>

          <div className="customer-form-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={packageForm.endDate}
              onChange={handlePackageChange}
              required
            />
          </div>

          <div className="customer-form-group">
            <label>Status</label>
            <select
              name="status"
              value={packageForm.status}
              onChange={handlePackageChange}
            >
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Paused">Paused</option>
            </select>
          </div>

          <div className="customer-form-group customer-form-full">
            <label>Notes</label>
            <textarea
              name="notes"
              value={packageForm.notes}
              onChange={handlePackageChange}
              placeholder="Package notes..."
            />
          </div>
        </div>

        <div className="customer-modal-actions">
          <button type="button" className="customer-cancel-btn" onClick={closePackageModal}>
            Cancel
          </button>

          <button type="submit" className="customer-save-btn">
            Save Package
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {deleteIndex !== null && (
        <div className="customer-delete-backdrop" onClick={cancelDelete}>
          <div className="customer-delete-modal" onClick={(event) => event.stopPropagation()}>
            <div className="customer-delete-icon">
              <TrashIcon />
            </div>

            <h3>Delete Customer</h3>
            <p>Are you sure you want to delete this customer? This action cannot be undone.</p>

            <div className="customer-delete-actions">
              <button type="button" className="customer-delete-cancel" onClick={cancelDelete}>
                Cancel
              </button>

              <button type="button" className="customer-delete-confirm" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;