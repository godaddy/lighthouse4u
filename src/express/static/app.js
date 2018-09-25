const lighthouseOptions = document.getElementById('lighthouseOptions');
const websiteInfo = document.getElementById('websiteInfo');
const queryByLabel = document.getElementById('queryByLabel');
const queryByValue = document.getElementById('queryByValue');
const submitWebsite = document.getElementById('submitWebsite');
const getWebsite = document.getElementById('getWebsite');
const cancelGetWebsite = document.getElementById('cancelGetWebsite');
const queryTop = document.getElementById('queryTop');
const websiteSVG = document.getElementById('websiteSVG');
const svgURL = document.getElementById('svgURL');

function onSubmitWebsite() {
  submitWebsite.disabled = getWebsite.disabled = true;
  fetch('/api/website', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: lighthouseOptions.value
  })
    .then(res => res.json())
    .then(body => {
      submitWebsite.disabled = getWebsite.disabled = null;

      queryByValue.value = body.id;
      websiteInfo.innerText = JSON.stringify([body], null, 2);
      websiteInfo.scrollIntoView();
    })
    .catch(err => {
      console.error('Oops!', err.stack || err);
      submitWebsite.disabled = getWebsite.disabled = null;
    })
  ;
}

const QUERY_TYPE_LABELS = {
  requestedUrl: 'Requested URL',
  domainName: 'Domain Name',
  rootDomain: 'Root Domain Name',
  group: 'Group Name',
  documentId: 'Document ID'
};

function getQueryType() {
  const val = queryByValue.value;
  if (/^http(s?):\/\//i.test(val)) return 'requestedUrl';
  else if (/\.(.*)\./.test(val)) return 'domainName';
  else if (/\./.test(val)) return 'rootDomain';
  else if (val.length === 20) return 'documentId'; // slightly hacky but good enough for UI
  return 'group';
}

function onQueryByValueChange() {
  const label = QUERY_TYPE_LABELS[getQueryType()] || 'unknown';
  queryByLabel.innerHTML = label;
}

function onGetWebsite() {
  submitWebsite.disabled = getWebsite.disabled = true;
  const queryKey = getQueryType();
  const queryURL = `/api/website?top=${queryTop.value}&${queryKey}=${encodeURIComponent(queryByValue.value)}`;
  fetch(queryURL)
    .then(res => res.json())
    .then(body => {
      submitWebsite.disabled = getWebsite.disabled = null;

      websiteInfo.innerText = JSON.stringify(body, null, 2);
      getWebsite.scrollIntoView();

      websiteSVG.src = `${queryURL}&format=svg&scale=1`;
      svgURL.href = svgURL.innerText = websiteSVG.src;
    })
    .catch(err => {
      console.error('Oops!', err.stack || err);
      websiteInfo.innerText = `Oops! ${(err.stack && err.stack.message) || err}`;
      websiteInfo.scrollIntoView();
      submitWebsite.disabled = getWebsite.disabled = null;
    })
  ;
}

const query = document.location.search.substr(1).split('&')
  .reduce((ctx, k) => {
    const s = k.split('='); ctx[s[0]] = s[1]; return ctx;
  }, {})
;
if (query.query) {
  queryByValue.value = query.query;
  onQueryByValueChange();
  onGetWebsite();
}
