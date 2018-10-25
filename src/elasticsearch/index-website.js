module.exports = (app, document) => {

  const config = app.get('config');
  const esclient = app.get('esclient');

  // pluck out properties that will never be persisted
  const { secureHeaders, cipherVector, commands, cookies, ...validProperties } = document;

  return esclient.index({
    index: config.elasticsearch.index.name,
    type: config.elasticsearch.index.type,
    id: validProperties.id,
    body: validProperties
  });

};
