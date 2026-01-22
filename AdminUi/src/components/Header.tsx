import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Search, 
  User, 
  Menu,
  LogOut,
  Settings,
  ChevronDown
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useAuthStore } from '../store/authStore';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'New booking', message: 'John Doe booked an appointment', time: '5m ago', unread: true },
    { id: 2, title: 'User registered', message: 'New organiser signed up', time: '1h ago', unread: true },
    { id: 3, title: 'Booking cancelled', message: 'Mike cancelled his session', time: '2h ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/': return 'Dashboard';
      case '/users': return 'User Management';
      case '/analytics': return 'Analytics';
      case '/appointments': return 'Appointments';
      case '/bookings': return 'Bookings';
      case '/settings': return 'Settings';
      default: return 'Admin Panel';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-20 px-4 lg:px-8 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-surface-200 sticky top-0 z-30">
      {/* Left Side */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-surface-100 rounded-lg text-surface-600 lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Page Title */}
        <div className="hidden sm:block">
          <h2 className="text-lg font-semibold text-surface-900">{getPageTitle()}</h2>
          <p className="text-xs text-surface-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Search Bar (hidden on small screens) */}
      <div className="hidden md:block flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-50 border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all text-sm"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className="relative p-2.5 rounded-xl hover:bg-surface-100 text-surface-600 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rust-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-surface-200 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-surface-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-surface-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 border-b border-surface-50 hover:bg-surface-50 transition-colors cursor-pointer",
                        notification.unread && "bg-primary-50/30"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {notification.unread && (
                          <span className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                        )}
                        <div className={cn(!notification.unread && "ml-5")}>
                          <p className="font-medium text-sm text-surface-900">{notification.title}</p>
                          <p className="text-xs text-surface-500 mt-0.5">{notification.message}</p>
                          <p className="text-xs text-surface-400 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-surface-100">
                  <button className="w-full py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center gap-3 pl-3 pr-2 py-2 rounded-xl hover:bg-surface-50 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-surface-900">{user?.name || 'Admin'}</p>
              <p className="text-xs text-surface-500 capitalize">{user?.role || 'Administrator'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-surface-400 transition-transform hidden sm:block",
              showUserMenu && "rotate-180"
            )} />
          </button>

          {/* User Dropdown */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-surface-200 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-surface-100">
                  <p className="font-medium text-surface-900">{user?.name}</p>
                  <p className="text-sm text-surface-500">{user?.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-surface-600 hover:bg-surface-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rust-600 hover:bg-rust-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sign out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowUserMenu(false); setShowNotifications(false); }}
        />
      )}
    </header>
  );
};

export default Header;
