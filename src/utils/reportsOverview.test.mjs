import assert from "node:assert/strict";
import test from "node:test";
import {
  buildReportsOverview,
  latestProjectSales,
} from "./reportsOverview.js";

test("latestProjectSales returns newest project and travel sales with amounts", () => {
  const rows = latestProjectSales({
    projectSales: [
      {
        id: "old",
        projectName: "Old CRM",
        customerName: "Amina",
        total: "1000",
        paid: "400",
        remaining: "600",
        currency: "USD",
        saleDate: "2026-08-01",
      },
      {
        id: "new",
        projectName: "Smart Office",
        customerName: "Ahmad",
        total: "400",
        paid: "200",
        remaining: "200",
        currency: "USD",
        saleDate: "2026-09-15",
      },
    ],
    customers: [
      {
        id: "travel-1",
        customerType: "Travel Customer",
        passportFullName: "Karim",
        packageName: "Turkey Visa",
        price: "700",
        paidAmount: "250",
        createdAt: "2026-09-10T09:00:00.000Z",
      },
    ],
  });

  assert.equal(rows.length, 3);
  assert.equal(rows[0].title, "Smart Office");
  assert.equal(rows[0].total, 400);
  assert.equal(rows[0].paid, 200);
  assert.equal(rows[0].remaining, 200);
  assert.equal(rows[1].title, "Turkey Visa");
  assert.equal(rows[1].department, "Travel / Education");
});

test("buildReportsOverview calculates report totals from real collections", () => {
  const result = buildReportsOverview({
    customers: [
      { id: "c1", customerStage: "Application Submitted" },
      { id: "c2", customerStage: "None" },
    ],
    projectSales: [
      { id: "s1", total: 500, paid: 300, remaining: 200, saleDate: "2026-09-12" },
      { id: "s2", total: 250, paid: 250, remaining: 0, saleDate: "2026-09-13" },
    ],
    transactions: [
      { id: "t1", type: "income", amount: 1200, date: "2026-09-12" },
      { id: "t2", type: "expense", amount: 350, date: "2026-09-13" },
    ],
    employees: [{ id: "e1", status: "Active" }, { id: "e2", status: "Inactive" }],
  });

  assert.equal(result.metrics.totalSales.value, 750);
  assert.equal(result.metrics.paidAmount.value, 550);
  assert.equal(result.metrics.remainingAmount.value, 200);
  assert.equal(result.metrics.netProfit.value, 850);
  assert.equal(result.metrics.activeEmployees.value, 1);
  assert.equal(result.metrics.progressingCustomers.value, 1);
  assert.equal(result.chartData.length, 6);
});
