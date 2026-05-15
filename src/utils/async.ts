export async function to<T, E = Error>(
  promise: Promise<T>
): Promise<[E | undefined, T | undefined]> {
  try {
    const data = await promise;
    return [undefined, data];
  } catch (error) {
    return [error as E, undefined];
  }
}
