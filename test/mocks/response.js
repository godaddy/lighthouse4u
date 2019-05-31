const { stub } = require('sinon');

module.exports = () => {
  const ret = {
    render: stub(),
    send: stub(),
    sendStatus: stub(),
    status: stub(),
    writeHead: stub(),
    setHeader: stub(),
    end: stub()
  };

  ret.status.returns(ret);

  return ret;
}

