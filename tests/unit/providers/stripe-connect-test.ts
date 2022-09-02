import { module, test } from 'qunit';
import StripeConnectProvider from 'torii/providers/stripe-connect';

module('Unit | Provider | StripeConnectProvider', function (hooks) {
  test('Provider requires an apiKey', function (assert) {
    // @ts-expect-error testing missing params
    const provider = new StripeConnectProvider({});
    assert.throws(function () {
      provider.buildUrl();
    }, /Expected configuration value apiKey to be defined.*stripe-connect/);
  });

  test('Provider generates a URL with required config', function (assert) {
    const provider = new StripeConnectProvider({ apiKey: 'abcdef' });

    var expectedUrl =
      provider.baseUrl +
      '?' +
      'response_type=code' +
      '&client_id=' +
      'abcdef' +
      '&redirect_uri=' +
      encodeURIComponent(provider.redirectUri) +
      '&state=' +
      provider.state +
      '&always_prompt=false' +
      '&scope=read_write';

    assert.equal(provider.buildUrl(), expectedUrl, 'generates the correct URL');
  });

  test('Provider generates a URL with optional parameters', function (assert) {
    const provider = new StripeConnectProvider({
      apiKey: 'abcdef',
      scope: 'read_only',
      stripeLanding: 'login',
      alwaysPrompt: 'true',
    });

    var expectedUrl =
      provider.baseUrl +
      '?' +
      'response_type=code' +
      '&client_id=' +
      'abcdef' +
      '&redirect_uri=' +
      encodeURIComponent(provider.redirectUri) +
      '&state=' +
      provider.state +
      '&stripe_landing=login' +
      '&always_prompt=true' +
      '&scope=read_only';

    assert.equal(provider.buildUrl(), expectedUrl, 'generates the correct URL');
  });
});
