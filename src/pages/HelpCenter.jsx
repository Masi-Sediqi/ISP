import { useNavigate } from "react-router-dom";
import helpCenterLogo from "../assets/logo.jpeg";
import {
  Bot,
  Boxes,
  Building2,
  CircleDollarSign,
  FileBarChart,
  LayoutDashboard,
  Mail,
  Package,
  PackageSearch,
  Phone,
  RadioTower,
  Repeat2,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
  Wrench,
  Globe2,
} from "lucide-react";

import "./HelpCenter.css";

const helpModules = [
  {
    key: "dashboard",
    title: "Dashboard",
    description:
      "View system summaries, asset statistics, deposits, purchases, repairs, and operational insights.",
    icon: LayoutDashboard,
    path: "/",
    tone: "violet",
  },
  {
    key: "suppliers",
    title: "Suppliers",
    description:
      "Manage supplier information, purchases, payments, balances, and complete supplier histories.",
    icon: Truck,
    path: "/suppliers",
    tone: "orange",
  },
  {
    key: "assets",
    title: "Asset & Inventory",
    description:
      "Register devices, categories, prices, identities, quantities, images, and full asset information.",
    icon: Boxes,
    path: "/assets",
    tone: "blue",
  },
  {
    key: "main-stock",
    title: "Main Stock",
    description:
      "View all devices available in stock, quantities, prices, tracking details, and low-stock records.",
    icon: Warehouse,
    path: "/main-stock",
    tone: "cyan",
  },
  {
    key: "device-transfer",
    title: "Device Transfer Management",
    description:
      "Transfer assets between Main Stock, towers, customers, repair, damaged, and other locations.",
    icon: Repeat2,
    path: "/device-transfer-management",
    tone: "indigo",
  },
  {
    key: "customers",
    title: "Customers",
    description:
      "Manage customer profiles, devices, balances, payments, deposits, disconnections, and account history.",
    icon: Users,
    path: "/customers",
    tone: "purple",
  },
  {
    key: "packages",
    title: "Packages",
    description:
      "Create internet packages, assign packages to customers, and track package payments and expiry.",
    icon: Package,
    path: "/packages",
    tone: "pink",
  },
  {
    key: "tower-assets",
    title: "Tower Assets",
    description:
      "Manage towers, installed assets, tower transfers, locations, status, and tower asset histories.",
    icon: RadioTower,
    path: "/tower-assets",
    tone: "emerald",
  },
  {
    key: "financial",
    title: "Financial",
    description:
      "Record income and expenses, opening balances, purchases, repair expenses, and financial summaries.",
    icon: CircleDollarSign,
    path: "/finance",
    tone: "green",
  },
  {
    key: "reports",
    title: "Reports",
    description:
      "Generate reports for assets, suppliers, customers, transfers, deposits, repairs, and financial data.",
    icon: FileBarChart,
    path: "/reports",
    tone: "amber",
  },
  {
    key: "repair",
    title: "Repair",
    description:
      "Track devices sent to repair, repair costs, results, responsible users, and next destinations.",
    icon: Wrench,
    path: "/repair",
    tone: "red",
  },
  {
    key: "user-management",
    title: "User Management",
    description:
      "Create user accounts, assign roles, configure permissions, and manage user access.",
    icon: ShieldCheck,
    path: "/user-management",
    tone: "slate",
  },
  {
    key: "settings",
    title: "Settings",
    description:
      "Configure company information, logo, system appearance, notifications, backups, and preferences.",
    icon: Settings,
    path: "/settings",
    tone: "gray",
  },
  {
    key: "agent",
    title: "Agent / AI",
    description:
      "Ask questions about customers, assets, stock, towers, suppliers, finance, repairs, and transfers.",
    icon: Bot,
    path: "/agent",
    tone: "fuchsia",
  },
];

function HelpCenter() {
  const navigate = useNavigate();

  return (
    <div className="help-center-page">
      <div className="help-center-container">
        <header className="help-center-hero">
          <div className="help-center-logo">
  <img
    src={helpCenterLogo}
    alt="ISP Asset Inventory Logo"
  />
</div>

          <h1>Help Center</h1>

          <p>
            Get help with any module in the ISP Asset Inventory system.
          </p>
        </header>

        <section className="help-center-modules">
          {helpModules.map((module) => {
            const Icon = module.icon;

            return (
              <button
                key={module.key}
                type="button"
                className="help-center-module-card"
                onClick={() => navigate(module.path)}
              >
                <span
                  className={`help-center-module-icon tone-${module.tone}`}
                >
                  <Icon size={22} strokeWidth={1.8} />
                </span>

                <span className="help-center-module-content">
                  <strong>{module.title}</strong>
                  <small>{module.description}</small>
                </span>
              </button>
            );
          })}
        </section>

        <section className="help-center-support">
          <h2>Contact Support</h2>

          <div className="help-center-support-list">
            <a href="mailto:info@afghapower.com">
              <span>
                <Mail size={19} />
              </span>

              <div>
                <small>Email</small>
                <strong>info@afghapower.com</strong>
              </div>
            </a>

            <a href="tel:0794948698">
              <span>
                <Phone size={19} />
              </span>

              <div>
                <small>Phone</small>
                <strong>0794948698</strong>
              </div>
            </a>

            <a
              href="https://www.afghanpower.com"
              target="_blank"
              rel="noreferrer"
            >
              <span>
                <Globe2 size={19} />
              </span>

              <div>
                <small>Website</small>
                <strong>www.afghanpower.com</strong>
              </div>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HelpCenter;