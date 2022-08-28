/* eslint-disable ember/no-classic-classes, ember/no-get */
import Ember from 'ember';
import { Promise as EmberPromise, reject } from 'rsvp';
import Service from '@ember/service';
import createStateMachine from 'torii/session/state-machine';
import { getOwner } from 'torii/lib/container-utils';

function lookupAdapter(container, authenticationType) {
  var adapter = container.lookup('torii-adapter:' + authenticationType);
  if (!adapter) {
    adapter = container.lookup('torii-adapter:application');
  }
  return adapter;
}

export default Service.extend(Ember._ProxyMixin, {
  state: null,

  _sm: undefined,

  get stateMachine() {
    if (!this._sm) {
      this._sm = createStateMachine(this);
    }
    return this._sm;
  },

  get innerSession() {
    return this.currentState.context.session || {};
  },

  set innerSession(value) {},

  get currentState() {
    return this.stateMachine.state;
  },

  set currentState(value) {},

  get currentStateName() {
    return this.currentState.toString();
  },

  set currentStateName(value) {},

  get isWorking() {
    return this.currentState.context.isWorking;
  },

  set isWorking(value) {},

  get isOpening() {
    return this.currentState.context.isOpening;
  },

  set isOpening(value) {},

  get currentUser() {
    return this.innerSession.currentUser;
  },

  set currentUser(value) {},

  get isAuthenticated() {
    return this.innerSession.isAuthenticated;
  },

  set isAuthenticated(value) {},

  get errorMessage() {
    return this.currentState.context.errorMessage;
  },

  set errorMessage(value) {},

  get id() {
    return this.innerSession.id;
  },

  set id(value) {},

  // Make these properties one-way.
  setUnknownProperty() {},

  open(provider, options) {
    var owner = getOwner(this),
      torii = getOwner(this).lookup('service:torii'),
      sm = this.get('stateMachine');

    return new EmberPromise((resolve, reject) => {
      if (!this.currentState.nextEvents.includes('START_OPEN')) {
        return reject(new Error('Unknown Event START_CLOSE'));
      }
      sm.send('START_OPEN');
      resolve();
    })
      .then(function () {
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
  },

  fetch(provider, options) {
    var owner = getOwner(this),
      sm = this.get('stateMachine');

    return new EmberPromise((resolve, reject) => {
      if (!this.currentState.nextEvents.includes('START_FETCH')) {
        return reject(new Error('Unknown Event START_CLOSE'));
      }
      sm.send('START_FETCH');
      resolve();
    })
      .then(function () {
        var adapter = lookupAdapter(owner, provider);
        console.log('[owner, provider, options]', owner, provider, options);

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
  },

  close(provider, options) {
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
  },
});
