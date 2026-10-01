import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  oxc: { jsx: { runtime: "automatic" } },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)).replaceAll("\\", "/") } },
  test: { environment: "node", include: ["test/integration/**/*.test.ts"], fileParallelism: false, testTimeout: 20000, hookTimeout: 20000 },
});
