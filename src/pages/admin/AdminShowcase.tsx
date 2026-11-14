import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, GripVertical, Image, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ShowcaseImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const AdminShowcase = () => {
  const [images, setImages] = useState<ShowcaseImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<ShowcaseImage | null>(null);
  const [formData, setFormData] = useState({
    image_url: '',
    alt_text: '',
    display_order: 0,
    is_active: true,
  });
  const { toast } = useToast();


  const fetchImages = useCallback(async () => {
    const { data, error } = await supabase
      .from('showcase_images')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch showcase images',
        variant: 'destructive',
      });
    } else {
      setImages(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingImage) {
      const { error } = await supabase
        .from('showcase_images')
        .update({
          image_url: formData.image_url,
          alt_text: formData.alt_text || null,
          display_order: formData.display_order,
          is_active: formData.is_active,
        })
        .eq('id', editingImage.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update showcase image',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Showcase image updated successfully',
        });
        fetchImages();
      }
    } else {
      const { error } = await supabase
        .from('showcase_images')
        .insert({
          image_url: formData.image_url,
          alt_text: formData.alt_text || null,
          display_order: formData.display_order,
          is_active: formData.is_active,
        });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to add showcase image',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Showcase image added successfully',
        });
        fetchImages();
      }
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this showcase image?')) return;

    const { error } = await supabase
      .from('showcase_images')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete showcase image',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Showcase image deleted successfully',
      });
      fetchImages();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('showcase_images')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    } else {
      fetchImages();
    }
  };

  const resetForm = () => {
    setFormData({
      image_url: '',
      alt_text: '',
      display_order: images.length,
      is_active: true,
    });
    setEditingImage(null);
  };

  const openEditDialog = (image: ShowcaseImage) => {
    setEditingImage(image);
    setFormData({
      image_url: image.image_url,
      alt_text: image.alt_text || '',
      display_order: image.display_order,
      is_active: image.is_active,
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hero Showcase Images</h1>
          <p className="text-muted-foreground">
            Manage the floating images displayed in the hero section
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Image
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingImage ? 'Edit Showcase Image' : 'Add Showcase Image'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alt_text">Alt Text</Label>
                <Input
                  id="alt_text"
                  value={formData.alt_text}
                  onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                  placeholder="Description of the image"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingImage ? 'Save Changes' : 'Add Image'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {images.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg border border-dashed">
          <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No showcase images yet</h3>
          <p className="text-muted-foreground mb-4">
            Add images to display in the hero section
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Image
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead className="w-20">Preview</TableHead>
                <TableHead>Alt Text</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {images.map((image) => (
                <TableRow key={image.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      {image.display_order}
                    </div>
                  </TableCell>
                  <TableCell>
                    <img
                      src={image.image_url}
                      alt={image.alt_text || 'Showcase image'}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {image.alt_text || <span className="text-muted-foreground">No alt text</span>}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => toggleActive(image.id, image.is_active)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                        image.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {image.is_active ? (
                        <>
                          <Eye className="h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Hidden
                        </>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(image)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(image.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminShowcase;