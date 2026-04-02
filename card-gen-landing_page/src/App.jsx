import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import UserLayout from "./components/UserLayout.jsx";
// import DefaultUserRedirect from "./components/DefaultUserRedirect.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Appointments from "./pages/Appointments.jsx";
import MyCard from "./pages/MyCard.jsx";
import SavedCards from "./pages/SavedCards.jsx";
import Inquiry from "./pages/Inquiry.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import PricingClient from "./pages/Pricing.jsx";
import Contacts from "./pages/Contacts.jsx";
import InterestedCandidates from "./pages/InterestedCandidates.jsx";
import "./index.css"; // make sure your CSS for the button is loaded
import PublicCard from "./pages/PublicCard.jsx";
import DetailsForm from "./pages/DetailsForm.jsx";
import Expo from "./pages/expo.jsx";
import TermsAndConditions from "./pages/TermsAndConditions.jsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx";
import RefundPolicy from "./pages/RefundPolicy.jsx";

function FloatingWhatsApp() {
  const location = useLocation();
  const isPublicCardPage = /^\/cards\/[^/]+$/.test(location.pathname);
  if (isPublicCardPage) return null;
  return (
    <a
      href="https://wa.me/919236553585"
      target="_blank"
      rel="noopener noreferrer"
      className="floating-whatsapp"
    >
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
        alt="WhatsApp"
      />
    </a>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/prices" element={<PricingClient />} />
          <Route path="/expo" element={<Expo />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/card/:id" element={<Inquiry />} />
          <Route path="/cards/:id" element={<PublicCard />} />
          <Route path="/details/:detailsId" element={<DetailsForm />} />

          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="my-card" element={<MyCard />} />
            <Route path="saved-cards" element={<SavedCards />} />
            <Route path="contacts" element={<Contacts />} />
            <Route
              path="interested-candidates"
              element={<InterestedCandidates />}
            />
            {/* <Route path="*" element={<DefaultUserRedirect />} /> */}
          </Route>
        </Routes>
        <FloatingWhatsApp />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
