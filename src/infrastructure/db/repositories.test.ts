import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@/generated/prisma/client";
import { createRepositories } from "./repositories";
import { PrismaCatalogRepository } from "./prisma-catalog-repository";

describe("repository composition", () => {
  it("uses durable adapters for a database runtime", () => {
    const factory = vi.fn(() => ({} as PrismaClient));
    expect(createRepositories({ runtime: "database", isProduction: true }, factory).catalog).toBeInstanceOf(PrismaCatalogRepository);
    expect(factory).toHaveBeenCalledOnce();
  });

  it("never falls back to seeded data when the database is unavailable", () => {
    expect(() => createRepositories({ runtime: "database", isProduction: true }, () => { throw new Error("Database unavailable"); })).toThrow("Database unavailable");
    expect(() => createRepositories({ runtime: "development", isProduction: true })).toThrow("forbidden");
  });

  it("does not create a database for an explicitly local development runtime", () => {
    const factory = vi.fn();
    expect(createRepositories({ runtime: "development", isProduction: false }, factory).catalog).toBeDefined();
    expect(factory).not.toHaveBeenCalled();
  });
});
