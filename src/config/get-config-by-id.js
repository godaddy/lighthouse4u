const configShield = require('config-shield');
const path = require('path');
const fs = require('fs');
const json5 = require('json5');
const { merge } = require('lodash');
const { promisify } = require('util');
const defaultConfig = require('./default-config');

const readFile = promisify(fs.readFile);
const cshieldLoad = configShield.load;

const gConfigs = {};

module.exports = async (configName, argv) => {
  const configDir = path.resolve(argv.configDir);

  if (argv.secureConfig && !argv.secureFile) throw new Error('secure-config requires associated secure-file. secure-secret not yet supported.');

  const baseConfigPromise = !argv.configBase ? {} : loadConfig(configDir, argv.configBase, argv);
  const envConfigPromise = loadConfig(configDir, configName, argv);
  let secureConfigPromise;
  if (argv.secureConfig) {
    const ext = path.extname(configName);
    const configId = path.basename(configName, ext);

    secureConfigPromise = new Promise(async (resolve, reject) => {
      const cshield = await cshieldLoad({
        instance: configId,
        configPath: path.join(argv.secureConfig, `${configId}.json`),
        privateKeyPath: argv.secureFile
      });

      const config = {};
      // merge secure config into base config
      cshield.getKeys().forEach(k => {
        config[k] = cshield.getProp(k);
      });

      resolve(config);
    });
  } else {
    secureConfigPromise = {}; // resolve to empty object
  }

  return new Promise((resolve, reject) => {

    Promise.all([baseConfigPromise, envConfigPromise, secureConfigPromise])
      .then(([baseConfig, envConfig, secureConfig]) => {

        const finalConfig = merge({}, defaultConfig, baseConfig, envConfig, secureConfig);

        if (typeof finalConfig.httpHandler === 'string') {
          finalConfig.httpHandler = require(path.resolve(finalConfig.httpHandler)); // app-relative path
        }

        resolve(finalConfig);
      })
      .catch(err => reject(err))
    ;

  });
};

async function loadConfig(configDir, configName, argv) {
  // IKNOWRIGHT:
  // there are some minor blocking calls in here, but they should be reasonable
  // being they are once-per-config calls.

  let ext = path.extname(configName);
  const configId = path.basename(configName, ext);
  const gConfig = gConfigs[configId];
  if (gConfig) return gConfig; // return global object if already avail
  let absPath = path.join(configDir, configName);

  if (!ext) {
    // auto-detect
    for (let i = 0; i < argv.configExts.length; i++) {
      ext = argv.configExts[i];
      if (fs.existsSync(absPath + ext)) { // found
        absPath += ext;
        break;
      } else { // not found
        ext = null;
      }
    }
    if (!ext) { // ext not detected
      throw new Error(`Configuration not found: ${absPath}`);
    }
  }

  let o;

  if (!/\.json5?/.test(ext)) {
    // perform require on commonJS

    o = require(absPath);
    o.id = configId;
    gConfigs[absPath] = o; // store in global object

    return o;
  }

  // for json/json5 files, utilize json5 loader

  const data = await readFile(absPath, 'utf8');

  o = json5.parse(data);
  o.id = configId;

  gConfigs[configId] = o; // store in global object

  return o;
}
