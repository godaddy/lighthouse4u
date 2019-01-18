module.exports = {
  command: 'init',
  desc: 'Initialize Elasticsearch & AMQP',
  handler: async argv => {
    // ! deps must be moved into function callback to avoid loading deps prior to start events
    const { getConfigs } = require('../config');
    const getStorageClient = require('../store');
    const getQueueClient = require('../queue');

    const configs = await getConfigs(argv);

    const [config] = configs;

    try {
      const storage = getStorageClient(config);
      await storage.initialize();
    } catch (ex) {
      console.error('Storage initialization failed:', ex.stack || ex);
    }

    try {
      const queue = getQueueClient(config);
      await queue.initialize();
    } catch (ex) {
      console.error('Queue initialization failed:', ex.stack || ex);
    }

    process.exit();
  }
};
