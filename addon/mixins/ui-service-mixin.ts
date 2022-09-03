import { later, run, cancel } from '@ember/runloop';
import { Promise as EmberPromise } from 'rsvp';
import UUIDGenerator from 'torii/lib/uuid-generator';
import PopupIdSerializer from 'torii/lib/popup-id-serializer';
import assert from 'torii/lib/assert';
import { getConfiguration } from 'torii/configuration';
import QueryStringParser, { FromKeys } from 'torii/lib/query-string-parser';
import { EmberRunTimer } from '@ember/runloop/types';

export const CURRENT_REQUEST_KEY = '__torii_request';
export const WARNING_KEY = '__torii_redirect_warning';

interface Params<Options extends Object> {
  openRemote: (
    url: string,
    pendingRequestKey: string,
    options: Options
  ) => void;
  pollRemote: () => void;
  closeRemote: () => void;
}

export default class UiService<Options extends Object> {
  remoteIdGenerator = UUIDGenerator;
  polling?: EmberRunTimer;
  timeout?: EmberRunTimer;

  onDidCloseListeners: Array<() => void> = [];
  oneDidCloseListeners: Array<() => void> = [];

  remote: null | Window = null;
  openRemote;
  pollRemote;
  closeRemote;

  constructor(params: Params<Options>) {
    this.openRemote = params.openRemote;
    this.pollRemote = params.pollRemote;
    this.closeRemote = params.closeRemote;
  }

  // Open a remote window. Returns a promise that resolves or rejects
  // according to whether the window is redirected with arguments in the URL.
  //
  // For example, an OAuth2 request:
  //
  // popup.open('http://some-oauth.com', ['code']).then(function(data){
  //   // resolves with data.code, as from http://app.com?code=13124
  // });
  //
  // Services that use this mixin should implement openRemote
  open<Keys extends ReadonlyArray<string>>(
    url: string,
    keys: Keys,
    options: Options
  ) {
    let service = this;
    let lastRemote = this.remote;
    let storageToriiEventHandler: (event: StorageEvent) => void;

    return new EmberPromise<FromKeys<Keys>>(function (resolve, reject) {
      if (lastRemote) {
        service.close();
      }

      var remoteId = service.remoteIdGenerator.generate();
      storageToriiEventHandler = function (storageEvent) {
        const key = storageEvent.key;
        const newValue = storageEvent.newValue;

        if (!key || !newValue) {
          return;
        }

        var remoteIdFromEvent = PopupIdSerializer.deserialize(key);
        if (remoteId === remoteIdFromEvent) {
          var data = QueryStringParser.parse(newValue, keys);
          localStorage.removeItem(key);
          run(() => resolve(data));
        }
      };
      var pendingRequestKey = PopupIdSerializer.serialize(remoteId);
      localStorage.setItem(CURRENT_REQUEST_KEY, pendingRequestKey);
      localStorage.removeItem(WARNING_KEY);

      service.openRemote(url, pendingRequestKey, options);
      service.schedulePolling();

      var onbeforeunload = window.onbeforeunload;
      window.onbeforeunload = function () {
        if (typeof onbeforeunload === 'function') {
          // @ts-expect-error
          onbeforeunload();
        }
        service.close();
      };

      if (service.remote && !service.remote.closed) {
        service.remote.focus();
      } else {
        localStorage.removeItem(CURRENT_REQUEST_KEY);
        reject(new Error('remote could not open or was closed'));
        return;
      }

      service.oneDidCloseListeners.push(() => {
        let hasWarning = localStorage.getItem(WARNING_KEY);
        if (hasWarning) {
          localStorage.removeItem(WARNING_KEY);
          let configuration = getConfiguration();

          assert(
            `[Torii] Using an OAuth redirect that loads your Ember App is deprecated and will be
              removed in a future release, as doing so is a potential security vulnerability.
              Hide this message by setting \`allowUnsafeRedirect: true\` in your Torii configuration.
          `,
            // @ts-expect-error
            configuration.allowUnsafeRedirect
          );
        }
        var pendingRequestKey = localStorage.getItem(CURRENT_REQUEST_KEY);
        if (pendingRequestKey) {
          localStorage.removeItem(pendingRequestKey);
          localStorage.removeItem(CURRENT_REQUEST_KEY);
        }
        // If we don't receive a message before the timeout, we fail. Normally,
        // the message will be received and the window will close immediately.
        service.timeout = later(
          service,
          function () {
            reject(
              new Error(
                'remote was closed, authorization was denied, or an authentication message otherwise not received before the window closed.'
              )
            );
          },
          100
        );
      });

      window.addEventListener('storage', storageToriiEventHandler);
    }).finally(function () {
      // didClose will reject this same promise, but it has already resolved.
      service.close();
      window.removeEventListener('storage', storageToriiEventHandler);
    });
  }

  close() {
    if (this.remote) {
      this.closeRemote();
      this.remote = null;
      this.onDidClose();
    }
    this.cleanUp();
  }

  cleanUp() {
    this.clearTimeout();
  }

  schedulePolling() {
    this.polling = later(
      this,
      () => {
        this.pollRemote();
        this.schedulePolling();
      },
      35
    );
  }

  clearTimeout() {
    cancel(this.timeout);
    this.timeout = undefined;
  }

  onDidClose() {
    for (const listener of this.onDidCloseListeners) {
      listener();
    }

    while (this.oneDidCloseListeners.length > 0) {
      const listener = this.oneDidCloseListeners.shift();
      listener?.();
    }

    this.stopPolling();
  }

  stopPolling() {
    cancel(this.polling);
  }
}
