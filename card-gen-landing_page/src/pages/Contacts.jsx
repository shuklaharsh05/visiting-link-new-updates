import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { apiService } from "../lib/api.js";
import { useUserPlanRazorpay } from "../hooks/useUserPlanRazorpay.js";
import * as XLSX from "xlsx";
import {
  User,
  Mail,
  Phone,
  MessageCircle,
  StickyNote,
  CheckCircle,
  AlertCircle,
  Search,
  UserPlus,
  X,
  Pen,
} from "lucide-react";

export default function Contacts() {
  const { user, refreshUser } = useAuth();

  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [noDataExportMessage, setNoDataExportMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);
  // Subscription/plan restrictions removed: contacts available to all users.
  const userPlan = user?.plan || "free";
  const canSaveContacts = true;

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planUpgradeMessage, setPlanUpgradeMessage] = useState("");
  const [planUpgradeError, setPlanUpgradeError] = useState("");
  const [plans, setPlans] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponApplyError, setCouponApplyError] = useState("");
  const [discountedPrices, setDiscountedPrices] = useState({ basic: null, pro: null });

  const {
    initiatePlanPayment,
    loading: planLoading,
    error: planError,
  } = useUserPlanRazorpay();

  // Fetch contacts (only when user is signed in and has Pro access)
  useEffect(() => {
    const fetchContacts = async () => {
      if (!user) return;

      try {
        setContactsLoading(true);
        setContactsError("");
        console.log("Fetching contacts for user:", user._id || user.id);
        const res = await apiService.getContacts(user._id || user.id);
        console.log("Contacts API response:", res);

        if (res.success) {
          if (Array.isArray(res.data)) {
            console.log("Setting contacts (direct array):", res.data);
            setContacts(res.data);
          } else if (res.data && Array.isArray(res.data.contacts)) {
            console.log("Setting contacts (nested):", res.data.contacts);
            setContacts(res.data.contacts);
          } else {
            console.log("No contacts found or invalid format:", res.data);
            setContacts([]);
          }
        } else {
          console.error("Contacts API failed:", res.error);
          setContactsError(res.error || "Unable to load contacts right now.");
          setContacts([]);
        }
      } catch (err) {
        console.error("Error fetching contacts:", err);
        setContactsError("Unable to load contacts right now.");
        setContacts([]);
      } finally {
        setContactsLoading(false);
      }
    };

    fetchContacts();
  }, [user]);

  // Load plan pricing from backend so we always show correct amounts
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await apiService.getPlans();
        if (res.success && Array.isArray(res.data)) {
          setPlans(res.data);
        }
      } catch (err) {
        console.log("Failed to load plans for contacts page:", err);
      }
    };
    loadPlans();
  }, []);

  const basicPlan = plans.find((p) => p.key === "basic");
  const proPlan = plans.find((p) => p.key === "pro");
  const basicAmount = typeof basicPlan?.amount === "number" ? basicPlan.amount : null;
  const proAmount = typeof proPlan?.amount === "number" ? proPlan.amount : null;
  const proPayableAmount =
    userPlan === "basic" && basicAmount != null && proAmount != null && proAmount > basicAmount
      ? proAmount - basicAmount
      : proAmount;

  if (!user) {
    return (
      <div className="w-full mx-auto font-poppins px-4 sm:px-6 lg:px-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-yellow-900 font-semibold mb-1">
              You need to be signed in
            </h2>
            <p className="text-sm text-yellow-800">
              Please sign in to save contacts to your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Plan gating removed: no upgrade prompt.

  async function handlePlanPurchase(planKey) {
    if (!user) return;
    setSelectedPlan(planKey);
    setPlanUpgradeMessage("");
    setPlanUpgradeError("");

    try {
      await initiatePlanPayment({
        plan: planKey,
        couponCode: couponCode || undefined,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone,
        onSuccess: async () => {
          setPlanUpgradeMessage(
            planKey === "basic"
              ? "Basic plan activated. Reloading your access…"
              : "Pro plan activated. Reloading your access…"
          );
          setShowPlanModal(false);
          setSelectedPlan(null);
          try {
            await refreshUser();
          } catch (err) {
            console.log("Error refreshing user after plan upgrade:", err);
          }
        },
        onFailure: (msg) => {
          setPlanUpgradeError(msg || "Payment failed or cancelled. Please try again.");
          setShowPlanModal(false);
          setSelectedPlan(null);
        },
      });
    } catch (err) {
      setPlanUpgradeError(err?.message || "Failed to start payment. Please try again.");
      setShowPlanModal(false);
      setSelectedPlan(null);
    }
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setCouponApplying(true);
    setCouponApplyError("");

    try {
      const [basicRes, proRes] = await Promise.all([
        apiService.previewUserPlanPrice("basic", couponCode.trim()),
        apiService.previewUserPlanPrice("pro", couponCode.trim()),
      ]);

      const next = { basic: null, pro: null };

      if (basicRes.success) {
        const val = basicRes.data?.amount ?? basicRes.data?.data?.amount ?? basicRes.amount;
        if (typeof val === "number") next.basic = val;
      }
      if (proRes.success) {
        const val = proRes.data?.amount ?? proRes.data?.data?.amount ?? proRes.amount;
        if (typeof val === "number") next.pro = val;
      }

      if (!basicRes.success && !proRes.success) {
        setCouponApplyError(
          basicRes.error || proRes.error || "Invalid or expired coupon code."
        );
        setDiscountedPrices({ basic: null, pro: null });
      } else {
        setDiscountedPrices(next);
      }
    } catch (err) {
      setCouponApplyError(
        err?.message || "Failed to apply coupon. Please try again."
      );
      setDiscountedPrices({ basic: null, pro: null });
    } finally {
      setCouponApplying(false);
    }
  }

  function renderUpgradePrompt() {
    return (
      <div className="w-full mx-auto font-poppins px-4 sm:px-6 lg:px-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col gap-3">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-blue-900 font-semibold mb-1">
                Upgrade to Pro to save contacts
              </h2>
              <p className="text-sm text-blue-800">
                The contact library is available only on the Pro plan. Upgrade your plan to start saving and managing contacts here.
              </p>
            </div>
          </div>
          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                setPlanUpgradeError("");
                setPlanUpgradeMessage("");
                setShowPlanModal(true);
              }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={planLoading}
            >
              Upgrade Plan
            </button>
          </div>
          {planUpgradeMessage && (
            <p className="mt-2 text-xs text-green-700">{planUpgradeMessage}</p>
          )}
          {planUpgradeError && (
            <p className="mt-2 text-xs text-red-700">{planUpgradeError}</p>
          )}
          {planError && !planUpgradeError && (
            <p className="mt-2 text-xs text-red-700">{planError}</p>
          )}
        </div>

        {showPlanModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => !planLoading && setShowPlanModal(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
            <h2 className="text-xl sm:text-2xl font-bold text-center text-slate-900">
              Choose Your Plan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 text-center mb-2">
              Upgrade your account to unlock contacts. Prices are loaded from backend.
            </p>
            <div className="mb-3 flex flex-col sm:flex-row gap-2 items-center">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setCouponApplyError("");
                }}
                className="w-full sm:flex-1 border border-slate-300 rounded-full px-3 py-1.5 text-xs sm:text-sm"
                placeholder="Have a coupon code?"
                disabled={planLoading || couponApplying}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={
                  planLoading ||
                  couponApplying ||
                  !couponCode.trim()
                }
                className="px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs sm:text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {couponApplying ? "Applying…" : "Apply"}
              </button>
            </div>
            {couponApplyError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">
                {couponApplyError}
              </div>
            )}
            {planError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs sm:text-sm text-red-700">
                {planError}
              </div>
            )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className={`border rounded-2xl p-4 flex flex-col justify-between ${
                    selectedPlan === "basic"
                      ? "border-blue-600 ring-2 ring-blue-100"
                      : "border-slate-200"
                  }`}
                >
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Individual</h3>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {(() => {
                        const base = basicAmount ?? 0;
                        const final =
                          discountedPrices.basic != null
                            ? discountedPrices.basic
                            : base;
                        if (
                          discountedPrices.basic != null &&
                          discountedPrices.basic < base
                        ) {
                          return (
                            <>
                              <span className="text-sm text-slate-400 line-through mr-1">
                                ₹{base}
                              </span>
                              <span>₹{final}</span>
                            </>
                          );
                        }
                        return <>₹{final}</>;
                      })()}
                    </p>
                    {userPlan === "basic" && (
                      <p className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-[11px] font-medium text-green-700 mt-2">
                        Current plan
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Starter plan with limited features.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={planLoading || userPlan === "basic"}
                    onClick={() => handlePlanPurchase("basic")}
                    className="mt-4 w-full py-2 rounded-full text-sm font-semibold border border-slate-300 text-slate-800 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {userPlan === "basic"
                      ? "Current Plan"
                      : planLoading && selectedPlan === "basic"
                      ? "Processing…"
                      : "Choose Basic"}
                  </button>
                </div>

                <div
                  className={`border rounded-2xl p-4 flex flex-col justify-between ${
                    selectedPlan === "pro"
                      ? "border-blue-600 ring-2 ring-blue-100"
                      : "border-slate-200"
                  }`}
                >
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Business</h3>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {(() => {
                        const base = proPayableAmount ?? proAmount ?? 0;
                        const final =
                          discountedPrices.pro != null
                            ? discountedPrices.pro
                            : base;
                        if (discountedPrices.pro != null && discountedPrices.pro < base) {
                          return (
                            <>
                              <span className="text-sm text-slate-400 line-through mr-1">
                                ₹{base}
                              </span>
                              <span>₹{final}</span>
                            </>
                          );
                        }
                        return <>₹{final}</>;
                      })()}
                    </p>
                    {userPlan === "basic" && basicAmount != null && proAmount != null && proAmount > basicAmount && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        You already paid ₹{basicAmount}. Pay remaining ₹{proPayableAmount} to upgrade to Pro.
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Unlock full contacts access and all features.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={planLoading}
                    onClick={() => handlePlanPurchase("pro")}
                    className="mt-4 w-full py-2 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {planLoading && selectedPlan === "pro" ? "Processing…" : "Choose Pro"}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !planLoading && setShowPlanModal(false)}
                className="w-full text-xs sm:text-sm text-slate-500 mt-2"
                disabled={planLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // If phone number changes and "same as phone" is checked, update WhatsApp
      if (name === "phone" && sameAsPhone) {
        updated.whatsapp = value;
      }
      return updated;
    });
  };

  const handleSameAsPhoneToggle = (e) => {
    const checked = e.target.checked;
    setSameAsPhone(checked);
    if (checked) {
      // Copy phone to WhatsApp
      setFormData((prev) => ({ ...prev, whatsapp: prev.phone }));
    }
  };

  const handleEditContact = (contact) => {
    setEditingContactId(contact._id);
    setFormData({
      name: contact.name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      whatsapp: contact.whatsapp || "",
      notes: contact.notes || "",
    });
    // Check if WhatsApp is same as phone
    setSameAsPhone(
      contact.whatsapp && contact.phone && contact.whatsapp === contact.phone
    );
    setSuccessMessage("");
    setErrorMessage("");
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingContactId(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      whatsapp: "",
      notes: "",
    });
    setSameAsPhone(false);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setErrorMessage("Name is required.");
      return;
    }
    if (trimmedName.length < 2 || trimmedName.length > 120) {
      setErrorMessage("Name must be between 2 and 120 characters.");
      return;
    }

    setLoading(true);

    try {
      // Build payload - only include fields that have values
      const payload = {
        userId: user._id || user.id,
        name: trimmedName,
      };

      // Only add optional fields if they have values
      const trimmedEmail = formData.email.trim();
      if (trimmedEmail) {
        payload.email = trimmedEmail;
      }

      const trimmedPhone = formData.phone.trim();
      if (trimmedPhone) {
        payload.phone = trimmedPhone;
      }

      const trimmedWhatsapp = formData.whatsapp.trim();
      if (trimmedWhatsapp) {
        payload.whatsapp = trimmedWhatsapp;
      }

      const trimmedNotes = formData.notes.trim();
      if (trimmedNotes) {
        payload.notes = trimmedNotes;
      }

      console.log("Saving contact with payload:", payload);

      let response;
      if (editingContactId) {
        // Update existing contact
        response = await apiService.updateContact(editingContactId, payload);
        setSuccessMessage("Contact updated successfully.");
      } else {
        // Create new contact
        response = await apiService.saveContact(payload);
        setSuccessMessage("Contact saved successfully.");
      }

      if (!response.success) {
        throw new Error(response.error || "Failed to save contact");
      }

      // Reset form if creating new contact
      if (!editingContactId) {
        setFormData({
          name: "",
          email: "",
          phone: "",
          whatsapp: "",
          notes: "",
        });
        setSameAsPhone(false);
      }
      // Refresh contacts list after saving
      try {
        const res = await apiService.getContacts(user._id || user.id);
        console.log("Refreshing contacts after save:", res);
        if (res.success) {
          if (Array.isArray(res.data)) {
            setContacts(res.data);
          } else if (res.data && Array.isArray(res.data.contacts)) {
            setContacts(res.data.contacts);
          }
        }
      } catch (err) {
        console.error("Error refreshing contacts:", err);
      }
      // Close modal after successful save
      setTimeout(() => {
        setModalOpen(false);
        setEditingContactId(null);
        setSuccessMessage("");
        if (!editingContactId) {
          setFormData({
            name: "",
            email: "",
            phone: "",
            whatsapp: "",
            notes: "",
          });
          setSameAsPhone(false);
        }
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message || "Failed to save contact.");
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (contact.name || "").toLowerCase();
    const email = (contact.email || "").toLowerCase();
    const phone = (contact.phone || "").toLowerCase();
    const whatsapp = (contact.whatsapp || "").toLowerCase();
    return (
      name.includes(q) ||
      email.includes(q) ||
      phone.includes(q) ||
      whatsapp.includes(q)
    );
  });

  return (
    <div className="w-full mx-auto font-poppins px-4 sm:px-6 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
          <div className="w-full sm:w-auto lg:max-w-72 xl:max-w-[20rem] 2xl:max-w-96">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-1">
              Contacts
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">
              Save and search contacts you meet using your digital business
              card.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto sm:min-w-[300px] lg:min-w-[420px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search contacts by name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 xl:w-[20rem] 2xl:w-96 py-2 border border-slate-300 rounded-full focus:outline-1 focus:outline-black text-xs sm:text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSuccessMessage("");
                setErrorMessage("");
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  whatsapp: "",
                  notes: "",
                });
                setModalOpen(true);
              }}
              className="whitespace-nowrap inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-slate-300 bg-blue-600 text-xs sm:text-sm font-medium text-white hover:bg-white hover:text-blue-600 hover:border-blue-600 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Create Contact
            </button>
            <button
              type="button"
              onClick={() => {
                const dataToExport =
                  filteredContacts.length > 0 || searchQuery
                    ? filteredContacts
                    : contacts;
                if (!dataToExport || dataToExport.length === 0) {
                  setNoDataExportMessage(
                    "No contacts available to export right now."
                  );
                  return;
                }
                const excelData = dataToExport.map((c) => ({
                  Name: c.name || "",
                  Email: c.email || "",
                  Phone: c.phone || "",
                  "WhatsApp Number": c.whatsapp || "",
                  Notes: c.notes || "",
                }));
                const wb = XLSX.utils.book_new();
                const ws = XLSX.utils.json_to_sheet(excelData);
                ws["!cols"] = [
                  { wch: 20 },
                  { wch: 30 },
                  { wch: 18 },
                  { wch: 20 },
                  { wch: 40 },
                ];
                XLSX.utils.book_append_sheet(wb, ws, "Contacts");
                const fileName = `contacts_${
                  new Date().toISOString().split("T")[0]
                }.xlsx`;
                const excelBuffer = XLSX.write(wb, {
                  bookType: "xlsx",
                  type: "array",
                });
                const blob = new Blob([excelBuffer], {
                  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.download = fileName;
                link.style.visibility = "hidden";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border bg-green-600 text-white text-xs sm:text-sm font-medium hover:bg-white hover:text-green-600 hover:border-green-600 transition-colors"
            >
              Export
            </button>
          </div>
        </div>

        {searchQuery && (
          <p className="text-xs sm:text-sm text-slate-600">
            {filteredContacts.length === 0
              ? "No contacts found matching your search."
              : `Found ${filteredContacts.length} contact${
                  filteredContacts.length > 1 ? "s" : ""
                } matching "${searchQuery}"`}
          </p>
        )}
      </div>

      {contactsError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 text-xs sm:text-sm text-red-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
          <span>{contactsError}</span>
        </div>
      )}

      {noDataExportMessage && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
              Nothing to export
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-4">
              {noDataExportMessage}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setNoDataExportMessage("")}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      {contactsLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-sm sm:text-base text-slate-600">
            You haven't saved any contacts yet. Click{" "}
            <span className="font-semibold">Save Contact</span> to add your
            first one.
          </p>
        </div>
      ) : (
        <div className="p-4 sm:p-6 mb-6 space-y-3">
          {filteredContacts.map((contact) => (
            <div
              key={
                contact._id ||
                `${contact.name}-${contact.phone || contact.email}`
              }
              className="border border-slate-200 rounded-xl p-3 sm:p-4 relative group" style={{ boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.1)" }}
            >
              <button
                onClick={() => handleEditContact(contact)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                aria-label="Edit contact"
                title="Edit contact"
              >
                <Pen className="w-4 h-4" />
              </button>
              <div className="min-w-0 flex flex-col lg:flex-row w-full items-center justify-between pr-8">
                <p className="text-base lg:text-xl font-semibold text-slate-900">
                  {contact.name}
                </p>
                <div className="mt-1 lg:mt-0 flex flex-col md:flex-row items-start w-full lg:w-auto gap-1 md:gap-2 text-[12px] lg:text-sm xl:text-base text-slate-600">
                  {contact.email && <p>Email: {contact.email}</p>}
                  {contact.phone && <div className="bg-slate-600 w-px h-6" />}
                  {contact.phone && <p>Phone: {contact.phone}</p>}
                  {contact.whatsapp && <div className="bg-slate-600 w-px h-6" />}
                  {contact.whatsapp && (
                    <p>WhatsApp: {contact.whatsapp}</p>
                  )}
                </div>
              </div>
              {contact.notes && (
                <p className="mt-1 text-xs lg:text-sm xl:text-base text-slate-500 line-clamp-2">
                  Notes: {contact.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                {editingContactId ? "Edit Contact" : "Create Contact"}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-full hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {(successMessage || errorMessage) && (
              <div className="mb-4">
                {successMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex gap-2 text-xs sm:text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-green-800">{successMessage}</p>
                  </div>
                )}
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 text-xs sm:text-sm mt-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800">{errorMessage}</p>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
                    placeholder="Jane Doe"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
                      placeholder="jane@example.com"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
                      placeholder="+91 98765 43210"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base disabled:bg-slate-50 disabled:cursor-not-allowed"
                    placeholder="+91 98765 43210"
                    disabled={loading || sameAsPhone}
                  />
                </div>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsPhone}
                    onChange={handleSameAsPhoneToggle}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                  <span className="text-xs sm:text-sm text-slate-600">
                    Same as phone number
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Notes
                </label>
                <div className="relative">
                  <StickyNote className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base resize-none"
                    placeholder="Where you met, what you discussed, follow-up actions..."
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center px-5 py-2 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? editingContactId
                      ? "Updating..."
                      : "Saving..."
                    : editingContactId
                    ? "Update Contact"
                    : "Save Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
