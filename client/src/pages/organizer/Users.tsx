import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Mail, User as UserIcon, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../store/api';
import toast from 'react-hot-toast';
import { Avatar } from '../../components/Avatar';

interface Resource {
  id: string;
  name: string;
  type: 'user' | 'resource';
  capacity: number | null;
  email: string | null;
  createdAt: string;
}

const Users = () => {
  const [users, setUsers] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    capacity: 1,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/resources');
      if (res.data.success) {
        // Filter only resources of type 'user'
        const userResources = res.data.data.filter((r: Resource) => r.type === 'user');
        setUsers(userResources);
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        type: 'user', // Always set type to 'user'
      };

      if (editingUser) {
        await api.patch(`/resources/${editingUser.id}`, payload);
        toast.success('User updated successfully');
      } else {
        await api.post('/resources', payload);
        toast.success('User created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error('Failed to save user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await api.delete(`/resources/${id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleEdit = (user: Resource) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email || '',
      capacity: user.capacity || 1,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      capacity: 1,
    });
    setEditingUser(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-rust-200 border-t-rust-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="mb-4 flex items-center gap-2 text-surface-500 hover:text-rust-600 font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-3xl font-bold text-surface-900">Users</h1>
            <p className="text-surface-500 mt-1 font-medium">
              Manage bookable user resources for appointments
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 rust-gradient text-white rounded-xl font-bold hover:shadow-lg shadow-rust-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add User
          </button>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-rust-100 rounded-2xl p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <Avatar name={user.name} size="lg" />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="p-2 hover:bg-rust-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-rust-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-surface-900 mb-3">{user.name}</h3>

              <div className="space-y-2 text-sm">
                {user.email && (
                  <div className="flex items-center gap-2 text-surface-600">
                    <Mail className="w-4 h-4 text-rust-500" />
                    <span className="font-medium truncate">{user.email}</span>
                  </div>
                )}

                {user.capacity && (
                  <div className="flex items-center justify-between pt-2 border-t border-rust-50">
                    <span className="text-surface-500 font-medium">Capacity:</span>
                    <span className="text-surface-900 font-bold">{user.capacity}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-rust-100">
            <UserIcon className="w-16 h-16 mx-auto mb-4 text-rust-300" />
            <h3 className="text-xl font-bold text-surface-900 mb-2">No users yet</h3>
            <p className="text-surface-500 mb-6">Create your first bookable user to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rust-gradient text-white rounded-xl font-bold hover:shadow-lg shadow-rust-500/20 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add User
            </button>
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={handleCloseModal}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-6"
              >
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
                  <h2 className="text-2xl font-bold text-surface-900 mb-6">
                    {editingUser ? 'Edit User' : 'New User'}
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-rust-500 mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Vipin Goyal"
                        required
                        className="w-full px-4 py-3 bg-surface-50 border border-rust-100 rounded-xl text-surface-900 placeholder-surface-300 outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/10 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-rust-500 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="vipin@mail.com"
                        className="w-full px-4 py-3 bg-surface-50 border border-rust-100 rounded-xl text-surface-900 placeholder-surface-300 outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/10 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-rust-500 mb-2">
                        Capacity
                      </label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
                        min="1"
                        required
                        className="w-full px-4 py-3 bg-surface-50 border border-rust-100 rounded-xl text-surface-900 outline-none focus:border-rust-500 focus:ring-2 focus:ring-rust-500/10 transition-all"
                      />
                      <p className="text-xs text-surface-400 mt-2 font-medium">
                        Maximum simultaneous appointments this user can handle
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="flex-1 px-6 py-3 bg-surface-100 text-surface-700 rounded-xl font-bold hover:bg-surface-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 rust-gradient text-white rounded-xl font-bold hover:shadow-lg shadow-rust-500/20 transition-all"
                      >
                        {editingUser ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Users;
