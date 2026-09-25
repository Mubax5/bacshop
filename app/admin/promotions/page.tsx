import { requireAdmin } from "@/application/admin/require-admin";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";
import { AdminShell } from "@/ui/admin/admin-shell";
import { AdminPromotionsSurface } from "@/ui/admin/admin-surfaces";
export default async function AdminPromotionsPage() { const admin = await requireAdmin("/admin/promotions", "promotions:read"); return <AdminShell current="/admin/promotions"><AdminPromotionsSurface promotions={await developmentAdminOperations.listPromotions(admin)} /></AdminShell>; }
