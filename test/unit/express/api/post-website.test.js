const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const { expect } = chai;
const getMocks = require('../../../mocks');
const path = require('path');
const proxyquire = require('proxyquire').noPreserveCache();

const libSrc = path.resolve('./src/express/api/post-website.js');

describe('/express/api/post-website', async () => {

  let lib, mocks;

  beforeEach(() => {
    mocks = getMocks();
    mocks.request.body = {
      'url': 'https://www.google.com/',
      'throttling': 'mobile3G',
      'group': 'web',
      'headers': {},
      'secureHeaders': { secretKey: 'secretValue' }
    };
    lib = proxyquire(libSrc, mocks);
  });

  it('successful', async () => {
    await lib(mocks.request, mocks.response);
    expect(mocks.esclient.index).to.be.calledOnce;
    expect(mocks.esclient.index.args[0][0].body.requestedUrl).to.equal('https://www.google.com/');
    expect(mocks.esclient.index.args[0][0].body.domainName).to.equal('www.google.com');
    expect(mocks.esclient.index.args[0][0].body.rootDomain).to.equal('google.com');
    expect(mocks.amqplib._client._channel.sendToQueue).to.be.calledOnce;
    expect(mocks.response.sendStatus).to.not.be.called;
    expect(mocks.response.send).to.be.calledOnce;
    expect(mocks.response.send.args[0][0].id).to.equal('documentId');
  });

  it('secretKey not defined', async () => {
    mocks.config.amqp.secretKey = null;
    await lib(mocks.request, mocks.response);
    expect(mocks.esclient.index).to.not.be.called;
    expect(mocks.amqplib._client._channel.sendToQueue).to.not.be.called;
    expect(mocks.response.status).to.be.calledWith(400);
  });

  it('fail to index', async () => {
    mocks.esclient.index.rejects('oops!');
    await lib(mocks.request, mocks.response);
    expect(mocks.esclient.index).to.be.calledOnce;
    expect(mocks.response.sendStatus).to.be.calledOnce;
    expect(mocks.response.sendStatus).to.be.calledWith(500);
  });

});
