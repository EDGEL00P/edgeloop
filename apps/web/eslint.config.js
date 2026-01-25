import path from "path";
import { fileURLToPath } from "url";
import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sharedGlobals = {
  AbortController: "readonly",
  Buffer: "readonly",
  Headers: "readonly",
  Request: "readonly",
  Response: "readonly",
  URL: "readonly",
  URLSearchParams: "readonly",
  clearTimeout: "readonly",
  console: "readonly",
  fetch: "readonly",
  process: "readonly",
  setTimeout: "readonly",
};

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "**/*.d.ts",
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      globals: sharedGlobals,
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        tsconfigRootDir: __dirname,
      },
      globals: sharedGlobals,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "no-undef": "off",
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
];
