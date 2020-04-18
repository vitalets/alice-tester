describe('assert: protocol', () => {

  describe('required props', () => {

    it('response.text', async () => {
      server.setResponse({ foo: 42 });
      const user = new User();
      await assert.rejects(user.enter(), e => {
        assert.equal(e.message, 'Отсутствует обязательное поле "response.text"');
        return true;
      });
    });

  });

  describe('max length', () => {
    it('response text', async () => {
      const text = 'А'.repeat(1025);
      server.setResponse({text});
      const user = new User();

      await assert.rejects(user.enter(), e => {
        assert.equal(e.message,
          'Length of response.text (1025) is greater than allowed (1024): ААААААААААААААА...ААААААААААААААА'
        );
        return true;
      });
    });

    it('response tts', async () => {
      const tts = 'А'.repeat(1025);
      server.setResponse({text: 'text', tts});
      const user = new User();

      await assert.rejects(user.enter(), e => {
        assert.equal(e.message,
          'Length of response.tts (1025) is greater than allowed (1024): ААААААААААААААА...ААААААААААААААА'
        );
        return true;
      });
    });

    it('response button title', async () => {
      const buttons = [
        {title: 'Привет'},
        {title: 'А'.repeat(65)},
      ];
      server.setResponse({text: 'text', buttons});
      const user = new User();

      await assert.rejects(user.enter(), e => {
        assert.equal(e.message,
          'Length of response.buttons.1.title (65) is greater than allowed (64): ААААААААААААААА...ААААААААААААААА'
        );
        return true;
      });
    });

    it('response button url', async () => {
      const buttons = [
        {title: 'Привет'},
        {title: 'Ссылка', url: 'А'.repeat(1025)},
      ];
      server.setResponse({text: 'text', buttons});
      const user = new User();

      await assert.rejects(user.enter(), e => {
        assert.equal(e.message,
          'Length of response.buttons.1.url (1025) is greater than allowed (1024): ААААААААААААААА...ААААААААААААААА'
        );
        return true;
      });
    });
  });

});
