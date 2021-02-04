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
│   ├── async_option.ts
│   ├── async_result.ts
│   ├── index.ts
│   ├── option.ts
│   └── result.ts
├── CONTRIBUTING.md
├── LICENSE
├── package.json
├── README.md
├── tests
│   ├── async_option.test.ts
│   ├── async_result.test.ts
│   ├── option.test.ts
│   └── result.test.ts
├── tsconfig.json
└── tslint.json
```

The structure is simple: `lib` contains the implementation of the library and `tests` the tests.

## Usage

### Option

The Option type allows error handling and representing missing values. An Option value can be either Some (meaning it holds a) or None (meaning it has no value). The `some` method is used for wrapping present values while the `none` method is used when a value is absent. It becomes easy to manipulate optional values without null checking or exception handling.

```ts
import { Option } from '@etermind/tmonad';

// You can create an Option with some value using .some()
const someValue = Option.some(4); // Option holds a value of 4 (it is a number);

// You can create an empty Option using .none()
const noValue = Option.none(); // Option holds no value (= null).

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
        return Option.some({ firstname: 'John', lastname: 'Smith', id: 'abc123', email: 'john.smith@doe.com' });
    }
    return Option.none();
}

const pickEmail = (user: any) => user.email ? Option.some(user.email) : Option.none();

const sendEmail = (email: string, content: string) => {
    // Send email HERE
    if(/* An error occurred */) {
        return Option.some(false);
    }
    return Option.some(true);
}

const finalResult = Option.some('abc123')
    .flatMap(id => findUserById(id))
    .flatMap(user => pickEmail(user))
    .flatMap(email => sendEmail(email, 'Hello from TMonad'))
    .extract();

// finalResult will be either true / false or null 
```

In this implementation, no null checking, no nesting, each of your intermediate function returns an option and you can chain the call using `flatMap` to get the final result.

What is happening under the hood? If any function returns Option.none(), the computation stops and return Option.none().

#### Option with generators

Using `flatMap` is cool, but what if we want to have a flow that is closer to imperative programming that many people know so well? You can use [generators](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Generator).

```
const finalResult = Option.run(function* () {
    const user = yield findUserById('abc123');
    const email = yield pickEmail(user);
    const ok = yield sendEmail(email, 'Hello from TMonad');
    return Option.some(ok);
}());

// finalResult will be an option with either true / false or null
```

The behaviour is **exactly** the same as using flatMap, only the way of writing is different. You need to *yield* *Option* (or functions that return *Option*s). At the end, you need to return an *Option*. You are guaranteed that if any of your function yields an Option.none(), the computation stops with no error. Pretty neat, uh?

#### Option API

- `Option.some<T>(x: T): Option<T>` to create an Option with a value.
- `Option.none<T>(): Option<T>` to create an Option with no value.
- `.flatMap<R>((v: T) => Option<R>): Option<R>` to apply a function and returns a new Option. This allows to chain the computation (see examples).
- `.run<R>(generator: IterableGenerator<Option<R>>): Option<R>` to use generators instead of flatMap (see examples).
- `.map<R>((val: T) => R): Option<R>` to apply a function and wrap its result into an option. Contrary to flatMap, you cannot chain two maps, because you'll end up having `Option<Option<R>>` instead of just an `Option<R>`.
- `.extract(): T|null` to extract the value of an option (returns null if no value).
- `.getOrElse<R>(defaultValue: R): T|R` to extract the value, or if the Option is none, return the default value.
- `.isSome(): boolean` checks if an Option contains a value.
- `.isNone(): boolean` checks if an Option contains no value.

### AsyncOption

The AsyncOption is a wrapper around `Promise<Option<T>>`. It allows to use async / await and promises with Option. Let's see an example below:

```ts
import { AsyncOption } from '@etermind/tmonad';

const findUserById = async (id: string) => {
    try {
        const response = await fetch(`https://api.github.com/orgs/${id}`);
        const data = await response.json();
        return Option.some(data);
    } catch {
        return Option.none();
    }
}

const pickEmail = async (user: any) => user.email ? Option.some(user.email) : Option.none();

const sendEmail = async (email: string, content: string) => {
    // Send email HERE
    if(/* An error occurred */) {
        return Option.some(false);
    }
    return Option.some(true);
}

// It is needed since Node cannot execute await directly at the root level (contrary to Deno)
async function run() {
    const ok = await AsyncOption.some('nodejs')
        .flatMap(findUserById)
        .flatMap(pickEmail)
        .flatMap(sendEmail)
        .extract();

    // ok will be either true / false or null
}
```
#### AsyncOption with generators

Using `flatMap` is cool, but what if we want to have a flow that is closer to imperative programming that many people know so well? You can use [generators](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Generator).

```ts
const ok = AsyncOption.run(function* () {
    const user = yield findUserById('abc123');
    const email = yield pickEmail(user);
    const ok = yield sendEmail(email, 'Hello from TMonad');
    return Promise.resolve(Option.some(ok));
}());

// finalResult will be an AsyncOption with either true / false or null
```

#### AsyncOption API

- `AsyncOption.some<T>(x: T): AsyncOption<T>` to create an AsyncOption with a value.
- `AsyncOption.none<T>(): AsyncOption<T>` to create an AsyncOption with no value.
- `.flatMap<R>((v: T) => Promise<Option<R>>): AsyncOption<R>` to apply a function and returns a new AsyncOption. This allows to chain the computation (see examples).
- `.run<R>(generator: IterableGenerator<Promise<Option<R>>>): AsyncOption<R>` to use generators instead of flatMap (see examples).
- `.map<R>((val: T) => R): AsyncOption<R>` to apply a function and wrap its result into an async option. Contrary to flatMap, you cannot chain two maps, because you'll end up having `AsyncOption<AsyncOption<R>>` instead of just an `AsyncOption<R>`.
- `.extract(): Promise<T|null>` to extract the value of an async option (returns null if no value).
- `.getOrElse<R>(defaultValue: R): Promise<T|R>` to extract the value, or if the AsyncOption is none, return the default value.
- `.isSome(): Promise<boolean>` checks if an AsyncOption contains a value.
- `.isNone(): Promise<boolean>` checks if an AsyncOption contains no value.

### Result

The Option type allows error handling and representing missing values, but when an error is raised, the only information you get is null. Sometimes it is useful to have a little more, that is when Result comes into play. With Result you have two state: 

1. An Ok state that holds your value (like Option.some)
2. An Err state that holds your error (or whatever you consider as an error).

This way, you know what is going on in your program. Let's look at an example:

```ts
import { Result } from '@etermind/tmonad';

const findUserById = (id: string) => {
    if(id === 'abc123') {
        return Result.ok({ firstname: 'John', lastname: 'Smith', id: 'abc123', email: 'john.smith@doe.com' });
    }
    return Result.err(new Error('Unable to find the user'));
}

const pickEmail = (user: any) => user.email ? Result.ok(user.email) : Result.err(new Error('Missing email address'));

const sendEmail = (email: string, content: string) => {
    // Send email HERE
    if(/* An error occurred */) {
        return Result.err(new Error('Unable to send the message'));
    }
    return Result.ok(true);
}

const finalResult = Result.ok('abc123')
    .flatMap(id => findUserById(id))
    .flatMap(user => pickEmail(user))
    .flatMap(email => sendEmail(email, 'Hello from TMonad'))
    .extract();

// finalResult will be either true or one of the three possible errors. 
```

#### Result with generators

Using `flatMap` is cool, but what if we want to have a flow that is closer to imperative programming that many people know so well? You can use [generators](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Generator).

```
const finalResult = Result.run(function* () {
    const user = yield findUserById('abc123');
    const email = yield pickEmail(user);
    const ok = yield sendEmail(email, 'Hello from TMonad');
    return Result.ok(ok);
}());

// finalResult will be a result with either Ok(true) or Err(...)
```

#### Using match

As a Result can take two states (Ok & Err), sometimes it can be useful to do something with both states, as opposed to an option where None indicates that there is nothing useful.

To do so, we use the `match` function:

```ts
const result = Result.ok(4);
const returnedValue = result.match(
    (okValue) => doSomething,
    (errValue) => doSomething,
);
```

As you can see, `match` takes two functions, the first one is executed when the Result is ok and the second one when the Result is an error. `match` returns the value of one of both function. You can create cool execution flows with `match`, for instance:

```ts
const finalResult = Result.ok('abc123')
    .flatMap(id => findUserById(id))
    .flatMap(user => pickEmail(user))
    .match(
        email => Result.ok(email),
        () => Result.ok('contact@example.com')
    )
    .flatMap(email => sendEmail(email, 'Hello from TMonad'))
```

In the example above, if the `pickEmail` function returns an error (the email address cannot be found), the `match` takes care of creating a new Result with a fallback email. 


#### Result API

- `Result.ok<OkType, ErrType>(o: OkType): Result<OkType, ErrType>` to create a result with a value holding by Ok.
- `Result.err<OkType, ErrType>(e: ErrType): Result<OkType, ErrType>` to create a Result with an error.
- `.flatMap<R>((v: OkType) => Result<R, ErrType>): Result<R, ErrType>` to apply a function and returns a new Result. This allows to chain the computation (see examples).
- `.run<R>(generator: IterableGenerator<Result<R, ErrType>>): Result<R, ErrType>` to use generators instead of flatMap (see examples).
- `.map<R>((val: O) => R): Result<R, ErrType>` to apply a function and wrap its result into a result. Contrary to flatMap, you cannot chain two maps, because you'll end up having `Result<Result<R, ErrType>, ErrType>` instead of just an `Result<R, ErrType>`.
- `.extract(): OkType|ErrType` to extract the value of Ok or the value of Err.
- `.getOrElse<R>(defaultValue: R): OkType|R` to extract the value of Ok, or if the Result is an error, return the default value.
- `.isOk(): boolean` checks if a Result is ok. 
- `.isErr(): boolean` checks if a Result is an error.
- `.match<T, U>((o: OkType) => T, (e: ErrType) => U): T|U` to execute the first function when Result holds an Ok value and the second function when it holds an error. 

### AsyncResult

The AsyncResult is a wrapper around `Promise<Result<OkType, ErrType>>`. It allows to use async / await and promises with Result. Let's see an example below:

```ts
import { AsyncResult, Result } from '@etermind/tmonad';

const findUserById = async (id: string) => {
    try {
        const response = await fetch(`https://api.github.com/orgs/${id}`);
        const data = await response.json();
        return Result.ok(data);
    } catch(err) {
        return Result.err(err);
    }
}

const pickEmail = async (user: any) => user.email ? Result.ok(user.email) : Result.err(new Error('Missing email address'));

const sendEmail = async (email: string, content: string) => {
    // Send email HERE
    if(/* An error occurred */) {
        return Result.err(new Error('Unable to send the message'));
    }
    return Result.ok(true);
}

async function run() { 
    const finalResult = await AsyncResult.ok('abc123')
        .flatMap(id => findUserById(id))
        .flatMap(user => pickEmail(user))
        .flatMap(email => sendEmail(email, 'Hello from TMonad'))
        .extract();

    // finalResult will be either true or one of the three possible errors. 
}
```

#### AsyncResult with generators

Using `flatMap` is cool, but what if we want to have a flow that is closer to imperative programming that many people know so well? You can use [generators](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Generator).

```ts
const ok = AsyncResult.run(function* () {
    const user = yield findUserById('abc123');
    const email = yield pickEmail(user);
    const ok = yield sendEmail(email, 'Hello from TMonad');
    return Promise.resolve(AsyncResult.ok(ok));
}());

// finalResult will be an AsyncResult with either true / false or null
```

#### AsyncResult API

- `AsyncResult.ok<OkType, ErrType>(o: OkType): AsyncResult<OkType, ErrType>` to create an async result with a value holding by Ok.
- `AsyncResult.err<OkType, ErrType>(e: ErrType): AsyncResult<OkType, ErrType>` to create an async result with an error.
- `.flatMap<R>((v: OkType) => Promise<Result<R, ErrType>>): AsyncResult<R, ErrType>` to apply a function and returns a new AsyncResult. This allows to chain the computation (see examples).
- `.run<R>(generator: IterableGenerator<Promise<Result<R, ErrType>>>): AsyncResult<R, ErrType>` to use generators instead of flatMap (see examples).
- `.map<R>((val: O) => R): AsyncResult<R, ErrType>` to apply a function and wrap its result into a result. Contrary to flatMap, you cannot chain two maps, because you'll end up having `AsyncResult<AsyncResult<R, ErrType>, ErrType>` instead of just an `AsyncResult<R, ErrType>`.
- `.extract(): OkType|ErrType` to extract the value of Ok or the value of Err.
- `.getOrElse<R>(defaultValue: R): Promise<OkType|R>` to extract the value of Ok, or if the Result is an error, return the default value.
- `.isOk(): Promise<boolean>` checks if a AsyncResult is ok. 
- `.isErr(): Promise<boolean>` checks if a AsyncResult is an error.
- `.match<T, U>((o: OkType) => Promise<T>, (e: ErrType) => Promise<U>): Promise<T|U>` to execute the first function when AsyncResult holds an Ok value and the second function when it holds an error. 


## NPM custom commands

- `build`: Build the JavaScript files.
- `lint`: Run the linter
- `test`: Run test + coverage.
- `test:watch`: Run jest in interactive test mode.
- `docs`: Generate the docs directory.
