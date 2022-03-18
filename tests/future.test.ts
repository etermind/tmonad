import * as Chai from 'chai';
import { Future } from '../lib';

const should = Chai.should();

/**
 * Future
 */
describe('Future#Init', () => {
    it('should call the success function in case of success', () => {
        const res = new Future<number>((resolve) => {
            resolve(15);
            return () => true;
        });
        res.extract(d => d.should.equal(15), () => true.should.be.false);
    });

    it('should call the error function in case of failure', async () => {
        const res = new Future<string>((resolve, reject) => {
            reject(new Error('error'));
            return () => true;
        });
        res.extract(d => true.should.be.false, e => e.message.should.contain('error'));
    });

    it('should return the else when it evaluates to failure', async () => {
        const res = Future.reject(new Error('error'));
        const ret = await res.awaitOrElse(4);
        ret.should.equal(4);
    });

    it('should return the value when it evaluates to success', async () => {
        const res = Future.of(4);
        (await res.awaitOrElse(2)).should.equal(4);
    });
});

/**
 * Map
 */
describe('Future#Map', () => {
    it('should apply the function and return a future (with success)', async () => {
        const res = Future.of(4);
        const res2 = res.map(n => n * 2);
        (await res2.awaitOrElse(10)).should.equal(8);
    });

    it('should apply the function and return a future (with failure)', async () => {
        const res = Future.reject(new Error('test'));
        const res2 = res.map(n => n * 2);
        (await res2.awaitOrElse(10)).should.equal(10);
    });

    it('should apply the function on the error and return a new Future (1)', async () => {
        const res = Future.of(4);
        const res2 = res.mapErr(() => 8);
        (await res2.awaitOrElse(10)).should.equal(4);
    });

    it('should apply the function on the error and return a new Future (2)', async () => {
        const res = Future.reject(new Error('test'));
        const res2 = res.mapErr(() => 8);
        (await res2.await()).should.equal(8);
    });
});

/**
 * Flatmap
 */
describe('Future#Flatmap', () => {
    it('should apply the function and return the value', async () => {
        const res = Future.of(4)
            .flatMap(n => Future.of(n * 2));
        (await res.awaitOrElse(10)).should.equal(8);
    });

    it('should apply the function and return err', async () => {
        const res = Future.reject(new Error('test'))
            .flatMap(n => Future.of(n * 2));
        (await res.awaitOrElse(10)).should.equal(10);
    });

    it('should apply the function on the error and return a new Future', async () => {
        const res = Future.reject(new Error('test'))
            .flatMapErr(() => Future.of(4));
        (await res.awaitOrElse(10)).should.equal(4);
    });

    it('should apply the function on the error and return a new Result', async () => {
        const res = Future.reject(new Error('test'))
            .flatMapErr(() => Future.reject(new Error('test')));
        (await res.awaitOrElse(10)).should.equal(10);
    });

    it('should apply the function on the error and return the same future', async () => {
        const res = Future.of('test')
            .flatMapErr(() => Future.of(4));
        (await res.awaitOrElse(10)).should.equal('test');
    });

    it('should apply the function on the error and handle any throwing', async () => {
        const res = Future.reject(new Error('test')).flatMapErr<number>(() => {
            throw new Error('neiiin');
        });
        (await res.awaitOrElse(10)).should.equal(10);
    });

    it('should apply the function on the success and handle any throwing', async () => {
        const res = Future.of('test').flatMap<number>(() => {
            throw new Error('neiiin');
        });
        (await res.awaitOrElse(10)).should.equal(10);
    });
});

/**
 * Future transforms
 */
describe('Future#Transform', () => {
    it('should transform the future to an option with a value', async () => {
        const res = Future.of(4);
        (await res.toOption()).isSome().should.be.true;
    });

    it('should transform the future to an option with null', async () => {
        const res = Future.reject('test');
        (await res.toOption()).isNone().should.be.true;
    });

    it('should transform the future to a result with a value', async () => {
        const res = Future.of(4);
        (await res.toResult()).isOk().should.be.true;
    });

    it('should transform the future to a result with an error', async () => {
        const res = Future.reject('test');
        (await res.toResult()).isErr().should.be.true;
    });

    it('should transform into a promise', () => {
        const res = Future.of(4);
        res.await().should.be.an.instanceOf(Promise);
    });

    it('should transform a promise into a future', async () => {
        const p = new Promise<number>((resolve, reject) => {
            resolve(4);
        });
        const f = Future.fromP(p);
        (await f.awaitOrElse(10)).should.equal(4);
    });

    it('should transform a promise into a future and handle error', async () => {
        const p = new Promise((resolve, reject) => {
            reject(new Error('Kill'));
        });
        const f = Future.fromP(p, (e) => e.message);
        try {
            await f.await();
            true.should.be.false;
        }
        catch(err: any) {
            err.should.equal('Kill');
        }
    });
});

/**
 * Match
 */
describe('Future#Match', () => {
    it('should call the first function when it is an ok', () => {
        const match = {
            onSuccess: (o: string) => o.should.equal('ok'),
            onFailure: (e: Error) => {
                throw e;
            },
        };

        const res = Future.of('ok');
        res.match(match);
    });

    it('should call the second function when it is an error', () => {
        const match = {
            onSuccess: (o: string) => o.should.equal('ok'),
            onFailure: (e: string) => e.should.equal('test'),
        };

        const res = Future.reject('test');
        res.match(match);
    });
});

/**
 * FlatMatch
 */
describe('Future#FlatMatch', () => {
    it('should call the first function when it is an ok and return the Result', async () => {
        const match = {
            onSuccess: (o: any) => Future.of(4),
            onFailure: (e: any) => {
                throw e;
            },
        };

        const res = Future.of('ok');
        const res2 = res.flatMatch(match);
        (await res2.await()).should.equal(4);
    });

    it('should call the second function when it is an error and return the Result', async () => {
        const match = {
            onSuccess: (o: string) => Future.of(o),
            onFailure: () => Future.reject('nein'),
        };

        const res = Future.reject('nada');
        const res2 = res.flatMatch(match);
        (await res2.awaitOrElse(10)).should.equal(10);
    });
});

/**
 * Cancel
 */
describe('Future#Cancel', () => {
    it('should handle the cancel function when using of', (done) => {
        const x = 3;
        let t1: any = undefined;
        let t2: any = undefined;
        const f = Future.of(4, () => {
            (x+1).should.equal(4);
            clearTimeout(t1);
            clearTimeout(t2);
            done();
            return true;
        });

        const c = f.extract(() => {
            t1 = setTimeout(() => {
                true.should.be.false;
            }, 5000);
        }, () => {
            t2 = setTimeout(() => {
                true.should.be.false;
            }, 5000);
        });
        c();
    });

    it('should handle the cancel function when using reject', (done) => {
        const x = 3;
        let t1: any = undefined;
        let t2: any = undefined;
        const f = Future.reject(4, () => {
            (x+1).should.equal(4);
            clearTimeout(t1);
            clearTimeout(t2);
            done();
            return true;
        });

        const c = f.extract(() => {
            t1 = setTimeout(() => {
                true.should.be.false;
            }, 5000);
        }, () => {
            t2 = setTimeout(() => {
                true.should.be.false;
            }, 5000);
        });
        c();
    });
});
