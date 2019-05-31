const { stub } = require('sinon');

module.exports = mocks => {

  const appGet = stub();
  appGet.withArgs('config').returns(mocks.config);
  appGet.withArgs('store').returns(mocks.store);
  appGet.withArgs('queue').returns(mocks.queue);
  return {
    get: appGet
  };

};
