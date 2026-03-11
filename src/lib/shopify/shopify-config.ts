export interface ShopConfig {
  domain: string;
  storefrontToken: string;
  apiVersion: string;
}

const SHOP_CONFIGS: Record<string, ShopConfig> = {
  de: {
    domain: 'de-vetsak.myshopify.com',
    storefrontToken: 'a320af7ba15296dd63dc263c72cdba62',
    apiVersion: '2024-01',
  },
};

const DEFAULT_SHOP = 'de';

export function getShopConfig(): ShopConfig {
  if (typeof window === 'undefined') return SHOP_CONFIGS[DEFAULT_SHOP];
  const params = new URLSearchParams(window.location.search);
  const shop = params.get('shop') ?? DEFAULT_SHOP;
  return SHOP_CONFIGS[shop] ?? SHOP_CONFIGS[DEFAULT_SHOP];
}
