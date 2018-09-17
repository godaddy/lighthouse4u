function getQueryType(val) {
  if (/^http(s?):\/\//i.test(val)) return 'requestedUrl';
  else if (/\.(.*)\./.test(val)) return 'domainName';
  else if (/\./.test(val)) return 'rootDomain';
  else if (val.length === 20) return 'documentId'; // slightly hacky but good enough for UI
  return 'group';
}

module.exports = function convertQueryToES(q) {
  const split = q.split(':');
  const queryKey = (split.length === 2 && split[0]) || getQueryType(q);
  const queryValue = (split.length === 2 && split[1]) || q;

  const query = {};
  query[queryKey] = queryValue;

  return query;
};
