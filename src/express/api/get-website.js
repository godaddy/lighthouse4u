const getWebsite = require('../util/get-website');
const convertDocToSVG = require('../../util/convert-doc-to-svg');
const ReportGenerator = require('lighthouse/report/generator/report-generator.js');

const SVG_DEFAULT_WIDTH = 640;
const SVG_DEFAULT_HEIGHT = 180;

module.exports = async (req, res) => {

  const { format = 'json', scale = 1 } = req.query;

  let data;

  try {
    data = await getWebsite(req.app, req.query);
  } catch (ex) {
    console.error('store.getWebsite.err:', ex.stack || ex);
    return void res.sendStatus(400);
  }

  const files = data.files ? data.files : [data];

  if (!files.length) {
    return void res.sendStatus(404);
  }

  if (format === 'svg') { // send SVG
    res.setHeader('Content-Type', 'image/svg+xml');
    const svgOpts = {
      svgWidth: SVG_DEFAULT_WIDTH, svgHeight: SVG_DEFAULT_HEIGHT, scale
    };
    res.render('pages/website-svg-full', convertDocToSVG(files[0], svgOpts));
  } else if (format === 'reportJson') {
    res.send(JSON.parse(files[0]._report));
  } else if (format === 'reportHtml') {
    res.send(ReportGenerator.generateReport(JSON.parse(files[0]._report), 'html'));
  } else { // else send JSON
    res.send(files.map(({ audits, i18n, _report, categoryGroups, ...others }) => ({ ...others, hasReport: !!_report })));
  }
};
