import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Button, Input, Select } from '../components/ui';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const Settings = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.name || 'Admin User',
    email: user?.email || 'admin@test.com',
    phone: '+1 234 567 8900'
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReport: true,
    securityAlerts: true
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const handleSaveProfile = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success('Profile updated successfully');
      setLoading(false);
    }, 1000);
  };

  const handleSaveNotifications = () => {
    setLoading(true);
    setTimeout(() => {
      toast.success('Notification preferences saved');
      setLoading(false);
    }, 1000);
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Settings</h1>
        <p className="text-surface-500 mt-2">Manage your account and preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="glass-card rounded-2xl p-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all',
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-surface-600 hover:bg-surface-50'
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b border-surface-100">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold">
                    {profile.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-surface-900">{profile.name}</h3>
                    <p className="text-surface-500">{profile.email}</p>
                    <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                      Administrator
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    icon={<User className="w-5 h-5" />}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    icon={<Mail className="w-5 h-5" />}
                  />
                  <Input
                    label="Phone Number"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="md:col-span-2"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-surface-100">
                  <Button onClick={handleSaveProfile} isLoading={loading} className="gap-2">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-surface-900">Notification Preferences</h3>

                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive email updates about your account' },
                    { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications in your browser' },
                    { key: 'weeklyReport', label: 'Weekly Reports', description: 'Get a weekly summary of platform activity' },
                    { key: 'securityAlerts', label: 'Security Alerts', description: 'Get notified about security-related events' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
                      <div>
                        <p className="font-medium text-surface-900">{item.label}</p>
                        <p className="text-sm text-surface-500">{item.description}</p>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                        className={cn(
                          'relative w-12 h-6 rounded-full transition-colors',
                          notifications[item.key as keyof typeof notifications] ? 'bg-primary-600' : 'bg-surface-300'
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                            notifications[item.key as keyof typeof notifications] ? 'translate-x-7' : 'translate-x-1'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-surface-100">
                  <Button onClick={handleSaveNotifications} isLoading={loading} className="gap-2">
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-surface-900">Security Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full px-4 py-3 rounded-xl bg-surface-50 border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 rounded-xl bg-surface-50 border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="w-full px-4 py-3 rounded-xl bg-surface-50 border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-sm text-amber-700">
                    <strong>Two-Factor Authentication</strong> is currently disabled.
                    <button className="ml-2 text-amber-800 underline hover:no-underline">Enable 2FA</button>
                  </p>
                </div>

                <div className="flex justify-end pt-4 border-t border-surface-100">
                  <Button onClick={() => toast.success('Password updated!')} className="gap-2">
                    <Save className="w-4 h-4" />
                    Update Password
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-surface-900">Appearance Settings</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-3">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Light', 'Dark', 'System'].map((theme) => (
                        <button
                          key={theme}
                          className={cn(
                            'p-4 rounded-xl border-2 transition-all text-center',
                            theme === 'Light'
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-surface-200 hover:border-surface-300'
                          )}
                        >
                          <div className={cn(
                            'w-8 h-8 rounded-lg mx-auto mb-2',
                            theme === 'Light' ? 'bg-white border border-surface-200' :
                            theme === 'Dark' ? 'bg-surface-800' :
                            'bg-gradient-to-br from-white to-surface-800'
                          )} />
                          <span className="text-sm font-medium text-surface-700">{theme}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-3">
                      Language
                    </label>
                    <Select
                      value="en"
                      options={[
                        { value: 'en', label: 'English' },
                        { value: 'es', label: 'Spanish' },
                        { value: 'fr', label: 'French' },
                        { value: 'de', label: 'German' },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-3">
                      Timezone
                    </label>
                    <Select
                      value="utc"
                      options={[
                        { value: 'utc', label: 'UTC (Coordinated Universal Time)' },
                        { value: 'est', label: 'EST (Eastern Standard Time)' },
                        { value: 'pst', label: 'PST (Pacific Standard Time)' },
                        { value: 'ist', label: 'IST (Indian Standard Time)' },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-surface-100">
                  <Button onClick={() => toast.success('Appearance settings saved!')} className="gap-2">
                    <Save className="w-4 h-4" />
                    Save Settings
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;

