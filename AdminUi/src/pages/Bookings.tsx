import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  RefreshCw,
  AlertCircle,
  LayoutGrid,
  List
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button, Badge, Modal, ConfirmModal } from '../components/ui';
import { toast } from 'react-hot-toast';
import { adminApi } from '../services/api';
import BookingCalendar from '../components/BookingCalendar';
import type { Booking, BookingStats, Pagination } from '../types';

type ViewMode = 'table' | 'calendar';

const Bookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]); // For calendar view
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'request' | 'booked' | 'completed' | 'cancelled'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch table data with pagination
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [bookingsRes, statsRes] = await Promise.all([
        adminApi.getBookings({
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: searchDebounce || undefined,
          page: pagination.page,
          limit: pagination.limit
        }),
        adminApi.getBookingStats()
      ]);

      if (bookingsRes.success) {
        setBookings(bookingsRes.data);
        if (bookingsRes.meta?.pagination) {
          setPagination(prev => ({ ...prev, ...bookingsRes.meta?.pagination }));
        }
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.error?.message || 'Failed to load bookings');
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchDebounce, pagination.page, pagination.limit]);

  // Fetch all bookings for calendar view
  const fetchAllBookings = useCallback(async () => {
    try {
      // Fetch more bookings for calendar (up to 500)
      const response = await adminApi.getBookings({ limit: 500 });
      if (response.success) {
        setAllBookings(response.data);
      }
    } catch (err) {
      console.error('Error fetching bookings for calendar:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (viewMode === 'calendar') {
      fetchAllBookings();
    }
  }, [viewMode, fetchAllBookings]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'booked': return <Badge variant="info">Booked</Badge>;
      case 'request': return <Badge variant="warning">Pending</Badge>;
      case 'cancelled': return <Badge variant="danger">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleCancelBooking = async (booking?: Booking) => {
    const bookingToCancel = booking || selectedBooking;
    if (!bookingToCancel) return;
    
    setActionLoading(true);
    try {
      const response = await adminApi.updateBookingStatus(bookingToCancel.id, 'cancelled');
      if (response.success) {
        // Update table bookings
        setBookings(bookings.map(b =>
          b.id === bookingToCancel.id ? { ...b, status: 'cancelled' as const } : b
        ));
        // Update calendar bookings
        setAllBookings(allBookings.map(b =>
          b.id === bookingToCancel.id ? { ...b, status: 'cancelled' as const } : b
        ));
        toast.success('Booking cancelled successfully');
        setCancelModalOpen(false);
        setSelectedBooking(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (booking: Booking, status: string) => {
    setActionLoading(true);
    try {
      const response = await adminApi.updateBookingStatus(booking.id, status);
      if (response.success) {
        const newStatus = status as 'request' | 'booked' | 'cancelled' | 'completed';
        // Update table bookings
        setBookings(bookings.map(b =>
          b.id === booking.id ? { ...b, status: newStatus } : b
        ));
        // Update calendar bookings
        setAllBookings(allBookings.map(b =>
          b.id === booking.id ? { ...b, status: newStatus } : b
        ));
        
        const statusMessages: Record<string, string> = {
          'booked': 'Booking confirmed successfully',
          'completed': 'Booking marked as completed',
          'cancelled': 'Booking cancelled successfully',
        };
        toast.success(statusMessages[status] || 'Status updated successfully');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update booking status');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (error && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">Failed to Load Bookings</h2>
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
          <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Bookings</h1>
          <p className="text-surface-500 mt-2">View and manage all bookings.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-surface-200 overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
                viewMode === 'table'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-surface-600 hover:bg-surface-50'
              )}
            >
              <List className="w-4 h-4" />
              Table
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
                viewMode === 'calendar'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-surface-600 hover:bg-surface-50'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Calendar
            </button>
          </div>
          <button 
            onClick={() => { fetchData(); if (viewMode === 'calendar') fetchAllBookings(); }}
            className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total', count: stats?.total || bookings.length, icon: CalendarDays, color: 'primary' },
          { label: 'Pending', count: stats?.byStatus.request || 0, icon: Clock, color: 'amber' },
          { label: 'Booked', count: stats?.byStatus.booked || 0, icon: Calendar, color: 'blue' },
          { label: 'Completed', count: stats?.byStatus.completed || 0, icon: CheckCircle, color: 'green' },
          { label: 'Cancelled', count: stats?.byStatus.cancelled || 0, icon: XCircle, color: 'red' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                stat.color === 'primary' ? 'bg-primary-100 text-primary-600' :
                stat.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                stat.color === 'green' ? 'bg-green-100 text-green-600' :
                'bg-red-100 text-red-600'
              )}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">{stat.count.toLocaleString()}</p>
                <p className="text-xs text-surface-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-4"
        >
          <BookingCalendar
            bookings={allBookings}
            onCancelBooking={handleCancelBooking}
            onUpdateStatus={handleUpdateStatus}
            isActionLoading={actionLoading}
          />
        </motion.div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-surface-200 flex flex-col md:flex-row gap-4 justify-between bg-surface-50/50">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
              />
            </div>
            <div className="flex flex-wrap rounded-lg border border-surface-200 overflow-hidden">
              {(['all', 'request', 'booked', 'completed', 'cancelled'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setPagination(p => ({ ...p, page: 1 })); }}
                  className={cn(
                    'px-3 py-2 text-sm font-medium capitalize transition-colors',
                    statusFilter === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-surface-600 hover:bg-surface-50'
                  )}
                >
                  {status === 'request' ? 'Pending' : status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-50 text-surface-500 font-medium border-b border-surface-200">
                <tr>
                  <th className="px-6 py-4">Appointment</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Organiser</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                        <span className="text-surface-500">Loading bookings...</span>
                      </div>
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-surface-500">
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => {
                    const { date, time } = formatDateTime(booking.startTime);
                    return (
                      <motion.tr
                        key={booking.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-surface-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4 font-medium text-surface-900">
                          {booking.appointmentType?.title || booking.subject || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-surface-900">{booking.customerName}</p>
                            <p className="text-xs text-surface-500">{booking.customerEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-surface-600">
                          {booking.appointmentType?.owner?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-surface-600">
                            <Calendar className="w-4 h-4 text-surface-400" />
                            {date}
                            <Clock className="w-4 h-4 text-surface-400 ml-2" />
                            {time}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(booking.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setSelectedBooking(booking); setViewModalOpen(true); }}
                              className="p-2 hover:bg-surface-100 rounded-lg text-surface-400 hover:text-primary-600 transition-colors"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {booking.status === 'booked' && (
                              <button
                                onClick={() => { setSelectedBooking(booking); setCancelModalOpen(true); }}
                                className="p-2 hover:bg-surface-100 rounded-lg text-surface-400 hover:text-red-600 transition-colors"
                                title="Cancel"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-surface-200 bg-surface-50/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-surface-500">
            <span>Showing {bookings.length} of {pagination.total} bookings</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="flex items-center gap-1 px-3 py-1.5 border border-surface-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="px-3 py-1.5">Page {pagination.page} of {pagination.totalPages}</span>
              <button 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="flex items-center gap-1 px-3 py-1.5 border border-surface-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="Booking Details"
        size="md"
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div className="p-4 bg-primary-50 rounded-xl">
              <h3 className="font-semibold text-surface-900 mb-1">
                {selectedBooking.appointmentType?.title || selectedBooking.subject || 'Booking'}
              </h3>
              <div className="flex items-center gap-2 text-sm text-surface-600">
                <Calendar className="w-4 h-4" />
                {new Date(selectedBooking.startTime).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                <Clock className="w-4 h-4 ml-2" />
                {new Date(selectedBooking.startTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-500 mb-1">Customer</p>
                <p className="font-medium text-surface-900">{selectedBooking.customerName}</p>
                <p className="text-sm text-surface-500">{selectedBooking.customerEmail}</p>
                {selectedBooking.customerPhone && (
                  <p className="text-sm text-surface-500">{selectedBooking.customerPhone}</p>
                )}
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-500 mb-1">Organiser</p>
                <p className="font-medium text-surface-900">
                  {selectedBooking.appointmentType?.owner?.name || 'N/A'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-surface-50 rounded-xl flex items-center justify-between">
              <span className="text-surface-600">Status</span>
              {getStatusBadge(selectedBooking.status)}
            </div>

            <div className="text-xs text-surface-400">
              Created: {new Date(selectedBooking.createdAt).toLocaleString()}
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setViewModalOpen(false)} className="flex-1">
                Close
              </Button>
              {selectedBooking.status === 'booked' && (
                <Button 
                  variant="danger" 
                  onClick={() => { setViewModalOpen(false); setCancelModalOpen(true); }} 
                  className="flex-1"
                >
                  Cancel Booking
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Modal */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={() => handleCancelBooking()}
        title="Cancel Booking"
        message={`Are you sure you want to cancel the booking for ${selectedBooking?.customerName}? This action cannot be undone.`}
        confirmText="Cancel Booking"
        variant="danger"
        isLoading={actionLoading}
      />
    </motion.div>
  );
};

export default Bookings;
