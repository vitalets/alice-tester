
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const {createRequest, createEnterRequest, createResponse} = require('../protocol');
const config = require('../../src/config');
const recorder = require('../../src/recorder');

describe('recorder', () => {

  const file = '.temp/responses.json';

  beforeEach(() => {
    rimraf.sync(path.dirname(file));
  });

  afterEach(() => {
    config.recorderFile = '';
  });

  it('record unique responses', async () => {
    config.recorderFile = file;

    const reqBody1 = createEnterRequest();
    const resBody1 = createResponse({response: {text: 'Привет!', tts: 'Прив+ет!'}});

    const reqBody2 = createRequest({
      session: {new: false, message_id: 2},
      request: {command: 'Что ты умеешь?', original_utterance: 'Что ты умеешь?'}
    });
    const reqBody3 = createRequest({
      session: {new: false, message_id: 3},
      request: {command: 'Что ты умеешь?', original_utterance: 'Что ты умеешь?'}
    });
    const resBody23 = createResponse({response: {text: 'Я умею все!', tts: 'Я умею все!'}});

    const scope = nock('http://localhost')
      .post('/', reqBody1)
      .reply(200, resBody1)
      .post('/', reqBody2)
      .reply(200, resBody23)
      .post('/', reqBody3)
      .reply(200, resBody23);

    const user = new User('http://localhost');
    await user.enter();
    await user.say('Что ты умеешь?');
    await user.say('Что ты умеешь?');

    recorder._save();

    const responses = JSON.parse(fs.readFileSync(file, 'utf8'));

    scope.done();
    assert.deepEqual(responses, [
      {
        text: 'Привет!',
        tts: 'Прив+ет!',
      },
      {
        text: 'Я умею все!',
        tts: 'Я умею все!',
      }
    ]);
  });

  it('dont record if not enabled', async () => {
    config.recorderFile = '';

    const reqBody1 = createEnterRequest();
    const resBody1 = createResponse({response: {text: 'Привет!', tts: 'Прив+ет!'}});

    const scope = nock('http://localhost')
      .post('/', reqBody1)
      .reply(200, resBody1);

    const user = new User('http://localhost');
    await user.enter();

    recorder._save();

    scope.done();
    assert.notOk(fs.existsSync(file));
  });

});
