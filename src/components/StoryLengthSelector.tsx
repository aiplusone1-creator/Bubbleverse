import { motion } from 'framer-motion';

interface StoryLengthOption {
  id: string;
  title: string;
  pages: string;
  description: string;
  icon: string;
}

const storyLengths: StoryLengthOption[] = [
  {
    id: 'short',
    title: 'Short Adventure',
    pages: '8-10 Pages',
    description: 'Quick bedtime story',
    icon: '🌙',
  },
  {
    id: 'medium',
    title: 'Medium Journey',
    pages: '12-18 Pages',
    description: 'Standard storybook',
    icon: '📖',
  },
  {
    id: 'epic',
    title: 'Epic Saga',
    pages: '18-25 Pages',
    description: 'Detailed comic narrative',
    icon: '🏰',
  },
];

interface StoryLengthSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const StoryLengthSelector = ({ value, onChange }: StoryLengthSelectorProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">Story Length</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {storyLengths.map((option, index) => (
          <motion.button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`relative p-5 rounded-2xl text-left transition-all duration-300 ${
              value === option.id
                ? 'bg-primary/20 border-2 border-primary shadow-lg shadow-primary/20'
                : 'bg-muted/30 border-2 border-transparent hover:bg-muted/50'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-3xl mb-3 block">{option.icon}</span>
            <h4 className="font-semibold text-foreground">{option.title}</h4>
            <p className="text-primary font-medium text-sm">{option.pages}</p>
            <p className="text-muted-foreground text-sm mt-1">{option.description}</p>
            
            {value === option.id && (
              <motion.div
                className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

export default StoryLengthSelector;
