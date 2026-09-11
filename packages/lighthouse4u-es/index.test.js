/**
 * Unit tests for lighthouse4u-es
 * 
 * Tests ES 8 client compatibility:
 * - No 'type' parameter in requests (removed in ES 7)
 * - Response body unwrapping (ES 8 returns body directly)
 * - Request body flattening (ES 8 style)
 */

const { stub } = require('sinon');
const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const { expect } = chai;
const proxyquire = require('proxyquire');

describe('lighthouse4u-es', () => {
  let StoreES, mockClient, mockIndices;

  beforeEach(() => {
    // Mock ES client methods
    mockIndices = {
      create: stub().resolves({ acknowledged: true })
    };
    
    mockClient = {
      indices: mockIndices,
      index: stub().resolves({ _id: 'doc-123', result: 'created' }),
      get: stub().resolves({ _id: 'doc-123', _source: { id: 'doc-123', url: 'https://example.com' } }),
      search: stub().resolves({ hits: { hits: [{ _id: 'doc-1', _source: { url: 'https://example.com' } }] } })
    };

    // Stub the ES client constructor
    const mockElasticsearch = {
      Client: stub().returns(mockClient)
    };

    StoreES = proxyquire('./index', {
      '@elastic/elasticsearch': mockElasticsearch
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('ES 8 compatibility', () => {
    
    describe('type parameter removal', () => {
      it('write() does not include type parameter', async () => {
        const store = new StoreES({ client: { node: 'http://localhost:9200' }, index: { name: 'test-index' } });
        await store.write({ id: 'test-1', data: 'value' });
        
        expect(mockClient.index).to.have.been.calledOnce;
        const callArgs = mockClient.index.firstCall.args[0];
        expect(callArgs).to.not.have.property('type');
        expect(callArgs).to.have.property('index', 'test-index');
      });

      it('read() does not include type parameter', async () => {
        const store = new StoreES({ client: { node: 'http://localhost:9200' }, index: { name: 'test-index' } });
        await store.read('doc-123');
        
        expect(mockClient.get).to.have.been.calledOnce;
        const callArgs = mockClient.get.firstCall.args[0];
        expect(callArgs).to.not.have.property('type');
        expect(callArgs).to.have.property('index', 'test-index');
      });

      it('list() does not include type parameter', async () => {
        const store = new StoreES({ client: { node: 'http://localhost:9200' }, index: { name: 'test-index' } });
        await store.list('example.com');
        
        expect(mockClient.search).to.have.been.calledOnce;
        const callArgs = mockClient.search.firstCall.args[0];
        expect(callArgs).to.not.have.property('type');
        expect(callArgs).to.have.property('index', 'test-index');
      });

      it('initialize() does not include type parameter', async () => {
        const store = new StoreES({ 
          client: { node: 'http://localhost:9200' }, 
          index: { name: 'test-index', settings: {}, mappings: {} } 
        });
        await store.initialize();
        
        expect(mockIndices.create).to.have.been.calledOnce;
        const callArgs = mockIndices.create.firstCall.args[0];
        expect(callArgs).to.not.have.property('type');
      });
    });

    describe('request body flattening', () => {
      it('write() uses document instead of body', async () => {
        const store = new StoreES({ client: { node: 'http://localhost:9200' }, index: { name: 'test-index' } });
        const doc = { id: 'test-1', url: 'https://example.com' };
        await store.write(doc);
        
        const callArgs = mockClient.index.firstCall.args[0];
        expect(callArgs).to.not.have.property('body');
        expect(callArgs).to.have.property('document');
        expect(callArgs.document).to.deep.equal(doc);
      });

      it('list() flattens size and sort to root', async () => {
        const store = new StoreES({ client: { node: 'http://localhost:9200' }, index: { name: 'test-index' } });
        await store.list('example.com', { maxCount: 5, order: 'ASC' });
        
        const callArgs = mockClient.search.firstCall.args[0];
        expect(callArgs).to.not.have.property('body');
        expect(callArgs).to.have.property('size', 5);
        expect(callArgs).to.have.property('sort');
      });

      it('initialize() flattens settings and mappings to root', async () => {
        const store = new StoreES({ 
          client: { node: 'http://localhost:9200' }, 
          index: { 
            name: 'test-index', 
            settings: { number_of_shards: 1 }, 
            mappings: { properties: {} } 
          } 
        });
        await store.initialize();
        
        const callArgs = mockIndices.create.firstCall.args[0];
        expect(callArgs).to.not.have.property('body');
        expect(callArgs).to.have.property('settings');
        expect(callArgs).to.have.property('mappings');
      });
    });

    describe('response body unwrapping', () => {
      it('write() handles ES 8 direct response', async () => {
        const store = new StoreES({ client: { node: 'http://localhost:9200' }, index: { name: 'test-index' } });
        const doc = { id: 'test-1' };
        const result = await store.write(doc);
        
        expect(result.id).to.equal('doc-123'); // _id from mock response
      });

      it('read() handles ES 8 direct response', async () => {
        const store = new StoreES({ client: { node: 'http://localhost:9200' }, index: { name: 'test-index' } });
        const result = await store.read('doc-123');
        
        expect(result).to.have.property('url', 'https://example.com');
        expect(result).to.have.property('id', 'doc-123');
      });

      it('list() handles ES 8 direct response', async () => {
        const store = new StoreES({ client: { node: 'http://localhost:9200' }, index: { name: 'test-index' } });
        const result = await store.list('example.com');
        
        expect(result.files).to.have.length(1);
        expect(result.files[0]).to.have.property('url', 'https://example.com');
      });
    });
  });

  describe('query conversion', () => {
    it('converts domain to rootDomain query', async () => {
      const store = new StoreES({ client: { node: 'http://localhost:9200' }, index: { name: 'test-index' } });
      await store.list('example.com');
      
      const callArgs = mockClient.search.firstCall.args[0];
      expect(callArgs.q).to.equal('rootDomain:"example.com"');
    });

    it('converts full URL to requestedUrl query', async () => {
      const store = new StoreES({ client: { node: 'http://localhost:9200' }, index: { name: 'test-index' } });
      await store.list('https://example.com/page');
      
      const callArgs = mockClient.search.firstCall.args[0];
      expect(callArgs.q).to.equal('requestedUrl:"https://example.com/page"');
    });

    it('converts subdomain to domainName query', async () => {
      const store = new StoreES({ client: { node: 'http://localhost:9200' }, index: { name: 'test-index' } });
      await store.list('www.example.com');
      
      const callArgs = mockClient.search.firstCall.args[0];
      expect(callArgs.q).to.equal('domainName:"www.example.com"');
    });
  });
});
