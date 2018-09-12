const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const { expect } = chai;
const getMocks = require('../../../mocks');
const path = require('path');
const proxyquire = require('proxyquire').noPreserveCache();

const libSrc = path.resolve('./src/express/api/get-website.js');

describe('/express/api/get-website', async () => {

  let lib, mocks;

  beforeEach(() => {
    mocks = getMocks();
    lib = proxyquire(libSrc, mocks);
  });

  it('get by documentId', async () => {
    mocks.request.query.documentId = 'documentId';
    await lib(mocks.request, mocks.response);
    expect(mocks.esclient.get).to.be.calledOnce;
    expect(mocks.esclient.get.args[0][0]).to.deep.equal({ index: 'lh4u', type: 'lh4u', id: 'documentId' });
    expect(mocks.response.send).to.be.calledOnce;
    expect(mocks.response.send.args[0][0][0].id).to.equal('documentId');
  });

  it('fail to get by documentId', async () => {
    delete mocks.request.app;
    await lib(mocks.request, mocks.response);
    expect(mocks.esclient.get).to.not.be.called;
    expect(mocks.response.sendStatus).to.be.calledOnce;
    expect(mocks.response.sendStatus).to.be.calledWith(400);
  });

  it('get by domainName', async () => {
    mocks.request.query.domainName = 'domainName';
    await lib(mocks.request, mocks.response);
    expect(mocks.esclient.search).to.be.calledOnce;
    expect(mocks.esclient.search.args[0][0]).to.deep.equal({
      index: mocks.config.elasticsearch.index.name,
      type: mocks.config.elasticsearch.index.type,
      q: 'domainName:"domainName"',
      body: {
        size: 1,
        sort: [{ createDate: { order: 'desc' }}]
      }
    });
    expect(mocks.response.send).to.be.calledOnce;
    expect(mocks.response.send.args[0][0][0].id).to.equal('documentId');
  });

  it('get SVG', async () => {
    mocks.request.query.documentId = 'documentId';
    mocks.request.query.format = 'svg';
    await lib(mocks.request, mocks.response);
    expect(mocks.esclient.get).to.be.calledOnce;
    expect(mocks.esclient.get.args[0][0]).to.deep.equal({ index: 'lh4u', type: 'lh4u', id: 'documentId' });
    expect(mocks.response.render).to.be.calledOnce;
    expect(mocks.response.render.args[0][1].requestedUrl).to.equal('requestedUrl');
    expect(mocks.response.setHeader).to.be.calledOnce;
  });

  it('get SVG in pending state', async () => {
    mocks.esclient._doc._source.state = 'pending';
    mocks.request.query.documentId = 'documentId';
    mocks.request.query.format = 'svg';
    await lib(mocks.request, mocks.response);
    expect(mocks.esclient.get).to.be.calledOnce;
    expect(mocks.esclient.get.args[0][0]).to.deep.equal({ index: 'lh4u', type: 'lh4u', id: 'documentId' });
    expect(mocks.response.render).to.be.calledOnce;
    expect(mocks.response.render.args[0][1].requestedUrl).to.equal('requestedUrl');
    expect(mocks.response.render.args[0][1].state).to.equal('pending');
    expect(mocks.response.setHeader).to.be.calledOnce;
  });

  it('get SVG in error state', async () => {
    mocks.esclient._doc._source.state = 'error';
    mocks.request.query.documentId = 'documentId';
    mocks.request.query.format = 'svg';
    await lib(mocks.request, mocks.response);
    expect(mocks.esclient.get).to.be.calledOnce;
    expect(mocks.esclient.get.args[0][0]).to.deep.equal({ index: 'lh4u', type: 'lh4u', id: 'documentId' });
    expect(mocks.response.render).to.be.calledOnce;
    expect(mocks.response.render.args[0][1].requestedUrl).to.equal('requestedUrl');
    expect(mocks.response.render.args[0][1].state).to.equal('error');
    expect(mocks.response.setHeader).to.be.calledOnce;
  });

});
