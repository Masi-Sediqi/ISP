import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { formatDateTime } from "../utils/afghanDate";
import "./CustomerIssueDevice.css";

function createEmptyIssueForm() {
  return {
    sourceType: "Main Stock",
    fromCustomerId: "",
    destinationCustomerId: "",
    issueDate: new Date().toISOString().slice(0, 10),
    issueStatus: "Issued",
    ownershipType: "Loaned",
    salePrice: "",
    paidAmount: "",
    remainAmount: "",
    salePrices: {},
    depositRefundAmount: "",
    depositAmount: "",
    depositStatus: "Held",
    notes: "",
  };
}

const emptyEditForm = {
  issueDate: "",
  issueStatus: "Issued",
  ownershipType: "Loaned",
  salePrice: "",
  paidAmount: "",
  remainAmount: "",
  depositAmount: "",
  depositStatus: "Held",
  notes: "",
};

function money(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function CustomerIssueDevice() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customers, , , customersLoaded] = useJsonCollection("customers");
  const [assets, setAssets, , assetsLoaded] = useJsonCollection("assets");
  const [assetMovements, setAssetMovements, , movementsLoaded] =
    useJsonCollection("assetMovements");

  const [deviceTransfers, setDeviceTransfers, , transfersLoaded] =
    useJsonCollection("deviceTransfers");

  const [securityDeposits, setSecurityDeposits, , depositsLoaded] =
    useJsonCollection("securityDeposits");

  const [formData, setFormData] = useState(createEmptyIssueForm);
  const [selectedAssetKeys, setSelectedAssetKeys] = useState([]);
  const [search, setSearch] = useState("");
  const [showIssueModal, setShowIssueModal] = useState(false);

  const [openActionId, setOpenActionId] = useState(null);

  const [actionMenuPosition, setActionMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const [viewTransfer, setViewTransfer] = useState(null);
  const [editTransfer, setEditTransfer] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [deleteTransfer, setDeleteTransfer] = useState(null);
  const [viewAsset, setViewAsset] = useState(null);

  const customer = customers.find(
    (item) =>
      String(item.id) === String(id) ||
      String(item.customerId) === String(id)
  );

  const getCustomerName = (record) => {
    return (
      record?.customerName ||
      record?.fullName ||
      record?.name ||
      `${record?.firstName || ""} ${record?.lastName || ""}`.trim() ||
      "Unnamed Customer"
    );
  };

  const getAssetKey = (asset) => {
    return String(
      asset?.selectionKey ||
        asset?.unitRecordId ||
        asset?.id ||
        asset?.assetId ||
        asset?.serialNumber ||
        asset?.macAddress ||
        ""
    );
  };

  const getTransferAssetKey = (transfer) => {
    return String(
      transfer?.unitRecordId ||
        transfer?.serialNumber ||
        transfer?.macAddress ||
        transfer?.assetRecordId ||
        transfer?.assetId ||
        ""
    );
  };

  const getParentAssetId = (asset) =>
    String(asset?.assetRecordId || asset?.parentAssetId || asset?.id || "");

  const isIndividualAsset = (asset) =>
    String(asset?.identityTracking || "")
      .toLowerCase()
      .includes("individual") ||
    (asset?.identityRecords || []).length > 0;

  const buildUnitOption = (asset, record, index, sourceLabel = "") => ({
    ...asset,
    ...record,
    id: asset.id,
    parentAssetId: asset.id || "",
    assetRecordId: asset.id || "",
    assetId: asset.assetId || "",
    deviceName: asset.deviceName || "",
    category: record.category || asset.category || "",
    brand: asset.brand || "",
    unitRecordId:
      record.id ||
      record.serialNumber ||
      record.macAddress ||
      `${asset.id || asset.assetId}-unit-${index}`,
    selectionKey: `${asset.id || asset.assetId}::${
      record.id ||
      record.serialNumber ||
      record.macAddress ||
      index
    }`,
    quantity: 1,
    sourceType: sourceLabel || record.sourceType || asset.location || "",
  });

  const expandAssetOptions = (asset, sourceLabel = "") => {
    if (isIndividualAsset(asset) && (asset.identityRecords || []).length > 0) {
      return (asset.identityRecords || []).map((record, index) =>
        buildUnitOption(asset, record, index, sourceLabel)
      );
    }

    return [
      {
        ...asset,
        parentAssetId: asset.id || "",
        assetRecordId: asset.id || "",
        selectionKey: asset.id || asset.assetId || "",
        quantity: Number(asset.quantity || 1),
        unitRecordId: "",
        sourceType: sourceLabel || asset.location || "",
      },
    ];
  };

  const getAssetLabel = (asset) => {
    const assetId = asset.assetId || "No Asset ID";
    const name = asset.deviceName || "Unnamed Device";

    const serial = asset.serialNumber
      ? ` / SN: ${asset.serialNumber}`
      : "";

    const mac = asset.macAddress
      ? ` / MAC: ${asset.macAddress}`
      : "";

    return `${assetId} - ${name}${serial}${mac}`;
  };

  const isLatestTransferForAsset = (transfer) => {
    const relatedTransfers = deviceTransfers.filter(
      (item) =>
        getTransferAssetKey(item) === getTransferAssetKey(transfer)
    );

    if (!relatedTransfers.length) return false;

    const sortedTransfers = [...relatedTransfers].sort((a, b) => {
      const firstDate = String(
        a.createdAt || a.issueDate || ""
      );

      const secondDate = String(
        b.createdAt || b.issueDate || ""
      );

      return firstDate.localeCompare(secondDate);
    });

    const latestTransfer =
      sortedTransfers[sortedTransfers.length - 1];

    return String(latestTransfer.id) === String(transfer.id);
  };

  const mainStockAssets = useMemo(() => {
    return assets.flatMap((asset) => {
      const location = String(
        asset.location || ""
      ).toLowerCase();

      const status = String(
        asset.status || ""
      ).toLowerCase();

      const inMainStock =
        location === "main stock" ||
        status === "in stock" ||
        status === "returned";

      return inMainStock ? expandAssetOptions(asset, "Main Stock") : [];
    });
  }, [assets]);

  const latestCustomerTransferOptions = useMemo(() => {
    const sortedTransfers = [...deviceTransfers].sort((a, b) =>
      String(a.createdAt || a.issueDate || "").localeCompare(
        String(b.createdAt || b.issueDate || "")
      )
    );
    const latestByUnit = new Map();

    sortedTransfers.forEach((transfer) => {
      const key =
        transfer.serialNumber ||
        transfer.macAddress ||
        transfer.unitRecordId ||
        transfer.assetRecordId ||
        transfer.assetId ||
        transfer.id;
      latestByUnit.set(String(key), transfer);
    });

    return Array.from(latestByUnit.values())
      .filter((transfer) => transfer.toCustomerRecordId)
      .map((transfer) => {
        const parentAsset =
          assets.find(
            (asset) =>
              String(asset.id || "") ===
                String(transfer.assetRecordId || "") ||
              String(asset.assetId || "") === String(transfer.assetId || "")
          ) || {};

        return {
          ...parentAsset,
          ...transfer,
          id: parentAsset.id || transfer.assetRecordId || transfer.id,
          parentAssetId: transfer.assetRecordId || parentAsset.id || "",
          assetRecordId: transfer.assetRecordId || parentAsset.id || "",
          assetId: transfer.assetId || parentAsset.assetId || "",
          deviceName: transfer.deviceName || parentAsset.deviceName || "",
          category: transfer.category || parentAsset.category || "",
          brand: transfer.brand || parentAsset.brand || "",
          selectionKey: `${transfer.assetRecordId || transfer.assetId}::${
            transfer.serialNumber ||
            transfer.macAddress ||
            transfer.id
          }`,
          unitRecordId:
            transfer.unitRecordId ||
            transfer.serialNumber ||
            transfer.macAddress ||
            transfer.id,
          quantity: Number(transfer.quantity || 1),
          location: "Customer",
          status: transfer.issueStatus || "Issued",
          customerRecordId: transfer.toCustomerRecordId || "",
          customerId: transfer.toCustomerId || "",
          customerName: transfer.toCustomerName || "",
        };
      });
  }, [assets, deviceTransfers]);

  const customerOwnedAssets = useMemo(() => {
    if (formData.sourceType !== "Customer") {
      return [];
    }

    const fromCustomer = customers.find(
      (item) =>
        String(item.id) === String(formData.fromCustomerId)
    );

    if (!fromCustomer) {
      return [];
    }

    const assetOptions = assets.flatMap((asset) => {
      const belongsToCustomer =
        String(asset.customerRecordId || "") === String(fromCustomer.id) ||
        String(asset.customerId || "") === String(fromCustomer.customerId);

      return belongsToCustomer ? expandAssetOptions(asset, "Customer") : [];
    });

    const transferOptions = latestCustomerTransferOptions.filter(
      (asset) =>
        String(asset.customerRecordId || "") === String(fromCustomer.id) ||
        String(asset.customerId || "") === String(fromCustomer.customerId)
    );

    const seen = new Set();
    return [...assetOptions, ...transferOptions].filter((asset) => {
      const key = getAssetKey(asset);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [
    assets,
    customers,
    formData.fromCustomerId,
    formData.sourceType,
    latestCustomerTransferOptions,
  ]);

  const currentCustomerAssets = useMemo(() => {
  if (!customer) return [];

  const assetOptions = assets.flatMap((asset) => {
    const belongsToCustomer =
      String(asset.customerRecordId || "") === String(customer.id) ||
      String(asset.customerId || "") === String(customer.customerId);

    return belongsToCustomer ? expandAssetOptions(asset, "Customer") : [];
  });

  const transferOptions = latestCustomerTransferOptions.filter(
    (asset) =>
      String(asset.customerRecordId || "") === String(customer.id) ||
      String(asset.customerId || "") === String(customer.customerId)
  );

  const seen = new Set();
  return [...assetOptions, ...transferOptions].filter((asset) => {
    const key = getAssetKey(asset);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}, [assets, customer, latestCustomerTransferOptions]);


const currentCustomerDeviceCount = currentCustomerAssets.reduce(
  (sum, asset) => sum + Number(asset.quantity || 1),
  0
);

const isSourceCurrentCustomer = (transfer) => {
  if (!customer) return false;

  return (
    String(transfer.fromCustomerRecordId || "") === String(customer.id || "") ||
    String(transfer.fromCustomerId || "") === String(customer.customerId || "")
  );
};

const isDestinationCurrentCustomer = (transfer) => {
  if (!customer) return false;

  return (
    String(transfer.toCustomerRecordId || "") === String(customer.id || "") ||
    String(transfer.toCustomerId || "") === String(customer.customerId || "")
  );
};

const getTransferRowClass = (transfer) => {
  if (isSourceCurrentCustomer(transfer)) {
    return "customer-issue-row-source-current";
  }

  if (isDestinationCurrentCustomer(transfer)) {
    return "customer-issue-row-source-other";
  }

  return "customer-issue-row-neutral";
};

 const availableAssets = useMemo(() => {
  if (formData.sourceType === "Main Stock") {
    return mainStockAssets;
  }

  if (formData.sourceType === "Customer") {
    return customerOwnedAssets;
  }

  if (formData.sourceType === "Customer to Main Stock") {
    return currentCustomerAssets;
  }

  return [];
}, [
  formData.sourceType,
  mainStockAssets,
  customerOwnedAssets,
  currentCustomerAssets,
]);

  const filteredAssets = useMemo(() => {
    const keyword = String(search || "")
      .trim()
      .toLowerCase();

    return availableAssets.filter((asset) => {
      if (!keyword) return true;

      return [
        asset.assetId,
        asset.deviceName,
        asset.category,
        asset.brand,
        asset.model,
        asset.macAddress,
        asset.serialNumber,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [availableAssets, search]);

  const selectedAssets = useMemo(() => {
    const selectedKeys = new Set(
      selectedAssetKeys.map(String)
    );

    return availableAssets.filter((asset) =>
      selectedKeys.has(getAssetKey(asset))
    );
  }, [availableAssets, selectedAssetKeys]);

  const getIssueSalePrice = (asset) =>
    Number(
      formData.salePrices?.[getAssetKey(asset)] ??
        asset.salePrice ??
        asset.unitPrice ??
        formData.salePrice ??
        0
    );

  const selectedSaleTotal = selectedAssets.reduce(
    (sum, asset) => sum + getIssueSalePrice(asset),
    0
  );

  const selectedPaidTotal = Number(formData.paidAmount || 0);

  const selectedRemainTotal =
    formData.ownershipType === "Sold"
      ? Math.max(selectedSaleTotal - selectedPaidTotal, 0)
      : 0;

  const selectedLoanedDepositTotal = selectedAssets.reduce(
    (sum, asset) =>
      sum +
      Number(
        asset.depositAmount ||
          asset.securityDepositPerDevice ||
          formData.depositAmount ||
          0
      ),
    0
  );

  const depositRefundAmount = Number(formData.depositRefundAmount || 0);
  const depositRefundRemaining = Math.max(
    selectedLoanedDepositTotal - depositRefundAmount,
    0
  );

  const getTransferSortValues = (transfer) => {
  const issueDateTime = Date.parse(`${transfer.issueDate || ""}T00:00:00`);
  const createdTime = Date.parse(transfer.createdAt || "");
  const updatedTime = Date.parse(transfer.updatedAt || "");

  const idTime = Number(
    String(transfer.id || "").match(/\d{10,}/)?.[0] || 0
  );

  const referenceTime = Number(
    String(transfer.referenceNumber || "").match(/\d{10,}/)?.[0] || 0
  );

  return {
    issueDateTime: Number.isNaN(issueDateTime) ? 0 : issueDateTime,
    createdTime: Number.isNaN(createdTime) ? 0 : createdTime,
    updatedTime: Number.isNaN(updatedTime) ? 0 : updatedTime,
    idTime,
    referenceTime,
  };
};

  const customerTransferHistory = useMemo(() => {
    if (!customer) {
      return [];
    }

    return deviceTransfers
      .filter(
        (item) =>
          String(item.toCustomerRecordId || "") ===
            String(customer.id) ||
          String(item.toCustomerId || "") ===
            String(customer.customerId) ||
          String(item.fromCustomerRecordId || "") ===
            String(customer.id) ||
          String(item.fromCustomerId || "") ===
            String(customer.customerId)
      )
      .sort((a, b) => {
  const first = getTransferSortValues(a);
  const second = getTransferSortValues(b);

  return (
    second.issueDateTime - first.issueDateTime ||
    second.createdTime - first.createdTime ||
    second.referenceTime - first.referenceTime ||
    second.idTime - first.idTime ||
    second.updatedTime - first.updatedTime
  );
});
  }, [customer, deviceTransfers]);

  const totalTransfers = customerTransferHistory.length;

  const loanedTransfers = customerTransferHistory.filter(
    (item) => item.ownershipType === "Loaned"
  ).length;

  const soldTransfers = customerTransferHistory.filter(
    (item) => item.ownershipType === "Sold"
  ).length;

  const totalDeposits = customerTransferHistory.reduce(
    (sum, item) =>
      sum + Number(item.depositAmount || 0),
    0
  );

  useEffect(() => {
    if (!openActionId) {
      return undefined;
    }

    const closeMenu = () => {
      setOpenActionId(null);
    };

    document.addEventListener("mousedown", closeMenu);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      document.removeEventListener(
        "mousedown",
        closeMenu
      );

      window.removeEventListener(
        "resize",
        closeMenu
      );

      window.removeEventListener(
        "scroll",
        closeMenu,
        true
      );
    };
  }, [openActionId]);

  const resetIssueForm = () => {
    setFormData(createEmptyIssueForm());
    setSelectedAssetKeys([]);
    setSearch("");
  };

  const openIssueModal = () => {
    resetIssueForm();
    setShowIssueModal(true);
  };

  const closeIssueModal = () => {
    resetIssueForm();
    setShowIssueModal(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (
      name === "sourceType" ||
      name === "fromCustomerId" ||
      name === "destinationCustomerId"
    ) {
      setSelectedAssetKeys([]);
    }

    setFormData((previous) => {
      const nextData = {
        ...previous,
        [name]: value,
      };

      if (name === "sourceType") {
  nextData.fromCustomerId = "";
  nextData.destinationCustomerId = "";

  if (value === "Customer to Main Stock") {
    nextData.ownershipType = "";
    nextData.salePrice = "";
    nextData.paidAmount = "";
    nextData.remainAmount = "";
    nextData.salePrices = {};
    nextData.depositRefundAmount = "";
    nextData.depositAmount = "";
    nextData.depositStatus = "";
    nextData.issueStatus = "Returned";
  } else {
    nextData.ownershipType = "Loaned";
    nextData.depositStatus = "Held";
    nextData.issueStatus = "Issued";
  }
}

      if (name === "ownershipType") {
        nextData.salePrice = "";
        nextData.paidAmount = "";
        nextData.remainAmount = "";
        nextData.salePrices = {};
        nextData.depositRefundAmount = "";
        nextData.depositAmount = "";
        nextData.depositStatus = "Held";
      }

      const salePrice =
        name === "salePrice"
          ? Number(value || 0)
          : Number(nextData.salePrice || 0);

      const paidAmount =
        name === "paidAmount"
          ? Number(value || 0)
          : Number(nextData.paidAmount || 0);

      if (nextData.ownershipType === "Sold") {
        nextData.remainAmount = Math.max(
          salePrice - paidAmount,
          0
        );
      } else {
        nextData.remainAmount = "";
      }

      return nextData;
    });
  };

  const updateSelectedSalePrice = (asset, value) => {
    const key = getAssetKey(asset);

    setFormData((previous) => ({
      ...previous,
      salePrices: {
        ...(previous.salePrices || {}),
        [key]: value,
      },
    }));
  };

  const isLockedSoldCustomerAsset = (asset) =>
    ["Customer", "Customer to Main Stock"].includes(formData.sourceType) &&
    String(asset.ownershipType || "") === "Sold";

  const toggleAssetSelection = (asset) => {
    if (isLockedSoldCustomerAsset(asset)) {
      notify("Sold customer devices cannot be transferred. Use Customer Purchases to buy them back.", "error");
      return;
    }

    const assetKey = getAssetKey(asset);

    setSelectedAssetKeys((previous) => {
      const exists = previous.some(
        (key) => String(key) === assetKey
      );

      if (exists) {
        return previous.filter(
          (key) => String(key) !== assetKey
        );
      }

      return [...previous, assetKey];
    });
  };

  const selectAllVisibleAssets = () => {
    const visibleKeys = filteredAssets
      .filter((asset) => !isLockedSoldCustomerAsset(asset))
      .map(getAssetKey);

    setSelectedAssetKeys((previous) => {
      const nextKeys = new Set(
        previous.map(String)
      );

      visibleKeys.forEach((key) => {
        nextKeys.add(String(key));
      });

      return [...nextKeys];
    });
  };

  const toggleActionMenu = (
    event,
    transferId
  ) => {
    event.stopPropagation();

    if (
      String(openActionId) ===
      String(transferId)
    ) {
      setOpenActionId(null);
      return;
    }

    const rect =
      event.currentTarget.getBoundingClientRect();

    const menuWidth = 180;
    const menuHeight = 132;
    const gap = 8;

    const left = Math.min(
      Math.max(
        rect.right - menuWidth,
        12
      ),
      window.innerWidth - menuWidth - 12
    );

    const hasSpaceBelow =
      window.innerHeight - rect.bottom >=
      menuHeight + gap;

    const top = hasSpaceBelow
      ? rect.bottom + gap
      : Math.max(
          12,
          rect.top - menuHeight - gap
        );

    setActionMenuPosition({
      top,
      left,
    });

    setOpenActionId(transferId);
  };

  const saveIssueDevice = async (event) => {
    event.preventDefault();

    if (!customer) return;

    if (!selectedAssets.length) {
      notify(
        "Please select at least one device.",
        "error"
      );

      return;
    }

    if (
      formData.sourceType === "Customer" &&
      !formData.fromCustomerId
    ) {
      notify(
        "Please select a source customer.",
        "error"
      );

      return;
    }

    if (
      formData.sourceType === "Customer" &&
      String(formData.fromCustomerId) ===
        String(customer.id) &&
      !formData.destinationCustomerId
    ) {
      notify(
        "Please select a destination customer.",
        "error"
      );

      return;
    }

    if (
      formData.sourceType === "Customer" &&
      String(formData.fromCustomerId) === String(customer.id) &&
      String(formData.destinationCustomerId) === String(customer.id)
    ) {
      notify(
        "Source customer and destination customer cannot be the same.",
        "error"
      );

      return;
    }

    if (selectedAssets.some(isLockedSoldCustomerAsset)) {
      notify(
        "Sold customer devices cannot be transferred. Use Customer Purchases to buy them back.",
        "error"
      );

      return;
    }

    const isReturnToMainStock =
  formData.sourceType === "Customer to Main Stock";

const fromCustomer =
  formData.sourceType === "Customer"
    ? customers.find(
        (item) =>
          String(item.id) === String(formData.fromCustomerId)
      )
    : isReturnToMainStock
      ? customer
      : null;

const destinationCustomer =
  formData.sourceType === "Customer" &&
  String(formData.fromCustomerId) === String(customer.id)
    ? customers.find(
        (item) =>
          String(item.id) === String(formData.destinationCustomerId)
      )
    : isReturnToMainStock
      ? null
      : customer;

    const isSoldTransfer =
      !isReturnToMainStock && formData.ownershipType === "Sold";

    const totalSaleAmount = isSoldTransfer
      ? selectedAssets.reduce((sum, asset) => sum + getIssueSalePrice(asset), 0)
      : 0;

const totalPaidAmount = isSoldTransfer
  ? Number(formData.paidAmount || 0)
  : 0;

    const depositAmount =
  !isReturnToMainStock &&
  formData.ownershipType === "Loaned"
    ? Number(formData.depositAmount || 0)
    : 0;

    if (isSoldTransfer && totalPaidAmount > totalSaleAmount) {
      notify("Paid amount cannot be greater than total sale amount.", "error");
      return;
    }

    const timestamp = Date.now();
    const batchId = `batch-${timestamp}`;
    const referenceNumber = `CUS-TRF-${timestamp}`;
    const createdAt =
      new Date().toISOString();

    const transferTypeLabel =
      formData.sourceType === "Main Stock"
        ? "Main Stock to Customer"
        : formData.sourceType === "Customer"
          ? "Customer to Customer"
          : "Customer to Main Stock";

    let remainingPaidAmount = totalPaidAmount;

    const newTransferRecords =
      selectedAssets.map((asset, index) => {
        const itemSalePrice = isSoldTransfer ? getIssueSalePrice(asset) : 0;
        const itemPaidAmount = isSoldTransfer
          ? Math.min(itemSalePrice, Math.max(remainingPaidAmount, 0))
          : 0;

        if (isSoldTransfer) {
          remainingPaidAmount = Math.max(
            remainingPaidAmount - itemPaidAmount,
            0
          );
        }

        const itemRemainAmount = isSoldTransfer
          ? Math.max(itemSalePrice - itemPaidAmount, 0)
          : 0;
        const previousDepositAmount = Number(asset.depositAmount || 0);
        const itemRefundAmount =
          !isReturnToMainStock && formData.ownershipType === "Loaned"
            ? Number(formData.depositRefundAmount || 0)
            : 0;

        return ({
        id: `${timestamp}-${index}`,
        batchId,
        referenceNumber,
        batchSize: selectedAssets.length,

        transferType: transferTypeLabel,

        fromType: formData.sourceType,

        fromCustomerRecordId:
          fromCustomer?.id || "",

        fromCustomerId:
          fromCustomer?.customerId || "",

        fromCustomerName: fromCustomer
          ? getCustomerName(fromCustomer)
          : "Main Stock",

        toCustomerRecordId:
  isReturnToMainStock ? "" : destinationCustomer?.id || "",

toCustomerId:
  isReturnToMainStock ? "" : destinationCustomer?.customerId || "",

toCustomerName:
  isReturnToMainStock
    ? "Main Stock"
    : getCustomerName(destinationCustomer),

        assetRecordId:
          asset.assetRecordId || asset.parentAssetId || asset.id || "",
        parentAssetId:
          asset.assetRecordId || asset.parentAssetId || asset.id || "",

        assetId:
          asset.assetId || "",

        deviceName:
          asset.deviceName || "",

        category:
          asset.category || "",

        brand:
          asset.brand || "",

        model:
          asset.model || "",

        macAddress:
          asset.macAddress || "",

        serialNumber:
          asset.serialNumber || "",

        previousAssetLocation:
          asset.location || "Main Stock",

        previousAssetStatus:
          asset.status || "In Stock",

        previousOwnershipType:
          asset.ownershipType || "",

        previousCustomerRecordId:
          asset.customerRecordId || "",

        previousCustomerId:
          asset.customerId || "",

        previousCustomerName:
          asset.customerName || "",

        issueDate:
          formData.issueDate,

        issueStatus:
  isReturnToMainStock
    ? "Returned"
    : formData.issueStatus,

ownershipType:
  isReturnToMainStock
    ? ""
    : formData.ownershipType,

        salePrice: itemSalePrice,
        paidAmount: itemPaidAmount,
        remainAmount: itemRemainAmount,
        depositAmount,
        previousDepositAmount,
        depositRefundAmount: itemRefundAmount,
        depositRemainingAmount: Math.max(previousDepositAmount - itemRefundAmount, 0),

        depositStatus:
  !isReturnToMainStock &&
  formData.ownershipType === "Loaned"
    ? formData.depositStatus
    : "",
        notes:
          formData.notes.trim(),

        createdAt,
        updatedAt: createdAt,
      });
      });

    const selectedByParent = new Map();

    selectedAssets.forEach((asset) => {
      const parentId = getParentAssetId(asset);
      const list = selectedByParent.get(parentId) || [];
      list.push(asset);
      selectedByParent.set(parentId, list);
    });

    const updatedAssets = assets.map(
      (asset) => {
        const selectedUnits = selectedByParent.get(String(asset.id || ""));

        if (!selectedUnits?.length) {
          return asset;
        }

        const selectedUnitKeys = new Set(
          selectedUnits.map((unit) => String(unit.unitRecordId || unit.serialNumber || unit.macAddress || ""))
        );
        const selectedQuantity = selectedUnits.reduce(
          (sum, unit) => sum + Number(unit.quantity || 1),
          0
        );
        const nextMainStockQuantity = Math.max(
          Number(asset.quantity || 0) - selectedQuantity,
          0
        );
        const assetBelongsToSourceCustomer =
          fromCustomer &&
          (String(asset.customerRecordId || "") === String(fromCustomer.id) ||
            String(asset.customerId || "") ===
              String(fromCustomer.customerId));
        const shouldMoveWholeAssetToCustomer =
          formData.sourceType === "Customer"
            ? assetBelongsToSourceCustomer
            : formData.sourceType === "Main Stock" &&
              !isIndividualAsset(asset) &&
              nextMainStockQuantity === 0;

        if (isReturnToMainStock) {
  const existingKeys = new Set(
    (asset.identityRecords || []).map((record) =>
      String(record.id || record.serialNumber || record.macAddress || "")
    )
  );
  const restoredIdentityRecords = selectedUnits
    .filter((unit) => unit.unitRecordId || unit.serialNumber || unit.macAddress)
    .filter(
      (unit) =>
        !existingKeys.has(
          String(unit.unitRecordId || unit.serialNumber || unit.macAddress || "")
        )
    )
    .map((unit) => ({
      id: unit.unitRecordId || unit.serialNumber || unit.macAddress,
      model: unit.model || "",
      macAddress: unit.macAddress || "",
      serialNumber: unit.serialNumber || "",
      category: unit.category || asset.category || "",
      unitPrice: unit.unitPrice || unit.salePrice || asset.unitPrice || 0,
      addedAt: createdAt,
      sourceType: "Customer Return",
    }));

  return {
    ...asset,

    location: "Main Stock",
    status: "Returned",
    ownershipType: "",
    quantity: Number(asset.quantity || 0) + selectedQuantity,
    identityRecords: isIndividualAsset(asset)
      ? [...(asset.identityRecords || []), ...restoredIdentityRecords]
      : asset.identityRecords || [],

    previousCustomerRecordId:
      customer.id || asset.customerRecordId || "",

    previousCustomerId:
      customer.customerId || asset.customerId || "",

    previousCustomerName:
      getCustomerName(customer),

    customerRecordId: "",
    customerId: "",
    customerName: "",

    lastTransferId:
      newTransferRecords.find(
        (record) =>
          String(record.assetRecordId || "") === String(asset.id || "")
      )?.id || "",
    lastTransferDate: formData.issueDate,
    returnedToStockDate: formData.issueDate,

    updatedAt: createdAt,
  };
}

return {
  ...asset,

  location: shouldMoveWholeAssetToCustomer ? "Customer" : asset.location,

  status:
    !shouldMoveWholeAssetToCustomer
      ? asset.status
      : formData.ownershipType === "Sold"
      ? "Sold"
      : formData.issueStatus,

  ownershipType:
    shouldMoveWholeAssetToCustomer
      ? formData.ownershipType
      : asset.ownershipType,

  customerRecordId:
    shouldMoveWholeAssetToCustomer
      ? destinationCustomer?.id || ""
      : asset.customerRecordId || "",

  customerId:
    shouldMoveWholeAssetToCustomer
      ? destinationCustomer?.customerId || ""
      : asset.customerId || "",

  customerName:
    shouldMoveWholeAssetToCustomer
      ? getCustomerName(destinationCustomer)
      : asset.customerName || "",
  quantity:
    formData.sourceType === "Main Stock"
      ? nextMainStockQuantity
      : Number(asset.quantity || 0),
  identityRecords:
    formData.sourceType === "Main Stock" && isIndividualAsset(asset)
      ? (asset.identityRecords || []).filter((record) => {
          const key = String(
            record.id || record.serialNumber || record.macAddress || ""
          );
          return !selectedUnitKeys.has(key);
        })
      : asset.identityRecords || [],

  previousCustomerRecordId:
    fromCustomer?.id ||
    asset.customerRecordId ||
    "",

  previousCustomerId:
    fromCustomer?.customerId ||
    asset.customerId ||
    "",

  previousCustomerName:
    fromCustomer
      ? getCustomerName(fromCustomer)
      : asset.customerName || "",

  lastTransferId:
    newTransferRecords.find(
      (record) =>
        String(record.assetRecordId || "") === String(asset.id || "")
    )?.id || "",

  lastTransferDate:
    formData.issueDate,

  updatedAt: createdAt,
};
      }
    );

    const assetsSaved =
      await setAssets(updatedAssets);

    if (!assetsSaved) {
      return;
    }

    const movementRecords = Array.from(selectedByParent.entries()).map(
      ([parentId, selectedUnits], index) => {
        const parentAsset =
          assets.find((asset) => String(asset.id || "") === String(parentId)) ||
          selectedUnits[0] ||
          {};
        const quantity = selectedUnits.reduce(
          (sum, unit) => sum + Number(unit.quantity || 1),
          0
        );
        const identityRecords = selectedUnits
          .filter((unit) => unit.unitRecordId || unit.serialNumber || unit.macAddress)
          .map((unit) => ({
            id: unit.unitRecordId || unit.serialNumber || unit.macAddress,
            model: unit.model || "",
            macAddress: unit.macAddress || "",
            serialNumber: unit.serialNumber || "",
            category: unit.category || parentAsset.category || "",
            unitPrice:
              unit.unitPrice ||
              parentAsset.unitPrice ||
              getIssueSalePrice(unit) ||
              0,
          }));
        const relatedTransferRecords = newTransferRecords.filter(
          (record) =>
            String(record.assetRecordId || "") ===
            String(parentAsset.id || selectedUnits[0]?.assetRecordId || "")
        );
        const movementSaleTotal = relatedTransferRecords.reduce(
          (sum, record) => sum + Number(record.salePrice || 0),
          0
        );
        const movementPaidTotal = relatedTransferRecords.reduce(
          (sum, record) => sum + Number(record.paidAmount || 0),
          0
        );
        const movementRemainTotal = Math.max(
          movementSaleTotal - movementPaidTotal,
          0
        );

        return {
          id: `asset-movement-${timestamp}-${index}`,
          parentAssetId: parentAsset.id || selectedUnits[0]?.assetRecordId || "",
          assetRecordId: parentAsset.id || selectedUnits[0]?.assetRecordId || "",
          assetId: parentAsset.assetId || selectedUnits[0]?.assetId || "",
          deviceName:
            parentAsset.deviceName || selectedUnits[0]?.deviceName || "",
          category: parentAsset.category || selectedUnits[0]?.category || "",
          movementType: "Transfer",
          transferType: transferTypeLabel,
          dealType: isReturnToMainStock ? "" : formData.ownershipType,
          batchId,
          referenceNumber,
          date: formData.issueDate,
          quantity,
          identityRecords,
          sourceName: fromCustomer ? getCustomerName(fromCustomer) : "Main Stock",
          sourceRecordId: fromCustomer?.id || "",
          sourceCustomerId: fromCustomer?.customerId || "",
          destinationName: isReturnToMainStock
            ? "Main Stock"
            : getCustomerName(destinationCustomer),
          destinationType: isReturnToMainStock ? "Main Stock" : "Customer",
          destinationRecordId: isReturnToMainStock
            ? ""
            : destinationCustomer?.id || "",
          destinationCustomerId: isReturnToMainStock
            ? ""
            : destinationCustomer?.customerId || "",
          totalAmount:
            formData.ownershipType === "Sold" && !isReturnToMainStock
              ? movementSaleTotal
              : 0,
          paidAmount:
            formData.ownershipType === "Sold" && !isReturnToMainStock
              ? movementPaidTotal
              : 0,
          remainingAmount:
            formData.ownershipType === "Sold" && !isReturnToMainStock
              ? movementRemainTotal
              : 0,
          trustAmount:
            formData.ownershipType === "Loaned" && !isReturnToMainStock
              ? quantity * depositAmount
              : 0,
          securityDepositPerDevice:
            formData.ownershipType === "Loaned" && !isReturnToMainStock
              ? depositAmount
              : 0,
          salePricePerDevice:
            formData.ownershipType === "Sold" && !isReturnToMainStock
              ? movementSaleTotal / Math.max(quantity, 1)
              : 0,
          paidAmountPerDevice:
            formData.ownershipType === "Sold" && !isReturnToMainStock
              ? movementPaidTotal / Math.max(quantity, 1)
              : 0,
          remainingAmountPerDevice:
            formData.ownershipType === "Sold" && !isReturnToMainStock
              ? movementRemainTotal / Math.max(quantity, 1)
              : 0,
          transferStatus: isReturnToMainStock ? "Returned" : formData.issueStatus,
          responsiblePerson: "",
          notes: formData.notes.trim(),
          createdAt,
          updatedAt: createdAt,
        };
      }
    );

    const movementsSaved = await setAssetMovements([
      ...assetMovements,
      ...movementRecords,
    ]);

    if (!movementsSaved) {
      return;
    }

    const transfersSaved =
      await setDeviceTransfers([
        ...deviceTransfers,
        ...newTransferRecords,
      ]);

    if (!transfersSaved) {
      return;
    }

    if (
  !isReturnToMainStock &&
  formData.ownershipType === "Loaned" &&
  depositAmount > 0
) {
      const newDeposits =
        newTransferRecords.map(
          (transfer, index) => ({
            id: `${timestamp}-deposit-${index}`,

            customerRecordId:
              destinationCustomer?.id || "",

            customerId:
              destinationCustomer?.customerId || "",

            customerName:
              getCustomerName(destinationCustomer),

            assetRecordId:
              transfer.assetRecordId,

            assetId:
              transfer.assetId,

            deviceName:
              transfer.deviceName,

            depositAmount,

            depositDate:
              formData.issueDate,

            depositStatus:
              formData.depositStatus,

            transferId:
              transfer.id,

            notes:
              formData.notes.trim(),

            createdAt,
            updatedAt: createdAt,
          })
        );

      const depositsSaved =
        await setSecurityDeposits([
          ...securityDeposits,
          ...newDeposits,
        ]);

      if (!depositsSaved) {
        return;
      }
    }

    notify(
  isReturnToMainStock
    ? `${selectedAssets.length} device${
        selectedAssets.length === 1 ? "" : "s"
      } returned to Main Stock successfully.`
    : `${selectedAssets.length} device${
        selectedAssets.length === 1 ? "" : "s"
      } issued successfully.`
);

    closeIssueModal();
  };

  const openEditTransferModal = (
    transfer
  ) => {
    setEditTransfer(transfer);

    setEditForm({
      issueDate:
        transfer.issueDate || "",

      issueStatus:
        transfer.issueStatus || "Issued",

      ownershipType:
        transfer.ownershipType || "Loaned",

      salePrice:
        String(transfer.salePrice || ""),

      paidAmount:
        String(transfer.paidAmount || ""),

      remainAmount:
        String(transfer.remainAmount || ""),

      depositAmount:
        String(transfer.depositAmount || ""),

      depositStatus:
        transfer.depositStatus || "Held",

      notes:
        transfer.notes || "",
    });

    setOpenActionId(null);
  };

  const closeEditTransferModal = () => {
    setEditTransfer(null);
    setEditForm(emptyEditForm);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => {
      const nextData = {
        ...previous,
        [name]: value,
      };

      if (name === "ownershipType") {
        nextData.salePrice = "";
        nextData.paidAmount = "";
        nextData.remainAmount = "";
        nextData.depositAmount = "";
        nextData.depositStatus = "Held";
      }

      const salePrice =
        name === "salePrice"
          ? Number(value || 0)
          : Number(nextData.salePrice || 0);

      const paidAmount =
        name === "paidAmount"
          ? Number(value || 0)
          : Number(nextData.paidAmount || 0);

      if (
        nextData.ownershipType === "Sold"
      ) {
        nextData.remainAmount = Math.max(
          salePrice - paidAmount,
          0
        );
      } else {
        nextData.remainAmount = "";
      }

      return nextData;
    });
  };

  const saveEditedTransfer = async (
    event
  ) => {
    event.preventDefault();

    if (!editTransfer) {
      return;
    }

    const salePrice =
  editForm.ownershipType === "Sold"
    ? Number(editForm.salePrice || 0)
    : 0;

const paidAmount =
  editForm.ownershipType === "Sold"
    ? Number(editForm.paidAmount || 0)
    : 0;

    const remainAmount =
      editForm.ownershipType === "Sold"
        ? Math.max(
            salePrice - paidAmount,
            0
          )
        : 0;

    const depositAmount =
      editForm.ownershipType === "Loaned"
        ? Number(
            editForm.depositAmount || 0
          )
        : 0;

    const updatedAt =
      new Date().toISOString();

    const updatedTransfer = {
      ...editTransfer,

      issueDate:
        editForm.issueDate,

      issueStatus:
        editForm.issueStatus,

      ownershipType:
        editForm.ownershipType,

      salePrice,
      paidAmount,
      remainAmount,
      depositAmount,

      depositStatus:
        editForm.ownershipType === "Loaned"
          ? editForm.depositStatus
          : "",

      notes:
        editForm.notes.trim(),

      updatedAt,
    };

    let nextAssets = assets;

    if (
      isLatestTransferForAsset(editTransfer)
    ) {
      const destinationCustomer =
        customers.find(
          (item) =>
            String(item.id) ===
              String(
                editTransfer.toCustomerRecordId
              ) ||
            String(item.customerId) ===
              String(
                editTransfer.toCustomerId
              )
        );

      nextAssets = assets.map((asset) => {
        const matches =
          String(getAssetKey(asset)) ===
          String(
            getTransferAssetKey(editTransfer)
          );

        if (!matches) {
          return asset;
        }

        return {
          ...asset,

          location: "Customer",

          status:
            editForm.ownershipType === "Sold"
              ? "Sold"
              : editForm.issueStatus,

          ownershipType:
            editForm.ownershipType,

          customerRecordId:
            editTransfer.toCustomerRecordId ||
            "",

          customerId:
            editTransfer.toCustomerId || "",

          customerName:
            editTransfer.toCustomerName ||
            (destinationCustomer
              ? getCustomerName(
                  destinationCustomer
                )
              : ""),

          lastTransferId:
            editTransfer.id,

          lastTransferDate:
            editForm.issueDate,

          updatedAt,
        };
      });
    }

    const nextTransfers =
      deviceTransfers.map((item) =>
        String(item.id) ===
        String(editTransfer.id)
          ? updatedTransfer
          : item
      );

    let nextDeposits =
      securityDeposits.filter(
        (deposit) =>
          String(deposit.transferId) !==
          String(editTransfer.id)
      );

    if (
      editForm.ownershipType === "Loaned" &&
      depositAmount > 0
    ) {
      const existingDeposit =
        securityDeposits.find(
          (deposit) =>
            String(deposit.transferId) ===
            String(editTransfer.id)
        );

      nextDeposits = [
        ...nextDeposits,
        {
          ...(existingDeposit || {}),

          id:
            existingDeposit?.id ||
            `deposit-${Date.now()}`,

          customerRecordId:
            editTransfer.toCustomerRecordId ||
            "",

          customerId:
            editTransfer.toCustomerId || "",

          customerName:
            editTransfer.toCustomerName || "",

          assetRecordId:
            editTransfer.assetRecordId || "",

          assetId:
            editTransfer.assetId || "",

          deviceName:
            editTransfer.deviceName || "",

          depositAmount,

          depositDate:
            editForm.issueDate,

          depositStatus:
            editForm.depositStatus,

          transferId:
            editTransfer.id,

          notes:
            editForm.notes.trim(),

          createdAt:
            existingDeposit?.createdAt ||
            updatedAt,

          updatedAt,
        },
      ];
    }

    const assetsSaved =
      await setAssets(nextAssets);

    if (!assetsSaved) {
      return;
    }

    const transfersSaved =
      await setDeviceTransfers(
        nextTransfers
      );

    if (!transfersSaved) {
      return;
    }

    const depositsSaved =
      await setSecurityDeposits(
        nextDeposits
      );

    if (!depositsSaved) {
      return;
    }

    notify(
      "Device transfer updated successfully."
    );

    closeEditTransferModal();
  };

  const transferMatchesMovement = (transfer, movement) => {
  if (!transfer || !movement) return false;

  if (
    transfer.batchId &&
    movement.batchId &&
    String(transfer.batchId) === String(movement.batchId)
  ) {
    return true;
  }

  if (
    transfer.referenceNumber &&
    movement.referenceNumber &&
    String(transfer.referenceNumber) === String(movement.referenceNumber)
  ) {
    return true;
  }

  const sameAsset =
    String(movement.assetRecordId || movement.parentAssetId || "") ===
      String(transfer.assetRecordId || transfer.parentAssetId || "") ||
    String(movement.assetId || "") === String(transfer.assetId || "");

  const sameDate =
    String(movement.date || "") === String(transfer.issueDate || transfer.date || "");

  return sameAsset && sameDate;
};

const removeTransferFromMovements = (transfer) => {
  return assetMovements.flatMap((movement) => {
    if (!transferMatchesMovement(transfer, movement)) {
      return [movement];
    }

    const movementUnits = movement.identityRecords || [];

    if (movementUnits.length > 1) {
      const transferUnitKey = String(
        transfer.unitRecordId ||
          transfer.serialNumber ||
          transfer.macAddress ||
          transfer.assetRecordId ||
          transfer.assetId ||
          ""
      );

      const nextIdentityRecords = movementUnits.filter((record) => {
        const recordKey = String(
          record.id ||
            record.serialNumber ||
            record.macAddress ||
            ""
        );

        return recordKey !== transferUnitKey;
      });

      if (nextIdentityRecords.length === movementUnits.length) {
        return [movement];
      }

      return [
        {
          ...movement,
          quantity: Math.max(Number(movement.quantity || 0) - Number(transfer.quantity || 1), 0),
          identityRecords: nextIdentityRecords,
          totalAmount: Math.max(
            Number(movement.totalAmount || 0) - Number(transfer.salePrice || 0),
            0
          ),
          paidAmount: Math.max(
            Number(movement.paidAmount || 0) - Number(transfer.paidAmount || 0),
            0
          ),
          remainingAmount: Math.max(
            Number(movement.remainingAmount || 0) - Number(transfer.remainAmount || 0),
            0
          ),
          trustAmount: Math.max(
            Number(movement.trustAmount || 0) - Number(transfer.depositAmount || 0),
            0
          ),
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    return [];
  });
};

  const confirmDeleteTransfer =
    async () => {
      if (!deleteTransfer) {
        return;
      }

      const latestTransfer =
        isLatestTransferForAsset(
          deleteTransfer
        );

      let nextAssets = assets;

      if (latestTransfer) {
        nextAssets = assets.map((asset) => {
          if (
            String(getAssetKey(asset)) !==
            String(
              getTransferAssetKey(
                deleteTransfer
              )
            )
          ) {
            return asset;
          }

          if (
            deleteTransfer.fromType ===
            "Customer"
          ) {
            return {
              ...asset,

              location: "Customer",

              status:
                deleteTransfer.previousAssetStatus ||
                "Issued",

              ownershipType:
                deleteTransfer.previousOwnershipType ||
                "Loaned",

              customerRecordId:
                deleteTransfer.fromCustomerRecordId ||
                deleteTransfer.previousCustomerRecordId ||
                "",

              customerId:
                deleteTransfer.fromCustomerId ||
                deleteTransfer.previousCustomerId ||
                "",

              customerName:
                deleteTransfer.fromCustomerName ||
                deleteTransfer.previousCustomerName ||
                "",

              lastTransferId: "",
              lastTransferDate: "",

              updatedAt:
                new Date().toISOString(),
            };
          }

          return {
            ...asset,

            location:
              deleteTransfer.previousAssetLocation ||
              "Main Stock",

            status:
              deleteTransfer.previousAssetStatus ||
              "In Stock",

            ownershipType:
              deleteTransfer.previousOwnershipType ||
              "",

            customerRecordId:
              deleteTransfer.previousCustomerRecordId ||
              "",

            customerId:
              deleteTransfer.previousCustomerId ||
              "",

            customerName:
              deleteTransfer.previousCustomerName ||
              "",

            lastTransferId: "",
            lastTransferDate: "",

            updatedAt:
              new Date().toISOString(),
          };
        });
      }

      const nextTransfers =
        deviceTransfers.filter(
          (item) =>
            String(item.id) !==
            String(deleteTransfer.id)
        );

        const nextMovements = removeTransferFromMovements(deleteTransfer);

      const nextDeposits =
        securityDeposits.filter(
          (deposit) =>
            String(deposit.transferId) !==
            String(deleteTransfer.id)
        );

      const assetsSaved =
        await setAssets(nextAssets);

      if (!assetsSaved) {
        return;
      }

      const transfersSaved =
        await setDeviceTransfers(
          nextTransfers
        );

      if (!transfersSaved) {
        return;
      }

      const depositsSaved =
        await setSecurityDeposits(
          nextDeposits
        );
        

      if (!depositsSaved) {
        return;
      }

      const movementsSaved = await setAssetMovements(nextMovements);

if (!movementsSaved) {
  return;
}




      notify(
        latestTransfer
          ? "Device transfer deleted and asset status restored."
          : "Historical transfer deleted. The current asset status was not changed."
      );

      setDeleteTransfer(null);
    };

  if (
    !customersLoaded ||
    !assetsLoaded ||
    !movementsLoaded ||
    !transfersLoaded ||
    !depositsLoaded
  ) {
    return (
      <div className="page-loading">
        Loading device transfers...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="customer-issue-page">
        <div className="customer-issue-not-found">
          <h1>Customer Not Found</h1>

          <p>
            The selected customer record does
            not exist.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/customers")
            }
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-issue-page">
      <Link
        className="customer-issue-back"
        to="/customers"
      >
        ← Back to Customers
      </Link>

      <div className="customer-issue-header">
        <div>
          <span className="customer-issue-kicker">
            Customer Device Transfer
          </span>

          <h1>Issue Device</h1>

          <p>
            Give, sell, or loan devices to{" "}
            <strong>
              {getCustomerName(customer)}
            </strong>
            .
          </p>
        </div>

        <div className="customer-issue-header-actions">
          <button
            type="button"
            className="customer-issue-add-btn"
            onClick={openIssueModal}
          >
            + Issue Devices
          </button>

          <Link
            className="customer-issue-detail-link"
            to={`/customers/${
              customer.id ||
              customer.customerId
            }`}
          >
            Customer Full Detail
          </Link>
        </div>
      </div>

      <div className="customer-issue-stats">
  <div className="customer-issue-current-device-card">
    <span>Current Devices With Customer</span>
    <strong>{currentCustomerDeviceCount}</strong>
    <p>Devices currently held by this customer</p>
  </div>

  <div>
    <span>Total Transfers</span>
    <strong>{totalTransfers}</strong>
    <p>All device transfer records</p>
  </div>

        <div>
          <span>Loaned Devices</span>
          <strong>{loanedTransfers}</strong>
          <p>
            Devices issued with a deposit
          </p>
        </div>

        <div>
          <span>Sold Devices</span>
          <strong>{soldTransfers}</strong>
          <p>Devices sold to customers</p>
        </div>

        <div>
          <span>Total Deposits</span>
          <strong>
            {money(totalDeposits)} AFN
          </strong>
          <p>Recorded security deposits</p>
        </div>
      </div>

      <div className="customer-issue-card">
        <div className="customer-issue-card-header">
  <div>
    <h3>
      Customer Device Transfer History
    </h3>

    <p>
      View, edit, or delete every
      device transfer record.
    </p>
  </div>

  <div className="customer-issue-legend">
    <span className="customer-issue-legend-item source-other">
      <i />
      Source is not this customer
    </span>

    <span className="customer-issue-legend-item source-current">
      <i />
      Source is this customer
    </span>
  </div>
</div>

        <div className="customer-issue-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transfer Type</th>
                <th>From</th>
                <th>To</th>
                <th>Device</th>
                <th>Ownership</th>
                <th>Deposit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {customerTransferHistory.map(
                (item) => (
                  <tr key={item.id} className={getTransferRowClass(item)}>
                    <td>
                      {formatDateTime(
                        item.issueDate,
                        item.createdAt || item.updatedAt
                      )}
                    </td>

                    <td
                      title={
                        item.transferType ||
                        "-"
                      }
                    >
                      {item.transferType ||
                        "-"}
                    </td>

                    <td
                      title={
                        item.fromCustomerName ||
                        "-"
                      }
                    >
                      {item.fromCustomerName ||
                        "-"}
                    </td>

                    <td
                      title={
                        item.toCustomerName ||
                        "-"
                      }
                    >
                      {item.toCustomerName ||
                        "-"}
                    </td>

                    <td
                      title={`${
                        item.assetId || "-"
                      } - ${
                        item.deviceName || "-"
                      }`}
                    >
                      {item.assetId || "-"} -{" "}
                      {item.deviceName || "-"}
                    </td>

                    <td>
                      {item.ownershipType ||
                        "-"}
                    </td>

                    <td>
                      {money(
                        item.depositAmount
                      )}{" "}
                      AFN
                    </td>

                    <td>
                      {item.issueStatus || "-"}
                    </td>

                    <td>
                      <div className="customer-issue-action-cell">
                        <button
                          type="button"
                          className="customer-issue-action-btn"
                          aria-label="Open transfer actions"
                          onClick={(event) =>
                            toggleActionMenu(
                              event,
                              item.id
                            )
                          }
                        >
                          ⋮
                        </button>

                        {String(
                          openActionId
                        ) === String(item.id) && (
                          <div
                            className="customer-issue-action-menu"
                            style={{
                              top: `${actionMenuPosition.top}px`,
                              left: `${actionMenuPosition.left}px`,
                            }}
                            onMouseDown={(
                              event
                            ) =>
                              event.stopPropagation()
                            }
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setViewTransfer(
                                  item
                                );

                                setOpenActionId(
                                  null
                                );
                              }}
                            >
                              View Details
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditTransferModal(
                                  item
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="danger"
                              onClick={() => {
                                setDeleteTransfer(
                                  item
                                );

                                setOpenActionId(
                                  null
                                );
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )}

              {customerTransferHistory.length ===
                0 && (
                <tr>
                  <td
                    colSpan="9"
                    className="customer-issue-empty-row"
                  >
                    No device transfer has been
                    recorded for this customer
                    yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showIssueModal && (
        <div
          className="customer-issue-modal-backdrop"
          onClick={closeIssueModal}
        >
          <div
            className="customer-issue-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="customer-issue-modal-header">
              <div>
                <h3>
                  Issue Multiple Devices
                </h3>

                <p>
                  Select one or more devices
                  for{" "}
                  <strong>
                    {getCustomerName(customer)}
                  </strong>
                  .
                </p>
              </div>

              <button
                type="button"
                onClick={closeIssueModal}
              >
                ×
              </button>
            </div>

            <div className="customer-issue-modal-grid">
              <div className="customer-issue-card">
                <div className="customer-issue-card-header">
                  <div>
                    <h3>Issue Device Form</h3>

                    <p>
                      The selected financial
                      values are applied to each
                      device.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={saveIssueDevice}
                >
                  <div className="customer-issue-form-grid">
                    <div className="customer-issue-form-group">
                      <label>
                        Transfer Type
                      </label>

                     <select
                        name="sourceType"
                        value={formData.sourceType}
                        onChange={handleChange}
                        >
                        <option value="Main Stock">
                            Main Stock to Customer
                        </option>

                        <option value="Customer">
                            Customer to Customer
                        </option>

                        <option value="Customer to Main Stock">
                            Customer to Main Stock
                        </option>
                        </select>
                    </div>

                    {formData.sourceType === "Customer to Main Stock" && (
                    <>
                        <div className="customer-issue-form-group">
                        <label>Source Customer</label>

                        <input
                            value={`${customer.customerId || "No ID"} - ${getCustomerName(
                            customer
                            )}`}
                            readOnly
                        />
                        </div>

                        <div className="customer-issue-form-group">
                        <label>Destination</label>

                        <input
                            value="Main Stock"
                            readOnly
                        />
                        </div>
                    </>
                    )}

                    {formData.sourceType ===
                      "Customer" && (
                      <div className="customer-issue-form-group">
                        <label>
                          From Customer
                        </label>

                        <select
                          name="fromCustomerId"
                          value={
                            formData.fromCustomerId
                          }
                          onChange={
                            handleChange
                          }
                          required
                        >
                          <option value="">
                            Select Source Customer
                          </option>

                          {customers
                            .map((item) => (
                              <option
                                key={
                                  item.id
                                }
                                value={
                                  item.id
                                }
                              >
                                {item.customerId ||
                                  "No ID"}{" "}
                                -{" "}
                                {getCustomerName(
                                  item
                                )}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}

                    {formData.sourceType === "Customer" &&
                      String(formData.fromCustomerId) === String(customer.id) && (
                        <div className="customer-issue-form-group">
                          <label>Destination</label>

                          <select
                            name="destinationCustomerId"
                            value={formData.destinationCustomerId}
                            onChange={handleChange}
                            required
                          >
                            <option value="">Select Destination Customer</option>

                            {customers
                              .filter(
                                (item) =>
                                  String(item.id) !== String(customer.id)
                              )
                              .map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.customerId || "No ID"} -{" "}
                                  {getCustomerName(item)}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}

                    {formData.sourceType === "Customer" &&
                      formData.fromCustomerId &&
                      String(formData.fromCustomerId) !== String(customer.id) && (
                        <div className="customer-issue-form-group">
                          <label>Destination</label>

                          <input
                            value={`${customer.customerId || "No ID"} - ${getCustomerName(
                              customer
                            )}`}
                            readOnly
                          />
                        </div>
                      )}

                    <div className="customer-issue-form-group">
                      <label>
                        Issue Date
                      </label>

                      <input
                        type="date"
                        name="issueDate"
                        value={
                          formData.issueDate
                        }
                        onChange={
                          handleChange
                        }
                        required
                      />
                    </div>

                    <div className="customer-issue-form-group">
                      <label>
                        Device Status
                      </label>

                      <select
  name="issueStatus"
  value={formData.issueStatus}
  onChange={handleChange}
  disabled={formData.sourceType === "Customer to Main Stock"}
>
  {formData.sourceType === "Customer to Main Stock" ? (
    <option value="Returned">
      Returned to Main Stock
    </option>
  ) : (
    <>
      <option value="Issued">
        Issued
      </option>

      <option value="Installed">
        Installed
      </option>
    </>
  )}
</select>
                    </div>

                    {formData.sourceType !== "Customer to Main Stock" && (
  <div className="customer-issue-form-group">
    <label>Destination Deal</label>

    <select
      name="ownershipType"
      value={formData.ownershipType}
      onChange={handleChange}
    >
      <option value="Loaned">
        Loaned / Deposit
      </option>

      <option value="Sold">
        Sold
      </option>
    </select>
  </div>
)}

                    {formData.sourceType === "Customer" &&
                      selectedLoanedDepositTotal > 0 && (
                        <>
                          <div className="customer-issue-form-group">
                            <label>From Customer Deposit Held</label>
                            <input
                              value={`${money(selectedLoanedDepositTotal)} AFN`}
                              readOnly
                            />
                          </div>

                          <div className="customer-issue-form-group">
                            <label>Refund Paid to From Customer</label>
                            <input
                              type="number"
                              min="0"
                              max={selectedLoanedDepositTotal}
                              name="depositRefundAmount"
                              value={formData.depositRefundAmount}
                              onChange={handleChange}
                              placeholder="Example: 500"
                            />
                          </div>

                          <div className="customer-issue-form-group">
                            <label>Refund Remaining for From Customer</label>
                            <input
                              value={`${money(depositRefundRemaining)} AFN`}
                              readOnly
                            />
                          </div>
                        </>
                      )}

                    {formData.sourceType !== "Customer to Main Stock" &&
  formData.ownershipType === "Sold" && (
                      <>
                        <div className="customer-issue-form-group">
                          <label>
                            Total Sale Amount
                          </label>

                          <input
                            value={`${money(selectedSaleTotal)} AFN`}
                            readOnly
                          />
                        </div>

                        <div className="customer-issue-form-group">
                          <label>
                            Total Paid
                          </label>

                          <input
                            type="number"
                            min="0"
                            name="paidAmount"
                            value={
                              formData.paidAmount
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Example: 1000"
                          />
                        </div>

                        <div className="customer-issue-form-group">
                          <label>
                            Total Remaining
                          </label>

                          <input
                            value={`${money(
                              selectedRemainTotal
                            )} AFN`}
                            readOnly
                          />
                        </div>
                      </>
                    )}

                    {formData.sourceType !== "Customer to Main Stock" &&
  formData.ownershipType === "Loaned" && (
                      <>
                        <div className="customer-issue-form-group">
                          <label>
                            Security Deposit per
                            Device
                          </label>

                          <input
                            type="number"
                            min="0"
                            name="depositAmount"
                            value={
                              formData.depositAmount
                            }
                            onChange={
                              handleChange
                            }
                            placeholder="Example: 1000"
                          />
                        </div>

                        <div className="customer-issue-form-group">
                          <label>
                            Destination Deposit Status
                          </label>

                          <select
                            name="depositStatus"
                            value={
                              formData.depositStatus
                            }
                            onChange={
                              handleChange
                            }
                          >
                            <option value="Held">
                              Held
                            </option>

                            <option value="Refunded">
                              Refunded
                            </option>

                            <option value="Outstanding">
                              Outstanding
                            </option>
                          </select>
                        </div>
                      </>
                    )}

                    <div className="customer-issue-form-group customer-issue-full">
                      <label>Notes</label>

                      <textarea
                        name="notes"
                        value={
                          formData.notes
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Device transfer notes..."
                      />
                    </div>
                  </div>

                  <div className="customer-issue-actions">
                    <button
                      type="button"
                      onClick={resetIssueForm}
                    >
                      Reset
                    </button>

                    <button type="submit">
  {formData.sourceType === "Customer to Main Stock"
    ? `Return ${
        selectedAssets.length || "Selected"
      } Device${
        selectedAssets.length === 1 ? "" : "s"
      } to Main Stock`
    : `Issue ${
        selectedAssets.length || "Selected"
      } Device${
        selectedAssets.length === 1 ? "" : "s"
      }`}
</button>
                  </div>
                </form>
              </div>

              <div className="customer-issue-card customer-issue-selector-card">
                <div className="customer-issue-card-header">
                  <div>
                    <h3>Select Devices</h3>

                    <p>
                      {selectedAssets.length}{" "}
                      device(s) selected.
                    </p>
                  </div>

                  <div className="customer-issue-selector-actions">
                    <button
                      type="button"
                      onClick={
                        selectAllVisibleAssets
                      }
                    >
                      Select All Visible
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedAssetKeys(
                          []
                        )
                      }
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <input
                  className="customer-issue-search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search by asset ID, device, MAC, or serial..."
                />

                <div className="customer-issue-device-list">
                  {filteredAssets.map(
                    (asset) => {
                      const selected =
                        selectedAssetKeys.some(
                          (key) =>
                            String(key) ===
                            getAssetKey(
                              asset
                            )
                        );
                      const lockedSoldAsset =
                        isLockedSoldCustomerAsset(asset);

                      return (
                        <button
                          key={getAssetKey(
                            asset
                          )}
                          type="button"
                          className={
                            lockedSoldAsset
                              ? "customer-issue-device sold-locked"
                              : selected
                              ? "customer-issue-device active"
                              : "customer-issue-device"
                          }
                          disabled={lockedSoldAsset}
                          onClick={() =>
                            toggleAssetSelection(
                              asset
                            )
                          }
                        >
                          <span className="customer-issue-device-check">
                            {selected
                              ? "✓"
                              : ""}
                          </span>

                          <span className="customer-issue-device-content">
                            <strong>
                              {getAssetLabel(
                                asset
                              )}
                            </strong>

                            <small>
                              {asset.category ||
                                "-"}{" "}
                              /{" "}
                              {asset.status ||
                                "-"}{" "}
                              /{" "}
                              {asset.location ||
                                "-"}
                              {lockedSoldAsset ? " / Purchased by customer" : ""}
                            </small>
                          </span>
                        </button>
                      );
                    }
                  )}

                  {filteredAssets.length ===
                    0 && (
                    <div className="customer-issue-empty">
                      No available device was
                      found for this transfer
                      type.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedAssets.length > 0 && (
              <div className="customer-issue-selected-card compact">
                <div className="customer-issue-selected-heading">
                  <div>
                    <h3>
                      Selected Device Details
                    </h3>

                    <p>
                      Review all selected
                      devices before saving.
                    </p>
                  </div>

                  <span>
                    {selectedAssets.length}{" "}
                    Selected
                  </span>
                </div>

                <div className="customer-issue-selected-list">
                  {selectedAssets.map(
                    (asset) => (
                      <div
                        className="customer-issue-selected-item"
                        key={getAssetKey(
                          asset
                        )}
                      >
                        <div>
                          <span>
                            Asset ID
                          </span>

                          <strong>
                            {asset.assetId ||
                              "-"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Device Name
                          </span>

                          <strong>
                            {asset.deviceName ||
                              "-"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            MAC Address
                          </span>

                          <strong>
                            {asset.macAddress ||
                              "-"}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Serial Number
                          </span>

                          <strong>
                            {asset.serialNumber ||
                              "-"}
                          </strong>
                        </div>

                        {formData.ownershipType === "Sold" &&
                          formData.sourceType !== "Customer to Main Stock" && (
                            <label className="customer-issue-selected-price">
                              <span>Sale Price</span>
                              <input
                                type="number"
                                min="0"
                                value={
                                  formData.salePrices?.[getAssetKey(asset)] ??
                                  asset.salePrice ??
                                  asset.unitPrice ??
                                  ""
                                }
                                onChange={(event) =>
                                  updateSelectedSalePrice(
                                    asset,
                                    event.target.value
                                  )
                                }
                              />
                            </label>
                          )}

                        {formData.sourceType === "Customer" &&
                          asset.ownershipType === "Loaned" && (
                            <div>
                              <span>Deposit Held</span>
                              <strong>
                                {money(asset.depositAmount || 0)} AFN
                              </strong>
                            </div>
                          )}

                        <button
                        type="button"
                        className="customer-issue-full-detail-btn"
                        onClick={() => setViewAsset(asset)}
                        >
                        Full Detail
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {viewAsset && (
  <div
    className="customer-asset-detail-backdrop"
    onClick={() => setViewAsset(null)}
  >
    <div
      className="customer-asset-detail-modal"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="customer-asset-detail-header">
        <div>
          <span>Asset Information</span>

          <h3>
            {viewAsset.assetId || "No Asset ID"} -{" "}
            {viewAsset.deviceName || "Unnamed Device"}
          </h3>

          <p>
            Complete specifications and current asset information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setViewAsset(null)}
        >
          ×
        </button>
      </div>

      <div className="customer-asset-detail-grid">
        <div>
          <span>Asset ID</span>
          <strong>{viewAsset.assetId || "-"}</strong>
        </div>

        <div>
          <span>Device Name</span>
          <strong>{viewAsset.deviceName || "-"}</strong>
        </div>

        <div>
          <span>Category</span>
          <strong>{viewAsset.category || "-"}</strong>
        </div>

        <div>
          <span>Brand</span>
          <strong>{viewAsset.brand || "-"}</strong>
        </div>

        <div>
          <span>Model</span>
          <strong>{viewAsset.model || "-"}</strong>
        </div>

        <div>
          <span>MAC Address</span>
          <strong>{viewAsset.macAddress || "-"}</strong>
        </div>

        <div>
          <span>Serial Number</span>
          <strong>{viewAsset.serialNumber || "-"}</strong>
        </div>

        <div>
          <span>Quantity</span>
          <strong>{viewAsset.quantity || 1}</strong>
        </div>

        <div>
          <span>Unit Price</span>
          <strong>{money(viewAsset.unitPrice)} AFN</strong>
        </div>

        <div>
          <span>Total Value</span>
          <strong>
            {money(
              Number(viewAsset.quantity || 1) *
                Number(viewAsset.unitPrice || 0)
            )}{" "}
            AFN
          </strong>
        </div>

        <div>
          <span>Purchase Date</span>
          <strong>
            {formatDateTime(
              viewAsset.purchaseDate,
              viewAsset.createdAt || viewAsset.updatedAt
            )}
          </strong>
        </div>

        <div>
          <span>Supplier</span>
          <strong>{viewAsset.supplierName || "-"}</strong>
        </div>

        <div>
          <span>Current Location</span>
          <strong>{viewAsset.location || "Main Stock"}</strong>
        </div>

        <div>
          <span>Current Status</span>
          <strong>{viewAsset.status || "Unknown"}</strong>
        </div>

        <div>
          <span>Ownership Type</span>
          <strong>{viewAsset.ownershipType || "-"}</strong>
        </div>

        <div>
          <span>Current Customer</span>
          <strong>{viewAsset.customerName || "-"}</strong>
        </div>

        <div>
          <span>Customer ID</span>
          <strong>{viewAsset.customerId || "-"}</strong>
        </div>

        <div>
          <span>Previous Customer</span>
          <strong>{viewAsset.previousCustomerName || "-"}</strong>
        </div>

        <div>
          <span>Last Transfer Date</span>
          <strong>
            {formatDateTime(
              viewAsset.lastTransferDate,
              viewAsset.updatedAt || viewAsset.createdAt
            )}
          </strong>
        </div>

        <div>
          <span>Created At</span>
          <strong>{formatDateTime(viewAsset.createdAt)}</strong>
        </div>

        <div>
          <span>Last Updated</span>
          <strong>{formatDateTime(viewAsset.updatedAt)}</strong>
        </div>

        <div className="customer-asset-detail-full">
          <span>Notes</span>

          <strong>
            {viewAsset.notes || "No notes have been added for this asset."}
          </strong>
        </div>
      </div>

      <div className="customer-asset-detail-footer">
        <button
          type="button"
          onClick={() => setViewAsset(null)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

      {viewTransfer && (
        <div
          className="customer-issue-modal-backdrop"
          onClick={() =>
            setViewTransfer(null)
          }
        >
          <div
            className="customer-issue-detail-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="customer-issue-modal-header">
              <div>
                <h3>
                  Device Transfer Details
                </h3>

                <p>
                  Complete information for
                  the selected transfer.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setViewTransfer(null)
                }
              >
                ×
              </button>
            </div>

            <div className="customer-issue-detail-grid">
              <div>
                <span>Transfer ID</span>
                <strong>
                  {viewTransfer.id || "-"}
                </strong>
              </div>

              <div>
                <span>Batch ID</span>
                <strong>
                  {viewTransfer.batchId || "-"}
                </strong>
              </div>

              <div>
                <span>Transfer Type</span>
                <strong>
                  {viewTransfer.transferType ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Issue Date</span>
                <strong>
                  {formatDateTime(
                    viewTransfer.issueDate,
                    viewTransfer.createdAt || viewTransfer.updatedAt
                  )}
                </strong>
              </div>

              <div>
                <span>From</span>
                <strong>
                  {viewTransfer.fromCustomerName ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>To</span>
                <strong>
                  {viewTransfer.toCustomerName ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Asset ID</span>
                <strong>
                  {viewTransfer.assetId || "-"}
                </strong>
              </div>

              <div>
                <span>Device Name</span>
                <strong>
                  {viewTransfer.deviceName ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Category</span>
                <strong>
                  {viewTransfer.category || "-"}
                </strong>
              </div>

              <div>
                <span>Brand</span>
                <strong>
                  {viewTransfer.brand || "-"}
                </strong>
              </div>

              <div>
                <span>Model</span>
                <strong>
                  {viewTransfer.model || "-"}
                </strong>
              </div>

              <div>
                <span>MAC Address</span>
                <strong>
                  {viewTransfer.macAddress ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Serial Number</span>
                <strong>
                  {viewTransfer.serialNumber ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Issue Status</span>
                <strong>
                  {viewTransfer.issueStatus ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Ownership Type</span>
                <strong>
                  {viewTransfer.ownershipType ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Sale Price</span>
                <strong>
                  {money(
                    viewTransfer.salePrice
                  )}{" "}
                  AFN
                </strong>
              </div>

              <div>
                <span>Paid Amount</span>
                <strong>
                  {money(
                    viewTransfer.paidAmount
                  )}{" "}
                  AFN
                </strong>
              </div>

              <div>
                <span>
                  Remaining Amount
                </span>

                <strong>
                  {money(
                    viewTransfer.remainAmount
                  )}{" "}
                  AFN
                </strong>
              </div>

              <div>
                <span>
                  Security Deposit
                </span>

                <strong>
                  {money(
                    viewTransfer.depositAmount
                  )}{" "}
                  AFN
                </strong>
              </div>

              <div>
                <span>From Customer Deposit</span>
                <strong>
                  {money(viewTransfer.previousDepositAmount)} AFN
                </strong>
              </div>

              <div>
                <span>Refund Paid to From Customer</span>
                <strong>
                  {money(viewTransfer.depositRefundAmount)} AFN
                </strong>
              </div>

              <div>
                <span>Refund Remaining</span>
                <strong>
                  {money(viewTransfer.depositRemainingAmount)} AFN
                </strong>
              </div>

              <div>
                <span>Deposit Status</span>
                <strong>
                  {viewTransfer.depositStatus ||
                    "-"}
                </strong>
              </div>

              <div className="customer-issue-detail-full">
                <span>Notes</span>

                <strong>
                  {viewTransfer.notes ||
                    "No notes were added."}
                </strong>
              </div>

              <div>
                <span>Created At</span>
                <strong>
                  {formatDateTime(viewTransfer.createdAt)}
                </strong>
              </div>

              <div>
                <span>Last Updated</span>
                <strong>
                  {formatDateTime(viewTransfer.updatedAt)}
                </strong>
              </div>
            </div>

            <div className="customer-issue-detail-actions">
              <button
                type="button"
                onClick={() =>
                  setViewTransfer(null)
                }
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const selectedTransfer =
                    viewTransfer;

                  setViewTransfer(null);

                  openEditTransferModal(
                    selectedTransfer
                  );
                }}
              >
                Edit Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {editTransfer && (
        <div
          className="customer-issue-modal-backdrop"
          onClick={
            closeEditTransferModal
          }
        >
          <div
            className="customer-issue-edit-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="customer-issue-modal-header">
              <div>
                <h3>
                  Edit Device Transfer
                </h3>

                <p>
                  {editTransfer.assetId ||
                    "-"}{" "}
                  -{" "}
                  {editTransfer.deviceName ||
                    "-"}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeEditTransferModal
                }
              >
                ×
              </button>
            </div>

            <div className="customer-issue-edit-summary">
              <div>
                <span>From</span>

                <strong>
                  {editTransfer.fromCustomerName ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>To</span>

                <strong>
                  {editTransfer.toCustomerName ||
                    "-"}
                </strong>
              </div>

              <div>
                <span>Asset</span>

                <strong>
                  {editTransfer.assetId ||
                    "-"}
                </strong>
              </div>
            </div>

            <form
              onSubmit={saveEditedTransfer}
            >
              <div className="customer-issue-form-grid no-padding">
                <div className="customer-issue-form-group">
                  <label>Issue Date</label>

                  <input
                    type="date"
                    name="issueDate"
                    value={
                      editForm.issueDate
                    }
                    onChange={
                      handleEditChange
                    }
                    required
                  />
                </div>

                <div className="customer-issue-form-group">
                  <label>
                    Device Status
                  </label>

                  <select
                    name="issueStatus"
                    value={
                      editForm.issueStatus
                    }
                    onChange={
                      handleEditChange
                    }
                  >
                    <option value="Issued">
                      Issued
                    </option>

                    <option value="Installed">
                      Installed
                    </option>
                  </select>
                </div>

                <div className="customer-issue-form-group">
                  <label>
                    Ownership Type
                  </label>

                  <select
                    name="ownershipType"
                    value={
                      editForm.ownershipType
                    }
                    onChange={
                      handleEditChange
                    }
                  >
                    <option value="Loaned">
                      Loaned / Deposit
                    </option>

                    <option value="Sold">
                      Sold
                    </option>
                  </select>
                </div>

                {editForm.ownershipType ===
                  "Sold" && (
                  <>
                    <div className="customer-issue-form-group">
                      <label>
                        Sale Price
                      </label>

                      <input
                        type="number"
                        min="0"
                        name="salePrice"
                        value={
                          editForm.salePrice
                        }
                        onChange={
                          handleEditChange
                        }
                      />
                    </div>

                    <div className="customer-issue-form-group">
                      <label>
                        Paid Amount
                      </label>

                      <input
                        type="number"
                        min="0"
                        name="paidAmount"
                        value={
                          editForm.paidAmount
                        }
                        onChange={
                          handleEditChange
                        }
                      />
                    </div>

                    <div className="customer-issue-form-group">
                      <label>
                        Remaining Amount
                      </label>

                      <input
                        value={`${money(
                          editForm.remainAmount
                        )} AFN`}
                        readOnly
                      />
                    </div>
                  </>
                )}

                {editForm.ownershipType ===
                  "Loaned" && (
                  <>
                    <div className="customer-issue-form-group">
                      <label>
                        Security Deposit
                      </label>

                      <input
                        type="number"
                        min="0"
                        name="depositAmount"
                        value={
                          editForm.depositAmount
                        }
                        onChange={
                          handleEditChange
                        }
                      />
                    </div>

                    <div className="customer-issue-form-group">
                      <label>
                        Deposit Status
                      </label>

                      <select
                        name="depositStatus"
                        value={
                          editForm.depositStatus
                        }
                        onChange={
                          handleEditChange
                        }
                      >
                        <option value="Held">
                          Held
                        </option>

                        <option value="Refunded">
                          Refunded
                        </option>

                        <option value="Outstanding">
                          Outstanding
                        </option>
                      </select>
                    </div>
                  </>
                )}

                <div className="customer-issue-form-group customer-issue-full">
                  <label>Notes</label>

                  <textarea
                    name="notes"
                    value={editForm.notes}
                    onChange={
                      handleEditChange
                    }
                    placeholder="Transfer notes..."
                  />
                </div>
              </div>

              <div className="customer-issue-modal-footer">
                <button
                  type="button"
                  onClick={
                    closeEditTransferModal
                  }
                >
                  Cancel
                </button>

                <button type="submit">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTransfer && (
        <div
          className="customer-issue-modal-backdrop"
          onClick={() =>
            setDeleteTransfer(null)
          }
        >
          <div
            className="customer-issue-delete-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <h3>
              Delete Device Transfer
            </h3>

            <p>
              Are you sure you want to delete
              the transfer for{" "}
              <strong>
                {deleteTransfer.assetId ||
                  "-"}{" "}
                -{" "}
                {deleteTransfer.deviceName ||
                  "-"}
              </strong>
              ?
            </p>

            <small>
              If this is the latest transfer
              for the device, the asset will
              be restored to its previous
              location and customer.
            </small>

            <div>
              <button
                type="button"
                onClick={() =>
                  setDeleteTransfer(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger"
                onClick={
                  confirmDeleteTransfer
                }
              >
                Delete Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerIssueDevice;
