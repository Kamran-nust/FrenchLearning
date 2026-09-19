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
      "no-empty": "warn", // TODO(step 3): make these real error messages, then set to "error"
      "react/no-unescaped-entities": "off",
      "react-hooks/purity": "warn",
      eqeqeq: ["error", "always", { null: "ignore" }],
      "react-hooks/set-state-in-effect": "warn", // "reset to loading, then fetch" is used on purpose
    },
  },
  {
    files: ["**/*.test.js", "vitest.config.js", "vite.config.js", "tailwind.config.js", "postcss.config.js"],
    languageOptions: { globals: { ...globals.node } },
  },
];
