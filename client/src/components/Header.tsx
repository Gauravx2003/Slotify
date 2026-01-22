import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Menu,
  X,
  User,
  ChevronDown,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useDispatch } from "react-redux";
import { logout } from "../store/authSlice";
import type { AppDispatch } from "../store";
import { Avatar } from "./Avatar";
// import GoogleTranslate from "./GoogleTranslate";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = async () => {
    await dispatch(logout());
    setIsMenuOpen(false);
  };

  const navLinks = [
    { name: "Explore", path: "/appointments" },
    // { name: "Features", path: "/#features" },
    { name: "Pricing", path: "/pricing" },
    { name: "How it Works", path: "/how-it-works" },
  ];

  if (user?.role === "customer") {
    navLinks.push({ name: "Bookings", path: "/customer/bookings" });
  }



  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-rust-100 py-4 shadow-sm"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-rust-500 rounded-2xl flex items-center justify-center transform -rotate-6 shadow-lg group-hover:rotate-0 transition-transform duration-300">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter uppercase leading-none text-surface-900">
                Slotify
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rust-500">
                Booking System
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-bold tracking-wide transition-all duration-300 relative group ${
                    isActive
                      ? "text-rust-600"
                      : "text-surface-600 hover:text-rust-600"
                  }`}
                >
                  {link.name}
                  <span
                    className={`absolute -bottom-2 left-0 w-full h-0.5 bg-rust-500 transform transition-transform duration-300 origin-left ${
                      isActive
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Google Translate Container */}
            {/* <GoogleTranslate id="google_translate_element" /> */}

            {/* <div className="h-6 w-px bg-rust-100 mx-2"></div> */}

            {isAuthenticated && user ? (
              // Authenticated user UI - Dropdown
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 focus:outline-none"
                >
                  <Avatar 
                    src={user.image} 
                    name={user.name || user.email} 
                    size="md"
                    className="border-none"
                  />
                  <ChevronDown
                    className={`w-4 h-4 text-surface-600 transition-transform duration-200 ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-rust-100 overflow-hidden z-50"
                    >
                      <div className="p-4 bg-rust-50/50 border-b border-rust-100">
                        <p className="text-sm font-black text-surface-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs font-medium text-surface-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="p-2">
                        <Link
                          to="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-surface-700 hover:bg-rust-50 hover:text-rust-700 rounded-lg transition-colors"
                        >
                          <User className="w-4 h-4" />
                          My Profile
                        </Link>
                        <Link
                          to={
                            user?.role === "organiser"
                              ? "/organizer/dashboard"
                              : "/customer/dashboard"
                          }
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-surface-700 hover:bg-rust-50 hover:text-rust-700 rounded-lg transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                      </div>

                      <div className="h-px bg-rust-100 mx-2" />

                      <div className="p-2">
                        <button
                          onClick={async () => {
                            await dispatch(logout());
                            setIsProfileOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              // Guest user UI
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-surface-900 hover:text-rust-600 transition-colors"
                >
                  <User className="w-4 h-4" /> Sign In
                </Link>

                <Link
                  to="/signup"
                  className="rust-gradient text-white font-black uppercase tracking-widest text-[10px] px-8 py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-4">
            {/* <GoogleTranslate id="google_translate_element_mobile" /> */}
            <button
              onClick={toggleMenu}
              className="w-12 h-12 rounded-xl bg-rust-50 flex items-center justify-center text-rust-600"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed top-[88px] left-0 right-0 bg-white border-b border-rust-100 shadow-2xl overflow-hidden z-40 max-h-[calc(100vh-88px)] overflow-y-auto"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {isAuthenticated && user && (
                <div className="flex items-center gap-4 p-4 bg-rust-50 rounded-2xl mb-2">
                    <Avatar 
                      src={user.image} 
                      name={user.name || user.email} 
                      size="lg" 
                      className="border-2 border-rust-200 bg-white" 
                    />
                  <div className="overflow-hidden">
                    <p className="font-black text-surface-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs font-medium text-surface-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-2xl font-black text-surface-900 flex justify-between items-center group"
                  >
                    {link.name}
                    <ChevronDown className="w-6 h-6 text-rust-200 -rotate-90 group-hover:text-rust-500 transition-colors" />
                  </Link>
                ))}
              </div>

              <hr className="border-rust-50" />

              <div className="flex flex-col gap-4">
                {isAuthenticated && user ? (
                  // Authenticated mobile menu
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full py-4 bg-white border-2 border-surface-100 rounded-2xl text-center font-bold text-lg text-surface-900 flex items-center justify-center gap-2 hover:border-rust-500 transition-colors"
                    >
                      <User className="w-5 h-5" />
                      My Profile
                    </Link>
                    <Link
                      to={
                        user?.role === "organiser"
                          ? "/organizer/dashboard"
                          : "/customer/dashboard"
                      }
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full py-4 bg-white border-2 border-surface-100 rounded-2xl text-center font-bold text-lg text-surface-900 flex items-center justify-center gap-2 hover:border-rust-500 transition-colors"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full py-4 rust-gradient rounded-2xl text-center font-bold text-lg text-white shadow-xl flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  // Guest mobile menu
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full py-5 bg-rust-50 rounded-2xl text-center font-black text-xl text-rust-900"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setIsMenuOpen(false)}
                      className="w-full py-5 rust-gradient rounded-2xl text-center font-black text-xl text-white shadow-xl"
                    >
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Header;
