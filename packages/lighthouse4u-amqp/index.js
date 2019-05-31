const amqplib = require('amqplib');

module.exports = class QueueSQS {
  constructor(opts) {   
    if (!opts) throw new Error('Options required');
    if (!opts.connect || !opts.connect.options) throw new Error('`connect.options` required');
    if (!opts.queue || !opts.queue.name) throw new Error('`queue.name` required');

    this.options = opts;
    this.connect();
  }

  async connect(forceReconnect) {
    if (!forceReconnect && this.connection && this.channel) return this.channel;

    this.connection = await amqplib.connect(this.options.connect.options.url || this.options.connect.options);
    this.channel = await this.connection.createChannel();
    await this.channel.assertQueue(this.options.queue.name, this.options.queue.options || {});

    return this.channel;
  }

  initialize() {
    // no special initialization support
    return Promise.resolve();
  }

  async dequeue() {
    let channel, msg;

    try {
      channel = await this.connect();
      msg = await channel.get(this.options.queue.name, { noAck: false });
    } catch (ex) {
      this.connect(true); // reconnect
      throw ex;
    }
  
    if (!msg) return;
  
    let data;
    try {
      data = JSON.parse(msg.content.toString());
    } catch (ex) {
      channel.ack(msg);
      console.warn('RMQP.get returned invalid message', msg, ex.stack);
      return;
    }
    if (!msg.content || !data) {
      channel.ack(msg);
      console.warn('RMQP.get returned an invalid message', msg);
      return;
    }
  
    msg.data = data;

    return msg;
  }

  async ack(msg) {
    const channel = await this.connect();

    channel.ack(msg);

    return Promise.resolve();
  }

  async nack(msg) {
    const channel = await this.connect();

    channel.nack(msg);

    return Promise.resolve();
  }

  async enqueue(data) {
    try {
      const channel = await this.connect();
    
      if (!channel.sendToQueue(this.options.queue.name, new Buffer(JSON.stringify(data)))) {
        throw new Error('Failed to write to queue');
      }
    } catch (ex) {
      this.connect(true); // reconnect
      throw ex;
    }

    return Promise.resolve();
  }
}
