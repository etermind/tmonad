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

    it('should run the generator and return a result', async () => {
        const doubling = async (n: number) => Result.ok(n * 2);
        const opt = Promise.resolve(Result.ok(4));
        const res = AsyncResult.run(function* () {
            const n = yield opt;
            const d = yield doubling(n);
            return Promise.resolve(Result.ok(d));
        }());
        (await res.getOrElse(10)).should.equal(8);
    });

    it('should run the generator and return an error', async () => {
        const doubling = async (n: number) => Result.ok(n * 2);
        const opt = Promise.resolve(Result.err<number, Error>(new Error('test')));
        const res = AsyncResult.run(function* () {
            const n = yield opt;
            const d = yield doubling(n);
            return Promise.resolve(Result.ok(d));
        }());
        (await res.getOrElse(10)).should.equal(10);
    });

    it('should say yes when it is err', async () => {
        (await AsyncResult.err('test').isErr()).should.be.true;
    });

    it('should say yes when it has an ok', async () => {
        (await AsyncResult.ok(4).isOk()).should.be.true;
    });

    it('should say no when it has a value and we are checking for err', async () => {
        (await Result.ok(4).isErr()).should.be.false;
    });

    it('should say no when it is an error and we are checking for ok', async () => {
        (await Result.err('test').isOk()).should.be.false;
    });

    it('should extract the value to the error type when it is an error', async () => {
        (await AsyncResult.err<number, string>('test').extract()).should.equal('test');
    });

    it('should extract the value to something when it is ok', async () => {
        (await AsyncResult.ok(4).extract()).should.equal(4);
    });

    /*it('should transform the result to an option with a value', async () => {
        const res = AsyncResult.ok(4);
        res.toOption().isSome().should.be.true;
        res.toOption().isNone().should.be.false;
    });

    it('should transform the result to an option with null', async () => {
        const res = Result.err<string, Error>(new Error('test'));
        res.toOption().isNone().should.be.true;
        res.toOption().isSome().should.be.false;
    });*/

    it('should call the first function when it is an ok', async () => {
        const ifOk = async (o: string) => o.should.equal('ok');
        const ifErr = async (e: Error) => {
            throw e;
        };

        const res = AsyncResult.ok('ok');
        await res.match(ifOk, ifErr);
    });

    it('should call the second function when it is an ok', async () => {
        const ifOk = async (o: string) => o.should.equal('ok');
        const ifErr = async (e: number) => e.should.equal(4);

        const res = AsyncResult.err<string, number>(4);
        await res.match(ifOk, ifErr);
    });

    it('should call the second function when it is an err', async () => {
        const ifOk = async (o: string) => o.should.equal('ok');
        const ifErr = async (e: number) => e.should.equal(4);

        const res = AsyncResult.err<string, number>(4);
        await res.match(ifOk, ifErr);
    });

    it('should retrieve the returned value of the 1st function when it is an ok', async () => {
        const ifOk = async () => 4;
        const ifErr = async () => 'test';

        const res = AsyncResult.ok('test');
        (await res.match(ifOk, ifErr)).should.equal(4);
    });

    it('should retrieve the returned value of the 2nd function when it is an err', async () => {
        const ifOk = async () => 'test';
        const ifErr = async () => 4;

        const res = AsyncResult.err<number, string>('test');
        (await res.match(ifOk, ifErr)).should.equal(4);
    });
});
