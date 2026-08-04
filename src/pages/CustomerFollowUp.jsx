import {
    useEffect,
    useMemo,
    useState,
  } from "react";
  
  import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    FileCheck2,
    Landmark,
    Plus,
    Save,
    X,
  } from "lucide-react";
  
  import {
    useNavigate,
    useParams,
  } from "react-router-dom";
  
  import { useJsonCollection } from "../hooks/useJsonCollection";
  import { notify } from "../utils/notify";
  import "./CustomerFollowUp.css";
  
  const defaultEnglishTests = [
    "TOEFL",
    "IELTS",
    "Duolingo",
    "None",
  ];
  
  const defaultCountries = [
    "Australia",
    "Canada",
    "China",
    "Germany",
    "United Kingdom",
    "United States",
  ];
  
  const scholarshipTypes = [
    "Government",
    "Semi-Government",
    "Private",
  ];
  
  const intakes = [
    "January",
    "September",
  ];
  
  function createInitialForm(customer) {
    const followUp = customer?.followUp || {};
  
    return {
      englishTests:
        Array.isArray(followUp.englishTests)
          ? followUp.englishTests
          : followUp.englishTest
            ? [followUp.englishTest]
            : [],
      bankStatementOwner:
        followUp.bankStatementOwner || "",
      bankStatementAmount:
        followUp.bankStatementAmount || "",
      country:
        followUp.country || "",
      scholarshipType:
        followUp.scholarshipType || "",
      intake:
        followUp.intake || "",
    };
  }
  
  function getCustomerName(customer) {
    return (
      customer?.fullName ||
      customer?.customerName ||
      "Unnamed Customer"
    );
  }
  
  export default function CustomerFollowUp({
    currentUser,
  }) {
    const { id } = useParams();
    const navigate = useNavigate();
  
    const [
      customers,
      setCustomers,
      loadCustomers,
      customersLoaded,
    ] = useJsonCollection("customers");
  
    const customer = useMemo(
      () =>
        customers.find(
          (item) =>
            String(item.id) === String(id)
        ),
      [customers, id]
    );
  
    const savedEnglishTests = useMemo(
      () =>
        customers.flatMap((item) => {
          const tests =
            item.followUp?.englishTests;
  
          if (Array.isArray(tests)) {
            return tests;
          }
  
          return item.followUp?.englishTest
            ? [item.followUp.englishTest]
            : [];
        }),
      [customers]
    );
  
    const savedCountries = useMemo(
      () =>
        customers
          .map(
            (item) =>
              item.followUp?.country
          )
          .filter(Boolean),
      [customers]
    );
  
    const [form, setForm] = useState(
      createInitialForm(null)
    );
  
    const [englishTests, setEnglishTests] =
      useState(defaultEnglishTests);
  
    const [countries, setCountries] =
      useState(defaultCountries);
  
    const [showTestAdder, setShowTestAdder] =
      useState(false);
  
    const [showCountryAdder, setShowCountryAdder] =
      useState(false);
  
    const [newTest, setNewTest] =
      useState("");
  
    const [newCountry, setNewCountry] =
      useState("");
  
    const [saving, setSaving] =
      useState(false);
  
    useEffect(() => {
      if (!customer) return;
  
      setForm(createInitialForm(customer));
    }, [customer]);
  
    useEffect(() => {
      setEnglishTests([
        ...new Set([
          ...defaultEnglishTests,
          ...savedEnglishTests,
        ]),
      ]);
    }, [savedEnglishTests]);
  
    useEffect(() => {
      setCountries([
        ...new Set([
          ...defaultCountries,
          ...savedCountries,
        ]),
      ]);
    }, [savedCountries]);
  
    function updateField(event) {
      const { name, value } = event.target;
  
      setForm((current) => ({
        ...current,
        [name]: value,
      }));
    }
  
    function toggleEnglishTest(test) {
      setForm((current) => {
        const selected = Array.isArray(
          current.englishTests
        )
          ? current.englishTests
          : [];
  
        const exists = selected.includes(test);
  
        return {
          ...current,
          englishTests: exists
            ? selected.filter(
                (item) => item !== test
              )
            : [...selected, test],
        };
      });
    }
  
    function addEnglishTest() {
      const value = newTest.trim();
  
      if (!value) {
        notify(
          "Please enter the document name.",
          "error"
        );
        return;
      }
  
      setEnglishTests((current) => [
        ...new Set([...current, value]),
      ]);
  
      setForm((current) => ({
        ...current,
        englishTests: [
          ...new Set([
            ...(Array.isArray(
              current.englishTests
            )
              ? current.englishTests
              : []),
            value,
          ]),
        ],
      }));
  
      setNewTest("");
      setShowTestAdder(false);
    }
  
    function addCountry() {
      const value = newCountry.trim();
  
      if (!value) {
        notify(
          "Please enter the country name.",
          "error"
        );
        return;
      }
  
      setCountries((current) => [
        ...new Set([...current, value]),
      ]);
  
      setForm((current) => ({
        ...current,
        country: value,
      }));
  
      setNewCountry("");
      setShowCountryAdder(false);
    }
  
    async function saveFollowUp(event) {
      event.preventDefault();
  
      if (!customer || saving) return;
  
      if (
        !Array.isArray(form.englishTests) ||
        !form.englishTests.length
      ) {
        notify(
          "Please select at least one English test document.",
          "error"
        );
        return;
      }
  
      if (!form.bankStatementOwner) {
        notify(
          "Please select the bank statement owner.",
          "error"
        );
        return;
      }
  
      if (!String(form.bankStatementAmount).trim()) {
        notify(
          "Please enter the bank statement amount.",
          "error"
        );
        return;
      }
  
      if (!form.country) {
        notify(
          "Please select a country.",
          "error"
        );
        return;
      }
  
      if (!form.scholarshipType) {
        notify(
          "Please select a scholarship type.",
          "error"
        );
        return;
      }
  
      if (!form.intake) {
        notify(
          "Please select an intake.",
          "error"
        );
        return;
      }
  
      setSaving(true);
  
      try {
        const now = new Date().toISOString();
  
        const latestCustomers =
          await loadCustomers();
  
        const nextCustomers = latestCustomers.map(
          (item) =>
            String(item.id) === String(customer.id)
              ? {
                  ...item,
  
                  followUp: {
                    ...form,
  
                    completedAt: now,
  
                    completedByAccountId:
                      currentUser?.id || "",
  
                    completedByEmployeeId:
                      currentUser?.employeeId ||
                      "",
  
                    completedByName:
                      currentUser?.fullName ||
                      currentUser?.username ||
                      currentUser?.email ||
                      "Employee",
                  },
  
                  followUpCompleted: true,
                  followUpStatus: "Completed",
                  followUpUpdatedAt: now,
                  updatedAt: now,
                }
              : item
        );
  
        const saved =
          await setCustomers(nextCustomers);
  
        if (!saved) {
          notify(
            "Unable to save the follow-up form.",
            "error"
          );
          return;
        }
  
        notify(
          "Customer follow-up saved successfully.",
          "success"
        );
  
        navigate("/my-account");
      } finally {
        setSaving(false);
      }
    }
  
    if (!customersLoaded) {
      return (
        <div className="customer-followup-page">
          <div className="customer-followup-not-found">
            <FileCheck2 size={38} />
            <h1>Loading Customer...</h1>
          </div>
        </div>
      );
    }
  
    if (!customer) {
      return (
        <div className="customer-followup-page">
          <div className="customer-followup-not-found">
            <FileCheck2 size={38} />
  
            <h1>Customer Not Found</h1>
  
            <p>
              The requested customer record does not
              exist.
            </p>
  
            <button
              type="button"
              onClick={() =>
                navigate("/my-account")
              }
            >
              <ArrowLeft size={16} />
              Back to My Account
            </button>
          </div>
        </div>
      );
    }
  
    return (
      <div className="customer-followup-page">
        <header className="customer-followup-heading">
          <div>
            <button
              type="button"
              className="customer-followup-back"
              onClick={() =>
                navigate("/my-account")
              }
            >
              <ArrowLeft size={16} />
              My Account
            </button>
  
            <span>Customer Follow Up</span>
  
            <h1>Application Follow-Up Form</h1>
  
            <p>
              Complete the next-stage information for
              the accepted customer.
            </p>
          </div>
  
          <div className="customer-followup-customer">
            <div>
              {String(
                getCustomerName(customer)
              )
                .charAt(0)
                .toUpperCase()}
            </div>
  
            <span>
              <strong>
                {getCustomerName(customer)}
              </strong>
  
              <small>
                {customer.customerType ||
                  "Customer"}
              </small>
            </span>
          </div>
        </header>
  
        <form
          className="customer-followup-form"
          onSubmit={saveFollowUp}
        >
          <section className="customer-followup-card">
            <header>
              <FileCheck2 size={20} />
  
              <div>
                <h2>Document Information</h2>
  
                <p>
                  Select the available English test
                  document.
                </p>
              </div>
            </header>
  
            <div className="customer-followup-field">
              <label htmlFor="englishTest">
                English Test Documents
              </label>
  
              <small className="customer-followup-help">
                You can select more than one document.
              </small>
  
              <div className="customer-followup-document-picker">
                <div className="customer-followup-document-options">
                  {englishTests.map((test) => {
                    const selected =
                      form.englishTests.includes(
                        test
                      );
  
                    return (
                      <button
                        key={test}
                        type="button"
                        className={
                          selected
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          toggleEnglishTest(test)
                        }
                      >
                        <span>{test}</span>
  
                        {selected && (
                          <CheckCircle2
                            size={15}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
  
                <button
                  type="button"
                  onClick={() =>
                    setShowTestAdder(
                      (open) => !open
                    )
                  }
                  title="Add another document"
                >
                  <Plus size={17} />
                </button>
              </div>
  
              {showTestAdder && (
                <div className="customer-followup-inline-adder">
                  <input
                    value={newTest}
                    onChange={(event) =>
                      setNewTest(
                        event.target.value
                      )
                    }
                    placeholder="Enter document name"
                    autoFocus
                  />
  
                  <button
                    type="button"
                    onClick={addEnglishTest}
                  >
                    Add
                  </button>
  
                  <button
                    type="button"
                    className="close"
                    onClick={() => {
                      setShowTestAdder(false);
                      setNewTest("");
                    }}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </section>
  
          <section className="customer-followup-card">
            <header>
              <Landmark size={20} />
  
              <div>
                <h2>Bank Statement</h2>
  
                <p>
                  Choose the statement owner and enter
                  the available amount.
                </p>
              </div>
            </header>
  
            <div className="customer-followup-grid">
              <div className="customer-followup-field">
                <label>Statement Owner</label>
  
                <div className="customer-followup-options">
                  {["Self", "Family"].map(
                    (owner) => (
                      <label key={owner}>
                        <input
                          type="radio"
                          name="bankStatementOwner"
                          value={owner}
                          checked={
                            form.bankStatementOwner ===
                            owner
                          }
                          onChange={updateField}
                        />
  
                        <span>{owner}</span>
                      </label>
                    )
                  )}
                </div>
              </div>
  
              <div className="customer-followup-field">
                <label htmlFor="bankStatementAmount">
                  Bank Statement Amount
                </label>
  
                <input
                  id="bankStatementAmount"
                  name="bankStatementAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.bankStatementAmount}
                  onChange={updateField}
                  placeholder="Enter amount"
                />
              </div>
            </div>
          </section>
  
          <section className="customer-followup-card">
            <header>
              <Building2 size={20} />
  
              <div>
                <h2>Study Preferences</h2>
  
                <p>
                  Select the destination, scholarship,
                  and intake.
                </p>
              </div>
            </header>
  
            <div className="customer-followup-grid">
              <div className="customer-followup-field">
                <label htmlFor="country">
                  Country
                </label>
  
                <div className="customer-followup-select-add">
                  <select
                    id="country"
                    name="country"
                    value={form.country}
                    onChange={updateField}
                  >
                    <option value="">
                      Select country
                    </option>
  
                    {countries.map((country) => (
                      <option
                        key={country}
                        value={country}
                      >
                        {country}
                      </option>
                    ))}
                  </select>
  
                  <button
                    type="button"
                    onClick={() =>
                      setShowCountryAdder(
                        (open) => !open
                      )
                    }
                    title="Add another country"
                  >
                    <Plus size={17} />
                  </button>
                </div>
  
                {showCountryAdder && (
                  <div className="customer-followup-inline-adder">
                    <input
                      value={newCountry}
                      onChange={(event) =>
                        setNewCountry(
                          event.target.value
                        )
                      }
                      placeholder="Enter country name"
                      autoFocus
                    />
  
                    <button
                      type="button"
                      onClick={addCountry}
                    >
                      Add
                    </button>
  
                    <button
                      type="button"
                      className="close"
                      onClick={() => {
                        setShowCountryAdder(false);
                        setNewCountry("");
                      }}
                      aria-label="Close"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
  
              <div className="customer-followup-field">
                <label htmlFor="scholarshipType">
                  Scholarship Type
                </label>
  
                <select
                  id="scholarshipType"
                  name="scholarshipType"
                  value={form.scholarshipType}
                  onChange={updateField}
                >
                  <option value="">
                    Select scholarship type
                  </option>
  
                  {scholarshipTypes.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    )
                  )}
                </select>
              </div>
  
              <div className="customer-followup-field customer-followup-full">
                <label>Intake</label>
  
                <div className="customer-followup-options intake">
                  {intakes.map((intake) => (
                    <label key={intake}>
                      <input
                        type="radio"
                        name="intake"
                        value={intake}
                        checked={
                          form.intake === intake
                        }
                        onChange={updateField}
                      />
  
                      <span>{intake}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>
  
          <footer className="customer-followup-actions">
            <button
              type="button"
              onClick={() =>
                navigate("/my-account")
              }
              disabled={saving}
            >
              Cancel
            </button>
  
            <button
              type="submit"
              className="primary"
              disabled={saving}
            >
              {customer.followUpCompleted ? (
                <CheckCircle2 size={17} />
              ) : (
                <Save size={17} />
              )}
  
              {saving
                ? "Saving..."
                : customer.followUpCompleted
                  ? "Update Follow Up"
                  : "Save Follow Up"}
            </button>
          </footer>
        </form>
      </div>
    );
  }