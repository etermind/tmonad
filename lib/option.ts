/**
 * Option Monad
 */
export default class Option<T> {
    /**
     * Holding the value
     */
    private _value: NonNullable<T> | null;

    private constructor(value: NonNullable<T> | null) {
        this._value = value;
    }

    /**
     * Return an option with a value
     *
     * @param value The value
     * @return Option<T> with a value
     */
    static some<T>(value: NonNullable<T>) {
        return new Option(value);
    }

    /**
     * Return an option with no value
     * @return Option<T> with null
     */
    static none<T>() {
        return new Option<T>(null);
    }

    /**
     * Create an option with a possibly null or undefined value
     */
    static fromValue<T>(value: NonNullable<T> | null) {
        return value ? Option.some(value) : Option.none<T>();
    }

    /**
     * Run a series of options into a generator
     *
     * @param gen The generator function
     * @return An option with null or a value
     */
    static run<R>(gen: IterableIterator<Option<R>>): Option<R> {
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
     * Check if option is some
     */
    isSome(): boolean {
        return this._value !== null;
    }

    /**
     * Check if option is none
     */
    isNone(): boolean {
        return this._value === null;
    }

    /**
     * Map
     *
     * @param f The function to be called
     * @return An option with a value or null
     */
    map<R>(f: (wrapped: NonNullable<T>) => NonNullable<R>): Option<R> {
        if (this._value === null) {
            return Option.none<R>();
        }
        return Option.some(f(this._value));

    }

    /**
     * Flatmap
     *
     * @param f The function to be called
     * @return An option with a value or null
     */
    flatMap<R>(f: (wrapped: NonNullable<T>) => Option<R>): Option<R> {
        if (this._value === null) {
            return Option.none<R>();
        }
        return f(this._value);

    }

    /**
     * Get the value from option, but if it's null, return the defaultValue
     * @param defaultValue The default value
     * @return The value from the option or the default value
     */
    getOrElse(defaultValue: NonNullable<T>): NonNullable<T> {
        return this._value === null ? defaultValue : this._value;
    }

    /**
     * Get the value from option
     * @return The value from the option or none if no value exists
     */
    extract(): NonNullable<T> | null {
        return this._value;
    }
}
