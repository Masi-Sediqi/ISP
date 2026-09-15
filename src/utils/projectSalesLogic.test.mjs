import assert from "node:assert/strict";
import test from "node:test";

import { salePaymentSummary, saleToEditableForm } from "./projectSalesLogic.js";

test("saleToEditableForm restores a loan sale with paid amount for editing", () => {
  const sale = {
    id: "sale-1",
    customerId: "customer-1",
    customerName: "Ahmad",
    customerPhone: "0700000000",
    notes: "Install this week",
    paymentMode: "loan",
    paid: "150",
    items: [
      {
        projectId: "project-1",
        projectName: "Smart Office",
        price: 400,
        discount: 25,
        quantity: 2,
        currency: "USD",
      },
    ],
  };

  assert.deepEqual(saleToEditableForm(sale), {
    items: [
      {
        projectId: "project-1",
        projectName: "Smart Office",
        price: 400,
        discount: 25,
        quantity: 2,
        currency: "USD",
      },
    ],
    customer: {
      customerId: "customer-1",
      customerName: "Ahmad",
      customerPhone: "0700000000",
      notes: "Install this week",
    },
    paymentMode: "loan",
    loanPaidAmount: "150",
  });
});

test("saleToEditableForm restores legacy single-project sales", () => {
  const sale = {
    projectId: "project-2",
    projectName: "Network Setup",
    price: "300",
    quantity: "1",
    discount: "10",
    currency: "AFN",
    customerId: "customer-2",
    customerName: "Zahra",
    paid: "290",
  };

  assert.deepEqual(saleToEditableForm(sale).items, [
    {
      projectId: "project-2",
      projectName: "Network Setup",
      price: 300,
      quantity: 1,
      discount: 10,
      currency: "AFN",
    },
  ]);
});

test("salePaymentSummary derives remaining amount for old and new bills", () => {
  assert.deepEqual(
    salePaymentSummary({ total: 400, paid: 150, currency: "USD" }),
    { total: 400, paid: 150, remaining: 250, currency: "USD" }
  );

  assert.deepEqual(
    salePaymentSummary({ price: 300, currency: "AFN" }),
    { total: 300, paid: 300, remaining: 0, currency: "AFN" }
  );
});
