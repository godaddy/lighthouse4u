const { stub } = require('sinon');
const chai = require('chai');
const sinon = require('sinon');
chai.use(require('sinon-chai'));
const { expect } = chai;
const getMocks = require('../../mocks');
const path = require('path');

const libSrc = path.resolve('./src/util/get-score.js');

describe('/util/get-score', async () => {

  let mocks, lib, doc, cat;

  beforeEach(() => {
    mocks = getMocks();
    doc = {
      state: 'processed',
      categories: {
        performance: {
          score: 0.59
        }
      }
    };
    cat = 'performance';
    lib = require(libSrc);
  });

  it('returns 59%', async () => {
    const result = lib(doc, cat);
    expect(result).to.equal('59%');
  });

  it('does not handle greater tenths of a percentage', async () => {
    doc.categories.performance.score = 0.591;
    const result = lib(doc, cat);
    expect(result).to.equal('59%');
  });

  it('error state', async () => {
    doc.state = 'error';
    const result = lib(doc, cat);
    expect(result).to.equal('error');
  });

  it('any unknown state is pending', async () => {
    doc.state = 'something unknown';
    const result = lib(doc, cat);
    expect(result).to.equal('pending');
  });

  it('unknown category', async () => {
    cat = 'something unknown'
    const result = lib(doc, cat);
    expect(result).to.equal('?');
  });

});

