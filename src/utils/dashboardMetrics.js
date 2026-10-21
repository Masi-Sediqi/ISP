import { calculateSupplierPayable } from './supplierPayable.js';
import { calculateStaffPayablesByCurrency } from './staffPayable.js';
import { sumCurrencyAmounts, subtractCurrencyTotals } from './currencyDisplay.js';

const lower = value => String(value || '').trim().toLowerCase();
const name = item => item.fullName || item.customerName || item.name || `${item.firstName || ''} ${item.lastName || ''}`.trim() || '—';
const date = item => item.date || item.saleDate || item.paymentDate || item.purchaseDate || item.registrationDate || item.createdAt || '—';
const supplierKey = item => String(item.supplierRecordId ?? item.supplierId ?? item.supplierIndex ?? item.supplierName ?? 'unknown');
export const receivableAmount = sale => Math.max(0, Number(sale.remaining ?? sale.remainingAmount ?? sale.balance ?? (Number(sale.total ?? sale.price ?? 0) - Number(sale.paid ?? sale.total ?? sale.price ?? 0))) || 0);
export const isProgressingCustomer = customer => { const stage = lower(customer.customerStage); return Boolean(stage && !['none', 'approved', 'completed', 'rejected'].includes(stage)); };

// Cards and their detail tables consume the same rows and totals.
export function dashboardMetricRows(metric, data) {
  const { customers = [], employees = [], allEmployees = employees, transactions = [], projectSales = [], suppliers = [], supplierPurchases = [], supplierPayments = [], payrolls = [], adjustments = [], wallet = [] } = data;
  const person = (item, kind) => ({ id: item.id || item.customerId, primary: name(item), secondary: item.phone || item.department || item.position || '—', amount: '', status: item.customerStage || item.status || '—', date: date(item), path: `/${kind}/${encodeURIComponent(item.id || item.customerId || '')}` });
  if (metric === 'customers') return customers.map(item => person(item, 'customers'));
  if (metric === 'progressing-customers') return customers.filter(isProgressingCustomer).map(item => person(item, 'customers'));
  if (metric === 'active-employees') return employees.filter(item => lower(item.status) === 'active').map(item => person(item, 'employees'));
  if (metric === 'customer-receivable') return projectSales.filter(sale => receivableAmount(sale) > 0).map(sale => ({ id: sale.id, primary: sale.customerName || 'Customer', secondary: sale.projectName || 'Project sale', amount: receivableAmount(sale), currency: sale.currency || sale.unit || 'AFN', status: 'Receivable', date: date(sale), path: sale.customerId ? `/customers/${encodeURIComponent(sale.customerId)}` : '/project-sales-bills' }));
  if (['income', 'expenses', 'net-profit'].includes(metric)) return transactions.filter(item => metric === 'net-profit' ? ['income', 'expense'].includes(lower(item.type)) : lower(item.type) === (metric === 'expenses' ? 'expense' : 'income')).map(item => ({ id: item.id, primary: item.title || item.category || item.type, secondary: item.description || item.source || '—', amount: Number(item.amount || 0), currency: item.currency || item.unit || 'AFN', status: lower(item.type) === 'income' ? 'Income' : 'Expense', date: date(item), path: '/finance' }));
  if (metric === 'cash-wallet') return wallet.filter(item => ['deposit', 'credit'].includes(lower(item.type))).map(item => ({ id: item.id, primary: item.customerName || item.employeeName || item.projectName || item.description || 'Wallet entry', secondary: item.description || item.source || '—', amount: Number(item.amount || 0), currency: item.currency || 'AFN', status: lower(item.type) === 'deposit' ? 'Deposit' : 'Withdrawal', date: date(item), path: '/cash-wallet' }));
  if (metric === 'staff-payable') return calculateStaffPayablesByCurrency({ employees: allEmployees, payrolls, adjustments }).items.flatMap(item => Object.entries(item.balances).filter(([, value]) => value > 0).map(([currency, amount]) => ({ id: `${item.employeeId}-${currency}`, primary: item.employeeName, secondary: item.employee.department || item.employee.position || '—', amount, currency, status: 'Payable', date: item.lastActivityAt || '—', path: `/employees/${encodeURIComponent(item.employeeId)}` })));
  if (metric === 'supplier-payable') {
    const keys = new Set([...supplierPurchases, ...supplierPayments].map(supplierKey));
    return [...keys].flatMap(key => {
      const supplierIndex = suppliers.findIndex((item, index) => [item.id, item.supplierId, item.supplierName, item.companyName, String(index)].filter(value => value != null).map(String).includes(key));
      const supplier = suppliers[supplierIndex];
      const purchases = supplierPurchases.filter(item => supplierKey(item) === key);
      const payments = supplierPayments.filter(item => supplierKey(item) === key);
      return ['AFN', 'USD', 'EUR'].map(currency => {
        const same = item => { const code = String(item.currency || item.unit || 'AFN').toUpperCase(); return (['AFN', 'USD', 'EUR'].includes(code) ? code : 'AFN') === currency; };
        return { id: `${key}-${currency}`, primary: supplier?.supplierName || supplier?.companyName || purchases[0]?.supplierName || payments[0]?.supplierName || key, secondary: supplier?.phone || '—', amount: calculateSupplierPayable({ purchases: purchases.filter(same), payments: payments.filter(same) }), currency, status: 'Payable', date: date(purchases.at(-1) || payments.at(-1) || {}), path: supplierIndex >= 0 ? `/suppliers/${supplierIndex}` : '/suppliers' };
      }).filter(row => row.amount > 0);
    });
  }
  return [];
}

export function dashboardMetricTotals(metric, rows) {
  if (metric === 'net-profit') return subtractCurrencyTotals(sumCurrencyAmounts(rows.filter(row => row.status === 'Income')), sumCurrencyAmounts(rows.filter(row => row.status === 'Expense')));
  if (metric === 'cash-wallet') return subtractCurrencyTotals(sumCurrencyAmounts(rows.filter(row => row.status === 'Deposit')), sumCurrencyAmounts(rows.filter(row => row.status === 'Withdrawal')));
  return sumCurrencyAmounts(rows);
}
