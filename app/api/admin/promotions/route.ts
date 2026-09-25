import { redirect } from "next/navigation";
import { requireAdmin } from "@/application/admin/require-admin";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";
export async function POST(request: Request) { const admin = await requireAdmin("/admin/promotions", "promotions:write"); const form = await request.formData(); try { await developmentAdminOperations.updatePromotion(admin, String(form.get("id") ?? ""), String(form.get("status") ?? "draft") as "draft" | "scheduled" | "live" | "ended", String(form.get("reason") ?? "")); } catch { redirect("/admin/promotions?error=update"); } redirect("/admin/promotions?saved=1"); }
