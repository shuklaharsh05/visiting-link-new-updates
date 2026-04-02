import { authenticatedFetch } from "./auth.js";

// Get all inquiries (supports pagination and raw response)
export const getAllInquiries = async (options = {}) => {
  const { page, limit, status, businessType, resolved, raw = false } = options;

  const params = new URLSearchParams();
  if (page) params.set("page", String(page));
  if (limit) params.set("limit", String(limit));
  if (status) params.set("status", status);
  if (businessType) params.set("businessType", businessType);
  if (typeof resolved === "string") params.set("resolved", resolved);

  const qs = params.toString();
  const url = qs ? `/inquiries?${qs}` : "/inquiries";

  try {
    const response = await authenticatedFetch(url);
    if (raw) {
      return response; // full shape: { success, data, pagination }
    }
    return response.data || response.inquiries || response;
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    throw error;
  }
};

// Get inquiry by ID
export const getInquiryById = async (id) => {
  try {
    const response = await authenticatedFetch(`/inquiries/${id}`);
    return response.data || response;
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    throw error;
  }
};

// Update inquiry
export const updateInquiry = async (id, updateData) => {
  try {
    const response = await authenticatedFetch(`/inquiries/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });
    return response.data || response;
  } catch (error) {
    console.error("Error updating inquiry:", error);
    throw error;
  }
};

// Delete inquiry
export const deleteInquiry = async (id) => {
  try {
    return await authenticatedFetch(`/inquiries/${id}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error deleting inquiry:", error);
    throw error;
  }
};

// Bulk delete inquiries (admin/superadmin; requires password)
export const bulkDeleteInquiries = async (inquiryIds, password) => {
  try {
    const response = await authenticatedFetch("/inquiries/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ inquiryIds, password }),
    });
    return response;
  } catch (error) {
    console.error("Error bulk deleting inquiries:", error);
    throw error;
  }
};

// Get inquiry statistics
export const getInquiryStats = async () => {
  try {
    return await authenticatedFetch("/inquiries/stats");
  } catch (error) {
    console.error("Error fetching inquiry stats:", error);
    throw error;
  }
};

// Pin inquiry (for self; superadmin can pass forAdminId to pin for another admin)
export const pinInquiry = async (inquiryId, forAdminId = null) => {
  const response = await authenticatedFetch(`/inquiries/${inquiryId}/pin`, {
    method: "POST",
    body: JSON.stringify(forAdminId != null ? { forAdminId } : {}),
  });
  return response;
};

// Unpin inquiry (for self; superadmin can pass forAdminId to unpin for another admin)
export const unpinInquiry = async (inquiryId, forAdminId = null) => {
  const response = await authenticatedFetch(`/inquiries/${inquiryId}/unpin`, {
    method: "POST",
    body: JSON.stringify(forAdminId != null ? { forAdminId } : {}),
  });
  return response;
};

// Superadmin: create inquiry for a user (by userId)
export const createInquiryForUser = async (userId, message, businessType) => {
  try {
    const response = await authenticatedFetch(
      "/inquiries/admin/create-for-user",
      {
        method: "POST",
        body: JSON.stringify({ userId, message, businessType }),
      }
    );
    return response.data || response;
  } catch (error) {
    console.error("Error creating inquiry for user:", error);
    throw error;
  }
};
