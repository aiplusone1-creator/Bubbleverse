import ProfileInquiries from '@/components/ProfileInquiries';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, BookOpen, LogOut, Moon, Sun, Globe, Edit2, Check, DollarSign } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import ImmersiveBackground from '@/components/ImmersiveBackground';
import { useAuth } from '@/hooks/useAuth';

const Profile = () => {
  const { user, isLoading: loading, signOut } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState<'EGP' | 'USD'>('EGP');

  const { setTheme, resolvedTheme } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate('/auth'); return; }
    setDisplayName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
    let active = true;
    void supabase.from('profiles').select('preferred_currency').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (active && (data?.preferred_currency === 'EGP' || data?.preferred_currency === 'USD')) {
          setPreferredCurrency(data.preferred_currency);
        }
      });
    return () => { active = false; };
  }, [user, loading, navigate]);

  const handleCurrencyChange = async (currency: 'EGP' | 'USD') => {
    setPreferredCurrency(currency);
    if (user) {
      await supabase
        .from('profiles')
        .update({ preferred_currency: currency })
        .eq('user_id', user.id);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName }
      });
      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      setIsEditing(false);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ImmersiveBackground />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="relative min-h-screen overflow-x-hidden p-4 sm:p-6 md:p-8">
      <ImmersiveBackground />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 bv-container-narrow"
      >
        {/* Header */}
        <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Link
            to="/"
            className={`inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
            {t('backHome')}
          </Link>

          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-5 w-5 mr-2" />
            {t('signOut')}
          </Button>
        </div>

        {/* Profile Card */}
        <div className="glass-card p-6 md:p-8 mb-6">
          <div className={`flex items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className="relative">
              <div
                className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-2xl md:text-3xl font-bold"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, hsla(190, 100%, 50%, 0.3), hsla(280, 80%, 60%, 0.3))'
                    : 'linear-gradient(135deg, hsla(190, 100%, 45%, 0.4), hsla(280, 80%, 55%, 0.4))',
                  border: `2px solid ${isDark ? 'hsla(190, 100%, 70%, 0.5)' : 'hsla(190, 100%, 45%, 0.5)'}`,
                }}
              >
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-primary">
                    {(displayName || user?.email || 'U')[0].toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
              {isEditing ? (
                <div className="flex items-center gap-3">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="max-w-xs bg-background/50 border-primary/20"
                    placeholder={t('displayName')}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bubble-button"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-foreground' : 'text-slate-800'}`}>
                    {displayName || user?.email?.split('@')[0]}
                  </h2>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              )}
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={new URLSearchParams(window.location.search).get('tab') === 'inquiries' ? 'inquiries' : 'settings'} dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6">
          <TabsList className="glass-card h-auto flex-wrap p-1 w-full md:w-auto">
            <TabsTrigger value="stories" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <BookOpen className="h-4 w-4" />
              {t('myStories')}
            </TabsTrigger>
            <TabsTrigger value="settings" className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Settings className="h-4 w-4" />
              {t('settings')}
            </TabsTrigger>
            <TabsTrigger value="inquiries" className="min-h-11">{t('inquiryMyInquiries')}</TabsTrigger>
          </TabsList>
          <TabsContent value="inquiries">
            {user && <ProfileInquiries key={user.id} ownerId={user.id} />}
          </TabsContent>

          {/* My Stories Tab */}
          <TabsContent value="stories">
            <div className="glass-card p-8 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-foreground' : 'text-slate-800'}`}>
                {t('noStoriesYet')}
              </h3>
              <p className="text-muted-foreground mb-6">{t('startFirstStory')}</p>
              <Link to="/">
                <Button className="bubble-button">
                  {t('startCreating')}
                </Button>
              </Link>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Preferences */}
              <div className="glass-card p-6">
                <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-foreground' : 'text-slate-800'} ${isRTL ? 'text-right' : ''}`}>
                  {t('preferences')}
                </h3>

                <div className="space-y-6">
                  {/* Theme Toggle */}
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {isDark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                      <div className={isRTL ? 'text-right' : ''}>
                        <p className={`font-medium ${isDark ? 'text-foreground' : 'text-slate-800'}`}>{t('theme')}</p>
                        <p className="text-sm text-muted-foreground">
                          {isDark ? t('darkMode') : t('lightMode')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isDark}
                      onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    />
                  </div>

                  {/* Language Toggle */}
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Globe className="h-5 w-5 text-primary" />
                      <div className={isRTL ? 'text-right' : ''}>
                        <p className={`font-medium ${isDark ? 'text-foreground' : 'text-slate-800'}`}>{t('language')}</p>
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' ? 'English' : 'العربية'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={language === 'en' ? 'default' : 'outline'}
                        onClick={() => setLanguage('en')}
                        className={language === 'en' ? 'bubble-button' : ''}
                      >
                        EN
                      </Button>
                      <Button
                        size="sm"
                        variant={language === 'ar' ? 'default' : 'outline'}
                        onClick={() => setLanguage('ar')}
                        className={language === 'ar' ? 'bubble-button' : ''}
                      >
                        AR
                      </Button>
                    </div>
                  </div>

                  {/* Currency Preference */}
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <DollarSign className="h-5 w-5 text-primary" />
                      <div className={isRTL ? 'text-right' : ''}>
                        <p className={`font-medium ${isDark ? 'text-foreground' : 'text-slate-800'}`}>{t('currency')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('currencyPreference')}
                        </p>
                      </div>
                    </div>
                    <div className="flex rounded-lg overflow-hidden border border-primary/20">
                      <button
                        onClick={() => handleCurrencyChange('EGP')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          preferredCurrency === 'EGP'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background/50 text-muted-foreground hover:bg-primary/10'
                        }`}
                      >
                        EGP
                      </button>
                      <button
                        onClick={() => handleCurrencyChange('USD')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                          preferredCurrency === 'USD'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background/50 text-muted-foreground hover:bg-primary/10'
                        }`}
                      >
                        USD
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="glass-card p-6">
                <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-foreground' : 'text-slate-800'} ${isRTL ? 'text-right' : ''}`}>
                  {t('accountSettings')}
                </h3>

                <div className="space-y-4">
                  <div className={isRTL ? 'text-right' : ''}>
                    <Label className="text-muted-foreground">{t('email')}</Label>
                    <p className={`font-medium ${isDark ? 'text-foreground' : 'text-slate-800'}`}>
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Profile;