import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift,
  ShoppingBag,
  Package,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  RefreshCw,
  Search,
  X,
  Star,
  Sparkles,
  ExternalLink,
  Save,
  Minus,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/useLanguage';
import {
  MERCH_CATEGORIES,
  type MerchCategory,
  type MerchProduct,
  type MerchVariant,
} from '@/features/merch/merchCatalog';
import {
  evaluateGwpEligibility,
  type GwpConfigRecord,
  type GwpTriggerMode,
} from '@/features/commerce/gwpEngine';
import {
  formatMoney,
  type CurrencyCountry,
  type PricedCartItem,
} from '@/features/commerce/pricingEngine';
import {
  getMerchCatalog,
  saveMerchProduct,
  deleteMerchProduct,
  resetMerchCatalog,
  getGwpConfig,
  saveGwpConfig,
  resetGwpConfig,
  getOrders,
  type OrderRecord,
} from '@/lib/localStore';

type MerchAdminTab = 'catalog' | 'gwp';
type SimBookPreset = 'hardcover_15' | 'hardcover_25' | 'digital_pdf';

const LOW_STOCK_THRESHOLD = 10;

const PRESET_MERCH_IMAGES = [
  '/artwork/merch-plush.webp',
  '/artwork/merch-giftbox.webp',
  '/artwork/merch-lamp.webp',
  '/artwork/merch-backpack.webp',
  '/artwork/merch-activity.webp',
] as const;

const CATEGORY_BADGE_STYLES: Record<MerchCategory, string> = {
  plush: 'bg-pink-500/15 text-pink-200 border-pink-400/35',
  bundle: 'bg-purple-500/15 text-purple-200 border-purple-400/35',
  bedtime: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/35',
  bags: 'bg-amber-500/15 text-amber-200 border-amber-400/35',
  activity: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/35',
};

const TRIGGER_MODES: {
  id: GwpTriggerMode;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
}[] = [
  {
    id: 'any_hardcover_or_threshold',
    titleAr: 'عدد كتب أدنى أو بلوغ قيمة السلة (موصى به)',
    titleEn: 'Min Books OR Paid Subtotal (Recommended)',
    descAr: 'يفتح الهدية عند طلب كتابين فأكثر أو بلوغ حد الصرف بالعملة المحلية (مثل كتاب ديلوكس 25 صفحة).',
    descEn: 'Unlocks when the basket reaches the minimum books OR meets the country subtotal threshold.',
  },
  {
    id: 'min_books',
    titleAr: 'عدد القصص فقط',
    titleEn: 'Minimum Books Only',
    descAr: 'تُفتح الهدية فقط عند إضافة الحد الأدنى من القصص المدفوعة بغض النظر عن السعر.',
    descEn: 'Unlocks strictly when the basket contains at least the configured number of paid books.',
  },
  {
    id: 'min_subtotal',
    titleAr: 'قيمة السلة المدفوعة فقط',
    titleEn: 'Minimum Paid Subtotal Only',
    descAr: 'تُفتح الهدية عند بلوغ قيمة السلة المحددة لكل دولة (كتب أو منتجات براند).',
    descEn: 'Unlocks whenever paid cart subtotal (books and/or merch) reaches the country threshold.',
  },
];

const SIM_BOOK_PRESETS: Record<
  SimBookPreset,
  {
    labelAr: string;
    labelEn: string;
    priceEgp: number;
    priceSar: number;
    priceAed: number;
  }
> = {
  hardcover_15: {
    labelAr: 'كتاب مطبوع 15 صفحة',
    labelEn: 'Hardcover 15p',
    priceEgp: 500,
    priceSar: 110,
    priceAed: 110,
  },
  hardcover_25: {
    labelAr: 'كتاب ديلوكس 25 صفحة',
    labelEn: 'Deluxe Hardcover 25p',
    priceEgp: 750,
    priceSar: 165,
    priceAed: 165,
  },
  digital_pdf: {
    labelAr: 'نسخة رقمية PDF',
    labelEn: 'Digital PDF',
    priceEgp: 250,
    priceSar: 59,
    priceAed: 59,
  },
};

function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function getCategoryLabel(category: MerchCategory, isAr: boolean): string {
  const found = MERCH_CATEGORIES.find((c) => c.id === category);
  if (!found) return category;
  return isAr ? found.labelAr : found.labelEn;
}

function slugifyProductId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseNonNegativeNumber(raw: string, fallback = 0): number {
  if (raw.trim() === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.round(parsed));
}

function parseOptionalNumber(raw: string): number | undefined {
  if (raw.trim() === '') return undefined;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.round(parsed);
}

function createEmptyMerchProduct(): MerchProduct {
  const stamp = Date.now().toString(36).toUpperCase();
  const sku = `BV-MERCH-${stamp.slice(-4)}`;
  return {
    id: `merch-${stamp.toLowerCase()}`,
    sku,
    slug: `merch-${stamp.toLowerCase()}`,
    category: 'plush',
    nameAr: '',
    nameEn: '',
    taglineAr: '',
    taglineEn: '',
    descriptionAr: 'منتج رسمي من عالم بابل فيرس مصمّم بعناية وأمان كامل للأطفال.',
    descriptionEn: 'Official Bubbleverse Kids Brand product crafted with child-safe materials.',
    bubLoreAr: 'قطعة سحرية من عالم «باب» ترافق بطلك الصغير في اللعب والقراءة.',
    bubLoreEn: 'A magical piece from Bub’s world built to accompany every little hero.',
    bedtimeRitualAr: 'رفيق مثالي لطقس القراءة الهادئ قبل النوم بدون شاشات.',
    bedtimeRitualEn: 'A cozy companion for calm, screen-free bedtime story rituals.',
    coverImage: '/artwork/merch-plush.webp',
    galleryImages: ['/artwork/merch-plush.webp'],
    badgeAr: 'جديد',
    badgeEn: 'New',
    ageRatingAr: '0+ آمن للأطفال',
    ageRatingEn: '0+ Child Safe',
    safetySpecsAr: ['خامات غير سامة ومطابقة لمعايير أمان الأطفال EN-71 ومعايير SASO'],
    safetySpecsEn: ['Non-toxic child-safe materials aligned with EN-71 and SASO standards'],
    careAr: 'يُنظف بلطف بماء بارد وصابون خفيف ويُجفف بالهواء الطبيعي.',
    careEn: 'Clean gently with cool water and mild soap, then air-dry flat.',
    priceEgp: 290,
    priceSar: 75,
    priceAed: 75,
    variants: [
      {
        id: 'standard',
        labelAr: 'المقاس القياسي',
        labelEn: 'Standard Edition',
        dimensionsAr: 'مقاس قياسي مناسب للأطفال',
        dimensionsEn: 'Standard kid-friendly size',
        priceEgp: 290,
        priceSar: 75,
        priceAed: 75,
        sku,
      },
    ],
    inStock: true,
    stockCount: 30,
    featured: false,
    isGwpEligibleGift: false,
    allowsRibbonName: false,
  };
}

function areGwpConfigsEqual(a: GwpConfigRecord, b: GwpConfigRecord): boolean {
  return (
    a.enabled === b.enabled &&
    a.giftMerchId === b.giftMerchId &&
    a.giftSku === b.giftSku &&
    a.titleAr === b.titleAr &&
    a.titleEn === b.titleEn &&
    a.variantLabelAr === b.variantLabelAr &&
    a.variantLabelEn === b.variantLabelEn &&
    a.coverImage === b.coverImage &&
    a.retailValueEgp === b.retailValueEgp &&
    a.retailValueSar === b.retailValueSar &&
    a.retailValueAed === b.retailValueAed &&
    a.triggerMode === b.triggerMode &&
    a.minBooks === b.minBooks &&
    a.minSubtotalEgp === b.minSubtotalEgp &&
    a.minSubtotalSar === b.minSubtotalSar &&
    a.minSubtotalAed === b.minSubtotalAed &&
    a.maxPerOrder === b.maxPerOrder
  );
}

export function AdminMerch() {
  const { language, isRTL } = useLanguage();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<MerchAdminTab>('catalog');
  const [products, setProducts] = useState<MerchProduct[]>(() => getMerchCatalog());
  const [savedGwp, setSavedGwp] = useState<GwpConfigRecord>(() => getGwpConfig());
  const [draftGwp, setDraftGwp] = useState<GwpConfigRecord>(() => getGwpConfig());
  const [orders, setOrders] = useState<OrderRecord[]>(() => getOrders());

  // Catalog filters & modal state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MerchCategory>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editing, setEditing] = useState<MerchProduct | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<MerchProduct | null>(null);
  const [confirmResetCatalogOpen, setConfirmResetCatalogOpen] = useState(false);
  const [confirmResetGwpOpen, setConfirmResetGwpOpen] = useState(false);

  // Live GWP Cart Simulator state
  const [simCountry, setSimCountry] = useState<CurrencyCountry>('EG');
  const [simBookCount, setSimBookCount] = useState<number>(1);
  const [simBookPreset, setSimBookPreset] = useState<SimBookPreset>('hardcover_15');
  const [simIncludeMerch, setSimIncludeMerch] = useState<boolean>(false);

  const refreshAll = useCallback(
    (showToast = false) => {
      setProducts(getMerchCatalog());
      const freshGwp = getGwpConfig();
      setSavedGwp(freshGwp);
      setDraftGwp(freshGwp);
      setOrders(getOrders());
      if (showToast) {
        toast.success(
          isAr ? 'تم تحديث بيانات متجر البراند ونظام الهدايا' : 'Merch store & GWP data refreshed'
        );
      }
    },
    [isAr]
  );

  useEffect(() => {
    const syncCatalog = () => setProducts(getMerchCatalog());
    const syncGwp = () => {
      const latest = getGwpConfig();
      setSavedGwp(latest);
      setDraftGwp(latest);
    };
    const syncStorage = () => {
      setProducts(getMerchCatalog());
      setOrders(getOrders());
    };
    window.addEventListener('bubbleverse:merch-updated', syncCatalog);
    window.addEventListener('bubbleverse:gwp-updated', syncGwp);
    window.addEventListener('storage', syncStorage);
    return () => {
      window.removeEventListener('bubbleverse:merch-updated', syncCatalog);
      window.removeEventListener('bubbleverse:gwp-updated', syncGwp);
      window.removeEventListener('storage', syncStorage);
    };
  }, []);

  // KPI calculations
  const merchStats = useMemo(() => {
    const totalSkus = products.length;
    const inStockCount = products.filter((p) => p.inStock && p.stockCount > 0).length;
    const lowStockProducts = products.filter(
      (p) => !p.inStock || p.stockCount <= LOW_STOCK_THRESHOLD
    );
    const outOfStockCount = products.filter((p) => !p.inStock || p.stockCount === 0).length;
    const totalUnits = products.reduce((sum, p) => sum + Math.max(0, p.stockCount), 0);
    const featuredCount = products.filter((p) => p.featured).length;
    return {
      totalSkus,
      inStockCount,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      outOfStockCount,
      totalUnits,
      featuredCount,
    };
  }, [products]);

  const orderMerchStats = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== 'cancelled');
    let ordersWithMerchOrGwp = 0;
    let totalMerchUnits = 0;
    let totalGwpUnits = 0;

    for (const order of validOrders) {
      let hasBrandUnit = false;
      for (const item of order.items) {
        const qty = Math.max(1, item.quantity || 1);
        if (item.isFreeGift || item.itemType === 'gwp_gift') {
          totalGwpUnits += qty;
          hasBrandUnit = true;
        } else if (item.itemType === 'merch' || item.format === 'physical_merch') {
          totalMerchUnits += qty;
          hasBrandUnit = true;
        }
      }
      if (hasBrandUnit) {
        ordersWithMerchOrGwp += 1;
      }
    }

    return {
      totalValidOrders: validOrders.length,
      ordersWithMerchOrGwp,
      totalMerchUnits,
      totalGwpUnits,
      totalBrandUnits: totalMerchUnits + totalGwpUnits,
    };
  }, [orders]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    for (const cat of MERCH_CATEGORIES) {
      counts[cat.id] = products.filter((p) => p.category === cat.id).length;
    }
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;
      if (lowStockOnly && product.inStock && product.stockCount > LOW_STOCK_THRESHOLD) {
        return false;
      }
      if (!q) return true;
      return (
        product.nameAr.toLowerCase().includes(q) ||
        product.nameEn.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q) ||
        product.slug.toLowerCase().includes(q) ||
        product.taglineAr.toLowerCase().includes(q) ||
        product.taglineEn.toLowerCase().includes(q)
      );
    });
  }, [products, search, categoryFilter, lowStockOnly]);

  // GWP Simulator evaluation (runs live on draftGwp before saving!)
  const simEvaluation = useMemo(() => {
    const preset = SIM_BOOK_PRESETS[simBookPreset];
    const items: PricedCartItem[] = [];
    if (simBookCount > 0) {
      items.push({
        itemType: 'book',
        priceEgp: preset.priceEgp,
        priceSar: preset.priceSar,
        priceAed: preset.priceAed,
        quantity: simBookCount,
      });
    }
    if (simIncludeMerch) {
      items.push({
        itemType: 'merch',
        priceEgp: 420,
        priceSar: 109,
        priceAed: 109,
        quantity: 1,
      });
    }
    return evaluateGwpEligibility(items, simCountry, draftGwp);
  }, [simBookCount, simBookPreset, simIncludeMerch, simCountry, draftGwp]);

  const isGwpDirty = useMemo(
    () => !areGwpConfigsEqual(draftGwp, savedGwp),
    [draftGwp, savedGwp]
  );

  const selectedGwpProduct = useMemo(
    () =>
      products.find((p) => p.id === draftGwp.giftMerchId) ??
      products.find((p) => p.id === 'bub-plush-ball') ??
      products[0],
    [products, draftGwp.giftMerchId]
  );

  // Quick stock & switch actions
  const handleQuickStockDelta = (product: MerchProduct, delta: number) => {
    const nextStock = Math.max(0, product.stockCount + delta);
    const updated: MerchProduct = {
      ...product,
      stockCount: nextStock,
      inStock: nextStock > 0 ? product.inStock : false,
    };
    const nextCatalog = saveMerchProduct(updated);
    setProducts(nextCatalog);
  };

  const handleInlineStockChange = (product: MerchProduct, rawValue: string) => {
    const nextStock = parseNonNegativeNumber(rawValue, 0);
    const updated: MerchProduct = {
      ...product,
      stockCount: nextStock,
      inStock: nextStock > 0 ? product.inStock : false,
    };
    const nextCatalog = saveMerchProduct(updated);
    setProducts(nextCatalog);
  };

  const handleToggleInStock = (product: MerchProduct, checked: boolean) => {
    const updated: MerchProduct = {
      ...product,
      inStock: checked,
      stockCount: checked && product.stockCount === 0 ? 10 : product.stockCount,
    };
    const nextCatalog = saveMerchProduct(updated);
    setProducts(nextCatalog);
    toast.success(
      checked
        ? isAr
          ? `تم تفعيل توفر «${product.nameAr}»`
          : `"${product.nameEn}" marked In Stock`
        : isAr
          ? `تم إيقاف توفر «${product.nameAr}»`
          : `"${product.nameEn}" marked Out of Stock`
    );
  };

  const handleToggleFeatured = (product: MerchProduct, checked: boolean) => {
    const updated: MerchProduct = {
      ...product,
      featured: checked,
    };
    const nextCatalog = saveMerchProduct(updated);
    setProducts(nextCatalog);
    toast.success(
      checked
        ? isAr
          ? `تم تمييز «${product.nameAr}» في الواجهة`
          : `"${product.nameEn}" marked Featured`
        : isAr
          ? `تمت إزالة التمييز عن «${product.nameAr}»`
          : `"${product.nameEn}" removed from Featured`
    );
  };

  // Modal handlers
  const openAddProductModal = () => {
    setActiveTab('catalog');
    setIsNewProduct(true);
    setEditing(createEmptyMerchProduct());
  };

  const openEditProductModal = (product: MerchProduct) => {
    setIsNewProduct(false);
    setEditing({
      ...product,
      variants: product.variants.map((v) => ({ ...v })),
      galleryImages: [...product.galleryImages],
      safetySpecsAr: [...product.safetySpecsAr],
      safetySpecsEn: [...product.safetySpecsEn],
    });
  };

  const handleVariantChange = (
    index: number,
    patch: Partial<MerchVariant>
  ) => {
    setEditing((prev) => {
      if (!prev) return prev;
      const nextVariants = prev.variants.map((variant, i) =>
        i === index ? { ...variant, ...patch } : variant
      );
      return { ...prev, variants: nextVariants };
    });
  };

  const handleAddVariant = () => {
    setEditing((prev) => {
      if (!prev) return prev;
      const idx = prev.variants.length + 1;
      const newVariant: MerchVariant = {
        id: `variant-${idx}-${Date.now().toString(36).slice(-3)}`,
        labelAr: `إصدار ${idx}`,
        labelEn: `Variant ${idx}`,
        dimensionsAr: 'مقاس قياسي',
        dimensionsEn: 'Standard size',
        priceEgp: prev.priceEgp,
        priceSar: prev.priceSar,
        priceAed: prev.priceAed,
        sku: `${prev.sku}-V${idx}`,
      };
      return { ...prev, variants: [...prev.variants, newVariant] };
    });
  };

  const handleRemoveVariant = (index: number) => {
    setEditing((prev) => {
      if (!prev || prev.variants.length <= 1) return prev;
      return {
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index),
      };
    });
  };

  const handleSaveProduct = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    if (!editing.nameAr.trim() || !editing.nameEn.trim()) {
      toast.error(
        isAr
          ? 'يرجى إدخال اسم المنتج بالعربية والإنجليزية'
          : 'Both Arabic and English product names are required'
      );
      return;
    }

    const cleanSlug =
      slugifyProductId(editing.slug || editing.id || editing.nameEn) ||
      `merch-${Date.now().toString(36)}`;
    const cleanId = isNewProduct ? cleanSlug : editing.id.trim() || cleanSlug;
    const cleanSku = editing.sku.trim().toUpperCase() || `BV-${cleanSlug.slice(0, 8).toUpperCase()}`;
    const cover = editing.coverImage.trim() || '/artwork/merch-plush.webp';

    const sanitizedVariants: MerchVariant[] =
      editing.variants.length > 0
        ? editing.variants.map((variant, idx) => ({
            ...variant,
            id: variant.id.trim() || `variant-${idx + 1}`,
            labelAr: variant.labelAr.trim() || editing.nameAr.trim(),
            labelEn: variant.labelEn.trim() || editing.nameEn.trim(),
            sku: variant.sku.trim().toUpperCase() || `${cleanSku}-${idx + 1}`,
            priceEgp: Math.max(0, Math.round(variant.priceEgp)),
            priceSar: Math.max(0, Math.round(variant.priceSar)),
            priceAed: Math.max(0, Math.round(variant.priceAed)),
          }))
        : [
            {
              id: 'standard',
              labelAr: 'الإصدار القياسي',
              labelEn: 'Standard Edition',
              dimensionsAr: 'مقاس قياسي',
              dimensionsEn: 'Standard size',
              priceEgp: editing.priceEgp,
              priceSar: editing.priceSar,
              priceAed: editing.priceAed,
              sku: cleanSku,
            },
          ];

    const cleanedProduct: MerchProduct = {
      ...editing,
      id: cleanId,
      slug: cleanSlug,
      sku: cleanSku,
      nameAr: editing.nameAr.trim(),
      nameEn: editing.nameEn.trim(),
      taglineAr: editing.taglineAr.trim() || editing.nameAr.trim(),
      taglineEn: editing.taglineEn.trim() || editing.nameEn.trim(),
      descriptionAr: editing.descriptionAr.trim() || editing.taglineAr.trim(),
      descriptionEn: editing.descriptionEn.trim() || editing.taglineEn.trim(),
      coverImage: cover,
      galleryImages: [
        cover,
        ...editing.galleryImages.filter((img) => img && img !== cover),
      ],
      priceEgp: Math.max(0, Math.round(editing.priceEgp)),
      priceSar: Math.max(0, Math.round(editing.priceSar)),
      priceAed: Math.max(0, Math.round(editing.priceAed)),
      stockCount: Math.max(0, Math.round(editing.stockCount)),
      variants: sanitizedVariants,
    };

    const nextCatalog = saveMerchProduct(cleanedProduct);
    setProducts(nextCatalog);
    setEditing(null);
    toast.success(
      isNewProduct
        ? isAr
          ? `تمت إضافة «${cleanedProduct.nameAr}» إلى متجر البراند!`
          : `"${cleanedProduct.nameEn}" added to the Brand Merch store!`
        : isAr
          ? `تم حفظ تعديلات «${cleanedProduct.nameAr}» بنجاح!`
          : `"${cleanedProduct.nameEn}" updated successfully!`
    );
  };

  const handleConfirmDeleteProduct = () => {
    if (!confirmDelete) return;
    if (products.length <= 1) {
      toast.error(
        isAr
          ? 'يجب الاحتفاظ بمنتج واحد على الأقل في متجر البراند'
          : 'Keep at least one product in the Merch store'
      );
      setConfirmDelete(null);
      return;
    }
    const nextCatalog = deleteMerchProduct(confirmDelete.id);
    setProducts(nextCatalog);
    toast.success(
      isAr
        ? `تم حذف «${confirmDelete.nameAr}» من المتجر`
        : `"${confirmDelete.nameEn}" removed from Merch catalog`
    );
    setConfirmDelete(null);
  };

  const handleConfirmResetCatalog = () => {
    const restored = resetMerchCatalog();
    setProducts(restored);
    setConfirmResetCatalogOpen(false);
    toast.success(
      isAr
        ? 'تمت استعادة تشكيلة منتجات بابل فيرس الافتراضية (6 منتجات)'
        : 'Default Bubbleverse Merch collection restored (6 products)'
    );
  };

  // GWP handlers
  const handleSelectGwpProduct = (merchId: string) => {
    const product = products.find((p) => p.id === merchId);
    if (!product) {
      setDraftGwp((prev) => ({ ...prev, giftMerchId: merchId }));
      return;
    }
    const firstVariant = product.variants[0];
    setDraftGwp((prev) => ({
      ...prev,
      giftMerchId: product.id,
      giftSku: firstVariant?.sku || product.sku,
      coverImage: product.coverImage,
      retailValueEgp: firstVariant?.priceEgp ?? product.priceEgp,
      retailValueSar: firstVariant?.priceSar ?? product.priceSar,
      retailValueAed: firstVariant?.priceAed ?? product.priceAed,
      titleAr: `${product.nameAr} (هدية مجانية!)`,
      titleEn: `${product.nameEn} (FREE Gift!)`,
      variantLabelAr: firstVariant
        ? `${firstVariant.labelAr} • هدية مجانية`
        : 'هدية مجانية مع الطلب',
      variantLabelEn: firstVariant
        ? `${firstVariant.labelEn} • Complimentary Gift`
        : 'Complimentary Gift',
    }));
  };

  const handleSaveGwp = (e: FormEvent) => {
    e.preventDefault();
    if (!draftGwp.titleAr.trim() || !draftGwp.titleEn.trim()) {
      toast.error(
        isAr
          ? 'يرجى إدخال عنوان الهدية بالعربية والإنجليزية'
          : 'Please enter both Arabic and English gift titles'
      );
      return;
    }
    const saved = saveGwpConfig({
      ...draftGwp,
      titleAr: draftGwp.titleAr.trim(),
      titleEn: draftGwp.titleEn.trim(),
      variantLabelAr: draftGwp.variantLabelAr.trim() || 'هدية مجانية',
      variantLabelEn: draftGwp.variantLabelEn.trim() || 'Complimentary Gift',
      giftSku: draftGwp.giftSku.trim().toUpperCase() || 'BV-BUB-MINI-12',
      minBooks: Math.max(1, Math.round(draftGwp.minBooks || 1)),
      minSubtotalEgp: Math.max(0, Math.round(draftGwp.minSubtotalEgp || 0)),
      minSubtotalSar: Math.max(0, Math.round(draftGwp.minSubtotalSar || 0)),
      minSubtotalAed: Math.max(0, Math.round(draftGwp.minSubtotalAed || 0)),
      retailValueEgp: Math.max(0, Math.round(draftGwp.retailValueEgp || 0)),
      retailValueSar: Math.max(0, Math.round(draftGwp.retailValueSar || 0)),
      retailValueAed: Math.max(0, Math.round(draftGwp.retailValueAed || 0)),
      maxPerOrder: Math.max(1, Math.round(draftGwp.maxPerOrder || 1)),
    });
    setSavedGwp(saved);
    setDraftGwp(saved);
    toast.success(
      saved.enabled
        ? isAr
          ? 'تم حفظ وتفعيل قواعد هدية كورة Bub المجانية فوراً في السلة!'
          : 'Free Bub GWP rules saved and active live in Cart!'
        : isAr
          ? 'تم حفظ إعدادات الهدية (متوقفة مؤقتاً)'
          : 'Free Bub GWP settings saved (currently paused)'
    );
  };

  const handleConfirmResetGwp = () => {
    const restored = resetGwpConfig();
    setSavedGwp(restored);
    setDraftGwp(restored);
    setConfirmResetGwpOpen(false);
    toast.success(
      isAr
        ? 'تمت استعادة الإعدادات الافتراضية لهدية كورة Bub المجانية'
        : 'Default Free Bub GWP rules restored'
    );
  };

  const gwpThresholdSummary =
    savedGwp.triggerMode === 'min_books'
      ? isAr
        ? `${formatNumber(savedGwp.minBooks)}+ كتب`
        : `${formatNumber(savedGwp.minBooks)}+ books`
      : savedGwp.triggerMode === 'min_subtotal'
        ? formatMoney(savedGwp.minSubtotalEgp, 'EG', isAr ? 'ar' : 'en')
        : isAr
          ? `${formatNumber(savedGwp.minBooks)} كتب أو ${formatMoney(savedGwp.minSubtotalEgp, 'EG', 'ar')}`
          : `${formatNumber(savedGwp.minBooks)} books or ${formatMoney(savedGwp.minSubtotalEgp, 'EG', 'en')}`;

  const gwpMultiCurrencyDesc = [
    formatMoney(savedGwp.minSubtotalEgp, 'EG', isAr ? 'ar' : 'en'),
    formatMoney(savedGwp.minSubtotalSar, 'SA', isAr ? 'ar' : 'en'),
    formatMoney(savedGwp.minSubtotalAed, 'AE', isAr ? 'ar' : 'en'),
  ].join(' · ');

  return (
    <AdminLayout>
      <div dir={isRTL ? 'rtl' : 'ltr'} className="max-w-[min(100%,108rem)] mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500/25 via-purple-500/25 to-cyan-500/20 border border-pink-400/35 flex items-center justify-center shadow-[0_0_24px_rgba(244,114,182,0.22)] shrink-0">
                <Gift className="w-6 h-6 text-pink-300" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-editorial text-white">
                {isAr ? 'متجر البراند وهدية كورة Bub' : 'Brand Merch & Free Bub GWP'}
              </h1>
              <Badge className="bg-cyan-500/15 text-cyan-200 border border-cyan-400/30 text-xs font-numeric px-2.5 py-0.5 rounded-full">
                {formatNumber(products.length)} {isAr ? 'منتج' : 'SKUs'}
              </Badge>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              {isAr
                ? 'تحكّم في تشكيلة منتجات براند بابل فيرس والمخزون والأسعار بـ 3 عملات، واضبط قواعد هدية كورة Bub المجانية التي ترفع قيمة السلة وتُحدّث المتجر فورياً.'
                : 'Manage Bubbleverse Kids Brand merch inventory across EGP, SAR & AED, and configure live Free Bub Plush Ball Gift-With-Purchase (GWP) rules.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link to="/merch">
              <Button
                type="button"
                variant="outline"
                className="h-10 rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-slate-100 gap-2 px-4 text-xs font-semibold"
              >
                <ShoppingBag className="w-4 h-4 text-pink-300" />
                <span>{isAr ? 'معاينة متجر البراند' : 'View Merch Store'}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-75" />
              </Button>
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={() => refreshAll(true)}
              className="h-10 rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-slate-100 gap-2 px-4 text-xs font-semibold"
            >
              <RefreshCw className="w-4 h-4 text-cyan-300" />
              <span>{isAr ? 'تحديث' : 'Refresh'}</span>
            </Button>
            <Button
              type="button"
              onClick={openAddProductModal}
              className="bubble-btn bubble-btn-primary h-10 px-5 text-xs font-bold gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة منتج براند جديد' : 'Add New Merch Product'}</span>
            </Button>
          </div>
        </div>

        {/* Top 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            title={isAr ? 'منتجات البراند (SKU)' : 'Total Merch SKUs'}
            value={formatNumber(merchStats.totalSkus)}
            secondaryValue={
              isAr
                ? `${formatNumber(merchStats.inStockCount)} متوفر`
                : `${formatNumber(merchStats.inStockCount)} in stock`
            }
            icon={Package}
            accent="cyan"
            badge={
              isAr
                ? `${formatNumber(merchStats.totalUnits)} وحدة`
                : `${formatNumber(merchStats.totalUnits)} units`
            }
            description={
              isAr
                ? `${formatNumber(merchStats.featuredCount)} منتجات مميزة في الواجهة`
                : `${formatNumber(merchStats.featuredCount)} featured storefront items`
            }
          />

          <StatsCard
            title={isAr ? 'تنبيهات انخفاض المخزون' : 'Low-Stock Alerts'}
            value={formatNumber(merchStats.lowStockCount)}
            icon={AlertTriangle}
            accent={merchStats.lowStockCount > 0 ? 'amber' : 'emerald'}
            highlight={merchStats.lowStockCount > 0}
            badge={
              merchStats.outOfStockCount > 0
                ? isAr
                  ? `${formatNumber(merchStats.outOfStockCount)} نفد`
                  : `${formatNumber(merchStats.outOfStockCount)} out`
                : isAr
                  ? `حد التنبيه ≤ ${LOW_STOCK_THRESHOLD}`
                  : `Threshold ≤ ${LOW_STOCK_THRESHOLD}`
            }
            description={
              merchStats.lowStockCount > 0
                ? isAr
                  ? `يحتاج إعادة تزويد: ${merchStats.lowStockProducts
                      .slice(0, 2)
                      .map((p) => p.nameAr)
                      .join('، ')}`
                  : `Restock soon: ${merchStats.lowStockProducts
                      .slice(0, 2)
                      .map((p) => p.nameEn)
                      .join(', ')}`
                : isAr
                  ? 'جميع منتجات البراند متوفرة بمخزون آمن'
                  : 'All merch SKUs are stocked above alert level'
            }
          />

          <StatsCard
            title={isAr ? 'حالة هدية كورة Bub المجانية' : 'Free Bub GWP Status'}
            value={
              savedGwp.enabled
                ? isAr
                  ? 'مُفعّلة'
                  : 'ACTIVE'
                : isAr
                  ? 'متوقفة'
                  : 'PAUSED'
            }
            secondaryValue={savedGwp.enabled ? 'ON' : 'OFF'}
            icon={Gift}
            accent={savedGwp.enabled ? 'pink' : 'purple'}
            highlight={savedGwp.enabled}
            badge={gwpThresholdSummary}
            description={
              isAr
                ? `الحد الأدنى: ${gwpMultiCurrencyDesc}`
                : `Thresholds: ${gwpMultiCurrencyDesc}`
            }
          />

          <StatsCard
            title={isAr ? 'طلبات البراند وهدايا Bub' : 'Merch & GWP Orders'}
            value={formatNumber(orderMerchStats.ordersWithMerchOrGwp)}
            secondaryValue={
              isAr
                ? `${formatNumber(orderMerchStats.totalBrandUnits)} قطعة`
                : `${formatNumber(orderMerchStats.totalBrandUnits)} units`
            }
            icon={ShoppingBag}
            accent="emerald"
            badge={
              isAr
                ? `${formatNumber(orderMerchStats.totalGwpUnits)} هدية Bub`
                : `${formatNumber(orderMerchStats.totalGwpUnits)} Free Bubs`
            }
            description={
              isAr
                ? `${formatNumber(orderMerchStats.totalMerchUnits)} ميرتش مدفوع من أصل ${formatNumber(orderMerchStats.totalValidOrders)} طلب`
                : `${formatNumber(orderMerchStats.totalMerchUnits)} paid merch units across ${formatNumber(orderMerchStats.totalValidOrders)} orders`
            }
          />
        </div>

        {/* 2 Clean Tabs Bar */}
        <div
          role="tablist"
          aria-label={isAr ? 'أقسام إدارة البراند والهدايا' : 'Brand Merch & GWP sections'}
          className="glass-card rounded-3xl p-2 flex flex-wrap gap-2"
        >
          <button
            type="button"
            role="tab"
            id="merch-tab-catalog"
            aria-selected={activeTab === 'catalog'}
            aria-controls="merch-panel-catalog"
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 min-w-[220px] min-h-[46px] px-5 py-2.5 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold transition-all cursor-pointer border ${
              activeTab === 'catalog'
                ? 'bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/15 text-white border-cyan-400/40 shadow-[0_0_24px_rgba(0,217,255,0.16)]'
                : 'bg-transparent text-slate-300 border-transparent hover:bg-white/5 hover:text-white'
            }`}
          >
            <Package
              className={`w-4 h-4 shrink-0 ${
                activeTab === 'catalog' ? 'text-cyan-300' : 'text-slate-400'
              }`}
            />
            <span className="truncate">
              {isAr ? 'منتجات براند بابل فيرس' : 'Merch Catalog & Stock'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-numeric border ${
                activeTab === 'catalog'
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/35'
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}
            >
              {formatNumber(products.length)}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            id="merch-tab-gwp"
            aria-selected={activeTab === 'gwp'}
            aria-controls="merch-panel-gwp"
            onClick={() => setActiveTab('gwp')}
            className={`flex-1 min-w-[220px] min-h-[46px] px-5 py-2.5 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold transition-all cursor-pointer border ${
              activeTab === 'gwp'
                ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/15 text-white border-pink-400/40 shadow-[0_0_24px_rgba(244,114,182,0.18)]'
                : 'bg-transparent text-slate-300 border-transparent hover:bg-white/5 hover:text-white'
            }`}
          >
            <Gift
              className={`w-4 h-4 shrink-0 ${
                activeTab === 'gwp' ? 'text-pink-300' : 'text-slate-400'
              }`}
            />
            <span className="truncate">
              {isAr ? 'نظام هدية كورة Bub المجانية' : 'Free Bub GWP Rules'}
            </span>
            <span
              dir="ltr"
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-numeric border ${
                savedGwp.enabled
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/35'
                  : 'bg-slate-500/20 text-slate-300 border-slate-400/30'
              }`}
            >
              {savedGwp.enabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* ================================================================
            TAB 1: MERCH CATALOG & STOCK
           ================================================================ */}
        {activeTab === 'catalog' && (
          <div
            role="tabpanel"
            id="merch-panel-catalog"
            aria-labelledby="merch-tab-catalog"
            className="space-y-6"
          >
            {/* Search, Category Filter & Actions Bar */}
            <div className="glass-card rounded-3xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                <div className="relative flex-1 max-w-lg">
                  <Search className="w-4 h-4 text-cyan-300/80 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label={isAr ? 'البحث في منتجات البراند' : 'Search merch products'}
                    placeholder={
                      isAr
                        ? 'ابحث بالاسم أو رمز SKU أو الوصف...'
                        : 'Search by product name, SKU, or tagline...'
                    }
                    className="ps-10 pe-9 h-11 rounded-2xl bg-slate-950/75 border-white/15 text-white placeholder:text-slate-400 text-sm focus-visible:ring-cyan-400/50"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setLowStockOnly((prev) => !prev)}
                    aria-pressed={lowStockOnly}
                    className={`min-h-[40px] px-3.5 rounded-full text-xs font-semibold border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      lowStockOnly
                        ? 'bg-amber-500/20 text-amber-200 border-amber-400/45'
                        : 'bg-white/5 text-slate-300 border-white/15 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>
                      {isAr
                        ? `مخزون منخفض ≤${LOW_STOCK_THRESHOLD} (${merchStats.lowStockCount})`
                        : `Low Stock ≤${LOW_STOCK_THRESHOLD} (${merchStats.lowStockCount})`}
                    </span>
                  </button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmResetCatalogOpen(true)}
                    className="h-10 px-4 rounded-full border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white text-xs font-semibold gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>
                      {isAr ? 'استعادة التشكيلة الافتراضية' : 'Reset Default Collection'}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border ${
                    categoryFilter === 'all'
                      ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 border-cyan-300 shadow-[0_0_20px_rgba(0,217,255,0.28)]'
                      : 'bg-slate-950/60 text-slate-300 border-white/10 hover:border-cyan-400/40 hover:text-white'
                  }`}
                >
                  <span>{isAr ? 'الكل' : 'All'}</span>
                  <span className="font-numeric opacity-85">({categoryCounts.all})</span>
                </button>

                {MERCH_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 border ${
                      categoryFilter === cat.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-pink-400/50 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                        : 'bg-slate-950/60 text-slate-300 border-white/10 hover:border-purple-400/40 hover:text-white'
                    }`}
                  >
                    <span>{isAr ? cat.labelAr : cat.labelEn}</span>
                    <span className="font-numeric opacity-80">
                      ({categoryCounts[cat.id] ?? 0})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Merch Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white">
                    {isAr ? 'لا توجد منتجات مطابقة للفلاتر' : 'No matching merch products'}
                  </h2>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    {isAr
                      ? 'جرّب مسح البحث أو تغيير التصنيف، أو أضف منتجاً جديداً لبراند بابل فيرس.'
                      : 'Try clearing your search or category filter, or add a new Bubbleverse merch SKU.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setCategoryFilter('all');
                      setLowStockOnly(false);
                    }}
                    className="h-10 rounded-full border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 text-xs px-4"
                  >
                    {isAr ? 'مسح الفلاتر' : 'Clear Filters'}
                  </Button>
                  <Button
                    type="button"
                    onClick={openAddProductModal}
                    className="bubble-btn bubble-btn-primary h-10 px-5 text-xs font-bold gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? 'إضافة منتج جديد' : 'Add Merch Product'}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map((product) => {
                  const isLowStock =
                    !product.inStock || product.stockCount <= LOW_STOCK_THRESHOLD;
                  const primaryName = isAr ? product.nameAr : product.nameEn;
                  const secondaryName = isAr ? product.nameEn : product.nameAr;
                  const tagline = isAr ? product.taglineAr : product.taglineEn;

                  return (
                    <article
                      key={product.id}
                      className={`glass-card rounded-3xl overflow-hidden flex flex-col border transition-colors ${
                        isLowStock
                          ? 'border-amber-400/35'
                          : 'border-white/10 hover:border-cyan-400/30'
                      }`}
                    >
                      {/* Thumbnail & Top Badges */}
                      <div className="relative h-48 bg-slate-950/90 overflow-hidden">
                        <img
                          src={product.coverImage}
                          alt={primaryName}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                        <div className="absolute top-3 start-3 end-3 flex flex-wrap items-center justify-between gap-1.5">
                          <Badge
                            className={`backdrop-blur-md border text-[11px] rounded-full px-2.5 py-0.5 ${CATEGORY_BADGE_STYLES[product.category]}`}
                          >
                            {getCategoryLabel(product.category, isAr)}
                          </Badge>

                          <div className="flex items-center gap-1.5">
                            {product.isGwpEligibleGift && (
                              <Badge className="bg-pink-500/85 text-white border-0 text-[11px] rounded-full px-2.5 py-0.5">
                                <Gift className="w-3 h-3 me-1 inline" />
                                {isAr ? 'هدية GWP' : 'GWP Gift'}
                              </Badge>
                            )}
                            {product.featured && (
                              <Badge className="bg-amber-400/90 text-slate-950 border-0 text-[11px] font-bold rounded-full px-2 py-0.5">
                                <Star className="w-3 h-3 me-1 inline fill-current" />
                                {isAr ? 'مميز' : 'Featured'}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="absolute bottom-3 start-3 end-3 flex items-center justify-between gap-2">
                          <span
                            dir="ltr"
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-950/85 text-cyan-200 border border-cyan-400/30"
                          >
                            {product.sku}
                          </span>
                          {isLowStock && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/25 text-amber-200 border border-amber-400/45 backdrop-blur-md">
                              <AlertTriangle className="w-3 h-3" />
                              {!product.inStock || product.stockCount === 0
                                ? isAr
                                  ? 'نفد المخزون'
                                  : 'Out of Stock'
                                : isAr
                                  ? 'مخزون منخفض'
                                  : 'Low Stock'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="font-bold text-white text-base leading-snug line-clamp-1">
                            {primaryName}
                          </h3>
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {secondaryName}
                          </p>
                          <p className="text-xs text-slate-300/80 line-clamp-2 pt-0.5 min-h-[2rem]">
                            {tagline}
                          </p>
                        </div>

                        {/* 3-Currency Price Matrix (EGP / SAR / AED) */}
                        <div
                          dir="ltr"
                          className="glass-card-inner rounded-2xl p-3 grid grid-cols-3 gap-2 text-center font-numeric"
                        >
                          <div className="space-y-0.5">
                            <span className="block text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                              EGP
                            </span>
                            <span className="block text-sm font-extrabold text-cyan-300">
                              {formatNumber(product.priceEgp)}
                            </span>
                            {product.compareAtEgp && product.compareAtEgp > product.priceEgp && (
                              <span className="block text-[10px] text-slate-500 line-through">
                                {formatNumber(product.compareAtEgp)}
                              </span>
                            )}
                          </div>

                          <div className="space-y-0.5 border-x border-white/10 px-1">
                            <span className="block text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                              SAR
                            </span>
                            <span className="block text-sm font-extrabold text-white">
                              {formatNumber(product.priceSar)}
                            </span>
                            {product.compareAtSar && product.compareAtSar > product.priceSar && (
                              <span className="block text-[10px] text-slate-500 line-through">
                                {formatNumber(product.compareAtSar)}
                              </span>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <span className="block text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                              AED
                            </span>
                            <span className="block text-sm font-extrabold text-purple-300">
                              {formatNumber(product.priceAed)}
                            </span>
                            {product.compareAtAed && product.compareAtAed > product.priceAed && (
                              <span className="block text-[10px] text-slate-500 line-through">
                                {formatNumber(product.compareAtAed)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Variants Summary */}
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-300">
                          <span className="inline-flex items-center gap-1.5 text-slate-400">
                            <Layers className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                            <span>
                              {formatNumber(product.variants.length)}{' '}
                              {isAr ? 'مقاسات / إصدارات' : 'variants'}
                            </span>
                          </span>
                          <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {product.variants
                              .map((v) => (isAr ? v.labelAr : v.labelEn))
                              .join(' · ')}
                          </span>
                        </div>

                        {/* Live Stock Quick-Adjust + Toggles */}
                        <div className="glass-card-inner rounded-2xl p-3 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-200">
                              {isAr ? 'المخزون الحي' : 'Live Stock'}
                            </span>
                            <div className="flex items-center gap-1.5" dir="ltr">
                              <button
                                type="button"
                                onClick={() => handleQuickStockDelta(product, -1)}
                                disabled={product.stockCount <= 0}
                                aria-label={
                                  isAr
                                    ? `إنقاص مخزون ${product.nameAr}`
                                    : `Decrease stock for ${product.nameEn}`
                                }
                                className="h-9 w-9 rounded-xl bg-slate-900/90 border border-white/15 text-slate-200 hover:bg-white/10 hover:text-white disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <Input
                                type="number"
                                min={0}
                                max={99999}
                                value={product.stockCount}
                                onChange={(e) =>
                                  handleInlineStockChange(product, e.target.value)
                                }
                                aria-label={
                                  isAr
                                    ? `كمية المخزون لـ ${product.nameAr}`
                                    : `Stock count for ${product.nameEn}`
                                }
                                className={`h-9 w-16 px-2 text-center font-numeric text-sm font-bold rounded-xl bg-slate-950/90 border ${
                                  isLowStock
                                    ? 'border-amber-400/50 text-amber-200'
                                    : 'border-white/15 text-white'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleQuickStockDelta(product, 1)}
                                aria-label={
                                  isAr
                                    ? `زيادة مخزون ${product.nameAr}`
                                    : `Increase stock for ${product.nameEn}`
                                }
                                className="h-9 w-9 rounded-xl bg-slate-900/90 border border-white/15 text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-200 hover:border-cyan-400/40 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                            <label className="inline-flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                              <Switch
                                checked={product.inStock}
                                onCheckedChange={(checked) =>
                                  handleToggleInStock(product, checked)
                                }
                                aria-label={
                                  isAr
                                    ? `تفعيل توفر ${product.nameAr}`
                                    : `Toggle in-stock for ${product.nameEn}`
                                }
                              />
                              <span>{isAr ? 'متوفر بالمتجر' : 'In Stock'}</span>
                            </label>

                            <label className="inline-flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                              <Switch
                                checked={Boolean(product.featured)}
                                onCheckedChange={(checked) =>
                                  handleToggleFeatured(product, checked)
                                }
                                aria-label={
                                  isAr
                                    ? `تمييز ${product.nameAr}`
                                    : `Toggle featured for ${product.nameEn}`
                                }
                              />
                              <span>{isAr ? 'مميز' : 'Featured'}</span>
                            </label>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => openEditProductModal(product)}
                            className="flex-1 h-10 rounded-full bg-white/10 hover:bg-cyan-500/20 border border-white/15 hover:border-cyan-400/40 text-white text-xs font-semibold gap-2 transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                            <span>{isAr ? 'تعديل المنتج' : 'Edit Product'}</span>
                          </Button>

                          <Link
                            to={`/merch/${product.slug}`}
                            className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-slate-950/70 border border-white/15 text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 transition-all shrink-0"
                            title={isAr ? 'معاينة صفحة المنتج' : 'View Merch PDP'}
                            aria-label={isAr ? 'معاينة صفحة المنتج' : 'View Merch PDP'}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDelete(product)}
                            className="h-10 w-10 p-0 rounded-full text-slate-400 hover:text-red-300 hover:bg-red-500/15 border border-transparent hover:border-red-500/30 shrink-0"
                            title={isAr ? 'حذف المنتج' : 'Delete Product'}
                            aria-label={isAr ? 'حذف المنتج' : 'Delete Product'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================
            TAB 2: FREE BUB GWP RULES & LIVE CART SIMULATOR
           ================================================================ */}
        {activeTab === 'gwp' && (
          <div
            role="tabpanel"
            id="merch-panel-gwp"
            aria-labelledby="merch-tab-gwp"
            className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start"
          >
            {/* Left / Primary Column: GWP Configuration Form */}
            <form
              onSubmit={handleSaveGwp}
              className="xl:col-span-7 space-y-5"
            >
              {/* Master Enable / Disable GWP Card */}
              <div
                className={`glass-card rounded-3xl p-5 sm:p-6 border transition-colors ${
                  draftGwp.enabled
                    ? 'border-pink-400/40 shadow-[0_0_32px_rgba(244,114,182,0.12)]'
                    : 'border-white/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                        draftGwp.enabled
                          ? 'bg-gradient-to-br from-pink-500/25 via-purple-500/25 to-cyan-500/20 border-pink-400/40'
                          : 'bg-white/5 border-white/15'
                      }`}
                    >
                      <Gift
                        className={`w-6 h-6 ${
                          draftGwp.enabled ? 'text-pink-300' : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-lg font-extrabold text-white">
                          {isAr
                            ? 'تفعيل هدية كورة Bub المجانية مع الطلب'
                            : 'Free Bub Plush Ball Gift-With-Purchase'}
                        </h2>
                        <Badge
                          dir="ltr"
                          className={
                            draftGwp.enabled
                              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 text-[11px] font-bold rounded-full'
                              : 'bg-slate-500/20 text-slate-300 border border-slate-400/30 text-[11px] font-bold rounded-full'
                          }
                        >
                          {draftGwp.enabled ? 'ON' : 'OFF'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300/85 leading-relaxed">
                        {isAr
                          ? 'عند التفعيل، يظهر شريط التقدم الذكي في السلة وتُضاف الهدية تلقائياً بسعر 0 فور استيفاء الشرط دون التأثير على خصومات الكتب.'
                          : 'When enabled, Cart Drawer displays a live unlock progress bar and automatically adds the complimentary gift at 0 cost without inflating book volume discounts.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    <Label
                      htmlFor="gwp-master-switch"
                      className="text-xs font-bold text-slate-200 cursor-pointer"
                    >
                      {draftGwp.enabled
                        ? isAr
                          ? 'مُفعّلة'
                          : 'Enabled'
                        : isAr
                          ? 'متوقفة'
                          : 'Paused'}
                    </Label>
                    <Switch
                      id="gwp-master-switch"
                      checked={draftGwp.enabled}
                      onCheckedChange={(checked) =>
                        setDraftGwp((prev) => ({ ...prev, enabled: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Gift Product Selection & Titles */}
              <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-cyan-300 shrink-0" />
                  <h3 className="text-base font-bold text-white">
                    {isAr ? 'منتج الهدية ورمز الـ SKU' : 'Gift Product & Display Details'}
                  </h3>
                </div>

                {/* Selected Gift Preview + Dropdown */}
                <div className="glass-card-inner rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center">
                  <img
                    src={draftGwp.coverImage || '/artwork/merch-plush.webp'}
                    alt={isAr ? draftGwp.titleAr : draftGwp.titleEn}
                    className="w-24 h-24 rounded-2xl object-cover border border-pink-400/35 shrink-0 bg-slate-950"
                  />
                  <div className="flex-1 w-full space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="gwp-gift-select" className="text-xs text-slate-200">
                          {isAr ? 'اختر منتج الهدية من الكتالوج' : 'Select Gift Product'}
                        </Label>
                        <Select
                          value={draftGwp.giftMerchId}
                          onValueChange={handleSelectGwpProduct}
                        >
                          <SelectTrigger
                            id="gwp-gift-select"
                            className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-white text-xs"
                          >
                            <SelectValue
                              placeholder={
                                isAr ? 'اختر منتج الهدية' : 'Choose gift SKU'
                              }
                            />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0b1024] border-white/15 text-white">
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {isAr ? product.nameAr : product.nameEn} ({product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="gwp-sku-input" className="text-xs text-slate-200">
                          {isAr ? 'رمز SKU للهدية' : 'Gift Fulfillment SKU'}
                        </Label>
                        <Input
                          id="gwp-sku-input"
                          dir="ltr"
                          value={draftGwp.giftSku}
                          onChange={(e) =>
                            setDraftGwp((prev) => ({
                              ...prev,
                              giftSku: e.target.value.toUpperCase(),
                            }))
                          }
                          className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-cyan-200 font-mono text-xs text-left"
                        />
                      </div>
                    </div>

                    {selectedGwpProduct && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span>
                          {isAr ? 'المخزون المتاح حالياً:' : 'Current stock:'}{' '}
                          <strong
                            className={`font-numeric ${
                              selectedGwpProduct.stockCount <= LOW_STOCK_THRESHOLD
                                ? 'text-amber-300'
                                : 'text-emerald-300'
                            }`}
                          >
                            {formatNumber(selectedGwpProduct.stockCount)}
                          </strong>
                        </span>
                        <span>·</span>
                        <span dir="ltr" className="font-mono text-slate-300">
                          {draftGwp.coverImage}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Custom Bilingual Gift Title & Variant Labels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="gwp-title-ar" className="text-xs text-slate-200">
                      {isAr ? 'عنوان الهدية بالعربية *' : 'Arabic Gift Title *'}
                    </Label>
                    <Input
                      id="gwp-title-ar"
                      required
                      dir="rtl"
                      value={draftGwp.titleAr}
                      onChange={(e) =>
                        setDraftGwp((prev) => ({ ...prev, titleAr: e.target.value }))
                      }
                      className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-white text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gwp-title-en" className="text-xs text-slate-200">
                      {isAr ? 'عنوان الهدية بالإنجليزية *' : 'English Gift Title *'}
                    </Label>
                    <Input
                      id="gwp-title-en"
                      required
                      dir="ltr"
                      value={draftGwp.titleEn}
                      onChange={(e) =>
                        setDraftGwp((prev) => ({ ...prev, titleEn: e.target.value }))
                      }
                      className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-white text-sm text-left"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gwp-variant-ar" className="text-xs text-slate-300">
                      {isAr ? 'وصف المقاس بالعربية' : 'Arabic Variant Label'}
                    </Label>
                    <Input
                      id="gwp-variant-ar"
                      dir="rtl"
                      value={draftGwp.variantLabelAr}
                      onChange={(e) =>
                        setDraftGwp((prev) => ({
                          ...prev,
                          variantLabelAr: e.target.value,
                        }))
                      }
                      className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gwp-variant-en" className="text-xs text-slate-300">
                      {isAr ? 'وصف المقاس بالإنجليزية' : 'English Variant Label'}
                    </Label>
                    <Input
                      id="gwp-variant-en"
                      dir="ltr"
                      value={draftGwp.variantLabelEn}
                      onChange={(e) =>
                        setDraftGwp((prev) => ({
                          ...prev,
                          variantLabelEn: e.target.value,
                        }))
                      }
                      className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-white text-xs text-left"
                    />
                  </div>
                </div>
              </div>

              {/* Trigger Mode & Thresholds */}
              <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-5">
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="w-5 h-5 text-purple-300 shrink-0" />
                  <h3 className="text-base font-bold text-white">
                    {isAr ? 'شروط فتح الهدية والحد الأدنى' : 'Trigger Mode & Thresholds'}
                  </h3>
                </div>

                {/* Trigger Mode Radio Cards */}
                <div
                  role="radiogroup"
                  aria-label={isAr ? 'طريقة تفعيل الهدية' : 'GWP trigger mode'}
                  className="grid grid-cols-1 gap-2.5"
                >
                  {TRIGGER_MODES.map((mode) => {
                    const selected = draftGwp.triggerMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() =>
                          setDraftGwp((prev) => ({ ...prev, triggerMode: mode.id }))
                        }
                        className={`w-full text-start p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          selected
                            ? 'bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-pink-500/10 border-cyan-400/45 text-white'
                            : 'bg-slate-950/60 border-white/10 text-slate-300 hover:border-white/25'
                        }`}
                      >
                        <div
                          className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selected ? 'border-cyan-400' : 'border-slate-500'
                          }`}
                        >
                          {selected && (
                            <span className="h-2 w-2 rounded-full bg-cyan-300" />
                          )}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="text-sm font-bold text-white">
                            {isAr ? mode.titleAr : mode.titleEn}
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {isAr ? mode.descAr : mode.descEn}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Threshold Numeric Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="gwp-min-books" className="text-xs text-slate-200">
                      {isAr ? 'الحد الأدنى للكتب' : 'Min Books'}
                    </Label>
                    <Input
                      id="gwp-min-books"
                      type="number"
                      min={1}
                      max={20}
                      dir="ltr"
                      value={draftGwp.minBooks}
                      onChange={(e) =>
                        setDraftGwp((prev) => ({
                          ...prev,
                          minBooks: Math.max(1, parseNonNegativeNumber(e.target.value, 1)),
                        }))
                      }
                      className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-white font-numeric text-sm text-left"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gwp-sub-egp" className="text-xs text-slate-200">
                      {isAr ? 'الحد الأدنى (EGP)' : 'Min Subtotal EGP'}
                    </Label>
                    <Input
                      id="gwp-sub-egp"
                      type="number"
                      min={0}
                      dir="ltr"
                      value={draftGwp.minSubtotalEgp}
                      onChange={(e) =>
                        setDraftGwp((prev) => ({
                          ...prev,
                          minSubtotalEgp: parseNonNegativeNumber(e.target.value, 0),
                        }))
                      }
                      className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-cyan-200 font-numeric text-sm text-left"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gwp-sub-sar" className="text-xs text-slate-200">
                      {isAr ? 'الحد الأدنى (SAR)' : 'Min Subtotal SAR'}
                    </Label>
                    <Input
                      id="gwp-sub-sar"
                      type="number"
                      min={0}
                      dir="ltr"
                      value={draftGwp.minSubtotalSar}
                      onChange={(e) =>
                        setDraftGwp((prev) => ({
                          ...prev,
                          minSubtotalSar: parseNonNegativeNumber(e.target.value, 0),
                        }))
                      }
                      className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-white font-numeric text-sm text-left"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="gwp-sub-aed" className="text-xs text-slate-200">
                      {isAr ? 'الحد الأدنى (AED)' : 'Min Subtotal AED'}
                    </Label>
                    <Input
                      id="gwp-sub-aed"
                      type="number"
                      min={0}
                      dir="ltr"
                      value={draftGwp.minSubtotalAed}
                      onChange={(e) =>
                        setDraftGwp((prev) => ({
                          ...prev,
                          minSubtotalAed: parseNonNegativeNumber(e.target.value, 0),
                        }))
                      }
                      className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-purple-200 font-numeric text-sm text-left"
                    />
                  </div>
                </div>

                {/* Displayed Gift Retail Value (3 Currencies) */}
                <div className="glass-card-inner rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      {isAr
                        ? 'القيمة السوقية المعروضة للهدية (تظهر مشطوبة بجانب «مجاناً»)'
                        : 'Displayed Gift Retail Value (shown struck-through next to FREE)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="gwp-val-egp" className="text-xs text-slate-300">
                        {isAr ? 'القيمة بمصر (EGP)' : 'Retail Value (EGP)'}
                      </Label>
                      <Input
                        id="gwp-val-egp"
                        type="number"
                        min={0}
                        dir="ltr"
                        value={draftGwp.retailValueEgp}
                        onChange={(e) =>
                          setDraftGwp((prev) => ({
                            ...prev,
                            retailValueEgp: parseNonNegativeNumber(e.target.value, 0),
                          }))
                        }
                        className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-cyan-200 font-numeric text-sm text-left"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gwp-val-sar" className="text-xs text-slate-300">
                        {isAr ? 'القيمة بالسعودية (SAR)' : 'Retail Value (SAR)'}
                      </Label>
                      <Input
                        id="gwp-val-sar"
                        type="number"
                        min={0}
                        dir="ltr"
                        value={draftGwp.retailValueSar}
                        onChange={(e) =>
                          setDraftGwp((prev) => ({
                            ...prev,
                            retailValueSar: parseNonNegativeNumber(e.target.value, 0),
                          }))
                        }
                        className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-white font-numeric text-sm text-left"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gwp-val-aed" className="text-xs text-slate-300">
                        {isAr ? 'القيمة بالإمارات (AED)' : 'Retail Value (AED)'}
                      </Label>
                      <Input
                        id="gwp-val-aed"
                        type="number"
                        min={0}
                        dir="ltr"
                        value={draftGwp.retailValueAed}
                        onChange={(e) =>
                          setDraftGwp((prev) => ({
                            ...prev,
                            retailValueAed: parseNonNegativeNumber(e.target.value, 0),
                          }))
                        }
                        className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-purple-200 font-numeric text-sm text-left"
                      />
                    </div>
                  </div>
                </div>

                {/* Save & Reset Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirmResetGwpOpen(true)}
                    className="h-11 px-4 rounded-full border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white text-xs font-semibold gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{isAr ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
                  </Button>

                  <div className="flex items-center gap-3">
                    {isGwpDirty && (
                      <span className="text-xs text-amber-300 font-medium">
                        {isAr ? 'تغييرات غير محفوظة' : 'Unsaved changes'}
                      </span>
                    )}
                    <Button
                      type="submit"
                      className="bubble-btn bubble-btn-primary h-11 px-6 text-xs font-bold gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isAr ? 'حفظ قواعد الهدية' : 'Save Changes'}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </form>

            {/* Right Column: Live GWP Cart Simulator Card */}
            <aside className="xl:col-span-5 xl:sticky xl:top-20 space-y-4">
              <div className="glass-card rounded-3xl p-5 sm:p-6 border border-cyan-400/25 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {isAr ? 'معاينة فورية قبل الحفظ' : 'Live Pre-Save Preview'}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold font-editorial text-white">
                      {isAr ? 'محاكي السلة لهدية كورة Bub' : 'Live GWP Cart Simulator'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isAr
                        ? 'اختبر مخرجات محرك الأهلية الحقيقي على سلة افتراضية لمصر والسعودية والإمارات قبل حفظ التعديلات.'
                        : 'Test real evaluateGwpEligibility() output across Egypt, Saudi Arabia & UAE before hitting Save.'}
                    </p>
                  </div>
                </div>

                {/* Country Selector */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-200">
                    {isAr ? 'دولة العميل وعملة السلة' : 'Customer Country & Currency'}
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { code: 'EG', ar: 'مصر (EGP)', en: 'Egypt (EGP)' },
                        { code: 'SA', ar: 'السعودية (SAR)', en: 'KSA (SAR)' },
                        { code: 'AE', ar: 'الإمارات (AED)', en: 'UAE (AED)' },
                      ] as const
                    ).map((c) => {
                      const active = simCountry === c.code;
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => setSimCountry(c.code)}
                          className={`min-h-[42px] px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            active
                              ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 shadow-[0_0_16px_rgba(0,217,255,0.18)]'
                              : 'bg-slate-950/70 text-slate-300 border-white/10 hover:border-white/25'
                          }`}
                        >
                          {isAr ? c.ar : c.en}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sample Book Count Picker + Slider */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      htmlFor="gwp-sim-book-slider"
                      className="text-xs font-semibold text-slate-200"
                    >
                      {isAr ? 'عدد القصص في السلة' : 'Sample Books in Cart'}
                    </Label>
                    <span
                      dir="ltr"
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold font-numeric bg-purple-500/20 text-purple-200 border border-purple-400/35"
                    >
                      {simBookCount} {isAr ? (simBookCount === 1 ? 'كتاب' : 'كتب') : simBookCount === 1 ? 'book' : 'books'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setSimBookCount(count)}
                        className={`min-h-[40px] rounded-xl text-xs font-bold font-numeric border transition-all cursor-pointer ${
                          simBookCount === count
                            ? 'bg-gradient-to-r from-purple-500/30 to-pink-500/25 text-white border-pink-400/50'
                            : 'bg-slate-950/70 text-slate-300 border-white/10 hover:border-white/25'
                        }`}
                      >
                        {count} {isAr ? (count === 1 ? 'كتاب' : 'كتب') : count === 1 ? 'Book' : 'Books'}
                      </button>
                    ))}
                  </div>

                  <input
                    id="gwp-sim-book-slider"
                    type="range"
                    min={0}
                    max={4}
                    step={1}
                    value={simBookCount}
                    onChange={(e) => setSimBookCount(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                    aria-label={isAr ? 'شريط عدد الكتب التجريبي' : 'Simulated book count slider'}
                  />
                </div>

                {/* Book Format Preset + Optional Merch Item */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-semibold text-slate-200">
                    {isAr ? 'نوع الكتاب التجريبي' : 'Sample Book Edition'}
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(SIM_BOOK_PRESETS) as SimBookPreset[]).map((key) => {
                      const preset = SIM_BOOK_PRESETS[key];
                      const active = simBookPreset === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSimBookPreset(key)}
                          className={`min-h-[44px] px-2 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer text-center ${
                            active
                              ? 'bg-white/15 text-white border-cyan-400/45'
                              : 'bg-slate-950/65 text-slate-400 border-white/10 hover:text-white'
                          }`}
                        >
                          {isAr ? preset.labelAr : preset.labelEn}
                        </button>
                      );
                    })}
                  </div>

                  <label className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/60 border border-white/10 cursor-pointer">
                    <span className="text-xs text-slate-200">
                      {isAr
                        ? '+ إضافة منتج براند تجريبي (أباجورة باب)'
                        : '+ Add sample Merch item (Bub Night Lamp)'}
                    </span>
                    <Switch
                      checked={simIncludeMerch}
                      onCheckedChange={setSimIncludeMerch}
                    />
                  </label>
                </div>

                {/* Live Result Output Box */}
                <div className="space-y-3 pt-1">
                  {!simEvaluation.enabled ? (
                    <div className="rounded-2xl p-4 bg-slate-950/80 border border-white/10 text-center space-y-1">
                      <p className="text-sm font-bold text-slate-300">
                        {isAr ? 'نظام الهدية متوقف حالياً (OFF)' : 'Free Bub GWP is Paused (OFF)'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {isAr
                          ? 'لن يظهر شريط التقدم أو الهدية المجانية للعملاء في السلة.'
                          : 'Customers will not see the GWP progress bar or complimentary gift in Cart.'}
                      </p>
                    </div>
                  ) : simEvaluation.unlocked ? (
                    <div className="rounded-2xl p-4 bg-gradient-to-br from-emerald-500/18 via-cyan-500/12 to-pink-500/15 border border-emerald-400/45 space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={draftGwp.coverImage || '/artwork/merch-plush.webp'}
                          alt=""
                          className="w-14 h-14 rounded-xl object-cover border border-emerald-400/40 shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-extrabold">
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span>
                              {isAr ? 'تم فتح الهدية تلقائياً!' : 'GWP UNLOCKED!'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white line-clamp-1">
                            {isAr ? draftGwp.titleAr : draftGwp.titleEn}
                          </p>
                          <div className="flex items-center gap-2 text-xs" dir="ltr">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 font-extrabold font-numeric">
                              {formatMoney(0, simCountry, isAr ? 'ar' : 'en')}
                            </span>
                            <span className="text-slate-400 line-through font-numeric">
                              {formatMoney(
                                simEvaluation.retailValue,
                                simCountry,
                                isAr ? 'ar' : 'en'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-emerald-100 leading-relaxed">
                        {isAr ? simEvaluation.messageAr : simEvaluation.messageEn}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl p-4 bg-gradient-to-br from-cyan-500/12 via-purple-500/12 to-pink-500/10 border border-cyan-400/35 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-cyan-200">
                          {isAr ? 'شريط التقدم داخل السلة' : 'Cart Drawer Progress Bar'}
                        </span>
                        <span
                          dir="ltr"
                          className="text-xs font-extrabold font-numeric text-white"
                        >
                          {simEvaluation.progressPercent}%
                        </span>
                      </div>

                      <div className="h-2.5 w-full rounded-full bg-slate-950/90 overflow-hidden border border-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 transition-all duration-300"
                          style={{ width: `${simEvaluation.progressPercent}%` }}
                        />
                      </div>

                      <p className="text-xs text-slate-100 leading-relaxed">
                        {isAr ? simEvaluation.messageAr : simEvaluation.messageEn}
                      </p>
                    </div>
                  )}

                  {/* Raw Engine Diagnostics */}
                  <div
                    dir="ltr"
                    className="glass-card-inner rounded-2xl p-3 grid grid-cols-2 gap-2.5 text-xs font-numeric"
                  >
                    <div>
                      <span className="block text-[10px] text-slate-400">Paid Subtotal</span>
                      <span className="font-bold text-white">
                        {formatMoney(simEvaluation.paidSubtotal, simCountry, 'en')}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">Country Threshold</span>
                      <span className="font-bold text-cyan-300">
                        {formatMoney(simEvaluation.thresholdSubtotal, simCountry, 'en')}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">Remaining Amount</span>
                      <span className="font-bold text-amber-200">
                        {formatMoney(simEvaluation.remainingAmount, simCountry, 'en')}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">Remaining Books</span>
                      <span className="font-bold text-purple-200">
                        {formatNumber(simEvaluation.remainingBooks)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guardrail Info Note */}
              <div className="glass-card-inner rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {isAr
                    ? 'حماية الهوامش مفعّلة تلقائياً: هدية كورة Bub المجانية لا تُحتسب أبداً ضمن عدد الكتب المؤهل لخصم الأخوة (15%/25%) ولا ضمن الشحن المجاني.'
                    : 'Margin guardrail active: complimentary GWP gifts are strictly excluded from sibling book volume discounts and paid subtotal thresholds.'}
                </p>
              </div>
            </aside>
          </div>
        )}

        {/* ================================================================
            ADD / EDIT MERCH PRODUCT DIALOG
           ================================================================ */}
        <Dialog
          open={Boolean(editing)}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        >
          <DialogContent
            dir={isRTL ? 'rtl' : 'ltr'}
            className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0b1024]/95 backdrop-blur-2xl border border-cyan-400/25 text-white shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
          >
            {editing && (
              <form onSubmit={handleSaveProduct} className="space-y-5">
                <DialogHeader className="text-start">
                  <DialogTitle className="text-xl font-extrabold font-editorial flex items-center gap-2.5">
                    <Package className="w-5 h-5 text-cyan-400" />
                    <span>
                      {isNewProduct
                        ? isAr
                          ? 'إضافة منتج براند جديد'
                          : 'Add New Merch Product'
                        : isAr
                          ? `تعديل: ${editing.nameAr || editing.nameEn}`
                          : `Edit: ${editing.nameEn || editing.nameAr}`}
                    </span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400 text-start">
                    {isAr
                      ? 'تُحفظ التعديلات محلياً وتنعكس فوراً في متجر البراند (/merch) وصفحة المنتج والسلة.'
                      : 'Updates persist locally and reflect immediately across /merch, product pages, and cart.'}
                  </DialogDescription>
                </DialogHeader>

                {/* Cover Image Path & Verified Presets */}
                <div className="glass-card-inner rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <img
                      src={editing.coverImage || '/artwork/merch-plush.webp'}
                      alt={isAr ? 'معاينة صورة المنتج' : 'Product preview'}
                      className="w-24 h-24 rounded-2xl object-cover border border-cyan-400/35 shrink-0 bg-slate-950"
                    />
                    <div className="flex-1 w-full space-y-2.5">
                      <Label htmlFor="merch-image-path" className="text-xs text-slate-200">
                        {isAr ? 'مسار صورة المنتج (من مجلد public)' : 'Product Image Path'}
                      </Label>
                      <Input
                        id="merch-image-path"
                        dir="ltr"
                        value={editing.coverImage}
                        onChange={(e) =>
                          setEditing({ ...editing, coverImage: e.target.value })
                        }
                        placeholder="/artwork/merch-plush.webp"
                        className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-xs text-white text-left"
                      />
                      <div className="flex items-center gap-2 flex-wrap pt-0.5">
                        <span className="text-[11px] text-slate-400">
                          {isAr ? 'صور براند جاهزة:' : 'Verified presets:'}
                        </span>
                        {PRESET_MERCH_IMAGES.map((imgPath) => (
                          <button
                            key={imgPath}
                            type="button"
                            onClick={() =>
                              setEditing({ ...editing, coverImage: imgPath })
                            }
                            aria-label={imgPath}
                            className={`w-9 h-9 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                              editing.coverImage === imgPath
                                ? 'border-cyan-400 scale-105'
                                : 'border-white/10 opacity-75 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={imgPath}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Names, SKU & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="merch-name-ar" className="text-xs text-slate-200">
                      {isAr ? 'اسم المنتج بالعربية *' : 'Arabic Name *'}
                    </Label>
                    <Input
                      id="merch-name-ar"
                      required
                      dir="rtl"
                      value={editing.nameAr}
                      onChange={(e) =>
                        setEditing({ ...editing, nameAr: e.target.value })
                      }
                      placeholder="كورة باب القطيفة المتلألئة"
                      className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-white text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="merch-name-en" className="text-xs text-slate-200">
                      {isAr ? 'اسم المنتج بالإنجليزية *' : 'English Name *'}
                    </Label>
                    <Input
                      id="merch-name-en"
                      required
                      dir="ltr"
                      value={editing.nameEn}
                      onChange={(e) =>
                        setEditing({ ...editing, nameEn: e.target.value })
                      }
                      placeholder="Official Bub Iridescent Plush Ball"
                      className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-white text-sm text-left"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="merch-sku" className="text-xs text-slate-200">
                      {isAr ? 'رمز SKU *' : 'Product SKU *'}
                    </Label>
                    <Input
                      id="merch-sku"
                      required
                      dir="ltr"
                      value={editing.sku}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          sku: e.target.value.toUpperCase(),
                        })
                      }
                      className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-cyan-200 font-mono text-xs text-left"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="merch-category" className="text-xs text-slate-200">
                      {isAr ? 'التصنيف' : 'Category'}
                    </Label>
                    <Select
                      value={editing.category}
                      onValueChange={(value) =>
                        setEditing({
                          ...editing,
                          category: value as MerchCategory,
                        })
                      }
                    >
                      <SelectTrigger
                        id="merch-category"
                        className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-white text-xs"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0b1024] border-white/15 text-white">
                        {MERCH_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {isAr ? cat.labelAr : cat.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="merch-tagline-ar" className="text-xs text-slate-300">
                      {isAr ? 'سطر تسويقي بالعربية' : 'Arabic Tagline'}
                    </Label>
                    <Input
                      id="merch-tagline-ar"
                      dir="rtl"
                      value={editing.taglineAr}
                      onChange={(e) =>
                        setEditing({ ...editing, taglineAr: e.target.value })
                      }
                      className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="merch-tagline-en" className="text-xs text-slate-300">
                      {isAr ? 'سطر تسويقي بالإنجليزية' : 'English Tagline'}
                    </Label>
                    <Input
                      id="merch-tagline-en"
                      dir="ltr"
                      value={editing.taglineEn}
                      onChange={(e) =>
                        setEditing({ ...editing, taglineEn: e.target.value })
                      }
                      className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-white text-xs text-left"
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="merch-desc-ar" className="text-xs text-slate-300">
                      {isAr ? 'الوصف بالعربية' : 'Arabic Description'}
                    </Label>
                    <Textarea
                      id="merch-desc-ar"
                      dir="rtl"
                      rows={2}
                      value={editing.descriptionAr}
                      onChange={(e) =>
                        setEditing({ ...editing, descriptionAr: e.target.value })
                      }
                      className="rounded-xl bg-slate-950/85 border-white/15 text-white text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="merch-desc-en" className="text-xs text-slate-300">
                      {isAr ? 'الوصف بالإنجليزية' : 'English Description'}
                    </Label>
                    <Textarea
                      id="merch-desc-en"
                      dir="ltr"
                      rows={2}
                      value={editing.descriptionEn}
                      onChange={(e) =>
                        setEditing({ ...editing, descriptionEn: e.target.value })
                      }
                      className="rounded-xl bg-slate-950/85 border-white/15 text-white text-xs text-left"
                    />
                  </div>
                </div>

                {/* 3-Currency Prices & Compare-At Prices */}
                <div className="glass-card-inner rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-200">
                    {isAr
                      ? 'التسعير بالـ 3 عملات والأسعار قبل الخصم (اختياري)'
                      : '3-Currency Pricing & Compare-At Prices (Optional)'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="merch-price-egp" className="text-xs text-slate-200">
                        {isAr ? 'السعر (EGP)' : 'Price EGP'}
                      </Label>
                      <Input
                        id="merch-price-egp"
                        type="number"
                        min={0}
                        dir="ltr"
                        value={editing.priceEgp}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            priceEgp: parseNonNegativeNumber(e.target.value, 0),
                          })
                        }
                        className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-cyan-200 font-numeric text-sm text-left"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="merch-price-sar" className="text-xs text-slate-200">
                        {isAr ? 'السعر (SAR)' : 'Price SAR'}
                      </Label>
                      <Input
                        id="merch-price-sar"
                        type="number"
                        min={0}
                        dir="ltr"
                        value={editing.priceSar}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            priceSar: parseNonNegativeNumber(e.target.value, 0),
                          })
                        }
                        className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-white font-numeric text-sm text-left"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="merch-price-aed" className="text-xs text-slate-200">
                        {isAr ? 'السعر (AED)' : 'Price AED'}
                      </Label>
                      <Input
                        id="merch-price-aed"
                        type="number"
                        min={0}
                        dir="ltr"
                        value={editing.priceAed}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            priceAed: parseNonNegativeNumber(e.target.value, 0),
                          })
                        }
                        className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-purple-200 font-numeric text-sm text-left"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="merch-cmp-egp" className="text-xs text-slate-400">
                        {isAr ? 'قبل الخصم (EGP)' : 'Compare-At EGP'}
                      </Label>
                      <Input
                        id="merch-cmp-egp"
                        type="number"
                        min={0}
                        dir="ltr"
                        value={editing.compareAtEgp ?? ''}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            compareAtEgp: parseOptionalNumber(e.target.value),
                          })
                        }
                        placeholder="—"
                        className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-slate-300 font-numeric text-xs text-left"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="merch-cmp-sar" className="text-xs text-slate-400">
                        {isAr ? 'قبل الخصم (SAR)' : 'Compare-At SAR'}
                      </Label>
                      <Input
                        id="merch-cmp-sar"
                        type="number"
                        min={0}
                        dir="ltr"
                        value={editing.compareAtSar ?? ''}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            compareAtSar: parseOptionalNumber(e.target.value),
                          })
                        }
                        placeholder="—"
                        className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-slate-300 font-numeric text-xs text-left"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="merch-cmp-aed" className="text-xs text-slate-400">
                        {isAr ? 'قبل الخصم (AED)' : 'Compare-At AED'}
                      </Label>
                      <Input
                        id="merch-cmp-aed"
                        type="number"
                        min={0}
                        dir="ltr"
                        value={editing.compareAtAed ?? ''}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            compareAtAed: parseOptionalNumber(e.target.value),
                          })
                        }
                        placeholder="—"
                        className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-slate-300 font-numeric text-xs text-left"
                      />
                    </div>
                  </div>
                </div>

                {/* Stock Count & Feature Switches */}
                <div className="glass-card-inner rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                  <div className="space-y-1.5">
                    <Label htmlFor="merch-stock-count" className="text-xs text-slate-200">
                      {isAr ? 'كمية المخزون' : 'Stock Count'}
                    </Label>
                    <Input
                      id="merch-stock-count"
                      type="number"
                      min={0}
                      dir="ltr"
                      value={editing.stockCount}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          stockCount: parseNonNegativeNumber(e.target.value, 0),
                        })
                      }
                      className="h-10 rounded-xl bg-slate-950/85 border-white/15 text-white font-numeric text-sm text-left"
                    />
                  </div>

                  <label className="flex items-center justify-between gap-2 text-xs text-slate-200 cursor-pointer pt-4 sm:pt-5">
                    <span>{isAr ? 'متوفر بالمتجر' : 'In Stock'}</span>
                    <Switch
                      checked={editing.inStock}
                      onCheckedChange={(checked) =>
                        setEditing({ ...editing, inStock: checked })
                      }
                    />
                  </label>

                  <label className="flex items-center justify-between gap-2 text-xs text-slate-200 cursor-pointer pt-1 sm:pt-5">
                    <span>{isAr ? 'منتج مميز' : 'Featured'}</span>
                    <Switch
                      checked={Boolean(editing.featured)}
                      onCheckedChange={(checked) =>
                        setEditing({ ...editing, featured: checked })
                      }
                    />
                  </label>

                  <label className="flex items-center justify-between gap-2 text-xs text-slate-200 cursor-pointer pt-1 sm:pt-5">
                    <span>{isAr ? 'شريط باسم الطفل' : 'Ribbon Name'}</span>
                    <Switch
                      checked={Boolean(editing.allowsRibbonName)}
                      onCheckedChange={(checked) =>
                        setEditing({ ...editing, allowsRibbonName: checked })
                      }
                    />
                  </label>
                </div>

                {/* Variants Summary & Quick Editor */}
                <div className="glass-card-inner rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                      <Layers className="w-4 h-4" />
                      <span>
                        {isAr
                          ? `المقاسات والإصدارات (${editing.variants.length})`
                          : `Variants & Sizes (${editing.variants.length})`}
                      </span>
                    </h4>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAddVariant}
                      className="h-8 px-3 rounded-full border-purple-400/35 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 text-[11px] gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إضافة مقاس' : 'Add Variant'}</span>
                    </Button>
                  </div>

                  <div className="space-y-2.5">
                    {editing.variants.map((variant, idx) => (
                      <div
                        key={variant.id}
                        className="p-3 rounded-xl bg-slate-950/75 border border-white/10 space-y-2.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Input
                            dir="rtl"
                            value={variant.labelAr}
                            onChange={(e) =>
                              handleVariantChange(idx, { labelAr: e.target.value })
                            }
                            placeholder={isAr ? 'اسم المقاس بالعربية' : 'Arabic variant label'}
                            aria-label={`Variant ${idx + 1} Arabic label`}
                            className="h-9 rounded-lg bg-slate-900/90 border-white/10 text-xs text-white"
                          />
                          <Input
                            dir="ltr"
                            value={variant.labelEn}
                            onChange={(e) =>
                              handleVariantChange(idx, { labelEn: e.target.value })
                            }
                            placeholder="English variant label"
                            aria-label={`Variant ${idx + 1} English label`}
                            className="h-9 rounded-lg bg-slate-900/90 border-white/10 text-xs text-white text-left"
                          />
                          <div className="flex items-center gap-1.5">
                            <Input
                              dir="ltr"
                              value={variant.sku}
                              onChange={(e) =>
                                handleVariantChange(idx, {
                                  sku: e.target.value.toUpperCase(),
                                })
                              }
                              placeholder="SKU"
                              aria-label={`Variant ${idx + 1} SKU`}
                              className="h-9 rounded-lg bg-slate-900/90 border-white/10 text-xs font-mono text-cyan-200 text-left"
                            />
                            {editing.variants.length > 1 && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveVariant(idx)}
                                aria-label={isAr ? 'حذف المقاس' : 'Remove variant'}
                                className="h-9 w-9 p-0 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/15 shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2" dir="ltr">
                          <Input
                            type="number"
                            min={0}
                            value={variant.priceEgp}
                            onChange={(e) =>
                              handleVariantChange(idx, {
                                priceEgp: parseNonNegativeNumber(e.target.value, 0),
                              })
                            }
                            aria-label={`Variant ${idx + 1} EGP price`}
                            placeholder="EGP"
                            className="h-8 rounded-lg bg-slate-900/90 border-white/10 text-xs font-numeric text-cyan-200 text-left"
                          />
                          <Input
                            type="number"
                            min={0}
                            value={variant.priceSar}
                            onChange={(e) =>
                              handleVariantChange(idx, {
                                priceSar: parseNonNegativeNumber(e.target.value, 0),
                              })
                            }
                            aria-label={`Variant ${idx + 1} SAR price`}
                            placeholder="SAR"
                            className="h-8 rounded-lg bg-slate-900/90 border-white/10 text-xs font-numeric text-white text-left"
                          />
                          <Input
                            type="number"
                            min={0}
                            value={variant.priceAed}
                            onChange={(e) =>
                              handleVariantChange(idx, {
                                priceAed: parseNonNegativeNumber(e.target.value, 0),
                              })
                            }
                            aria-label={`Variant ${idx + 1} AED price`}
                            placeholder="AED"
                            className="h-8 rounded-lg bg-slate-900/90 border-white/10 text-xs font-numeric text-purple-200 text-left"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(null)}
                    className="h-10 px-5 rounded-full border-white/15 bg-white/5 text-slate-200 hover:bg-white/10 text-xs"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </Button>
                  <Button
                    type="submit"
                    className="bubble-btn bubble-btn-primary h-10 px-6 text-xs font-bold gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {isNewProduct
                        ? isAr
                          ? 'إضافة المنتج للمتجر'
                          : 'Create Merch Product'
                        : isAr
                          ? 'حفظ التعديلات'
                          : 'Save Changes'}
                    </span>
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirm Delete Product Dialog */}
        <Dialog
          open={Boolean(confirmDelete)}
          onOpenChange={(open) => {
            if (!open) setConfirmDelete(null);
          }}
        >
          <DialogContent
            dir={isRTL ? 'rtl' : 'ltr'}
            className="max-w-md rounded-3xl bg-[#0b1024]/95 backdrop-blur-2xl border border-red-400/30 text-white"
          >
            <DialogHeader className="text-start">
              <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-red-200">
                <Trash2 className="w-5 h-5 text-red-400" />
                <span>{isAr ? 'حذف المنتج من المتجر؟' : 'Delete Merch Product?'}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300 text-start pt-1">
                {confirmDelete &&
                  (isAr
                    ? `سيتم حذف «${confirmDelete.nameAr}» (${confirmDelete.sku}) من قائمة المنتجات المعروضة.`
                    : `This will remove "${confirmDelete.nameEn}" (${confirmDelete.sku}) from the live Merch storefront.`)}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-end gap-2.5 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmDelete(null)}
                className="h-10 px-4 rounded-full border-white/15 bg-white/5 text-slate-200 text-xs"
              >
                {isAr ? 'تراجع' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="h-10 px-5 rounded-full bg-red-500/85 hover:bg-red-500 text-white text-xs font-bold gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isAr ? 'تأكيد الحذف' : 'Delete Product'}</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirm Reset Catalog Dialog */}
        <Dialog
          open={confirmResetCatalogOpen}
          onOpenChange={setConfirmResetCatalogOpen}
        >
          <DialogContent
            dir={isRTL ? 'rtl' : 'ltr'}
            className="max-w-md rounded-3xl bg-[#0b1024]/95 backdrop-blur-2xl border border-amber-400/30 text-white"
          >
            <DialogHeader className="text-start">
              <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-amber-200">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <span>
                  {isAr ? 'استعادة التشكيلة الافتراضية؟' : 'Reset Default Collection?'}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300 text-start pt-1">
                {isAr
                  ? 'سيتم استرجاع جميع منتجات بابل فيرس الستة الأصلية بأسعارها ومخزونها الافتراضي.'
                  : 'This restores the 6 default Bubbleverse Merch SKUs with their original pricing and stock counts.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-end gap-2.5 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmResetCatalogOpen(false)}
                className="h-10 px-4 rounded-full border-white/15 bg-white/5 text-slate-200 text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={handleConfirmResetCatalog}
                className="h-10 px-5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isAr ? 'استعادة الآن' : 'Reset Collection'}</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirm Reset GWP Defaults Dialog */}
        <Dialog open={confirmResetGwpOpen} onOpenChange={setConfirmResetGwpOpen}>
          <DialogContent
            dir={isRTL ? 'rtl' : 'ltr'}
            className="max-w-md rounded-3xl bg-[#0b1024]/95 backdrop-blur-2xl border border-pink-400/30 text-white"
          >
            <DialogHeader className="text-start">
              <DialogTitle className="text-lg font-extrabold flex items-center gap-2 text-pink-200">
                <RotateCcw className="w-5 h-5 text-pink-400" />
                <span>
                  {isAr ? 'استعادة قواعد هدية Bub الافتراضية؟' : 'Reset Free Bub GWP Rules?'}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300 text-start pt-1">
                {isAr
                  ? 'ستعود القواعد إلى كورة باب ميني 12 سم (2 كتب أو 700 ج.م / 155 ر.س / 155 د.إ).'
                  : 'Restores Mini 12cm Bub Plush Ball defaults (2 books OR 700 EGP / 155 SAR / 155 AED).'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-end gap-2.5 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmResetGwpOpen(false)}
                className="h-10 px-4 rounded-full border-white/15 bg-white/5 text-slate-200 text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={handleConfirmResetGwp}
                className="h-10 px-5 rounded-full bg-pink-500 hover:bg-pink-400 text-white text-xs font-bold gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isAr ? 'استعادة الافتراضي' : 'Reset Defaults'}</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

export default AdminMerch;
