-- Phase 1 follow-up hardening. The initial foundation migration is already
-- applied; this migration only adds integrity guards and composite tenancy
-- foreign keys.

-- Composite keys make the reseller tenant part of every cross-tenant link.
CREATE UNIQUE INDEX "orders_id_resellerProfileId_key"
  ON "orders" ("id", "resellerProfileId");
CREATE UNIQUE INDEX "wallets_id_resellerProfileId_key"
  ON "wallets" ("id", "resellerProfileId");
CREATE UNIQUE INDEX "reseller_orders_orderId_resellerProfileId_key"
  ON "reseller_orders" ("orderId", "resellerProfileId");

ALTER TABLE "orders" DROP CONSTRAINT "orders_resellerCustomerId_fkey";
ALTER TABLE "orders" ADD CONSTRAINT "orders_resellerCustomerId_resellerProfileId_fkey"
  FOREIGN KEY ("resellerCustomerId", "resellerProfileId")
  REFERENCES "reseller_customers" ("id", "resellerProfileId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reseller_orders" DROP CONSTRAINT "reseller_orders_orderId_fkey";
ALTER TABLE "reseller_orders" ADD CONSTRAINT "reseller_orders_orderId_resellerProfileId_fkey"
  FOREIGN KEY ("orderId", "resellerProfileId")
  REFERENCES "orders" ("id", "resellerProfileId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ledger_entries" DROP CONSTRAINT "ledger_entries_walletId_fkey";
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_walletId_resellerProfileId_fkey"
  FOREIGN KEY ("walletId", "resellerProfileId")
  REFERENCES "wallets" ("id", "resellerProfileId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "top_ups" DROP CONSTRAINT "top_ups_walletId_fkey";
ALTER TABLE "top_ups" ADD CONSTRAINT "top_ups_walletId_resellerProfileId_fkey"
  FOREIGN KEY ("walletId", "resellerProfileId")
  REFERENCES "wallets" ("id", "resellerProfileId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "orders" ADD CONSTRAINT "orders_context_reseller_fields_chk"
  CHECK (
    ("context" = 'RETAIL' AND "resellerProfileId" IS NULL AND "resellerCustomerId" IS NULL)
    OR ("context" = 'RESELLER' AND "resellerProfileId" IS NOT NULL)
  );

ALTER TABLE "prices" ADD CONSTRAINT "prices_kind_tier_chk"
  CHECK (
    ("kind" = 'RETAIL' AND "resellerTierId" IS NULL)
    OR ("kind" = 'RESELLER' AND "resellerTierId" IS NOT NULL)
  );

-- Row-level append-only protection does not fire for TRUNCATE, so guard all
-- history tables at statement level as well.
CREATE TRIGGER "ledger_entries_append_only_truncate"
BEFORE TRUNCATE ON "ledger_entries"
FOR EACH STATEMENT EXECUTE FUNCTION "bacshop_reject_append_only_mutation"();

CREATE TRIGGER "audit_events_append_only_truncate"
BEFORE TRUNCATE ON "audit_events"
FOR EACH STATEMENT EXECUTE FUNCTION "bacshop_reject_append_only_mutation"();

CREATE TRIGGER "payment_events_append_only_truncate"
BEFORE TRUNCATE ON "payment_events"
FOR EACH STATEMENT EXECUTE FUNCTION "bacshop_reject_append_only_mutation"();

CREATE TRIGGER "order_items_append_only_truncate"
BEFORE TRUNCATE ON "order_items"
FOR EACH STATEMENT EXECUTE FUNCTION "bacshop_reject_append_only_mutation"();

CREATE TRIGGER "order_items_append_only_mutation"
BEFORE UPDATE OR DELETE ON "order_items"
FOR EACH ROW EXECUTE FUNCTION "bacshop_reject_append_only_mutation"();

-- Commercial order fields are immutable after creation. State and timeline
-- timestamps remain mutable for payment and fulfillment transitions.
CREATE OR REPLACE FUNCTION "bacshop_reject_order_snapshot_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF ROW(
    OLD."orderNumber", OLD."userId", OLD."resellerProfileId",
    OLD."resellerCustomerId", OLD."context", OLD."currency",
    OLD."subtotalAmount", OLD."discountAmount", OLD."totalAmount",
    OLD."customerSnapshot", OLD."billingSnapshot", OLD."termsSnapshot"
  ) IS DISTINCT FROM ROW(
    NEW."orderNumber", NEW."userId", NEW."resellerProfileId",
    NEW."resellerCustomerId", NEW."context", NEW."currency",
    NEW."subtotalAmount", NEW."discountAmount", NEW."totalAmount",
    NEW."customerSnapshot", NEW."billingSnapshot", NEW."termsSnapshot"
  ) THEN
    RAISE EXCEPTION 'commercial order snapshot fields are immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "orders_commercial_snapshot_immutable"
BEFORE UPDATE ON "orders"
FOR EACH ROW EXECUTE FUNCTION "bacshop_reject_order_snapshot_mutation"();

-- Replace the deferred balance check with a BEFORE INSERT guard. The wallet
-- row lock serializes concurrent writers, and the composite FK above ensures
-- that a ledger entry cannot be attributed to another reseller's wallet.
DROP TRIGGER "ledger_entries_wallet_nonnegative" ON "ledger_entries";

CREATE OR REPLACE FUNCTION "bacshop_assert_wallet_balance_nonnegative"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  balance bigint;
  wallet_owner uuid;
BEGIN
  SELECT "resellerProfileId" INTO wallet_owner
    FROM "wallets"
   WHERE "id" = NEW."walletId"
   FOR UPDATE;
  IF wallet_owner IS NULL THEN
    RAISE EXCEPTION 'wallet % does not exist', NEW."walletId";
  END IF;
  IF wallet_owner <> NEW."resellerProfileId" THEN
    RAISE EXCEPTION 'wallet % is owned by another reseller', NEW."walletId";
  END IF;

  SELECT COALESCE(SUM(CASE WHEN "direction" = 'CREDIT' THEN "amount" ELSE -"amount" END), 0)
    INTO balance
    FROM "ledger_entries"
   WHERE "walletId" = NEW."walletId";
  IF NEW."direction" = 'CREDIT' THEN
    balance := balance + NEW."amount";
  ELSE
    balance := balance - NEW."amount";
  END IF;
  IF balance < 0 THEN
    RAISE EXCEPTION 'wallet % cannot have a negative balance', NEW."walletId";
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "ledger_entries_wallet_nonnegative"
BEFORE INSERT ON "ledger_entries"
FOR EACH ROW EXECUTE FUNCTION "bacshop_assert_wallet_balance_nonnegative"();
