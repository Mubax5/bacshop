import nextEnvironment from "@next/env";
import { ConfigurationError, loadConfig } from "../src/infrastructure/config/env.ts";
import { logger } from "../src/infrastructure/observability/logger.ts";

// Node 24 runs these erasable TypeScript modules without a development loader.
// Use Next's production file precedence before binding a listening port.
process.env.NODE_ENV = "production";
nextEnvironment.loadEnvConfig(process.cwd(), false, { info: () => {}, error: () => {} });

try {
  loadConfig(process.env);
} catch (error) {
  logger.error("production startup refused: invalid configuration", {
    operation: "startup",
    fields: error instanceof ConfigurationError ? error.issues.map((issue) => issue.path.join(".")) : ["configuration"],
  });
  process.exitCode = 1;
}
