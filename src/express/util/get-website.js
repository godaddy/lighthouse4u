module.exports = (app, query) => {

  const store = app.get('store');

  if (typeof query === 'string') return store.query(query);

  const { q, top = 1 } = query;

  if (!q) throw new Error('query param `q` is required');

  return store.query(q, { top });
};
