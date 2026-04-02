import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { GoogleLogin } from "@react-oauth/google";
import {
  CreditCard,
  Phone,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  Mail,
} from "lucide-react";
import {
  classifyIdentifier,
  getIdentifierErrorMessage,
} from "../utils/identifier.js";

export default function Signup() {
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
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
      setError("Google signup failed. Please try again.");
      setLoading(false);
      console.error("Google signup error:", err);
    }
  };

  const handleGoogleError = () => {
    setError("Google signup failed. Please try again.");
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name || !identifier || !email?.trim() || !password) {
      setError("Please fill in all fields (name, phone, email, password)");
      setLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const identifierData = classifyIdentifier(identifier);

    if (!identifierData.isValid || identifierData.type !== "phone") {
      setError("Please enter a valid phone number");
      setLoading(false);
      return;
    }

    const { error, user: authUser } = await signUp(identifierData.value, password, name, email.trim());

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
        <div className="space-y-1 mb-6">
          {/* <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <CreditCard className="w-10 h-10 text-blue-600" />
            <span className="text-3xl font-bold text-slate-800">Visiting Links</span>
          </Link> */}
          <img
            src="/visitingLink-logo.png"
            alt="logo"
            className="h-8 lg:h-10 object-contain mb-2"
          /> 
          <p className="text-slate-600">
          Welcome To Visiting Link
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Manage your profile,<br />
          links & contacts easily.
          </h1>
         
        </div>

        <div className="bg-white">
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                  disabled={loading}
                />
              </div>
            </div>

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
                  className="w-full pl-11 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  placeholder="Enter phone number"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. you@example.com"
                  disabled={loading}
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Same email lets you sign in with Google too.
              </p>
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
                  className="w-full pl-11 pr-12 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all"
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
              <p className="text-xs text-slate-500 mt-1">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 disabled:opacity-50 mt-6 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account..." : "Create Account"}
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
              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="signup_with"
                  shape="square"
                  logo_alignment="center"
                />
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 font-semibold hover:text-blue-700"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
