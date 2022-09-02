import OAuth2Provider, { Oauth2ProviderParams } from './oauth2-code';

export type Oauth2BearerProviderParams = Oauth2ProviderParams;

export default class Oauth2BearerProvider extends OAuth2Provider<Oauth2BearerProviderParams> {
  constructor(params: Oauth2BearerProviderParams) {
    super({ ...params, responseType: 'token' });
  }

  /**
   * @method open
   * @return {Promise<object>} If the authorization attempt is a success,
   * the promise will resolve an object containing the following keys:
   *   - authorizationToken: The `token` from the 3rd-party provider
   *   - provider: The name of the provider (i.e., google-oauth2)
   *   - redirectUri: The redirect uri (some server-side exchange flows require this)
   * If there was an error or the user either canceled the authorization or
   * closed the popup window, the promise rejects.
   */
  open(options: {}) {
    const name = this.name;
    const url = this.buildUrl();
    const redirectUri = this.redirectUri;
    const responseParams = this.responseParams;

    return (
      this.popup
        // @ts-expect-error
        ?.open(url, responseParams, options)
        .then(function (authData) {
          // @ts-expect-error
          const missingResponseParams = [];

          responseParams.forEach(function (param) {
            // @ts-expect-error
            if (authData[param] === undefined) {
              missingResponseParams.push(param);
            }
          });

          if (missingResponseParams.length) {
            throw new Error(
              'The response from the provider is missing ' +
                'these required response params: ' +
                // @ts-expect-error
                missingResponseParams.join(', ')
            );
          }

          return {
            authorizationToken: authData,
            provider: name,
            redirectUri: redirectUri,
          };
        })
    );
  }
}
