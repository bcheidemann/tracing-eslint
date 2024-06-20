import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import parser from "@typescript-eslint/parser";

export function recommended(plugin: FlatConfig.Plugin): FlatConfig.Config {
  return {
    name: 'tracing-eslint/recommended',
    languageOptions: {
      parser,
    },
    plugins: {
      'tracing-eslint': plugin,
    },
    rules: {
      "tracing-eslint/prefer-explicit-resource-management": "error",
    },
  }
}
