const lighthouseOptions = document.getElementById('lighthouseOptions');
const websiteInfo = document.getElementById('websiteInfo');
const queryByValue = document.getElementById('queryByValue');
const submitWebsite = document.getElementById('submitWebsite');
const getWebsite = document.getElementById('getWebsite');
const cancelGetWebsite = document.getElementById('cancelGetWebsite');
const queryTop = document.getElementById('queryTop');
const websiteSVG = document.getElementById('websiteSVG');
const websiteIFrame = document.getElementById('websiteIFrame');
const svgURL = document.getElementById('svgURL');
const jsonURL = document.getElementById('jsonURL');
const reportURL = document.getElementById('reportURL');
const reportJSONURL = document.getElementById('reportJSONURL');
const useBatch = document.getElementById('useBatch');
const batchFile = document.getElementById('batchFile');

let batchFileText;
const batchFileReader = new FileReader();
batchFileReader.onload = e => {
  batchFileText = e.target.result;
};
batchFile.addEventListener('change', evt => {
  batchFileReader.readAsText(evt.target.files[0]);
}, false);

function onSubmitWebsite() {
  const lhOptions = JSON.parse(lighthouseOptions.value);
  if (useBatch.checked) {
    if (!batchFileText) {
      return void alert('No batch file provided, try again');
    }

    lhOptions.batch = batchFileText;
  }
  const lhOptionsJSON = JSON.stringify(lhOptions);
  submitWebsite.disabled = getWebsite.disabled = true;
  fetch('api/website', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: lhOptionsJSON
  })
    .then(res => res.status !== 200 ? new Error(`Server returned ${res.status}`) : res.json())
    .then(body => {
      if (body instanceof Error) throw body;

      submitWebsite.disabled = getWebsite.disabled = null;

      const arr = prettifyWebsites(Array.isArray(body) ? body : [body]);
      queryByValue.value = arr[0].id;
      websiteInfo.innerText = JSON.stringify(arr, null, 2);

      updateCards(arr);
      window.scrollTo(0,document.body.scrollHeight);
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

function getQueryURL(query) {
  return `api/website?top=${queryTop.value}&q=${encodeURIComponent(query || queryByValue.value)}`;
}

function updateCards(arr) {
  if (!Array.isArray(arr) || !arr.length || !arr[0]) {
    websiteSVG.style.display = 'none';
    websiteIFrame.style.display = 'none';
    svgURL.style.display = 'none';
    jsonURL.style.display = 'none';
    reportURL.style.display = 'none';
    reportJSONURL.style.display = 'none';
    return;
  }

  const first = arr[0];

  const queryURL = getQueryURL(first.id);

  svgURL.href = `${queryURL}&format=svg&scale=1`;
  svgURL.style.display = '';
  jsonURL.href = `${queryURL}&format=json`;
  jsonURL.style.display = '';

  if (first.hasReport) {
    websiteSVG.style.display = 'none';
    reportURL.href = `${queryURL}&format=reportHtml`;
    reportURL.style.display = '';
    websiteIFrame.src = `${reportURL.href}&cache=${Date.now()}`; // only use cache busting on IMG itself, not the link to copy
    websiteIFrame.style.display = '';
    reportJSONURL.href = `${queryURL}&format=reportJson`;
    reportJSONURL.style.display = '';
  } else {
    websiteSVG.src = `${svgURL.href}&cache=${Date.now()}`; // only use cache busting on IMG itself, not the link to copy
    websiteSVG.style.display = '';
    reportURL.style.display = 'none';
    reportJSONURL.style.display = 'none';
    websiteIFrame.style.display = 'none';
  }
}

function onGetWebsite() {
  submitWebsite.disabled = getWebsite.disabled = true;
  const queryURL = getQueryURL();
  fetch(queryURL)
    .then(res => res.status !== 200 ? new Error(`Server returned ${res.status}`) : res.json())
    .then(body => {
      if (body instanceof Error) throw body;

      submitWebsite.disabled = getWebsite.disabled = null;

      websiteInfo.innerText = JSON.stringify(prettifyWebsites(body), null, 2);

      updateCards(body);
      window.scrollTo(0,document.body.scrollHeight);
    })
    .catch(err => {
      console.error('Oops!', err.stack || err);
      websiteInfo.innerText = `Oops! ${(err.stack && err.stack.message) || err}`;
      submitWebsite.disabled = getWebsite.disabled = null;
      window.scrollTo(0,document.body.scrollHeight);
    })
  ;
}

function toggleUseBatch() {
  batchFile.style.display = useBatch.checked ? null : 'none';
}

const query = document.location.search.substr(1).split('&')
  .reduce((ctx, k) => {
    const s = k.split('='); ctx[s[0]] = s[1]; return ctx;
  }, {})
;
updateCards();
if (query.query) {
  queryByValue.value = query.query;
  onGetWebsite();
}

function prettifyWebsites(o) {
  return o.map(r => Object.keys(r).reduce((state, k) => {
    const v = r[k];
    const t = typeof v;
    if (t === 'string' || t === 'number' || t === 'boolean') {
      state[k] = v;
    }
    return state;
  }, {}))
}
