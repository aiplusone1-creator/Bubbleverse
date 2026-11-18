import { useRef } from 'react';
import { Upload, X, CheckCircle2, User, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/useLanguage';
import type { Character } from '@/features/stories/types';

interface Props {
  characters: Character[];
  onAddCharacter: (character: Character) => void;
  onRemoveCharacter: (id: string) => void;
  onUpdateCharacter: (id: string, updates: Partial<Character>) => void;
}

const roles = ['hero', 'parent', 'pet', 'friend'];

export default function InquiryCharacters({
  characters,
  onAddCharacter,
  onRemoveCharacter,
  onUpdateCharacter,
}: Props) {
  const { t, language } = useLanguage();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileUpload = (characterId: string, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onUpdateCharacter(characterId, { imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h3 className="text-xl sm:text-2xl font-bold font-editorial text-white flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-cyan-400 shrink-0" />
          <span>{language === 'ar' ? 'مين أبطال الحكاية؟' : 'Who Stars in This Story?'}</span>
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {language === 'ar'
            ? 'اكتب اسم طفلك وارفع صورته عشان نرسم ملامحه وضحكته الحقيقية في كل صفحة من القصة.'
            : 'Share your child’s name and photo so our artists capture their real smile across every page.'}
        </p>
      </div>

      <div className="space-y-4">
        {characters.map((character, index) => {
          const isHero = character.role === 'hero';

          return (
            <div
              key={character.id}
              className={`rounded-2xl border p-4 sm:p-5 transition-all space-y-4 ${
                isHero
                  ? 'bg-slate-900/80 border-cyan-400/35 shadow-lg'
                  : 'bg-slate-950/60 border-white/10'
              }`}
            >
              {/* Card Header & Role Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 text-xs font-bold font-numeric">
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {isHero
                      ? language === 'ar'
                        ? 'بطل الحكاية الرئيسي (طفلك)'
                        : 'Main Story Hero (Your Child)'
                      : language === 'ar'
                      ? 'شخصية مرافقة في المغامرة'
                      : 'Companion Character'}
                  </span>
                </div>

                {characters.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveCharacter(character.id)}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors p-1.5 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>{language === 'ar' ? 'حذف' : 'Remove'}</span>
                  </button>
                )}
              </div>

              {/* Character Details Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="space-y-1.5">
                  <span className="block text-xs font-semibold text-slate-200">
                    {language === 'ar' ? 'اسم الشخصية *' : 'Character Name *'}
                  </span>
                  <Input
                    className="h-11 text-sm bg-slate-950/90 border-white/15 rounded-xl text-white"
                    maxLength={80}
                    placeholder={
                      isHero
                        ? language === 'ar'
                          ? 'مثال: عمر أو ليلى'
                          : 'e.g. Omar or Layla'
                        : language === 'ar'
                        ? 'مثال: بابا أحمد أو الصديق فهد'
                        : 'e.g. Dad or Best Friend'
                    }
                    value={character.name}
                    onChange={(e) => onUpdateCharacter(character.id, { name: e.target.value })}
                  />
                </label>

                <label className="space-y-1.5">
                  <span className="block text-xs font-semibold text-slate-200">
                    {language === 'ar' ? 'دوره في القصة' : 'Story Role'}
                  </span>
                  <select
                    className="h-11 w-full rounded-xl border border-white/15 bg-slate-950/90 px-3 text-sm text-white focus:outline-none focus:border-cyan-400"
                    value={character.role}
                    onChange={(e) => onUpdateCharacter(character.id, { role: e.target.value })}
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {t('role' + r[0].toUpperCase() + r.slice(1))}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Photo Upload Dropzone */}
              <div className="pt-3 border-t border-white/10 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-400 shrink-0" />
                    <span>
                      {language === 'ar'
                        ? 'صورة الشخصية (لرسم الملامح بدقة):'
                        : 'Character Photo (for facial likeness):'}
                    </span>
                  </span>
                  <span className="text-xs text-emerald-300 font-numeric">
                    {language === 'ar' ? 'خصوصية وأمان 100%' : '100% Secure & Private'}
                  </span>
                </div>

                <input
                  type="file"
                  ref={(el) => (fileInputRefs.current[character.id] = el)}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileUpload(character.id, e.target.files?.[0])}
                />

                {!character.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[character.id]?.click()}
                    className="w-full border-2 border-dashed border-white/15 hover:border-cyan-400/60 rounded-2xl p-4 text-start cursor-pointer transition-colors bg-slate-950/60 flex items-center justify-center gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center shrink-0">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-start">
                      <p className="text-xs sm:text-sm font-semibold text-white">
                        {language === 'ar'
                          ? 'اضغط هنا لاختيار صورة واضحة من جهازك'
                          : 'Tap to choose a clear photo'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {language === 'ar'
                          ? 'أي صورة واضحة من موبايلك أو جهازك (حتى 10 ميجابايت)'
                          : 'JPG, PNG, or WEBP up to 10MB'}
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/90 border border-cyan-400/35">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/15 shrink-0">
                        <img
                          src={character.imageUrl}
                          alt={
                            language === 'ar'
                              ? `صورة ${character.name || 'الشخصية'}`
                              : `${character.name || 'Character'} photo`
                          }
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <span>
                            {language === 'ar'
                              ? 'تم حفظ الصورة بنجاح'
                              : 'Photo uploaded successfully'}
                          </span>
                        </span>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          {language === 'ar'
                            ? 'هنرسم الملامح بدقة وحب في كل مشاهد الحكاية'
                            : 'Likeness will be lovingly illustrated across story scenes'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateCharacter(character.id, { imageUrl: undefined })}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors cursor-pointer"
                      aria-label={language === 'ar' ? 'إزالة الصورة' : 'Remove photo'}
                      title={language === 'ar' ? 'إزالة الصورة' : 'Remove photo'}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {characters.length < 4 && (
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            onAddCharacter({
              id: crypto.randomUUID(),
              name: '',
              role: 'friend',
            })
          }
          className="w-full h-11 text-xs sm:text-sm font-semibold gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>
            {language === 'ar'
              ? 'إضافة شخصية مرافقة (صديق / أب / أم)'
              : 'Add Companion Character'}
          </span>
        </Button>
      )}
    </div>
  );
}
