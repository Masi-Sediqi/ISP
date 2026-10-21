import test from 'node:test';
import assert from 'node:assert/strict';
import { contractDefaults, contractItems, contractNumber, validateContract } from './customerContract.js';

test('contracts use saved buyer details over later customer profile changes', () => {
  const sale = { id: 'sale-1', customerName: 'Buyer', saleDate: '2026-10-21', contractDetails: { address: 'Saved address' } };
  const data = contractDefaults(sale, { address: 'New address', tazkiraNumber: '123' });
  assert.equal(data.address, 'Saved address');
  assert.equal(data.buyerIdNumber, '123');
  assert.equal(contractNumber(sale), 'CTR-sale-1');
  assert.equal(contractItems(sale).length, 1);
  assert.equal(contractItems({ items: [{ projectId: 'a' }, { projectId: 'b' }] }).length, 2);
});
test('missing terms cannot silently become a completed contract', () => {
  assert.match(validateContract({}), /required/);
  const details = { buyerName: 'Buyer', buyerIdNumber: '123', representative: 'Rep', address: 'Kabul', phone: '0700000000', systemType: 'Software', systemVersion: '1', contractDate: '2026-10-21', paymentDueDate: '2026-11-01', acceptanceDays: '7', supportDuration: '3 months', features: 'Features' };
  assert.equal(validateContract(details), '');
  assert.match(validateContract({ ...details, acceptanceDays: '-1' }), /positive/);
  assert.match(validateContract({ ...details, contractDate: '2026-02-30' }), /valid/);
});
