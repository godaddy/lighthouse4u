const { resolve } = require('path');

module.exports = {
  command: 'server',
  desc: 'Start HTTP Server',
  handler: async argv => {
    const { getConfigs } = require('../config');
    const configs = await getConfigs(argv);
    const config = configs[0];

    if (argv.beforeStart) {
      const beforeStart = require(resolve(argv.beforeStart));
      if (beforeStart) {
        beforeStart(config); // forward config
      }
    }

    process.on('unhandledRejection', err => console.error(err.stack || err));

    const startListener = require('../http/start');
    const processQueue = require('../amqp/process-queue');
    const getApp = require('../express');

    const app = getApp(config);
    startListener(app);
    if (config.amqp.queue.enabled === true) {
      // only process queue if enabled
      processQueue(app);
    }
  }
};
