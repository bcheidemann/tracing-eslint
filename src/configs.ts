import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";

export function recommended(plugin: FlatConfig.Plugin): FlatConfig.Config {
  return {
    name: 'tracing-eslint/recommended',
    // languageOptions: {
    //   parser: '@typescript-eslint/parser',
    // },
    // parserOptions: { sourceType: 'module' },
    plugins: {
      'tracing-eslint': plugin,
    },
    rules: {
      "tracing-eslint/prefer-explicit-resource-management": "error",
    },
  }
}
