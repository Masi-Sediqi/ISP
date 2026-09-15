const numberValue = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const isSalaryAccrualEntry = (entry) =>
  entry?.type === 'salary' && entry?.source === 'employee-payroll-accrual';

export const isLegacySalaryPaymentEntry = (entry) =>
  entry?.type === 'salary' && !isSalaryAccrualEntry(entry);

export const isCreditLedgerEntry = (entry) =>
  entry?.type === 'credit' ||
  entry?.type === 'receive_from_employee' ||
  entry?.type === 'bonus' ||
  isSalaryAccrualEntry(entry);

export function calculateEmployeeLedgerSummary({ payrolls = [], adjustments = [] } = {}) {
  const totalBonus = adjustments
    .filter((item) => item.type === 'bonus')
    .reduce((sum, item) => sum + numberValue(item.amount), 0);

  const totalPenalty = adjustments
    .filter((item) => item.type === 'penalty')
    .reduce((sum, item) => sum + numberValue(item.amount), 0);

  const totalCreditOnly = adjustments
    .filter((item) => item.type === 'credit')
    .reduce((sum, item) => sum + numberValue(item.amount), 0);

  const totalDebitOnly = adjustments
    .filter((item) => item.type === 'debit')
    .reduce((sum, item) => sum + numberValue(item.amount), 0);

  const totalReceivedFromEmployee = adjustments
    .filter((item) => item.type === 'receive_from_employee')
    .reduce((sum, item) => sum + numberValue(item.amount), 0);

  const totalPayrollDue = payrolls.reduce(
    (sum, item) => sum + numberValue(item.expectedAmount ?? item.amount),
    0
  );

  const totalPayments = adjustments
    .filter((item) =>
      item.type === 'paid_to_employee' ||
      item.type === 'paid' ||
      isLegacySalaryPaymentEntry(item)
    )
    .reduce((sum, item) => sum + numberValue(item.amount), 0);

  const totalCredit =
    totalCreditOnly +
    totalReceivedFromEmployee +
    totalBonus +
    totalPayrollDue;
  const totalDebit = totalDebitOnly + totalPenalty + totalPayments;

  return {
    totalBonus,
    totalPenalty,
    totalCreditOnly,
    totalDebitOnly,
    totalReceivedFromEmployee,
    totalPayrollDue,
    totalPayments,
    totalCredit,
    totalDebit,
    balance: totalCredit - totalDebit,
  };
}
