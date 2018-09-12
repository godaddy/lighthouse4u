const { stub } = require('sinon');

module.exports = mocks => {

  const appGet = stub();
  appGet.withArgs('config').returns(mocks.config);
  appGet.withArgs('amqp').returns(mocks.amqplib.connect());
  appGet.withArgs('esclient').returns(mocks.esclient);
  return {
    get: appGet
  };

};
