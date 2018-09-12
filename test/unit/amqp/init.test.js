const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const { expect } = chai;
const getMocks = require('../../mocks');
const proxyquire = require('proxyquire').noPreserveCache();
const path = require('path');

const libSrc = path.resolve('./src/amqp/init.js');

describe('/amqp/init', async () => {

  let lib, mocks;

  beforeEach(() => {
    mocks = getMocks();
    lib = proxyquire(libSrc, mocks);
  });

  it('init successful', async () => {
    await lib(mocks.config, mocks.amqplib.connect());
    expect(mocks.amqplib.connect).to.be.called;
  });

});