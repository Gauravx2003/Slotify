import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import Header from "../components/Header";
import { format } from "date-fns";
import api from "../store/api";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-hot-toast";

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  appointmentType: {
    title: string;
    location: string | null;
    durationMinutes: number;
    isPaid: boolean;
  };
  resource: {
    name: string;
  } | null;
}

const UserDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get("/bookings", {});
      const fetchedBookings: Booking[] = response.data.data;
      setBookings(fetchedBookings);
      calculateStats(fetchedBookings);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
      toast.error("Failed to load your schedule");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: Booking[]) => {
    const now = new Date();
    const upcoming = data.filter(
      (b) =>
        (b.status === "confirmed" || b.status === "pending") &&
        new Date(b.startTime) > now
    ).length;
    const completed = data.filter(
      (b) =>
        b.status === "completed" ||
        (b.status === "confirmed" && new Date(b.endTime) < now)
    ).length;
    const cancelled = data.filter((b) => b.status === "cancelled").length;

    setStats({ upcoming, completed, cancelled });
  };

  const nextAppointment = bookings
    .filter(
      (b) =>
        (b.status === "confirmed" || b.status === "pending") &&
        new Date(b.startTime) > new Date()
    )
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )[0];

  const handleCancel = async (booking: Booking) => {
    const isPaid = booking.appointmentType.isPaid;
    const message = isPaid
      ? "Are you sure you want to cancel this appointment? A 5% cancellation fee will be deducted from your refund."
      : "Are you sure you want to cancel this appointment?";

    if (!confirm(message)) return;
    try {
      await api.post(`/bookings/${booking.id}/cancel`);
      toast.success(
        isPaid
          ? "Appointment cancelled and refund initiated"
          : "Appointment cancelled"
      );
      fetchBookings();
    } catch (error) {
      toast.error("Failed to cancel appointment");
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans text-surface-900 selection:bg-rust-500/30 selection:text-rust-950">
      <Header />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-black text-surface-900 tracking-tight mb-2">
            Welcome back, {user?.name?.split(" ")[0] || "Guest"}
          </h1>
          <p className="text-surface-500 font-medium text-lg">
            Here's what's happening with your schedule.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Next Appointment (Takes up 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-surface-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-rust-500" />
                  Up Next
                </h2>
                {nextAppointment && (
                  <Link
                    to="/profile"
                    className="text-sm font-bold text-rust-600 hover:text-rust-700 flex items-center gap-1 transition-colors"
                  >
                    View all <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {isLoading ? (
                <div className="bg-white rounded-[2.5rem] p-12 text-center border border-surface-200 border-dashed animate-pulse">
                  <div className="h-8 bg-surface-100 rounded w-1/3 mx-auto mb-4"></div>
                  <div className="h-4 bg-surface-100 rounded w-1/2 mx-auto"></div>
                </div>
              ) : nextAppointment ? (
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-rust-500/5 border border-rust-100 relative overflow-hidden group hover:border-rust-200 transition-all">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rust-50 rounded-bl-[60px] -mr-6 -mt-6 transition-transform duration-500 group-hover:scale-110"></div>

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-rust-100 text-rust-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-rust-200">
                          {nextAppointment.status}
                        </div>
                        <span className="text-xs font-bold text-surface-400">
                          {format(
                            new Date(nextAppointment.startTime),
                            "MMMM d, yyyy"
                          )}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-3xl font-black text-surface-900 mb-2 leading-tight">
                      {nextAppointment.appointmentType.title}
                    </h3>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-surface-500 font-medium mb-8">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-rust-500" />
                        <span>
                          {format(
                            new Date(nextAppointment.startTime),
                            "h:mm a"
                          )}{" "}
                          -{" "}
                          {format(new Date(nextAppointment.endTime), "h:mm a")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rust-500" />
                        <span>
                          {nextAppointment.appointmentType.location || "Online"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-6 border-t border-surface-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-100 flex items-center justify-center text-surface-500 font-bold text-xs">
                          {nextAppointment.resource?.name?.charAt(0) || "R"}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider text-surface-400">
                            Resource
                          </p>
                          <p className="text-sm font-bold text-surface-900">
                            {nextAppointment.resource?.name || "Unassigned"}
                          </p>
                        </div>
                      </div>

                      <div className="flex-grow"></div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleCancel(nextAppointment)}
                          className="px-5 py-2.5 rounded-xl bg-white border border-surface-200 text-surface-600 font-bold text-sm hover:bg-surface-50 hover:border-surface-300 transition-all"
                        >
                          Cancel
                        </button>
                        <Link
                          to="/profile"
                          className="px-5 py-2.5 rounded-xl bg-surface-900 text-white font-bold text-sm hover:bg-surface-800 transition-all shadow-lg shadow-surface-900/20"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[2.5rem] p-12 text-center border border-surface-200 border-dashed">
                  <div className="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-4 text-surface-400">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-surface-900 mb-2">
                    No upcoming appointments
                  </h3>
                  <p className="text-surface-500 mb-8 max-w-xs mx-auto">
                    You're all caught up! Ready to schedule something new?
                  </p>
                  <Link
                    to="/appointments"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-rust-500 text-white rounded-xl font-bold hover:bg-rust-600 transition-all shadow-lg shadow-rust-500/20"
                  >
                    <Plus className="w-4 h-4" /> Book Appointment
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Actions & Stats */}
          <div className="space-y-8">
            {/* Primary CTA Card */}
            <div className="bg-rust-500 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-rust-500/30 group cursor-pointer transition-transform hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-8 -mb-8 blur-xl"></div>

              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-2">Book New</h3>
                <p className="text-rust-100 font-medium mb-8 leading-relaxed">
                  Schedule a new appointment with our top resources.
                </p>
                <Link
                  to="/appointments"
                  className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:gap-4 transition-all"
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Stats Snapshot */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-surface-100 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-surface-400 mb-6">
                Overview
              </h3>

              <div className="space-y-4">
                <Link
                  to="/profile"
                  className="flex items-center justify-between p-4 rounded-2xl bg-surface-50 hover:bg-surface-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-rust-500 shadow-sm">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-surface-700">Upcoming</span>
                  </div>
                  <span className="font-black text-surface-900 group-hover:text-rust-600 transition-colors">
                    {stats.upcoming}
                  </span>
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center justify-between p-4 rounded-2xl bg-surface-50 hover:bg-surface-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-green-500 shadow-sm">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-surface-700">
                      Completed
                    </span>
                  </div>
                  <span className="font-black text-surface-900 group-hover:text-green-600 transition-colors">
                    {stats.completed}
                  </span>
                </Link>

                <Link
                  to="/profile"
                  className="flex items-center justify-between p-4 rounded-2xl bg-surface-50 hover:bg-surface-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-surface-400 shadow-sm">
                      <XCircle className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-surface-700">
                      Cancelled
                    </span>
                  </div>
                  <span className="font-black text-surface-900 group-hover:text-surface-600 transition-colors">
                    {stats.cancelled}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
