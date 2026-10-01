-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'LOCKED', 'DISABLED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "AuthIdentityType" AS ENUM ('PASSWORD', 'OAUTH');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'OPERATIONS', 'FINANCE', 'CONTENT', 'CUSTOMER_SUPPORT');

-- CreateEnum
CREATE TYPE "MfaFactorType" AS ENUM ('TOTP');

-- CreateEnum
CREATE TYPE "ResellerStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CommercialContext" AS ENUM ('RETAIL', 'RESELLER');

-- CreateEnum
CREATE TYPE "PriceKind" AS ENUM ('RETAIL', 'RESELLER');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('PRODUCT_IMAGE', 'PRODUCT_LOGO', 'MARKETING', 'CMS', 'SUPPORT_ATTACHMENT');

-- CreateEnum
CREATE TYPE "InventoryAvailability" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'UNLIMITED', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'ABANDONED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CheckoutStatus" AS ENUM ('OPEN', 'PRICE_CHANGED', 'PAYMENT_PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('CREATED', 'PROCESSING', 'NEEDS_CUSTOMER_INPUT', 'FULFILLED', 'ISSUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('QUEUED', 'PROCESSING', 'NEEDS_CUSTOMER_INPUT', 'FULFILLED', 'ISSUE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentEventType" AS ENUM ('CREATED', 'PENDING', 'SETTLEMENT', 'CAPTURE', 'AUTHORIZE', 'DENY', 'EXPIRE', 'CANCEL', 'REFUND', 'CHARGEBACK', 'FAILURE', 'RECONCILIATION');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EntitlementStatus" AS ENUM ('PENDING_ACTIVATION', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'REVOKED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "FulfillmentEventType" AS ENUM ('CREATED', 'PROCESSING', 'CUSTOMER_INPUT_REQUESTED', 'CUSTOMER_INPUT_RECEIVED', 'ACTIVATED', 'FULFILLED', 'FAILED', 'CANCELLED', 'NOTE');

-- CreateEnum
CREATE TYPE "ResellerCustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WalletEntryType" AS ENUM ('TOP_UP', 'PURCHASE', 'REFUND', 'ADMIN_CREDIT', 'ADMIN_DEBIT', 'CAMPAIGN_REWARD', 'REVERSAL');

-- CreateEnum
CREATE TYPE "WalletEntryDirection" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "TopUpStatus" AS ENUM ('REQUESTED', 'PENDING_RECONCILIATION', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'BUNDLE');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('OPEN', 'WAITING_CUSTOMER', 'WAITING_OPS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SupportPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PAYMENT_RECEIVED', 'PAYMENT_ISSUE', 'PROCESSING', 'ACTIVATION_READY', 'CUSTOMER_INPUT_REQUIRED', 'FULFILLMENT_ISSUE', 'EXPIRY_REMINDER', 'REFUND', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'READ');

-- CreateEnum
CREATE TYPE "CmsContentType" AS ENUM ('PAGE', 'FAQ', 'ANNOUNCEMENT', 'SETTING');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "emailVerifiedAt" TIMESTAMP(3),
    "displayName" VARCHAR(160),
    "phone" VARCHAR(32),
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "lastLoginAt" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_identities" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "AuthIdentityType" NOT NULL,
    "provider" VARCHAR(64) NOT NULL DEFAULT 'password',
    "providerAccountId" VARCHAR(255),
    "passwordHash" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "auth_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "context" "CommercialContext" NOT NULL DEFAULT 'RETAIL',
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "usedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "usedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_role_assignments" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "AdminRole" NOT NULL,
    "grantedById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ(6),

    CONSTRAINT "admin_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mfa_factors" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "MfaFactorType" NOT NULL,
    "secretCiphertext" TEXT NOT NULL,
    "label" VARCHAR(160),
    "verifiedAt" TIMESTAMPTZ(6),
    "lastUsedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabledAt" TIMESTAMPTZ(6),

    CONSTRAINT "mfa_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mfa_recovery_codes" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "factorId" UUID,
    "codeHash" VARCHAR(255) NOT NULL,
    "usedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_recovery_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "parentId" UUID,
    "slug" VARCHAR(160) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" UUID NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "storageKey" VARCHAR(512) NOT NULL,
    "publicUrl" VARCHAR(2048),
    "mimeType" VARCHAR(160) NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sha256" VARCHAR(128),
    "width" INTEGER,
    "height" INTEGER,
    "altText" VARCHAR(500),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "brandId" UUID,
    "categoryId" UUID,
    "slug" VARCHAR(200) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "shortDescription" VARCHAR(500),
    "description" TEXT,
    "termsSnapshot" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_media" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "product_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skus" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "code" VARCHAR(160) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "variant" JSONB,
    "fulfillmentType" VARCHAR(80) NOT NULL,
    "fulfillmentTerms" JSONB,
    "durationDays" INTEGER,
    "durationLabel" VARCHAR(160),
    "activationMethod" VARCHAR(160),
    "region" VARCHAR(80),
    "requirements" JSONB,
    "accountRequirements" TEXT,
    "deviceRestrictions" TEXT,
    "warrantyTerms" TEXT,
    "processingSlaText" VARCHAR(255),
    "supportTerms" TEXT,
    "processingSlaMinutes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "skus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prices" (
    "id" UUID NOT NULL,
    "skuId" UUID NOT NULL,
    "kind" "PriceKind" NOT NULL,
    "resellerTierId" UUID,
    "amount" INTEGER NOT NULL,
    "compareAtAmount" INTEGER,
    "currency" CHAR(3) NOT NULL DEFAULT 'IDR',
    "promotionId" UUID,
    "validFrom" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMPTZ(6),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "skuId" UUID NOT NULL,
    "onHand" INTEGER NOT NULL DEFAULT 0,
    "committed" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "availability" "InventoryAvailability" NOT NULL DEFAULT 'UNLIMITED',
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "sessionKey" VARCHAR(255),
    "context" "CommercialContext" NOT NULL DEFAULT 'RETAIL',
    "status" "CartStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "skuId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "addedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkout_sessions" (
    "id" UUID NOT NULL,
    "cartId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "context" "CommercialContext" NOT NULL,
    "status" "CheckoutStatus" NOT NULL DEFAULT 'OPEN',
    "currency" CHAR(3) NOT NULL DEFAULT 'IDR',
    "subtotalAmount" INTEGER NOT NULL DEFAULT 0,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL DEFAULT 0,
    "customerSnapshot" JSONB,
    "priceSnapshot" JSONB,
    "expiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "orderNumber" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "checkoutId" UUID,
    "resellerProfileId" UUID,
    "resellerCustomerId" UUID,
    "context" "CommercialContext" NOT NULL DEFAULT 'RETAIL',
    "status" "OrderStatus" NOT NULL DEFAULT 'CREATED',
    "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'QUEUED',
    "currency" CHAR(3) NOT NULL DEFAULT 'IDR',
    "subtotalAmount" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "customerSnapshot" JSONB NOT NULL,
    "billingSnapshot" JSONB,
    "termsSnapshot" JSONB,
    "paidAt" TIMESTAMPTZ(6),
    "fulfilledAt" TIMESTAMPTZ(6),
    "cancelledAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "skuId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "productNameSnapshot" VARCHAR(255) NOT NULL,
    "skuNameSnapshot" VARCHAR(255) NOT NULL,
    "skuCodeSnapshot" VARCHAR(160) NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "lineTotal" INTEGER NOT NULL,
    "context" "CommercialContext" NOT NULL,
    "fulfillmentSnapshot" JSONB NOT NULL,
    "termsSnapshot" JSONB,
    "recipientSnapshot" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "provider" VARCHAR(64) NOT NULL DEFAULT 'midtrans',
    "providerPaymentId" VARCHAR(255),
    "providerOrderId" VARCHAR(255),
    "idempotencyKey" VARCHAR(255) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "currency" CHAR(3) NOT NULL DEFAULT 'IDR',
    "amount" INTEGER NOT NULL,
    "paidAmount" INTEGER,
    "expiresAt" TIMESTAMPTZ(6),
    "paidAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "provider" VARCHAR(64) NOT NULL,
    "providerEventId" VARCHAR(255),
    "type" "PaymentEventType" NOT NULL,
    "status" VARCHAR(80),
    "amount" INTEGER,
    "currency" CHAR(3),
    "signatureVerified" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "idempotencyKey" VARCHAR(255) NOT NULL,
    "providerRefundId" VARCHAR(255),
    "amount" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'IDR',
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedById" UUID,
    "requestedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ(6),

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_reservations" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "skuId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "consumedAt" TIMESTAMPTZ(6),
    "releasedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fulfillment_events" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "type" "FulfillmentEventType" NOT NULL,
    "status" "FulfillmentStatus" NOT NULL,
    "message" TEXT,
    "data" JSONB,
    "createdById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fulfillment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entitlements" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "orderItemId" UUID NOT NULL,
    "status" "EntitlementStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION',
    "activationData" JSONB,
    "startsAt" TIMESTAMPTZ(6),
    "expiresAt" TIMESTAMPTZ(6),
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reseller_tiers" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rules" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reseller_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reseller_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tierId" UUID,
    "status" "ResellerStatus" NOT NULL DEFAULT 'NONE',
    "applicationNote" TEXT,
    "rejectionReason" TEXT,
    "suspensionReason" TEXT,
    "approvedAt" TIMESTAMPTZ(6),
    "approvedById" UUID,
    "suspendedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reseller_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reseller_customers" (
    "id" UUID NOT NULL,
    "resellerProfileId" UUID NOT NULL,
    "linkedUserId" UUID,
    "skuId" UUID,
    "name" VARCHAR(160) NOT NULL,
    "email" VARCHAR(320),
    "phone" VARCHAR(32),
    "externalReference" VARCHAR(255),
    "notes" TEXT,
    "status" "ResellerCustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reseller_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reseller_orders" (
    "id" UUID NOT NULL,
    "resellerProfileId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "customerId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reseller_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL,
    "resellerProfileId" UUID NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'IDR',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "resellerProfileId" UUID NOT NULL,
    "orderId" UUID,
    "topUpId" UUID,
    "type" "WalletEntryType" NOT NULL,
    "direction" "WalletEntryDirection" NOT NULL,
    "amount" INTEGER NOT NULL,
    "reference" VARCHAR(255) NOT NULL,
    "idempotencyKey" VARCHAR(255),
    "reason" TEXT NOT NULL,
    "actorUserId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "top_ups" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "resellerProfileId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'IDR',
    "reference" VARCHAR(255) NOT NULL,
    "providerReference" VARCHAR(255),
    "status" "TopUpStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedById" UUID,
    "reconciledById" UUID,
    "reason" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "top_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80),
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "type" "PromotionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'IDR',
    "maxRedemptions" INTEGER,
    "perUserLimit" INTEGER,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "rules" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_products" (
    "promotionId" UUID NOT NULL,
    "productId" UUID NOT NULL,

    CONSTRAINT "promotion_products_pkey" PRIMARY KEY ("promotionId","productId")
);

-- CreateTable
CREATE TABLE "promotion_skus" (
    "promotionId" UUID NOT NULL,
    "skuId" UUID NOT NULL,

    CONSTRAINT "promotion_skus_pkey" PRIMARY KEY ("promotionId","skuId")
);

-- CreateTable
CREATE TABLE "promotion_redemptions" (
    "id" UUID NOT NULL,
    "promotionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMPTZ(6),
    "endsAt" TIMESTAMPTZ(6),
    "target" JSONB,
    "reward" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_products" (
    "campaignId" UUID NOT NULL,
    "productId" UUID NOT NULL,

    CONSTRAINT "campaign_products_pkey" PRIMARY KEY ("campaignId","productId")
);

-- CreateTable
CREATE TABLE "campaign_skus" (
    "campaignId" UUID NOT NULL,
    "skuId" UUID NOT NULL,

    CONSTRAINT "campaign_skus_pkey" PRIMARY KEY ("campaignId","skuId")
);

-- CreateTable
CREATE TABLE "campaign_participants" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "resellerProfileId" UUID NOT NULL,
    "progress" JSONB,
    "rewardGranted" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_assets" (
    "id" UUID NOT NULL,
    "campaignId" UUID,
    "assetId" UUID,
    "title" VARCHAR(255) NOT NULL,
    "caption" TEXT,
    "audience" VARCHAR(80),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "marketing_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL,
    "ticketNumber" VARCHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID,
    "resellerProfileId" UUID,
    "subject" VARCHAR(255) NOT NULL,
    "issueType" VARCHAR(80) NOT NULL,
    "status" "SupportStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "SupportPriority" NOT NULL DEFAULT 'NORMAL',
    "assignedToId" UUID,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "resolvedAt" TIMESTAMPTZ(6),

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_messages" (
    "id" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "orderId" UUID,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "deduplicationKey" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "sentAt" TIMESTAMPTZ(6),
    "readAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "action" VARCHAR(120) NOT NULL,
    "entityType" VARCHAR(120) NOT NULL,
    "entityId" VARCHAR(255),
    "reason" TEXT,
    "beforeData" JSONB,
    "afterData" JSONB,
    "ipAddress" VARCHAR(64),
    "requestId" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_content" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "type" "CmsContentType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT,
    "data" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMPTZ(6),
    "mediaAssetId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cms_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "skuId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recently_viewed" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "sessionKey" VARCHAR(255),
    "productId" UUID NOT NULL,
    "skuId" UUID,
    "viewedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recently_viewed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recent_searches" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "sessionKey" VARCHAR(255),
    "query" VARCHAR(255) NOT NULL,
    "searchedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recent_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "scope" VARCHAR(120) NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "requestHash" VARCHAR(128),
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "lockedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "eventKey" VARCHAR(255) NOT NULL,
    "eventType" VARCHAR(160) NOT NULL,
    "aggregateType" VARCHAR(120) NOT NULL,
    "aggregateId" VARCHAR(255) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMPTZ(6),
    "publishedAt" TIMESTAMPTZ(6),
    "lastError" TEXT,
    "createdById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "id" UUID NOT NULL,
    "bucketKey" VARCHAR(255) NOT NULL,
    "windowStart" TIMESTAMPTZ(6) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_createdAt_idx" ON "users"("status", "createdAt");

-- CreateIndex
CREATE INDEX "auth_identities_userId_type_idx" ON "auth_identities"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "auth_identities_provider_providerAccountId_key" ON "auth_identities"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_tokenHash_key" ON "sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "sessions_userId_revokedAt_expiresAt_idx" ON "sessions"("userId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_tokenHash_key" ON "email_verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_userId_expiresAt_idx" ON "email_verification_tokens"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_expiresAt_idx" ON "password_reset_tokens"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "admin_role_assignments_userId_role_revokedAt_idx" ON "admin_role_assignments"("userId", "role", "revokedAt");

-- CreateIndex
CREATE INDEX "mfa_factors_userId_type_disabledAt_idx" ON "mfa_factors"("userId", "type", "disabledAt");

-- CreateIndex
CREATE UNIQUE INDEX "mfa_recovery_codes_codeHash_key" ON "mfa_recovery_codes"("codeHash");

-- CreateIndex
CREATE INDEX "mfa_recovery_codes_userId_usedAt_idx" ON "mfa_recovery_codes"("userId", "usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE INDEX "brands_isActive_name_idx" ON "brands"("isActive", "name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parentId_isActive_sortOrder_idx" ON "categories"("parentId", "isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storageKey_key" ON "media_assets"("storageKey");

-- CreateIndex
CREATE INDEX "media_assets_kind_createdAt_idx" ON "media_assets"("kind", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_brandId_isActive_idx" ON "products"("brandId", "isActive");

-- CreateIndex
CREATE INDEX "products_categoryId_isActive_idx" ON "products"("categoryId", "isActive");

-- CreateIndex
CREATE INDEX "products_isActive_name_idx" ON "products"("isActive", "name");

-- CreateIndex
CREATE INDEX "product_media_productId_isPrimary_sortOrder_idx" ON "product_media"("productId", "isPrimary", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "product_media_productId_assetId_key" ON "product_media"("productId", "assetId");

-- CreateIndex
CREATE UNIQUE INDEX "skus_code_key" ON "skus"("code");

-- CreateIndex
CREATE INDEX "skus_productId_isActive_idx" ON "skus"("productId", "isActive");

-- CreateIndex
CREATE INDEX "prices_skuId_kind_validFrom_validUntil_idx" ON "prices"("skuId", "kind", "validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "prices_resellerTierId_skuId_validFrom_validUntil_idx" ON "prices"("resellerTierId", "skuId", "validFrom", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_skuId_key" ON "inventory_items"("skuId");

-- CreateIndex
CREATE INDEX "inventory_items_availability_updatedAt_idx" ON "inventory_items"("availability", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "carts_sessionKey_key" ON "carts"("sessionKey");

-- CreateIndex
CREATE INDEX "carts_userId_context_status_idx" ON "carts"("userId", "context", "status");

-- CreateIndex
CREATE INDEX "carts_expiresAt_idx" ON "carts"("expiresAt");

-- CreateIndex
CREATE INDEX "cart_items_skuId_idx" ON "cart_items"("skuId");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cartId_skuId_key" ON "cart_items"("cartId", "skuId");

-- CreateIndex
CREATE UNIQUE INDEX "checkout_sessions_cartId_key" ON "checkout_sessions"("cartId");

-- CreateIndex
CREATE INDEX "checkout_sessions_userId_status_createdAt_idx" ON "checkout_sessions"("userId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "orders_checkoutId_key" ON "orders"("checkoutId");

-- CreateIndex
CREATE INDEX "orders_userId_createdAt_idx" ON "orders"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_status_fulfillmentStatus_createdAt_idx" ON "orders"("status", "fulfillmentStatus", "createdAt");

-- CreateIndex
CREATE INDEX "orders_resellerProfileId_createdAt_idx" ON "orders"("resellerProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_skuId_createdAt_idx" ON "order_items"("skuId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payments_idempotencyKey_key" ON "payments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payments_orderId_status_idx" ON "payments"("orderId", "status");

-- CreateIndex
CREATE INDEX "payments_provider_status_createdAt_idx" ON "payments"("provider", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_providerPaymentId_key" ON "payments"("provider", "providerPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_providerOrderId_key" ON "payments"("provider", "providerOrderId");

-- CreateIndex
CREATE INDEX "payment_events_paymentId_receivedAt_idx" ON "payment_events"("paymentId", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_provider_providerEventId_key" ON "payment_events"("provider", "providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_idempotencyKey_key" ON "refunds"("idempotencyKey");

-- CreateIndex
CREATE INDEX "refunds_orderId_status_requestedAt_idx" ON "refunds"("orderId", "status", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_providerRefundId_key" ON "refunds"("providerRefundId");

-- CreateIndex
CREATE INDEX "inventory_reservations_skuId_status_expiresAt_idx" ON "inventory_reservations"("skuId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "inventory_reservations_orderId_status_idx" ON "inventory_reservations"("orderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_reservations_orderId_skuId_key" ON "inventory_reservations"("orderId", "skuId");

-- CreateIndex
CREATE INDEX "fulfillment_events_orderId_createdAt_idx" ON "fulfillment_events"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "entitlements_userId_status_expiresAt_idx" ON "entitlements"("userId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "entitlements_orderId_idx" ON "entitlements"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "reseller_tiers_code_key" ON "reseller_tiers"("code");

-- CreateIndex
CREATE INDEX "reseller_tiers_isActive_sortOrder_idx" ON "reseller_tiers"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "reseller_profiles_userId_key" ON "reseller_profiles"("userId");

-- CreateIndex
CREATE INDEX "reseller_profiles_status_tierId_idx" ON "reseller_profiles"("status", "tierId");

-- CreateIndex
CREATE INDEX "reseller_customers_resellerProfileId_status_expiresAt_idx" ON "reseller_customers"("resellerProfileId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "reseller_customers_linkedUserId_idx" ON "reseller_customers"("linkedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "reseller_customers_resellerProfileId_externalReference_key" ON "reseller_customers"("resellerProfileId", "externalReference");

-- CreateIndex
CREATE UNIQUE INDEX "reseller_customers_id_resellerProfileId_key" ON "reseller_customers"("id", "resellerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "reseller_orders_orderId_key" ON "reseller_orders"("orderId");

-- CreateIndex
CREATE INDEX "reseller_orders_resellerProfileId_createdAt_idx" ON "reseller_orders"("resellerProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "reseller_orders_customerId_idx" ON "reseller_orders"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_resellerProfileId_key" ON "wallets"("resellerProfileId");

-- CreateIndex
CREATE INDEX "ledger_entries_walletId_createdAt_idx" ON "ledger_entries"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "ledger_entries_resellerProfileId_createdAt_idx" ON "ledger_entries"("resellerProfileId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_walletId_reference_key" ON "ledger_entries"("walletId", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_walletId_idempotencyKey_key" ON "ledger_entries"("walletId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "top_ups_reference_key" ON "top_ups"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "top_ups_providerReference_key" ON "top_ups"("providerReference");

-- CreateIndex
CREATE INDEX "top_ups_resellerProfileId_status_createdAt_idx" ON "top_ups"("resellerProfileId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

-- CreateIndex
CREATE INDEX "promotions_isActive_startsAt_endsAt_idx" ON "promotions"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "promotion_redemptions_promotionId_userId_createdAt_idx" ON "promotion_redemptions"("promotionId", "userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_redemptions_promotionId_orderId_key" ON "promotion_redemptions"("promotionId", "orderId");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");

-- CreateIndex
CREATE INDEX "campaigns_status_startsAt_endsAt_idx" ON "campaigns"("status", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_participants_campaignId_resellerProfileId_key" ON "campaign_participants"("campaignId", "resellerProfileId");

-- CreateIndex
CREATE INDEX "marketing_assets_campaignId_createdAt_idx" ON "marketing_assets"("campaignId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_ticketNumber_key" ON "support_tickets"("ticketNumber");

-- CreateIndex
CREATE INDEX "support_tickets_userId_status_createdAt_idx" ON "support_tickets"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "support_tickets_orderId_status_idx" ON "support_tickets"("orderId", "status");

-- CreateIndex
CREATE INDEX "support_tickets_status_priority_updatedAt_idx" ON "support_tickets"("status", "priority", "updatedAt");

-- CreateIndex
CREATE INDEX "support_messages_ticketId_createdAt_idx" ON "support_messages"("ticketId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_deduplicationKey_key" ON "notifications"("deduplicationKey");

-- CreateIndex
CREATE INDEX "notifications_userId_status_createdAt_idx" ON "notifications"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "notifications_orderId_createdAt_idx" ON "notifications"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_entityType_entityId_createdAt_idx" ON "audit_events"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_events_actorUserId_createdAt_idx" ON "audit_events"("actorUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "cms_content_slug_key" ON "cms_content"("slug");

-- CreateIndex
CREATE INDEX "cms_content_type_isPublished_publishedAt_idx" ON "cms_content"("type", "isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "wishlist_items_productId_idx" ON "wishlist_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_userId_productId_skuId_key" ON "wishlist_items"("userId", "productId", "skuId");

-- CreateIndex
CREATE INDEX "recently_viewed_userId_viewedAt_idx" ON "recently_viewed"("userId", "viewedAt");

-- CreateIndex
CREATE INDEX "recently_viewed_sessionKey_viewedAt_idx" ON "recently_viewed"("sessionKey", "viewedAt");

-- CreateIndex
CREATE INDEX "recent_searches_userId_searchedAt_idx" ON "recent_searches"("userId", "searchedAt");

-- CreateIndex
CREATE INDEX "recent_searches_sessionKey_searchedAt_idx" ON "recent_searches"("sessionKey", "searchedAt");

-- CreateIndex
CREATE INDEX "idempotency_keys_userId_scope_createdAt_idx" ON "idempotency_keys"("userId", "scope", "createdAt");

-- CreateIndex
CREATE INDEX "idempotency_keys_expiresAt_idx" ON "idempotency_keys"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_scope_key_key" ON "idempotency_keys"("scope", "key");

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_eventKey_key" ON "outbox_events"("eventKey");

-- CreateIndex
CREATE INDEX "outbox_events_status_availableAt_idx" ON "outbox_events"("status", "availableAt");

-- CreateIndex
CREATE INDEX "outbox_events_aggregateType_aggregateId_idx" ON "outbox_events"("aggregateType", "aggregateId");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_buckets_bucketKey_key" ON "rate_limit_buckets"("bucketKey");

-- CreateIndex
CREATE INDEX "rate_limit_buckets_expiresAt_idx" ON "rate_limit_buckets"("expiresAt");

-- AddForeignKey
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_role_assignments" ADD CONSTRAINT "admin_role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mfa_factors" ADD CONSTRAINT "mfa_factors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mfa_recovery_codes" ADD CONSTRAINT "mfa_recovery_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mfa_recovery_codes" ADD CONSTRAINT "mfa_recovery_codes_factorId_fkey" FOREIGN KEY ("factorId") REFERENCES "mfa_factors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skus" ADD CONSTRAINT "skus_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_resellerTierId_fkey" FOREIGN KEY ("resellerTierId") REFERENCES "reseller_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prices" ADD CONSTRAINT "prices_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "checkout_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_resellerProfileId_fkey" FOREIGN KEY ("resellerProfileId") REFERENCES "reseller_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_resellerCustomerId_fkey" FOREIGN KEY ("resellerCustomerId") REFERENCES "reseller_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fulfillment_events" ADD CONSTRAINT "fulfillment_events_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reseller_profiles" ADD CONSTRAINT "reseller_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reseller_profiles" ADD CONSTRAINT "reseller_profiles_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "reseller_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reseller_customers" ADD CONSTRAINT "reseller_customers_resellerProfileId_fkey" FOREIGN KEY ("resellerProfileId") REFERENCES "reseller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reseller_customers" ADD CONSTRAINT "reseller_customers_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reseller_customers" ADD CONSTRAINT "reseller_customers_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reseller_orders" ADD CONSTRAINT "reseller_orders_resellerProfileId_fkey" FOREIGN KEY ("resellerProfileId") REFERENCES "reseller_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reseller_orders" ADD CONSTRAINT "reseller_orders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reseller_orders" ADD CONSTRAINT "reseller_orders_customerId_resellerProfileId_fkey" FOREIGN KEY ("customerId", "resellerProfileId") REFERENCES "reseller_customers"("id", "resellerProfileId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_resellerProfileId_fkey" FOREIGN KEY ("resellerProfileId") REFERENCES "reseller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_resellerProfileId_fkey" FOREIGN KEY ("resellerProfileId") REFERENCES "reseller_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_topUpId_fkey" FOREIGN KEY ("topUpId") REFERENCES "top_ups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "top_ups" ADD CONSTRAINT "top_ups_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "top_ups" ADD CONSTRAINT "top_ups_resellerProfileId_fkey" FOREIGN KEY ("resellerProfileId") REFERENCES "reseller_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_products" ADD CONSTRAINT "promotion_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_skus" ADD CONSTRAINT "promotion_skus_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_skus" ADD CONSTRAINT "promotion_skus_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_products" ADD CONSTRAINT "campaign_products_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_products" ADD CONSTRAINT "campaign_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_skus" ADD CONSTRAINT "campaign_skus_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_skus" ADD CONSTRAINT "campaign_skus_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_participants" ADD CONSTRAINT "campaign_participants_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_participants" ADD CONSTRAINT "campaign_participants_resellerProfileId_fkey" FOREIGN KEY ("resellerProfileId") REFERENCES "reseller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_assets" ADD CONSTRAINT "marketing_assets_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_assets" ADD CONSTRAINT "marketing_assets_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cms_content" ADD CONSTRAINT "cms_content_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recently_viewed" ADD CONSTRAINT "recently_viewed_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recent_searches" ADD CONSTRAINT "recent_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Bacshop monetary values are integer IDR amounts. Keep invalid values out of
-- the database even when a write bypasses application validation.
ALTER TABLE "prices" ADD CONSTRAINT "prices_amount_nonnegative_chk" CHECK ("amount" >= 0 AND ("compareAtAmount" IS NULL OR "compareAtAmount" >= 0) AND "currency" = 'IDR');
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_money_nonnegative_chk" CHECK ("subtotalAmount" >= 0 AND "discountAmount" >= 0 AND "totalAmount" >= 0 AND "currency" = 'IDR');
ALTER TABLE "orders" ADD CONSTRAINT "orders_money_nonnegative_chk" CHECK ("subtotalAmount" >= 0 AND "discountAmount" >= 0 AND "totalAmount" >= 0 AND "currency" = 'IDR');
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_money_nonnegative_chk" CHECK ("quantity" > 0 AND "unitPrice" >= 0 AND "discountAmount" >= 0 AND "lineTotal" >= 0);
ALTER TABLE "payments" ADD CONSTRAINT "payments_money_nonnegative_chk" CHECK ("amount" >= 0 AND ("paidAmount" IS NULL OR "paidAmount" >= 0) AND "currency" = 'IDR');
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_money_nonnegative_chk" CHECK ("amount" > 0 AND "currency" = 'IDR');
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_amount_nonnegative_chk" CHECK ("amount" >= 0 AND "currency" = 'IDR');
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_amount_nonnegative_chk" CHECK ("amount" >= 0);
ALTER TABLE "top_ups" ADD CONSTRAINT "top_ups_amount_positive_chk" CHECK ("amount" > 0 AND "currency" = 'IDR');
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_amount_positive_chk" CHECK ("amount" > 0);
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_quantity_positive_chk" CHECK ("quantity" > 0);
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_nonnegative_chk" CHECK ("onHand" >= 0 AND "committed" >= 0 AND "reserved" >= 0 AND "committed" + "reserved" <= "onHand");
ALTER TABLE "inventory_reservations" ADD CONSTRAINT "inventory_reservations_quantity_positive_chk" CHECK ("quantity" > 0);
ALTER TABLE "prices" ADD CONSTRAINT "prices_effective_period_chk" CHECK ("validUntil" IS NULL OR "validUntil" > "validFrom");

-- Case-insensitive email uniqueness is enforced in addition to Prisma's
-- normalized string unique key, so login identity cannot be duplicated by
-- casing differences.
CREATE UNIQUE INDEX "users_email_lower_key" ON "users" (LOWER("email"));

-- Prevent overlapping active prices for one SKU/context/tier, including
-- concurrent writes. btree_gist supplies equality operators for UUID/enums.
CREATE EXTENSION IF NOT EXISTS "btree_gist";
ALTER TABLE "prices" ADD CONSTRAINT "prices_no_overlapping_active_periods"
  EXCLUDE USING gist (
    "skuId" WITH =,
    "kind" WITH =,
    COALESCE("resellerTierId", '00000000-0000-0000-0000-000000000000'::uuid) WITH =,
    tstzrange("validFrom", COALESCE("validUntil", 'infinity'::timestamptz), '[)') WITH &&
  ) WHERE ("isActive");

-- Ledger and audit history are append-only. Corrections use compensating
-- entries or a new audit event, preserving the original evidence.
CREATE OR REPLACE FUNCTION "bacshop_reject_append_only_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'append-only record % cannot be updated or deleted', TG_TABLE_NAME;
END;
$$;

CREATE TRIGGER "ledger_entries_append_only"
BEFORE UPDATE OR DELETE ON "ledger_entries"
FOR EACH ROW EXECUTE FUNCTION "bacshop_reject_append_only_mutation"();

CREATE TRIGGER "audit_events_append_only"
BEFORE UPDATE OR DELETE ON "audit_events"
FOR EACH ROW EXECUTE FUNCTION "bacshop_reject_append_only_mutation"();

CREATE TRIGGER "payment_events_append_only"
BEFORE UPDATE OR DELETE ON "payment_events"
FOR EACH ROW EXECUTE FUNCTION "bacshop_reject_append_only_mutation"();

-- A debit may only be inserted when the resulting trusted ledger balance is
-- non-negative. The wallet row lock serializes concurrent entries.
CREATE OR REPLACE FUNCTION "bacshop_assert_wallet_balance_nonnegative"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  balance bigint;
BEGIN
  PERFORM 1 FROM "wallets" WHERE "id" = NEW."walletId" FOR UPDATE;
  SELECT COALESCE(SUM(CASE WHEN "direction" = 'CREDIT' THEN "amount" ELSE -"amount" END), 0)
    INTO balance
    FROM "ledger_entries"
   WHERE "walletId" = NEW."walletId";
  IF balance < 0 THEN
    RAISE EXCEPTION 'wallet % cannot have a negative balance', NEW."walletId";
  END IF;
  RETURN NEW;
END;
$$;

CREATE CONSTRAINT TRIGGER "ledger_entries_wallet_nonnegative"
AFTER INSERT ON "ledger_entries"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION "bacshop_assert_wallet_balance_nonnegative"();
