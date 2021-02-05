import * as Chai from 'chai';
import { Result } from '../lib';

const should = Chai.should();

/**
 * Result
 */
describe('Result', () => {
    it('should evaluate to err', () => {
        const res = Result.err(new Error('Test'));
        res.isErr().should.be.true;
    });

    it('should evaluate to ok', () => {
        const res = Result.ok<string>('ok');
        res.isOk().should.be.true;
    });

    it('should return the else when it evaluates to err', () => {
        const res = Result.err<string, Error>(new Error('Test'));
        res.getOrElse('test').should.equal('test');
    });

    it('should return the value when it evaluates to ok', () => {
        const res = Result.ok(4);
        res.getOrElse(2).should.equal(4);
    });

    it('should apply the function and return a result (with ok)', () => {
        const res = Result.ok<number>(4);
        const res2 = res.map(n => n * 2);
        res2.getOrElse(10).should.equal(8);
    });

    it('should apply the function and return a result (with err)', () => {
        const res = Result.err<number, Error>(new Error('test'));
        const res2 = res.map((n: number) => n * 2);
        res2.getOrElse(10).should.equal(10);
    });

    it('should apply the function on the error and return a new Result (1)', () => {
        const res = Result.ok<number>(4);
        const res2 = res.mapErr(n => n * 2);
        res2.getOrElse(10).should.equal(4);
    });

    it('should apply the function on the error and return a new Result (2)', () => {
        const res = Result.err<number, number>(4);
        const res2 = res.mapErr(n => n * 2);
        res2.extract().should.equal(8);
    });

    it('should apply the function and return the value', () => {
        Result.ok(4)
            .flatMap(n => Result.ok(n * 2))
            .getOrElse(10).should.equal(8);
    });

    it('should apply the function and return err', () => {
        Result.err<number, Error>(new Error('test'))
            .flatMap(n => Result.ok(n * 2))
            .getOrElse(10).should.equal(10);
    });

    it('should apply the function on the error and return a new Result', () => {
        Result.err<string, number>(4)
            .flatMapErr(n => Result.err<string, number>(n * 2))
            .getOrElse(10).should.equal(10);
    });

    it('should apply the function on the error and return a new Result', () => {
        Result.err<number, number>(4)
            .flatMapErr(n => Result.ok<number, number>(n * 2))
            .getOrElse(10).should.equal(8);
    });

    it('should not apply the function when it is ok', () => {
        Result.ok<number, Error>(4)
            .flatMapErr(n => Result.ok<number, Error>(8))
            .getOrElse(10).should.equal(4);
    });

    it('should run the generator and return a result', () => {
        const doubling = (n: number) => Result.ok(n * 2);
        const opt = Result.ok(4);
        const res = Result.run(function* () {
            const n = yield opt;
            const d = yield doubling(n);
            return Result.ok(d);
        }());
        res.getOrElse(10).should.equal(8);
    });

    it('should run the generator and return an error', () => {
        const doubling = (n: number) => Result.ok(n * 2);
        const opt = Result.err<number, Error>(new Error('test'));
        const res = Result.run(function* () {
            const n = yield opt;
            const d = yield doubling(n);
            return Result.ok(d);
        }());
        res.getOrElse(10).should.equal(10);
    });

    it('should say yes when it is err', () => {
        Result.err('test').isErr().should.be.true;
    });

    it('should say yes when it has an ok', () => {
        Result.ok(4).isOk().should.be.true;
    });

    it('should say no when it has a value and we are checking for err', () => {
        Result.ok(4).isErr().should.be.false;
    });

    it('should say no when it is an error and we are checking for ok', () => {
        Result.err('test').isOk().should.be.false;
    });

    it('should extract the value to the error type when it is an error', () => {
        Result.err<number, string>('test').extract().should.equal('test');
    });

    it('should extract the value to something when it is ok', () => {
        Result.ok(4).extract().should.equal(4);
    });

    it('should transform the result to an option with a value', () => {
        const res = Result.ok(4);
        res.toOption().isSome().should.be.true;
        res.toOption().isNone().should.be.false;
    });

    it('should transform the result to an option with null', () => {
        const res = Result.err<string, Error>(new Error('test'));
        res.toOption().isNone().should.be.true;
        res.toOption().isSome().should.be.false;
    });

    it('should call the first function when it is an ok', () => {
        const ifOk = (o: string) => o.should.equal('ok');
        const ifErr = (e: Error) => {
            throw e;
        };

        const res = Result.ok('ok');
        res.match(ifOk, ifErr);
    });

    it('should call the second function when it is an error', () => {
        const ifOk = (o: string) => o.should.equal('ok');
        const ifErr = (e: number) => e.should.equal(4);

        const res = Result.err<string, number>(4);
        res.match(ifOk, ifErr);
    });

    it('should call the second function when it is an err', () => {
        const ifOk = (o: string) => o.should.equal('ok');
        const ifErr = (e: number) => e.should.equal(4);

        const res = Result.err<string, number>(4);
        res.match(ifOk, ifErr);
    });

    it('should retrieve the returned value of the 1st function when it is an ok', () => {
        const ifOk = () => 4;
        const ifErr = () => 'test';

        const res = Result.ok('test');
        res.match(ifOk, ifErr).extract().should.equal(4);
    });

    it('should retrieve the returned value of the 2nd function when it is an err', () => {
        const ifOk = () => 'test';
        const ifErr = () => 4;

        const res = Result.err<number, string>('test');
        res.match(ifOk, ifErr).extract().should.equal(4);
    });

    it('should call the first function when it is an ok and return the Result', () => {
        const ifOk = (o: string) => Result.ok<number, Error>(4);
        const ifErr = (e: Error) => {
            throw e;
        };

        const res = Result.ok<string, Error>('ok');
        const res2 = res.flatMatch(ifOk, ifErr);
        res2.extract().should.equal(4);
    });

    it('should call the second function when it is an error and return the Result', () => {
        const ifOk = (o: string) => Result.ok<string, string>(o);
        const ifErr = (e: number) => Result.ok<string, string>('nein');

        const res = Result.err<string, number>(4);
        const res2 = res.flatMatch(ifOk, ifErr);
        res2.isOk().should.be.true;
        res2.extract().should.equal('nein');
    });
});
