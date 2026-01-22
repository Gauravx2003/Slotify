import { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  ArrowRight,
  Star,
  Shield,
  MapPin,
  Sparkles,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Home = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [hash]);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "organiser") {
        navigate("/organizer/dashboard");
      } else if (user.role === "customer") {
        navigate("/customer/dashboard");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const appointmentTypes = [
    {
      id: 1,
      title: "General Consultation",
      description:
        "A standard check-up with professional practitioners for your daily needs.",
      duration: "30 mins",
      icon: <User className="w-6 h-6" />,
    },
    {
      id: 2,
      title: "Specialist Visit",
      description:
        "Expert consultation for specific concerns with top-tier specialists.",
      duration: "45 mins",
      icon: <Shield className="w-6 h-6" />,
    },
    {
      id: 3,
      title: "Dental Care",
      description:
        "Complete dental examination and hygiene services in our premium facility.",
      duration: "60 mins",
      icon: <Star className="w-6 h-6" />,
    },
  ];

  const steps = [
    {
      id: 1,
      icon: <Sparkles className="w-8 h-8 text-rust-600" />,
      title: "For Organisers",
      description:
        "Set up your availability, create appointment types, and manage resources.",
    },
    {
      id: 2,
      icon: <Calendar className="w-8 h-8 text-rust-600" />,
      title: "For Customers",
      description:
        "Browse services, pick a slot, and book instantly with secure payments.",
    },
    {
      id: 3,
      icon: <CheckCircle className="w-8 h-8 text-rust-600" />,
      title: "Automated Sync",
      description:
        "Get instant confirmations and reminders on all your devices.",
    },
  ];

  return (
    <div className="min-h-screen bg-surface-50 font-sans text-surface-900 selection:bg-rust-500/30 selection:text-rust-950">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-40 overflow-hidden px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-gradient-to-b from-rust-50/50 to-transparent -z-10"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 px-5 py-2.5 bg-white rounded-full shadow-lg border border-rust-100 mb-10 group cursor-pointer hover:border-rust-300 transition-all"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rust-500">
                <Star className="w-3.5 h-3.5 text-white fill-white" />
              </div>
              <span className="text-sm font-black uppercase tracking-widest text-surface-900 group-hover:text-rust-600 transition-colors">
                Loved by over 10,000+ users
              </span>
            </motion.div>

            <h1 className="text-7xl sm:text-8xl font-black text-surface-900 mb-8 leading-[1.05] tracking-tight">
              Every Moment <br />
              <span className="text-gradient">Has Its Slot</span>
            </h1>

            <p className="text-xl text-surface-500 mb-12 max-w-lg leading-relaxed font-medium">
              Flexible scheduling made simple. Connect with world-class
              specialists, manage your time, and book your next slot in seconds.
            </p>

            <div className="flex flex-wrap items-center gap-8">
              <Link
                to="/appointments"
                className="rust-gradient text-white font-black uppercase tracking-widest text-xs px-10 py-6 rounded-3xl transition-all shadow-[0_20px_40px_rgba(219,110,52,0.25)] hover:shadow-[0_25px_50px_rgba(219,110,52,0.35)] hover:-translate-y-1 block sm:inline-block text-center active:scale-95"
              >
                Explore Services
              </Link>
              <Link
                to="/demo"
                className="flex items-center gap-4 text-sm font-black uppercase tracking-[0.2em] group"
              >
                <span className="group-hover:text-rust-600 transition-colors">
                  Watch Demo
                </span>
                <div className="w-14 h-14 rounded-full border-2 border-rust-100 flex items-center justify-center group-hover:bg-rust-500 group-hover:text-white group-hover:border-rust-500 transition-all transform group-hover:rotate-45">
                  <ArrowRight className="w-6 h-6" />
                </div>
              </Link>
            </div>
          </motion.div>

          <div className="relative h-full flex items-center justify-center pt-20 lg:pt-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative w-full max-w-lg aspect-square"
            >
              <div className="absolute inset-0 bg-rust-500 rounded-full blur-[150px] opacity-10 animate-pulse"></div>

              {/* Organic Image Shape */}
              <div className="relative w-full h-full blob-shape overflow-hidden shadow-2xl border-4 border-white bg-rust-50 group">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop"
                  alt="Professional booking"
                  className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 scale-110 group-hover:scale-100"
                />
              </div>

              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -20, 0], x: [0, 5, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -left-16 bottom-1/4 glass-card p-6 rounded-[2.5rem] w-72 shadow-2xl z-20"
              >
                <div className="flex justify-between items-center mb-6">
                  <span className="px-3 py-1 bg-rust-50 rounded-full text-[10px] font-black uppercase tracking-widest text-rust-600">
                    Specialist Visit
                  </span>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                </div>
                <h3 className="text-2xl font-black text-surface-900 mb-4">
                  Dr. Sarah Connor
                </h3>
                <div className="flex items-center gap-3 py-4 border-y border-rust-50 mb-6">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-2 border-white bg-rust-50 shadow-sm overflow-hidden"
                      >
                        <img
                          src={`https://i.pravatar.cc/100?u=${i + 40}`}
                          alt="user"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-surface-400">
                    Join 32 others
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-black text-rust-600 uppercase">
                    <Clock className="w-4 h-4" /> 10:30 AM
                  </div>
                  <div className="text-[10px] font-black text-surface-300 uppercase tracking-widest">
                    Confirmed
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute -right-12 top-10 glass-card p-6 rounded-[2rem] w-64 shadow-2xl z-20"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-rust-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase text-surface-300 tracking-widest">
                      Location
                    </span>
                    <span className="text-lg font-black text-surface-900 tracking-tighter">
                      Medical Center
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-black bg-rust-50 text-rust-600 px-4 py-2 rounded-full w-fit">
                  <Star className="w-3.5 h-3.5 fill-rust-600" /> Top Rated
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-40 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-24">
            <h2 className="text-5xl font-black text-surface-900 tracking-tight leading-[1.1] mb-8">
              Curated <span className="text-gradient">Professional</span> <br />
              Booking Options
            </h2>
            <p className="text-xl text-surface-500 font-medium leading-relaxed">
              Explore our most popular service categories, designed to provide a
              premium and seamless scheduling experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {appointmentTypes.map((type, index) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-surface-50 rounded-[3rem] p-10 border border-transparent card-glow flex flex-col items-start relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-rust-500/5 rounded-bl-[100px] -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700"></div>

                <div className="w-16 h-16 bg-white rounded-2xl shadow-xl border border-rust-50 text-rust-500 flex items-center justify-center mb-10 group-hover:bg-rust-500 group-hover:text-white transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                  {type.icon}
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-rust-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-rust-500">
                    {type.duration}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-surface-900 mb-6 tracking-tight group-hover:text-rust-600 transition-colors">
                  {type.title}
                </h3>
                <p className="text-surface-500 mb-10 font-medium leading-relaxed flex-grow">
                  {type.description}
                </p>

                <Link
                  to="/appointments"
                  className="flex items-center justify-center gap-3 w-full py-5 bg-white border border-rust-100 rounded-2xl text-surface-900 font-black uppercase tracking-widest text-[10px] shadow-sm hover:shadow-xl hover:bg-rust-500 hover:text-white hover:border-rust-500 hover:-translate-y-1 transition-all duration-300"
                >
                  Book Selection
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-surface-900 tracking-tight mb-6">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="text-xl text-surface-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Getting started is as easy as 1-2-3. We've streamlined the process so you can focus on what matters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative p-10 rounded-[2.5rem] bg-surface-50 border border-surface-100 hover:border-rust-200 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="absolute -top-6 left-10 w-12 h-12 bg-surface-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg group-hover:bg-rust-500 group-hover:-translate-y-2 transition-all duration-300">
                1
              </div>
              <div className="mt-4 mb-6 text-rust-500">
                <User className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-surface-900 mb-4">Create Account</h3>
              <p className="text-surface-500 font-medium leading-relaxed">
                Sign up in seconds. Profile creation is quick, secure, and sets you up for instant access.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative p-10 rounded-[2.5rem] bg-surface-50 border border-surface-100 hover:border-rust-200 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="absolute -top-6 left-10 w-12 h-12 bg-surface-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg group-hover:bg-rust-500 group-hover:-translate-y-2 transition-all duration-300">
                2
              </div>
              <div className="mt-4 mb-6 text-rust-500">
                <Calendar className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-surface-900 mb-4">Find & Book</h3>
              <p className="text-surface-500 font-medium leading-relaxed">
                Browse real-time availability. Select a time that works for you and book with a single click.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative p-10 rounded-[2.5rem] bg-surface-50 border border-surface-100 hover:border-rust-200 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="absolute -top-6 left-10 w-12 h-12 bg-surface-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg group-hover:bg-rust-500 group-hover:-translate-y-2 transition-all duration-300">
                3
              </div>
              <div className="mt-4 mb-6 text-rust-500">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-surface-900 mb-4">You're Set!</h3>
              <p className="text-surface-500 font-medium leading-relaxed">
                Receive instant confirmation and reminders. Manage everything from your dashboard.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-40 bg-rust-50/30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-32">
            <h2 className="text-5xl font-black text-surface-900 tracking-tight mb-8">
              Why Choose <span className="text-gradient">Slotify?</span>
            </h2>
            <p className="text-xl text-surface-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Experience a modern approach to scheduling that prioritizes your
              time and business efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
            <div className="hidden lg:block absolute top-[150px] left-[15%] right-[15%] h-[2px] bg-rust-100 border-dashed border-2 -z-10 opacity-50"></div>

            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-36 h-36 bg-white rounded-[2.5rem] flex items-center justify-center shadow-xl border-4 border-white mb-10 relative z-10 transition-all duration-500 group-hover:rotate-12 group-hover:translate-x-4 group-hover:shadow-[0_20px_60px_rgba(219,110,52,0.15)]">
                  <div className="text-rust-500 group-hover:scale-110 transition-transform duration-500">
                    {step.icon}
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-rust-500 rounded-2xl flex items-center justify-center text-white font-black border-4 border-white shadow-lg text-lg">
                    0{index + 1}
                  </div>
                </div>
                <h3 className="text-2xl font-black text-surface-900 mb-6 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-surface-500 font-medium text-lg leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
