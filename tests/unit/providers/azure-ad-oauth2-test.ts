import { module, test } from 'qunit';
import AzureAdOauth2Provider, {
  AzureAdOauth2ProviderParams,
} from 'torii/providers/azure-ad-oauth2';

function urlFromParams(params: {}): string {
  return Object.entries(params)
    .map((entry) => entry.join('='))
    .join('&');
}

module('Unit | Provider | AzureAdOAuth2Provider', function (hooks) {
  test('Provider requires an apiKey', function (assert) {
    assert.throws(function () {
      const provider = new AzureAdOauth2Provider(
        {} as AzureAdOauth2ProviderParams
      );
      provider.buildUrl();
    }, /Expected configuration value apiKey to be defined.*azure-ad-oauth2/);
  });

  test('Provider generates a URL with required config', function (assert) {
    const provider = new AzureAdOauth2Provider({
      apiKey: 'abcdef',
    });

    const params = {
      response_type: 'code',
      client_id: 'abcdef',
      redirect_uri: encodeURIComponent(provider.redirectUri),
      state: provider.state,
      api_version: '1.0',
    };

    var expectedUrl = `${provider.baseUrl}?${urlFromParams(params)}`;

    assert.equal(provider.buildUrl(), expectedUrl, 'generates the correct URL');
  });

  test('Provider generates a URL with required config including the tennantId', function (assert) {
    const provider = new AzureAdOauth2Provider({
      apiKey: 'abcdef',
      tennantId: 'very-long-guid',
    });

    const params = {
      response_type: 'code',
      client_id: 'abcdef',
      redirect_uri: encodeURIComponent(provider.redirectUri),
      state: provider.state,
      api_version: '1.0',
    };

    var expectedUrl = `${provider.baseUrl}?${urlFromParams(params)}`;

    assert.equal(provider.buildUrl(), expectedUrl, 'generates the correct URL');
    assert.ok(provider.baseUrl.indexOf('very-long-guid') !== -1);
  });

  test('Provider generates a URL with required config when using id_token', function (assert) {
    const provider = new AzureAdOauth2Provider({
      apiKey: 'abcdef',
      responseType: 'id_token',
      responseMode: 'query',
      scope: 'openid email',
    });

    const params = {
      response_type: 'id_token',
      client_id: 'abcdef',
      redirect_uri: encodeURIComponent(provider.redirectUri),
      state: provider.state,
      api_version: '1.0',
      scope: 'openid%20email',
      response_mode: 'query',
    };

    var expectedUrl = `${provider.baseUrl}?${urlFromParams(params)}`;
    assert.equal(provider.buildUrl(), expectedUrl, 'generates the correct URL');
  });
});
