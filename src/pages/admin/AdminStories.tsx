import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Trash2, Search, Loader2, RefreshCw, Phone, Printer } from 'lucide-react';
import { generateStorybookPDFHTML } from '@/features/pdf/storybookTemplate';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface Story {
  id: string;
  title: string | null;
  status: string | null;
  art_style: string | null;
  story_format: string | null;
  pdf_url: string | null;
  is_deleted: boolean | null;
  created_at: string;
  user_id: string | null;
  profiles?: {
    display_name: string | null;
  } | null;
}

export default function AdminStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);


  const fetchStories = useCallback(async () => {
    try {
      let query = supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false });

      if (!showDeleted) {
        query = query.eq('is_deleted', false);
      }

      const { data: storiesData, error: storiesError } = await query;

      if (storiesError) throw storiesError;

      // Fetch profiles separately for user display names
      const userIds = [...new Set((storiesData || []).map(s => s.user_id).filter(Boolean))];
      const profilesMap: Record<string, { display_name: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);

        profilesData?.forEach(p => {
          profilesMap[p.user_id] = { display_name: p.display_name };
        });
      }

      const storiesWithProfiles = (storiesData || []).map(story => ({
        ...story,
        profiles: story.user_id ? profilesMap[story.user_id] || null : null,
      }));

      setStories(storiesWithProfiles);
    } catch (error) {
      console.error('Error fetching stories:', error);
      toast.error('Failed to load stories');
    } finally {
      setIsLoading(false);
    }
  }, [showDeleted]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const softDeleteStory = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from('stories')
        .update({ is_deleted: true })
        .eq('id', storyId);

      if (error) throw error;

      setStories(prev =>
        prev.map(s =>
          s.id === storyId ? { ...s, is_deleted: true } : s
        )
      );

      toast.success('Story deleted');
    } catch (error) {
      console.error('Error deleting story:', error);
      toast.error('Failed to delete story');
    }
  };

  const restoreStory = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from('stories')
        .update({ is_deleted: false })
        .eq('id', storyId);

      if (error) throw error;

      setStories(prev =>
        prev.map(s =>
          s.id === storyId ? { ...s, is_deleted: false } : s
        )
      );

      toast.success('Story restored');
    } catch (error) {
      console.error('Error restoring story:', error);
      toast.error('Failed to restore story');
    }
  };

  const filteredStories = stories.filter(story =>
    story.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    story.profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Stories Management</h1>
            <p className="text-slate-400 mt-1">Moderate and manage generated stories</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant={showDeleted ? 'default' : 'outline'}
              onClick={() => setShowDeleted(!showDeleted)}
              className={showDeleted ? 'bg-purple-600 hover:bg-purple-700' : 'border-slate-600 text-slate-300 hover:bg-slate-700'}
            >
              {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
            </Button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 hover:bg-slate-800/50">
                  <TableHead className="text-slate-400">Story Title</TableHead>
                  <TableHead className="text-slate-400">User</TableHead>
                  <TableHead className="text-slate-400">Format</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Created</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-12">
                      No stories found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStories.map((story) => (
                    <TableRow
                      key={story.id}
                      className={`border-slate-700 hover:bg-slate-800/50 ${
                        story.is_deleted ? 'opacity-50' : ''
                      }`}
                    >
                      <TableCell>
                        <div>
                          <p className="text-white font-medium line-clamp-1">
                            {story.title || 'Untitled Story'}
                          </p>
                          <p className="text-slate-400 text-sm">{story.art_style}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {story.profiles?.display_name || (story.user_id ? `${story.user_id.slice(0, 8)}...` : 'Anonymous')}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          {story.story_format || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {story.is_deleted ? (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                            Deleted
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            {story.status || 'Active'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {format(new Date(story.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (story.pdf_url) {
                                window.open(story.pdf_url, '_blank');
                              } else {
                                const html = generateStorybookPDFHTML({
                                  title: story.title || 'قصة Bubbleverse السحرية',
                                  childName: 'بطل القصة',
                                  language: 'ar',
                                  artStyle: story.art_style || '3D Pixar',
                                  pages: [
                                    {
                                      pageNumber: 1,
                                      text: 'في مغامرة شيقة ملؤها الخيال والألوان المتلألئة...',
                                      imageUrl: '/bubble-books/space.webp',
                                    },
                                  ],
                                });
                                const w = window.open('', '_blank');
                                if (w) {
                                  w.document.write(html);
                                  w.document.close();
                                }
                              }
                            }}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            title="Preview 210×210mm Storybook PDF"
                          >
                            <Printer className="h-4 w-4 mr-1 text-cyan-400" />
                            PDF
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const msg = encodeURIComponent(`قصتكم "${story.title || 'Bubbleverse Story'}" جاهزة للمعاينة.`);
                              window.open(`https://wa.me/?text=${msg}`, '_blank');
                            }}
                            className="border-emerald-600/40 text-emerald-400 hover:bg-emerald-500/20"
                            title="Share via WhatsApp"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          {story.is_deleted ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => restoreStory(story.id)}
                              className="border-slate-600 text-green-400 hover:bg-green-500/20"
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-slate-600 text-red-400 hover:bg-red-500/20"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-slate-800 border-slate-700">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">
                                    Delete Story
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-slate-400">
                                    This will soft-delete the story. It can be restored later.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => softDeleteStory(story.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
