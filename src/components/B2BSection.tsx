import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Building2, Send, CheckCircle2, MessageCircle, Phone } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/hooks/useAuth';
import { submitB2BInquiry, type OrderCountry, type OrderFormat, type OrderLanguage } from '@/features/orders/orderService';
import GlassCard from './GlassCard';
import BubbleButton from './BubbleButton';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { LiquidSelect } from './ui/LiquidSelect';

export default function B2BSection() {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const text = (en: string, ar: string) => (isRTL ? ar : en);

  const [institution, setInstitution] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [country, setCountry] = useState<OrderCountry>('EG');
  const [format, setFormat] = useState<OrderFormat>('digital_pdf');
  const [language, setLanguage] = useState<OrderLanguage>('ar');
  const [quantity, setQuantity] = useState<number>(100);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError(text('Please sign in to submit a school inquiry', 'يرجى تسجيل الدخول أولاً لإرسال طلب المدرسة'));
      return;
    }
    if (!institution.trim() || !contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      setError(text('Please fill in all required contact fields', 'يرجى ملء جميع بيانات التواصل المطلوبة'));
      return;
    }

    setBusy(true);
    setError('');

    try {
      const id = await submitB2BInquiry({
        institution,
        contactName,
        contactEmail,
        contactPhone,
        country,
        format,
        language,
        quantity: Math.max(1, Number(quantity) || 50),
        notes,
      });
      setSubmittedId(id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const openWhatsApp = () => {
    const message = isRTL
      ? `مرحباً، أود الاستفسار عن باقات المدارس والحضانات في Bubbleverse لمؤسسة ${institution || 'التعليمية'}.`
      : `Hello, I would like to inquire about Bubbleverse school packages for ${institution || 'our institution'}.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="schools" className="py-20 sm:py-28 px-4 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs sm:text-sm font-medium mb-4">
            <Building2 className="w-4 h-4 text-primary" />
            {text('Institutional & Bulk Programs', 'برامج المدارس والإنتاج بالجملة')}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 font-editorial tracking-tight">
            {text('Bubbleverse for Schools & Preschools', 'Bubbleverse للمدارس والحضانات')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {text(
              'Create personalized graduation storybooks and values-based educational stories featuring every child’s name, face, and your school emblem.',
              'اصنع هدايا تخرج استثنائية وقصصاً سلوكية وتربوية باسم وصورة كل طفل وبشعار مدرستك.'
            )}
          </p>
        </motion.div>

        {/* 2 Institutional Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-16">
          <GlassCard className="p-6 sm:p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-editorial">
              {text('Personalized Graduation Keepsakes', 'قصص تخرج مخصصة لكل طفل')}
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {text(
                'A personalized picture storybook for every graduating student where they are the hero, celebrating their achievements with their school logo on the cover.',
                'كتاب قصصي مصور لكل طالب خريج يكون هو بطل القصة، يحتفي بإنجازاته ويحمل شعار واسم المدرسة على الغلاف.'
              )}
            </p>
            <div className="pt-2">
              <div className="text-primary font-bold text-lg font-editorial">
                {country === 'EG' ? '~120 ج.م / طفل' : '~35 ر.س / طالب'}
              </div>
              <div className="text-xs text-muted-foreground">
                {text('In wholesale batches of 50 to 300+ copies', 'في عقود الجملة من 50 إلى 300+ طفل')}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 sm:p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-editorial">
              {text('Values & Curriculum Stories', 'قصص القيم والمنهج السلوكي')}
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {text(
                'Custom educational narratives teaching kindness, honesty, teamwork, curiosity, and love of reading, tailored to your curriculum goals.',
                'قصص تربوية هادفة ترسخ قيم التعاون، الصدق، النظافة، حب القراءة، والمواطنة، مصممة خصيصاً لأهدافكم التعليمية.'
              )}
            </p>
            <div className="pt-2">
              <div className="text-primary font-bold text-lg font-editorial">
                {text('Automated Batch Print PDFs', 'ملفات PDF عالية الجودة للطباعة الفورية')}
              </div>
              <div className="text-xs text-muted-foreground">
                {text('Full-color 210×210mm with crop marks ready for print', 'مقاس 210×210مم مع هوامش القص الاحترافية')}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Inquiry Form */}
        <div className="max-w-2xl mx-auto">
          <GlassCard className="p-6 sm:p-10">
            {submittedId ? (
              <div className="text-center space-y-4 py-6">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
                <h3 className="text-2xl font-bold font-editorial">
                  {text('Inquiry Received Successfully!', 'تم استلام طلبكم بنجاح!')}
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {text(
                    'Our institutional partnership coordinator will contact you within 24 hours with package proposals and sample portfolios.',
                    'سيتواصل معكم مسؤول التعاقدات للمدارس خلال 24 ساعة لتقديم عرض السعر ونماذج الكتب.'
                  )}
                </p>
                <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <BubbleButton size="sm" onClick={openWhatsApp}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {text('Talk with us on WhatsApp', 'تواصل مباشرة عبر واتساب')}
                  </BubbleButton>
                  <BubbleButton variant="outline" size="sm" onClick={() => setSubmittedId(null)}>
                    {text('Submit Another Request', 'إرسال طلب آخر')}
                  </BubbleButton>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="border-b border-border/40 pb-3 mb-2">
                  <h3 className="text-xl font-bold font-editorial">
                    {text('Request a School Package Quote', 'طلب عرض سعر وباقة للمدارس')}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {text('Get custom samples and bulk institutional pricing.', 'احصل على نماذج تجريبية وأسعار الجملة المعتمدة.')}
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm" role="alert">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="space-y-1 block">
                    <span className="text-xs font-semibold text-foreground/80">
                      {text('School / Nursery Name *', 'اسم المدرسة أو الروضة *')}
                    </span>
                    <Input
                      required
                      maxLength={160}
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder={text('e.g. Modern International School', 'مثال: مدارس الأمل الحديثة')}
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-xs font-semibold text-foreground/80">
                      {text('Contact Person *', 'اسم مسؤول التواصل *')}
                    </span>
                    <Input
                      required
                      maxLength={120}
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder={text('Full Name', 'الاسم بالكامل')}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="space-y-1 block">
                    <span className="text-xs font-semibold text-foreground/80">
                      {text('Email *', 'البريد الإلكتروني *')}
                    </span>
                    <Input
                      required
                      type="email"
                      maxLength={254}
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="school@example.com"
                    />
                  </label>

                  <label className="space-y-1 block">
                    <span className="text-xs font-semibold text-foreground/80">
                      {text('Phone / WhatsApp *', 'الهاتف أو واتساب *')}
                    </span>
                    <Input
                      required
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+201000000000 / +966500000000"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1 block">
                    <span className="text-xs font-semibold text-foreground/80">{text('Country', 'الدولة')}</span>
                    <LiquidSelect
                      value={country}
                      onChange={(val) => setCountry(val as OrderCountry)}
                      options={[
                        { value: 'EG', label: text('Egypt (EGP)', 'مصر (ج.م)') },
                        { value: 'SA', label: text('Saudi Arabia (SAR)', 'السعودية (ر.س)') },
                      ]}
                      triggerClassName="h-10 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1 block">
                    <span className="text-xs font-semibold text-foreground/80">{text('Format', 'نوع النسخة')}</span>
                    <LiquidSelect
                      value={format}
                      onChange={(val) => setFormat(val as OrderFormat)}
                      options={[
                        { value: 'digital_pdf', label: text('Digital PDF', 'نسخة رقمية PDF') },
                        { value: 'hardcopy_book', label: text('Printed Hardcover', 'كتاب مطبوع') },
                      ]}
                      triggerClassName="h-10 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1 block">
                    <span className="text-xs font-semibold text-foreground/80">{text('Language', 'اللغة')}</span>
                    <LiquidSelect
                      value={language}
                      onChange={(val) => setLanguage(val as OrderLanguage)}
                      options={[
                        { value: 'ar', label: text('Arabic', 'العربية') },
                        { value: 'en', label: text('English', 'الإنجليزية') },
                      ]}
                      triggerClassName="h-10 text-xs sm:text-sm"
                    />
                  </div>

                  <label className="space-y-1 block">
                    <span className="text-xs font-semibold text-foreground/80">{text('Children Count', 'عدد الطلاب')}</span>
                    <Input
                      type="number"
                      min={10}
                      max={5000}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                    />
                  </label>
                </div>

                <label className="space-y-1 block">
                  <span className="text-xs font-semibold text-foreground/80">{text('Additional Notes / Specific Themes', 'ملاحظات إضافية أو مناسبة محددة')}</span>
                  <Textarea
                    maxLength={1000}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={text('e.g. KG2 graduation ceremony, customized theme about nature...', 'مثال: حفل تخرج رياض الأطفال، رغبة في قصص عن التعاون وحب العلم...')}
                  />
                </label>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <BubbleButton type="submit" disabled={busy} className="w-full sm:w-auto min-h-11">
                    <Send className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {text(busy ? 'Submitting Inquiry...' : 'Submit Inquiry & Get Quote', busy ? 'جاري الإرسال...' : 'إرسال طلب عرض السعر')}
                  </BubbleButton>

                  <button
                    type="button"
                    onClick={openWhatsApp}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{text('Direct WhatsApp Chat', 'محادثة مباشرة عبر واتساب')}</span>
                  </button>
                </div>
              </form>
            )}
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
