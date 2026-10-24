export const CONTRACT_TEMPLATES = [
  { id: 'software-sale', name: 'Software Sale Agreement', description: 'قرارداد فروش سیستم نرم‌افزاری', file: 'contract-template.pdf', thumbnail: 'contracts/software-preview.png', pages: 4 },
  { id: 'turkey-visa', name: 'Turkey Tourist Visa', description: 'قرارداد خدمات ویزای سیاحتی سه‌ماههٔ ترکیه', file: 'contracts/turkey-visa.pdf', thumbnail: 'contracts/turkey-visa-preview.png', pages: 3 },
];
export const getContractTemplate = id => CONTRACT_TEMPLATES.find(template => template.id === (id || 'software-sale'));
export const contractTemplateId = record => record.contractTemplateId || 'software-sale';
export const STANDALONE_SOFTWARE_FIELDS = [
  ['projectName', 'System / Project name'],
  ['salePlan', 'Usage plan', 'select', [['one-month', '1 Month'], ['three-months', '3 Months'], ['six-months', '6 Months'], ['lifetime', 'Lifetime']]],
  ['startDate', 'Start date', 'date'],
  ['currency', 'Currency', 'select', [['AFN', 'AFN'], ['USD', 'USD'], ['EUR', 'EUR']]],
  ['totalAmount', 'Contract total', 'number'], ['paidAmount', 'Advance paid', 'number'],
];
export const VISA_CONTRACT_FIELDS = [
  ['buyerName', 'Applicant full name'], ['fatherName', 'Father name'],
  ['buyerIdNumber', 'Tazkira / Passport number'], ['phone', 'Phone'], ['address', 'Current address'],
  ['contractDate', 'Contract date', 'date'], ['totalAmount', 'Total service fee (USD)', 'number'],
  ['paymentMethod', 'Payment method (customer money exchanger)'],
  ['exchangeName', 'Customer money exchanger name'], ['exchangeAddress', 'Money exchanger address'],
  ['exchangeLicense', 'Money exchanger license number'],
];
export function visaContractDefaults(record, customer = {}) {
  return { buyerName: record.customerName || customer.fullName || customer.customerName || customer.name || '',
    fatherName: customer.fatherName || '', buyerIdNumber: customer.passportNumber || customer.tazkiraNumber || customer.idNumber || '',
    phone: record.customerPhone || customer.phone || '', address: customer.address || '',
    contractDate: record.saleDate || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kabul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
    totalAmount: record.currency === 'USD' ? String(record.total ?? record.price ?? '') : '',
    paidAmount: '0',
    paymentMethod: 'صراف مشتری - بدون پیش‌پرداخت', exchangeName: '', exchangeAddress: '', exchangeLicense: '' };
}
