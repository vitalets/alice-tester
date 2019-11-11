const chai = require('chai');
const getPort = require('get-port');
const assertRejects = require('assert-rejects');
const server = require('./helpers/server');
const User = require('../src');
const chaiSubset = require('chai-subset');

chai.config.truncateThreshold = 0;
chai.assert.rejects = assertRejects;
chai.use(chaiSubset);

(async () => {

  before(async () => {
    await server.listen(await getPort());

    Object.assign(global, {
      assert: chai.assert,
      User,
      server,
    });
  });

  beforeEach(() => {
    User.config.webhookUrl = server.getUrl();
    User.config.generateUserId = () => 'user-1';
  });

  afterEach(async () => {
    server.reset();
    User.config.restore();
  });

  after(async () => {
    await server.close();
  });

})();
