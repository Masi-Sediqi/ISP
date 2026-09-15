const key = (value) => String(value || "");
const lower = (value) => key(value).trim().toLowerCase();

export function buildCashWalletDeletion({
  target,
  walletTransactions = [],
  employeeAdjustments = [],
  transactions = [],
  projectSales = [],
  now = new Date().toISOString(),
}) {
  if (!target?.id) {
    return {
      walletTransactions,
      employeeAdjustments,
      transactions,
      projectSales,
      source: "",
    };
  }

  const source = lower(target.source);
  const referenceId = key(target.referenceId);

  const nextWalletTransactions = walletTransactions.filter(
    (item) => key(item?.id) !== key(target.id)
  );

  let nextEmployeeAdjustments = employeeAdjustments;
  let nextTransactions = transactions;
  let nextProjectSales = projectSales;

  if (source === "employee-paid" || source === "employee-payroll") {
    nextEmployeeAdjustments = employeeAdjustments.filter((item) => {
      const linkedByRecord = referenceId && key(item?.id) === referenceId;
      const linkedByWallet = key(item?.walletTransactionId) === key(target.id);
      return !(linkedByRecord || linkedByWallet);
    });

    nextTransactions = transactions.filter((item) => {
      const sameSource = ["employee-paid", "employee-payroll"].includes(lower(item?.source));
      const linkedByRecord = referenceId && key(item?.referenceId) === referenceId;
      return !(sameSource && linkedByRecord);
    });
  }

  if (source === "project-sale") {
    nextTransactions = transactions.filter(
      (item) =>
        !(
          lower(item?.source) === "project-sale" &&
          key(item?.referenceId) === referenceId
        )
    );

    nextEmployeeAdjustments = employeeAdjustments.filter(
      (item) =>
        !(
          lower(item?.source) === "project-sale-commission" &&
          key(item?.referenceId) === referenceId
        )
    );

    nextProjectSales = projectSales.map((sale) => {
      if (key(sale?.id) !== referenceId) return sale;
      const total = Number(sale?.total ?? sale?.price ?? 0) || 0;
      return {
        ...sale,
        paid: "0",
        paidAmount: 0,
        remaining: String(total),
        remainingAmount: total,
        paymentMode: "loan",
        paymentStatus: "loan",
        updatedAt: now,
      };
    });
  }

  return {
    walletTransactions: nextWalletTransactions,
    employeeAdjustments: nextEmployeeAdjustments,
    transactions: nextTransactions,
    projectSales: nextProjectSales,
    source,
  };
}
