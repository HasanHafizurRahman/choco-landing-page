import { shopData } from './data';
import type { ShopData } from './types';

/**
 * The single entry point for shop data.
 *
 * Today it returns the mock data. When the admin panel is live, replace the body with:
 *
 *   const res = await fetch(`${process.env.SHOP_API_URL}/shop`, { next: { revalidate: 60 } });
 *   if (!res.ok) throw new Error(`Shop API responded ${res.status}`);
 *   return res.json();
 *
 * and nothing else in the front end has to change.
 */
export async function getShop(): Promise<ShopData> {
  return shopData;
}
