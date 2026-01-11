import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Crown, Ban, Search, Loader2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  is_premium: boolean;
  is_banned: boolean;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePremium = async (user: UserProfile) => {
    setUpdatingUser(user.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_premium: !user.is_premium })
        .eq('id', user.id);

      if (error) throw error;

      setUsers(prev =>
        prev.map(u =>
          u.id === user.id ? { ...u, is_premium: !u.is_premium } : u
        )
      );

      toast.success(
        user.is_premium
          ? 'Premium status removed'
          : 'Premium status granted'
      );
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setUpdatingUser(null);
    }
  };

  const toggleBan = async (user: UserProfile) => {
    setUpdatingUser(user.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !user.is_banned })
        .eq('id', user.id);

      if (error) throw error;

      setUsers(prev =>
        prev.map(u =>
          u.id === user.id ? { ...u, is_banned: !u.is_banned } : u
        )
      );

      toast.success(user.is_banned ? 'User unbanned' : 'User banned');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setUpdatingUser(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">User Management</h1>
            <p className="text-slate-400 mt-1">Manage registered users</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 w-full sm:w-64"
            />
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
                  <TableHead className="text-slate-400">User</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Joined</TableHead>
                  <TableHead className="text-slate-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-400 py-12">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-slate-700 hover:bg-slate-800/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {user.display_name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {user.display_name || 'Anonymous User'}
                            </p>
                            <p className="text-slate-400 text-sm">ID: {user.user_id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.is_premium && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                              Premium
                            </Badge>
                          )}
                          {user.is_banned && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              Banned
                            </Badge>
                          )}
                          {!user.is_premium && !user.is_banned && (
                            <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
                              Free
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {format(new Date(user.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => togglePremium(user)}
                            disabled={updatingUser === user.id}
                            className={`border-slate-600 ${
                              user.is_premium
                                ? 'text-amber-400 hover:bg-amber-500/20'
                                : 'text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            <Crown className="h-4 w-4 mr-1" />
                            {user.is_premium ? 'Remove' : 'Grant'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleBan(user)}
                            disabled={updatingUser === user.id}
                            className={`border-slate-600 ${
                              user.is_banned
                                ? 'text-green-400 hover:bg-green-500/20'
                                : 'text-red-400 hover:bg-red-500/20'
                            }`}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            {user.is_banned ? 'Unban' : 'Ban'}
                          </Button>
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
