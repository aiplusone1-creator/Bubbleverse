import { supabase } from '@/integrations/supabase/client';

export type OrderCountry = 'EG' | 'SA';
export type OrderFormat = 'digital_pdf' | 'hardcopy_book';
export type OrderLanguage = 'ar' | 'en';

export interface StoryInquiry {
  requestKey: string;
  country: OrderCountry;
  format: OrderFormat;
  language: OrderLanguage;
  childFirstName: string;
  shippingAddress: string | null;
}

export interface OrderQuote {
  currency: 'EGP' | 'SAR';
  version: number | null;
  totalMinor: number | null;
  depositMinor: number | null;
  checkoutEnabled: false;
}

export interface OrderAcknowledgment {
  id: string;
  reference: string;
  country: OrderCountry;
  format: OrderFormat;
  currency: OrderQuote['currency'];
  status: string;
}

export async function getOrderQuote(country: OrderCountry, format: OrderFormat): Promise<OrderQuote> {
  const { data, error } = await supabase.rpc('get_story_order_quote', { p_country: country, p_format: format });
  if (error) throw error;
  return data as unknown as OrderQuote;
}

export async function createStoryInquiry(input: StoryInquiry): Promise<OrderAcknowledgment> {
  const { data, error } = await supabase.rpc('create_story_inquiry', {
    p_request_key: input.requestKey,
    p_country: input.country,
    p_format: input.format,
    p_language: input.language,
    p_child_first_name: input.childFirstName,
    p_shipping_address: input.shippingAddress,
  });
  if (error) throw error;
  return data as unknown as OrderAcknowledgment;
}
