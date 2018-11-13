const submitWebsite = require('../lighthouse/submit');
const indexWebsite = require('../elasticsearch/index-website');

module.exports = async app => {
  main(app);
};

async function main(app) {
  const config = app.get('config');
  const amqp = app.get('amqp');
  const esclient = app.get('esclient');

  const conn = await amqp;
  const channel = await conn.createChannel();
  const queueName = config.amqp.queue.name;
  const { idleDelayMs } = config.amqp;
  await channel.assertQueue(queueName, config.amqp.queue.options);
  channel.prefetch(config.lighthouse.concurrency);
  getNextMessage({ app, config, amqp, esclient, channel, queueName, idleDelayMs });
}

async function getNextMessage(options) {
  const { queueName, idleDelayMs, channel, config } = options;
  const { lighthouse } = config;
  const msg = await channel.get(queueName, { noAck: false });

  if (!msg) return void setTimeout(getNextMessage.bind(null, options), idleDelayMs);

  let data;
  try {
    data = JSON.parse(msg.content.toString());
  } catch (ex) {
    channel.ack(msg);
    console.warn('RMQP.consume returned invalid message', msg, ex.stack);
    return void getNextMessage(options);
  }
  if (!msg.content || !data) {
    channel.ack(msg);
    console.warn('RMQP.consume returned invalid message', msg);
    return void getNextMessage(options);
  }

  options.attempts = Math.min(
    Math.max(data.attempts || lighthouse.attempts.default, lighthouse.attempts.range[0]),
    lighthouse.attempts.range[1]
  );

  data.attempt = data.attempt || 1;

  let delayTime = data.delayTime;
  if (!delayTime || delayTime <= Date.now()) {
    await processMessage(options, msg, data);

    delayTime = data.state === 'retry' && data.delayTime;
  }

  if (delayTime) { // future message
    // message is delayed
    const waitBeforeRequeue = Math.min(lighthouse.delay.maxRequeueDelayMs, delayTime - Date.now());
    setTimeout(() => {
      // queue the modified request
      channel.sendToQueue(config.amqp.queue.name, Buffer.from(JSON.stringify(data)));

      // drop the old msg
      channel.ack(msg);
    }, waitBeforeRequeue).unref(); // no need to hold ref, msg will be requeued if connection broken

    // notice ^ is non-blocking, we'll continue to process other messages even during delay
  }

  getNextMessage(options);
}

async function processMessage({ app, config, channel, attempts }, msg, data) {
  try {
    const results = await submitWebsite(data.requestedUrl, config, data);
    data.state = 'processed';
    data = Object.assign(data, results);
    delete data.headers; // no longer needed

    // save to ES
    try {
      await indexWebsite(app, data);
      channel.ack(msg);
    } catch (ex) {
      console.error('failed to write to ES!', ex.stack || ex);

      // retry
      channel.nack(msg);
    }
  } catch (ex) {
    console.error(`lighthouse failed! attempt ${data.attempt} of ${attempts}`, data, ex.stack || ex);

    // retry unless out of attempts
    if (data.attempt >= attempts) {
      data.state = 'error';
      data.errorMessage = (ex.stack || ex).toString();
    } else {
      data.attempt++;
      data.state = 'retry';
      // calc time before next attempt using exponential backoff
      data.delayTime = Date.now() + Math.pow(2, data.attempt) * config.lighthouse.attempts.delayMsPerExponent;
    }

    // save failure state to ES
    try {
      await indexWebsite(app, data);
    } catch (ex2) {
      console.error('failed to write to ES!', data, ex2.stack || ex2);

      // nothing more to do
    }

    if (data.state === 'error') { // we've given up
      channel.ack(msg);
    }
  }
}
