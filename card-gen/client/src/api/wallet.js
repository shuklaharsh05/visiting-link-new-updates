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

export const walletAPI = {
  getMyWallet: async () => {
    const res = await api.get("/wallet");
    return res.data;
  },
  createRechargeOrder: async (amount) => {
    const res = await api.post("/wallet/recharge/create-order", { amount });
    return res.data;
  },
  verifyRecharge: async (payload) => {
    const res = await api.post("/wallet/recharge/verify", payload);
    return res.data;
  },
};

