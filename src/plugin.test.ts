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
        name: "skip by index > in bounds",
        attributes: "skip(0)",
        args: "arg0"
      },
      {
        name: "skip by index > multiple in bounds",
        attributes: "skip(0, 1)",
        args: "arg0, arg1"
      },
      {
        name: "skip by index > rest param",
        attributes: "skip(2)",
        args: "arg0, ...args",
      },
      {
        name: "skip by name > identifier",
        attributes: "skip('arg0')",
        args: "arg0",
      },
      {
        name: "skip by name > multiple identifiers",
        attributes: "skip('arg0', 'arg1')",
        args: "arg0, arg1",
      },
      {
        name: "skip by name > rest param",
        attributes: "skip('...args')",
        args: "...args",
      },
    ].flatMap(({ name, attributes, args, ...rest }) => [
      {
        name: `method instrumentation > ${name}`,
        code: instrumentedMethod(attributes, args),
        ...rest,
      },
      {
        name: `function instrumentation > ${name}`,
        code: instrumentedFunction(attributes, args),
        ...rest,
      },
      {
        name: `function instrumentation > ${name}`,
        code: instrumentedArrowFunction(attributes, args),
        ...rest,
      },
    ]),
    invalid: [
      ...[
        {
          name: "skip by index > negative value",
          attributes: "skip(-1)",
          args: "arg0",
          errors: [{ messageId: "invalidSkipByIndexAttribute" as const }],
        },
        {
          name: "skip by index > second negative value",
          attributes: "skip(0, -1)",
          args: "arg0",
          errors: [{ messageId: "invalidSkipByIndexAttribute" as const }],
        },
        {
          name: "skip by index > out of bounds",
          attributes: "skip(1)",
          args: "arg0",
          errors: [{ messageId: "invalidSkipByIndexAttribute" as const }],
        },
        {
          name: "skip by index > second out of bounds",
          attributes: "skip(0, 1)",
          args: "arg0",
          errors: [{ messageId: "invalidSkipByIndexAttribute" as const }],
        },
        {
          name: "skip by index > non-integer index",
          attributes: "skip(0.5)",
          args: "arg0",
          errors: [{ messageId: "invalidSkipByIndexAttribute" as const }],
        },
        {
          name: "skip by index > second non-integer index",
          attributes: "skip(0, 0.5)",
          args: "arg0",
          errors: [{ messageId: "invalidSkipByIndexAttribute" as const }],
        },
        {
          name: "skip by index > no params",
          attributes: "skip(0)",
          args: "",
          errors: [{ messageId: "invalidSkipByIndexAttribute" as const }],
        },
        {
          name: "skip by index > dynamic value",
          attributes: "skip(2 / 2)",
          args: "arg0",
          errors: [{ messageId: "avoidDynamicSkipAttributes" as const }],
        },
        {
          name: "skip by index > second dynamic value",
          attributes: "skip(0, 2 / 2)",
          args: "arg0",
          errors: [{ messageId: "avoidDynamicSkipAttributes" as const }],
        },
        {
          name: "skip by name > invalid name",
          attributes: "skip('arg99')",
          args: "arg0",
          errors: [{ messageId: "invalidSkipByNameAttribute" as const }],
        },
        {
          name: "skip by name > second invalid name",
          attributes: "skip('arg0', 'arg99')",
          args: "arg0",
          errors: [{ messageId: "invalidSkipByNameAttribute" as const }],
        },
      ].flatMap(({ name, attributes, args, errors, ...rest }) => [
        {
          name: `method instrumentation > ${name}`,
          code: instrumentedMethod(attributes, args),
          errors,
          ...rest,
        },
        {
          name: `function instrumentation > ${name}`,
          code: instrumentedFunction(attributes, args),
          errors,
          ...rest,
        },
        {
          name: `function instrumentation > ${name}`,
          code: instrumentedArrowFunction(attributes, args),
          errors,
          ...rest,
        },
      ]),
    ],
  },
);
