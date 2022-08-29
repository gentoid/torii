import { getOwner } from '@ember/application';
import EmberObject from '@ember/object';
import ConfigureService from 'torii/configuration';
import ToriiService from 'torii/services/torii';

var DEFAULT_REMOTE_SERVICE_NAME = 'popup';

export interface BaseProviderParams {
  name: string;
  remoteServiceName?: string;
}

/**
 * The base class for all torii providers
 * @class BaseProvider
 */
export default class BaseProvider<
  ExtendedConfig extends BaseProviderParams
> extends EmberObject {
  /**
   * The name of the provider
   * @property {string} name
   */
  #name: string;

  get name() {
    return this.required('name', this.#name);
  }

  protected config: ConfigureService<ExtendedConfig>;

  constructor(params: ExtendedConfig) {
    super();
    this.#name = params.name;
    this.config = new ConfigureService<ExtendedConfig>(params);
  }

  /**
   * The name of the configuration property
   * that holds config information for this provider.
   * @property {string} configNamespace
   */
  get configNamespace() {
    return `providers.${this.name}`;
  }

  get popup() {
    var owner = getOwner(this);
    var remoteServiceName =
      this.configuredRemoteServiceName ||
      this.config.getValue('remoteServiceName', undefined) ||
      DEFAULT_REMOTE_SERVICE_NAME;

    return owner?.lookup(`torii-service:${remoteServiceName}`) as
      | ToriiService
      | undefined;
  }

  get configuredRemoteServiceName() {
    return this.config.getValue('remoteServiceName', undefined);
  }

  protected required<T>(
    key: keyof ExtendedConfig & string,
    value: T | undefined
  ): T {
    if (value) {
      return value;
    }

    throw new Error(`Definition of property ${key} by a subclass is required.`);
  }
}
