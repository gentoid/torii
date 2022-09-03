import UiService, { UiServiceParams } from 'torii/mixins/ui-service-mixin';

interface WindowSize {
  width: number;
  height: number;
}

interface WindowPosition {
  left: number;
  top: number;
}

function stringifyOptions(options: Record<string, unknown>) {
  var optionsStrings = [];
  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      var value;
      switch (options[key]) {
        case true:
          value = '1';
          break;
        case false:
          value = '0';
          break;
        default:
          value = options[key];
      }
      optionsStrings.push(key + '=' + value);
    }
  }
  return optionsStrings.join(',');
}

function prepareOptions(options: WindowSize): WindowSize & WindowPosition {
  var width = options.width || 500,
    height = options.height || 500;

  return Object.assign(
    {},
    {
      left: screen.width / 2 - width / 2,
      top: screen.height / 2 - height / 2,
      width: width,
      height: height,
    },
    options
  );
}

type Params = Pick<UiServiceParams<WindowSize>, 'remoteIdGenerator'>;

export default class PopupService {
  uiService: UiService<WindowSize>;

  constructor(params?: Params) {
    this.uiService = new UiService({ provider: this, ...params });
  }

  // Open a popup window.
  openRemote(url: string, pendingRequestKey: string, options?: WindowSize) {
    // @ts-expect-error
    var optionsString = stringifyOptions(prepareOptions(options || {}));
    this.uiService.remote = window.open(url, pendingRequestKey, optionsString);
  }

  closeRemote() {}

  pollRemote() {
    if (!this.uiService.remote) {
      return;
    }
    if (this.uiService.remote.closed) {
      this.uiService.onDidClose();
    }
  }

  open<Keys extends ReadonlyArray<string>>(
    url: string,
    keys: Keys,
    options?: WindowSize
  ): ReturnType<UiService<WindowSize>['open']> {
    return this.uiService.open(url, keys, options);
  }
}
