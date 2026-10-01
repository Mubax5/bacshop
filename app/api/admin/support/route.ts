import { redirect } from "next/navigation";
import { requireAdmin } from "@/application/admin/require-admin";
import { productionAdminOperationsUnavailable, validAdminMutation } from "@/application/admin/csrf";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";

export async function POST(request: Request) {
  const form = await request.formData();
  if (!(await validAdminMutation(request, form))) redirect("/admin/support?error=csrf");
  const admin = await requireAdmin("/admin/support", "support:write");
  if (productionAdminOperationsUnavailable()) return new Response("Admin operations unavailable", { status: 503 });
  try {
    await developmentAdminOperations.updateSupport(admin, String(form.get("id") ?? ""), String(form.get("status") ?? "open") as "open" | "pending" | "resolved", String(form.get("reason") ?? ""));
  } catch {
    redirect("/admin/support?error=update");
  }
  redirect("/admin/support?saved=1");
}
