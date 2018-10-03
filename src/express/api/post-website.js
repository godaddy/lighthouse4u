const indexWebsite = require('../../elasticsearch/index-website');
const submitWebsite = require('../../amqp/submit-website');
const { getDomain, getSubdomain } = require('tldjs');
const encrypt = require('../../util/encrypt');
const crypto = require('crypto');
const papa = require('papaparse');

module.exports = async (req, res) => {
  const { batch, url, headers, secureHeaders, commands, cookies, samples, attempts, hostOverride, delay: delayStr, group = 'unknown' } = req.body;

  let documentRequests;

  if (!url && !batch) return void res.status(400).send('`url` OR `batch` required');

  if (batch) {
    if (typeof batch === 'object') {
      documentRequests = batch;
    } else if (batch[0] === '[') {
      // appears to be JSON
      documentRequests = JSON.parse(batch);
    } else {
      // assume CSV
      documentRequests = papa.parse(batch).data;
    }

    // use 2nd row to detect cols in case of header row
    const { urlCol, groupCol } = (documentRequests.length > 1 ? documentRequests[1] : documentRequests[0]).reduce((state, val, idx) => {
      if (state.urlCol < 0) {
        if (/\./.test(val) === true) {
          // dumb detector -- we're expecting domain or url left/most cols
          state.urlCol = idx;
        }
      } else if (state.groupCol < 0) {
        if (typeof val === 'string') {
          // for now we assume col following url is group, if one is provided
          state.groupCol = idx;
        }
      }

      return state;
    }, {
      urlCol: -1,
      groupCol: -1
    });

    documentRequests = documentRequests.map(row => {
      const v = row[urlCol];
      const isUrl = /\./.test(v);
      const url = isUrl && (/^https?:\/\//.test(v) ? v : `http://${v}`);
      return {
        url,
        group: `${group}${row[groupCol] || ''}`
      };
    }).filter(row => typeof row.url === 'string');
  }

  if (!documentRequests) {
    documentRequests = [{
      url,
      group
    }];
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
  let cookiesEncrypted;
  if (cookies) {
    if (!secretKey) {
      return void res.status(400).send('`cookies` feature not enabled');
    }

    cipherVector = cipherVector || new Buffer(crypto.randomBytes(8)).toString('hex');
    cookiesEncrypted = encrypt(JSON.stringify(cookies), secretKey, cipherVector);
  }

  const delay = Math.min(
    Math.max(parseInt(delayStr, 10) || lighthouse.delay.default, lighthouse.delay.range[0]),
    lighthouse.delay.range[1]
  );
  const delayTime = delay && (Date.now() + delay); // time from now

  const groups = (typeof req.groupsAllowed === 'string') ? [req.groupsAllowed] : req.groupsAllowed;

  try {
    const documents = documentRequests.map(({ url, group }) => {

      if (req.groupsAllowed && (typeof req.groupsAllowed !== 'string' || req.groupsAllowed !== '*')) {
        // verify the requested group is allowed
        const isAllowed = groups.reduce((isAllowed, allowedGroup) => {
          return isAllowed || group === allowedGroup;
        }, false);
        if (!isAllowed) {
          const err = new Error('Group not authorized');
          err.status = 401;
          throw err;
        }
      }

      const rootDomain = getDomain(url);
      const subDomain = getSubdomain(url);
      const domainName = subDomain ? `${subDomain}.${rootDomain}` : rootDomain;

      return {
        requestedUrl: url,
        domainName,
        rootDomain,
        headers,
        secureHeaders: secureHeadersEncrypted,
        commands: commandsEncrypted,
        cookies: cookiesEncrypted,
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

    });

    const documentPromises = documents.map(async doc => {
      const { _id } = await indexWebsite(req.app, doc);
      doc.id = _id;

      // do not queue until the document has been indexed
      return submitWebsite(req.app, doc);
    });

    await Promise.all(documentPromises);

    res.send(batch ? documents : documents[0]); // forward document(s) back to caller
  } catch (ex) {
    console.error('indexWebsite.error:', ex.stack || ex);
    res.sendStatus(ex.status || 500);
  }

};
