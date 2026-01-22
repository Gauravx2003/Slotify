import { useState, useEffect } from "react";
import {
  Calendar,
  BarChart3,
  Settings,
  Users,
  Package,
  LogOut,
  Search,
  Filter,
  Download,
  AlertCircle,
  Mail,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { useAuth } from "../../hooks/useAuth";
import { logout as logoutAction } from "../../store/authSlice";
import type { AppDispatch } from "../../store";
import toast from "react-hot-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Avatar } from "../../components/Avatar";

// Mock Data
const MOCK_MEETINGS = [
  {
    id: "1",
    name: "Consultation with Vipin Jindal",
    attendee: "Vipin Jindal",
    time: "2024-12-12T16:00:00",
    resource: null,
    email: "vipin.jindal@example.com",
    status: "completed",
  },
  {
    id: "2",
    name: "Legal Advice - Tarak Gor",
    attendee: "Tarak Gor",
    time: "2024-12-13T09:00:00",
    resource: "Court 1",
    email: "tarak.gor@example.com",
    status: "scheduled",
  },
  {
    id: "3",
    name: "Checkup - Sarah Smith",
    attendee: "Sarah Smith",
    time: "2024-12-14T11:30:00",
    resource: "Room A",
    email: "sarah.smith@example.com",
    status: "completed",
  },
  {
    id: "4",
    name: "Therapy Session - John Doe",
    attendee: "John Doe",
    time: "2024-12-15T14:00:00",
    resource: "Office 2",
    email: "john.doe@example.com",
    status: "cancelled",
  },
  {
    id: "5",
    name: "Consultation - Emily Davis",
    attendee: "Emily Davis",
    time: "2024-12-16T10:00:00",
    resource: null,
    email: "emily.davis@example.com",
    status: "completed",
  },
];

const MOCK_CHART_DATA = [
  { name: "Mon", meetings: 4, users: 3 },
  { name: "Tue", meetings: 7, users: 5 },
  { name: "Wed", meetings: 5, users: 4 },
  { name: "Thu", meetings: 9, users: 8 },
  { name: "Fri", meetings: 12, users: 10 },
  { name: "Sat", meetings: 8, users: 6 },
  { name: "Sun", meetings: 3, users: 2 },
];

const MOCK_RESOURCE_USAGE = [
  { name: "Room A", usage: 12 },
  { name: "Court 1", usage: 8 },
  { name: "Office 2", usage: 15 },
  { name: "Lab 3", usage: 5 },
];

const MOCK_STATUS_DISTRIBUTION = [
  { name: "Completed", value: 35 },
  { name: "Scheduled", value: 15 },
  { name: "Cancelled", value: 5 },
  { name: "No Show", value: 2 },
];

const COLORS = ["#10B981", "#3B82F6", "#EF4444", "#F59E0B"];

const Reporting = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>(MOCK_CHART_DATA);
  const [resourceUsage, setResourceUsage] = useState<any[]>(MOCK_RESOURCE_USAGE);
  const [statusDistribution, setStatusDistribution] = useState<any[]>(MOCK_STATUS_DISTRIBUTION);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await fetch('http://localhost:3000/api/reporting/stats', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setMeetings(result.data.recentMeetings || []);
        setWeeklyData(result.data.weeklyData || MOCK_CHART_DATA);
        setResourceUsage(result.data.resourceUsage || MOCK_RESOURCE_USAGE);
        setStatusDistribution(result.data.statusDistribution || MOCK_STATUS_DISTRIBUTION);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to fetch report data', error);
      setIsError(true);
      toast.error('Unable to load live data. Showing demonstration data.', {
        icon: '⚠️',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      // Fallback to Mock Data
      setMeetings(MOCK_MEETINGS);
      setWeeklyData(MOCK_CHART_DATA);
      setResourceUsage(MOCK_RESOURCE_USAGE);
      setStatusDistribution(MOCK_STATUS_DISTRIBUTION);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMeetings = meetings.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.attendee.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-surface-900 font-sans">
      {/* 1️⃣ Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-rust-100/50 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-rust-500 rounded-xl flex items-center justify-center transform -rotate-12 group-hover:rotate-0 transition-transform shadow-lg shadow-rust-500/20">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-surface-900">
                Slotify <span className="text-rust-500">Organizer</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/organizer/dashboard"
                className="px-6 py-2 rounded-xl text-sm font-bold text-surface-500 hover:bg-surface-50 flex items-center gap-2 transition-colors"
              >
                <Calendar className="w-4 h-4" /> Appointments
              </Link>
              <button className="px-6 py-2 rounded-xl text-sm font-bold text-rust-600 bg-rust-50 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Reporting
              </button>

              {/* Settings Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-surface-500 hover:bg-surface-50 flex items-center gap-2 transition-colors"
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>

                <AnimatePresence>
                  {showSettingsDropdown && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setShowSettingsDropdown(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white border border-rust-100 rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        <button
                          onClick={() => {
                            navigate("/organizer/users");
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm font-bold text-surface-700 hover:bg-rust-50 transition-colors flex items-center gap-3"
                        >
                          <Users className="w-4 h-4 text-rust-500" />
                          Users
                        </button>
                        <button
                          onClick={() => {
                            navigate("/organizer/resources");
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm font-bold text-surface-700 hover:bg-rust-50 transition-colors flex items-center gap-3"
                        >
                          <Package className="w-4 h-4 text-rust-500" />
                          Resources
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-rust-50 rounded-xl">
              <Avatar
                name={user?.name}
                src={user?.image}
                size="sm"
                className="rounded-lg"
              />
              <span className="text-sm font-bold text-surface-900">
                {user?.name || "User"}
              </span>
            </div>

            <button
              onClick={() => {
                dispatch(logoutAction());
                toast.success("Logged out successfully");
                navigate("/login");
              }}
              className="px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black text-surface-900 tracking-tight mb-2">
              Performance Reports
            </h1>
            <p className="text-lg text-surface-500 font-medium">
              Analyze your organization's meetings, resource usage, and trends.
            </p>
          </div>
          {isError && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold border border-amber-200">
              <AlertCircle className="w-4 h-4" />
              Viewing Demonstration Data (Server Unavailable)
            </div>
          )}
        </div>

        {/* 2️⃣ Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main Chart: Meetings Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white border border-rust-100 rounded-[2rem] p-8 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-surface-900">
                Weekly Meeting Overview
              </h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-rust-50 text-rust-600 rounded-lg text-xs font-bold">
                  Weekly
                </button>
                <button className="px-3 py-1 bg-surface-50 text-surface-500 rounded-lg text-xs font-bold hover:bg-surface-100">
                  Monthly
                </button>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient
                      id="colorMeetings"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#EA580C" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="meetings"
                    stroke="#EA580C"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorMeetings)"
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Secondary Chart: Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-rust-100 rounded-[2rem] p-8 shadow-sm flex flex-col"
          >
            <h2 className="text-xl font-bold text-surface-900 mb-6">
              Meeting Status
            </h2>
            <div className="flex-grow flex items-center justify-center relative">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                      cornerRadius={6}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center mb-9 pointer-events-none">
                  <div className="text-center">
                    <span className="block text-3xl font-black text-surface-900">
                      {statusDistribution.reduce((sum, item) => sum + item.value, 0)}
                    </span>
                    <span className="text-xs font-bold text-surface-400 uppercase tracking-wide">Total</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Third Chart: Resource Usage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 bg-white border border-rust-100 rounded-[2rem] p-8 shadow-sm"
          >
            <h2 className="text-xl font-bold text-surface-900 mb-6">
              Resource Utilization
            </h2>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceUsage}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* 3️⃣ Meetings Table */}
        <div className="bg-white border border-rust-100 rounded-[2rem] p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <h2 className="text-2xl font-bold text-surface-900">
              Recent Meetings
            </h2>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 group-focus-within:text-rust-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search name, phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-surface-50 border border-rust-50 rounded-xl focus:ring-2 focus:ring-rust-500/10 focus:border-rust-500 outline-none transition-all font-medium text-sm"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-surface-400">
                    Name
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-surface-400">
                    Time
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-surface-400">
                    Resource
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-black uppercase tracking-widest text-surface-400">
                    Email
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-black uppercase tracking-widest text-surface-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4">
                        <div className="h-4 w-32 bg-surface-100 rounded"></div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-24 bg-surface-100 rounded"></div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-20 bg-surface-100 rounded"></div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="h-4 w-28 bg-surface-100 rounded"></div>
                      </td>
                      <td className="py-4 px-4"></td>
                    </tr>
                  ))
                ) : filteredMeetings.length > 0 ? (
                  filteredMeetings.map((meeting) => (
                    <tr
                      key={meeting.id}
                      className="group hover:bg-surface-50/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={meeting.attendee} size="md" />
                          <span className="font-bold text-surface-900">{meeting.attendee}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-surface-900 bg-surface-100 px-2 py-1 rounded inline-block w-fit mb-1">
                            {new Date(meeting.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-xs text-surface-500 font-medium">
                            {new Date(meeting.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {meeting.resource ? (
                          <span className="flex items-center gap-1.5 text-sm font-bold text-surface-700">
                            <Package className="w-4 h-4 text-rust-500" />
                            {meeting.resource}
                          </span>
                        ) : (
                          <span className="text-sm text-surface-400 font-medium italic">No Resource</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-surface-600 font-medium">
                          <Mail className="w-4 h-4 text-surface-400" />
                          {meeting.email}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button className="text-rust-600 hover:text-rust-700 font-bold text-sm">View Details</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-surface-500 font-medium"
                    >
                      No meetings found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reporting;
