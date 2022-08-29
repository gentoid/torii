/* eslint-disable ember/no-classic-classes */
import { A } from '@ember/array';
import { camelize } from '@ember/string';
import EmberObject, { get } from '@ember/object';

function isValue<T>(value: T | undefined | null): value is T {
  // @ts-expect-error
  return Boolean(value || value === false);
}

function getParamValue<T extends {}>(
  obj: T,
  paramName: string,
  optional?: boolean
) {
  var camelizedName = camelize(paramName),
    value = get(obj, camelizedName) as string | boolean;

  if (!optional) {
    if (!isValue(value) && isValue(get(obj, paramName) as string | boolean)) {
      throw new Error(
        'Use camelized versions of url params. (Did not find ' +
          '"' +
          camelizedName +
          '" property but did find ' +
          '"' +
          paramName +
          '".'
      );
    }

    if (!isValue(value)) {
      throw new Error(
        'Missing url param: "' +
          paramName +
          '". (Looked for: property named "' +
          camelizedName +
          '".'
      );
    }
  }

  return isValue(value) ? encodeURIComponent(value) : undefined;
}

function getOptionalParamValue<T extends {}>(obj: T, paramName: string) {
  return getParamValue(obj, paramName, true);
}

export interface QueryStringParams<T extends {}> {
  provider: T;
  requiredParams: Array<string>;
  optionalParams?: Array<string>;
}

export default class QueryString<T extends {}> extends EmberObject {
  obj: T;
  urlParams: Array<string>;
  optionalUrlParams: Array<string>;

  constructor(params: QueryStringParams<T>) {
    super();
    this.obj = params.provider;
    this.urlParams = A(params.requiredParams.slice()).uniq();
    this.optionalUrlParams = A(params.optionalParams?.slice() || []).uniq();

    this.optionalUrlParams.forEach((param) => {
      if (this.urlParams.indexOf(param) > -1) {
        throw new Error(
          "Required parameters cannot also be optional: '" + param + "'"
        );
      }
    }, this);
  }

  toString() {
    var urlParams = this.urlParams,
      optionalUrlParams = this.optionalUrlParams,
      obj = this.obj,
      keyValuePairs = A<[string, string | undefined]>([]);

    urlParams.forEach(function (paramName) {
      var paramValue = getParamValue(obj, paramName);

      keyValuePairs.push([paramName, paramValue]);
    });

    optionalUrlParams.forEach(function (paramName) {
      var paramValue = getOptionalParamValue(obj, paramName);

      if (isValue(paramValue)) {
        keyValuePairs.push([paramName, paramValue]);
      }
    });

    return keyValuePairs
      .map(function (pair) {
        return pair.join('=');
      })
      .join('&');
  }
}
