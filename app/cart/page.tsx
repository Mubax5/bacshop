import type { Metadata } from "next";
import { cookies } from "next/headers";
import { CartSurface } from "@/ui/retail/retail-surfaces";
import { CART_SESSION_COOKIE } from "@/application/cart/session-id";
import { developmentSessionCart, reconcileRetailCart } from "@/infrastructure/cart/session-cart-repository";

export const metadata: Metadata = { title: "Keranjang" };

export default async function CartPage({ searchParams }: { searchParams: Promise<{ added?: string; error?: string }> }) {
  const [params, cookieStore] = await Promise.all([searchParams, cookies()]);
  const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;
  const cart = sessionId ? await reconcileRetailCart(developmentSessionCart, sessionId) : { lines: [], subtotal: 0, removedSkus: [] };
  const error = params.error === "unavailable" ? "Produk sedang tidak tersedia." : params.error ? "Informasi keranjang tidak valid." : "";
  return <CartSurface cart={cart} added={params.added === "1"} error={error} />;
}
