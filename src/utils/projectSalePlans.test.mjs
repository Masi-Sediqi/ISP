import test from 'node:test';
import assert from 'node:assert/strict';
import { salePlanEndDate, projectUniqueCode, updateSalePlan } from './projectSalePlans.js';
import { buildSaleItem, saleToEditableForm } from './projectSalesLogic.js';

test('calendar plans expire on the same day, clamped for short months', () => {
  assert.equal(salePlanEndDate('2026-10-21', 'one-month'), '2026-11-21');
  assert.equal(salePlanEndDate('2026-10-21', 'three-months'), '2027-01-21');
  assert.equal(salePlanEndDate('2026-10-21', 'six-months'), '2027-04-21');
  assert.equal(salePlanEndDate('2028-01-31', 'one-month'), '2028-02-29');
  assert.equal(salePlanEndDate('2026-01-31', 'one-month'), '2026-02-28');
  assert.equal(salePlanEndDate('2026-02-30', 'one-month'), '');
  assert.equal(salePlanEndDate('', 'one-month'), '');
  assert.equal(salePlanEndDate('2026-10-21', 'lifetime'), '');
});
test('project codes are stable and plan changes preserve price', () => {
  const item = buildSaleItem({ id: 'project-1', projectName: 'Test', price: 200 });
  assert.equal(item.projectCode, projectUniqueCode('project-1'));
  assert.notEqual(item.projectCode, projectUniqueCode('project-2'));
  const monthly = updateSalePlan(item, { salePlan: 'one-month', startDate: '2026-10-21' });
  assert.equal(monthly.price, 200);
  assert.equal(monthly.endDate, '2026-11-21');
  const restored = saleToEditableForm({ items: [monthly] }).items[0];
  assert.equal(restored.projectCode, monthly.projectCode);
  assert.equal(restored.salePlan, 'one-month');
  assert.equal(restored.startDate, '2026-10-21');
  assert.equal(restored.endDate, '2026-11-21');
  assert.equal(updateSalePlan(monthly, { salePlan: 'lifetime' }).endDate, '');
});
