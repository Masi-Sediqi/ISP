import { normalizeCustomerName, normalizeCustomerPhone } from './customerIdentity.js';

export function isCallCenter(employee) {
  return [employee?.role, ...(Array.isArray(employee?.roles) ? employee.roles : [])].some((role) => String(role || '').toLowerCase().replace(/[\s_-]/g, '') === 'callcenter');
}

export function hasContractTarget(employee) {
  return isCallCenter(employee) && employee?.salaryType === 'fixed' && Number.isSafeInteger(Number(employee?.monthlyContractTarget)) && Number(employee?.monthlyContractTarget) > 0;
}

export function kabulDate(value) {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kabul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function belongsToEmployee(customer, employee, accountId) {
  // An explicitly attributed referral takes priority over whoever entered the record.
  if (customer.sourceEmployeeId) return String(customer.sourceEmployeeId) === String(employee?.id || '');
  if (customer.createdByAccountId) return Boolean(accountId) && String(customer.createdByAccountId) === String(accountId);
  const source = normalizeCustomerName(customer.sourceEmployeeName || customer.source || customer.createdByName || '');
  return Boolean(source && employee?.fullName) && source === normalizeCustomerName(employee.fullName);
}

function matchesCustomer(project, customer) {
  if (project.customerId) return String(project.customerId) === String(customer.id || customer.customerId || '');
  const name = normalizeCustomerName(project.customerName || project.fullName || '');
  const phone = normalizeCustomerPhone(project.customerPhone || project.phone || '');
  return Boolean(name && phone) && name === normalizeCustomerName(customer.fullName || customer.passportFullName || customer.personName || '') && phone === normalizeCustomerPhone(customer.phone || '');
}

export function getCallCenterEvents({ employee, accountId, customers = [], projects = [], visits = [] }) {
  const seen = new Set();
  return customers.filter((customer) => {
    const id = String(customer.id || customer.customerId || '');
    if (!id || seen.has(id) || !belongsToEmployee(customer, employee, accountId)) return false;
    seen.add(id);
    return true;
  }).map((customer) => {
    const contracts = projects.filter((project) => !['cancelled', 'canceled', 'draft'].includes(String(project.status || '').toLowerCase()) && matchesCustomer(project, customer));
    const dates = contracts.map((project) => kabulDate(project.contractDate || project.date || project.createdAt || project.startDate)).filter(Boolean).sort();
    return {
      customerId: customer.id || customer.customerId,
      name: customer.fullName || customer.passportFullName || customer.personName || '-',
      introducedDate: kabulDate(customer.createdAt || customer.date || customer.afghanistanDate),
      contractDate: dates[0] || '',
      visitDates: [...new Set(visits.filter((visit) => matchesCustomer(visit, customer)).map((visit) => kabulDate(visit.date || visit.createdAt)).filter(Boolean))].sort(),
    };
  });
}

export function targetSalaryForPeriod(employee, events, startDate, endDate) {
  if (!hasContractTarget(employee) || !startDate || !endDate || endDate < startDate) return 0;
  const target = Number(employee.monthlyContractTarget);
  const salary = Math.max(0, Number(employee.fixedSalary) || 0);
  const months = new Set(events.map((event) => event.contractDate.slice(0, 7)).filter(Boolean));
  let amount = 0;
  for (const month of months) {
    const dates = events.map((event) => event.contractDate).filter((date) => date.startsWith(month)).sort();
    // Only the first target customers in each calendar month earn salary.
    amount += dates.slice(0, target).filter((date) => date >= startDate && date <= endDate).length * salary / target;
  }
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
