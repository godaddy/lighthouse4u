const { getConfigs } = require('../config');
const getESClient = require('../elasticsearch/client');
const initES = require('../elasticsearch/init');
const getAMQPClient = require('../amqp/client');
const initAMQP = require('../amqp/init');

module.exports = {
  command: 'init',
  desc: 'Initialize Elasticsearch & AMQP',
  handler: async argv => {
    const configs = await getConfigs(argv);

    const config = configs[0];

    try {
      const esclient = getESClient(config);
      console.log(initES);
      await initES(config, esclient);
    } catch (ex) {
      console.error('Elasticsearch index creation failed:', ex.stack || ex);
    }

    try {
      const amqpclient = getAMQPClient(config);
      await initAMQP(config, amqpclient);
    } catch (ex) {
      console.error('Error initializing AMQP queue:', ex.stack || ex);
    }

    process.exit();
  }
};
