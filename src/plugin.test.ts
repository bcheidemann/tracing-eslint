import { RuleTester } from "@typescript-eslint/rule-tester";
import { preferExplicitResourceManagementRule } from "./rules/preferExplicitResourceManagement.ts";
import * as vitest from "vitest";
import { join } from "path";
import { invalidSkipAttribute } from "./rules/invalidSkipAttribute.ts";

RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;
RuleTester.describe = vitest.describe;
RuleTester.afterAll = vitest.afterAll;

const ruleTester = new RuleTester({
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: join(process.cwd(), "src", "fixtures"),
  },
});

const spanNames = [
  "span",
  "traceSpan",
  "debugSpan",
  "infoSpan",
  "warnSpan",
  "errorSpan",
  "criticalSpan",
];

ruleTester.run(
  "prefer-explicit-resource-management",
  preferExplicitResourceManagementRule,
  {
    valid: spanNames.flatMap((spanName) => [
      `using _guard = ${spanName}("message").enter();`,
      `using _guard = ${spanName}("message");`,
      `using _guard = ${spanName}("message").dummy();`,
    ]),
    invalid: spanNames.flatMap((spanName) => [
      {
        code: `const guard = ${spanName}("message").enter();`,
        errors: [{ messageId: "preferExplicitResourceManagement" as const }],
      },
      {
        code: `${spanName}("message").enter();`,
        errors: [{ messageId: "preferExplicitResourceManagement" as const }],
      },
    ]),
  },
);

function instrumentedMethod(attributes: string, args: string) {
  return `class Example {
    @instrument(${attributes})
    method(${args}) {}
  }`;
}

function instrumentedFunction(attributes: string, args: string) {
  return `instrumentCallback(
    [${attributes}],
    function example(${args}) {},
  )`;
}

function instrumentedArrowFunction(attributes: string, args: string) {
  return `instrumentCallback(
    [${attributes}],
    (${args}) => {},
  )`;
}

ruleTester.run(
  "invalid-skip-attribute",
  invalidSkipAttribute,
  {
    valid: [
      {
        name: "in bounds",
        attributes: "skip0",
        args: "arg0"
      },
      {
        name: "rest param",
        attributes: "skip(2)",
        args: "arg0, ...args",
      },
    ].flatMap(({ name, attributes, args }) => [
      {
        name: `method instrumentation > skip by index > ${name}`,
        code: instrumentedMethod(attributes, args),
      },
      {
        name: `function instrumentation > skip by index > ${name}`,
        code: instrumentedFunction(attributes, args),
      },
      {
        name: `function instrumentation > skip by index > ${name}`,
        code: instrumentedArrowFunction(attributes, args),
      },
    ]),
    invalid: [
      ...[
        {
          name: "negative value",
          attributes: "skip(-1)",
          args: "arg0",
          errors: [{ messageId: "invalidSkipByIndexAttribute" as const }],
        },
        {
          name: "out of bounds",
          attributes: "skip(1)",
          args: "arg0",
          errors: [{ messageId: "invalidSkipByIndexAttribute" as const }],
        },
        {
          name: "non-integer index",
          attributes: "skip(0.5)",
          args: "arg0",
          errors: [{ messageId: "invalidSkipByIndexAttribute" as const }],
        },
        {
          name: "non-integer index",
          attributes: "skip(0)",
          args: "",
          errors: [{ messageId: "invalidSkipByIndexAttribute" as const }],
        },
        {
          name: "non-integer index",
          attributes: "skip(2 / 2)",
          args: "arg0",
          errors: [{ messageId: "avoidDynamicSkipAttributes" as const }],
        },
      ].flatMap(({ name, attributes, args, errors }) => [
        {
          name: `method instrumentation > skip by index > ${name}`,
          code: instrumentedMethod(attributes, args),
          errors,
        },
        {
          name: `function instrumentation > skip by index > ${name}`,
          code: instrumentedFunction(attributes, args),
          errors,
        },
        {
          name: `function instrumentation > skip by index > ${name}`,
          code: instrumentedArrowFunction(attributes, args),
          errors,
        },
      ]),
    ],
  },
);
