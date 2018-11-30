const getSafeDocument = require('../util/get-safe-document');

module.exports = (app, document) => {

  const config = app.get('config');
  const esclient = app.get('esclient');

  // pluck out properties that will never be persisted
  const safeDocument = getSafeDocument(document);

  return esclient.index({
    index: config.elasticsearch.index.name,
    type: config.elasticsearch.index.type,
    id: safeDocument.id,
    body: safeDocument
  });

};
