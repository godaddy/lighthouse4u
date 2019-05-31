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

  it('get by q', async () => {
    mocks.request.query.q = 'documentId';
    await lib(mocks.request, mocks.response);
    expect(mocks.store.query).to.be.calledOnce;
    expect(mocks.response.send).to.be.calledOnce;
  });

  it('fail to get by q', async () => {
    expect(mocks.store.query).to.not.be.called;
    await lib(mocks.request, mocks.response);
    expect(mocks.store.query).to.not.be.called;
    expect(mocks.response.sendStatus).to.be.calledOnce;
    expect(mocks.response.sendStatus).to.be.calledWith(400);
  });

  it('get by domainName', async () => {
    mocks.request.query.domainName = 'domainName';
    await lib(mocks.request, mocks.response);
    expect(mocks.response.send).to.be.calledOnce;
  });

  it('get SVG', async () => {
    mocks.request.query.q = 'documentId';
    mocks.request.query.format = 'svg';
    await lib(mocks.request, mocks.response);
    expect(mocks.store.query).to.be.calledOnce;
    expect(mocks.store.query.args[0][0]).to.equal('documentId');
    expect(mocks.response.render).to.be.calledOnce;
    expect(mocks.response.render.args[0][1].requestedUrl).to.equal('requestedUrl');
    expect(mocks.response.render.args[0][1].state).to.equal('processed');
    expect(mocks.response.setHeader).to.be.calledOnce;
  });

  it('get SVG in pending state', async () => {
    mocks.request.query.q = 'documentId';
    mocks.request.query.format = 'svg';
    mocks.store['$document'].state = 'pending';
    await lib(mocks.request, mocks.response);
    expect(mocks.store.query).to.be.calledOnce;
    expect(mocks.response.render).to.be.calledOnce;
    expect(mocks.store.query.args[0][0]).to.equal('documentId');
    expect(mocks.response.render.args[0][1].requestedUrl).to.equal('requestedUrl');
    expect(mocks.response.render.args[0][1].state).to.equal('pending');
    expect(mocks.response.setHeader).to.be.calledOnce;
  });

  it('get SVG in error state', async () => {
    mocks.request.query.q = 'documentId';
    mocks.request.query.format = 'svg';
    mocks.store['$document'].state = 'error';
    await lib(mocks.request, mocks.response);
    expect(mocks.store.query).to.be.calledOnce;
    expect(mocks.store.query.args[0][0]).to.equal('documentId');
    expect(mocks.response.render).to.be.calledOnce;
    expect(mocks.response.render.args[0][1].requestedUrl).to.equal('requestedUrl');
    expect(mocks.response.render.args[0][1].state).to.equal('error');
    expect(mocks.response.setHeader).to.be.calledOnce;
  });

});
