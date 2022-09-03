export type FromKeys<K extends ReadonlyArray<string>> = {
  [key in K[number]]?: string;
};

export default class QueryStringParser {
  static parse<Keys extends ReadonlyArray<string>>(
    url: string,
    keys: Keys
  ): FromKeys<Keys> {
    const data: FromKeys<Keys> = {};

    for (const key of keys) {
      const regex = new RegExp(key + '=([^&#]*)');
      const match = regex.exec(url);

      if (match) {
        data[key as Keys[number]] = match[1];
      }
    }

    return data;
  }
}
