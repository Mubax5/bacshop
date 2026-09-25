import { redirect } from "next/navigation";
import { requireAdmin } from "@/application/admin/require-admin";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";
export async function POST(request: Request) { const admin = await requireAdmin("/admin/support", "support:write"); const form = await request.formData(); try { await developmentAdminOperations.updateSupport(admin, String(form.get("id") ?? ""), String(form.get("status") ?? "open") as "open" | "pending" | "resolved", String(form.get("reason") ?? "")); } catch { redirect("/admin/support?error=update"); } redirect("/admin/support?saved=1"); }
