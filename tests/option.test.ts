import * as Chai from "chai";
import { None, Some, Option } from "../lib/index.js";

const should = Chai.should();

/**
 * Option
 */
describe("Option", () => {
    it("should evaluate to none", () => {
        const opt = None;
        opt.getOrElse("none").should.equal("none");
    });

    it("should evaluate to some", () => {
        const opt = Some(2);
        opt.getOrElse(4).should.equal(2);
    });

    it("should evaluate to none when fromValue is giving null", () => {
        const opt = Some<string>(null);
        opt.getOrElse("none").should.equal("none");
    });

    it("should return the else when option evaluates to none", () => {
        const opt = None;
        opt.getOrElse("test").should.equal("test");
    });

    it("should return the value when option evaluates to some", () => {
        const opt = Some(4);
        opt.getOrElse(2).should.equal(4);
    });

    it("should apply the function and return an option (with some)", () => {
        const opt = Some(4);
        const res = opt.map((n) => n * 2);
        res.getOrElse(10).should.equal(8);
    });

    it("should apply the function and return an option (with none)", () => {
        const opt = None;
        const res = opt.map((n: number) => n * 2);
        res.getOrElse(10).should.equal(10);
    });

    it("should apply the function and return the value", () => {
        Some(4)
            .flatMap((n) => Some(n * 2))
            .getOrElse(10)
            .should.equal(8);
    });

    it("should apply the function and return none", () => {
        None.flatMap((n) => Some(n * 2))
            .getOrElse(10)
            .should.equal(10);
    });

    it("should run the generator and return an option", () => {
        const doubling = (n: number) => Some(n * 2);
        const opt = Some(4);
        const res = opt.run<number>(
            (function* () {
                const n = yield; // yield the value of opt
                const d = yield doubling(n);
                return Some(d);
            })()
        );
        res.getOrElse(10).should.equal(8);
    });

    it("should run the generator and return none", () => {
        const doubling = (n: number) => Some(n * 2);
        const opt = None;
        const res = opt.run(
            (function* () {
                const n = yield;
                const d = yield doubling(n);
                return Some(d);
            })()
        );
        res.getOrElse(10).should.equal(10);
    });

    it("should match on the some function", () => {
        const match = {
            some: (o: number) => o * 2,
            none: () => 2,
        };

        const opt = Some(4);
        const res = opt.match(match);
        res.getOrElse(4).should.equal(8);
    });

    it("should match on the none function", () => {
        const match = {
            some: (o: number) => o * 2,
            none: () => 2,
        };

        const opt = None;
        const res = opt.match(match);
        res.getOrElse(4).should.equal(2);
    });

    it("should match on the some function (flatMatch)", () => {
        const match = {
            some: (o: number) => Some(o * 2),
            none: () => Some(2),
        };

        const opt = Some(4);
        const res = opt.flatMatch(match);
        res.getOrElse(4).should.equal(8);
    });

    it("should match on the none function (flatMatch)", () => {
        const match = {
            some: (o: number) => Some(o * 2),
            none: () => Some(2),
        };

        const opt = None;
        const res = opt.flatMatch(match);
        res.getOrElse(1).should.equal(2);
    });

    it("should say yes when it is none", () => {
        None.isNone().should.be.true;
    });

    it("should say yes when it has a value", () => {
        Some<number>(4).isSome().should.be.true;
    });

    it("should say no when it has a value and we are checking for none", () => {
        Some<number>(4).isNone().should.be.false;
    });

    it("should say no when it is none and we are checking for some", () => {
        None.isSome().should.be.false;
    });

    it("should extract the value to null when it is none", () => {
        (None.extract() === null).should.be.true;
    });

    it("should extract the value to something when it is some", () => {
        (Some(4).extract() === 4).should.be.true;
    });
});
