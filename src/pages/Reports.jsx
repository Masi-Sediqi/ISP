import { useNavigate } from "react-router-dom";
import {
  Building2,
  ChevronRight,
  FolderKanban,
  Landmark,
  Truck,
  UserRoundCheck,
  Users,
} from "lucide-react";
import "./Reports.css";

const reportCards = [
  {
    key: "customers",
    title: "Customers",
    description: "All customers from every department",
    icon: Users,
    available: true,
  },
  {
    key: "projects",
    title: "Projects",
    description: "Sold projects, customers and payments",
    icon: FolderKanban,
    available: true,
  },
  {
    key: "employees",
    title: "Employee",
    description: "Employee records and departments",
    icon: UserRoundCheck,
    available: true,
  },
  {
    key: "suppliers",
    title: "Suppliers",
    description: "Suppliers, purchases and balances",
    icon: Truck,
    available: true,
  },
  {
    key: "reception",
    title: "Reception",
    description: "Reception registrations and referrals",
    icon: Building2,
    available: true,
  },
  {
    key: "financial",
    title: "Financial",
    description: "Income, expenses and balances",
    icon: Landmark,
    available: true,
  },
];

export default function Reports() {
  const navigate = useNavigate();

  const openReport = (report) => {
    if (!report.available) return;

    switch (report.key) {
      case "customers":
        navigate("/reports/customers");
        break;

      case "projects":
        navigate("/reports/projects");
        break;

      case "employees":
        navigate("/reports/employees");
        break;

      case "suppliers":
        navigate("/reports/suppliers");
        break;

      case "reception":
        navigate("/reports/reception");
        break;

      case "financial":
        navigate("/reports/financial");
        break;

      default:
        break;
    }
  };

  return (
    <div className="reports-page reports-overview-only">
      <section className="reports-overview-grid">
        {reportCards.map((report) => {
          const Icon = report.icon;

          return (
            <button
              type="button"
              key={report.key}
              className={`reports-overview-card ${
                !report.available ? "coming-soon" : ""
              }`}
              onClick={() => openReport(report)}
              disabled={!report.available}
            >
              <div className="reports-card-icon">
                <Icon size={22} />
              </div>

              <div className="reports-card-content">
                <span>
                  {report.available
                    ? "AVAILABLE REPORT"
                    : "COMING SOON"}
                </span>

                <h2>{report.title}</h2>

                <p>{report.description}</p>
              </div>

              <div className="reports-card-arrow">
                <ChevronRight size={18} />
              </div>
            </button>
          );
        })}
      </section>
    </div>
  );
}