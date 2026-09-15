const asList = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
const toNumber = (value) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
};
const text = (value, fallback = "-") => {
  const result = String(value || "").trim();
  return result || fallback;
};
const dateValue = (record) =>
  text(record.saleDate || record.date || record.createdAt || record.updatedAt, "");
const monthKey = (date) => date.toISOString().slice(0, 7);
const nowDate = () => new Date();

export function latestProjectSales({ projectSales = [], customers = [], limit = 5 } = {}) {
  const projectRows = asList(projectSales).map((sale) => {
    const total = toNumber(sale.total ?? sale.price ?? sale.amount);
    const paid = toNumber(sale.paid ?? sale.paidAmount ?? total);
    const remaining =
      sale.remaining === undefined && sale.remainingAmount === undefined
        ? Math.max(0, total - paid)
        : Math.max(0, toNumber(sale.remaining ?? sale.remainingAmount));

    return {
      id: text(sale.id || sale.projectId || sale.projectName, "project-sale"),
      title: text(sale.projectName || sale.title || sale.name, "Project Sale"),
      customer: text(sale.customerName || sale.customerPhone, "Walk-in Customer"),
      department: "Project Sales",
      date: dateValue(sale),
      total,
      paid,
      remaining,
      currency: sale.currency || "AFN",
    };
  });

  const travelRows = asList(customers)
    .filter((customer) =>
      /travel|visa|student|education|scholar|تحصیل|سفر|ویزه|محصل/i.test(
        `${customer.customerType || ""} ${customer.type || ""} ${customer.scholarshipType || ""} ${customer.purpose || ""}`
      )
    )
    .map((customer) => {
      const total = toNumber(
        customer.totalAmount ?? customer.price ?? customer.fee ?? customer.packagePrice
      );
      const paid = toNumber(customer.paidAmount ?? customer.paid ?? customer.advancePayment);

      return {
        id: text(customer.id || customer.customerId || customer.phone, "travel-sale"),
        title: text(
          customer.packageName ||
            customer.destination ||
            customer.scholarshipType ||
            customer.purpose,
          "Travel / Education Service"
        ),
        customer: text(
          customer.customerName ||
            customer.passportFullName ||
            customer.fullName ||
            customer.phone,
          "Customer"
        ),
        department: "Travel / Education",
        date: dateValue(customer),
        total,
        paid,
        remaining: Math.max(0, total - paid),
        currency: customer.currency || customer.unit || "AFN",
      };
    });

  return [...projectRows, ...travelRows]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, limit);
}

export function buildReportsOverview({
  customers = [],
  projectSales = [],
  transactions = [],
  employees = [],
} = {}) {
  const customerList = asList(customers);
  const salesList = asList(projectSales);
  const transactionList = asList(transactions);
  const employeeList = asList(employees);
  const latestSales = latestProjectSales({ projectSales: salesList, customers: customerList });

  const totalSales = salesList.reduce(
    (sum, sale) => sum + toNumber(sale.total ?? sale.price ?? sale.amount),
    0
  );
  const paidAmount = salesList.reduce(
    (sum, sale) => sum + toNumber(sale.paid ?? sale.paidAmount ?? sale.total),
    0
  );
  const remainingAmount = salesList.reduce((sum, sale) => {
    const total = toNumber(sale.total ?? sale.price ?? sale.amount);
    const paid = toNumber(sale.paid ?? sale.paidAmount ?? total);
    return (
      sum +
      (sale.remaining === undefined && sale.remainingAmount === undefined
        ? Math.max(0, total - paid)
        : Math.max(0, toNumber(sale.remaining ?? sale.remainingAmount)))
    );
  }, 0);
  const income = transactionList
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const expense = transactionList
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const progressingCustomers = customerList.filter((customer) => {
    const stage = text(customer.customerStage, "").toLowerCase();
    return stage && stage !== "none" && !["approved", "completed", "rejected"].includes(stage);
  }).length;
  const activeEmployees = employeeList.filter(
    (employee) => String(employee.status || "").toLowerCase() === "active"
  ).length;

  const monthKeys = Array.from({ length: 6 }, (_, index) => {
    const date = nowDate();
    date.setMonth(date.getMonth() - (5 - index));
    return monthKey(date);
  });
  const chartData = monthKeys.map((month) => {
    const sales = salesList.filter((sale) => dateValue(sale).startsWith(month));
    const monthSales = sales.reduce(
      (sum, sale) => sum + toNumber(sale.total ?? sale.price ?? sale.amount),
      0
    );
    const monthPaid = sales.reduce(
      (sum, sale) => sum + toNumber(sale.paid ?? sale.paidAmount ?? sale.total),
      0
    );

    return {
      month: month.slice(5),
      sales: monthSales,
      paid: monthPaid,
    };
  });

  return {
    metrics: {
      totalSales: { label: "Total Sales", value: totalSales, suffix: "AFN" },
      paidAmount: { label: "Paid Amount", value: paidAmount, suffix: "AFN" },
      remainingAmount: { label: "Remaining Amount", value: remainingAmount, suffix: "AFN" },
      totalCustomers: { label: "Total Customers", value: customerList.length },
      netProfit: { label: "Net Profit", value: income - expense, suffix: "AFN" },
      totalExpense: { label: "Total Expense", value: expense, suffix: "AFN" },
      activeEmployees: { label: "Active Employees", value: activeEmployees },
      progressingCustomers: { label: "Progressing Customers", value: progressingCustomers },
    },
    latestSales,
    chartData,
  };
}
