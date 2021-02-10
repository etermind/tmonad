import * as Chai from 'chai';
import { Err, Ok, Result } from '../lib';

const should = Chai.should();

/**
 * Result
 */
describe('Result', () => {
    it('should evaluate to err', () => {
        const res = Err(new Error('Test'));
        res.isErr().should.be.true;
    });

    it('should evaluate to ok', () => {
        const res = Ok('ok');
        res.isOk().should.be.true;
    });

    it('should return the else when it evaluates to err', () => {
        const res = Err(new Error('Test'));
        res.getOrElse('test').should.equal('test');
    });

    it('should return the value when it evaluates to ok', () => {
        const res = Ok(4);
        res.getOrElse(2).should.equal(4);
    });

    it('should apply the function and return a result (with ok)', () => {
        const res = Ok(4);
        const res2 = res.map(n => n * 2);
        res2.getOrElse(10).should.equal(8);
    });

    it('should apply the function and return a result (with err)', () => {
        const res = Err(new Error('test'));
        const res2 = res.map(n => n * 2);
        res2.getOrElse(10).should.equal(10);
    });

    it('should apply the function on the error and return a new Result (1)', () => {
        const res = Ok(4);
        const res2 = res.mapErr(n => n * 2);
        res2.getOrElse(10).should.equal(4);
    });

    it('should apply the function on the error and return a new Result (2)', () => {
        const res = Err(4);
        const res2 = res.mapErr(n => n * 2);
        res2.extract().should.equal(8);
    });

    it('should apply the function and return the value', () => {
        Ok(4)
            .flatMap(n => Ok(n * 2))
            .getOrElse(10).should.equal(8);
    });

    it('should apply the function and return err', () => {
        Err(new Error('test'))
            .flatMap((n: number) => Ok(n * 2))
            .getOrElse(10).should.equal(10);

    });

    it('should apply the function on the error and return a new Result', () => {
        Err(4)
            .flatMapErr(n => Err(n * 2))
            .getOrElse(10).should.equal(10);
    });

    it('should apply the function on the error and return a new Result', () => {
        Err(4)
            .flatMapErr(n => Ok(n * 2))
            .getOrElse(10).should.equal(8);
    });

    it('should not apply the function when it is ok', () => {
        Ok(4)
            .flatMapErr(() => Ok(8))
            .getOrElse(10).should.equal(4);
    });

    it('should run the generator and return a result', () => {
        const doubling = (n: number) => Ok(n * 2);
        const opt = Ok(4);
        const res = opt.run<number, Error>(function* () {
            const n = yield;
            const d = yield doubling(n);
            return Ok(d);
        }());
        res.getOrElse(10).should.equal(8);
    });

    it('should run the generator and return an error', () => {
        const doubling = (n: number) => Ok(n * 2);
        const opt = Err(new Error('test'));
        const res = opt.run<number, Error>(function* () {
            const n = yield;
            const d = yield doubling(n);
            return Ok(d);
        }());
        res.getOrElse(10).should.equal(10);
    });

    it('should say yes when it is err', () => {
        Err('test').isErr().should.be.true;
    });

    it('should say yes when it has an ok', () => {
        Ok(4).isOk().should.be.true;
    });

    it('should say no when it has a value and we are checking for err', () => {
        Ok(4).isErr().should.be.false;
    });

    it('should say no when it is an error and we are checking for ok', () => {
        Err('test').isOk().should.be.false;
    });

    it('should extract the value to the error type when it is an error', () => {
        Err('test').extract().should.equal('test');
    });

    it('should extract the value to something when it is ok', () => {
        Ok(4).extract().should.equal(4);
    });

    it('should transform the result to an option with a value', () => {
        const res = Ok(4);
        res.toOption().isSome().should.be.true;
        res.toOption().isNone().should.be.false;
    });

    it('should transform the result to an option with null', () => {
        const res = Err(new Error('test'));
        res.toOption().isNone().should.be.true;
        res.toOption().isSome().should.be.false;
    });

    it('should call the first function when it is an ok', () => {
        const match = {
            ok: (o: string) => o.should.equal('ok'),
            err: (e: Error) => {
                throw e;
            },
        };

        const res = Ok('ok');
        res.match(match);
    });

    it('should call the second function when it is an error', () => {
        const match = {
            ok: (o: string) => o.should.equal('ok'),
            err: (e: number) => e.should.equal(4),
        };

        const res = Err(4);
        res.match(match);
    });

    it('should call the second function when it is an err', () => {
        const match = {
            ok: (o: string) => o.should.equal('ok'),
            err: (e: number) => e.should.equal(4),
        };

        const res = Err(4);
        res.match(match);
    });

    it('should retrieve the returned value of the 1st function when it is an ok', () => {
        const match = {
            ok: () => 4,
            err: () => 2,
        };
        const res = Ok('test');
        res.match(match).extract().should.equal(4);
    });

    it('should retrieve the returned value of the 2nd function when it is an err', () => {
        const match = {
            ok: () => 'test',
            err: () => 'nok',
        };

        const res = Err('test');
        res.match(match).extract().should.equal('nok');
    });

    // it('should call the first function when it is an ok and return the Result', () => {
    //     const match = {
    //         ok: (o: any) => Ok(4),
    //         err: (e: any) => {
    //             throw e;
    //         },
    //     };

    //     /* const res = Ok('ok');
    //     const res2 = res.flatMatch(match);
    //     res2.extract().should.equal(4);*/
    // });

    // it('should call the second function when it is an error and return the Result', () => {
    //     const match = {
    //         ok: (o: string) => Ok(o),
    //         err: (e: number) => Ok('nein'),
    //     };

    //     /* const res = Err(4);
    //     const res2 = res.flatMatch(match);
    //     res2.isOk().should.be.true;
    //     res2.extract().should.equal('nein');*/
    // });
});
