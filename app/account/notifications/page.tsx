import { requireCustomer } from "@/application/auth/require-customer";
import { developmentNotifications } from "@/infrastructure/notifications/notification-repository";
import { developmentRetailOrders } from "@/infrastructure/orders/retail-order-repository";
import { NotificationSurface } from "@/ui/retail/notification-surface";

export default async function NotificationsPage() {
  const customer = await requireCustomer("/account/notifications");
  const orders = await developmentRetailOrders.listForCustomer(customer.userId);
  await Promise.all(orders.filter((order) => order.entitlementStatus === "expiring_soon").map((order) => developmentNotifications.saveIfMissing(`order:${order.id}:expiry`, { userId: customer.userId, orderId: order.id, kind: "expiry", title: "Masa aktif segera berakhir", body: "Perpanjang produkmu agar akses tetap berlanjut.", createdAt: new Date().toISOString() })));
  return <NotificationSurface notifications={await developmentNotifications.listForUser(customer.userId)} />;
}
