import { A } from '@ember/array';
import { camelize } from '@ember/string';
import EmberObject, { get } from '@ember/object';

function isValue<T>(value: T | false | undefined | null): value is T | false {
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

type ToCamel<S extends string> = S extends `${infer Head}_${infer Tail}`
  ? `${Head}${Capitalize<ToCamel<Tail>>}`
  : S;

type CamelKey<R extends ReadonlyArray<string>> = {
  [K in ToCamel<R[number]>]: string;
};

interface Params<
  R extends ReadonlyArray<string>,
  O extends ReadonlyArray<string>
> {
  requiredParams: R;
  optionalParams: O;
}

export default class QueryString<
  T extends CamelKey<R> & Partial<CamelKey<O>>,
  R extends ReadonlyArray<string>,
  O extends ReadonlyArray<string>
> extends EmberObject {
  obj: T;
  urlParams: ReadonlyArray<string>;
  optionalUrlParams: ReadonlyArray<string>;

  constructor(provider: T, { requiredParams, optionalParams }: Params<R, O>) {
    super();
    this.obj = provider;
    this.urlParams = A(requiredParams.slice()).uniq();
    this.optionalUrlParams = A(optionalParams?.slice() || []).uniq();

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
