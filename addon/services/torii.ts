/* eslint-disable ember/no-classic-classes */
import { getOwner } from '@ember/application';
import Service from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';
import OAuth2Provider from 'torii/providers/oauth2-code';

const missingProviderErrorMessage = (providerName: string) =>
  `Expected a provider named '${providerName}', did you forget to register it?`;

const missingMethodErrorMessage = (providerName: string, methodName: string) =>
  `Expected provider '${providerName}' to define the '${methodName}' method`;

type ToriiProvider = OAuth2Provider;

function proxyToProvider(
  methodName: 'open' | 'fetch' | 'close',
  requireMethod?: boolean
) {
  return function (this: ToriiService, providerName: string, options?: Object) {
    const provider = getOwner(this)?.lookup(
      `torii-provider:${providerName}`
    ) as ToriiProvider | undefined;

    if (!provider) {
      throw new Error(missingProviderErrorMessage(providerName));
    }

    // @ts-expect-error
    if (!provider[methodName]) {
      if (requireMethod) {
        throw new Error(missingMethodErrorMessage(providerName, methodName));
      } else {
        return EmberPromise.resolve({});
      }
    }

    return new EmberPromise(function (resolve) {
      // @ts-expect-error
      resolve(provider[methodName](options));
    });
  };
}

/**
 * Torii is an engine for authenticating against various
 * providers. For example, you can open a session with
 * Linked In via Oauth2 and authorization codes by doing
 * the following:
 *
 *     var options = {foo: 'bar'};
 *     Torii.open('linked-in-oauth2', options).then(function(authData){
 *       console.log(authData.authorizationCode);
 *     });
 *
 * For traditional authentication flows, you will often use
 * Torii via the Torii.Session API.
 *
 * @class Torii
 */
export default class ToriiService extends Service {
  /**
   * Open an authorization against an API. A promise resolving
   * with an authentication response object is returned. These
   * response objects,  are found in the "torii/authentications"
   * namespace.
   *
   * @method open
   * @param {String} providerName The provider to call `open` on
   * @param {Object} [options] options to pass to the provider's `open` method
   * @return {Ember.RSVP.Promise} Promise resolving to an authentication object
   */
  open = proxyToProvider('open', true);

  /**
   * Return a promise which will resolve if the provider has
   * already been opened.
   *
   * @method fetch
   * @param {String} providerName The provider to call `fetch` on
   * @param {Object} [options] options to pass to the provider's `fetch` method
   * @return {Ember.RSVP.Promise} Promise resolving to an authentication object
   */
  fetch = proxyToProvider('fetch');

  /**
   * Return a promise which will resolve when the provider has been
   * closed. Closing a provider may not always be a meaningful action,
   * and may be better handled by torii's session management instead.
   *
   * @method close
   * @param {String} providerName The provider to call `close` on
   * @param {Object} [options] options to pass to the provider's `close` method
   * @return {Ember.RSVP.Promise} Promise resolving when the provider is closed
   */
  close = proxyToProvider('close');
}
