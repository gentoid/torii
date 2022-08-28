import { get, computed } from '@ember/object';

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

export default {};
