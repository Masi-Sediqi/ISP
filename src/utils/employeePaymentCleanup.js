export function removeLinkedEmployeePaymentRecords({
  ledgerEntry,
  transactions = [],
  walletTransactions = [],
}) {
  const financeId = ledgerEntry?.transactionId ? String(ledgerEntry.transactionId) : "";
  const walletId = ledgerEntry?.walletTransactionId ? String(ledgerEntry.walletTransactionId) : "";

  return {
    transactions: financeId
      ? transactions.filter((item) => String(item.id) !== financeId)
      : [...transactions],
    walletTransactions: walletId
      ? walletTransactions.filter((item) => String(item.id) !== walletId)
      : [...walletTransactions],
  };
}
