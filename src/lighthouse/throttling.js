const { throttling } = require('lighthouse/lighthouse-core/config/constants');

const { DEVTOOLS_RTT_ADJUSTMENT_FACTOR, DEVTOOLS_THROUGHPUT_ADJUSTMENT_FACTOR } = throttling;

// extend LH's throttling with our own
module.exports = Object.assign({

}, throttling);

if (!module.exports.mobile3G && module.exports.mobileSlow4G) {
  // backward compatibility since LH renamed 3G
  module.exports.mobile3G = module.exports.mobileSlow4G;
}
