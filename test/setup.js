const assert = require('chai').assert;
const nock = require('nock');
const rejects = require('assert-rejects');
const User = require('../src');

assert.rejects = rejects;

global.assert = assert;
global.nock = nock;
global.User = User;

beforeEach(() => {
  User.config.generateUserId = () => 'user-1';
});

afterEach(() => {
  User.config.restore();
});
