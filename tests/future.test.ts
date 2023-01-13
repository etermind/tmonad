import * as Chai from "chai";
import { Future } from "../lib/index.js";

const should = Chai.should();

/**
 * Future
 */
describe("Future#Init", () => {
    it("should call the success function in case of success", () => {
        const res = new Future<number>((resolve) => {
            resolve(15);
            return () => true;
        });
        res.extract(
            (d) => d.should.equal(15),
            () => true.should.be.false
        );
    });

    it("should call the error function in case of failure", async () => {
        const res = new Future<string>((resolve, reject) => {
            reject(new Error("error"));
            return () => true;
        });
        res.extract(
            (d) => true.should.be.false,
            (e) => e.message.should.contain("error")
        );
    });

    it("should return the else when it evaluates to failure", async () => {
        const res = Future.reject(new Error("error"));
        const ret = await res.awaitOrElse(4);
        ret.should.equal(4);
    });

    it("should return the value when it evaluates to success", async () => {
        const res = Future.of(4);
        (await res.awaitOrElse(2)).should.equal(4);
    });
});

/**
 * Map
 */
describe("Future#Map", () => {
    it("should apply the function and return a future (with success)", async () => {
        const res = Future.of(4);
        const res2 = res.map((n) => n * 2);
        (await res2.awaitOrElse(10)).should.equal(8);
    });

    it("should apply the function and return a future (with failure)", async () => {
        const res = Future.reject(new Error("test"));
        const res2 = res.map((n) => n * 2);
        (await res2.awaitOrElse(10)).should.equal(10);
    });

    it("should apply the function on the error and return a new Future (1)", async () => {
        const res = Future.of(4);
        const res2 = res.mapErr(() => 8);
        (await res2.awaitOrElse(10)).should.equal(4);
    });

    it("should apply the function on the error and return a new Future (2)", async () => {
        const res = Future.reject(new Error("test"));
        const res2 = res.mapErr(() => 8);
        try {
            await res2.await();
            true.should.be.false; // Should never be executed
        } catch (err: any) {
            err.should.equal(8);
        }
    });
});

/**
 * Flatmap
 */
describe("Future#Flatmap", () => {
    it("should apply the function and return the value", async () => {
        const res = Future.of(4).flatMap((n) => Future.of(n * 2));
        (await res.awaitOrElse(10)).should.equal(8);
    });

    it("should apply the function and return err", async () => {
        const res = Future.reject(new Error("test")).flatMap((n) =>
            Future.of(n * 2)
        );
        (await res.awaitOrElse(10)).should.equal(10);
    });

    it("should apply the function on the error and return a new Future", async () => {
        const res = Future.reject(new Error("test")).flatMapErr(() =>
            Future.reject(4)
        );
        (await res.awaitOrElse(10)).should.equal(10);
    });

    it("should apply the function on the error and return a new Result", async () => {
        const res = Future.reject(new Error("test")).flatMapErr(() =>
            Future.reject(new Error("test"))
        );
        (await res.awaitOrElse(10)).should.equal(10);
    });

    it("should apply the function on the error and return the same future", async () => {
        const res = Future.of("test").flatMapErr(() => Future.reject(4));
        (await res.awaitOrElse(10)).should.equal("test");
    });

    it("should apply the function on the error and handle any throwing", async () => {
        const res = Future.reject(new Error("test")).flatMapErr<number>(() => {
            throw new Error("neiiin");
        });
        (await res.awaitOrElse(10)).should.equal(10);
    });

    it("should apply the function on the success and handle any throwing", async () => {
        const res = Future.of("test").flatMap<number>(() => {
            throw new Error("neiiin");
        });
        (await res.awaitOrElse(10)).should.equal(10);
    });
});

/**
 * Future transforms
 */
describe("Future#Transform", () => {
    it("should transform the future to an option with a value", async () => {
        const res = Future.of(4);
        (await res.toOption()).isSome().should.be.true;
    });

    it("should transform the future to an option with null", async () => {
        const res = Future.reject("test");
        (await res.toOption()).isNone().should.be.true;
    });

    it("should transform the future to a result with a value", async () => {
        const res = Future.of(4);
        (await res.toResult()).isOk().should.be.true;
    });

    it("should transform the future to a result with an error", async () => {
        const res = Future.reject("test");
        (await res.toResult()).isErr().should.be.true;
    });

    it("should transform into a promise", () => {
        const res = Future.of(4);
        res.await().should.be.an.instanceOf(Promise);
    });

    it("should transform a promise into a future", async () => {
        const p = new Promise<number>((resolve, reject) => {
            resolve(4);
        });
        const f = Future.fromP(p);
        (await f.awaitOrElse(10)).should.equal(4);
    });

    it("should transform a promise into a future and handle error", async () => {
        const p = new Promise((resolve, reject) => {
            reject(new Error("Kill"));
        });
        const f = Future.fromP(p, (e) => e.message);
        try {
            await f.await();
            true.should.be.false;
        } catch (err: any) {
            err.should.equal("Kill");
        }
    });
});

/**
 * Match
 */
describe("Future#Match", () => {
    it("should call the first function when it is an ok", () => {
        const match = {
            onSuccess: (o: string) => o.should.equal("ok"),
            onFailure: (e: Error) => {
                throw e;
            },
        };

        const res = Future.of("ok");
        res.match(match);
    });

    it("should call the second function when it is an error", () => {
        const match = {
            onSuccess: (o: string) => o.should.equal("ok"),
            onFailure: (e: string) => e.should.equal("test"),
        };

        const res = Future.reject("test");
        res.match(match);
    });
});

/**
 * FlatMatch
 */
describe("Future#FlatMatch", () => {
    it("should call the first function when it is an ok and return the Result", async () => {
        const match = {
            onSuccess: (o: any) => Future.of(4),
            onFailure: (e: any) => {
                throw e;
            },
        };

        const res = Future.of("ok");
        const res2 = res.flatMatch(match);
        (await res2.await()).should.equal(4);
    });

    it("should call the second function when it is an error and return the Result", async () => {
        const match = {
            onSuccess: (o: string) => Future.of(o),
            onFailure: () => Future.reject("nein"),
        };

        const res = Future.reject("nada");
        const res2 = res.flatMatch(match);
        (await res2.awaitOrElse(10)).should.equal(10);
    });

    it(
        "should call the first function on flatMatchErr" +
            "when it is an ok and return the Result",
        async () => {
            const match = {
                onSuccess: (o: any) => Future.reject("ok"),
                onFailure: (e: any) => Future.reject("err"),
            };
            const res = Future.of(2);
            try {
                await res.flatMatchErr(match).await();
                true.should.be.false;
            } catch (err: any) {
                err.should.equal("ok");
            }
        }
    );

    it(
        "should call the second function on flatMatchErr " +
            "when it is an ok and return the Result",
        async () => {
            const match = {
                onSuccess: (o: any) => Future.reject("ok"),
                onFailure: (e: any) => Future.reject("err"),
            };
            const res = Future.reject(2);
            try {
                await res.flatMatchErr(match).await();
                true.should.be.false;
            } catch (err: any) {
                err.should.equal("err");
            }
        }
    );
});

/**
 * Cancel
 */
describe("Future#Cancel", () => {
    it("should handle the cancel function when using of", (done) => {
        const x = 3;
        let t1: any = undefined;
        let t2: any = undefined;
        const f = Future.of(4, () => {
            (x + 1).should.equal(4);
            clearTimeout(t1);
            clearTimeout(t2);
            done();
            return true;
        });

        const c = f.extract(
            () => {
                t1 = setTimeout(() => {
                    true.should.be.false;
                }, 5000);
            },
            () => {
                t2 = setTimeout(() => {
                    true.should.be.false;
                }, 5000);
            }
        );
        c();
    });

    it("should handle the cancel function when using reject", (done) => {
        const x = 3;
        let t1: any = undefined;
        let t2: any = undefined;
        const f = Future.reject(4, () => {
            (x + 1).should.equal(4);
            clearTimeout(t1);
            clearTimeout(t2);
            done();
            return true;
        });

        const c = f.extract(
            () => {
                t1 = setTimeout(() => {
                    true.should.be.false;
                }, 5000);
            },
            () => {
                t2 = setTimeout(() => {
                    true.should.be.false;
                }, 5000);
            }
        );
        c();
    });
});

/**
 * Seq
 */
describe("Future#seq", () => {
    const sleep = (ms: number) =>
        new Future<boolean, never>((resolve) => {
            const x = setTimeout(() => {
                resolve(true);
            }, ms);
            return () => {
                clearTimeout(x);
                return true;
            };
        });

    const date: Future<Date> = new Future((resolve) => {
        resolve(new Date());
        return () => true;
    });

    const sleepP = (ms: number) => () =>
        new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, ms);
        });

    const dateP = () => new Promise((resolve) => resolve(new Date()));

    it("should get a list of results when everything succeed", async () => {
        const res = await Future.seq([
            Future.of(true),
            Future.of(false),
            Future.of(true),
        ]).await();

        res.should.have.lengthOf(3);
        res[0].should.be.true;
        res[1].should.be.false;
        res[2].should.be.true;
    });

    it("should reject when one of the futures rejects", async () => {
        try {
            const res = await Future.seq([
                Future.of(true),
                Future.reject(new Error("rejection")),
                Future.of(true),
            ]).await();
            true.should.be.false;
        } catch (err: any) {
            err.message.should.equal("rejection");
        }
    });

    it("should apply the futures sequentially (1)", async () => {
        const res = await Future.seq([
            date,
            sleep(2000),
            date,
            sleep(2000),
            date,
        ]).await();
        const elasped = (res[2] as Date).getTime() - (res[0] as Date).getTime();
        elasped.should.be.within(1750, 2300);
        const elasped2 =
            (res[4] as Date).getTime() - (res[2] as Date).getTime();
        elasped2.should.be.within(1750, 2300);
    });

    it("should apply the future sequentially when using fromP", async () => {
        const res = await Future.seq([
            Future.fromP(dateP),
            Future.fromP(sleepP(2000)),
            Future.fromP(dateP),
            Future.fromP(sleepP(2000)),
            Future.fromP(dateP),
        ]).await();
        const elasped = (res[2] as Date).getTime() - (res[0] as Date).getTime();
        elasped.should.be.within(1750, 2300);
        const elasped2 =
            (res[4] as Date).getTime() - (res[2] as Date).getTime();
        elasped2.should.be.within(1750, 2300);
    });

    it("should work with an array of futures and not a tuple", async () => {
        const futs = [Future.of(true), Future.of(1)];
        const res = await Future.seq(futs).await();
        res[0].should.be.true;
        res[1].should.equal(1);
    });
});

/**
 * Seq
 */
describe("Future#seqSafe", () => {
    const sleep = (ms: number) =>
        new Future<boolean, never>((resolve) => {
            const x = setTimeout(() => {
                resolve(true);
            }, ms);
            return () => {
                clearTimeout(x);
                return true;
            };
        });

    const date: Future<Date> = new Future((resolve) => {
        resolve(new Date());
        return () => true;
    });

    const sleepP = (ms: number) => () =>
        new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, ms);
        });

    const dateP = () => new Promise((resolve) => resolve(new Date()));

    it("should get a list of results when everything succeed", async () => {
        const res = await Future.seqSafe([
            Future.of(true),
            Future.of(false),
            Future.of(true),
        ]).await();

        res.should.have.lengthOf(3);
        res[0].should.be.true;
        res[1].should.be.false;
        res[2].should.be.true;
    });

    it("should keep the error when one of the futures rejects", async () => {
        const res = await Future.seqSafe([
            Future.of(true),
            Future.reject(new Error("rejection")),
            Future.of(true),
        ]).await();
        const [x, y, z] = res;
        x.should.be.true;
        y.message.should.equal("rejection");
        z.should.be.true;
    });

    it("should apply the futures sequentially (1)", async () => {
        const res = await Future.seqSafe([
            date,
            sleep(2000),
            date,
            sleep(2000),
            date,
        ]).await();
        const elasped = (res[2] as Date).getTime() - (res[0] as Date).getTime();
        elasped.should.be.within(1750, 2300);
        const elasped2 =
            (res[4] as Date).getTime() - (res[2] as Date).getTime();
        elasped2.should.be.within(1750, 2300);
    });

    it("should apply the future sequentially when using fromP", async () => {
        const res = await Future.seqSafe([
            Future.fromP(dateP),
            Future.fromP(sleepP(2000)),
            Future.fromP(dateP),
            Future.fromP(sleepP(2000)),
            Future.fromP(dateP),
        ]).await();
        const elasped = (res[2] as Date).getTime() - (res[0] as Date).getTime();
        elasped.should.be.within(1750, 2300);
        const elasped2 =
            (res[4] as Date).getTime() - (res[2] as Date).getTime();
        elasped2.should.be.within(1750, 2300);
    });

    it("should work with an array of futures and not a tuple", async () => {
        const futs = [Future.of(true), Future.of(1)];
        const res = await Future.seqSafe(futs).await();
        res[0].should.be.true;
        res[1].should.equal(1);
    });
});

/**
 * All
 */
describe("Future#all", () => {
    const sleep = (ms: number) =>
        new Future<boolean, never>((resolve) => {
            const x = setTimeout(() => {
                resolve(true);
            }, ms);
            return () => {
                clearTimeout(x);
                return true;
            };
        });

    const date: Future<Date> = new Future((resolve) => {
        resolve(new Date());
        return () => true;
    });

    const sleepP = (ms: number) => () =>
        new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, ms);
        });

    const dateP = () => new Promise((resolve) => resolve(new Date()));

    it("should get a list of results when everything succeed", async () => {
        const res = await Future.all([
            Future.of(true),
            Future.of(false),
            Future.of(true),
        ]).await();

        res.should.have.lengthOf(3);
        res[0].should.be.true;
        res[1].should.be.false;
        res[2].should.be.true;
    });

    it("should reject when one of the futures rejects", async () => {
        try {
            const res = await Future.all([
                Future.of(true),
                Future.reject(new Error("rejection")),
                Future.of(true),
            ]).await();
            true.should.be.false;
        } catch (err: any) {
            err.message.should.equal("rejection");
        }
    });

    it("should reject when one of the futures rejects even with limit (1)", async () => {
        try {
            const res = await Future.all(
                [
                    Future.of(true),
                    Future.reject(new Error("rejection")),
                    Future.of(true),
                ],
                2
            ).await();
            true.should.be.false;
        } catch (err: any) {
            err.message.should.equal("rejection");
        }
    });

    it("should reject when one of the futures rejects even with limit (2)", async () => {
        try {
            const res = await Future.all(
                [
                    Future.of(true),
                    Future.of(true),
                    Future.reject(new Error("rejection")),
                ],
                2
            ).await();
            true.should.be.false;
        } catch (err: any) {
            err.message.should.equal("rejection");
        }
    });

    it("should resolve to an empty array when input is of length 0", async () => {
        const res = await Future.all([]).await();
        res.should.have.lengthOf(0);
    });

    it("should apply the futures in parallel (1)", async () => {
        const res = await Future.all([
            date,
            sleep(2000),
            date,
            sleep(2000),
            date,
        ]).await();
        const elasped = (res[2] as Date).getTime() - (res[0] as Date).getTime();
        elasped.should.be.within(0, 200);
        const elasped2 =
            (res[4] as Date).getTime() - (res[2] as Date).getTime();
        elasped2.should.be.within(0, 200);
    });

    it("should apply the future in parallel when using fromP", async () => {
        const res = await Future.all([
            Future.fromP(dateP),
            Future.fromP(sleepP(2000)),
            Future.fromP(dateP),
            Future.fromP(sleepP(2000)),
            Future.fromP(dateP),
        ]).await();
        const elasped = (res[2] as Date).getTime() - (res[0] as Date).getTime();
        elasped.should.be.within(0, 200);
        const elasped2 =
            (res[4] as Date).getTime() - (res[2] as Date).getTime();
        elasped2.should.be.within(0, 200);
    });

    it("should work with an array of futures and not a tuple", async () => {
        const futs = [Future.of(true), Future.of(1)];
        const res = await Future.all(futs).await();
        res[0].should.be.true;
        res[1].should.equal(1);
    });

    it("should apply the futures in parallel but respect the limit", async () => {
        const [d1, b1, d2, d3, b2, d4] = await Future.all(
            [date, sleep(1000), date, date, sleep(1000), date],
            3
        ).await();
        (d2.getTime() - d1.getTime()).should.be.within(0, 200);
        (d3.getTime() - d2.getTime()).should.be.within(800, 1200);
        (d4.getTime() - d3.getTime()).should.be.within(0, 200);
    });
});

/**
 * allSafe
 */
describe("Future#allSafe", () => {
    const sleep = (ms: number) =>
        new Future<boolean, never>((resolve) => {
            const x = setTimeout(() => {
                resolve(true);
            }, ms);
            return () => {
                clearTimeout(x);
                return true;
            };
        });

    const date: Future<Date, never> = new Future((resolve) => {
        resolve(new Date());
        return () => true;
    });

    const sleepP = (ms: number) => () =>
        new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, ms);
        });

    const dateP = () => new Promise((resolve) => resolve(new Date()));

    it("should get a list of results when everything succeed", async () => {
        const res = await Future.allSafe([
            Future.of(true),
            Future.of(false),
            Future.of(true),
        ]).await();

        res.should.have.lengthOf(3);
        res[0].should.be.true;
        res[1].should.be.false;
        res[2].should.be.true;
    });

    it("should keep the error when one of the futures rejects", async () => {
        const res = await Future.allSafe([
            Future.of(true),
            Future.reject(new Error("rejection")),
            Future.of(true),
        ]).await();
        const [x, y, z] = res;
        x.should.be.true;
        y.message.should.equal("rejection");
        z.should.be.true;
    });

    it("should keep the error when one of the futures rejects even with a limit", async () => {
        const res = await Future.allSafe(
            [
                Future.of(true),
                Future.reject(new Error("rejection")),
                Future.reject(new Error("rejection2")),
            ],
            2
        ).await();
        const [x, y, z] = res;
        x.should.be.true;
        y.message.should.equal("rejection");
        z.message.should.equal("rejection2");
    });

    it("should resolve to an empty array when input is of length 0", async () => {
        const res = await Future.allSafe([]).await();
        res.should.have.lengthOf(0);
    });

    it("should apply the futures in parallel (1)", async () => {
        const res = await Future.allSafe([
            date,
            sleep(2000),
            date,
            sleep(2000),
            date,
        ]).await();
        const elasped = (res[2] as Date).getTime() - (res[0] as Date).getTime();
        elasped.should.be.within(0, 200);
        const elasped2 =
            (res[4] as Date).getTime() - (res[2] as Date).getTime();
        elasped2.should.be.within(0, 200);
    });

    it("should apply the future in parallel when using fromP", async () => {
        const res = await Future.allSafe([
            Future.fromP(dateP),
            Future.fromP(sleepP(2000)),
            Future.fromP(dateP),
            Future.fromP(sleepP(2000)),
            Future.fromP(dateP),
        ]).await();
        const elasped = (res[2] as Date).getTime() - (res[0] as Date).getTime();
        elasped.should.be.within(0, 200);
        const elasped2 =
            (res[4] as Date).getTime() - (res[2] as Date).getTime();
        elasped2.should.be.within(0, 200);
    });

    it("should work with an array of futures and not a tuple", async () => {
        const futs = [Future.of(true), Future.of(1)];
        const res = await Future.allSafe(futs).await();
        res[0].should.be.true;
        res[1].should.equal(1);
    });

    it("should apply the futures in parallel but respect the limit", async () => {
        const [d1, b1, d2, d3, b2, d4] = await Future.allSafe(
            [date, sleep(1000), date, date, sleep(1000), date],
            3
        ).await();
        (d2.getTime() - d1.getTime()).should.be.within(0, 200);
        (d3.getTime() - d2.getTime()).should.be.within(800, 1200);
        (d4.getTime() - d3.getTime()).should.be.within(0, 200);
    });
});

/**
 * Future#swap
 */
describe("Future#swap", () => {
    it("should swap the values and extract the old error", async () => {
        const fut = Future.fromP(async () => {
            throw new Error("An error");
        });
        const e = await fut.swap().await();
        e.message.should.equal("An error");
    });

    it("should swap the values and extract the old success", async () => {
        const fut = Future.fromP(async () => {
            return 2;
        });
        fut.swap().extract(
            () => {},
            (d) => {
                d.should.equal(2);
            }
        );
    });
});

/**
 * Future#run
 */
describe("Future#run", () => {
    it("should return the value using generators", async () => {
        const f = Future.run(function* () {
            const bool = yield* Future._(Future.of(true));
            const str = yield* Future._(Future.of(bool ? "ok" : "nok"));
            return str;
        });

        const res = await f.await();
        res.should.equal("ok");
    });

    it("should throw an error even using generators", async () => {
        const f = Future.run(function* () {
            const bool = yield Future.reject(new Error("rejected"));
            const str = yield* Future._(Future.of(bool ? "ok" : "nok"));
            return str;
        });

        try {
            await f.await();
            should.fail("Never happen");
        } catch (err: any) {
            err.message.should.equal("rejected");
        }
    });

    it("should work with falsy values", async () => {
        const f = Future.run(function* () {
            yield* Future._(Future.of(true));
            const bool2 = yield* Future._(Future.of(false));
            return bool2;
        });
        const r = await f.await();
        r.should.be.false;
    });
});

/**
 * Future#from
 */
describe("Future#from", () => {
    it("should return a future from any non-async function and return its value", (done) => {
        const f = Future.from(() => 2 + 2);
        f.extract((d) => {
            d.should.equal(4);
            done();
        }, done);
    });

    it("should return a future and reject when the function throws", (done) => {
        const f = Future.from(() => JSON.parse("{"));
        f.extract(
            () => {
                should.fail("Should never be called");
                done();
            },
            (e) => {
                e.should.have.property("message");
                done();
            }
        );
    });
});

/**
 * Future#tap
 */
describe("Future#tap", () => {
    it("should invoke the callback on the Future data", (done) => {
        const f = Future.of(4);
        f.tap((d) => {
            d.should.equal(4);
        }).extract(
            () => done(),
            () => done()
        );
    });

    it("should never invoke the callback in case of rejection", (done) => {
        const f = Future.reject(new Error("message"));
        f.tap(() => {
            should.fail("Should never be called");
        }).extract(
            () => {
                done();
            },
            (e) => {
                e.message.should.equal("message");
                done();
            }
        );
    });
});

/**
 * Future#tapErr
 */
describe("Future#tapErr", () => {
    it("should invoke the callback on the Future error", (done) => {
        const f = Future.reject(4);
        f.tapErr((d) => {
            d.should.equal(4);
        }).extract(
            () => done(),
            () => done()
        );
    });

    it("should never invoke the callback on the Future data", (done) => {
        const f = Future.of(4);
        f.tapErr(() => {
            should.fail("Should never happen");
        }).extract(
            () => done(),
            () => done()
        );
    });
});
