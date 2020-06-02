const URL = require('url');
const elasticsearch = require('@elastic/elasticsearch');
const { defaultsDeep } = require('lodash');
const defaultOptions = require('./default-options.json');

module.exports = class StoreES {
  constructor(options) {
    this.config = defaultsDeep({}, options, defaultOptions);
    this.client = new elasticsearch.Client(this.config.client);
  }

  initialize() {
    const mapping = {
      index: this.config.index.name,
      type: this.config.index.type,
      body: {
        settings: this.config.index.settings,
        mappings: this.config.index.mappings
      }
    };
  
    const promise = this.client.indices.create(mapping);	
    console.log('Elasticsearch index created:', mapping);	
    return promise;
  }

  read(Key, { etag } = {}) {
    return this.client.get({
      index: this.config.index.name,	
      type: this.config.index.type,	
      id: Key	
    }).then(({ body }) => {
      const ret = body._source;

      ret.id = Key;

      return ret;
    });
  }

  list(query, { resumeKey, maxCount = 10, order = 'DESC' } = {}) {
    const q = convertQueryToES(query);
    return this.client.search({	
      index: this.config.index.name,	
      type: this.config.index.type,	
      q,
      body: {	
        size: maxCount,
        sort: [{ createDate: { order: order.toLowerCase() }}]	
      }	
    }).then(({ body }) => {
      const { hits } = body;
      const files = hits.hits.map(hit => {
        const ret = hit._source;
        ret.id = hit._id;

        return ret;
      });

      return {
        resumeKey: null, // TODO
        files
      }
    });
  }

  async find(url, opts) {
    return this.list(url, opts);
  }

  write(data, { meta = {} } = {}) {
    return this.client.index({	
      index: this.config.index.name,	
      type: this.config.index.type,	
      id: data.id,
      body: data	
    }).then(({ body }) => {
      data.id = body._id;

      return data;
    });
  }
}

function convertQueryToES(val) {
  const protoMatch = /^https?:\/\/(.*)/i.exec(val);
  const protoLess = protoMatch ? protoMatch[1] : val;
  if (/\//.test(protoLess)) return `requestedUrl:"${val}"`;
  else if (/\.(.*)\./.test(val)) return `domainName:"${protoLess}"`;
  else if (/\./.test(val)) return `rootDomain:"${protoLess}"`;
  else if (/id:/.test(protoLess)) return protoLess; // passthrough if ID
  return `group:"${protoLess}"`;
}	
