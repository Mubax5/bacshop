import { requireAdmin } from "@/application/admin/require-admin";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";
import { AdminShell } from "@/ui/admin/admin-shell";
import { AdminDashboardSurface } from "@/ui/admin/admin-surfaces";
export default async function AdminDashboardPage() { const admin = await requireAdmin("/admin"); const [orders, resellers, support, audits] = await Promise.all([developmentAdminOperations.listOrders(admin), developmentAdminOperations.listResellers(admin), developmentAdminOperations.listSupport(admin), developmentAdminOperations.listAudit()]); return <AdminShell current="/admin"><AdminDashboardSurface orders={orders} resellers={resellers} support={support} audits={audits} /></AdminShell>; }
