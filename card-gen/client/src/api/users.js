import { authenticatedFetch } from "./auth.js";

export async function getAllUsers(options = {}) {
  const { limit = 10, page = 1, search = "", raw = false } = options;
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (page) params.set("page", String(page));
  if (search) params.set("search", search);
  const qs = params.toString();
  const url = qs ? `/users?${qs}` : "/users";
  const res = await authenticatedFetch(url);

  if (raw) {
    return res; // full response: { success, data: { users, pagination } }
  }

  if (Array.isArray(res)) return res;
  if (Array.isArray(res.users)) return res.users;
  if (res?.data?.users && Array.isArray(res.data.users)) return res.data.users;
  return res?.data?.users ?? res?.users ?? [];
}

export async function bulkDeleteUsers(userIds, password) {
  const res = await authenticatedFetch("/users/bulk-delete", {
    method: "POST",
    body: JSON.stringify({ userIds, password }),
  });
  return res;
}
