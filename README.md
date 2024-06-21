# Tracing ESLint Plugin

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
  // Incorrect parameter name
  @instrument(skip("arg0"))
  a(arg0) {}

  // Incorrect parameter index
  @instrument(skip(0))
  a(arg0) {}

  // Too many arguments in mask
  @instrument(skip(true))
  a(arg0) {}
}
```

#### Explanation

Incorrectly formatted skip arguments may result in data being logged unintentionally.
