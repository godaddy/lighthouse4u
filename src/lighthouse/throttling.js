const { throttling } = require('lighthouse/lighthouse-core/config/constants');

// extend LH's throttling with our own
module.exports = Object.assign({

}, throttling);

if (!module.exports.mobile3G && module.exports.mobileSlow4G) {
  // backward compatibility since LH renamed 3G
  module.exports.mobile3G = module.exports.mobileSlow4G;
}
