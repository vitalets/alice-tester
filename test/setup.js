const chai = require('chai');
const nock = require('nock');
const User = require('../src');

global.assert = chai.assert;
global.nock = nock;
global.User = User;
global.assertThrowsAsync = assertThrowsAsync;

beforeEach(() => {
  // reset counter before each test to have consistent requests
  User.counter = 0;
});

async function assertThrowsAsync(fn, regExp) {
  let f = () => {};
  try {
    await fn();
  } catch(e) {
    f = () => {throw e;};
  } finally {
    assert.throws(f, regExp);
  }
}
