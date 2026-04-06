import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { apiService } from '../lib/api.js';
import { useUserPlanRazorpay } from '../hooks/useUserPlanRazorpay.js';
import { Calendar, Mail, Phone, MessageSquare, Filter, User, CreditCard, Download, Calendar as CalendarIcon, Eye, X, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Appointments() {
  const { user, refreshUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]); // Store all appointments for client-side filtering
  const [loading, setLoading] = useState(true); // initial page load
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Subscription/plan restrictions removed: appointments available to all users.
  const userPlan = user?.plan || "free";
  const isPro = true;

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

  // Load plan pricing from backend so we always show correct amounts
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await apiService.getPlans();
        if (res.success && Array.isArray(res.data)) {
          setPlans(res.data);
        }
      } catch (err) {
        console.log("Failed to load plans for appointments page:", err);
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

  const SELECTED_CARD_STORAGE_KEY = 'appointments_selected_card_id';

  const getCardLabel = (card) => {
    if (!card) return 'Card';
    const name =
      card.name ||
      card.data?.CompanyName ||
      card.data?.companyName ||
      card.data?.storeName ||
      card.data?.name ||
      '';
    if (name && String(name).trim()) return String(name).trim();
    return card.templateId || card.categoryId || 'Untitled card';
  };

  const fetchAppointments = async (status = '') => {
    if (!user || !selectedCardId) return;

    setAppointmentsLoading(true);
    
    try {
      // Fetch all appointments for user's card
      console.log('🎯 Calling getCardAppointments with:', { 
        cardId: selectedCardId, 
        status
      });
      const response = await apiService.getCardAppointments(selectedCardId, {
        page: 1,
        limit: 1000, // Fetch a large number to get all appointments
        status: status && status.trim() !== '' ? status : undefined
      });
      
      console.log('Appointments API response:', response);
      
      if (response.success && response.data) {
        if (response.data.appointments) {
          // Handle paginated response for card appointments
          const fetchedAppointments = Array.isArray(response.data.appointments) ? response.data.appointments : [];
          setAllAppointments(fetchedAppointments);
          setAppointments(fetchedAppointments);
        } else {
          // Handle non-paginated response
          const fetchedAppointments = Array.isArray(response.data) ? response.data : [];
          setAllAppointments(fetchedAppointments);
          setAppointments(fetchedAppointments);
        }
      } else {
        console.log('Appointments API failed:', response.error);
        setAllAppointments([]);
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAllAppointments([]);
      setAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  // Client-side filtering function
  const applyFilters = (status = '', startDate = '', endDate = '') => {
    console.log('🔍 Applying client-side filters:', { status, startDate, endDate });
    
    let filteredAppointments = [...allAppointments];
    
    // Filter by status
    if (status && status.trim() !== '') {
      filteredAppointments = filteredAppointments.filter(appointment => 
        appointment.status && appointment.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    // Filter by date range
    if (startDate && startDate.trim() !== '') {
      const start = new Date(startDate);
      filteredAppointments = filteredAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.created_at || appointment.createdAt);
        return appointmentDate >= start;
      });
    }
    
    if (endDate && endDate.trim() !== '') {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      filteredAppointments = filteredAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.created_at || appointment.createdAt);
        return appointmentDate <= end;
      });
    }
    
    console.log('🔍 Filtered appointments:', filteredAppointments);
    setAppointments(filteredAppointments);
  };

  // Load cards + restore selected card
  useEffect(() => {
    let cancelled = false;
    const loadCards = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await apiService.getMyCards();
        const list = res.success && Array.isArray(res.data) ? res.data : [];
        if (cancelled) return;
        setCards(list);
        const stored = localStorage.getItem(SELECTED_CARD_STORAGE_KEY) || '';
        const storedOk = stored && list.some((c) => String(c._id) === String(stored));
        const initial = storedOk ? stored : (list[0]?._id || '');
        setSelectedCardId(initial);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadCards();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Fetch appointments when selected card or server-side status filter changes
  useEffect(() => {
    if (!user || !selectedCardId) return;
    localStorage.setItem(SELECTED_CARD_STORAGE_KEY, String(selectedCardId));
    fetchAppointments(filters.status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedCardId, filters.status]);

  // Apply client-side filters when filters change
  useEffect(() => {
    if (allAppointments.length > 0) {
      applyFilters(filters.status, filters.startDate, filters.endDate);
    }
  }, [filters.status, filters.startDate, filters.endDate, allAppointments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handlePlanPurchase = async (planKey) => {
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
  };

  const handleApplyCoupon = async () => {
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
  };

  // Plan gating removed (isPro forced true above). Keeping legacy UI unreachable.
  if (!isPro) {
    return (
      <div className="w-full mx-auto font-poppins px-4 sm:px-6 lg:px-8 mt-6">
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
                Upgrade your account to unlock appointments. Prices are loaded from backend.
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
                      Unlock full appointments access and all features.
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


  const handleStatusFilter = (status) => {
    console.log('📊 Status filter changed:', status);
    setFilters(prev => ({ ...prev, status }));
  };

  const handleDateFilter = (field, value) => {
    console.log('🗓️ Date filter changed:', { field, value });
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      console.log('🗓️ New filters state:', newFilters);
      return newFilters;
    });
  };

  const clearFilters = () => {
    console.log('🧹 Clearing all filters');
    setFilters({ status: '', startDate: '', endDate: '' });
  };


  // Export appointments to Excel using xlsx library
  const exportToExcel = () => {
    if (!appointments || appointments.length === 0) {
      alert('No appointments to export');
      return;
    }

    console.log('📊 Exporting appointments to Excel:', appointments);

    // Prepare data for Excel
    const excelData = appointments.map(appointment => ({
      'Name': appointment.name || '',
      'Email': appointment.email || '',
      'Phone': appointment.phone || '',
      'Status': appointment.status || '',
      'Message': appointment.message || '',
      'Date': new Date(appointment.created_at || appointment.createdAt).toLocaleDateString('en-US')
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 12 }, // Status
      { wch: 40 }, // Message
      { wch: 12 }  // Date
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Appointments');

    // Generate Excel file with proper format
    const fileName = `appointments_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Generate the Excel file as a buffer
    const excelBuffer = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'array' 
    });
    
    // Create blob and download
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('📊 Excel file generated and downloaded:', fileName);
  };

  return (
    <div className="w-full mx-auto font-poppins px-4 sm:px-6 lg:px-8 mt-6">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Appointments</h1>
            <p className="text-slate-600 text-base sm:text-lg">
              Manage your client inquiries and appointment requests
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="min-w-[200px] max-w-[320px] bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={appointmentsLoading || cards.length === 0}
              title="Select card"
            >
              {cards.length === 0 ? (
                <option value="">No cards yet</option>
              ) : (
                cards.map((c) => (
                  <option key={c._id} value={c._id}>
                    {getCardLabel(c)}
                  </option>
                ))
              )}
            </select>
            {appointments.length > 0 && (
              <button
                onClick={exportToExcel}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
              >
                {/* <Download className="w-4 h-4" /> */}
                {/* <span className="hidden sm:inline">Export to Excel</span> */}
                <span>Export</span>
              </button>
            )}
          </div>
        </div>


        {/* Filter Controls */}
        <div className="mt-4 sm:mt-6 bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className='flex-1'>
                <label className="block text-sm font-normal text-slate-700 mb-2">
                  Status Filter
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              
              <div className='flex-1'>
                <label className="block text-sm font-normal text-slate-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleDateFilter('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                />
              </div>
              
              <div className='flex-1'>
                <label className="block text-sm font-normal text-slate-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleDateFilter('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full md:w-auto px-4 py-2 text-sm sm:text-base text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
            
            
            
            <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              {appointmentsLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs sm:text-sm text-blue-700">Loading appointments...</span>
                </div>
              ) : selectedCardId ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900 flex-shrink-0" />
                    <span className="text-xs sm:text-sm lg:text-base font-normal text-black truncate">
                      Showing appointments for:{" "}
                      <span className="font-semibold">
                        {(() => {
                          const c = cards.find((x) => String(x._id) === String(selectedCardId));
                          return c ? getCardLabel(c) : "Selected card";
                        })()}
                      </span>
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    {Array.isArray(appointments) && appointments.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                            Total: {appointments.length}
                          </h3>
                        </div>
                      )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-blue-700">
                    No card found. Create a business card first to view appointments.
                  </span>
                </div>
              )}
            </div>
          </div>
      </div>

      {!Array.isArray(appointments) || appointments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center">
          <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
            No appointments found
          </h3>
          <p className="text-sm sm:text-base text-slate-600">
            {!selectedCardId
              ? 'You need to create a business card first. Go to "My Card" to create one.'
              : 'No appointments have been booked for this card yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white w-full rounded-xl border border-slate-200">
          <div className="overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[320px] sm:min-w-[640px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Name</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Email</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Phone</th>
                  {/* <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Status</th> */}
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Message</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Date</th>
                  <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {Array.isArray(appointments) && appointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-normal text-slate-900">
                      {appointment.name}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-600">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate max-w-[120px] sm:max-w-none">{appointment.email}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-600">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">{appointment.phone}</span>
                      </div>
                    </td>
                    {/* <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          appointment.status === 'pending' || appointment.status === 'Pending'
                            ? 'bg-amber-100 text-amber-700'
                            : appointment.status === 'confirmed' || appointment.status === 'Confirmed'
                            ? 'bg-green-100 text-green-700'
                            : appointment.status === 'cancelled' || appointment.status === 'Cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </td> */}
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-600 max-w-[100px] sm:max-w-xs">
                      {appointment.message ? (
                        <div className="flex items-start gap-1 sm:gap-2">
                          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                          <span className="truncate" title={appointment.message}>
                            {appointment.message.length > 10 
                              ? `${appointment.message.substring(0, 10)}...` 
                              : appointment.message}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-slate-500 whitespace-nowrap">
                      {new Date(appointment.created_at || appointment.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowModal(true);
                        }}
                        className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        title="View full details"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Appointment Details Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto m-2 sm:m-0">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900">Appointment Details</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedAppointment(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
              </button>
            </div>
            
            <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 mb-1 block">Name</label>
                  <div className="flex items-center gap-2 text-slate-900">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base break-words">{selectedAppointment.name || 'N/A'}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 mb-1 block">Email</label>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm break-all">{selectedAppointment.email || 'N/A'}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 mb-1 block">Phone</label>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base">{selectedAppointment.phone || 'N/A'}</span>
                  </div>
                </div>
                
                {/* <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 mb-1 block">Status</label>
                  <span
                    className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedAppointment.status === 'pending' || selectedAppointment.status === 'Pending'
                        ? 'bg-amber-100 text-amber-700'
                        : selectedAppointment.status === 'confirmed' || selectedAppointment.status === 'Confirmed'
                        ? 'bg-green-100 text-green-700'
                        : selectedAppointment.status === 'cancelled' || selectedAppointment.status === 'Cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {selectedAppointment.status 
                      ? selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)
                      : 'N/A'}
                  </span>
                </div> */}
                
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 mb-1 block">Date</label>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">
                      {new Date(selectedAppointment.created_at || selectedAppointment.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
              
              {selectedAppointment.message && (
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 block">Message</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap break-words">
                        {selectedAppointment.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedAppointment(null);
                }}
                className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
