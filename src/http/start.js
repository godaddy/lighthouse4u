const http = require('http');
const http2 = require('http2');

module.exports = app => {
  const { http: { bindings }} = app.get('config');

  const bindingKeys = Object.keys(bindings);
  if (!bindingKeys.length) throw new Error('No http.bindings detected!');
  bindingKeys.forEach(key => {
    const { port, ssl } = bindings[key];

    const server = ssl
      ? http2.createServer(ssl, app)
      : http.createServer(app)
    ;

    server.listen(port);
    console.log(`Listening on ${port}...`);
  });
};
