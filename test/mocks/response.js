const { stub } = require('sinon');

module.exports = {
  render: stub(),
  send: stub(),
  sendStatus: stub(),
  status: stub(),
  writeHead: stub(),
  setHeader: stub(),
  end: stub()
};

module.exports.status.returns(module.exports);
