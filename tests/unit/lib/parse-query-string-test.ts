import { module, test } from 'qunit';

import QueryStringParser from 'torii/lib/query-string-parser';

module('Unit | Lib | ParseQueryString', function (/*hooks*/) {
  test('parses each passed key', function (assert) {
    const url = 'http://localhost.dev:3000/xyz/?code=abcdef';
    const result = QueryStringParser.parse(url, ['code'] as const);

    assert.ok(result.code, 'gets code');
    assert.equal(result.code, 'abcdef', 'gets correct code');
  });

  test('parses keys without the hash fragment', function (assert) {
    const url = 'http://localhost.dev:3000/xyz/?code=abcdef#notCode=other';
    const result = QueryStringParser.parse(url, ['code'] as const);

    assert.ok(result.code, 'gets code');
    assert.equal(result.code, 'abcdef', 'gets correct code');
  });

  test('parses multiple keys', function (assert) {
    const url =
      'http://localhost.dev:3000/xyz/?oauth_token=xxx&oauth_verifier=yyy';
    const result = QueryStringParser.parse(url, [
      'oauth_token',
      'oauth_verifier',
    ] as const);

    assert.ok(result.oauth_token, 'gets token');
    assert.ok(result.oauth_verifier, 'gets verifier');
    assert.equal(result.oauth_token, 'xxx', 'gets correct token');
    assert.equal(result.oauth_verifier, 'yyy', 'gets correct verifier');
  });
});
