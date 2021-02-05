import * as Chai from 'chai';
import { Result, AsyncResult } from '../lib';

const should = Chai.should();

/**
 * AsyncResult
 */
describe('AsyncResult', () => {
    it('should evaluate to err', async () => {
        const res = AsyncResult.err(new Error('Test'));
        (await res.isErr()).should.be.true;
    });

    it('should evaluate to ok', async () => {
        const res = AsyncResult.ok<string>('ok');
        (await res.isOk()).should.be.true;
    });

    it('should return the else when it evaluates to err', async () => {
        const res = AsyncResult.err<string, Error>(new Error('Test'));
        (await res.getOrElse('test')).should.equal('test');
    });

    it('should return the value when it evaluates to ok', async () => {
        const res = AsyncResult.ok(4);
        (await res.getOrElse(2)).should.equal(4);
    });

    it('should apply the function and return a result (with ok)', async () => {
        const res = AsyncResult.ok<number>(4);
        const res2 = res.map(n => n * 2);
        (await res2.getOrElse(10)).should.equal(8);
    });

    it('should apply the function and return a result (with err)', async () => {
        const res = AsyncResult.err<number, Error>(new Error('test'));
        const res2 = res.map((n: number) => n * 2);
        (await res2.getOrElse(10)).should.equal(10);
    });

    it('should throw in the function and return a result (with err)', async () => {
        const res = AsyncResult.ok<number, Error>(2);
        const res2 = res.map((n: number) => {
            if (n === 2) {
                throw new Error('test');
            }
            return n * 2;
        });

        const extracted = await res2.extract();
        (extracted as Error).message.should.equal('test');
    });

    it('should apply the function on error and return a result (1)', async () => {
        const res = AsyncResult.ok<number, string>(4);
        const res2 = res.mapErr(async () => 8);
        (await res2.getOrElse(10)).should.equal(4);
    });

    it('should apply the function on error and return a result (2)', async () => {
        const res = AsyncResult.err<number, string>('test');
        const res2 = res.mapErr(async () => 'nein');
        (await res2.getOrElse(10)).should.equal(10);
    });

    it('should apply the function on error and return an error if the promise throws', async () => {
        const res = AsyncResult.err<number, Error>(new Error('test'));
        const res2 = res.mapErr<Error>(async () => { throw Error('error'); });
        (await res2.extract() as Error).message.should.equal('error');
    });

    it('should apply the function and return the value', async () => {
        (await AsyncResult.ok(4)
            .flatMap(async n => Result.ok(n * 2))
            .getOrElse(10)).should.equal(8);
    });

    it('should apply the function and return err', async () => {
        (await AsyncResult.err<number, Error>(new Error('test'))
            .flatMap(async n => Result.ok(n * 2))
            .getOrElse(10)).should.equal(10);
    });

    it('should throw in the function and return a result with an err', async () => {
        const res = AsyncResult.ok<number, Error>(2)
            .flatMap(async (n) => {
                if (n === 2) {
                    throw new Error('test');
                }
                return Result.ok(n * 2);
            });

        const extracted = await res.extract();
        (extracted as Error).message.should.equal('test');
    });

    it('should apply the function on error and return the value (1)', async () => {
        (await AsyncResult.ok(4)
            .flatMapErr(async () => Result.ok(2))
            .getOrElse(10)).should.equal(4);
    });

    it('should apply the function on error and return the value (2)', async () => {
        (await AsyncResult.err<number, number>(4)
            .flatMapErr(async n => Result.ok<number, number>(n * 2))
            .getOrElse(10)).should.equal(8);
    });

    it('should apply the function on error and return an error if the promise throws', async () => {
        const res = AsyncResult.err<number, Error>(new Error('test'));
        const res2 = res.flatMapErr<Error>(async () => { throw Error('error'); });
        (await res2.extract() as Error).message.should.equal('error');
    });

    it('should run the generator and return a result', async () => {
        const doubling = async (n: number) => Result.ok(n * 2);
        const opt = Promise.resolve(Result.ok(4));
        const res = AsyncResult.run<number, never>(function* () {
            const n = yield opt;
            const d = yield doubling(n);
            return Promise.resolve(Result.ok(d));
        }());
        (await res.getOrElse(10)).should.equal(8);
    });

    it('should run the generator and return an error', async () => {
        const doubling = async (n: number) => Result.ok(n * 2);
        const opt = Promise.resolve(Result.err<number, Error>(new Error('test')));
        const res = AsyncResult.run<number, Error>(function* () {
            const n = yield opt;
            const d = yield doubling(n);
            return Promise.resolve(Result.ok(d));
        }());
        (await res.getOrElse(10)).should.equal(10);
    });

    it('should run the generator and return err in case of error (1)', async () => {
        const doubling = async (n: number) => {
            throw new Error('myErr');
        };
        const opt = Promise.resolve(Result.err<number, Error>(new Error('ERR')));
        const res = AsyncResult.run<number, Error>(function* () {
            const n = yield opt;
            const d = yield doubling(n);
            return Promise.resolve(Result.ok(d));
        }());
        (await res.getOrElse(10)).should.equal(10);
        (await res.extract() as Error).message.should.equal('myErr');
    });

    it('should run the generator and return none in case of error (2)', async () => {
        const doubling = async (n: number) => Result.ok<number, Error>(n * 2);
        const opt = Promise.reject(new Error('test'));
        const res = AsyncResult.run(function* () {
            const n = yield opt;
            const d = yield doubling(n);
            return Promise.resolve(Result.ok(d));
        }());

        const extracted = await res.extract();
        (extracted as Error).message.should.equal('test');
    });

    it('should run the generator and return none in case of error (3)', async () => {
        const doubling = async (n: number) => Result.ok<number, Error>(n * 2);
        const opt = Promise.resolve(Result.ok<number, Error>(2));
        const res = AsyncResult.run(function* () {
            const n = yield opt;
            const d = yield doubling(n);
            return Promise.reject(new Error('test'));
        }());

        const extracted = await res.extract();
        (extracted as Error).message.should.equal('test');
    });

    it('should say yes when it is err', async () => {
        (await AsyncResult.err('test').isErr()).should.be.true;
    });

    it('should say yes when it has an ok', async () => {
        (await AsyncResult.ok(4).isOk()).should.be.true;
    });

    it('should say no when it has a value and we are checking for err', async () => {
        (await AsyncResult.ok(4).isErr()).should.be.false;
    });

    it('should say no when it is an error and we are checking for ok', async () => {
        (await AsyncResult.err('test').isOk()).should.be.false;
    });

    it('should extract the value to the error type when it is an error', async () => {
        (await AsyncResult.err<number, string>('test').extract()).should.equal('test');
    });

    it('should extract the value to something when it is ok', async () => {
        (await AsyncResult.ok(4).extract()).should.equal(4);
    });

    it('should transform the result to an AsyncOption with a value', async () => {
        const res = AsyncResult.ok(4);
        (await res.toAsyncOption().isSome()).should.be.true;
        (await res.toAsyncOption().isNone()).should.be.false;
    });

    it('should transform the result to an AsyncOption with null', async () => {
        const res = AsyncResult.err<string, Error>(new Error('test'));
        (await res.toAsyncOption().isNone()).should.be.true;
        (await res.toAsyncOption().isSome()).should.be.false;
    });

    it('should call the first function when it is an ok', async () => {
        const ifOk = async (o: string) => o.should.equal('ok');
        const ifErr = async (e: Error) => {
            throw e;
        };

        const res = AsyncResult.ok('ok');
        res.match(ifOk, ifErr);
    });

    it('should call the second function when it is an ok', async () => {
        const ifOk = async (o: string) => o.should.equal('ok');
        const ifErr = async (e: number) => e.should.equal(4);

        const res = AsyncResult.err<string, number>(4);
        res.match(ifOk, ifErr);
    });

    it('should call the second function when it is an err', async () => {
        const ifOk = async (o: string) => o.should.equal('ok');
        const ifErr = async (e: number) => e.should.equal(4);

        const res = AsyncResult.err<string, number>(4);
        res.match(ifOk, ifErr);
    });

    it('should retrieve the returned value of the 1st function when it is an ok', async () => {
        const ifOk = async () => 4;
        const ifErr = async () => 'test';

        const res = AsyncResult.ok('test');
        (await res.match(ifOk, ifErr).extract()).should.equal(4);
    });

    it('should retrieve the returned value of the 2nd function when it is an err', async () => {
        const ifOk = async () => 'test';
        const ifErr = async () => 4;

        const res = AsyncResult.err<number, string>('test');
        (await res.match(ifOk, ifErr).extract()).should.equal(4);
    });

    it('should retrieve the returned value of the 1st function when it is an Ok', async () => {
        const ifOk = async () => Result.ok<string, number>('test');
        const ifErr = async () => Result.err<string, number>(4);

        const res = AsyncResult.ok<number, string>(4);
        (await res.flatMatch(ifOk, ifErr).extract()).should.equal('test');
    });

    it('should retrieve the returned value of the 2nd function when it is an error', async () => {
        const ifOk = async () => Result.ok<string, number>('test');
        const ifErr = async () => Result.err<string, number>(4);

        const res = AsyncResult.err<number, string>('test');
        (await res.flatMatch(ifOk, ifErr).extract() as number).should.equal(4);
    });
});
