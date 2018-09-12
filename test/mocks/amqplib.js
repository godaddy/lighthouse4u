const { stub } = require('sinon');

function channel() {
  return {
    assertQueue: stub().resolves(),
    sendToQueue: stub().returns(true)
  };
}

function client() {
  const _channel = channel();
  return {
    _channel, // shortcut helper
    createChannel: stub().resolves(_channel)
  };
}

const _client = client();

module.exports = {
  _client, // shortcut helper
  connect: stub().resolves(_client),
  '@global': true
};
