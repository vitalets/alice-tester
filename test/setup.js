const assert = require('chai').assert;
const nock = require('nock');
const rejects = require('assert-rejects');
const sinon = require('sinon');
const User = require('../src');

assert.rejects = rejects;

global.assert = assert;
global.nock = nock;
global.sinon = sinon;
global.User = User;

beforeEach(() => {
  sinon.stub(Date, 'now').callsFake(() => 1);
  sinon.stub(Math, 'random').callsFake(() => 0.5);
});

afterEach(() => {
  sinon.restore();
});
