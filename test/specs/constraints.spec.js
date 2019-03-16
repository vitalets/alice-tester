
const {createEnterRequest, createResponse} = require('../protocol');

describe('constraints', () => {
  it('response text', async () => {
    const reqBody = createEnterRequest();
    const text = 'А'.repeat(1025);
    const resBody = createResponse({response: {text}});
    const scope = nock('http://localhost').post('/', reqBody).reply(200, resBody);

    const user = new User('http://localhost');
    await assert.rejects(user.enter(),
      'Length of response.text (1025) is greater than allowed (1024): ААААААААААААААА...ААААААААААААААА'
    );
    scope.done();
  });

  it('response tts', async () => {
    const reqBody = createEnterRequest();
    const tts = 'А'.repeat(1025);
    const resBody = createResponse({response: {tts}});
    const scope = nock('http://localhost').post('/', reqBody).reply(200, resBody);

    const user = new User('http://localhost');
    await assert.rejects(user.enter(),
      'Length of response.tts (1025) is greater than allowed (1024): ААААААААААААААА...ААААААААААААААА'
    );
    scope.done();
  });

  it('response button title', async () => {
    const reqBody = createEnterRequest();
    const buttons = [
      {title: 'Привет'},
      {title: 'А'.repeat(65)},
    ];
    const resBody = createResponse({response: {buttons}});
    const scope = nock('http://localhost').post('/', reqBody).reply(200, resBody);

    const user = new User('http://localhost');
    await assert.rejects(user.enter(),
      'Length of response.buttons.1.title (65) is greater than allowed (64): ААААААААААААААА...ААААААААААААААА'
    );
    scope.done();
  });

  it('response button url', async () => {
    const reqBody = createEnterRequest();
    const buttons = [
      {title: 'Привет'},
      {title: 'Ссылка', url: 'А'.repeat(1025)},
    ];
    const resBody = createResponse({response: {buttons}});
    const scope = nock('http://localhost').post('/', reqBody).reply(200, resBody);

    const user = new User('http://localhost');
    await assert.rejects(user.enter(),
      'Length of response.buttons.1.url (1025) is greater than allowed (1024): ААААААААААААААА...ААААААААААААААА'
    );
    scope.done();
  });

});
