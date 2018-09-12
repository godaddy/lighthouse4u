const { stub } = require('sinon');
const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const { expect } = chai;
const getMocks = require('../../mocks');
const path = require('path');
const proxyquire = require('proxyquire').noPreserveCache();

const libSrc = path.resolve('./src/amqp/client.js');

describe('/amqp/client', async () => {

  let mocks, lib, config;

  beforeEach(() => {
    mocks = getMocks();
    config = mocks.config;
    lib = proxyquire(libSrc, mocks);
  });

  it('works with valid config', async () => {
    await lib(config);
    expect(mocks.amqplib.connect).to.be.called;
  });

  it('rejects if invalid config', async () => {
    config.amqp = null;
    let err;
    try {
      await lib(config);
    } catch (ex) {
      err = ex;
    }
    expect(err).to.exist;
    expect(mocks.amqplib.connect).to.be.called;
  });

  it('rejects if connect fails', async () => {
    mocks.amqplib.connect = stub().rejects('something');
    lib = proxyquire(libSrc, mocks);
    let err;
    try {
      await lib(config);
    } catch (ex) {
      err = ex;
    }
    expect(err).to.exist;
    expect(mocks.amqplib.connect).to.be.called;
  });

});

