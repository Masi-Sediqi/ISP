import { projectUniqueCode, localSaleDate, salePlanEndDate } from './projectSalePlans.js';
import { contractTemplateId, visaContractDefaults, VISA_CONTRACT_FIELDS, STANDALONE_SOFTWARE_FIELDS } from './contractTemplates.js';

export function contractItems(sale) {
  return sale.items?.length ? sale.items : [{ projectId: sale.projectId, projectName: sale.projectName, projectCode: sale.projectCode, salePlan: sale.salePlan, startDate: sale.startDate || sale.saleDate, endDate: sale.endDate, total: sale.total ?? sale.price, currency: sale.currency }];
}

export function contractNumber(sale) { return sale.contractId || `CTR-${sale.id}`; }

export function contractDefaults(sale, customer = {}, templateId = contractTemplateId(sale)) {
  const saved = sale.contractDetailsByTemplate?.[templateId] || (contractTemplateId(sale) === templateId ? sale.contractDetails : {}) || {};
  if (templateId === 'turkey-visa') return { ...visaContractDefaults(sale, customer), ...saved };
  return { buyerName: sale.customerName || customer.fullName || customer.customerName || customer.name || '',
    buyerIdNumber: customer.idNumber || customer.tazkiraNumber || customer.businessLicense || '',
    representative: customer.representative || '', address: customer.address || '',
    phone: sale.customerPhone || customer.phone || customer.customerPhone || '',
    systemType: '', systemVersion: '', acceptanceDays: '', supportDuration: '',
    paymentDueDate: '', contractDate: sale.saleDate || String(sale.createdAt || '').slice(0, 10),
    features: '', ...(sale.contractStandalone ? { projectName: sale.projectName || '', salePlan: sale.salePlan || 'lifetime', startDate: sale.startDate || localSaleDate(), currency: sale.currency || 'AFN', totalAmount: String(sale.total ?? ''), paidAmount: String(sale.paid ?? 0) } : {}), ...saved };
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

export const contractFields = (templateId, standalone = false) => templateId === 'turkey-visa' ? VISA_CONTRACT_FIELDS : [...(standalone ? STANDALONE_SOFTWARE_FIELDS : []), ...CONTRACT_FIELDS];
export function validateContract(details, templateId = 'software-sale', standalone = false) {
  for (const [key, label] of contractFields(templateId, standalone)) {
    if (!String(details[key] ?? '').trim()) return `${label} is required.`;
  }
  if (templateId === 'turkey-visa') {
    const total = Number(details.totalAmount), paid = Number(details.paidAmount);
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(paid) || paid !== 0) return 'Enter a positive USD service fee. This visa template specifies no advance payment.';
  } else if (!Number.isInteger(Number(details.acceptanceDays)) || Number(details.acceptanceDays) < 1) return 'Acceptance period must be a positive whole number.';
  if (templateId === 'software-sale' && standalone) {
    const total = Number(details.totalAmount), paid = Number(details.paidAmount);
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(paid) || paid < 0 || paid > total) return 'Enter a positive total and a paid amount between zero and the total.';
    if (!['one-month', 'three-months', 'six-months', 'lifetime'].includes(details.salePlan)) return 'Choose a valid usage plan.';
    if (!['AFN', 'USD', 'EUR'].includes(details.currency)) return 'Choose a supported currency.';
    if (details.salePlan !== 'lifetime' && !salePlanEndDate(details.startDate, details.salePlan)) return 'Choose a valid start date.';
  }
  for (const key of templateId === 'turkey-visa' ? ['contractDate'] : ['contractDate', 'paymentDueDate', ...(standalone ? ['startDate'] : [])]) {
    const value = String(details[key]);
    const date = new Date(`${value}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return 'Enter valid contract and payment dates.';
  }
  return '';
}

export function standaloneSoftwareRecord(record, details) {
  const endDate = salePlanEndDate(details.startDate, details.salePlan);
  const total = Number(details.totalAmount), paid = Number(details.paidAmount);
  const item = { projectId: record.id, projectCode: projectUniqueCode(record.id), projectName: details.projectName,
    salePlan: details.salePlan, startDate: details.startDate, endDate, currency: details.currency, price: total, total, quantity: 1 };
  return { ...record, ...item, total, paid, remaining: total - paid, items: [item] };
}

export const contractPlanLabel = plan => ({ 'one-month': 'یک ماه', 'three-months': 'سه ماه', 'six-months': 'شش ماه', lifetime: 'دایمی' }[plan] || 'مطابق مشخصات فروش');
export const contractProjectCode = item => item.projectCode || projectUniqueCode(item.projectId || item.projectName);
