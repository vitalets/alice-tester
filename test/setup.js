const assert = require('chai').assert;
const nock = require('nock');
const rejects = require('assert-rejects');
const User = require('../src');

assert.rejects = rejects;

global.assert = assert;
global.nock = nock;
global.User = User;

beforeEach(() => {
  // reset counter before each test to have consistent requests
  User.counter = 0;
});
