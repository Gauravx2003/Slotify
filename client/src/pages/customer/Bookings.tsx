import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock3,
  AlertCircle,
  User,
} from "lucide-react";
import Header from "../../components/Header";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../../store/api";



const STATUS_Styles = {
  confirmed: "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  request: "bg-orange-100 text-orange-700 border-orange-200",
};

const STATUS_ICONS = {
  confirmed: <CheckCircle className="w-3 h-3 mr-1" />,
  pending: <Clock3 className="w-3 h-3 mr-1" />,
  completed: <CheckCircle className="w-3 h-3 mr-1" />,
  cancelled: <XCircle className="w-3 h-3 mr-1" />,
  request: <AlertCircle className="w-3 h-3 mr-1" />,
};

const Bookings = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all, upcoming, past

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get("/bookings");
        const data = response.data.data.map((b: any) => ({
            id: b.id,
            service: b.appointmentType?.title || "Appointment",
            provider: b.resource?.name || "Unassigned", // mapping resource to provider for now
            date: new Date(b.startTime),
            duration: b.appointmentType?.durationMinutes || 30,
            status: b.status,
            location: b.appointmentType?.location || "Online",
            price: 0, // Price not currently in list response
        }));
        setBookings(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load bookings");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) => {
    // Search Filter
    const matchesSearch =
      booking.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());

    // Status Filter
    const matchesStatus =
      filterStatus === "all" || booking.status === filterStatus;

    // Date Filter
    const now = new Date();
    const isUpcoming = booking.date >= now;
    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "upcoming" && isUpcoming) ||
      (dateFilter === "past" && !isUpcoming);

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="min-h-screen bg-surface-50 font-sans text-surface-900 pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-black text-surface-900 tracking-tight mb-4"
            >
              My Bookings
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-surface-500 font-medium text-lg"
            >
              Manage your upcoming appointments and history.
            </motion.p>
          </div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col sm:flex-row gap-4 w-full md:w-auto"
          >
           
          </motion.div>
        </div>

        {/* Filters & Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 rounded-3xl shadow-lg border border-rust-100 mb-10 flex flex-col lg:flex-row gap-4 justify-between items-center"
        >
          {/* Search */}
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 group-focus-within:text-rust-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by service, provider or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-50 border-2 border-transparent rounded-2xl font-medium focus:bg-white focus:border-rust-500 focus:outline-none transition-all placeholder:text-surface-400"
            />
          </div>

          <div className="flex w-full lg:w-auto overflow-x-auto gap-3 pb-2 lg:pb-0 no-scrollbar">
            {/* Date Filter */}
            <div className="flex bg-surface-50 p-1 rounded-2xl border border-surface-200">
               {['all', 'upcoming', 'past'].map((filter) => (
                 <button
                    key={filter}
                    onClick={() => setDateFilter(filter)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                      dateFilter === filter 
                      ? 'bg-white text-rust-600 shadow-md transform scale-105' 
                      : 'text-surface-500 hover:text-surface-700'
                    }`}
                 >
                   {filter}
                 </button>
               ))}
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-surface-50 border-2 border-surface-200 rounded-2xl font-bold text-surface-700 outline-none focus:border-rust-500 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </motion.div>

        {/* Bookings Grid */}
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {isLoading ? (
               // Simple Loading Skeleton
              [1, 2, 3].map((n) => (
                <div key={n} className="h-40 bg-white rounded-3xl shadow-sm animate-pulse" />
              ))
            ) : filteredBookings.length === 0 ? (
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }}
                 className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-surface-300"
                >
                 <div className="mx-auto w-20 h-20 bg-surface-50 rounded-full flex items-center justify-center mb-6 text-surface-400">
                   <Calendar className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-black text-surface-900 mb-2">No bookings found</h3>
                 <p className="text-surface-500">Try adjusting your filters or search terms.</p>
               </motion.div>
            ) : (
              filteredBookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-white rounded-[2rem] p-6 sm:p-8 border border-surface-100 shadow-sm hover:shadow-xl hover:border-rust-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rust-50/50 rounded-bl-[6rem] -mr-16 -mt-16 transition-transform group-hover:scale-110" />

                  <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between relative z-10">
                    {/* Left Info */}
                    <div className="flex gap-6 items-start">
                        {/* Date Box */}
                        <div className="flex-shrink-0 w-20 h-20 bg-surface-50 rounded-2xl flex flex-col items-center justify-center border border-surface-100 group-hover:border-rust-200 transition-colors">
                           <span className="text-xs font-black text-rust-500 uppercase tracking-widest mb-1">{format(booking.date, 'MMM')}</span>
                           <span className="text-3xl font-black text-surface-900 leading-none">{format(booking.date, 'd')}</span>
                           <span className="text-[10px] font-bold text-surface-400 uppercase mt-1">{format(booking.date, 'EEE')}</span>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_Styles[booking.status as keyof typeof STATUS_Styles]}`}>
                                    {STATUS_ICONS[booking.status as keyof typeof STATUS_ICONS]}
                                    {booking.status}
                                </span>
                                <span className="text-xs font-bold text-surface-400">ID: {booking.id}</span>
                            </div>
                            <h3 className="text-2xl font-black text-surface-900 mb-2 group-hover:text-rust-600 transition-colors">{booking.service}</h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-surface-500">
                                <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-rust-500" /> {booking.provider}</span>
                                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-rust-500" /> {format(booking.date, 'h:mm a')} ({booking.duration} min)</span>
                                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-rust-500" /> {booking.location}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="flex-shrink-0">
                        <Link 
                            to={`/customer/bookings/${booking.id}`}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-surface-900 text-white rounded-xl font-bold hover:bg-rust-500 transition-all shadow-lg hover:shadow-xl hover:shadow-rust-500/20 active:scale-95"
                        >
                            View Details 
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Bookings;
