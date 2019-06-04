const LEGACY_QUERIES = {
  documentId: 'documentId',
  rootDomain: 'rootDomain',
  domainName: 'domainName',
  requestedUrl: 'requestedUrl',
  group: 'group'
};

module.exports = (query, defaultKey = 'q') => {
  if (!query || typeof query === 'string') {
    const legacySplit = query.split(':');
    if (legacySplit && legacySplit.length >= 2 && legacySplit[0] in LEGACY_QUERIES) {
      // remove key
      return query.substr(legacySplit[0].length + 1);
    }
    return query;
  }

  let q = query[defaultKey];

  if (!q) { // backward compatibility logic
    const { documentId, rootDomain, domainName, requestedUrl, group } = query;
    q = documentId ? `id:${documentId}` : (rootDomain || domainName || requestedUrl || group);
  }

  return q;
};
