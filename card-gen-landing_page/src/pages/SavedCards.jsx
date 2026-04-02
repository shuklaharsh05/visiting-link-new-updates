import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { apiService } from "../lib/api.js";
import * as XLSX from "xlsx";
import {
  CreditCard,
  Eye,
  Calendar,
  Share2,
  Copy,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Trash2,
  Edit,
  ChevronRight,
  Search,
  X,
  UserPlus,
  MessageCircle,
  User,
  Mail,
  Phone,
  StickyNote,
} from "lucide-react";

export default function SavedCards() {
  const { user } = useAuth();
  const [savedCards, setSavedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedCardId, setCopiedCardId] = useState(null);
  const [deletingCardId, setDeletingCardId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [noDataExportMessage, setNoDataExportMessage] = useState("");
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactSuccess, setContactSuccess] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    notes: "",
  });
  const [sameAsPhone, setSameAsPhone] = useState(false);

  useEffect(() => {
    const fetchSavedCards = async () => {
      if (!user) return;

      try {
        console.log("SavedCards - Fetching user data for user:", user._id);

        // Prefer dedicated endpoint for saved cards
        const savedCardsResponse = await apiService.getUserSavedCards(user._id);
        console.log(
          "SavedCards - getUserSavedCards response:",
          savedCardsResponse
        );

        if (
          savedCardsResponse.success &&
          Array.isArray(savedCardsResponse.data)
        ) {
          setSavedCards(savedCardsResponse.data);
          console.log(
            "SavedCards - Set saved cards (dedicated endpoint):",
            savedCardsResponse.data
          );

          if (savedCardsResponse.data.length > 0) {
            console.log(
              "SavedCards - First card structure:",
              JSON.stringify(savedCardsResponse.data[0], null, 2)
            );
            console.log(
              "SavedCards - First card shareable link:",
              getShareableLink(savedCardsResponse.data[0])
            );
          }
        } else if (
          savedCardsResponse.success &&
          savedCardsResponse.data &&
          savedCardsResponse.data.savedCards
        ) {
          // Some backends might wrap in an object
          const cards = savedCardsResponse.data.savedCards;
          setSavedCards(cards);
          console.log("SavedCards - Set saved cards (wrapped):", cards);
        } else {
          setSavedCards([]);
          setError(savedCardsResponse.error || "Failed to fetch saved cards");
        }
      } catch (error) {
        console.error("SavedCards - Error fetching saved cards:", error);
        setError("Error loading saved cards");
        setSavedCards([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedCards();
  }, [user]);

  const copyToClipboard = async (card) => {
    try {
      const link = getShareableLink(card);
      if (link) {
        await navigator.clipboard.writeText(link);
        setCopiedCardId(card._id);
        setTimeout(() => setCopiedCardId(null), 2000);
      } else {
        console.warn("No shareable link found for card:", card);
      }
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  const getCardName = (card) => {
    // Try different possible paths for card name
    return (
      card.data?.companyName ||
      card.data?.CompanyName ||
      card.data?.customCardData?.companyName ||
      card.data?.storeName ||
      card.companyName ||
      card.storeName ||
      card.name ||
      "Unnamed Card"
    );
  };

  // const getCardType = (card) => {
  //   // Try different possible paths for card type
  //   return card.data?.categoryId ||
  //          card.data?.customCardData?.business_type ||
  //          card.data?.business_type ||
  //          card.categoryId ||
  //          card.business_type ||
  //          'Business';
  // };
  const getCardTagline = (card) => {
    // Try different possible paths for card type
    return (
      card.data?.tagline ||
      card.data?.customCardData?.tagline ||
      card.data?.tagline ||
      "No tagline"
    );
  };
  const getBusinessType = (card) => {
    return (
      card.data?.businessType ||
      card.data?.businessCategory ||
      card.data?.customCardData?.businessType ||
      card.data?.businessType ||
      "No business type"
    );
  };

  const getCardLogo = (card) => {
    return (
      card.data?.logo ||
      card.data?.customCardData?.profilePicture ||
      card.data?.customCardData?.profileImage ||
      card.data?.logo ||
      "No logo"
    );
  };

  const getCardAbout = (card) => {
    const about =
      card.data?.about ||
      card.data?.companyInfo ||
      card.data?.customCardData?.about?.description ||
      card.data?.about?.description ||
      card.data?.customCardData?.about ||
      "";
    return about.length > 100 ? about.substring(0, 100) + "..." : about;
  };

  const getCardEmail = (card) => {
    return (
      card.data?.email ||
      card.email ||
      card.data?.customCardData?.contact?.email ||
      ""
    );
  };

  const getCardPhone = (card) => {
    return (
      card.data?.phoneNumber ||
      card.data?.phone ||
      card.phone ||
      card.data?.customCardData?.contact?.phone ||
      ""
    );
  };

  const getShareableLink = (card) => {
    // Try different possible paths for shareable link
    if (!card.shareableLink) return null;

    // Replace teamserver.cloud with www.visitinglink.com
    return card.shareableLink.replace(
      "teamserver.cloud",
      "www.visitinglink.com"
    );
  };

  const handleDeleteCard = (cardId) => {
    if (!user || !cardId) return;
    setConfirmDeleteId(cardId);
  };

  const confirmDelete = async () => {
    if (!user || !confirmDeleteId) return;
    const cardId = confirmDeleteId;
    setDeletingCardId(cardId);

    try {
      console.log("Deleting saved card:", cardId);
      const response = await apiService.deleteSavedCard(user._id, cardId);

      if (response.success) {
        setSavedCards((prevCards) =>
          prevCards.filter((card) => card._id !== cardId)
        );
        console.log("Card deleted successfully");
      } else {
        console.error("Failed to delete card:", response.error);
      }
    } catch (error) {
      console.error("Error deleting card:", error);
    } finally {
      setDeletingCardId(null);
      setConfirmDeleteId(null);
    }
  };

  const openContactModal = () => {
    setContactError("");
    setContactSuccess("");
    setContactForm({
      name: "",
      email: "",
      phone: "",
      whatsapp: "",
      notes: "",
    });
    setSameAsPhone(false);
    setContactModalOpen(true);
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm((prev) => {
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
      setContactForm((prev) => ({ ...prev, whatsapp: prev.phone }));
    }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!user) {
      setContactError("You must be signed in to save contacts.");
      return;
    }
    const trimmedName = contactForm.name.trim();
    if (!trimmedName) {
      setContactError("Name is required.");
      return;
    }
    if (trimmedName.length < 2 || trimmedName.length > 120) {
      setContactError("Name must be between 2 and 120 characters.");
      return;
    }
    setContactSaving(true);
    setContactError("");
    setContactSuccess("");
    try {
      // Build payload - only include fields that have values
      const payload = {
        userId: user._id || user.id,
        name: trimmedName,
      };

      // Only add optional fields if they have values
      const trimmedEmail = contactForm.email.trim();
      if (trimmedEmail) {
        payload.email = trimmedEmail;
      }

      const trimmedPhone = contactForm.phone.trim();
      if (trimmedPhone) {
        payload.phone = trimmedPhone;
      }

      const trimmedWhatsapp = contactForm.whatsapp.trim();
      if (trimmedWhatsapp) {
        payload.whatsapp = trimmedWhatsapp;
      }

      const trimmedNotes = contactForm.notes.trim();
      if (trimmedNotes) {
        payload.notes = trimmedNotes;
      }

      console.log("Saving contact with payload:", payload);

      const response = await apiService.saveContact(payload);
      if (!response.success) {
        throw new Error(response.error || "Failed to save contact");
      }
      setContactSuccess("Contact saved successfully.");
      setTimeout(() => {
        setContactModalOpen(false);
        setContactSuccess("");
      }, 1200);
    } catch (err) {
      setContactError(err.message || "Failed to save contact.");
    } finally {
      setContactSaving(false);
    }
  };

  const handleShare = async (card) => {
    const cardData = card.card?.data || card.data || {};
    const companyName =
      cardData.companyName || cardData.storeName || getCardName(card);
    const shareableLink = getShareableLink(card);

    if (!shareableLink) {
      alert("No shareable link available for this card");
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${companyName}'s Digital Business Card`,
          text: `Check out ${companyName}'s digital business card`,
          url: shareableLink,
        });
      } catch (err) {
        console.log("Error sharing:", err);
        // Fallback to clipboard if share was cancelled or failed
        try {
          await navigator.clipboard.writeText(shareableLink);
          setCopiedCardId(card._id);
          setTimeout(() => setCopiedCardId(null), 2000);
        } catch (clipboardErr) {
          console.log("Error copying to clipboard:", clipboardErr);
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareableLink);
        setCopiedCardId(card._id);
        setTimeout(() => setCopiedCardId(null), 2000);
      } catch (err) {
        console.log("Error copying to clipboard:", err);
        alert("Unable to share or copy link");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Saved Cards
          </h1>
          <p className="text-slate-600 text-lg">
            Manage your saved business cards
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-semibold">Error Loading Cards</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter cards based on search query
  const filteredCards = savedCards.filter((card) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    const companyName = getCardName(card).toLowerCase();
    const email = getCardEmail(card).toLowerCase();
    const phone = getCardPhone(card).toLowerCase();

    return (
      companyName.includes(query) ||
      email.includes(query) ||
      phone.includes(query)
    );
  });

  return (
    <div className="w-full mx-auto font-poppins px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              Saved Cards
            </h1>
            <p className="text-slate-600 text-base sm:text-lg">
              {savedCards.length > 0
                ? `You have ${savedCards.length} saved business card${savedCards.length > 1 ? "s" : ""
                }`
                : "You haven't saved any business cards yet"}
            </p>
          </div>

          {savedCards.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto sm:min-w-[300px] lg:min-w-[500px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-800" />
                <input
                  type="text"
                  placeholder="Search your saved cards"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 xl:w-96 py-2 border border-slate-300 rounded-full focus:outline-1 focus:outline-black transition-all text-sm sm:text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={openContactModal}
                className="whitespace-nowrap inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border border-slate-300 bg-blue-600 text-sm font-medium text-white hover:bg-white hover:text-blue-600 hover:border-blue-600 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Create Contact
              </button>
              <button
                type="button"
                onClick={() => {
                  const dataToExport =
                    filteredCards.length > 0 || searchQuery
                      ? filteredCards
                      : savedCards;
                  if (!dataToExport || dataToExport.length === 0) {
                    setNoDataExportMessage(
                      "No saved cards available to export right now."
                    );
                    return;
                  }

                  const excelData = dataToExport.map((card) => ({
                    Name: getCardName(card),
                    Email: getCardEmail(card),
                    Phone: getCardPhone(card),
                    Tagline: getBusinessType(card),
                    About: getCardAbout(card),
                    Link: getShareableLink(card) || "",
                  }));

                  const wb = XLSX.utils.book_new();
                  const ws = XLSX.utils.json_to_sheet(excelData);
                  ws["!cols"] = [
                    { wch: 25 },
                    { wch: 30 },
                    { wch: 18 },
                    { wch: 30 },
                    { wch: 50 },
                    { wch: 40 },
                  ];
                  XLSX.utils.book_append_sheet(wb, ws, "Saved Cards");
                  const fileName = `saved_cards_${new Date().toISOString().split("T")[0]
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
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border bg-green-600 text-white text-sm font-medium hover:bg-white hover:text-green-600 hover:border-green-600 transition-colors"
              >
                Export
              </button>
            </div>
          )}
        </div>

        {searchQuery && (
          <p className="text-sm text-slate-600">
            {filteredCards.length === 0
              ? "No cards found matching your search."
              : `Found ${filteredCards.length} card${filteredCards.length > 1 ? "s" : ""
              } matching "${searchQuery}"`}
          </p>
        )}
      </div>

      {savedCards.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CreditCard className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No Saved Cards
          </h3>
          <p className="text-slate-600 mb-6">
            You haven't saved any business cards yet. Create your first card to
            get started.
          </p>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No Cards Found
          </h3>
          <p className="text-slate-600 mb-6">
            No cards match your search criteria. Try a different search term.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6">
          {filteredCards.map((card, index) => (
            <div
              key={card._id || index}
              className="bg-white rounded-3xl py-6 px-4 lg:p-6 relative max-w-[500px]"
              style={{ boxShadow: "0 4px 2px 0 rgba(0, 0, 0, 0.1)" }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-1.5 bg-gradient-to-b from-[#e6e5e5] to-[#bfbfbf] rounded-full aspect-square">
                  <img
                    src={getCardLogo(card)}
                    alt={getCardName(card)}
                    className="w-14 lg:w-28 min-w-14 lg:min-w-20 border-2 border-white rounded-full object-contain object-center aspect-square"
                  />
                </div>
                <div className="">
                  <h3 className="text-lg lg:text-xl leading-tight font-bold text-slate-900 uppercase">
                    {getCardName(card)}
                  </h3>
                  <p className="text-sm lg:text-lg leading-tight text-slate-600 font-normal capitalize mb-1">
                    {/* {getCardName(card)} */}
                    {/* {getCardType(card)} */}
                    {/* {getCardTagline(card)} */}
                    {getBusinessType(card)}
                  </p>
                  {getCardAbout(card) && (
                    <p className="text-[8px] lg:text-xs text-slate-600 font-normal capitalize leading-tight">
                      {getCardAbout(card)}
                    </p>
                  )}
                </div>
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => handleDeleteCard(card._id)}
                    disabled={deletingCardId === card._id}
                    className={`p-2 rounded-lg transition-colors ${deletingCardId === card._id
                        ? "text-slate-300 cursor-not-allowed"
                        : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                      }`}
                    title={
                      deletingCardId === card._id
                        ? "Deleting..."
                        : "Delete card"
                    }
                  >
                    {deletingCardId === card._id ? (
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="absolute bottom-3 right-4">
                  {getShareableLink(card) ? (
                    <a
                      href={getShareableLink(card)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-4 h-4"
                    >
                      <img
                        src="/arrow.svg"
                        alt="View Card"
                        className="w-[18px]"
                      />
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-300 text-slate-500 rounded-lg text-sm font-normal cursor-not-allowed"
                    >
                      No Link
                    </button>
                  )}
                </div>
              </div>

              {copiedCardId === card._id && (
                <div className="mt-3 text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Link copied to clipboard!
                </div>
              )}
            </div>
          ))}
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

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Delete saved card?
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              This will permanently remove this saved card from your account.
              You can still access the public card link if you have it.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100"
                onClick={() => setConfirmDeleteId(null)}
                disabled={deletingCardId === confirmDeleteId}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={confirmDelete}
                disabled={deletingCardId === confirmDeleteId}
              >
                {deletingCardId === confirmDeleteId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save contact modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 sm:p-7">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1">
              Create Contact
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mb-4">
              Quickly save a new contact to your account. You can manage all
              contacts from the Contacts page.
            </p>

            {contactError && (
              <div className="mb-3 text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
                <span>{contactError}</span>
              </div>
            )}
            {contactSuccess && (
              <div className="mb-3 text-xs sm:text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600" />
                <span>{contactSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveContact} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                    placeholder="Jane Doe"
                    disabled={contactSaving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={contactForm.email}
                      onChange={handleContactChange}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="jane@example.com"
                      disabled={contactSaving}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={contactForm.phone}
                      onChange={handleContactChange}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                      placeholder="+91 98765 43210"
                      disabled={contactSaving}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    name="whatsapp"
                    value={contactForm.whatsapp}
                    onChange={handleContactChange}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
                    placeholder="+91 98765 43210"
                    disabled={contactSaving || sameAsPhone}
                  />
                </div>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsPhone}
                    onChange={handleSameAsPhoneToggle}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                    disabled={contactSaving}
                  />
                  <span className="text-xs text-slate-600">
                    Same as phone number
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
                  Notes
                </label>
                <div className="relative">
                  <StickyNote className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea
                    name="notes"
                    value={contactForm.notes}
                    onChange={handleContactChange}
                    rows={3}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                    placeholder="Where you met, what you discussed, follow-up actions..."
                    disabled={contactSaving}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100"
                  onClick={() => setContactModalOpen(false)}
                  disabled={contactSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contactSaving}
                  className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {contactSaving ? "Saving..." : "Save Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
