const lighthouseOptions = document.getElementById('lighthouseOptions');
const websiteInfo = document.getElementById('websiteInfo');
const queryByValue = document.getElementById('queryByValue');
const submitWebsite = document.getElementById('submitWebsite');
const getWebsite = document.getElementById('getWebsite');
const cancelGetWebsite = document.getElementById('cancelGetWebsite');
const queryTop = document.getElementById('queryTop');
const websiteSVG = document.getElementById('websiteSVG');
const svgURL = document.getElementById('svgURL');
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

      const arr = Array.isArray(body) ? body : [body];
      queryByValue.value = arr[0].id;
      websiteInfo.innerText = JSON.stringify(arr, null, 2);
      websiteInfo.scrollIntoView();

      updateSVG();
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

function getQueryURL() {
  return `api/website?top=${queryTop.value}&q=${encodeURIComponent(queryByValue.value)}`;
}

function updateSVG(queryURL) {
  if (!queryURL) queryURL = getQueryURL();

  const svgUrl = `${queryURL}&format=svg&scale=1`;
  websiteSVG.src = `${svgUrl}&cache=${Date.now()}`; // only use cache busting on IMG itself, not the link to copy
  svgURL.href = svgURL.innerText = svgUrl;
}

function onGetWebsite() {
  submitWebsite.disabled = getWebsite.disabled = true;
  const queryURL = getQueryURL();
  fetch(queryURL)
    .then(res => res.status !== 200 ? new Error(`Server returned ${res.status}`) : res.json())
    .then(body => {
      if (body instanceof Error) throw body;
      
      submitWebsite.disabled = getWebsite.disabled = null;

      websiteInfo.innerText = JSON.stringify(body, null, 2);
      getWebsite.scrollIntoView();

      updateSVG(queryURL);
    })
    .catch(err => {
      console.error('Oops!', err.stack || err);
      websiteInfo.innerText = `Oops! ${(err.stack && err.stack.message) || err}`;
      websiteInfo.scrollIntoView();
      submitWebsite.disabled = getWebsite.disabled = null;
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
if (query.query) {
  queryByValue.value = query.query;
  onGetWebsite();
}
