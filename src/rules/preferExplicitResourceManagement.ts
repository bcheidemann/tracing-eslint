import { ESLintUtils } from '@typescript-eslint/utils';
import type { Rule } from "eslint";

const spanNames = [
  "span",
  "traceSpan",
  "debugSpan",
  "infoSpan",
  "warnSpan",
  "errorSpan",
  "criticalSpan",
];

const createRule = ESLintUtils.RuleCreator(
  name => `https://github.com/bcheidemann/tracing-eslint#${name}`,
);

export const preferExplicitResourceManagementRule = createRule({
  name: "prefer-explicit-resource-management",
  defaultOptions: [],
  meta: {
    type: "suggestion",
    docs: {
      description:
        "When manually exiting spans, it is easy to forget to exit spans, which may lead to unexpected results. Therefore, explicit resource management (using declarations) is preferred.",
    },
    schema: [],
    messages: {
      preferExplicitResourceManagement:
        "Prefer explicit resource management over manually exiting spans.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "MemberExpression") {
          return;
        }
        const { object, property } = callee;
        if (property.type !== "Identifier" || property.name !== "enter") {
          return;
        }
        if (
          object.type !== "CallExpression" ||
          object.callee.type !== "Identifier" ||
          !spanNames.includes(object.callee.name)
        ) {
          return;
        }
        if (node.parent.type !== "VariableDeclarator" || node.parent.parent.type !== "VariableDeclaration") {
          context.report({
            messageId: "preferExplicitResourceManagement",
            node,
          });
          return;
        }
        if (
          node.parent.parent.kind !== "using"
        ) {
          context.report({
            messageId: "preferExplicitResourceManagement",
            node: node.parent.parent,
          });
          return;
        }
      },
    };
  },
});
