import { ArrowLeft, ExternalLink, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useJsonCollection } from '../hooks/useJsonCollection';
import { filterDashboardRecords, getDashboardDateRange } from '../utils/dashboardFilters';
import { dashboardMetricRows, dashboardMetricTotals } from '../utils/dashboardMetrics';
import { formatCurrencyAmount, formatCurrencyTotals } from '../utils/currencyDisplay';
import './DashboardMetricDetails.css';

const list = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const lower = (value) => String(value || '').trim().toLowerCase();

const config = {
  'cash-wallet': { title: 'Cash Wallet', description: 'Deposits and withdrawals matching the dashboard period.' },
  'staff-payable': { title: 'Staff Payable', description: 'Employee balances calculated from payroll and adjustments in the selected period.' },
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
  const [customersRaw] = useJsonCollection('customers', { refreshInterval: 30000 });
  const [transactionsRaw] = useJsonCollection('transactions', { refreshInterval: 30000 });
  const [employeesRaw] = useJsonCollection('employees', { refreshInterval: 30000 });
  const [projectSalesRaw] = useJsonCollection('projectSales', { refreshInterval: 30000 });
  const [walletRaw] = useJsonCollection('cashWalletTransactions', { refreshInterval: 30000 });
  const [payrollsRaw] = useJsonCollection('employeePayrolls', { refreshInterval: 30000 });
  const [adjustmentsRaw] = useJsonCollection('employeeAdjustments', { refreshInterval: 30000 });
  const [suppliersRaw] = useJsonCollection('suppliers', { refreshInterval: 30000 });
  const [supplierPurchasesRaw] = useJsonCollection('supplierPurchases', { refreshInterval: 30000 });
  const [supplierPaymentsRaw] = useJsonCollection('supplierPayments', { refreshInterval: 30000 });

  const range = getDashboardDateRange(params.get('filter') || 'all', {
    from: params.get('from') || '',
    to: params.get('to') || '',
  });

  const customers = filterDashboardRecords(list(customersRaw), range);
  const transactions = filterDashboardRecords(list(transactionsRaw), range);
  const employees = filterDashboardRecords(list(employeesRaw), range);
  const projectSales = filterDashboardRecords(list(projectSalesRaw), range);
  const supplierPurchases = filterDashboardRecords(list(supplierPurchasesRaw), range);
  const supplierPayments = filterDashboardRecords(list(supplierPaymentsRaw), range);
  const suppliers = list(suppliersRaw);
  const page = config[metric] || { title: 'Dashboard Details', description: 'Detailed records for this dashboard metric.' };

  const rows = dashboardMetricRows(metric, {
    customers, employees, allEmployees: list(employeesRaw), transactions, projectSales,
    suppliers, supplierPurchases, supplierPayments,
    wallet: filterDashboardRecords(list(walletRaw), range),
    payrolls: filterDashboardRecords(list(payrollsRaw), range),
    adjustments: filterDashboardRecords(list(adjustmentsRaw), range),
  });

  const normalizedQuery = lower(query);
  const visibleRows = rows.filter((row) => !normalizedQuery || lower(`${row.primary} ${row.secondary} ${row.status} ${row.amount} ${row.currency} ${row.date}`).includes(normalizedQuery));
  const totalByCurrency = dashboardMetricTotals(metric, visibleRows);
  const isBalance = ['net-profit', 'cash-wallet'].includes(metric);

  return (
    <div className="dashboard-detail-page">
      <button type="button" className="dashboard-detail-back" onClick={() => navigate(`/${params.toString() ? `?${params}` : ''}`)}><ArrowLeft size={16} /> Back to Dashboard</button>
      <section className="dashboard-detail-hero">
        <div>
          <span>DASHBOARD DETAIL</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
        <div className="dashboard-detail-summary">
          <small>{isBalance ? 'Net result' : 'Records'}</small>
          <strong>{isBalance ? formatCurrencyTotals(totalByCurrency) : visibleRows.length}</strong>
          {['customer-receivable', 'expenses', 'income', 'supplier-payable', 'staff-payable'].includes(metric) && <em>{formatCurrencyTotals(totalByCurrency)}</em>}
        </div>
      </section>
      <section className="dashboard-detail-card">
        <div className="dashboard-detail-toolbar">
          <div><strong>{visibleRows.length} record(s)</strong><span>Filter: {params.get('filter') === 'custom' ? `${params.get('from')} to ${params.get('to')}` : params.get('filter') || 'all time'}</span></div>
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
