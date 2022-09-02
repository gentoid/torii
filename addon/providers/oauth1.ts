/*
 * This class implements authentication against an API
 * using the OAuth1.0a request token flow in a popup window.
 */

import BaseProvider, { BaseProviderParams } from './base';

export interface Oauth1ProviderParams extends BaseProviderParams {
  requestTokenUri: string;
}

export default class Oauth1Provider extends BaseProvider<Oauth1ProviderParams> {
  constructor(params: Omit<Oauth1ProviderParams, 'name'>) {
    super({ name: 'oauth1', ...params });
  }

  buildRequestTokenUrl() {
    return this.config.getValue('requestTokenUri');
  }

  open(options: {}) {
    var name = this.get('name'),
      url = this.buildRequestTokenUrl();

    return (
      this.get('popup')
        // @ts-expect-error
        ?.open(url, ['code'], options)
        .then(function (authData) {
          // @ts-expect-error
          authData.provider = name;
          return authData;
        })
    );
  }
}
