/* eslint-disable qunit/no-negated-ok */
import { module, test } from 'qunit';
import { createMachine, interpret } from 'xstate';

module('Unit | Lib | State Machine', function (/*hooks*/) {
  test('can transition from one state to another', function (assert) {
    const sm = interpret(
      createMachine({
        predictableActionArguments: true,
        initial: 'initial',
        context: {},
        states: {
          initial: {
            entry: (context) => (context.foo = 'bar'),
            on: {
              STARTED: {
                target: 'started',
              },
            },
          },
          started: {
            entry: (context) => (context.baz = 'blah'),
          },
        },
      })
    );

    sm.start();

    assert.equal(sm.state.value, 'initial');
    assert.equal(sm.state.context.foo, 'bar');
    assert.ok(!sm.state.baz, 'has no baz state when initial');

    sm.send('STARTED');
    assert.equal(sm.state.value, 'started');
    assert.equal(sm.state.context.baz, 'blah');
    assert.ok(!sm.state.foo, 'has no foo state when started');
  });
});
