import { motion } from 'framer-motion';
import { ShieldX, ArrowLeft, LogOut, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui';

const NotAuthorized = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-red-50/30 to-surface-50 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -right-[20%] w-[70%] h-[70%] rounded-full bg-red-100/40 blur-[120px]" />
        <div className="absolute -bottom-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-primary-100/40 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 max-w-lg w-full"
      >
        <div className="glass-card rounded-3xl p-8 md:p-12 text-center shadow-2xl">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center shadow-lg shadow-red-200/50"
          >
            <ShieldX className="w-12 h-12 text-red-600" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold text-surface-900 mb-3"
          >
            Access Denied
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-surface-500 text-lg mb-6"
          >
            You don't have permission to access the Admin Dashboard
          </motion.p>

          {/* User Info */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-surface-50 rounded-2xl p-4 mb-8"
            >
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-surface-900">{user.name}</p>
                  <p className="text-sm text-surface-500">{user.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 capitalize">
                    Role: {user.role}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8"
          >
            <p className="text-red-700 text-sm">
              <strong>Admin access required.</strong> Only users with the <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded">admin</span> role can access this dashboard.
              Please contact your system administrator if you believe this is an error.
            </p>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex-1 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
            <Button
              variant="danger"
              onClick={handleLogout}
              className="flex-1 gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </motion.div>

          {/* Help text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-xs text-surface-400"
          >
            Need help? Contact support at <a href="mailto:support@slotify.com" className="text-primary-600 hover:underline">support@slotify.com</a>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default NotAuthorized;

