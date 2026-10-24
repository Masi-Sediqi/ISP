export function customerDisplayName(customer) {
  return (
    customer?.customerName ||
    customer?.fullName ||
    customer?.name ||
    customer?.passportFullName ||
    customer?.personName ||
    customer?.phone ||
    "Unnamed Customer"
  );
}

export function filterCustomers(customers, query) {
  const search = String(query || "").trim().toLowerCase();
  const rows = Array.isArray(customers) ? customers : [];
  if (!search) return rows.slice(0, 20);
  return rows
    .filter((customer) =>
      [
        customerDisplayName(customer),
        customer?.phone,
        customer?.customerPhone,
        customer?.customerId,
        customer?.id,
      ].some((value) => String(value || "").toLowerCase().includes(search))
    )
    .slice(0, 30);
}

export function calculateSalePayment(totalValue, mode, paidValue) {
  const total = Math.max(0, Number(totalValue || 0));
  if (mode !== "loan") {
    return { paidAmount: total, remainingAmount: 0, paymentStatus: "paid" };
  }

  const paidAmount = Math.min(total, Math.max(0, Number(paidValue || 0)));
  const remainingAmount = Math.max(0, total - paidAmount);
  return {
    paidAmount,
    remainingAmount,
    paymentStatus: remainingAmount > 0 ? "loan" : "paid",
  };
}

export function salePaymentSummary(sale) {
  const total = Number(sale?.total ?? sale?.price ?? 0);
  const paid = Number(sale?.paid ?? total);
  const storedRemaining = sale?.remaining;
  const remaining =
    storedRemaining === undefined || storedRemaining === null || storedRemaining === ""
      ? Math.max(0, total - paid)
      : Math.max(0, Number(storedRemaining || 0));

  return {
    total,
    paid,
    remaining,
    currency: sale?.currency || "AFN",
  };
}

export function saleToEditableForm(sale) {
  const items =
    Array.isArray(sale?.items) && sale.items.length
      ? sale.items
      : [
          {
            projectId: sale?.projectId,
            projectName: sale?.projectName || "Project",
            price: sale?.price,
            quantity: sale?.quantity,
            discount: sale?.discount,
            currency: sale?.currency,
          },
        ];

  return {
    items: items.map((item) => ({
      projectId: String(item.projectId || item.projectName || ""),
      projectName: item.projectName || "Project",
      price: Number(item.price || 0),
      quantity: Math.max(1, Number(item.quantity || 1)),
      discount: Number(item.discount || 0),
      currency: item.currency || sale?.currency || "AFN",
      saleType: item.saleType === "license" ? "license" : "lifetime",
      basePrice: Number(item.basePrice ?? item.price ?? 0),
      baseCurrency: item.baseCurrency || item.currency || sale?.currency || "AFN",
      licensePackageId: item.licensePackageId || "",
      licensePackageName: item.licensePackageName || "",
    })),
    customer: {
      customerId: sale?.customerId || "",
      customerName: sale?.customerName || "",
      customerPhone: sale?.customerPhone || "",
      notes: sale?.notes || "",
    },
    paymentMode: sale?.paymentMode === "loan" ? "loan" : "paid",
    loanPaidAmount: String(sale?.paid || ""),
  };
}

export function buildSaleItem(project) {
  const price = Number(project?.budget || project?.price || project?.amount || 0);
  const currency = project?.currency || "AFN";
  return {
    projectId: String(project?.id || project?.projectId || project?.projectName || ""),
    projectName: project?.projectName || "Project",
    price,
    discount: 0,
    quantity: 1,
    currency,
    saleType: "lifetime",
    basePrice: price,
    baseCurrency: currency,
    licensePackageId: "",
    licensePackageName: "",
  };
}

export function applySaleType(item, saleType) {
  if (saleType === "license") {
    return {
      ...item,
      saleType: "license",
      price: 0,
      licensePackageId: "",
      licensePackageName: "",
    };
  }
  return {
    ...item,
    saleType: "lifetime",
    price: Number(item?.basePrice ?? item?.price ?? 0),
    currency: item?.baseCurrency || item?.currency || "AFN",
    licensePackageId: "",
    licensePackageName: "",
  };
}

export function applyLicensePackage(item, pkg) {
  return {
    ...item,
    saleType: "license",
    licensePackageId: String(pkg?.id || pkg?.packageId || ""),
    licensePackageName: pkg?.packageName || "License",
    price: Number(pkg?.sellingPrice || 0),
    currency: pkg?.currency || item?.currency || "AFN",
  };
}
