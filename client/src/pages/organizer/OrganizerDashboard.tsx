import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Share2,
  Edit2,
  Calendar,
  Settings,
  BarChart3,
  ExternalLink,
  Clock,
  Users,
  Package,
  LogOut,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch } from "react-redux";
import { useAuth } from "../../hooks/useAuth";
import { logout as logoutAction } from "../../store/authSlice";
import api from "../../store/api";
import toast from "react-hot-toast";
import { Avatar } from "../../components/Avatar";

interface AppointmentType {
  id: string;
  title: string;
  durationMinutes: number;
  isPublished: boolean;
  shareToken: string;
  location?: string;
  _count?: {
    bookings: number;
    resources: number;
    comments: number;
  };
}

const OrganizerDashboard = () => {
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();

  const handleShare = (app: AppointmentType) => {
    const url = `${window.location.origin}/appointments/${app.id}?token=${app.shareToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard!");
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/appointments");
      if (response.data.success) {
        setAppointments(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch appointments", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAppointments = appointments.filter((app) =>
    app.title.toLowerCase().includes(search.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: any = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

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
              <span className="text-xl font-bold tracking-tight text-surface-900">Slotify <span className="text-rust-500">Organizer</span></span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <button className="px-6 py-2 rounded-xl text-sm font-bold text-rust-600 bg-rust-50 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Appointments
              </button>
              <Link to="/organizer/reporting" className="px-6 py-2 rounded-xl text-sm font-bold text-surface-500 hover:bg-surface-50 flex items-center gap-2 transition-colors">
                <BarChart3 className="w-4 h-4" /> Reporting
              </Link>
              
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
                            navigate('/organizer/users');
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm font-bold text-surface-700 hover:bg-rust-50 transition-colors flex items-center gap-3"
                        >
                          <Users className="w-4 h-4 text-rust-500" />
                          Users
                        </button>
                        <button
                          onClick={() => {
                            navigate('/organizer/resources');
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
            {/* User Name */}
            {/* User Name */}
            <div className="flex items-center gap-2 px-3 py-2 bg-rust-50 rounded-xl">
              <Avatar name={user?.name} src={user?.image} size="sm" className="rounded-lg" />
              <span className="text-sm font-bold text-surface-900">
                {user?.name || "User"}
              </span>
            </div>

            {/* Logout Button */}
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
        {/* 2️⃣ Search & Actions Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 group-focus-within:text-rust-500 transition-colors" />
            <input
              type="text"
              placeholder="Search appointments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-white border border-rust-100 rounded-2xl focus:ring-4 focus:ring-rust-500/5 focus:border-rust-500 outline-none transition-all font-medium"
            />
          </div>

          <button 
            onClick={() => navigate('/organizer/appointments/new')}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-rust-500 text-white rounded-2xl font-bold hover:bg-rust-600 transition-all shadow-lg shadow-rust-500/30 hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Create Appointment
          </button>
        </div>

        {/* 3️⃣ Appointments List */}
        {isLoading ? (
          <div className="space-y-4">
             {[1, 2, 3].map(i => (
               <div key={i} className="h-32 w-full bg-white border border-rust-50 rounded-[2rem] animate-pulse" />
             ))}
          </div>
        ) : filteredAppointments.length > 0 ? (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {filteredAppointments.map((app) => (
              <motion.div
                key={app.id}
                variants={itemVariants}
                className="group relative bg-white border border-rust-100/60 rounded-[2rem] p-6 hover:border-rust-500/30 hover:shadow-2xl hover:shadow-rust-500/5 transition-all flex flex-col md:flex-row items-center gap-8"
              >
                {/* Published Badge (Slanted as in mockup) */}
                {app.isPublished && (
                  <div className="absolute -right-2 -top-2 overflow-hidden w-24 h-24 pointer-events-none">
                    <div className="absolute top-4 right-0 transform translate-x-8 -translate-y-4 rotate-45 bg-rust-500 text-white text-[10px] font-black uppercase tracking-widest py-1 w-32 text-center shadow-lg">
                      Published
                    </div>
                  </div>
                )}

                <div className="flex-grow flex items-center gap-6">
                   <div className="w-16 h-16 rounded-2xl bg-rust-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-8 h-8 text-rust-500" />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-surface-900 group-hover:text-rust-600 transition-colors mb-1">{app.title}</h3>
                      <div className="flex items-center gap-4 text-surface-400 text-sm font-medium">
                         <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {app.durationMinutes} Min</span>
                         <span className="flex items-center gap-1.5"><ExternalLink className="w-4 h-4" /> {app.location || 'No location set'}</span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-12">
                   {/* Resources */}
                   <div className="hidden lg:flex items-center -space-x-3">
                      {[1, 2].map(i => (
                         <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-rust-50 flex items-center justify-center text-[10px] font-bold text-rust-600">
                            A{i}
                         </div>
                      ))}
                      <div className="w-10 h-10 rounded-full border-4 border-white bg-surface-50 flex items-center justify-center text-[10px] font-bold text-surface-400">
                         +{app._count?.resources || 0}
                      </div>
                   </div>

                   {/* Metrics */}
                   <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-surface-900 leading-none">{app._count?.bookings || 0}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-surface-400 mt-1">Bookings</span>
                   </div>

                   <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-surface-900 leading-none">{app._count?.comments || 0}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-surface-400 mt-1">Comments</span>
                   </div>

                   <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleShare(app)}
                        className="p-3 rounded-xl bg-surface-50 text-surface-600 hover:bg-rust-50 hover:text-rust-600 transition-all border border-transparent hover:border-rust-200"
                      >
                         <Share2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => navigate(`/organizer/appointments/${app.id}/edit`)}
                        className="p-3 rounded-xl bg-surface-50 text-surface-600 hover:bg-rust-50 hover:text-rust-600 transition-all border border-transparent hover:border-rust-200"
                      >
                         <Edit2 className="w-5 h-5" />
                      </button>
                   </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-24 bg-white border border-rust-50 rounded-[3rem] shadow-inner">
             <div className="w-20 h-20 bg-rust-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-rust-200" />
             </div>
             <h3 className="text-2xl font-bold text-surface-900 mb-2">No appointments yet</h3>
             <p className="text-surface-500 mb-8 max-w-sm mx-auto">Create your first appointment type to start accepting bookings from your customers.</p>
             <button 
               onClick={() => navigate('/organizer/appointments/new')}
               className="inline-flex items-center gap-2 px-8 py-3.5 bg-rust-500 text-white rounded-2xl font-bold hover:bg-rust-600 transition-all shadow-lg shadow-rust-500/30"
             >
               <Plus className="w-5 h-5" />
               Create First Appointment
             </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrganizerDashboard;
