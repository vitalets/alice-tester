describe('constraints', () => {
  it('response text', async () => {
    const text = 'А'.repeat(1025);
    server.setResponse({text});
    const user = new User();
    await assert.rejects(user.enter(),
      'Length of response.text (1025) is greater than allowed (1024): ААААААААААААААА...ААААААААААААААА'
    );
  });

  it('response tts', async () => {
    const tts = 'А'.repeat(1025);
    server.setResponse({tts});
    const user = new User();
    await assert.rejects(user.enter(),
      'Length of response.tts (1025) is greater than allowed (1024): ААААААААААААААА...ААААААААААААААА'
    );
  });

  it('response button title', async () => {
    const buttons = [
      {title: 'Привет'},
      {title: 'А'.repeat(65)},
    ];
    server.setResponse({buttons});
    const user = new User();
    await assert.rejects(user.enter(),
      'Length of response.buttons.1.title (65) is greater than allowed (64): ААААААААААААААА...ААААААААААААААА'
    );
  });

  it('response button url', async () => {
    const buttons = [
      {title: 'Привет'},
      {title: 'Ссылка', url: 'А'.repeat(1025)},
    ];
    server.setResponse({buttons});
    const user = new User();
    await assert.rejects(user.enter(),
      'Length of response.buttons.1.url (1025) is greater than allowed (1024): ААААААААААААААА...ААААААААААААААА'
    );
  });

});
