import BaseProvider, { BaseProviderParams } from 'torii/providers/base';
import QueryString from 'torii/lib/query-string';
import randomUrlSafe from 'torii/lib/random-url-safe';

function currentUrl() {
  var url = [
    window.location.protocol,
    '//',
    window.location.host,
    window.location.pathname,
  ].join('');
  if (url.substr(-1) !== '/') {
    url += '/';
  }
  return url;
}

export type Oauth2ProviderParams = Params & Config;

interface Params extends BaseProviderParams {
  name: string;
  baseUrl: string;
  // redirectUri: string;
  responseParams: Array<string>;
  responseType?: string;
}

interface Config {
  apiKey: string;
  scope?: string;
  clientId?: string;
  state?: string;
  redirectUri?: string;
}

/**
 * Implements authorization against an OAuth2 API
 * using the OAuth2 authorization flow in a popup window.
 *
 * Subclasses should extend this class and define the following properties:
 *   - requiredUrlParams: If there are additional required params
 *   - optionalUrlParams: If there are additional optional params
 *   - name: The name used in the configuration `providers` key
 *   - baseUrl: The base url for OAuth2 code-based flow at the 3rd-party
 *
 *   If there are any additional required or optional url params,
 *   include default values for them (if appropriate).
 *
 * @class Oauth2Provider
 */
export default class OAuth2Provider extends BaseProvider<Oauth2ProviderParams> {
  concatenatedProperties = ['requiredUrlParams', 'optionalUrlParams'];

  /**
   * The parameters that must be included as query params in the 3rd-party provider's url that we build.
   * These properties are in the format that should be in the URL (i.e.,
   * usually underscored), but they are looked up as camelCased properties
   * on the instance of this provider. For example, if the 'client_id' is
   * a required url param, when building the URL we look up the value of
   * the 'clientId' (camel-cased) property and put it in the URL as
   * 'client_id=' + this.get('clientId')
   * Subclasses can add additional required url params.
   *
   * @property {array} requiredUrlParams
   */
  requiredUrlParams = ['response_type', 'client_id', 'redirect_uri', 'state'];

  /**
   * Parameters that may be included in the 3rd-party provider's url that we build.
   * Subclasses can add additional optional url params.
   *
   * @property {array} optionalUrlParams
   */
  optionalUrlParams = ['scope'];

  /**
   * The base url for the 3rd-party provider's OAuth2 flow (example: 'https://github.com/login/oauth/authorize')
   *
   * @property {string} baseUrl
   */
  #baseUrl: string;

  get baseUrl() {
    return this.required('baseUrl', this.#baseUrl);
  }

  /**
   * List of parameters that we expect
   * to see in the query params that the 3rd-party provider appends to
   * our `redirectUri` after the user confirms/denies authorization.
   * If any of these parameters are missing, the OAuth attempt is considered
   * to have failed (usually this is due to the user hitting the 'cancel' button)
   *
   * @property {array} responseParams
   */
  responseParams: Array<string>;

  /**
   * The oauth response type we expect from the third party provider. Hardcoded to 'code' for oauth2-code flows
   * @property {string} responseType
   */
  responseType: string;

  randomState = randomUrlSafe(16);

  constructor(params: Oauth2ProviderParams) {
    super(params);
    this.#baseUrl = params.baseUrl;
    // this.redirectUri = params.redirectUri;
    this.responseParams = params.responseParams;
    this.responseType = params.responseType ?? 'code';
    // const apiKey = configurable<string>('apiKey');
  }

  /**
   * The apiKey (sometimes called app id) that identifies the registered application at the 3rd-party provider
   *
   * @property {string} apiKey
   */
  get apiKey() {
    return this.config.getValue('apiKey');
  }

  get redirectUri() {
    return this.config.getValue(
      'redirectUri',
      () => `${currentUrl()}torii/redirect.html`
    );
  }

  get scope() {
    return this.config.getValue('scope', undefined);
  }

  get clientId() {
    return this.config.getValue('clientId', () => this.apiKey);
  }

  get state() {
    return this.config.getValue('state', () => this.randomState);
  }

  buildQueryString() {
    var requiredParams = this.requiredUrlParams,
      optionalParams = this.optionalUrlParams;

    var qs = new QueryString({
      provider: this,
      requiredParams: requiredParams,
      optionalParams: optionalParams,
    });
    return qs.toString();
  }

  buildUrl() {
    var base = this.baseUrl,
      qs = this.buildQueryString();

    return [base, qs].join('?');
  }

  /**
   * @method open
   * @return {Promise<object>} If the authorization attempt is a success,
   * the promise will resolve an object containing the following keys:
   *   - authorizationCode: The `code` from the 3rd-party provider
   *   - provider: The name of the provider (i.e., google-oauth2)
   *   - redirectUri: The redirect uri (some server-side exchange flows require this)
   * If there was an error or the user either canceled the authorization or
   * closed the popup window, the promise rejects.
   */
  open(options?: Object) {
    var name = this.name,
      url = this.buildUrl(),
      redirectUri = this.redirectUri,
      responseParams = this.responseParams,
      responseType = this.responseType,
      state = this.state,
      shouldCheckState = responseParams.indexOf('state') !== -1;

    return (
      this.popup
        // @ts-expect-error
        ?.open(url, responseParams, options)
        // @ts-expect-error
        .then(function (authData: {
          token_id: string;
          authorization_code: string;
          state: string;
        }) {
          var missingResponseParams: Array<string> = [];

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
                missingResponseParams.join(', ')
            );
          }

          if (shouldCheckState && authData.state !== state) {
            throw new Error(
              'The response from the provider has an incorrect ' +
                'session state param: should be "' +
                state +
                '", ' +
                'but is "' +
                authData.state +
                '"'
            );
          }

          return {
            // @ts-expect-error
            authorizationCode: decodeURIComponent(authData[responseType]),
            provider: name,
            redirectUri: redirectUri,
          };
        })
    );
  }
}
