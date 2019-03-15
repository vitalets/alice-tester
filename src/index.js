/**
 * Alice tester.
 */

const User = require('./user');
const recorder = require('./recorder');

/* istanbul ignore if */
if (process.env.ALICE_TESTER_RECORD) {
  recorder.enable(process.env.ALICE_TESTER_RECORD);
}

module.exports = User;
