import { useEffect, useMemo, useRef, useState } from "react";
import { Edit3, Plus, Send, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { todayDateValue } from "../utils/afghanDate";
import "./Agent.css";

const STORAGE_KEY = "isp-agent-conversations";

const money = (value) => `${Number(value || 0).toLocaleString("en-US")} AFN`;
const number = (value) => Number(value || 0).toLocaleString("en-US");
const lower = (value) => String(value || "").toLowerCase();
const today = todayDateValue();

const suggestedSections = [
  {
    title: "Dashboard",
    questions: [
      "How many customers do I have?",
      "How many active customers do I have?",
      "How many inactive customers do I have?",
      "How many assets do I have?",
      "How many assets are in Main Stock?",
      "How many assets are with customers?",
      "How many assets are at towers?",
      "How many damaged assets do I have?",
      "How many lost assets do I have?",
      "How many assets are under repair?",
    ],
  },
  {
    title: "Financial",
    questions: [
      "What is today's income?",
      "What is today's expense?",
      "What is today's net balance?",
      "What is total income?",
      "What is total expense?",
      "What is total profit?",
      "How much deposit is held?",
      "How much deposit is outstanding?",
      "How much purchase value do I have?",
      "Which customer owes us money?",
    ],
  },
  {
    title: "Inventory",
    questions: [
      "Which assets are low stock?",
      "Show me main stock summary",
      "Which assets are damaged?",
      "Which assets are lost?",
      "Which assets are in repair?",
      "Show asset categories",
      "Which asset has the highest quantity?",
      "Which asset has the highest value?",
      "How many transfers do I have?",
      "Show recent transfers",
    ],
  },
  {
    title: "Customers, Towers, Suppliers",
    questions: [
      "Which suppliers do we owe?",
      "Which supplier has the most purchases?",
      "How many towers do I have?",
      "Which tower has the most assets?",
      "Which customers have deposits?",
      "Show package payments today",
      "Show customer sales today",
      "Show repair expenses today",
      "Show supplier payments today",
      "Show system summary",
    ],
  },
];

const defaultConversation = () => ({
  id: `chat-${Date.now()}`,
  title: "New Conversation",
  createdAt: new Date().toISOString(),
  messages: [
    {
      id: `msg-${Date.now()}`,
      role: "assistant",
      text: "Hello. I am your system Agent. Ask me about customers, assets, stock, transfers, income, expenses, suppliers, towers, deposits, and repair records.",
      feedback: "",
    },
  ],
});

function loadConversations() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) && saved.length ? saved : [defaultConversation()];
  } catch {
    return [defaultConversation()];
  }
}

function transactionAmountBy(transactions, type, date) {
  return transactions
    .filter((item) => item.type === type)
    .filter((item) => !date || String(item.date || item.createdAt || "").startsWith(date))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function formatList(items, emptyText = "No matching record was found.") {
  if (!items.length) return emptyText;
  return items.slice(0, 8).join("\n");
}

function buildAnswer(question, data) {
  const q = lower(question);
  const {
    assets,
    customers,
    suppliers,
    transactions,
    deviceTransfers,
    towerAssets,
    securityDeposits,
    supplierPurchases,
  } = data;

  const totalIncome = transactionAmountBy(transactions, "income");
  const totalExpense = transactionAmountBy(transactions, "expense");
  const todayIncome = transactionAmountBy(transactions, "income", today);
  const todayExpense = transactionAmountBy(transactions, "expense", today);
  const mainStockQuantity = assets.reduce((sum, asset) => sum + Number(asset.quantity || 0), 0);
  const totalAssetValue = assets.reduce(
    (sum, asset) => sum + Number(asset.quantity || 0) * Number(asset.unitPrice || asset.salePrice || 0),
    0
  );
  const activeTransfers = deviceTransfers.filter(
    (item) => !/rejected/i.test(String(item.approvalStatus || "Approved"))
  );
  const transferQty = (field, type) =>
    activeTransfers
      .filter((item) => lower(item[field]) === lower(type))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const towerQuantity = Math.max(transferQty("destinationType", "Tower") - transferQty("sourceType", "Tower"), 0);
  const customerQuantity = Math.max(
    transferQty("destinationType", "Customer") - transferQty("sourceType", "Customer"),
    0
  );
  const damagedQuantity = transferQty("destinationType", "Damaged");
  const lostQuantity = transferQty("destinationType", "Lost");
  const repairQuantity = Math.max(transferQty("destinationType", "Repair") - transferQty("sourceType", "Repair"), 0);
  const inactiveCustomers = customers.filter((customer) =>
    /inactive|disabled|disconnected/i.test(String(customer.status || ""))
  );
  const depositsHeld = securityDeposits.reduce(
    (sum, item) => sum + Number(item.remainingDeposit || item.amount || item.depositAmount || 0),
    0
  );
  const outstandingDeposits = securityDeposits.reduce(
    (sum, item) => sum + Number(item.outstandingAmount || item.remainingDeposit || 0),
    0
  );
  const purchaseValue = Math.max(
    supplierPurchases.reduce((sum, item) => sum + Number(item.totalPurchaseValue || item.totalAmount || 0), 0),
    totalAssetValue
  );

  if (/how many customers|چقدر مشتری|customers do i have|total customers/.test(q)) {
    return `You have ${number(customers.length)} customer record(s).`;
  }

  if (/active customers/.test(q)) {
    const active = customers.filter((customer) => !/inactive|disabled|disconnected/i.test(String(customer.status || "")));
    return `You have ${number(active.length)} active customer(s).`;
  }

  if (/inactive customers/.test(q)) {
    return `You have ${number(inactiveCustomers.length)} inactive or disconnected customer(s).`;
  }

  if (/total assets|how many assets|assets do i have/.test(q)) {
    return `You have ${number(assets.length)} asset definition(s), with ${number(mainStockQuantity)} unit(s) currently recorded in Main Stock.`;
  }

  if (/main stock/.test(q) && /summary|asset|quantity|stock/.test(q)) {
    return `Main Stock summary:\nAssets in stock: ${number(assets.filter((asset) => Number(asset.quantity || 0) > 0).length)}\nTotal quantity: ${number(mainStockQuantity)}\nStock value: ${money(totalAssetValue)}`;
  }

  if (/with customers|customer-held|customers/.test(q) && /asset|device/.test(q)) {
    return `Assets currently calculated with customers: ${number(customerQuantity)} unit(s).`;
  }

  if (/at towers|tower-held|tower/.test(q) && /asset|device/.test(q)) {
    return `Assets currently calculated at towers: ${number(towerQuantity)} unit(s).`;
  }

  if (/damaged/.test(q)) {
    const rows = assets.filter((asset) => /damaged|damage/i.test(`${asset.status || ""} ${asset.currentStatus || ""}`));
    return `Damaged assets: ${number(Math.max(damagedQuantity, rows.length))} unit(s).\n${formatList(
      rows.map((asset) => `- ${asset.assetId || asset.id} - ${asset.deviceName || asset.name || "Asset"}`)
    )}`;
  }

  if (/lost/.test(q)) {
    const rows = assets.filter((asset) => /lost/i.test(`${asset.status || ""} ${asset.currentStatus || ""}`));
    return `Lost assets: ${number(Math.max(lostQuantity, rows.length))} unit(s).\n${formatList(
      rows.map((asset) => `- ${asset.assetId || asset.id} - ${asset.deviceName || asset.name || "Asset"}`)
    )}`;
  }

  if (/repair/.test(q) && /expense/.test(q)) {
    const total = transactions
      .filter((item) => /repair/i.test(`${item.category || ""} ${item.source || ""} ${item.title || ""}`))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const todayTotal = transactions
      .filter((item) => item.type === "expense")
      .filter((item) => String(item.date || "").startsWith(today))
      .filter((item) => /repair/i.test(`${item.category || ""} ${item.source || ""} ${item.title || ""}`))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return `Repair expenses:\nToday: ${money(todayTotal)}\nTotal: ${money(total)}`;
  }

  if (/under repair|in repair|repair/.test(q)) {
    return `Assets currently under repair: ${number(repairQuantity)} unit(s).`;
  }

  if (/today.*income|income today|عواید امروز/.test(q)) {
    return `Today's income is ${money(todayIncome)}.`;
  }

  if (/today.*expense|expense today|مصارف امروز/.test(q)) {
    return `Today's expense is ${money(todayExpense)}.`;
  }

  if (/today.*net|net balance/.test(q)) {
    return `Today's net balance is ${money(todayIncome - todayExpense)}.`;
  }

  if (/total income|all income/.test(q)) {
    return `Total recorded income is ${money(totalIncome)}.`;
  }

  if (/total expense|all expense/.test(q)) {
    return `Total recorded expense is ${money(totalExpense)}.`;
  }

  if (/profit|balance/.test(q)) {
    return `Total profit / balance is ${money(totalIncome - totalExpense)}.`;
  }

  if (/deposit.*held|held deposit/.test(q)) {
    return `Total deposits held are ${money(depositsHeld)}.`;
  }

  if (/outstanding deposit/.test(q)) {
    return `Outstanding deposits are ${money(outstandingDeposits)}.`;
  }

  if (/purchase value|total purchase/.test(q)) {
    return `Total purchase value is ${money(purchaseValue)}.`;
  }

  if (/customer.*owe|owes us|قرضدار/.test(q)) {
    const rows = customers
      .map((customer) => ({
        name: customer.customerName || customer.name || customer.fullName || "Customer",
        balance: Number(customer.balance || customer.remainingAmount || customer.dueAmount || customer.accountBalance || 0),
      }))
      .filter((customer) => customer.balance > 0)
      .sort((a, b) => b.balance - a.balance);
    return `Customers who owe us:\n${formatList(rows.map((item) => `- ${item.name}: ${money(item.balance)}`))}`;
  }

  if (/low stock/.test(q)) {
    const rows = assets
      .filter((asset) => Number(asset.alertQuantity || 0) > 0 && Number(asset.quantity || 0) <= Number(asset.alertQuantity || 0))
      .map((asset) => `- ${asset.assetId || asset.id} - ${asset.deviceName || "Asset"}: ${number(asset.quantity)} ${asset.purchaseUnit || asset.unit || "unit"}`);
    return `Low stock assets:\n${formatList(rows)}`;
  }

  if (/asset categor/.test(q)) {
    const categories = [...new Set(assets.map((asset) => asset.category).filter(Boolean))];
    return `Asset categories:\n${formatList(categories.map((item) => `- ${item}`))}`;
  }

  if (/highest quantity/.test(q)) {
    const asset = [...assets].sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0))[0];
    return asset
      ? `Highest quantity asset: ${asset.assetId || asset.id} - ${asset.deviceName || "Asset"} with ${number(asset.quantity)} ${asset.purchaseUnit || asset.unit || "unit"}.`
      : "No asset record was found.";
  }

  if (/highest value/.test(q)) {
    const asset = [...assets].sort(
      (a, b) =>
        Number(b.quantity || 0) * Number(b.unitPrice || b.salePrice || 0) -
        Number(a.quantity || 0) * Number(a.unitPrice || a.salePrice || 0)
    )[0];
    return asset
      ? `Highest value asset: ${asset.assetId || asset.id} - ${asset.deviceName || "Asset"} with value ${money(Number(asset.quantity || 0) * Number(asset.unitPrice || asset.salePrice || 0))}.`
      : "No asset record was found.";
  }

  if (/how many transfers|transfers do i have/.test(q)) {
    return `You have ${number(deviceTransfers.length)} transfer record(s).`;
  }

  if (/recent transfers/.test(q)) {
    const rows = [...deviceTransfers]
      .sort((a, b) => new Date(b.createdAt || b.transferDate || 0) - new Date(a.createdAt || a.transferDate || 0))
      .slice(0, 8)
      .map((item) => `- ${item.transferId || item.referenceNumber || "Transfer"}: ${item.assetLabel || item.assetName || item.assetId || "Asset"} (${item.sourceLocation || item.sourceType || "-"} -> ${item.destinationLocation || item.destinationType || "-"})`);
    return `Recent transfers:\n${formatList(rows)}`;
  }

  if (/supplier.*owe|owe supplier|suppliers do we owe/.test(q)) {
    const rows = suppliers
      .map((supplier) => ({
        name: supplier.supplierName || supplier.name || "Supplier",
        balance: Number(supplier.remainingBalance || supplier.openingBalance || supplier.balance || 0),
      }))
      .filter((supplier) => supplier.balance > 0)
      .sort((a, b) => b.balance - a.balance);
    return `Suppliers we owe:\n${formatList(rows.map((item) => `- ${item.name}: ${money(item.balance)}`))}`;
  }

  if (/supplier.*most purchases|most purchases/.test(q)) {
    const totals = new Map();
    supplierPurchases.forEach((purchase) => {
      const name = purchase.supplierName || purchase.supplier || "Unknown Supplier";
      totals.set(name, (totals.get(name) || 0) + Number(purchase.totalPurchaseValue || purchase.totalAmount || 0));
    });
    const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    return `Suppliers by purchase value:\n${formatList(rows.map(([name, amount]) => `- ${name}: ${money(amount)}`))}`;
  }

  if (/how many towers|towers do i have/.test(q)) {
    return `You have ${number(towerAssets.length)} tower record(s).`;
  }

  if (/tower.*most assets/.test(q)) {
    const rows = towerAssets
      .map((tower) => ({
        name: `${tower.towerName || "Tower"}${tower.towerLocation ? ` - ${tower.towerLocation}` : ""}`,
        qty: Array.isArray(tower.assets)
          ? tower.assets.reduce((sum, asset) => sum + Number(asset.quantity || 1), 0)
          : Number(tower.assetCount || 0),
      }))
      .sort((a, b) => b.qty - a.qty);
    return `Towers by asset quantity:\n${formatList(rows.map((item) => `- ${item.name}: ${number(item.qty)} unit(s)`))}`;
  }

  if (/customers.*deposits|deposits.*customers/.test(q)) {
    const rows = securityDeposits
      .filter((deposit) => Number(deposit.amount || deposit.depositAmount || 0) > 0)
      .map((deposit) => `- ${deposit.customerName || deposit.customer || "Customer"}: ${money(deposit.amount || deposit.depositAmount)}`);
    return `Customer deposits:\n${formatList(rows)}`;
  }

  if (/package payments today/.test(q)) {
    const amount = transactions
      .filter((item) => item.type === "income" && item.source === "customer-package")
      .filter((item) => String(item.date || "").startsWith(today))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return `Package payments today: ${money(amount)}.`;
  }

  if (/customer sales today|sales today/.test(q)) {
    const amount = transactions
      .filter((item) => item.type === "income")
      .filter((item) => /sale/i.test(`${item.category || ""} ${item.source || ""} ${item.title || ""}`))
      .filter((item) => String(item.date || "").startsWith(today))
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return `Customer sales income today: ${money(amount)}.`;
  }

  if (/supplier payments today/.test(q)) {
    const rows = transactions
      .filter((item) => item.source === "supplier-payment")
      .filter((item) => String(item.date || "").startsWith(today));
    const income = rows.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expense = rows.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return `Supplier payments today:\nSupplier paid us: ${money(income)}\nWe paid supplier: ${money(expense)}`;
  }

  if (/system summary|summary/.test(q)) {
    return `System summary:\nCustomers: ${number(customers.length)}\nAssets: ${number(assets.length)}\nMain Stock Quantity: ${number(mainStockQuantity)}\nTower Assets: ${number(towerQuantity)}\nCustomer Assets: ${number(customerQuantity)}\nToday's Income: ${money(todayIncome)}\nToday's Expense: ${money(todayExpense)}\nNet Balance: ${money(totalIncome - totalExpense)}`;
  }

  if (/hello|hi|how are you|چطور استی|سلام/.test(q)) {
    return "I am ready and connected to your system data. You can ask me about customers, assets, stock, towers, suppliers, income, expenses, repairs, and transfers.";
  }

  return "This system has a simple AI Agent that answers using your system data. It cannot handle hard, general, or complex questions outside this ISP management system yet.";
}

function Agent() {
  const [assets] = useJsonCollection("assets");
  const [customers] = useJsonCollection("customers");
  const [suppliers] = useJsonCollection("suppliers");
  const [transactions] = useJsonCollection("transactions");
  const [deviceTransfers] = useJsonCollection("deviceTransfers");
  const [towerAssets] = useJsonCollection("towerAssets");
  const [securityDeposits] = useJsonCollection("securityDeposits");
  const [supplierPurchases] = useJsonCollection("supplierPurchases");

  const [conversations, setConversations] = useState(loadConversations);
  const [activeId, setActiveId] = useState(() => conversations[0]?.id || "");
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [renamingId, setRenamingId] = useState("");
  const [renameDraft, setRenameDraft] = useState("");
  const typingTimer = useRef(null);
  const messagesEndRef = useRef(null);

  const data = useMemo(
    () => ({
      assets,
      customers,
      suppliers,
      transactions,
      deviceTransfers,
      towerAssets,
      securityDeposits,
      supplierPurchases,
    }),
    [assets, customers, suppliers, transactions, deviceTransfers, towerAssets, securityDeposits, supplierPurchases]
  );

  const activeConversation = conversations.find((conversation) => conversation.id === activeId) || conversations[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, isThinking]);

  useEffect(
    () => () => {
      if (typingTimer.current) {
        clearInterval(typingTimer.current);
      }
    },
    []
  );

  const updateConversation = (id, updater) => {
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === id ? updater(conversation) : conversation
      )
    );
  };

  const createConversation = () => {
    const next = defaultConversation();
    setConversations((previous) => [next, ...previous]);
    setActiveId(next.id);
  };

  const deleteConversation = (id) => {
    setConversations((previous) => {
      const remaining = previous.filter((conversation) => conversation.id !== id);
      const next = remaining.length ? remaining : [defaultConversation()];
      if (id === activeId) {
        setActiveId(next[0].id);
      }
      return next;
    });
  };

  const startRename = (conversation) => {
    setRenamingId(conversation.id);
    setRenameDraft(conversation.title || "Conversation");
  };

  const saveRename = () => {
    const title = renameDraft.trim() || "Conversation";
    updateConversation(renamingId, (conversation) => ({ ...conversation, title }));
    setRenamingId("");
    setRenameDraft("");
  };

  const typeAssistantMessage = (conversationId, messageId, finalText) => {
    let index = 0;
    typingTimer.current = setInterval(() => {
      index += 3;
      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                text: finalText.slice(0, index),
                pending: index < finalText.length,
              }
            : message
        ),
      }));

      if (index >= finalText.length) {
        clearInterval(typingTimer.current);
        typingTimer.current = null;
        setIsThinking(false);
      }
    }, 22);
  };

  const sendQuestion = (question) => {
    const text = question.trim();
    if (!text || isThinking || !activeConversation) return;

    const conversationId = activeConversation.id;
    const userMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text,
    };
    const assistantId = `msg-${Date.now()}-assistant`;
    const waitMessage = {
      id: assistantId,
      role: "assistant",
      text: "Please wait, I will check the system data...",
      pending: true,
      feedback: "",
    };

    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      title: conversation.title === "New Conversation" ? text.slice(0, 44) : conversation.title,
      messages: [...conversation.messages, userMessage, waitMessage],
    }));
    setDraft("");
    setIsThinking(true);

    window.setTimeout(() => {
      const answer = buildAnswer(text, data);
      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) =>
          message.id === assistantId ? { ...message, text: "", pending: true } : message
        ),
      }));
      typeAssistantMessage(conversationId, assistantId, answer);
    }, 2000);
  };

  const setFeedback = (messageId, feedback) => {
    if (!activeConversation) return;
    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) =>
        message.id === messageId ? { ...message, feedback } : message
      ),
    }));
  };

  return (
    <div className="agent-page">
      <section className="agent-history">
        <div className="agent-panel-header">
          <div>
            <span className="agent-kicker">Agent</span>
            <h2>Conversations</h2>
          </div>
          <button type="button" onClick={createConversation} title="New conversation">
            <Plus size={16} />
          </button>
        </div>

        <div className="agent-history-list">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`agent-history-item ${conversation.id === activeConversation?.id ? "active" : ""}`}
            >
              {renamingId === conversation.id ? (
                <input
                  value={renameDraft}
                  autoFocus
                  onChange={(event) => setRenameDraft(event.target.value)}
                  onBlur={saveRename}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveRename();
                    if (event.key === "Escape") setRenamingId("");
                  }}
                />
              ) : (
                <button type="button" onClick={() => setActiveId(conversation.id)}>
                  <strong>{conversation.title}</strong>
                  <small>{conversation.messages.length} message(s)</small>
                </button>
              )}

              <div className="agent-history-actions">
                <button type="button" onClick={() => startRename(conversation)} title="Rename">
                  <Edit3 size={14} />
                </button>
                <button type="button" onClick={() => deleteConversation(conversation.id)} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="agent-chat">
        <div className="agent-chat-header">
          <div>
            <span className="agent-kicker">AI Workspace</span>
            <h1>System Agent</h1>
            <p>Ask about customers, finance, stock, assets, towers, suppliers, repair, and transfers.</p>
          </div>
        </div>

        <div className="agent-messages">
          {activeConversation?.messages.map((message) => (
            <div key={message.id} className={`agent-message ${message.role}`}>
              <div className="agent-message-bubble">
                <p>{message.text}</p>
                {message.role === "assistant" && !message.pending && (
                  <div className="agent-feedback">
                    <button
                      type="button"
                      className={message.feedback === "like" ? "active" : ""}
                      onClick={() => setFeedback(message.id, "like")}
                      title="Like"
                    >
                      <ThumbsUp size={15} />
                    </button>
                    <button
                      type="button"
                      className={message.feedback === "dislike" ? "active" : ""}
                      onClick={() => setFeedback(message.id, "dislike")}
                      title="Dislike"
                    >
                      <ThumbsDown size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form
          className="agent-composer"
          onSubmit={(event) => {
            event.preventDefault();
            sendQuestion(draft);
          }}
        >
          <textarea
            value={draft}
            placeholder="Ask the system Agent..."
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendQuestion(draft);
              }
            }}
          />
          <button type="submit" disabled={!draft.trim() || isThinking}>
            <Send size={18} />
            Send
          </button>
        </form>
      </section>

      <aside className="agent-suggestions">
        <div className="agent-panel-header">
          <div>
            <span className="agent-kicker">Prompts</span>
            <h2>Suggested Questions</h2>
          </div>
        </div>

        <div className="agent-suggestion-list">
          {suggestedSections.map((section) => (
            <div className="agent-suggestion-section" key={section.title}>
              <h3>{section.title}</h3>
              {section.questions.map((question) => (
                <button
                  type="button"
                  key={question}
                  disabled={isThinking}
                  onClick={() => sendQuestion(question)}
                >
                  {question}
                </button>
              ))}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

export default Agent;
