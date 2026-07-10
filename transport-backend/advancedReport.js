const axios = require("axios");

const number = (value) => Number(value || 0);
const money = (value) => number(value).toLocaleString("en-US");
const text = (value) => String(value || "").trim();
const includesAny = (value, words) => words.some((word) => value.includes(word));

function statusCount(items, words) {
  return items.filter((item) => includesAny(text(item.status), words)).length;
}

function uniqueTransactions(data) {
  const transactions = [...data.transactions];

  data.customerTravels.forEach((record) => {
    if (
      number(record.paidAmount) > 0 &&
      !transactions.some(
        (item) =>
          item.source === "customer-travel" &&
          Number(item.referenceId) === Number(record.id)
      )
    ) {
      transactions.push({
        type: "income",
        amount: number(record.paidAmount),
        date: record.date,
        source: "customer-travel",
        title: `پرداخت سفر ${record.travelName || ""}`,
      });
    }
  });

  data.customerPayments.forEach((payment) => {
    if (
      !transactions.some(
        (item) =>
          item.source === "customer-payment" &&
          Number(item.referenceId) === Number(payment.id)
      )
    ) {
      transactions.push({
        type: "income",
        amount: number(payment.amount),
        date: payment.date,
        source: "customer-payment",
        title: "پرداخت بدهی مشتری",
      });
    }
  });

  data.travelExpenses.forEach((expense) => {
    if (
      !transactions.some(
        (item) =>
          item.source === "travel-expense" &&
          Number(item.referenceId) === Number(expense.id)
      )
    ) {
      transactions.push({
        type: "expense",
        amount: number(expense.amount),
        date: expense.date,
        source: "travel-expense",
        title: expense.title || "مصرف سفر",
      });
    }
  });

  data.carRepairs.forEach((repair) => {
    if (
      !transactions.some(
        (item) =>
          item.source === "car-repair" &&
          Number(item.referenceId) === Number(repair.id)
      )
    ) {
      transactions.push({
        type: "expense",
        amount: number(repair.amount),
        date: repair.date,
        source: "car-repair",
        title: repair.title || "ترمیم موتر",
      });
    }
  });

  return transactions;
}

function customerAccounts(data) {
  return data.customers.map((customer, customerIndex) => {
    const travels = data.customerTravels.filter(
      (record) => Number(record.customerIndex) === customerIndex
    );
    const payments = data.customerPayments.filter(
      (payment) => Number(payment.customerIndex) === customerIndex
    );
    const billed = travels.reduce(
      (sum, record) =>
        sum + Math.max(number(record.fare) - number(record.discount), 0),
      0
    );
    const paid =
      travels.reduce((sum, record) => sum + number(record.paidAmount), 0) +
      payments.reduce((sum, payment) => sum + number(payment.amount), 0);

    return {
      name: `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "بدون نام",
      trips: travels.length,
      billed,
      paid,
      debt: Math.max(billed - paid, 0),
      discount: travels.reduce(
        (sum, record) => sum + number(record.discount),
        0
      ),
    };
  });
}

function rankRoutes(data) {
  const routes = new Map();
  data.travels.forEach((travel) => {
    const route = `${travel.from || "نامعلوم"} - ${travel.to || "نامعلوم"}`;
    const current = routes.get(route) || {
      name: route,
      trips: 0,
      kilometers: 0,
      fare: 0,
    };
    current.trips += 1;
    current.kilometers += number(travel.kilometers);
    current.fare += number(travel.fare);
    routes.set(route, current);
  });
  return [...routes.values()].sort(
    (first, second) => second.trips - first.trips || second.fare - first.fare
  );
}

function rankCars(data) {
  const expenseByTravel = new Map();
  data.travelExpenses.forEach((expense) => {
    const key = Number(expense.travelIndex);
    expenseByTravel.set(key, (expenseByTravel.get(key) || 0) + number(expense.amount));
  });

  return data.cars
    .map((car) => {
      const carTravels = data.travels
        .map((travel, index) => ({ ...travel, index }))
        .filter((travel) => text(travel.car) === text(car.plate));
      const repair = data.carRepairs
        .filter(
          (item) =>
            Number(item.carId) === Number(car.id) ||
            text(item.carPlate) === text(car.plate)
        )
        .reduce((sum, item) => sum + number(item.amount), 0);
      const travelCost = carTravels.reduce(
        (sum, travel) => sum + (expenseByTravel.get(travel.index) || 0),
        0
      );
      return {
        plate: car.plate || "-",
        type: car.type || "-",
        status: car.status || "-",
        trips: carTravels.length,
        kilometers: carTravels.reduce(
          (sum, travel) => sum + number(travel.kilometers),
          0
        ),
        cost: repair + travelCost,
      };
    })
    .sort((first, second) => second.trips - first.trips);
}

function buildSnapshot(data) {
  const transactions = uniqueTransactions(data);
  const income = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + number(item.amount), 0);
  const expense = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + number(item.amount), 0);
  const customers = customerAccounts(data);
  const routes = rankRoutes(data);
  const cars = rankCars(data);
  const employees = data.drivers;
  const drivers = employees.filter((employee) =>
    ["دریور", "راننده"].includes(employee.jobType) || (!employee.jobType && employee.licenseNo)
  );
  const debt = customers.reduce((sum, customer) => sum + customer.debt, 0);
  const totalKilometers = data.travels.reduce(
    (sum, travel) => sum + number(travel.kilometers),
    0
  );

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      cars: data.cars.length,
      employees: employees.length,
      drivers: drivers.length,
      customers: data.customers.length,
      destinations: data.destinations.length,
      travels: data.travels.length,
      kilometers: totalKilometers,
      income,
      expense,
      net: income - expense,
      debt,
      discounts: customers.reduce(
        (sum, customer) => sum + customer.discount,
        0
      ),
    },
    statuses: {
      activeCars: statusCount(data.cars, ["فعال"]),
      repairCars: statusCount(data.cars, ["ترمیم"]),
      pendingTravels: statusCount(data.travels, ["انتظار"]),
      activeTravels: statusCount(data.travels, ["جریان"]),
      completedTravels: statusCount(data.travels, ["تکمیل"]),
      activeEmployees: statusCount(employees, ["فعال"]),
      activeDrivers: statusCount(drivers, ["فعال"]),
    },
    cars,
    customers: customers.sort(
      (first, second) => second.debt - first.debt || second.paid - first.paid
    ),
    routes,
    recentTravels: [...data.travels]
      .sort((first, second) =>
        text(second.date).localeCompare(text(first.date))
      )
      .slice(0, 8)
      .map((travel) => ({
        name: travel.name || "-",
        date: travel.date || "-",
        route: `${travel.from || "-"} - ${travel.to || "-"}`,
        car: travel.car || "-",
        driver: travel.driver || "-",
        status: travel.status || "-",
        fare: number(travel.fare),
      })),
    largestExpenses: transactions
      .filter((item) => item.type === "expense")
      .sort((first, second) => number(second.amount) - number(first.amount))
      .slice(0, 8)
      .map((item) => ({
        title: item.title || "مصرف",
        amount: number(item.amount),
        date: item.date || "-",
      })),
  };
}

function sourceList(snapshot) {
  return [
    `${snapshot.totals.cars} موتر`,
    `${snapshot.totals.travels} سفر`,
    `${snapshot.totals.customers} مشتری`,
    `${snapshot.totals.employees} کارمند`,
    `${snapshot.totals.drivers} دریور`,
    `${snapshot.totals.income + snapshot.totals.expense > 0 ? "داده مالی موجود" : "بدون داده مالی"}`,
  ];
}

function carAnswer(snapshot) {
  const list = snapshot.cars
    .slice(0, 8)
    .map(
      (car, index) =>
        `${index + 1}. ${car.type} با نمبر ${car.plate}: ${car.status}، ${car.trips} سفر و ${money(car.kilometers)} کیلومتر`
    )
    .join("\n");
  return `در حال حاضر ${snapshot.totals.cars} موتر در سیستم ثبت است. از این میان ${snapshot.statuses.activeCars} موتر فعال و ${snapshot.statuses.repairCars} موتر در ترمیم است.\n\n${list || "هنوز جزئیات موتری ثبت نشده است."}`;
}

function travelAnswer(snapshot) {
  const route = snapshot.routes[0];
  return `مجموعاً ${snapshot.totals.travels} سفر و ${money(snapshot.totals.kilometers)} کیلومتر ثبت شده است.\n\nوضعیت سفرها:\n• ${snapshot.statuses.completedTravels} تکمیل‌شده\n• ${snapshot.statuses.activeTravels} در جریان\n• ${snapshot.statuses.pendingTravels} در انتظار\n\n${route ? `پرتکرارترین مسیر ${route.name} با ${route.trips} سفر است.` : "هنوز مسیر قابل تحلیل وجود ندارد."}`;
}

function financeAnswer(snapshot) {
  const margin =
    snapshot.totals.income > 0
      ? (snapshot.totals.net / snapshot.totals.income) * 100
      : 0;
  const expense = snapshot.largestExpenses[0];
  return `خلاصه مالی سیستم:\n• مجموع عاید: ${money(snapshot.totals.income)} افغانی\n• مجموع مصرف: ${money(snapshot.totals.expense)} افغانی\n• سود خالص: ${money(snapshot.totals.net)} افغانی\n• حاشیه سود: ${margin.toFixed(1)}٪\n• طلب باقی‌مانده از مشتری‌ها: ${money(snapshot.totals.debt)} افغانی\n\n${expense ? `بزرگ‌ترین مصرف ثبت‌شده «${expense.title}» به مبلغ ${money(expense.amount)} افغانی است.` : "مصرفی ثبت نشده است."}`;
}

function customerAnswer(snapshot) {
  const debtors = snapshot.customers.filter((customer) => customer.debt > 0);
  const top = debtors
    .slice(0, 5)
    .map(
      (customer, index) =>
        `${index + 1}. ${customer.name}: ${money(customer.debt)} افغانی بدهی`
    )
    .join("\n");
  return `در سیستم ${snapshot.totals.customers} مشتری ثبت است. مجموع طلب قابل دریافت ${money(snapshot.totals.debt)} افغانی و مجموع تخفیف‌ها ${money(snapshot.totals.discounts)} افغانی است.\n\n${top || "تمام مشتری‌ها تسویه هستند."}`;
}

function employeeAnswer(snapshot) {
  return `در حال حاضر ${snapshot.totals.employees} کارمند ثبت شده که ${snapshot.statuses.activeEmployees} تن آنان فعال هستند. از میان کارمندان، ${snapshot.totals.drivers} تن وظیفه دریور دارند و ${snapshot.statuses.activeDrivers} دریور فعال است.`;
}

function routeAnswer(snapshot) {
  const routes = snapshot.routes
    .slice(0, 7)
    .map(
      (route, index) =>
        `${index + 1}. ${route.name}: ${route.trips} سفر، ${money(route.kilometers)} کیلومتر و ${money(route.fare)} افغانی کرایه پایه`
    )
    .join("\n");
  return `در سیستم ${snapshot.totals.destinations} مقصد مستقل و ${snapshot.routes.length} مسیر دارای سفر ثبت است.\n\n${routes || "هنوز مسیر قابل تحلیل وجود ندارد."}`;
}

function executiveAnswer(snapshot) {
  const topRoute = snapshot.routes[0];
  const topDebtor = snapshot.customers.find((customer) => customer.debt > 0);
  const notes = [];
  if (snapshot.statuses.repairCars > 0) {
    notes.push(`${snapshot.statuses.repairCars} موتر در ترمیم است و باید زمان برگشت آن بررسی شود.`);
  }
  if (snapshot.totals.debt > 0) {
    notes.push(`${money(snapshot.totals.debt)} افغانی طلب مشتری‌ها هنوز دریافت نشده است.`);
  }
  if (snapshot.totals.net < 0) {
    notes.push("مصارف از عواید بیشتر است و وضعیت مالی نیاز به اقدام فوری دارد.");
  } else {
    notes.push(`سیستم فعلاً ${money(snapshot.totals.net)} افغانی سود خالص نشان می‌دهد.`);
  }

  return `گزارش مدیریتی سیستم:\n\n• ${snapshot.totals.cars} موتر، ${snapshot.totals.employees} کارمند (${snapshot.totals.drivers} دریور) و ${snapshot.totals.customers} مشتری ثبت است.\n• ${snapshot.totals.travels} سفر با مجموع ${money(snapshot.totals.kilometers)} کیلومتر انجام یا برنامه‌ریزی شده است.\n• عاید ${money(snapshot.totals.income)}، مصرف ${money(snapshot.totals.expense)} و سود خالص ${money(snapshot.totals.net)} افغانی است.\n• ${topRoute ? `مسیر برتر: ${topRoute.name} با ${topRoute.trips} سفر.` : "مسیر برتری هنوز مشخص نیست."}\n• ${topDebtor ? `بیشترین بدهی: ${topDebtor.name} با ${money(topDebtor.debt)} افغانی.` : "بدهی مشتری وجود ندارد."}\n\nنکات قابل اقدام:\n${notes.map((note) => `• ${note}`).join("\n")}`;
}

function localAnswer(question, snapshot) {
  const normalized = text(question)
    .toLowerCase()
    .replaceAll("ي", "ی")
    .replaceAll("ك", "ک");

  if (includesAny(normalized, ["موتر", "ماشین", "وسایط", "خودرو"])) {
    return carAnswer(snapshot);
  }
  if (includesAny(normalized, ["بدهی", "طلب", "قرض"])) {
    return customerAnswer(snapshot);
  }
  if (
    includesAny(normalized, [
      "عاید",
      "درآمد",
      "مصرف",
      "هزینه",
      "سود",
      "مالی",
    ])
  ) {
    return financeAnswer(snapshot);
  }
  if (includesAny(normalized, ["مشتری", "مسافر"])) {
    return customerAnswer(snapshot);
  }
  if (includesAny(normalized, ["کارمند", "کارمندان", "راننده", "دریور"])) {
    return employeeAnswer(snapshot);
  }
  if (includesAny(normalized, ["مقصد", "مسیر", "راه"])) {
    return routeAnswer(snapshot);
  }
  if (includesAny(normalized, ["سفر", "مسافرت"])) {
    return travelAnswer(snapshot);
  }
  return executiveAnswer(snapshot);
}

function compactSnapshot(snapshot) {
  return {
    generatedAt: snapshot.generatedAt,
    totals: snapshot.totals,
    statuses: snapshot.statuses,
    cars: snapshot.cars.slice(0, 30),
    customers: snapshot.customers.slice(0, 30),
    routes: snapshot.routes.slice(0, 30),
    recentTravels: snapshot.recentTravels,
    largestExpenses: snapshot.largestExpenses,
  };
}

function extractResponseText(response) {
  return (response.data.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text")
    .map((item) => item.text)
    .join("\n")
    .trim();
}

async function cloudAnswer(question, history, snapshot) {
  if (!process.env.OPENAI_API_KEY) return null;
  const conversation = (history || [])
    .slice(-8)
    .map((item) => `${item.role === "user" ? "کاربر" : "دستیار"}: ${text(item.content)}`)
    .join("\n");
  const response = await axios.post(
    "https://api.openai.com/v1/responses",
    {
      model: process.env.OPENAI_MODEL || "gpt-5.4-mini",
      instructions:
        "تو تحلیل‌گر ارشد یک سیستم مدیریت سفر در افغانستان هستی. فقط بر اساس داده JSON داده‌شده پاسخ بده. پاسخ را به زبان دری روان، دقیق، کوتاه و مدیریتی بنویس. ارقام مالی را با واحد افغانی ذکر کن. اگر داده کافی نیست، صریح بگو. هیچ داده‌ای را اختراع نکن.",
      input: `داده فعلی سیستم:\n${JSON.stringify(compactSnapshot(snapshot))}\n\nگفتگوی اخیر:\n${conversation}\n\nپرسش جدید: ${question}`,
      max_output_tokens: 900,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 45000,
    }
  );
  return extractResponseText(response) || null;
}

async function answerAdvancedReport(question, history, data) {
  const snapshot = buildSnapshot(data);
  let answer = null;
  let mode = "local";

  if (process.env.OPENAI_API_KEY) {
    try {
      answer = await cloudAnswer(question, history, snapshot);
      if (answer) mode = "openai";
    } catch (error) {
      console.error("Advanced report AI fallback:", error.response?.data || error.message);
    }
  }

  if (!answer) answer = localAnswer(question, snapshot);

  return {
    answer,
    mode,
    generatedAt: snapshot.generatedAt,
    sources: sourceList(snapshot),
    metrics: snapshot.totals,
    suggestions: [
      "چند موتر فعلاً دارم و وضعیت‌شان چیست؟",
      "یک گزارش کامل از عواید، مصارف و سود بده",
      "مشتری‌های بدهکار را برایم تحلیل کن",
      "کدام مسیر بیشترین سفر را داشته است؟",
      "کدام موتر بیشترین سفر و کیلومتر را دارد؟",
      "چند سفر در انتظار، در جریان و تکمیل‌شده دارم؟",
      "بزرگ‌ترین مصارف سیستم کدام‌ها هستند؟",
      "کدام مشتری بیشترین بدهی را دارد؟",
      "وضعیت فعلی رانندگان را خلاصه کن",
      "یک گزارش مدیریتی کامل برایم آماده کن",
      "برای بهترشدن سود سیستم چه مواردی را بررسی کنم؟",
      "مهم‌ترین مشکلات فعلی سیستم چیست؟",
    ],
  };
}

module.exports = { answerAdvancedReport, buildSnapshot };
