import { useState } from "react";
import "./Drivers.css";
import { useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import TablePagination from "../components/TablePagination";
import { useTablePagination } from "../hooks/useTablePagination";
import { getAvailableSeatNumbers } from "../utils/seatManagement";

function Customers() {
  const [showModal, setShowModal] = useState(false);
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [search, setSearch] = useState("");
  const [travelSearch, setTravelSearch] = useState("");
  const [selectedRecordSearch, setSelectedRecordSearch] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [openAction, setOpenAction] = useState(null);
  const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(null);
  const navigate = useNavigate();

  const emptyForm = {
    firstName: "",
    lastName: "",
    phone: "",
    tazkiraNo: "",
    note: "",
  };

  const emptyCustomerTravel = {
    customerIndex: "",
    travelIndex: "",
    travelName: "",
    date: "",
    ticketNo: "",
    seatNo: "",
    mode: "شخصی",
    familyCount: "",
    driver: "",
    car: "",
    from: "",
    to: "",
    duration: "",
    passengers: "",
    fare: "",
    discount: "",
    paidAmount: "",
    remainingAmount: "",
    note: "",
  };

  const [customers, setCustomers] = useJsonCollection("customers");
  const [travels] = useJsonCollection("travels");
  const [cars] = useJsonCollection("cars");
  const [customerTravels, setCustomerTravels] = useJsonCollection("customerTravels");
  const [customerPayments, setCustomerPayments] = useJsonCollection("customerPayments");
  const [transactions, setTransactions] = useJsonCollection("transactions");

  const [formData, setFormData] = useState(emptyForm);
  const [customerTravelForm, setCustomerTravelForm] = useState(emptyCustomerTravel);

  const selectedCustomer =
    selectedCustomerIndex !== null ? customers[selectedCustomerIndex] : null;

  const selectedCustomerRecords = customerTravels.filter(
    (r) => Number(r.customerIndex) === Number(selectedCustomerIndex)
  );
  const filteredSelectedCustomerRecords = selectedCustomerRecords.filter((record) =>
    (record.travelName || "").includes(selectedRecordSearch) ||
    (record.date || "").includes(selectedRecordSearch) ||
    (record.from || "").includes(selectedRecordSearch) ||
    (record.to || "").includes(selectedRecordSearch) ||
    (record.note || "").includes(selectedRecordSearch)
  );

  const totalFare = selectedCustomerRecords.reduce(
    (sum, r) => sum + Number(r.fare || 0),
    0
  );

  const totalDiscount = selectedCustomerRecords.reduce(
    (sum, r) => sum + Number(r.discount || 0),
    0
  );

  const selectedInitialPaid = selectedCustomerRecords.reduce(
    (sum, r) => sum + Number(r.paidAmount || 0),
    0
  );
  const selectedLaterPaid = customerPayments
    .filter((payment) => Number(payment.customerIndex) === Number(selectedCustomerIndex))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const totalPaid = selectedInitialPaid + selectedLaterPaid;

  const customerDebt = Math.max(totalFare - totalDiscount - totalPaid, 0);
  const ourDebt = Math.max(totalPaid - (totalFare - totalDiscount), 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCustomerTravelChange = (e) => {
    const { name, value } = e.target;

    const updated = {
      ...customerTravelForm,
      [name]: value,
    };

    if (name === "mode" && value === "شخصی") {
      updated.familyCount = "";
    }

    if (name === "discount" || name === "paidAmount" || name === "fare") {
      const fare = Number(updated.fare || 0);
      const discount = Number(updated.discount || 0);
      const paid = Number(updated.paidAmount || 0);
      updated.remainingAmount = Math.max(fare - discount - paid, 0);
    }

    setCustomerTravelForm(updated);
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editIndex !== null) {
      const updated = [...customers];
      updated[editIndex] = formData;
      setCustomers(updated);
      notify("معلومات مشتری ویرایش شد.");
    } else {
      setCustomers([...customers, formData]);
      notify("مشتری جدید ثبت شد.");
    }

    resetForm();
    setShowModal(false);
  };

  const editCustomer = (index) => {
    setEditIndex(index);
    setFormData(customers[index]);
    setShowModal(true);
    setOpenAction(null);
  };

  const deleteCustomer = (index) => {
    if (window.confirm("آیا مطمئن هستید که این مشتری حذف شود؟")) {
      setCustomers(customers.filter((_, i) => i !== index));
      setCustomerTravels(
        customerTravels
          .filter((record) => Number(record.customerIndex) !== Number(index))
          .map((record) =>
            Number(record.customerIndex) > Number(index)
              ? { ...record, customerIndex: Number(record.customerIndex) - 1 }
              : record
          )
      );
      setCustomerPayments(
        customerPayments
          .filter((payment) => Number(payment.customerIndex) !== Number(index))
          .map((payment) =>
            Number(payment.customerIndex) > Number(index)
              ? { ...payment, customerIndex: Number(payment.customerIndex) - 1 }
              : payment
          )
      );
      setTransactions(
        transactions.map((transaction) => {
          if (Number(transaction.customerIndex) === Number(index)) {
            const historicalTransaction = { ...transaction };
            delete historicalTransaction.customerIndex;
            return historicalTransaction;
          }
          if (Number(transaction.customerIndex) > Number(index)) {
            return { ...transaction, customerIndex: Number(transaction.customerIndex) - 1 };
          }
          return transaction;
        })
      );
      setOpenAction(null);

      if (selectedCustomerIndex === index) {
        setSelectedCustomerIndex(null);
      }
      notify("مشتری حذف شد.");
    }
  };

  const selectTravel = (travel, index) => {
    const fare = Number(travel.fare || 0);
    const ticketNo = `T-${Date.now()}`;

    setCustomerTravelForm({
      customerIndex: selectedCustomerIndex,
      travelIndex: index,
      travelName: travel.name || "",
      date: travel.date || "",
      ticketNo,
      seatNo: "",
      mode: "شخصی",
      familyCount: "",
      driver: travel.driver || "",
      car: travel.car || "",
      from: travel.from || "",
      to: travel.to || "",
      duration: travel.duration || "",
      passengers: travel.passengers || "",
      fare: travel.fare || "",
      discount: "",
      paidAmount: "",
      remainingAmount: fare,
      note: "",
    });
  };

  const saveCustomerTravel = (e) => {
    e.preventDefault();

    if (customerTravelForm.travelIndex === "") {
      notify("لطفاً یک سفر را انتخاب کنید.", "error");
      return;
    }
    if (!customerTravelForm.seatNo) {
      notify("لطفاً نمبر چوکی را انتخاب کنید.", "error");
      return;
    }
    if (customerTravelForm.mode === "فامیلی" && !customerTravelForm.familyCount) {
      notify("لطفاً تعداد فامیل را وارد کنید.", "error");
      return;
    }
    if (!availableSeatNumbers.includes(String(customerTravelForm.seatNo))) {
      notify("این چوکی قبلاً رزرف شده یا برای این موتر موجود نیست.", "error");
      return;
    }

    const recordId = Date.now();
    setCustomerTravels([
      ...customerTravels,
      {
        id: recordId,
        ...customerTravelForm,
        ticketNo: customerTravelForm.ticketNo || `T-${recordId}`,
      },
    ]);

    const paidAmount = Number(customerTravelForm.paidAmount || 0);
    if (paidAmount > 0) {
      setTransactions([
        ...transactions,
        {
          id: recordId + 1,
          type: "income",
          title: `پرداخت سفر ${customerTravelForm.travelName}`,
          amount: paidAmount,
          date: customerTravelForm.date || new Date().toISOString().slice(0, 10),
          description: selectedCustomer
            ? `پرداخت اولیه ${selectedCustomer.firstName} ${selectedCustomer.lastName}`
            : "پرداخت اولیه مشتری",
          source: "customer-travel",
          referenceId: recordId,
          customerIndex: selectedCustomerIndex,
        },
      ]);
    }

    setCustomerTravelForm(emptyCustomerTravel);
    setTravelSearch("");
    setSelectedDestination("");
    setShowTravelModal(false);
    notify("سفر برای مشتری ثبت شد.");
    navigate(`/customers/${selectedCustomerIndex}/print/travel/${recordId}`);
  };

  const getTravelStatus = (travelIndex) => {
    return travels[travelIndex]?.status || "نامعلوم";
  };

  const filteredCustomers = customers
    .map((customer, originalIndex) => ({ ...customer, originalIndex }))
    .filter((customer) =>
      (customer.firstName || "").includes(search) ||
      (customer.lastName || "").includes(search) ||
      (customer.phone || "").includes(search) ||
      (customer.tazkiraNo || "").includes(search)
    );
  const customerPagination = useTablePagination(filteredCustomers, search);
  const selectedRecordsPagination = useTablePagination(filteredSelectedCustomerRecords, `${selectedCustomerIndex}-${selectedRecordSearch}`);

  const waitingDestinationNames = [...new Set(
    travels.filter((travel) => travel.status === "در انتظار" && travel.to).map((travel) => travel.to)
  )].sort((a, b) => a.localeCompare(b));

  const filteredTravels = travels
    .map((travel, originalIndex) => ({ ...travel, originalIndex }))
    .filter((travel) => travel.status === "در انتظار" && travel.to === selectedDestination)
    .filter((travel) =>
      (travel.name || "").includes(travelSearch) ||
      (travel.from || "").includes(travelSearch) ||
      (travel.to || "").includes(travelSearch) ||
      (travel.driver || "").includes(travelSearch)
    );
  const selectedTravelRecord = customerTravelForm.travelIndex === "" ? null : travels[Number(customerTravelForm.travelIndex)];
  const selectedTravelCar = selectedTravelRecord
    ? cars.find((car) => car.plate === selectedTravelRecord.car)
    : null;
  const travelReservations = customerTravelForm.travelIndex === ""
    ? []
    : customerTravels.filter((record) => Number(record.travelIndex) === Number(customerTravelForm.travelIndex));
  const availableSeatNumbers = getAvailableSeatNumbers(selectedTravelCar, travelReservations);
  const travelPagination = useTablePagination(filteredTravels, `${selectedDestination}-${travelSearch}`);

  const getCustomerBalance = (customerIndex) => {
    const customerRecords = customerTravels.filter(
      (record) => Number(record.customerIndex) === Number(customerIndex)
    );
    const fare = customerRecords.reduce(
      (sum, record) => sum + Number(record.fare || 0) - Number(record.discount || 0),
      0
    );
    const initialPayments = customerRecords.reduce(
      (sum, record) => sum + Number(record.paidAmount || 0),
      0
    );
    const laterPayments = customerPayments
      .filter((payment) => Number(payment.customerIndex) === Number(customerIndex))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const balance = fare - initialPayments - laterPayments;

    return {
      customerDebt: Math.max(balance, 0),
      ourDebt: Math.max(-balance, 0),
    };
  };

  return (
    <div className="drivers-page">
      <div className="drivers-header">
        <div>
          <h1>مدیریت مشتری‌ها</h1>
          <p>ثبت، مشاهده، ویرایش و حذف مشتری‌های سیستم حمل و نقل</p>
        </div>

        <button className="driver-add-btn" onClick={() => setShowModal(true)}>
          + ثبت مشتری جدید
        </button>
      </div>

      {selectedCustomer && (
        <>
          <div className="drivers-table-card">
            <div className="drivers-table-header">
              <div>
                <h3>
                  جزئیات مشتری: {selectedCustomer.firstName}{" "}
                  {selectedCustomer.lastName}
                </h3>
                <p>
                  تماس: {selectedCustomer.phone} | تذکره:{" "}
                  {selectedCustomer.tazkiraNo || "ندارد"}
                </p>
              </div>

              <button
                className="driver-add-btn"
                onClick={() => { setSelectedDestination(""); setShowTravelModal(true); }}
              >
                + ثبت سفر
              </button>
            </div>

            <p>{selectedCustomer.note || "توضیحات ثبت نشده است"}</p>
          </div>

          <div className="drivers-stats">
            <div className="driver-stat-card">
              <span>قرضدار ما</span>
              <strong>{customerDebt}</strong>
              <p>باقی‌مانده مشتری</p>
            </div>

            <div className="driver-stat-card">
              <span>ما قرضدارش هستیم</span>
              <strong>{ourDebt}</strong>
              <p>پرداخت اضافه مشتری</p>
            </div>

            <div className="driver-stat-card">
              <span>پرداخت شده</span>
              <strong>{totalPaid}</strong>
              <p>کل پول پرداخت‌شده</p>
            </div>

            <div className="driver-stat-card">
              <span>تخفیف</span>
              <strong>{totalDiscount}</strong>
              <p>کل تخفیف‌ها</p>
            </div>
          </div>

          <div className="drivers-table-card">
            <div className="drivers-table-header">
              <div>
                <h3>سفرهای ثبت‌شده مشتری</h3>
                <p>تمام سفرهایی که برای این مشتری ثبت شده است</p>
              </div>
              <input value={selectedRecordSearch} onChange={(event) => setSelectedRecordSearch(event.target.value)} placeholder="جستجو در سفرهای مشتری..." />
            </div>

            <div className="drivers-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>نام سفر</th>
                    <th>تاریخ</th>
                    <th>نمبر چوکی</th>
                    <th>مسیر</th>
                    <th>کرایه</th>
                    <th>تخفیف</th>
                    <th>پرداخت</th>
                    <th>باقی‌مانده</th>
                    <th>وضعیت</th>
                    <th>توضیحات</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedRecordsPagination.pageItems.map((record) => (
                    <tr key={record.id}>
                      <td>{record.travelName}</td>
                      <td>{record.date}</td>
                      <td>{record.seatNo || "-"}</td>
                      <td>
                        {record.from} - {record.to}
                      </td>
                      <td>{record.fare}</td>
                      <td>{record.discount || 0}</td>
                      <td>{record.paidAmount || 0}</td>
                      <td>{record.remainingAmount || 0}</td>
                      <td>
                        <span
                          className={
                            getTravelStatus(record.travelIndex) === "تکمیل شده"
                              ? "driver-badge active"
                              : getTravelStatus(record.travelIndex) === "در جریان"
                              ? "driver-badge active"
                              : "driver-badge inactive"
                          }
                        >
                          {getTravelStatus(record.travelIndex)}
                        </span>
                      </td>
                      <td>{record.note || "-"}</td>
                    </tr>
                  ))}

                  {selectedCustomerRecords.length === 0 && (
                    <tr>
                      <td colSpan="10" style={{ textAlign: "center", padding: "25px" }}>
                        هنوز برای این مشتری سفری ثبت نشده است
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination page={selectedRecordsPagination.page} totalPages={selectedRecordsPagination.totalPages} setPage={selectedRecordsPagination.setPage} totalItems={filteredSelectedCustomerRecords.length} pageSize={selectedRecordsPagination.pageSize} />
          </div>
        </>
      )}

      <div className="drivers-table-card">
        <div className="drivers-table-header">
          <div>
            <h3>لیست مشتری‌ها</h3>
            <p>تمام مشتری‌های ثبت‌شده در سیستم</p>
          </div>

          <input
            placeholder="جستجوی مشتری..."
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
                <th>نمبر تذکره</th>
                <th>قرضدار ما</th>
                <th>ما قرضدارش</th>
                <th>توضیحات</th>
                <th>عملیات</th>
              </tr>
            </thead>

            <tbody>
              {customerPagination.pageItems.map((customer) => {
                const index = customer.originalIndex;
                const balance = getCustomerBalance(index);
                return (
                <tr key={index}>
                  <td className="driver-name">
                    <button type="button" className="driver-name-link" onClick={() => navigate(`/customers/${index}`)}>
                      {customer.firstName}
                    </button>
                  </td>
                  <td>
                    <button type="button" className="driver-name-link" onClick={() => navigate(`/customers/${index}`)}>
                      {customer.lastName}
                    </button>
                  </td>
                  <td>{customer.phone}</td>
                  <td>{customer.tazkiraNo || "-"}</td>
                  <td>{balance.customerDebt}</td>
                  <td>{balance.ourDebt}</td>
                  <td>{customer.note || "-"}</td>
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
                          <button type="button" onClick={() => navigate(`/customers/${index}`)}>
                            جزئیات
                          </button>

                          <button type="button" onClick={() => editCustomer(index)}>
                            ویرایش
                          </button>

                          <button
                            type="button"
                            className="danger-action"
                            onClick={() => deleteCustomer(index)}
                          >
                            حذف
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
                  <td colSpan="8" style={{ textAlign: "center", padding: "25px" }}>
                    هیچ مشتری ثبت نشده است
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination page={customerPagination.page} totalPages={customerPagination.totalPages} setPage={customerPagination.setPage} totalItems={filteredCustomers.length} pageSize={customerPagination.pageSize} />
      </div>

      {showTravelModal && (
        <div className="driver-modal-backdrop" onClick={() => setShowTravelModal(false)}>
          <div className="driver-modal" onClick={(e) => e.stopPropagation()}>
            <div className="driver-modal-header">
              <div>
                <h3>ثبت سفر برای مشتری</h3>
                <p>ابتدا مقصد و سپس یک سفر در انتظار را انتخاب کنید</p>
              </div>

              <button
                className="driver-close-btn"
                onClick={() => { setSelectedDestination(""); setShowTravelModal(false); }}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveCustomerTravel}>
              <div className="customer-destination-step">
                <label>قدم اول: انتخاب مقصد</label>
                <div className="customer-destination-grid">
                  {waitingDestinationNames.map((destination) => (
                    <button
                      type="button"
                      key={destination}
                      className={selectedDestination === destination ? "active" : ""}
                      onClick={() => { setSelectedDestination(destination); setTravelSearch(""); setCustomerTravelForm(emptyCustomerTravel); }}
                    >
                      <strong>{destination}</strong>
                      <span>{travels.filter((travel) => travel.status === "در انتظار" && travel.to === destination).length} سفر در انتظار</span>
                    </button>
                  ))}
                  {waitingDestinationNames.length === 0 && <p>هیچ مقصد دارای سفر در انتظار نیست.</p>}
                </div>
              </div>

              <div className="form-group form-full">
                <label>قدم دوم: جستجوی سفر در انتظار {selectedDestination && `به ${selectedDestination}`}</label>
                <input
                  value={travelSearch}
                  onChange={(e) => setTravelSearch(e.target.value)}
                  placeholder="نام سفر، مسیر یا راننده..."
                />
              </div>

              <div className="drivers-table-wrap" style={{ marginBottom: "15px" }}>
                <table>
                  <thead>
                    <tr>
                      <th>انتخاب</th>
                    <th>نام سفر</th>
                    <th>تاریخ</th>
                    <th>مسیر</th>
                    <th>کرایه</th>
                    <th>وضعیت</th>
                    </tr>
                  </thead>

                  <tbody>
                    {travelPagination.pageItems.map((travel) => (
                      <tr key={travel.originalIndex}>
                        <td>
                          <button
                            type="button"
                            className="driver-save-btn"
                            onClick={() => selectTravel(travel, travel.originalIndex)}
                          >
                            انتخاب
                          </button>
                        </td>
                        <td>{travel.name}</td>
                        <td>{travel.date || "-"}</td>
                        <td>
                          {travel.from} - {travel.to}
                        </td>
                        <td>{travel.fare}</td>
                        <td>{travel.status}</td>
                      </tr>
                    ))}

                    {filteredTravels.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                          {selectedDestination ? "هیچ سفر در انتظاری برای این مقصد پیدا نشد" : "ابتدا یک مقصد را انتخاب کنید"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <TablePagination page={travelPagination.page} totalPages={travelPagination.totalPages} setPage={travelPagination.setPage} totalItems={filteredTravels.length} pageSize={travelPagination.pageSize} />

              <div className="driver-form-grid">
                <div className="form-group">
                  <label>نام سفر</label>
                  <input value={customerTravelForm.travelName} readOnly />
                </div>

                <div className="form-group">
                  <label>تاریخ</label>
                  <input value={customerTravelForm.date} readOnly />
                </div>

                <div className="form-group">
                  <label>حالت</label>
                  <select
                    name="mode"
                    value={customerTravelForm.mode}
                    onChange={handleCustomerTravelChange}
                  >
                    <option value="شخصی">شخصی</option>
                    <option value="فامیلی">فامیلی</option>
                  </select>
                </div>

                {customerTravelForm.mode === "فامیلی" && (
                  <div className="form-group">
                    <label>تعداد فامیل</label>
                    <input
                      type="number"
                      min="1"
                      name="familyCount"
                      value={customerTravelForm.familyCount}
                      onChange={handleCustomerTravelChange}
                      placeholder="مثلاً 4"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>نمبر چوکی</label>
                  <select
                    name="seatNo"
                    value={customerTravelForm.seatNo}
                    onChange={handleCustomerTravelChange}
                    required
                    disabled={!selectedTravelRecord || availableSeatNumbers.length === 0}
                  >
                    <option value="">
                      {!selectedTravelRecord
                        ? "ابتدا سفر را انتخاب کنید"
                        : availableSeatNumbers.length === 0
                        ? "همه چوکی‌ها رزرف شده‌اند"
                        : "انتخاب چوکی"}
                    </option>
                    {availableSeatNumbers.map((seatNo) => (
                      <option key={seatNo} value={seatNo}>
                        چوکی {seatNo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>راننده</label>
                  <input value={customerTravelForm.driver} readOnly />
                </div>

                <div className="form-group">
                  <label>موتر</label>
                  <input value={customerTravelForm.car} readOnly />
                </div>

                <div className="form-group">
                  <label>مبدأ</label>
                  <input value={customerTravelForm.from} readOnly />
                </div>

                <div className="form-group">
                  <label>مقصد</label>
                  <input value={customerTravelForm.to} readOnly />
                </div>

                <div className="form-group">
                  <label>قیمت سفر</label>
                  <input
                    type="number"
                    name="fare"
                    value={customerTravelForm.fare}
                    onChange={handleCustomerTravelChange}
                    placeholder="مثلاً 300"
                  />
                </div>

                <div className="form-group">
                  <label>تخفیف</label>
                  <input
                    type="number"
                    name="discount"
                    value={customerTravelForm.discount}
                    onChange={handleCustomerTravelChange}
                    placeholder="مثلاً 500"
                  />
                </div>

                <div className="form-group">
                  <label>مقدار پرداخت‌شده</label>
                  <input
                    type="number"
                    name="paidAmount"
                    value={customerTravelForm.paidAmount}
                    onChange={handleCustomerTravelChange}
                    placeholder="مثلاً 3000"
                  />
                </div>

                <div className="form-group">
                  <label>باقی‌مانده</label>
                  <input value={customerTravelForm.remainingAmount} readOnly />
                </div>

                <div className="form-group form-full">
                  <label>توضیحات</label>
                  <textarea
                    name="note"
                    value={customerTravelForm.note}
                    onChange={handleCustomerTravelChange}
                  />
                </div>
              </div>

              <div className="driver-modal-actions">
                <button
                  type="button"
                  className="driver-cancel-btn"
                  onClick={() => { setSelectedDestination(""); setShowTravelModal(false); }}
                >
                  لغو
                </button>

                <button type="submit" className="driver-save-btn">
                  ثبت سفر مشتری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div className="driver-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="driver-modal" onClick={(e) => e.stopPropagation()}>
            <div className="driver-modal-header">
              <div>
                <h3>{editIndex !== null ? "ویرایش مشتری" : "ثبت مشتری جدید"}</h3>
                <p>معلومات مشتری را وارد کنید</p>
              </div>

              <button className="driver-close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="driver-form-grid">
                <div className="form-group">
                  <label>نام مشتری</label>
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
                    required
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
                  <label>نمبر تذکره</label>
                  <input
                    name="tazkiraNo"
                    value={formData.tazkiraNo}
                    onChange={handleChange}
                    placeholder="اختیاری"
                  />
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
                  {editIndex !== null ? "ذخیره تغییرات" : "ثبت مشتری"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
