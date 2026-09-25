import { redirect } from "next/navigation";
import { requireAdmin } from "@/application/admin/require-admin";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";
export async function POST(request: Request) { const admin = await requireAdmin("/admin/balance", "balance:write"); const form = await request.formData(); try { await developmentAdminOperations.adjustBalance(admin, String(form.get("resellerId") ?? ""), Number(form.get("amount")), String(form.get("reason") ?? "")); } catch { redirect("/admin/balance?error=update"); } redirect("/admin/balance?saved=1"); }
