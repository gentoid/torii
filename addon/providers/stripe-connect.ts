import QueryString from 'torii/lib/query-string';
import { WithOptional } from './base';
import OAuth2Provider, {
  Oauth2ProviderParams,
  requiredParams as oauth2RequiredParams,
  optionalParams as oauth2OptionalParams,
} from './oauth2-code';

export interface StripeConnectProviderParams extends Oauth2ProviderParams {
  stripeLanding?: string;
  alwaysPrompt?: string;
}

export const requiredParams = oauth2RequiredParams;
export const optionalParams = [
  'stripe_landing',
  'always_prompt',
  ...oauth2OptionalParams,
] as const;

type Defined =
  | 'name'
  | 'baseUrl'
  | 'scope'
  | 'stripeLanding'
  | 'alwaysPrompt'
  | 'responseParams';

type Params = WithOptional<StripeConnectProviderParams, Defined>;

export default class StripeConnectProvider extends OAuth2Provider<StripeConnectProviderParams> {
  constructor(params: Params) {
    super({
      name: 'stripe-connect',
      baseUrl: 'https://connect.stripe.com/oauth/authorize',
      scope: 'read_write',
      stripeLanding: '',
      alwaysPrompt: 'false',
      responseParams: ['code', 'state'],
      ...params,
    });
  }

  get stripeLanding() {
    return this.config.getValue('stripeLanding');
  }

  get alwaysPrompt() {
    return this.config.getValue('alwaysPrompt');
  }

  buildQueryString(): string {
    return new QueryString(this, { requiredParams, optionalParams }).toString();
  }
}
