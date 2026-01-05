import { motion } from 'framer-motion';

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
];

interface ArtStyleSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const ArtStyleSelector = ({ value, onChange }: ArtStyleSelectorProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">Art Style</h3>
      <div className="flex flex-wrap gap-3">
        {artStyles.map((style, index) => (
          <motion.button
            key={style.id}
            onClick={() => onChange(style.id)}
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
            <span className="font-medium">{style.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ArtStyleSelector;
