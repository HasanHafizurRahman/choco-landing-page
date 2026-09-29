import { getShop } from '@/lib/api';
import { todayInDhaka } from '@/lib/season';
import { findPreview } from '@/lib/preview';
import { Storefront } from '@/components/Storefront';
import { DeliveryPromise, Faq, Footer } from '@/components/StaticSections';

export default async function Home({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const [shop, params] = await Promise.all([getShop(), searchParams]);

  // Prototype: ?preview=mango|gifts|today picks the date. In production use todayInDhaka().
  const preview = findPreview(params.preview);
  const day = preview.day ?? todayInDhaka();

  return (
    <Storefront
      shop={shop}
      initialDay={day}
      initialPreview={preview.id}
      deliveryPromise={<DeliveryPromise />}
      faq={<Faq items={shop.faq} />}
      footer={<Footer brand={shop.brand} />}
    />
  );
}
