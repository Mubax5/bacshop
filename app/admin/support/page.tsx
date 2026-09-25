import { requireAdmin } from "@/application/admin/require-admin";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";
import { AdminShell } from "@/ui/admin/admin-shell";
import { AdminSupportSurface } from "@/ui/admin/admin-surfaces";
export default async function AdminSupportPage() { const admin = await requireAdmin("/admin/support", "support:read"); return <AdminShell current="/admin/support"><AdminSupportSurface tickets={await developmentAdminOperations.listSupport(admin)} /></AdminShell>; }
