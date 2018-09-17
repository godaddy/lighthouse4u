const getScore = require('./get-score');

module.exports = (doc, { svgWidth, svgHeight, scale }) => {
  return {
    state: doc && doc.state,
    group: doc && doc.group,
    requestedUrl: doc ? doc.requestedUrl : '(NOT FOUND)',
    createDate: doc && new Date(doc.createDate).toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    performance: doc && getScore(doc, 'performance'),
    accessibility: doc && getScore(doc, 'accessibility'),
    bestPractices: doc && getScore(doc, 'best-practices'),
    seo: doc && getScore(doc, 'seo'),
    pwa: doc && getScore(doc, 'pwa'),
    svgWidth: Math.round(svgWidth * parseFloat(scale)),
    svgHeight: Math.round(svgHeight * parseFloat(scale))
  };
};
