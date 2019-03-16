
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const {createRequest, createResponse} = require('../protocol');
const recorder = require('../../src/recorder');

describe('recorder', () => {

  const dataFile = '.temp/responses.json';

  afterEach(() => {
    recorder.disable();
  });

  it('enable/disable', async () => {
    recorder.enable(dataFile);
    assert.ok(recorder.enabled);
    recorder.disable();
    assert.notOk(recorder.enabled);
  });

  it('clear existing file', async () => {
    if (!fs.existsSync(dataFile)) {
      mkdirp.sync(path.dirname(dataFile));
      fs.writeFileSync(dataFile, '[]', 'utf8');
    }
    recorder.enable(dataFile);
    assert.notOk(fs.existsSync(dataFile));
  });

  it('record unique responses', async () => {
    recorder.enable(dataFile);

    const reqBody1 = createRequest({session: {new: true, message_id: 1}});
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

    const responses = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

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

});
