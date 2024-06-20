import { RuleTester } from '@typescript-eslint/rule-tester';
import { preferExplicitResourceManagementRule } from "./rules/preferExplicitResourceManagement.ts";
import * as vitest from 'vitest';
import { join } from 'path';

RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;
RuleTester.describe = vitest.describe;
RuleTester.afterAll = vitest.afterAll;

const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
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
    valid: [
      ...spanNames.flatMap((spanName) => [
        withImports([spanName], `using _guard = ${spanName}("message").enter();`),
        `using _guard = ${spanName}("message");`,
        `using _guard = ${spanName}("message").dummy();`,
      ]),
    ],
    invalid: [
      ...spanNames.flatMap((spanName) => [
        {
          code: `const guard = ${spanName}("message").enter();`,
          errors: [{ messageId: "preferExplicitResourceManagement" as const }],
        },
        {
          code: `${spanName}("message").enter();`,
          errors: [{ messageId: "preferExplicitResourceManagement" as const }],
        },
      ]),
    ],
  },
);

function withImports(imports: string[], code: string): string {
  return `import { ${imports.join(", ")} } from "@bcheidemann/tracing"; ${code}`;
}
