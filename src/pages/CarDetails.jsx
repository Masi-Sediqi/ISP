import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import TablePagination from "../components/TablePagination";
import { useTablePagination } from "../hooks/useTablePagination";
import "./RecordDetails.css";

const today = () => new Date().toISOString().slice(0, 10);
const money = (value) => Number(value || 0).toLocaleString("en-US");

function CarDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const carId = Number(id);
  const [cars, setCars] = useJsonCollection("cars");
  const [travels] = useJsonCollection("travels");
  const [repairs, setRepairs] = useJsonCollection("carRepairs");
  const [transactions, setTransactions] = useJsonCollection("transactions");
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [search, setSearch] = useState("");
  const [recordType, setRecordType] = useState("all");
  const [repairForm, setRepairForm] = useState({
    date: today(),
    title: "",
    takenBy: "",
    repairerAddress: "",
    amount: "",
    description: "",
  });

  const car = cars.find((item) => Number(item.id) === carId);

  const carTravels = travels
    .map((travel, index) => ({ ...travel, originalIndex: index }))
    .filter((travel) => travel.car === car?.plate);
  const carRepairs = repairs.filter(
    (repair) => Number(repair.carId) === carId || repair.carPlate === car?.plate
  );
  const totalRepairCost = carRepairs.reduce((sum, repair) => sum + Number(repair.amount || 0), 0);

  const records = [
    ...carTravels.map((travel) => ({
      id: `travel-${travel.originalIndex}`,
      type: "travel",
      date: travel.date,
      title: travel.name,
      detail: `${travel.from || "-"} - ${travel.to || "-"}`,
      person: travel.driver,
      amount: Number(travel.fare || 0),
      status: travel.status,
      description: travel.note,
      travelIndex: travel.originalIndex,
    })),
    ...carRepairs.map((repair) => ({
      id: `repair-${repair.id}`,
      type: "repair",
      date: repair.date,
      title: repair.title || "ترمیم موتر",
      detail: repair.repairerAddress,
      person: repair.takenBy,
      amount: Number(repair.amount || 0),
      status: "ترمیم",
      description: repair.description,
    })),
  ]
    .filter((record) => recordType === "all" || record.type === recordType)
    .filter((record) =>
      (record.title || "").includes(search) ||
      (record.detail || "").includes(search) ||
      (record.person || "").includes(search) ||
      (record.date || "").includes(search)
    )
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const recordsPagination = useTablePagination(records, `${search}-${recordType}`);

  if (!car) {
    return (
      <div className="record-details-page">
        <div className="record-card record-empty">
          <h3>موتر پیدا نشد</h3>
          <button className="record-btn" onClick={() => navigate("/cars")}>برگشت</button>
        </div>
      </div>
    );
  }

  const saveRepair = (event) => {
    event.preventDefault();
    const amount = Number(repairForm.amount || 0);
    const repairId = Date.now();
    const repair = {
      id: repairId,
      carId,
      carPlate: car.plate,
      ...repairForm,
      amount,
      source: "manual",
    };

    setRepairs([...repairs, repair]);
    setTransactions([
      ...transactions,
      {
        id: repairId + 1,
        type: "expense",
        title: `ترمیم موتر ${car.plate}: ${repairForm.title}`,
        amount,
        date: repairForm.date,
        description: repairForm.description,
        source: "car-repair",
        referenceId: repairId,
        carId,
      },
    ]);
    setCars(cars.map((item) => Number(item.id) === carId ? { ...item, status: "در ترمیم" } : item));
    setRepairForm({
      date: today(),
      title: "",
      takenBy: "",
      repairerAddress: "",
      amount: "",
      description: "",
    });
    setShowRepairModal(false);
    notify("ترمیم موتر ثبت شد.");
  };

  return (
    <div className="record-details-page">
      <div className="record-header">
        <div>
          <h1>جزئیات موتر</h1>
          <p>{car.plate} - {car.type} {car.model}</p>
        </div>
        <div className="record-actions">
          <button className="record-btn repair-action" onClick={() => setShowRepairModal(true)}>
            + ترمیم موتر
          </button>
          <button className="record-btn" onClick={() => navigate("/cars")}>برگشت به موترها</button>
        </div>
      </div>

      <div className="record-stats">
        <div className="record-stat"><span>کل سفرها</span><strong>{carTravels.length}</strong><p>سفرهای استفاده‌شده</p></div>
        <div className="record-stat"><span>کل ترمیم‌ها</span><strong>{carRepairs.length}</strong><p>ریکاردهای ترمیم</p></div>
        <div className="record-stat expense"><span>مصرف ترمیم</span><strong>{money(totalRepairCost)}</strong><p>افغانی</p></div>
        <div className="record-stat"><span>وضعیت موتر</span><strong className="record-status-text">{car.status}</strong><p>نمبر شاسی: {car.chassisNo || car.phone || "-"}</p></div>
      </div>

      <div className="record-card">
        <div className="record-card-header">
          <div><h3>تاریخچه سفرها و ترمیم‌ها</h3><p>تمام استفاده‌ها و ترمیم‌های این موتر زیر به زیر</p></div>
          <div className="record-filters">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجو در تاریخچه..." />
            <select value={recordType} onChange={(event) => setRecordType(event.target.value)}>
              <option value="all">همه حالات</option>
              <option value="travel">تنها سفرها</option>
              <option value="repair">تنها ترمیم‌ها</option>
            </select>
          </div>
        </div>
        <div className="record-table-wrap">
          <table>
            <thead><tr><th>تاریخ</th><th>حالت</th><th>عنوان</th><th>مسیر / آدرس ترمیم‌کار</th><th>راننده / انتقال‌دهنده</th><th>مقدار</th><th>وضعیت</th><th>توضیحات</th></tr></thead>
            <tbody>
              {recordsPagination.pageItems.map((record) => (
                <tr key={record.id} onDoubleClick={() => record.travelIndex !== undefined && navigate(`/travels/${record.travelIndex}`)}>
                  <td>{record.date || "-"}</td>
                  <td><span className={`record-type ${record.type}`}>{record.type === "travel" ? "سفر" : "ترمیم"}</span></td>
                  <td>{record.title}</td><td>{record.detail || "-"}</td><td>{record.person || "-"}</td>
                  <td className={record.type === "repair" ? "record-expense" : ""}>{money(record.amount)}</td>
                  <td>{record.status || "-"}</td><td>{record.description || "-"}</td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan="8" className="record-empty">ریکاردی پیدا نشد</td></tr>}
            </tbody>
          </table>
        </div>
        <TablePagination page={recordsPagination.page} totalPages={recordsPagination.totalPages} setPage={recordsPagination.setPage} totalItems={records.length} pageSize={recordsPagination.pageSize} />
      </div>

      {showRepairModal && (
        <div className="record-modal-backdrop" onClick={() => setShowRepairModal(false)}>
          <div className="record-modal" onClick={(event) => event.stopPropagation()}>
            <div className="record-modal-header"><div><h3>ثبت ترمیم موتر</h3><p>معلومات استاندارد ترمیم را وارد کنید</p></div><button onClick={() => setShowRepairModal(false)}>×</button></div>
            <form onSubmit={saveRepair}>
              <div className="record-form-grid">
                <div className="record-form-group"><label>تاریخ ترمیم</label><input type="date" value={repairForm.date} onChange={(e) => setRepairForm({ ...repairForm, date: e.target.value })} required /></div>
                <div className="record-form-group"><label>نوع / عنوان ترمیم</label><input value={repairForm.title} onChange={(e) => setRepairForm({ ...repairForm, title: e.target.value })} required /></div>
                <div className="record-form-group"><label>کی موتر را به ترمیم برده</label><input value={repairForm.takenBy} onChange={(e) => setRepairForm({ ...repairForm, takenBy: e.target.value })} required /></div>
                <div className="record-form-group"><label>آدرس ترمیم‌کار</label><input value={repairForm.repairerAddress} onChange={(e) => setRepairForm({ ...repairForm, repairerAddress: e.target.value })} required /></div>
                <div className="record-form-group"><label>مقدار مصرف</label><input type="number" min="0" value={repairForm.amount} onChange={(e) => setRepairForm({ ...repairForm, amount: e.target.value })} required /></div>
                <div className="record-form-group record-form-full"><label>توضیحات</label><textarea value={repairForm.description} onChange={(e) => setRepairForm({ ...repairForm, description: e.target.value })} /></div>
              </div>
              <div className="record-modal-actions"><button type="button" className="record-cancel" onClick={() => setShowRepairModal(false)}>لغو</button><button type="submit" className="record-save">ثبت ترمیم</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CarDetails;
