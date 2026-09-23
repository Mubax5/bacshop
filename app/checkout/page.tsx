import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireCustomer } from "@/application/auth/require-customer";
import { CART_SESSION_COOKIE } from "@/application/cart/session-id";
import { developmentSessionCart, reconcileRetailCart } from "@/infrastructure/cart/session-cart-repository";
import { CheckoutSurface } from "@/ui/retail/retail-surfaces";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ state?: string; error?: string }> }) {
  await requireCustomer("/checkout");
  const [params, cookieStore] = await Promise.all([searchParams, cookies()]);
  const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;
  const cart = sessionId ? await reconcileRetailCart(developmentSessionCart, sessionId) : { lines: [], subtotal: 0, removedSkus: [] };
  if (cart.lines.length === 0 && !params.error) redirect("/cart");
  return <CheckoutSurface cart={cart} state={params.state === "reconciled" ? "reconciled" : "review"} error={params.error === "invalid" ? "Keranjang tidak valid. Periksa produk lalu coba lagi." : ""} />;
}
