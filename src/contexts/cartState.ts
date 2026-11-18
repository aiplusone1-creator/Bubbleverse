import { createContext } from 'react';
import type { CartItem } from '@/types/cart';
import type { CurrencyCountry } from '@/features/commerce/pricingEngine';
import type {
  GwpConfigRecord,
  GwpEligibilityResult,
} from '@/features/commerce/gwpEngine';
import type { MerchProduct, MerchVariant } from '@/features/merch/merchCatalog';

export type CartItemAddonUpdates = Partial<
  Pick<
    CartItem,
    | 'hasColoringBookAddon'
    | 'hasGiftBoxAddon'
    | 'hasStickersAddon'
    | 'hasAudioStoryAddon'
    | 'hasCoHeroAddon'
  >
>;

export interface ApplyPromoResult {
  ok: boolean;
  percent?: number;
  reasonAr?: string;
  reasonEn?: string;
}

export interface AddMerchItemInput {
  product: MerchProduct;
  variant?: MerchVariant;
  quantity?: number;
  ribbonName?: string;
}

export interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  isCheckoutOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  openCheckout: (directItem?: CartItem) => void;
  closeCheckout: () => void;
  addItem: (item: Omit<CartItem, 'id' | 'createdAt'>) => void;
  addMerchItem: (input: AddMerchItemInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemAddons: (id: string, addons: CartItemAddonUpdates) => void;
  clearCart: () => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  gwpConfig: GwpConfigRecord;
  getGwpStatus: (country: CurrencyCountry) => GwpEligibilityResult;
  buildFreeGiftItem: () => CartItem;
  totalItems: number;
  subtotalEgp: number;
  subtotalSar: number;
  subtotalAed: number;
  volumeDiscountPercent: number;
  promoCode: string | null;
  promoDiscountPercent: number;
  applyPromoCode: (code: string) => ApplyPromoResult;
  clearPromoCode: () => void;
  totalEgp: number;
  totalSar: number;
  totalAed: number;
  checkoutItem: CartItem | null;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);
