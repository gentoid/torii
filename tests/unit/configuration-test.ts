import ConfigureService from 'torii/configuration';
import { module, test } from 'qunit';

module('Unit | Configuration', function (hooks) {
  interface Config {
    apiKey: string;
    scope?: string;
    redirectUri?: string;
  }

  class Testable extends ConfigureService<Config> {}

  test('it should throw when reading a value not defaulted', function (assert) {
    let threw = false;
    let message;

    try {
      const testable = new Testable({ name: 'test' }, {} as Config);
      testable.getValue('apiKey');
    } catch (error: any) {
      threw = true;
      message = error.message;
    }

    assert.ok(threw, 'read threw');
    assert.ok(
      /Expected configuration value apiKey to be defined for provider named test/.test(
        message
      ),
      'did not have proper error: ' + message
    );
  });

  test('it should read values', function (assert) {
    const testable = new Testable({ name: 'test' }, { apiKey: 'item val' });

    assert.equal(testable.getValue('apiKey'), 'item val');
  });

  test('it should read default values', function (assert) {
    const testable = new Testable(
      { name: 'test' },
      { apiKey: 'item val', scope: 'email' }
    );
    assert.equal(testable.getValue('scope'), 'email');
  });

  test('it should override default values', function (assert) {
    const testable = new Testable(
      { name: 'test' },
      { apiKey: 'api key', scope: 'email' }
    );

    testable.setValue('scope', 'baz');

    assert.equal(testable.getValue('scope'), 'baz');
  });

  test('it read default values from a function', function (assert) {
    const testable = new Testable({ name: 'test' }, { apiKey: 'api key' });

    assert.equal(
      testable.getValue('redirectUri', () => 'foo'),
      'foo'
    );
  });
});
