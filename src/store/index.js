const getSafeDocument = require('../util/get-safe-document');
const getClient = require('../util/get-client');

module.exports = class Storage {
  constructor(globalConfig) {
    this.config = globalConfig;
    // use `reader` config if avail, otherwise default to `store`
    this.readerConfig = this.config.reader || this.config.store;
    // use `writer` config if avail, otherwise default to `store`
    this.writerConfig = this.config.writer || this.config.store;
    if (!this.readerConfig) throw new Error('Storage requires either `reader` or `store` config');
    if (!this.writerConfig) throw new Error('Storage requires either `writer` or `store` config');

    this.readerClient = getClient(this.readerConfig);
    this.writerClient = getClient(this.writerConfig);
  }

  write(data, opts) {
    if (/^id:/.test(data.id)) data.id = data.id.substr(3); // remove prefix
    return this.writerClient.write(getSafeDocument(data), opts)
      .then(doc => {
        doc.id = `id:${doc.id}`; // prefix id's before forwarding
        return doc;
      })
    ;
  }

  query(query, opts) {
    const isReadQuery = /^id:/.test(query);
    if (isReadQuery) query = query.substr(3); // remove prefix before passing on to client
    else if (!/^http(s)?:/i.test(query)) query = `http://${query}`; // fully qualify URL, scheme is non-critical other than for parsing

    return this.readerClient[isReadQuery ? 'read' : 'find'](query, opts).then(data => {
      if (!data) return data;

      const mod = f => { f.id = `id:${f.id}`; };
      if (data.files && Array.isArray(data.files)) { // files is array
        data.files.forEach(mod);
      } else { // data is file
        mod(data);
      }

      return data;
    });
  }
};
