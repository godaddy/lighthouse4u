const getWebsite = require('../../../elasticsearch/get-website');
const convertQueryToES = require('../../../elasticsearch/convert-query-to-es');
const convertDocToSVG = require('../../../util/convert-doc-to-svg');

const SVG_DEFAULT_WIDTH = 640;
const SVG_DEFAULT_HEIGHT = 382;

module.exports = async (req, res) => {

  const { format = 'json', scale = 1, q1, q2 } = req.query;

  if (!q1 || !q2) {
    return void res.sendStatus(400);
  }

  const config = req.app.get('config');

  const query1 = convertQueryToES(q1, config);
  const query2 = convertQueryToES(q2, config);

  let data1, data2;

  try {
    data1 = await getWebsite(req.app, query1);
  } catch (ex) {
    console.error('esclient.getWebsite.err:', ex.stack || ex);
    return void res.sendStatus(400);
  }

  try {
    data2 = await getWebsite(req.app, query2);
  } catch (ex) {
    console.error('esclient.getWebsite.err:', ex.stack || ex);
    return void res.sendStatus(400);
  }

  const hits1 = (data1.hits && data1.hits.hits || [data1]).map(hit => {
    const src = hit._source;
    src.id = hit._id;
    return src;
  });

  const hits2 = (data2.hits && data2.hits.hits || [data2]).map(hit => {
    const src = hit._source;
    src.id = hit._id;
    return src;
  });

  const q1Result = hits1[0];
  const q2Result = hits2[0];

  if (format === 'svg') { // send SVG
    res.setHeader('Content-Type', 'image/svg+xml');
    const svgOpts = {
      svgWidth: SVG_DEFAULT_WIDTH, svgHeight: SVG_DEFAULT_HEIGHT, scale
    };
    res.render('pages/website-svg-compare', {
      q1: convertDocToSVG(q1Result, svgOpts),
      q2: convertDocToSVG(q2Result, svgOpts)
    });
  } else { // else send JSON
    res.send({
      q1: q1Result,
      q2: q2Result
    });
  }
};
