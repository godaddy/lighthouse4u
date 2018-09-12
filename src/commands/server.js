const startListener = require('../http/start');
const processQueue = require('../amqp/process-queue');
const getApp = require('../express');
const { getConfigs } = require('../config');

module.exports = {
  command: 'server',
  desc: 'Start HTTP Server',
  handler: async argv => {
    process.on('unhandledRejection', err => console.error(err.stack || err));

    const configs = await getConfigs(argv);

    const config = configs[0];

    const app = getApp(config);
    startListener(app);
    if (config.amqp.queue.enabled === true) {
      // only process queue if enabled
      processQueue(app);
    }
  }
};
