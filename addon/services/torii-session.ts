import { Promise as EmberPromise, reject } from 'rsvp';
import Service from '@ember/service';
import createStateMachine from 'torii/session/state-machine';
import { StateMachine } from 'xstate';
import { getOwner } from '@ember/application';

// @ts-expect-error
function lookupAdapter(container, authenticationType) {
  var adapter = container.lookup('torii-adapter:' + authenticationType);
  if (!adapter) {
    adapter = container.lookup('torii-adapter:application');
  }
  return adapter;
}

export default class ToriiSessionService extends Service {
  // @ts-expect-error
  _sm?: StateMachine;

  get stateMachine() {
    if (!this._sm) {
      this._sm = createStateMachine(this);
    }
    return this._sm;
  }

  get innerSession() {
    return this.currentState.context.session || {};
  }

  get currentState() {
    return this.stateMachine.state;
  }

  get currentStateName() {
    return this.currentState.toString();
  }

  get isWorking() {
    return this.currentState.context.isWorking;
  }

  get isOpening() {
    return this.currentState.context.isOpening;
  }

  get currentUser() {
    return this.innerSession.currentUser;
  }

  get isAuthenticated() {
    return this.innerSession.isAuthenticated;
  }

  get errorMessage() {
    return this.currentState.context.errorMessage;
  }

  get id() {
    return this.innerSession.id;
  }

  // Make these properties one-way.
  setUnknownProperty() {}

  open(provider: string, options: Object) {
    var owner = getOwner(this),
      torii = getOwner(this).lookup('service:torii'),
      sm = this.get('stateMachine');

    return new EmberPromise((resolve, reject) => {
      if (!this.currentState.nextEvents.includes('START_OPEN')) {
        return reject(new Error('Unknown Event START_OPEN'));
      }
      sm.send('START_OPEN');
      resolve();
    })
      .then(function () {
        // @ts-expect-error
        return torii.open(provider, options);
      })
      .then(function (authorization) {
        var adapter = lookupAdapter(owner, provider);

        return adapter.open(authorization);
      })
      .then(function (user) {
        sm.send('FINISH_OPEN', { data: user });
        return user;
      })
      .catch(function (error) {
        sm.send('FAIL_OPEN', { error });
        return reject(error);
      });
  }

  fetch(provider: string, options: Object) {
    var owner = getOwner(this),
      sm = this.get('stateMachine');

    return new EmberPromise((resolve, reject) => {
      if (!this.currentState.nextEvents.includes('START_FETCH')) {
        return reject(new Error('Unknown Event START_FETCH'));
      }
      sm.send('START_FETCH');
      resolve();
    })
      .then(function () {
        var adapter = lookupAdapter(owner, provider);
        return adapter.fetch(options);
      })
      .then(function (data) {
        sm.send('FINISH_FETCH', { data });
        return;
      })
      .catch(function (error) {
        sm.send('FAIL_FETCH', { error });
        return reject(error);
      });
  }

  close(provider: string, options: Object) {
    var owner = getOwner(this),
      sm = this.get('stateMachine');

    return new EmberPromise((resolve, reject) => {
      if (!this.currentState.nextEvents.includes('START_CLOSE')) {
        return reject(new Error('Unknown Event START_CLOSE'));
      }
      sm.send('START_CLOSE');
      resolve();
    })
      .then(function () {
        var adapter = lookupAdapter(owner, provider);
        return adapter.close(options);
      })
      .then(function () {
        sm.send('FINISH_CLOSE');
      })
      .catch(function (error) {
        sm.send('FAIL_CLOSE', { error });
        return reject(error);
      });
  }
}
