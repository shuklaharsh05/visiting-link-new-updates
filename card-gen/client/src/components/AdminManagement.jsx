import React, { useState, useEffect, useMemo } from 'react';
import { adminAPI } from '../api/admins';
import { useToast } from '../contexts/ToastContext';
import { Trash2 } from 'lucide-react';

const ADMIN_TYPE_OPTIONS = [
  { value: 'in-house', label: 'In-House Admin' },
  { value: 'corporate', label: 'Corporate Admin' },
  { value: 'individual', label: 'Individual Admin' },
];

function formatAdminType(type) {
  const found = ADMIN_TYPE_OPTIONS.find((o) => o.value === (type || 'individual'));
  return found ? found.label : type || 'Individual Admin';
}

const LIST_CATEGORY_ORDER = ['in-house', 'corporate', 'individual'];
const LIST_CATEGORY_HEADINGS = {
  'in-house': 'In-House Admins',
  corporate: 'Corporate Admins',
  individual: 'Individual Admins',
};

function normalizeListAdminType(raw) {
  const t = String(raw || 'individual').toLowerCase();
  if (t === 'in-house' || t === 'inhouse') return 'in-house';
  if (t === 'corporate') return 'corporate';
  return 'individual';
}

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
    type: 'individual',
    costPerCard: 0,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordModalAdmin, setPasswordModalAdmin] = useState(null);
  const [pwForm, setPwForm] = useState({ password: '', confirmPassword: '' });
  const [showPwNew, setShowPwNew] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const [listSearch, setListSearch] = useState('');
  const [listCategoryFilter, setListCategoryFilter] = useState('all');

  const { showToast } = useToast();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllAdmins();
      setAdmins(response);
    } catch (error) {
      showToast('Failed to fetch admins', 'error');
    } finally {
      setLoading(false);
    }
  };

  const listFilteredAdmins = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    return admins.filter((a) => {
      if (q && !String(a.name || '').toLowerCase().includes(q)) return false;
      if (listCategoryFilter !== 'all' && normalizeListAdminType(a.type) !== listCategoryFilter) {
        return false;
      }
      return true;
    });
  }, [admins, listSearch, listCategoryFilter]);

  const listGroupedAdmins = useMemo(() => {
    const map = { 'in-house': [], corporate: [], individual: [] };
    for (const a of listFilteredAdmins) {
      const k = normalizeListAdminType(a.type);
      if (map[k]) map[k].push(a);
      else map.individual.push(a);
    }
    for (const k of LIST_CATEGORY_ORDER) {
      map[k].sort((x, y) => String(x.name).localeCompare(String(y.name)));
    }
    return map;
  }, [listFilteredAdmins]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateCreate = () => {
    if (!formData.name.trim()) {
      showToast('Admin name is required', 'error');
      return false;
    }
    if (!formData.password) {
      showToast('Password is required', 'error');
      return false;
    }
    if (formData.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return false;
    }
    return true;
  };

  const validateEdit = () => {
    if (!formData.name.trim()) {
      showToast('Admin name is required', 'error');
      return false;
    }
    const cost = Number(formData.costPerCard);
    if (Number.isNaN(cost) || cost < 0) {
      showToast('Cost per card must be a valid non-negative number', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingAdmin) {
        if (!validateEdit()) return;
        await adminAPI.updateAdmin(editingAdmin._id, {
          name: formData.name.trim(),
          type: formData.type,
          costPerCard: Number(formData.costPerCard || 0),
        });
        showToast('Admin updated successfully', 'success');
      } else {
        if (!validateCreate()) return;
        await adminAPI.createAdmin({
          name: formData.name.trim(),
          password: formData.password,
          type: formData.type,
          costPerCard: Number(formData.costPerCard || 0),
        });
        showToast('Admin created successfully', 'success');
      }

      resetForm();
      fetchAdmins();
    } catch (error) {
      showToast(error.error || error.message || 'Operation failed', 'error');
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      password: '',
      confirmPassword: '',
      type: admin.type || 'individual',
      costPerCard: admin.costPerCard ?? 0,
    });
    setShowCreateForm(true);
  };

  const openPasswordModal = (admin) => {
    setPasswordModalAdmin(admin);
    setPwForm({ password: '', confirmPassword: '' });
    setShowPwNew(false);
    setShowPwConfirm(false);
  };

  const closePasswordModal = () => {
    setPasswordModalAdmin(null);
    setPwForm({ password: '', confirmPassword: '' });
    setPwSubmitting(false);
  };

  const handlePasswordModalSubmit = async (e) => {
    e.preventDefault();
    if (!passwordModalAdmin) return;
    if (!pwForm.password || pwForm.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (pwForm.password !== pwForm.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    try {
      setPwSubmitting(true);
      await adminAPI.updateAdminPassword(passwordModalAdmin._id, pwForm.password);
      showToast('Password updated successfully', 'success');
      closePasswordModal();
    } catch (error) {
      showToast(error.error || error.message || 'Failed to update password', 'error');
    } finally {
      setPwSubmitting(false);
    }
  };

  const handleDelete = async (admin) => {
    if (!window.confirm(`Are you sure you want to delete admin "${admin.name}"?`)) {
      return;
    }

    try {
      await adminAPI.deleteAdmin(admin._id);
      showToast('Admin deleted successfully', 'success');
      fetchAdmins();
    } catch (error) {
      showToast(error.error || 'Failed to delete admin', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      password: '',
      confirmPassword: '',
      type: 'individual',
      costPerCard: 0,
    });
    setEditingAdmin(null);
    setShowCreateForm(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
        <button
          onClick={() => {
            setEditingAdmin(null);
            setFormData({
              name: '',
              password: '',
              confirmPassword: '',
              type: 'individual',
              costPerCard: 0,
            });
            setShowCreateForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Admin
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingAdmin ? 'Edit Admin' : 'Create New Admin'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {ADMIN_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost per card (₹)
                </label>
                <input
                  type="number"
                  name="costPerCard"
                  min="0"
                  step="0.01"
                  value={formData.costPerCard}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {editingAdmin ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wallet balance (₹)
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`₹${editingAdmin.walletBalance ?? 0}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wallet balance is managed elsewhere and cannot be edited here.
                </p>
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter admin name"
                required
              />
            </div>

            {!editingAdmin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingAdmin ? 'Update Admin' : 'Create Admin'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Admins List</h2>
          <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 min-w-0">
              <label htmlFor="admin-list-search" className="block text-xs font-medium text-gray-500 mb-1">
                Search by name
              </label>
              <input
                id="admin-list-search"
                type="search"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Search admins…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="w-full sm:w-56 shrink-0">
              <label htmlFor="admin-list-category" className="block text-xs font-medium text-gray-500 mb-1">
                Category
              </label>
              <select
                id="admin-list-category"
                value={listCategoryFilter}
                onChange={(e) => setListCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 bg-white"
              >
                <option value="all">All types</option>
                <option value="in-house">In-House Admin</option>
                <option value="corporate">Corporate Admin</option>
                <option value="individual">Individual Admin</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost / Card
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Wallet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cards created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-8 text-center text-gray-500">
                    No admins found
                  </td>
                </tr>
              ) : listFilteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-8 text-center text-gray-500">
                    No admins match your search or filter
                  </td>
                </tr>
              ) : (
                LIST_CATEGORY_ORDER.map((cat) => {
                  if (listCategoryFilter !== 'all' && listCategoryFilter !== cat) {
                    return null;
                  }
                  const group = listGroupedAdmins[cat] || [];
                  return (
                    <React.Fragment key={cat}>
                      <tr className="bg-gray-100/90">
                        <td
                          colSpan="11"
                          className="px-6 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide border-t border-gray-200"
                        >
                          {LIST_CATEGORY_HEADINGS[cat]}
                        </td>
                      </tr>
                      {group.length === 0 ? (
                        <tr>
                          <td colSpan="11" className="px-6 py-3 text-sm text-gray-400 bg-white">
                            No admins in this category
                          </td>
                        </tr>
                      ) : (
                        group.map((admin) => (
                          <tr key={admin._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {admin.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {admin.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatAdminType(admin.type)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ₹{admin.costPerCard ?? 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ₹{admin.walletBalance ?? 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 tabular-nums">
                              {admin.usersCreatedCount ?? 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 tabular-nums">
                              {admin.cardsCreatedCount ?? 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  admin.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {admin.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(admin.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {admin.lastLogin
                                ? new Date(admin.lastLogin).toLocaleDateString()
                                : 'Never'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-wrap gap-4 items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(admin)}
                                  className="text-blue-600 hover:text-blue-900 text-[13px] hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openPasswordModal(admin)}
                                  className="text-gray-700 hover:text-gray-900 text-[13px] hover:underline"
                                >
                                  Change Password
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(admin)}
                                  className="text-red-600 hover:text-red-900 ml-6"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {passwordModalAdmin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pw-modal-title"
          onClick={closePasswordModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="pw-modal-title" className="text-lg font-semibold text-gray-900 mb-1">
              Change password
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Set a new password for <strong>{passwordModalAdmin.name}</strong>.
            </p>
            <form onSubmit={handlePasswordModalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPwNew ? 'text' : 'password'}
                    value={pwForm.password}
                    onChange={(e) => setPwForm((p) => ({ ...p, password: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="New password"
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwNew(!showPwNew)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPwNew ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPwConfirm ? 'text' : 'password'}
                    value={pwForm.confirmPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwConfirm(!showPwConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPwConfirm ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={pwSubmitting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pwSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {pwSubmitting ? 'Saving…' : 'Update password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
