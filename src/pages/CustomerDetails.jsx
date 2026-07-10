import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./CustomerDetails.css";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { createRecordId } from "../utils/ids";
import TablePagination from "../components/TablePagination";
import { useTablePagination } from "../hooks/useTablePagination";
import { Pencil, Printer, Trash2 } from "lucide-react";
import SeatSelector from "../components/SeatSelector";
import AfghanDateInput from "../components/AfghanDateInput";
import { formatSeatNumbers, getAvailableSeatNumbers } from "../utils/seatManagement";
import { formatAfghanDate, todayDateValue } from "../utils/afghanDate";

function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const customerIndex = Number(id);

  const [showTravelModal, setShowTravelModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [travelSearch, setTravelSearch] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [recordType, setRecordType] = useState("all");
  const [editActivity, setEditActivity] = useState(null);
  const [editForm, setEditForm] = useState({ date: "", fare: "", discount: "", payment: "", description: "" });

  const [customers] = useJsonCollection("customers");
  const [settings] = useJsonCollection("settings");
  const [travels] = useJsonCollection("travels");
  const [cars] = useJsonCollection("cars");
  const [customerTravels, setCustomerTravels] = useJsonCollection("customerTravels");
  const [customerPayments, setCustomerPayments] = useJsonCollection("customerPayments");
  const [customerBalances, setCustomerBalances] = useJsonCollection("customerBalances");
  const [transactions, setTransactions] = useJsonCollection("transactions");
  const [paymentForm, setPaymentForm] = useState({
    date: todayDateValue(),
    amount: "",
    description: "",
  });
  const [balanceForm, setBalanceForm] = useState({
    date: todayDateValue(),
    direction: "customer-owes-us",
    amount: "",
    description: "",
  });

  const emptyTravelForm = {
    customerIndex,
    travelIndex: "",
    travelName: "",
    date: "",
    ticketNo: "",
    seatNo: "",
    seatNos: [],
    mode: "شخصی",
    familyCount: "",
    driver: "",
    car: "",
    from: "",
    to: "",
    duration: "",
    baseFare: "",
    baggageKg: "",
    baggageCharge: "",
    fare: "",
    discount: "",
    paidAmount: "",
    remainingAmount: "",
    note: "",
  };

  const [travelForm, setTravelForm] = useState(emptyTravelForm);

  const customer = customers[customerIndex];
  const cargoSettings = settings[0] || {};
  const calculateBaggageCharge = (weight) => {
    const kg = Number(weight || 0);
    const threshold = Number(cargoSettings.cargoThresholdKg || 0);
    const price = Number(cargoSettings.cargoPricePerKg || 0);
    return kg > threshold ? Math.max(kg - threshold, 0) * price : 0;
  };

  const records = customerTravels.filter(
    (r) => Number(r.customerIndex) === customerIndex
  );

  const totalFare = records.reduce((sum, r) => sum + Number(r.fare || 0), 0);
  const totalDiscount = records.reduce((sum, r) => sum + Number(r.discount || 0), 0);
  const customerPaymentRecords = customerPayments.filter(
    (payment) => Number(payment.customerIndex) === customerIndex
  );
  const customerBalanceRecords = customerBalances.filter(
    (balance) => Number(balance.customerIndex) === customerIndex
  );
  const openingCustomerDebt = customerBalanceRecords
    .filter((balance) => balance.direction === "customer-owes-us")
    .reduce((sum, balance) => sum + Number(balance.amount || 0), 0);
  const openingOurDebt = customerBalanceRecords
    .filter((balance) => balance.direction === "we-owe-customer")
    .reduce((sum, balance) => sum + Number(balance.amount || 0), 0);
  const initialPaid = records.reduce((sum, r) => sum + Number(r.paidAmount || 0), 0);
  const laterPaid = customerPaymentRecords.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );
  const totalPaid = initialPaid + laterPaid + openingOurDebt;

  const customerDebt = Math.max(totalFare + openingCustomerDebt - totalDiscount - totalPaid, 0);
  const ourDebt = Math.max(totalPaid - (totalFare + openingCustomerDebt - totalDiscount), 0);

  const waitingDestinationNames = [...new Set(
    travels.filter((travel) => travel.status === "در انتظار" && travel.to).map((travel) => travel.to)
  )].sort((a, b) => a.localeCompare(b));

  const filteredTravels = travels
    .map((travel, index) => ({ ...travel, originalIndex: index }))
    .filter((travel) => travel.status === "در انتظار" && travel.to === selectedDestination)
    .filter((travel) =>
      (travel.name || "").includes(travelSearch) ||
      (travel.from || "").includes(travelSearch) ||
      (travel.to || "").includes(travelSearch) ||
      (travel.driver || "").includes(travelSearch)
    );
  const selectedTravelRecord = travelForm.travelIndex === "" ? null : travels[Number(travelForm.travelIndex)];
  const selectedTravelCar = selectedTravelRecord
    ? cars.find((car) => car.plate === selectedTravelRecord.car)
    : null;
  const travelReservations = travelForm.travelIndex === ""
    ? []
    : customerTravels.filter((record) => Number(record.travelIndex) === Number(travelForm.travelIndex));
  const availableSeatNumbers = getAvailableSeatNumbers(selectedTravelCar, travelReservations);

  const selectTravel = (travel) => {
    const fare = Number(travel.fare || 0);
    setTravelForm({
      customerIndex,
      travelIndex: travel.originalIndex,
      travelName: travel.name || "",
      date: travel.date || "",
      ticketNo: "",
      seatNo: "",
      seatNos: [],
      mode: "شخصی",
      familyCount: "",
      driver: travel.driver || "",
      car: travel.car || "",
      from: travel.from || "",
      to: travel.to || "",
      duration: travel.duration || "",
      baseFare: fare,
      baggageKg: "",
      baggageCharge: "",
      fare: travel.fare || "",
      discount: "",
      paidAmount: "",
      remainingAmount: fare,
      note: "",
    });
  };

  const handleTravelFormChange = (e) => {
    const { name, value } = e.target;

    const updated = {
      ...travelForm,
      [name]: value,
    };

    if (name === "mode" && value === "شخصی") {
      updated.familyCount = "";
      updated.seatNos = updated.seatNos.slice(0, 1);
    }

    if (name === "familyCount") {
      updated.seatNos = updated.seatNos.slice(0, Math.max(Number(value || 0), 0));
    }

    if (name === "baggageKg") {
      const baseFare = Number(updated.baseFare || updated.fare || 0);
      const baggageCharge = calculateBaggageCharge(value);
      updated.baggageCharge = baggageCharge;
      updated.fare = baseFare + baggageCharge;
    }

    if (name === "fare") {
      updated.baseFare = value;
    }

    const fare = Number(updated.fare || 0);
    const discount = Number(updated.discount || 0);
    const paid = Number(updated.paidAmount || 0);

    updated.remainingAmount = Math.max(fare - discount - paid, 0);
    setTravelForm(updated);
  };

  const saveCustomerTravel = (e) => {
    e.preventDefault();

    if (travelForm.travelIndex === "") {
      notify("لطفاً اول یک سفر را انتخاب کنید.", "error");
      return;
    }
    if (travelForm.mode === "فامیلی" && Number(travelForm.familyCount) < 1) {
      notify("لطفاً تعداد فامیل را وارد کنید.", "error");
      return;
    }
    const requiredSeats = travelForm.mode === "فامیلی" ? Number(travelForm.familyCount) : 1;
    if (travelForm.seatNos.length !== requiredSeats) {
      notify(`لطفاً دقیقاً ${requiredSeats} چوکی را انتخاب کنید.`, "error");
      return;
    }
    if (travelForm.seatNos.some((seatNo) => !availableSeatNumbers.includes(String(seatNo)))) {
      notify("یکی از چوکی‌ها قبلاً رزرف شده یا برای این موتر موجود نیست.", "error");
      return;
    }

    const recordId = createRecordId();
    setCustomerTravels([
      ...customerTravels,
      {
        id: recordId,
        ...travelForm,
        seatNo: travelForm.seatNos.join(","),
        ticketNo: travelForm.ticketNo || `T-${recordId}`,
      },
    ]);

    const paidAmount = Number(travelForm.paidAmount || 0);
    if (paidAmount > 0) {
      setTransactions([
        ...transactions,
        {
          id: recordId + 1,
          type: "income",
          title: `پرداخت سفر ${travelForm.travelName}`,
          amount: paidAmount,
          date: travelForm.date || todayDateValue(),
          description: `پرداخت اولیه ${customer.firstName} ${customer.lastName}`,
          source: "customer-travel",
          referenceId: recordId,
          customerIndex,
        },
      ]);
    }

    setTravelForm(emptyTravelForm);
    setTravelSearch("");
    setSelectedDestination("");
    setShowTravelModal(false);
    notify("سفر مشتری ثبت شد.");
    navigate(`/customers/${customerIndex}/print/travel/${recordId}`);
  };

  const savePayment = (event) => {
    event.preventDefault();
    const amount = Number(paymentForm.amount || 0);

    if (amount <= 0 || amount > customerDebt) {
      notify("مقدار پرداخت باید بیشتر از صفر و کمتر یا مساوی بدهی مشتری باشد.", "error");
      return;
    }

    const paymentId = Date.now();
    setCustomerPayments([
      ...customerPayments,
      {
        id: paymentId,
        customerIndex,
        ...paymentForm,
        amount,
      },
    ]);
    setTransactions([
      ...transactions,
      {
        id: paymentId + 1,
        type: "income",
        title: `پرداخت بدهی ${customer.firstName} ${customer.lastName}`,
        amount,
        date: paymentForm.date,
        description: paymentForm.description,
        source: "customer-payment",
        referenceId: paymentId,
        customerIndex,
      },
    ]);
    setPaymentForm({
      date: todayDateValue(),
      amount: "",
      description: "",
    });
    setShowPaymentModal(false);
    notify("پرداخت مشتری با موفقیت ثبت شد.");
    navigate(`/customers/${customerIndex}/print/payment/${paymentId}`);
  };

  const saveBalance = (event) => {
    event.preventDefault();
    const amount = Number(balanceForm.amount || 0);
    if (customerDebt > 0 || ourDebt > 0) {
      notify("ثبت بیلانس فقط زمانی مجاز است که حساب مشتری صفر در صفر باشد.", "error");
      return;
    }
    if (amount <= 0) {
      notify("مقدار بیلانس باید بیشتر از صفر باشد.", "error");
      return;
    }

    setCustomerBalances([
      ...customerBalances,
      {
        id: Date.now(),
        customerIndex,
        ...balanceForm,
        amount,
      },
    ]);
    setBalanceForm({
      date: todayDateValue(),
      direction: "customer-owes-us",
      amount: "",
      description: "",
    });
    setShowBalanceModal(false);
    notify("بیلانس مشتری ثبت شد.");
  };

  const rawCustomerActivity = [
    ...records.map((record) => ({
      id: `travel-${record.id}`,
      type: "travel",
      date: record.date,
      title: record.travelName,
      route: `${record.from || "-"} - ${record.to || "-"}`,
      fare: Number(record.fare || 0),
      discount: Number(record.discount || 0),
      payment: Number(record.paidAmount || 0),
      remaining: Number(record.remainingAmount ?? Math.max(
        Number(record.fare || 0) -
          Number(record.discount || 0) -
          Number(record.paidAmount || 0),
        0
      )),
      status: travels[record.travelIndex]?.status || "نامعلوم",
      description: record.note,
      recordId: record.id,
    })),
    ...customerPaymentRecords.map((payment) => ({
      id: `payment-${payment.id}`,
      type: "payment",
      date: payment.date,
      title: "پرداخت باقی‌مانده",
      route: "-",
      fare: null,
      discount: null,
      payment: Number(payment.amount || 0),
      remaining: null,
      status: "پرداخت",
      description: payment.description || "پرداخت بعدی مشتری",
      recordId: payment.id,
    })),
    ...customerBalanceRecords.map((balance) => ({
      id: `balance-${balance.id}`,
      type: "balance",
      date: balance.date,
      title: "ثبت بیلانس",
      route: "-",
      fare: balance.direction === "customer-owes-us" ? Number(balance.amount || 0) : null,
      discount: null,
      payment: balance.direction === "we-owe-customer" ? Number(balance.amount || 0) : 0,
      remaining: null,
      status: balance.direction === "customer-owes-us" ? "مشتری قرضدار ما" : "ما قرضدار مشتری",
      description: balance.description || "-",
      recordId: balance.id,
    })),
  ].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

  const customerActivity = rawCustomerActivity
    .filter((item) => recordType === "all" || item.type === recordType)
    .filter((item) =>
      (item.title || "").includes(recordSearch) ||
      (item.route || "").includes(recordSearch) ||
      (item.description || "").includes(recordSearch) ||
      (item.date || "").includes(recordSearch)
    )
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const activityPagination = useTablePagination(customerActivity, `${recordSearch}-${recordType}`);
  const travelPagination = useTablePagination(filteredTravels, `${selectedDestination}-${travelSearch}`);

  if (!customer) {
    return (
      <div className="customer-details-page">
        <div className="customer-details-card">
          <h3>مشتری پیدا نشد</h3>
          <button className="customer-btn" onClick={() => navigate("/customers")}>
            برگشت
          </button>
        </div>
      </div>
    );
  }

  const getStatusClass = (status) => {
    if (status === "در انتظار") return "customer-badge pending";
    if (status === "تکمیل شده") return "customer-badge done";
    if (status === "در جریان") return "customer-badge active";
    return "customer-badge inactive";
  };

  const openEditActivity = (item) => {
    setEditActivity(item);
    setEditForm({
      date: item.date || "",
      fare: item.fare ?? "",
      discount: item.discount ?? "",
      payment: item.payment ?? "",
      description: item.description || "",
    });
  };

  const saveActivityEdit = (event) => {
    event.preventDefault();
    const payment = Number(editForm.payment || 0);
    if (editActivity.type === "travel") {
      const fare = Number(editForm.fare || 0);
      const discount = Number(editForm.discount || 0);
      setCustomerTravels(customerTravels.map((record) => Number(record.id) === Number(editActivity.recordId) ? {
        ...record, date: editForm.date, fare, discount, paidAmount: payment,
        remainingAmount: Math.max(fare - discount - payment, 0), note: editForm.description,
      } : record));
      const existing = transactions.find((item) => item.source === "customer-travel" && Number(item.referenceId) === Number(editActivity.recordId));
      if (payment > 0) {
        const nextTransaction = {
          id: existing?.id || Date.now(), type: "income", title: `پرداخت سفر ${editActivity.title}`, amount: payment,
          date: editForm.date, description: `پرداخت اولیه ${customer.firstName} ${customer.lastName}`,
          source: "customer-travel", referenceId: editActivity.recordId, customerIndex,
        };
        setTransactions(existing ? transactions.map((item) => item.id === existing.id ? nextTransaction : item) : [...transactions, nextTransaction]);
      } else if (existing) {
        setTransactions(transactions.filter((item) => item.id !== existing.id));
      }
    } else {
      if (payment <= 0) return notify("مقدار پرداخت باید بیشتر از صفر باشد.", "error");
      setCustomerPayments(customerPayments.map((item) => Number(item.id) === Number(editActivity.recordId) ? { ...item, date: editForm.date, amount: payment, description: editForm.description } : item));
      const existing = transactions.find((item) => item.source === "customer-payment" && Number(item.referenceId) === Number(editActivity.recordId));
      const nextTransaction = {
        id: existing?.id || Date.now(), type: "income", title: `پرداخت بدهی ${customer.firstName} ${customer.lastName}`,
        amount: payment, date: editForm.date, description: editForm.description, source: "customer-payment",
        referenceId: editActivity.recordId, customerIndex,
      };
      setTransactions(existing ? transactions.map((item) => item.id === existing.id ? nextTransaction : item) : [...transactions, nextTransaction]);
    }
    setEditActivity(null);
    notify("ریکارد ویرایش شد.");
  };

  const deleteActivity = (item) => {
    if (!window.confirm(`ریکارد ${item.type === "travel" ? "سفر" : item.type === "payment" ? "پرداخت" : "بیلانس"} حذف شود؟`)) return;
    if (item.type === "travel") {
      setCustomerTravels(customerTravels.filter((record) => Number(record.id) !== Number(item.recordId)));
      setTransactions(transactions.filter((transaction) => !(transaction.source === "customer-travel" && Number(transaction.referenceId) === Number(item.recordId))));
    } else if (item.type === "payment") {
      setCustomerPayments(customerPayments.filter((payment) => Number(payment.id) !== Number(item.recordId)));
      setTransactions(transactions.filter((transaction) => !(transaction.source === "customer-payment" && Number(transaction.referenceId) === Number(item.recordId))));
    } else {
      setCustomerBalances(customerBalances.filter((balance) => Number(balance.id) !== Number(item.recordId)));
    }
    notify("ریکارد حذف شد.");
  };

  return (
    <div className="customer-details-page">
      <div className="customer-details-header">
        <div>
          <h1>جزئیات مشتری</h1>
          <p>
            {customer.firstName} {customer.lastName} - {customer.phone} - {customer.gender || "جنسیت ثبت نشده"}
          </p>
        </div>

        <div className="customer-header-actions">
          {customerDebt === 0 && ourDebt === 0 && (
            <button className="customer-btn payment-btn" onClick={() => setShowBalanceModal(true)}>
              ثبت بیلانس
            </button>
          )}
          <button
            className="customer-btn payment-btn"
            onClick={() => setShowPaymentModal(true)}
            disabled={customerDebt <= 0}
          >
            پرداخت
          </button>
          <button className="customer-btn" onClick={() => { setSelectedDestination(""); setShowTravelModal(true); }}>
            + ثبت سفر
          </button>
          <button className="customer-btn" onClick={() => navigate("/customers")}>
            برگشت به مشتری‌ها
          </button>
        </div>
      </div>

      <div className="customer-stats">
        <div className="customer-stat-card">
          <span>قرضدار ما</span>
          <strong>{customerDebt}</strong>
          <p>باقی‌مانده مشتری</p>
        </div>

        <div className="customer-stat-card">
          <span>ما قرضدارش هستیم</span>
          <strong>{ourDebt}</strong>
          <p>پرداخت اضافه مشتری</p>
        </div>

        <div className="customer-stat-card">
          <span>پرداخت شده</span>
          <strong>{totalPaid}</strong>
          <p>کل پول پرداخت‌شده</p>
        </div>

        <div className="customer-stat-card">
          <span>کل سفرها</span>
          <strong>{records.length}</strong>
          <p>سفرهای ثبت‌شده مشتری</p>
        </div>
      </div>

      <div className="customer-table-card">
        <div className="customer-table-header">
          <div>
            <h3>سفرها و پرداخت‌های مشتری</h3>
            <p>تاریخچه تمام سفرها و پرداخت‌های ثبت‌شده برای این مشتری</p>
          </div>
          <div className="customer-record-filters">
            <input
              value={recordSearch}
              onChange={(event) => setRecordSearch(event.target.value)}
              placeholder="جستجو در سفرها و پرداخت‌ها..."
            />
            <select value={recordType} onChange={(event) => setRecordType(event.target.value)}>
              <option value="all">همه حالات</option>
              <option value="travel">تنها سفرها</option>
              <option value="payment">تنها پرداخت‌ها</option>
              <option value="balance">تنها بیلانس</option>
            </select>
          </div>
        </div>

        <div className="customer-table-wrap">
          <table className="customer-table">
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>نمبر چوکی</th>
                <th>حالت</th>
                <th>عنوان</th>
                <th>مسیر</th>
                <th>کرایه</th>
                <th>تخفیف</th>
                <th>پرداخت</th>
                <th>باقی‌مانده</th>
                <th>وضعیت</th>
                <th>توضیحات</th>
                <th>عملیات</th>
              </tr>
            </thead>

            <tbody>
              {activityPagination.pageItems.map((item) => (
                  <tr key={item.id}>
                    <td>{formatAfghanDate(item.date)}</td>
                    <td>{formatSeatNumbers(item)}</td>
                    <td>
                      <span className={`customer-type-badge ${item.type}`}>
                        {item.type === "travel" ? "سفر" : item.type === "payment" ? "پرداخت" : "بیلانس"}
                      </span>
                    </td>
                    <td>{item.title}</td>
                    <td>
                      {item.route}
                    </td>
                    <td>{item.fare ?? "-"}</td>
                    <td>{item.discount ?? "-"}</td>
                    <td className={item.payment > 0 ? "customer-money-paid" : ""}>
                      {item.payment || 0}
                    </td>
                    <td className={item.remaining > 0 ? "customer-money-remaining" : ""}>
                      {item.remaining ?? "-"}
                    </td>
                    <td>
                      <span className={item.type === "payment" ? "customer-badge active" : getStatusClass(item.status)}>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.description || "-"}</td>
                    <td>
                      <div className="customer-row-actions">
                        {item.type !== "balance" && <button title="چاپ" onClick={() => navigate(`/customers/${customerIndex}/print/${item.type}/${item.recordId}`)}><Printer size={15} /></button>}
                        {item.type !== "balance" && <button title="ویرایش" onClick={() => openEditActivity(item)}><Pencil size={15} /></button>}
                        <button title="حذف" className="danger" onClick={() => deleteActivity(item)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
              ))}

              {customerActivity.length === 0 && (
                <tr>
                  <td colSpan="12" style={{ textAlign: "center", padding: "25px" }}>
                    ریکاردی مطابق جستجو و فلتر پیدا نشد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination page={activityPagination.page} totalPages={activityPagination.totalPages} setPage={activityPagination.setPage} totalItems={customerActivity.length} pageSize={activityPagination.pageSize} />
      </div>

      {showTravelModal && (
        <div
          className="customer-modal-backdrop"
          onClick={() => setShowTravelModal(false)}
        >
          <div className="customer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="customer-modal-header">
              <div>
                <h3>ثبت سفر برای مشتری</h3>
                <p>ابتدا مقصد و سپس یک سفر در انتظار را انتخاب کنید</p>
              </div>

              <button
                className="customer-close-btn"
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
                      onClick={() => { setSelectedDestination(destination); setTravelSearch(""); setTravelForm(emptyTravelForm); }}
                    >
                      <strong>{destination}</strong>
                      <span>{travels.filter((travel) => travel.status === "در انتظار" && travel.to === destination).length} سفر در انتظار</span>
                    </button>
                  ))}
                  {waitingDestinationNames.length === 0 && <p>هیچ مقصد دارای سفر در انتظار نیست.</p>}
                </div>
              </div>

              <div className="customer-form-group customer-form-full">
                <label>قدم دوم: جستجوی سفر در انتظار {selectedDestination && `به ${selectedDestination}`}</label>
                <input
                  value={travelSearch}
                  onChange={(e) => setTravelSearch(e.target.value)}
                  placeholder="نام سفر، راننده، مبدأ یا مقصد..."
                />
              </div>

              <div className="customer-table-wrap modal-table">
                <table className="customer-table">
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
                            className="customer-save-btn small"
                            onClick={() => selectTravel(travel)}
                          >
                            انتخاب
                          </button>
                        </td>
                        <td>{travel.name}</td>
                        <td>{formatAfghanDate(travel.date)}</td>
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

              <div className="customer-form-grid">
                <div className="customer-form-group">
                  <label>نام سفر</label>
                  <input value={travelForm.travelName} readOnly />
                </div>

                <div className="customer-form-group">
                  <label>تاریخ</label>
                  <input value={formatAfghanDate(travelForm.date)} readOnly />
                </div>

                <div className="customer-form-group">
                  <label>حالت</label>
                  <select
                    name="mode"
                    value={travelForm.mode}
                    onChange={handleTravelFormChange}
                  >
                    <option value="شخصی">شخصی</option>
                    <option value="فامیلی">فامیلی</option>
                  </select>
                </div>

                {travelForm.mode === "فامیلی" && (
                  <div className="customer-form-group">
                    <label>تعداد فامیل</label>
                    <input
                      type="number"
                      min="1"
                      name="familyCount"
                      value={travelForm.familyCount}
                      onChange={handleTravelFormChange}
                      placeholder="مثلاً 4"
                    />
                  </div>
                )}

                <div className="customer-form-group customer-form-full">
                  <label>انتخاب چوکی</label>
                  <SeatSelector
                    availableSeats={availableSeatNumbers}
                    disabled={!selectedTravelRecord}
                    familyCount={travelForm.familyCount}
                    mode={travelForm.mode}
                    selectedSeats={travelForm.seatNos}
                    onChange={(seatNos) => setTravelForm({
                      ...travelForm,
                      seatNos,
                      seatNo: seatNos.join(","),
                    })}
                  />
                </div>

                <div className="customer-form-group">
                  <label>راننده</label>
                  <input value={travelForm.driver} readOnly />
                </div>

                <div className="customer-form-group">
                  <label>موتر</label>
                  <input value={travelForm.car} readOnly />
                </div>

                <div className="customer-form-group">
                  <label>مبدأ</label>
                  <input value={travelForm.from} readOnly />
                </div>

                <div className="customer-form-group">
                  <label>مقصد</label>
                  <input value={travelForm.to} readOnly />
                </div>

                <div className="customer-form-group">
                  <label>مقدار بار</label>
                  <input
                    type="number"
                    dir="ltr"
                    min="0"
                    name="baggageKg"
                    value={travelForm.baggageKg}
                    onChange={handleTravelFormChange}
                    placeholder="کیلو"
                  />
                </div>

                <div className="customer-form-group">
                  <label>پول بار</label>
                  <input dir="ltr" value={travelForm.baggageCharge || 0} readOnly />
                </div>

                <div className="customer-form-group">
                  <label>مجموع قیمت</label>
                  <input
                    type="number"
                    dir="ltr"
                    name="fare"
                    value={travelForm.fare}
                    onChange={handleTravelFormChange}
                    placeholder="مثلاً 300"
                  />
                </div>

                <div className="customer-form-group">
                  <label>تخفیف</label>
                  <input
                    type="number"
                    dir="ltr"
                    name="discount"
                    value={travelForm.discount}
                    onChange={handleTravelFormChange}
                  />
                </div>

                <div className="customer-form-group">
                  <label>مقدار پرداخت شده</label>
                  <input
                    type="number"
                    dir="ltr"
                    name="paidAmount"
                    value={travelForm.paidAmount}
                    onChange={handleTravelFormChange}
                  />
                </div>

                <div className="customer-form-group">
                  <label>باقی مانده</label>
                  <input dir="ltr" value={travelForm.remainingAmount} readOnly />
                </div>

                <div className="customer-form-group customer-form-full">
                  <label>توضیحات</label>
                  <textarea
                    name="note"
                    value={travelForm.note}
                    onChange={handleTravelFormChange}
                  />
                </div>
              </div>

              <div className="customer-modal-actions">
                <button
                  type="button"
                  className="customer-cancel-btn"
                  onClick={() => { setSelectedDestination(""); setShowTravelModal(false); }}
                >
                  لغو
                </button>

                <button type="submit" className="customer-save-btn">
                  ثبت سفر مشتری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="customer-modal-backdrop" onClick={() => setShowPaymentModal(false)}>
          <div className="customer-modal payment-modal" onClick={(event) => event.stopPropagation()}>
            <div className="customer-modal-header">
              <div>
                <h3>پرداخت بدهی مشتری</h3>
                <p>بدهی فعلی: {customerDebt} افغانی</p>
              </div>
              <button className="customer-close-btn" onClick={() => setShowPaymentModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={savePayment}>
              <div className="customer-form-grid">
                <div className="customer-form-group">
                  <label>تاریخ</label>
                  <AfghanDateInput value={paymentForm.date} onChange={(date) => setPaymentForm({ ...paymentForm, date })} required />
                </div>
                <div className="customer-form-group">
                  <label>مقدار پرداخت</label>
                  <input
                    type="number"
                    min="1"
                    max={customerDebt}
                    value={paymentForm.amount}
                    onChange={(event) => setPaymentForm({ ...paymentForm, amount: event.target.value })}
                    required
                  />
                </div>
                <div className="customer-form-group customer-form-full">
                  <label>توضیحات</label>
                  <textarea
                    value={paymentForm.description}
                    onChange={(event) => setPaymentForm({ ...paymentForm, description: event.target.value })}
                  />
                </div>
              </div>
              <div className="customer-modal-actions">
                <button type="button" className="customer-cancel-btn" onClick={() => setShowPaymentModal(false)}>
                  لغو
                </button>
                <button type="submit" className="customer-save-btn">ثبت پرداخت</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBalanceModal && (
        <div className="customer-modal-backdrop" onClick={() => setShowBalanceModal(false)}>
          <div className="customer-modal payment-modal" onClick={(event) => event.stopPropagation()}>
            <div className="customer-modal-header">
              <div>
                <h3>ثبت بیلانس مشتری</h3>
                <p>این بخش برای زمانی است که حساب مشتری صفر در صفر باشد.</p>
              </div>
              <button className="customer-close-btn" onClick={() => setShowBalanceModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={saveBalance}>
              <div className="customer-form-grid">
                <div className="customer-form-group">
                  <label>تاریخ</label>
                  <AfghanDateInput value={balanceForm.date} onChange={(date) => setBalanceForm({ ...balanceForm, date })} required />
                </div>
                <div className="customer-form-group">
                  <label>حالت بیلانس</label>
                  <select value={balanceForm.direction} onChange={(event) => setBalanceForm({ ...balanceForm, direction: event.target.value })}>
                    <option value="customer-owes-us">او قرضدار ما است</option>
                    <option value="we-owe-customer">ما قرضدار او استیم</option>
                  </select>
                </div>
                <div className="customer-form-group">
                  <label>مقدار</label>
                  <input
                    type="number"
                    min="1"
                    value={balanceForm.amount}
                    onChange={(event) => setBalanceForm({ ...balanceForm, amount: event.target.value })}
                    required
                  />
                </div>
                <div className="customer-form-group customer-form-full">
                  <label>توضیحات</label>
                  <textarea
                    value={balanceForm.description}
                    onChange={(event) => setBalanceForm({ ...balanceForm, description: event.target.value })}
                  />
                </div>
              </div>
              <div className="customer-modal-actions">
                <button type="button" className="customer-cancel-btn" onClick={() => setShowBalanceModal(false)}>
                  لغو
                </button>
                <button type="submit" className="customer-save-btn">ثبت بیلانس</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editActivity && (
        <div className="customer-modal-backdrop" onClick={() => setEditActivity(null)}>
          <div className="customer-modal payment-modal" onClick={(event) => event.stopPropagation()}>
            <div className="customer-modal-header"><div><h3>ویرایش {editActivity.type === "travel" ? "سفر مشتری" : "پرداخت"}</h3><p>تغییرات در بخش مالی نیز هماهنگ می‌شود.</p></div><button className="customer-close-btn" onClick={() => setEditActivity(null)}>×</button></div>
            <form onSubmit={saveActivityEdit}>
              <div className="customer-form-grid">
                <div className="customer-form-group"><label>تاریخ</label><AfghanDateInput value={editForm.date} onChange={(date) => setEditForm({ ...editForm, date })} required /></div>
                {editActivity.type === "travel" && <><div className="customer-form-group"><label>کرایه</label><input type="number" min="0" value={editForm.fare} onChange={(e) => setEditForm({ ...editForm, fare: e.target.value })} required /></div><div className="customer-form-group"><label>تخفیف</label><input type="number" min="0" value={editForm.discount} onChange={(e) => setEditForm({ ...editForm, discount: e.target.value })} /></div></>}
                <div className="customer-form-group"><label>پرداخت</label><input type="number" min="0" value={editForm.payment} onChange={(e) => setEditForm({ ...editForm, payment: e.target.value })} required /></div>
                <div className="customer-form-group customer-form-full"><label>توضیحات</label><textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
              </div>
              <div className="customer-modal-actions"><button type="button" className="customer-cancel-btn" onClick={() => setEditActivity(null)}>لغو</button><button type="submit" className="customer-save-btn">ذخیره تغییرات</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerDetails;
