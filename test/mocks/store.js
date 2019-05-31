const { stub } = require('sinon');

module.exports = () => {
  const doc = {
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
  };
  return {
    '$document': doc,
    query: stub().resolves(doc),
    write: stub().resolves({
      id: 'documentId'
    })
  };
};
