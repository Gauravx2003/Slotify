import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Calendar, 
  CalendarCheck,
  Settings, 
  LogOut,
  ChevronLeft,
  Shield,
  Menu
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/authStore';
import { ConfirmModal } from './ui';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: Calendar, label: 'Appointments', path: '/appointments' },
    { icon: CalendarCheck, label: 'Bookings', path: '/bookings' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
    setLogoutModalOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? 256 : 80,
          x: 0
        }}
        className={cn(
          "fixed left-0 top-0 h-screen bg-white border-r border-surface-200 flex flex-col z-50 transition-all duration-300",
          "lg:translate-x-0",
          !isOpen && "max-lg:-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-20 px-4 flex items-center justify-between border-b border-surface-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-500/20 flex-shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <AnimatePresence>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold text-xl tracking-tight text-surface-900 whitespace-nowrap overflow-hidden"
                >
                  Admin<span className="text-primary-600">Panel</span>
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-surface-100 rounded-lg text-surface-500 transition-colors hidden lg:flex"
          >
            <ChevronLeft className={cn("w-5 h-5 transition-transform", !isOpen && "rotate-180")} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 1024 && onToggle()}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "bg-primary-50 text-primary-700 font-medium shadow-sm"
                    : "text-surface-600 hover:bg-surface-50 hover:text-surface-900"
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {/* Tooltip for collapsed state */}
              {!isOpen && (
                <div className="absolute left-full ml-3 px-3 py-2 bg-surface-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-surface-100">
          {/* User Profile */}
          {user && isOpen && (
            <div className="mb-3 p-3 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium text-surface-900 truncate">{user.name}</p>
                  <p className="text-xs text-surface-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={() => setLogoutModalOpen(true)}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-rust-600 hover:bg-rust-50 transition-all duration-200 group",
              !isOpen && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0 transition-transform group-hover:-translate-x-1" />
            <AnimatePresence>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-medium whitespace-nowrap overflow-hidden"
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of the admin dashboard?"
        confirmText="Sign Out"
        variant="warning"
      />
    </>
  );
};

export default Sidebar;
