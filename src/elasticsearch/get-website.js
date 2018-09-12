module.exports = (app, query) => {

  const config = app.get('config');
  const esclient = app.get('esclient');

  const allowedQuery = config.elasticsearch.index.mappings.lh4u.properties;
  const { documentId, top = 1 } = query;

  let queryKey;

  Object.keys(query).forEach(qKey => {
    if (qKey in allowedQuery) {
      queryKey = qKey;
    }
  });

  const queryValue = queryKey && query[queryKey].replace(/"/g, '\\"');

  if (!documentId && !queryValue) throw new Error('query param `documentId` OR search key are required');

  return documentId
    ? esclient.get({
      index: config.elasticsearch.index.name,
      type: config.elasticsearch.index.type,
      id: documentId
    })
    : esclient.search({
      index: config.elasticsearch.index.name,
      type: config.elasticsearch.index.type,
      q: `${queryKey}:"${queryValue}"`,
      body: {
        size: parseInt(top, 10),
        sort: [{ createDate: { order: 'desc' }}]
      }
    })
  ;

};
