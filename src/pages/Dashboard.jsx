import "../App.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function Dashboard() {
  const trips = [
    ["TR-001", "کابل - هرات", "احمد شاه", "در جریان", "18,000"],
    ["TR-002", "هرات - کابل", "محمود خان", "تکمیل", "22,000"],
    ["TR-003", "مزار - کندز", "فرید احمد", "در انتظار", "9,000"],
    ["TR-004", "کابل - جلال آباد", "ذبیح الله", "تکمیل", "15,000"],
  ];
  const monthlyTrips = [
    { month: "حمل", trips: 38 },
    { month: "ثور", trips: 52 },
    { month: "جوزا", trips: 41 },
    { month: "سرطان", trips: 60 },
    { month: "اسد", trips: 48 },
    { month: "سنبله", trips: 66 },
  ];


  return (
    <div className="app" dir="rtl">


      <main className="main">


        <section className="stats">
          <div className="stat">
            <span>کل سفرها</span>
            <h2>128</h2>
            <p>+12 سفر در این ماه</p>
          </div>
          <div className="stat">
            <span>موترهای فعال</span>
            <h2>24</h2>
            <p>18 فعال، 6 غیرفعال</p>
          </div>
          <div className="stat">
            <span>عواید ماهانه</span>
            <h2>125,000</h2>
            <p>افغانی</p>
          </div>
          <div className="stat">
            <span>مصارف ماهانه</span>
            <h2>43,500</h2>
            <p>تیل و ترمیمات</p>
          </div>
        </section>

        <section className="charts-grid">
          <div className="card large">
            <div className="card-title">
              <h3>تحلیل سفرهای 6 ماه اخیر</h3>
              <span>ماهانه</span>
            </div>

            <div className="real-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrips}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      color: "#fff",
                      borderRadius: "10px",
                    }}
                    labelStyle={{
                      color: "#fff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="trips"
                    stroke="#5b3df5"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <h3>وضعیت سفرها</h3>
            </div>

            <div className="donut">
              <div className="donut-circle">
                <h2>128</h2>
                <p>سفر</p>
              </div>
            </div>

            <div className="legend">
              <span><b className="green"></b>تکمیل شده</span>
              <span><b className="blue"></b>در جریان</span>
              <span><b className="yellow"></b>در انتظار</span>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <h3>عواید مسیرها</h3>
            </div>

            <div className="bar-chart">
              <div><span style={{ height: "75%" }}></span><p>کابل</p></div>
              <div><span style={{ height: "55%" }}></span><p>هرات</p></div>
              <div><span style={{ height: "40%" }}></span><p>مزار</p></div>
              <div><span style={{ height: "65%" }}></span><p>کندز</p></div>
              <div><span style={{ height: "35%" }}></span><p>غزنی</p></div>
            </div>
          </div>
        </section>

        <section className="bottom-grid">
          <div className="card table-card">
            <div className="card-title">
              <h3>سفرهای اخیر</h3>
              <button>مشاهده همه</button>
            </div>

            <table>
              <thead>
                <tr>
                  <th>شماره</th>
                  <th>مسیر</th>
                  <th>راننده</th>
                  <th>وضعیت</th>
                  <th>کرایه</th>
                </tr>
              </thead>

              <tbody>
                {trips.map((trip) => (
                  <tr key={trip[0]}>
                    <td>{trip[0]}</td>
                    <td>{trip[1]}</td>
                    <td>{trip[2]}</td>
                    <td>
                      <span className={
                        trip[3] === "تکمیل" ? "badge success" :
                          trip[3] === "در انتظار" ? "badge warning" :
                            "badge info"
                      }>
                        {trip[3]}
                      </span>
                    </td>
                    <td>{trip[4]} افغانی</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-title">
              <h3>خلاصه امروز</h3>
            </div>

            <div className="summary">
              <div><span>سفرهای امروز</span><b>7</b></div>
              <div><span>عواید امروز</span><b>42,000</b></div>
              <div><span>مصارف تیل</span><b>8,500</b></div>
              <div><span>موترهای خراب</span><b>3</b></div>
              <div className="profit"><span>سود تخمینی</span><b>30,300</b></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
