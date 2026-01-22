import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Search,
  Eye,
  Clock,
  MapPin,
  User,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  IndianRupee
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button, Badge, Modal } from '../components/ui';
import { adminApi } from '../services/api';
import type { AppointmentType, AppointmentStats } from '../types';
import { toast } from 'react-hot-toast';

const Appointments = () => {
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentType | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [appointmentsRes, statsRes] = await Promise.all([
        adminApi.getAppointments({
          isPublished: statusFilter === 'all' ? undefined : statusFilter === 'published',
          search: searchDebounce || undefined
        }),
        adminApi.getAppointmentStats()
      ]);

      if (appointmentsRes.success) {
        setAppointments(appointmentsRes.data);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.response?.data?.error?.message || 'Failed to load appointments');
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchDebounce]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter appointments locally for search
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.title.toLowerCase().includes(searchDebounce.toLowerCase()) ||
      apt.owner?.name?.toLowerCase().includes(searchDebounce.toLowerCase()) ||
      apt.description?.toLowerCase().includes(searchDebounce.toLowerCase());
    return matchesSearch;
  });

  const formatPrice = (cents: number | null) => {
    if (!cents || cents === 0) return 'Free';
    return `₹${(cents / 100).toLocaleString()}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (error && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">Failed to Load Appointments</h2>
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Appointments</h1>
          <p className="text-surface-500 mt-2">View all appointment types and templates.</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100 text-primary-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">{stats?.total || appointments.length}</p>
              <p className="text-xs text-surface-500">Total Types</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">
                {stats?.published || appointments.filter(a => a.isPublished).length}
              </p>
              <p className="text-xs text-surface-500">Published</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">
                {stats?.unpublished || appointments.filter(a => !a.isPublished).length}
              </p>
              <p className="text-xs text-surface-500">Unpublished</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900">
                {stats?.byOwner?.length || 0}
              </p>
              <p className="text-xs text-surface-500">Organisers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-surface-200 flex flex-col md:flex-row gap-4 justify-between bg-surface-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search appointments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
            />
          </div>
          <div className="flex rounded-lg border border-surface-200 overflow-hidden">
            {(['all', 'published', 'unpublished'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'px-4 py-2 text-sm font-medium capitalize transition-colors',
                  statusFilter === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-surface-600 hover:bg-surface-50'
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        <motion.div
          className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {loading ? (
            <div className="col-span-full py-12 text-center">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-surface-500">Loading appointments...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="col-span-full py-12 text-center text-surface-500">
              No appointments found.
            </div>
          ) : (
            filteredAppointments.map((apt) => (
              <motion.div
                key={apt.id}
                variants={itemVariants}
                className="bg-white rounded-xl border border-surface-200 p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-surface-900 line-clamp-1">{apt.title}</h3>
                      <Badge variant={apt.isPublished ? 'success' : 'warning'} size="sm">
                        {apt.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-sm text-surface-500 line-clamp-2">{apt.description || 'No description'}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-surface-600">
                    <Clock className="w-4 h-4 text-surface-400" />
                    {apt.durationMinutes} minutes
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-600">
                    <MapPin className="w-4 h-4 text-surface-400" />
                    {apt.location || 'Online'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-600">
                    <User className="w-4 h-4 text-surface-400" />
                    {apt.owner?.name || 'Unknown'}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-surface-100">
                  <div className="flex items-center gap-2">
                    {apt.isPaid && apt.bookingFeeCents ? (
                      <span className="flex items-center text-lg font-bold text-primary-600">
                        <IndianRupee className="w-4 h-4" />
                        {(apt.bookingFeeCents / 100).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-lg font-bold text-green-600">Free</span>
                    )}
                    {apt.bookingsCount !== undefined && (
                      <span className="text-sm text-surface-500">• {apt.bookingsCount} bookings</span>
                    )}
                  </div>
                  <button
                    onClick={() => { setSelectedAppointment(apt); setViewModalOpen(true); }}
                    className="p-2 hover:bg-surface-100 rounded-lg text-surface-400 hover:text-primary-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      {/* View Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title={selectedAppointment?.title || 'Appointment Details'}
        description="Appointment type details"
        size="lg"
      >
        {selectedAppointment && (
          <div className="space-y-4">
            <p className="text-surface-600">{selectedAppointment.description || 'No description provided'}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-500 mb-1">Duration</p>
                <p className="font-semibold text-surface-900">{selectedAppointment.durationMinutes} min</p>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-500 mb-1">Price</p>
                <p className="font-semibold text-surface-900">{formatPrice(selectedAppointment.bookingFeeCents)}</p>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-500 mb-1">Location</p>
                <p className="font-semibold text-surface-900">{selectedAppointment.location || 'Online'}</p>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-500 mb-1">Status</p>
                <Badge variant={selectedAppointment.isPublished ? 'success' : 'warning'}>
                  {selectedAppointment.isPublished ? 'Published' : 'Draft'}
                </Badge>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-500 mb-1">Capacity</p>
                <p className="font-semibold text-surface-900">{selectedAppointment.maxCapacity} person(s)</p>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-500 mb-1">Cancellation Policy</p>
                <p className="font-semibold text-surface-900">{selectedAppointment.cancellationHours}h before</p>
              </div>
            </div>

            {selectedAppointment.owner && (
              <div className="p-4 bg-primary-50 rounded-xl">
                <p className="text-xs text-primary-600 mb-1">Organiser</p>
                <p className="font-semibold text-surface-900">{selectedAppointment.owner.name}</p>
                <p className="text-sm text-surface-500">{selectedAppointment.owner.email}</p>
              </div>
            )}

            <div className="text-xs text-surface-400">
              Created: {new Date(selectedAppointment.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setViewModalOpen(false)} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default Appointments;
