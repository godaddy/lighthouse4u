module.exports = (config, esclient) => {
  const mapping = {
    index: config.elasticsearch.index.name,
    type: config.elasticsearch.index.type,
    body: {
      settings: config.elasticsearch.index.settings,
      mappings: config.elasticsearch.index.mappings
    }
  };

  const promise = esclient.indices.create(mapping);
  console.log('Elasticsearch index created:', mapping);
  return promise;
};
