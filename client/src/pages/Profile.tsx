import { useState, useEffect, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import type { ToolbarProps, View } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  endOfWeek,
} from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  User,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  X,
  Repeat,
  Trash2,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import api from "../store/api";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Booking {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: "confirmed" | "pending" | "cancelled" | "booked" | "request" | "completed";
  resourceId?: string;
  location?: string;
  subject?: string;
}

const CustomToolbar = (props: ToolbarProps<Booking, object>) => {
  const goToBack = () => {
    props.onNavigate("PREV");
  };

  const goToNext = () => {
    props.onNavigate("NEXT");
  };

  const goToCurrent = () => {
    props.onNavigate("TODAY");
  };

  const label = () => {
    const date = props.date;
    return (
      <span className="text-xl font-black text-surface-900 uppercase tracking-tight">
        {format(date, "MMMM yyyy")}
      </span>
    );
  };

  // Get current period label based on view
  const getCurrentPeriodLabel = () => {
    const today = new Date();
    const currentDate = props.date;
    
    if (props.view === "month") {
      // Check if same month and year
      if (
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()
      ) {
        return "Current Month";
      }
      return format(currentDate, "MMM yyyy");
    } else if (props.view === "week") {
      const weekStart = startOfWeek(currentDate);
      const todayWeekStart = startOfWeek(today);
      
      // Check if same week
      if (weekStart.getTime() === todayWeekStart.getTime()) {
        return "Current Week";
      }
      return `Week of ${format(weekStart, "MMM d")}`;
    }
    return "Today";
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
      <div className="flex items-center gap-4">
        <div className="flex bg-surface-100 rounded-full p-1">
          <button
            onClick={goToBack}
            className="p-2 hover:bg-white rounded-full transition-all shadow-sm hover:shadow text-surface-600 hover:text-rust-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToCurrent}
            className="px-4 py-2 text-xs font-black uppercase tracking-widest text-surface-600 hover:text-rust-600 whitespace-nowrap"
          >
            {getCurrentPeriodLabel()}
          </button>
          <button
            onClick={goToNext}
            className="p-2 hover:bg-white rounded-full transition-all shadow-sm hover:shadow text-surface-600 hover:text-rust-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {label()}
      </div>

      <div className="flex bg-surface-100 p-1 rounded-2xl">
        {(["month", "week"] as View[]).map((view) => (
          <button
            key={view}
            onClick={() => props.onView(view)}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              props.view === view
                ? "bg-white text-rust-600 shadow-md transform scale-105"
                : "text-surface-500 hover:text-surface-700"
            }`}
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  );
};

const Profile = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Booking | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [view, setView] = useState<View>(Views.MONTH);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // State for appointments list popup
  const [showListModal, setShowListModal] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch bookings based on date range
  const fetchBookings = async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true);
      const response = await api.get("/bookings", {
        params: {
          fromDate: startDate.toISOString(),
          toDate: endDate.toISOString(),
        },
      });
      const formattedBookings = response.data.data.map((booking: any) => ({
        id: booking.id,
        title: booking.subject || "Appointment",
        start: new Date(booking.startTime),
        end: new Date(booking.endTime),
        status: booking.status.toLowerCase(),
        location: booking.resource?.name || "TBD",
        resourceId: booking.resourceId,
      }));
      setBookings(formattedBookings);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  // Calculate date range based on view and current date
  const getDateRange = (date: Date, viewType: View) => {
    if (viewType === Views.MONTH) {
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
    } else if (viewType === Views.WEEK) {
      return {
        start: startOfWeek(date),
        end: endOfWeek(date),
      };
    }
    return { start: date, end: date };
  };

  // Fetch bookings when date or view changes
  useEffect(() => {
    if (user) {
      const { start, end } = getDateRange(currentDate, view);
      fetchBookings(start, end);
    }
  }, [user, currentDate, view]);

  // Handle calendar navigation
  const handleNavigate = (newDate: Date, viewType?: View, action?: "PREV" | "NEXT" | "TODAY" | "DATE") => {
    setCurrentDate(newDate);
  };

  // Group bookings by date for the custom date cell
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    bookings.forEach((booking) => {
      const dateKey = format(booking.start, "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(booking);
    });
    return grouped;
  }, [bookings]);

  // Handle clicking on a day in calendar
  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    const dateKey = format(slotInfo.start, "yyyy-MM-dd");
    const eventsOnDate = bookingsByDate[dateKey] || [];
    
    if (eventsOnDate.length > 0) {
      setSelectedDateEvents(eventsOnDate);
      setSelectedDate(slotInfo.start);
      setShowListModal(true);
    }
  };

  // Handle clicking on an event (from calendar or list)
  const handleSelectEvent = (event: Booking) => {
    setShowListModal(false);
    setSelectedEvent(event);
    setIsRescheduling(false);
    setNewDate(null);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setIsRescheduling(false);
  };

  const handleCloseListModal = () => {
    setShowListModal(false);
    setSelectedDateEvents([]);
    setSelectedDate(null);
  };

  const handleCancelAppointment = async () => {
    if (!selectedEvent) return;

    try {
      await api.post(`/bookings/${selectedEvent.id}/cancel`);

      const updatedBookings = bookings.map((b) =>
        b.id === selectedEvent.id ? { ...b, status: "cancelled" as const } : b
      );
      setBookings(updatedBookings);
      setSelectedEvent(null);
      toast.success("Appointment cancelled successfully");
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      toast.error("Failed to cancel appointment");
    }
  };

  const handleStartReschedule = () => {
    if (!selectedEvent) return;
    setNewDate(selectedEvent.start);
    setIsRescheduling(true);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedEvent || !newDate) return;

    try {
      await api.patch(`/bookings/${selectedEvent.id}/reschedule`, {
        startTime: newDate,
      });

      const updatedBookings = bookings.map((b) => {
        if (b.id === selectedEvent.id) {
          const duration = b.end.getTime() - b.start.getTime();
          return {
            ...b,
            start: newDate,
            end: new Date(newDate.getTime() + duration),
            status: "pending" as const,
            resourceId: undefined,
            location: "TBD",
          };
        }
        return b;
      });

      setBookings(updatedBookings);
      setIsRescheduling(false);
      setSelectedEvent(null);
      toast.success("Appointment rescheduled successfully");
    } catch (error) {
      console.error("Failed to reschedule:", error);
      toast.error("Failed to reschedule appointment");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rust-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 font-sans text-surface-900 selection:bg-rust-500/30 selection:text-rust-950">
      <Header />
      <Toaster position="bottom-right" />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-rust-100 mb-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rust-50 rounded-bl-[100px] -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-110"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="relative">
              <div className="w-24 h-24 rounded-full p-1 bg-white shadow-2xl">
                {user.image ? (
                  <img
                    src={user.image}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-rust-100 flex items-center justify-center text-4xl font-black text-rust-600">
                    {user.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-rust-500 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg">
                <User className="w-4 h-4" />
              </div>
            </div>

            <div className="text-center md:text-left flex-grow">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                <h1 className="text-4xl font-black text-surface-900 tracking-tight">
                  {user.name || "User"}
                </h1>
                <span className="px-3 py-1 bg-rust-100 text-rust-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-rust-200">
                  {user.role}
                </span>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-surface-500 font-medium mb-6">
                <div className="flex items-center gap-2 bg-surface-50 px-4 py-2 rounded-full">
                  <Mail className="w-4 h-4 text-rust-500" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-2 bg-surface-50 px-4 py-2 rounded-full">
                    <Phone className="w-4 h-4 text-rust-500" />
                    <span className="text-sm">{user?.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-rust-50 px-6 py-4 rounded-3xl text-center border border-rust-100">
                <div className="text-3xl font-black text-rust-600 mb-1">
                  {bookings.filter((b) => b.status === "confirmed").length}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-surface-400">
                  Upcoming
                </div>
              </div>
              <div className="bg-surface-50 px-6 py-4 rounded-3xl text-center border border-surface-100">
                <div className="text-3xl font-black text-surface-400 mb-1">
                  {bookings.length}
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-surface-400">
                  Total
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="bg-white rounded-[3rem] p-6 md:p-8 shadow-2xl border border-rust-100 overflow-hidden relative">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-surface-900 flex items-center gap-4">
              <div className="w-12 h-12 bg-rust-100 rounded-2xl flex items-center justify-center text-rust-600">
                <CalendarIcon className="w-6 h-6" />
              </div>
              My Schedule
            </h2>

            <div className="hidden md:flex gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rust-50 rounded-full border border-rust-100">
                <div className="w-3 h-3 rounded bg-rust-500"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rust-700">
                  Confirmed
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-full border border-yellow-100">
                <div className="w-3 h-3 rounded bg-yellow-400"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-700">
                  Pending
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-50 rounded-full border border-surface-200">
                <div className="w-3 h-3 rounded bg-surface-400"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-surface-600">
                  Cancelled
                </span>
              </div>
            </div>
          </div>

          <div className="h-[600px] font-medium text-surface-600 calendar-custom">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rust-600"></div>
              </div>
            ) : (
              <Calendar
                localizer={localizer}
                events={bookings}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%" }}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                selectable
                view={view}
                onView={setView}
                date={currentDate}
                onNavigate={handleNavigate}
                views={["month", "week"]}
                components={{
                  toolbar: CustomToolbar,
                  // Google Calendar style - show event bars
                  dateCellWrapper: ({ children, value }: { children: React.ReactNode; value: Date }) => {
                    const dateKey = format(value, "yyyy-MM-dd");
                    const eventsOnDate = bookingsByDate[dateKey] || [];
                    const count = eventsOnDate.length;
                    const maxVisible = 3; // Show max 3 events, then "+X more"
                    const visibleEvents = eventsOnDate.slice(0, maxVisible);
                    const remainingCount = count - maxVisible;

                    const statusColors: Record<string, string> = {
                      confirmed: "bg-rust-500 hover:bg-rust-600",
                      booked: "bg-rust-500 hover:bg-rust-600",
                      pending: "bg-yellow-400 hover:bg-yellow-500",
                      request: "bg-yellow-400 hover:bg-yellow-500",
                      cancelled: "bg-surface-400 hover:bg-surface-500",
                      completed: "bg-green-500 hover:bg-green-600",
                    };
                    
                    return (
                      <div 
                        className="relative h-full w-full"
                        onClick={(e) => {
                          if (count > 0) {
                            e.stopPropagation();
                            setSelectedDateEvents(eventsOnDate);
                            setSelectedDate(value);
                            setShowListModal(true);
                          }
                        }}
                      >
                        {children}
                        {count > 0 && (
                          <div className="absolute top-6 left-0 right-0 px-1 space-y-0.5 cursor-pointer">
                            {/* Event bars like Google Calendar */}
                            {visibleEvents.map((event) => (
                              <div
                                key={event.id}
                                className={`${statusColors[event.status] || statusColors.confirmed} text-white text-[10px] font-medium px-1.5 py-0.5 rounded truncate transition-colors`}
                                title={`${event.title} - ${format(event.start, "h:mm a")}`}
                              >
                                {format(event.start, "h:mm")} {event.title}
                              </div>
                            ))}
                            {/* Show "+X more" if there are hidden events */}
                            {remainingCount > 0 && (
                              <div className="text-[10px] font-bold text-rust-600 hover:text-rust-700 px-1.5 py-0.5 hover:bg-rust-50 rounded transition-colors">
                                +{remainingCount} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  },
                }}
                // Hide individual events in month view - we show counts instead
                eventPropGetter={() => ({
                  style: {
                    display: view === "month" ? "none" : "block",
                    backgroundColor: "transparent",
                    padding: 0,
                    border: "none",
                  },
                })}
                dayPropGetter={(date: Date) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  const dateKey = format(date, "yyyy-MM-dd");
                  const hasEvents = bookingsByDate[dateKey]?.length > 0;
                  return {
                    style: {
                      backgroundColor: isToday ? "#fff7ed" : hasEvents ? "#fefdfb" : "white",
                      cursor: hasEvents ? "pointer" : "default",
                    },
                  };
                }}
              />
            )}
          </div>
        </div>
      </main>

      {/* Appointments List Modal */}
      {showListModal && selectedDateEvents.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header - Theme Style */}
            <div className="bg-gradient-to-br from-rust-500 to-rust-600 p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  {selectedDate && (
                    <>
                      <p className="text-rust-100 text-xs font-bold uppercase tracking-widest">
                        {format(selectedDate, "EEEE")}
                      </p>
                      <h3 className="text-4xl font-black mt-2">
                        {format(selectedDate, "d")}
                      </h3>
                      <p className="text-rust-100 font-medium mt-1">
                        {format(selectedDate, "MMMM yyyy")}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <CalendarIcon className="w-4 h-4 text-rust-200" />
                        <span className="text-sm font-bold">
                          {selectedDateEvents.length} Appointment{selectedDateEvents.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={handleCloseListModal}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5">

              {/* Appointments List */}
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedDateEvents.map((event) => {
                  const statusStyles: Record<string, {
                    bg: string;
                    border: string;
                    badge: string;
                    dot: string;
                  }> = {
                    confirmed: {
                      bg: "bg-rust-50 hover:bg-rust-100",
                      border: "border-l-4 border-rust-500",
                      badge: "bg-rust-100 text-rust-700",
                      dot: "bg-rust-500",
                    },
                    booked: {
                      bg: "bg-rust-50 hover:bg-rust-100",
                      border: "border-l-4 border-rust-500",
                      badge: "bg-rust-100 text-rust-700",
                      dot: "bg-rust-500",
                    },
                    pending: {
                      bg: "bg-yellow-50 hover:bg-yellow-100",
                      border: "border-l-4 border-yellow-400",
                      badge: "bg-yellow-100 text-yellow-700",
                      dot: "bg-yellow-400",
                    },
                    request: {
                      bg: "bg-yellow-50 hover:bg-yellow-100",
                      border: "border-l-4 border-yellow-400",
                      badge: "bg-yellow-100 text-yellow-700",
                      dot: "bg-yellow-400",
                    },
                    cancelled: {
                      bg: "bg-surface-50 hover:bg-surface-100",
                      border: "border-l-4 border-surface-300",
                      badge: "bg-surface-100 text-surface-500",
                      dot: "bg-surface-400",
                    },
                    completed: {
                      bg: "bg-green-50 hover:bg-green-100",
                      border: "border-l-4 border-green-500",
                      badge: "bg-green-100 text-green-700",
                      dot: "bg-green-500",
                    },
                  };

                  // Get style with fallback to confirmed style
                  const style = statusStyles[event.status] || statusStyles.confirmed;

                  return (
                    <button
                      key={event.id}
                      onClick={() => handleSelectEvent(event)}
                      className={`w-full p-4 rounded-2xl ${style.border} ${style.bg} transition-all text-left group`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <h4 className="font-bold text-surface-900 truncate group-hover:text-rust-600 transition-colors">
                            {event.title}
                          </h4>
                          
                          {/* Time & Location */}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-surface-500">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-rust-400" />
                              <span className="font-medium">
                                {format(event.start, "h:mm a")} – {format(event.end, "h:mm a")}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-rust-400" />
                                <span className="font-medium truncate">{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status Badge & Arrow */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${style.badge}`}>
                            {event.status}
                          </span>
                          <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-rust-500 transition-colors" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-5 pt-4 border-t border-surface-100">
                <div className="flex items-center justify-center gap-4">
                  {selectedDateEvents.filter(e => e.status === "confirmed").length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-rust-600">
                      <div className="w-2 h-2 rounded-full bg-rust-500"></div>
                      {selectedDateEvents.filter(e => e.status === "confirmed").length} Confirmed
                    </span>
                  )}
                  {selectedDateEvents.filter(e => e.status === "pending").length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-600">
                      <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                      {selectedDateEvents.filter(e => e.status === "pending").length} Pending
                    </span>
                  )}
                  {selectedDateEvents.filter(e => e.status === "cancelled").length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-surface-500">
                      <div className="w-2 h-2 rounded-full bg-surface-400"></div>
                      {selectedDateEvents.filter(e => e.status === "cancelled").length} Cancelled
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-2xl font-black text-surface-900 leading-tight">
                  {isRescheduling
                    ? "Reschedule Appointment"
                    : selectedEvent.title}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 bg-surface-50 rounded-full hover:bg-surface-100 transition-colors"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>

              {!isRescheduling ? (
                <>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-surface-600">
                      <CalendarIcon className="w-5 h-5 text-rust-500" />
                      <span className="font-medium">
                        {format(selectedEvent.start, "EEEE, MMMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-surface-600">
                      <Clock className="w-5 h-5 text-rust-500" />
                      <span className="font-medium">
                        {format(selectedEvent.start, "h:mm a")} -{" "}
                        {format(selectedEvent.end, "h:mm a")}
                      </span>
                    </div>
                    {selectedEvent.location && (
                      <div className="flex items-center gap-3 text-surface-600">
                        <MapPin className="w-5 h-5 text-rust-500" />
                        <span className="font-medium">
                          {selectedEvent.location}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${
                          selectedEvent.status === "confirmed"
                            ? "bg-rust-50 text-rust-700 border-rust-100"
                            : selectedEvent.status === "pending"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-100"
                            : "bg-red-50 text-red-700 border-red-100"
                        }`}
                      >
                        {selectedEvent.status}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Only show reschedule/cancel if not cancelled */}
                    {selectedEvent.status !== "cancelled" && (
                      <>
                        {user.role === "organiser" && (
                          <button
                            onClick={handleStartReschedule}
                            className="w-full py-4 bg-surface-900 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-surface-800 transition-colors flex items-center justify-center gap-2"
                          >
                            <Repeat className="w-4 h-4" /> Reschedule
                          </button>
                        )}

                        <button
                          onClick={handleCancelAppointment}
                          className="w-full py-4 bg-white border-2 border-red-100 text-red-600 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Cancel Appointment
                        </button>
                      </>
                    )}

                    {selectedEvent.status === "cancelled" && (
                      <div className="w-full py-4 bg-surface-50 text-surface-400 rounded-xl font-black uppercase tracking-widest text-xs text-center border border-surface-100">
                        Appointment Cancelled
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100">
                    <label className="block text-xs font-black uppercase tracking-widest text-surface-500 mb-2">
                      Select New Date & Time
                    </label>
                    <DatePicker
                      selected={newDate}
                      onChange={(date: Date | null) => setNewDate(date)}
                      showTimeSelect
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="w-full p-3 rounded-xl border border-surface-200 bg-white font-medium text-surface-900 focus:outline-none focus:ring-2 focus:ring-rust-500/20 focus:border-rust-500 transition-all"
                      wrapperClassName="w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleConfirmReschedule}
                      className="w-full py-4 bg-rust-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-rust-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rust-200"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Confirm Reschedule
                    </button>
                    <button
                      onClick={() => setIsRescheduling(false)}
                      className="w-full py-4 bg-white text-surface-500 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-surface-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Profile;
