import { requireAdmin } from "@/application/admin/require-admin";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";
import { AdminShell } from "@/ui/admin/admin-shell";
import { AdminOrdersSurface } from "@/ui/admin/admin-surfaces";
export default async function AdminOrdersPage() { const admin = await requireAdmin("/admin/orders", "orders:read"); return <AdminShell current="/admin/orders"><AdminOrdersSurface orders={await developmentAdminOperations.listOrders(admin)} /></AdminShell>; }
