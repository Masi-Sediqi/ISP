const DATE_FIELDS = [
  'date',
  'createdAt',
  'updatedAt',
  'registrationDate',
  'registeredAt',
  'paymentDate',
  'purchaseDate',
  'saleDate',
  'startDate',
  'createdDate',
  'transactionDate',
  'dueDate',
];

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

export function getDashboardDateRange(filter = 'all', customDates = {}, now = new Date()) {
  if (filter === 'all') return null;

  if (filter === 'custom') {
    if (!customDates?.from || !customDates?.to) return null;
    return {
      start: startOfDay(`${customDates.from}T00:00:00`),
      end: endOfDay(`${customDates.to}T00:00:00`),
    };
  }

  const end = endOfDay(now);
  const start = startOfDay(now);

  if (filter === 'yesterday') {
    start.setDate(start.getDate() - 1);
    const yesterdayEnd = endOfDay(start);
    return { start, end: yesterdayEnd };
  }

  if (filter === 'today') return { start, end };

  if (filter === 'week') {
    const day = start.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + mondayOffset);
    return { start, end };
  }

  if (filter === 'month') {
    start.setDate(1);
    return { start, end };
  }

  if (filter === 'year') {
    start.setMonth(0, 1);
    return { start, end };
  }

  return null;
}

export function getRecordDate(record) {
  for (const field of DATE_FIELDS) {
    const raw = record?.[field];
    if (!raw) continue;
    const date = new Date(raw);
    if (Number.isFinite(date.getTime())) return date;
  }
  return null;
}

export function recordMatchesDashboardRange(record, range) {
  if (!range) return true;
  const date = getRecordDate(record);
  if (!date) return false;
  return date >= range.start && date <= range.end;
}

export function filterDashboardRecords(records, range) {
  const list = Array.isArray(records) ? records : [];
  return range ? list.filter((record) => recordMatchesDashboardRange(record, range)) : list;
}

export function serializeDashboardFilter(filter, customDates = {}) {
  const params = new URLSearchParams();
  if (filter && filter !== 'all') params.set('filter', filter);
  if (filter === 'custom' && customDates.from && customDates.to) {
    params.set('from', customDates.from);
    params.set('to', customDates.to);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}
