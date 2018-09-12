const elasticsearch = require('elasticsearch');

module.exports = config => {
  return new elasticsearch.Client(config.elasticsearch.options);
};
