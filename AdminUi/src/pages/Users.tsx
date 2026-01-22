import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Shield, 
  User as UserIcon,
  Edit3,
  Eye,
  ChevronLeft,
  ChevronRight,
  Mail,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { adminApi } from '../services/api';
import type { UserSummary, Pagination } from '../types';
import { toast } from 'react-hot-toast';
import { cn } from '../utils/cn';
import { Modal, ConfirmModal, Button, Badge, Input, Select } from '../components/ui';

const Users = () => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'customer' });
  const [newRole, setNewRole] = useState('customer');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminApi.getUsers({ 
        role: filter !== 'all' ? filter : undefined,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'active',
        search: searchDebounce || undefined,
        page: pagination.page,
        limit: pagination.limit
      });
      
      if (response.success) {
        setUsers(response.data);
        if (response.meta?.pagination) {
          setPagination(prev => ({ ...prev, ...response.meta?.pagination }));
        }
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error?.message || 'Failed to load users');
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filter, activeFilter, searchDebounce, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleStatusToggle = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const response = await adminApi.updateUserStatus(selectedUser.id, !selectedUser.isActive);
      if (response.success) {
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, isActive: !selectedUser.isActive } : u));
        toast.success(`User ${!selectedUser.isActive ? 'activated' : 'deactivated'} successfully`);
        setStatusModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const response = await adminApi.updateUserRole(selectedUser.id, newRole);
      if (response.success) {
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: newRole as any } : u));
        toast.success('User role updated successfully');
        setRoleModalOpen(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const openViewModal = (user: UserSummary) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  const openEditModal = (user: UserSummary) => {
    setSelectedUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
    setEditModalOpen(true);
  };

  const openStatusModal = (user: UserSummary) => {
    setSelectedUser(user);
    setStatusModalOpen(true);
  };

  const openRoleModal = (user: UserSummary) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleModalOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'purple';
      case 'organiser': return 'info';
      default: return 'default';
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  if (error && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">Failed to Load Users</h2>
            <p className="text-surface-500 mb-4">{error}</p>
            <button 
              onClick={fetchUsers}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-surface-900 tracking-tight">User Management</h1>
          <p className="text-surface-500 mt-2">Manage users, roles, and permissions.</p>
        </div>
        <button 
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-surface-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-surface-200"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters Card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-surface-200 flex flex-col lg:flex-row gap-4 justify-between bg-surface-50/50">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-surface-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-surface-500" />
              <select 
                value={filter}
                onChange={(e) => { setFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                className="bg-white border border-surface-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="all">All Roles</option>
                <option value="customer">Customers</option>
                <option value="organiser">Organisers</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex rounded-lg border border-surface-200 overflow-hidden">
              {['all', 'active', 'inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => { setActiveFilter(status as any); setPagination(p => ({ ...p, page: 1 })); }}
                  className={cn(
                    "px-3 py-2 text-sm font-medium capitalize transition-colors",
                    activeFilter === status 
                      ? "bg-primary-600 text-white" 
                      : "bg-white text-surface-600 hover:bg-surface-50"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-50 text-surface-500 font-medium border-b border-surface-200">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Verified</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Activity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <motion.tbody 
              className="divide-y divide-surface-100"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                      <span className="text-surface-500">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-surface-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : users.map((user) => (
                <motion.tr 
                  key={user.id} 
                  variants={rowVariants}
                  className="hover:bg-surface-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-surface-900">{user.name}</p>
                        <p className="text-xs text-surface-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                      {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => openStatusModal(user)}
                      title={user.isActive ? 'Click to deactivate user' : 'Click to activate user'}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                        user.isActive 
                          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300" 
                          : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300"
                      )}
                    >
                      {user.isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {user.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={user.emailVerified ? 'success' : 'warning'}>
                      {user.emailVerified ? 'Verified' : 'Pending'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-surface-500">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs text-surface-500">
                      <span>{user.bookingsCount || 0} Bookings</span>
                      <span>{user.appointmentsCount || 0} Appointments</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openViewModal(user)}
                        className="p-2 hover:bg-surface-100 rounded-lg text-surface-400 hover:text-primary-600 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openRoleModal(user)}
                        className="p-2 hover:bg-surface-100 rounded-lg text-surface-400 hover:text-primary-600 transition-colors"
                        title="Change Role"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openEditModal(user)}
                        className="p-2 hover:bg-surface-100 rounded-lg text-surface-400 hover:text-primary-600 transition-colors"
                        title="Edit User"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-surface-200 bg-surface-50/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-surface-500">
          <span>
            Showing {users.length} of {pagination.total} users
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="flex items-center gap-1 px-3 py-1.5 border border-surface-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let pageNum = i + 1;
                if (pagination.totalPages > 5) {
                  if (pagination.page > 3) {
                    pageNum = pagination.page - 2 + i;
                  }
                  if (pageNum > pagination.totalPages) {
                    pageNum = pagination.totalPages - 4 + i;
                  }
                }
                return pageNum;
              }).filter(p => p > 0 && p <= pagination.totalPages).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={cn(
                    "w-8 h-8 rounded-lg font-medium transition-colors",
                    pagination.page === page 
                      ? "bg-primary-600 text-white" 
                      : "hover:bg-surface-100"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
            <button 
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="flex items-center gap-1 px-3 py-1.5 border border-surface-200 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View User Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        title="User Details"
        description="Detailed information about this user"
        size="lg"
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold text-surface-900">{selectedUser.name}</h3>
                <p className="text-surface-500">{selectedUser.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-500 mb-1">Role</p>
                <Badge variant={getRoleBadgeVariant(selectedUser.role)} className="capitalize">
                  {selectedUser.role}
                </Badge>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-500 mb-1">Status</p>
                <Badge variant={selectedUser.isActive ? 'success' : 'danger'}>
                  {selectedUser.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-500 mb-1">Email Verified</p>
                <Badge variant={selectedUser.emailVerified ? 'success' : 'warning'}>
                  {selectedUser.emailVerified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <p className="text-xs text-surface-500 mb-1">Joined</p>
                <p className="font-medium text-surface-900">
                  {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary-50 rounded-xl text-center">
                <p className="text-3xl font-bold text-primary-700">{selectedUser.bookingsCount || 0}</p>
                <p className="text-sm text-primary-600">Total Bookings</p>
              </div>
              <div className="p-4 bg-rust-50 rounded-xl text-center">
                <p className="text-3xl font-bold text-rust-700">{selectedUser.appointmentsCount || 0}</p>
                <p className="text-sm text-rust-600">Appointments</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-surface-100">
              <Button variant="outline" onClick={() => setViewModalOpen(false)} className="flex-1">
                Close
              </Button>
              <Button onClick={() => { setViewModalOpen(false); openEditModal(selectedUser); }} className="flex-1">
                Edit User
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit User"
        description="Update user information"
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); toast.success('User updated!'); setEditModalOpen(false); }} className="space-y-4">
          <Input
            label="Full Name"
            value={editForm.name}
            onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
            placeholder="John Doe"
            icon={<UserIcon className="w-5 h-5" />}
          />
          <Input
            label="Email Address"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
            placeholder="john@example.com"
            icon={<Mail className="w-5 h-5" />}
          />
          <Select
            label="Role"
            value={editForm.role}
            onChange={(e) => setEditForm(f => ({ ...f, role: e.target.value }))}
            options={[
              { value: 'customer', label: 'Customer' },
              { value: 'organiser', label: 'Organiser' },
              { value: 'admin', label: 'Admin' }
            ]}
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title="Change User Role"
        description={`Update role for ${selectedUser?.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Select New Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            options={[
              { value: 'customer', label: 'Customer' },
              { value: 'organiser', label: 'Organiser' },
              { value: 'admin', label: 'Admin' }
            ]}
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setRoleModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleRoleUpdate} isLoading={actionLoading} className="flex-1">
              Update Role
            </Button>
          </div>
        </div>
      </Modal>

      {/* Status Toggle Modal */}
      <ConfirmModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={handleStatusToggle}
        title={selectedUser?.isActive ? 'Deactivate User' : 'Activate User'}
        message={selectedUser?.isActive 
          ? `Are you sure you want to deactivate ${selectedUser?.name}? They will not be able to log in to their account.`
          : `Are you sure you want to activate ${selectedUser?.name}? They will regain full access to the platform.`
        }
        confirmText={selectedUser?.isActive ? 'Deactivate User' : 'Activate User'}
        variant={selectedUser?.isActive ? 'danger' : 'success'}
        isLoading={actionLoading}
      />

    </motion.div>
  );
};

export default Users;
