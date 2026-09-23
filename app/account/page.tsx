import type { Metadata } from "next";
import { requireCustomer } from "@/application/auth/require-customer";
import { developmentRetailOrders } from "@/infrastructure/orders/retail-order-repository";
import { AccountHomeSurface } from "@/ui/retail/retail-surfaces";

export const metadata: Metadata = { title: "Akun Customer" };

export default async function AccountPage() {
  const customer = await requireCustomer("/account");
  const orders = await developmentRetailOrders.listForCustomer(customer.userId);
  const activeEntitlements = orders.filter((order) => order.entitlementStatus === "active" || order.entitlementStatus === "pending_activation").length;
  return <AccountHomeSurface displayName={customer.displayName} orderCount={orders.length} activeEntitlements={activeEntitlements} />;
}
