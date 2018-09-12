const crypto  = require('crypto');

module.exports = function decrypt(encryptedInput, secretKey, vector) {
  const hash = crypto.createHash('sha1');
  hash.update(secretKey);
  const key = hash.digest().slice(0, 16).toString('hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, vector);
  let result = decipher.update(encryptedInput, 'base64', 'utf8');
  result += decipher.final('utf8');
  return result;
};
