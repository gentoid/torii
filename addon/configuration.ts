import { get, computed } from '@ember/object';
import Service from '@ember/service';

type Callback<T> = {
  (): T;
};

function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export default class ConfigureService<C extends Object> {
  #config: C;
  readonly name: string;

  constructor(params: { name: string }, config: C) {
    this.name = params.name;
    this.#config = config;
  }

  getValue<K extends keyof C & string>(
    key: K,
    defaultValue?: C[K] | Callback<C[K]>
  ): C[K] {
    const value = this.#config[key];

    if (typeof value !== 'undefined') {
      return value;
    }

    if (!defaultValue) {
      throw new Error(
        `Expected configuration value ${key} to be defined for provider named ${this.name}`
      );
    }

    if (isFunction(defaultValue)) {
      return defaultValue();
    }

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
