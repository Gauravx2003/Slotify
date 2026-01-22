import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Calendar as RBCalendar,
  dateFnsLocalizer,
  Views,
} from 'react-big-calendar';
import type { SlotInfo, CalendarProps } from 'react-big-calendar';

import { format, parse, startOfWeek, getDay, addMonths, subMonths } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  XCircle,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Badge, Button, ConfirmModal } from './ui';
import type { Booking } from '../types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Date-fns localizer setup
const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Event type for calendar
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Booking;
}

// Type assertion for React 18 compatibility
const BigCalendar = RBCalendar as React.ComponentType<CalendarProps<CalendarEvent, object>>;

interface BookingCalendarProps {
  bookings: Booking[];
  onCancelBooking: (booking: Booking) => Promise<void>;
  onUpdateStatus?: (booking: Booking, status: string) => Promise<void>;
  isActionLoading?: boolean;
}

const BookingCalendar = ({ bookings, onCancelBooking, onUpdateStatus, isActionLoading }: BookingCalendarProps) => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<typeof Views[keyof typeof Views]>(Views.MONTH);
  const [hasNavigatedToBookings, setHasNavigatedToBookings] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Convert bookings to calendar events
  const events: CalendarEvent[] = useMemo(() => {
    return bookings.map((booking) => ({
      id: booking.id,
      title: `${booking.customerName} - ${booking.appointmentType?.title || 'Appointment'}`,
      start: new Date(booking.startTime),
      end: new Date(booking.endTime),
      resource: booking,
    }));
  }, [bookings]);

  // Get the date range of bookings
  const bookingDateRange = useMemo(() => {
    if (events.length === 0) return null;
    
    const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
    const firstBooking = sortedEvents[0];
    const lastBooking = sortedEvents[sortedEvents.length - 1];
    
    // Find upcoming bookings (today or future)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const upcomingEvent = sortedEvents.find(e => e.start >= now);
    
    return {
      first: firstBooking.start,
      last: lastBooking.start,
      upcoming: upcomingEvent?.start,
      count: events.length
    };
  }, [events]);

  // Auto-navigate to first booking when bookings load
  useEffect(() => {
    if (bookingDateRange && !hasNavigatedToBookings) {
      // Navigate to the month with upcoming bookings, or the first booking if all are in the past
      const targetDate = bookingDateRange.upcoming || bookingDateRange.first;
      setCurrentDate(targetDate);
      setHasNavigatedToBookings(true);
    }
  }, [bookingDateRange, hasNavigatedToBookings]);

  // Event style based on status
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor = '#3b82f6'; // default blue
    let borderColor = '#2563eb';

    switch (status) {
      case 'completed':
        backgroundColor = '#10b981';
        borderColor = '#059669';
        break;
      case 'booked':
        backgroundColor = '#3b82f6';
        borderColor = '#2563eb';
        break;
      case 'request':
        backgroundColor = '#f59e0b';
        borderColor = '#d97706';
        break;
      case 'cancelled':
        backgroundColor = '#ef4444';
        borderColor = '#dc2626';
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderRadius: '6px',
        opacity: status === 'cancelled' ? 0.6 : 1,
        color: 'white',
        border: `2px solid ${borderColor}`,
        fontSize: '0.75rem',
        fontWeight: 500,
        padding: '2px 6px',
      },
    };
  }, []);

  // Handle event click
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  }, []);

  // Handle slot click (for empty slots)
  const handleSelectSlot = useCallback((_slotInfo: SlotInfo) => {
    // Could be used to create new bookings
  }, []);

  // Navigation handlers
  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
  }, []);

  const handleViewChange = useCallback((newView: typeof Views[keyof typeof Views]) => {
    setView(newView);
  }, []);

  const goToToday = () => setCurrentDate(new Date());
  
  const goToBookings = () => {
    if (bookingDateRange) {
      const targetDate = bookingDateRange.upcoming || bookingDateRange.first;
      setCurrentDate(targetDate);
    }
  };

  const goToPrev = () => {
    if (view === Views.MONTH) {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === Views.WEEK) {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    }
  };
  
  const goToNext = () => {
    if (view === Views.MONTH) {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === Views.WEEK) {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" className="gap-1"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      case 'booked':
        return <Badge variant="info" className="gap-1"><CalendarIcon className="w-3 h-3" /> Booked</Badge>;
      case 'request':
        return <Badge variant="warning" className="gap-1"><AlertCircle className="w-3 h-3" /> Pending</Badge>;
      case 'cancelled':
        return <Badge variant="danger" className="gap-1"><XCircle className="w-3 h-3" /> Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleCancelClick = () => {
    setPendingAction('cancelled');
    setShowDetailsModal(false);
    setShowCancelModal(true);
  };

  const handleConfirmBooking = () => {
    setPendingAction('booked');
    setShowDetailsModal(false);
    setShowConfirmModal(true);
  };

  const handleCompleteBooking = () => {
    setPendingAction('completed');
    setShowDetailsModal(false);
    setShowConfirmModal(true);
  };

  const handleConfirmCancel = async () => {
    if (selectedEvent) {
      await onCancelBooking(selectedEvent.resource);
      setShowCancelModal(false);
      setSelectedEvent(null);
    }
  };

  const handleConfirmAction = async () => {
    if (selectedEvent && pendingAction && onUpdateStatus) {
      await onUpdateStatus(selectedEvent.resource, pendingAction);
      setShowConfirmModal(false);
      setSelectedEvent(null);
      setPendingAction(null);
    }
  };

  const getActionLabel = () => {
    switch (pendingAction) {
      case 'booked': return 'Confirm Booking';
      case 'completed': return 'Mark as Completed';
      default: return 'Confirm';
    }
  };

  // Count events in current view
  const eventsInCurrentMonth = useMemo(() => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    return events.filter(e => e.start >= monthStart && e.start <= monthEnd).length;
  }, [events, currentDate]);

  return (
    <div className="h-full">
      {/* Custom Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 p-4 bg-white rounded-xl border border-surface-200">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={goToPrev}
            className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-surface-600" />
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToNext}
            className="p-2 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-surface-600" />
          </button>
          
          {/* Jump to bookings button */}
          {bookingDateRange && (
            <button
              onClick={goToBookings}
              className="ml-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Go to Bookings
            </button>
          )}
          
          <div className="ml-4 flex items-center gap-3">
            <h2 className="text-lg font-semibold text-surface-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <span className="px-2 py-1 text-xs font-medium bg-surface-100 text-surface-600 rounded-full">
              {eventsInCurrentMonth} booking{eventsInCurrentMonth !== 1 ? 's' : ''} this month
            </span>
          </div>
        </div>

        <div className="flex rounded-lg border border-surface-200 overflow-hidden">
          {[
            { key: Views.MONTH, label: 'Month' },
            { key: Views.WEEK, label: 'Week' },
            { key: Views.DAY, label: 'Day' },
            { key: Views.AGENDA, label: 'Agenda' },
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => handleViewChange(v.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium transition-colors',
                view === v.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-surface-600 hover:bg-surface-50'
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend and Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 px-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm text-surface-500">Status:</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-surface-600">Booked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm text-surface-600">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-surface-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 opacity-60" />
            <span className="text-sm text-surface-600">Cancelled</span>
          </div>
        </div>
        
        {/* Date range info */}
        {bookingDateRange && (
          <div className="text-sm text-surface-500">
            Total: <span className="font-semibold text-surface-700">{bookingDateRange.count}</span> bookings 
            {bookingDateRange.first && bookingDateRange.last && (
              <span> from <span className="font-medium">{format(bookingDateRange.first, 'MMM d')}</span> to <span className="font-medium">{format(bookingDateRange.last, 'MMM d, yyyy')}</span></span>
            )}
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-surface-200 p-4 calendar-container" style={{ height: 'calc(100vh - 420px)', minHeight: '500px' }}>
        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          date={currentDate}
          view={view}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          toolbar={false}
          popup
          views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        />
      </div>

      {/* Booking Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">
                      {selectedEvent.resource.appointmentType?.title || 'Booking Details'}
                    </h3>
                    <p className="text-primary-100 text-sm">
                      {formatDate(selectedEvent.resource.startTime)}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Time */}
                <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Clock className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-surface-500">Time</p>
                    <p className="font-semibold text-surface-900">
                      {formatTime(selectedEvent.resource.startTime)} - {formatTime(selectedEvent.resource.endTime)}
                    </p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                    <User className="w-5 h-5 text-surface-400" />
                    <div>
                      <p className="text-xs text-surface-500">Customer</p>
                      <p className="font-medium text-surface-900">{selectedEvent.resource.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                    <Mail className="w-5 h-5 text-surface-400" />
                    <div>
                      <p className="text-xs text-surface-500">Email</p>
                      <p className="font-medium text-surface-900">{selectedEvent.resource.customerEmail}</p>
                    </div>
                  </div>
                  {selectedEvent.resource.customerPhone && (
                    <div className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                      <Phone className="w-5 h-5 text-surface-400" />
                      <div>
                        <p className="text-xs text-surface-500">Phone</p>
                        <p className="font-medium text-surface-900">{selectedEvent.resource.customerPhone}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Organiser */}
                {selectedEvent.resource.appointmentType?.owner && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <MapPin className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-xs text-amber-600">Organiser</p>
                      <p className="font-medium text-surface-900">
                        {selectedEvent.resource.appointmentType.owner.name}
                      </p>
                    </div>
                  </div>
                )}

                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
                  <span className="text-surface-600">Status</span>
                  {getStatusBadge(selectedEvent.resource.status)}
                </div>

                {/* People count */}
                {selectedEvent.resource.numPeople > 1 && (
                  <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
                    <span className="text-surface-600">Number of People</span>
                    <span className="font-semibold text-surface-900">{selectedEvent.resource.numPeople}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-6 pt-0 space-y-3">
                {/* Primary Actions based on status */}
                {selectedEvent.resource.status === 'request' && (
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={handleConfirmBooking}
                      className="flex-1 gap-2"
                      disabled={!onUpdateStatus}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirm Booking
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleCancelClick}
                      className="flex-1 gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </Button>
                  </div>
                )}
                
                {selectedEvent.resource.status === 'booked' && (
                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={handleCompleteBooking}
                      className="flex-1 gap-2"
                      disabled={!onUpdateStatus}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Completed
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleCancelClick}
                      className="flex-1 gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Booking
                    </Button>
                  </div>
                )}

                {/* Close button for all statuses */}
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
        title="Cancel Booking"
        message={`Are you sure you want to cancel the booking for ${selectedEvent?.resource.customerName}? This action cannot be undone.`}
        confirmText="Cancel Booking"
        variant="danger"
        isLoading={isActionLoading}
      />

      {/* Action Confirmation Modal (for confirm/complete) */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => { setShowConfirmModal(false); setPendingAction(null); }}
        onConfirm={handleConfirmAction}
        title={pendingAction === 'booked' ? 'Confirm Booking' : 'Mark as Completed'}
        message={
          pendingAction === 'booked'
            ? `Are you sure you want to confirm the booking for ${selectedEvent?.resource.customerName}?`
            : `Are you sure you want to mark the booking for ${selectedEvent?.resource.customerName} as completed?`
        }
        confirmText={getActionLabel()}
        variant="primary"
        isLoading={isActionLoading}
      />
    </div>
  );
};

export default BookingCalendar;
