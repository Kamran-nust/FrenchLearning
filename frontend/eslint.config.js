import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist", "node_modules", "src/data"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "18" } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/prop-types": "off", // plain JS project; props are documented by usage
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-empty": "error", // swallowed errors hide real problems; say why or handle it
      "react/no-unescaped-entities": "off",
      "react-hooks/purity": "warn",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "react-hooks/set-state-in-effect": "warn", // "reset to loading, then fetch" is used on purpose
    },
  },
  {
    files: ["**/*.test.{js,jsx}", "vitest.config.js", "vite.config.js", "tailwind.config.js", "postcss.config.js"],
    languageOptions: { globals: { ...globals.node } },
  },
];
