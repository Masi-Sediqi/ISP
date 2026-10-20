import test from 'node:test';
import assert from 'node:assert/strict';
import { belongsToEmployee, getCallCenterEvents, hasContractTarget, kabulDate, targetSalaryForPeriod } from './callCenterPerformance.js';

const employee = { id: 'e1', fullName: 'Agent', roles: ['Employee', 'Call Center'], salaryType: 'fixed', fixedSalary: 200, monthlyContractTarget: 10 };
const events = (count, month = '2026-10') => Array.from({ length: count }, (_, index) => ({ customerId: `${index}`, contractDate: `${month}-${String(index + 1).padStart(2, '0')}` }));

test('salary follows completed customer targets with a monthly cap and reset', () => {
  assert.equal(targetSalaryForPeriod(employee, events(0), '2026-10-01', '2026-10-31'), 0);
  assert.equal(targetSalaryForPeriod(employee, events(5), '2026-10-01', '2026-10-31'), 100);
  assert.equal(targetSalaryForPeriod(employee, events(10), '2026-10-01', '2026-10-31'), 200);
  assert.equal(targetSalaryForPeriod(employee, events(15), '2026-10-01', '2026-10-31'), 200);
  assert.equal(targetSalaryForPeriod(employee, [...events(15), ...events(5, '2026-11')], '2026-10-01', '2026-11-30'), 300);
  assert.equal(targetSalaryForPeriod(employee, events(15), '2026-10-11', '2026-10-31'), 0);
  assert.equal(targetSalaryForPeriod(employee, events(5), '2026-10-03', '2026-10-05'), 60);
});

test('referral ownership takes precedence and empty IDs never match', () => {
  assert.equal(belongsToEmployee({ sourceEmployeeId: 'e2', createdByAccountId: 'a1' }, employee, 'a1'), false);
  assert.equal(belongsToEmployee({ createdByAccountId: 'a1' }, employee, 'a1'), true);
  assert.equal(belongsToEmployee({}, {}, ''), false);
  assert.equal(hasContractTarget({ ...employee, roles: ['Manager'] }), false);
  assert.equal(hasContractTarget({ ...employee, monthlyContractTarget: '' }), false);
});

test('a customer is counted once at the first non-cancelled contract, with Kabul dates', () => {
  const customer = { id: 'c1', sourceEmployeeId: 'e1', fullName: 'Customer', createdAt: '2026-09-30T21:00:00Z' };
  const projects = [
    { id: 'p0', customerId: 'c1', status: 'Cancelled', date: '2026-09-01' },
    { id: 'p1', customerId: 'c1', status: 'Active', createdAt: '2026-10-05T21:00:00Z' },
    { id: 'p2', customerId: 'c1', status: 'Delivered', date: '2026-11-01' },
    { id: 'p3', customerId: 'other', customerName: 'Customer', date: '2026-08-01' },
  ];
  const result = getCallCenterEvents({ employee, customers: [customer, customer], projects, visits: [
    { customerId: 'c1', date: '2026-10-03' },
    { customerId: 'c1', date: '2026-10-03' },
    { customerId: 'c1', date: '2026-10-04' },
    { customerId: 'c2', date: '2026-10-05' },
  ] });
  assert.equal(result.length, 1);
  assert.equal(result[0].introducedDate, '2026-10-01');
  assert.equal(result[0].contractDate, '2026-10-06');
  assert.deepEqual(result[0].visitDates, ['2026-10-03', '2026-10-04']);
  assert.equal(kabulDate('invalid'), '');
});

test('unlinked projects and leads alone cannot earn salary', () => {
  const result = getCallCenterEvents({ employee, customers: [{ id: 'c1', sourceEmployeeId: 'e1' }], projects: [{ customerId: 'c2', date: '2026-10-01' }] });
  assert.equal(targetSalaryForPeriod(employee, result, '2026-10-01', '2026-10-31'), 0);
});
