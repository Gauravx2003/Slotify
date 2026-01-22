import { motion, useScroll, useTransform } from "framer-motion";
import {
  Calendar,
  Users,
  Package,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
  Settings,
  LayoutGrid,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

const HowItWorks = () => {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  return (
    <div className="min-h-screen bg-surface-50 font-sans text-surface-900 selection:bg-rust-500/30 selection:text-rust-950">
      <Header />

       {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-40 overflow-hidden px-4 sm:px-6 lg:px-8 min-h-[90vh] flex items-center bg-gradient-to-b from-rust-50/80 via-surface-50 to-surface-50">
        {/* Advanced Background: Animated Mesh Gradients */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gradient-to-br from-rust-200/40 to-rust-100/40 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gradient-to-tl from-rust-200/40 to-rust-100/40 rounded-full blur-[120px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rust-100/30 via-transparent to-transparent"></div>
        </div>

        <motion.div 
          style={{ opacity, scale }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-white border border-rust-200 text-rust-600 font-bold text-xs uppercase tracking-widest mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rust-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rust-600"></span>
              </span>
              System Architecture
            </span>
            <h1 className="text-6xl sm:text-8xl font-black text-surface-900 mb-8 leading-[1.1] tracking-tighter">
              Mastering the <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-rust-600 via-rust-500 to-orange-400">
                Booking Flow
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-surface-500 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
              Understand how Slotify connects Organizers, Resources, and Customers into a seamless scheduling ecosystem.
            </p>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center gap-4"
            >
              <div className="h-16 w-1 bg-gradient-to-b from-rust-500 to-transparent rounded-full animate-bounce"></div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Core Concept: Resources */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-surface-900 tracking-tight mb-6">
              The Power of <span className="text-rust-600">Resources</span>
            </h2>
            <p className="text-lg text-surface-500 font-medium max-w-3xl mx-auto leading-relaxed">
              At the heart of Slotify is the concept of <strong>Resources</strong>. Unlike simple calendars, we distinguish between <em>people</em> and <em>assets</em> to handle complex availability logic automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* User Resources */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-surface-50 rounded-[3rem] p-10 border border-rust-100 hover:border-rust-300 transition-all group"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-rust-500 mb-8 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-surface-900 mb-4">User Resources</h3>
              <p className="text-surface-500 font-medium mb-6 leading-relaxed">
                These are the <strong>Staff Members</strong> or professionals holding the appointments. 
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-rust-500 shrink-0 mt-0.5" />
                  <span className="text-surface-600 font-bold text-sm">Doctors, Consultants, Hair Statylists</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-rust-500 shrink-0 mt-0.5" />
                  <span className="text-surface-600 font-bold text-sm">Have personal working hours</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-rust-500 shrink-0 mt-0.5" />
                  <span className="text-surface-600 font-bold text-sm">Linked to specific Appointment Types</span>
                </li>
              </ul>
            </motion.div>

            {/* Physical Resources */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-surface-50 rounded-[3rem] p-10 border border-rust-100 hover:border-rust-300 transition-all group"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-rust-500 mb-8 group-hover:scale-110 transition-transform">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-surface-900 mb-4">Physical Resources</h3>
              <p className="text-surface-500 font-medium mb-6 leading-relaxed">
                These are the <strong>Assets or Rooms</strong> required for an appointment to take place.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-rust-500 shrink-0 mt-0.5" />
                  <span className="text-surface-600 font-bold text-sm">Meeting Rooms, MRI Machines, Courts</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-rust-500 shrink-0 mt-0.5" />
                  <span className="text-surface-600 font-bold text-sm">manage capacity independently</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-rust-500 shrink-0 mt-0.5" />
                  <span className="text-surface-600 font-bold text-sm">Prevent double-booking of shared assets</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Workflow Diagram Section */}
      <section className="py-24 bg-rust-900 text-white relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rust-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-yellow/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black mb-6">The Booking Lifecycle</h2>
            <p className="text-rust-200 text-lg max-w-2xl mx-auto">
              How data flows from setup to final confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[ 
              { title: "Define", icon: <Settings className="w-6 h-6" />, desc: "Organizer creates Appointment Types and assigns required Resources (User + Physical)." },
              { title: "Publish", icon: <LayoutGrid className="w-6 h-6" />, desc: "Set availability rules, duration, and pricing. Publish the link to customers." },
              { title: "Book", icon: <Calendar className="w-6 h-6" />, desc: "Customer selects a slot. System locks utilized resources to prevent conflicts." },
              { title: "Sync", icon: <Clock className="w-6 h-6" />, desc: "Confirmation sent. Calendar updated for Organizer, Staff, and Room schedules." }
            ].map((step, i) => (
              <div key={i} className="relative group">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 hover:bg-white/20 transition-all h-full">
                  <div className="w-12 h-12 bg-rust-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-rust-900/50">
                    {step.icon}
                  </div>
                  <h4 className="text-xl font-bold mb-3">{step.title}</h4>
                  <p className="text-rust-200 text-sm leading-relaxed">{step.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-20">
                    <ArrowRight className="w-6 h-6 text-rust-500/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white text-center">
        <div className="max-w-4xl mx-auto px-6">
             <h2 className="text-4xl font-black text-surface-900 mb-8">Ready to organize your business?</h2>
             <Link to="/signup" className="inline-flex items-center gap-3 px-8 py-4 bg-rust-600 text-white rounded-2xl font-bold text-lg hover:bg-rust-700 transition-all shadow-xl shadow-rust-500/20 hover:scale-105 active:scale-95">
                Start for Free <ArrowRight className="w-5 h-5" />
             </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
