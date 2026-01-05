import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';

const suggestedInterests = [
  '🚀 Space', '🦖 Dinosaurs', '🧚 Fairies', '🏴‍☠️ Pirates', 
  '🦄 Unicorns', '🤖 Robots', '🐉 Dragons', '🧜‍♀️ Mermaids',
  '🦸 Superheroes', '🏰 Castles', '🌊 Ocean', '🌲 Forest',
  '🎪 Circus', '🧙 Wizards', '🐱 Cats', '🐕 Dogs',
];

interface InterestsInputProps {
  selectedInterests: string[];
  customInterest: string;
  onToggleInterest: (interest: string) => void;
  onCustomInterestChange: (value: string) => void;
  onAddCustomInterest: () => void;
}

const InterestsInput = ({ 
  selectedInterests, 
  customInterest, 
  onToggleInterest, 
  onCustomInterestChange,
  onAddCustomInterest 
}: InterestsInputProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-foreground">Child's Interests</h3>
      <p className="text-muted-foreground text-sm">Select themes your child loves for a personalized story</p>
      
      {/* Interest Tags */}
      <div className="flex flex-wrap gap-2">
        {suggestedInterests.map((interest, index) => {
          const isSelected = selectedInterests.includes(interest);
          return (
            <motion.button
              key={interest}
              onClick={() => onToggleInterest(interest)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? 'bg-primary/30 text-foreground border-2 border-primary'
                  : 'bg-muted/30 text-muted-foreground border-2 border-transparent hover:bg-muted/50'
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {interest}
            </motion.button>
          );
        })}
      </div>

      {/* Custom Interest Input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add custom interest..."
          value={customInterest}
          onChange={(e) => onCustomInterestChange(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onAddCustomInterest()}
          className="flex-1 bg-muted/30 border border-border rounded-full px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <motion.button
          onClick={onAddCustomInterest}
          className="px-6 py-2 bg-primary/20 text-primary rounded-full font-medium hover:bg-primary/30 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Add
        </motion.button>
      </div>

      {/* Selected interests display */}
      {selectedInterests.length > 0 && (
        <div className="pt-2">
          <p className="text-sm text-muted-foreground mb-2">Selected:</p>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map(interest => (
              <span 
                key={interest}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
              >
                {interest}
                <button 
                  onClick={() => onToggleInterest(interest)}
                  className="hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterestsInput;
