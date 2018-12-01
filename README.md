# Lighthouse4u

[![travis-ci](https://travis-ci.org/godaddy/lighthouse4u.svg?branch=master)](https://travis-ci.org/godaddy/lighthouse4u)

LH4U provides [Google Lighthouse](https://github.com/GoogleChrome/lighthouse) as a service, surfaced by both a friendly UI+API, and backed by
[Elastic Search](https://www.elastic.co/products/elasticsearch) for all your query and [visualization needs](https://www.elastic.co/products/kibana).


![UI](./docs/example.gif)

## Usage

Start server via CLI:

```
npm i -g lighthouse4u
lh4u --config local --config-dir ./app/config --config-base defaults --secure-config ./app/config/secure --secure-file some-private.key -- server
```

Or locally to this repo via `npm start` (you'll need to create `test/config/local.json5` by copying `test/config/COPY.json5`).


## Configuration Options

| Option | Type | Default | Desc |
| --- | --- | --- | --- |
| elasticsearch | | | All options connected with Elasticsearch usage |
| ->.options | `ESOptions` | [See Defaults](./src/config/default-config.js#L3) | [ES driver options](https://www.npmjs.com/package/elasticsearch) |
| ->.indexName | `string` | `lh4u` | Index name in ES |
| ->.indexType | `string` | `lh4u` | Index type in ES |
| ->.index | `ESIndexOptions` | [See Defaults](./src/config/default-config.js#L12) | Options supplied to driver upon creation of ES index |
| amqp | | | [AMQP Options](https://www.npmjs.com/package/amqplib) to connect to RabbitMQ or any other AMQP-compatible interface |
| ->.url | `string` | `amqp://guest:guest@ localhost:5672/lh4u` | Connection string following the typical `{username}:{password}@{host}:{port}/{path}` format |
| ->.idleDelayMs | `number` | `1000` | Time (in MS) between queue checks when queue is empty |
| ->.secretKey | `string` | optional | Required only if encrypting/decrypting `secureHeaders`. Should be stored in [secure configuration](#secure-configuration) |
| ->.queue | `AmqpOptions` | | Queue options |
| ->.queue.enabled | `boolean` | `true` | To enable pulling/processing of queue |
| ->.queue.name | `string` | `lh4u` | Name of queue |
| ->.queue.options | | [See Defaults](./src/config/default-config.js#L40) | [Queue creation options](http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue) |
| http | | | HTTP(S) Server options |
| ->.bindings | `Hash<HttpBinding>` | | An object of named bindings |
| ->.bindings.{name} | `HttpBinding` | | With `{name}` being the name of the binding -- can be anything, ex: `myMagicBinding`. See value to `false` if you want to disable this binding. |
| ->.bindings.{name}.port | `number` | `8994` | Port to bind to |
| ->.bindings.{name}.ssl | [TLS Options](https://nodejs.org/dist/latest-v10.x/docs/api/tls.html#tls_new_tls_tlssocket_socket_options) | `undefined` | Required to bind HTTPS/2 |
| ->.auth | | | Zero or more authorization options |
| ->.auth.{authName} | `HttpAuth` | | A set of auth options keyed by any custom `{authName}` |
| ->.auth.{authName}.type | `basic|custom` | **required** | Type of auth, be it built-in Basic auth, or custom provided by `customPath` module |
| ->.auth.{authName}.groups | `string|array<string>` | `*` | **required** |  |
| ->.auth.{authName}.customPath | `string` | | Path of the custom module |
| ->.auth.{authName}.options | | | Options provided to the auth module |
| ->.authRedirect | | `undefined` | URL to redirect UI to if auth is enabled and fails |
| ->.routes | | | Optional set of custom routes |
| ->.routes.{name} | `string|HttpRoute` | | If value of type string that'll be used as path |
| ->.routes.{name}.path | `string` | | Path to resolve to connect middleware, relative to current working directory |
| ->.routes.{name}.method | `string` | `GET` | Method to bind to |
| ->.routes.{name}.route | `string` | Uses `{name}` if undefined | Route to map, ala `/api/test` |
| ->.staticFiles | | | Optional to bind routes to static assets |
| ->.staticFiles.{route} | [Express Static](https://expressjs.com/en/starter/static-files.html) | | Options to supply to static middleware |
| lighthouse | | | Options related to Lighthouse usage |
| ->.config | [LighthouseOptions](https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/default-config.js) | | Google Lighthouse configuration options |
| ->.config.extends | `string` | `lighthouse:default` | What options to default to |
| ->.config.logLevel | `string` | `warn` | Level of logging |
| ->.config.chromeFlags | `array<string>` | `[ '--headless', '--disable-gpu', '--no-sandbox' ]` | Array of CLI arguments |
| ->.config.settings | [LighthouseSettings](https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/config/constants.js#L30) | [See Defaults](./src/config/default-config.js#L90) | Settings applied to Lighthouse |
| ->.validate | `hash<string>` | | Zero or more validators |
| ->.validate.{groupName} | `string` | | Path of validation module used to determine if the response is coming from the intended server. Useful in cases where you only want to measure results coming from an intended infrastructure |
| ->.concurrency | `number` | `1` | Number of concurrently processed tasks permitted |
| ->.samples | | | After N lighthouse samples are taken, only the best result is recorded |
| ->.samples.default | `number` | `3` | Default number of lighthouse tests performed  |
| ->.samples.range | `tuple<min,max>` | `[1, 5]` | Minimum and maximum samples taken before returning result |
| ->.attempts | | | Number of attempts at running Google Lighthouse before giving up due to failures |
| ->.attempts.default | `number` | `2` | Default number of attempts before giving up |
| ->.attempts.range | `tuple<min,max>` | `[1, 10]` | Minimum and maximum attempts before giving up |
| ->.attempts.delayMsPerExponent | `number` | `1000` | Exponential backoff after failure |
| ->.delay | | | Time (in ms) before a test is executed |
| ->.delay.default | `number` | `0` | Default time to wait before test can be run |
| ->.delay.range | `tuple<min,max>` | `[0, 1000 * 60 * 60]` | Minimum and maximum time before test can be run |
| ->.delay.delayMsPerExponent | `number` | `1000 * 30` | Maximum time before delayed messages will be requeued |


## API

### API - `GET /api/website`

Fetch zero or more website results matching the criteria.

#### Query String Options

| Option | Type | Default | Desc |
| --- | --- | --- | --- |
| format | `string` | `json` | Format of results, be it `json` or `svg` |
| scale | `number` | `1` | Scale of `svg` |
| documentId | `string` | optional | Query by document ID |
| requestedUrl | `string` | optional | Query by requested URL |
| finalUrl | `string` | optional | Query by final URL (after redirects) |
| domainName | `string` | optional | Query by full domain |
| rootDomain | `string` | optional | Query by root domain |
| group | `string` | optional | Query by group ID |


### API - `GET /api/website/compare`

Similar to the single website GET, but instead compares results from `q1` with `q2`.

#### Query String Options

| Option | Type | Default | Desc |
| --- | --- | --- | --- |
| format | `string` | `json` | Format of results, be it `json` or `svg` |
| scale | `number` | `1` | Scale of `svg` |
| q1 | `string` | **required** | Smart query will auto-detect if `documentId`, `requestedUrl`, `domainName`, or `rootDomain` |
| q2 | `string` | **required** | Smart query will auto-detect if `documentId`, `requestedUrl`, `domainName`, or `rootDomain` |

### API - `POST /api/website`

Submit to process website with Google Lighthouse. 

#### JSON Body Options

| Option | Type | Default | Desc |
| --- | --- | --- | --- |
| url | `string` | **required** | URL to process via Google Lighthouse |
| wait | `number` | optional | Block returning until job is complete, or the `wait` time (in ms) has elapsed, resulting in a partial 206 response |
| headers | `hash<string>` | optional | Collection of HTTP headers to supply in request |
| secureHeaders | hash<string> | optional | Same use as `headers`, but stored securely in queue, and never persisted to ElasticSearch |
| samples | `number` | (See `options.lighthouse.samples`) | Number of samples to take before recording result |
| attempts | `number` | (See `options.lighthouse.attempts`) | Number of failure attempts before giving up |
| hostOverride | `string` | optional | Map host of request to an explicit IP. [Not yet supported by Chrome in Headless mode](https://bugs.chromium.org/p/chromium/issues/detail?id=798793) |
| delay | `number` | (See `options.lighthouse.delay`) | Delay (in milliseconds) before test will be performed. Useful if the intended service or domain is not expected to be available for some time |
| group | `string` | `unknown` | Group to categorize result to. Useful when searching/filtering on different groups of results |
| auditMode | `false|'simple'|'details'|'all'` | `'simple'` | How much of the [audits](https://github.com/GoogleChrome/lighthouse/blob/master/docs/understanding-results.md#properties) data to persist to storage |
| cookies | `array<{name=string|Cookie}>` | optional | Auto-translates cookies to set to the required `commands` |
| cookies[idx].value | `string` | **required** | Value to set for cookie |
| cookies[idx].domain | `string` | optional | Domain to apply cookie to. Defaults to root of `requestedUrl` domain |
| cookies[idx].url | `string` | optional | If the page required to apply cookie to differs from the `requestedUrl` you can set that here |
| cookies[idx].path | `string` | optional | Path to apply to cookie |
| cookies[idx].secure | `boolean` | optional | Is cookie secured |
| cookies[idx].httpOnly | `boolean` | optional | HTTP only |
| commands | `array<Commmand>` | optional | [DevTool Commands](https://chromedevtools.github.io/devtools-protocol/) to be executed prior to running Lighthouse |
| commands[idx].command | `string` | **required** | [DevTool Command](https://chromedevtools.github.io/devtools-protocol/) to execute |
| commands[idx].options | `object` | **required** | [DevTool Command Options](https://chromedevtools.github.io/devtools-protocol/) to supply command |


### Command


## Secure Configuration

Optionally you may run LH4U with the `--secure-config {secureConfigPath}` and `--secure-file {securePrivateFile}` powered by [Config Shield](https://github.com/godaddy/node-config-shield).

```
npm i -g config-shield
cshield ./app/config/secure some-private.key
> help
> set amqp { url: 'amqp://lh4u_user:someSuperSecretPassword@rmq.on-my-domain.com:5672/lh4u' }
> get amqp
: { "url": "amqp://lh4u_user:someSuperSecretPassword@rmq.on-my-domain.com:5672/lh4u" }
> save
> exit
```

The example above will allow you to merge sensitive credentials with your existing public configuration. Only options defined in the secure config will be deeply merged.
