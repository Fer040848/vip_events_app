import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "."),
      "react-native": resolve(process.cwd(), "tests/mocks/react-native.ts"),
    },
  },
  test: {
    environment: "node",
  },
  esbuild: {
    jsx: "automatic",
    loader: "tsx",
    target: "es2022",
  },
});
