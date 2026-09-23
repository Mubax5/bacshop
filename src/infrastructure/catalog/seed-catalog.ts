import type { CatalogSku } from "@/domain/catalog/types";

export const seededCatalog: readonly CatalogSku[] = [
  {
    sku: "STREAM-ULT-1M", productName: "StreamPlus Ultra", duration: "1 bulan",
    activationMethod: "account-invitation", region: "Global", requirements: ["Email aktif", "Akun StreamPlus"],
    sla: "Aktivasi maksimal 30 menit", warranty: "Garansi penggantian 7 hari", support: "Bantuan chat setiap hari",
    stock: 42, availability: "available", retailPrice: 89000,
    resellerPrices: { bronze: 80000, silver: 76000, gold: 72000 },
  },
  {
    sku: "DESIGN-PRO-1M", productName: "DesignCloud Pro", duration: "1 bulan",
    activationMethod: "account-invitation", region: "Global", requirements: ["Email aktif", "Akun DesignCloud"],
    sla: "Aktivasi maksimal 1 jam", warranty: "Garansi penggantian 7 hari", support: "Bantuan chat setiap hari",
    stock: 28, availability: "available", retailPrice: 119000,
    resellerPrices: { bronze: 108000, silver: 102000, gold: 96000 },
  },
  {
    sku: "MUSIC-FAM-3M", productName: "Melody Premium Family", duration: "3 bulan",
    activationMethod: "activation-code", region: "Indonesia", requirements: ["Akun Melody", "Wilayah akun Indonesia"],
    sla: "Kode dikirim maksimal 15 menit", warranty: "Garansi kode valid", support: "Bantuan chat setiap hari",
    stock: 64, availability: "available", retailPrice: 149000,
    resellerPrices: { bronze: 137000, silver: 131000, gold: 125000 },
  },
  {
    sku: "OFFICE-PERSONAL-12M", productName: "OfficeSuite Personal", duration: "12 bulan",
    activationMethod: "activation-code", region: "Global", requirements: ["Akun OfficeSuite"],
    sla: "Kode dikirim maksimal 30 menit", warranty: "Garansi kode valid 30 hari", support: "Email dan chat",
    stock: 19, availability: "available", retailPrice: 279000,
    resellerPrices: { bronze: 260000, silver: 250000, gold: 240000 },
  },
  {
    sku: "GAME-STORE-500K", productName: "GameStore Gift Card 500K", duration: "Saldo Rp500.000",
    activationMethod: "gift-card", region: "Indonesia", requirements: ["Akun GameStore Indonesia"],
    sla: "Kode dikirim maksimal 10 menit", warranty: "Garansi kode valid", support: "Bantuan chat setiap hari",
    stock: 0, availability: "out-of-stock", retailPrice: 515000,
    resellerPrices: { bronze: 502000, silver: 496000, gold: 490000 },
  },
  {
    sku: "CLOUD-AI-1M", productName: "CloudAI Plus", duration: "1 bulan",
    activationMethod: "account-invitation", region: "Global", requirements: ["Email aktif", "Akun CloudAI"],
    sla: "Aktivasi maksimal 2 jam", warranty: "Garansi penggantian 7 hari", support: "Email support",
    stock: 12, availability: "available", retailPrice: 199000,
    resellerPrices: { bronze: 184000, silver: 176000, gold: 168000 },
  },
];
