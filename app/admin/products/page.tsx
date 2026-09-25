import { requireAdmin } from "@/application/admin/require-admin";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";
import { AdminShell } from "@/ui/admin/admin-shell";
import { AdminProductsSurface } from "@/ui/admin/admin-surfaces";
export default async function AdminProductsPage() { const admin = await requireAdmin("/admin/products", "catalog:read"); return <AdminShell current="/admin/products"><AdminProductsSurface products={await developmentAdminOperations.listProducts(admin)} /></AdminShell>; }
