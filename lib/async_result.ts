import Result from './result';
import AsyncOption from './async_option';

/**
 * AsyncResult Monad
 */
export default class AsyncResult<O, E> {
    /**
     * Holding the value
     */
    private _runner: () => Promise<Result<O, E>>;

    private constructor(runner: () => Promise<Result<O, E>>) {
        this._runner = runner;
    }

    /**
     * Return an option with a value
     *
     * @param value The value
     * @return Option<T> with a value
     */
    static ok<O, E = never>(value: O) {
        return new AsyncResult(async () => Result.ok<O, E>(value));
    }

    /**
     * Return an option with no value
     * @return Option<T> with null
     */
    static err<O, E>(e: E) {
        return new AsyncResult<O, E>(async () => Result.err<O, E>(e));
    }

    /**
     * Run a series of options into a generator
     *
     * @param gen The generator function
     * @return An option with null or a value
     */
    static run<R, E>(
        gen: Generator<Promise<Result<R, E>>, Promise<Result<R, E>>, R|undefined>
    ): AsyncResult<R, E> {
        const step = async (value?: R): Promise<Result<R, E>> => {
            const result = gen.next(value);
            if (result.done) {
                try {
                    return await result.value;
                } catch (err) {
                    return Result.err<R, E>(err);
                }
            }

            try {
                const res = await result.value;
                if (res.isErr()) {
                    return Result.err<R, E>(res.extract() as E);
                }
                return await step(res.extract() as R);
            } catch (err) {
                return Result.err<R, E>(err);
            }
        };

        return new AsyncResult(step);
    }

    /**
     * Map
     *
     * @param f The function to be called
     * @return An option with a value or null
     */
    map<R>(f: (wrapped: O) => R): AsyncResult<R, E> {
        return new AsyncResult<R, E>(async () => {
            try {
                const res = await this._runner();
                const res2 = res.map(f);
                if (res2.isErr()) {
                    return Result.err<R, E>(res2.extract() as E);
                }
                return Result.ok<R, E>(res2.extract() as R);
            } catch (err) {
                return Result.err<R, E>(err);
            }
        });
    }

    /**
     * Map on error
     *
     * @param f The function to be called
     * @return An async result with an ok or an err
     */
    mapErr<R>(f: (wrapped: E) => Promise<R>): AsyncResult<O, R> {
        return new AsyncResult<O, R>(async () => {
            try {
                const isOk = await this.isOk();
                if (isOk) {
                    const extracted = await this.extract() as O;
                    return Result.ok<O, R>(extracted);
                }
                const extracted = await this.extract() as E;
                return Result.err<O, R>(await f(extracted!));
            } catch (err) {
                return Result.err<O, R>(err);
            }
        });
    }

    /**
     * Flatmap
     *
     * @param f The function to be called
     * @return A new AsyncResult
     */
    flatMap<R>(f: (wrapped: O) => Promise<Result<R, E>>): AsyncResult<R, E> {
        return new AsyncResult<R, E>(async () => {
            try {
                const res = await this._runner();

                if (res.isErr()) {
                    return Result.err<R, E>(res.extract() as E);
                }

                return await f(res.extract() as O);
            } catch (err) {
                return Result.err<R, E>(err);
            }
        });
    }

    /**
     * Flatmap on error
     *
     * @param f The function to be called
     * @return A result with an ok or an err
     *
     * @return A new AsyncResult
     */
    flatMapErr<R>(
        f: (wrapped: E) => Promise<Result<O, R>>
    ): AsyncResult<O, R> {
        return new AsyncResult<O, R>(async () => {
            try {
                const res = await this._runner();
                if (res.isOk()) {
                    return Result.ok<O, R>(res.extract() as O);
                }
                return await f(res.extract() as E);
            } catch (err) {
                return Result.err<O, R>(err);
            }
        });
    }

    /**
     * Match
     *
     * Execute the first function is the result is an ok
     * Execute the second function is the result is an error
     *
     * @return A new AsyncResult
     */
    match<T, U>(
        ifOk: (val: O) => Promise<T>,
        ifErr: (val: E) => Promise<U>
    ): AsyncResult<T, U> {
        return new AsyncResult<T, U>(async () => {
            const res = await this._runner();
            if (res.isErr()) {
                return Result.err<T, U>(await ifErr(res.extract() as E));
            }
            return Result.ok<T, U>(await ifOk(res.extract() as O));
        });
    }

    /**
     * FlatMatch
     *
     * Execute the first function is the result is an ok
     * Execute the second function is the result is an error
     *
     * @return A new AsyncResult
     */
    flatMatch<T, U>(
        ifOk: (val: O) => Promise<Result<T, U>>,
        ifErr: (val: E) => Promise<Result<T, U>>
    ): AsyncResult<T, U> {
        return new AsyncResult<T, U>(async () => {
            const res = await this._runner();
            if (res.isErr()) {
                return await ifErr(res.extract() as E);
            }
            return await ifOk(res.extract() as O);
        });
    }

    /**
     * Check if option is some
     */
    async isOk(): Promise<boolean> {
        return (await this._runner()).isOk();
    }

    /**
     * Check if option is none
     */
    async isErr(): Promise<boolean> {
        return (await this._runner()).isErr();
    }

    /**
     * Get the value from option, but if it's null, return the defaultValue
     * @param defaultValue The default value
     * @return The value from the option or the default value
     */
    async getOrElse<R>(defaultValue: R): Promise<O|R> {
        const res = await this._runner();
        return res.getOrElse(defaultValue);
    }

    /**
     * Get the value from the result
     * @return The value from the result (could be ok or err)
     */
    async extract(): Promise<O | E> {
        const res = await this._runner();
        return res.extract();
    }

    /**
     * Transform to an async option
     * @return An AsyncOption
     */
    toAsyncOption(): AsyncOption<O> {
        const promise = (async () => {
            const res = await this._runner();
            if (res.isErr()) {
                return null;
            }
            return res.extract() as NonNullable<O>;
        })();
        return AsyncOption.fromPromise<O>(promise);
    }
}
