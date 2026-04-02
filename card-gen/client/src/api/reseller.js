import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const resellerAPI = {
  listUsers: async ({ page = 1, limit = 20, search = "" } = {}) => {
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      const res = await api.get(`/admin/users?${params.toString()}`);
      return res.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },
  createUser: async ({ name, email, phone, password, businessType } = {}) => {
    try {
      const payload = {
        name: typeof name === "string" ? name.trim() : name,
        phone: typeof phone === "string" ? phone.trim() : phone,
        password,
      };

      const cleanedEmail = typeof email === "string" ? email.trim() : "";
      if (cleanedEmail) payload.email = cleanedEmail;

      const cleanedBusinessType = typeof businessType === "string" ? businessType.trim() : "";
      if (cleanedBusinessType) payload.businessType = cleanedBusinessType;

      const res = await api.post("/admin/users", payload);
      return res.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },
  getStats: async () => {
    try {
      const res = await api.get("/admin/stats");
      return res.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },
  getDashboardStats: async () => {
    try {
      const res = await api.get("/admin/dashboard/stats");
      return res.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },
  getCardsBreakdown: async () => {
    try {
      const res = await api.get("/admin/dashboard/cards-breakdown");
      return res.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },
  getUsersBreakdown: async () => {
    try {
      const res = await api.get("/admin/dashboard/users-breakdown");
      return res.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },
  getRevenueBreakdown: async () => {
    try {
      const res = await api.get("/admin/dashboard/revenue-breakdown");
      return res.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },
  createCardForUser: async (userId, payload) => {
    try {
      const res = await api.post(`/admin/users/${userId}/cards`, payload);
      return res.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },
  listCardsForUser: async (userId) => {
    try {
      const res = await api.get(`/admin/users/${userId}/cards`);
      return res.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },
  deleteCardForUser: async (userId, cardId) => {
    try {
      const res = await api.delete(`/admin/users/${userId}/cards/${cardId}`);
      return res.data;
    } catch (error) {
      throw error.response?.data || { error: error.message };
    }
  },
};

