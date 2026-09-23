import { getRetailCatalog } from "@/application/catalog/get-retail-catalog";
import { HomeSurface } from "@/ui/commerce/public-pages";

export default async function HomePage() {
  const items = await getRetailCatalog({ kind: "guest" });
  return <HomeSurface items={items} />;
}
