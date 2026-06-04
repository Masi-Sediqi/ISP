import { Link } from "react-router-dom";
import "./Reports.css";

const reportLinks = [
  { to: "/reports/travels", title: "راپور سفرها", description: "نقشه مسیرها، تعداد سفر و مجموع کیلومتر هر مقصد" },
  { to: "/finance", title: "راپور عواید و مصارف", description: "مشاهده جریان پول، سود و ضرر خالص" },
  { to: "/customers", title: "راپور مشتری‌ها", description: "مشاهده مشتری‌ها، بدهی‌ها و پرداخت‌ها" },
  { to: "/cars", title: "راپور موترها", description: "مشاهده وضعیت، سفرها و ترمیم‌های موترها" },
];

function Reports() {
  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>گزارش‌دهی</h1>
        <p>گزارش بخش‌های مختلف سیستم حمل و نقل</p>
      </div>
      <div className="reports-grid">
        {reportLinks.map((report) => (
          <Link key={report.to} to={report.to} className="report-link-card">
            <h3>{report.title}</h3>
            <p>{report.description}</p>
            <span>مشاهده راپور ←</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Reports;
