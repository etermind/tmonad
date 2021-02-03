import Option from './option';

/**
 * AsyncOption Monad
 */
export default class AsyncOption<T> {
    /**
     * Holding the value
     */
    private _runner: () => Promise<Option<T>>;

    private constructor(runner: () => Promise<Option<T>>) {
        this._runner = runner;
    }

    /**
     * Return an option with a value
     *
     * @param value The value
     * @return Option<T> with a value
     */
    static some<T>(value: NonNullable<T>) {
        return new AsyncOption(async () => Option.some(value));
    }

    /**
     * Return an option with no value
     * @return Option<T> with null
     */
    static none<T>() {
        return new AsyncOption<T>(async () => Option.none<T>());
    }

    /**
     * Create an option with a possibly null or undefined value
     */
    static fromValue<T>(value: NonNullable<T> | null) {
        return new AsyncOption<T>(async () => {
            if (value === null) {
                return Option.none<T>();
            }
            return Option.some<T>(value);
        });
    }

    /**
     * Run a series of options into a generator
     *
     * @param gen The generator function
     * @return An option with null or a value
     */
    static run<R>(gen: IterableIterator<Promise<Option<R>>>): AsyncOption<R> {
        const step = async (value?: any): Promise<Option<R>> => {
            const result = gen.next(value);
            if (result.done) {
                try {
                    return await result.value;
                } catch {
                    return Option.none<R>();
                }
            }

            try {
                const opt = await result.value;
                if (opt.isNone()) {
                    return Option.none<R>();
                }
                return await step(opt.extract() as NonNullable<R>);
            } catch {
                return Option.none<R>();
            }
        };

        return new AsyncOption(step);
    }

    /**
     * Map
     *
     * @param f The function to be called
     * @return An option with a value or null
     */
    map<R>(f: (wrapped: NonNullable<T>) => NonNullable<R>): AsyncOption<R> {
        return new AsyncOption<R>(async () => {
            try {
                const res = await this._runner();
                return res.map(f);
            } catch {
                return Option.none<R>();
            }
        });
    }

    /**
     * Flatmap
     *
     * @param f The function to be called
     * @return An option with a value or null
     */
    flatMap<R>(f: (wrapped: NonNullable<T>) => Promise<Option<R>>): AsyncOption<R> {
        return new AsyncOption<R>(async () => {
            try {
                const res = await this._runner();

                if (res.isNone()) {
                    return Option.none<R>();
                }

                return await f(res.extract() as NonNullable<T>);
            } catch {
                return Option.none<R>();
            }
        });
    }

    /**
     * Check if option is some
     */
    async isSome(): Promise<boolean> {
        return (await this._runner()).isSome();
    }

    /**
     * Check if option is none
     */
    async isNone(): Promise<boolean> {
        return (await this._runner()).isNone();
    }

    /**
     * Get the value from option, but if it's null, return the defaultValue
     * @param defaultValue The default value
     * @return The value from the option or the default value
     */
    async getOrElse(defaultValue: NonNullable<T>): Promise<NonNullable<T>> {
        const res = await this._runner();
        return res.getOrElse(defaultValue);
    }

    /**
     * Get the value from option
     * @return The value from the option or none if no value exists
     */
    async extract(): Promise<NonNullable<T> | null> {
        return (await this._runner()).extract();
    }
}
