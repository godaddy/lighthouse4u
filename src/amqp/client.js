const amqplib = require('amqplib');

module.exports = config => {
  return amqplib.connect(config.amqp.url);
};
