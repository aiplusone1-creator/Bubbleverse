import { supabase } from '@/integrations/supabase/client';

export type OrderCountry = 'EG' | 'SA';
export type OrderFormat = 'digital_pdf' | 'hardcopy_book';
export type OrderLanguage = 'ar' | 'en';

export type OrderStoryConfiguration = {
  storyLength: 'short' | 'medium' | 'epic';
  storyFormat: 'comic' | 'storyboard';
  artStyle: 'disney' | 'pixar' | 'watercolor' | 'anime' | 'realistic' | 'comic' | 'pastel' | 'horror' | 'custom';
  customArtStyle: string;
  plotMode: 'auto' | 'manual';
  customPlot: string;
  characters: { name: string; role: 'hero' | 'parent' | 'pet' | 'friend' }[];
  interests: string[];
};

export interface StoryInquiry {
  requestKey: string;
  country: OrderCountry;
  format: OrderFormat;
  language: OrderLanguage;
  childFirstName: string;
  shippingAddress: string | null;
  story: OrderStoryConfiguration;
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

export interface StoryInquiryDetail extends OrderAcknowledgment {
  language: OrderLanguage;
  childFirstName: string;
  shippingAddress: string | null;
  story: OrderStoryConfiguration | null;
  editable: boolean;
  photoUploadEnabled: false;
  correctionRequest: string | null;
  paymentStatus: 'unpaid' | 'verification_pending' | 'paid';
  generationStatus: 'idle' | 'running' | 'failed' | 'complete';
  fulfillmentStatus: 'pending' | 'printing' | 'shipping' | 'delivered';
  priceVersion: number | null;
  totalMinor: number | null;
  depositMinor: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface StoryInquirySummary {
  id: string;
  reference: string;
  country: OrderCountry;
  format: OrderFormat;
  status: string;
  payment_status: StoryInquiryDetail['paymentStatus'];
  generation_status: StoryInquiryDetail['generationStatus'];
  fulfillment_status: StoryInquiryDetail['fulfillmentStatus'];
  correction_request: string | null;
  created_at: string;
}

export async function validateOrderStory(story: OrderStoryConfiguration): Promise<OrderStoryConfiguration> {
  const { data, error } = await supabase.rpc('validate_order_story', { p_story: story });
  if (error) throw error;
  return data as OrderStoryConfiguration;
}

export async function createStoryInquiry(input: StoryInquiry): Promise<OrderAcknowledgment> {
  const { data, error } = await supabase.rpc('submit_story_inquiry', {
    p_request_key: input.requestKey,
    p_country: input.country,
    p_format: input.format,
    p_language: input.language,
    p_child_first_name: input.childFirstName,
    p_shipping_address: input.shippingAddress,
    p_story: input.story,
  });
  if (error) throw error;
  return data as unknown as OrderAcknowledgment;
}

export async function listStoryInquiries(before?: string): Promise<StoryInquirySummary[]> {
  const { data, error } = await supabase.rpc('list_story_orders', { p_before: before });
  if (error) throw error;
  return data as unknown as StoryInquirySummary[];
}

export async function resumeStoryInquiry(orderId: string): Promise<StoryInquiryDetail> {
  const { data, error } = await supabase.rpc('resume_story_inquiry', { p_order_id: orderId });
  if (error) throw error;
  return data as unknown as StoryInquiryDetail;
}

export async function updateStoryInquiry(input: Pick<StoryInquiry, 'childFirstName' | 'shippingAddress' | 'story'> & {
  orderId: string;
  expectedUpdatedAt: string;
}): Promise<StoryInquiryDetail> {
  const { data, error } = await supabase.rpc('update_story_inquiry', {
    p_order_id: input.orderId,
    p_expected_updated_at: input.expectedUpdatedAt,
    p_child_first_name: input.childFirstName,
    p_shipping_address: input.shippingAddress,
    p_story: input.story,
  });
  if (error) throw error;
  return data as unknown as StoryInquiryDetail;
}

export interface B2BInquiryInput {
  institution: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  country: OrderCountry;
  format: OrderFormat;
  language: OrderLanguage;
  quantity: number;
  notes?: string;
}

export async function submitB2BInquiry(input: B2BInquiryInput): Promise<string> {
  const { data, error } = await supabase.rpc('submit_b2b_inquiry', {
    p_institution: input.institution.trim(),
    p_contact_name: input.contactName.trim(),
    p_contact_email: input.contactEmail.trim(),
    p_contact_phone: input.contactPhone.trim(),
    p_country: input.country,
    p_format: input.format,
    p_language: input.language,
    p_quantity: input.quantity,
    p_notes: (input.notes || '').trim(),
  });
  if (error) throw error;
  return data as string;
}

export interface OrderQueueItem {
  id: string;
  reference: string;
  country: OrderCountry;
  format: OrderFormat;
  status: string;
  assigned_operator_id: string | null;
  created_at: string;
}

export interface FullStoryOrder {
  id: string;
  reference: string;
  country: OrderCountry;
  currency: string;
  format: OrderFormat;
  language: 'ar' | 'en';
  status: string;
  paymentStatus: string;
  generationStatus: string;
  fulfillmentStatus: string;
  childFirstName: string;
  shippingAddress: string | null;
  correctionRequest: string | null;
  priceVersion: number | null;
  totalMinor: number | null;
  depositMinor: number | null;
  createdAt: string;
  updatedAt: string;
  assignedOperatorId?: string | null;
  internalNotes?: string | null;
  storyConfiguration?: OrderStoryConfiguration | null;
}

export async function listOrderQueue(): Promise<OrderQueueItem[]> {
  const { data, error } = await supabase.rpc('list_order_queue');
  if (error) throw error;
  return ((data || []) as unknown) as OrderQueueItem[];
}

export async function getStoryOrder(orderId: string): Promise<FullStoryOrder> {
  const { data, error } = await supabase.rpc('get_story_order', {
    p_order_id: orderId,
  });
  if (error) throw error;
  return data as unknown as FullStoryOrder;
}

export async function updateOrderStatus(orderId: string, status: string, notes?: string): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (notes !== undefined) {
    updateData.internal_notes = notes;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('story_orders')
    .update(updateData)
    .eq('id', orderId);
  if (error) throw error;
}

