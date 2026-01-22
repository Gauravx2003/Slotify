import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  ArrowUpRight,
  UserCheck,
  CalendarClock,
  XCircle,
  AlertCircle,
  RefreshCw
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
  Bar
} from 'recharts';
import StatsCard from '../components/StatsCard';
import { adminApi } from '../services/api';
import type { DashboardStats, BookingStats, UserStats, AppointmentStats, PeakHourData } from '../types';
import { toast } from 'react-hot-toast';
import { cn } from '../utils/cn';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [peakHours, setPeakHours] = useState<PeakHourData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dashboardRes, userRes, bookingRes, appointmentRes, peakRes] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getUserStats(),
        adminApi.getBookingStats(),
        adminApi.getAppointmentStats(),
        adminApi.getPeakHours()
      ]);
      
      if (dashboardRes.success) setStats(dashboardRes.data);
      if (userRes.success) setUserStats(userRes.data);
      if (bookingRes.success) setBookingStats(bookingRes.data);
      if (appointmentRes.success) setAppointmentStats(appointmentRes.data);
      if (peakRes.success) setPeakHours(peakRes.data);
      
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.error?.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
          <p className="text-surface-500 font-medium">Loading dashboard...</p>
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
            <h2 className="text-xl font-bold text-surface-900 mb-2">Failed to Load Dashboard</h2>
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

  // Chart colors
  const userRoleData = userStats ? [
    { name: 'Customers', value: userStats.byRole.customer, color: '#6366f1' },
    { name: 'Organisers', value: userStats.byRole.organiser, color: '#22c55e' },
    { name: 'Admins', value: userStats.byRole.admin, color: '#f59e0b' },
  ] : [];

  const bookingStatusData = bookingStats ? [
    { name: 'Completed', value: bookingStats.byStatus.completed, color: '#22c55e' },
    { name: 'Booked', value: bookingStats.byStatus.booked, color: '#6366f1' },
    { name: 'Pending', value: bookingStats.byStatus.request, color: '#f59e0b' },
    { name: 'Cancelled', value: bookingStats.byStatus.cancelled, color: '#ef4444' },
  ] : [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Calculate trends (comparing to typical averages)
  const userTrend = userStats ? Math.round((userStats.activeUsers / userStats.total) * 100 - 80) : 0;
  const completionRate = bookingStats ? Math.round((bookingStats.byStatus.completed / bookingStats.total) * 100) : 0;

  return (
    <motion.div 
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-surface-500 mt-2">Welcome back! Here's what's happening with your business today.</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers.toLocaleString() || '0'}
          icon={Users}
          color="primary"
          trend={{ value: userTrend, isPositive: userTrend > 0 }}
        />
        <StatsCard
          title="Total Appointments"
          value={stats?.totalAppointments.toLocaleString() || '0'}
          icon={Calendar}
          color="rust"
          trend={{ value: appointmentStats?.published || 0, isPositive: true }}
        />
        <StatsCard
          title="Active Bookings"
          value={stats?.activeBookings.toLocaleString() || '0'}
          icon={CalendarClock}
          color="spring"
          trend={{ value: bookingStats?.upcomingBookings || 0, isPositive: true }}
        />
        <StatsCard
          title="Completed"
          value={stats?.completedBookings.toLocaleString() || '0'}
          icon={CheckCircle}
          color="green"
          trend={{ value: completionRate, isPositive: completionRate > 50 }}
        />
      </motion.div>

      {/* Secondary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900">{userStats?.activeUsers.toLocaleString() || 0}</p>
            <p className="text-xs text-surface-500">Active Users</p>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900">{bookingStats?.todayBookings || 0}</p>
            <p className="text-xs text-surface-500">Today's Bookings</p>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-purple-100 text-purple-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900">{bookingStats?.upcomingBookings || 0}</p>
            <p className="text-xs text-surface-500">Upcoming</p>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-red-100 text-red-600">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900">{stats?.cancelledBookings || 0}</p>
            <p className="text-xs text-surface-500">Cancelled</p>
          </div>
        </div>
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Peak Hours Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-surface-900">Booking Trends</h3>
              <p className="text-sm text-surface-500">Peak booking hours (last 30 days)</p>
            </div>
            {peakHours.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1.5 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  {peakHours.reduce((sum, h) => sum + h.bookingsCount, 0)} total
                </span>
              </div>
            )}
          </div>
          {peakHours.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={peakHours} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(hour) => `${hour}:00`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)' 
                    }}
                    labelFormatter={(hour) => `${hour}:00 - ${Number(hour)+1}:00`}
                    formatter={(value: number) => [value, 'Bookings']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="bookingsCount" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorBookings)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-surface-500">
              No booking data available
            </div>
          )}
        </div>

        {/* User Distribution Pie */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-surface-900 mb-2">User Distribution</h3>
          <p className="text-sm text-surface-500 mb-4">By role</p>
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
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        borderRadius: '12px', 
                        border: 'none',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {userRoleData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-surface-600">{item.name}: {item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-surface-500">
              No user data available
            </div>
          )}
        </div>
      </motion.div>

      {/* Bottom Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-surface-900 mb-2">Booking Status</h3>
          <p className="text-sm text-surface-500 mb-6">Overall booking distribution</p>
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
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      borderRadius: '12px', 
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {bookingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-surface-500">
              No booking data available
            </div>
          )}
        </div>

        {/* Top Organisers */}
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold text-surface-900 mb-2">Top Organisers</h3>
          <p className="text-sm text-surface-500 mb-6">By appointment count</p>
          {appointmentStats?.byOwner && appointmentStats.byOwner.length > 0 ? (
            <div className="space-y-4">
              {appointmentStats.byOwner.slice(0, 5).map((org, index) => (
                <div key={org.ownerId} className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    index === 0 ? "bg-amber-100 text-amber-700" :
                    index === 1 ? "bg-gray-100 text-gray-700" :
                    index === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-surface-100 text-surface-600"
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-surface-900">{org.ownerName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                          style={{ width: `${(org.count / (appointmentStats.byOwner[0]?.count || 1)) * 100}%` }}
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
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-surface-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/users')}
            className="p-4 rounded-xl border-2 border-dashed border-surface-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
          >
            <Users className="w-6 h-6 text-surface-400 group-hover:text-primary-600 mx-auto mb-2 transition-colors" />
            <p className="text-sm font-medium text-surface-600 group-hover:text-primary-700 transition-colors">Manage Users</p>
          </button>
          <button 
            onClick={() => navigate('/appointments')}
            className="p-4 rounded-xl border-2 border-dashed border-surface-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
          >
            <Calendar className="w-6 h-6 text-surface-400 group-hover:text-primary-600 mx-auto mb-2 transition-colors" />
            <p className="text-sm font-medium text-surface-600 group-hover:text-primary-700 transition-colors">View Appointments</p>
          </button>
          <button 
            onClick={() => navigate('/analytics')}
            className="p-4 rounded-xl border-2 border-dashed border-surface-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
          >
            <TrendingUp className="w-6 h-6 text-surface-400 group-hover:text-primary-600 mx-auto mb-2 transition-colors" />
            <p className="text-sm font-medium text-surface-600 group-hover:text-primary-700 transition-colors">Analytics</p>
          </button>
          <button 
            onClick={() => navigate('/bookings')}
            className="p-4 rounded-xl border-2 border-dashed border-surface-200 hover:border-primary-300 hover:bg-primary-50/50 transition-all group"
          >
            <CalendarClock className="w-6 h-6 text-surface-400 group-hover:text-primary-600 mx-auto mb-2 transition-colors" />
            <p className="text-sm font-medium text-surface-600 group-hover:text-primary-700 transition-colors">Bookings</p>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
