import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
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
  const { t, isRTL } = useLanguage();
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
    <section id="examples" className={`py-20 sm:py-28 px-4 ${isRTL ? 'rtl' : ''}`}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 font-editorial tracking-tight">
            <span className="text-magical">{t('examplesTitle')}</span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal">
            {t('examplesSubtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="aspect-[2/3]">
                <Skeleton className="w-full h-full rounded-2xl" />
              </div>
            ))
          ) : examples && examples.length > 0 ? (
            examples.map((example, index) => (
              <motion.div
                key={example.id}
                initial={{ opacity: 0, y: 30, rotateY: -10 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ 
                  scale: 1.04, 
                  y: -6,
                }}
                className="perspective-1000"
              >
                <GlassCard className="p-0 overflow-hidden group cursor-pointer transform-gpu border-border/40 hover:border-primary/40 shadow-lg">
                  <div className="relative aspect-[2/3] overflow-hidden">
                    {/* Book spine highlight effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/40 to-transparent z-10" />
                    
                    {/* Cover image */}
                    <img
                      src={example.cover_url}
                      alt={example.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Title overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-white font-bold text-sm leading-snug mb-1 font-editorial">
                        {example.title}
                      </h3>
                      <span className="text-cyan-200/90 text-xs font-medium">
                        {example.style}
                      </span>
                    </div>
                  </div>
                  
                  {/* Book bottom edge */}
                  <div className="h-2 bg-gradient-to-b from-muted/50 to-muted/80" />
                </GlassCard>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-8 font-editorial text-lg">
              {isRTL ? 'لا توجد نماذج متوفرة حالياً.' : 'No examples available yet.'}
            </div>
          )}
        </div>

        <motion.p
          className="text-center text-sm sm:text-base text-muted-foreground mt-12 sm:mt-16 font-normal max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          {isRTL 
            ? 'كل حكاية هي مغامرة فريدة صُممت لتحتفي بخيال طفلك وتلهمه الشجاعة والفضول' 
            : 'Each story is a unique adventure, crafted to celebrate your child’s imagination and inspire wonder'}
        </motion.p>
      </div>
    </section>
  );
};

export default ExamplesSection;
