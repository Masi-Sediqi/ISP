import test from 'node:test';
import assert from 'node:assert/strict';
import { dashboardMetricRows, dashboardMetricTotals, receivableAmount } from './dashboardMetrics.js';
import { filterDashboardRecords, getDashboardDateRange } from './dashboardFilters.js';

test('all ten cards resolve to relevant records and matching totals', () => {
  const data = {
    customers: [{ id: 'c1', customerStage: 'Negotiation' }, { id: 'c2', customerStage: 'Completed' }],
    employees: [{ id: 'e1', status: ' Active ' }, { id: 'e2', status: 'Inactive' }],
    transactions: [{ id: 'i', type: ' Income ', amount: 100, currency: 'USD' }, { id: 'e', type: 'expense', amount: 30, currency: 'USD' }, { id: 'x', type: 'transfer', amount: 999 }],
    projectSales: [{ id: 's1', remaining: 0, balance: 500 }, { id: 's2', total: 100, paid: 40, customerId: 'c1' }],
    supplierPurchases: [{ id: 'p', supplierId: 'missing', supplierName: 'Archived supplier', totalAmount: 70, paidAmount: 20 }],
    supplierPayments: [], suppliers: [],
    wallet: [{ id: 'w1', type: 'deposit', amount: 100 }, { id: 'w2', type: 'credit', amount: 35 }, { id: 'w3', type: 'unknown', amount: 900 }],
    payrolls: [{ id: 'pay', employeeId: 'e1', netSalary: 200, totalSalary: 200, amount: 200 }], adjustments: [],
  };
  const rows = metric => dashboardMetricRows(metric, data);
  assert.equal(rows('customers').length, 2);
  assert.equal(rows('active-employees').length, 1);
  assert.equal(rows('progressing-customers').length, 1);
  assert.equal(rows('income').length, 1);
  assert.equal(rows('expenses').length, 1);
  assert.equal(rows('customer-receivable').length, 1);
  assert.equal(dashboardMetricTotals('customer-receivable', rows('customer-receivable')).AFN, 60);
  assert.equal(dashboardMetricTotals('net-profit', rows('net-profit')).USD, 70);
  assert.equal(dashboardMetricTotals('cash-wallet', rows('cash-wallet')).AFN, 65);
  assert.equal(dashboardMetricTotals('supplier-payable', rows('supplier-payable')).AFN, 50);
  assert.equal(rows('supplier-payable')[0].path, '/suppliers');
  assert.equal(rows('staff-payable').length, 1);
  assert.equal(dashboardMetricTotals('staff-payable', rows('staff-payable')).AFN, 200);
});

test('the dashboard date range filters the same source records before totals and detail rows', () => {
  const range = getDashboardDateRange('custom', { from: '2026-10-01', to: '2026-10-31' });
  const transactions = filterDashboardRecords([{ id: 'in', date: '2026-10-21', type: 'income', amount: 20 }, { id: 'out', date: '2026-09-01', type: 'income', amount: 80 }], range);
  const rows = dashboardMetricRows('income', { transactions });
  assert.deepEqual(rows.map(row => row.id), ['in']);
  assert.equal(dashboardMetricTotals('income', rows).AFN, 20);
  assert.equal(receivableAmount({ remaining: 0, remainingAmount: 100 }), 0);
  assert.equal(receivableAmount({ remaining: -10 }), 0);
});
