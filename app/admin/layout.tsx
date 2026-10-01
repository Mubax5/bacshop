export const dynamic = "force-dynamic";
import { requireAdmin } from "@/application/admin/require-admin";
import { productionAdminOperationsUnavailable } from "@/application/admin/csrf";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin("/admin");
  if (productionAdminOperationsUnavailable()) throw new Error("Admin operational data adapter is not available");
  return children;
}
