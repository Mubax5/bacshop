import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

export const CART_SESSION_COOKIE = "bacshop-cart-session";

export async function getCartSessionId(create = false): Promise<string | null> {
  const store = await cookies();
  const existing = store.get(CART_SESSION_COOKIE)?.value;
  if (existing && /^[a-zA-Z0-9-]{8,80}$/.test(existing)) return existing;
  return create ? randomUUID() : null;
}
