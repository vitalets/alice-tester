describe('stop-words', () => {

  it('stop word in response text', async () => {
    server.setResponse({ text: 'Привет, undefined' });
    const user = new User();
    await assert.rejects(user.enter(), e => {
      assert.equal(e.message, 'Stop word "undefined" found in response.text: "Привет, undefined"');
      return true;
    });
  });

  it('stop word in response tts', async () => {
    server.setResponse({ text: 'Привет', tts: 'Привет, NaN' });
    const user = new User();
    await assert.rejects(user.enter(), e => {
      assert.equal(e.message, 'Stop word "NaN" found in response.tts: "Привет, NaN"');
      return true;
    });
  });

  it('stop word in card.title', async () => {
    server.setResponse({ text: 'Привет', tts: 'Привет', card: { title: 'null' } });
    const user = new User();
    await assert.rejects(user.enter(), e => {
      assert.equal(e.message, 'Stop word "null" found in response.card.title: "null"');
      return true;
    });
  });

  it('stop word in card.description', async () => {
    server.setResponse({ text: 'Привет', tts: 'Привет', card: { description: 'это false' } });
    const user = new User();
    await assert.rejects(user.enter(), e => {
      assert.equal(e.message, 'Stop word "false" found in response.card.description: "это false"');
      return true;
    });
  });

  it('stop word as regexp', async () => {
    User.config.stopWords = [ /[a-z]+/i ];
    server.setResponse({ text: 'Привет, blabla' });
    const user = new User();
    await assert.rejects(user.enter(), e => {
      assert.equal(e.message, 'Stop word "/[a-z]+/i" found in response.text: "Привет, blabla"');
      return true;
    });
  });

});
