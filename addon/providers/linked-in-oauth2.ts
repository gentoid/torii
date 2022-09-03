import { WithOptional } from './base';
import OAuth2Provider, { Oauth2ProviderParams } from './oauth2-code';

type Defined = 'name' | 'baseUrl' | 'responseParams';

type Params = WithOptional<Oauth2ProviderParams, Defined>;

/**
 * This class implements authentication against Linked In
 * using the OAuth2 authorization flow in a popup window.
 */
export default class LinkedInOauth2Provider extends OAuth2Provider<Oauth2ProviderParams> {
  constructor(params: Params) {
    super({
      name: 'linked-in-oauth2',
      baseUrl: 'https://www.linkedin.com/uas/oauth2/authorization',
      responseParams: ['code', 'state'],
      ...params,
    });
  }
}
