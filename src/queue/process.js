const submitWebsite = require('../lighthouse/submit');
const getSafeDocument = require('../util/get-safe-document');

module.exports = async app => {
  main(app);
};

async function main(app) {
  const config = app.get('config');
  const store = app.get('store');
  const queue = app.get('queue');

  const { idleDelayMs } = config.queue;
  getNextMessage({ app, config, queue, store, idleDelayMs });
}

async function getNextMessage(options) {
  const { idleDelayMs, queue, config } = options;
  const { lighthouse } = config;

  const msg = await queue.dequeue();

  if (!msg) return void setTimeout(getNextMessage.bind(null, options), idleDelayMs);

  const { data } = msg;

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
      queue.enqueue(data);

      // drop the old msg
      queue.ack(msg);
    }, waitBeforeRequeue).unref(); // no need to hold ref, msg will be requeued if connection broken

    // notice ^ is non-blocking, we'll continue to process other messages even during delay
  }

  getNextMessage(options);
}

async function processMessage(options, msg, data) {
  const { config, queue, store } = options;
  const { lighthouse } = config;

  const attempts = Math.min(
    Math.max(data.attempts || lighthouse.attempts.default, lighthouse.attempts.range[0]),
    lighthouse.attempts.range[1]
  );

  data.attempt = data.attempt || 1;

  try {
    const results = await submitWebsite(data.requestedUrl, config, data);
    data.state = 'processed';
    data = Object.assign(data, results);
    delete data.headers; // no longer needed

    // update store and ACK msg from queue
    try {
      data = await store.write(data);
      queue && queue.ack(msg);
    } catch (ex) {
      console.error('failed to write to store!', ex.stack || ex);

      // retry
      queue && queue.nack(msg);
    }
  } catch (ex) {
    console.error(`lighthouse failed! attempt ${data.attempt} of ${attempts}`, getSafeDocument(data), ex.stack || ex);

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

    // save failure state to store
    try {
      data = await store.write(data);
    } catch (ex2) {
      console.error('failed to write to store!', getSafeDocument(data), ex2.stack || ex2);

      // nothing more to do
    }

    if (data.state === 'error') { // we've given up
      queue && queue.ack(msg);
    }
  }

  return data;
}

module.exports.processMessage = processMessage;
