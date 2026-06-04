import { Link } from "react-router-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useJsonCollection } from "../hooks/useJsonCollection";
import "../App.css";

const money = (value) => Number(value || 0).toLocaleString("en-US");
const today = () => new Date().toISOString().slice(0, 10);

function Dashboard() {
  const [travels] = useJsonCollection("travels");
  const [cars] = useJsonCollection("cars");
  const [transactions] = useJsonCollection("transactions");
  const [customerTravels] = useJsonCollection("customerTravels");
  const [travelExpenses] = useJsonCollection("travelExpenses");

  const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expense = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const activeCars = cars.filter((car) => car.status === "فعال").length;
  const repairCars = cars.filter((car) => car.status === "در ترمیم").length;
  const completed = travels.filter((travel) => travel.status === "تکمیل شده").length;
  const active = travels.filter((travel) => travel.status === "در جریان").length;
  const pending = travels.filter((travel) => travel.status === "در انتظار").length;
  const totalTrips = Math.max(travels.length, 1);
  const completedPercent = (completed / totalTrips) * 100;
  const activePercent = (active / totalTrips) * 100;

  const monthKeys = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
  const monthlyTrips = monthKeys.map((month) => ({
    month,
    trips: travels.filter((travel) => String(travel.date || "").startsWith(month)).length,
  }));

  const routeIncomeMap = new Map();
  customerTravels.forEach((record) => {
    const route = record.to || "نامعلوم";
    routeIncomeMap.set(route, (routeIncomeMap.get(route) || 0) + Number(record.paidAmount || 0));
  });
  const routeIncome = [...routeIncomeMap.entries()].map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount).slice(0, 5);
  const maxRouteIncome = Math.max(...routeIncome.map((item) => item.amount), 1);
  const recentTravels = travels.map((travel, originalIndex) => ({ ...travel, originalIndex })).sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 6);
  const todayTravels = travels.filter((travel) => travel.date === today()).length;
  const todayIncome = transactions.filter((item) => item.type === "income" && item.date === today()).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const todayExpense = transactions.filter((item) => item.type === "expense" && item.date === today()).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const todayFuel = travelExpenses.filter((item) => item.category === "fuel" && item.date === today()).reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="dashboard-page">
      <section className="stats">
        <div className="stat"><span>کل سفرها</span><h2>{travels.length}</h2><p>{active} در جریان و {pending} در انتظار</p></div>
        <div className="stat"><span>موترهای فعال</span><h2>{activeCars}</h2><p>{repairCars} موتر در ترمیم</p></div>
        <div className="stat"><span>مجموع عواید</span><h2>{money(income)}</h2><p>افغانی دریافت‌شده</p></div>
        <div className="stat"><span>سود خالص</span><h2>{money(income - expense)}</h2><p>{money(expense)} افغانی مصرف</p></div>
      </section>

      <section className="charts-grid">
        <div className="card large">
          <div className="card-title"><h3>تحلیل سفرهای شش ماه اخیر</h3><span>داینامیک</span></div>
          <div className="real-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyTrips}><CartesianGrid strokeDasharray="4 4" vertical={false} /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="trips" name="سفر" stroke="#5b3df5" strokeWidth={3} dot={{ r: 5 }} /></LineChart></ResponsiveContainer></div>
        </div>
        <div className="card">
          <div className="card-title"><h3>وضعیت سفرها</h3></div>
          <div className="donut"><div className="donut-circle" style={{ background: `conic-gradient(#22c55e 0 ${completedPercent}%, #3b82f6 ${completedPercent}% ${completedPercent + activePercent}%, #f59e0b ${completedPercent + activePercent}% 100%)` }}><h2>{travels.length}</h2><p>سفر</p></div></div>
          <div className="legend"><span><b className="green"></b>تکمیل شده: {completed}</span><span><b className="blue"></b>در جریان: {active}</span><span><b className="yellow"></b>در انتظار: {pending}</span></div>
        </div>
        <div className="card">
          <div className="card-title"><h3>عواید مسیرها</h3></div>
          <div className="bar-chart">{routeIncome.map((item) => <div key={item.name}><span style={{ height: `${Math.max((item.amount / maxRouteIncome) * 100, 6)}%` }}></span><p>{item.name}</p><small>{money(item.amount)}</small></div>)}{!routeIncome.length && <p className="dashboard-empty">هنوز عاید مسیر ثبت نشده است.</p>}</div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="card table-card">
          <div className="card-title"><h3>سفرهای اخیر</h3><Link to="/travels">مشاهده همه</Link></div>
          <div className="dashboard-table-wrap"><table><thead><tr><th>تاریخ</th><th>مسیر</th><th>راننده</th><th>وضعیت</th><th>کرایه</th></tr></thead><tbody>{recentTravels.map((travel) => <tr key={travel.originalIndex}><td>{travel.date || "-"}</td><td>{travel.from || "-"} - {travel.to || "-"}</td><td>{travel.driver || "-"}</td><td><span className={travel.status === "تکمیل شده" ? "badge success" : travel.status === "در انتظار" ? "badge warning" : "badge info"}>{travel.status}</span></td><td>{money(travel.fare)} افغانی</td></tr>)}{!recentTravels.length && <tr><td colSpan="5" className="dashboard-empty">هنوز سفری ثبت نشده است.</td></tr>}</tbody></table></div>
        </div>
        <div className="card">
          <div className="card-title"><h3>خلاصه امروز</h3></div>
          <div className="summary"><div><span>سفرهای امروز</span><b>{todayTravels}</b></div><div><span>عواید امروز</span><b>{money(todayIncome)}</b></div><div><span>مصارف امروز</span><b>{money(todayExpense)}</b></div><div><span>مصارف تیل</span><b>{money(todayFuel)}</b></div><div className="profit"><span>سود امروز</span><b>{money(todayIncome - todayExpense)}</b></div></div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
