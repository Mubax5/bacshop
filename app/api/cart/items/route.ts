import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { developmentCatalogRepository } from "@/infrastructure/catalog/catalog-repository";
import { developmentSessionCart } from "@/infrastructure/cart/session-cart-repository";
import { CART_SESSION_COOKIE } from "@/application/cart/session-id";

export async function POST(request: Request) {
  const form = await request.formData();
  const sku = String(form.get("sku") ?? "");
  const intent = String(form.get("intent") ?? "add");
  const quantity = Number(form.get("quantity") ?? 1);
  if (!sku || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return NextResponse.redirect(new URL("/cart?error=invalid", request.url), 303);
  const sessionId = request.headers.get("cookie")?.match(/(?:^|;\s*)bacshop-cart-session=([a-zA-Z0-9-]+)/)?.[1] ?? randomUUID();
  const catalog = developmentCatalogRepository;
  const product = await catalog.findSku(sku);
  if (intent === "remove") await developmentSessionCart.remove(sessionId, sku);
  else if (intent === "update") await developmentSessionCart.update(sessionId, sku, quantity);
  else if (!product || product.availability !== "available" || product.stock <= 0) return NextResponse.redirect(new URL("/cart?error=unavailable", request.url), 303);
  else await developmentSessionCart.add(sessionId, sku, quantity);
  const response = NextResponse.redirect(new URL(intent === "add" ? "/cart?added=1" : "/cart", request.url), 303);
  response.cookies.set(CART_SESSION_COOKIE, sessionId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return response;
}
