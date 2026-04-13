import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit3,
  CheckCircle,
  Clock,
  DollarSign,
  AlertCircle,
  RefreshCw,
  EyeIcon,
  CheckSquare,
  Trash2,
  X,
  Pin,
} from "lucide-react";
import {
  getAllInquiries,
  getInquiryById,
  bulkDeleteInquiries,
  pinInquiry,
  unpinInquiry,
} from "../api/inquiries";
import { updatePaymentStatus } from "../api/cards";
import { getCategories } from "../api/categories";
import { adminAPI } from "../api/admins";
import CardGenerator from "./CardGenerator";
import CardPreviewModal from "./CardPreviewModal";
import { useToast } from "../contexts/ToastContext";

const ASSIGN_CATEGORY_ORDER = ["in-house", "corporate", "individual"];
const ASSIGN_CATEGORY_HEADINGS = {
  "in-house": "In-House Admins",
  corporate: "Corporate Admins",
  individual: "Individual Admins",
};

function normalizeAssignAdminType(raw) {
  const t = String(raw || "individual").toLowerCase();
  if (t === "in-house" || t === "inhouse") return "in-house";
  if (t === "corporate") return "corporate";
  return "individual";
}

const BusinessDirectory = ({ onEditCard }) => {
  const [inquiries, setInquiries] = useState([]);
  const [filteredInquiries, setFilteredInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [showCardGenerator, setShowCardGenerator] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewInquiry, setPreviewInquiry] = useState(null);
  const [categories, setCategories] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [pinMenuInquiryId, setPinMenuInquiryId] = useState(null);
  const selectAllCheckboxRef = useRef(null);
  const loadMoreRef = useRef(null);
  const pinMenuRef = useRef(null);
  const { success: showSuccess, error: showError } = useToast();

  const [assignModalInquiry, setAssignModalInquiry] = useState(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignCategoryFilter, setAssignCategoryFilter] = useState("all");

  const authUser = JSON.parse(localStorage.getItem("auth") || "{}").user || {};
  const isSuperadmin = authUser.role === "superadmin";

  useEffect(() => {
    const el = selectAllCheckboxRef.current;
    if (!el) return;
    el.indeterminate = selectedIds.length > 0 && selectedIds.length < filteredInquiries.length;
  }, [selectedIds.length, filteredInquiries.length]);

  const categoryOptions = [
    { value: "business", label: "Business" },
    { value: "doctor", label: "Doctor" },
    { value: "lawyer", label: "Lawyer" },
    { value: "artist", label: "Artist" },
    { value: "makeup-artist", label: "Makeup Artist" },
    { value: "interior-designer", label: "Interior Designer" },
    { value: "travel-agent", label: "Travel Agent" },
    { value: "ecommerce", label: "E-commerce" },
    { value: "link-pro", label: "Link Pro" },
  ];

  // Mapping between business type display names and category IDs
  const businessTypeToCategoryId = {
    Business: "business",
    Doctor: "doctor",
    Lawyer: "lawyer",
    Artist: "artist",
    "Makeup Artist": "makeup-artist",
    "makeup-artist": "makeup-artist", // Handle both formats
    "Interior Designer": "interior-designer",
    "interior-designer": "interior-designer", // Handle both formats
    "Travel Agent": "travel-agent",
    "travel-agent": "travel-agent", // Handle both formats
    "E-commerce": "ecommerce",
    ecommerce: "ecommerce", // Handle both formats
    "Link Pro": "link-pro",
    "link-pro": "link-pro", // Handle both formats
    Other: "business",
    other: "business",
  };

  useEffect(() => {
    resetAndFetchInquiries();
    fetchCategories();
    fetchAdmins();
  }, []);

  useEffect(() => {
    filterInquiries();
  }, [inquiries, searchTerm, startDate, endDate, statusFilter, paymentFilter]);

  // Close pin dropdown on outside click; defer listener so the opening click doesn't close it
  useEffect(() => {
    if (!pinMenuInquiryId) return;
    const onDocClick = (e) => {
      if (pinMenuRef.current && !pinMenuRef.current.contains(e.target)) {
        setPinMenuInquiryId(null);
      }
    };
    const t = setTimeout(() => document.addEventListener("click", onDocClick), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", onDocClick);
    };
  }, [pinMenuInquiryId]);

  const loadInquiriesPage = async (pageToLoad, initial = false) => {
    try {
      if (initial) {
        setLoading(true);
      }
      const res = await getAllInquiries({
        page: pageToLoad,
        limit: 20,
        raw: true,
      });
      const items = Array.isArray(res.data)
        ? res.data
        : res.data?.inquiries || res.data || [];

      setInquiries((prev) =>
        pageToLoad === 1 ? items : [...prev, ...items]
      );

      const pagination = res.pagination;
      if (!pagination || !pagination.hasNext) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setPage(pagination.currentPage + 1);
      }
    } catch (err) {
      setError("Failed to load inquiries");
      showError("Failed to load inquiries");
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const resetAndFetchInquiries = async () => {
    setInquiries([]);
    setPage(1);
    setHasMore(true);
    await loadInquiriesPage(1, true);
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      const categoriesData = response.data || response;
      setCategories(categoriesData);
    } catch (err) {
      // console.error('Error fetching categories:', err);
      showError("Failed to load categories");
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await adminAPI.getAllAdmins();
      setAdmins(response);
    } catch (err) {
      // console.error('Error fetching admins:', err);
      // Don't show error for admins as it's optional
    }
  };

  const handleAssignInquiry = async (inquiryId, assignedTo) => {
    try {
      await adminAPI.assignInquiry(inquiryId, assignedTo);
      showSuccess("Inquiry assigned successfully");
      resetAndFetchInquiries();
      return true;
    } catch (err) {
      showError("Failed to assign inquiry");
      return false;
    }
  };

  const assignableAdmins = useMemo(
    () => admins.filter((a) => a.role === "admin" && a.isActive !== false),
    [admins]
  );

  const assignModalFiltered = useMemo(() => {
    const q = assignSearch.trim().toLowerCase();
    return assignableAdmins.filter((a) => {
      if (q && !String(a.name || "").toLowerCase().includes(q)) return false;
      if (assignCategoryFilter === "all") return true;
      return normalizeAssignAdminType(a.type) === assignCategoryFilter;
    });
  }, [assignableAdmins, assignSearch, assignCategoryFilter]);

  const assignModalGrouped = useMemo(() => {
    const map = { "in-house": [], corporate: [], individual: [] };
    for (const a of assignModalFiltered) {
      const k = normalizeAssignAdminType(a.type);
      if (map[k]) map[k].push(a);
      else map.individual.push(a);
    }
    for (const k of ASSIGN_CATEGORY_ORDER) {
      map[k].sort((x, y) => String(x.name).localeCompare(String(y.name)));
    }
    return map;
  }, [assignModalFiltered]);

  const closeAssignModal = () => {
    setAssignModalInquiry(null);
    setAssignSearch("");
    setAssignCategoryFilter("all");
  };

  const confirmAssignAdmin = async (adminName) => {
    if (!assignModalInquiry) return;
    const ok = await handleAssignInquiry(assignModalInquiry._id, adminName);
    if (ok) closeAssignModal();
  };

  const confirmUnassign = async () => {
    if (!assignModalInquiry) return;
    const ok = await handleAssignInquiry(assignModalInquiry._id, "");
    if (ok) closeAssignModal();
  };

  // Infinite scroll: load next page when sentinel becomes visible
  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !loading) {
            loadInquiriesPage(page, false);
          }
        });
      },
      { root: null, rootMargin: "0px", threshold: 1.0 }
    );
    const node = loadMoreRef.current;
    if (node) observer.observe(node);
    return () => {
      if (node) observer.unobserve(node);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, loading]);

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInquiries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInquiries.map((i) => i._id));
    }
  };

  const toggleSelectOne = (inquiryId) => {
    setSelectedIds((prev) =>
      prev.includes(inquiryId)
        ? prev.filter((id) => id !== inquiryId)
        : [...prev, inquiryId]
    );
  };

  const openDeleteModal = () => {
    setDeletePassword("");
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeletePassword("");
    setDeleteError("");
  };

  const handleConfirmBulkDelete = async () => {
    if (!deletePassword.trim()) {
      setDeleteError("Please enter your password");
      return;
    }
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await bulkDeleteInquiries(selectedIds, deletePassword);
      showSuccess(`${selectedIds.length} inquiry(ies) deleted`);
      closeDeleteModal();
      setSelectionMode(false);
      setSelectedIds([]);
      resetAndFetchInquiries();
    } catch (err) {
      setDeleteError(err?.message || "Failed to delete. Check your password.");
      showError(err?.message || "Failed to delete inquiries");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Toast functions are now available from context

  const filterInquiries = () => {
    let filtered = inquiries;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (inquiry) =>
          inquiry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inquiry.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (startDate || endDate) {
      filtered = filtered.filter((inquiry) => {
        if (!inquiry.createdAt) return false;

        const inquiryDate = new Date(inquiry.createdAt);
        inquiryDate.setHours(0, 0, 0, 0); // Reset time to start of day

        if (startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // End of day
          return inquiryDate >= start && inquiryDate <= end;
        } else if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          return inquiryDate >= start;
        } else if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          return inquiryDate <= end;
        }
        return true;
      });
    }

    // Status filter
    if (statusFilter) {
      if (statusFilter === "generated") {
        filtered = filtered.filter((inquiry) => inquiry.cardId);
      } else if (statusFilter === "pending") {
        filtered = filtered.filter((inquiry) => !inquiry.cardId);
      }
    }

    // Payment filter
    if (paymentFilter) {
      filtered = filtered.filter((inquiry) => {
        const paymentStatus = inquiry.generatedCard?.paymentStatus || "Pending";
        return paymentStatus === paymentFilter;
      });
    }

    // Keep pinned on top: superadmin pins first, then own pins, then by date
    filtered = [...filtered].sort((a, b) => {
      const order = (i) => (i.pinnedBySuperAdmin ? 0 : i.pinnedForMe ? 1 : 2);
      const o = order(a) - order(b);
      if (o !== 0) return o;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    setFilteredInquiries(filtered);
  };

  const handlePinForMe = async (inquiry) => {
    setPinMenuInquiryId(null);
    try {
      await pinInquiry(inquiry._id);
      setInquiries((prev) =>
        prev.map((i) =>
          i._id === inquiry._id
            ? { ...i, pinnedForMe: true, pinnedBySuperAdmin: false }
            : i
        )
      );
      showSuccess("Pinned for you");
    } catch (err) {
      showError(err?.message || "Failed to pin");
    }
  };

  const handlePinForAdmin = async (inquiry, forAdminId) => {
    setPinMenuInquiryId(null);
    try {
      await pinInquiry(inquiry._id, forAdminId);
      setInquiries((prev) =>
        prev.map((i) =>
          i._id === inquiry._id ? { ...i, pinnedForAssignedAdmin: true } : i
        )
      );
      showSuccess("Pinned for admin");
    } catch (err) {
      showError(err?.message || "Failed to pin");
    }
  };

  const handleUnpinForAdmin = async (inquiry, forAdminId) => {
    setPinMenuInquiryId(null);
    try {
      await unpinInquiry(inquiry._id, forAdminId);
      setInquiries((prev) =>
        prev.map((i) =>
          i._id === inquiry._id ? { ...i, pinnedForAssignedAdmin: false } : i
        )
      );
      showSuccess("Unpinned for admin");
    } catch (err) {
      showError(err?.message || "Failed to unpin");
    }
  };

  const handleUnpin = async (inquiry) => {
    setPinMenuInquiryId(null);
    try {
      await unpinInquiry(inquiry._id);
      setInquiries((prev) =>
        prev.map((i) =>
          i._id === inquiry._id
            ? { ...i, pinnedForMe: false, pinnedBySuperAdmin: false }
            : i
        )
      );
      showSuccess("Unpinned");
    } catch (err) {
      showError(err?.message || "Failed to unpin");
    }
  };

  const handleGenerateCard = (inquiry) => {
    if (onEditCard) {
      // Use the parent's handler (AdminApp)
      onEditCard(inquiry, inquiry._id, inquiry.cardId);
    } else {
      // Fallback to local state management
      setSelectedInquiry(inquiry);
      setShowCardGenerator(true);
    }
  };

  const handleCardGenerated = (card) => {
    // Update local state
    setInquiries((prev) =>
      prev.map((inquiry) =>
        inquiry._id === selectedInquiry._id
          ? { ...inquiry, cardId: card._id, generatedCard: card }
          : inquiry
      )
    );
    setShowCardGenerator(false);
    setSelectedInquiry(null);
    showSuccess("Card generated successfully!");
  };

  const handleBackToDirectory = () => {
    setShowCardGenerator(false);
    setSelectedInquiry(null);
  };

  const handlePreviewCard = async (inquiry) => {
    try {
      // Validate that we have the necessary data for preview
      if (!inquiry) {
        showError("No inquiry data available for preview");
        return;
      }

      // Only allow preview for generated cards (check cardId)
      if (!inquiry.cardId) {
        showError("Card must be generated before preview is available");
        return;
      }

      // Check if we have categories loaded
      if (categories.length === 0) {
        showError("Categories not loaded yet. Please try again.");
        return;
      }

      // Prefer the category already used by the generated card if available
      let categoryId =
        inquiry.generatedCard?.categoryId ||
        businessTypeToCategoryId[inquiry.businessType];

      // If not found, try to find by category ID directly
      if (!categoryId) {
        const directMapping = {
          business: "business",
          doctor: "doctor",
          lawyer: "lawyer",
          artist: "artist",
          "makeup-artist": "makeup-artist",
          "interior-designer": "interior-designer",
          "travel-agent": "travel-agent",
          ecommerce: "ecommerce",
          "link-pro": "link-pro",
        };
        categoryId = directMapping[inquiry.businessType];
      }

      if (!categoryId) {
        // Fallback gracefully to first available category to allow preview
        categoryId = categories[0]?.categoryId || "business";
      }

      // Try to locate category for informational purposes; if missing, continue gracefully
      const category =
        categories.find((cat) => cat.categoryId === categoryId) ||
        categories[0];

      // Fetch the latest inquiry data to ensure we have updated card data
      try {
        const updatedInquiry = await getInquiryById(inquiry._id);
        if (updatedInquiry) {
          // console.log('Updated inquiry data:', updatedInquiry);
          // console.log('Card ID:', updatedInquiry.cardId);
          setPreviewInquiry(updatedInquiry);
        } else {
          // console.log('Using cached inquiry data:', inquiry);
          setPreviewInquiry(inquiry);
        }
      } catch (fetchError) {
        // console.warn('Could not fetch updated inquiry data, using cached data:', fetchError);
        setPreviewInquiry(inquiry);
      }

      setShowPreview(true);
    } catch (err) {
      // console.error('Error opening preview:', err);
      showError("Failed to open preview");
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewInquiry(null);
  };

  const handleRefreshPreview = async () => {
    if (previewInquiry) {
      try {
        const updatedInquiry = await getInquiryById(previewInquiry._id);
        if (updatedInquiry) {
          setPreviewInquiry(updatedInquiry);
          showSuccess("Preview data refreshed");
        }
      } catch (error) {
        // console.error('Error refreshing preview data:', error);
        showError("Failed to refresh preview data");
      }
    }
  };

  const handlePaymentStatusChange = async (inquiry, newStatus) => {
    try {
      if (inquiry.generatedCard) {
        await updatePaymentStatus(inquiry.generatedCard._id, newStatus);

        // Update local state
        setInquiries((prev) =>
          prev.map((inq) =>
            inq._id === inquiry._id
              ? {
                ...inq,
                generatedCard: {
                  ...inq.generatedCard,
                  paymentStatus: newStatus,
                },
              }
              : inq
          )
        );

        showSuccess(`Payment status updated to ${newStatus}`);
      }
    } catch (err) {
      // console.error('Error updating payment status:', err);
      showError("Failed to update payment status");
    }
  };

  const getCardStatus = (inquiry) => {
    if (inquiry.cardId) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Generated
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </span>
    );
  };

  const getPaymentStatus = (inquiry) => {
    // Always show Pending by default, even if no card is generated
    const paymentStatus = inquiry.generatedCard?.paymentStatus || "Pending";
    const isDone = paymentStatus === "Done";

    // Plan now lives on the user; fall back to any card-level plan if present.
    const rawPlan =
      inquiry.userId?.plan || inquiry.generatedCard?.plan || null;
    const planLabel =
      rawPlan === "basic" ? "Basic" : rawPlan === "pro" ? "Pro" : null;

    return (
      <div className="flex flex-col items-start gap-1">
        <button
          onClick={() =>
            handlePaymentStatusChange(inquiry, isDone ? "Pending" : "Done")
          }
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors hover:opacity-80 ${
            isDone
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
          title={`Click to change payment status to ${
            isDone ? "Pending" : "Done"
          }`}
        >
          {isDone ? (
            <CheckCircle className="h-3 w-3 mr-1" />
          ) : (
            <DollarSign className="h-3 w-3 mr-1" />
          )}
          {paymentStatus}
        </button>
        {planLabel && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            Plan: {planLabel}
          </span>
        )}
      </div>
    );
  };

  if (showCardGenerator && selectedInquiry) {
    return (
      <CardGenerator
        inquiryId={selectedInquiry._id}
        onBack={handleBackToDirectory}
        onCardGenerated={handleCardGenerated}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Business Directory
          </h1>
          <p className="text-gray-600">
            Manage inquiries and generate business cards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetAndFetchInquiries}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          {!selectionMode ? (
            <button
              onClick={toggleSelectionMode}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
            >
              <CheckSquare className="h-4 w-4" />
              <span>Select inquiry</span>
            </button>
          ) : (
            <>
              <button
                onClick={toggleSelectionMode}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={openDeleteModal}
                disabled={selectedIds.length === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete selected {selectedIds.length > 0 ? `(${selectedIds.length})` : ""}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="End Date"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="shrink-0 px-3 py-2 text-xs text-gray-600 hover:text-gray-800 underline"
                >
                  Clear dates
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Card Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="generated">Generated</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Payment Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Status
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Payments</option>
              <option value="Done">Done</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading inquiries...</div>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No inquiries found</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {selectionMode && (
                    <th className="text-left py-4 px-6 font-semibold text-gray-900 w-12">
                      <input
                        type="checkbox"
                        ref={selectAllCheckboxRef}
                        checked={filteredInquiries.length > 0 && selectedIds.length === filteredInquiries.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                  )}
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Name
                  </th>
                  {/* <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Category
                  </th> */}
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Card Status
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Payment Status
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Contact
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Submitted
                  </th>
                  {JSON.parse(localStorage.getItem("auth") || "{}").user
                    ?.role === "superadmin" && (
                      <th className="text-left py-4 px-6 font-semibold text-gray-900">
                        Assigned To
                      </th>
                    )}
                  <th className="text-left py-4 px-6 font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInquiries.map((inquiry) => (
                  <tr key={inquiry._id} className="hover:bg-gray-50">
                    {selectionMode && (
                      <td className="py-4 px-6 w-12">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(inquiry._id)}
                          onChange={() => toggleSelectOne(inquiry._id)}
                          className="rounded border-gray-300 text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">
                          {inquiry.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {inquiry.businessType}
                        </div>
                      </div>
                    </td>
                    {/* <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs whitespace-nowrap font-medium bg-blue-100 text-blue-800">
                        {inquiry.businessType}
                      </span>
                    </td> */}
                    <td className="py-4 px-6">{getCardStatus(inquiry)}</td>
                    <td className="py-4 px-6">{getPaymentStatus(inquiry)}</td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-600">
                        {/* <div>{inquiry.email}</div> */}
                        <div>{inquiry.phone}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-gray-600">
                        {(() => {
                          const d = new Date(inquiry.createdAt);
                          const day = d.getDate();
                          const month = d.toLocaleString('en-US', { month: 'short' });
                          const year = d.getFullYear();
                          return `${day} ${month} ${year}`;
                        })()}
                      </div>
                    </td>
                    {JSON.parse(localStorage.getItem("auth") || "{}").user
                      ?.role === "superadmin" && (
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1.5 min-w-[10rem]">
                            <span
                              className="text-sm text-gray-800 truncate max-w-[200px]"
                              title={inquiry.assignedTo || ""}
                            >
                              {inquiry.assignedTo || "—"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setAssignModalInquiry(inquiry);
                                setAssignSearch("");
                                setAssignCategoryFilter("all");
                              }}
                              className="text-left text-sm text-blue-600 hover:text-blue-800 font-medium w-fit"
                            >
                              {inquiry.assignedTo ? "Change assignment" : "Assign"}
                            </button>
                          </div>
                        </td>
                      )}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        {/* Pin: pinned = filled style; unpinned = outline; superadmin can open "Pin for" menu */}
                        <div className="relative" ref={pinMenuInquiryId === inquiry._id ? pinMenuRef : undefined}>
                          {inquiry.pinnedForMe ? (
                            <button
                              onClick={() => handleUnpin(inquiry)}
                              className="flex items-center justify-center p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                              title={inquiry.pinnedBySuperAdmin ? "Pinned by superadmin (click to unpin)" : "Pinned by you (click to unpin)"}
                            >
                              <Pin className="h-4 w-4 fill-current" />
                            </button>
                          ) : isSuperadmin && pinMenuInquiryId === inquiry._id ? (
                            <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]">
                              <button
                                type="button"
                                onClick={() => handlePinForMe(inquiry)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Pin for me
                              </button>
                              {inquiry.assignedTo && (() => {
                                const assignedAdmin = admins.find((a) => a.name === inquiry.assignedTo);
                                const isPinnedForAssigned = inquiry.pinnedForAssignedAdmin;
                                return assignedAdmin ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      isPinnedForAssigned
                                        ? handleUnpinForAdmin(inquiry, assignedAdmin._id)
                                        : handlePinForAdmin(inquiry, assignedAdmin._id)
                                    }
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    {isPinnedForAssigned ? "Unpin for " : "Pin for "}{inquiry.assignedTo}
                                  </button>
                                ) : null;
                              })()}
                              <button
                                type="button"
                                onClick={() => setPinMenuInquiryId(null)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 border-t border-gray-100"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isSuperadmin) {
                                  setPinMenuInquiryId((id) => (id === inquiry._id ? null : inquiry._id));
                                } else {
                                  handlePinForMe(inquiry);
                                }
                              }}
                              className="flex items-center justify-center p-2 text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 hover:text-gray-700 transition-colors"
                              title="Pin inquiry"
                            >
                              <Pin className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        {/* Eye icon for preview - only show if card is generated */}
                        {inquiry.cardId && inquiry.generatedCard && (
                          <button
                            onClick={() => handlePreviewCard(inquiry)}
                            className="flex items-center justify-center p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                            title="Preview Card"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        {/* Edit/Generate Card button */}
                        {(() => {
                          const userRole = JSON.parse(
                            localStorage.getItem("auth") || "{}"
                          ).user?.role;
                          const isAssigned =
                            inquiry.assignedTo && inquiry.assignedTo !== "";

                          // For superadmin: hide edit button if inquiry is assigned to any admin
                          // For regular admin: show edit button only for their assigned inquiries
                          const shouldShowEditButton =
                            userRole === "superadmin"
                              ? !isAssigned // Superadmin can only edit unassigned inquiries
                              : isAssigned &&
                              inquiry.assignedTo ===
                              JSON.parse(
                                localStorage.getItem("auth") || "{}"
                              ).user?.username; // Admin can only edit their assigned inquiries

                          return (
                            shouldShowEditButton && (
                              <button
                                onClick={() => handleGenerateCard(inquiry)}
                                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                {inquiry.cardId ? (
                                  <>
                                    <Edit3 className="h-3 w-3" />
                                    <span>Edit Card</span>
                                  </>
                                ) : (
                                  <>
                                    <Edit3 className="h-3 w-3" />
                                    <span>Generate Card</span>
                                  </>
                                )}
                              </button>
                            )
                          );
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Sentinel for infinite scroll */}
        {hasMore && (
          <div ref={loadMoreRef} className="py-4 text-center text-sm text-gray-400">
            Loading more...
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Total: {inquiries.length} inquiries</span>
          <span>Filtered: {filteredInquiries.length} inquiries</span>
        </div>
      </div>

      {/* Assign inquiry — admin picker modal */}
      {assignModalInquiry && (
        <div
          className="fixed inset-0 !mt-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-modal-title"
          onClick={closeAssignModal}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-100 shrink-0">
              <h3 id="assign-modal-title" className="text-lg font-semibold text-gray-900">
                Assign inquiry
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Choose an admin for{" "}
                <strong className="text-gray-800">{assignModalInquiry.name}</strong>
              </p>
              <div className="mt-4 space-y-3">
                <input
                  type="search"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Search by admin name…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Category
                  </label>
                  <select
                    value={assignCategoryFilter}
                    onChange={(e) => setAssignCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="all">All types</option>
                    <option value="in-house">In-House Admin</option>
                    <option value="corporate">Corporate Admin</option>
                    <option value="individual">Individual Admin</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
              {ASSIGN_CATEGORY_ORDER.map((cat) => {
                if (assignCategoryFilter !== "all" && assignCategoryFilter !== cat) {
                  return null;
                }
                const list = assignModalGrouped[cat] || [];
                return (
                  <div key={cat}>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pb-1 border-b border-gray-100">
                      {ASSIGN_CATEGORY_HEADINGS[cat]}
                    </h4>
                    {list.length === 0 ? (
                      <p className="text-sm text-gray-400 py-2">No admins in this category</p>
                    ) : (
                      <ul className="space-y-1">
                        {list.map((admin) => (
                          <li key={admin._id}>
                            <button
                              type="button"
                              onClick={() => confirmAssignAdmin(admin.name)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                assignModalInquiry.assignedTo === admin.name
                                  ? "bg-blue-50 text-blue-900 ring-1 ring-blue-200"
                                  : "bg-gray-50 text-gray-900 hover:bg-blue-50 hover:text-blue-900"
                              }`}
                            >
                              {admin.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-5 border-t border-gray-100 flex flex-wrap justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={confirmUnassign}
                className="px-4 py-2 text-amber-800 bg-amber-50 rounded-lg hover:bg-amber-100 text-sm font-medium"
              >
                Unassign
              </button>
              <button
                type="button"
                onClick={closeAssignModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete selected – password confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 !mt-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete selected inquiries</h3>
            <p className="text-sm text-gray-600 mb-4">
              You are about to delete {selectedIds.length} inquiry(ies). Enter your password to confirm.
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                setDeleteError("");
              }}
              placeholder="Your password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 mb-2"
              autoFocus
            />
            {deleteError && (
              <p className="text-sm text-red-600 mb-4">{deleteError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Preview Modal */}
      {previewInquiry && (
        <CardPreviewModal
          isOpen={showPreview}
          onClose={handleClosePreview}
          categories={categories}
          inquiry={previewInquiry}
          cardData={previewInquiry.generatedCard?.data || {}}
          category={(() => {
            const effectiveCategoryId =
              previewInquiry.generatedCard?.categoryId ||
              businessTypeToCategoryId[previewInquiry.businessType] ||
              categories[0]?.categoryId;
            console.log("BusinessDirectory - Category resolution:", {
              generatedCardCategoryId: previewInquiry.generatedCard?.categoryId,
              businessType: previewInquiry.businessType,
              mappedCategoryId:
                businessTypeToCategoryId[previewInquiry.businessType],
              effectiveCategoryId,
              availableCategories: categories.map((c) => c.categoryId),
            });
            const foundCategory = categories.find(
              (cat) => cat.categoryId === effectiveCategoryId
            );
            console.log("BusinessDirectory - Found category:", foundCategory);
            return foundCategory;
          })()}
          template={(() => {
            const effectiveCategoryId =
              previewInquiry.generatedCard?.categoryId ||
              businessTypeToCategoryId[previewInquiry.businessType] ||
              categories[0]?.categoryId;
            return categories.find(
              (cat) => cat.categoryId === effectiveCategoryId
            )?.templates?.[0];
          })()}
          hiddenFields={previewInquiry.generatedCard?.hiddenFields || []}
          cardId={previewInquiry.cardId}
          onRefresh={handleRefreshPreview}
        />
      )}
    </div>
  );
};

export default BusinessDirectory;
