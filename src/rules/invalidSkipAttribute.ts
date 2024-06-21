import { AST_NODE_TYPES, TSESTree } from "@typescript-eslint/utils";
import { createRule } from "../utils/createRule.ts";

export const invalidSkipAttribute = createRule({
  name: "invalid-skip-attribute",
  defaultOptions: [],
  meta: {
    type: "problem",
    docs: {
      description: "Validates the correct usage of the skip attribute.",
    },
    schema: [],
    messages: {
      invalidSkipByIndexAttribute:
        "The index does not correspond to the index of a parameter on the instrumented function or method.",
      // invalidSkipByNameAttribute
      // invalidSkipByMaskAttribute
      avoidDynamicSkipAttributes:
        "Avoid dynamic skip attributes. These cannot be statically verified.",
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.arguments.length === 0) {
          return;
        }
        if (
          node.callee.type !== AST_NODE_TYPES.Identifier ||
          node.callee.name !== "skip"
        ) {
          return;
        }
        if (node.parent.type === AST_NODE_TYPES.ArrayExpression) {
          handleFunctionDecorator(node.parent, node);
        } else if (node.parent.type === AST_NODE_TYPES.CallExpression) {
          handleMethodDecorator(node.parent, node);
          return;
        }
      },
    };

    function handleFunctionDecorator(
      attributes: TSESTree.ArrayExpression,
      skipAttribute: TSESTree.CallExpression,
    ) {
      if (attributes.parent.type !== AST_NODE_TYPES.CallExpression) {
        return;
      }
      if (
        attributes.parent.callee.type !== AST_NODE_TYPES.Identifier ||
        attributes.parent.callee.name !== "instrumentCallback"
      ) {
        return;
      }
      const instrumentCallbackCallExpression = attributes.parent;
      const functionToInstrument =
        instrumentCallbackCallExpression.arguments[1];
      if (
        !(functionToInstrument.type === AST_NODE_TYPES.FunctionExpression ||
          functionToInstrument.type === AST_NODE_TYPES.ArrowFunctionExpression)
      ) {
        return;
      }
      handleParamsAndSkipArguments(functionToInstrument.params, skipAttribute.arguments);
    }

    function handleMethodDecorator(
      decoratorCallExpression: TSESTree.CallExpression,
      skipAttribute: TSESTree.CallExpression,
    ) {
      if (
        decoratorCallExpression.callee.type !== AST_NODE_TYPES.Identifier ||
        decoratorCallExpression.callee.name !== "instrument"
      ) {
        return;
      }
      if (decoratorCallExpression.parent.type !== AST_NODE_TYPES.Decorator) {
        return;
      }
      const maybeMethodDefinition = decoratorCallExpression.parent.parent;
      if (
        maybeMethodDefinition.type !== AST_NODE_TYPES.MethodDefinition
      ) {
        return;
      }
      handleParamsAndSkipArguments(maybeMethodDefinition.value.params, skipAttribute.arguments);
    }

    function handleParamsAndSkipArguments(
      params: TSESTree.Parameter[],
      skipAttributeArguments: TSESTree.CallExpressionArgument[],
    ) {
      if (skipAttributeArguments.length === 0) {
        return;
      }
      if (skipAttributeArguments.length === 1) {
        const firstArg = skipAttributeArguments[0];
        if (
          firstArg.type === AST_NODE_TYPES.UnaryExpression &&
          ["-", "+"].includes(firstArg.operator)
        ) {
          context.report({
            messageId: "invalidSkipByIndexAttribute",
            node: firstArg,
          });
          return;
        }
        if (firstArg.type !== AST_NODE_TYPES.Literal) {
          context.report({
            messageId: "avoidDynamicSkipAttributes",
            node: firstArg,
          });
          return;
        }
        if (typeof firstArg.value === "number") {
          handleSkipByIndex(firstArg, params);
          return;
        }
      }
    }

    function handleSkipByIndex(
      index: TSESTree.NumberLiteral,
      params: TSESTree.Parameter[],
    ) {
      const lastParam = params.at(-1);
      if (!lastParam) {
        context.report({
          messageId: "invalidSkipByIndexAttribute",
          node: index,
        });
        return;
      }
      if (!Number.isInteger(index.value)) {
        context.report({
          messageId: "invalidSkipByIndexAttribute",
          node: index,
        });
        return;
      }
      if (lastParam.type === AST_NODE_TYPES.RestElement) {
        return;
      }
      if (index.value >= params.length) {
        context.report({
          messageId: "invalidSkipByIndexAttribute",
          node: index,
        });
        return;
      }
    }
  },
});
