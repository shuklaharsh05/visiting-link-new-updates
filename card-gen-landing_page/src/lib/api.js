// API Configuration
// For local testing, use localhost. For production, use teamserver.cloud
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// const API_BASE_URL = 'https://teamserver.cloud/api';

// API Service Class
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method for making HTTP requests
  async request(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const token = localStorage.getItem("auth_token");

      const config = {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      };

      console.log("API Request:", { url, config, body: options.body });

      const response = await fetch(url, config);

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text.substring(0, 200));
        return {
          success: false,
          error: `Server returned non-JSON response (${response.status}). The endpoint may not exist or there's a server error.`,
          details: { status: response.status, text: text.substring(0, 200) },
        };
      }

      const data = await response.json();

      console.log("API Response:", { status: response.status, data });

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `HTTP ${response.status}`,
          details: data, // Include full error details
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.log("API Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // Auth code exchange (short-lived code -> JWT/session)
  async exchangeAuthCode(code) {
    const response = await this.request("/auth/exchange-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        origin: window.location.origin,
      }),
    });

    // If exchange is successful, store the token (support both top-level and wrapped shapes)
    const token = response?.token || response?.data?.token;
    if (response?.success && token) {
      localStorage.setItem("auth_token", token);
    }

    return response;
  }

  // Authentication APIs
  async signup({ name, email, password, phone }) {
    const payload = {
      name,
      email,
      password,
      ...(phone ? { phone } : {}),
    };

    const response = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // If signup is successful, store the token
    if (response.success && response.data && response.data.token) {
      localStorage.setItem("auth_token", response.data.token);
    }

    return response;
  }

  async login({ email, password, phone }) {
    const payload = {
      email,
      password,
      ...(phone ? { phone } : {}),
    };

    const response = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // If login is successful, store the token
    if (response.success && response.data && response.data.token) {
      localStorage.setItem("auth_token", response.data.token);
    }

    return response;
  }

  async googleAuth(idToken) {
    const response = await this.request("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });

    // If Google auth is successful, store the token
    if (response.success && response.data && response.data.token) {
      localStorage.setItem("auth_token", response.data.token);
    }

    return response;
  }

  async logout() {
    localStorage.removeItem("auth_token");
    return { success: true, data: null };
  }

  async getCurrentUser() {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      return { success: true, data: null };
    }

    const response = await this.request("/auth/profile");
    console.log("getCurrentUser response:", response);
    return response;
  }

  async linkCredentials({ phone, password }) {
    const response = await this.request("/auth/link-credentials", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    });
    if (response.success && response.data?.token) {
      localStorage.setItem("auth_token", response.data.token);
    }
    return response;
  }

  // Get user data by ID
  async getUserById(userId) {
    return this.request(`/users/${userId}`);
  }

  // Get user's saved cards directly
  async getUserSavedCards(userId) {
    return this.request(`/users/${userId}/saved-cards`);
  }

  // Delete a saved card
  async deleteSavedCard(userId, cardId) {
    return this.request(`/users/${userId}/saved-cards/${cardId}`, {
      method: "DELETE",
    });
  }

  // Get user's cards (for card selection in appointments)
  async getUserCards(userId) {
    return this.request(`/users/${userId}/cards`);
  }

  // Get user's cards with full card data (alternative method)
  async getUserCardsWithData(userId) {
    try {
      // Get user data first
      const userResponse = await this.getUserById(userId);
      if (!userResponse.success || !userResponse.data) {
        return { success: false, error: "User not found" };
      }

      const userData = userResponse.data;
      const cardsWithData = [];

      if (userData.inquiries && Array.isArray(userData.inquiries)) {
        for (const inquiryRef of userData.inquiries) {
          let inquiry;

          if (typeof inquiryRef === "string") {
            const inquiryResponse = await this.getInquiryById(inquiryRef);
            if (inquiryResponse.success && inquiryResponse.data) {
              inquiry = inquiryResponse.data;
            }
          } else {
            inquiry = inquiryRef;
          }

          if (inquiry && inquiry.cardGenerated === true && inquiry.cardId) {
            const cardResponse = await this.getCardById(inquiry.cardId);
            if (cardResponse.success && cardResponse.data) {
              const cardData = cardResponse.data;
              cardsWithData.push({
                id: inquiry.cardId,
                name: cardData.name || "Business Card",
                businessType:
                  cardData.business_type || cardData.businessType || "Business",
                email: cardData.email,
                createdAt: inquiry.createdAt || inquiry.created_at,
                inquiryId: inquiry._id,
                cardData: cardData,
              });
            }
          }
        }
      }

      return {
        success: true,
        data: cardsWithData,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to fetch user cards",
      };
    }
  }

  // Public Inquiry API
  async submitInquiry(inquiryData) {
    const requestData = {
      name: inquiryData.name,
      email: inquiryData.email,
      phone: inquiryData.phone,
      message: inquiryData.message || "",
      businessType: inquiryData.businessType || "",
    };
    console.log("Submitting inquiry with data:", requestData);
    return this.request("/inquiries", {
      method: "POST",
      body: JSON.stringify(requestData),
    });
  }

  // Details form (public, no auth) - shareable link per card
  async getDetailsByToken(token) {
    const response = await this.request(`/details/by-token/${token}`);
    return response;
  }

  async submitDetailsByToken(token, data) {
    const response = await this.request(`/details/submit-by-token/${token}`, {
      method: "POST",
      body: JSON.stringify({ data }),
    });
    return response;
  }

  // Expo (public) - form submissions and link clicks
  async submitExpoSubmission({ name, phone }) {
    return this.request("/expo/submissions", {
      method: "POST",
      body: JSON.stringify({ name, phone }),
    });
  }

  async recordExpoBookMyShowClick() {
    return this.request("/expo/clicks/bookmyshow", { method: "POST" });
  }

  async recordExpoRazorpayClick() {
    return this.request("/expo/clicks/razorpay", { method: "POST" });
  }

  // Public Card Viewing API
  async getCardById(cardId) {
    console.log("getCardById - Fetching card with ID:", cardId);
    console.log("getCardById - Calling endpoint: /api/cards/" + cardId);
    return this.request(`/cards/${cardId}`);
  }

  // Get user inquiries
  async getUserInquiries(userId) {
    return this.request(`/inquiries/user/${userId}`);
  }

  // Get specific inquiry by ID
  async getInquiryById(inquiryId) {
    return this.request(`/inquiries/${inquiryId}`);
  }

  // Business Card Management APIs (for authenticated users)
  async createCard(cardPayload) {
    console.log("Creating card with payload:", cardPayload);
    return this.request("/cards", {
      method: "POST",
      body: JSON.stringify(cardPayload),
    });
  }

  async getMyCards() {
    return this.request("/cards/my");
  }

  /** VCF download leads (visitors who submitted name/phone before downloading) */
  async getMyVcfLeads() {
    return this.request("/cards/vcf-leads/my");
  }

  async deleteInquiry(inquiryId) {
    return this.request(`/inquiries/${inquiryId}`, {
      method: "DELETE",
    });
  }

  // Note: Removed getCategoryId method as we're sending simple form data

  async updateCard(cardId, cardData) {
    return this.request(`/cards/${cardId}`, {
      method: "PUT",
      body: JSON.stringify(cardData),
    });
  }

  async deleteCard(cardId) {
    return this.request(`/cards/${cardId}`, {
      method: "DELETE",
    });
  }

  // Appointments/Inquiries Management APIs (for authenticated users)
  async getAppointments(userId) {
    // Try different possible endpoints
    const endpoints = [
      `/appointments/user/${userId}`,
      `/appointments/${userId}`,
      `/users/${userId}/appointments`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.request(endpoint);
        if (response.success && response.data) {
          // console.log(`Found appointments at endpoint: ${endpoint}`);
          return {
            ...response,
            data: Array.isArray(response.data) ? response.data : [],
          };
        }
      } catch (error) {
        console.log(`Endpoint ${endpoint} failed:`, error);
      }
    }

    // If all endpoints fail, return empty array
    return {
      success: true,
      data: [],
      message: "No appointments found",
    };
  }

  // Get appointments for a specific card with pagination and filtering
  async getCardAppointments(cardId, options = {}) {
    console.log("🚀 getCardAppointments called with:", { cardId, options });

    const { page = 1, limit = 10, status } = options;

    // Build query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) {
      queryParams.append("status", status);
    }

    const endpoint = `/appointments/card/${cardId}?${queryParams.toString()}`;

    console.log("📡 Fetching card appointments:", {
      cardId,
      options,
      endpoint,
      queryParams: queryParams.toString(),
    });

    try {
      const response = await this.request(endpoint);
      console.log("✅ getCardAppointments response:", response);
      return response;
    } catch (error) {
      console.error("❌ getCardAppointments error:", error);
      throw error;
    }
  }

  async updateAppointmentStatus(appointmentId, status) {
    return this.request(`/appointments/${appointmentId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async deleteAppointment(appointmentId) {
    return this.request(`/appointments/${appointmentId}`, {
      method: "DELETE",
    });
  }

  // Review funnel (ratings + feedback)
  async getReviewFunnelStats(cardId) {
    return this.request(`/review-funnel/${cardId}/stats`);
  }

  async getReviewFeedbacks(cardId, { limit = 25 } = {}) {
    const queryParams = new URLSearchParams({ limit: String(limit) });
    return this.request(`/review-funnel/${cardId}/feedbacks?${queryParams.toString()}`);
  }

  // Payment APIs
  async createPaymentOrder(inquiryId, amount) {
    return this.request("/payment/create-order", {
      method: "POST",
      body: JSON.stringify({ inquiryId, amount }),
    });
  }

  async verifyPayment({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  }) {
    return this.request("/payment/verify", {
      method: "POST",
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      }),
    });
  }

  // User plan payments (basic/pro) ---------------------------------------
  async createUserPlanOrder(plan, couponCode) {
    return this.request("/payment/user-plan/create-order", {
      method: "POST",
      body: JSON.stringify({ plan, couponCode }),
    });
  }

  async verifyUserPlanPayment({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  }) {
    return this.request("/payment/user-plan/verify", {
      method: "POST",
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      }),
    });
  }

  async previewUserPlanPrice(plan, couponCode) {
    return this.request("/payment/user-plan/preview", {
      method: "POST",
      body: JSON.stringify({ plan, couponCode }),
    });
  }

  // Template purchase payments ------------------------------------------
  async createTemplateOrder({ categoryId, templateId }) {
    return this.request("/payment/template/create-order", {
      method: "POST",
      body: JSON.stringify({ categoryId, templateId }),
    });
  }

  async verifyTemplatePayment({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  }) {
    return this.request("/payment/template/verify", {
      method: "POST",
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      }),
    });
  }

  // Plans ---------------------------------------------------------------
  async getPlans() {
    return this.request("/plans");
  }

  // Categories & templates (public) --------------------------------------
  async getCategories() {
    const res = await this.request("/categories");
    if (res.success && res.data) {
      const list = Array.isArray(res.data) ? res.data : res.data?.data;
      return { success: true, data: list || [] };
    }
    return res;
  }

  async getTemplatesByCategory(categoryId) {
    return this.request(`/categories/${encodeURIComponent(categoryId)}/templates`);
  }

  async getTemplate(categoryId, templateId) {
    return this.request(
      `/categories/${encodeURIComponent(categoryId)}/templates/${encodeURIComponent(templateId)}`
    );
  }

  // Media management (type + folder structure, like admin) ---------------
  async uploadMedia(file, { type = "image", customFolder = "", replacePublicId = "" } = {}) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    if (customFolder) formData.append("customFolder", customFolder);
    if (replacePublicId) formData.append("replacePublicId", replacePublicId);
    const token = localStorage.getItem("auth_token");
    const url = `${this.baseURL}/media/upload`;
    const res = await fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || data.details || `HTTP ${res.status}` };
    }
    return { success: true, media: data.media, data: data.media };
  }

  async uploadMultipleMedia(files, { type = "image", customFolder = "" } = {}) {
    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("type", type);
    if (customFolder) formData.append("customFolder", customFolder);
    const token = localStorage.getItem("auth_token");
    const url = `${this.baseURL}/media/upload-multiple`;
    const res = await fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || data.details || `HTTP ${res.status}` };
    }
    return { success: true, results: data.results, errors: data.errors };
  }

  async listMedia({ type, q, folder } = {}) {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (q) params.set("q", q);
    if (folder) params.set("folder", folder);
    const res = await this.request(`/media?${params.toString()}`);
    if (res.success && res.data) {
      return {
        success: true,
        items: res.data.items ?? res.data.data ?? [],
        folders: res.data.folders ?? [],
      };
    }
    return { ...res, items: [], folders: [] };
  }

  async deleteMedia(id) {
    return this.request(`/media/${id}`, { method: "DELETE" });
  }

  async deleteMultipleMedia(ids) {
    return this.request("/media/delete-multiple", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  }

  async renameFolder(oldFolder, newFolder) {
    return this.request("/media/rename-folder", {
      method: "POST",
      body: JSON.stringify({ oldFolder, newFolder }),
    });
  }

  // Contacts API
  async getContacts(userId) {
    // Try different possible endpoints
    const endpoints = [
      `/contacts/user/${userId}`,
      `/contacts/${userId}`,
      `/contacts?userId=${encodeURIComponent(userId)}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.request(endpoint);
        if (response.success && response.data) {
          // Handle different response formats
          if (Array.isArray(response.data)) {
            return response;
          } else if (Array.isArray(response.data.contacts)) {
            return {
              ...response,
              data: response.data.contacts,
            };
          } else if (response.data.data && Array.isArray(response.data.data)) {
            return {
              ...response,
              data: response.data.data,
            };
          }
        }
      } catch (error) {
        console.log(`Endpoint ${endpoint} failed:`, error);
      }
    }

    // If all endpoints fail, return empty array
    return {
      success: true,
      data: [],
      message: "No contacts found",
    };
  }

  // Contacts API
  async saveContact(contactData) {
    // contactData should include: userId, name, and optional email, phone, whatsapp, notes
    console.log("saveContact - Sending payload:", contactData);
    const response = await this.request("/contacts", {
      method: "POST",
      body: JSON.stringify(contactData),
    });
    console.log("saveContact - API response:", response);
    return response;
  }

  // Update contact
  async updateContact(contactId, contactData) {
    // contactData should include: name, and optional email, phone, whatsapp, notes
    console.log("updateContact - Sending payload:", { contactId, contactData });
    const response = await this.request(`/contacts/${contactId}`, {
      method: "PUT",
      body: JSON.stringify(contactData),
    });
    console.log("updateContact - API response:", response);
    return response;
  }

  // Dashboard stats

  // Additional helper methods for user profile data
  getUserId() {
    const token = localStorage.getItem("auth_token");
    if (!token) return null;

    try {
      // Decode JWT token to get user ID (basic implementation)
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId || payload.sub || payload._id;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  isAuthenticated() {
    const token = localStorage.getItem("auth_token");
    if (!token) return false;

    try {
      // Check if token is expired
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Add test functions to window for easy console testing
if (typeof window !== "undefined") {
  window.testCardAppointments = async (cardId = "test123", options = {}) => {
    console.log("🧪 Testing getCardAppointments...");
    try {
      const result = await apiService.getCardAppointments(cardId, options);
      console.log("🧪 Test result:", result);
      return result;
    } catch (error) {
      console.error("🧪 Test error:", error);
      return error;
    }
  };

  window.testMyAppointments = async (userId = "68e119bf1055a2e0c74bc4a9") => {
    console.log("🧪 Testing getAppointments (My Appointments)...");
    try {
      const result = await apiService.getAppointments(userId);
      console.log("🧪 Test result:", result);
      return result;
    } catch (error) {
      console.error("🧪 Test error:", error);
      return error;
    }
  };

  window.testUserCards = async (userId = "68e119bf1055a2e0c74bc4a9") => {
    console.log("🧪 Testing getUserCardsWithData...");
    try {
      const result = await apiService.getUserCardsWithData(userId);
      console.log("🧪 Test result:", result);
      return result;
    } catch (error) {
      console.error("🧪 Test error:", error);
      return error;
    }
  };

  window.testDateFilter = async (
    cardId = "test123",
    startDate = "2023-12-01",
    endDate = "2023-12-31"
  ) => {
    console.log("🧪 Testing date filtering...");
    try {
      const result = await apiService.getCardAppointments(cardId, {
        page: 1,
        limit: 10,
        startDate,
        endDate,
      });
      console.log("🧪 Date filter test result:", result);
      return result;
    } catch (error) {
      console.error("🧪 Date filter test error:", error);
      return error;
    }
  };
}

// Export individual functions for convenience
export const {
  signup,
  login,
  logout,
  getCurrentUser,
  linkCredentials,
  createCard,
  getCard,
  updateCard,
  deleteCard,
  getCardById,
  submitInquiry,
  getAppointments,
  getCardAppointments,
  updateAppointmentStatus,
  deleteAppointment,
  createPaymentOrder,
  verifyPayment,
  getContacts,
  saveContact,
} = apiService;
