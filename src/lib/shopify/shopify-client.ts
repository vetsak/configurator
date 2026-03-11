import { getShopConfig } from './shopify-config';

export interface StorefrontResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

export async function storefrontFetch<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const config = getShopConfig();
  const url = `https://${config.domain}/api/${config.apiVersion}/graphql.json`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': config.storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Storefront API error: ${res.status} ${res.statusText}`);
  }

  const json: StorefrontResponse<T> = await res.json();

  if (json.errors?.length) {
    throw new Error(`Storefront GQL error: ${json.errors[0].message}`);
  }

  return json.data;
}
