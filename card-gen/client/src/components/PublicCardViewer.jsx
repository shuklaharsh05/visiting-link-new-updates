import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  Share2,
  Download,
  Save,
  SaveIcon,
  SaveAll,
  DownloadIcon,
  Check,
  Heart,
  X,
} from "lucide-react";
import CardRenderer from "./CardRenderer";
import UserAuthModal from "./UserAuthModal";
import downloadAnimation from "../assets/Downloading.json";
import Lottie from "lottie-react";
import AdminNotificationModal from "./AdminNotificationModal";
import UnsaveConfirmModal from "./UnsaveConfirmModal";
import VcfLeadDownloadModal from "./VcfLeadDownloadModal.jsx";
import { useAuth } from "../contexts/AuthContext";
import {
  saveCard,
  getSavedCards,
  removeSavedCard,
  getAuthData,
  authenticatedFetch,
} from "../api/auth";

const PublicCardViewer = () => {
  const { cardId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showUnsaveModal, setShowUnsaveModal] = useState(false);
  const [isCardSaved, setIsCardSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [vcfModalOpen, setVcfModalOpen] = useState(false);
  const [vcfSubmitting, setVcfSubmitting] = useState(false);
  const [vcfError, setVcfError] = useState("");

  useEffect(() => {
    fetchCard();
  }, [cardId]);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Only check saved cards for regular users, not admin users
      if (
        !user?.isAdmin &&
        user?.role !== "admin" &&
        user?.role !== "superadmin"
      ) {
        checkIfCardSaved();
      }
    }
  }, [isAuthenticated, user, cardId]);

  // Show save prompt after 3 seconds for non-admin users
  useEffect(() => {
    // Don't prompt if already saved or admin/superadmin
    if (
      user?.isAdmin ||
      user?.role === "admin" ||
      user?.role === "superadmin" ||
      isCardSaved
    ) {
      return;
    }

    const timer = setTimeout(() => {
      setShowSavePrompt(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, isCardSaved]);

  const fetchCard = async () => {
    try {
      setLoading(true);
      // Use authenticatedFetch so logged-in users/admins can view private cards they own/manage.
      // Falls back gracefully: if there's no token, authenticatedFetch still works for public cards.
      const data = await authenticatedFetch(`/cards/${cardId}`);
      // console.log('Card data received:', data);
      // console.log('Card structure:', {
      //   hasCard: !!data.card,
      //   hasData: !!data.data,
      //   cardData: data.card?.data,
      //   categoryId: data.card?.categoryId,
      //   customizations: data.card?.customizations
      // });
      setCard(data);

      // Update view count
      await updateViewCount();
    } catch (err) {
      // console.error('Error fetching card:', err);
      setError(err?.message || "Failed to fetch card");
    } finally {
      setLoading(false);
    }
  };

  const redirectToUserPanelViaCode = async () => {
    try {
      const resp = await authenticatedFetch(`/auth/mint-code`, {
        method: "POST",
        body: JSON.stringify({
          allowedOrigin: "https://www.visitinglink.com",
        }),
      });
      const code = resp?.code;
      if (code) {
        const dest = new URL(
          "https://www.visitinglink.com/auth/callback"
        );
        dest.searchParams.set("code", code);
        dest.searchParams.set("state", "card-viewer");
        window.location.href = dest.toString();
        return;
      }
    } catch (e) {
      // fall through to saved-cards
    }
    window.location.href =
      "https://www.visitinglink.com/saved-cards";
  };

  const updateViewCount = async () => {
    try {
      const response = await fetch(`/api/cards/${cardId}/view`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        // console.log('View count updated:', result);
        // Update the local card state with new view count
        setCard((prevCard) => ({
          ...prevCard,
          card: {
            ...prevCard.card,
            views: result.views,
          },
        }));
      } else {
        // console.error('Failed to update view count');
      }
    } catch (err) {
      // console.error('Error updating view count:', err);
    }
  };

  const downloadVcfBlob = () => {
    try {
      const data = card?.card?.data || card?.data || {};
      const effectiveCardId = cardId || card?.card?._id || card?.card?.cardId;

      const name =
        data.CompanyName ||
        data.companyName ||
        data.storeName ||
        data.name ||
        data.customCardData?.companyName ||
        "Contact";

      const phone =
        data.phoneNumber ||
        data.whatsappNumber ||
        data.phone ||
        data.contact?.phone ||
        data.customCardData?.phone ||
        "";

      const email =
        data.email || data.contact?.email || data.customCardData?.email || "";

      let shareableLink = "";
      if (effectiveCardId) {
        shareableLink = `https://www.visitinglink.com/cards/${effectiveCardId}`;
      }

      let city = "";
      let address = "";
      if (Array.isArray(data.headquarters) && data.headquarters.length > 0) {
        city = data.headquarters[0].city || "";
        address = data.headquarters[0].address || "";
      }

      const escapeVal = (val) => {
        if (!val) return "";
        return String(val)
          .replace(/\\/g, "\\\\")
          .replace(/;/g, "\\;")
          .replace(/\r?\n/g, "\\n")
          .replace(/\r/g, "");
      };

      const vcardLines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:;${escapeVal(name)};;;`,
        `FN:${escapeVal(name)}`,
        phone ? `TEL;TYPE=CELL:${escapeVal(phone)}` : "",
        email ? `EMAIL;TYPE=INTERNET:${escapeVal(email)}` : "",
        shareableLink ? `URL:${escapeVal(shareableLink)}` : "",
        address || city
          ? `ADR;TYPE=WORK:;;${escapeVal(address)};${escapeVal(city)};;;;`
          : "",
        "END:VCARD",
      ].filter(Boolean);

      const vcardString = vcardLines.join("\r\n");
      const blob = new Blob([vcardString], {
        type: "text/vcard;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${name || "contact"}.vcf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      // best-effort
    }
  };

  const openVcfDownloadModal = () => {
    setVcfError("");
    const effectiveCardId = cardId || card?.card?._id || card?.card?.cardId;
    if (!effectiveCardId) {
      downloadVcfBlob();
      return;
    }
    setVcfModalOpen(true);
  };

  const handleVcfLeadConfirm = async ({ name, phone, purpose }) => {
    const effectiveCardId = cardId || card?.card?._id || card?.card?.cardId;
    if (!effectiveCardId) {
      downloadVcfBlob();
      setVcfModalOpen(false);
      return;
    }
    setVcfSubmitting(true);
    setVcfError("");
    try {
      const res = await fetch(`/api/cards/${effectiveCardId}/vcf-lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, purpose }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVcfError(
          data.error ||
            data.message ||
            (Array.isArray(data.errors) && data.errors[0]?.msg) ||
            "Could not save details"
        );
        return;
      }
      downloadVcfBlob();
      setVcfModalOpen(false);
    } catch (e) {
      setVcfError(e?.message || "Network error");
    } finally {
      setVcfSubmitting(false);
    }
  };

  // const handleShare = async () => {
  //   const cardData = card.card?.data || card.data || {};
  //   const companyName = cardData.companyName || "Business";

  //   if (navigator.share) {
  //     try {
  //       await navigator.share({
  //         title: `${companyName}'s Digital Business Card`,
  //         text: `Check out ${companyName}'s digital business card`,
  //         url: window.location.href,
  //       });
  //     } catch (err) {
  //       // console.log('Error sharing:', err);
  //     }
  //   } else {
  //     // Fallback: copy to clipboard
  //     try {
  //       await navigator.clipboard.writeText(window.location.href);
  //       alert("Link copied to clipboard!");
  //     } catch (err) {
  //       // console.log('Error copying to clipboard:', err);
  //     }
  //   }

  //   // Best-effort: increment share count on server (ignore failures)
  //   try {
  //     await fetch(`/api/cards/${cardId}/share`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //     });
  //   } catch (e) {
  //     // console.warn('Failed to update share count', e);
  //   }
  // };

  const checkIfCardSaved = async () => {
    try {
      // Skip checking saved cards for admin users
      if (
        user?.isAdmin ||
        user?.role === "admin" ||
        user?.role === "superadmin"
      ) {
        setIsCardSaved(false);
        return;
      }

      const response = await getSavedCards();
      const userSavedCards = response.data.savedCards || [];
      const isSaved = userSavedCards.some(
        (savedCard) => savedCard._id === cardId
      );
      setIsCardSaved(isSaved);
      setSavedCards(userSavedCards);
    } catch (error) {
      // console.error('Error checking saved cards:', error);
      // If it's an admin user error, just set as not saved
      if (error.message.includes("Admin users cannot access saved cards")) {
        setIsCardSaved(false);
      }
    }
  };

  const handleSaveCard = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Check if user is admin/superadmin
    if (
      user?.isAdmin ||
      user?.role === "admin" ||
      user?.role === "superadmin"
    ) {
      setShowAdminModal(true);
      return;
    }

    if (isCardSaved) {
      // Show confirmation modal for unsaving
      setShowUnsaveModal(true);
      return;
    }

    setSaving(true);
    try {
      // Save the card
      await saveCard(cardId);
      setIsCardSaved(true);
      // Redirect to user panel via short-lived code
      await redirectToUserPanelViaCode();
    } catch (error) {
      // console.error('Error saving card:', error);
      if (error.message.includes("Admin users cannot save cards")) {
        setShowAdminModal(true);
      } else {
        alert("Failed to save card. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUnsaveConfirm = async () => {
    setSaving(true);
    setShowUnsaveModal(false);

    try {
      await removeSavedCard(cardId);
      setIsCardSaved(false);
      alert("Card removed from saved cards!");
    } catch (error) {
      // console.error('Error removing card:', error);
      alert("Failed to remove card. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAuthSuccess = async (userData, cardIdToSave) => {
    // After successful login/registration, save the card
    try {
      await saveCard(cardIdToSave);
      setIsCardSaved(true);
      // Redirect via short-lived code
      await redirectToUserPanelViaCode();
    } catch (error) {
      // console.error('Error saving card after auth:', error);
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.toLowerCase().includes('already saved')) {
        setIsCardSaved(true);
        await redirectToUserPanelViaCode();
        return;
      }
      alert("Failed to save card. Please try again.");
    }
  };

  const handleDownload = () => {
    // This would implement card download functionality
    alert("Download functionality coming soon!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading card...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Card Not Found
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => (window.location.href = "https://www.visitinglink.com")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!card) {
    return null;
  }

  // Extract card data from the response structure
  const cardData = card.card?.data || card.data || {};
  const categoryId = card.card?.categoryId || card.categoryId;
  const customizations = card.card?.customizations || card.customizations || {};
  const isCustom = !!(card.card?.isCustom || card.isCustom);
  const hiddenFields = card.card?.hiddenFields || card.hiddenFields || [];

  // Debug: Log what customizations are being detected
  // console.log('PublicCardViewer - Customizations detected:', customizations);
  // console.log('PublicCardViewer - Customizations keys:', Object.keys(customizations));

  // Get category name from categoryId
  const getCategoryName = (categoryId) => {
    const categoryMap = {
      business: "Business",
      doctor: "Doctor",
      lawyer: "Lawyer",
      artist: "Artist",
      "makeup-artist": "Makeup Artist",
      "interior-designer": "Interior Designer",
      "travel-agent": "Travel Agent",
      ecommerce: "E-commerce",
    };
    return categoryMap[categoryId] || "Business";
  };

  // Ensure cardId is present in the data passed to CardRenderer
  const cardMongoId = card.card?._id || cardId;
  const cardDataWithId = { ...cardData, _id: cardMongoId };

  return (
    <div className="">
      <div className="">
        {/* Header */}
        {/* <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {cardData.storeName || cardData.companyName || cardData.customCardData?.companyName || 'Business'}'s Digital Business Card
          </h1>
          <p className="text-gray-600">
            {getCategoryName(categoryId)} Business Card
          </p>
        </div> */}

        {/* Card Preview using CardRenderer */}
        <div className="bg-white rounded-2xl">
          <div className="flex items-center justify-center gap-2">
            {/* <button 
              onClick={handleSaveCard}
              disabled={saving || (user?.isAdmin || user?.role === 'admin' || user?.role === 'superadmin')}
              className={`px-4 py-1 rounded-full transition-colors flex items-center gap-1 ${
                (user?.isAdmin || user?.role === 'admin' || user?.role === 'superadmin')
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : isCardSaved 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isCardSaved ? (
                <Check className="h-4 w-4" />
              ) : (
                <Heart className="h-4 w-4" />
              )}
              <span className="text-base">
                {saving ? (isCardSaved ? 'Removing...' : 'Saving...') : 
                 (user?.isAdmin || user?.role === 'admin' || user?.role === 'superadmin') ? 'Admin' :
                 isCardSaved ? 'Remove' : 'Save'}
              </span>
            </button> */}
          </div>
          <div className="flex justify-center items-center w-full h-full lg:pt-2 bg-[#C0ECD7]">
            <div className="w-fit relative">
              {/* <button
                onClick={handleShare}
                className="bg-gray-200 hover:bg-gray-200 border-0 border-black text-black px-2 py-0.5 rounded-lg transition-colors duration-300 flex items-center gap-1 absolute top-2 right-8 z-10"
              >
                <img src="/share.svg" alt="Share" className="w-3 h-3" />
                <span className="text-black text-xs">Share</span>
              </button> */}

              {(() => {
                // console.log('PublicCardViewer - Passing to CardRenderer:', {
                //   cardData: cardData,
                //   categoryId: categoryId,
                //   categoryName: getCategoryName(categoryId),
                //   hiddenFields: hiddenFields,
                //   customizations: customizations
                // });
                return null;
              })()}
              <CardRenderer
                cardData={cardDataWithId}
                category={{
                  categoryId: categoryId,
                  categoryName: getCategoryName(categoryId),
                }}
                hiddenFields={hiddenFields}
                customisations={customizations}
                isCustom={isCustom}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="">
          {/* <button
            onClick={handleShare}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="h-5 w-5" />
            <span>Save Card</span>
          </button> */}
          {/* <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Download</span>
          </button> */}
        </div>

        {/* Footer */}
        {/* <div className="text-center text-gray-500 text-sm">
          <p>Generated with CardGen</p>
          <p className="mt-1">Views: {card.card?.views || 0}</p>
          {console.log("Card data by me", card.card.views)}
        </div> */}
      </div>

      {/* Save Prompt Modal */}
      {showSavePrompt &&
        !isCardSaved &&
        !(
          user?.isAdmin ||
          user?.role === "admin" ||
          user?.role === "superadmin"
        ) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            {/* Centered popup container */}
            <div className="items-center justify-center max-w-5xl w-full px-4 flex lg:mr-[-11rem]">
              {/* Left illustration */}
              <div className="w-[520px] max-w-full hidden lg:block">
                <img
                  src="/pop-up-image.png"
                  alt="Save Card"
                  className="w-full h-auto object-contain"
                />
              </div>

              {/* Mobile mockup with buttons overlayed */}
              <div className="relative w-[98%] mx-auto lg:w-[410px] max-w-[410px] lg:ml-[-5.5rem]">
                {/* Close (X) button */}
                <button
                  type="button"
                  onClick={() => setShowSavePrompt(false)}
                  className="absolute -top-3 lg:-top-4 -left-1 lg:-left-[26rem] z-[100] flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-md"
                  aria-label="Close"
                >
                  <X className="h-4 w-4 lg:h-6 lg:w-6" />
                </button>

                <img
                  src="/mobile-popup-2.png"
                  alt="Save Card"
                  className="w-full h-auto object-contain"
                />

                {/* Buttons wrapper positioned relative to the mobile image */}
                <div className="absolute inset-0 flex items-end justify-center px-4 pb-10 lg:pb-14 z-[99]">
                  <div className="flex flex-col items-center justify-end gap-3 lg:gap-4">

                    {/* <button
                      onClick={() => {
                        setShowSavePrompt(false);
                        handleSaveCard();
                      }}
                      className="px-8 lg:px-4 py-2 rounded-[16px] bg-[#000000] border border-[#ffffff] text-white text-[14px] lg:text-base flex items-center gap-2"
                    >
                      <img src="/save-blue.png" alt="Save" className="w-4 h-4 mb-1" />
                      Save this card
                    </button> */}
                    <a
                      href="https://bundelkhandexpo.com/visitor-pass"
                      className="px-4 lg:px-6 py-2 rounded-[16px] bg-[#000000] border border-[#ffffff] text-white text-[14px] lg:text-base flex items-center gap-2 relative overflow-hidden group shine-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      {/* <img src="/save-blue.png" alt="Save" className="w-4 h-4 mb-1" /> */}
                      <span className="relative z-10">Get you free vistor passes</span>
                      <span
                        className="shine-glass"
                        aria-hidden="true"
                      ></span>
                    </a>


                    <button
                      onClick={openVcfDownloadModal}
                      className="pl-3 pr-4 lg:pl-4 lg:pr-6 py-0 rounded-[16px] bg-gray-200 text-black border border-black text-[14px] lg:text-base flex items-center gap-2"
                    >
                      <Lottie animationData={downloadAnimation} loop={true} className="max-w-10" />
                      <span>Download Contact</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* User Authentication Modal */}
      <UserAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        cardId={cardId}
      />

      {/* Admin Notification Modal */}
      <AdminNotificationModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />

      {/* Unsave Confirmation Modal */}
      <UnsaveConfirmModal
        isOpen={showUnsaveModal}
        onClose={() => setShowUnsaveModal(false)}
        onConfirm={handleUnsaveConfirm}
        cardTitle={
          card?.card?.data?.companyName ||
          card?.card?.data?.storeName ||
          "Business Card"
        }
      />

      <VcfLeadDownloadModal
        isOpen={vcfModalOpen}
        onClose={() => {
          setVcfModalOpen(false);
          setVcfError("");
        }}
        onConfirm={handleVcfLeadConfirm}
        submitting={vcfSubmitting}
        error={vcfError}
      />
    </div>
  );
};

export default PublicCardViewer;
