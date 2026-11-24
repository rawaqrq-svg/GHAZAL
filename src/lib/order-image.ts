import { COSMETICS_CATALOG } from './cosmetics-catalog';

export function resolvePOSItemImage(item: any): string | null {
  if (!item) return null;
  if (item.imageUrl) return item.imageUrl;
  if (item.image) return item.image;
  
  if (item.product?.images && item.product.images.length > 0) {
    const main = item.product.images.find((img: any) => img.isMain);
    if (main?.url) return main.url;
    if (item.product.images[0]?.url) return item.product.images[0].url;
  }
  
  if (item.product?.variants && item.product.variants.length > 0) {
    const matchingVariant = item.product.variants.find((v: any) => v.id === item.variantId || v.sku === item.sku);
    if (matchingVariant?.imageUrl) return matchingVariant.imageUrl;
    if (item.product.variants[0]?.imageUrl) return item.product.variants[0].imageUrl;
  }

  const catalogItem = COSMETICS_CATALOG.find(p => 
    p.id === item.productId || 
    p.sku === item.sku || 
    p.nameAr === item.name || 
    p.nameEn === item.name ||
    p.variants?.some(v => v.id === item.variantId || v.sku === item.sku)
  );

  if (catalogItem) {
    const matchingVar = catalogItem.variants?.find(v => v.id === item.variantId || v.sku === item.sku);
    return matchingVar?.imageUrl || catalogItem.images?.find(i => i.isMain)?.url || catalogItem.images?.[0]?.url || '/logo.png';
  }

  return '/logo.png';
}
