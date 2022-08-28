import { run } from '@ember/runloop';
import config from '../../config/environment';

const {
  torii: { sessionServiceName },
} = config;

export function stubValidSession(owner, sessionData) {
  const session = owner.lookup(`service:${sessionServiceName}`);
  const sm = session.get('stateMachine');

  run(() => {
    sm.send('START_OPEN');
    sm.send('FINISH_OPEN', { data: sessionData });
  });
}
