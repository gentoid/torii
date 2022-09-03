export default class PopupIdSerializer {
  static serialize(popupId: string) {
    return 'torii-popup:' + popupId;
  }

  static deserialize(serializedPopupId?: string | null) {
    if (!serializedPopupId) {
      return null;
    }

    var match = serializedPopupId.match(/^(torii-popup:)(.*)/);
    return match ? match[2] : null;
  }
}
