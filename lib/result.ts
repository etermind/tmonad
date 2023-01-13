import { Some, None, Option } from "./option.js";

export enum ResultType {
    OK,
    ERR,
}

/**
 * Match
 */
export interface Match<T, E, R, U> {
    /**
     * Ok function
     */
    ok: (val: T) => R;

    /**
     * Err function
     */
    err: (val: E) => U;
}

/**
 * Flat match
 */
export interface FlatMatch<T, E, U> {
    /**
     * Ok function
     */
    ok: (val: T) => Result<U, E>;

    /**
     * Err function
     */
    err: (val: E) => Result<U, E>;
}

/**
 * Result operations
 */
export interface ResultOps<T, E> {
    /**
     * What type is the result
     */
    type: ResultType;

    /**
     * Is result Ok
     */
    isOk(): this is Ok<T, E>;

    /**
     * Type narrowing for err
     */
    isErr(): this is Err<T, E>;

    /**
     * Get the value from the result, but if it's of type Err, return the defaultValue
     * @param defaultValue - The default value
     * @returns The value from the result or the default value
     */
    getOrElse<R>(defaultValue: R): T | R;

    /**
     * Match
     *
     * Execute the ok function in match if the result is an ok
     * Execute the err function in match if the result is an error
     *
     * @param f - The match object
     * @returns The returned value of the first or second function
     */
    match<R, U>(f: Match<T, E, R, U>): Result<R | T, E | U>;

    /**
     * Flat Match
     *
     * Execute the ok function in match if the result is an ok
     * Execute the err function in match if the result is an error
     *
     * @param f - object
     * @returns The returned value of the first or second function
     */
    // flatMatch<U>(f: FlatMatch<T, E, U>): Result<T, E> | Result<U, E>;

    /**
     * Map
     *
     * @param f - The function to be called
     * @returns A result with an ok or an err
     */
    map<U>(f: (val: T) => U): Result<U, E>;

    /**
     * Map on error
     *
     * @param f - The function to be called
     * @returns A result with an ok or an err
     */
    mapErr<U>(f: (err: E) => U): Result<T, U>;

    /**
     * Flatmap
     *
     * @param f - The function to be called
     * @returns A result with an ok or an err
     */
    flatMap<U, R>(f: (val: T) => Result<U, R>): Result<U, R | E>;

    /**
     * Flatmap on error
     *
     * @param f - The function to be called
     * @returns A result with an ok or an err
     */
    flatMapErr<U, R>(f: (err: E) => Result<U, R>): Result<T | U, E | R>;

    /**
     * Run using generator
     *
     * @param gen - The generator
     * @returns A new result
     */
    run<U, R>(
        gen: Generator<
            Result<T | U, E | R> | undefined,
            Result<U, E | R>,
            T | U
        >
    ): Result<T | U, E | R>;

    /**
     * Transform into option
     *
     * @returns Option
     */
    toOption(): Option<T>;
}

/**
 * Ok branch
 */
export interface Ok<T, E> extends ResultOps<T, E> {
    /**
     * Type
     */
    type: ResultType.OK;

    /**
     * Get the value from the result (can be the Ok value or the Err value
     * @returns The value from the result
     */
    extract(): T;
}

/**
 * Err branch
 */
export interface Err<T, E> extends ResultOps<T, E> {
    /**
     * Type
     */
    type: ResultType.ERR;

    /**
     * Get the value from the result (can be the Ok value or the Err value
     * @returns The value from the result
     */
    extract(): E;
}

export type Result<T, E> = Ok<T, E> | Err<T, E>;

/**
 * Ok object
 * @param this - The object
 * @param val - The hold value
 */
// eslint-disable-next-line
export function _Ok<T>(
    // eslint-disable-next-line
    this: Ok<T, {}> & { _val: T },
    val: T
) {
    this._val = val;
}

_Ok.prototype = {
    type: ResultType.OK,
    isOk(): boolean {
        return true;
    },
    isErr(): boolean {
        return false;
    },
    extract() {
        return this._val;
    },
    getOrElse() {
        return this._val;
    },
    match(matchObject: any) {
        return Ok(matchObject.ok(this._val));
    },
    /* flatMatch<U>(matchObject: FlatMatch<T, E, U>): Result<U, E> {
            return matchObject.ok(val);
        }, */
    map<U>(fn: (val: any) => U) {
        return Ok(fn(this._val));
    },
    mapErr<U>(_fn: (err: any) => U) {
        return this;
    },
    flatMap(f: any) {
        return f(this._val);
    },
    flatMapErr() {
        return this;
    },
    toOption() {
        return Some(this._val);
    },
    run(gen: Generator<any, any, any>) {
        /**
         * One step a a time
         * @param value - The value
         * @returns result
         */
        const step = (value: any) => {
            const result = gen.next(value);
            result.value = result.value === undefined ? this : result.value;
            if (result.done) {
                return result.value;
            }
            return result.value.flatMap(step);
        };
        return step(this._val);
    },
};

/**
 * Err object
 * @param this - The obj
 * @param err - The error
 */
// eslint-disable-next-line
export function _Err<E>(
    this: Ok<{}, E> & {
        // eslint-disable-next-line
        _err: E;
    },
    err: E
) {
    this._err = err;
}

_Err.prototype = {
    type: ResultType.ERR,
    isOk(): boolean {
        return false;
    },
    isErr(): boolean {
        return true;
    },
    extract() {
        return this._err;
    },
    getOrElse<R>(defaultValue: R) {
        return defaultValue;
    },
    match(matchObject: any) {
        return Err(matchObject.err(this._err));
    },
    /* flatMatch<U>(matchObject: FlatMatch<T, E, U>): Result<U, E> {
            return matchObject.err(err);
        }, */
    map() {
        return this;
    },
    mapErr(fn: any) {
        return Err(fn(this._err));
    },
    flatMap() {
        return this;
    },
    flatMapErr(f: any) {
        return f(this._err);
    },
    toOption() {
        return None;
    },
    run() {
        return this;
    },
};

/**
 * Ok object
 * @param value - The value
 * @returns the OK result
 */
// eslint-disable-next-line
export function Ok<T>(value: T): Result<T, never> {
    return new (_Ok as any)(value);
}

/**
 * Err object
 * @param error - error
 * @returns the Error result
 */
// eslint-disable-next-line
export function Err<E>(error: E): Result<never, E> {
    return new (_Err as any)(error);
}
