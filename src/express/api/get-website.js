const getWebsite = require('../../elasticsearch/get-website');

const SVG_DEFAULT_WIDTH = 640;
const SVG_DEFAULT_HEIGHT = 180;

module.exports = async (req, res) => {

  const { format = 'json', scale = 1 } = req.query;

  let data;

  try {
    data = await getWebsite(req.app, req.query);
  } catch (ex) {
    console.error('esclient.getWebsite.err:', ex.stack || ex);
    return void res.sendStatus(400);
  }

  const hits = (data.hits && data.hits.hits || [data]).map(hit => {
    const src = hit._source;
    src.id = hit._id;
    return src;
  });

  if (format === 'svg') { // send SVG
    res.setHeader('Content-Type', 'image/svg+xml');
    // if (hits.length === 0) return void res.sendStatus(404);
    const doc = hits[0] || { requestedUrl: JSON.stringify(req.query), state: 'error', errorMessage: 'Not Found' };
    const { requestedUrl, state, createDate, group } = doc;
    res.render('pages/website-svg-full', {
      state,
      group,
      requestedUrl,
      createDate: new Date(createDate).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      performance: getScore(doc, 'performance'),
      accessibility: getScore(doc, 'accessibility'),
      bestPractices: getScore(doc, 'best-practices'),
      seo: getScore(doc, 'seo'),
      pwa: getScore(doc, 'pwa'),
      svgWidth: Math.round(SVG_DEFAULT_WIDTH * parseFloat(scale)), svgHeight: Math.round(SVG_DEFAULT_HEIGHT * parseFloat(scale))
    });
  } else { // else send JSON
    res.send(hits);
  }
};

function getScore(doc, cat) {
  switch (doc.state) {
    case 'processed':
      return (cat in doc.categories) ? `${(doc.categories[cat].score * 100).toFixed(0)}%` : '?';
    case 'error':
      return 'error';
    default:
      return 'pending';
  }
}
