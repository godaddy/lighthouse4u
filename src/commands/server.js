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
    const [config] = await getConfigs(argv);

    const startListener = require('../http/start');
    const getApp = require('../express');

    const app = getApp(config);
    startListener(app);
    if (config.queue.enabled === true) {
      // only process queue if enabled
      const processQueue = require('../queue/process');
      processQueue(app);
    }
  }
};
