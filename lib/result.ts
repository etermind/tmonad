import { Some, None, Option } from '.';

export enum ResultType {
    OK,
    ERR,
}

export interface Match<T, E, U> {
    /**
     * Ok function
     */
    ok: (val: T) => U;

    /**
     * Err function
     */
    err: (val: E) => U;
}

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

export interface Result<T, E> {
    /**
     * What type is the result
     */
    type: ResultType;

    /**
     * Is result Ok
     */
    isOk(): boolean;

    /**
     * Is result Err
     */
    isErr(): boolean;

    /**
     * Get the value from the result (can be the Ok value or the Err value
     * @return The value from the result
     */
    extract(): T | E;

    /**
     * Get the value from the result, but if it's of type Err, return the defaultValue
     * @param defaultValue The default value
     * @return The value from the result or the default value
     */
    getOrElse<R>(defaultValue: R): T|R;

    /**
     * Match
     *
     * Execute the ok function in match if the result is an ok
     * Execute the err function in match if the result is an error
     *
     * @param match The match object
     * @return The returned value of the first or second function
     */
    match<U>(f: Match<T, E, U>): Result<U, E> | Result<T, U>;

    /**
     * Flat Match
     *
     * Execute the ok function in match if the result is an ok
     * Execute the err function in match if the result is an error
     *
     * @param match object
     * @return The returned value of the first or second function
     */
    // flatMatch<U>(f: FlatMatch<T, E, U>): Result<T, E> | Result<U, E>;

    /**
     * Map
     *
     * @param f The function to be called
     * @return A result with an ok or an err
     */
    map<U>(f: (val: T) => U): Result<U, E>;

    /**
     * Map on error
     *
     * @param f The function to be called
     * @return A result with an ok or an err
     */
    mapErr<U>(f: (err: E) => U): Result<T, U>;

    /**
     * Flatmap
     *
     * @param f The function to be called
     * @return A result with an ok or an err
     */
    flatMap<U>(f: (val: T) => Result<U, E>): Result<U, E>;

    /**
     * Flatmap on error
     *
     * @param f The function to be called
     * @return A result with an ok or an err
     */
    flatMapErr<U>(f: (err: E) => Result<U, E>): Result<T, E> | Result<U, E>;

    /**
     * Run using generator
     *
     * @param gen The generator
     * @return A new result
     */
    run<U>(gen: Generator<Result<T, E>|undefined, Result<U, E>, T>): Result<U, E>;

    /**
     * Transform into option
     *
     * @return Option
     */
    toOption(): Option<T>;
}

export interface ResOk<T, E = never> extends Result<T, E> {
    /**
     * Get the value from the result (can be the Ok value or the Err value
     * @return The value from the result
     */
    extract(): T;

    /**
     * Get the value from the result, but if it's of type Err, return the defaultValue
     * @param defaultValue The default value
     * @return The value from the result or the default value
     */
    getOrElse<R>(defaultValue: R): T;

    /**
     * Match
     *
     * Execute the ok function in match if the result is an ok
     * Execute the err function in match if the result is an error
     *
     * @param match The match object
     * @return The returned value of the first or second function
     */
    match<U>(fn: Match<T, never, U>): Result<U, never>;

    /**
     * Flat Match
     *
     * Execute the ok function in match if the result is an ok
     * Execute the err function in match if the result is an error
     *
     * @param match object
     * @return The returned value of the first or second function
     */
    // flatMatch<U>(f: FlatMatch<T, E, U>): Result<U, E>;

    /**
     * Map
     *
     * @param f The function to be called
     * @return A result with an ok or an err
     */
    map<U>(f: (val: T) => U): ResOk<U, never>;

    /**
     * Map on error
     *
     * @param f The function to be called
     * @return A result with an ok or an err
     */
    mapErr<U>(f: (err: E) => U): ResOk<T, never>;

    /**
     * Flatmap
     *
     * @param f The function to be called
     * @return A result with an ok or an err
     */
    flatMap<U>(f: (val: T) => Result<U, E>): Result<U, E>;

    /**
     * Flatmap on error
     *
     * @param f The function to be called
     * @return A result with an ok or an err
     */
    flatMapErr<U>(f: (err: E) => Result<U, E>): Result<T, E>;

    /**
     * Transform into option
     *
     * @return Option
     */
    toOption(): Option<T>;
}

export interface ResErr<T, E> extends Result<T, E> {
    /**
     * Get the value from the result (can be the Ok value or the Err value
     * @return The value from the result
     */
    extract(): E;

    /**
     * Get the value from the result, but if it's of type Err, return the defaultValue
     * @param defaultValue The default value
     * @return The value from the result or the default value
     */
    getOrElse<R>(defaultValue: R): R;

    /**
     * Match
     *
     * Execute the ok function in match if the result is an ok
     * Execute the err function in match if the result is an error
     *
     * @param match The match object
     * @return The returned value of the first or second function
     */
    match<U>(fn: Match<never, E, U>): Result<never, U>;

    /**
     * Flat Match
     *
     * Execute the ok function in match if the result is an ok
     * Execute the err function in match if the result is an error
     *
     * @param match object
     * @return The returned value of the first or second function
     */
    // flatMatch<U>(f: FlatMatch<T, E, U>): Result<U, E>;

    /**
     * Map
     *
     * @param f The function to be called
     * @return A result with an ok or an err
     */
    map<U>(f: (val: T) => U): ResErr<never, E>;

    /**
     * Map on error
     *
     * @param f The function to be called
     * @return A result with an ok or an err
     */
    mapErr<U>(f: (err: E) => U): ResErr<never, U>;

    /**
     * Flatmap
     *
     * @param f The function to be called
     * @return A result with an ok or an err
     */
    flatMap<U>(f: (val: T) => Result<U, E>): ResErr<never, E>;

    /**
     * Flatmap on error
     *
     * @param f The function to be called
     * @return A result with an ok or an err
     */
    flatMapErr<U>(f: (err: E) => Result<U, E>): Result<U, E>;

    /**
     * Transform into option
     *
     * @return Option
     */
    toOption(): Option<T>;
}

/**
 * Ok object
 */
export function Ok<T, E = never>(val: T): ResOk<T, E> { // tslint:disable-line
    return {
        type: ResultType.OK,
        isOk(): boolean {
            return true;
        },
        isErr(): boolean {
            return false;
        },
        extract(): T {
            return val;
        },
        getOrElse<R>(_: R): T {
            return val;
        },
        match<U>(matchObject: Match<T, never, U>): ResOk<U, never> {
            return Ok(matchObject.ok(val));
        },
        /* flatMatch<U>(matchObject: FlatMatch<T, E, U>): Result<U, E> {
            return matchObject.ok(val);
        }, */
        map<U>(fn: (val: T) => U): ResOk<U, never> {
            return Ok(fn(val));
        },
        mapErr<U>(_fn: (err: E) => U): ResOk<T, never> {
            return Ok(val);
        },
        flatMap<U>(f: (val: T) => Result<U, E>): Result<U, E> {
            return f(val);
        },
        flatMapErr(): ResOk<T, E> {
            return Ok(val);
        },
        toOption(): Option<T> {
            return Some(val!);
        },
        run<U>(gen: Generator<Result<T, E>|undefined, Result<U, E>, T>): Result<U, E> {
            /**
             * One step a a time
             */
            const step = (value: T): Result<U, E> => {
                const result = gen.next(value);
                result.value = result.value === undefined ? this : result.value;
                if (result.done) {
                    return result.value;
                }
                return result.value!.flatMap(step);
            };
            return step(val);
        },
    };
}

/**
 * Err object
 */
export function Err<T, E>(err: E): ResErr<T, E> { // tslint:disable-line
    return {
        type: ResultType.ERR,
        isOk(): boolean {
            return false;
        },
        isErr(): boolean {
            return true;
        },
        extract(): E {
            return err;
        },
        getOrElse<R>(defaultValue: R): R {
            return defaultValue;
        },
        match<U>(matchObject: Match<never, E, U>): ResErr<never, U>  {
            return Err(matchObject.err(err));
        },
        /* flatMatch<U>(matchObject: FlatMatch<T, E, U>): Result<U, E> {
            return matchObject.err(err);
        }, */
        map(): ResErr<never, E> {
            return Err(err);
        },
        mapErr<U>(fn: (err: E) => U): ResErr<never, U> {
            return Err(fn(err));
        },
        flatMap(): ResErr<never, E> {
            return Err(err);
        },
        flatMapErr<U>(f: (err: E) => Result<U, E>): Result<U, E> {
            return f(err);
        },
        toOption(): Option<T> {
            return None;
        },
        run() {
            return Err(err);
        },
    };
}
