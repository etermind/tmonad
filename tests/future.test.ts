import * as Chai from 'chai';
import { Future } from '../lib';

const should = Chai.should();

/**
 * Future
 */
describe('Future', () => {
    it('should evaluate to failure', async () => {
        const res = new Future(Promise.reject('test'));
        const ret = await res.isFailure();
        ret.should.be.true;
    });

    it('should evaluate to success', async () => {
        const res = new Future(Promise.resolve('test'));
        const ret = await res.isSuccess();
        ret.should.be.true;
    });

    it('should return the value in case of success', async () => {
        const res = new Future(Promise.resolve('test'));
        const ret = await res.extract();
        ret.should.equal('test');
    });

    it('should throw an error in case of failure', async () => {
        const res = new Future(Promise.reject('test'));
        try {
            await res.extract();
            true.should.be.true;
        } catch (err) {
            err.message.should.equal('test');
        }
    });

    it('should return the else when it evaluates to failure', async () => {
        const res = new Future(Promise.reject('test'));
        const ret = await res.getOrElse(4);
        ret.should.equal(4);
    });

    it('should return the value when it evaluates to success', async () => {
        const res = new Future(Promise.resolve(4));
        (await res.getOrElse(2)).should.equal(4);
    });

    it('should apply the function and return a future (with success)', async () => {
        const res = new Future<number>(Promise.resolve(4));
        const res2 = res.map<number>(async n => n * 2);
        (await res2.getOrElse(10)).should.equal(8);
    });

    it('should apply the function and return a future (with failure)', async () => {
        const res = new Future(Promise.reject('test'));
        const res2 = res.map<number>(async n => n * 2);
        (await res2.getOrElse(10)).should.equal(10);
    });

    it('should apply the function on the error and return a new Future (1)', async () => {
        const res = new Future<number>(Promise.resolve(4));
        const res2 = res.mapErr(async () => 8);
        (await res2.getOrElse(10)).should.equal(4);
    });

    it('should apply the function on the error and return a new Future (2)', async () => {
        const res = new Future(Promise.reject('test'));
        const res2 = res.mapErr(async () => 8);
        (await res2.extract()).should.equal(8);
    });

    it('should apply the function and return the value', async () => {
        const res = (new Future(Promise.resolve(4)))
            .flatMap<number>(n => new Future<number>(Promise.resolve(n * 2)))
            .getOrElse(10);
        (await res).should.equal(8);
    });

    it('should apply the function and return err', async () => {
        const res = (new Future(Promise.reject('test')))
            .flatMap<number>(n => new Future<number>(Promise.resolve(n * 2)))
            .getOrElse(10);
        (await res).should.equal(10);
    });

    it('should apply the function on the error and return a new Future', async () => {
        const res = (new Future(Promise.reject('test')))
            .flatMapErr<number>(() => new Future<number>(Promise.resolve(4)))
            .getOrElse(10);
        (await res).should.equal(4);
    });

    it('should apply the function on the error and return a new Result', async () => {
        const res = (new Future(Promise.reject('test')))
            .flatMapErr<number>(() => new Future<number>(Promise.reject('test')))
            .getOrElse(10);
        (await res).should.equal(10);
    });

    it('should apply the function on the error and return the same future', async () => {
        const res = (new Future(Promise.resolve('test')))
            .flatMapErr<number>(() => new Future<number>(Promise.resolve(4)))
            .getOrElse(10);
        (await res).should.equal('test');
    });

    it('should apply the function on the error and handle any throwing', async () => {
        const res = (new Future(Promise.reject('test')))
            .flatMapErr<number>(() => {
                throw new Error('neiiin');
            })
            .getOrElse(10);
        (await res).should.equal(10);
    });

    it('should run the generator and return a future', async () => {
        const doubling = (n: number) => Promise.resolve(n * 2);
        const opt = new Future(Promise.resolve(4));
        const res = opt.run(function* () {
            const n = yield;
            const d = yield doubling(n);
            return Promise.resolve(d);
        }());
        (await res.getOrElse(10)).should.equal(8);
    });

    it('should run the generator and return an error', async () => {
        const doubling = (n: number) => Promise.resolve(n * 2);
        const opt = new Future<number>(Promise.reject('test'));
        const res = opt.run(function* () {
            const n = yield;
            const d = yield doubling(n);
            return Promise.resolve(d);
        }());
        (await res.getOrElse(10)).should.equal(10);
    });

    it('should run the generator and return an error when a promise rejects', async () => {
        const opt = new Future<number>(Promise.resolve(4));
        const res = opt.run(function* () {
            const n = yield;
            const d = yield Promise.reject('test');
            return Promise.resolve(d);
        }());
        (await res.getOrElse(10)).should.equal(10);
    });

    it('should transform the future to an option with a value', async () => {
        const res = new Future(Promise.resolve(4));
        (await res.toOption()).isSome().should.be.true;
    });

    it('should transform the future to an option with null', async () => {
        const res = new Future(Promise.reject('test'));
        (await res.toOption()).isNone().should.be.true;
    });

    it('should transform the future to a result with a value', async () => {
        const res = new Future(Promise.resolve(4));
        (await res.toResult()).isOk().should.be.true;
    });

    it('should transform the future to a result with an error', async () => {
        const res = new Future(Promise.reject('test'));
        (await res.toResult()).isErr().should.be.true;
    });

    it('should call the first function when it is an ok', () => {
        const match = {
            onSuccess: async (o: string) => o.should.equal('ok'),
            onFailure: async (e: Error) => {
                throw e;
            },
        };

        const res = new Future(Promise.resolve('ok'));
        res.match(match);
    });

    it('should call the second function when it is an error', () => {
        const match = {
            onSuccess: async (o: string) => o.should.equal('ok'),
            onFailure: async (e: Error) => e.message.should.equal('test'),
        };

        const res = new Future(Promise.reject('test'));
        res.match(match);
    });

    it('should call the first function when it is an ok and return the Result', async () => {
        const match = {
            onSuccess: (o: any) => new Future(Promise.resolve(4)),
            onFailure: (e: any) => {
                throw e;
            },
        };

        const res = new Future(Promise.resolve('ok'));
        const res2 = res.flatMatch(match);
        (await res2.extract()).should.equal(4);
    });

    it('should call the second function when it is an error and return the Result', async () => {
        const match = {
            onSuccess: (o: string) => new Future(Promise.resolve(o)),
            onFailure: () => new Future(Promise.reject('nein')),
        };

        const res = new Future(Promise.reject('nada'));
        const res2 = res.flatMatch(match);
        (await res2.isFailure()).should.be.true;
        (await res2.getOrElse(10)).should.equal(10);
    });
});
