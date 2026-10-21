import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCustomerPaymentLedger } from './customerPaymentLedger.js';

test('ledger includes sale payments and separates outgoing, incoming and currencies', () => {
  const { rows, totals } = buildCustomerPaymentLedger([{ id: 'sale', paid: 100, currency: 'AFN', saleDate: '2026-10-20' }], [
    { id: 'out', amount: 30, currency: 'AFN', direction: 'us-to-customer', date: '2026-10-21' },
    { id: 'in', amount: 10, currency: 'USD', adjustmentType: 'credit', date: '2026-10-21' },
  ]);
  assert.deepEqual(totals.AFN, { credit: 100, debit: 30, net: 70 });
  assert.deepEqual(totals.USD, { credit: 10, debit: 0, net: 10 });
  assert.equal(rows[1].balance, 70);
});
test('negative net, decimals and legacy paidAmount are handled without invalid rows', () => {
  const { rows, totals } = buildCustomerPaymentLedger([], [
    { paidAmount: 0.1 }, { amount: 0.2 }, { amount: 1, adjustmentType: 'debit' },
    { amount: 'invalid' }, { amount: -2 },
  ]);
  assert.equal(rows.length, 3);
  assert.equal(totals.AFN.net, -0.7);
});
