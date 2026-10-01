import { redirect } from "next/navigation";
import { requireAdmin } from "@/application/admin/require-admin";
import { productionAdminOperationsUnavailable, validAdminMutation } from "@/application/admin/csrf";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";

export async function POST(request: Request) {
  const form = await request.formData();
  if (!(await validAdminMutation(request, form))) redirect("/admin/pricing?error=csrf");
  const admin = await requireAdmin("/admin/pricing", "pricing:write");
  if (productionAdminOperationsUnavailable()) return new Response("Admin operations unavailable", { status: 503 });
  try {
    await developmentAdminOperations.updatePrice(admin, String(form.get("sku") ?? ""), Number(form.get("retailPrice")), String(form.get("reason") ?? ""));
  } catch {
    redirect("/admin/pricing?error=update");
  }
  redirect("/admin/pricing?saved=1");
}
