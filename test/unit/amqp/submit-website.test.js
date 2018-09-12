const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const { expect } = chai;
const getMocks = require('../../mocks');
const path = require('path');
const proxyquire = require('proxyquire').noPreserveCache();

const libSrc = path.resolve('./src/amqp/submit-website.js');

describe('/amqp/submit-website', async () => {

  let lib, mocks;

  beforeEach(() => {
    mocks = getMocks();
    lib = proxyquire(libSrc, mocks);
  });

  it('submit successful', async () => {
    await lib(mocks.app, mocks.rmqpMessage);
    expect(mocks.amqplib.connect).to.be.called;
    expect(mocks.amqplib._client._channel.sendToQueue).to.be.calledOnce;
    expect(mocks.amqplib._client._channel.sendToQueue.args[0][0]).to.equal('lh4u');
    expect(mocks.amqplib._client._channel.sendToQueue.args[0][1]).is.instanceof(Buffer);
  });

  it('fails if cannot write to queue', async () => {
    const client = await mocks.amqplib.connect();
    const channel = await client.createChannel();
    channel.sendToQueue.returns(false);
    let err;
    try {
      await lib(mocks.app, mocks.rmqpMessage);
    } catch (ex) {
      err = ex;
    }
    expect(mocks.amqplib.connect).to.be.called;
    expect(err).to.exist;
    expect(err.message).is.equal('Failed to write to queue');
  });

  it('fails if write to queue throws', async () => {
    const client = await mocks.amqplib.connect();
    const channel = await client.createChannel();
    channel.sendToQueue.throws(new Error('something went wrong'));
    let err;
    try {
      await lib(mocks.app, mocks.rmqpMessage);
    } catch (ex) {
      err = ex;
    }
    expect(mocks.amqplib.connect).to.be.called;
    expect(err).to.exist;
    expect(err.message).is.equal('something went wrong');
  });

});
