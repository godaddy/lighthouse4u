module.exports = function getScore(doc, cat) {
  switch (doc.state) {
    case 'processed':
      return (cat in doc.categories) ? `${(doc.categories[cat].score * 100).toFixed(0)}%` : '?';
    case 'error':
      return 'error';
    default:
      return 'pending';
  }
};
