import Service from '@ember/service';
import { assign, createMachine, interpret } from 'xstate';

interface Context {
  errorMessage?: string;
  isWorking?: boolean;
  isOpening?: boolean;
  isFetching?: boolean;
  isClosing?: boolean;
  session?: Object;
}

function copy(to: Object | undefined, from: Object | undefined) {
  let copyTo = to || {};
  const copyFrom = from || {};

  for (const [prop, value] of Object.entries(copyFrom)) {
    if (copyFrom.hasOwnProperty(prop)) {
      // @ts-expect-error
      copyTo[prop] = value;
    }
  }

  return copyTo;
}

export default function (session: Service & Context) {
  var sm = createMachine<Context>(
    {
      id: 'torii',
      initial: 'unauthenticated',
      predictableActionArguments: true,

      context: { session: copy({}, session) },

      states: {
        unauthenticated: {
          on: {
            START_OPEN: {
              target: 'opening',
              actions: ['clearErrorMessage'],
            },
            START_FETCH: {
              target: 'fetching',
              actions: ['clearErrorMessage'],
            },
            OPENING: {
              target: 'opening',
              actions: ['clearErrorMessage'],
            },
          },
        },
        authenticated: {
          entry(context) {
            context.session ||= {};
            // @ts-expect-error
            context.session.isAuthenticated = true;
          },
          on: {
            START_CLOSE: {
              target: 'closing',
            },
          },
        },
        opening: {
          entry(context) {
            context.isWorking = true;
            context.isOpening = true;
          },
          on: {
            FINISH_OPEN: {
              target: 'authenticated',
              actions: ['setSession', 'noMoreOpening', 'noMoreWorking'],
            },
            FAIL_OPEN: {
              target: 'unauthenticated',
              actions: ['setErrorMessage', 'noMoreOpening', 'noMoreWorking'],
            },
          },
        },
        fetching: {
          entry(context) {
            context.isWorking = true;
            context.isFetching = true;
          },
          on: {
            FINISH_FETCH: {
              target: 'authenticated',
              actions: ['setSession', 'noMoreFetching', 'noMoreWorking'],
            },
            FAIL_FETCH: {
              target: 'unauthenticated',
              actions: ['setErrorMessage', 'noMoreFetching', 'noMoreWorking'],
            },
          },
        },
        closing: {
          entry(context) {
            context.isWorking = true;
            context.isClosing = true;
            context.session = undefined;
          },
          on: {
            FINISH_CLOSE: {
              target: 'unauthenticated',
              actions: ['noMoreClosing', 'noMoreWorking'],
            },
            FAIL_CLOSE: {
              target: 'unauthenticated',
              actions: ['setErrorMessage', 'noMoreClosing', 'noMoreWorking'],
            },
          },
        },
      },
    },
    {
      actions: {
        clearErrorMessage: assign({
          errorMessage: (context) => undefined,
        }),
        setSession: assign({
          session: (context, event) => {
            const session = context.session;
            /// @ts-expect-error
            return copy(session, event.data);
          },
        }),
        setErrorMessage: assign({
          errorMessage: (context, event) => event['error'],
        }),
        noMoreWorking: assign({ isWorking: (ctx) => false }),
        noMoreOpening: assign({ isOpening: (ctx) => false }),
        noMoreFetching: assign({ isFetching: (ctx) => false }),
        noMoreClosing: assign({ isClosing: (ctx) => false }),
      },
    }
  );
  return interpret(sm).start();
}
