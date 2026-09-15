import { ArrowLeft, ExternalLink, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useJsonCollection } from '../hooks/useJsonCollection';
import { filterDashboardRecords, getDashboardDateRange } from '../utils/dashboardFilters';
import { calculateSupplierPayable } from '../utils/supplierPayable';
import { formatCurrencyAmount, formatCurrencyTotals, sumCurrencyAmounts, subtractCurrencyTotals } from '../utils/currencyDisplay';
import './DashboardMetricDetails.css';

const list = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const money = (value) => Number(value || 0).toLocaleString('en-US');
const lower = (value) => String(value || '').trim().toLowerCase();
const fullName = (item) => String(item?.fullName || item?.customerName || item?.name || `${item?.firstName || ''} ${item?.lastName || ''}`).trim() || '-';
const rowDate = (item) => item?.date || item?.createdAt || item?.registrationDate || item?.paymentDate || item?.purchaseDate || '-';

function supplierKey(record) {
  return String(record?.supplierRecordId || record?.supplierId || record?.supplierIndex || record?.supplierName || 'unknown');
}

function supplierPayableRows(suppliers, purchases, payments) {
  const currencies = ['AFN', 'USD', 'EUR'];
  return list(suppliers).flatMap((supplier, index) => {
    const ids = new Set([
      String(supplier?.id || ''),
      String(supplier?.supplierId || ''),
      String(index),
      String(supplier?.supplierName || supplier?.companyName || ''),
    ].filter(Boolean));
    const relevantPurchases = list(purchases).filter((item) => ids.has(supplierKey(item)) || ids.has(String(item?.supplierName || '')));
    const relevantPayments = list(payments).filter((item) => ids.has(supplierKey(item)) || ids.has(String(item?.supplierName || '')));
    return currencies.map((currency) => {
      const sameCurrency = (item) => String(item?.currency || item?.unit || 'AFN').toUpperCase() === currency;
      const balance = calculateSupplierPayable({
        purchases: relevantPurchases.filter(sameCurrency),
        payments: relevantPayments.filter(sameCurrency),
      });
      return { supplier, index, balance, currency };
    }).filter((item) => item.balance > 0);
  });
}

const config = {
  customers: { title: 'Total Customers', description: 'Customers registered during the selected period.' },
  'customer-receivable': { title: 'Customer Receivable', description: 'Customer balances still receivable by the office.' },
  'active-employees': { title: 'Active Employees', description: 'Active employees in the selected period.' },
  expenses: { title: 'Total Expenses', description: 'Expense transactions recorded during the selected period.' },
  income: { title: 'Total Income', description: 'Income transactions recorded during the selected period.' },
  'net-profit': { title: 'Net Profit', description: 'Income and expense records used to calculate the selected period result.' },
  'progressing-customers': { title: 'Progressing Customers', description: 'Customers currently in active workflow stages.' },
  'supplier-payable': { title: 'Supplier Payable', description: 'Suppliers that the office still needs to pay.' },
};

export default function DashboardMetricDetails() {
  const navigate = useNavigate();
  const { metric } = useParams();
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');
  const [customersRaw] = useJsonCollection('customers');
  const [transactionsRaw] = useJsonCollection('transactions');
  const [employeesRaw] = useJsonCollection('employees');
  const [projectSalesRaw] = useJsonCollection('projectSales');
  const [suppliersRaw] = useJsonCollection('suppliers');
  const [supplierPurchasesRaw] = useJsonCollection('supplierPurchases');
  const [supplierPaymentsRaw] = useJsonCollection('supplierPayments');

  const range = useMemo(() => getDashboardDateRange(params.get('filter') || 'all', {
    from: params.get('from') || '',
    to: params.get('to') || '',
  }), [params]);

  const customers = filterDashboardRecords(list(customersRaw), range);
  const transactions = filterDashboardRecords(list(transactionsRaw), range);
  const employees = filterDashboardRecords(list(employeesRaw), range);
  const projectSales = filterDashboardRecords(list(projectSalesRaw), range);
  const supplierPurchases = filterDashboardRecords(list(supplierPurchasesRaw), range);
  const supplierPayments = filterDashboardRecords(list(supplierPaymentsRaw), range);
  const suppliers = list(suppliersRaw);
  const page = config[metric] || { title: 'Dashboard Details', description: 'Detailed records for this dashboard metric.' };

  const rows = useMemo(() => {
    if (metric === 'customers') return customers.map((customer) => ({
      id: customer.id,
      primary: fullName(customer),
      secondary: customer.phone || customer.customerId || '-',
      amount: '',
      status: customer.status || customer.customerStage || '-',
      date: rowDate(customer),
      path: customer.id ? `/customers/${customer.id}` : '/customers',
    }));
    if (metric === 'customer-receivable') return projectSales
      .map((sale) => ({
        id: sale.id,
        primary: sale.customerName || sale.customer?.name || 'Customer',
        secondary: sale.projectName || sale.projects?.map?.((p) => p.projectName || p.name).join(', ') || 'Project sale',
        amount: Number(sale.remaining || sale.remainingAmount || sale.balance || 0),
        currency: sale.currency || sale.unit || 'AFN',
        status: Number(sale.remaining || sale.remainingAmount || sale.balance || 0) > 0 ? 'Receivable' : 'Paid',
        date: rowDate(sale),
        path: '/project-sales-bills',
      }))
      .filter((row) => row.amount > 0);
    if (metric === 'active-employees') return employees
      .filter((employee) => lower(employee.status) === 'active')
      .map((employee) => ({
        id: employee.id,
        primary: fullName(employee),
        secondary: employee.department || employee.position || employee.role || '-',
        amount: '',
        status: employee.status || 'Active',
        date: rowDate(employee),
        path: employee.id ? `/employees/${employee.id}` : '/employees',
      }));
    if (metric === 'expenses' || metric === 'income') return transactions
      .filter((item) => lower(item.type) === (metric === 'expenses' ? 'expense' : 'income'))
      .map((item) => ({
        id: item.id,
        primary: item.title || item.category || (metric === 'expenses' ? 'Expense' : 'Income'),
        secondary: item.description || item.source || '-',
        amount: Number(item.amount || 0),
        currency: item.currency || item.unit || 'AFN',
        status: item.category || item.source || '-',
        date: rowDate(item),
        path: '/finance',
      }));
    if (metric === 'net-profit') return transactions
      .filter((item) => ['income', 'expense'].includes(lower(item.type)))
      .map((item) => ({
        id: item.id,
        primary: item.title || item.category || item.type,
        secondary: item.description || item.source || '-',
        amount: Number(item.amount || 0),
        currency: item.currency || item.unit || 'AFN',
        status: lower(item.type) === 'income' ? 'Income' : 'Expense',
        date: rowDate(item),
        path: '/finance',
      }));
    if (metric === 'progressing-customers') return customers
      .filter((customer) => {
        const stage = lower(customer.customerStage);
        return stage && stage !== 'none' && !['approved', 'completed', 'rejected'].includes(stage);
      })
      .map((customer) => ({
        id: customer.id,
        primary: fullName(customer),
        secondary: customer.phone || '-',
        amount: '',
        status: customer.customerStage || '-',
        date: rowDate(customer),
        path: customer.id ? `/customers/${customer.id}` : '/customers',
      }));
    if (metric === 'supplier-payable') return supplierPayableRows(suppliers, supplierPurchases, supplierPayments).map(({ supplier, index, balance, currency }) => ({
      id: supplier.id || index,
      primary: supplier.supplierName || supplier.companyName || 'Supplier',
      secondary: supplier.phone || supplier.contactPerson || '-',
      amount: balance,
      currency,
      status: 'Payable',
      date: rowDate(supplier),
      path: `/suppliers/${index}`,
    }));
    return [];
  }, [customers, employees, metric, projectSales, supplierPayments, supplierPurchases, suppliers, transactions]);

  const normalizedQuery = lower(query);
  const visibleRows = rows.filter((row) => !normalizedQuery || lower(`${row.primary} ${row.secondary} ${row.status} ${row.amount} ${row.currency} ${row.date}`).includes(normalizedQuery));
  const totalByCurrency = sumCurrencyAmounts(visibleRows, (row) => typeof row.amount === 'number' ? row.amount : 0, (row) => row.currency || 'AFN');
  const incomeByCurrency = metric === 'net-profit'
    ? sumCurrencyAmounts(visibleRows.filter((row) => row.status === 'Income'), (row) => row.amount, (row) => row.currency || 'AFN')
    : { AFN: 0, USD: 0, EUR: 0 };
  const expenseByCurrency = metric === 'net-profit'
    ? sumCurrencyAmounts(visibleRows.filter((row) => row.status === 'Expense'), (row) => row.amount, (row) => row.currency || 'AFN')
    : { AFN: 0, USD: 0, EUR: 0 };
  const netByCurrency = subtractCurrencyTotals(incomeByCurrency, expenseByCurrency);

  return (
    <div className="dashboard-detail-page">
      <button type="button" className="dashboard-detail-back" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back to Dashboard</button>
      <section className="dashboard-detail-hero">
        <div>
          <span>DASHBOARD DETAIL</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
        <div className="dashboard-detail-summary">
          <small>{metric === 'net-profit' ? 'Net result' : 'Records'}</small>
          <strong>{metric === 'net-profit' ? formatCurrencyTotals(netByCurrency) : visibleRows.length}</strong>
          {['customer-receivable', 'expenses', 'income', 'supplier-payable'].includes(metric) && <em>{formatCurrencyTotals(totalByCurrency)}</em>}
        </div>
      </section>
      <section className="dashboard-detail-card">
        <div className="dashboard-detail-toolbar">
          <div><strong>{visibleRows.length} record(s)</strong><span>Matching the dashboard filter</span></div>
          <label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search these records..." /></label>
        </div>
        <div className="dashboard-detail-table-wrap">
          <table>
            <thead><tr><th>Name / Title</th><th>Details</th><th>Amount</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={`${metric}-${row.id}-${row.date}`}>
                  <td><strong>{row.primary}</strong></td>
                  <td>{row.secondary}</td>
                  <td>{typeof row.amount === 'number' ? formatCurrencyAmount(row.amount, row.currency || 'AFN') : '-'}</td>
                  <td><span className="dashboard-detail-status">{row.status || '-'}</span></td>
                  <td>{String(row.date || '-').replace('T', ' ').slice(0, 19)}</td>
                  <td><button type="button" onClick={() => navigate(row.path)} title="Open record"><ExternalLink size={15} /></button></td>
                </tr>
              ))}
              {!visibleRows.length && <tr><td colSpan="6" className="dashboard-detail-empty">No matching records for this filter.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
