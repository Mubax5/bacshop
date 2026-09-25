import { requireAdmin } from "@/application/admin/require-admin";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";
import { AdminShell } from "@/ui/admin/admin-shell";
import { AdminResellersSurface } from "@/ui/admin/admin-surfaces";
export default async function AdminResellersPage() { const admin = await requireAdmin("/admin/resellers", "resellers:read"); return <AdminShell current="/admin/resellers"><AdminResellersSurface resellers={await developmentAdminOperations.listResellers(admin)} /></AdminShell>; }
