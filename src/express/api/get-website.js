const getWebsite = require('../../elasticsearch/get-website');
const convertDocToSVG = require('../../util/convert-doc-to-svg');

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
    const svgOpts = {
      svgWidth: SVG_DEFAULT_WIDTH, svgHeight: SVG_DEFAULT_HEIGHT, scale
    };
    res.render('pages/website-svg-full', convertDocToSVG(hits[0], svgOpts));
  } else { // else send JSON
    res.send(hits);
  }
};
