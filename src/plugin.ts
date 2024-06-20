import fs from "node:fs";
import type { ClassicConfig, Linter } from "@typescript-eslint/utils/ts-eslint";
import { preferExplicitResourceManagementRule } from "./rules/preferExplicitResourceManagement.ts";
import { recommended } from "./configs.ts";

const pkg = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

type Plugin = Omit<Linter.Plugin, "configs"> & {
  configs: Record<"recommended", ClassicConfig.Config>;
};

const plugin: Plugin = {
  configs: {
    recommended,
  },
  meta: {
    name: pkg.name,
    version: pkg.version,
  },
  rules: {
    "prefer-explicit-resource-management": preferExplicitResourceManagementRule,
  },
};

export default plugin;
