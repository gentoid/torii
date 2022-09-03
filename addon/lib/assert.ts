export default function assert(message: string, test: unknown) {
  if (!test) {
    console.error(message); // eslint-disable-line
  }
}
