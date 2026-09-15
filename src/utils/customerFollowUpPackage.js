function normalizeYesNo(value) {
  return String(value || '').trim().toLowerCase() === 'yes';
}

function idOf(item) {
  return String(item?.id || item?._id || item?.packageId || '');
}

function findById(items, id) {
  const key = String(id || '');
  if (!key) return null;
  return (Array.isArray(items) ? items : []).find((item) => idOf(item) === key) || null;
}

export function resolveFollowUpPackageRequirements({ customer, visaPackages = [], travelPackages = [] }) {
  const customerType = String(customer?.customerType || '').trim().toLowerCase();
  const packageId =
    customerType === 'travel'
      ? customer?.selectedTravelPackageId || customer?.travelPackageId || customer?.selectedPackageId
      : customer?.selectedVisaPackageId || customer?.visaPackageId || customer?.selectedPackageId;

  const packageItem =
    customerType === 'travel'
      ? findById(travelPackages, packageId)
      : findById(visaPackages, packageId);

  const documentationValue =
    packageItem?.documentationRequired ??
    customer?.packageDocumentationRequired ??
    customer?.documentationRequired ??
    '';

  const bankStatementValue =
    packageItem?.bankStatementRequired ??
    customer?.packageBankStatementRequired ??
    customer?.bankStatementRequired ??
    '';

  const documentationRequired = normalizeYesNo(documentationValue);
  const bankStatementRequired = normalizeYesNo(bankStatementValue);

  const sourceDocuments = Array.isArray(packageItem?.documents)
    ? packageItem.documents
    : Array.isArray(customer?.packageDocuments)
      ? customer.packageDocuments
      : Array.isArray(customer?.documents)
        ? customer.documents
        : [];

  const requiredDocuments = documentationRequired
    ? [...new Set(sourceDocuments.map((item) => String(item || '').trim()).filter(Boolean))]
    : [];

  const bankStatementAmount = Number(
    packageItem?.bankStatementAmount ?? customer?.packageBankStatementAmount ?? customer?.bankStatementAmount ?? 0
  );

  return {
    packageItem,
    documentationRequired,
    requiredDocuments,
    bankStatementRequired,
    bankStatementAmount: Number.isFinite(bankStatementAmount) ? bankStatementAmount : 0,
  };
}
