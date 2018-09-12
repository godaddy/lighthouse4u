const { merge } = require('lodash');

module.exports = overrides => {
  const elasticsearch = require('./elasticsearch');
  const mocks = merge({}, {
    amqplib: require('./amqplib'),
    config: require('./config'),
    rmqpMessage: require('./rmqp-message'),
    request: require('./request'),
    response: require('./response'),
    elasticsearch
  }, overrides);

  mocks.esclient = new mocks.elasticsearch.Client(mocks.config.elasticsearch.options);

  mocks.app = require('./app')(mocks);
  mocks.request.app = mocks.app;

  return mocks;
};