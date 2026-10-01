import { redirect } from "next/navigation";
import { requireAdmin } from "@/application/admin/require-admin";
import { productionAdminOperationsUnavailable, validAdminMutation } from "@/application/admin/csrf";
import { developmentAdminOperations } from "@/infrastructure/admin/admin-operations-store";

export async function POST(request: Request) {
  const form = await request.formData();
  if (!(await validAdminMutation(request, form))) redirect("/admin/orders?error=csrf");
  const admin = await requireAdmin("/admin/orders", "orders:write");
  if (productionAdminOperationsUnavailable()) return new Response("Admin operations unavailable", { status: 503 });
  try {
    await developmentAdminOperations.updateFulfillment(admin, String(form.get("id") ?? ""), String(form.get("fulfillmentStatus") ?? "processing") as "queued" | "processing" | "needs_customer_input" | "fulfilled" | "issue", String(form.get("reason") ?? ""));
  } catch {
    redirect("/admin/orders?error=update");
  }
  redirect("/admin/orders?saved=1");
}
