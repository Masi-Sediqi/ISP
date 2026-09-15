const safeList = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const supplierKey = (record) =>
  String(
    record?.supplierRecordId ||
      record?.supplierId ||
      record?.supplierIndex ||
      record?.supplierName ||
      "unknown"
  );

export function calculateSupplierPayable({ purchases = [], payments = [] } = {}) {
  const balances = new Map();

  const ensure = (key) => {
    if (!balances.has(key)) {
      balances.set(key, {
        purchaseValue: 0,
        purchasePaid: 0,
        openingWeOwe: 0,
        openingSupplierOwes: 0,
        paidToSupplier: 0,
        supplierPaidUs: 0,
      });
    }
    return balances.get(key);
  };

  safeList(purchases).forEach((purchase) => {
    const bucket = ensure(supplierKey(purchase));
    bucket.purchaseValue += Number(
      purchase.totalPurchaseValue ?? purchase.totalAmount ?? purchase.amount ?? 0
    );
    bucket.purchasePaid += Number(purchase.paidAmount ?? 0);
  });

  safeList(payments).forEach((payment) => {
    const bucket = ensure(supplierKey(payment));
    const isBalance =
      String(payment.recordType || payment.type || "").toLowerCase() === "balance";

    if (isBalance) {
      if (payment.balanceSide === "we_owe_supplier") {
        bucket.openingWeOwe += Number(payment.amount || 0);
      } else if (payment.balanceSide === "supplier_owes_us") {
        bucket.openingSupplierOwes += Number(payment.amount || 0);
      }
      return;
    }

    if (payment.direction === "supplier_pays_us") {
      bucket.supplierPaidUs += Number(payment.amount || 0);
    } else {
      bucket.paidToSupplier += Number(payment.amount || 0);
    }
  });

  let total = 0;
  balances.forEach((bucket) => {
    const balance =
      bucket.purchaseValue +
      bucket.openingWeOwe +
      bucket.supplierPaidUs -
      bucket.purchasePaid -
      bucket.paidToSupplier -
      bucket.openingSupplierOwes;

    if (balance > 0) total += balance;
  });

  return total;
}

export function calculateSupplierPayableByCurrency({ purchases = [], payments = [] } = {}) {
  const currencies = ['AFN', 'USD', 'EUR'];
  const normalizeCurrency = (value) => {
    const code = String(value || 'AFN').trim().toUpperCase();
    return currencies.includes(code) ? code : 'AFN';
  };
  const totals = { AFN: 0, USD: 0, EUR: 0 };
  const keys = new Set([
    ...safeList(purchases).map(supplierKey),
    ...safeList(payments).map(supplierKey),
  ]);

  keys.forEach((key) => {
    currencies.forEach((currency) => {
      const currencyPurchases = safeList(purchases).filter(
        (item) => supplierKey(item) === key && normalizeCurrency(item?.currency || item?.unit) === currency
      );
      const currencyPayments = safeList(payments).filter(
        (item) => supplierKey(item) === key && normalizeCurrency(item?.currency || item?.unit) === currency
      );
      const balance = calculateSupplierPayable({ purchases: currencyPurchases, payments: currencyPayments });
      if (balance > 0) totals[currency] += balance;
    });
  });

  return totals;
}

export function calculateSupplierBalanceByCurrency({ purchases = [], payments = [] } = {}) {
  const currencies = ['AFN', 'USD', 'EUR'];
  const normalizeCurrency = (value) => {
    const code = String(value || 'AFN').trim().toUpperCase();
    return currencies.includes(code) ? code : 'AFN';
  };
  const balances = { AFN: 0, USD: 0, EUR: 0 };

  currencies.forEach((currency) => {
    const currencyPurchases = safeList(purchases).filter(
      (item) => normalizeCurrency(item?.currency || item?.unit) === currency
    );
    const currencyPayments = safeList(payments).filter(
      (item) => normalizeCurrency(item?.currency || item?.unit) === currency
    );

    const purchaseValue = currencyPurchases.reduce(
      (sum, purchase) => sum + Number(purchase.totalPurchaseValue ?? purchase.totalAmount ?? purchase.amount ?? 0),
      0
    );
    const purchasePaid = currencyPurchases.reduce(
      (sum, purchase) => sum + Number(purchase.paidAmount ?? 0),
      0
    );
    let openingWeOwe = 0;
    let openingSupplierOwes = 0;
    let paidToSupplier = 0;
    let supplierPaidUs = 0;

    currencyPayments.forEach((payment) => {
      const isBalance = String(payment.recordType || payment.type || '').toLowerCase() === 'balance';
      if (isBalance) {
        if (payment.balanceSide === 'we_owe_supplier') openingWeOwe += Number(payment.amount || 0);
        else if (payment.balanceSide === 'supplier_owes_us') openingSupplierOwes += Number(payment.amount || 0);
      } else if (payment.direction === 'supplier_pays_us') {
        supplierPaidUs += Number(payment.amount || 0);
      } else {
        paidToSupplier += Number(payment.amount || 0);
      }
    });

    balances[currency] = purchaseValue + openingWeOwe + supplierPaidUs - purchasePaid - paidToSupplier - openingSupplierOwes;
  });

  return balances;
}
