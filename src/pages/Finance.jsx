import { useMemo, useState } from "react";
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
  { id: "sales", title: "Sales Income" },
  { id: "service", title: "Services" },
  { id: "asset", title: "Assets" },
  { id: "salary", title: "Salary" },
  { id: "repair", title: "Repair" },
  { id: "fuel", title: "Fuel" },
  { id: "purchase", title: "Purchases" },
  { id: "customer-payment", title: "Customer Payment" },
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

  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState(null);

  const [deleteTransaction, setDeleteTransaction] =
    useState(null);

  const [openActionId, setOpenActionId] =
    useState("");

  const [search, setSearch] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const [formData, setFormData] =
    useState(emptyFinanceForm);

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
        title: `Travel Payment ${
          record.travelName || ""
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
            !transactions.some(
              (transaction) =>
                transaction.source ===
                  "customer-payment" &&
                String(
                  transaction.referenceId
                ) === String(payment.id)
            )
        )
        .map((payment) => ({
          id: `legacy-payment-${payment.id}`,
          type: "income",
          title:
            payment.title ||
            "Customer Payment",
          amount: Number(payment.amount || 0),
          date: payment.date,
          category: "Customer Payment",
          description:
            payment.description || "",
          source: "customer-payment",
          referenceId: payment.id,
          createdAt:
            payment.createdAt ||
            payment.updatedAt ||
            payment.date,
        }));

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
        title: `Travel Expense ${
          expense.travelName || ""
        }${
          expense.title
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
        title: `Vehicle Expense ${
          expense.carPlate || ""
        }${
          expense.title
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
          title: `Employee Payment ${
            payment.employeeName || ""
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

    return [
      ...transactions,
      ...legacyTravelPayments,
      ...legacyCustomerPayments,
      ...legacyTravelExpenses,
      ...legacyCarExpenses,
      ...legacyEmployeePayments,
    ];
  }, [
    transactions,
    customerTravels,
    customerPayments,
    travelExpenses,
    carRepairs,
    employeePayments,
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
    setShowModal(true);
  };

  const openEditModal = (transaction) => {
    if (transaction.source !== "manual") {
      notify(
        "System-generated financial records cannot be edited from this page.",
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
        "Please enter a category name.",
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
      "New category added successfully."
    );
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
        "Please select a date.",
        "error"
      );
      return;
    }

    if (!formData.title.trim()) {
      notify(
        "Please enter a title.",
        "error"
      );
      return;
    }

    if (!formData.category) {
      notify(
        "Please select a category.",
        "error"
      );
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      notify(
        "Amount must be greater than zero.",
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
        "Financial record updated successfully."
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
          ? "Income recorded successfully."
          : "Expense recorded successfully."
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
          "System-generated financial records cannot be deleted from this page.",
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
        "Financial record deleted successfully."
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
      return "Manual";
    }

    if (
      transaction.source ===
      "asset-purchase"
    ) {
      return "Asset Purchase";
    }

    if (
      transaction.source ===
      "customer-payment"
    ) {
      return "Customer Payment";
    }

    if (
      transaction.source ===
      "employee-payment"
    ) {
      return "Employee Payment";
    }

    if (
      transaction.source ===
      "travel-expense"
    ) {
      return "Travel Expense";
    }

    if (
      transaction.source ===
        "car-expense" ||
      transaction.source ===
        "car-repair"
    ) {
      return "Vehicle Expense";
    }

    return "System";
  };

  return (
    <div className="finance-page">
      <div className="finance-header">
        <div>
          <h1>
            Income and Expenses
          </h1>

          <p>
            Record income and expenses,
            manage categories, and review
            the complete financial flow.
          </p>
        </div>

        <button
          type="button"
          className="finance-add-btn"
          onClick={openAddModal}
        >
          + Add Income or Expense
        </button>
      </div>

      <div className="finance-stats">
        <div className="finance-stat-card income">
          <span>Total Income</span>

          <strong>
            {formatAmount(totalIncome)}
          </strong>

          <p>AFN received</p>
        </div>

        <div className="finance-stat-card expense">
          <span>Total Expenses</span>

          <strong>
            {formatAmount(totalExpense)}
          </strong>

          <p>AFN spent</p>
        </div>

        <div
          className={`finance-stat-card ${
            netResult >= 0
              ? "profit"
              : "loss"
          }`}
        >
          <span>
            {netResult >= 0
              ? "Net Profit"
              : "Net Loss"}
          </span>

          <strong>
            {formatAmount(
              Math.abs(netResult)
            )}
          </strong>

          <p>
            Difference between income
            and expenses
          </p>
        </div>
      </div>

      <div className="finance-visuals">
        <div className="finance-overview-card">
          <div className="finance-chart-title">
            <h3>
              Financial Overview
            </h3>

            <p>
              Compare total income,
              expenses, and net result.
            </p>
          </div>

          <div className="finance-progress-list">
            <div>
              <span>
                <b>Income</b>

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
                    width: `${
                      (totalIncome /
                        maximumAmount) *
                      100
                    }%`,
                  }}
                />
              </i>
            </div>

            <div>
              <span>
                <b>Expenses</b>

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
                    width: `${
                      (totalExpense /
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
                    ? "Net Profit"
                    : "Net Loss"}
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
                    width: `${
                      (Math.abs(
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
              Income, Expenses, and
              Net Result by Date
            </h3>

            <p>
              Review daily financial
              performance.
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
                  name="Income"
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
                  name="Expense"
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
                  name="Net Result"
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
              Income and Expense Records
            </h3>

            <p>
              Manual and automatic
              financial transactions.
            </p>
          </div>

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search financial records..."
          />
        </div>

        <div className="finance-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Source</th>
                <th>Description</th>
                <th>Actions</th>
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
                            ? "Income"
                            : "Expense"}
                        </span>
                      </td>

                      <td>
                        {transaction.title ||
                          "-"}
                      </td>

                      <td>
                        {transaction.category ||
                          "Other"}
                      </td>

                      <td>
                        {formatAmount(
                          transaction.amount
                        )}{" "}
                        AFN
                      </td>

                      <td>
                        <span
                          className={`finance-source-badge ${
                            isManual
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
                              aria-label="Open actions"
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
                                  Edit
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
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="finance-system-record">
                            System record
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
                    No financial record
                    has been registered
                    yet.
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
                    ? "Edit Manual Financial Record"
                    : "Add Manual Income or Expense"}
                </h3>

                <p>
                  Enter the date, type,
                  title, category, amount,
                  and description.
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
                  <label>Date</label>

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
                  <label>Type</label>

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
                      Income
                    </option>

                    <option value="expense">
                      Expense
                    </option>
                  </select>
                </div>

                <div className="finance-form-group">
                  <label>Title</label>

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
                    placeholder="Enter record title"
                    required
                  />
                </div>

                <div className="finance-form-group">
                  <label>Amount</label>

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
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div className="finance-form-group finance-form-full">
                  <label>
                    Category
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
                            {category}
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
                      placeholder="New category"
                    />

                    <button
                      type="button"
                      onClick={
                        addCategory
                      }
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="finance-form-group finance-form-full">
                  <label>
                    Description
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
                    placeholder="Optional description"
                  />
                </div>
              </div>

              <div className="finance-modal-actions">
                <button
                  type="button"
                  className="finance-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="finance-save-btn"
                >
                  {editingTransaction
                    ? "Save Changes"
                    : "Save Record"}
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
              Delete Financial Record
            </h3>

            <p>
              Are you sure you want to
              delete{" "}
              <strong>
                {deleteTransaction.title}
              </strong>
              ? This action cannot be
              undone.
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
                Cancel
              </button>

              <button
                type="button"
                className="finance-delete-btn"
                onClick={
                  confirmDeleteTransaction
                }
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Finance;