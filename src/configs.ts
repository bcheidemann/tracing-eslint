import type { ClassicConfig } from "@typescript-eslint/utils/ts-eslint";

export const recommended: ClassicConfig.Config = {
  parser: '@typescript-eslint/parser',
  parserOptions: { sourceType: 'module' },
  plugins: [
    '@typescript-eslint',
    '@bcheidemann/tracing-eslint',
  ],
}
