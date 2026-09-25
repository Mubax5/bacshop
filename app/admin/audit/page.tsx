import { requireAdmin } from "@/application/admin/require-admin";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";
import { AdminShell } from "@/ui/admin/admin-shell";
import { AdminAuditSurface } from "@/ui/admin/admin-surfaces";
export default async function AdminAuditPage() { await requireAdmin("/admin/audit", "audit:read"); return <AdminShell current="/admin/audit"><AdminAuditSurface events={await developmentAdminOperations.listAudit()} /></AdminShell>; }
