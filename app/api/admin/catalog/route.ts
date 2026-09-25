import { redirect } from "next/navigation";
import { requireAdmin } from "@/application/admin/require-admin";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";
export async function POST(request: Request) { const admin = await requireAdmin("/admin/products", "catalog:write"); const form = await request.formData(); try { await developmentAdminOperations.updateAvailability(admin, String(form.get("sku") ?? ""), String(form.get("availability") ?? "available") as "available" | "out-of-stock" | "coming-soon", String(form.get("reason") ?? "")); } catch { redirect("/admin/products?error=update"); } redirect("/admin/products?saved=1"); }
