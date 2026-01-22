import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MapPin,
  Clock,
  ArrowRight,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store";
import toast from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { motion, AnimatePresence } from "framer-motion";

interface Resource {
  id: string;
  name: string;
  type: string;
}

interface AppointmentType {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  location: string | null;
  isPaid: boolean;
  bookingFeeCents: number | null;
  introMessage: string | null;
  imageUrl: string | null;
  resources: Resource[];
}

const AppointmentList = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "free" | "paid">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [search, typeFilter]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const isPaid = typeFilter === "paid" ? "true" : typeFilter === "free" ? "false" : undefined;
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (isPaid !== undefined) queryParams.append("isPaid", isPaid);

      const response = await fetch(`/api/appointments/public?${queryParams.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setAppointments(result.data || []);
      } else {
        setError("Failed to load appointments. Please try again.");
        setAppointments([]);
      }
    } catch (err) {
      setError("Unable to connect to server. Make sure the backend is running.");
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const // Custom ease for smooth entry
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 font-sans text-surface-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-48">
        {/* 1️⃣ Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mb-20"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="max-w-2xl relative">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rust-50 rounded-full text-rust-600 text-xs font-bold uppercase tracking-widest mb-6 border border-rust-100"
              >
                <Sparkles className="w-3.5 h-3.5" /> Book Your Slot
              </motion.div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-surface-900 tracking-tight leading-[1.1] mb-6">
                Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-rust-600 to-rust-800">Experience</span> <br className="hidden md:block" />
                Just a Click Away
              </h1>
              <p className="text-lg md:text-xl text-surface-500 font-medium leading-relaxed max-w-xl">
                Choose from our curated list of professional services. Fast, secure, and intuitive booking designed for your convenience.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-80 group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 group-focus-within:text-rust-500 transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white border border-surface-200 rounded-2xl focus:ring-4 focus:ring-rust-500/5 focus:border-rust-500 outline-none transition-all duration-300 shadow-sm hover:shadow-md font-semibold text-surface-700 placeholder:text-surface-300"
                />
              </div>

              <div className="relative w-full sm:w-auto min-w-[160px]">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl border transition-all duration-300 font-bold uppercase tracking-wider text-xs ${typeFilter !== "all"
                    ? "bg-rust-600 text-white border-rust-600 shadow-lg shadow-rust-500/20"
                    : "bg-white text-surface-700 border-surface-200 hover:border-rust-300 hover:shadow-md"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    {typeFilter === "all" ? "Filter" : typeFilter}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isFilterOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isFilterOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-full sm:w-56 bg-white rounded-2xl shadow-xl border border-surface-100 p-2 z-50 overflow-hidden"
                    >
                      {(["all", "free", "paid"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            setTypeFilter(type);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors duration-200 ${typeFilter === type
                            ? "bg-rust-50 text-rust-700"
                            : "text-surface-500 hover:bg-surface-50 hover:text-surface-900"
                            }`}
                        >
                          {type === "all" ? "Show All" : type}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2️⃣ Appointment Grid Section */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-surface-100 overflow-hidden h-[460px] flex flex-col">
                <div className="h-64 bg-surface-100 animate-pulse" />
                <div className="p-8 flex-1 flex flex-col space-y-4">
                  <div className="h-8 bg-surface-100 rounded-lg w-3/4 animate-pulse" />
                  <div className="h-4 bg-surface-100 rounded w-full animate-pulse" />
                  <div className="h-4 bg-surface-100 rounded w-2/3 animate-pulse" />
                  <div className="mt-auto pt-6 flex justify-between items-center">
                    <div className="h-10 w-24 bg-surface-100 rounded-lg animate-pulse" />
                    <div className="h-12 w-32 bg-surface-100 rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-rust-100/50 shadow-sm">
            <div className="w-20 h-20 bg-rust-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">⚠️</div>
            <h3 className="text-2xl font-bold text-surface-900 mb-2">Connection Error</h3>
            <p className="text-surface-500 mb-8 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => fetchAppointments()}
              className="px-8 py-3 bg-rust-600 text-white font-bold rounded-xl hover:bg-rust-700 transition-all shadow-lg shadow-rust-500/20"
            >
              Try Again
            </button>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-surface-100 shadow-sm">
            <div className="w-20 h-20 bg-surface-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">📭</div>
            <h3 className="text-2xl font-bold text-surface-900 mb-2">No Appointments Available</h3>
            <p className="text-surface-500">We couldn't find matches for your search.</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {appointments.map((at) => (
              <motion.div
                key={at.id}
                variants={itemVariants}
                className="group bg-white rounded-3xl border border-surface-200/60 overflow-hidden flex flex-col h-full relative hover:border-rust-200 hover:shadow-xl hover:shadow-rust-500/5 transition-all duration-500"
              >
                {/* Visual Label (Top Right) */}
                <div className="absolute top-5 right-5 z-10">
                  {at.isPaid ? (
                    <div className="bg-white/90 backdrop-blur-md text-rust-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm border border-rust-100">
                      Paid
                    </div>
                  ) : (
                    <div className="bg-surface-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm">
                      Free
                    </div>
                  )}
                </div>

                {/* Card Banner / Image */}
                <div className="h-64 relative overflow-hidden bg-surface-100">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-[1] opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                  <img
                    src={at.imageUrl || `https://source.unsplash.com/800x600/?${at.title.replace(/\s+/g, ",")}`}
                    alt={at.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop";
                    }}
                  />
                  <div className="absolute bottom-5 left-5 z-[2]">
                    <div className="flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-wider">
                      <Clock className="w-4 h-4" />
                      <span>{at.durationMinutes} mins</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="text-2xl font-bold text-surface-900 mb-3 leading-tight group-hover:text-rust-700 transition-colors duration-300">
                    {at.title}
                  </h3>
                  <p className="text-surface-500 text-sm font-medium line-clamp-2 mb-8 leading-relaxed">
                    {at.introMessage || at.description || "Premium booking experience tailored for you."}
                  </p>

                  <div className="mt-auto space-y-6">
                    <div className="flex items-center justify-between pt-6 border-t border-surface-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-surface-50 rounded-full flex items-center justify-center text-surface-400 group-hover:bg-rust-50 group-hover:text-rust-500 transition-colors duration-300">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">Location</span>
                          <span className="text-sm font-semibold text-surface-700">{at.location || "Online"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-surface-400">Fee</span>
                        <span className="text-xl font-extrabold text-surface-900">
                          {at.isPaid ? `₹${(at.bookingFeeCents || 0) / 100}` : "Free"}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (!isAuthenticated) {
                            toast.error("Please login to book an appointment");
                            navigate(`/login?redirect=/appointments/${at.id}`);
                          } else {
                            navigate(`/appointments/${at.id}`);
                          }
                        }}
                        className="group/btn relative px-8 py-4 bg-surface-900 text-white font-bold rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:bg-rust-600 active:scale-[0.98] flex-grow flex items-center justify-center gap-2"
                      >
                        <span className="text-xs uppercase tracking-[0.15em]">Book Now</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AppointmentList;
