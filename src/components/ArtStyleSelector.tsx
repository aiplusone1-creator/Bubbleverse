import { useLanguage } from '@/hooks/useLanguage';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Palette, Plus } from 'lucide-react';

interface ArtStyle {
  id: string;
  name: string;
  preview: string;
}

const artStyles: ArtStyle[] = [
  { id: 'disney', name: 'Disney 3D', preview: '🏰' },
  { id: 'pixar', name: 'Pixar-esque', preview: '🎬' },
  { id: 'watercolor', name: 'Watercolor', preview: '🎨' },
  { id: 'anime', name: 'Anime', preview: '✨' },
  { id: 'realistic', name: 'Realistic', preview: '📷' },
  { id: 'comic', name: 'Comic Book', preview: '💥' },
  { id: 'pastel', name: 'Pastel', preview: '🌸' },
  { id: 'horror', name: 'Spooky', preview: '👻' },
];

interface ArtStyleSelectorProps {
  value: string;
  customStyle: string;
  onChange: (value: string) => void;
  onCustomStyleChange: (value: string) => void;
}

const ArtStyleSelector = ({ value, customStyle, onChange, onCustomStyleChange }: ArtStyleSelectorProps) => {
  const [showCustomInput, setShowCustomInput] = useState(value === 'custom');

  const handleStyleSelect = (styleId: string) => {
    if (styleId === 'custom') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      onCustomStyleChange('');
    }
    onChange(styleId);
  };

  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Palette className="w-5 h-5 text-accent" />
        <h3 className="text-xl font-semibold text-foreground">{t('summaryStyle')}</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {artStyles.map((style, index) => (
          <motion.button
            key={style.id}
            onClick={() => handleStyleSelect(style.id)}
            className={`px-5 py-3 rounded-full flex items-center gap-2 transition-all duration-300 ${
              value === style.id
                ? 'bg-accent/30 border-2 border-accent text-foreground shadow-lg shadow-accent/20'
                : 'bg-muted/30 border-2 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-xl">{style.preview}</span>
            <span className="font-medium">{t('inquiryOption_' + style.id)}</span>
          </motion.button>
        ))}

        {/* Custom Style Button */}
        <motion.button
          onClick={() => handleStyleSelect('custom')}
          className={`px-5 py-3 rounded-full flex items-center gap-2 transition-all duration-300 ${
            value === 'custom'
              ? 'bg-secondary/30 border-2 border-secondary text-foreground shadow-lg shadow-secondary/20'
              : 'bg-muted/30 border-2 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          }`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: artStyles.length * 0.05 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">{t('inquiryOption_custom')}</span>
        </motion.button>
      </div>

      {/* Custom Style Input */}
      {showCustomInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="pt-2"
        >
          <input
            type="text"
            aria-label={t('inquiryArtCustom')} placeholder={t('inquiryArtCustom')} maxLength={300}
            value={customStyle}
            onChange={(e) => onCustomStyleChange(e.target.value)}
            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50"
          />
        </motion.div>
      )}
    </div>
  );
};

export default ArtStyleSelector;
