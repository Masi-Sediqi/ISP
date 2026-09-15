export function normalizeCategoryName(value) {
  return String(value || "").trim().toLowerCase();
}

export function categorySettingId(name) {
  return `visa-package-category:${encodeURIComponent(normalizeCategoryName(name))}`;
}

export function buildCategorySetting(name, active = true) {
  const cleanName = String(name || "").trim();
  return {
    id: categorySettingId(cleanName),
    name: cleanName,
    normalizedName: normalizeCategoryName(cleanName),
    active: Boolean(active),
    updatedAt: new Date().toISOString(),
  };
}

export function upsertCategorySetting(settings, nextSetting) {
  const source = Array.isArray(settings) ? settings : [];
  const key = normalizeCategoryName(nextSetting?.name || nextSetting?.normalizedName);
  return [
    ...source.filter(
      (item) => normalizeCategoryName(item?.name || item?.normalizedName) !== key
    ),
    nextSetting,
  ];
}

export function getEffectiveCategories(defaultCategories, settings) {
  const defaults = Array.isArray(defaultCategories) ? defaultCategories : [];
  const sourceSettings = Array.isArray(settings) ? settings : [];
  const settingByName = new Map();

  sourceSettings.forEach((setting) => {
    const key = normalizeCategoryName(setting?.name || setting?.normalizedName);
    if (key) settingByName.set(key, setting);
  });

  const result = [];
  const seen = new Set();

  defaults.forEach((name) => {
    const key = normalizeCategoryName(name);
    if (!key || seen.has(key)) return;
    const setting = settingByName.get(key);
    if (setting?.active === false) return;
    seen.add(key);
    result.push(name);
  });

  sourceSettings.forEach((setting) => {
    if (setting?.active === false) return;
    const name = String(setting?.name || "").trim();
    const key = normalizeCategoryName(name);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(name);
  });

  return result;
}
