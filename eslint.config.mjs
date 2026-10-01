import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["server.js", "test/**/*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  globalIgnores([".next/**", "node_modules/**", "coverage/**", "next-env.d.ts", "src/generated/prisma/**", ".superpowers/**", ".local-db/**"]),
]);
