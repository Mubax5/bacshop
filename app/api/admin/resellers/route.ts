import { redirect } from "next/navigation";
import { requireAdmin } from "@/application/admin/require-admin";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";
export async function POST(request: Request) { const admin = await requireAdmin("/admin/resellers", "resellers:write"); const form = await request.formData(); try { await developmentAdminOperations.updateReseller(admin, String(form.get("userId") ?? ""), String(form.get("status") ?? "pending") as "pending" | "approved" | "rejected" | "suspended", String(form.get("tier") ?? "bronze") as "bronze" | "silver" | "gold", String(form.get("reason") ?? "")); } catch { redirect("/admin/resellers?error=update"); } redirect("/admin/resellers?saved=1"); }
