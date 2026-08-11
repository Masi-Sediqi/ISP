import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  Check,
  ChevronDown,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  X,
} from "lucide-react";

import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { createId } from "../utils/createId";
import "./OfficeAssets.css";

const defaultAssetTypes = [
  "Desk",
  "Chair",
  "Computer",
  "Laptop",
  "Printer",
  "Monitor",
  "Table",
  "Cabinet",
  "Air Conditioner",
  "Projector",
  "Other",
];

const emptyAsset = {
  name: "",
  type: "",
  quantity: "",
  note: "",
};

const parseQuantity = (value) => {
  const quantity = Number.parseInt(value, 10);
  return Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
};

const normalizeCodePart = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 4) || "AST";

function generateAssetItems(asset, quantity, existingItems = []) {
  const currentItems = existingItems.filter(
    (item) => String(item.assetId) === String(asset.id)
  );

  const existingNumbers = currentItems
    .map((item) => {
      const match = String(item.code || "").match(/-(\d+)$/);
      return match ? Number(match[1]) : 0;
    })
    .filter(Boolean);

  let nextNumber = existingNumbers.length
    ? Math.max(...existingNumbers) + 1
    : 1;

  const prefix = normalizeCodePart(asset.type || asset.name);

  return Array.from({ length: quantity }, () => {
    const number = nextNumber++;

    return {
      id: createId(),
      assetId: asset.id,
      assetName: asset.name,
      type: asset.type,
      code: `${prefix}-${String(number).padStart(4, "0")}`,
      status: "Available",
      location: "",
      assignedTo: "",
      note: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

function OfficeAssets() {
  const navigate = useNavigate();

  const [assets, setAssets] = useJsonCollection("officeAssets");
  const [assetItems, setAssetItems] = useJsonCollection("officeAssetItems");
  const [savedTypes, setSavedTypes] = useJsonCollection(
    "officeAssetCategories"
  );

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyAsset);
  const [editingAsset, setEditingAsset] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [search, setSearch] = useState("");
  const [typeOpen, setTypeOpen] = useState(false);
  const [newType, setNewType] = useState("");

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

  const translateAssetValue = (value) => {
    const labels = {
      Desk: tx("Desk", "میز کار", "د کار مېز"),
      Chair: tx("Chair", "چوکی", "څوکۍ"),
      Computer: tx("Computer", "کمپیوتر", "کمپیوټر"),
      Laptop: tx("Laptop", "لپ‌تاپ", "لېپټاپ"),
      Printer: tx("Printer", "پرنتر", "پرنټر"),
      Monitor: tx("Monitor", "مانیتور", "مانېټر"),
      Table: tx("Table", "میز", "مېز"),
      Cabinet: tx("Cabinet", "الماری", "المارۍ"),
      "Air Conditioner": tx("Air Conditioner", "کولر", "اې سي"),
      Projector: tx("Projector", "پروژکتور", "پروجکټر"),
      Other: tx("Other", "دیگر", "نور"),
      Available: tx("Available", "موجود", "شته"),
      Assigned: tx("Assigned", "اختصاص‌یافته", "سپارل شوی"),
      Unspecified: tx("Unspecified", "مشخص‌نشده", "نامعلوم"),
    };

    return labels[String(value || "")] || value;
  };

  const assetTypes = useMemo(() => {
    const customTypes = savedTypes
      .map((item) => item.name || item)
      .filter(Boolean);

    const usedTypes = assets.map((asset) => asset.type).filter(Boolean);

    return [
      ...new Set([
        ...defaultAssetTypes,
        ...customTypes,
        ...usedTypes,
      ]),
    ].sort((a, b) => a.localeCompare(b));
  }, [assets, savedTypes]);

  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return assets;
    }

    return assets.filter((asset) =>
      [asset.name, asset.type, asset.note]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [assets, search]);

  const totalQuantity = assets.reduce(
    (sum, asset) => sum + parseQuantity(asset.quantity),
    0
  );

  const availableCount = assetItems.filter(
    (item) => item.status === "Available"
  ).length;

  const assignedCount = assetItems.filter(
    (item) => item.status === "Assigned"
  ).length;

  const openCreate = () => {
    setForm(emptyAsset);
    setEditingAsset(null);
    setTypeOpen(false);
    setNewType("");
    setShowForm(true);
  };

  const openEdit = (asset) => {
    setForm({
      name: asset.name || "",
      type: asset.type || "",
      quantity: String(asset.quantity || ""),
      note: asset.note || "",
    });

    setEditingAsset(asset);
    setTypeOpen(false);
    setNewType("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAsset(null);
    setForm(emptyAsset);
    setTypeOpen(false);
    setNewType("");
  };

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const addCustomType = async () => {
    const cleanType = newType.trim();

    if (!cleanType) {
      notify(tx("Please enter the asset type.", "لطفاً نوع دارایی را وارد کنید.", "مهرباني وکړئ د شتمنۍ ډول ولیکئ."), "error");
      return;
    }

    const existingType = assetTypes.find(
      (type) => type.toLowerCase() === cleanType.toLowerCase()
    );

    const finalType = existingType || cleanType;

    if (!existingType) {
      const saved = await setSavedTypes((current) => [
        ...current,
        {
          id: createId(),
          name: cleanType,
          createdAt: new Date().toISOString(),
        },
      ]);

      if (!saved) return;
    }

    setForm((current) => ({
      ...current,
      type: finalType,
    }));

    setNewType("");
  };

  const saveAsset = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const type = form.type.trim();
    const quantity = parseQuantity(form.quantity);

    if (!name) {
      notify(tx("Please enter the asset name.", "لطفاً نام دارایی را وارد کنید.", "مهرباني وکړئ د شتمنۍ نوم ولیکئ."), "error");
      return;
    }

    if (!type) {
      notify(tx("Please select or add the asset type.", "لطفاً نوع دارایی را انتخاب یا اضافه کنید.", "مهرباني وکړئ د شتمنۍ ډول وټاکئ یا زیات یې کړئ."), "error");
      return;
    }

    if (quantity < 1) {
      notify(tx("Quantity must be at least 1.", "تعداد باید حداقل ۱ باشد.", "شمېر باید لږ تر لږه ۱ وي."), "error");
      return;
    }

    if (editingAsset) {
      const previousQuantity = parseQuantity(editingAsset.quantity);
      const quantityDifference = quantity - previousQuantity;

      const updatedAsset = {
        ...editingAsset,
        name,
        type,
        quantity,
        note: form.note.trim(),
        updatedAt: new Date().toISOString(),
      };

      const assetSaved = await setAssets((current) =>
        current.map((asset) =>
          String(asset.id) === String(editingAsset.id)
            ? updatedAsset
            : asset
        )
      );

      if (!assetSaved) return;

      if (quantityDifference > 0) {
        const newItems = generateAssetItems(
          updatedAsset,
          quantityDifference,
          assetItems
        );

        await setAssetItems((current) => [
          ...current.map((item) =>
            String(item.assetId) === String(updatedAsset.id)
              ? {
                  ...item,
                  assetName: updatedAsset.name,
                  type: updatedAsset.type,
                }
              : item
          ),
          ...newItems,
        ]);
      } else if (quantityDifference < 0) {
        const relatedItems = assetItems.filter(
          (item) => String(item.assetId) === String(updatedAsset.id)
        );

        const removableItems = relatedItems
          .filter((item) => item.status !== "Assigned")
          .slice(0, Math.abs(quantityDifference));

        if (removableItems.length < Math.abs(quantityDifference)) {
          notify(
            tx("Some records are assigned. Their quantity cannot be reduced.", "بعضی اقلام اختصاص یافته‌اند و تعداد آن‌ها قابل کاهش نیست.", "ځینې توکي سپارل شوي او شمېر یې نه شي کمېدای."),
            "error"
          );

          await setAssets((current) =>
            current.map((asset) =>
              String(asset.id) === String(editingAsset.id)
                ? editingAsset
                : asset
            )
          );

          return;
        }

        const removableIds = new Set(
          removableItems.map((item) => String(item.id))
        );

        await setAssetItems((current) =>
          current
            .filter((item) => !removableIds.has(String(item.id)))
            .map((item) =>
              String(item.assetId) === String(updatedAsset.id)
                ? {
                    ...item,
                    assetName: updatedAsset.name,
                    type: updatedAsset.type,
                  }
                : item
            )
        );
      } else {
        await setAssetItems((current) =>
          current.map((item) =>
            String(item.assetId) === String(updatedAsset.id)
              ? {
                  ...item,
                  assetName: updatedAsset.name,
                  type: updatedAsset.type,
                  updatedAt: new Date().toISOString(),
                }
              : item
          )
        );
      }

      notify(tx("Asset updated successfully.", "دارایی با موفقیت ویرایش شد.", "شتمني په بریالیتوب سره سمه شوه."), "success");
      closeForm();
      return;
    }

    const assetId = createId();

    const newAsset = {
      id: assetId,
      name,
      type,
      quantity,
      note: form.note.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createdItems = generateAssetItems(
      newAsset,
      quantity,
      assetItems
    );

    const assetSaved = await setAssets((current) => [
      newAsset,
      ...current,
    ]);

    if (!assetSaved) return;

    const itemsSaved = await setAssetItems((current) => [
      ...createdItems,
      ...current,
    ]);

    if (!itemsSaved) {
      await setAssets((current) =>
        current.filter((asset) => String(asset.id) !== String(assetId))
      );

      return;
    }

    notify(
      `${quantity} ${tx(
        quantity === 1 ? "asset record" : "asset records",
        "رکورد دارایی",
        "د شتمنۍ ریکارډ"
      )} ${tx(
        "created successfully.",
        "با موفقیت ایجاد شد.",
        "په بریالیتوب سره جوړ شو."
      )}`,
      "success"
    );

    closeForm();
  };

  const deleteAsset = async () => {
    if (!deleteTarget) return;

    const assetSaved = await setAssets((current) =>
      current.filter(
        (asset) => String(asset.id) !== String(deleteTarget.id)
      )
    );

    if (!assetSaved) return;

    await setAssetItems((current) =>
      current.filter(
        (item) => String(item.assetId) !== String(deleteTarget.id)
      )
    );

    setDeleteTarget(null);
    notify(tx("Asset and all related labels were deleted.", "دارایی و تمام لیبل‌های مربوط حذف شدند.", "شتمني او ټول اړوند لېبلونه حذف شول."), "success");
  };

  return (
    <div className={`office-assets-page ${interfaceLanguage !== "en" ? "office-assets-page-rtl" : ""}`}>
      <div className="office-assets-heading">
        <div>
          <span>{tx("Office Inventory", "موجودی دفتر", "د دفتر موجودي")}</span>
          <h1>{tx("Asset Management", "مدیریت دارایی‌ها", "د شتمنیو مدیریت")}</h1>
          <p>
            {tx(
              "Register office equipment and generate a separate label for every individual item.",
              "تجهیزات دفتر را ثبت کرده و برای هر قلم یک لیبل جداگانه ایجاد کنید.",
              "د دفتر تجهیزات ثبت کړئ او د هر توکي لپاره جلا لېبل جوړ کړئ."
            )}
          </p>
        </div>

        <button type="button" onClick={openCreate}>
          <Plus size={17} />
          {tx("Add Asset", "افزودن دارایی", "شتمني زیاتول")}
        </button>
      </div>

      <section className="office-assets-stats">
        <div>
          <Boxes />
          <span>{tx("Asset Groups", "گروپ‌های دارایی", "د شتمنیو ډلې")}</span>
          <strong>{assets.length}</strong>
          <small>{tx("Registered asset categories", "کتگوری‌های ثبت‌شده دارایی", "ثبت شوې د شتمنیو کټګورۍ")}</small>
        </div>

        <div>
          <Tags />
          <span>{tx("Total Items", "مجموع اقلام", "ټول توکي")}</span>
          <strong>{totalQuantity}</strong>
          <small>{tx("All generated asset labels", "تمام لیبل‌های ایجادشده دارایی", "ټول جوړ شوي د شتمنیو لېبلونه")}</small>
        </div>

        <div>
          <PackagePlus />
          <span>{tx("Available Items", "اقلام موجود", "شته توکي")}</span>
          <strong>{availableCount}</strong>
          <small>{assignedCount} {tx("currently assigned", "فعلاً اختصاص‌یافته", "اوس سپارل شوي")}</small>
        </div>
      </section>

      <section className="office-assets-list-card">
        <div className="office-assets-list-header">
          <div>
            <h2>{tx("Office Assets", "دارایی‌های دفتر", "د دفتر شتمنۍ")}</h2>
            <p>
              {tx(
                "Open a record to view individual items and their unique labels.",
                "برای مشاهده اقلام و لیبل‌های اختصاصی، رکورد را باز کنید.",
                "د توکو او ځانګړو لېبلونو د لیدلو لپاره ریکارډ پرانیزئ."
              )}
            </p>
          </div>

          <label className="office-assets-search">
            <Search size={15} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={tx("Search assets...", "جستجوی دارایی‌ها...", "شتمنۍ ولټوئ...")}
            />
          </label>
        </div>

        <div className="office-assets-table-wrap">
          <table>
            <thead>
              <tr>
                <th>{tx("Asset", "دارایی", "شتمني")}</th>
                <th>{tx("Type", "نوع", "ډول")}</th>
                <th>{tx("Quantity", "تعداد", "شمېر")}</th>
                <th>{tx("Available", "موجود", "شته")}</th>
                <th>{tx("Assigned", "اختصاص‌یافته", "سپارل شوی")}</th>
                <th>{tx("Note", "یادداشت", "یادښت")}</th>
                <th>{tx("Action", "عملیات", "عمل")}</th>
              </tr>
            </thead>

            <tbody>
              {filteredAssets.map((asset) => {
                const relatedItems = assetItems.filter(
                  (item) =>
                    String(item.assetId) === String(asset.id)
                );

                const available = relatedItems.filter(
                  (item) => item.status === "Available"
                ).length;

                const assigned = relatedItems.filter(
                  (item) => item.status === "Assigned"
                ).length;

                return (
                  <tr key={asset.id}>
                    <td>
                      <button
                        type="button"
                        className="office-asset-name"
                        onClick={() =>
                          navigate(`/office-assets/${asset.id}`)
                        }
                      >
                        <span>
                          {String(asset.name || "A")
                            .slice(0, 1)
                            .toUpperCase()}
                        </span>

                        <div>
                          <strong>
                            {asset.name || tx("Unnamed Asset", "دارایی بدون نام", "بې نومه شتمني")}
                          </strong>
                          <small>
                            {tx("Click to view", "برای مشاهده کلیک کنید", "د لیدلو لپاره کلیک وکړئ")} {relatedItems.length} {tx("records", "رکورد", "ریکارډونه")}
                          </small>
                        </div>
                      </button>
                    </td>

                    <td>
                      <span className="office-asset-type">
                        {translateAssetValue(asset.type || "Unspecified")}
                      </span>
                    </td>

                    <td>
                      <strong>{asset.quantity}</strong>
                    </td>

                    <td>
                      <span className="office-asset-available">
                        {available}
                      </span>
                    </td>

                    <td>{assigned}</td>

                    <td className="office-asset-note">
                      {asset.note || tx("No note", "بدون یادداشت", "یادښت نشته")}
                    </td>

                    <td>
                      <div className="office-asset-actions">
                        <button
                          type="button"
                          className="office-asset-edit"
                          onClick={() => openEdit(asset)}
                          title={tx("Edit", "ویرایش", "سمول")}
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          className="office-asset-delete"
                          onClick={() => setDeleteTarget(asset)}
                          title={tx("Delete", "حذف", "حذف")}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filteredAssets.length && (
                <tr>
                  <td colSpan="7" className="office-assets-empty">
                    {tx(
                      "No office assets have been registered yet.",
                      "هنوز هیچ دارایی دفتری ثبت نشده است.",
                      "تر اوسه د دفتر هېڅ شتمني نه ده ثبت شوې."
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showForm && (
        <div
          className="office-asset-modal-backdrop"
          onMouseDown={closeForm}
        >
          <div
            className="office-asset-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="office-asset-modal-header">
              <div>
                <h2>
                  {editingAsset
                    ? tx("Edit Asset", "ویرایش دارایی", "شتمني سمول")
                    : tx("Register Asset", "ثبت دارایی", "شتمني ثبتول")}
                </h2>
                <p>
                  {tx(
                    "Enter the office asset information and quantity.",
                    "معلومات و تعداد دارایی دفتر را وارد کنید.",
                    "د دفتر د شتمنۍ معلومات او شمېر ولیکئ."
                  )}
                </p>
              </div>

              <button type="button" onClick={closeForm}>
                <X size={19} />
              </button>
            </div>

            <form onSubmit={saveAsset}>
              <div className="office-asset-form-grid">
                <label>
                  <span>{tx("Asset Name *", "نام دارایی *", "د شتمنۍ نوم *")}</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    placeholder={tx("For example: Manager Chair", "مثال: چوکی مدیر", "بېلګه: د مدیر څوکۍ")}
                  />
                </label>

                <div className="office-asset-type-field">
                  <span>{tx("Asset Type *", "نوع دارایی *", "د شتمنۍ ډول *")}</span>

                  <button
                    type="button"
                    className="office-asset-type-trigger"
                    onClick={() =>
                      setTypeOpen((current) => !current)
                    }
                  >
                    <span>
                      {form.type ? translateAssetValue(form.type) : tx("Select asset type", "نوع دارایی را انتخاب کنید", "د شتمنۍ ډول وټاکئ")}
                    </span>

                    <ChevronDown
                      size={16}
                      className={typeOpen ? "open" : ""}
                    />
                  </button>

                  {typeOpen && (
                    <div className="office-asset-type-menu">
                      <div className="office-asset-type-options">
                        {assetTypes.map((type) => (
                          <button
                            type="button"
                            key={type}
                            className={
                              form.type === type ? "active" : ""
                            }
                            onClick={() => {
                              setForm((current) => ({
                                ...current,
                                type,
                              }));

                              setTypeOpen(false);
                            }}
                          >
                            <span>{translateAssetValue(type)}</span>

                            {form.type === type && (
                              <Check size={14} />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="office-asset-type-add">
                        <input
                          value={newType}
                          onChange={(event) =>
                            setNewType(event.target.value)
                          }
                          placeholder={tx("Add custom type", "افزودن نوع جدید", "نوی ډول زیات کړئ")}
                        />

                        <button
                          type="button"
                          onClick={addCustomType}
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <label>
                  <span>{tx("Quantity *", "تعداد *", "شمېر *")}</span>
                  <input
                    type="number"
                    min="1"
                    name="quantity"
                    value={form.quantity}
                    onChange={updateField}
                    placeholder={tx("For example: 10", "مثال: ۱۰", "بېلګه: ۱۰")}
                  />
                  <small>
                    {tx(
                      "A separate record and label will be generated for every item.",
                      "برای هر قلم یک رکورد و لیبل جداگانه ایجاد می‌شود.",
                      "د هر توکي لپاره جلا ریکارډ او لېبل جوړېږي."
                    )}
                  </small>
                </label>

                <label className="office-asset-form-full">
                  <span>{tx("Note", "یادداشت", "یادښت")}</span>
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={updateField}
                    placeholder={tx("Additional information about this asset...", "معلومات اضافی درباره این دارایی...", "د دې شتمنۍ اضافي معلومات...")}
                  />
                </label>
              </div>

              <div className="office-asset-modal-actions">
                <button type="button" onClick={closeForm}>
                  {tx("Cancel", "لغو", "لغوه")}
                </button>

                <button type="submit">
                  {editingAsset
                    ? tx("Save Changes", "ذخیره تغییرات", "بدلونونه خوندي کړئ")
                    : tx("Register Asset", "ثبت دارایی", "شتمني ثبتول")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="office-asset-modal-backdrop"
          onMouseDown={() => setDeleteTarget(null)}
        >
          <div
            className="office-asset-delete-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="office-asset-delete-icon">
              <Trash2 size={25} />
            </div>

            <span>{tx("Delete Asset", "حذف دارایی", "شتمني حذف کول")}</span>
            <h2>{tx("Are you sure?", "آیا مطمئن هستید؟", "ایا ډاډه یاست؟")}</h2>

            <p>
              {tx("The asset", "دارایی", "شتمني")}{" "}
              <strong>{deleteTarget.name}</strong>{" "}
              {tx(
                "and all generated item labels will be deleted.",
                "و تمام لیبل‌های ایجادشده آن حذف می‌شوند.",
                "او ټول جوړ شوي لېبلونه به یې حذف شي."
              )}
            </p>

            <div className="office-asset-delete-actions">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
              >
                {tx("Cancel", "لغو", "لغوه")}
              </button>

              <button type="button" onClick={deleteAsset}>
                <Trash2 size={15} />
                {tx("Delete", "حذف", "حذف")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfficeAssets;