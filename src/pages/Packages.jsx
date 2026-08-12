import { useEffect, useMemo, useState } from "react";
import {
  Clapperboard,
  Cpu,
  Edit3,
  FileText,
  Package,
  Plane,
  Plus,
  Trash2,
} from "lucide-react";

import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import VisaPackages from "./VisaPackages";
import TechnologyPackages from "./TechnologyPackages";
import MediaPackages from "./MediaPackages";
import "./Packages.css";

const emptyTravelForm = {
  packageName: "",
  destination: "",
  durationDays: "",
  price: "",
  currency: "AFN",
  availability: "Available",
  endDate: "",
  note: "",
};

const packageSections = [
  {
    key: "visa",
    title: "Visa Packages",
    titleDr: "پکیج ویزه",
    titlePs: "د ویزې بسته",
    description: "Visa service packages",
    descriptionDr: "پکیج‌های خدمات ویزه",
    descriptionPs: "د ویزې خدمتونو بستې",
    icon: FileText,
    collection: "visaPackages",
  },
  {
    key: "travel",
    title: "Travel Packages",
    titleDr: "پکیج سفر",
    titlePs: "د سفر بسته",
    description: "Travel service packages",
    descriptionDr: "پکیج‌های خدمات سفر",
    descriptionPs: "د سفر خدمتونو بستې",
    icon: Plane,
    collection: "travelPackages",
  },
  {
    key: "technology",
    title: "Technology Packages",
    titleDr: "پکیج تکنالوژی",
    titlePs: "د ټکنالوژۍ بسته",
    description: "Technology service packages",
    descriptionDr: "پکیج‌های خدمات تکنالوژی",
    descriptionPs: "د ټکنالوژۍ خدمتونو بستې",
    icon: Cpu,
    collection: "technologyPackages",
  },
  {
    key: "media",
    title: "Media Packages",
    titleDr: "پکیج رسانه",
    titlePs: "د رسنیو بسته",
    description: "Media production packages",
    descriptionDr: "پکیج‌های تولیدات رسانه‌ای",
    descriptionPs: "د رسنیزو تولیداتو بستې",
    icon: Clapperboard,
    collection: "mediaPackages",
  },
];

const money = (value, currency = "AFN") =>
  `${Number(value || 0).toLocaleString("en-US")} ${currency || "AFN"}`;

function TravelPackagesPanel() {
  const [travelPackages, setTravelPackages] = useJsonCollection("travelPackages");
  const [form, setForm] = useState(emptyTravelForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filteredPackages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return travelPackages;

    return travelPackages.filter((item) =>
      [
        item.packageName,
        item.destination,
        item.durationDays,
        item.price,
        item.currency,
        item.availability,
        item.note,
      ].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [travelPackages, search]);

  const resetForm = () => {
    setForm(emptyTravelForm);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const save = async (event) => {
    event.preventDefault();

    if (!form.packageName.trim()) {
      notify("Please enter travel package name.", "error");
      return;
    }

    const now = new Date().toISOString();
    const record = {
      id: editingId || `${Date.now()}`,
      packageName: form.packageName.trim(),
      destination: form.destination.trim(),
      durationDays: Number(form.durationDays || 0),
      price: Number(form.price || 0),
      currency: form.currency,
      availability: form.availability,
      isAvailable: form.availability === "Available",
      endDate: form.endDate,
      note: form.note.trim(),
      createdAt:
        travelPackages.find((item) => String(item.id) === String(editingId))
          ?.createdAt || now,
      updatedAt: now,
    };

    const nextPackages = editingId
      ? travelPackages.map((item) =>
          String(item.id) === String(editingId) ? record : item
        )
      : [...travelPackages, record];

    const saved = await setTravelPackages(nextPackages);
    if (!saved) return;

    notify(
      editingId
        ? "Travel package updated successfully."
        : "Travel package saved successfully."
    );
    resetForm();
    setModalOpen(false);
  };

  const edit = (item) => {
    setEditingId(item.id);
    setForm({
      ...emptyTravelForm,
      ...item,
      durationDays: String(item.durationDays || ""),
      price: String(item.price || ""),
      availability: item.isAvailable === false ? "Unavailable" : item.availability || "Available",
    });
    setModalOpen(true);
  };

  const remove = async (item) => {
    const saved = await setTravelPackages(
      travelPackages.filter((record) => String(record.id) !== String(item.id))
    );

    if (saved) notify("Travel package deleted successfully.");
  };

  return (
    <div className="travel-package-panel">
      <section className="package-table-card">
        <div className="package-table-header">
          <div>
            <h3>Travel Package List</h3>
            <p>Saved travel packages from this department</p>
          </div>

          <div className="travel-package-list-tools">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search travel package..."
            />

            <button type="button" className="package-add-btn" onClick={openCreate}>
              <Plus size={16} />
              Add Travel Package
            </button>
          </div>
        </div>

        <div className="package-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Package</th>
                <th>Destination</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Availability</th>
                <th>End Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPackages.map((item) => (
                <tr key={item.id}>
                  <td className="package-strong">{item.packageName || "-"}</td>
                  <td>{item.destination || "-"}</td>
                  <td>{item.durationDays ? `${item.durationDays} days` : "-"}</td>
                  <td>{money(item.price, item.currency)}</td>
                  <td>
                    <span
                      className={
                        item.isAvailable === false ||
                        item.availability === "Unavailable"
                          ? "package-badge inactive"
                          : "package-badge active"
                      }
                    >
                      {item.isAvailable === false
                        ? "Unavailable"
                        : item.availability || "Available"}
                    </span>
                  </td>
                  <td>{item.endDate || "-"}</td>
                  <td>
                    <div className="travel-package-actions">
                      <button type="button" onClick={() => edit(item)}>
                        <Edit3 size={15} />
                      </button>
                      <button type="button" onClick={() => remove(item)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredPackages.length && (
                <tr>
                  <td colSpan="7" className="package-empty">
                    No travel package has been registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div
          className="package-modal-backdrop"
          onClick={() => {
            resetForm();
            setModalOpen(false);
          }}
        >
          <div className="package-modal" onClick={(event) => event.stopPropagation()}>
            <div className="package-modal-header">
              <div>
                <h3>{editingId ? "Edit Travel Package" : "Add Travel Package"}</h3>
                <p>Register travel packages for reception and employee forms.</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setModalOpen(false);
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={save}>
              <div className="package-form-grid">
                <div className="package-form-group">
                  <label>Package Name</label>
                  <input
                    name="packageName"
                    value={form.packageName}
                    onChange={update}
                    placeholder="Example: Dubai Tour"
                    required
                  />
                </div>

                <div className="package-form-group">
                  <label>Destination</label>
                  <input
                    name="destination"
                    value={form.destination}
                    onChange={update}
                    placeholder="Example: Dubai"
                  />
                </div>

                <div className="package-form-group">
                  <label>Duration Days</label>
                  <input
                    type="number"
                    min="0"
                    name="durationDays"
                    value={form.durationDays}
                    onChange={update}
                    placeholder="Example: 7"
                  />
                </div>

                <div className="package-form-group">
                  <label>Price</label>
                  <input
                    type="number"
                    min="0"
                    name="price"
                    value={form.price}
                    onChange={update}
                    placeholder="Example: 15000"
                  />
                </div>

                <div className="package-form-group">
                  <label>Currency</label>
                  <select name="currency" value={form.currency} onChange={update}>
                    <option value="AFN">AFN</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div className="package-form-group">
                  <label>Availability</label>
                  <select
                    name="availability"
                    value={form.availability}
                    onChange={update}
                  >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>
                </div>

                <div className="package-form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={update}
                  />
                </div>

                <div className="package-form-group package-form-full">
                  <label>Note</label>
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={update}
                    placeholder="Travel package notes..."
                  />
                </div>
              </div>

              <div className="package-modal-actions">
                <button
                  type="button"
                  className="package-cancel-btn"
                  onClick={() => {
                    resetForm();
                    setModalOpen(false);
                  }}
                >
                  Cancel
                </button>

                <button type="submit" className="package-save-btn">
                  {editingId ? "Save Changes" : "Save Travel Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Packages({ initialSection = "visa" }) {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [visaPackages] = useJsonCollection("visaPackages");
  const [travelPackages] = useJsonCollection("travelPackages");
  const [technologyPackages] = useJsonCollection("technologyPackages");
  const [mediaPackages] = useJsonCollection("mediaPackages");

  const sectionCounts = {
    visa: visaPackages.length,
    travel: travelPackages.length,
    technology: technologyPackages.length,
    media: mediaPackages.length,
  };

  const activeMeta =
    packageSections.find((section) => section.key === activeSection) ||
    packageSections[0];

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  return (
    <div className="packages-page package-hub-page">
      <div className="packages-header">
        <div>
          <h1>Packages</h1>
          <p>Manage visa, travel, technology, and media packages from one page.</p>
        </div>
      </div>

      <div className="package-section-cards" aria-label="Package departments">
        {packageSections.map((section) => {
          const Icon = section.icon;
          const isActive = section.key === activeSection;

          return (
            <button
              key={section.key}
              type="button"
              className={`package-section-card ${isActive ? "active" : ""}`}
              onClick={() => setActiveSection(section.key)}
              aria-pressed={isActive}
            >
              <span className="package-section-icon">
                <Icon size={19} />
              </span>

              <span className="package-section-copy">
                <strong>{section.title}</strong>
                <small>{section.description}</small>
              </span>

              <b>{sectionCounts[section.key] || 0}</b>
            </button>
          );
        })}
      </div>

      <div className="package-active-heading">
        <span>
          <Package size={17} />
          {activeMeta.title}
        </span>
        <p>{activeMeta.description}</p>
      </div>

      <div className="package-section-panel">
        {activeSection === "visa" && <VisaPackages />}
        {activeSection === "travel" && <TravelPackagesPanel />}
        {activeSection === "technology" && <TechnologyPackages />}
        {activeSection === "media" && <MediaPackages />}
      </div>
    </div>
  );
}

export default Packages;
