const getConfig = require('./get-config-by-id');

module.exports = argv => {
  const configs = typeof argv.config === 'string' ? [argv.config] : argv.config;

  if (configs.length === 0) {
    // if no config specified, use environment, or fallback to default
    configs.push(argv.configEnv in process.env ? process.env[argv.configEnv] : argv.configDefault);
  }

  return Promise.all(configs.map(configName => getConfig(configName, argv)));
};
