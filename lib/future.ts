import { Err, Ok, Result, Some, None, Option } from '.';

export interface Match<T, U> {
    /**
     * Ok function
     */
    onSuccess: (val: T) => Promise<U>;

    /**
     * Err function
     */
    onFailure: (val: Error) => Promise<U>;
}

export interface FlatMatch<T, U> {
    /**
     * Ok function
     */
    onSuccess: (val: T) => Future<U>;

    /**
     * Err function
     */
    onFailure: (val: Error) => Future<U>;
}

/**
 * Future
 */
export class Future<T> { // tslint:disable-line
    /**
     * Promise
     */
    protected _promise: Promise<T>;

    /**
     * Executor
     */
    protected _executor: () => Promise<Result<T, Error>>;

    constructor(promise: Promise<T>) {
        this._promise = promise;
        this._executor = async () => {
            try {
                const val = await promise;
                return Ok(val);
            } catch (err) {
                const e = err instanceof Error ?
                    err : new Error(String(err));
                return Err(e);
            }
        };
    }

    /**
     * Is a success
     */
    async isSuccess(): Promise<boolean> {
        return (await this._executor()).isOk();
    }

    /**
     * Is a failure
     */
    async isFailure(): Promise<boolean> {
        return (await this._executor()).isErr();
    }

    /**
     * Get the value from the future (can throw)
     * @return The value
     */
    async extract(): Promise<T> {
        const res = await this._executor();
        if (res.isErr()) {
            throw res.extract();
        }
        return res.extract();
    }

    /**
     * Get the value from the future, but if it's a failure, return the defaultValue
     * @param defaultValue The default value
     * @return The value from the future or the default value
     */
    async getOrElse<R>(defaultValue: R): Promise<T|R> {
        const res = await this._executor();
        if (res.isErr()) {
            return defaultValue;
        }
        return res.extract();
    }

    /**
     * Map
     *
     * @param f The function to be called
     * @return A new future
     */
    map<U>(f: (val: T) => Promise<U>): Future<U> {
        const promise = (async () => {
            const res = await this._executor();
            if (res.isErr()) {
                throw res.extract();
            }
            return await f(res.extract());
        })();
        return new Future<U>(promise);
    }

    /**
     * Map on error
     *
     * @param f The function to be called
     * @return A future
     */
    mapErr<U>(f: (err: any) => Promise<U>): Future<U | T> {
        const promise = (async () => {
            const res = await this._executor();
            if (res.isErr()) {
                return await f(res.extract());
            }
            return res.extract();
        })();
        return new Future(promise);
    }

    /**
     * Flatmap
     *
     * @param f The function to be called
     * @return A new future
     */
    flatMap<U>(f: (val: T) => Future<U>): Future<U> {
        const promise = (async () => {
            const res = await this._executor();
            if (res.isErr()) {
                throw res.extract();
            }
            return f(res.extract())._promise;
        })();
        return new Future<U>(promise);
    }

    /**
     * Flatmap on failure
     *
     * @param f The function to be called
     * @return A new future
     */
    flatMapErr<U>(f: (err: Error) => Future<U>): Future<U|T> {
        const promise = (async () => {
            const res = await this._executor();
            if (res.isErr()) {
                const e = res.extract() as Error;
                return await f(e)._promise;
            }
            return res.extract();
        })();
        return new Future(promise);
    }

    /**
     * Match
     */
    match<U>(matchObject: Match<T, U>): Future<U> {
        const promise = (async () => {
            const res = await this._executor();
            if (res.isErr()) {
                return await matchObject.onFailure(res.extract());
            }
            return await matchObject.onSuccess(res.extract());
        })();
        return new Future<U>(promise);
    }

    /**
     * FlatMatch
     */
    flatMatch<U>(matchObject: FlatMatch<T, U>): Future<U> {
        const promise = (async () => {
            const res = await this._executor();
            if (res.isErr()) {
                return matchObject.onFailure(res.extract())._promise;
            }
            return matchObject.onSuccess(res.extract())._promise;
        })();
        return new Future<U>(promise);
    }

    /**
     * Transform into Option
     *
     * @return An option
     */
    async toOption(): Promise<Option<T>> {
        const res = await this._executor();
        return res.isErr() ? None : Some<T>(res.extract()) ;
    }

    /**
     * Transform into Result
     *
     * @return A result
     */
    async toResult(): Promise<Result<T, Error>> {
        const res = await this._executor();
        return res;
    }

    /**
     * Run a series of futures into a generator
     *
     * @param gen The generator function
     * @return A new future
     */
    run<U>(gen: Generator<Promise<T>|undefined, Promise<U>, T>): Future<U> {
        return new Future<U>((async () => {
            const step = async (value: T): Promise<U> => {
                const result = gen.next(value);
                result.value = result.value === undefined ? this._promise : result.value;
                if (result.done) {
                    return result.value;
                }
                try {
                    const newVal = await result.value;
                    return await step(newVal as T);
                } catch (err) {
                    throw err;
                }
            };
            const res = await this._executor();
            return await step(res.extract() as T);
        })());
    }
}
