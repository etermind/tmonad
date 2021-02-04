import Option from './option';

export enum ResultType {
    OK,
    ERR,
}

/**
 * Result Monad
 */
export default class Result<O, E> {
    /**
     * What type is the result
     */
    private _type: ResultType;

    /**
     * Holding the result
     */
    private _ok?: O;

    /**
     * Holding the error
     */
    private _err?: E;

    private constructor(type: ResultType, ok?: O, err?: E) {
        this._type = type;
        this._ok = ok;
        this._err = err;
    }

    /**
     * Return a result with an ok
     *
     * @param value The value
     * @return Result<O, E> with an ok
     */
    static ok<O, E = never>(value: O) {
        return new Result<O, E>(ResultType.OK, value);
    }

    /**
     * Return a result with an error
     * @return Result<O, E> with an error
     */
    static err<O, E>(err: E) {
        return new Result<O, E>(ResultType.ERR, undefined, err);
    }

    /**
     * Run a series of results into a generator
     *
     * @param gen The generator function
     * @return A result with an error or an ok
     */
    static run<R, E>(gen: IterableIterator<Result<R, E>>): Result<R, E> {
        /**
         * One step a a time
         *
         */
        const step = (value?: any): any => {
            const result = gen.next(value);
            if (result.done) {
                return result.value;
            }
            return result.value.flatMap(step);
        };
        return step();
    }

    /**
     * Check if result is an ok
     */
    isOk(): boolean {
        return this._type === ResultType.OK;
    }

    /**
     * Check if result is an error
     */
    isErr(): boolean {
        return this._type === ResultType.ERR;
    }

    /**
     * Map
     *
     * @param f The function to be called
     * @return A result with an ok or an err
     */
    map<R>(f: (wrapped: O) => R): Result<R, E> | Result<O, E> {
        if (this._type === ResultType.ERR) {
            return this;
        }
        return Result.ok(f(this._ok!));
    }

    /**
     * Flatmap
     *
     * @param f The function to be called
     * @return A result with an ok or an err
     */
    flatMap<R>(
        f: (wrapped: O) => Result<R, E>
    ): Result<R, E> {
        if (this._type === ResultType.ERR) {
            return Result.err<R, E>(this._err!);
        }
        return f(this._ok!);

    }

    /**
     * Match
     *
     * Execute the first function is the result is an ok
     * Execute the second function is the result is an error
     *
     * @param ifOk The function to execute when result is an ok
     * @param ifErr The function to execute when result is an err
     * @return The returned value of the first or second function
     */
    match<T, U>(ifOk: (val: O) => T, ifErr: (val: E) => U): T | U {
        if (this._type === ResultType.ERR) {
            return ifErr(this._err!);
        }
        return ifOk(this._ok!);
    }

    /**
     * Get the value from the result, but if it's of type Err, return the defaultValue
     * @param defaultValue The default value
     * @return The value from the result or the default value
     */
    getOrElse<R>(defaultValue: R): O|R {
        if (this._type === ResultType.ERR) {
            return defaultValue;
        }
        return this._ok!;
    }

    /**
     * Get the value from the result (can be the Ok value or the Err value
     * @return The value from the result
     */
    extract(): O | E {
        if (this._type === ResultType.ERR) {
            return this._err!;
        }
        return this._ok!;
    }

    /**
     * Transform to option
     * @return An option
     */
    toOption(): Option<O> {
        if (this._type === ResultType.ERR) {
            return Option.none<O>();
        }
        return Option.some<O>(this._ok!);
    }
}
