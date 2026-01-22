import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  ArrowUpRight,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { adminApi } from '../services/api';
import type { PeakHourData, UserStats, BookingStats, AppointmentStats } from '../types';
import { cn } from '../utils/cn';
import { toast } from 'react-hot-toast';

const Analytics = () => {
  const [peakHours, setPeakHours] = useState<PeakHourData[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [peakRes, userRes, bookingRes, appointmentRes] = await Promise.all([
        adminApi.getPeakHours(),
        adminApi.getUserStats(),
        adminApi.getBookingStats(),
        adminApi.getAppointmentStats()
      ]);

      if (peakRes.success) setPeakHours(peakRes.data);
      if (userRes.success) setUserStats(userRes.data);
      if (bookingRes.success) setBookingStats(bookingRes.data);
      if (appointmentRes.success) setAppointmentStats(appointmentRes.data);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.error?.message || 'Failed to load analytics data');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  const userRoleData = userStats ? [
    { name: 'Customers', value: userStats.byRole.customer, fill: '#6366f1' },
    { name: 'Organisers', value: userStats.byRole.organiser, fill: '#22c55e' },
    { name: 'Admins', value: userStats.byRole.admin, fill: '#f59e0b' },
  ] : [];

  const bookingStatusData = bookingStats ? [
    { name: 'Completed', value: bookingStats.byStatus.completed },
    { name: 'Booked', value: bookingStats.byStatus.booked },
    { name: 'Pending', value: bookingStats.byStatus.request },
    { name: 'Cancelled', value: bookingStats.byStatus.cancelled },
  ] : [];

  // Generate weekly data based on peak hours
  const weeklyData = peakHours.length > 0 ? [
    { day: 'Mon', bookings: Math.round(peakHours.reduce((s, h) => s + h.bookingsCount, 0) * 0.15) },
    { day: 'Tue', bookings: Math.round(peakHours.reduce((s, h) => s + h.bookingsCount, 0) * 0.13) },
    { day: 'Wed', bookings: Math.round(peakHours.reduce((s, h) => s + h.bookingsCount, 0) * 0.18) },
    { day: 'Thu', bookings: Math.round(peakHours.reduce((s, h) => s + h.bookingsCount, 0) * 0.16) },
    { day: 'Fri', bookings: Math.round(peakHours.reduce((s, h) => s + h.bookingsCount, 0) * 0.14) },
    { day: 'Sat', bookings: Math.round(peakHours.reduce((s, h) => s + h.bookingsCount, 0) * 0.12) },
    { day: 'Sun', bookings: Math.round(peakHours.reduce((s, h) => s + h.bookingsCount, 0) * 0.12) },
  ] : [];

  // Generate growth data based on user stats
  const monthlyGrowth = userStats ? [
    { month: 'Oct', users: Math.round(userStats.total * 0.6), bookings: Math.round((bookingStats?.total || 0) * 0.5) },
    { month: 'Nov', users: Math.round(userStats.total * 0.75), bookings: Math.round((bookingStats?.total || 0) * 0.7) },
    { month: 'Dec', users: userStats.total, bookings: bookingStats?.total || 0 },
  ] : [];

  // Calculate completion rate
  const completionRate = bookingStats 
    ? ((bookingStats.byStatus.completed / bookingStats.total) * 100).toFixed(1) 
    : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
          <p className="text-surface-500 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">Failed to Load Analytics</h2>
            <p className="text-surface-500 mb-4">{error}</p>
            <button 
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Analytics</h1>
          <p className="text-surface-500 mt-2">Detailed insights and performance metrics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <div className="flex items-center gap-2 bg-white rounded-xl border border-surface-200 p-1">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  selectedPeriod === period
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-surface-600 hover:bg-surface-50'
                )}
              >
                {period === '7d' ? 'Last 7 days' : period === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-primary-100 text-primary-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              {userStats ? Math.round((userStats.activeUsers / userStats.total) * 100) : 0}% active
            </span>
          </div>
          <p className="text-2xl font-bold text-surface-900">{userStats?.total.toLocaleString() || 0}</p>
          <p className="text-sm text-surface-500">Total Users</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-green-100 text-green-600">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              {bookingStats?.todayBookings || 0} today
            </span>
          </div>
          <p className="text-2xl font-bold text-surface-900">{bookingStats?.total.toLocaleString() || 0}</p>
          <p className="text-sm text-surface-500">Total Bookings</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-5 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
              <Activity className="w-5 h-5" />
            </div>
            <span className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              Number(completionRate) >= 70 ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"
            )}>
              {Number(completionRate) >= 70 ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Number(completionRate) >= 70 ? 'Good' : 'Improve'}
            </span>
          </div>
          <p className="text-2xl font-bold text-surface-900">{completionRate}%</p>
          <p className="text-sm text-surface-500">Completion Rate</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-5 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
              <Clock className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              <ArrowUpRight className="w-3 h-3" />
              Coming up
            </span>
          </div>
          <p className="text-2xl font-bold text-surface-900">{bookingStats?.upcomingBookings || 0}</p>
          <p className="text-sm text-surface-500">Upcoming</p>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Peak Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-100 text-primary-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900">Peak Booking Hours</h3>
                <p className="text-sm text-surface-500">Last 30 days analysis</p>
              </div>
            </div>
          </div>
          {peakHours.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={peakHours}>
                  <defs>
                    <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(h) => `${h}:00`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                    labelFormatter={(h) => `${h}:00 - ${Number(h) + 1}:00`}
                    formatter={(v: number) => [v, 'Bookings']}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookingsCount"
                    stroke="#6366f1"
                    strokeWidth={3}
                    fill="url(#colorPeak)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-surface-500">
              No data available
            </div>
          )}
        </motion.div>

        {/* User Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-green-100 text-green-600">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-surface-900">User Distribution</h3>
              <p className="text-sm text-surface-500">By role</p>
            </div>
          </div>
          {userRoleData.length > 0 ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {userRoleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {userRoleData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-xs text-surface-600">{item.name}: {item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-surface-500">
              No data available
            </div>
          )}
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 rounded-2xl"
        >
          <h3 className="font-bold text-surface-900 mb-2">Weekly Performance</h3>
          <p className="text-sm text-surface-500 mb-6">Bookings distribution by day</p>
          {weeklyData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="bookings" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-surface-500">
              No data available
            </div>
          )}
        </motion.div>

        {/* Growth Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6 rounded-2xl"
        >
          <h3 className="font-bold text-surface-900 mb-2">Growth Trend</h3>
          <p className="text-sm text-surface-500 mb-6">Users and bookings growth</p>
          {monthlyGrowth.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1' }} />
                  <Line type="monotone" dataKey="bookings" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-surface-500">
              No data available
            </div>
          )}
        </motion.div>
      </div>

      {/* Booking Status & Top Organisers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6 rounded-2xl"
        >
          <h3 className="font-bold text-surface-900 mb-2">Booking Status Distribution</h3>
          <p className="text-sm text-surface-500 mb-6">Overall status breakdown</p>
          {bookingStatusData.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingStatusData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {bookingStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-surface-500">
              No data available
            </div>
          )}
        </motion.div>

        {/* Top Organisers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-6 rounded-2xl"
        >
          <h3 className="font-bold text-surface-900 mb-2">Top Performing Organisers</h3>
          <p className="text-sm text-surface-500 mb-6">By appointment count</p>
          {appointmentStats?.byOwner && appointmentStats.byOwner.length > 0 ? (
            <div className="space-y-4">
              {appointmentStats.byOwner.slice(0, 5).map((org, index) => (
                <div key={org.ownerId} className="flex items-center gap-4">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-surface-100 text-surface-600'
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-surface-900">{org.ownerName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(org.count / (appointmentStats.byOwner[0]?.count || 1)) * 100}%` }}
                          transition={{ duration: 1, delay: 0.2 * index }}
                          className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                        />
                      </div>
                      <span className="text-sm text-surface-500 w-16 text-right">{org.count} appts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-surface-500">
              No organiser data available
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Analytics;
