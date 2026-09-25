import { redirect } from "next/navigation";
import { requireAdmin } from "@/application/admin/require-admin";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";
export async function POST(request: Request) { const admin = await requireAdmin("/admin/pricing", "pricing:write"); const form = await request.formData(); try { await developmentAdminOperations.updatePrice(admin, String(form.get("sku") ?? ""), Number(form.get("retailPrice")), String(form.get("reason") ?? "")); } catch { redirect("/admin/pricing?error=update"); } redirect("/admin/pricing?saved=1"); }
