import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

import TablePagination from "../components/TablePagination";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { useLocalCollection } from "../hooks/useLocalCollection";
import { useTablePagination } from "../hooks/useTablePagination";
import { notify } from "../utils/notify";

import {
  formatAfghanDate,
  formatDateTime,
  todayDateValue,
} from "../utils/afghanDate";

import "./Finance.css";

const emptyFinanceForm = {
  date: todayDateValue(),
  title: "",
  category: "Other",
  amount: "",
  type: "income",
  description: "",
};

const defaultCategories = [
  {
    id: "project-sales",
    title: "Project Sales",
  },
  { id: "sales", title: "Sales Income" },
  { id: "service", title: "Services" },
  { id: "asset", title: "Assets" },
  { id: "salary", title: "Salary" },
  { id: "repair", title: "Repair" },
  { id: "fuel", title: "Fuel" },
  { id: "purchase", title: "Purchases" },
  { id: "supplier-payment", title: "Supplier Payment" },
  { id: "customer-payment", title: "Customer Payment" },
  { id: "customer-refund", title: "Customer Refund" },
  { id: "deposit", title: "Security Deposit" },
  { id: "other", title: "Other" },
];

function formatAmount(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function normalizeCategory(category) {
  if (!category) return "";

  if (typeof category === "string") {
    return category;
  }

  return (
    category.title ||
    category.name ||
    category.label ||
    String(category.id || "")
  );
}

function Finance() {
  const [transactions, setTransactions] =
    useJsonCollection("transactions");

  const [employeeAdjustments] =
    useLocalCollection("employeeAdjustments");

  const [financeCategories, setFinanceCategories] =
    useJsonCollection("financeCategories");

  const [customerPayments] =
    useJsonCollection("customerPayments");

  const [customerTravels] =
    useJsonCollection("customerTravels");

  const [travelExpenses] =
    useJsonCollection("travelExpenses");

  const [carRepairs] =
    useJsonCollection("carRepairs");

  const [employeePayments] =
    useJsonCollection("employeePayments");

  const [supplierPayments] =
    useJsonCollection("supplierPayments");

  const [assetMovements] =
    useJsonCollection("assetMovements");

  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState(null);

  const [deleteTransaction, setDeleteTransaction] =
    useState(null);

  const [openActionId, setOpenActionId] =
    useState("");

  const [search, setSearch] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryEditTitle, setCategoryEditTitle] = useState("");

  const [formData, setFormData] =
    useState(emptyFinanceForm);

  const [interfaceLanguage, setInterfaceLanguage] = useState(
    () => localStorage.getItem("isp-language") || "en"
  );

  useEffect(() => {
    const syncInterfaceLanguage = (event) => {
      const nextLanguage =
        event?.detail ||
        localStorage.getItem("isp-language") ||
        "en";

      setInterfaceLanguage(nextLanguage);
    };

    window.addEventListener(
      "isp-language-changed",
      syncInterfaceLanguage
    );
    window.addEventListener(
      "storage",
      syncInterfaceLanguage
    );

    return () => {
      window.removeEventListener(
        "isp-language-changed",
        syncInterfaceLanguage
      );
      window.removeEventListener(
        "storage",
        syncInterfaceLanguage
      );
    };
  }, []);

  const tx = (en, dr, ps) =>
    interfaceLanguage === "dr"
      ? dr
      : interfaceLanguage === "ps"
        ? ps
        : en;

  const translateFinanceValue = (value) => {
    const key = String(value || "");

    const labels = {
      Income: tx("Income", "عواید", "عاید"),
      Expense: tx("Expense", "مصارف", "لګښت"),
      Other: tx("Other", "سایر", "نور"),
      "Project Sales": tx("Project Sales", "فروش پروژه", "د پروژې پلور"),
      "Sales Income": tx("Sales Income", "عواید فروش", "د پلور عاید"),
      Services: tx("Services", "خدمات", "خدمتونه"),
      Assets: tx("Assets", "دارایی‌ها", "شتمنۍ"),
      Salary: tx("Salary", "معاش", "معاش"),
      Repair: tx("Repair", "ترمیم", "ترمیم"),
      Fuel: tx("Fuel", "سوخت", "سون توکي"),
      Purchases: tx("Purchases", "خریداری‌ها", "پېرودنې"),
      "Supplier Payment": tx("Supplier Payment", "پرداخت تأمین‌کننده", "د عرضه کوونکي تادیه"),
      "Customer Payment": tx("Customer Payment", "پرداخت مشتری", "د پېرودونکي تادیه"),
      "Customer Refund": tx("Customer Refund", "بازپرداخت مشتری", "پېرودونکي ته بېرته تادیه"),
      "Security Deposit": tx("Security Deposit", "ودیعه تضمینی", "ضمانتي امانت"),
      "Travel Income": tx("Travel Income", "عواید سفر", "د سفر عاید"),
      "Travel Expense": tx("Travel Expense", "مصارف سفر", "د سفر لګښت"),
      "Vehicle Expense": tx("Vehicle Expense", "مصارف وسایط", "د وسایطو لګښت"),
      "Employee Adjustment": tx("Employee Adjustment", "تعدیلات کارمند", "د کارکوونکي تعدیلات"),
      Manual: tx("Manual", "دستی", "لاسي"),
      System: tx("System", "سیستم", "سیسټم"),
      "Asset Purchase": tx("Asset Purchase", "خرید دارایی", "د شتمنۍ پېرود"),
      "Customer Payout": tx("Customer Payout", "پرداخت به مشتری", "پېرودونکي ته تادیه"),
      "Device Sale": tx("Device Sale", "فروش دستگاه", "د وسیلې پلور"),
      "Employee Payment": tx("Employee Payment", "پرداخت کارمند", "د کارکوونکي تادیه"),
    };

    return labels[key] || value;
  };

  const categoryOptions = useMemo(() => {
    const savedCategories = financeCategories
      .map(normalizeCategory)
      .filter(Boolean);

    return [
      ...new Set([
        ...defaultCategories.map(
          (category) => category.title
        ),
        ...savedCategories,
      ]),
    ];
  }, [financeCategories]);

  const customCategoryItems = useMemo(
    () =>
      financeCategories
        .map((category) => ({
          id:
            typeof category === "object" && category?.id
              ? category.id
              : normalizeCategory(category),
          title: normalizeCategory(category),
          raw: category,
        }))
        .filter((category) => category.title),
    [financeCategories]
  );

  const allTransactions = useMemo(() => {
    const legacyTravelPayments = customerTravels
      .filter(
        (record) =>
          Number(record.paidAmount || 0) > 0 &&
          !transactions.some(
            (transaction) =>
              transaction.source ===
              "customer-travel" &&
              String(transaction.referenceId) ===
              String(record.id)
          )
      )
      .map((record) => ({
        id: `legacy-travel-${record.id}`,
        type: "income",
        title: `Travel Payment ${record.travelName || ""
          }`,
        amount: Number(record.paidAmount || 0),
        date: record.date,
        category: "Travel Income",
        description:
          "Previously recorded customer payment",
        source: "customer-travel",
        referenceId: record.id,
        createdAt:
          record.createdAt ||
          record.updatedAt ||
          record.date,
      }));

    const legacyCustomerPayments =
      customerPayments
        .filter(
          (payment) =>
            payment.source !== "deposit-refund-offset" &&
            !transactions.some(
              (transaction) =>
                transaction.source ===
                "customer-payment" &&
                String(
                  transaction.referenceId
                ) === String(payment.id)
            )
        )
        .map((payment) => {
          const isPaidToCustomer =
            (payment.direction || payment.paymentDirection || "customer-to-us") ===
            "us-to-customer";

          return {
            id: `legacy-payment-${payment.id}`,
            type: isPaidToCustomer ? "expense" : "income",
            title:
              payment.title ||
              (isPaidToCustomer
                ? `Paid to Customer ${payment.customerName || ""}`.trim()
                : `Customer Payment ${payment.customerName || ""}`.trim()),
            amount: Number(payment.amount || 0),
            date: payment.paymentDate || payment.date,
            category: isPaidToCustomer ? "Customer Refund" : "Customer Payment",
            description:
              payment.description || payment.notes || "",
            source: "customer-payment",
            referenceId: payment.id,
            createdAt:
              payment.createdAt ||
              payment.updatedAt ||
              payment.paymentDate ||
              payment.date,
          };
        });

    const legacyTravelExpenses = travelExpenses
      .filter(
        (expense) =>
          !transactions.some(
            (transaction) =>
              transaction.source ===
              "travel-expense" &&
              String(
                transaction.referenceId
              ) === String(expense.id)
          )
      )
      .map((expense) => ({
        id: `legacy-travel-expense-${expense.id}`,
        type: "expense",
        title: `Travel Expense ${expense.travelName || ""
          }${expense.title
            ? `: ${expense.title}`
            : ""
          }`,
        amount: Number(expense.amount || 0),
        date: expense.date,
        category:
          expense.category ||
          "Travel Expense",
        description:
          expense.description || "",
        source: "travel-expense",
        referenceId: expense.id,
        createdAt:
          expense.createdAt ||
          expense.updatedAt ||
          expense.date,
      }));

    const legacyCarExpenses = carRepairs
      .filter(
        (expense) =>
          expense.source !== "travel-expense" &&
          !transactions.some(
            (transaction) =>
              [
                "car-expense",
                "car-repair",
              ].includes(
                transaction.source
              ) &&
              String(
                transaction.referenceId
              ) === String(expense.id)
          )
      )
      .map((expense) => ({
        id: `legacy-car-expense-${expense.id}`,
        type: "expense",
        title: `Vehicle Expense ${expense.carPlate || ""
          }${expense.title
            ? `: ${expense.title}`
            : ""
          }`,
        amount: Number(expense.amount || 0),
        date: expense.date,
        category:
          expense.category ||
          "Vehicle Expense",
        description:
          expense.description || "",
        source: "car-expense",
        referenceId: expense.id,
        createdAt:
          expense.createdAt ||
          expense.updatedAt ||
          expense.date,
      }));

    const legacyEmployeePayments =
      employeePayments
        .filter(
          (payment) =>
            !transactions.some(
              (transaction) =>
                transaction.source ===
                "employee-payment" &&
                String(
                  transaction.referenceId
                ) === String(payment.id)
            )
        )
        .map((payment) => ({
          id: `legacy-employee-payment-${payment.id}`,
          type: "expense",
          title: `Employee Payment ${payment.employeeName || ""
            }`,
          amount: Number(payment.amount || 0),
          date: payment.date,
          category: "Salary",
          description:
            payment.description || "",
          source: "employee-payment",
          referenceId: payment.id,
          createdAt:
            payment.createdAt ||
            payment.updatedAt ||
            payment.date,
        }));

    const legacySupplierPayments =
      supplierPayments
        .filter(
          (payment) =>
            payment.recordType !== "balance" &&
            payment.type !== "Balance" &&
            !transactions.some(
              (item) =>
                item.source ===
                "supplier-payment" &&
                String(item.referenceId || "") ===
                String(payment.id)
            )
        )
        .map((payment) => ({
          id: `legacy-supplier-payment-${payment.id}`,
          type: "expense",
          title: `Supplier Payment ${payment.supplierName || ""}`.trim(),
          amount: Number(payment.amount || 0),
          date: payment.paymentDate,
          category: "Supplier Payment",
          description: payment.notes,
          source: "supplier-payment",
          referenceId: payment.id,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        }));

    const legacyCustomerDeviceSales =
      assetMovements
        .filter(
          (movement) =>
            movement.movementType === "Transfer" &&
            (movement.transferType === "To Customer" ||
              movement.destinationType === "Customer" ||
              movement.transferType === "Main Stock to Customer" ||
              movement.transferType === "Customer to Customer") &&
            movement.dealType === "Sold" &&
            Number(movement.paidAmount || 0) > 0 &&
            !transactions.some(
              (transaction) =>
                transaction.source ===
                "customer-device-sale" &&
                String(transaction.referenceId || "") ===
                String(movement.id)
            )
        )
        .map((movement) => ({
          id: `legacy-customer-device-sale-${movement.id}`,
          type: "income",
          title: `Device Sale ${movement.deviceName || movement.assetId || ""}`.trim(),
          amount: Number(movement.paidAmount || 0),
          date: movement.date,
          category: "Customer Payment",
          description: [
            movement.destinationName
              ? `Customer: ${movement.destinationName}`
              : "",
            `Total: ${formatAmount(movement.totalAmount || 0)} AFN`,
            `Remaining: ${formatAmount(movement.remainingAmount || 0)} AFN`,
          ]
            .filter(Boolean)
            .join(" | "),
          source: "customer-device-sale",
          referenceId: movement.id,
          createdAt: movement.createdAt,
          updatedAt: movement.updatedAt,
        }));

    const legacyEmployeeAdjustments =
      employeeAdjustments
        .filter(
          (adjustment) =>
            !transactions.some(
              (transaction) =>
                transaction.source ===
                  "employee-adjustment" &&
                String(
                  transaction.referenceId
                ) === String(adjustment.id)
            )
        )
        .map((adjustment) => {
          const adjustmentType = String(
            adjustment.type || ""
          ).toLowerCase();

          const isIncome =
            adjustmentType === "penalty" ||
            adjustmentType === "debit";

          const typeLabel =
            adjustmentType === "salary"
              ? "Salary"
              : adjustmentType
                ? adjustmentType
                    .charAt(0)
                    .toUpperCase() +
                  adjustmentType.slice(1)
                : "Adjustment";

          return {
            id:
              `employee-adjustment-${adjustment.id}`,
            type: isIncome
              ? "income"
              : "expense",
            title:
              `Employee ${typeLabel} - ${
                adjustment.employeeName || ""
              }`.trim(),
            amount: Number(
              adjustment.amount || 0
            ),
            date:
              adjustment.date ||
              String(
                adjustment.createdAt || ""
              ).slice(0, 10),
            category:
              adjustmentType === "salary"
                ? "Salary"
                : "Employee Adjustment",
            description:
              adjustment.reason || "",
            source:
              "employee-adjustment",
            referenceId: adjustment.id,
            employeeId:
              adjustment.employeeId || "",
            employeeName:
              adjustment.employeeName || "",
            adjustmentType,
            createdAt:
              adjustment.createdAt ||
              adjustment.updatedAt ||
              adjustment.date,
            updatedAt:
              adjustment.updatedAt ||
              adjustment.createdAt,
          };
        });

    return [
      ...transactions,
      ...legacyEmployeeAdjustments,
      ...legacyTravelPayments,
      ...legacyCustomerPayments,
      ...legacyTravelExpenses,
      ...legacyCarExpenses,
      ...legacyEmployeePayments,
      ...legacySupplierPayments,
      ...legacyCustomerDeviceSales,
    ];
  }, [
    transactions,
    employeeAdjustments,
    customerTravels,
    customerPayments,
    travelExpenses,
    carRepairs,
    employeePayments,
    supplierPayments,
    assetMovements,
  ]);

  const totalIncome = allTransactions
    .filter(
      (transaction) =>
        transaction.type === "income"
    )
    .reduce(
      (sum, transaction) =>
        sum +
        Number(transaction.amount || 0),
      0
    );

  const totalExpense = allTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense"
    )
    .reduce(
      (sum, transaction) =>
        sum +
        Number(transaction.amount || 0),
      0
    );

  const netResult =
    totalIncome - totalExpense;

  const filteredTransactions = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return [...allTransactions]
      .filter((transaction) => {
        if (!query) return true;

        return [
          transaction.title,
          transaction.description,
          transaction.date,
          transaction.category,
          transaction.source,
          transaction.type,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((first, second) => {
        const firstTime = new Date(
          first.createdAt ||
          first.updatedAt ||
          first.date ||
          0
        ).getTime();

        const secondTime = new Date(
          second.createdAt ||
          second.updatedAt ||
          second.date ||
          0
        ).getTime();

        return secondTime - firstTime;
      });
  }, [allTransactions, search]);

  const financeByDate = useMemo(() => {
    const days = new Map();

    allTransactions.forEach(
      (transaction) => {
        const date =
          transaction.date || "-";

        const current =
          days.get(date) || {
            date,
            dateLabel: formatAfghanDate(
              transaction.date,
              {
                numeric: true,
              }
            ),
            income: 0,
            expense: 0,
            net: 0,
          };

        if (
          transaction.type === "income"
        ) {
          current.income += Number(
            transaction.amount || 0
          );
        } else {
          current.expense += Number(
            transaction.amount || 0
          );
        }

        current.net =
          current.income -
          current.expense;

        days.set(date, current);
      }
    );

    return [...days.values()].sort(
      (first, second) =>
        String(first.date).localeCompare(
          String(second.date)
        )
    );
  }, [allTransactions]);

  const maximumAmount = Math.max(
    totalIncome,
    totalExpense,
    Math.abs(netResult),
    1
  );

  const {
    page,
    setPage,
    totalPages,
    pageItems,
    pageSize,
    setPageSize,
  } = useTablePagination(
    filteredTransactions,
    search
  );

  const resetForm = () => {
    setFormData({
      ...emptyFinanceForm,
      category:
        formData.category || "Other",
    });

    setNewCategory("");
    setEditingCategory(null);
    setCategoryEditTitle("");
    setEditingTransaction(null);
  };

  const openAddModal = () => {
    setEditingTransaction(null);

    setFormData({
      date: todayDateValue(),
      title: "",
      category: "Other",
      amount: "",
      type: "income",
      description: "",
    });

    setNewCategory("");
    setEditingCategory(null);
    setCategoryEditTitle("");
    setShowModal(true);
  };

  const openEditModal = (transaction) => {
    if (transaction.source !== "manual") {
      notify(
        tx("System-generated financial records cannot be edited from this page.", "سوابق مالی ایجادشده توسط سیستم از این صفحه قابل ویرایش نیستند.", "د سیسټم لخوا جوړ شوي مالي ریکارډونه له دې پاڼې نه شي سمېدای."),
        "error"
      );
      return;
    }

    setEditingTransaction(transaction);

    setFormData({
      date:
        transaction.date ||
        todayDateValue(),

      title:
        transaction.title || "",

      category:
        transaction.category ||
        "Other",

      amount:
        String(
          transaction.amount || ""
        ),

      type:
        transaction.type ||
        "income",

      description:
        transaction.description || "",
    });

    setNewCategory("");
    setEditingCategory(null);
    setCategoryEditTitle("");
    setOpenActionId("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const addCategory = async () => {
    const title =
      newCategory.trim();

    if (!title) {
      notify(
        tx("Please enter a category name.", "لطفاً نام کتگوری را وارد کنید.", "مهرباني وکړئ د کټګورۍ نوم ولیکئ."),
        "error"
      );
      return;
    }

    const categoryExists =
      categoryOptions.some(
        (category) =>
          category.toLowerCase() ===
          title.toLowerCase()
      );

    if (categoryExists) {
      setFormData((previous) => ({
        ...previous,
        category: title,
      }));

      setNewCategory("");
      return;
    }

    const createdAt =
      new Date().toISOString();

    const saved =
      await setFinanceCategories([
        ...financeCategories,
        {
          id: `finance-category-${Date.now()}`,
          title,
          createdAt,
          updatedAt: createdAt,
        },
      ]);

    if (!saved) return;

    setFormData((previous) => ({
      ...previous,
      category: title,
    }));

    setNewCategory("");

    notify(
      tx("New category added successfully.", "کتگوری جدید با موفقیت اضافه شد.", "نوې کټګوري په بریالیتوب سره زیاته شوه.")
    );
  };

  const beginEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryEditTitle(category.title);
    setNewCategory("");
  };

  const saveCategoryEdit = async () => {
    const nextTitle = categoryEditTitle.trim();

    if (!editingCategory || !nextTitle) {
      notify(tx("Please enter a category name.", "لطفاً نام کتگوری را وارد کنید.", "مهرباني وکړئ د کټګورۍ نوم ولیکئ."), "error");
      return;
    }

    const oldTitle = editingCategory.title;
    const isDefaultCategory = defaultCategories.some(
      (category) =>
        category.title.toLowerCase() === nextTitle.toLowerCase()
    );
    const duplicateCategory = categoryOptions.some(
      (category) =>
        category.toLowerCase() === nextTitle.toLowerCase() &&
        category.toLowerCase() !== oldTitle.toLowerCase()
    );

    if (isDefaultCategory || duplicateCategory) {
      notify(tx("This category already exists.", "این کتگوری از قبل موجود است.", "دا کټګوري لا دمخه شته."), "error");
      return;
    }

    const updatedAt = new Date().toISOString();
    const categoriesSaved = await setFinanceCategories(
      financeCategories.map((category) => {
        const title = normalizeCategory(category);
        const id =
          typeof category === "object" && category?.id
            ? category.id
            : title;

        if (String(id) !== String(editingCategory.id)) {
          return category;
        }

        return typeof category === "object"
          ? { ...category, title: nextTitle, updatedAt }
          : { id: editingCategory.id, title: nextTitle, updatedAt };
      })
    );

    if (!categoriesSaved) return;

    const transactionsSaved = await setTransactions((previousTransactions) =>
      previousTransactions.map((transaction) =>
        transaction.category === oldTitle
          ? { ...transaction, category: nextTitle, updatedAt }
          : transaction
      )
    );

    if (!transactionsSaved) return;

    setFormData((previous) => ({
      ...previous,
      category:
        previous.category === oldTitle ? nextTitle : previous.category,
    }));
    setEditingCategory(null);
    setCategoryEditTitle("");
    notify(tx("Category updated successfully.", "کتگوری با موفقیت ویرایش شد.", "کټګوري په بریالیتوب سره سمه شوه."));
  };

  const deleteCategory = async (category) => {
    const categoriesSaved = await setFinanceCategories(
      financeCategories.filter((item) => {
        const title = normalizeCategory(item);
        const id =
          typeof item === "object" && item?.id
            ? item.id
            : title;

        return String(id) !== String(category.id);
      })
    );

    if (!categoriesSaved) return;

    const updatedAt = new Date().toISOString();
    const transactionsSaved = await setTransactions((previousTransactions) =>
      previousTransactions.map((transaction) =>
        transaction.category === category.title
          ? { ...transaction, category: "Other", updatedAt }
          : transaction
      )
    );

    if (!transactionsSaved) return;

    setFormData((previous) => ({
      ...previous,
      category:
        previous.category === category.title ? "Other" : previous.category,
    }));
    setEditingCategory(null);
    setCategoryEditTitle("");
    notify(tx("Category deleted successfully.", "کتگوری با موفقیت حذف شد.", "کټګوري په بریالیتوب سره حذف شوه."));
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const amount = Number(
      formData.amount
    );

    if (!formData.date) {
      notify(
        tx("Please select a date.", "لطفاً تاریخ را انتخاب کنید.", "مهرباني وکړئ نېټه وټاکئ."),
        "error"
      );
      return;
    }

    if (!formData.title.trim()) {
      notify(
        tx("Please enter a title.", "لطفاً عنوان را وارد کنید.", "مهرباني وکړئ سرلیک ولیکئ."),
        "error"
      );
      return;
    }

    if (!formData.category) {
      notify(
        tx("Please select a category.", "لطفاً کتگوری را انتخاب کنید.", "مهرباني وکړئ کټګوري وټاکئ."),
        "error"
      );
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      notify(
        tx("Amount must be greater than zero.", "مبلغ باید بیشتر از صفر باشد.", "اندازه باید له صفر څخه زیاته وي."),
        "error"
      );
      return;
    }

    const updatedAt =
      new Date().toISOString();

    if (editingTransaction) {
      const saved =
        await setTransactions(
          transactions.map(
            (transaction) =>
              String(transaction.id) ===
                String(
                  editingTransaction.id
                )
                ? {
                  ...transaction,
                  date: formData.date,
                  title:
                    formData.title.trim(),
                  category:
                    formData.category,
                  amount,
                  type: formData.type,
                  description:
                    formData.description.trim(),
                  updatedAt,
                }
                : transaction
          )
        );

      if (!saved) return;

      notify(
        tx("Financial record updated successfully.", "رکورد مالی با موفقیت ویرایش شد.", "مالي ریکارډ په بریالیتوب سره سم شو.")
      );
    } else {
      const saved =
        await setTransactions([
          ...transactions,
          {
            id: `finance-transaction-${Date.now()}`,
            date: formData.date,
            title:
              formData.title.trim(),
            category:
              formData.category,
            amount,
            type: formData.type,
            description:
              formData.description.trim(),
            source: "manual",
            createdAt: updatedAt,
            updatedAt,
          },
        ]);

      if (!saved) return;

      notify(
        formData.type === "income"
          ? tx("Income recorded successfully.", "عواید با موفقیت ثبت شد.", "عاید په بریالیتوب سره ثبت شو.")
          : tx("Expense recorded successfully.", "مصرف با موفقیت ثبت شد.", "لګښت په بریالیتوب سره ثبت شو.")
      );
    }

    closeModal();
  };

  const confirmDeleteTransaction =
    async () => {
      if (!deleteTransaction) {
        return;
      }

      if (
        deleteTransaction.source !==
        "manual"
      ) {
        notify(
          tx("System-generated financial records cannot be deleted from this page.", "سوابق مالی ایجادشده توسط سیستم از این صفحه قابل حذف نیستند.", "د سیسټم لخوا جوړ شوي مالي ریکارډونه له دې پاڼې نه شي حذف کېدای."),
          "error"
        );

        setDeleteTransaction(null);
        return;
      }

      const saved =
        await setTransactions(
          transactions.filter(
            (transaction) =>
              String(transaction.id) !==
              String(
                deleteTransaction.id
              )
          )
        );

      if (!saved) return;

      notify(
        tx("Financial record deleted successfully.", "رکورد مالی با موفقیت حذف شد.", "مالي ریکارډ په بریالیتوب سره حذف شو.")
      );

      setDeleteTransaction(null);
      setOpenActionId("");
    };

  const getSourceLabel = (
    transaction
  ) => {
    if (
      transaction.source === "manual"
    ) {
      return tx("Manual", "دستی", "لاسي");
    }

    if (
      transaction.source ===
      "asset-purchase"
    ) {
      return tx("Asset Purchase", "خرید دارایی", "د شتمنۍ پېرود");
    }

    if (
      transaction.source ===
      "customer-payment"
    ) {
      return transaction.type === "expense"
        ? tx("Customer Payout", "پرداخت به مشتری", "پېرودونکي ته تادیه")
        : tx("Customer Payment", "پرداخت مشتری", "د پېرودونکي تادیه");
    }

    if (
      transaction.source ===
      "customer-device-sale"
    ) {
      return tx("Device Sale", "فروش دستگاه", "د وسیلې پلور");
    }

    if (
      transaction.source ===
      "employee-adjustment"
    ) {
      return tx("Employee Adjustment", "تعدیلات کارمند", "د کارکوونکي تعدیلات");
    }

    if (
      transaction.source ===
      "employee-payment"
    ) {
      return tx("Employee Payment", "پرداخت کارمند", "د کارکوونکي تادیه");
    }

    if (
      transaction.source ===
      "supplier-payment"
    ) {
      return tx("Supplier Payment", "پرداخت تأمین‌کننده", "د عرضه کوونکي تادیه");
    }

    if (
      transaction.source ===
      "travel-expense"
    ) {
      return tx("Travel Expense", "مصارف سفر", "د سفر لګښت");
    }

    if (
      transaction.source ===
      "car-expense" ||
      transaction.source ===
      "car-repair"
    ) {
      return tx("Vehicle Expense", "مصارف وسایط", "د وسایطو لګښت");
    }

    return tx("System", "سیستم", "سیسټم");
  };

  return (
    <div className={`finance-page ${interfaceLanguage !== "en" ? "finance-page-rtl" : ""}`}>
      <div className="finance-header">
        <div>
          <h1>
            {tx("Income and Expenses", "عواید و مصارف", "عاید او لګښتونه")}
          </h1>

          <p>
            {tx(
              "Record income and expenses, manage categories, and review the complete financial flow.",
              "عواید و مصارف را ثبت کرده، کتگوری‌ها را مدیریت و جریان کامل مالی را بررسی کنید.",
              "عاید او لګښتونه ثبت کړئ، کټګورۍ مدیریت کړئ او بشپړ مالي جریان وڅېړئ."
            )}
          </p>
        </div>

        <button
          type="button"
          className="finance-add-btn"
          onClick={openAddModal}
        >
          + {tx("Add Income or Expense", "افزودن عاید یا مصرف", "عاید یا لګښت زیاتول")}
        </button>
      </div>

      <div className="finance-stats">
        <div className="finance-stat-card income">
          <span>{tx("Total Income", "مجموع عواید", "ټول عاید")}</span>

          <strong>
            {formatAmount(totalIncome)}
          </strong>

          <p>{tx("AFN received", "افغانی دریافت‌شده", "ترلاسه شوي افغانۍ")}</p>
        </div>

        <div className="finance-stat-card expense">
          <span>{tx("Total Expenses", "مجموع مصارف", "ټول لګښتونه")}</span>

          <strong>
            {formatAmount(totalExpense)}
          </strong>

          <p>{tx("AFN spent", "افغانی مصرف‌شده", "لګول شوي افغانۍ")}</p>
        </div>

        <div
          className={`finance-stat-card ${netResult >= 0
              ? "profit"
              : "loss"
            }`}
        >
          <span>
            {netResult >= 0
              ? tx("Net Profit", "سود خالص", "خالصه ګټه")
              : tx("Net Loss", "زیان خالص", "خالص تاوان")}
          </span>

          <strong>
            {formatAmount(
              Math.abs(netResult)
            )}
          </strong>

          <p>
            {tx(
              "Difference between income and expenses",
              "تفاوت میان عواید و مصارف",
              "د عاید او لګښتونو توپیر"
            )}
          </p>
        </div>
      </div>

      <div className="finance-visuals">
        <div className="finance-overview-card">
          <div className="finance-chart-title">
            <h3>
              {tx("Financial Overview", "نمای کلی مالی", "مالي عمومي کتنه")}
            </h3>

            <p>
              {tx(
                "Compare total income, expenses, and net result.",
                "مجموع عواید، مصارف و نتیجه خالص را مقایسه کنید.",
                "ټول عاید، لګښتونه او خالصه پایله پرتله کړئ."
              )}
            </p>
          </div>

          <div className="finance-progress-list">
            <div>
              <span>
                <b>{tx("Income", "عواید", "عاید")}</b>

                <strong>
                  {formatAmount(
                    totalIncome
                  )}
                </strong>
              </span>

              <i>
                <em
                  className="income"
                  style={{
                    width: `${(totalIncome /
                        maximumAmount) *
                      100
                      }%`,
                  }}
                />
              </i>
            </div>

            <div>
              <span>
                <b>{tx("Expenses", "مصارف", "لګښتونه")}</b>

                <strong>
                  {formatAmount(
                    totalExpense
                  )}
                </strong>
              </span>

              <i>
                <em
                  className="expense"
                  style={{
                    width: `${(totalExpense /
                        maximumAmount) *
                      100
                      }%`,
                  }}
                />
              </i>
            </div>

            <div>
              <span>
                <b>
                  {netResult >= 0
                    ? tx("Net Profit", "سود خالص", "خالصه ګټه")
                    : tx("Net Loss", "زیان خالص", "خالص تاوان")}
                </b>

                <strong>
                  {formatAmount(
                    Math.abs(netResult)
                  )}
                </strong>
              </span>

              <i>
                <em
                  className={
                    netResult >= 0
                      ? "profit"
                      : "loss"
                  }
                  style={{
                    width: `${(Math.abs(
                      netResult
                    ) /
                        maximumAmount) *
                      100
                      }%`,
                  }}
                />
              </i>
            </div>
          </div>
        </div>

        <div className="finance-chart-card">
          <div className="finance-chart-title">
            <h3>
              {tx(
                "Income, Expenses, and Net Result by Date",
                "عواید، مصارف و نتیجه خالص بر اساس تاریخ",
                "عاید، لګښتونه او خالصه پایله د نېټې له مخې"
              )}
            </h3>

            <p>
              {tx(
                "Review daily financial performance.",
                "عملکرد مالی روزانه را بررسی کنید.",
                "ورځنی مالي فعالیت وڅېړئ."
              )}
            </p>
          </div>

          <div className="finance-chart">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <ComposedChart
                data={financeByDate}
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                />

                <XAxis
                  dataKey="dateLabel"
                  tick={{
                    fontSize: 10,
                  }}
                />

                <YAxis
                  tick={{
                    fontSize: 10,
                  }}
                />

                <Tooltip
                  formatter={(value) =>
                    `${formatAmount(
                      value
                    )} AFN`
                  }
                />

                <Bar
                  dataKey="income"
                  name={tx("Income", "عواید", "عاید")}
                  fill="#16a34a"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />

                <Bar
                  dataKey="expense"
                  name={tx("Expense", "مصارف", "لګښت")}
                  fill="#dc2626"
                  radius={[
                    6,
                    6,
                    0,
                    0,
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="net"
                  name={tx("Net Result", "نتیجه خالص", "خالصه پایله")}
                  stroke="#2563eb"
                  strokeWidth={3}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="finance-table-card">
        <div className="finance-table-header">
          <div>
            <h3>
              {tx("Income and Expense Records", "سوابق عواید و مصارف", "د عاید او لګښت ریکارډونه")}
            </h3>

            <p>
              {tx(
                "Manual and automatic financial transactions.",
                "تراکنش‌های مالی دستی و خودکار.",
                "لاسي او اتومات مالي معاملې."
              )}
            </p>
          </div>

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder={tx(
              "Search financial records...",
              "جستجوی سوابق مالی...",
              "مالي ریکارډونه ولټوئ..."
            )}
          />
        </div>

        <div className="finance-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{tx("Date", "تاریخ", "نېټه")}</th>
                <th>{tx("Type", "نوع", "ډول")}</th>
                <th>{tx("Title", "عنوان", "سرلیک")}</th>
                <th>{tx("Category", "کتگوری", "کټګوري")}</th>
                <th>{tx("Amount", "مبلغ", "اندازه")}</th>
                <th>{tx("Source", "منبع", "سرچینه")}</th>
                <th>{tx("Description", "توضیحات", "تشریح")}</th>
                <th>{tx("Actions", "عملیات", "عملونه")}</th>
              </tr>
            </thead>

            <tbody>
              {pageItems.map(
                (transaction) => {
                  const isManual =
                    transaction.source ===
                    "manual";

                  return (
                    <tr
                      key={
                        transaction.id
                      }
                      className={
                        transaction.type ===
                          "income"
                          ? "finance-income-row"
                          : "finance-expense-row"
                      }
                    >
                      <td>
                        {formatDateTime(
                          transaction.date,
                          transaction.createdAt ||
                          transaction.updatedAt
                        )}
                      </td>

                      <td>
                        <span
                          className={`finance-badge ${transaction.type}`}
                        >
                          {transaction.type ===
                            "income"
                            ? tx("Income", "عواید", "عاید")
                            : tx("Expense", "مصارف", "لګښت")}
                        </span>
                      </td>

                      <td>
                        {transaction.title ||
                          "-"}
                      </td>

                      <td>
                        {translateFinanceValue(
                          transaction.category || "Other"
                        )}
                      </td>

                      <td>
                        {formatAmount(
                          transaction.amount
                        )}{" "}
                        AFN
                      </td>

                      <td>
                        <span
                          className={`finance-source-badge ${isManual
                              ? "manual"
                              : "system"
                            }`}
                        >
                          {getSourceLabel(
                            transaction
                          )}
                        </span>
                      </td>

                      <td>
                        {transaction.description ||
                          "-"}
                      </td>

                      <td>
                        {isManual ? (
                          <div className="finance-actions">
                            <button
                              type="button"
                              className="finance-action-toggle"
                              aria-label={tx("Open actions", "باز کردن عملیات", "عملونه پرانیستل")}
                              aria-expanded={
                                String(
                                  openActionId
                                ) ===
                                String(
                                  transaction.id
                                )
                              }
                              onClick={() =>
                                setOpenActionId(
                                  (
                                    current
                                  ) =>
                                    String(
                                      current
                                    ) ===
                                      String(
                                        transaction.id
                                      )
                                      ? ""
                                      : transaction.id
                                )
                              }
                            >
                              <MoreVertical
                                size={17}
                              />
                            </button>

                            {String(
                              openActionId
                            ) ===
                              String(
                                transaction.id
                              ) && (
                                <div className="finance-action-menu">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditModal(
                                        transaction
                                      )
                                    }
                                  >
                                    <Pencil
                                      size={15}
                                    />
                                    {tx("Edit", "ویرایش", "سمول")}
                                  </button>

                                  <button
                                    type="button"
                                    className="danger"
                                    onClick={() => {
                                      setDeleteTransaction(
                                        transaction
                                      );

                                      setOpenActionId(
                                        ""
                                      );
                                    }}
                                  >
                                    <Trash2
                                      size={15}
                                    />
                                    {tx("Delete", "حذف", "حذف")}
                                  </button>
                                </div>
                              )}
                          </div>
                        ) : (
                          <span className="finance-system-record">
                            {tx("System record", "رکورد سیستمی", "سیسټمي ریکارډ")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                }
              )}

              {filteredTransactions.length ===
                0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="finance-empty"
                    >
                      {tx(
                        "No financial record has been registered yet.",
                        "هنوز هیچ رکورد مالی ثبت نشده است.",
                        "تر اوسه هېڅ مالي ریکارډ نه دی ثبت شوی."
                      )}
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          totalItems={
            filteredTransactions.length
          }
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </div>

      {showModal && (
        <div
          className="finance-modal-backdrop"
          onClick={closeModal}
        >
          <div
            className="finance-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="finance-modal-header">
              <div>
                <h3>
                  {editingTransaction
                    ? tx("Edit Manual Financial Record", "ویرایش رکورد مالی دستی", "لاسي مالي ریکارډ سمول")
                    : tx("Add Manual Income or Expense", "افزودن عاید یا مصرف دستی", "لاسي عاید یا لګښت زیاتول")}
                </h3>

                <p>
                  {tx(
                    "Enter the date, type, title, category, amount, and description.",
                    "تاریخ، نوع، عنوان، کتگوری، مبلغ و توضیحات را وارد کنید.",
                    "نېټه، ډول، سرلیک، کټګوري، اندازه او تشریح ولیکئ."
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
            >
              <div className="finance-form-grid">
                <div className="finance-form-group">
                  <label>{tx("Date", "تاریخ", "نېټه")}</label>

                  <input
                    type="date"
                    value={
                      formData.date
                    }
                    onChange={(event) =>
                      setFormData(
                        (previous) => ({
                          ...previous,
                          date:
                            event.target
                              .value,
                        })
                      )
                    }
                    required
                  />
                </div>

                <div className="finance-form-group">
                  <label>{tx("Type", "نوع", "ډول")}</label>

                  <select
                    value={
                      formData.type
                    }
                    onChange={(event) =>
                      setFormData(
                        (previous) => ({
                          ...previous,
                          type:
                            event.target
                              .value,
                        })
                      )
                    }
                  >
                    <option value="income">
                      {tx("Income", "عواید", "عاید")}
                    </option>

                    <option value="expense">
                      {tx("Expense", "مصارف", "لګښت")}
                    </option>
                  </select>
                </div>

                <div className="finance-form-group">
                  <label>{tx("Title", "عنوان", "سرلیک")}</label>

                  <input
                    value={
                      formData.title
                    }
                    onChange={(event) =>
                      setFormData(
                        (previous) => ({
                          ...previous,
                          title:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder={tx("Enter record title", "عنوان رکورد را وارد کنید", "د ریکارډ سرلیک ولیکئ")}
                    required
                  />
                </div>

                <div className="finance-form-group">
                  <label>{tx("Amount", "مبلغ", "اندازه")}</label>

                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={
                      formData.amount
                    }
                    onChange={(event) =>
                      setFormData(
                        (previous) => ({
                          ...previous,
                          amount:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder={tx("Enter amount", "مبلغ را وارد کنید", "اندازه ولیکئ")}
                    required
                  />
                </div>

                <div className="finance-form-group finance-form-full">
                  <label>
                    {tx("Category", "کتگوری", "کټګوري")}
                  </label>

                  <div className="finance-category-row">
                    <select
                      value={
                        formData.category
                      }
                      onChange={(
                        event
                      ) =>
                        setFormData(
                          (
                            previous
                          ) => ({
                            ...previous,
                            category:
                              event
                                .target
                                .value,
                          })
                        )
                      }
                    >
                      {categoryOptions.map(
                        (category) => (
                          <option
                            value={
                              category
                            }
                            key={
                              category
                            }
                          >
                            {translateFinanceValue(category)}
                          </option>
                        )
                      )}
                    </select>

                    <input
                      value={
                        newCategory
                      }
                      onChange={(event) =>
                        setNewCategory(
                          event.target
                            .value
                        )
                      }
                      placeholder={tx("New category", "کتگوری جدید", "نوې کټګوري")}
                    />

                    <button
                      type="button"
                      onClick={
                        addCategory
                      }
                    >
                      {tx("Add", "افزودن", "زیاتول")}
                    </button>
                  </div>

                  {customCategoryItems.length > 0 && (
                    <div className="finance-category-manager">
                      {customCategoryItems.map((category) => (
                        <div className="finance-category-item" key={category.id}>
                          {String(editingCategory?.id) === String(category.id) ? (
                            <>
                              <input
                                value={categoryEditTitle}
                                onChange={(event) =>
                                  setCategoryEditTitle(event.target.value)
                                }
                              />
                              <button type="button" onClick={saveCategoryEdit}>
                                {tx("Save", "ذخیره", "خوندي کول")}
                              </button>
                              <button
                                type="button"
                                className="muted"
                                onClick={() => {
                                  setEditingCategory(null);
                                  setCategoryEditTitle("");
                                }}
                              >
                                {tx("Cancel", "لغو", "لغوه")}
                              </button>
                            </>
                          ) : (
                            <>
                              <span>{translateFinanceValue(category.title)}</span>
                              <button
                                type="button"
                                onClick={() => beginEditCategory(category)}
                              >
                                {tx("Edit", "ویرایش", "سمول")}
                              </button>
                              <button
                                type="button"
                                className="danger"
                                onClick={() => deleteCategory(category)}
                              >
                                {tx("Delete", "حذف", "حذف")}
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="finance-form-group finance-form-full">
                  <label>
                    {tx("Description", "توضیحات", "تشریح")}
                  </label>

                  <textarea
                    rows="4"
                    value={
                      formData.description
                    }
                    onChange={(event) =>
                      setFormData(
                        (previous) => ({
                          ...previous,
                          description:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder={tx("Optional description", "توضیحات اختیاری", "اختیاري تشریح")}
                  />
                </div>
              </div>

              <div className="finance-modal-actions">
                <button
                  type="button"
                  className="finance-cancel-btn"
                  onClick={closeModal}
                >
                  {tx("Cancel", "لغو", "لغوه")}
                </button>

                <button
                  type="submit"
                  className="finance-save-btn"
                >
                  {editingTransaction
                    ? tx("Save Changes", "ذخیره تغییرات", "بدلونونه خوندي کړئ")
                    : tx("Save Record", "ذخیره رکورد", "ریکارډ خوندي کړئ")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTransaction && (
        <div
          className="finance-modal-backdrop"
          onClick={() =>
            setDeleteTransaction(null)
          }
        >
          <div
            className="finance-delete-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="finance-delete-icon">
              <Trash2 size={22} />
            </div>

            <h3>
              {tx("Delete Financial Record", "حذف رکورد مالی", "مالي ریکارډ حذف کول")}
            </h3>

            <p>
              {tx(
                "Are you sure you want to delete",
                "آیا مطمئن هستید که می‌خواهید حذف کنید",
                "ایا ډاډه یاست چې حذف یې کړئ"
              )}{" "}
              <strong>
                {deleteTransaction.title}
              </strong>
              ؟{" "}
              {tx(
                "This action cannot be undone.",
                "این عمل قابل بازگشت نیست.",
                "دا عمل بېرته نه شي راګرځېدلی."
              )}
            </p>

            <div className="finance-delete-actions">
              <button
                type="button"
                className="finance-cancel-btn"
                onClick={() =>
                  setDeleteTransaction(
                    null
                  )
                }
              >
                {tx("Cancel", "لغو", "لغوه")}
              </button>

              <button
                type="button"
                className="finance-delete-btn"
                onClick={
                  confirmDeleteTransaction
                }
              >
                {tx("Delete", "حذف", "حذف")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Finance;