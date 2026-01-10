import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { Users, BookOpen, Activity, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface DailyStats {
  date: string;
  signups: number;
  stories: number;
}

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStories: 0,
    activeToday: 0,
    premiumUsers: 0,
  });
  const [chartData, setChartData] = useState<DailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchChartData();
  }, []);

  const fetchStats = async () => {
    try {
      // Get total users (profiles)
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total stories
      const { count: storyCount } = await supabase
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false);

      // Get premium users
      const { count: premiumCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_premium', true);

      // Get active users today (stories created today)
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      const { count: activeCount } = await supabase
        .from('stories')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', startOfToday)
        .lte('created_at', endOfToday);

      setStats({
        totalUsers: userCount || 0,
        totalStories: storyCount || 0,
        activeToday: activeCount || 0,
        premiumUsers: premiumCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchChartData = async () => {
    try {
      const last7Days: DailyStats[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const start = startOfDay(date).toISOString();
        const end = endOfDay(date).toISOString();

        // Get signups for this day
        const { count: signupCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', start)
          .lte('created_at', end);

        // Get stories for this day
        const { count: storyCount } = await supabase
          .from('stories')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', start)
          .lte('created_at', end);

        last7Days.push({
          date: format(date, 'MMM dd'),
          signups: signupCount || 0,
          stories: storyCount || 0,
        });
      }

      setChartData(last7Days);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-slate-400 mt-1">Monitor your platform's performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={Users}
            description="Registered accounts"
          />
          <StatsCard
            title="Total Stories"
            value={stats.totalStories}
            icon={BookOpen}
            description="Generated stories"
          />
          <StatsCard
            title="Active Today"
            value={stats.activeToday}
            icon={Activity}
            description="Users creating stories"
          />
          <StatsCard
            title="Premium Users"
            value={stats.premiumUsers}
            icon={TrendingUp}
            description="Upgraded accounts"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Signups Chart */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Signups (Last 7 Days)</h3>
            <div className="h-64">
              {!isLoading && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="signups"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#signupGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Stories Chart */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-4">Stories Generated (Last 7 Days)</h3>
            <div className="h-64">
              {!isLoading && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="storyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="stories"
                      stroke="#ec4899"
                      fillOpacity={1}
                      fill="url(#storyGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
