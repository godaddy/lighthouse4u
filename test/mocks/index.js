module.exports = () => {
  const mocks = {
    config: require('./config')(),
    store: require('./store')(),
    queue: require('./queue')(),
    request: require('./request')(),
    response: require('./response')()
  };

  mocks.app = require('./app')(mocks);
  mocks.request.app = mocks.app;

  return mocks;
};