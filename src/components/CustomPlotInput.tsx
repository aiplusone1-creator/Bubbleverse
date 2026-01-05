import { motion } from 'framer-motion';
import { Wand2, Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CustomPlotInputProps {
  value: string;
  onChange: (value: string) => void;
  interests: string[];
}

const CustomPlotInput = ({ value, onChange, interests }: CustomPlotInputProps) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { toast } = useToast();

  const handleEnhanceWithAI = async () => {
    if (!value.trim()) {
      toast({
        title: "Write something first",
        description: "Please write a basic plot idea to enhance.",
        variant: "destructive",
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-plot', {
        body: {
          plot: value,
          interests: interests,
        },
      });

      if (error) throw error;

      if (data?.enhancedPlot) {
        onChange(data.enhancedPlot);
        toast({
          title: "Plot Enhanced! ✨",
          description: "Your story plot has been improved by AI.",
        });
      }
    } catch (error) {
      console.error('Failed to enhance plot:', error);
      toast({
        title: "Enhancement failed",
        description: "Could not enhance the plot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="relative"
    >
      <textarea
        placeholder="Write your story plot here... e.g., 'Ali finds a magical key in Cairo that opens a portal to...'"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-32 bg-muted/30 border border-border rounded-xl px-4 py-3 pr-14 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
      />
      
      {/* AI Enhance Button */}
      <motion.button
        onClick={handleEnhanceWithAI}
        disabled={isEnhancing}
        className="absolute bottom-3 right-3 p-2 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Enhance with AI"
      >
        {isEnhancing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}
      </motion.button>
      
      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
        <Wand2 className="w-3 h-3" />
        Click the sparkle button to enhance your plot with AI
      </p>
    </motion.div>
  );
};

export default CustomPlotInput;
