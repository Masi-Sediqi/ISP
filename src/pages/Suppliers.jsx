import { useEffect, useState } from "react";
import {
  useNavigate,
} from "react-router-dom";

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
import "./Suppliers.css";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import TablePagination from "../components/TablePagination";
import { useTablePagination } from "../hooks/useTablePagination";
import { hasPermission } from "../utils/permissions";
import { createId } from "../utils/createId";

function Suppliers({ currentUser }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [openAction, setOpenAction] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);

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

  const translateSupplierValue = (value) => {
    const labels = {
      Active: tx("Active", "فعال", "فعال"),
      Inactive: tx("Inactive", "غیرفعال", "غیرفعال"),
      Balance: tx("Balance", "بیلانس", "بیلانس"),
    };

    return labels[String(value || "")] || value;
  };

  const [actionMenuPosition, setActionMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const toggleActionMenu = (event, index) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setActionMenuPosition({
      top: rect.bottom + 8,
      left: rect.right - 150,
    });

    setOpenAction(openAction === index ? null : index);
  };



  const emptyForm = {
    supplierName: "",
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    taxNumber: "",
    openingBalance: "",
    supplierTypes: [],
    customSupplierType: "",
    status: "Active",
    note: "",
  };

  const [suppliers, setSuppliers] = useJsonCollection("suppliers");
  const [supplierPayments, setSupplierPayments] =
    useJsonCollection("supplierPayments");
  const [formData, setFormData] = useState(emptyForm);
  const canCreateSupplier = hasPermission(currentUser, "suppliers", "create");
  const canEditSupplier = hasPermission(currentUser, "suppliers", "edit");
  const canDeleteSupplier = hasPermission(currentUser, "suppliers", "delete");

  const filteredSuppliers = suppliers
    .map((supplier, originalIndex) => ({ ...supplier, originalIndex }))
    .filter((supplier) =>
      (supplier.supplierName || "").toLowerCase().includes(search.toLowerCase()) ||
      (supplier.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
      (supplier.contactPerson || "").toLowerCase().includes(search.toLowerCase()) ||
      (supplier.phone || "").toLowerCase().includes(search.toLowerCase()) ||
      (supplier.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (supplier.supplierTypes || []).join(" ").toLowerCase().includes(search.toLowerCase()) ||
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

  const toggleSupplierType = (type) => {
    setFormData((previous) => {
      const currentTypes = previous.supplierTypes || [];
      const exists = currentTypes.includes(type);

      return {
        ...previous,
        supplierTypes: exists
          ? currentTypes.filter((item) => item !== type)
          : [...currentTypes, type],
      };
    });
  };

  const addCustomSupplierType = () => {
    const customType = formData.customSupplierType.trim();

    if (!customType) return;

    setFormData((previous) => ({
      ...previous,
      supplierTypes: Array.from(
        new Set([...(previous.supplierTypes || []), customType])
      ),
      customSupplierType: "",
    }));
  };

  const removeSupplierType = (type) => {
    setFormData((previous) => ({
      ...previous,
      supplierTypes: (previous.supplierTypes || []).filter(
        (item) => item !== type
      ),
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditIndex(null);
  };

  const openCreateModal = () => {
    if (!canCreateSupplier) {
      notify(tx("You do not have permission to create supplier records.", "شما اجازه ایجاد تأمین‌کننده را ندارید.", "تاسو د عرضه کوونکي د جوړولو اجازه نه لرئ."), "error");
      return;
    }
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
      supplierTypes: formData.supplierTypes || [],
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    delete cleanData.customSupplierType;

    if (editIndex !== null) {
  if (!canEditSupplier) {
    notify(tx("You do not have permission to edit supplier records.", "شما اجازه ویرایش تأمین‌کننده را ندارید.", "تاسو د عرضه کوونکي د سمون اجازه نه لرئ."), "error");
    return;
  }
  const updatedSuppliers = [...suppliers];
  updatedSuppliers[editIndex] = cleanData;

  const saved = await setSuppliers(updatedSuppliers);

  if (saved) {
    notify(tx("Supplier updated successfully.", "تأمین‌کننده با موفقیت ویرایش شد.", "عرضه کوونکی په بریالیتوب سره سم شو."));
    resetForm();
    setShowModal(false);
  }

  return;
}

if (!canCreateSupplier) {
  notify(tx("You do not have permission to create supplier records.", "شما اجازه ایجاد تأمین‌کننده را ندارید.", "تاسو د عرضه کوونکي د جوړولو اجازه نه لرئ."), "error");
  return;
}

const newSupplier = {
  ...cleanData,
  id: cleanData.id || createId(),
};

const saved = await setSuppliers([...suppliers, newSupplier]);

if (saved) {
  const openingBalance = Number(newSupplier.openingBalance || 0);

  if (openingBalance !== 0) {
    const balanceRecord = {
      id: createId(),
      recordType: "balance",
      type: "Balance",
      supplierIndex: suppliers.length,
      supplierRecordId: newSupplier.id,
      supplierName: newSupplier.supplierName,
      balanceDate: new Date().toISOString().slice(0, 10),
      balanceSide:
        openingBalance < 0
          ? "we_owe_supplier"
          : "supplier_owes_us",
      amount: Math.abs(openingBalance),
      notes: newSupplier.note || "Opening balance from supplier form",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setSupplierPayments([
      ...supplierPayments,
      balanceRecord,
    ]);
  }

  notify(tx("Supplier saved successfully.", "تأمین‌کننده با موفقیت ذخیره شد.", "عرضه کوونکی په بریالیتوب سره خوندي شو."));
  resetForm();
  setShowModal(false);
}

    resetForm();
    setShowModal(false);
  };

  const editSupplier = (index) => {
    if (!canEditSupplier) {
      notify(tx("You do not have permission to edit supplier records.", "شما اجازه ویرایش تأمین‌کننده را ندارید.", "تاسو د عرضه کوونکي د سمون اجازه نه لرئ."), "error");
      return;
    }
    setEditIndex(index);
    setFormData({
      ...emptyForm,
      ...suppliers[index],
      supplierTypes: suppliers[index].supplierTypes || [],
      customSupplierType: "",
    });
    setShowModal(true);
    setOpenAction(null);
  };

  const openDeleteModal = (index) => {
  if (!canDeleteSupplier) {
    notify(tx("You do not have permission to delete supplier records.", "شما اجازه حذف تأمین‌کننده را ندارید.", "تاسو د عرضه کوونکي د حذف اجازه نه لرئ."), "error");
    return;
  }
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
  if (!canDeleteSupplier) {
    notify(tx("You do not have permission to delete supplier records.", "شما اجازه حذف تأمین‌کننده را ندارید.", "تاسو د عرضه کوونکي د حذف اجازه نه لرئ."), "error");
    return;
  }

  setSuppliers(suppliers.filter((_, supplierIndex) => supplierIndex !== deleteIndex));
  setDeleteIndex(null);
  setDeleteModalOpen(false);
  notify(tx("Supplier deleted successfully.", "تأمین‌کننده با موفقیت حذف شد.", "عرضه کوونکی په بریالیتوب سره حذف شو."));
};

  return (
    <div className={`drivers-page suppliers-page ${interfaceLanguage !== "en" ? "suppliers-page-rtl" : ""}`}>
      <div className="drivers-header">
        <div>
          <h1>{tx("Supplier Management", "مدیریت تأمین‌کنندگان", "د عرضه کوونکو مدیریت")}</h1>
          <p>{tx("Save, edit, delete, and manage all supplier records.", "سوابق تمام تأمین‌کنندگان را ذخیره، ویرایش، حذف و مدیریت کنید.", "د ټولو عرضه کوونکو ریکارډونه خوندي، سم، حذف او مدیریت کړئ.")}</p>
        </div>

        {canCreateSupplier && (
          <button className="driver-add-btn" onClick={openCreateModal}>
            + {tx("Add Supplier", "افزودن تأمین‌کننده", "عرضه کوونکی زیاتول")}
          </button>
        )}
      </div>

      <div className="drivers-stats">
        <div className="driver-stat-card">
          <span>{tx("Total Suppliers", "مجموع تأمین‌کنندگان", "ټول عرضه کوونکي")}</span>
          <strong>{totalSuppliers}</strong>
          <p>{tx("All registered suppliers", "تمام تأمین‌کنندگان ثبت‌شده", "ټول ثبت شوي عرضه کوونکي")}</p>
        </div>

        <div className="driver-stat-card">
          <span>{tx("Active Suppliers", "تأمین‌کنندگان فعال", "فعال عرضه کوونکي")}</span>
          <strong>{activeSuppliers}</strong>
          <p>{tx("Currently active suppliers", "تأمین‌کنندگان فعال فعلی", "اوسني فعال عرضه کوونکي")}</p>
        </div>

        <div className="driver-stat-card">
          <span>{tx("Inactive Suppliers", "تأمین‌کنندگان غیرفعال", "غیرفعال عرضه کوونکي")}</span>
          <strong>{inactiveSuppliers}</strong>
          <p>{tx("Disabled supplier records", "سوابق تأمین‌کنندگان غیرفعال", "د غیرفعالو عرضه کوونکو ریکارډونه")}</p>
        </div>

        <div className="driver-stat-card">
          <span>{tx("Opening Balance", "بیلانس ابتدایی", "پیل بیلانس")}</span>
          <strong>{money(totalOpeningBalance)}</strong>
          <p>{tx("Total supplier opening balance", "مجموع بیلانس ابتدایی تأمین‌کنندگان", "د عرضه کوونکو ټول پیل بیلانس")}</p>
        </div>
      </div>

      <div className="drivers-table-card">
        <div className="drivers-table-header">
          <div>
            <h3>{tx("Supplier List", "فهرست تأمین‌کنندگان", "د عرضه کوونکو لېست")}</h3>
            <p>{tx("All suppliers saved in the system", "تمام تأمین‌کنندگان ثبت‌شده در سیستم", "ټول عرضه کوونکي چې په سیسټم کې ثبت شوي")}</p>
          </div>

          <input
            placeholder={tx("Search supplier...", "جستجوی تأمین‌کننده...", "عرضه کوونکی ولټوئ...")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="drivers-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{tx("Supplier Name", "نام تأمین‌کننده", "د عرضه کوونکي نوم")}</th>
                <th>{tx("Company", "شرکت", "شرکت")}</th>
                <th>{tx("Contact Person", "شخص تماس", "د اړیکې شخص")}</th>
                <th>{tx("Phone", "شماره تماس", "د تلیفون شمېره")}</th>
                <th>{tx("Email", "ایمیل", "برېښنالیک")}</th>
                <th>{tx("Opening Balance", "بیلانس ابتدایی", "پیل بیلانس")}</th>
                <th>{tx("Status", "وضعیت", "حالت")}</th>
                <th>{tx("Actions", "عملیات", "عملونه")}</th>
              </tr>
            </thead>

            <tbody>
              {supplierPagination.pageItems.map((supplier) => {
                const index = supplier.originalIndex;

                return (
                  <tr
  key={supplier.id || index}
  className="supplier-clickable-row"
  onClick={() =>
    navigate(`/suppliers/${index}`)
  }
>
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
                        {translateSupplierValue(supplier.status)}
                      </span>
                    </td>
                    <td>
  <div className="supplier-action-cell">
    <button
  type="button"
  className="action-btn"
  onClick={(event) => {
    event.stopPropagation();
    toggleActionMenu(event, index);
  }}
>
  ⋮
</button>

    {openAction === index && (
      <div
  className="supplier-floating-menu"
  onClick={(event) =>
    event.stopPropagation()
  }
  style={{
    top: `${actionMenuPosition.top}px`,
    left: `${actionMenuPosition.left}px`,
  }}
>
{canEditSupplier && (
  <button type="button" onClick={() => editSupplier(index)}>
    <EditIcon />
    <span>{tx("Edit", "ویرایش", "سمول")}</span>
  </button>
)}

{canDeleteSupplier && (
  <button
    type="button"
    className="danger-action"
    onClick={() => openDeleteModal(index)}
  >
    <TrashIcon />
    <span>{tx("Delete", "حذف", "حذف")}</span>
  </button>
)}
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
                    {tx("No supplier has been registered yet.", "هنوز هیچ تأمین‌کننده‌ای ثبت نشده است.", "تر اوسه هېڅ عرضه کوونکی نه دی ثبت شوی.")}
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
          setPageSize={supplierPagination.setPageSize}
        />
      </div>

      {showModal && (
        <div className="driver-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="driver-modal" onClick={(event) => event.stopPropagation()}>
            <div className="driver-modal-header">
              <div>
                <h3>{editIndex !== null ? tx("Edit Supplier", "ویرایش تأمین‌کننده", "عرضه کوونکی سمول") : tx("Add New Supplier", "افزودن تأمین‌کننده جدید", "نوی عرضه کوونکی زیاتول")}</h3>
                <p>{tx("Enter complete supplier information.", "معلومات کامل تأمین‌کننده را وارد کنید.", "د عرضه کوونکي بشپړ معلومات ولیکئ.")}</p>
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
  <div className="form-group form-full">
    <label>{tx("Name / Company", "نام / شرکت", "نوم / شرکت")}</label>
    <input
      name="supplierName"
      value={formData.supplierName}
      onChange={handleChange}
      placeholder={tx("Enter supplier or company name", "نام تأمین‌کننده یا شرکت را وارد کنید", "د عرضه کوونکي یا شرکت نوم ولیکئ")}
      required
    />
  </div>

  <div className="form-group">
    <label>{tx("Contact Person", "شخص تماس", "د اړیکې شخص")}</label>
    <input
      name="contactPerson"
      value={formData.contactPerson}
      onChange={handleChange}
      placeholder={tx("Enter contact person name", "نام شخص تماس را وارد کنید", "د اړیکې شخص نوم ولیکئ")}
    />
  </div>

  <div className="form-group">
    <label>{tx("Phone Number", "شماره تماس", "د تلیفون شمېره")}</label>
    <input
      name="phone"
      value={formData.phone}
      onChange={handleChange}
      placeholder={tx("Example: 0799000000", "مثال: 0799000000", "بېلګه: 0799000000")}
      required
    />
  </div>

  <div className="form-group">
    <label>{tx("Email", "ایمیل", "برېښنالیک")}</label>
    <input
      type="email"
      name="email"
      value={formData.email}
      onChange={handleChange}
      placeholder={tx("Example: info@example.com", "مثال: info@example.com", "بېلګه: info@example.com")}
    />
  </div>

  <div className="form-group">
    <label>{tx("Opening Balance", "بیلانس ابتدایی", "پیل بیلانس")}</label>
    <input
      type="number"
      step="any"
      name="openingBalance"
      value={formData.openingBalance}
      onChange={handleChange}
      placeholder={tx("Example: -100 or 100", "مثال: -100 یا 100", "بېلګه: -100 یا 100")}
    />

    <small className="supplier-balance-help">
      {tx("Negative: We owe the supplier — Positive: Supplier owes us", "منفی: ما به تأمین‌کننده بدهکار هستیم — مثبت: تأمین‌کننده به ما بدهکار است", "منفي: موږ عرضه کوونکي ته پوروړي یو — مثبت: عرضه کوونکی موږ ته پوروړی دی")}
    </small>
  </div>

  <div className="form-group form-full">
  <label>{tx("Item Supply", "اقلام تأمین‌شده", "عرضه شوي توکي")}</label>

  <div className="supplier-custom-type-add">
    <input
      name="customSupplierType"
      value={formData.customSupplierType}
      onChange={handleChange}
      placeholder={tx("Add supplied item...", "قلم تأمین‌شده را اضافه کنید...", "عرضه شوی توکی زیات کړئ...")}
    />

    <button
      type="button"
      onClick={addCustomSupplierType}
    >
      {tx("Add", "افزودن", "زیاتول")}
    </button>
  </div>

  {(formData.supplierTypes || []).length > 0 && (
    <div className="supplier-type-chips">
      {(formData.supplierTypes || []).map(
        (type) => (
          <button
            type="button"
            key={type}
            onClick={() =>
              removeSupplierType(type)
            }
          >
            {type}
            <span>×</span>
          </button>
        )
      )}
    </div>
  )}
</div>

  <div className="form-group form-full">
    <label>{tx("Notes", "یادداشت", "یادښت")}</label>
    <textarea
      name="note"
      value={formData.note}
      onChange={handleChange}
      placeholder={tx("Additional supplier notes...", "یادداشت اضافی تأمین‌کننده...", "د عرضه کوونکي اضافي یادښت...")}
      rows="4"
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
                  {tx("Cancel", "لغو", "لغوه")}
                </button>

                <button type="submit" className="driver-save-btn">
                  {editIndex !== null
                    ? tx("Save Changes", "ذخیره تغییرات", "بدلونونه خوندي کړئ")
                    : tx("Save Supplier", "ذخیره تأمین‌کننده", "عرضه کوونکی خوندي کړئ")}
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

      <h3>{tx("Delete Supplier", "حذف تأمین‌کننده", "عرضه کوونکی حذف کول")}</h3>

      <p>
        {tx("Are you sure you want to delete this supplier? This action cannot be undone.", "آیا مطمئن هستید که این تأمین‌کننده را حذف می‌کنید؟ این عمل قابل بازگشت نیست.", "ایا ډاډه یاست چې دا عرضه کوونکی حذف کړئ؟ دا عمل بېرته نه شي راګرځېدلی.")}
      </p>

      <div className="supplier-delete-actions">
        <button
          type="button"
          className="supplier-delete-cancel"
          onClick={cancelDelete}
        >
          {tx("Cancel", "لغو", "لغوه")}
        </button>

        <button
          type="button"
          className="supplier-delete-confirm"
          onClick={confirmDelete}
        >
          {tx("Delete", "حذف", "حذف")}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

export default Suppliers;
