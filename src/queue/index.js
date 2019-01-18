const getSafeDocument = require('../util/get-safe-document');
const getClient = require('../util/get-client');

module.exports = class Queue {
  constructor(globalConfig) {
    this.config = globalConfig;
    // use `reader` config if avail, otherwise default to `store`
    this.queueConfig = globalConfig.queue;
    if (!this.queueConfig) throw new Error('Queue requires `queue` config');

    this.client = getClient(this.queueConfig);
  }

  dequeue(opts) {
    return this.client.dequeue(opts);
  }

  ack(msg) {
    // some queue clients blow up by the existence of our dirty `data` prop
    const { data, ...safeProps } = msg;
    const safeMsg = { ...safeProps };
    return this.client.ack(safeMsg);
  }

  nack(msg) {
    // some queue clients blow up by the existence of our dirty `data` prop
    const { data, ...safeProps } = msg;
    const safeMsg = { ...safeProps };
    return this.client.ack(safeMsg);
  }

  enqueue(data, opts) {
    return this.client.enqueue(getSafeDocument(data), opts);
  }
};
