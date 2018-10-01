module.exports = {
  elasticsearch: {
    options: {
      host: 'http://localhost:9200',
      log: {
        type: 'stdio',
        levels: ['error', 'warning']
      }
    },
    indexName: 'lh4u',
    indexType: 'lh4u',
    index: {
      name: 'lh4u',
      type: 'lh4u',
      settings: {
        number_of_shards: 3,
        number_of_replicas: 2
      },
      mappings: {
        lh4u: {
          properties: {
            state: { type: 'string', index: 'not_analyzed' },
            requestedUrl: { type: 'string', index: 'not_analyzed' },
            finalUrl: { type: 'string', index: 'not_analyzed' },
            domainName: { type: 'string', index: 'not_analyzed' },
            rootDomain: { type: 'string', index: 'not_analyzed' },
            group: { type: 'string', index: 'not_analyzed' },
            categories: { type: 'object', properties: {
              accessibility: { type: 'object', properties: { score: { type: 'double' } }},
              'best-practices': { type: 'object', properties: { score: { type: 'double' } }},
              performance: { type: 'object', properties: { score: { type: 'double' } }},
              pwa: { type: 'object', properties: { score: { type: 'double' } }},
              seo: { type: 'object', properties: { score: { type: 'double' } }},
            } },
            createDate: { type: 'date' }
          }
        }
      }
    }
  },
  amqp: {
    url: 'amqp://guest:guest@localhost:5672/lh4u',
    idleDelayMs: 1000, // forced delay between queue checks when queue is empty
    queue: {
      enabled: true,
      name: 'lh4u',
      options: {
        autoDelete: false,
        durable: true
      }
    }
  },
  http: {
    bindings: {
      http: {
        port: 8994
      }
    },
    // authRedirect: 'https://some/other/place',
    auth: {
      /*
      basicAuthForMyGroup: {
        type: 'basic',
        groups: 'myGroup', // or [] for more than one, or '*' for any
        options: {
          user: 'user',
          pass: 'see secure/{env}'
        }
      },
      customAuthForMyGroup: {
        type: 'custom',
        groups: 'myGroup',
        customPath: './lib/my-auth-handler.js',
        options: {
          some: 'option'
        }
      }
      */
    },
    routes: {
      // '/somePath': './routes/somePath.js'
      // OR
      // /somePath': { method: 'POST', path: './routes/post-somePath.js' }
    },
    staticFiles: {
      // '/somePath': {
      //   root: './path-to-static-folder',
      //   ... other options: https://expressjs.com/en/4x/api.html#express.static
      //  }
    }
  },
  lighthouse: {
    config: { // See: https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/default-config.js
      extends: 'lighthouse:default', // extends default
      logLevel: 'warn',
      chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'], // no-sandbox is required if running as root
      settings: { // See: https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/constants.js#L30
        output: 'json',
        extraHeaders: {},
        throttling: 'mobile3G' // See: https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/constants.js#L16
      }
    },
    validate: {
      // 'group-name': './validate/group-name.js' // throws if invalid response
    },
    concurrency: 1, // number of concurrent lighthouse tests permitted -- a value greater than 1 may negatively impact accuracy of reports
    samples: { // number of tests run before median performance report is determined
      default: 3,
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
  }
};
