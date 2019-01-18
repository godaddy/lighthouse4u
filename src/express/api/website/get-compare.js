const getWebsite = require('../../util/get-website');
const convertDocToSVG = require('../../../util/convert-doc-to-svg');

const SVG_DEFAULT_WIDTH = 640;
const SVG_DEFAULT_HEIGHT = 382;

module.exports = async (req, res) => {

  const { format = 'json', scale = 1, q1, q2 } = req.query;

  if (!q1 || !q2) {
    return void res.sendStatus(400);
  }

  let data1, data2;

  try {
    data1 = await getWebsite(req.app, q1);
  } catch (ex) {
    console.error('store.getWebsite.err:', ex.stack || ex);
    return void res.sendStatus(400);
  }

  try {
    data2 = await getWebsite(req.app, q2);
  } catch (ex) {
    console.error('store.getWebsite.err:', ex.stack || ex);
    return void res.sendStatus(400);
  }

  const files1 = data1.files ? data1.files : [data1];
  const files2 = data2.files ? data2.files : [data2];

  const [q1Result] = files1;
  const [q2Result] = files2;

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
