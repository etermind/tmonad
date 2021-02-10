export enum OptionType {
    NONE,
    SOME,
}

/**
 * FlatMatch pattern
 */
export interface FlatMatch<T, U> {
    /**
     * Some
     */
    some: (val: T) => Option<U>;

    /**
     * None
     */
    none: () => Option<U>;
}

/**
 * Match pattern
 */
export interface Match<T, U> {
    /**
     * Some
     */
    some: (val: T) => U;

    /**
     * None
     */
    none: () => U;
}

export interface Option<T> {
    /**
     * Option type
     */
    type: OptionType;

    /**
     * Check if option is some
     */
    isSome(): boolean;

    /**
     * Check if option is none
     */
    isNone(): boolean;

    /**
     * Map
     *
     * @param f The function to be called
     * @return An option with a value or null
     */
    map<R>(f: (wrapped: T) => R): Option<R>;

    /**
     * Flatmap
     *
     * @param f The function to be called
     * @return An option with a value or null
     */
    flatMap<R>(f: (wrapped: T) => Option<R>): Option<R>;

    /**
     * Match
     *
     * @param fn Match interface
     * @return The result of the matched function
     */
    match<U>(fn: Match<T, U>): Option<U>;

    /**
     * FlatMatch
     *
     * @param fn FlatMatch interface
     * @return The result of the matched function
     */
    flatMatch<U>(fn: FlatMatch<T, U>): Option<U>;

    /**
     * Run using generator
     *
     * @param gen The generator
     * @return A new option
     */
    run<U>(gen: Generator<Option<T>|undefined, Option<U>, T>): Option<U>;

    /**
     * Get the value from option, but if it's null, return the defaultValue
     * @param defaultValue The default value
     * @return The value from the option or the default value
     */
    getOrElse<R>(defaultValue: R): T|R;

    /**
     * Get the value from option
     * @return The value from the option or none if no value exists
     */
    extract(): T | null;
}

export interface OptSome<T> extends Option<T> {
    /**
     * Map
     *
     * @param f The function to be called
     * @return An option with a value or null
     */
    map<R>(f: (wrapped: T) => R): OptSome<R>;

    /**
     * Get the value from option, but if it's null, return the defaultValue
     * @param defaultValue The default value
     * @return The value from the option or the default value
     */
    getOrElse<R>(defaultValue: R): T;

    /**
     * Get the value from option
     * @return The value from the option or none if no value exists
     */
    extract(): T;
}

export interface OptNone<T> extends Option<T> {
    /**
     * Map
     *
     * @param f The function to be called
     * @return An option with a value or null
     */
    map<R>(f: (wrapped: T) => R): OptNone<R>;

    /**
     * Get the value from option, but if it's null, return the defaultValue
     * @param defaultValue The default value
     * @return The value from the option or the default value
     */
    getOrElse<R>(defaultValue: R): R;

    /**
     * Get the value from option
     * @return The value from the option or none if no value exists
     */
    extract(): null;
}

/**
 * None constructor
 */
export function noneConstructor<T>(): OptNone<T> {
    return {
        type: OptionType.NONE,
        isSome(): boolean {
            return false;
        },
        isNone(): boolean {
            return true;
        },
        extract(): null {
            return null;
        },
        getOrElse<R>(defaultValue: R): R {
            return defaultValue;
        },
        map<R>(): OptNone<R> {
            return noneConstructor<R>();
        },
        flatMap<R>(): Option<R> {
            return noneConstructor<R>();
        },
        match<U>(fn: Match<T, U>): Option<U> {
            return Some(fn.none());
        },
        flatMatch<U>(fn: FlatMatch<T, U>): Option<U> {
            return fn.none();
        },
        run<U>(): OptNone<U> {
            return noneConstructor<U>();
        },
    };
}

/**
 * Some constructor
 */
export function someConstructor<T>(val: T): OptSome<T> {
    return {
        type: OptionType.SOME,
        isSome(): boolean {
            return true;
        },
        isNone(): boolean {
            return false;
        },
        extract(): T {
            return val;
        },
        getOrElse<R>(_: R): T {
            return val;
        },
        map<R>(fn: (wrapped: T) => R): OptSome<R> {
            const res = fn(val);
            return someConstructor<R>(res);
        },
        flatMap<R>(fn: (wrapped: T) => Option<R>): Option<R> {
            return fn(val);
        },
        match<U>(fn: Match<T, U>): Option<U> {
            return Some(fn.some(val));
        },
        flatMatch<U>(fn: FlatMatch<T, U>): Option<U> {
            return fn.some(val);
        },
        run<U>(gen: Generator<Option<T>, Option<U>, T|undefined>): Option<U> {
            /**
             * One step a a time
             */
            const step = (value: T): Option<U> => {
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
 * Some
 */
export function Some<T>(val?: T | null): Option<T> { // tslint:disable-line
    return val === undefined || val === null
    ? noneConstructor<T>()
    : someConstructor<T>(val as T);
}

/**
 * None
 */
export const None = noneConstructor<any>(); // tslint:disable-line
