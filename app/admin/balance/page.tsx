import { requireAdmin } from "@/application/admin/require-admin";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";
import { AdminShell } from "@/ui/admin/admin-shell";
import { AdminBalanceSurface } from "@/ui/admin/admin-surfaces";
export default async function AdminBalancePage() { const admin = await requireAdmin("/admin/balance", "balance:read"); return <AdminShell current="/admin/balance"><AdminBalanceSurface balances={await developmentAdminOperations.listBalance(admin)} /></AdminShell>; }
