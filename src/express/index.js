const express = require('express');
const path = require('path');
const getESClient = require('../elasticsearch/client');
const getAMQPClient = require('../amqp/client');

module.exports = config => {

  const app = express();

  app.set('config', config);
  app.set('esclient', getESClient(config));
  app.set('amqp', getAMQPClient(config));
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // mount `http.auth` if any provided
  if (Object.keys(config.http.auth).length > 0) {
    app.use(require('./auth')({ app, config }));
  }

  app.use('/static', express.static(path.join(__dirname, 'static')));
  app.use('/api', express.json());
  app.get('/', (req, res) => res.render('pages/index'));
  app.get('/api/website', require('./api/get-website'));
  app.get('/api/website/compare', require('./api/website/get-compare'));
  app.post('/api/website', require('./api/post-website'));

  // mount `http.staticFiles` if any provided
  Object.keys(config.http.staticFiles).forEach(route => {
    const staticOptions = config.http.staticFiles[route];
    app.use(route, express.static(staticOptions.root, staticOptions));
  });

  // mount `http.routes` if any provided
  Object.keys(config.http.routes).forEach(key => {
    const routeOptions = config.http.routes[key];
    const routePath = path.resolve(routeOptions.path || routeOptions);
    const routeMethod = routeOptions.method || 'get';
    const routeModule = require(routePath)(app, typeof routeOptions === 'string' ? {} : routeOptions);
    const route = routeOptions.route || key;
    app[routeMethod](route, routeModule);
  });

  app.use((err, req, res, next) => {

    console.error(err.stack || err);

    if (!res.headersSent) {
      res.status(err.statusCode || 500).send('Oops!');
    }

  });

  return app;

};
