const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const { expect } = chai;
const getMocks = require('../../../mocks');
const path = require('path');
const proxyquire = require('proxyquire').noPreserveCache();

const libSrc = path.resolve('./src/express/api/post-website.js');

describe('/express/api/post-website', async () => {

  let lib, mocks, meta;

  beforeEach(() => {
    mocks = getMocks();
    meta = { identifier: 'test' };
    mocks.request.body = {
      'url': 'https://www.google.com/',
      'throttling': 'mobile3G',
      'group': 'web',
      'headers': {},
      'secureHeaders': { secretKey: 'secretValue' },
      'cookies': [{ cookie1: 'c1', cookie2: { domain: 'domain', url: 'url', value: 'c2' } }],
      'commands': [{ command: 'command' }],
      'meta': meta
    };
    lib = proxyquire(libSrc, mocks);
  });

  it('successful', async () => {
    await lib(mocks.request, mocks.response);
    expect(mocks.store.write).to.be.calledOnce;
    expect(mocks.store.write.args[0][0].requestedUrl).to.equal('https://www.google.com/');
    expect(mocks.store.write.args[0][0].domainName).to.equal('www.google.com');
    expect(mocks.store.write.args[0][0].rootDomain).to.equal('google.com');
    expect(mocks.response.sendStatus).to.not.be.called;
    expect(mocks.response.send).to.be.calledOnce;
    expect(mocks.response.send.args[0][0].id).to.equal('documentId');
  });

  it('fail to write', async () => {
    mocks.store.write.rejects('oops!');
    await lib(mocks.request, mocks.response);
    expect(mocks.store.write).to.be.calledOnce;
    expect(mocks.response.sendStatus).to.be.calledOnce;
    expect(mocks.response.sendStatus).to.be.calledWith(500);
  });

  it('passes through meta', async () => {
    await lib(mocks.request, mocks.response);
    expect(mocks.response.send.args[0][0].meta).to.equal(meta);
  });
});
