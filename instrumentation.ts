/**
 * Next invokes this hook before serving requests in a Node runtime. Keep the
 * build phase free of deployment validation: static builds do not have the
 * production environment and must remain reproducible.
 */
export async function register() {
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  if (isBuild || process.env.NODE_ENV !== "production") return;

  // Next compiles this entry for Edge as well; keep Node-only imports inside
  // the runtime branch so crypto and the database adapter stay on the server.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getConfig } = await import("@/infrastructure/config/env");
    const { logger } = await import("@/infrastructure/observability/logger");
    const config = getConfig();
    logger.info("application configuration validated", {
      operation: "startup",
      runtime: config.runtime,
      nodeEnv: config.nodeEnv,
    });
  }
}
