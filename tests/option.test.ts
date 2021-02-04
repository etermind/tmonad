import * as Chai from 'chai';
import { Option } from '../lib';

const should = Chai.should();

/**
 * Option
 */
describe('Option', () => {
    it('should evaluate to none', () => {
        const opt = Option.none<string>();
        opt.getOrElse('none').should.equal('none');
    });

    it('should evaluate to some', () => {
        const opt = Option.some(2);
        opt.getOrElse(4).should.equal(2);
    });

    it('should evaluate to none when fromValue is giving null', () => {
        const opt = Option.fromValue<string>(null);
        opt.getOrElse('none').should.equal('none');
    });

    it('should evaluate to some when fromValue is giving something else than null/undef', () => {
        const opt = Option.fromValue(2);
        opt.getOrElse(4).should.equal(2);
    });

    it('should return the else when option evaluates to none', () => {
        const opt = Option.none<string>();
        opt.getOrElse('test').should.equal('test');
    });

    it('should return the value when option evaluates to some', () => {
        const opt = Option.some(4);
        opt.getOrElse(2).should.equal(4);
    });

    it('should apply the function and return an option (with some)', () => {
        const opt = Option.some(4);
        const res = opt.map(n => n * 2);
        res.getOrElse(10).should.equal(8);
    });

    it('should apply the function and return an option (with none)', () => {
        const opt = Option.none<number>();
        const res = opt.map((n: number) => n * 2);
        res.getOrElse(10).should.equal(10);
    });

    it('should apply the function and return the value', () => {
        Option.some(4).flatMap(n => Option.some(n * 2)).getOrElse(10).should.equal(8);
    });

    it('should apply the function and return none', () => {
        Option.none<number>().flatMap(n => Option.some(n * 2)).getOrElse(10).should.equal(10);
    });

    it('should run the generator and return an option', () => {
        const doubling = (n: number) => Option.some(n * 2);
        const opt = Option.some(4);
        const res = Option.run(function* () {
            const n = yield opt;
            const d = yield doubling(n);
            return Option.some(d);
        }());
        res.getOrElse(10).should.equal(8);
    });

    it('should run the generator and return none', () => {
        const doubling = (n: number) => Option.some(n * 2);
        const opt = Option.none<number>();
        const res = Option.run(function* () {
            const n = yield opt;
            const d = yield doubling(n);
            return Option.some(d);
        }());
        res.getOrElse(10).should.equal(10);
    });

    it('should say yes when it is none', () => {
        Option.none<number>().isNone().should.be.true;
    });

    it('should say yes when it has a value', () => {
        Option.some<number>(4).isSome().should.be.true;
    });

    it('should say no when it has a value and we are checking for none', () => {
        Option.some<number>(4).isNone().should.be.false;
    });

    it('should say no when it is none and we are checking for some', () => {
        Option.none<number>().isSome().should.be.false;
    });

    it('should extract the value to null when it is none', () => {
        (Option.none<number>().extract() === null).should.be.true;
    });

    it('should extract the value to something when it is some', () => {
        (Option.some<number>(4).extract() === 4).should.be.true;
    });
});
