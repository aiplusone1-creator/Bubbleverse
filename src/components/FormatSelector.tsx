import { motion } from 'framer-motion';

interface FormatOption {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const formats: FormatOption[] = [
  {
    id: 'comic',
    title: 'Comic Book',
    description: 'Dynamic panels with speech bubbles',
    icon: '💬',
  },
  {
    id: 'storyboard',
    title: 'Visual Storyboard',
    description: 'Full page art with text',
    icon: '🖼️',
  },
];

interface FormatSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const FormatSelector = ({ value, onChange }: FormatSelectorProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">Story Format</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {formats.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`relative p-6 rounded-2xl text-left transition-all duration-300 ${
              value === option.id
                ? 'bg-secondary/30 border-2 border-secondary shadow-lg shadow-secondary/20'
                : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50'
            }`}
            initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-4xl mb-3 block">{option.icon}</span>
            <h4 className="font-semibold text-foreground text-lg">{option.title}</h4>
            <p className="text-muted-foreground text-sm mt-1">{option.description}</p>
            
            {value === option.id && (
              <motion.div
                className="absolute top-3 right-3 w-6 h-6 bg-secondary rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <svg className="w-4 h-4 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default FormatSelector;
