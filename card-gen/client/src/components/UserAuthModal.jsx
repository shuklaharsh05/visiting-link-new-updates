import React, { useState } from 'react';
import { X, Eye, EyeOff, User, Lock, Phone, Building, Mail } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { registerUser, loginUser, googleAuth, setAuthData } from '../api/auth';

const UserAuthModal = ({ isOpen, onClose, onSuccess, cardId }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    email: '',
    password: '',
    businessType: ''
  });

  // Validate phone number (basic validation)
  const validatePhone = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return { isValid: false, error: 'Phone number is required' };
    
    // Remove all non-digit characters except +
    const digitsOnly = trimmed.replace(/[^\d+]/g, '');
    const normalizedPhone = trimmed.startsWith('+') ? `+${digitsOnly.slice(1)}` : digitsOnly;
    
    // Basic phone validation: 7-15 digits
    const phoneRegex = /^\+?\d{7,15}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return { isValid: false, error: 'Please enter a valid phone number (7-15 digits)' };
    }
    
    return { isValid: true, value: normalizedPhone };
  };

  const validateEmail = (value) => {
    const trimmed = String(value || '').trim().toLowerCase();
    if (!trimmed) return { isValid: false, error: 'Email is required' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { isValid: false, error: 'Please enter a valid email' };
    return { isValid: true, value: trimmed };
  };

  const buildSignupPayload = () => {
    const phoneValidation = validatePhone(formData.identifier);
    if (!phoneValidation.isValid) throw new Error(phoneValidation.error);

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) throw new Error(emailValidation.error);

    return {
      name: formData.name,
      password: formData.password,
      phone: phoneValidation.value,
      email: emailValidation.value,
      businessType: formData.businessType || undefined,
    };
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      if (isLogin) {
        // Validate phone for login
        const phoneValidation = validatePhone(formData.identifier);
        if (!phoneValidation.isValid) {
          setError(phoneValidation.error);
          setLoading(false);
          return;
        }
        response = await loginUser(phoneValidation.value, formData.password);
      } else {
        const payload = buildSignupPayload();
        response = await registerUser(payload);
      }

      // Store auth data - the response.data contains the user info and token
      setAuthData(response.data, false);
      
      // Call success callback with user data
      onSuccess(response.data, cardId);
      
      // Close modal
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    
    try {
      const response = await googleAuth(credentialResponse.credential);
      
      // Store auth data - the response.data contains the user info and token
      setAuthData(response.data, false);
      
      // Call success callback with user data
      onSuccess(response.data, cardId);
      
      // Close modal
      onClose();
    } catch (err) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google authentication failed. Please try again.');
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      identifier: '',
      email: '',
      password: '',
      businessType: ''
    });
    setError('');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9998] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isLogin ? 'Login to Save Card' : 'Create Account to Save Card'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  required={!isLogin}
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                name="identifier"
                required
                value={formData.identifier}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  required={!isLogin}
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. you@example.com"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Same email lets you sign in with Google too.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Business type can be re-enabled if needed */}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login & Save Card' : 'Create Account & Save Card')}
          </button>
        </form>

        {/* Google OAuth Section */}
        {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <>
            <div className="px-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
            </div>

            <div className="px-6 pb-4">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text={isLogin ? "signin_with" : "signup_with"}
                  shape="rectangular"
                  logo_alignment="left"
                />
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <p className="text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {isLogin ? 'Create one' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserAuthModal;
