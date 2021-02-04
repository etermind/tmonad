import * as Chai from 'chai';
import { AsyncOption, Option } from '../lib';

const should = Chai.should();

/**
 * Option
 */
describe('AsyncOption', () => {
    it('should evaluate to none', async () => {
        const opt = AsyncOption.none<string>();
        (await opt.isNone()).should.be.true;
    });

    it('should evaluate to some', async () => {
        const opt = AsyncOption.some(2);
        (await opt.isSome()).should.be.true;
    });

    it('should evaluate to none when fromValue is giving null', async () => {
        const opt = AsyncOption.fromValue<string>(null);
        (await opt.isNone()).should.be.true;
    });

    it('should evaluate to some when fromValue '
        + 'is giving something else than null/undef', async () => {
        const opt = AsyncOption.fromValue(2);
        (await opt.isSome()).should.be.true;
    });

    it('should evaluate to none when fromPromise is Promise<null>', async () => {
        const opt = AsyncOption.fromPromise<string>(Promise.resolve(null));
        (await opt.isNone()).should.be.true;
    });

    it('should evaluate to some when fromPromise is Promise<T>', async () => {
        const opt = AsyncOption.fromPromise<string>(Promise.resolve('ok'));
        (await opt.isSome()).should.be.true;
    });

    it('should return the else when option evaluates to none', async () => {
        const opt = AsyncOption.none<string>();
        (await opt.getOrElse('test')).should.equal('test');
    });

    it('should return the value when option evaluates to some', async () => {
        const opt = AsyncOption.some(4);
        (await opt.getOrElse(2)).should.equal(4);
    });

    it('should apply the function and return an option (with some)', async () => {
        const opt = AsyncOption.some(4);
        const res = opt.map(n => n * 2);
        (await res.getOrElse(10)).should.equal(8);
    });

    it('should apply the function and return an option (with none)', async () => {
        const opt = AsyncOption.none<number>();
        const res = opt.map((n: number) => n * 2);
        (await res.getOrElse(10)).should.equal(10);
    });

    it('should apply the function and return none in case of an error', async () => {
        const opt = AsyncOption.some(8);
        const res = opt.map((n: number) => {
            if (n === 8) {
                throw new Error('test');
            }
            return n * 2;
        });
        (await res.getOrElse(10)).should.equal(10);
    });

    it('should apply the function and return the value', async () => {
        (await AsyncOption.some(4)
            .flatMap(async n => Option.some(n * 2))
            .getOrElse(10)
        ).should.equal(8);
    });

    it('should apply the function and return none', async () => {
        (await AsyncOption.none<number>()
            .flatMap(async n => Option.some(n * 2))
            .getOrElse(10)).should.equal(10);
    });

    it('should apply the function and return none in case of error', async () => {
        (await AsyncOption.some(4)
            .flatMap(async (n: number) => {
                if (n === 4) {
                    throw new Error('test');
                }
                return Option.some(8);
            })
            .getOrElse(10)).should.equal(10);
    });

    it('should run the generator and return an option', async () => {
        const doubling = async (n: number) => Option.some(n * 2);
        const opt = Promise.resolve(Option.some(4));
        const res = AsyncOption.run(function* () {
            const n = yield opt;
            const d = yield doubling(n);
            return Promise.resolve(Option.some(d));
        }());
        (await res.getOrElse(10)).should.equal(8);
    });

    it('should run the generator and return none', async () => {
        const doubling = async (n: number) => Option.some(n * 2);
        const opt = Promise.resolve(Option.none<number>());
        const res = AsyncOption.run(function* () {
            const n = yield opt;
            const d = yield doubling(n);
            return Promise.resolve(Option.some(d));
        }());
        (await res.getOrElse(10)).should.equal(10);
    });

    it('should run the generator and return none in case of error (1)', async () => {
        const doubling = async (n: number) => {
            throw new Error('test');
        };
        const opt = Promise.resolve(Option.none<number>());
        const res = AsyncOption.run(function* () {
            const n = yield opt;
            const d = yield doubling(n);
            return Promise.resolve(Option.some(d));
        }());
        (await res.getOrElse(10)).should.equal(10);
    });

    it('should run the generator and return none in case of error (2)', async () => {
        const doubling = async (n: number) => Option.some(n * 2);
        const opt = Promise.reject(new Error('test'));
        const res = AsyncOption.run(function* () {
            const n = yield opt;
            const d = yield doubling(n);
            return Promise.resolve(Option.some(d));
        }());
        (await res.getOrElse(10)).should.equal(10);
    });

    it('should run the generator and return none in case of error (2)', async () => {
        const doubling = async (n: number) => Option.some(n * 2);
        const opt = Promise.resolve(Option.some<number>(2));
        const res = AsyncOption.run(function* () {
            const n = yield opt;
            const d = yield doubling(n);
            return Promise.reject(new Error('test'));
        }());
        (await res.getOrElse(10)).should.equal(10);
    });

    it('should say yes when it is none', async () => {
        (await AsyncOption.none<number>().isNone()).should.be.true;
    });

    it('should say yes when it has a value', async () => {
        (await AsyncOption.some<number>(4).isSome()).should.be.true;
    });

    it('should say no when it has a value and we are checking for none', async () => {
        (await AsyncOption.some<number>(4).isNone()).should.be.false;
    });

    it('should say no when it is none and we are checking for some', async () => {
        (await AsyncOption.none<number>().isSome()).should.be.false;
    });

    it('should extract the value to null when it is none', async () => {
        (await AsyncOption.none<number>().extract() === null).should.be.true;
    });

    it('should extract the value to something when it is some', async () => {
        (await AsyncOption.some<number>(4).extract() === 4).should.be.true;
    });
});
