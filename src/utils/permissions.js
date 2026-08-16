const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

/**
 * بررسی می‌کند که کاربر Admin یا Full Admin است یا خیر.
 */
export function isAdminUser(user) {
  if (!user) return false;

  const role = normalizeText(user.role);
  const accountType = normalizeText(user.accountType);

  return (
    user.isDefaultAdmin === true ||
    user.isAdmin === true ||
    user.isFullAdmin === true ||
    user.permissions?.all === true ||
    role === "admin" ||
    role === "full admin" ||
    role === "full administrator" ||
    role === "administrator" ||
    accountType === "admin"
  );
}

/**
 * بررسی دسترسی کاربر برای دیدن یک بخش.
 *
 * مثال:
 * canViewModule(currentUser, "suppliers")
 */
export function canViewModule(currentUser, moduleKey) {
  if (!currentUser) return false;

  // Admin و Full Admin تمام بخش‌ها را می‌بینند.
  if (isAdminUser(currentUser)) {
    return true;
  }

  const permission =
    currentUser.permissions?.[moduleKey];

  // حالت ساده:
  // permissions: { suppliers: true }
  if (permission === true) {
    return true;
  }

  // حالت آبجکت:
  // permissions: {
  //   suppliers: {
  //     view: true
  //   }
  // }
  if (
    permission &&
    typeof permission === "object"
  ) {
    return (
      permission.view === true ||
      permission.read === true ||
      permission.all === true
    );
  }

  return false;
}

/**
 * بررسی یک عملیات مشخص مانند:
 * create
 * edit
 * delete
 * view
 */
export function canPerformAction(
  currentUser,
  moduleKey,
  action
) {
  if (!currentUser) return false;

  // Admin تمام عملیات را انجام داده می‌تواند.
  if (isAdminUser(currentUser)) {
    return true;
  }

  const permission =
    currentUser.permissions?.[moduleKey];

  // مثال:
  // permissions: { suppliers: true }
  if (permission === true) {
    return true;
  }

  if (
    !permission ||
    typeof permission !== "object"
  ) {
    return false;
  }

  if (permission.all === true) {
    return true;
  }

  return permission[action] === true;
}

/**
 * این تابع برای صفحات قدیمی‌تر پروژه استفاده می‌شود.
 *
 * مثال:
 * hasPermission(currentUser, "suppliers", "create")
 */
export function hasPermission(
  currentUser,
  moduleKey,
  action = "view"
) {
  if (!currentUser) return false;

  // Admin همیشه دسترسی دارد.
  if (isAdminUser(currentUser)) {
    return true;
  }

  /*
   * نام‌های مشابه دسترسی‌ها:
   * create = add = new
   * edit = update
   * delete = remove
   * view = read
   */
  const aliases = {
    create: ["create", "add", "new"],
    add: ["add", "create", "new"],
    new: ["new", "create", "add"],

    edit: ["edit", "update"],
    update: ["update", "edit"],

    delete: ["delete", "remove"],
    remove: ["remove", "delete"],

    view: ["view", "read"],
    read: ["read", "view"],
  };

  const allowedActions =
    aliases[action] || [action];

  return allowedActions.some(
    (permissionAction) =>
      canPerformAction(
        currentUser,
        moduleKey,
        permissionAction
      )
  );
}
