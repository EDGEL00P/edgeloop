import path from "path";
import { fileURLToPath } from "url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "server/**",
      "domains/**",
      "contracts/**",
      "sdks/**",
      "engine/**",
      "ml/**",
      "python_engine/**",
      "scripts/**",
      "script/**",
      "trigger/**",
    ],
  },
  js.configs.recommended,
  ...compat.extends("next/core-web-vitals"),
  {
    rules: {
      "no-console": "warn",
    },
  },
];
