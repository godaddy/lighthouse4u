const URL = require('url');
const AWS = require('aws-sdk');

module.exports = class StoreS3 {
  constructor({ region, bucket } = {}) {
    if (region) {
      AWS.config.update({ region });
    }
    this.s3 = new AWS.S3({ });
    this.Bucket = bucket;
  }

  initialize() {
    // no special initialization support
    return Promise.resolve();
  }

  read(Key, { etag } = {}) {
    const { Bucket } = this;
    const params = { Bucket, Key: decodeURIComponent(Key) };
    if (etag) params.IfNoneMatch = etag;
    return new Promise((resolve, reject) => {
      this.s3.getObject(params, (err, res) => {
        if (err) return void reject(err);

        const data = JSON.parse(res.Body);

        data.id = Key;
        data.etag = res.ETag;

        resolve(data);
      });
    });
  }

  list(url, { resumeKey, maxCount = 10, order = 'DESC' } = {}) {
    const Prefix = urlToS3Dir(url);
    const { Bucket } = this;
    const params = {
      Bucket,
      Delimiter: '/',
      EncodingType: 'url',
      FetchOwner: false,
      ContinuationToken: resumeKey,
      MaxKeys: maxCount,
      Prefix
    };

    return new Promise((resolve, reject) => {
      this.s3.listObjectsV2(params, (err, data) => {
        if (err) return void reject(err);

        const files = data.Contents.map(f => ({
          id: f.Key,
          etag: f.ETag
        }));

        resolve({
          resumeKey: data.IsTruncated ? data.NextContinuationToken : undefined,
          files
        });
      });
    });
  }

  async find(url, opts) {
    const ls = await this.list(url, opts);

    // read all docs
    await Promise.all(ls.files.map(async f => {
      const data = await this.read(f.id);

      // copy props
      Object.assign(f, data);

      return f; // resolve value is unused
    }));

    return ls;
  }

  write(data, { meta = {} } = {}) {
    const { Bucket } = this;
    const Key = data.id ? data.id : urlToS3Key(data.requestedUrl);
    const Body = JSON.stringify(data, null, 2);
    const Metadata = meta;
    const ContentType = 'application/json'
    const params = { Bucket, Key, Body, Metadata, ContentType };

    return new Promise((resolve, reject) => {
      this.s3.upload(params, (err, res) => {
        if (err) return void reject(err);

        data.id = Key;
        data.etag = res.ETag;

        resolve(data);
      })
    });

  }
}

function urlToS3Dir(url) {
  const urlInfo = URL.parse(url);
  return `${urlInfo.hostname}${encodeSpecialCharacters(urlInfo.pathname)}${urlInfo.pathname[urlInfo.pathname.length - 1] === '/' ? '' : `/`}`
}

function urlToS3Key(url) {
  // it's important that the key can be lexical (for byte order) and shrinking to permit returning newest results first
  // S3 doesn't permit returning descending order w/o a query layer
  const decrementingKey = encodeSpecialCharacters(new Buffer(`${9999999999999 - Date.now()}`).toString('base64')); // ugly hack since we cannot use a human readable timestamp
  const urlInfo = URL.parse(url);
  return `${urlInfo.hostname}${encodeSpecialCharacters(urlInfo.pathname)}${urlInfo.pathname[urlInfo.pathname.length - 1] === '/' ? decrementingKey : `/${decrementingKey}`}.json`
}

/* PULLED FROM knox
  https://github.com/Automattic/knox/blob/master/lib/client.js#L64-L70
*/
function encodeSpecialCharacters(filename) {
  // Note: these characters are valid in URIs, but S3 does not like them for
  // some reason.
  return encodeURI(filename).replace(/[!'()#*+? ]/g, function (char) {
    return '%' + char.charCodeAt(0).toString(16);
  });
}
