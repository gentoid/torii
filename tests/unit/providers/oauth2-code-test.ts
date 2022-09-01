import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import OAuth2Provider, {
  Oauth2ProviderParams,
} from 'torii/providers/oauth2-code';
import ToriiService from 'torii/services/torii';

module(
  'Unit | Provider | MockOauth2Provider (oauth2-code subclass)',
  function (hooks) {
    setupTest(hooks);

    const params = {
      name: 'mock-oauth2',
      baseUrl: 'http://example.com',
      redirectUri: 'http://foo',
      responseParams: ['state', 'authorization_code'],
    };

    const tokenParams = {
      name: 'mock-oauth2-token',
      baseUrl: 'http://example.com',
      redirectUri: 'http://foo',
      responseParams: ['authorization_code'],
      responseType: 'token_id',
    };

    test('BaseProvider subclass must have baseUrl', function (assert) {
      const provider = new OAuth2Provider({
        name: 'some name',
      } as Oauth2ProviderParams); // "as" since we're testing for missing the "baseUrl" param

      assert.throws(function () {
        provider.buildUrl();
      }, 'Expected configuration value baseUrl to be defined for provider named some name');
    });

    test('Provider requires an apiKey', function (assert) {
      const provider = new OAuth2Provider(params as Oauth2ProviderParams); // "as" since we're testing for missing the "apiKey" param

      assert.throws(function () {
        provider.buildUrl();
      }, /Expected configuration value apiKey to be defined.*mock-oauth2/);
    });

    test('Provider generates a URL with required config', function (assert) {
      const provider = new OAuth2Provider({
        ...params,
        apiKey: 'dummyKey',
      });

      assert.equal(
        provider.buildUrl(),
        `http://example.com?response_type=code&client_id=dummyKey&redirect_uri=http%3A%2F%2Ffoo&state=${provider.state}`,
        'generates the correct URL'
      );
    });

    test('Provider generates a URL with optional scope', function (assert) {
      const provider = new OAuth2Provider({
        ...params,
        apiKey: 'dummyKey',
        scope: 'someScope',
      });

      assert.equal(
        provider.buildUrl(),
        `http://example.com?response_type=code&client_id=dummyKey&redirect_uri=http%3A%2F%2Ffoo&state=${provider.state}&scope=someScope`,
        'generates the correct URL'
      );
    });

    test('Provider#open assert.throws when any required response params are missing', function (assert) {
      assert.expect(3);

      class MyProvider extends OAuth2Provider<Oauth2ProviderParams> {
        get popup() {
          return {
            async open() /*url, responseParams*/ {
              assert.ok(true, 'calls popup.open');
              return { state: 'state' };
            },
          } as unknown as ToriiService;
        }
      }

      const provider = new MyProvider({
        ...params,
        apiKey: 'dummyKey',
        scope: 'someScope',
      });

      return provider
        .open()
        ?.then(function () {
          assert.ok(false, '#open should not resolve');
        })
        .catch(function (e: Error) {
          assert.ok(true, 'failed');
          const message = e.toString().split('\n')[0];
          assert.equal(
            message,
            'Error: The response from the provider is missing these required response params: authorization_code'
          );
        });
    });

    test('should use the value of provider.responseType as key for the authorizationCode', function (assert) {
      assert.expect(2);

      class MyProvider extends OAuth2Provider<Oauth2ProviderParams> {
        get popup() {
          return {
            async open() /*url, responseParams*/ {
              assert.ok(true, 'calls popup.open');
              return {
                token_id: 'test',
                authorization_code: 'pief',
                state: 'test-state',
              };
            },
          } as unknown as ToriiService;
        }
      }

      const tokenProvider = new MyProvider({
        ...tokenParams,
        apiKey: 'dummyKey',
        scope: 'someScope',
        state: 'test-state',
      });

      return (
        tokenProvider
          .open()
          // @ts-expect-error
          ?.then(function (res: { authorizationCode: string }) {
            assert.ok(
              res.authorizationCode === 'test',
              'authenticationToken present'
            );
          })
      );
    });

    test('provider generates a random state parameter', function (assert) {
      assert.expect(1);

      const provider = new OAuth2Provider({
        ...params,
        apiKey: 'api key',
      });

      assert.ok(
        /^[A-Za-z0-9]{16}$/.test(provider.state),
        'state is 16 random characters'
      );
    });

    test('provider caches the generated random state', function (assert) {
      assert.expect(1);

      const provider = new OAuth2Provider({
        ...params,
        apiKey: 'key',
      });
      const state = provider.state;

      assert.equal(provider.state, state, 'random state value is cached');
    });

    test('can override state property', function (assert) {
      assert.expect(1);

      const provider = new OAuth2Provider({
        ...params,
        apiKey: 'api key',
        state: 'insecure-fixed-state',
      });

      assert.equal(
        provider.state,
        'insecure-fixed-state',
        'specified state property is set'
      );
    });

    test('URI-decodes the authorization code', function (assert) {
      assert.expect(1);

      class MyProvider extends OAuth2Provider<Oauth2ProviderParams> {
        get popup() {
          return {
            async open() /*url, responseParams*/ {
              return {
                token_id: encodeURIComponent('test=='),
                authorization_code: 'pief',
                state: 'test-state',
              };
            },
          } as unknown as ToriiService;
        }
      }

      const tokenProvider = new MyProvider({
        ...tokenParams,
        apiKey: 'dummyKey',
        scope: 'someScope',
        state: 'test-state',
      });

      const open = tokenProvider.open();

      return open?.then((res) => {
        assert.equal(
          // @ts-expect-error
          res.authorizationCode,
          'test==',
          'authorizationCode decoded'
        );
      });
    });
  }
);
