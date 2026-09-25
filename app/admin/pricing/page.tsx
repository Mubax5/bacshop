import { requireAdmin } from "@/application/admin/require-admin";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";
import { AdminShell } from "@/ui/admin/admin-shell";
import { AdminPricingSurface } from "@/ui/admin/admin-surfaces";
export default async function AdminPricingPage() { const admin = await requireAdmin("/admin/pricing", "pricing:read"); return <AdminShell current="/admin/pricing"><AdminPricingSurface products={await developmentAdminOperations.listProducts(admin)} /></AdminShell>; }
