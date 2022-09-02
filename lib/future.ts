import { None, Some, Option } from './option.js';
import { Err, Ok, Result } from './result.js';

export type PromiseFactory<T> = () => Promise<T>;

const isPromise = <T>(x: any): x is Promise<T> =>
    x instanceof Promise || x != null && typeof (x as any).then === 'function';

/**
 * Match
 */
export interface Match<T, U, E = Error> {
    /**
     * Ok function
     */
    onSuccess: (val: T) => U;

    /**
     * Err function
     */
    onFailure: (val: E) => U;
}

/**
 * FlatMatch
 */
export interface FlatMatch<T, U, E = Error> {
    /**
     * Ok function
     */
    onSuccess: (val: T) => Future<U, E>;

    /**
     * Err function
     */
    onFailure: (val: E) => Future<U, E>;
}

/**
 * FlatMatchErr
 */
export interface FlatMatchErr<T, U, E = Error> {
    /**
     * Ok function
     */
    onSuccess: (val: T) => Future<T, U>;

    /**
     * Err function
     */
    onFailure: (val: E) => Future<T, U>;
}

/**
 * Future
 */
export class Future<T, E = Error> { // tslint:disable-line
    /**
     * Action
     */
    protected _action: (resolve: (d: T) => void, reject: (e: E) => void) => () => boolean;

    /**
     * Constructor
     * @param action - Action to be run
     */
    constructor(
        action: (resolve: (d: T) => void, reject: (e: E) => void) => () => boolean
    )  {
        this._action = action;
    }

    /**
     * Create a future that always resolves
     * @param x - The data
     * @param cancel - Cancel function
     * @returns the new future
     */
    static of<T>(x: T, cancel: () => boolean = () => true): Future<T, never> {
        return new Future((resolve, _) => {
            resolve(x);
            return cancel;
        });
    }

    /**
     * Create a future that always rejects
     * @param x - The error
     * @param cancel - Cancel function
     * @returns the new future
     */
    static reject<E>(x: E, cancel: () => boolean = () => true): Future<never, E> {
        return new Future((_, reject) => {
            reject(x);
            return cancel;
        });
    }

    /**
     * Create a future from a Promise
     * @param x - The promise
     * @param m - A mapper between an Error and the type of E
     * @returns the Future
     */
    static fromP<T, E = Error>(
        x: Promise<T>|PromiseFactory<T>,
        m: (e: Error) => E = e => e as any
    ): Future<T, E> {
        return new Future((resolve, reject) => {
            if (isPromise(x)) {
                x.then(resolve, (e: Error) => reject(m(e)));
            }
            else {
                x().then(resolve, (e: Error) => reject(m(e)));
            }
            return () => true;
        });
    }

    /**
     * Sequentially apply a list of futures
     * If one fails, the other are cancelled and a rejection is thrown
     * If everything succeed, then you'll get a list of results
     * @param arr - The array of futures
     * @returns a future containing the list of results or a rejection
     */
    static seq<X = Error, M extends Future<any, any>[]|[] = Future<any, X>[]>(
        arr: M
    ): Future<{ [P in keyof M]: M[P] extends Future<infer U, any> ? U : never },
        M[number] extends Future<any, infer U> ? U : never> {
        return Future.fromP(async () => {
            const results: any = [];
            for(const [i, f] of arr.entries()) {
                try {
                    const x = await f.await();
                    results.push(x);
                }
                catch(err: any) {
                    arr.slice(i).map(x => x.extract(() => {}, () => {})());
                    throw err;
                }
            }
            return results;
        }, (e) => e as any);
    }

    /**
     * Apply a list of futures in parallel
     * If one fails, the other are cancelled and a rejection is thrown
     * If everything succeed, then you'll get a list of results
     * @param arr - The array of futures
     * @returns a future containing the list of results or a rejection
     */
    static all<X = Error, M extends Future<any, any>[]|[] = Future<any, X>[]>(
        arr: M
    ): Future<{ [P in keyof M]: M[P] extends Future<infer U, any> ? U : never },
        M[number] extends Future<any, infer U> ? U : never> {
        const results: any[] = [];
        let resolvedCount = 0;
        return new Future<any, any>((resolve, reject) => {
            if (arr.length === 0) {
                resolve([]);
                return () => true;
            }
            arr.forEach((fut, i) => {
                fut.extract((d) => {
                    results[i] = d;
                    resolvedCount += 1;
                    if (resolvedCount === arr.length) {
                        resolve(results);
                    }
                }, (err) => {
                    reject(err);
                });
            });
            return () => true;
        });
    }

    /**
     * Sequentially apply a list of futures
     * Contrary to seq, if one fails,
     * the returned array contained the error + the other results
     * @param arr - The array of futures
     * @returns a future containing the results and/or the rejection
     */
    static seqSafe<M extends Future<any, any>[]|[] = Future<any, any>[]>(
        arr: M
    ): Future<
        { [P in keyof M]: M[P] extends Future<infer U, infer W> ? U|W : never }
        > {
        return Future.fromP(async () => {
            const results: any = [];
            for(const [, f] of arr.entries()) {
                try {
                    const x = await f.await();
                    results.push(x);
                }
                catch(err: any) {
                    results.push(err);
                }
            }
            return results;
        }, (e) => e as any);
    }

    /**
     * Apply a list of futures in parallel
     * Contrary to all, if one fails,
     * the returned array contained the error + the other results
     * @param arr - The array of futures
     * @returns a future containing the list of results and rejections
     */
    static allSafe<M extends Future<any, any>[]|[] = Future<any, any>[]>(
        arr: M
    ): Future<
        { [P in keyof M]: M[P] extends Future<infer U, infer W> ? U|W : never }
        > {
        const results: any[] = [];
        let resolvedCount = 0;
        return new Future<any, any>((resolve) => {
            if (arr.length === 0) {
                resolve([]);
                return () => true;
            }
            arr.forEach((fut, i) => {
                fut.extract((d) => {
                    results[i] = d;
                    resolvedCount += 1;
                    if (resolvedCount === arr.length) {
                        resolve(results);
                    }
                }, (err) => {
                    results[i] = err;
                    resolvedCount += 1;
                    if (resolvedCount === arr.length) {
                        resolve(results);
                    }
                });
            });
            return () => true;
        });
    }

    /**
     * Run the future
     * @param success - The success function
     * @param error - The error function
     * @returns the cancel function
     */
    extract(success: (d: T) => void, error: (e: E) => void): () => boolean {
        return this._action(success, error);
    }

    /**
     * Await a future
     * @returns the promise
     */
    await(): Promise<T> {
        return new Promise(this.extract.bind(this));
    }

    /**
     * Await a future by getting a default value if it rejects
     * @param defaultValue - The default value
     * @returns the promise
     */
    awaitOrElse<U>(defaultValue: U): Promise<T|U> {
        return new Promise<U|T>((resolve) => {
            this.extract((d) => {
                resolve(d);
            }, () => resolve(defaultValue));
        });
    }

    /**
     * Transform into an option
     * @returns the option
     */
    async toOption(): Promise<Option<T>> {
        try {
            return Some(await this.await());
        }
        catch (err) {
            return None;
        }
    }

    /**
     * Transform into a result
     * @returns the result
     */
    async toResult(): Promise<Result<T, E>> {
        try {
            return Ok(await this.await());
        }
        catch (err: any) {
            return Err(err);
        }
    }

    /**
     * Map
     *
     * @param f - The function to be called
     * @returns A new future
     */
    map<U>(f: (val: T) => U): Future<U, E> {
        return this.flatMap(x => Future.of(f(x)));
    }

    /**
     * Map on error
     *
     * @param f - The function to be called
     * @returns A future
     */
    mapErr<U>(f: (err: E) => U): Future<T, U> {
        return this.flatMapErr(x => Future.reject(f(x)));
    }

    /**
     * Swap the value of the success with the value of the error
     * @returns a new future with swapped values
     */
    swap(): Future<E, T> {
        return new Future((resolve, reject) => {
            return this.extract(reject, resolve);
        });
    }

    /**
     * Flatmap
     *
     * @param f - The function to be called
     * @returns A new future
     */
    flatMap<U>(f: (val: T) => Future<U, E>): Future<U, E> {
        return new Future((resolve, reject) =>
            this.extract(
                (data: T) => {
                    try {
                        return f(data).extract(resolve, reject);
                    }
                    catch (err: any) {
                        return reject(err);
                    }
                },
                (e: E) => reject(e)
            ));
    }

    /**
     * Flatmap on failure
     *
     * @param f - The function to be called
     * @returns A new future
     */
    flatMapErr<U>(f: (err: E) => Future<T, U>): Future<T, U> {
        return new Future((resolve, reject) =>
            this.extract(
                (data: T) => resolve(data),
                (e: E) => {
                    try {
                        return f(e).extract(resolve, reject);
                    }
                    catch (err: any) {
                        return reject(err);
                    }
                }
            ));
    }

    /**
     * Match
     * @param matchObject - The match object
     * @returns the new future
     */
    match<U>(matchObject: Match<T, U, E>): Future<U, E> {
        /* istanbul ignore next */
        return this.flatMatch({
            onSuccess: x => Future.of(matchObject.onSuccess(x)),
            onFailure: e => Future.of(matchObject.onFailure(e)),
        });
    }

    /**
     * MatchErr
     * @param matchObject - The match object
     * @returns the new future
     */
    matchErr<U>(matchObject: Match<T, U, E>): Future<T, U> {
        /* istanbul ignore next */
        return this.flatMatchErr({
            onSuccess: x => Future.reject(matchObject.onSuccess(x)),
            onFailure: e => Future.reject(matchObject.onFailure(e)),
        });
    }

    /**
     * FlatMatch
     * @param matchObject - The match object
     * @returns the new future
     */
    flatMatch<U>(matchObject: FlatMatch<T, U, E>): Future<U, E> {
        return new Future((resolve, reject) =>
            this.extract(
                (data: T) => matchObject.onSuccess(data).extract(resolve, reject),
                (e: E) => matchObject.onFailure(e).extract(resolve, reject)
            ));
    }

    /**
     * FlatMatch on error
     * @param matchObject - The match object
     * @returns the new future
     */
    flatMatchErr<U>(matchObject: FlatMatchErr<T, U, E>): Future<T, U> {
        return new Future((resolve, reject) =>
            this.extract(
                (data: T) => matchObject.onSuccess(data).extract(resolve, reject),
                (e: E) => matchObject.onFailure(e).extract(resolve, reject)
            )
        );

    }
}
