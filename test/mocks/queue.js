const { stub } = require('sinon');

module.exports = () => ({
  enqueue: stub().resolves()
});
