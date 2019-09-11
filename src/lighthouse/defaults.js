module.exports = {
  config: { // See: https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/default-config.js
    extends: 'lighthouse:default', // extends default
    logLevel: 'warn',
    chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'], // no-sandbox is required if running as root
    settings: { // See: https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/constants.js#L30
      output: 'json',
      extraHeaders: {},
      throttling: false // See: https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/constants.js#L16
    }
  },
  validate: {
    // 'group-name': './validate/group-name.js' // throws if invalid response
  },
  auditMode: 'simple', // how much of the `audits` report to retain (false, 'simple', 'details', 'all') -- it's very verbose: https://github.com/GoogleChrome/lighthouse/blob/master/docs/understanding-results.md#audits
  gatherMode: false, // how much of the `audits` report to retain (false, 'simple', 'details', 'all') -- it's very verbose: https://github.com/GoogleChrome/lighthouse/blob/master/docs/understanding-results.md#audits
  concurrency: 1, // number of concurrent lighthouse tests permitted -- a value greater than 1 may negatively impact accuracy of reports
  samples: { // number of tests run before median performance report is determined
    default: 1,
    range: [1, 5] // [min, max]
  },
  attempts: {
    default: 2,
    range: [1, 10],
    delayMsPerExponent: 1000 // 2^attempt*delayPerExponent = 1s, 2s, 4s, 8s, etc
  },
  delay: {
    default: 0,
    range: [0, 1000 * 60 * 60], // 1hr
    maxRequeueDelayMs: 1000 * 30 // max time before before delayed messages are requeued if still waiting
  }
};
