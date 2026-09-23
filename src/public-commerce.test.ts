import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";
import { getRetailCatalog } from "@/application/catalog/get-retail-catalog";
import { getRetailProductDetails } from "@/application/catalog/get-retail-product-details";
import type { RetailCatalogItem } from "@/domain/catalog/types";
import { ProductCard } from "@/ui/commerce/commerce-ui";
import { CatalogExperience } from "@/ui/commerce/catalog-experience";
import { ProductDetailSurface } from "@/ui/commerce/public-pages";
import { BottomNavigation } from "@/ui/shells/public-shell";
import { EmptyState } from "@/ui/states/commerce-states";

describe("public commerce shell", () => {
  it("keeps mobile catalog controls at 44px without changing the two-column grid", () => {
    const stylesheet = postcss.parse(readFileSync(join(process.cwd(), "app/globals.css"), "utf8"));
    const mobileRules: postcss.Rule[] = [];

    stylesheet.walkAtRules("media", (media) => {
      if (media.params !== "(max-width: 760px)") return;
      media.walkRules((rule) => {
        mobileRules.push(rule);
      });
    });

    const minimumHeightFor = (selector: string) => {
      const rule = mobileRules.find((candidate) => candidate.selector === selector);
      const declaration = rule?.nodes?.find(
        (node): node is postcss.Declaration => node.type === "decl" && node.prop === "min-height",
      );
      return Number.parseInt(declaration?.value ?? "0", 10);
    };

    expect(minimumHeightFor(".quick-filter")).toBeGreaterThanOrEqual(44);
    expect(minimumHeightFor(".product-card__action")).toBeGreaterThanOrEqual(44);
    expect(mobileRules.find((rule) => rule.selector === ".product-grid")?.nodes).toContainEqual(
      expect.objectContaining({ prop: "grid-template-columns", value: "repeat(2, minmax(0, 1fr))" }),
    );
  });

  it("shows the Guest bottom navigation labels", () => {
    const markup = renderToStaticMarkup(createElement(BottomNavigation));

    for (const label of ["Beranda", "Belanja", "Promo", "Bantuan", "Masuk"]) {
      expect(markup).toContain(label);
    }
  });

  it("renders retail product cards without reseller-price fields", async () => {
    const [retailItem] = await getRetailCatalog({ kind: "guest" });
    const itemWithUnexpectedFields = {
      ...retailItem,
      resellerPrice: 1,
      resellerPrices: { gold: 1 },
    } as RetailCatalogItem;
    const markup = renderToStaticMarkup(createElement(ProductCard, { item: itemWithUnexpectedFields }));

    expect(markup).toContain("StreamPlus Ultra");
    expect(markup.replaceAll("\u00a0", " ")).toContain("Rp 89.000");
    expect(markup).not.toContain("resellerPrice");
    expect(markup).not.toContain("resellerPrices");
    expect(markup).not.toContain(">1<");
  });

  it("shows a recovery action to clear query and filters when there are no results", () => {
    const markup = renderToStaticMarkup(createElement(EmptyState, {
      title: "Produk tidak ditemukan",
      description: "Ubah kata pencarian atau filter.",
      onReset: () => undefined,
    }));

    expect(markup).toContain("Hapus pencarian &amp; filter");
  });

  it("explains when a product is out of stock without enabling purchase", async () => {
    const product = await getRetailProductDetails({ kind: "guest" }, "GAME-STORE-500K");
    expect(product).toBeDefined();
    const markup = renderToStaticMarkup(createElement(ProductDetailSurface, { product: product! }));

    expect(markup).toContain("Stok habis");
    expect(markup).toContain("disabled");
  });

  it("announces the mobile filter control as a collapsible dialog trigger", () => {
    const markup = renderToStaticMarkup(createElement(CatalogExperience, { items: [] }));

    expect(markup).toContain('aria-haspopup="dialog"');
    expect(markup).toContain('aria-expanded="false"');
  });
});
