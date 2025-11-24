import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Users, TrendingUp, UserCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { dashboardApi } from '@/services/api';
import { ChartContainer, ChartTooltipContent, ChartLegend } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { BarChart, Bar } from 'recharts';

interface DashboardStats {
  totalJobs: number;
  totalCandidates: number;
  avgMatchScore: number;
  shortlistedCandidates: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    totalCandidates: 0,
    avgMatchScore: 0,
    shortlistedCandidates: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<{ date: string; uploads: number; matches: number }[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [scoreDist, setScoreDist] = useState<{ bucket: number; count: number }[]>([]);
  const [scoreLoading, setScoreLoading] = useState(false);

  useEffect(() => {
    loadStats();
    loadActivity();
    loadScoreDistribution();
  }, []);

  const loadStats = async () => {
    try {
      const response = await dashboardApi.getStats();
      // TODO: Map actual API response to stats
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScoreDistribution = async () => {
    setScoreLoading(true);
    try {
      const res = await dashboardApi.getScoreDistribution();
      const data = res?.data?.buckets || [];
      setScoreDist(data);
    } catch (err) {
      console.error('Failed to load score distribution:', err);
      setScoreDist([]);
    } finally {
      setScoreLoading(false);
    }
  };

  const loadActivity = async () => {
    setActivityLoading(true);
    try {
      const res = await dashboardApi.getActivity();
      const data = res?.data?.series || [];
      setActivity(data);
    } catch (err) {
      console.error('Failed to load activity:', err);
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Jobs',
      value: stats.totalJobs,
      icon: Briefcase,
      color: 'text-primary',
    },
    {
      title: 'Total Candidates',
      value: stats.totalCandidates,
      icon: Users,
      color: 'text-secondary',
    },
    {
      title: 'Avg Match Score',
      value: `${stats.avgMatchScore.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-muted',
    },
    {
      title: 'Shortlisted',
      value: stats.shortlistedCandidates,
      icon: UserCheck,
      color: 'text-accent-foreground',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your recruitment pipeline
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {activityLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">Loading activity...</p>
                </div>
              ) : activity.length === 0 ? (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-md">
                  <p className="text-muted-foreground">No activity yet</p>
                </div>
              ) : (
                <ChartContainer config={{ uploads: { label: 'Uploads', color: '#6366F1' }, matches: { label: 'Matches', color: '#10B981' } }}>
                  <LineChart data={activity} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend verticalAlign="top" />
                    <Line type="monotone" dataKey="uploads" stroke="var(--color-uploads)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="matches" stroke="var(--color-matches)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Match Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {scoreLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">Loading distribution...</p>
                </div>
              ) : scoreDist.length === 0 ? (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-md">
                  <p className="text-muted-foreground">No matches yet</p>
                </div>
              ) : (
                <ChartContainer config={{ distribution: { label: 'Matches', color: '#ef4444' } }}>
                  <BarChart data={scoreDist} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="bucket" tickFormatter={(b) => `${b}%`} />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend verticalAlign="top" />
                    <Bar dataKey="count" fill="var(--color-distribution)" />
                  </BarChart>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
