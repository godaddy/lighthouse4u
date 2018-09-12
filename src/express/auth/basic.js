const basicAuth = require('basic-auth');

module.exports = (/* app*/) => {
  return ({ req/* , res*/ }, options) => {
    const creds = basicAuth(req);
    if (!creds) return false;
    const { name, pass } = creds;

    if (name !== options.user || pass !== options.pass) return false;

    // if we get this far, request is permitted
    return true;
  };
};
