import { projectUniqueCode } from './projectSalePlans.js';

export function contractItems(sale) {
  return sale.items?.length ? sale.items : [{ projectId: sale.projectId, projectName: sale.projectName, projectCode: sale.projectCode, salePlan: sale.salePlan, startDate: sale.startDate || sale.saleDate, endDate: sale.endDate, total: sale.total ?? sale.price, currency: sale.currency }];
}

export function contractNumber(sale) { return sale.contractId || `CTR-${sale.id}`; }

export function contractDefaults(sale, customer = {}) {
  return { buyerName: sale.customerName || customer.fullName || customer.customerName || customer.name || '',
    buyerIdNumber: customer.idNumber || customer.tazkiraNumber || customer.businessLicense || '',
    representative: customer.representative || '', address: customer.address || '',
    phone: sale.customerPhone || customer.phone || customer.customerPhone || '',
    systemType: '', systemVersion: '', acceptanceDays: '', supportDuration: '',
    paymentDueDate: '', contractDate: sale.saleDate || String(sale.createdAt || '').slice(0, 10),
    features: '', ...sale.contractDetails };
}

export const CONTRACT_FIELDS = [
  ['buyerName', 'Buyer / Company name'], ['buyerIdNumber', 'Tazkira / Business license number'],
  ['representative', 'Authorized representative'], ['address', 'Address'], ['phone', 'Phone'],
  ['systemType', 'System type'], ['systemVersion', 'System version'],
  ['contractDate', 'Contract date', 'date'], ['paymentDueDate', 'Payment due date', 'date'],
  ['acceptanceDays', 'Acceptance period (working days)', 'number'],
  ['supportDuration', 'Support duration (include days / months / years)'],
  ['features', 'Included features / Appendix 1', 'textarea'],
];

export function validateContract(details) {
  for (const [key, label] of CONTRACT_FIELDS) {
    if (!String(details[key] ?? '').trim()) return `${label} is required.`;
  }
  if (!Number.isInteger(Number(details.acceptanceDays)) || Number(details.acceptanceDays) < 1) return 'Acceptance period must be a positive whole number.';
  for (const key of ['contractDate', 'paymentDueDate']) {
    const value = String(details[key]);
    const date = new Date(`${value}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return 'Enter valid contract and payment dates.';
  }
  return '';
}

export const contractPlanLabel = plan => ({ 'one-month': 'یک ماه', 'three-months': 'سه ماه', 'six-months': 'شش ماه', lifetime: 'دایمی' }[plan] || 'مطابق مشخصات فروش');
export const contractProjectCode = item => item.projectCode || projectUniqueCode(item.projectId || item.projectName);
