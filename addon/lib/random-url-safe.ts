export default function randomUrlSafe(length: number) {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var result = '';

  for (const _ of Array(length)) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}
