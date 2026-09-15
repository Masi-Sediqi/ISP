import { calculateEmployeeLedgerSummary } from './employeeLedgerLogic.js';

const asList = (value) => Array.isArray(value) ? value : [];
const asTime = (value) => {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
};
const employeeName = (employee) =>
  String(employee?.fullName || `${employee?.firstName || ''} ${employee?.lastName || ''}`)
    .trim() || 'Employee';

export function calculateStaffPayables({ employees = [], payrolls = [], adjustments = [] } = {}) {
  const payrollList = asList(payrolls);
  const adjustmentList = asList(adjustments);

  const items = asList(employees)
    .map((employee) => {
      const employeeId = String(employee?.id || '');
      const employeePayrolls = payrollList.filter(
        (item) => String(item?.employeeId || '') === employeeId
      );
      const employeeAdjustments = adjustmentList.filter(
        (item) => String(item?.employeeId || '') === employeeId
      );
      const summary = calculateEmployeeLedgerSummary({
        payrolls: employeePayrolls,
        adjustments: employeeAdjustments,
      });
      const activity = [...employeePayrolls, ...employeeAdjustments]
        .sort((a, b) => asTime(b?.updatedAt || b?.createdAt || b?.date) - asTime(a?.updatedAt || a?.createdAt || a?.date))[0];

      return {
        employeeId,
        employee,
        employeeName: employeeName(employee),
        balance: Number(summary.balance || 0),
        totalPayroll: Number(summary.totalPayrollDue || 0),
        totalPaid: Number(summary.totalPayments || 0),
        totalBonus: Number(summary.totalBonus || 0),
        totalPenalty: Number(summary.totalPenalty || 0),
        lastActivityAt: activity?.updatedAt || activity?.createdAt || activity?.date || '',
      };
    })
    .filter((item) => item.balance > 0)
    .sort((a, b) => asTime(b.lastActivityAt) - asTime(a.lastActivityAt));

  return {
    totalPayable: items.reduce((sum, item) => sum + item.balance, 0),
    items,
  };
}

export function calculateStaffPayablesByCurrency({ employees = [], payrolls = [], adjustments = [] } = {}) {
  const currencies = ['AFN', 'USD', 'EUR'];
  const normalizeCurrency = (value) => {
    const code = String(value || 'AFN').trim().toUpperCase();
    return currencies.includes(code) ? code : 'AFN';
  };
  const totals = { AFN: 0, USD: 0, EUR: 0 };
  const items = [];

  asList(employees).forEach((employee) => {
    const employeeId = String(employee?.id || '');
    const employeePayrolls = asList(payrolls).filter((item) => String(item?.employeeId || '') === employeeId);
    const employeeAdjustments = asList(adjustments).filter((item) => String(item?.employeeId || '') === employeeId);
    const balances = { AFN: 0, USD: 0, EUR: 0 };

    const summaries = {};
    currencies.forEach((currency) => {
      const summary = calculateEmployeeLedgerSummary({
        payrolls: employeePayrolls.filter((item) => normalizeCurrency(item?.currency || item?.unit) === currency),
        adjustments: employeeAdjustments.filter((item) => normalizeCurrency(item?.currency || item?.unit) === currency),
      });
      summaries[currency] = summary;
      balances[currency] = Number(summary.balance || 0);
      if (balances[currency] > 0) totals[currency] += balances[currency];
    });

    if (currencies.some((currency) => balances[currency] > 0)) {
      const activity = [...employeePayrolls, ...employeeAdjustments]
        .sort((a, b) => asTime(b?.updatedAt || b?.createdAt || b?.date) - asTime(a?.updatedAt || a?.createdAt || a?.date))[0];
      items.push({
        employeeId,
        employee,
        employeeName: employeeName(employee),
        balances,
        summaries,
        lastActivityAt: activity?.updatedAt || activity?.createdAt || activity?.date || '',
      });
    }
  });

  return { totals, items };
}
