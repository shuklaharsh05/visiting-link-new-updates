import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

/**
 * Redirects to /my-card if user has no inquiries, otherwise to /dashboard.
 * Used as the default route for protected area (catch-all).
 */
export default function DefaultUserRedirect() {
  const { user } = useAuth();
  const hasInquiries = user?.inquiries && Array.isArray(user.inquiries) && user.inquiries.length > 0;
  return <Navigate to={hasInquiries ? "/dashboard" : "/my-card"} replace />;
}
