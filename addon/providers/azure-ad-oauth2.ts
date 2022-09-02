import QueryString from 'torii/lib/query-string';
import OAuth2Provider, {
  Oauth2ProviderParams,
  requiredParams as oauth2RequiredParams,
  optionalParams as auth2OptionalParams,
} from './oauth2-code';

export interface AzureAdOauth2ProviderParams extends Oauth2ProviderParams {
  tennantId?: string;
  responseMode?: string;
}

// additional url params that this provider requires
export const requiredParams = [
  ...oauth2RequiredParams,
  'api_version',
  'client_id',
] as const;

export const optionalParams = [
  ...auth2OptionalParams,
  'scope',
  'nonce',
  'response_mode',
] as const;

/**
 * This class implements authentication against AzureAD
 * using the OAuth2 authorization flow in a popup window.
 * @class
 */
export default class AzureAdOauth2Provider extends OAuth2Provider<AzureAdOauth2ProviderParams> {
  constructor(params: Omit<AzureAdOauth2ProviderParams, 'name'>) {
    super({ ...params, name: 'azure-ad-oauth2' });
  }

  get baseUrl() {
    return `https://login.windows.net/${this.tennantId}/oauth2/authorize`;
  }

  get tennantId() {
    return this.config.getValue('tennantId', 'common');
  }

  get responseMode() {
    return this.config.getValue('responseMode', undefined);
  }

  get responseParams() {
    return [this.responseType, 'state'];
  }

  apiVersion = '1.0';

  buildQueryString() {
    var qs = new QueryString(this, { requiredParams, optionalParams });
    return qs.toString();
  }
}
