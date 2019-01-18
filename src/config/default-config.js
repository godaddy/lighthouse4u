module.exports = {
  store: {
    options: {}
  },
  queue: {
    idleDelayMs: 1000, // forced delay between queue checks when queue is empty
    enabled: true,
    options: {}
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
  lighthouse: require('../lighthouse/defaults')
};
