import { useState } from "react";
import "./Drivers.css";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";

function Drivers() {
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [openAction, setOpenAction] = useState(null);

  const emptyForm = {
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    licenseNo: "",
    salaryType: "",
    fixedSalary: "",
    percentage: "",
    status: "",
    note: "",
  };

  const [drivers, setDrivers] = useJsonCollection("drivers");

  const [formData, setFormData] = useState(emptyForm);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
      ...(name === "salaryType" && value === "ثابت" ? { percentage: "" } : {}),
      ...(name === "salaryType" && value === "فیصدی" ? { fixedSalary: "" } : {}),
    });
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editIndex !== null) {
      const updated = [...drivers];
      updated[editIndex] = formData;
      setDrivers(updated);
      notify("معلومات راننده ویرایش شد.");
    } else {
      setDrivers([...drivers, formData]);
      notify("راننده جدید ثبت شد.");
    }

    resetForm();
    setShowModal(false);
  };

  const editDriver = (index) => {
    setEditIndex(index);
    setFormData(drivers[index]);
    setShowModal(true);
    setOpenAction(null);
  };

  const deleteDriver = (index) => {
    if (window.confirm("آیا مطمئن هستید که این راننده حذف شود؟")) {
      setDrivers(drivers.filter((_, i) => i !== index));
      setOpenAction(null);
      notify("راننده حذف شد.");
    }
  };

  const filteredDrivers = drivers.filter((driver) =>
    driver.firstName.includes(search) ||
    driver.lastName.includes(search) ||
    driver.phone.includes(search) ||
    driver.licenseNo.includes(search)
  );

  const activeDrivers = drivers.filter((d) => d.status === "فعال").length;
  const inactiveDrivers = drivers.filter((d) => d.status === "غیرفعال").length;
  const percentDrivers = drivers.filter((d) => d.salaryType === "فیصدی").length;

  return (
    <div className="drivers-page">
      <div className="drivers-header">
        <div>
          <h1>مدیریت رانندگان</h1>
          <p>ثبت، مشاهده و مدیریت رانندگان سیستم حمل و نقل</p>
        </div>

        <button className="driver-add-btn" onClick={() => setShowModal(true)}>
          + ثبت راننده جدید
        </button>
      </div>

      <div className="drivers-stats">
        <div className="driver-stat-card">
          <span>کل رانندگان</span>
          <strong>{drivers.length}</strong>
          <p>تمام رانندگان ثبت‌شده</p>
        </div>

        <div className="driver-stat-card">
          <span>رانندگان فعال</span>
          <strong>{activeDrivers}</strong>
          <p>آماده برای سفر</p>
        </div>

        <div className="driver-stat-card">
          <span>معاش فیصدی</span>
          <strong>{percentDrivers}</strong>
          <p>رانندگان فیصدی</p>
        </div>

        <div className="driver-stat-card">
          <span>غیرفعال</span>
          <strong>{inactiveDrivers}</strong>
          <p>فعلاً کار نمی‌کنند</p>
        </div>
      </div>

      <div className="drivers-table-card">
        <div className="drivers-table-header">
          <div>
            <h3>لیست رانندگان</h3>
            <p>تمام رانندگان ثبت‌شده در سیستم</p>
          </div>

          <input
            placeholder="جستجوی راننده..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="drivers-table-wrap">
          <table>
            <thead>
              <tr>
                <th>نام</th>
                <th>تخلص</th>
                <th>شماره تماس</th>
                <th>نمبر لایسنس</th>
                <th>نوع معاش</th>
                <th>معاش / فیصدی</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>

            <tbody>
              {filteredDrivers.map((driver, index) => (
                <tr key={index}>
                  <td className="driver-name" title={driver.firstName}>
                    {driver.firstName}
                  </td>
                  <td title={driver.lastName}>{driver.lastName}</td>
                  <td>{driver.phone}</td>
                  <td>{driver.licenseNo || "-"}</td>
                  <td>{driver.salaryType}</td>
                  <td>
                    {driver.salaryType === "ثابت"
                      ? `${driver.fixedSalary || 0} افغانی`
                      : `${driver.percentage || 0}%`}
                  </td>
                  <td>
                    <span
                      className={
                        driver.status === "فعال"
                          ? "driver-badge active"
                          : "driver-badge inactive"
                      }
                    >
                      {driver.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-dropdown">
                      <button
                        className="action-btn"
                        onClick={() =>
                          setOpenAction(openAction === index ? null : index)
                        }
                      >
                        ⋮
                      </button>

                      {openAction === index && (
                        <div className="action-menu">
                          <button type="button" onClick={() => editDriver(index)}>
                            ویرایش
                          </button>

                          <button
                            type="button"
                            className="danger-action"
                            onClick={() => deleteDriver(index)}
                          >
                            حذف
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDrivers.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "25px" }}>
                    هیچ راننده‌ای ثبت نشده است
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="driver-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="driver-modal" onClick={(e) => e.stopPropagation()}>
            <div className="driver-modal-header">
              <div>
                <h3>{editIndex !== null ? "ویرایش راننده" : "ثبت راننده جدید"}</h3>
                <p>معلومات راننده را وارد کنید</p>
              </div>

              <button className="driver-close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="driver-form-grid">
                <div className="form-group">
                  <label>نام راننده</label>
                  <input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>تخلص</label>
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>شماره تماس</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>نمبر لایسنس</label>
                  <input
                    name="licenseNo"
                    value={formData.licenseNo}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>آدرس</label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>نوع معاش</label>
                  <select
                    name="salaryType"
                    value={formData.salaryType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">انتخاب نوع معاش</option>
                    <option value="ثابت">ثابت</option>
                    <option value="فیصدی">فیصدی</option>
                  </select>
                </div>

                {formData.salaryType === "ثابت" && (
                  <div className="form-group">
                    <label>مقدار معاش ثابت</label>
                    <input
                      type="number"
                      name="fixedSalary"
                      value={formData.fixedSalary}
                      onChange={handleChange}
                      placeholder="مثلاً 15000"
                      required
                    />
                  </div>
                )}

                {formData.salaryType === "فیصدی" && (
                  <div className="form-group">
                    <label>فیصدی راننده</label>
                    <input
                      type="number"
                      name="percentage"
                      value={formData.percentage}
                      onChange={handleChange}
                      placeholder="مثلاً 20"
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>وضعیت</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="">انتخاب وضعیت</option>
                    <option value="فعال">فعال</option>
                    <option value="غیرفعال">غیرفعال</option>
                  </select>
                </div>

                <div className="form-group form-full">
                  <label>توضیحات</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
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
                  لغو
                </button>

                <button type="submit" className="driver-save-btn">
                  {editIndex !== null ? "ذخیره تغییرات" : "ثبت راننده"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Drivers;
