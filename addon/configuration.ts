import { get, computed } from '@ember/object';

type Callback<T> = {
  (): T;
};

interface Config {
  name: string;
}

type Default<C extends Config, K extends keyof C> = C[K] | Callback<C[K]>;

function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export default class ConfigureService<C extends Config> {
  #config: C;

  constructor(config: C) {
    this.#config = config;
  }

  getValue<K extends keyof C>(key: K): NonNullable<C[K]>;
  getValue<K extends keyof C>(
    key: K,
    defaultValue: NonNullable<Default<C, K>>
  ): NonNullable<C[K]>;
  getValue<K extends keyof C>(key: K, defaultValue: Default<C, K>): C[K];

  getValue<K extends keyof C>(
    key: K,
    defaultValue?: NonNullable<Default<C, K>>
  ): NonNullable<C[K]> {
    const value = this.#config[key];

    if (typeof value !== 'undefined') {
      // @ts-expect-error
      return value;
    }

    // no defaultValue's been provided
    if (arguments.length === 1) {
      throw new Error(
        `Expected configuration value ${
          key as string
        } to be defined for provider named ${this.getValue('name')}`
      );
    }

    if (isFunction(defaultValue)) {
      // @ts-expect-error
      return defaultValue();
    }

    // @ts-expect-error
    return defaultValue;
  }

  setValue<K extends keyof C & string>(key: K, value: C[K]): void {
    this.#config[key] = value;
  }
}

let configuration = {};

function configurable<T>(configKey: string, defaultValue?: T | (() => T)) {
  return computed<T>(function configurableComputed(this: { name: string }): T {
    const propertyPath = `providers.${this.name}.${configKey}`;
    const value = get(getConfiguration(), propertyPath) as T;

    if (typeof value === 'undefined') {
      if (typeof defaultValue !== 'undefined') {
        if (typeof defaultValue === 'function') {
          // @ts-expect-error
          return defaultValue.call(this);
        } else {
          return defaultValue;
        }
      } else {
        throw new Error(
          `Expected configuration value ${configKey} to be defined for provider named ${this.name}`
        );
      }
    }
    return value;
  });
}

function configure(settings: Object) {
  configuration = settings;
}

function getConfiguration(): Object {
  return configuration;
}

export { configurable, configure, getConfiguration };
