import { module, test } from 'qunit';
import Oauth1Provider from 'torii/providers/oauth1';

module(
  'Unit | Provider | MockOauth1Provider (oauth1 subclass)',
  function (hooks) {
    const params = {
      name: 'mock-oauth1',
      baseUrl: 'http://example.com',
      redirectUri: 'http://foo',
    };

    test('Provider requires a requestTokenUri', function (assert) {
      // @ts-expect-error testing missing params
      const provider = new Oauth1Provider(params);
      assert.throws(function () {
        provider.buildRequestTokenUrl();
      }, /Expected configuration value requestTokenUri to be defined.*mock-oauth1/);
    });

    test('buildRequestTokenUrl generates a URL with required config', function (assert) {
      const provider = new Oauth1Provider({
        ...params,
        requestTokenUri: 'http://expectedUrl.com',
      });

      assert.equal(
        provider.buildRequestTokenUrl(),
        'http://expectedUrl.com',
        'generates the correct URL'
      );
    });
  }
);
