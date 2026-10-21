export function buildCustomerPaymentLedger(sales = [], payments = [], fallbackCurrency = 'AFN') {
  const rows = [];
  const add = (record, amount, outgoing, source, title) => {
    amount = Number(amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    rows.push({ record, source, title, amount, outgoing,
      currency: String(record.currency || record.unit || fallbackCurrency).toUpperCase(),
      date: record.date || record.saleDate || String(record.createdAt || '').slice(0, 10),
      description: record.description || record.notes || record.note || '',
    });
  };
  sales.forEach(sale => add(sale, sale.paid, false, 'projectSales', sale.projectName || 'Sale payment'));
  payments.forEach(payment => add(payment, payment.amount ?? payment.paidAmount,
    (payment.direction || payment.paymentDirection) === 'us-to-customer' || payment.adjustmentType === 'debit',
    'customerPayments', payment.title || 'Customer payment'));
  rows.sort((a, b) => a.date.localeCompare(b.date) || String(a.record.createdAt || '').localeCompare(String(b.record.createdAt || '')));
  const totals = {};
  rows.forEach(row => {
    const total = totals[row.currency] ||= { credit: 0, debit: 0, net: 0 };
    total[row.outgoing ? 'debit' : 'credit'] += row.amount;
    total.net = Math.round((total.credit - total.debit) * 100) / 100;
    row.balance = total.net;
  });
  return { rows, totals };
}
