/**
 * Alice tester.
 */

const User = require('./user');
const recorder = require('./recorder');

recorder.file = process.env.ALICE_TESTER_RECORD || '';

module.exports = User;
