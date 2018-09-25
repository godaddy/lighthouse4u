const lighthouse = require('lighthouse');
const ChromeProtocol = require('lighthouse/lighthouse-core/gather/connections/cri.js');
const chromeLauncher = require('chrome-launcher');
const throttling = require('./throttling');
const decrypt = require('../util/decrypt');
const URL = require('url');
const path = require('path');
const _ = require('lodash');
const fetch = require('cross-fetch');

const OPTIONS_TO_CONFIG = {
  throttling: 'settings.throttling',
  headers: 'settings.extraHeaders'
};

const ALLOWED_KEYS = {
  userAgent: true,
  lighthouseVersion: true,
  fetchTime: true,
  requestedUrl: true,
  finalUrl: true,
  runWarnings: false,
  audits: false,
  configSettings: true,
  categories: true,
  categoryGroups: false,
  timing: true
};

module.exports = async (url, { lighthouse: baseConfig, amqp }, options) => {
  const config = Object.assign({}, baseConfig.config);
  const { hostOverride, group, secureHeaders, cipherVector, commands } = options;

  // only pull over whitelisted options
  Object.keys(options).forEach(optionKey => {
    const mapToKey = OPTIONS_TO_CONFIG[optionKey];
    if (!mapToKey) return; // ignore unless whitelisted
    // copy whitelisted option to the new location
    _.set(config, mapToKey, options[optionKey]);
  });

  let decryptedHeaders;
  if (secureHeaders) {
    const { secretKey } = amqp;
    if (!secretKey) throw new Error('`secureHeaders` is not allowed without `amqp.secretKey` being set');

    decryptedHeaders = JSON.parse(decrypt(secureHeaders, secretKey, cipherVector));
    config.settings.extraHeaders = Object.assign(config.settings.extraHeaders, decryptedHeaders);
  }
  let decryptedCommands;
  if (commands) {
    const { secretKey } = amqp;
    if (!secretKey) throw new Error('`commands` is not allowed without `amqp.secretKey` being set');

    decryptedCommands = JSON.parse(decrypt(commands, secretKey, cipherVector));
  }

  // throw if non-200
  // unfortunately not everyone supports HEAD, so we must perform a full GET...
  const res = await fetch(url, { headers: config.settings.extraHeaders || {}});

  const validateHandlerPath = baseConfig.validate[group];
  const validateHandler = validateHandlerPath && require(path.resolve(validateHandlerPath));
  validateHandler && validateHandler({ res });

  let throttlingPreset;

  if (typeof config.settings.throttling === 'string') {
    // resolve throttling
    throttlingPreset = config.settings.throttling;
    config.settings.throttling = throttling[config.settings.throttling];
  }

  const samples = Math.min(Math.max(options.samples || baseConfig.samples.default, baseConfig.samples.range[0]), baseConfig.samples.range[1]);

  const results = [];
  for (let sample = 0; sample < samples; sample++) {
    results[sample] = await getLighthouseResult(url, config, { throttlingPreset, hostOverride, commands: decryptedCommands });
  }

  // take the top result
  const result = results.sort((a, b) => b.categories.performance.score - a.categories.performance.score)[0];

  const headers = result.configSettings && result.configSettings.extraHeaders;
  if (decryptedHeaders && headers) {
    // scrub secure headers
    Object.keys(headers).forEach(key => {
      if (key in decryptedHeaders) {
        // if secure header, scrub it
        headers[key] = '__private__';
      }
    });
  }

  // todo: permit configurable categories.. for example score = sum of each category

  return result;
};

async function executeCommand(connection, instances, { id, command, options }) {
  if (!command) throw new Error('lighthouse.connection.sendCommand requires `command`');
  id = id || command;
  const result = await connection.sendCommand(command, options);
  if (result.result && result.result.subtype === 'error') throw new Error(result.result.description);
  instances[id] = result;
  return result;
}

async function getLighthouseResult(url, config, { throttlingPreset, hostOverride, commands = [] }) {
  const chromeOptions = { chromeFlags: config.chromeFlags };
  if (hostOverride) {
    const { host } = URL.parse(url);
    // bug in chrome preventing headless support of `host-rules`: https://bugs.chromium.org/p/chromium/issues/detail?id=798793
    chromeOptions.chromeFlags = chromeOptions.chromeFlags.concat([
      `--host-rules=MAP ${host} ${hostOverride}`, '--ignore-certificate-errors'
    ]);
  }

  const chrome = await chromeLauncher.launch(chromeOptions);
  chromeOptions.port = chrome.port;
  return new Promise(async (resolve, reject) => {
    // a workaround for what appears to a bug with lighthouse that prevents graceful failure
    const timer = setTimeout(() => {
      chrome.kill(); // force cleanup
      reject(new Error('timeout!'));
    }, 60000).unref();

    try {
      const connection = new ChromeProtocol(chromeOptions.port, chromeOptions.hostname);
      await connection.connect();

      // process commands
      const instances = {};
      for (var cmdI = 0; cmdI < commands.length; cmdI++) {
        await executeCommand(connection, instances, commands[cmdI]);
      }

      const results = await lighthouse(url, chromeOptions, config, connection);
      clearTimeout(timer);
      const { lhr } = results;

      // track preset if any
      lhr.configSettings.throttlingPreset = throttlingPreset;

      // allowed keys
      Object.keys(lhr).forEach(resultKey => {
        if (!ALLOWED_KEYS[resultKey]) lhr[resultKey] = null;
      });

      const { categories } = lhr;
      Object.keys(categories).forEach(catKey => {
        const cat = categories[catKey];
        // no need for `auditRefs`
        delete cat.auditRefs;
      });

      // use results.lhr for the JS-consumeable output
      // https://github.com/GoogleChrome/lighthouse/blob/master/typings/lhr.d.ts
      // use results.report for the HTML/JSON/CSV output as a string
      // use results.artifacts for the trace/screenshots/other specific case you need (rarer)
      chrome.kill().then(() => resolve(lhr));
    } catch (ex) {
      clearTimeout(timer);
      chrome.kill().then(() => reject(ex));
    }
  });
}
