import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Package, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../store/api';
import toast from 'react-hot-toast';

interface Resource {
  id: string;
  name: string;
  type: 'user' | 'resource';
  capacity: number | null;
  email: string | null;
  createdAt: string;
}

const Resources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 1,
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const res = await api.get('/resources');
      if (res.data.success) {
        // Filter only resources of type 'resource'
        const physicalResources = res.data.data.filter((r: Resource) => r.type === 'resource');
        setResources(physicalResources);
      }
    } catch (error) {
      toast.error('Failed to load resources');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        type: 'resource', // Always set type to 'resource'
      };

      if (editingResource) {
        await api.patch(`/resources/${editingResource.id}`, payload);
        toast.success('Resource updated successfully');
      } else {
        await api.post('/resources', payload);
        toast.success('Resource created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchResources();
    } catch (error) {
      toast.error('Failed to save resource');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      await api.delete(`/resources/${id}`);
      toast.success('Resource deleted successfully');
      fetchResources();
    } catch (error) {
      toast.error('Failed to delete resource');
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name,
      capacity: resource.capacity || 1,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      capacity: 1,
    });
    setEditingResource(null);
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
            <h1 className="text-3xl font-bold text-surface-900">Resources</h1>
            <p className="text-surface-500 mt-1 font-medium">
              Manage physical resources like rooms, equipment, and facilities
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 rust-gradient text-white rounded-xl font-bold hover:shadow-lg shadow-rust-500/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Resource
          </button>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-rust-100 rounded-2xl p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-surface-100">
                  <Package className="w-6 h-6 text-surface-600" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(resource)}
                    className="p-2 hover:bg-rust-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-rust-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-surface-900 mb-3">{resource.name}</h3>

              <div className="space-y-2 text-sm">
                {resource.capacity && (
                  <div className="flex items-center justify-between pt-2 border-t border-rust-50">
                    <span className="text-surface-500 font-medium">Capacity:</span>
                    <span className="text-surface-900 font-bold">{resource.capacity}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {resources.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-rust-100">
            <Package className="w-16 h-16 mx-auto mb-4 text-rust-300" />
            <h3 className="text-xl font-bold text-surface-900 mb-2">No resources yet</h3>
            <p className="text-surface-500 mb-6">Create your first resource to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rust-gradient text-white rounded-xl font-bold hover:shadow-lg shadow-rust-500/20 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Resource
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
                    {editingResource ? 'Edit Resource' : 'New Resource'}
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
                        placeholder="e.g. Chart 1, Room A, Equipment X"
                        required
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
                        Maximum simultaneous bookings for this resource
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
                        {editingResource ? 'Update' : 'Create'}
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

export default Resources;
