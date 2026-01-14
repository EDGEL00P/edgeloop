/// <reference types="vitest" />
/// <reference types="next" />
/// <reference types="next/image-types/global" />

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["__tests__/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "__tests__/",
        "**/*.d.ts",
        "**/*.config.*"
      ]
    },
    globals: true,
    setupFiles: ["__tests__/setup.ts"],
    testTimeout: 10000
  },
  resolve: {
    alias: {
      "@": "./client/src",
      "@shared": "./shared",
      "@server": "./server"
    }
  }
});
