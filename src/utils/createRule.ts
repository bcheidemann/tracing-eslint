import { ESLintUtils } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/bcheidemann/tracing-eslint#${name}`,
);
