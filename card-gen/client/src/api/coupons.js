import { authenticatedFetch } from "./auth";

// Get all coupons (superadmin)
export async function getCoupons() {
  return authenticatedFetch("/coupons");
}

// Create a new coupon (superadmin)
export async function createCoupon({ code, discountPercent, maxOffAmount }) {
  return authenticatedFetch("/coupons", {
    method: "POST",
    body: JSON.stringify({ code, discountPercent, maxOffAmount }),
  });
}

// Delete coupon (superadmin)
export async function deleteCoupon(id) {
  return authenticatedFetch(`/coupons/${id}`, {
    method: "DELETE",
  });
}

