const DAY_MS = 24 * 60 * 60 * 1000;

const toDateOnly = (value) => {
  const text = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateOnly = (date) => date.toISOString().slice(0, 10);

export function getPayrollPeriod(mode, anchorDate = new Date().toISOString().slice(0, 10)) {
  const anchor = toDateOnly(anchorDate) || toDateOnly(new Date().toISOString().slice(0, 10));

  if (mode === 'daily') {
    const date = formatDateOnly(anchor);
    return { startDate: date, endDate: date };
  }

  if (mode === 'weekly') {
    const end = new Date(anchor.getTime() + 6 * DAY_MS);
    return { startDate: formatDateOnly(anchor), endDate: formatDateOnly(end) };
  }

  if (mode === 'monthly') {
    const year = anchor.getUTCFullYear();
    const month = anchor.getUTCMonth();
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0));
    return { startDate: formatDateOnly(start), endDate: formatDateOnly(end) };
  }

  return { startDate: formatDateOnly(anchor), endDate: formatDateOnly(anchor) };
}

export function calculatePayrollExpectedAmount(monthlySalary, mode, startDate, endDate) {
  const salary = Number(monthlySalary || 0);
  if (!Number.isFinite(salary) || salary <= 0) return 0;

  const daily = salary / 30;
  if (mode === 'daily') return daily;
  if (mode === 'weekly') return daily * 7;
  if (mode === 'monthly') return salary;

  if (mode === 'custom') {
    const start = toDateOnly(startDate);
    const end = toDateOnly(endDate);
    if (!start || !end || end < start) return 0;
    const inclusiveDays = Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
    return daily * inclusiveDays;
  }

  return 0;
}

export function roundPayrollAmount(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
