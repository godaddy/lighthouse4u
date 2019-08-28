const getQuery = require('./get-query');

module.exports = (app, query, { clean = false } = {}) => {

  const store = app.get('store');

  const { top = 1 } = query;

  const q = getQuery(query);

  if (!q) throw new Error('query param `q` is required');

  return store.query(q, { top });
};
