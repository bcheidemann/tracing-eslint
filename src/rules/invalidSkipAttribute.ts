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
      invalidSkipByNameAttribute:
        "The name does not correspond to a parameter name on the instrumented function or method.",
      // invalidSkipByMaskAttribute
      avoidDynamicSkipAttributes:
        "Avoid dynamic skip attributes. These cannot be statically verified.",
      avoidComplexSkipByNameAttributes:
        "Avoid complex skip by name attributes, such as destructured objects. These can be auto-formatted, resulting in data being unintentionally logged."
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
      handleParamsAndSkipArguments(
        functionToInstrument.params,
        skipAttribute.arguments,
      );
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
      handleParamsAndSkipArguments(
        maybeMethodDefinition.value.params,
        skipAttribute.arguments,
      );
    }

    function handleParamsAndSkipArguments(
      params: TSESTree.Parameter[],
      skipAttributeArguments: TSESTree.CallExpressionArgument[],
    ) {
      if (skipAttributeArguments.length === 0) {
        return;
      }
      // TODO: Check if first arg is boolean and handle mask
      for (const skipArgument of skipAttributeArguments) {
        if (
          skipArgument.type === AST_NODE_TYPES.UnaryExpression &&
          ["-", "+"].includes(skipArgument.operator)
        ) {
          context.report({
            messageId: "invalidSkipByIndexAttribute",
            node: skipArgument,
          });
          return;
        }
        if (skipArgument.type !== AST_NODE_TYPES.Literal) {
          context.report({
            messageId: "avoidDynamicSkipAttributes",
            node: skipArgument,
          });
          return;
        }
        if (typeof skipArgument.value === "number" && getSkipByIndexDiagnostic(skipArgument, params)) {
          return;
        }
        if (typeof skipArgument.value === "string" && getSkipByNameDiagnostic(skipArgument, params)) {
          return;
        }
      }
    }

    function getSkipByIndexDiagnostic(
      index: TSESTree.NumberLiteral,
      params: TSESTree.Parameter[],
    ): "diagnostic" | undefined {
      const lastParam = params.at(-1);
      if (!lastParam) {
        context.report({
          messageId: "invalidSkipByIndexAttribute",
          node: index,
        });
        return "diagnostic";
      }
      if (!Number.isInteger(index.value)) {
        context.report({
          messageId: "invalidSkipByIndexAttribute",
          node: index,
        });
        return "diagnostic";
      }
      if (lastParam.type === AST_NODE_TYPES.RestElement) {
        return;
      }
      if (index.value >= params.length) {
        context.report({
          messageId: "invalidSkipByIndexAttribute",
          node: index,
        });
        return "diagnostic";
      }
    }

    function getSkipByNameDiagnostic(
      name: TSESTree.StringLiteral,
      params: TSESTree.Parameter[],
    ): "diagnostic" | undefined {
      for (const param of params) {
        switch (param.type) {
          case AST_NODE_TYPES.Identifier:
            if (param.name === name.value) {
              return;
            }
            break;
          case AST_NODE_TYPES.RestElement:
            if (
              param.argument.type === AST_NODE_TYPES.Identifier &&
              context.sourceCode.getText(param) === name.value
            ) {
              return;
            }
            break;
          case AST_NODE_TYPES.AssignmentPattern:
            if (
              param.left.type === AST_NODE_TYPES.Identifier &&
              param.left.name === name.value
            ) {
              return;
            }
            break;
        }

        if (context.sourceCode.getText(param) === name.value) {
          context.report({
            messageId: "avoidComplexSkipByNameAttributes",
            node: name,
          });
          return "diagnostic";
        }
      }
      context.report({
        messageId: "invalidSkipByNameAttribute",
        node: name,
      });
      return "diagnostic";
    }
  },
});
