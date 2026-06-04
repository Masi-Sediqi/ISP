import { Link } from "react-router-dom";
import "./Reports.css";

const reportLinks = [
  { to: "/reports/travels", title: "راپور سفرها", description: "نقشه مسیرها، تعداد سفر و مجموع کیلومتر هر مقصد" },
  { to: "/reports/finance", title: "راپور عواید و مصارف", description: "تحلیل جریان نقدی، بودجه، رشد عاید، سفرها، موترها، مشتری‌ها و مسیرها" },
  { to: "/reports/customers", title: "راپور مشتری‌ها", description: "تحلیل سفرها، پرداخت‌ها، بدهی‌ها، تخفیف‌ها و ارزش مالی مشتری‌ها" },
  { to: "/reports/cars", title: "راپور موترها", description: "تحلیل وضعیت، سفر، کیلومتر، عاید، مصرف، سود، تیل و ترمیم موترها" },
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
