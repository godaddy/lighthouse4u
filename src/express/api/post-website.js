const { getDomain, getSubdomain } = require('tldjs');
const encrypt = require('../../util/encrypt');
const getWebsite = require('../util/get-website');
const crypto = require('crypto');
const papa = require('papaparse');

module.exports = async (req, res) => {
  const { batch, wait, url, headers, secureHeaders, commands, cookies, auditMode, samples, attempts, hostOverride, delay: delayStr, group = 'unknown' } = req.body;

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
  const store = req.app.get('store');
  const queue = req.app.get('queue');
  const { lighthouse } = config;
  const { secretKey } = config.queue;

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
    let documents = documentRequests.map(({ url, group }) => {

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
        auditMode,
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
      const { id } = await store.write(doc);

      doc.id = id;

      // do not queue until the document has been indexed
      await queue.enqueue(doc);

      return doc;
    });

    let storedDocs = await Promise.all(documentPromises);

    if (wait) {
      const processedDocs = await waitForProcessedDocs(req.app, storedDocs, wait);
      if (processedDocs) {
        storedDocs = processedDocs;
      } else {
        // if timeout, respond with partial to signal delta
        res.status(206); // partial
      }
    }

    res.send(batch ? storedDocs : storedDocs[0]); // forward document(s) back to caller
  } catch (ex) {
    console.error('indexWebsite.error:', ex.stack || ex);
    res.sendStatus(ex.status || 500);
  }

};

async function waitForProcessedDocs(app, documents, timeout) {
  const start = Date.now();

  do {
    documents = await Promise.all(documents.map(doc => {
      if (doc.state === 'processed' || doc.state === 'error') return doc; // nothing more to do

      return getWebsite(app, { q: doc.id });
    }));

    if (!documents.find(doc => (doc.state !== 'processed' && doc.state !== 'error'))) {
      // return final completed states if available
      return documents;
    }

    // sleep... pulling sucks, but more ideal for server to handle than client
    await new Promise(resolve => setTimeout(resolve, 1000));
  } while ((Date.now() - start) < timeout);
}
