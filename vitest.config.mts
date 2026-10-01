import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const sourceDirectory = fileURLToPath(new URL("./src", import.meta.url)).replaceAll("\\", "/");

export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: { "@": sourceDirectory },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
