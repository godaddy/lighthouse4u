const path = require('path');
const URL = require('url');

const gInstances = {};

module.exports = ({ app, config: { http: { auth, authRedirect } } }) => {
  const authKeys = Object.keys(auth).filter(key => !!auth[key]);

  return async (req, res, next) => {

    const promises = authKeys.map(key => {
      const authConfig = auth[key];

      const instance = getInstance(app, authConfig);

      return instance({ req, res }, authConfig.options || {});
    });

    let results;
    try {
      results = await Promise.all(promises);
    } catch (ex) {
      return void next(ex);
    }

    const groupsAllowed = results.reduce(
      (state, result, idx) => state
      || (result && (auth[authKeys[idx]].groups || '*'))
      || false,
      false
    );

    req.groupsAllowed = groupsAllowed;

    if (groupsAllowed) return void next();

    const { pathname } = URL.parse(req.url);
    const isUI = pathname === '/';
    if (isUI && authRedirect) {
      // use redirect if provided
      res.writeHead(302, { Location: authRedirect });
      return void res.end();
    }

    const err = new Error('Unauthorized');
    err.statusCode = 401;
    next(err);
  };
};

function getInstance(app, { type, customPath }) {
  let instance = gInstances[type];
  if (!instance) {
    gInstances[type] = instance = require(customPath ? path.resolve(customPath) : `./${type}`)(app);
  }

  return instance;
}
