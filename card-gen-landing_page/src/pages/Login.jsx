import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { GoogleLogin } from "@react-oauth/google";
import { CreditCard, Phone, Lock, AlertCircle, Eye, EyeOff, ArrowLeftCircle, ChevronLeft } from "lucide-react";
import {
  classifyIdentifier,
  getIdentifierErrorMessage,
} from "../utils/identifier.js";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);

    try {
      const { error, user: authUser } = await signInWithGoogle(credentialResponse.credential);

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        const hasInquiries = authUser?.inquiries && Array.isArray(authUser.inquiries) && authUser.inquiries.length > 0;
        navigate(hasInquiries ? "/dashboard" : "/my-card");
      }
    } catch (err) {
      setError("Google login failed. Please try again.");
      setLoading(false);
      console.error("Google login error:", err);
    }
  };

  const handleGoogleError = () => {
    setError("Google login failed. Please try again.");
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    const identifierData = classifyIdentifier(trimmedIdentifier);

    if (!identifierData.isValid || identifierData.type !== "phone") {
      setError("Please enter a valid phone number");
      setLoading(false);
      return;
    }

    const { error, user: authUser } = await signIn(identifierData.value, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      const hasInquiries = authUser?.inquiries && Array.isArray(authUser.inquiries) && authUser.inquiries.length > 0;
      navigate(hasInquiries ? "/dashboard" : "/my-card");
    }
  };

  return (
    <div className="min-h-screen bg-[url('/form-bg-3.png')] lg:bg-[url('/form-bg-3.png')] xl:bg-[url('/form-bg-4.png')] bg-cover bg-right-top lg:bg-center relative">
      <div>
        <ChevronLeft
          className="w-6 h-6 lg:w-8 lg:h-8 text-white hover:text-slate-400 transition-all duration-300 focus:outline-none absolute top-4 left-4"
          onClick={() => navigate("/")}
        />
      </div>
      <div className="w-[90%] lg:w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 py-4 px-6 lg:py-8 lg:px-12 absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 lg:left-auto -right-36 xl:-right-16 2xl:right-8">
        <div className="mb-6 space-y-2">
          <img
            src="/visitingLink-logo.png"
            alt="logo"
            className="h-8 lg:h-10 object-contain mb-2"
          />
          <p className="text-black/60">Welcome To visiting Link </p>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Manage your profile,<br />
          links & contacts easily.
          </h1>
        </div>

        <div className="">
          <form onSubmit={handleSubmit} className="space-y-2">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="identifier"
                  type="tel"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all shadow-lg"
                  placeholder="Enter phone number"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all shadow-lg"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 disabled:opacity-50 mt-6 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Or continue with</span>
              </div>
            </div>
          </div>

          {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
            <div className="mt-6">
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  logo_alignment="left"
                />
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-600 font-semibold hover:text-blue-700"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
