import { module, test } from 'qunit';
import Oauth2BearerProvider from 'torii/providers/oauth2-bearer';

module(
  'Unit | Provider | MockOauth2Provider (oauth2-bearer subclass)',

  function (hooks) {
    const params = {
      name: 'mock-oauth2',
      baseUrl: 'http://example.com',
      redirectUri: 'http://foo',
      responseParams: ['state', 'access_token'],
    };

    class Provider extends Oauth2BearerProvider {
      // @ts-expect-error
      get popup() {
        return {
          // @ts-expect-error
          async open(_1, _2, assert) /*url, responseParams*/ {
            assert && assert.ok(true, 'calls popup.open');
            return { state: 'state' };
          },
        };
      }
    }

    // NOTE: with the current implementation it does not make sense any more
    // test('BaseProvider subclass must have baseUrl', function (assert) {
    //   // @ts-expect-error testing missing params
    //   const provider = new Oauth2BearerProvider({});

    //   this.pauseTest();

    //   assert.throws(function () {
    //     provider.buildUrl();
    //   }, /Definition of property baseUrl by a subclass is required./);
    // });

    test('Provider generates a URL with required config', function (assert) {
      const provider = new Provider({ ...params, apiKey: 'dummyKey' });
      assert.equal(
        provider.buildUrl(),
        'http://example.com?response_type=token&client_id=dummyKey&redirect_uri=http%3A%2F%2Ffoo&state=' +
          provider.state,
        'generates the correct URL'
      );
    });

    test('Provider generates a URL with optional scope', function (assert) {
      const provider = new Provider({
        ...params,
        apiKey: 'dummyKey',
        scope: 'someScope',
      });

      assert.equal(
        provider.buildUrl(),
        'http://example.com?response_type=token&client_id=dummyKey&redirect_uri=http%3A%2F%2Ffoo&state=' +
          provider.state +
          '&scope=someScope',
        'generates the correct URL'
      );
    });

    test('Provider#open assert.throws when any required response params are missing', function (assert) {
      assert.expect(3);

      const provider = new Provider({
        ...params,
        apiKey: 'dummyKey',
        scope: 'someScope',
      });

      return provider
        .open(assert)
        ?.then(function () {
          assert.ok(false, '#open should not resolve');
        })
        .catch(function (error: Error) {
          assert.ok(true, 'failed');
          const message = error.toString().split('\n')[0];
          assert.equal(
            message,
            'Error: The response from the provider is missing these required response params: access_token'
          );
        });
    });
  }
);
