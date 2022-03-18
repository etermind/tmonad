# TMonad 

## Description

This library is a functional programming library implementing some common monads in TypeScript: Option and Result. We inherit the terminology from the marvelous Rust language.

Contrary to most functional programming library, we:

- implement an interface that is easy to understand
- implement the async versions of Option and Result to be used with async/await and promise
- take advantage of the [generators](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Generator) to have an execution flow closer to imperative programming (thanks to this [blog article](https://codewithstyle.info/advanced-functional-programming-typescript-monads-generators/)).

However if you are looking for a full-feature pure functional programming library, I encourage you to look at [fp-ts](https://gcanti.github.io/fp-ts/) or [purify](https://gigobyte.github.io/purify/) which have a more comprehensive implementation.

## Overview

### How to install the library to be used in production-ready projects?

`npm install @etermind/tmonad --save`

### How to contribute to this library?

See [CONTRIBUTING.md](./CONTRIBUTING.md)

### Directory structure

```
.
├── lib
│   ├── future.ts
│   ├── index.ts
│   ├── option.ts
│   └── result.ts
├── CONTRIBUTING.md
├── LICENSE
├── package.json
├── README.md
├── tests
│   ├── future.test.ts
│   ├── option.test.ts
│   └── result.test.ts
├── tsconfig.json
└── tslint.json
```

The structure is simple: `lib` contains the implementation of the library and `tests` the tests.

## Usage

### Option

The Option type allows error handling and representing missing values. An Option value can be either Some (meaning it holds a) or None (meaning it has no value). The `Some` constructor is used for wrapping present values while the `None` constructor is used when a value is absent. It becomes easy to manipulate optional values without null checking or exception handling.

```ts
import { Some, None, Option } from '@etermind/tmonad';

// You can create an Option with some value using .some()
const someValue = Some(4); // Option holds a value of 4 (it is a number);

// You can create an empty Option using .none()
const noValue = None; // Option holds no value (= null).

// You can extract the value if you want
const extractedValue = someValue.extract(); // Returns 4
const extractedNone = noValue.extract(); // Returns null
```

#### Without Option

Where Option shines the most it's when you need to do a serie of computations and one or more of your intermediate functions can return null (or throw an exception):

```ts
const findUserById = (id: string) => {
    if(id === 'abc123') {
        return { firstname: 'John', lastname: 'Smith', id: 'abc123', email: 'john.smith@doe.com' };
    }
    return null;
}

const pickEmail = (user: any) => user.email;

const sendEmail = (email: string, content: string) => {
    // Send email HERE
}


const myUser = findUserById('abc123');
if(myUser != null) {
    const email = pickEmail(myUser);
    if (email != null) {
        sendEmail(email, 'Hello from TMonad');
    }
} 
```

In a classic implementation you are going to check again and again if you get the *right value* or something that is *undefined*. You spend a lot of time checking your data and nesting if/else statements. This makes the code harder to read and to maintain.

How can we use `Option` to the rescue?

#### With Option

```ts
const findUserById = (id: string) => {
    if(id === 'abc123') {
        return Some({ firstname: 'John', lastname: 'Smith', id: 'abc123', email: 'john.smith@doe.com' });
    }
    return None;
}

const pickEmail = (user: any) => user.email ? Some(user.email) : None;

const sendEmail = (email: string, content: string) => {
    // Send email HERE
    if(/* An error occurred */) {
        return Some(false);
    }
    return Some(true);
}

const finalResult = Some('abc123')
    .flatMap(id => findUserById(id))
    .flatMap(user => pickEmail(user))
    .flatMap(email => sendEmail(email, 'Hello from TMonad'))
    .extract();

// finalResult will be either true / false or null 
```

In this implementation, no null checking, no nesting, each of your intermediate function returns an option and you can chain the call using `flatMap` to get the final result.

What is happening under the hood? If any function returns `None`, the computation stops and return `None`.

#### Using match

Sometimes it can be helpful to run a function when the Option contains a value or another function when it has no value.

To do so, we use the `match` function:

```ts
const opt = Some(4);

const matchObject = {
    some: (v: number) => v * 4,
    none: () => 2, 
};

const returnedOption = opt.match(matchObject);

// The returnedOption is also an Option 
```

#### Option with generators

Using `flatMap` is cool, but what if we want to have a flow that is closer to imperative programming that many people know so well? You can use [generators](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Generator).

```ts
const finalResult = Some('abc123').run<boolean>(val, function* () {
    const id = yield; // Yield the value of Some('abc123')
    const user = yield findUserById(id);
    const email = yield pickEmail(user);
    const ok = yield sendEmail(email, 'Hello from TMonad');
    return Some(ok);
}());

// finalResult will be an option with either true / false or null
```

The behaviour is **exactly** the same as using flatMap, only the way of writing is different. You need to *yield* *Option* (or functions that return *Option*s). At the end, you need to return an *Option*. You are guaranteed that if any of your function yields an Option.none(), the computation stops with no error. Pretty neat, uh?

#### Option API

- `Some<T>(x: T): Option<T>` to create an Option with a value.
- `None: Option<T>` to create an Option with no value.
- `.flatMap<R>((v: T) => Option<R>): Option<R>` to apply a function and returns a new Option. This allows to chain the computation (see examples).
- `.run<R>(generator: Generator<Option<R>, Option<U>, T>): Option<R>` to use generators instead of flatMap (see examples).
- `.map<R>((val: T) => R): Option<R>` to apply a function and wrap its result into an option. Contrary to flatMap, you cannot chain two maps, because you'll end up having `Option<Option<R>>` instead of just an `Option<R>`.
- `.extract(): T|null` to extract the value of an option (returns null if no value).
- `.getOrElse<R>(defaultValue: R): T|R` to extract the value, or if the Option is none, return the default value.
- `.isSome(): boolean` checks if an Option contains a value.
- `.isNone(): boolean` checks if an Option contains no value.
- `match<T, U>({ some: (v: T) => U, none: () => U }): Option<U>` runs the `some` function when the Option contains a value, otherwise run the `none` function.
- `flatMatch<T, U>({ some: (v: T) => Option<U>, none: () => Option<U> }): Option<U>` runs the `some` function when the Option contains a value, otherwise run the `none` function.

### Result

The Option type allows error handling and representing missing values, but when an error is raised, the only information you get is null. Sometimes it is useful to have a little more, that is when Result comes into play. With Result you have two state: 

1. An Ok state that holds your value (like Option.some)
2. An Err state that holds your error (or whatever you consider as an error).

This way, you know what is going on in your program. Let's look at an example:

```ts
import { Ok, Err, Result } from '@etermind/tmonad';

const findUserById = (id: string) => {
    if(id === 'abc123') {
        return Ok({ firstname: 'John', lastname: 'Smith', id: 'abc123', email: 'john.smith@doe.com' });
    }
    return Err(new Error('Unable to find the user'));
}

const pickEmail = (user: any) => user.email ? Ok(user.email) : Err(new Error('Missing email address'));

const sendEmail = (email: string, content: string) => {
    // Send email HERE
    if(/* An error occurred */) {
        return Err(new Error('Unable to send the message'));
    }
    return Ok(true);
}

const finalResult = Ok('abc123')
    .flatMap(id => findUserById(id))
    .flatMap(user => pickEmail(user))
    .flatMap(email => sendEmail(email, 'Hello from TMonad'))
    .extract();

// finalResult will be either true or one of the three possible errors. 
```

#### Result with generators

Using `flatMap` is cool, but what if we want to have a flow that is closer to imperative programming that many people know so well? You can use [generators](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Generator).

```ts
const finalResult = Ok('abc123').run<boolean>(function* () {
   const id = yield;
   const user = yield findUserById('abc123');
   const email = yield pickEmail(user);
   const ok = yield sendEmail(email, 'Hello from TMonad');
   return Ok(ok);
}());

// finalResult will be a result with either Ok(true) or Err(...)
```

#### Using match

As a Result can take two states (Ok & Err), sometimes it can be useful to do something with both states.

To do so, we use the `match` function:

```ts
const result = Ok(4);

const matchObject = {
    ok: (v: number) => doSomething,
    err: (e: Error) => doSomething, 
};

const returnedValue = result.match(matchObject);

// The returnedValue value is also a Result
```

#### Result API

- `Ok<OkType, never>(o: OkType): Result<OkType, ErrType>` to create a result with a value holding by Ok.
- `Err<never, ErrType>(e: ErrType): Result<OkType, ErrType>` to create a Result with an error.
- `.flatMap<R>((v: OkType) => Result<R, ErrType>): Result<R, ErrType>` to apply a function and returns a new Result. This allows to chain the computation (see examples).
- `.flatMapErr<R>((v: ErrType) => Result<OkType, R>): Result<OkType, R>` to apply a function and returns a new Result. This allows to chain the computation using the err value.
- `.run<R>(generator: IterableGenerator<Result<R, ErrType>>): Result<R, ErrType>` to use generators instead of flatMap (see examples).
- `.map<R>((val: O) => R): Result<R, ErrType>` to apply a function and wrap its result into a result. Contrary to flatMap, you cannot chain two maps, because you'll end up having `Result<Result<R, ErrType>, ErrType>` instead of just an `Result<R, ErrType>`.
- `.mapErr<R>((val: E) => R): Result<O, R|ErrType>` to apply a function and wrap its result into a result. The function takes the error value.
- `.extract(): OkType|ErrType` to extract the value of Ok or the value of Err.
- `.getOrElse<R>(defaultValue: R): OkType|R` to extract the value of Ok, or if the Result is an error, return the default value.
- `.isOk(): boolean` checks if a Result is ok. 
- `.isErr(): boolean` checks if a Result is an error.
- `.match<T, U>({ ok: (val: T) => U, err: (e: E) => U }): Result<U, E> | Result<T, U>` to execute the first function when Result holds an Ok value and the second function when it holds an error. 

### Future 

Futures are promises on steroïds. They allow for async computation, but contrary to promises and just like Results you can chain Futures. Let's see an example

```ts
import { Future } from '@etermind/tmonad';

const findUserById = async (id: string) => {
    const response = await fetch(`https://api.github.com/orgs/${id}`);
    const data = await response.json();
    return data;
}

const pickEmail = (user: any) => new Promise((resolve, reject) => user.email ? resolve(user.email) : reject(new Error('Missing email address'));

const sendEmail = async (email: string, content: string) => {
    // Send email HERE
    if(/* An error occurred */) {
        throw new Error('Unable to send the message'));
    }
    return true;
}

async function run() { 
    const finalResult = await Future.fromP(findUserById('abc123'))
        .flatMap(id => Future.fromP(findUserById(id)))
        .flatMap(user => Future.fromP(pickEmail(user)))
        .flatMap(email => Future.fromP(sendEmail(email, 'Hello from TMonad')))
        .awaitOrElse(false);

    // finalResult will be either true or false. 
}
```

You can instantiate your own Future, just like you do with a promise:

```ts
const fut1 = new Future<any>((resolve, reject) => {
    try {
        // Do something
        const res = myAsyncComputation();
        resolve(res);
    } catch (err: any) {
        reject(err);
    }
    return () => true; // Return a cancellation function (more details later)
});

const fut2 = Future.of(4); // It's like Promise.resolve(4);
const fut3 = Future.reject('test'); // It's like Promise.reject('test);
```

You can see a good introduction to futures [here](https://github.com/jsanchesleao/fantasy-future).

#### Future are cancellable

Sometimes, you need to cancel the async computation before it even happens, Future implements that for you, let's see how:

```ts
const fut = new Future<number>((resolve, reject) => {
    const t = setTimeout(() => {
        console.log('Async computation occurred')
        resolve(4);
    }, 15000); // It will happen in 15 secs
    return () => {
        clearTimeout(t);
        return true;
    }; // This is our cancel function 
});

const cancel = fut.extract(d => console.log('Number is', d), err => console.error(err));
cancel(); // Here we cancel the async computation before it can happen. So, you won't see the log 'Async computation occurred'.
```

#### Run a future

Unless you call `await()`, `awaitOrElse(defaultValue)` or `extract(onSuccess, onFailure)`, the future won't be executed. It is lazy (contrary to promises).

#### Using match

As a Future can be a success or a failure, sometimes it can be useful to do something with both states.

To do so, we use the `match` function:

```ts
const fut = Future.of(4);

const matchObject = {
    onSuccess: (v: number) => v * 4,
    onFailure: (e: Error) => {}, 
};

const returnedValue = fut.match(matchObject);
// The returnedValue value is also a Future 
```

#### Future API

- `new Future<T, E = Error>((resolve, reject) => () => boolean): Future<T, E = Error>` to create a future. You callback should return the `cancel` function (= a function that takes no parameter and returns a boolean). 
- `Future.of<T, never>(value: T, cancel: () => true)` to create a future that always resolves. The cancel function is optional.
- `Future.reject<never, E = Error>(value: E, cancel: () => true)` to create a future that always rejects. The cancel function is optional.
- `Future.fromP<T, E = Error>(value: Promise<T>, errorMapper: (e: Error) => E)` to create a future from a promise. You can map the error when the promise reject into the awaited type for your future. If you are fine with the error, the errorMapper is optional.
- `.flatMap<U>((v: T) => Future<U, E>): Future<U, E>` to apply a function and returns a new Future. This allows to chain the computation (see examples).
- `.flatMapErr<U>((v: E) => Future<U, E>): Future<U, E>` to apply a function and returns a new Future. This allows to chain the computation using the err value.
- `.map<U>((val: T) => U): Future<U, E>` to apply a function and wrap its result into a Future. Contrary to flatMap, you cannot chain two maps, because you'll end up having `Future<Future<T, E2>, E1>` instead of just an `Future<U, E>`.
- `.mapErr<U>((val: E) => Promise<U>): Future<U, E>` to apply a function and wrap its result into a Future. The function takes the error value.
- `.extract(onSuccess: (v: T) => void, onFailure: (e: E) => void): () => boolean` to run the future. It takes a success callback and an error callback. The function returns the `cancel` function. 
- `.awaitOrElse<R>(defaultValue: R): Promise<T|R>` to extract the value, if the future is an error, then the default value is returned. `await` & `awaitOrElse` return a promise so that you can use the `await` keyword on it.
- `.await(): Promise<T>` to extract the value, if you are sure the future is a success. `await` & `awaitOrElse` return a promise so that you can use the `await` keyword on it.
- `.match<T, U, E>({ onSuccess: (o: T) => U, onFailure: (e: E) => U }): Future<U, E>` to execute the onSuccess function when Future is a success and the onFailure function when it is a failure.
- `.flatMatch<T, U, E>({ onSuccess: (o: T) => Future<U, E>, onFailure: (e: E) => Future<U, E> })): Future<U, E>` to execute the onSuccess function when Future is a success and the onFailure function when it is a failure. 
- `.toResult(): Promise<Result<T, E>>` transform the future to a Result.
- `.toOption(): Promise<Option<T>>` transform the future to an Option.


## NPM custom commands

- `build`: Build the JavaScript files.
- `lint`: Run the linter
- `test`: Run test + coverage.
- `test:watch`: Run jest in interactive test mode.
- `docs`: Generate the docs directory.
