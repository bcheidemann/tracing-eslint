<!-- omit in toc -->
# Tracing ESLint Plugin

## Overview

ESLint plugin for the `@bcheidemann/tracing` library.

<!-- omit in toc -->
## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
  - [Node](#node)
  - [Bun](#bun)
  - [Deno](#deno)
- [Usage](#usage)
- [Rules](#rules)
  - [prefer-explicit-resource-management](#prefer-explicit-resource-management)
    - [Bad](#bad)
    - [Good](#good)
    - [Explanation](#explanation)
  - [invalid-skip-attribute](#invalid-skip-attribute)
    - [Bad](#bad-1)
    - [Good](#good-1)
    - [Explanation](#explanation-1)
- [Contributing](#contributing)

## Installation

### Node

The package is published to [JSR](https://jsr.io/@bcheidemann/parse-tracing-eslint)
new package registry for TypeScript. To install JSR packages for Node, you need
to use the `jsr` CLI. After installing it, it will behave just like any other
Node module.

```sh
# npm
npx jsr add @bcheidemann/tracing-eslint
```

```sh
# yarn
yarn dlx jsr add @bcheidemann/tracing-eslint
```

```sh
# pnpm
pnpm dlx jsr add @bcheidemann/tracing-eslint
```

### Bun

```sh
bunx jsr add @bcheidemann/tracing-eslint
```

### Deno

```sh
deno add @bcheidemann/tracing-eslint
```

## Usage

```js
// eslint.config.mjs
import tracingEslint from "@bcheidemann/tracing-eslint/configs";

export default [
  tracingEslint.recommended,
];
```

Or, with `typescript-eslint`:

```ts
// eslint.config.mjs
import tseslint from 'typescript-eslint';
import tracingEslint from "@bcheidemann/tracing-eslint/configs";

export default tseslint.config(
  tracingEslint.recommended,
);
```

## Rules

### prefer-explicit-resource-management

#### Bad

```ts
{
  const guard = span(Level.INFO, "my span").enter();

  // Do stuff...

  guard.exit();
}
```

#### Good

```ts
{
  using _guard = span(Level.INFO, "my span").enter();

  // Do stuff...
} // _guard.exit() automatically called here
```

#### Explanation

When manually exiting spans, it is easy to forget to exit spans, which may lead
to unexpected results.

For example:

```ts
function doStuff() {
  const guard = span(Level.INFO, "my span").enter();

  // Do stuff...

  if (someCondition) {
    return; // Span was not exited
  }

  // Do more stuff...

  guard.exit();
}
```

In the above example, if `someCondition` is truthy, the span will remain entered
even after the function has returned.

### invalid-skip-attribute

#### Bad

```ts
class Example {
  // Incorrect parameter name
  @instrument(skip("arg99"))
  a(arg0) {}

  // Incorrect parameter structure
  @instrument(skip("args"))
  a(...args) {}

  // Incorrect parameter index
  @instrument(skip(99))
  a(arg0) {}

  // Too many arguments in mask
  @instrument(skip(true, false))
  a(arg0) {}
}
```

#### Good

```ts
class Example {
  // Correct parameter name
  @instrument(skip("arg0"))
  a(arg0) {}

  // Correct parameter structure
  @instrument(skip("...args"))
  a(...args) {}

  // Correct parameter index
  @instrument(skip(0))
  a(arg0) {}

  // Too many arguments in mask
  @instrument(skip(true))
  a(arg0) {}
}
```

#### Explanation

Incorrectly formatted skip arguments may result in data being logged unintentionally.

## Contributing

See [CONTRIBUTING.md](https://github.com/bcheidemann/tracing-eslint/blob/master/CONTRIBUTING.md)
