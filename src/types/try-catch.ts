// Result tuple types
export type Success<T> = readonly [data: T, error: null];
export type Failure<E> = readonly [data: null, error: E];
export type Result<T, E = Error> = Success<T> | Failure<E>;

// Async-only wrapper
export default async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    return [null, error as E];
  }
}
