import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getRetailProductDetails } from "@/application/catalog/get-retail-product-details";
import { ProductDetailSurface } from "@/ui/commerce/public-pages";
import { BottomNavigation, DesktopHeader } from "@/ui/shells/public-shell";
import { CsrfProvider } from "@/ui/security/csrf-input";

describe("authenticated retail entry points", () => {
  it("lets a Guest start purchasing an available product by adding it to the retail cart", async () => {
    const product = await getRetailProductDetails({ kind: "guest" }, "STREAM-ULT-1M");
    const markup = renderToStaticMarkup(createElement(CsrfProvider, { token: "test-form-token" }, createElement(ProductDetailSurface, { product: product! })));

    expect(markup).toContain('action="/api/cart/items"');
    expect(markup).toContain('name="sku" value="STREAM-ULT-1M"');
    expect(markup).toContain("Tambah ke Keranjang");
    expect(markup).toContain('name="csrf" value="test-form-token"');
  });

  it("routes header and Guest sign-in controls into the sign-in flow", () => {
    const header = renderToStaticMarkup(createElement(DesktopHeader));
    const navigation = renderToStaticMarkup(createElement(BottomNavigation));

    expect(header).toContain('href="/auth/sign-in"');
    expect(navigation).toContain('href="/auth/sign-in"');
    expect(navigation).not.toContain('href="/account"');
    expect(navigation).not.toContain('href="/account/orders"');
  });

  it("shows customer account destinations after server-resolved customer state", () => {
    const markup = renderToStaticMarkup(createElement(BottomNavigation, { state: "customer" }));

    expect(markup).toContain("Pesanan");
    expect(markup).toContain("Akun");
    expect(markup).not.toContain("Masuk");
    expect(markup).not.toContain("reseller");
  });
});
