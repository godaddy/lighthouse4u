const { resolve } = require('path');

module.exports = {
  command: 'server',
  desc: 'Start HTTP Server',
  handler: async argv => {
    // ! deps must be moved into function callback to avoid loading deps prior to start events

    if (argv.beforeStart) {
      const beforeStart = require(resolve(argv.beforeStart));
      if (typeof beforeStart === 'function') {
        beforeStart(argv); // forward argv
      }
    }

    process.on('unhandledRejection', err => console.error(err.stack || err));

    const { getConfigs } = require('../config');
    const configs = await getConfigs(argv);
    const config = configs[0];

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
