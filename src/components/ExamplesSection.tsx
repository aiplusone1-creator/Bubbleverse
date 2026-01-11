import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import GlassCard from './GlassCard';
import { Skeleton } from './ui/skeleton';

interface Example {
  id: string;
  title: string;
  cover_url: string;
  style: string;
  display_order: number;
}

const ExamplesSection = () => {
  const { data: examples, isLoading } = useQuery({
    queryKey: ['examples'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('examples')
        .select('id, title, cover_url, style, display_order')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Example[];
    },
  });
  return (
    <section id="examples" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-magical">Magical Stories</span> We've Created
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover the enchanting adventures our young heroes have embarked on
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="aspect-[2/3]">
                <Skeleton className="w-full h-full rounded-lg" />
              </div>
            ))
          ) : examples && examples.length > 0 ? (
            examples.map((example, index) => (
              <motion.div
                key={example.id}
                initial={{ opacity: 0, y: 30, rotateY: -15 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.05, 
                  rotateY: 5,
                  z: 50 
                }}
                className="perspective-1000"
              >
                <GlassCard className="p-0 overflow-hidden group cursor-pointer transform-gpu">
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {/* Book spine effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/30 to-transparent z-10" />
                    
                    {/* Cover image */}
                    <img
                      src={example.cover_url}
                      alt={example.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Title overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-white font-bold text-sm leading-tight mb-1">
                        {example.title}
                      </h3>
                      <span className="text-white/70 text-xs">
                        {example.style}
                      </span>
                    </div>
                  </div>
                  
                  {/* Book bottom edge */}
                  <div className="h-2 bg-gradient-to-b from-muted/50 to-muted" />
                </GlassCard>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-8">
              No examples available yet.
            </div>
          )}
        </div>

        <motion.p
          className="text-center text-muted-foreground mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          Each story is uniquely crafted for your child with AI-powered illustrations
        </motion.p>
      </div>
    </section>
  );
};

export default ExamplesSection;
