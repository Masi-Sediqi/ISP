import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { formatDateTime, todayDateValue } from "../utils/afghanDate";
import "./Customers.css";

const emptyForm = {
  customerId: "",
  customerName: "",
  fatherName: "",
  phone: "",
  email: "",
  nationalId: "",
  address: "",
  registrationDate: "",
  status: "Active",
  notes: "",
};

const emptyIssueDeviceForm = {
  sourceType: "Main Stock",
  fromCustomerId: "",
  assetKey: "",
  issueDate: new Date().toISOString().slice(0, 10),
  issueStatus: "Issued",
  ownershipType: "Loaned",
  salePrice: "",
  paidAmount: "",
  remainAmount: "",
  depositAmount: "",
  depositStatus: "Held",
  notes: "",
};

const emptyPackageForm = {
  packageId: "",
  packageCode: "",
  packageName: "",
  speed: "",
  packagePrice: "",
  paidAmount: "",
  remainAmount: "",
  startDate: "",
  endDate: "",
  status: "Active",
  notes: "",
};

function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 8h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 6l1 15h10l1-15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function money(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function Customers() {
  const [customers, setCustomers] = useJsonCollection("customers");
  const [customerPackages, setCustomerPackages] = useJsonCollection("customerPackages");
  const [, setTransactions] = useJsonCollection("transactions");

  const [showPackageModal, setShowPackageModal] = useState(false);
  const [packageForm, setPackageForm] = useState(emptyPackageForm);
  const [packageCustomer, setPackageCustomer] = useState(null);

  const [formData, setFormData] = useState(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [search, setSearch] = useState("");
  const [deleteIndex, setDeleteIndex] = useState(null);

  const [openAction, setOpenAction] = useState(null);
  const [actionPosition, setActionPosition] = useState({ top: 0, left: 0 });


  const [assets, setAssets] = useJsonCollection("assets");
  const [deviceTransfers, setDeviceTransfers] = useJsonCollection("deviceTransfers");
  const [securityDeposits, setSecurityDeposits] = useJsonCollection("securityDeposits");

  const [showIssueDeviceModal, setShowIssueDeviceModal] = useState(false);
  const [issueDeviceCustomer, setIssueDeviceCustomer] = useState(null);
  const [issueDeviceForm, setIssueDeviceForm] = useState(emptyIssueDeviceForm);

  const activeCustomers = customers.filter((item) => item.status === "Active").length;
  const inactiveCustomers = customers.filter((item) => item.status === "Inactive").length;
  const disconnectedCustomers = customers.filter((item) => item.status === "Disconnected").length;
  const activePackages = customerPackages.filter((item) => item.status === "Active");

const monthlyRevenue = activePackages.reduce(
  (sum, item) => sum + Number(item.packagePrice || 0),
  0
);

const navigate = useNavigate();
const [packages] = useJsonCollection("packages");

const getAssetKey = (asset) => String(asset.id || asset.assetId || asset.serialNumber || "");

const getAssetLabel = (asset) => {
  const id = asset.assetId || "No Asset ID";
  const name = asset.deviceName || "Unnamed Device";
  const serial = asset.serialNumber ? ` / SN: ${asset.serialNumber}` : "";
  const mac = asset.macAddress ? ` / MAC: ${asset.macAddress}` : "";

  return `${id} - ${name}${serial}${mac}`;
};

const getCustomerName = (customer) => {
  return (
    customer.customerName ||
    customer.fullName ||
    customer.name ||
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    "Unnamed Customer"
  );
};

const mainStockAssets = assets.filter((asset) => {
  const location = String(asset.location || "").toLowerCase();
  const status = String(asset.status || "").toLowerCase();

  return (
    location === "main stock" ||
    status === "in stock" ||
    status === "returned"
  );
});

const customerOwnedAssets = assets.filter((asset) => {
  if (issueDeviceForm.sourceType !== "Customer") return false;

  const fromCustomer = customers.find(
    (item) => String(item.id) === String(issueDeviceForm.fromCustomerId)
  );

  if (!fromCustomer) return false;

  return (
    String(asset.customerRecordId || "") === String(fromCustomer.id) ||
    String(asset.customerId || "") === String(fromCustomer.customerId)
  );
});

const availableIssueAssets =
  issueDeviceForm.sourceType === "Main Stock"
    ? mainStockAssets
    : customerOwnedAssets;

const selectedIssueAsset = assets.find(
  (asset) => getAssetKey(asset) === String(issueDeviceForm.assetKey)
);

const openIssueDeviceModal = (customer) => {
  setIssueDeviceCustomer(customer);
  setIssueDeviceForm(emptyIssueDeviceForm);
  setShowIssueDeviceModal(true);
};

const closeIssueDeviceModal = () => {
  setIssueDeviceCustomer(null);
  setIssueDeviceForm(emptyIssueDeviceForm);
  setShowIssueDeviceModal(false);
};

const handleIssueDeviceChange = (event) => {
  const { name, value } = event.target;

  setIssueDeviceForm((previous) => {
    const nextData = {
      ...previous,
      [name]: value,
    };

    if (name === "sourceType") {
      nextData.fromCustomerId = "";
      nextData.assetKey = "";
    }

    if (name === "ownershipType") {
      nextData.salePrice = "";
      nextData.paidAmount = "";
      nextData.remainAmount = "";
      nextData.depositAmount = "";
    }

    const salePrice =
      name === "salePrice"
        ? Number(value || 0)
        : Number(nextData.salePrice || 0);

    const paidAmount =
      name === "paidAmount"
        ? Number(value || 0)
        : Number(nextData.paidAmount || 0);

    if (nextData.ownershipType === "Sold") {
      nextData.remainAmount = Math.max(salePrice - paidAmount, 0);
    }

    return nextData;
  });
};

const saveIssueDevice = async (event) => {
  event.preventDefault();

  if (!issueDeviceCustomer) return;

  const asset = selectedIssueAsset;

  if (!asset) {
    notify("Please select a device.", "error");
    return;
  }

  if (
    issueDeviceForm.sourceType === "Customer" &&
    !issueDeviceForm.fromCustomerId
  ) {
    notify("Please select source customer.", "error");
    return;
  }

  if (
    issueDeviceForm.sourceType === "Customer" &&
    String(issueDeviceForm.fromCustomerId) === String(issueDeviceCustomer.id)
  ) {
    notify("Source customer and destination customer cannot be the same.", "error");
    return;
  }

  const fromCustomer =
    issueDeviceForm.sourceType === "Customer"
      ? customers.find(
          (item) => String(item.id) === String(issueDeviceForm.fromCustomerId)
        )
      : null;

  const salePrice = Number(issueDeviceForm.salePrice || 0);
  const paidAmount = Number(issueDeviceForm.paidAmount || 0);
  const remainAmount =
    issueDeviceForm.ownershipType === "Sold"
      ? Math.max(salePrice - paidAmount, 0)
      : 0;

  if (issueDeviceForm.ownershipType === "Sold" && paidAmount > salePrice) {
    notify("Paid amount cannot be greater than sale amount.", "error");
    return;
  }

  const depositAmount =
    issueDeviceForm.ownershipType === "Loaned"
      ? Number(issueDeviceForm.depositAmount || 0)
      : 0;

  const transferRecord = {
    id: Date.now(),
    transferType:
      issueDeviceForm.sourceType === "Main Stock"
        ? "Main Stock to Customer"
        : "Customer to Customer",

    fromType: issueDeviceForm.sourceType,
    fromCustomerRecordId: fromCustomer?.id || "",
    fromCustomerId: fromCustomer?.customerId || "",
    fromCustomerName: fromCustomer ? getCustomerName(fromCustomer) : "Main Stock",

    toCustomerRecordId: issueDeviceCustomer.id,
    toCustomerId: issueDeviceCustomer.customerId,
    toCustomerName: getCustomerName(issueDeviceCustomer),

    assetRecordId: asset.id || "",
    assetId: asset.assetId || "",
    deviceName: asset.deviceName || "",
    category: asset.category || "",
    brand: asset.brand || "",
    model: asset.model || "",
    macAddress: asset.macAddress || "",
    serialNumber: asset.serialNumber || "",

    issueDate: issueDeviceForm.issueDate,
    issueStatus: issueDeviceForm.issueStatus,
    ownershipType: issueDeviceForm.ownershipType,

    salePrice,
    paidAmount,
    remainAmount,

    depositAmount,
    depositStatus:
      issueDeviceForm.ownershipType === "Loaned"
        ? issueDeviceForm.depositStatus
        : "",

    notes: issueDeviceForm.notes.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedAssets = assets.map((item) => {
    if (getAssetKey(item) !== getAssetKey(asset)) return item;

    return {
      ...item,
      location: "Customer",
      status:
        issueDeviceForm.ownershipType === "Sold"
          ? "Sold"
          : issueDeviceForm.issueStatus,
      ownershipType: issueDeviceForm.ownershipType,

      customerRecordId: issueDeviceCustomer.id,
      customerId: issueDeviceCustomer.customerId,
      customerName: getCustomerName(issueDeviceCustomer),

      previousCustomerRecordId: fromCustomer?.id || item.customerRecordId || "",
      previousCustomerId: fromCustomer?.customerId || item.customerId || "",
      previousCustomerName: fromCustomer
        ? getCustomerName(fromCustomer)
        : item.customerName || "",

      lastTransferDate: issueDeviceForm.issueDate,
      updatedAt: new Date().toISOString(),
    };
  });

  const assetsSaved = await setAssets(updatedAssets);
  if (!assetsSaved) return;

  const transferSaved = await setDeviceTransfers([
    ...deviceTransfers,
    transferRecord,
  ]);

  if (!transferSaved) return;

  if (issueDeviceForm.ownershipType === "Sold" && paidAmount > 0) {
    const incomeSaved = await setTransactions((previousTransactions) => [
      ...previousTransactions.filter(
        (transaction) =>
          !(
            transaction.source === "customer-device-sale" &&
            String(transaction.referenceId || "") === String(transferRecord.id)
          )
      ),
      {
        id: `customer-device-sale-income-${transferRecord.id}`,
        type: "income",
        title: `Customer Device Sale - ${getCustomerName(issueDeviceCustomer)}`,
        category: "Device Sale",
        amount: paidAmount,
        date: issueDeviceForm.issueDate,
        description: [
          `Asset: ${asset.assetId || ""} - ${asset.deviceName || ""}`,
          `Sale Amount: ${money(salePrice)} AFN`,
          `Paid: ${money(paidAmount)} AFN`,
          `Remaining: ${money(remainAmount)} AFN`,
          issueDeviceForm.notes.trim(),
        ]
          .filter(Boolean)
          .join(" | "),
        source: "customer-device-sale",
        referenceId: transferRecord.id,
        customerRecordId: issueDeviceCustomer.id || "",
        customerId: issueDeviceCustomer.customerId || "",
        customerName: getCustomerName(issueDeviceCustomer),
        assetId: asset.assetId || "",
        createdAt: transferRecord.createdAt,
        updatedAt: new Date().toISOString(),
      },
    ]);

    if (!incomeSaved) {
      notify("Device was issued, but its income could not be linked to Financial.", "error");
      return;
    }
  }

  if (issueDeviceForm.ownershipType === "Loaned" && depositAmount > 0) {
    await setSecurityDeposits([
      ...securityDeposits,
      {
        id: Date.now() + 1,
        customerRecordId: issueDeviceCustomer.id,
        customerId: issueDeviceCustomer.customerId,
        customerName: getCustomerName(issueDeviceCustomer),

        assetRecordId: asset.id || "",
        assetId: asset.assetId || "",
        deviceName: asset.deviceName || "",

        depositAmount,
        depositDate: issueDeviceForm.issueDate,
        depositStatus: issueDeviceForm.depositStatus,
        transferId: transferRecord.id,
        notes: issueDeviceForm.notes.trim(),

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  }

  notify("Device issued to customer successfully.");
  closeIssueDeviceModal();
};

const handlePackageChange = (event) => {
  const { name, value } = event.target;

  setPackageForm((previous) => {
    const nextData = {
      ...previous,
      [name]: value,
    };

    const price =
      name === "packagePrice"
        ? Number(value || 0)
        : Number(nextData.packagePrice || 0);

    const paid =
      name === "paidAmount"
        ? Number(value || 0)
        : Number(nextData.paidAmount || 0);

    return {
      ...nextData,
      remainAmount: Math.max(price - paid, 0),
    };
  });
};

const saveCustomerPackage = async (event) => {
  event.preventDefault();

  if (!packageCustomer) return;

  const cleanPackage = {
    id: Date.now(),
    customerRecordId: packageCustomer.id,
    customerId: packageCustomer.customerId,
    customerName: packageCustomer.customerName,

    packageId: packageForm.packageId,
    packageCode: packageForm.packageCode,
    packageName: packageForm.packageName.trim(),
    speed: packageForm.speed.trim(),

    packagePrice: Number(packageForm.packagePrice || 0),
    paidAmount: Number(packageForm.paidAmount || 0),
    remainAmount: Number(packageForm.remainAmount || 0),

    startDate: packageForm.startDate,
    endDate: packageForm.endDate,
    status: packageForm.status,
    notes: packageForm.notes.trim(),

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!cleanPackage.packageId && !cleanPackage.packageName) {
    notify("Please select a package.", "error");
    return;
  }

  if (!cleanPackage.startDate || !cleanPackage.endDate) {
    notify("Please enter package start date and end date.", "error");
    return;
  }

  const updatedPackages = customerPackages.map((item) => {
    const sameCustomer =
      String(item.customerId) === String(packageCustomer.customerId) ||
      String(item.customerRecordId) === String(packageCustomer.id);

    if (sameCustomer && item.status === "Active") {
      return {
        ...item,
        status: "Expired",
        updatedAt: new Date().toISOString(),
      };
    }

    return item;
  });

  const saved = await setCustomerPackages([...updatedPackages, cleanPackage]);

  if (saved) {
    if (Number(cleanPackage.paidAmount || 0) > 0) {
      const incomeSaved = await setTransactions((previousTransactions) => [
        ...previousTransactions.filter(
          (transaction) =>
            !(
              transaction.source === "customer-package" &&
              String(transaction.referenceId || "") === String(cleanPackage.id)
            )
        ),
        {
          id: `customer-package-income-${cleanPackage.id}`,
          type: "income",
          title: `Package Payment - ${cleanPackage.customerName || "Customer"}`,
          category: "Package Payment",
          amount: Number(cleanPackage.paidAmount || 0),
          date: cleanPackage.startDate,
          description: [
            cleanPackage.packageName ? `Package: ${cleanPackage.packageName}` : "",
            cleanPackage.speed ? `Speed: ${cleanPackage.speed}` : "",
            `Package Price: ${money(cleanPackage.packagePrice)} AFN`,
            `Paid: ${money(cleanPackage.paidAmount)} AFN`,
            `Remaining: ${money(cleanPackage.remainAmount)} AFN`,
            cleanPackage.notes || "",
          ]
            .filter(Boolean)
            .join(" | "),
          source: "customer-package",
          referenceId: cleanPackage.id,
          customerRecordId: cleanPackage.customerRecordId || "",
          customerId: cleanPackage.customerId || "",
          customerName: cleanPackage.customerName || "",
          createdAt: cleanPackage.createdAt,
          updatedAt: new Date().toISOString(),
        },
      ]);

      if (!incomeSaved) {
        notify("Package saved, but its income could not be linked to Financial.", "error");
        return;
      }
    }

    if (cleanPackage.endDate <= todayDateValue()) {
      notify(
        "Customer package saved, but its End Date has arrived. Please review the package.",
        "warning"
      );
    } else {
      notify("Customer package saved successfully.");
    }
    closePackageModal();
  }
};


const getCustomerPackages = (customer) => {
  return customerPackages.filter(
    (item) =>
      String(item.customerId) === String(customer.customerId) ||
      String(item.customerRecordId) === String(customer.id)
  );
};

const getCustomerBalance = (customer) => {
  const records = getCustomerPackages(customer);
  const soldDeviceRecords = deviceTransfers.filter(
    (item) =>
      item.ownershipType === "Sold" &&
      (String(item.toCustomerId || "") === String(customer.customerId) ||
        String(item.toCustomerRecordId || "") === String(customer.id))
  );

  const packageTotal = records.reduce(
    (sum, item) => sum + Number(item.packagePrice || 0),
    0
  );

  const packagePaid = records.reduce(
    (sum, item) => sum + Number(item.paidAmount || 0),
    0
  );

  const deviceSaleTotal = soldDeviceRecords.reduce(
    (sum, item) => sum + Number(item.salePrice || 0),
    0
  );

  const deviceSalePaid = soldDeviceRecords.reduce(
    (sum, item) => sum + Number(item.paidAmount || 0),
    0
  );

  const totalPrice = packageTotal + deviceSaleTotal;
  const totalPaid = packagePaid + deviceSalePaid;
  const balance = totalPrice - totalPaid;

  return {
    totalPrice,
    totalPaid,
    balance,
    customerOwes: balance > 0 ? balance : 0,
    weOwe: balance < 0 ? Math.abs(balance) : 0,
  };
};

const openPackageModal = (customer) => {
  setPackageCustomer(customer);
  setPackageForm(emptyPackageForm);
  setShowPackageModal(true);
};

const closePackageModal = () => {
  setPackageCustomer(null);
  setPackageForm(emptyPackageForm);
  setShowPackageModal(false);
};

const handleSelectedPackageChange = (event) => {
  const packageId = event.target.value;
  const selectedPackage = packages.find(
    (item) => String(item.id) === String(packageId)
  );

  if (!selectedPackage) {
    setPackageForm((previous) => ({
      ...previous,
      packageId: "",
      packageCode: "",
      packageName: "",
      speed: "",
      packagePrice: "",
      remainAmount: "",
    }));
    return;
  }

  const price = Number(selectedPackage.monthlyPrice || 0);
  const paid = Number(packageForm.paidAmount || 0);

  setPackageForm((previous) => ({
    ...previous,
    packageId: selectedPackage.id,
    packageCode: selectedPackage.packageCode || "",
    packageName: selectedPackage.packageName || "",
    speed: selectedPackage.speed || "",
    packagePrice: price,
    remainAmount: Math.max(price - paid, 0),
  }));
};

  const filteredCustomers = customers
    .map((customer, originalIndex) => ({ ...customer, originalIndex }))
    .filter((customer) => {
      const keyword = search.toLowerCase();

      return (
        (customer.customerId || "").toLowerCase().includes(keyword) ||
        (customer.customerName || "").toLowerCase().includes(keyword) ||
        (customer.fatherName || "").toLowerCase().includes(keyword) ||
        (customer.phone || "").toLowerCase().includes(keyword) ||
        (customer.email || "").toLowerCase().includes(keyword) ||
        (customer.nationalId || "").toLowerCase().includes(keyword) ||
        (customer.address || "").toLowerCase().includes(keyword) ||
        (customer.status || "").toLowerCase().includes(keyword)
      );
    });

  const generateCustomerId = () => {
    const numbers = customers
      .map((item) => String(item.customerId || ""))
      .map((id) => Number(id.replace("CUS-", "")))
      .filter((number) => !Number.isNaN(number));

    const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;

    setFormData((previous) => ({
      ...previous,
      customerId: `CUS-${String(nextNumber).padStart(4, "0")}`,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditIndex(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    resetForm();
    setShowModal(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const customerExists = (data) => {
    return customers.some((customer, index) => {
      if (editIndex !== null && index === editIndex) return false;

      const sameCustomerId =
        data.customerId &&
        customer.customerId &&
        data.customerId.toLowerCase() === customer.customerId.toLowerCase();

      const samePhone =
        data.phone &&
        customer.phone &&
        data.phone.toLowerCase() === customer.phone.toLowerCase();

      const sameNationalId =
        data.nationalId &&
        customer.nationalId &&
        data.nationalId.toLowerCase() === customer.nationalId.toLowerCase();

      return sameCustomerId || samePhone || sameNationalId;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanData = {
      id: editIndex !== null ? customers[editIndex]?.id || Date.now() : Date.now(),
      customerId: formData.customerId.trim(),
      customerName: formData.customerName.trim(),
      fatherName: formData.fatherName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      nationalId: formData.nationalId.trim(),
      address: formData.address.trim(),
      registrationDate: formData.registrationDate,
      status: formData.status,
      notes: formData.notes.trim(),
      createdAt: editIndex !== null ? customers[editIndex]?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!cleanData.customerId) {
      notify("Please enter or generate Customer ID.", "error");
      return;
    }

    if (!cleanData.customerName) {
      notify("Please enter customer name.", "error");
      return;
    }

    if (!cleanData.phone) {
      notify("Please enter customer phone.", "error");
      return;
    }

    if (customerExists(cleanData)) {
      notify("Customer ID, phone, or national ID already exists.", "error");
      return;
    }

    if (editIndex !== null) {
      const updatedCustomers = [...customers];
      updatedCustomers[editIndex] = cleanData;

      const saved = await setCustomers(updatedCustomers);

      if (saved) {
        notify("Customer updated successfully.");
        closeModal();
      }

      return;
    }

    const saved = await setCustomers([...customers, cleanData]);

    if (saved) {
      notify("Customer saved successfully.");
      closeModal();
    }
  };

  const openEditModal = (index) => {
    setEditIndex(index);
    setFormData({
      ...emptyForm,
      ...customers[index],
      monthlyFee: String(customers[index]?.monthlyFee || ""),
    });
    setShowModal(true);
    setOpenAction(null);
  };

  const openDeleteModal = (index) => {
    setDeleteIndex(index);
    setOpenAction(null);
  };

  const cancelDelete = () => {
    setDeleteIndex(null);
  };

  const confirmDelete = async () => {
    if (deleteIndex === null) return;

    const saved = await setCustomers(customers.filter((_, index) => index !== deleteIndex));

    if (saved) {
      notify("Customer deleted successfully.");
      setDeleteIndex(null);
    }
  };

  const toggleActionMenu = (event, index) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setActionPosition({
      top: rect.bottom + 8,
      left: rect.right - 160,
    });

    setOpenAction(openAction === index ? null : index);
  };

  const getStatusClass = (status) => {
    if (status === "Active") return "customer-badge active";
    if (status === "Inactive") return "customer-badge inactive";
    if (status === "Disconnected") return "customer-badge disconnected";
    return "customer-badge";
  };

  return (
    <div className="customers-page">
      <div className="customers-header">
        <div>
          <h1>Customer Management</h1>
          <p>Register, edit, delete, and manage ISP customer records.</p>
        </div>

        <button type="button" className="customer-add-btn" onClick={openCreateModal}>
          + Add Customer
        </button>
      </div>

      <div className="customer-stats">
        <div className="customer-stat-card">
          <span>Total Customers</span>
          <strong>{customers.length}</strong>
          <p>All registered customers</p>
        </div>

        <div className="customer-stat-card">
          <span>Active Customers</span>
          <strong>{activeCustomers}</strong>
          <p>Currently active customers</p>
        </div>

        <div className="customer-stat-card">
          <span>Inactive Customers</span>
          <strong>{inactiveCustomers}</strong>
          <p>Inactive customer records</p>
        </div>

        <div className="customer-stat-card">
          <span>Disconnected</span>
          <strong>{disconnectedCustomers}</strong>
          <p>Disconnected customers</p>
        </div>

        <div className="customer-stat-card">
          <span>Monthly Revenue</span>
          <strong>{money(monthlyRevenue)} AFN</strong>
          <p>Expected monthly fee</p>
        </div>
      </div>

      <div className="customer-table-card">
        <div className="customer-table-header">
          <div>
            <h3>Customer List</h3>
            <p>All customers saved in the system</p>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search customer..."
          />
        </div>

        <div className="customer-table-wrap">
          <table>
            <thead>
             <tr>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Registration Date</th>
                <th>Status</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => {
                const index = customer.originalIndex;

                return (
                  <tr key={customer.id || index}>
                    <td className="customer-strong">{customer.customerId || "-"}</td>
                    <td>{customer.customerName || "-"}</td>
                    <td>{customer.phone || "-"}</td>
                    <td>
                      {formatDateTime(
                        customer.registrationDate,
                        customer.createdAt || customer.updatedAt
                      )}
                    </td>
                    <td>
                      <span className={getStatusClass(customer.status)}>
                        {customer.status || "Unknown"}
                      </span>
                    </td>
                    <td>
  {(() => {
    const balanceInfo = getCustomerBalance(customer);

    if (balanceInfo.customerOwes > 0) {
      return (
        <span className="customer-balance customer-owes">
          Owes {money(balanceInfo.customerOwes)} AFN
        </span>
      );
    }

    if (balanceInfo.weOwe > 0) {
      return (
        <span className="customer-balance we-owe">
          We owe {money(balanceInfo.weOwe)} AFN
        </span>
      );
    }

    return <span className="customer-balance clear">Clear</span>;
  })()}
</td>
                    <td>
                      <div className="customer-action-cell">
                        <button
                          type="button"
                          className="customer-action-btn"
                          onClick={(event) => toggleActionMenu(event, index)}
                        >
                          ⋮
                        </button>

                        {openAction === index && (
                          <div
                            className="customer-action-menu"
                            style={{
                              top: `${actionPosition.top}px`,
                              left: `${actionPosition.left}px`,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                navigate(`/customers/${customer.id || customer.customerId}`);
                                setOpenAction(null);
                              }}
                            >
                              <InfoIcon />
                              <span>Full Detail</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                openPackageModal(customer);
                                setOpenAction(null);
                              }}
                            >
                              <span>＋</span>
                              <span>Add Package</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                navigate(`/customers/${customer.id || customer.customerId}/issue-device`);
                                setOpenAction(null);
                              }}
                            >
                              <span>↗</span>
                              <span>Issue Device</span>
                            </button>

                            <button type="button" onClick={() => openEditModal(index)}>
                              <EditIcon />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              className="danger-action"
                              onClick={() => openDeleteModal(index)}
                            >
                              <TrashIcon />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="7" className="customer-empty">
                    No customer has been registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="customer-modal-backdrop" onClick={closeModal}>
          <div className="customer-modal" onClick={(event) => event.stopPropagation()}>
            <div className="customer-modal-header">
              <div>
                <h3>{editIndex !== null ? "Edit Customer" : "Add Customer"}</h3>
                <p>Enter customer identity, contact, package, and account information.</p>
              </div>

              <button type="button" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="customer-form-grid">
                <div className="customer-form-group">
                  <label>Customer ID</label>
                  <div className="customer-id-field">
                    <input
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleChange}
                      placeholder="Example: CUS-0001"
                      required
                    />

                    <button type="button" onClick={generateCustomerId}>
                      Generate
                    </button>
                  </div>
                </div>

                <div className="customer-form-group">
                  <label>Customer Name</label>
                  <input
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Example: Rahmatullah"
                    required
                  />
                </div>

                <div className="customer-form-group">
                  <label>Father Name</label>
                  <input
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    placeholder="Example: Ahmad"
                  />
                </div>

                <div className="customer-form-group">
                  <label>Phone</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Example: 0790000000"
                    required
                  />
                </div>

                <div className="customer-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Example: customer@email.com"
                  />
                </div>

                <div className="customer-form-group">
                  <label>National ID</label>
                  <input
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleChange}
                    placeholder="Example: Tazkira / NID"
                  />
                </div>


                <div className="customer-form-group">
                  <label>Registration Date</label>
                  <input
                    type="date"
                    name="registrationDate"
                    value={formData.registrationDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="customer-form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Disconnected">Disconnected</option>
                  </select>
                </div>

                <div className="customer-form-group customer-form-full">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Customer address..."
                  />
                </div>

                <div className="customer-form-group customer-form-full">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional customer notes..."
                  />
                </div>
              </div>

              <div className="customer-modal-actions">
                <button type="button" className="customer-cancel-btn" onClick={closeModal}>
                  Cancel
                </button>

                <button type="submit" className="customer-save-btn">
                  {editIndex !== null ? "Save Changes" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

   
      {showPackageModal && packageCustomer && (
  <div className="customer-modal-backdrop" onClick={closePackageModal}>
    <div className="customer-modal" onClick={(event) => event.stopPropagation()}>
      <div className="customer-modal-header">
        <div>
          <h3>Add Package</h3>
          <p>Add a new internet package for {packageCustomer.customerName}.</p>
        </div>

        <button type="button" onClick={closePackageModal}>
          ×
        </button>
      </div>

      <form onSubmit={saveCustomerPackage}>
        <div className="customer-form-grid">

        <div className="customer-form-group customer-form-full">
          <label>Select Package</label>
          <select
            value={packageForm.packageId}
            onChange={handleSelectedPackageChange}
            required
          >
            <option value="">Select Package</option>

            {packages
              .filter((item) => item.status === "Active")
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.packageCode || "No Code"} - {item.packageName} - {item.speed} -{" "}
                  {money(item.monthlyPrice)} AFN
                </option>
              ))}
          </select>
        </div>

        <div className="customer-form-group">
          <label>Package Name</label>
          <input value={packageForm.packageName} readOnly />
        </div>

        <div className="customer-form-group">
          <label>Speed</label>
          <input value={packageForm.speed} readOnly />
        </div>

        <div className="customer-form-group">
          <label>Package Price</label>
          <input value={`${money(packageForm.packagePrice)} AFN`} readOnly />
        </div>

          <div className="customer-form-group">
            <label>Package Price</label>
            <input
              type="number"
              min="0"
              name="packagePrice"
              value={packageForm.packagePrice}
              onChange={handlePackageChange}
              placeholder="Example: 1500"
              required
            />
          </div>

          <div className="customer-form-group">
            <label>Paid Amount</label>
            <input
              type="number"
              min="0"
              name="paidAmount"
              value={packageForm.paidAmount}
              onChange={handlePackageChange}
              placeholder="Example: 1000"
            />
          </div>

          <div className="customer-form-group">
            <label>Remain Amount</label>
            <input value={`${money(packageForm.remainAmount)} AFN`} readOnly />
          </div>

          <div className="customer-form-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={packageForm.startDate}
              onChange={handlePackageChange}
              required
            />
          </div>

          <div className="customer-form-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={packageForm.endDate}
              onChange={handlePackageChange}
              required
            />
          </div>

          <div className="customer-form-group">
            <label>Status</label>
            <select
              name="status"
              value={packageForm.status}
              onChange={handlePackageChange}
            >
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Paused">Paused</option>
            </select>
          </div>

          <div className="customer-form-group customer-form-full">
            <label>Notes</label>
            <textarea
              name="notes"
              value={packageForm.notes}
              onChange={handlePackageChange}
              placeholder="Package notes..."
            />
          </div>
        </div>

        <div className="customer-modal-actions">
          <button type="button" className="customer-cancel-btn" onClick={closePackageModal}>
            Cancel
          </button>

          <button type="submit" className="customer-save-btn">
            Save Package
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{showIssueDeviceModal && issueDeviceCustomer && (
  <div className="customer-modal-backdrop" onClick={closeIssueDeviceModal}>
    <div className="customer-modal" onClick={(event) => event.stopPropagation()}>
      <div className="customer-modal-header">
        <div>
          <h3>Issue Device</h3>
          <p>
            Give, sell, or loan a device to {getCustomerName(issueDeviceCustomer)}.
          </p>
        </div>

        <button type="button" onClick={closeIssueDeviceModal}>
          ×
        </button>
      </div>

      <form onSubmit={saveIssueDevice}>
        <div className="customer-form-grid">
          <div className="customer-form-group">
            <label>Transfer Type</label>
            <select
              name="sourceType"
              value={issueDeviceForm.sourceType}
              onChange={handleIssueDeviceChange}
            >
              <option value="Main Stock">Main Stock to Customer</option>
              <option value="Customer">Customer to Customer</option>
            </select>
          </div>

          {issueDeviceForm.sourceType === "Customer" && (
            <div className="customer-form-group">
              <label>From Customer</label>
              <select
                name="fromCustomerId"
                value={issueDeviceForm.fromCustomerId}
                onChange={handleIssueDeviceChange}
                required
              >
                <option value="">Select Source Customer</option>

                {customers
                  .filter(
                    (customer) =>
                      String(customer.id) !== String(issueDeviceCustomer.id)
                  )
                  .map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customerId || "No ID"} - {getCustomerName(customer)}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="customer-form-group customer-form-full">
            <label>Select Device</label>
            <select
              name="assetKey"
              value={issueDeviceForm.assetKey}
              onChange={handleIssueDeviceChange}
              required
            >
              <option value="">Select Device</option>

              {availableIssueAssets.map((asset) => (
                <option key={getAssetKey(asset)} value={getAssetKey(asset)}>
                  {getAssetLabel(asset)}
                </option>
              ))}
            </select>
          </div>

          {selectedIssueAsset && (
            <div className="customer-selected-device customer-form-full">
              <div>
                <span>Asset ID</span>
                <strong>{selectedIssueAsset.assetId || "-"}</strong>
              </div>
              <div>
                <span>Device Name</span>
                <strong>{selectedIssueAsset.deviceName || "-"}</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>{selectedIssueAsset.category || "-"}</strong>
              </div>
              <div>
                <span>MAC Address</span>
                <strong>{selectedIssueAsset.macAddress || "-"}</strong>
              </div>
              <div>
                <span>Serial Number</span>
                <strong>{selectedIssueAsset.serialNumber || "-"}</strong>
              </div>
              <div>
                <span>Current Status</span>
                <strong>{selectedIssueAsset.status || "-"}</strong>
              </div>
            </div>
          )}

          <div className="customer-form-group">
            <label>Issue Date</label>
            <input
              type="date"
              name="issueDate"
              value={issueDeviceForm.issueDate}
              onChange={handleIssueDeviceChange}
              required
            />
          </div>

          <div className="customer-form-group">
            <label>Device Status</label>
            <select
              name="issueStatus"
              value={issueDeviceForm.issueStatus}
              onChange={handleIssueDeviceChange}
            >
              <option value="Issued">Issued</option>
              <option value="Installed">Installed</option>
            </select>
          </div>

          <div className="customer-form-group">
            <label>Ownership Type</label>
            <select
              name="ownershipType"
              value={issueDeviceForm.ownershipType}
              onChange={handleIssueDeviceChange}
            >
              <option value="Loaned">Loaned / Deposit</option>
              <option value="Sold">Sold</option>
            </select>
          </div>

          {issueDeviceForm.ownershipType === "Sold" && (
            <>
              <div className="customer-form-group">
                <label>Sale Price</label>
                <input
                  type="number"
                  min="0"
                  name="salePrice"
                  value={issueDeviceForm.salePrice}
                  onChange={handleIssueDeviceChange}
                  placeholder="Example: 2500"
                />
              </div>

              <div className="customer-form-group">
                <label>Paid Amount</label>
                <input
                  type="number"
                  min="0"
                  name="paidAmount"
                  value={issueDeviceForm.paidAmount}
                  onChange={handleIssueDeviceChange}
                  placeholder="Example: 1000"
                />
              </div>

              <div className="customer-form-group">
                <label>Remain Amount</label>
                <input
                  value={`${Number(issueDeviceForm.remainAmount || 0).toLocaleString("en-US")} AFN`}
                  readOnly
                />
              </div>
            </>
          )}

          {issueDeviceForm.ownershipType === "Loaned" && (
            <>
              <div className="customer-form-group">
                <label>Security Deposit Amount</label>
                <input
                  type="number"
                  min="0"
                  name="depositAmount"
                  value={issueDeviceForm.depositAmount}
                  onChange={handleIssueDeviceChange}
                  placeholder="Example: 1000"
                />
              </div>

              <div className="customer-form-group">
                <label>Deposit Status</label>
                <select
                  name="depositStatus"
                  value={issueDeviceForm.depositStatus}
                  onChange={handleIssueDeviceChange}
                >
                  <option value="Held">Held</option>
                  <option value="Refunded">Refunded</option>
                  <option value="Outstanding">Outstanding</option>
                </select>
              </div>
            </>
          )}

          <div className="customer-form-group customer-form-full">
            <label>Notes</label>
            <textarea
              name="notes"
              value={issueDeviceForm.notes}
              onChange={handleIssueDeviceChange}
              placeholder="Device issue notes..."
            />
          </div>
        </div>

        <div className="customer-modal-actions">
          <button
            type="button"
            className="customer-cancel-btn"
            onClick={closeIssueDeviceModal}
          >
            Cancel
          </button>

          <button type="submit" className="customer-save-btn">
            Save Device Issue
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {deleteIndex !== null && (
        <div className="customer-delete-backdrop" onClick={cancelDelete}>
          <div className="customer-delete-modal" onClick={(event) => event.stopPropagation()}>
            <div className="customer-delete-icon">
              <TrashIcon />
            </div>

            <h3>Delete Customer</h3>
            <p>Are you sure you want to delete this customer? This action cannot be undone.</p>

            <div className="customer-delete-actions">
              <button type="button" className="customer-delete-cancel" onClick={cancelDelete}>
                Cancel
              </button>

              <button type="button" className="customer-delete-confirm" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
