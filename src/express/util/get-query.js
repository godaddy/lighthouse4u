module.exports = (query, defaultKey = 'q') => {
  if (!query || typeof query === 'string') return query;

  let q = query[defaultKey];

  if (!q) { // backward compatibility logic
    const { documentId, rootDomain, domainName, requestedUrl } = query;
    q = documentId ? `id:${documentId}` : (rootDomain || domainName || requestedUrl);
  }

  return q;
};
