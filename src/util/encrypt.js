const crypto  = require('crypto');

module.exports = function encrypt(input, secretKey, vector) {
  const hash = crypto.createHash('sha1');
  hash.update(secretKey);
  const key = hash.digest().slice(0, 16).toString('hex');
  const cipher = crypto.createCipheriv('aes-256-cbc', key, vector);
  let result = cipher.update(input, 'utf8', 'base64');
  result += cipher.final('base64');
  return result;
};
