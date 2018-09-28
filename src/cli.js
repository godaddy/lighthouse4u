const yargs = require('yargs');
const path = require('path');
const pkg = require('../package.json');

yargs
  .commandDir(path.resolve(__dirname, '..', 'src', 'commands'))
  .option('before-start', {
    describe: 'Custom code to execute before starting HTTP Server',
    type: 'string'
  })
  .option('config', {
    describe: 'One or more configuration files (with or without extension)',
    type: 'array',
    default: []
  })
  .option('config-dir', {
    describe: 'Directory of configuration files',
    type: 'string',
    default: 'config'
  })
  .option('config-env', {
    describe: 'Environment variable used to detect configuration filename (ex: "development", "production", etc)',
    type: 'string',
    default: 'NODE_ENV'
  })
  .option('config-default', {
    describe: 'Default configuration to use if environment is not available (ex: "local")',
    type: 'string',
    default: 'local'
  })
  .option('config-base', {
    describe: 'Configuration to use as defaults for all environment configurations (ex: "defaults")',
    type: 'string'
  })
  .option('config-exts', {
    describe: 'Supported extensions to detect for with configuration files',
    type: 'array',
    default: ['.json', '.json5', '.js']
  })
  .option('secure-config', {
    alias: 'secure-dir',
    describe: 'Directory of secure configuration files',
    type: 'string'
  })
  .option('secure-file', {
    describe: 'File (or files if different per configuration) to ' +
      'load that holds the secret required to decrypt secure configuration files',
    type: 'string'
  })
  .demandCommand()
  .help()
  .epilogue(`Lighthouse4u v${pkg.version}`)
  .argv
;
