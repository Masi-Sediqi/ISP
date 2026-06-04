import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import TablePagination from "../components/TablePagination";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { useTablePagination } from "../hooks/useTablePagination";
import { notify } from "../utils/notify";
import "./DestinationDetails.css";
import "./Travels.css";

const today = () => new Date().toISOString().slice(0, 10);
const money = (value) => Number(value || 0).toLocaleString("en-US");

function DestinationDetails() {
  const { name } = useParams();
  const destinationName = decodeURIComponent(name);
  const navigate = useNavigate();
  const [travels, setTravels] = useJsonCollection("travels");
  const [destinations] = useJsonCollection("destinations");
  const [cars] = useJsonCollection("cars");
  const [drivers] = useJsonCollection("drivers");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const destination = destinations.find((item) => item.name === destinationName);
  const [form, setForm] = useState({
    name: `سفر به ${destinationName}`,
    date: today(),
    driver: "",
    car: "",
    from: "",
    to: destinationName,
    kilometers: destination?.kilometers || "",
    duration: "",
    passengers: "",
    fare: "",
    status: "در انتظار",
    note: "",
  });

  const destinationTravels = travels
    .map((travel, originalIndex) => ({ ...travel, originalIndex }))
    .filter((travel) => travel.to === destinationName)
    .filter((travel) =>
      (travel.name || "").includes(search) ||
      (travel.date || "").includes(search) ||
      (travel.driver || "").includes(search) ||
      (travel.car || "").includes(search) ||
      (travel.status || "").includes(search)
    )
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  const chartData = useMemo(() => {
    const byDate = new Map();
    travels.filter((travel) => travel.to === destinationName).forEach((travel) => {
      const current = byDate.get(travel.date) || { date: travel.date || "-", trips: 0, fare: 0 };
      current.trips += 1;
      current.fare += Number(travel.fare || 0);
      byDate.set(travel.date, current);
    });
    return [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [destinationName, travels]);

  const { page, setPage, totalPages, pageItems, pageSize } = useTablePagination(destinationTravels, search);
  const allDestinationTravels = travels.filter((travel) => travel.to === destinationName);
  const completed = allDestinationTravels.filter((travel) => travel.status === "تکمیل شده").length;
  const waiting = allDestinationTravels.filter((travel) => travel.status === "در انتظار").length;
  const totalFare = allDestinationTravels.reduce((sum, travel) => sum + Number(travel.fare || 0), 0);

  const saveTravel = (event) => {
    event.preventDefault();
    setTravels([...travels, form]);
    setShowModal(false);
    notify("سفر جدید برای این مقصد ثبت شد.");
  };

  if (!destination && !travels.some((travel) => travel.to === destinationName)) {
    return <div className="destination-details-page"><div className="destination-empty-card"><h3>مقصد پیدا نشد</h3><button onClick={() => navigate("/travels")}>برگشت</button></div></div>;
  }

  return (
    <div className="destination-details-page">
      <div className="destination-details-header">
        <div>
          <h1>جزئیات مقصد {destinationName}</h1>
          <p>{destination?.description || "تمام سفرها، تاریخ‌ها و تحلیل این مقصد"}</p>
        </div>
        <div>
          <button className="destination-primary" onClick={() => setShowModal(true)}>+ ثبت سفر</button>
          <button className="destination-secondary" onClick={() => navigate("/travels")}>برگشت</button>
        </div>
      </div>

      <div className="destination-detail-stats">
        <div><span>کل سفرها</span><strong>{allDestinationTravels.length}</strong><p>تمام ریکاردهای مقصد</p></div>
        <div><span>در انتظار</span><strong>{waiting}</strong><p>سفر آماده ثبت مشتری</p></div>
        <div><span>تکمیل‌شده</span><strong>{completed}</strong><p>سفر انجام‌شده</p></div>
        <div><span>مجموع کرایه‌ها</span><strong>{money(totalFare)}</strong><p>افغانی</p></div>
      </div>

      <div className="destination-charts">
        <div className="destination-chart-card">
          <div><h3>تعداد سفرها بر اساس تاریخ</h3><p>در هر تاریخ چند سفر به این مقصد ثبت شده است</p></div>
          <div className="destination-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}><CartesianGrid strokeDasharray="4 4" vertical={false} /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="trips" name="تعداد سفر" fill="#2563eb" radius={[8, 8, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="destination-chart-card">
          <div><h3>کرایه سفرها بر اساس تاریخ</h3><p>مجموع کرایه ثبت‌شده در هر تاریخ</p></div>
          <div className="destination-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}><CartesianGrid strokeDasharray="4 4" vertical={false} /><XAxis dataKey="date" /><YAxis /><Tooltip formatter={(value) => money(value)} /><Line type="monotone" dataKey="fare" name="کرایه" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} /></LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="destination-records">
        <div className="destination-records-header">
          <div><h3>ریکارد تمام سفرها</h3><p>جزئیات سفرهای ثبت‌شده برای {destinationName}</p></div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جستجوی سفر، تاریخ، راننده..." />
        </div>
        <div className="destination-records-wrap">
          <table>
            <thead><tr><th>تاریخ</th><th>نام سفر</th><th>راننده</th><th>موتر</th><th>مسیر</th><th>کرایه</th><th>وضعیت</th><th>عملیات</th></tr></thead>
            <tbody>
              {pageItems.map((travel) => <tr key={travel.originalIndex}><td>{travel.date || "-"}</td><td>{travel.name || "-"}</td><td>{travel.driver || "-"}</td><td>{travel.car || "-"}</td><td>{travel.from || "-"} - {travel.to}</td><td>{money(travel.fare)}</td><td>{travel.status}</td><td><button className="destination-detail-link" onClick={() => navigate(`/travels/${travel.originalIndex}`)}>جزئیات</button></td></tr>)}
              {!pageItems.length && <tr><td colSpan="8" className="destination-record-empty">ریکاردی پیدا نشد</td></tr>}
            </tbody>
          </table>
        </div>
        <TablePagination page={page} totalPages={totalPages} setPage={setPage} totalItems={destinationTravels.length} pageSize={pageSize} />
      </div>

      {showModal && <div className="travel-modal-backdrop" onClick={() => setShowModal(false)}><div className="travel-modal" onClick={(event) => event.stopPropagation()}>
        <div className="travel-modal-header"><div><h3>ثبت سفر برای {destinationName}</h3><p>معلومات سفر جدید را وارد کنید</p></div><button className="travel-close-btn" onClick={() => setShowModal(false)}>×</button></div>
        <form onSubmit={saveTravel}><div className="travel-form-grid">
          <div className="form-group"><label>نام سفر</label><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
          <div className="form-group"><label>تاریخ</label><input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></div>
          <div className="form-group"><label>راننده</label><select value={form.driver} onChange={(event) => setForm({ ...form, driver: event.target.value })} required><option value="">انتخاب راننده</option>{drivers.map((driver, index) => <option key={index} value={`${driver.firstName} ${driver.lastName}`.trim()}>{driver.firstName} {driver.lastName}</option>)}</select></div>
          <div className="form-group"><label>موتر</label><select value={form.car} onChange={(event) => setForm({ ...form, car: event.target.value })} required><option value="">انتخاب موتر</option>{cars.map((car) => <option key={car.id} value={car.plate}>{car.plate} - {car.type}</option>)}</select></div>
          <div className="form-group"><label>مبدأ</label><input value={form.from} onChange={(event) => setForm({ ...form, from: event.target.value })} required /></div>
          <div className="form-group"><label>مقصد</label><input value={form.to} readOnly /></div>
          <div className="form-group"><label>کیلومتر</label><input type="number" min="0" value={form.kilometers} onChange={(event) => setForm({ ...form, kilometers: event.target.value })} /></div>
          <div className="form-group"><label>کرایه</label><input type="number" min="0" value={form.fare} onChange={(event) => setForm({ ...form, fare: event.target.value })} required /></div>
          <div className="form-group"><label>وضعیت</label><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>در انتظار</option><option>در جریان</option><option>تکمیل شده</option></select></div>
          <div className="form-group form-full"><label>توضیحات</label><textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} /></div>
        </div><div className="travel-modal-actions"><button type="button" className="travel-cancel-btn" onClick={() => setShowModal(false)}>لغو</button><button type="submit" className="travel-save-btn">ثبت سفر</button></div></form>
      </div></div>}
    </div>
  );
}

export default DestinationDetails;
