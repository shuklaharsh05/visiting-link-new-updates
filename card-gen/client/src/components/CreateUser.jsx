import React, { useState } from 'react';
import { UserPlus, CheckCircle, FileText, Eye, EyeOff } from 'lucide-react';
import { registerUser } from '../api/auth';
import { createInquiryForUser } from '../api/inquiries';
import { useToast } from '../contexts/ToastContext';

const BUSINESS_TYPES = ['E-commerce', 'Interior Designer', 'Makeup Artist', 'Travel Agent', 'Other'];

const CreateUser = ({ onNavigateToDirectory }) => {
  const [createForm, setCreateForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ message: 'Created by superadmin', businessType: 'Other' });
  const [createdUser, setCreatedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [createdInquiry, setCreatedInquiry] = useState(null);
  const { showToast } = useToast();

  const handleCreateUserChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleInquiryFormChange = (e) => {
    const { name, value } = e.target;
    setInquiryForm((prev) => ({ ...prev, [name]: value }));
  };

  const validatePhone = (phone) => /^[\d\s+()-]{10,}$/.test((phone || '').replace(/\s/g, ''));

  const validateEmail = (value) => {
    const trimmed = String(value || '').trim().toLowerCase();
    if (!trimmed) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    const { name, phone, email, password } = createForm;
    if (!name?.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    if (!phone?.trim()) {
      showToast('Phone number is required', 'error');
      return;
    }
    if (!validatePhone(phone)) {
      showToast('Please enter a valid phone number', 'error');
      return;
    }
    if (!email?.trim()) {
      showToast('Email is required', 'error');
      return;
    }
    if (!validateEmail(email)) {
      showToast('Please enter a valid email', 'error');
      return;
    }
    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    setLoading(true);
    setCreatedInquiry(null);
    try {
      const res = await registerUser({ name: name.trim(), phone: phone.trim(), email: email.trim().toLowerCase(), password });
      const user = res?.data || res;
      setCreatedUser(user);
      showToast('User created successfully', 'success');
    } catch (err) {
      showToast(err?.message || 'Failed to create user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInquiry = async (e) => {
    e.preventDefault();
    if (!createdUser?._id) return;
    setInquiryLoading(true);
    try {
      const inquiry = await createInquiryForUser(
        createdUser._id,
        inquiryForm.message?.trim() || 'Created by superadmin',
        inquiryForm.businessType || 'Other'
      );
      setCreatedInquiry(inquiry);
      showToast('Inquiry generated successfully', 'success');
    } catch (err) {
      showToast(err?.message || 'Failed to generate inquiry', 'error');
    } finally {
      setInquiryLoading(false);
    }
  };

  const resetFlow = () => {
    setCreatedUser(null);
    setCreatedInquiry(null);
    setCreateForm({ name: '', phone: '', email: '', password: '' });
    setInquiryForm({ message: 'Created by superadmin', businessType: 'Other' });
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <UserPlus className="h-7 w-7 text-blue-600" />
        Create User & Generate Inquiry
      </h1>
      {/* <p className="text-gray-600 mb-6">
        Create a user with name, phone, email and password (like the website signup), then generate an inquiry for that user so you can manage it from Business Directory.
      </p> */}

      {/* Create user form */}
      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">1. Create user</h2>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={createForm.name}
              onChange={handleCreateUserChange}
              placeholder="Full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={createForm.phone}
              onChange={handleCreateUserChange}
              placeholder="Phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={createForm.email}
              onChange={handleCreateUserChange}
              placeholder="e.g. you@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={createForm.password}
                onChange={handleCreateUserChange}
                placeholder="Min 6 characters"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 rounded"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Creating…' : 'Create user'}
          </button>
        </form>
      </section>

      {/* After user created: show user info + generate inquiry */}
      {createdUser && (
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 text-green-700 mb-4">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">User created</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {createdUser.name} • {createdUser.phone}
          </p>

          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            2. Generate inquiry for this user
          </h2>
          <form onSubmit={handleGenerateInquiry} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
              <input
                type="text"
                name="message"
                value={inquiryForm.message}
                onChange={handleInquiryFormChange}
                placeholder="e.g. Created by superadmin"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business type</label>
              <select
                name="businessType"
                value={inquiryForm.businessType}
                onChange={handleInquiryFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={inquiryLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {inquiryLoading ? 'Generating…' : 'Generate inquiry'}
              </button>
              {onNavigateToDirectory && (
                <button
                  type="button"
                  onClick={() => onNavigateToDirectory()}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Go to Business Directory
                </button>
              )}
              <button
                type="button"
                onClick={resetFlow}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Create another user
              </button>
            </div>
          </form>
          {createdInquiry && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              Inquiry created. You can find it in Business Directory and assign it to an admin or generate a card.
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default CreateUser;
