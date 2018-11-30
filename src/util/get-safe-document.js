module.exports = function getSafeDocument(document) {
  const { secureHeaders, cipherVector, commands, cookies, ...safeDocument } = document;

  return safeDocument;
};
