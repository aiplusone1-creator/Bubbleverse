import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';

interface ConfigItem {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
}

export default function AdminConfig() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('app_config')
        .select('*')
        .order('key');

      if (error) throw error;

      setConfigs(data || []);
      const initialValues: Record<string, string> = {};
      data?.forEach(config => {
        initialValues[config.key] = config.value;
      });
      setEditedValues(initialValues);
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.error('Failed to load system prompts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setEditedValues(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveConfig = async (config: ConfigItem) => {
    if (editedValues[config.key] === config.value) {
      toast.info('No changes to save');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('app_config')
        .update({
          value: editedValues[config.key],
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', config.id);

      if (error) throw error;

      setConfigs(prev =>
        prev.map(c =>
          c.id === config.id
            ? { ...c, value: editedValues[config.key], updated_at: new Date().toISOString() }
            : c
        )
      );

      toast.success(`${formatKeyName(config.key)} updated`);
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const formatKeyName = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getConfigIcon = (key: string): string => {
    switch (key) {
      case 'image_style_prompt':
        return '🎨';
      case 'story_structure_prompt':
        return '📖';
      case 'story_tone':
        return '💫';
      default:
        return '⚙️';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">System Prompts</h1>
          <p className="text-slate-400 mt-1">Configure AI generation settings</p>
        </div>

        <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-purple-200 text-sm font-medium">About System Prompts</p>
            <p className="text-slate-400 text-sm mt-1">
              These prompts control how the AI generates stories and images. Changes here will affect all future story generations.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {configs.map((config) => (
              <div
                key={config.id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getConfigIcon(config.key)}</span>
                    <div>
                      <Label className="text-white font-semibold text-lg">
                        {formatKeyName(config.key)}
                      </Label>
                      {config.description && (
                        <p className="text-slate-400 text-sm mt-1">
                          {config.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => saveConfig(config)}
                    disabled={isSaving || editedValues[config.key] === config.value}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>

                <Textarea
                  value={editedValues[config.key] || ''}
                  onChange={(e) => handleValueChange(config.key, e.target.value)}
                  className="min-h-32 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500"
                  placeholder={`Enter ${formatKeyName(config.key).toLowerCase()}...`}
                />

                {editedValues[config.key] !== config.value && (
                  <p className="text-amber-400 text-sm mt-2 flex items-center gap-1">
                    <span className="h-2 w-2 bg-amber-400 rounded-full animate-pulse" />
                    Unsaved changes
                  </p>
                )}

                <p className="text-slate-500 text-xs mt-3">
                  Last updated: {new Date(config.updated_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
