const { stub } = require('sinon');

class Client {
  constructor(options) {
    this.options = options;

    this._doc = {
      _index: 'lh4u',
      _type: 'lh4u',
      _id: 'documentId',
      _source: {
        id: 'documentId',
        requestedUrl: 'requestedUrl',
        finalUrl: 'finalUrl',
        rootDomain: 'rootDomain',
        group: 'group',
        samples: 1,
        attempt: 1,
        attempts: 1,
        state: 'processed',
        createDate: 1234567890,
        categories: {
          performance: { score: 0.5 },
          pwa: { score: 0.6 },
          accessibility: { score: 0.7 },
          'best-practices': { score: 0.8 },
          seo: { score: 0.9 },
        }
      }
    };

    this.index = stub().resolves({ _id: 'documentId' });
    this.get = stub().resolves(this._doc);
    this.search = stub().resolves({
      took: 1,
      timed_out: false,
      _shards: { total: 1, successful: 1, failed: 0 },
      hits: {
        total: 1,
        max_score: null,
        hits: [this._doc]
      }
    });
  }
}

module.exports = {
  Client,
  '@global': true
};
