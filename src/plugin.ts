import fs from "node:fs";
import type { FlatConfig } from "@typescript-eslint/utils/ts-eslint";
import { preferExplicitResourceManagementRule } from "./rules/preferExplicitResourceManagement.ts";
import { recommended } from "./configs.ts";

const pkg = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

type Plugin = Omit<FlatConfig.Plugin, "configs">;

const plugin: Plugin = {
  meta: {
    name: pkg.name,
    version: pkg.version,
  },
  rules: {
    "prefer-explicit-resource-management": preferExplicitResourceManagementRule,
  },
};

export const configs: Record<"recommended", FlatConfig.Config> = {
  recommended: recommended(plugin),
}

export default plugin;
