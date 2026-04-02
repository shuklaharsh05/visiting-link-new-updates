import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Admin management API functions
export const adminAPI = {
  // Get all admins
  getAllAdmins: async () => {
    try {
      const response = await api.get('/admins');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get admin by ID
  getAdminById: async (id) => {
    try {
      const response = await api.get(`/admins/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create new admin
  createAdmin: async (adminData) => {
    try {
      const response = await api.post('/admins', adminData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update admin
  updateAdmin: async (id, adminData) => {
    try {
      const response = await api.put(`/admins/${id}`, adminData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete admin
  deleteAdmin: async (id) => {
    try {
      const response = await api.delete(`/admins/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Assign inquiry to admin
  assignInquiry: async (inquiryId, assignedTo) => {
    try {
      const response = await api.put(`/admins/assign/${inquiryId}`, { assignedTo });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get inquiries for specific admin
  getAdminInquiries: async (adminName) => {
    try {
      const response = await api.get(`/admins/inquiries/${adminName}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
