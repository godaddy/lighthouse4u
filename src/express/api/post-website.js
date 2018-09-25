const indexWebsite = require('../../elasticsearch/index-website');
const submitWebsite = require('../../amqp/submit-website');
const { getDomain, getSubdomain } = require('tldjs');
const encrypt = require('../../util/encrypt');
const crypto = require('crypto');

module.exports = async (req, res) => {
  const { url, headers, secureHeaders, commands, samples, attempts, hostOverride, delay: delayStr, group = 'unknown' } = req.body;

  if (!url) return void res.status(400).send('`url` required');

  if (req.groupsAllowed && (typeof req.groupsAllowed !== 'string' || req.groupsAllowed !== '*')) {
    // verify the requested group is allowed
    const groups = (typeof req.groupsAllowed === 'string') ? [req.groupsAllowed] : req.groupsAllowed;
    const isAllowed = groups.reduce((isAllowed, allowedGroup) => {
      return isAllowed || group === allowedGroup;
    }, false);
    if (!isAllowed) {
      return void res.status(401).end();
    }
  }

  const config = req.app.get('config');
  const { lighthouse, amqp } = config;
  const { secretKey } = amqp;

  let secureHeadersEncrypted, cipherVector;
  if (secureHeaders) {
    if (!secretKey) {
      return void res.status(400).send('`secureHeaders` feature not enabled');
    }

    cipherVector = new Buffer(crypto.randomBytes(8)).toString('hex');
    secureHeadersEncrypted = encrypt(JSON.stringify(secureHeaders), secretKey, cipherVector);
  }
  let commandsEncrypted;
  if (commands) {
    if (!secretKey) {
      return void res.status(400).send('`commands` feature not enabled');
    }

    cipherVector = cipherVector || new Buffer(crypto.randomBytes(8)).toString('hex');
    commandsEncrypted = encrypt(JSON.stringify(commands), secretKey, cipherVector);
  }

  const rootDomain = getDomain(url);
  const subDomain = getSubdomain(url);
  const domainName = subDomain ? `${subDomain}.${rootDomain}` : rootDomain;

  const delay = Math.min(
    Math.max(parseInt(delayStr, 10) || lighthouse.delay.default, lighthouse.delay.range[0]),
    lighthouse.delay.range[1]
  );
  const delayTime = delay && (Date.now() + delay); // time from now

  const document = {
    requestedUrl: url,
    domainName,
    rootDomain,
    headers,
    secureHeaders: secureHeadersEncrypted,
    commands: commandsEncrypted,
    cipherVector,
    group,
    samples,
    attempts,
    hostOverride,
    delay,
    delayTime,
    state: 'requested',
    createDate: Date.now()
  };

  try {

    const { _id } = await indexWebsite(req.app, document);
    document.id = _id;

    // do not queue until the document has been indexed
    await submitWebsite(req.app, document);

    res.send(document); // forward document back to caller
  } catch (ex) {
    console.error('indexWebsite.error:', ex.stack || ex);
    res.sendStatus(500);
  }

};
