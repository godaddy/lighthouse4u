const path = require('path');
const fs = require('fs');

module.exports = function getClient(queueConfig) {
  let absPath = path.isAbsolute(queueConfig.module) ? queueConfig.module // already absolute path
    : path.resolve(process.cwd(), queueConfig.module) // try explicit first
  ;
  if (!fs.existsSync(absPath)) { // if not found, attempt to use node_modules
    absPath = path.resolve(process.cwd(), 'node_modules/' + queueConfig.module);
  }
  // no need to cache the `Client` module since `require` does this for us
  const mod = require(absPath);
  const Client = mod.default || mod; // support ES Modules & CommonJS
  // always create a unique instance of Client
  const instance = new Client(queueConfig.options || {});

  return instance;
};
