// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [...nextVitals, ...nextTs, {
  rules: {
    // Existing codebase has broad `any` usage and migration debt.
    "@typescript-eslint/no-explicit-any": "off",
    // New React hook safety rules are useful but too disruptive as an immediate baseline.
    "react-hooks/set-state-in-effect": "off",
    "react-hooks/immutability": "off",
  },
}, {
  ignores: [
    ".next/**",
    "node_modules/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "tmp/**",
    "*.min.js",
  ],
}, ...storybook.configs["flat/recommended"]];

export default eslintConfig;
