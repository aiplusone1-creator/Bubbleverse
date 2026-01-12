import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Moon, Sun, LogIn, User, Shield } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import BubbleverseLogo from './BubbleverseLogo';
import { Button } from './ui/button';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

const Header = () => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Set up auth listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Check admin status
      if (session?.user) {
        setTimeout(() => {
          checkAdminStatus(session.user.id);
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!data && !error);
    } catch {
      setIsAdmin(false);
    }
  };

  return (
    <motion.header
      className="absolute top-0 left-0 right-0 p-4 md:p-6 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <BubbleverseLogo />

        <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Instant Language Switcher */}
          <Button
            variant="ghost"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="glass-card h-10 px-3 border-primary/20 hover:border-primary/40 hover:bg-primary/10 text-sm font-medium"
          >
            {language === 'en' ? 'العربية' : 'English'}
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="glass-card h-10 w-10 border-primary/20 hover:border-primary/40 hover:bg-primary/10"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-primary" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
          </Button>

          {/* Admin Panel Button - Only for admins */}
          {isAdmin && (
            <Link to="/admin">
              <Button
                variant="ghost"
                size="icon"
                className="glass-card h-10 w-10 border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10"
                title="Admin Panel"
              >
                <Shield className="h-5 w-5 text-amber-500" />
              </Button>
            </Link>
          )}

          {/* Sign In / Profile Button */}
          {user ? (
            <Link to="/profile">
              <Button
                className="bubble-button px-4 py-2 text-sm md:px-6 md:py-2 md:text-base flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t('profile')}</span>
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button
                className="bubble-button px-4 py-2 text-sm md:px-6 md:py-2 md:text-base flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">{t('signIn')}</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
