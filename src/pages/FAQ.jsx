import { useState } from "react";
import { ChevronDown } from "lucide-react";
import faqLogo from "../assets/logo.jpeg";
import "./FAQ.css";

const faqItems = [
  {
    id: "add-asset",
    question: "How do I register a new asset?",
    answer:
      "Go to Asset & Inventory, click Add New Asset, and enter the Asset ID, device name, category, model, MAC address, serial number, quantity, purchase unit, unit price, supplier, purchase date, alert quantity, and image. Select the correct tracking type, then save the record.",
  },
  {
    id: "main-stock",
    question: "How do I view devices available in Main Stock?",
    answer:
      "Open the Main Stock module from the Sidebar. The page displays all assets currently available in the warehouse, including quantities, tracking types, models, MAC addresses, serial numbers, unit prices, total values, and low-stock records. Use the category filter or search box to find a specific asset.",
  },
  {
    id: "transfer-device",
    question: "How do I transfer a device to a customer or tower?",
    answer:
      "Open Device Transfer Management and create a new transfer. Select the source section, destination type, destination customer or tower, asset, quantity, responsible person, and transfer date. The quantity cannot exceed the amount currently available at the source location.",
  },
  {
    id: "customer-device",
    question: "How do I issue a device to a customer?",
    answer:
      "Open Customers, select the required customer, and open the Issue Device page. Choose one or more available devices, review the selected device information, enter the transfer details, and save. The device will be removed from its previous location and assigned to the customer.",
  },
  {
    id: "customer-return",
    question: "How do I return a customer device to Main Stock?",
    answer:
      "Open Device Transfer Management or the customer device history page. Select the customer as the source and Main Stock as the destination. Choose the device and quantity, enter the responsible person and return date, then save the transfer.",
  },
  {
    id: "supplier-purchase",
    question: "How do I record a purchase from a supplier?",
    answer:
      "Open Suppliers, select the supplier, and click New Purchase. Enter the purchase date, invoice or reference number, asset category, Asset ID, quantity, unit price, total amount, paid amount, and remaining amount. Saving the purchase should update the supplier history and the related financial expense record.",
  },
  {
    id: "supplier-payment",
    question: "How do I record a payment to a supplier?",
    answer:
      "Open the supplier full-detail page and select the payment option. Enter the payment amount, date, reference, payment method, and note. The payment reduces the supplier remaining balance and creates the related expense transaction in the Financial module.",
  },
  {
    id: "customer-payment",
    question: "How do I record a customer payment?",
    answer:
      "Open the customer full-detail page and use the Add Payment option. Enter the amount, payment date, payment type, reference, and note. The payment appears in the customer account ledger and creates a related income transaction.",
  },
  {
    id: "packages",
    question: "How do I create and assign an internet package?",
    answer:
      "Open Packages and create a package with its name, speed, price, validity period, description, and status. After saving the package, open a customer profile and assign the package. Enter the start date, end date, payment amount, and package status.",
  },
  {
    id: "tower",
    question: "How do I manage assets installed at a tower?",
    answer:
      "Open Tower Assets and select a tower. The tower detail page shows current assets, quantities, installation information, transfer history, and responsible users. Use Device Transfer Management to send assets to the tower or move them from the tower to another destination.",
  },
  {
    id: "repair",
    question: "How do I send an asset to repair?",
    answer:
      "Create a transfer with Repair as the destination. Select the source location, asset, quantity, transfer date, and responsible person. The asset will appear in Repair Management, where you can record the repair result, cost, date, note, and next destination.",
  },
  {
    id: "repair-result",
    question: "How do I record a repair result?",
    answer:
      "Open Repair Management and click Repair Result for the required record. Select Fixed or Not Fixed, enter the repair date, cost, result note, responsible person, and next destination. Saving the result updates the repair record and creates a financial expense when a repair cost is entered.",
  },
  {
    id: "damaged-lost",
    question: "How do I mark an asset as damaged, lost, or waste?",
    answer:
      "Open the asset action menu or Device Transfer Management and choose the supported Damaged, Lost, or Waste destination or status. Enter the quantity, date, reason, and responsible person. Waste records should be shown with a red background in related history tables.",
  },
  {
    id: "financial-income",
    question: "How do I add manual income or expense?",
    answer:
      "Open Financial and choose Add Income or Add Expense. Enter the date, category, title, amount, reference, source, and note. Manually added financial records can be edited or deleted later from the transaction history.",
  },
  {
    id: "opening-balance",
    question: "How do I add an opening balance?",
    answer:
      "Open Financial and select Add Opening Balance. Enter the opening balance amount, date, type, and note. The opening balance is included in financial calculations and can be reviewed in the financial history.",
  },
  {
    id: "reports",
    question: "How do I generate or print a report?",
    answer:
      "Open Reports, select the report type, apply the required date range, category, location, status, or other filters, then open Print Preview. From the preview page, you can print the report or save it as a PDF using the browser print dialog.",
  },
  {
    id: "search",
    question: "How do I search for a device or record?",
    answer:
      "Use the global search field in the top Header. You can search by Asset ID, device name, MAC address, serial number, customer, tower, supplier, or other supported information. Select a search result to open its full-detail page.",
  },
  {
    id: "user-account",
    question: "How do I create a new user account?",
    answer:
      "Open User Management and click Add User. Enter the full name, email or username, password, category, status, and note. Then configure View, Create, Edit, and Delete permissions for each module before saving the account.",
  },
  {
    id: "permissions",
    question: "How do I control user permissions?",
    answer:
      "Open User Management and edit the required account. In the permission table, enable or disable View, Create, Edit, and Delete access for each system module. Users will only be able to open and use modules permitted for their account.",
  },
  {
    id: "dark-mode",
    question: "How do I change between light and dark mode?",
    answer:
      "Use the display mode button in the top Header. Clicking the button switches the system between light and dark mode. Pages that support the system theme will automatically update their backgrounds, cards, tables, forms, and text colors.",
  },
  {
    id: "backup",
    question: "How do I export and import system data?",
    answer:
      "Open Settings and go to the Backup section. Use Export Data to create a JSON backup file containing the system data. To restore data, choose Import Data and select a valid backup file. Keep backup files in a secure location.",
  },
  {
    id: "agent",
    question: "What can the Agent / AI module answer?",
    answer:
      "The Agent can answer questions about customers, assets, Main Stock, suppliers, towers, transfers, packages, income, expenses, deposits, repairs, low-stock assets, purchase values, and system summaries. It uses information already stored in the system.",
  },
  {
    id: "delete-record",
    question: "Can I edit or delete saved records?",
    answer:
      "Records that support editing and deletion include manual income and expenses, payments, purchases, transfer histories, and other configurable data. Open the Actions menu for the record and choose Edit or Delete. Deletion may also remove or reverse related linked records.",
  },
];

function FAQ() {
  const [openId, setOpenId] = useState(faqItems[0].id);

  const toggleItem = (id) => {
    setOpenId((currentId) => (currentId === id ? "" : id));
  };

  return (
    <div className="faq-page">
      <div className="faq-container">
        <header className="faq-hero">
          <div className="faq-logo">
            <img src={faqLogo} alt="AFGHAN POWER Logo" />
          </div>

          <h1>FAQ</h1>

          <p>
            Frequently asked questions about the ISP Asset Inventory system
          </p>
        </header>

        <section className="faq-list">
          {faqItems.map((item) => {
            const isOpen = openId === item.id;

            return (
              <article
                key={item.id}
                className={`faq-item ${isOpen ? "open" : ""}`}
              >
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                >
                  <span>{item.question}</span>

                  <ChevronDown
                    size={18}
                    className={isOpen ? "open" : ""}
                  />
                </button>

                <div
                  id={`faq-answer-${item.id}`}
                  className="faq-answer"
                  hidden={!isOpen}
                >
                  <p>{item.answer}</p>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}

export default FAQ;