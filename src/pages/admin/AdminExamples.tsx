import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Upload, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

interface Example {
  id: string;
  title: string;
  cover_url: string;
  style: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
}

const artStyles = [
  '3D Pixar Style',
  'Comic Book',
  'Watercolor',
  'Anime Style',
  'Cartoon',
  'Realistic',
  'Sketch',
  'Pop Art',
];

export default function AdminExamples() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExample, setEditingExample] = useState<Example | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    cover_url: '',
    style: '3D Pixar Style',
  });
  const [uploading, setUploading] = useState(false);

  const { data: examples, isLoading } = useQuery({
    queryKey: ['admin-examples'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('examples')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Example[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; cover_url: string; style: string }) => {
      const maxOrder = examples?.reduce((max, e) => Math.max(max, e.display_order), 0) || 0;
      const { error } = await supabase.from('examples').insert({
        ...data,
        display_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-examples'] });
      toast.success('Example created successfully');
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create example: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title?: string; cover_url?: string; style?: string; is_visible?: boolean; display_order?: number }) => {
      const { error } = await supabase
        .from('examples')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-examples'] });
      toast.success('Example updated successfully');
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to update example: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('examples').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-examples'] });
      toast.success('Example deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete example: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({ title: '', cover_url: '', style: '3D Pixar Style' });
    setEditingExample(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExample) {
      updateMutation.mutate({ id: editingExample.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (example: Example) => {
    setEditingExample(example);
    setFormData({
      title: example.title,
      cover_url: example.cover_url,
      style: example.style,
    });
    setIsDialogOpen(true);
  };

  const handleToggleVisibility = (example: Example) => {
    updateMutation.mutate({ id: example.id, is_visible: !example.is_visible });
  };

  const handleMoveOrder = (example: Example, direction: 'up' | 'down') => {
    if (!examples) return;
    
    const currentIndex = examples.findIndex(e => e.id === example.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= examples.length) return;
    
    const targetExample = examples[targetIndex];
    
    // Swap display orders
    updateMutation.mutate({ id: example.id, display_order: targetExample.display_order });
    updateMutation.mutate({ id: targetExample.id, display_order: example.display_order });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('example-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('example-images')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, cover_url: publicUrl }));
      toast.success('Image uploaded successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to upload image: ' + errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Examples Management</h1>
            <p className="text-slate-400">Manage the example stories shown on the homepage</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Example
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingExample ? 'Edit Example' : 'Add New Example'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter story title"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Art Style</Label>
                  <Select
                    value={formData.style}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, style: value }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      {artStyles.map((style) => (
                        <SelectItem key={style} value={style} className="text-white hover:bg-slate-600">
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Cover Image</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.cover_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, cover_url: e.target.value }))}
                      placeholder="Image URL or upload"
                      className="bg-slate-700 border-slate-600 text-white flex-1"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-600"
                      disabled={uploading}
                    >
                      <label className="cursor-pointer flex items-center">
                        <Upload className="h-4 w-4 mr-1" />
                        {uploading ? 'Uploading...' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </Button>
                  </div>
                  {formData.cover_url && (
                    <div className="mt-2">
                      <img
                        src={formData.cover_url}
                        alt="Preview"
                        className="w-32 h-48 object-cover rounded-lg border border-slate-600"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingExample ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-slate-800/50 rounded-lg border border-slate-700">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading examples...</div>
          ) : examples?.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No examples found. Add your first example!</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-700/50">
                  <TableHead className="text-slate-300">Order</TableHead>
                  <TableHead className="text-slate-300">Cover</TableHead>
                  <TableHead className="text-slate-300">Title</TableHead>
                  <TableHead className="text-slate-300">Style</TableHead>
                  <TableHead className="text-slate-300">Visible</TableHead>
                  <TableHead className="text-slate-300 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examples?.map((example, index) => (
                  <TableRow key={example.id} className="border-slate-700 hover:bg-slate-700/30">
                    <TableCell className="text-slate-300">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveOrder(example, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveOrder(example, 'down')}
                          disabled={index === examples.length - 1}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <span className="ml-1">{example.display_order}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <img
                        src={example.cover_url}
                        alt={example.title}
                        className="w-12 h-18 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="text-white font-medium">{example.title}</TableCell>
                    <TableCell className="text-slate-300">{example.style}</TableCell>
                    <TableCell>
                      <Switch
                        checked={example.is_visible}
                        onCheckedChange={() => handleToggleVisibility(example)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(example)}
                          className="h-8 w-8 text-slate-400 hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(example.id)}
                          className="h-8 w-8 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}