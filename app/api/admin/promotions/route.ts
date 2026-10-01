import { redirect } from "next/navigation";
import { requireAdmin } from "@/application/admin/require-admin";
import { productionAdminOperationsUnavailable, validAdminMutation } from "@/application/admin/csrf";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";

export async function POST(request: Request) {
  const form = await request.formData();
  if (!(await validAdminMutation(request, form))) redirect("/admin/promotions?error=csrf");
  const admin = await requireAdmin("/admin/promotions", "promotions:write");
  if (productionAdminOperationsUnavailable()) return new Response("Admin operations unavailable", { status: 503 });
  try {
    await developmentAdminOperations.updatePromotion(admin, String(form.get("id") ?? ""), String(form.get("status") ?? "draft") as "draft" | "scheduled" | "live" | "ended", String(form.get("reason") ?? ""));
  } catch {
    redirect("/admin/promotions?error=update");
  }
  redirect("/admin/promotions?saved=1");
}
