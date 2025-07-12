import { defineLinter } from "@typespec/compiler";
import { noInterfaceRule } from "./rules/no-interfaces.rule.js";

export const $linter = defineLinter({
  rules: [noInterfaceRule],
  ruleSets: {
    recommended: {
      enable: { [`@typespec-events&#x2F;lib/${noInterfaceRule.name}`]: true },
    },
    all: {
      enable: { [`@typespec-events&#x2F;lib/${noInterfaceRule.name}`]: true },
    },
  },
});
