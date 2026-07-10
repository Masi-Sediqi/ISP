import { ArrowRight, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { formatAfghanDate } from "../utils/afghanDate";
import { useNavigate, useParams } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { formatSeatNumbers } from "../utils/seatManagement";
import "./CustomerReceipt.css";

const money = (value) => Number(value || 0).toLocaleString("en-US");

function CustomerReceipt() {
  const { id, type, recordId } = useParams();
  const navigate = useNavigate();
  const customerIndex = Number(id);
  const [settings] = useJsonCollection("settings");
  const [customers] = useJsonCollection("customers");
  const [customerTravels] = useJsonCollection("customerTravels");
  const [customerPayments] = useJsonCollection("customerPayments");
  const company = settings[0] || {};
  const customer = customers[customerIndex];
  const record = type === "travel"
    ? customerTravels.find((item) => Number(item.id) === Number(recordId))
    : customerPayments.find((item) => Number(item.id) === Number(recordId));

  if (!customer || !record) return <div className="receipt-page"><div className="receipt-sheet"><h2>ریکارد چاپ پیدا نشد</h2><button onClick={() => navigate(`/customers/${customerIndex}`)}>برگشت</button></div></div>;

  const fare = Number(record.fare || 0);
  const discount = Number(record.discount || 0);
  const paid = Number(type === "travel" ? record.paidAmount : record.amount || 0);
  const remaining = type === "travel" ? Math.max(fare - discount - paid, 0) : null;
  const receiptUrl = window.location.href;

  return <div className="receipt-page">
    <div className="receipt-toolbar"><button onClick={() => navigate(`/customers/${customerIndex}`)}><ArrowRight size={16} /> برگشت</button><button className="receipt-print-btn" onClick={() => window.print()}><Printer size={16} /> چاپ ورق</button></div>
    <article className="receipt-sheet">
      <header className="receipt-header">
        <div className="receipt-company">
          <div className="receipt-company-logo">{company.logo ? <img src={company.logo} alt="لوگو" /> : (company.companyName || "T").slice(0,1)}</div>
          <div><h1>{company.companyName || "شرکت سیاحتی"}</h1><p>سیستم مدیریت سفر و حمل و نقل</p></div>
        </div>
        <div className="receipt-reference">
          <div className="receipt-qr">
            <QRCodeSVG
              value={receiptUrl}
              size={82}
              level="M"
              marginSize={1}
              title="لینک مستقیم سند"
            />
            <small>برای بازکردن سند اسکن کنید</small>
          </div>
          <div className="receipt-number"><span>نمبر تکت</span><strong>{record.ticketNo || record.id}</strong><small>تاریخ صدور: {formatAfghanDate(record.date)}</small></div>
        </div>
      </header>

      <div className="receipt-title">
        <span>{type === "travel" ? "سند ثبت سفر مشتری" : "رسید پرداخت مشتری"}</span>
        <h2>{type === "travel" ? record.travelName : "پرداخت بدهی مشتری"}</h2>
      </div>

      <section className="receipt-section">
        <h3>مشخصات مشتری</h3>
        <table className="receipt-info-table">
          <tbody>
            <tr><th>نام کامل</th><td>{customer.firstName} {customer.lastName}</td><th>شماره تماس</th><td>{customer.phone || "-"}</td></tr>
            <tr><th>نمبر تذکره</th><td>{customer.tazkiraNo || "-"}</td><th>جنسیت</th><td>{customer.gender || "-"}</td></tr>
          </tbody>
        </table>
      </section>

      {type === "travel" && <section className="receipt-section">
        <h3>مشخصات سفر</h3>
        <table className="receipt-info-table">
          <tbody>
            <tr><th>نام سفر</th><td>{record.travelName || "-"}</td><th>مسیر</th><td>{record.from || "-"} تا {record.to || "-"}</td></tr>
            <tr><th>راننده</th><td>{record.driver || "-"}</td><th>موتر</th><td>{record.car || "-"}</td></tr>
            <tr><th>نمبر چوکی</th><td>{formatSeatNumbers(record)}</td><th>تاریخ سفر</th><td>{formatAfghanDate(record.date)}</td></tr>
            <tr><th>حالت</th><td>{record.mode || "شخصی"}</td><th>تعداد فامیل</th><td>{record.mode === "فامیلی" ? (record.familyCount || "-") : "-"}</td></tr>
            <tr><th>مدت سفر</th><td>{record.duration || "-"}</td><th>تاریخ سند</th><td>{formatAfghanDate(record.date)}</td></tr>
          </tbody>
        </table>
      </section>}

      <section className="receipt-section">
        <h3>خلاصه مالی</h3>
        <table className="receipt-finance-table">
          <thead><tr>{type === "travel" && <><th>مجموع قیمت</th><th>تخفیف</th></>}<th>پرداخت‌شده</th>{type === "travel" && <th>باقی‌مانده</th>}</tr></thead>
          <tbody><tr>{type === "travel" && <><td>{money(fare)} افغانی</td><td>{money(discount)} افغانی</td></>}<td className="receipt-paid">{money(paid)} افغانی</td>{type === "travel" && <td className="receipt-remaining">{money(remaining)} افغانی</td>}</tr></tbody>
        </table>
      </section>

      <section className="receipt-section">
        <h3>توضیحات</h3>
        <table className="receipt-info-table receipt-note-table"><tbody><tr><th>شرح</th><td colSpan="3">{record.note || record.description || "بدون توضیحات"}</td></tr></tbody></table>
      </section>

      <footer className="receipt-footer">
        <div><span>امضای مشتری</span></div>
        <p>این سند توسط سیستم {company.companyName || "شرکت سیاحتی"} ایجاد شده است.</p>
        <div><span>امضای مسئول</span></div>
      </footer>
    </article>
  </div>;
}

export default CustomerReceipt;
