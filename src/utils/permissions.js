const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export function isAdminUser(user) {
  if (!user) return false;

  const role = normalizeText(user.role);
  const accountType = normalizeText(
    user.accountType
  );

  return (
    user.isDefaultAdmin === true ||
    user.isAdmin === true ||
    user.isFullAdmin === true ||
    user.permissions?.all === true ||
    role === "admin" ||
    role === "full admin" ||
    role === "administrator" ||
    accountType === "admin"
  );
}

export function canViewModule(
  currentUser,
  moduleKey
) {
  if (!currentUser) return false;

  /*
   * Admin و Full Admin تمام صفحات را می‌بینند.
   */
  if (isAdminUser(currentUser)) {
    return true;
  }

  const permission =
    currentUser.permissions?.[moduleKey];

  if (permission === true) {
    return true;
  }

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

export function canPerformAction(
  currentUser,
  moduleKey,
  action
) {
  if (!currentUser) return false;

  /*
   * Admin تمام عملیات را انجام داده می‌تواند.
   */
  if (isAdminUser(currentUser)) {
    return true;
  }

  const permission =
    currentUser.permissions?.[moduleKey];

  if (permission === true) {
    return true;
  }

  if (
    !permission ||
    typeof permission !== "object"
  ) {
    return false;
  }

  return (
    permission.all === true ||
    permission[action] === true
  );
}