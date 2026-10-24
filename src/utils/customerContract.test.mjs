import test from 'node:test';
import assert from 'node:assert/strict';
import { contractDefaults, contractItems, contractNumber, validateContract } from './customerContract.js';
import { contractFields, standaloneSoftwareRecord } from './customerContract.js';
import { CONTRACT_TEMPLATES, getContractTemplate } from './contractTemplates.js';

test('template selection restores its own fields without mixing visa and software data', () => {
  const record = { id: 'one', contractTemplateId: 'software-sale', contractDetails: { systemVersion: '2.0' },
    contractDetailsByTemplate: { 'turkey-visa': { buyerName: 'Visa buyer', fatherName: 'Father' } } };
  assert.equal(contractDefaults(record, {}, 'software-sale').systemVersion, '2.0');
  const visa = contractDefaults(record, {}, 'turkey-visa');
  assert.equal(visa.buyerName, 'Visa buyer');
  assert.equal(visa.fatherName, 'Father');
  assert.equal(visa.systemVersion, undefined);
  assert.ok(contractFields('turkey-visa').some(([key]) => key === 'exchangeLicense'));
  assert.ok(!contractFields('turkey-visa').some(([key]) => key === 'systemVersion'));
  assert.equal(CONTRACT_TEMPLATES.length, 2);
  assert.equal(getContractTemplate().id, 'software-sale');
  assert.equal(getContractTemplate('unknown'), undefined);
});

test('visa can be completed independently from a software sale and validates template terms', () => {
  const visa = { ...contractDefaults({ contractTemplateId: 'turkey-visa' }, { fullName: 'Applicant', fatherName: 'Father', passportNumber: 'P123', phone: '0700', address: 'Kabul' }),
    totalAmount: '13500', exchangeName: 'Exchange', exchangeAddress: 'Kabul', exchangeLicense: '123' };
  assert.equal(validateContract(visa, 'turkey-visa'), '');
  assert.match(validateContract({ ...visa, totalAmount: '-1' }, 'turkey-visa'), /positive/);
  assert.match(validateContract({ ...visa, fatherName: '' }, 'turkey-visa'), /Father/);
  assert.match(validateContract({ ...visa, paidAmount: '10' }, 'turkey-visa'), /no advance/);
});

test('a standalone software agreement stores its own project, amounts and expiry', () => {
  const record = { id: 'contract-new', contractStandalone: true };
  const details = { ...contractDefaults(record), projectName: 'Office system', salePlan: 'three-months', startDate: '2026-10-24', currency: 'USD', totalAmount: '100', paidAmount: '25' };
  const saved = standaloneSoftwareRecord(record, details);
  assert.equal(saved.remaining, 75);
  assert.equal(saved.endDate, '2027-01-24');
  assert.equal(saved.items[0].projectCode, 'PRJ-contract-new');
  assert.ok(contractFields('software-sale', true).some(([key]) => key === 'projectName'));
  assert.ok(!contractFields('software-sale', false).some(([key]) => key === 'projectName'));
});

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
