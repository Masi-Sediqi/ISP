import { useMemo, useState } from "react";
import guideLogo from "../assets/logo.PNG";
import "./UserGuide.css";

const guideSections = [
  {
    key: "dashboard",
    title: "Dashboard",
    description:
      "The Dashboard is the central overview of the ISP Asset Inventory system. It displays total assets, Main Stock quantities, assets installed at towers, devices issued to customers, damaged and lost assets, devices under repair, inactive customers, security deposits, purchase values, and recent system activities. Use the summary cards and charts to quickly understand the current condition of the company.",
  },
  {
    key: "suppliers",
    title: "Suppliers",
    description:
      "The Suppliers module is used to register and manage all supplier records. You can save supplier contact information, addresses, purchases, invoices, payments, opening balances, remaining balances, and supplier notes. Open the full supplier detail page to review purchase history, financial activity, payment status, and supplier analysis.",
  },
  {
    key: "assets",
    title: "Asset & Inventory",
    description:
      "The Asset & Inventory module is used to register all company devices and materials. You can define Asset ID, device name, category, model, MAC address, serial number, quantity, purchase unit, price, supplier, purchase date, image, tracking type, and alert quantity. Every asset includes a full-information page for movements, transfers, repairs, stock history, and audit records.",
  },
  {
    key: "main-stock",
    title: "Main Stock",
    description:
      "The Main Stock module displays all assets currently available in the company warehouse. It shows asset quantities, device identity information, models, MAC addresses, serial numbers, purchase units, unit prices, total values, tracking types, and low-stock warnings. Use the category filter and search input to quickly find a specific asset.",
  },
  {
    key: "device-transfer",
    title: "Device Transfer",
    description:
      "The Device Transfer Management module records all movements of company assets. Assets can be transferred from Main Stock to towers, customers, repair, damaged, lost, or other supported destinations. The system verifies the source quantity, destination, responsible person, transfer date, device identity, and status before saving each transfer.",
  },
  {
    key: "customers",
    title: "Customers",
    description:
      "The Customers module manages customer profiles, contact details, addresses, statuses, payments, balances, security deposits, assigned devices, internet packages, disconnections, and device recovery. Open a customer detail page to view the complete account ledger, current devices, transfer history, package history, payments, and deposit records.",
  },
  {
    key: "packages",
    title: "Packages",
    description:
      "The Packages module is used to create and manage internet service packages. You can define package names, internet speeds, prices, validity periods, descriptions, and package status. Packages can be assigned to customers, and the system tracks package start dates, expiry dates, payments, active status, and remaining balances.",
  },
  {
    key: "tower-assets",
    title: "Tower Assets",
    description:
      "The Tower Assets module manages company towers and all equipment installed at each tower. You can register tower names, locations, installation details, current assets, quantities, statuses, and transfer histories. The tower details page shows assets received, assets sent, current quantities, responsible users, installation costs, and tower activity.",
  },
  {
    key: "financial",
    title: "Financial",
    description:
      "The Financial module records company income, expenses, opening balances, supplier purchases, supplier payments, repair expenses, customer payments, package payments, security deposits, refunds, and manual financial records. You can filter records, review financial summaries, and edit or delete manually registered income and expense entries.",
  },
  {
    key: "reports",
    title: "Reports",
    description:
      "The Reports module provides operational and financial reports from across the ISP system. Reports may include assets, Main Stock, suppliers, customers, packages, towers, transfers, damaged devices, lost devices, repair records, deposits, income, expenses, balances, and purchases. Use the available filters to select dates, categories, locations, and statuses.",
  },
  {
    key: "repair",
    title: "Repair",
    description:
      "The Repair module tracks all assets sent for repair or maintenance. It records the source section, transfer reference, asset name, quantity, repair status, repair cost, repair date, result, responsible person, notes, and current destination. After repair, an asset can be returned to Main Stock, transferred to a tower, marked as fixed, or marked as not fixed.",
  },
  {
    key: "user-management",
    title: "User Management",
    description:
      "The User Management module controls user accounts, roles, statuses, passwords, and module permissions. Administrators can create users, assign categories, activate or deactivate accounts, and configure View, Create, Edit, and Delete permissions for every module. The active administrator account and final full-access account are protected from accidental deletion.",
  },
  {
    key: "settings",
    title: "Settings",
    description:
      "The Settings module controls company information and system preferences. You can configure the company name, logo, subtitle, appearance, dark mode, notification sounds, backup options, and other system behavior. Company settings may also update the Sidebar, Login page, Help Center, Developer page, and other branded sections.",
  },
  {
    key: "agent",
    title: "Agent / AI",
    description:
      "The Agent / AI module answers questions using information stored in the ISP Asset Inventory system. You can ask about customers, assets, Main Stock, suppliers, towers, transfers, income, expenses, deposits, repairs, low-stock records, and system summaries. The Agent uses current system data but important financial and operational information should still be verified manually.",
  },
];

function UserGuide() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const selectedSection = useMemo(
    () =>
      guideSections.find(
        (section) => section.key === activeSection
      ) || guideSections[0],
    [activeSection]
  );

  return (
    <div className="user-guide-page">
      <div className="user-guide-container">
        <header className="user-guide-hero">
          <div className="user-guide-logo">
            <img
              src={guideLogo}
              alt="AFGHAN POWER Logo"
            />
          </div>

          <h1>User Guide</h1>

          <p>
            Complete beginner&apos;s guide to every module
          </p>
        </header>

        <nav
          className="user-guide-tabs"
          aria-label="User guide modules"
        >
          {guideSections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={
                activeSection === section.key ? "active" : ""
              }
              onClick={() => setActiveSection(section.key)}
            >
              {section.title}
            </button>
          ))}
        </nav>

        <section className="user-guide-content-card">
          <h2>{selectedSection.title}</h2>
          <p>{selectedSection.description}</p>
        </section>
      </div>
    </div>
  );
}

export default UserGuide;
