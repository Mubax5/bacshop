import type { AppConfig } from "@/infrastructure/config/env";
import { getConfig } from "@/infrastructure/config/env";
import type { PrismaClient } from "@/generated/prisma/client";
import { getDatabase } from "./client";
import type { CatalogRepository } from "@/infrastructure/catalog/catalog-repository";
import { developmentCatalogRepository } from "@/infrastructure/catalog/catalog-repository";
import type { SessionCartRepository } from "@/infrastructure/cart/session-cart-repository";
import { developmentSessionCart } from "@/infrastructure/cart/session-cart-repository";
import type { AuditEventRepository } from "@/infrastructure/audit/audit-event-repository";
import { developmentAuditEvents } from "@/infrastructure/audit/audit-event-repository";
import type { NotificationRepository } from "@/infrastructure/notifications/notification-repository";
import { developmentNotifications } from "@/infrastructure/notifications/notification-repository";
import { PrismaCatalogRepository } from "./prisma-catalog-repository";
import { PrismaSessionCartRepository } from "./prisma-cart-repository";
import { PrismaAuditEventRepository } from "./prisma-audit-repository";
import { PrismaNotificationRepository } from "./prisma-notification-repository";

export interface ApplicationRepositories {
  catalog: CatalogRepository;
  cart: SessionCartRepository;
  audit: AuditEventRepository;
  notifications: NotificationRepository;
}

/** Composition boundary: a database outage never selects development data. */
export function createRepositories(config: Pick<AppConfig, "runtime" | "isProduction">, databaseFactory: () => PrismaClient = getDatabase): ApplicationRepositories {
  if (config.runtime === "database") {
    const database = databaseFactory();
    return { catalog: new PrismaCatalogRepository(database), cart: new PrismaSessionCartRepository(database), audit: new PrismaAuditEventRepository(database), notifications: new PrismaNotificationRepository(database) };
  }
  if (config.isProduction) throw new Error("Development repositories are forbidden in production");
  return { catalog: developmentCatalogRepository, cart: developmentSessionCart, audit: developmentAuditEvents, notifications: developmentNotifications };
}

let repositories: ApplicationRepositories | undefined;
export function getRepositories(): ApplicationRepositories {
  repositories ??= createRepositories(getConfig());
  return repositories;
}
