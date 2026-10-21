export const PROJECT_SALE_PLANS = [
  ['one-month', '1 Month'], ['three-months', '3 Months'],
  ['six-months', '6 Months'], ['lifetime', 'Lifetime'],
];

export function projectUniqueCode(projectId) {
  return `PRJ-${encodeURIComponent(String(projectId))}`;
}

export function salePlanEndDate(startDate, plan) {
  if (!startDate || plan === 'lifetime') return '';
  const months = { 'one-month': 1, 'three-months': 3, 'six-months': 6 }[plan];
  if (!months) return '';
  const date = new Date(`${startDate}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== startDate) return '';
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}

export function updateSalePlan(item, changes) {
  const next = { ...item, ...changes };
  return { ...next, saleType: next.salePlan === 'lifetime' ? 'lifetime' : 'license',
    endDate: salePlanEndDate(next.startDate, next.salePlan) };
}

export function localSaleDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kabul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
