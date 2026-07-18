export function cleanParams(params = {}) {
  const out = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    out[key] = value;
  });
  return out;
}

export function unwrapList(data) {
  if (!data) return { items: [], pagination: null };
  if (Array.isArray(data)) return { items: data, pagination: null };
  const listKey = ['items', 'records', 'results', 'users', 'attendance', 'leaves', 'holidays', 'slips', 'notifications', 'corrections', 'configs', 'rules', 'fields', 'salaryFields'].find(
    (key) => Array.isArray(data[key])
  );
  return {
    items: listKey ? data[listKey] : [],
    pagination: data.pagination || null,
  };
}
