// Curated Comprehensive Cosmetics & Beauty Catalog for GHAZAL Cosmetics
export interface DemoProduct {
  id: string;
  slug: string;
  sku: string;
  barcode: string;
  quickCode?: string; // Shortcode like "1234"
  nameAr: string;
  nameEn: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  brandName: string;
  priceFils: number;
  originalPriceFils?: number;
  rating: number;
  reviewsCount: number;
  tag?: string;
  isFeatured: boolean;
  isPOSOnly?: boolean;
  channel?: 'ONLINE' | 'POS' | 'SHARED';
  shortDescription: string;
  fullDescription: string;
  howToUse: string;
  features: string[];
  images: Array<{ id: string; url: string; isMain: boolean }>;
  variants: Array<{
    id: string;
    sku: string;
    barcode: string;
    size: string;
    shade: string;
    colorHex?: string;
    imageUrl?: string;
    scent?: string;
    colorName?: string;
    price: number;
    stock: number;
  }>;
}

export const COSMETICS_CATALOG: DemoProduct[] = [];

export const SLUG_ALIASES: Record<string, string> = {
  // Foundations
  'loreal-true-match-foundation': 'loreal-true-match-foundation',
  'loreal-true-match': 'loreal-true-match-foundation',
  'loreal-infaillible-foundation': 'loreal-infaillible-foundation',
  'loreal-infaillible': 'loreal-infaillible-foundation',
  'loreal-foundation': 'loreal-true-match-foundation',
  
  // Lip masks
  'laneige-lip-sleeping-mask': 'laneige-lip-sleeping-mask-berry',
  'laneige-lip-sleeping-mask-berry': 'laneige-lip-sleeping-mask-berry',
  'laneige-lip-mask': 'laneige-lip-sleeping-mask-berry',
  
  // Eyeshadow palettes
  'eyeshadow-palette-pro': 'nyx-ultimate-shadow-palette',
  'pro-nude-eyeshadow-palette': 'nyx-ultimate-shadow-palette',
  'nyx-ultimate-shadow-palette': 'nyx-ultimate-shadow-palette',
  'nyx-eyeshadow-palette': 'nyx-ultimate-shadow-palette',
  
  // Mascaras
  'maybelline-lash-sensational-mascara': 'maybelline-lash-sensational-mascara',
  'maybelline-lash-sensational': 'maybelline-lash-sensational-mascara',
  'maybelline-mascara': 'maybelline-lash-sensational-mascara',
  
  // Perfumes
  'ghazal-signature-luxury-perfume': 'ghazal-signature-edp',
  'ghazal-signature-edp': 'ghazal-signature-edp',
  'ghazal-perfume': 'ghazal-signature-edp',
  
  // Skincare
  'the-ordinary-niacinamide-serum': 'the-ordinary-niacinamide-zinc',
  'the-ordinary-niacinamide-zinc': 'the-ordinary-niacinamide-zinc',
  'the-ordinary-niacinamide': 'the-ordinary-niacinamide-zinc',
  'cerave-hydrating-cleanser': 'cerave-hydrating-cleanser',
  'cerave-cleanser': 'cerave-hydrating-cleanser',
  
  // Haircare
  'argan-oil-hair-repair-mask': 'argan-oil-hair-repair-mask',
  'moroccan-argan-oil-hair-repair-mask': 'argan-oil-hair-repair-mask',
  
  // Brushes & tools
  'pro-makeup-brush-set': 'pro-makeup-brush-set',
  'makeup-brush-set': 'pro-makeup-brush-set',
  'beauty-blender-pro-set': 'beauty-blender-pro-set',
  'beauty-blender': 'beauty-blender-pro-set',
  
  // Accessories
  'velvet-hair-scrunchies-pack': 'velvet-hair-scrunchies-pack',
  'velvet-hair-scrunchies': 'velvet-hair-scrunchies-pack',
  'velvet-cosmetic-pouch': 'velvet-cosmetic-pouch',
  
  // Lipsticks
  'maybelline-superstay-vinyl-ink': 'maybelline-superstay-vinyl-ink',
  'maybelline-vinyl-ink': 'maybelline-superstay-vinyl-ink',
};

export function getProductBySlug(slug: string): DemoProduct | undefined {
  if (!slug) return undefined;
  const clean = decodeURIComponent(slug).toLowerCase().trim();

  // 1. Direct match by exact slug or id
  const direct = COSMETICS_CATALOG.find(p => p.slug.toLowerCase() === clean || p.id.toLowerCase() === clean);
  if (direct) return direct;

  // 2. Alias dictionary lookup
  const targetSlug = SLUG_ALIASES[clean];
  if (targetSlug) {
    const aliased = COSMETICS_CATALOG.find(p => p.slug.toLowerCase() === targetSlug);
    if (aliased) return aliased;
  }

  // 3. Substring / partial slug match
  const partial = COSMETICS_CATALOG.find(p => 
    p.slug.toLowerCase().includes(clean) || 
    clean.includes(p.slug.toLowerCase()) ||
    p.sku.toLowerCase() === clean ||
    p.quickCode === clean ||
    p.barcode === clean
  );
  if (partial) return partial;

  // 4. Variant barcode or SKU match
  const variantMatch = COSMETICS_CATALOG.find(p =>
    p.variants.some(v => v.barcode === clean || v.sku?.toLowerCase() === clean)
  );
  if (variantMatch) return variantMatch;

  // 5. Token-based match across brand, category or title
  const tokenMatch = COSMETICS_CATALOG.find(p =>
    !p.isPOSOnly && (
      clean.split('-').some(token => token.length > 3 && (
        p.slug.toLowerCase().includes(token) || 
        p.nameAr.toLowerCase().includes(token) ||
        p.nameEn.toLowerCase().includes(token)
      ))
    )
  );
  if (tokenMatch) return tokenMatch;

  return undefined;
}

export function getProductByBarcodeOrCode(code: string): DemoProduct | undefined {
  const cleanCode = code.trim();
  return COSMETICS_CATALOG.find(p => 
    p.barcode === cleanCode || 
    p.quickCode === cleanCode || 
    p.sku === cleanCode ||
    p.variants.some(v => v.barcode === cleanCode || v.sku === cleanCode)
  );
}
