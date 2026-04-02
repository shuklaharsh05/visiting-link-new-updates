// 'use client';
import React, { useState, useEffect, useRef } from "react";
import Lottie from "lottie-react";
import verifiedAnimation from "../../assets/Success.json";
import downloadAnimation from "../../assets/Downloading.json";
import likeAnimation from "../../assets/like.json";
import AppointmentModal from "../AppointmentModal.jsx";
import UserAuthModal from "../UserAuthModal.jsx";
import AdminNotificationModal from "../AdminNotificationModal.jsx";
import UnsaveConfirmModal from "../UnsaveConfirmModal.jsx";
import VcfLeadDownloadModal from "../VcfLeadDownloadModal.jsx";
import { useAuth } from "../../contexts/AuthContext";
import { saveCard, getSavedCards, removeSavedCard } from "../../api/auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  MessageCircle,
  Star,
  Heart,
  Calendar,
  ExternalLink,
  Loader2,
  Check,
  Download,
  Building2,
  Users,
  Award,
  ShoppingBag,
  Package,
  Image as ImageIcon,
  DownloadIcon,
  ChevronLeft,
  ChevronRight,
  HeartIcon,
  HeartOffIcon,
} from "lucide-react";

const AnimatedNumber = ({ value, duration = 1000 }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const startedRef = useRef(false);

  const raw = value != null ? String(value) : "";
  const match = raw.match(/(\d+)(.*)/);

  // If no digits at all, just render the raw string with no animation
  if (!match) {
    return <span>{raw}</span>;
  }

  const target = parseInt(match[1], 10) || 0;
  const suffix = match[2] || "";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (target === 0) {
      setDisplay(0);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();

            const tick = (now) => {
              const progress = Math.min((now - start) / duration, 1);
              setDisplay(Math.floor(progress * target));
              if (progress < 1) {
                requestAnimationFrame(tick);
              }
            };

            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [target, duration]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
};

const LinkPro = ({ cardData, hiddenFields = [], cardId }) => {
  const { user, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showUnsaveModal, setShowUnsaveModal] = useState(false);
  const [isCardSaved, setIsCardSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [activeTab, setActiveTab] = useState("services"); // 'services' or 'products'
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [openDesktopView, setOpenDesktopView] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [activeGalleryCategoryIndex, setActiveGalleryCategoryIndex] =
    useState(0);
  const [catalogueDownloading, setCatalogueDownloading] = useState(false);
  const [vcfModalOpen, setVcfModalOpen] = useState(false);
  const [vcfSubmitting, setVcfSubmitting] = useState(false);
  const [vcfError, setVcfError] = useState("");
  const verifiedLottieRef = useRef(null);
  const likeLottieRef = useRef(null);

  const handleOpenDesktopView = () => {
    if (window.innerWidth > 768) {
      setOpenDesktopView(true);
      console.log(window.innerWidth, "window.innerWidth");
    } else {
      setOpenDesktopView(false);
    }
  };

  useEffect(() => {
    handleOpenDesktopView();
  }, []);

  const handleToggleLike = () => {
    // Play like animation from start on each click
    const inst = likeLottieRef.current;
    const anim = inst?.animationItem;
    if (anim) {
      anim.stop();
      anim.goToAndPlay(0, true);
    }

    const effectiveCardId = cardId || cardData?._id || cardData?.cardId;
    const next = !isLiked;
    setIsLiked(next);

    if (!effectiveCardId) return;

    fetch(`/api/cards/${effectiveCardId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta: next ? 1 : -1 }),
    }).catch(() => {
      // ignore analytics errors
    });
  };

  const handleShare = async () => {
    try {
      const data = cardData || {};
      const effectiveCardId = cardId || data._id || data.cardId;

      // Get company name from multiple possible locations
      const companyName =
        data.CompanyName ||
        data.companyName ||
        data.storeName ||
        data.name ||
        "Business";

      // Get shareable link for the card page
      let shareableLink = "";
      if (data.shareableLink) {
        shareableLink = data.shareableLink;
      } else if (data.publicUrl) {
        shareableLink = data.publicUrl;
      } else if (effectiveCardId) {
        // Construct shareable link from cardId
        const frontendUrl = window.location.origin || "https://visitinglink.com";
        shareableLink = `${frontendUrl}/cards/${effectiveCardId}`;
      } else {
        // Fallback to current URL if no cardId available
        shareableLink = window.location.href;
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: `${companyName}'s Digital Business Card`,
            text: `Check out ${companyName}'s digital business card`,
            url: shareableLink,
          });
        } catch (err) {
          // User cancelled or error occurred, fall through to clipboard
          if (err.name !== "AbortError") {
            // Only fallback if it's not a user cancellation
            try {
              await navigator.clipboard.writeText(shareableLink);
              alert("Link copied to clipboard!");
            } catch (clipboardErr) {
              console.error("Error copying to clipboard:", clipboardErr);
            }
          }
        }
      } else {
        // Fallback: copy to clipboard
        try {
          await navigator.clipboard.writeText(shareableLink);
          alert("Link copied to clipboard!");
        } catch (err) {
          console.error("Error copying to clipboard:", err);
          // Last resort: show the link in an alert
          alert(`Share this link: ${shareableLink}`);
        }
      }

      // Best-effort: increment share count on server (ignore failures)
      if (effectiveCardId) {
        try {
          await fetch(`/api/cards/${effectiveCardId}/share`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          // Silently ignore share count errors
        }
      }
    } catch (e) {
      console.error("Error in handleShare:", e);
    }
  };

  const downloadVcfBlob = () => {
    try {
      const data = cardData || {};
      const effectiveCardId = cardId || data._id || data.cardId;

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

      const targetOrigin = "https://www.visitinglink.com";
      let shareableLink = "";

      if (data.shareableLink) {
        shareableLink = data.shareableLink;
      } else if (data.publicUrl) {
        shareableLink = data.publicUrl;
      } else if (effectiveCardId) {
        shareableLink = `${targetOrigin}/cards/${effectiveCardId}`;
      }

      if (shareableLink) {
        try {
          const parsed = new URL(shareableLink);
          shareableLink = `${targetOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
        } catch {
          if (effectiveCardId) {
            shareableLink = `${targetOrigin}/cards/${effectiveCardId}`;
          }
        }
      }

      let city = "";
      let address = "";
      if (Array.isArray(data.headquarters) && data.headquarters.length > 0) {
        city = data.headquarters[0].city || "";
        address = data.headquarters[0].address || "";
      }

      const escapeVal = (val) => {
        if (!val) return "";
        return val
          .toString()
          .replace(/\\/g, "\\\\")
          .replace(/,/g, "\\,")
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
    const effectiveCardId = cardId || cardData?._id || cardData?.cardId;
    if (!effectiveCardId) {
      downloadVcfBlob();
      return;
    }
    setVcfModalOpen(true);
  };

  const handleVcfLeadConfirm = async ({ name, phone, purpose }) => {
    const effectiveCardId = cardId || cardData?._id || cardData?.cardId;
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

  const handleDownloadCatalogue = async () => {
    const effectiveCardId = cardId || cardData?._id || cardData?.cardId;
    const catalogueUrl = cardData?.catalogue;
    if (!catalogueUrl) return;
    // Always use backend proxy so PDF is served with correct type (avoids CORS / "file" download)
    const url = effectiveCardId
      ? `/api/cards/${effectiveCardId}/catalogue`
      : `/api/cards/catalogue?url=${encodeURIComponent(catalogueUrl)}`;
    setCatalogueDownloading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch catalogue");
      const blob = await res.blob();
      const pdfBlob = new Blob([blob], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "catalogue.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (e) {
      console.error("Catalogue download failed:", e);
      if (cardData?.catalogue)
        window.open(cardData.catalogue, "_blank", "noopener,noreferrer");
    } finally {
      setCatalogueDownloading(false);
    }
  };

  const handleShopLinkClick = async (shopUrl, shopName) => {
    const effectiveCardId = cardId || cardData?._id || cardData?.cardId;
    
    // Track the click (best-effort, don't block navigation)
    if (effectiveCardId && shopName) {
      fetch(`/api/cards/${effectiveCardId}/shoplink-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName }),
      }).catch(() => {
        // ignore analytics errors
      });
    }
    
    // Open the shop link
    window.open(shopUrl, "_blank", "noopener,noreferrer");
  };

  const getFieldValue = (fieldName, fallback = "Not provided") => {
    const value = cardData[fieldName];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return fallback;
    }
    return !value || value === "" ? fallback : value;
  };

  const isFieldHidden = (fieldName) => hiddenFields.includes(fieldName);
  const isFieldEmpty = (fieldName) =>
    !cardData[fieldName] || cardData[fieldName] === "";

  const ContactButton = ({ icon: Icon, label, href, isExternal = false }) => {
    if (!href || href === "Not provided" || href === "") return null;

    return (
      <a
        href={href}
        target={isExternal ? "_blank" : "_self"}
        rel={isExternal ? "noopener noreferrer" : ""}
        className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
      >
        {Icon && <Icon className="h-4 w-4" />}
        <span>{label}</span>
      </a>
    );
  };

  const [isApptOpen, setIsApptOpen] = React.useState(false);
  const effectiveCardId = cardId || cardData?._id || cardData?.cardId;

  useEffect(() => {
    if (isAuthenticated && user) {
      if (
        !user?.isAdmin &&
        user?.role !== "admin" &&
        user?.role !== "superadmin"
      ) {
        checkIfCardSaved();
      }
    }
  }, [isAuthenticated, user, cardId]);

  const checkIfCardSaved = async () => {
    try {
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

    if (
      user?.isAdmin ||
      user?.role === "admin" ||
      user?.role === "superadmin"
    ) {
      setShowAdminModal(true);
      return;
    }

    if (isCardSaved) {
      setShowUnsaveModal(true);
      return;
    }

    setSaving(true);
    try {
      await saveCard(cardId);
      setIsCardSaved(true);
      alert("Card saved successfully!");
    } catch (error) {
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
      alert("Failed to remove card. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAuthSuccess = async (userData, cardIdToSave) => {
    try {
      await saveCard(cardIdToSave);
      setIsCardSaved(true);
      alert("Card saved successfully!");
    } catch (error) {
      alert("Failed to save card. Please try again.");
    }
  };

  // Extract YouTube video ID
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // const getMapEmbedLink = (url) => {
  //   if (!url) return null;
  //   const regExp =
  //     /^.*(maps.google.com\/maps\/embed\?pb=!1m18!1m12!1m3!1d[^#&?]*).*/;
  //   const match = url.match(regExp);
  //   return match && match[2].length === 11 ? match[2] : null;
  // };

  return (
    <>
      {cardData.forDesktop && openDesktopView ? (
        <>
          {/* DesktopView */}
          <div className="bg-[#ffffff] border-0 w-[70rem] mx-auto rounded-[2.5rem] overflow-hidden" style={{ boxShadow: "0 -2px 16px 0 rgba(0, 0, 0, 0.1)" }}>
            {/* Header Section */}
            <div className="flex flex-col items-center justify-center gap-4 mb-6 px-4 relative z-20 mt-0">
              <div className="absolute top-6 left-6 z-10 flex flex-col items-center gap-3">
                <div className="flex flex-col items-center justify-center gap-0">
                  <button
                    type="button"
                    onClick={handleToggleLike}
                    className="flex items-center justify-center"
                  >
                    <Lottie
                      lottieRef={likeLottieRef}
                      animationData={likeAnimation}
                      loop={false}
                      autoplay={false}
                      className="max-w-14 max-h-14"
                      onDOMLoaded={() => {
                        const inst = likeLottieRef.current;
                        const anim = inst?.animationItem;
                        if (!anim) return;
                        const total = anim.totalFrames || 0;
                        if (total > 0) {
                          // Show last frame as the idle state
                          anim.goToAndStop(total - 1, true);
                        }
                      }}
                    />
                  </button>
                  <span className="text-xs text-black -mt-3">Like</span>
                </div>
                <a href={`https://wa.me/${getFieldValue(
                  "whatsappNumber",
                  ""
                ).replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1"
                >
                  <img src="/whatsapp.svg" alt="WhatsApp" className="w-10 h-10" />
                  <span className="text-xs text-black">DM us</span>
                </a>
              </div>
              <div className="absolute top-6 right-6 z-10 flex items-center gap-5">
                <button
                  onClick={handleShare}
                  className="bg-black text-white px-4 py-2 rounded-xl text-[15px] flex items-center gap-3"
                >
                  <img src="/share.svg" alt="Share" className="w-4 h-4" />
                  <span>Share Card</span>
                </button>
                {/* <button
                  className="bg-[#234ec4] text-white px-4 py-2 rounded-xl text-[15px] flex items-center gap-3"
                  onClick={() => setIsApptOpen(true)}
                >
                  <img src="/calender.svg" alt="Share" className="w-4 h-4" />
                  Book Appointment
                </button> */}
              </div>
              <div className="flex items-center justify-center gap-4 absolute top-36">
                {cardData.leftBgImage && (
                  <img
                    src={cardData.leftBgImage}
                    alt="Left Background Image"
                    className="w-1/2 h-full object-cover"
                  />
                )}
                {cardData.rightBgImage && (
                  <img
                    src={cardData.rightBgImage}
                    alt="Right Background Image"
                    className="w-1/2 h-full object-cover"
                  />
                )}
              </div>
              <div className="absolute top-[23rem] left-1/2 -translate-x-1/2 w-[60%] h-[32rem] bg-gradient-to-b from-[#77A4E0] via-[#ffffff] to-[#ffffff00] rounded-[100%] -z-10 opacity-20"></div>

              {!isFieldHidden("logo") && cardData.logo && (
                <div className="relative">
                  <div className="w-52 h-52 rounded-full overflow-hidden bg-gradient-to-b from-[#40499E] via-[#ffffff] to-[#ffffff] flex items-center justify-center p-1 mt-56">
                    <img
                      src={cardData.logo}
                      alt="Logo"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  {cardData.logo && (
                  <div className="absolute top-[22.5rem] left-[9rem] w-16 h-16">
                    <Lottie
                      lottieRef={verifiedLottieRef}
                      animationData={verifiedAnimation}
                      loop={true}
                    />
                  </div>
                  )}
                </div>

              )}

              <p className="text-2xl font-semibold">{getFieldValue("CompanyName", "Company Name")}</p>
              <div className="text-center">
                <h3 className="text-[64px] leading-[1] pb-2 font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#151213] to-[#524EDA] my-4 max-w-xl mx-auto">
                  {cardData.heading}
                </h3>

                <p className="text-2xl font-medium text-black mx-auto my-10"><span className="font-bold">BUSINES CATEGORY :</span> {cardData.businessCategory} </p>

              </div>

              <div className="flex items-center justify-center gap-6 mb-6 mt-3">

                {!isFieldHidden("phoneNumber") && (
                  <a
                    href={`tel:${getFieldValue("phoneNumber", "")}`}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-[22px] hover:bg-gray-900 transition-colors text-sm"
                  >
                    <FontAwesomeIcon icon={faPhone} className="w-6 h-6" />
                    <span className="text-2xl">Call Us</span>
                  </a>
                )}

                {!isFieldHidden("whatsappNumber") && (
                  <a
                    href={`https://wa.me/${getFieldValue(
                      "whatsappNumber",
                      ""
                    ).replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-[22px] hover:bg-green-700 transition-colors text-sm"
                  >
                    <img src="/message.png" alt="WhatsApp" className="w-6 h-6" />
                    <span className="text-2xl">Queries</span>
                  </a>
                )}

                {!isFieldHidden("email") && (
                  <a
                    href={`mailto:${getFieldValue("email", "")}`}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-black text-white rounded-[22px] hover:bg-gray-900 transition-colors text-sm"
                  >
                    <FontAwesomeIcon icon={faEnvelope} className="w-6 h-6" />
                    <span className="text-2xl">Email</span>
                  </a>
                )}
              </div>
            </div>

            {!isFieldHidden("tagline") && (
              <p
                className={`mt-4 text-xl text-center leading-tight max-w-lg mx-auto ${isFieldEmpty("tagline")
                  ? "text-gray-400 italic"
                  : "text-gray-600"
                  }`}
              >
                {getFieldValue("tagline", "Tagline")}
              </p>
            )}

            {/* Social Links Section */}
            {!isFieldHidden("socialLinks") && cardData.socialLinks && (
              <div className="mb-6 mt-12 px-4">
                <h4 className="text-center text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#355FB3] to-[#151213] mb-4 flex items-center justify-center gap-2">
                  <span className="text-6xl text-[#6D63F5]">#</span>
                  All Social Media links
                </h4>
                <div className="mt-12 flex items-center overflow-x-auto scrollbar gap-4 max-w-3xl mx-auto pb-3">
                  {cardData.socialLinks.instagram && (
                    <a
                      href={cardData.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center w-[110px] h-[110px] shrink-0 rounded-2xl bg-[#0866FF]"
                    >
                      {/* <Instagram className="w-10 h-10" /> */}
                      <img
                        src="/icons/insta.png"
                        alt="Instagram"
                        className="w-full h-full object-contain"
                      />
                      {/* <span className="text-[12px] font-light">Instagram</span> */}
                    </a>
                  )}
                  {cardData.socialLinks.linkedin && (
                    <a
                      href={cardData.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center w-[110px] h-[110px] shrink-0 rounded-2xl bg-[#0A66C2]"
                    >
                      {/* <Linkedin className="w-10 h-10" /> */}
                      <img
                        src="/icons/li.png"
                        alt="LinkedIn"
                        className="w-full h-full object-contain"
                      />
                      {/* <span className="text-sm font-light">LinkedIn</span> */}
                    </a>
                  )}
                  {cardData.socialLinks.facebook && (
                    <a
                      href={cardData.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center w-[110px] h-[110px] shrink-0 rounded-2xl bg-[#0866FF]"
                    >
                      {/* <Facebook className="w-10 h-10" /> */}
                      <img
                        src="/icons/fb.png"
                        alt="Facebook"
                        className="w-full h-full object-contain"
                      />
                      {/* <span className="text-sm font-light">Facebook</span> */}
                    </a>
                  )}
                  {cardData.socialLinks.twitter && (
                    <a
                      href={cardData.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center w-[110px] h-[110px] shrink-0 rounded-2xl bg-[#1F2126]"
                    >
                      {/* <Twitter className="w-10 h-10" /> */}
                      <img
                        src="/icons/x.png"
                        alt="Twitter"
                        className="w-full h-full object-contain"
                      />
                      {/* <span className="text-sm font-light">Twitter</span> */}
                    </a>
                  )}
                  {cardData.socialLinks.youtube && (
                    <a
                      href={cardData.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center justify-center w-[110px] h-[110px] shrink-0 rounded-2xl bg-[#F50100]"
                    >
                      {/* <Youtube className="w-10 h-10" /> */}
                      <img
                        src="/icons/yt.png"
                        alt="YouTube"
                        className="w-full h-full object-contain"
                      />
                      {/* <span className="text-sm font-light">YouTube</span> */}
                    </a>
                  )}
                  {cardData.socialLinks.behance && (
                    <a
                      href={cardData.socialLinks.behance}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center flex-col justify-center gap-1 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors w-[110px] h-[110px] shrink-0"
                    >
                      <img src="/icons/behance-icon.svg" alt="Behance" className="w-14 h-14 mt-3" />
                      <span className="text-[10px] font-semibold">Behance</span>
                    </a>
                  )}
                  {cardData.socialLinks.pinterest && (
                    <a
                      href={cardData.socialLinks.pinterest}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center flex-col justify-center gap-1 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors w-[110px] h-[110px] shrink-0"
                    >
                      {/* <img src="/icons/pinterest-icon.svg" alt="Pinterest" className="w-28 h-28" /> */}
                      <img src="/icons/pinterest-icon.svg" alt="Pinterest" className="w-14 h-14 mt-3 mb-1" />
                      <span className="text-[10px] font-semibold">Pinterest</span>
                    </a>
                  )}
                  {cardData.socialCustomButtons
                    .slice(0, 2)
                    .map((btn, idx) => {
                      if (!btn || (!btn.text && !btn.url && !btn.icon))
                        return null;
                      return (
                        <a
                          key={idx}
                          href={btn.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`overflow-hidden flex flex-col items-center justify-center gap-2 w-[110px] h-[110px] shrink-0 text-white rounded-2xl transition-colors text-sm`}
                        >
                          {btn.icon && (
                            <img
                              src={btn.icon}
                              alt={btn.text || `Custom Button ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {/* <span className="text-[10px] font-semibold">{btn.text || "Custom Link"}</span> */}
                        </a>
                      );
                    })}

                  {!isFieldHidden("shopLinks") &&
                    Array.isArray(cardData.shopLinks) &&
                    cardData.shopLinks.length > 0 && (
                      <>
                        {cardData.shopLinks.map((shop, idx) => (
                          <a
                            key={idx}
                            href={shop.url}
                            onClick={(e) => {
                              e.preventDefault();
                              handleShopLinkClick(shop.url, shop.label || shop.shopname || `shop-${idx}`);
                            }}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`overflow-hidden flex flex-col items-center justify-center gap-1 w-[110px] h-[110px] shrink-0 text-white rounded-2xl transition-colors text-[10px] font-semibold
                     
                      `}
                          >
                            {shop.icon && (
                              <div className="w-full h-full object-cover">
                                <img
                                  src={shop.icon}
                                  alt="Shop Icon"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            {/* {shop.label || "Shop Link"} */}
                          </a>
                        ))}
                      </>
                    )}

                </div>

              </div>
            )}


            <div className="relative">
              <div className="absolute top-0 -left-14 w-[120%] h-[50rem] bg-gradient-to-t from-[#92B3DE] to-[#ffffff] z-0 opacity-50"></div>
              {/* Shop Links Section */}
              {/* {!isFieldHidden("shopLinks") &&
                Array.isArray(cardData.shopLinks) &&
                cardData.shopLinks.length > 0 && (
                  <div className="w-[90%] mx-auto mb-6 mt-20 px-4 relative z-10">
                    
                    <div className="flex flex-wrap gap-4">
                      {cardData.shopLinks.map((shop, idx) => (
                        <a
                          key={idx}
                          href={shop.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex flex-col items-center justify-center gap-1 px-4 py-2 w-[110px] text-white rounded-lg transition-colors text-sm font-medium
                          ${idx === 0 ? "bg-blue-700" : "bg-red-600"}
                          `}
                        >
                          {shop.icon && (
                            <div className="w-16 h-16">
                              <img
                                src={shop.icon}
                                alt="Shop Icon"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                          {shop.label || "Shop Link"}
                        </a>
                      ))}
                    </div>
                  </div>
                )} */}

              {/* Catalogue Section */}
              {!isFieldHidden("catalogue") && cardData.catalogue && (
              <div className="mb-20 mt-24 pt-4 px-4 relative z-10 max-w-2xl mx-auto">
                <div className="flex items-center justify-center border border-black rounded-[30px] px-4 py-6">
                  <h4 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-[#151213] to-[#524EDA] flex items-center gap-2 mb-4 w-fit">
                    Download our Catalogue
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCatalogue}
                  disabled={catalogueDownloading}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-black text-white rounded-xl w-fit mx-auto -mt-5 disabled:cursor-not-allowed"
                >
                  {catalogueDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span className="text-sm">{catalogueDownloading ? "Downloading..." : "Download Now"}</span>
                </button>
              </div>
            )}


              {cardData.vission && (
                <div className="py-2 px-4 flex items-center justify-center gap-4 w-[90%] mx-auto mt-20 mb-12 relative z-10">
                  <div className="text-[32px] leading-[1.25] font-bold text-black min-w-48">
                    Vision <br /> & Mission
                    <div className="h-[6px] w-12 bg-black mt-1 rounded-full"></div>
                  </div>
                  <p className="text-[16px] leading-[1.45] text-black">{cardData.vission}</p>
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-900 mt-1 text-left w-[28rem]">
                    <p>
                      {cardData.foundedYear && !isNaN(Number(cardData.foundedYear)) ? (
                        <>
                          <span className="font-bold text-[65px] leading-[1]">
                            {new Date().getFullYear() - Number(cardData.foundedYear)}
                          </span>{" "}

                        </>
                      ) : (
                        ""
                      )}
                    </p>
                    <p className="text-left text-sm"><span className="font-bold text-[32px]">Years</span> <br />
                      Founded in<span className="font-bold"> {cardData.foundedYear}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Founder and Company Info Section */}
              {/* Layer the box above the gradient using higher z-index and proper relative/absolute context */}
              <div className="w-[90%] mx-auto p-0 relative flex justify-center z-20">
                <div className="shadow-2xl rounded-[45px] p-10 w-full bg-white relative z-20">
                  <div className="flex flex-row-reverse items-start justify-center gap-16">
                    <div className="w-[50%]">
                      {/* Company Info Section */}
                      {!isFieldHidden("companyInfo") && (
                        <div className="py-4 px-4">
                          <h4 className="text-[32px] font-bold text-black mb-4 text-left">
                            Company Info
                          </h4>
                          <p
                            className={`text-sm text-left font-light ${isFieldEmpty("companyInfo")
                              ? "text-gray-400 italic"
                              : "text-gray-900"
                              }`}
                          >
                            {getFieldValue("companyInfo", "Not provided")}
                          </p>
                        </div>
                      )}

                      {/* Our Numbers Section */}
                      {!isFieldHidden("ourNumbers") &&
                        Array.isArray(cardData.ourNumbers) &&
                        cardData.ourNumbers.length > 0 && (
                          <div className="pr-3 mt-4">
                            <div className="grid grid-cols-3 gap-4">
                              {cardData.ourNumbers.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="text-left border-2 border-black rounded-[20px] px-4 py-4"
                                >
                                  {item.icon && (
                                    <div className="w-8 h-8 mb-2">
                                      <img
                                        src={item.icon}
                                        alt="Icon"
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                  )}
                                  <p className="text-2xl font-bold text-black">
                                    <AnimatedNumber value={item.number || 0} />
                                  </p>
                                  <p className="text-xs text-black">
                                    {item.description || "Description"}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                    <div className="w-[50%]">
                      {/* Founder Section */}
                      {!isFieldHidden("founderName") &&
                        (cardData.founderName ||
                          cardData.founderImage ||
                          cardData.founderDescription ||
                          cardData.founderMessage ||
                          cardData.vission) && (
                          <div className="mb-6 pt-4 px-4">
                            <div className="flex items-center justify-center gap-8 mb-8">
                              {cardData.founderImage && (
                                <div className="w-44 h-44 rounded-[32px] overflow-hidden border-[3px] border-[#6B68CE]">
                                  <img
                                    src={cardData.founderImage}
                                    alt="Founder"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                {cardData.founderName && (
                                  <h5 className="text-[32px] font-bold text-black mb-1 text-2xl leading-[1.1]">
                                    {cardData.founderName}
                                  </h5>
                                )}
                                {cardData.founderPost && (
                                  <h5 className="text-[20px] font-bold text-black mb-2 text-2xl leading-[1.1]">
                                    {cardData.founderPost}
                                  </h5>
                                )}
                                {!isFieldHidden("founderDescription") && (
                                  <p
                                    className={`text-xl leading-[1.45] font-bold ${isFieldEmpty("founderDescription")
                                      ? "text-black italic"
                                      : "text-black"
                                      }`}
                                  >
                                    {getFieldValue(
                                      "founderDescription",
                                      "Not provided"
                                    )}
                                  </p>
                                )}

                                <p className="text-sm text-gray-900 mt-1 text-left">@{cardData.CompanyName}</p>
                              </div>
                            </div>

                            {cardData.founderMessage && (
                              <div className="py-0 px-1">
                                <p className="text-xl font-bold text-gray-900 mb-3 text-left">
                                  Founder Message
                                </p>
                                <p className="text-sm font-light">
                                  {cardData.founderMessage}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-8 my-6">
                    {/* Map Embed Section */}
                    {!isFieldHidden("mapEmbedLink") && cardData.mapEmbedLink && (
                      <div className="w-[40%]">
                        {/* <h4 className="text-2xl text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#151213] to-[#524EDA] mb-4">
                      We are located at{" "}
                    </h4> */}
                        <div className="rounded-3xl overflow-hidden max-w-96 mx-auto">
                          <iframe
                            src={cardData.mapEmbedLink}
                            width="100%"
                            height="200"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />

                          <div className="mt-6 flex gap-6 justify-center">
                            {cardData.appStoreUrl && (
                              <a
                                href={cardData.appStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:scale-105 transition-transform"
                              >
                                <img
                                  src="/apple-download.svg"
                                  alt="App Store"
                                  className="h-10"
                                />
                              </a>
                            )}
                            {cardData.playStoreUrl && (
                              <a
                                href={cardData.playStoreUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:scale-105 transition-transform"
                              >
                                <img
                                  src="/g-play-download.svg"
                                  alt="Play Store"
                                  className="h-10"
                                />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Headquarters Section */}
                    {!isFieldHidden("headquarters") &&
                      Array.isArray(cardData.headquarters) &&
                      cardData.headquarters.length > 0 && (
                        <div className="w-[60%] mb-8">
                          <div className="relative">
                            <div className="flex gap-4 overflow-x-auto pb-4 pr-16 scrollbar">
                              {cardData.headquarters.map((hq, idx) => (
                                <div
                                  key={idx}
                                  className="rounded-lg p-0 min-w-[18rem] flex items-center justify-start overflow-x-auto gap-4"
                                >
                                  <img
                                    src="/location-pin.png"
                                    alt="Location Icon"
                                    className="w-[6rem]"
                                  />
                                  <div>
                                    <h5 className="font-semibold text-gray-900 mb-2 text-xl leading-[1.25]">
                                      {hq.city || "City"}
                                    </h5>
                                    <p className="text-[12px] text-[#151213] mb-3 leading-[1.15]">
                                      {hq.address || "Address"}
                                    </p>
                                    {hq.mapUrl && (
                                      <a
                                        href={hq.mapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className=""
                                      >
                                        <img src="/get-directions.svg" alt="Map Pin" className="h-[1.5rem]" />

                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center pl-8 pr-2 bg-gradient-to-l from-[#ffffff] via-[#ffffff] to-[#ffffff00] h-full">
                              <img
                                src="/testimonial-arrow.png"
                                alt="Location Icon"
                                className="w-4 h-4 rotate-180"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>




            {/* Services and Products Section with Tabs */}
            {(() => {
              const hasServices =
                !isFieldHidden("ourServices") &&
                Array.isArray(cardData.ourServices) &&
                cardData.ourServices.length > 0;
              const hasProducts =
                !isFieldHidden("ourProducts") &&
                Array.isArray(cardData.ourProducts) &&
                cardData.ourProducts.length > 0;
              const showTabs = hasServices && hasProducts;

              // Determine heading based on what's available
              const getHeading = () => {
                if (hasServices && hasProducts) {
                  return "What we offer";
                } else if (hasServices) {
                  return "Services we Offer";
                } else if (hasProducts) {
                  return "Our Products";
                }
                return "";
              };

              if (!hasServices && !hasProducts) return null;

              return (
                <div className="mb-6 pt-4 mt-16">
                  <h4 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#151213] to-[#524EDA] mb-14 flex items-center justify-center gap-2 w-fit mx-auto">
                    {getHeading()}
                  </h4>

                  {/* Tabs - Only show if both services and products exist */}
                  {showTabs && (
                    <div className="flex justify-center gap-6 mb-4 px-4">
                      <button
                        onClick={() => setActiveTab("services")}
                        className={`text-lg px-6 py-1.5 rounded-full font-medium transition-all ${activeTab === "services"
                          ? "bg-[#212121] text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                      >
                        Services
                      </button>
                      <button
                        onClick={() => setActiveTab("products")}
                        className={`text-lg px-6 py-1.5 rounded-full font-medium transition-all ${activeTab === "products"
                          ? "bg-[#212121] text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                      >
                        Products
                      </button>
                    </div>
                  )}

                  {/* Services Content */}
                  {hasServices && (!showTabs || activeTab === "services") && (
                    <div className="flex gap-8 pt-10 pb-16 px-12 overflow-x-auto scrollbar-hide">
                      {cardData.ourServices.map((service, idx) => (
                        <div
                          key={idx}
                          className="bg-[#ffffff] shadow-2xl rounded-[60px] py-12 px-12 min-w-[375px]"
                        >
                          <p className="text-3xl font-semibold bg-[#0092FE] text-white rounded-full w-14 h-14 flex items-center justify-center">
                            {idx + 1}
                          </p>
                          <h5 className="font-semibold text-black mb-4 mt-7 text-[26px] leading-[1.25]">
                            {service.title || "Service Title"}
                          </h5>
                          <p className="text-base leading-[1.45] text-black">
                            {service.description || "Service description"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Products Content */}
                  {hasProducts && (!showTabs || activeTab === "products") && (
                    <div className="flex overflow-x-auto scrollbar-hide gap-4 px-12 pb-12 pt-4">
                      {cardData.ourProducts.map((product, idx) => (
                        <div
                          key={idx}
                          className="p-3 min-w-[370px] bg-white border border-gray-200 rounded-[34px] overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          {product.image && (
                            <div className="w-full h-64 rounded-[32px] overflow-hidden">
                              <img
                                src={product.image}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="px-2 pt-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <h5 className="font-semibold text-black text-xl">
                                {product.title || "Product Title"}
                              </h5>

                              {product.rating && (
                                <div className="flex items-center gap-0.5">
                                  {(() => {
                                    const ratingValue =
                                      Number(product.rating) || 0;
                                    return Array.from({ length: 5 }).map(
                                      (_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-3 w-3 ${i < ratingValue
                                            ? "text-yellow-400 fill-yellow-400"
                                            : "text-gray-300"
                                            }`}
                                        />
                                      )
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                            {product.description && (
                              <p className="text-[14px] leading-tight text-gray-600 mb-2">
                                {product.description}
                              </p>
                            )}

                            {/* Price row */}
                            <div className="flex items-center justify-between mb-1">
                              {product.price && (
                                <p className="text-black font-bold text-base">
                                  Rs.{product.price}
                                </p>
                              )}

                              {/* Buy button row */}
                              {product.link && (
                                <div className="flex justify-end">
                                  <a
                                    href={product.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-white bg-[#000000] rounded-full px-2 py-1"
                                  >
                                    Buy Now
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}


            {/* Testimonial and our clients section */}
            <div>
              <h4 className="text-3xl font-bold text-black mb-4 mx-auto gap-2 text-center px-4 max-w-xl">
                Trusted By the Worlds Fastest Growing company
              </h4>

              <div className="flex items-center justify-center gap-4 mx-10 mt-16">
                <div className="w-1/2">
                  {/* Our Clients Section */}
                  {!isFieldHidden("ourClients") &&
                    Array.isArray(cardData.ourClients) &&
                    cardData.ourClients.length > 0 && (
                      <div className="my-6 px-6">
                        {(() => {
                          const clients = cardData.ourClients;
                          const mid = Math.ceil(clients.length / 2);
                          const firstRow = clients.slice(0, mid);
                          const secondRow = clients.slice(mid);

                          return (
                            <div className="space-y-2">
                              {/* First row */}
                              <div className="flex overflow-x-auto gap-3 pb-1 scrollbar-hide">
                                {firstRow.map((client, idx) => (
                                  <div
                                    key={`row1-${idx}`}
                                    className="h-20 w-32 flex-shrink-0 overflow-hidden"
                                  >
                                    {client.image && (
                                      <img
                                        src={client.image}
                                        alt={`Client ${idx + 1}`}
                                        className="w-full h-full object-contain"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                              {/* Second row */}
                              {secondRow.length > 0 && (
                                <div className="flex overflow-x-auto gap-3 pb-1 scrollbar-hide">
                                  {secondRow.map((client, idx) => (
                                    <div
                                      key={`row2-${idx}`}
                                      className="h-20 w-32 flex-shrink-0 overflow-hidden"
                                    >
                                      {client.image && (
                                        <img
                                          src={client.image}
                                          alt={`Client ${mid + idx + 1}`}
                                          className="w-full h-full object-contain"
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                </div>
                <div className="w-1 h-36 bg-gradient-to-t from-[#746868] via-[#DAC4C4] to-[#DAC4C4] rounded-full" />
                <div className="w-1/2 pl-4">
                  {/* Testimonials Section */}
                  {!isFieldHidden("testimonials") &&
                    Array.isArray(cardData.testimonials) &&
                    cardData.testimonials.length > 0 && (
                      <div className="">
                        <div className="relative">
                          {/* Left Arrow */}
                          {/* {cardData.testimonials.length > 1 && (
                            <button
                              onClick={() =>
                                setTestimonialIndex((prev) =>
                                  prev === 0
                                    ? cardData.testimonials.length - 1
                                    : prev - 1
                                )
                              }
                              className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
                              aria-label="Previous testimonial"
                            >
                              <img
                                src="/testimonial-arrow.png"
                                alt="Previous testimonial"
                                className="h-4 w-4"
                              />
                            </button>
                          )} */}

                          {/* Testimonial Content */}
                          <div className="overflow-hidden mr-8">
                            <div
                              className="flex transition-transform duration-300 ease-in-out"
                              style={{
                                transform: `translateX(calc(-100% * ${testimonialIndex}))`,
                              }}
                            >
                              {cardData.testimonials.map((testimonial, idx) => (
                                <div
                                  key={idx}
                                  className="flex-shrink-0"
                                  style={{
                                    flex: "0 0 100%",
                                    width: "100%",
                                  }}
                                >
                                  <div className="flex items-center gap-6 mb-2 px-6">
                                    {testimonial.image && (
                                      <div className="rounded-full overflow-hidden flex-shrink-0">
                                        <img
                                          src={testimonial.image}
                                          alt={testimonial.name}
                                          className="w-40 h-40 object-cover"
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <p className="text-[14px] leading-[1.45] text-gray-700 italic">
                                        "
                                        {testimonial.reviewText ||
                                          "Great service!"}
                                        "
                                      </p>
                                      <p className="font-medium text-base mt-2 text-gray-900">
                                        {testimonial.name || "Customer"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Right Arrow */}
                          {cardData.testimonials.length > 1 && (
                            <button
                              onClick={() =>
                                setTestimonialIndex((prev) =>
                                  prev === cardData.testimonials.length - 1
                                    ? 0
                                    : prev + 1
                                )
                              }
                              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2"
                              aria-label="Next testimonial"
                            >
                              <img
                                src="/testimonial-arrow.png"
                                alt="Previous testimonial"
                                className="h-4 w-4 rotate-180"
                              />
                            </button>
                          )}

                          {/* Dots Indicator */}
                          {/* {cardData.testimonials.length > 1 && (
                            <div className="flex justify-center gap-2 mt-4">
                              {cardData.testimonials.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setTestimonialIndex(idx)}
                                  className={`h-2 rounded-full transition-all ${idx === testimonialIndex
                                    ? "w-6 bg-[#0092FE]"
                                    : "w-2 bg-gray-300"
                                    }`}
                                  aria-label={`Go to testimonial ${idx + 1}`}
                                />
                              ))}
                            </div>
                          )} */}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>


            {/* Banner Section */}
            {!isFieldHidden("banner") &&
              cardData.banner &&
              (() => {
                return (
                  <div className="mb-16 mt-12 max-w-[90%] mx-auto">
                    <a href={cardData.bannerLink} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                      <img src={cardData.banner} alt="Banner" className="w-full h-full object-cover" />
                    </a>
                  </div>
                );
              })()}
            {/* Why Choose Us Section */}
            {!isFieldHidden("whyChooseUs") &&
              Array.isArray(cardData.whyChooseUs) &&
              cardData.whyChooseUs.length > 0 && (
                <div className="mb-24 mt-8 pt-8 w-[90%] mx-auto">
                  <h4 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#151213] to-[#524EDA] mb-8 text-center w-fit mx-auto">
                    Why Choose Us ?
                  </h4>
                  <div className="flex flex-wrap items-center justify-center gap-8">
                    {cardData.whyChooseUs.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-start gap-2"
                      >
                        <span className="bg-[#2196F3] text-white rounded-full p-1 inline-block">
                          <Check className="h-4 w-4" />
                        </span>
                        {/* <h5 className="font-semibold text-gray-900 mb-1">{item.title}</h5> */}
                        <p className="text-[18px] text-black">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Gallery Images Section */}
            {!isFieldHidden("galleryImages") &&
              (Array.isArray(cardData.galleryImages) && cardData.galleryImages.length > 0 ||
                (Array.isArray(cardData.galleryCategories) && cardData.galleryCategories.some(
                  (cat) => cat && Array.isArray(cat.images) && cat.images.length > 0
                ))) &&
              (() => {
                let galleryCategories = Array.isArray(cardData.galleryCategories)
                  ? cardData.galleryCategories.filter(
                    (cat) =>
                      cat &&
                      Array.isArray(cat.images) &&
                      cat.images.length > 0
                  )
                  : [];
                // Fallback: show gallery from flat galleryImages when no categories
                if (galleryCategories.length === 0 && Array.isArray(cardData.galleryImages) && cardData.galleryImages.length > 0) {
                  galleryCategories = [{
                    category: "Gallery",
                    images: cardData.galleryImages.map((url) => ({ image: typeof url === "string" ? url : url?.url || url?.image })),
                  }].filter((cat) => cat.images.some((img) => img.image));
                }

                if (galleryCategories.length === 0) return null;

                const safeIndex = Math.min(
                  activeGalleryCategoryIndex,
                  galleryCategories.length - 1
                );
                const activeCategory = galleryCategories[safeIndex];

                return (
                  <div className="mb-16 mt-20 w-[90%] mx-auto">
                    <h4 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#151213] to-[#524EDA] mb-12 text-center gap-2 w-fit mx-auto">
                      Our Gallery
                    </h4>

                    {/* Category tabs in a single horizontal line */}
                    <div className="flex items-center justify-center gap-3 px-4 py-2 rounded-xl overflow-x-auto scrollbar-hide w-fit mx-auto mb-6" style={{ boxShadow: "0 2px 2px 0 rgba(0, 0, 0, 0.1)" }}>
                      {galleryCategories.map((category, idx) => {
                        const isActive = idx === safeIndex;
                        const label =
                          (category.category && category.category.length > 0
                            ? category.category
                            : `Category ${idx + 1}`) || `Category ${idx + 1}`;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveGalleryCategoryIndex(idx)}
                            className={`text-base font-semibold transition-colors whitespace-nowrap py-2 px-4 ${isActive
                              ? " text-white bg-[#0092FE] rounded-xl"
                              : "bg-white text-black hover:bg-[#00000027] rounded-xl"
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Images for active category */}
                    {activeCategory && (
                      <div className="columns-4 gap-3 [column-fill:_balance]">
                        {activeCategory.images.map((image, idx) => (
                          <div
                            key={idx}
                            className="break-inside-avoid group overflow-hidden rounded-lg border"
                          >
                            {image.image && (
                              <img
                                src={image.image}
                                alt={`Gallery ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}



            {/* YouTube Video Section */}
            {!isFieldHidden("youtubeVideo") &&
              cardData.youtubeVideo &&
              (() => {
                const videoId = getYouTubeVideoId(cardData.youtubeVideo);
                return videoId ? (
                  <div className="mb-6 mt-16 p-1 bg-white max-w-4xl mx-auto rounded-xl relative z-10">
                    <div
                      className="relative w-full max-w-4xl mx-auto"
                      style={{ paddingBottom: "56.25%" }}
                    >
                      <iframe
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : null;
              })()}

            <div className={`px-4 bg-gradient-to-b from-[#000000] via-[#000000] to-[#071828] ${isFieldHidden("youtubeVideo") ? "mt-0 pt-12" : "-mt-44 pt-48"}`}>
              {/* CTA Section */}
              {!isFieldHidden("ctaTitle") &&
                (cardData.ctaTitle ||
                  cardData.ctaSubtitle ||
                  (Array.isArray(cardData.buttons) &&
                    cardData.buttons.length > 0)) && (
                  <div className="mb-6 pt-4 text-center">
                    {cardData.ctaSubtitle && (
                      <p className="text-xl text-white mb-1">
                        {cardData.ctaSubtitle}
                      </p>
                    )}
                    {cardData.ctaTitle && (
                      <h4 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ffffff] to-[#48C44F] mb-4">
                        {cardData.ctaTitle}
                      </h4>
                    )}
                  </div>
                )}

              <p className="text-center text-white text-base font-semibold">
                This is Digital Business card, to get more info Contact us{" "}
              </p>

              <p className="text-center text-white text-sm font-light mt-2">
                I know You will forget this Contact, So Save this{" "}
              </p>
              <div className="flex items-center justify-center gap-6 mt-8 w-[90%] max-w-xl mx-auto">
                {/* <button
                  className={`text-black font-semibold bg-white text-center rounded-lg px-4 py-2 flex items-center justify-center gap-2 w-full transition-all duration-300
          ${user?.isAdmin ||
                      user?.role === "admin" ||
                      user?.role === "superadmin"
                      ? "bg-gray-400 border-gray-400 cursor-not-allowed"
                      : isCardSaved
                        ? "bg-green-600 border-green-600 hover:bg-green-700"
                        : "bg-white border-white hover:bg-white/90"
                    } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={handleSaveCard}
                  disabled={
                    saving ||
                    user?.isAdmin ||
                    user?.role === "admin" ||
                    user?.role === "superadmin"
                  }
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCardSaved ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <><img src="/save-black.png" alt="Save" className="w-4 h-4 mb-1" /></>
                  )}
                  <span>{isCardSaved ? "Card Saved" : "Save in VisitingLink"}</span>
                </button> */}

                {cardData.website && (
                  <a
                    href={cardData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-center text-white bg-gradient-to-r from-[#c7c3ff] to-[#4541C2] rounded-lg px-4 py-2 inline-block w-full transition-all duration-300"
                  >
                    Click to open Website
                  </a>
                )}

                <button
                  type="button"
                  onClick={openVcfDownloadModal}
                  className="text-black font-semibold bg-white text-center rounded-lg px-4 py-0 w-full transition-all duration-300 flex items-center justify-center gap-1"
                >
                  <Lottie animationData={downloadAnimation} loop={true} className="max-w-10" />
                  Download Contact
                </button>
              </div>

              <p className="text-center flex items-center justify-center gap-1 text-white text-[13px] font-light mt-10 pb-6">
                Powered by{" "}
                {/* <span className="text-white font-semibold">VisitingLink</span>
                <ExternalLink className="h-3 w-3 text-[#06FF7A] mb-[2px]" /> */}
                <img src="/visitingLink-logo-white.png" alt="Logo" className="h-[16px] mb-[2px]" />
                </p>
            </div>

            <AppointmentModal
              isOpen={isApptOpen}
              onClose={() => setIsApptOpen(false)}
              cardId={effectiveCardId}
            />

            <UserAuthModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
              onSuccess={handleAuthSuccess}
              cardId={cardId}
            />

            <AdminNotificationModal
              isOpen={showAdminModal}
              onClose={() => setShowAdminModal(false)}
            />

            <UnsaveConfirmModal
              isOpen={showUnsaveModal}
              onClose={() => setShowUnsaveModal(false)}
              onConfirm={handleUnsaveConfirm}
              cardTitle={cardData?.CompanyName || "Business Card"}
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
        </>
      ) : (
        <>
          {/* MobileView */}
          <div className="bg-[#ffffff] border-0 w-[24rem] mx-auto shadow-2xl overflow-hidden">
            <div className="text-center py-2.5 bg-black text-white">
              <a
                      href="https://bundelkhandexpo.com/visitor-pass"
                      className="px-10 py-1 rounded-[16px] bg-[#000000] border border-[#00FF11] text-white text-[10px] lg:text-base flex items-center gap-2 relative overflow-hidden group shine-btn max-w-fit mx-auto"
                      style={{ WebkitTapHighlightColor: "transparent" }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="relative z-10 text-center mx-auto text-[12px] italic">Get you free vistor passes</span>
                      <span
                        className="shine-glass"
                        aria-hidden="true"
                      ></span>
                    </a>
            </div>
            <div className="w-full flex items-center justify-between mt-6 gap-2 px-6">
              <div className="relative">
                <div className="absolute -top-6 -left-2 z-10 flex flex-col items-center gap-3">
                  <div className="flex flex-col items-center justify-center gap-0">
                    <button
                      type="button"
                      onClick={handleToggleLike}
                      className="flex items-center justify-center min-w-12 min-h-12"
                    >
                      <Lottie
                        lottieRef={likeLottieRef}
                        animationData={likeAnimation}
                        loop={false}
                        autoplay={false}
                        className="max-w-14 max-h-14"
                        onDOMLoaded={() => {
                          const inst = likeLottieRef.current;
                          const anim = inst?.animationItem;
                          if (!anim) return;
                          const total = anim.totalFrames || 0;
                          if (total > 0) {
                            // Show last frame as the idle state
                            anim.goToAndStop(total - 1, true);
                          }
                        }}
                      />
                    </button>
                    <span className="text-xs text-black -mt-2">Like</span>
                  </div>
                  <a href={`https://wa.me/${getFieldValue(
                    "whatsappNumber",
                    ""
                  ).replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1"
                  >
                    <img src="/whatsapp.svg" alt="WhatsApp" className="w-8 h-8" />
                    <span className="text-xs text-black">DM us</span>
                  </a>
                </div>
              </div>
              <button
                onClick={handleShare}
                className="bg-black text-white px-3 py-2 rounded-full text-[13px] flex items-center gap-2"
              >
                <img src="/share.svg" alt="Share" className="w-2 h-2" />
                <span className="text-[10px]">Share Card</span>
              </button>
            </div>
            {/* Header Section */}
            <div className="flex flex-col items-center gap-2 mb-6 px-4 relative z-20 mt-12">
              <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[90%] h-60 bg-gradient-to-b from-[#77A4E0] via-[#ffffff] to-[#ffffff] rounded-[100%] -z-10 opacity-20"></div>
              {cardData.logo && (
              <div className="absolute top-[7rem] left-56 w-12 h-12">
                <Lottie
                  lottieRef={verifiedLottieRef}
                  animationData={verifiedAnimation}
                  loop={true}
                />
              </div>
              )}
              {!isFieldHidden("logo") && cardData.logo && (
                <div className="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-b from-[#40499E] via-[#ffffff] to-[#ffffff] flex items-center justify-center p-1">
                  <img
                    src={cardData.logo}
                    alt="Logo"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              )}
              <p className="text-lg font-bold">{getFieldValue("CompanyName", "Company Name")}</p>
              <div className="text-center">
                <h3 className="text-3xl leading-[1.1] pb-1.5 font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#151213] to-[#524EDA] mb-4 mt-4 px-4">
                  {getFieldValue("heading", "Heading")}
                </h3>
                {!isFieldHidden("tagline") && (
                  <p
                    className={`text-[13px] leading-tight px-12 ${isFieldEmpty("tagline")
                      ? "text-gray-400 italic"
                      : "text-gray-600"
                      }`}
                  >
                    {getFieldValue("tagline", "Tagline")}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 mt-4">

                {!isFieldHidden("phoneNumber") && (
                  <a
                    href={`tel:${getFieldValue("phoneNumber", "")}`}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-[#000000] transition-colors text-sm"
                  >
                    <FontAwesomeIcon icon={faPhone} />
                    <span className="text-xs font-light">Call Us</span>
                  </a>
                )}

                {!isFieldHidden("whatsappNumber") && (
                  <a
                    href={`https://wa.me/${getFieldValue(
                      "whatsappNumber",
                      ""
                    ).replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-[#000000] transition-colors text-sm"
                  >
                    <img src="/message.png" alt="WhatsApp" className="w-4 h-4" />
                    <span className="text-xs font-light">Queries</span>
                  </a>
                )}
                {!isFieldHidden("email") && (
                  <a
                    href={`mailto:${getFieldValue("email", "")}`}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-black text-white rounded-lg hover:bg-[#000000] transition-colors text-sm"
                  >
                    <FontAwesomeIcon icon={faEnvelope} />
                    <span className="text-xs font-light">Email</span>
                  </a>
                )}
              </div>
            </div>

            {/* Social Links Section */}
            {!isFieldHidden("socialLinks") && cardData.socialLinks && (
              <div className="mb-6 pt-4 px-4">
                <h4 className="text-center text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#151213] to-[#524EDA] mb-4 flex items-center justify-center gap-2">
                  <span className="text-3xl">#</span>
                  All Social Media links
                </h4>
                <div className="grid grid-cols-3 gap-3 px-4">
                  {cardData.socialLinks.instagram && (
                    <a
                      href={cardData.socialLinks.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className=""
                    >
                      {/* <Instagram className="w-12 h-12" /> */}
                      {/* <img src="/icons/instagram-icon.svg" alt="Instagram" className="w-12 h-12" />
                      <span>Instagram</span> */}
                      <img src="/icons/insta.png" alt="Instagram" className="w-full h-full object-contain" />
                    </a>
                  )}
                  {cardData.socialLinks.linkedin && (
                    <a
                      href={cardData.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className=""
                    >
                      {/* <Linkedin className="w-12 h-12" /> */}
                      <img src="/icons/li.png" alt="LinkedIn" className="w-full h-full object-contain" />
                    </a>
                  )}
                  {cardData.socialLinks.facebook && (
                    <a
                      href={cardData.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className=""
                    >
                      {/* <Facebook className="w-12 h-12" /> */}
                      <img src="/icons/fb.png" alt="Facebook" className="w-full h-full object-contain" />
                    </a>
                  )}
                  {cardData.socialLinks.twitter && (
                    <a
                      href={cardData.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className=""
                    >
                      {/* <Twitter className="w-12 h-12" /> */}
                      <img src="/icons/x.png" alt="Twitter" className="w-full h-full object-contain" />
                    </a>
                  )}
                  {cardData.socialLinks.youtube && (
                    <a
                      href={cardData.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className=""
                    >
                      {/* <Youtube className="w-12 h-12" /> */}
                      <img src="/icons/yt.png" alt="YouTube" className="w-full h-full object-contain" />
                      {/* <span>YouTube</span> */}
                    </a>
                  )}
                  {cardData.socialLinks.behance && (
                    <a
                      href={cardData.socialLinks.behance}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center flex-col justify-center gap-1 px-4 py-1 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors"
                    >
                      {/* <Behance className="w-12 h-12" /> */}
                      <img src="/icons/behance-icon.svg" alt="Behance" className="w-14 h-14 mt-3" />
                      <span className="text-[8px] font-semibold">Behance</span>
                    </a>
                  )}
                  {cardData.socialLinks.pinterest && (
                    <a
                      href={cardData.socialLinks.pinterest}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center flex-col justify-center gap-1 px-4 py-1 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors"
                    >
                      {/* <Pinterest className="w-12 h-12" /> */}
                      <img src="/icons/pinterest-icon.svg" alt="Pinterest" className="w-14 h-14 mt-3 mb-1" />
                      <span className="text-[8px] font-semibold">Pinterest</span>
                    </a>
                  )}
                  {cardData.socialCustomButtons
                    .slice(0, 2)
                    .map((btn, idx) => {
                      if (!btn || (!btn.text && !btn.url && !btn.icon))
                        return null;
                      return (
                        <a
                          key={idx}
                          href={btn.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`overflow-hidden flex flex-col items-center justify-center gap-2 text-white rounded-2xl transition-colors text-sm`}
                        >
                          {btn.icon && (
                            <img
                              src={btn.icon}
                              alt={btn.text || `Custom Button ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {/* <span className="text-[8px] font-semibold">{btn.text || "Custom Link"}</span> */}
                        </a>
                      );
                    })}
                </div>

              </div>
            )}

            {/* Shop Links Section */}
            {!isFieldHidden("shopLinks") &&
              Array.isArray(cardData.shopLinks) &&
              cardData.shopLinks.length > 0 && (
                <div className="mb-6 pt-4 px-4">
                  <h4 className="text-2xl font-bold text-center text-black mb-4">
                    Our Shop Links
                  </h4>
                  <div className="grid grid-cols-3 gap-3 px-4">
                    {cardData.shopLinks.map((shop, idx) => (
                      <a
                        key={idx}
                        href={shop.url}
                        onClick={(e) => {
                          e.preventDefault();
                          handleShopLinkClick(shop.url, shop.label || shop.shopname || `shop-${idx}`);
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`overflow-hidden flex flex-col items-center justify-center text-white rounded-2xl transition-colors text-[8px] font-medium
                          
                          `}
                      >
                        {shop.icon && (
                          <div className="w-full h-full object-cover">
                            <img
                              src={shop.icon}
                              alt="Shop Icon"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {/* {shop.label || "Shop Link"} */}
                      </a>
                    ))}
                  </div>
                </div>
              )}

            {/* Company Info Section */}
            {!isFieldHidden("companyInfo") && (
              <div className="py-4 px-6">
                <h4 className="text-2xl font-bold text-black mb-2 text-center">
                  Company Info
                </h4>
                <p
                  className={`text-sm text-center ${isFieldEmpty("companyInfo")
                    ? "text-gray-400 italic"
                    : "text-gray-700"
                    }`}
                >
                  {getFieldValue("companyInfo", "Not provided")}
                </p>
              </div>
            )}

            {/* Our Numbers Section */}
            {!isFieldHidden("ourNumbers") &&
              Array.isArray(cardData.ourNumbers) &&
              cardData.ourNumbers.length > 0 && (
                <div className="py-5">

                  <div className="grid grid-cols-3 gap-2 px-4">
                    {cardData.ourNumbers.map((item, idx) => (
                      <div
                        key={idx}
                        className="text-left border border-gray-400 rounded-2xl px-3 py-3"
                      >
                        {item.icon && (
                          <div className="w-8 h-8 mb-2 flex items-center justify-center">
                            <img
                              src={item.icon}
                              alt="Icon"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <p className="text-xl font-bold text-black">
                          <AnimatedNumber value={item.number || 0} />
                        </p>
                        <p className="text-xs text-black">
                          {item.description || "Description"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Catalogue Section */}
            {!isFieldHidden("catalogue") && cardData.catalogue && (
              <div className="mb-6 pt-4 px-4">
                <div className="flex items-center justify-center border border-black rounded-[30px] px-4 py-6">
                  <h4 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-[#151213] to-[#524EDA] flex items-center gap-2 mb-4">
                    Download our Catalogue
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCatalogue}
                  disabled={catalogueDownloading}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-black text-white rounded-xl w-fit mx-auto -mt-5 disabled:cursor-not-allowed"
                >
                  {catalogueDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span className="text-sm">{catalogueDownloading ? "Downloading..." : "Download Now"}</span>
                </button>
              </div>
            )}


            {/* Founder Section */}
            {!isFieldHidden("founderName") &&
              (cardData.founderName ||
                cardData.founderImage ||
                cardData.founderDescription ||
                cardData.founderMessage ||
                cardData.vission) && (
                <div className="mb-6 pt-4 px-4">
                  {/* <h4 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
              <Users className="h-6 w-6" />
              Founder
            </h4> */}
                  <div className="flex items-center gap-5 mb-8 px-8">
                    {cardData.founderImage && (
                      <div className="relative">
                        <div>
                          <img src="/contact.png" alt="Contact" className="w-6 h-6 absolute -bottom-[6px] -right-[6px]" />
                        </div>
                        <div className="w-28 h-28 rounded-2xl border-[3px] border-[#6B68CE] overflow-hidden">
                          <img
                            src={cardData.founderImage}
                            alt="Founder"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex-1">
                      {cardData.founderName && (
                        <h5 className="font-bold text-black mb-1 text-[20px] leading-[1.15]">
                          {cardData.founderName}
                        </h5>
                      )}
                      {!isFieldHidden("founderDescription") && (
                        <p
                          className={`text-sm font-bold ${isFieldEmpty("founderDescription")
                            ? "text-black italic"
                            : "text-black"
                            }`}
                        >
                          {getFieldValue("founderDescription", "Not provided")}
                        </p>
                      )}
                      <p className="text-xs text-gray-700">@{cardData.CompanyName}</p>
                    </div>
                  </div>

                  {cardData.founderMessage && (
                    <div className="py-8 px-6 bg-white rounded-3xl -mb-4 relative z-10" style={{ boxShadow: "0 -2px 10px 0 rgba(0, 0, 0, 0.1)" }}>
                      <p className="text-xl font-semibold text-gray-900 mb-2 text-center">
                        Founder Message
                      </p>
                      <p className="text-xs ">{cardData.founderMessage}</p>
                    </div>
                  )}
                  {cardData.vission && (
                    <div className="pt-8 pb-6 px-6 bg-gradient-to-b from-[#0A66C2] to-[#0866FF] rounded-3xl flex items-center justify-center gap-4">
                      <p className="text-[14px] font-semibold text-white">
                        Vision
                      </p>
                      <p className="text-[10px] text-white">
                        {cardData.vission}
                      </p>
                    </div>
                  )}
                </div>
              )}

            {/* Services and Products Section with Tabs */}
            {(() => {
              const hasServices =
                !isFieldHidden("ourServices") &&
                Array.isArray(cardData.ourServices) &&
                cardData.ourServices.length > 0;
              const hasProducts =
                !isFieldHidden("ourProducts") &&
                Array.isArray(cardData.ourProducts) &&
                cardData.ourProducts.length > 0;
              const showTabs = hasServices && hasProducts;

              // Determine heading based on what's available
              const getHeading = () => {
                if (hasServices && hasProducts) {
                  return "What we offer";
                } else if (hasServices) {
                  return "Services we Offer";
                } else if (hasProducts) {
                  return "Our Products";
                }
                return "";
              };

              if (!hasServices && !hasProducts) return null;

              return (
                <div className="mb-6 pt-4">
                  <h4 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#151213] to-[#524EDA] mb-4 flex items-center justify-center gap-2">
                    {getHeading()}
                  </h4>

                  {/* Tabs - Only show if both services and products exist */}
                  {showTabs && (
                    <div className="flex justify-center gap-4 mb-8 mt-8 px-4">
                      <button
                        onClick={() => setActiveTab("services")}
                        className={`px-4 py-1.5 rounded-full font-medium transition-all ${activeTab === "services"
                          ? "bg-[#212121] text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                      >
                        Services
                      </button>
                      <button
                        onClick={() => setActiveTab("products")}
                        className={`px-4 py-1.5 rounded-full font-medium transition-all ${activeTab === "products"
                          ? "bg-[#212121] text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                      >
                        Products
                      </button>
                    </div>
                  )}

                  {/* Services Content */}
                  {hasServices && (!showTabs || activeTab === "services") && (
                    <div className="flex gap-4 px-4 pb-8 pt-4 overflow-x-auto scrollbar-hide">
                      {cardData.ourServices.map((service, idx) => (
                        <div
                          key={idx}
                          className="bg-[#ffffff] rounded-3xl py-6 px-4 min-w-[200px]" style={{ boxShadow: "0 4px 15px 0px rgba(0, 0, 0, 0.2)" }}
                        >
                          <p className="text-sm font-bold mb-4 bg-[#0092FE] text-white rounded-full w-8 h-8 flex items-center justify-center">
                            {idx + 1}
                          </p>
                          <h5 className="font-semibold text-gray-900 my-1 text-xl">
                            {service.title || "Service Title"}
                          </h5>
                          <p className="text-xs text-gray-600">
                            {service.description || "Service description"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Products Content */}
                  {hasProducts && (!showTabs || activeTab === "products") && (
                    <div className="flex overflow-x-auto scrollbar-hide gap-4 px-4">
                      {cardData.ourProducts.map((product, idx) => (
                        <div
                          key={idx}
                          className="p-3 min-w-[70%] bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          {product.image && (
                            <div className="w-full h-52 rounded-2xl overflow-hidden">
                              <img
                                src={product.image}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="px-2 pt-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <h5 className="font-semibold text-gray-900 text-sm">
                                {product.title || "Product Title"}
                              </h5>

                              {product.rating && (
                                <div className="flex items-center gap-0.5">
                                  {(() => {
                                    const ratingValue =
                                      Number(product.rating) || 0;
                                    return Array.from({ length: 5 }).map(
                                      (_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-3 w-3 ${i < ratingValue
                                            ? "text-yellow-400 fill-yellow-400"
                                            : "text-gray-300"
                                            }`}
                                        />
                                      )
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                            {product.description && (
                              <p className="text-[10px] leading-tight text-gray-600 mb-2">
                                {product.description}
                              </p>
                            )}

                            {/* Price row */}
                            <div className="flex items-center justify-between mb-1">
                              {product.price && (
                                <p className="text-black font-bold text-sm">
                                  Rs.{product.price}
                                </p>
                              )}

                              {/* Buy button row */}
                              {product.link && (
                                <div className="flex justify-end">
                                  <a
                                    href={product.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-white bg-[#000000] rounded-full px-2 py-1"
                                  >
                                    Buy Now
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="px-2 py-4 border border-black rounded-2xl overflow-hidden mx-4">
              <p className="text-center text-[10px] font-semibold mb-3">
                Call, WhatsApp & Book Appointments with one Link
              </p>
              <button className="bg-black text-white px-4 py-2 rounded-lg text-[12px] w-full flex items-center justify-center gap-2">
                <DownloadIcon className="h-4 w-4" />
                Save in contact library{" "}
              </button>
              <a href={`https://wa.me/${getFieldValue("whatsappNumber", "")}`} target="_blank" rel="noopener noreferrer" className="bg-[#5DB36B] text-white px-4 py-2 rounded-lg text-[12px] w-full my-2 flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp Business
              </a>
              {/* <button
                className="bg-[#5483BC] text-white px-4 py-2 rounded-lg text-[12px] w-full flex items-center justify-center gap-2"
                onClick={() => setIsApptOpen(true)}
              >
                <Calendar className="h-4 w-4" />
                Book Appointment
              </button> */}
              <img
                src="/link-pro-banner.png"
                alt="Link Pro Banner"
                className="w-full h-full object-cover mt-4"
              />
            </div>

            {/* Our Clients Section */}
            {!isFieldHidden("ourClients") &&
              Array.isArray(cardData.ourClients) &&
              cardData.ourClients.length > 0 && (
                <div className="my-6 px-6 mt-12">
                  <h4 className="text-xl font-bold leading-[1.25] text-transparent bg-clip-text bg-gradient-to-r from-[#151213] to-[#524EDA] mb-6 gap-2 text-center px-4">
                    Our Valuable Clients we worked With
                  </h4>
                  {(() => {
                    const clients = cardData.ourClients;
                    const mid = Math.ceil(clients.length / 2);
                    const firstRow = clients.slice(0, mid);
                    const secondRow = clients.slice(mid);

                    return (
                      <div className="space-y-2 my-10">
                        {/* First row */}
                        <div className="flex overflow-x-auto gap-3 pb-1 scrollbar-hide">
                          {firstRow.map((client, idx) => (
                            <div
                              key={`m-row1-${idx}`}
                              className="h-16 w-28 flex-shrink-0 overflow-hidden"
                            >
                              {client.image && (
                                <img
                                  src={client.image}
                                  alt={`Client ${idx + 1}`}
                                  className="w-full h-full object-contain"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        {/* Second row */}
                        {secondRow.length > 0 && (
                          <div className="flex overflow-x-auto gap-3 pb-1 scrollbar-hide">
                            {secondRow.map((client, idx) => (
                              <div
                                key={`m-row2-${idx}`}
                                className="h-16 w-28 flex-shrink-0 overflow-hidden"
                              >
                                {client.image && (
                                  <img
                                    src={client.image}
                                    alt={`Client ${mid + idx + 1}`}
                                    className="w-full h-full object-contain"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}


            {/* Testimonials Section */}
            {!isFieldHidden("testimonials") &&
              Array.isArray(cardData.testimonials) &&
              cardData.testimonials.length > 0 && (
                <div className={`mb-6 pt-4 px-6 ${cardData.ourClients.length > 1 ? "mt-0" : "mt-12"}`}>
                  <div className="relative">
                    {/* Left Arrow */}
                    {cardData.testimonials.length > 1 && (
                      <button
                        onClick={() =>
                          setTestimonialIndex((prev) =>
                            prev === 0
                              ? cardData.testimonials.length - 1
                              : prev - 1
                          )
                        }
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
                        aria-label="Previous testimonial"
                      >
                        <img
                          src="/testimonial-arrow.png"
                          alt="Previous testimonial"
                          className="h-4 w-4"
                        />
                      </button>
                    )}

                    {/* Testimonial Content */}
                    <div className="overflow-hidden mx-6">
                      <div
                        className="flex transition-transform duration-300 ease-in-out"
                        style={{
                          transform: `translateX(calc(-100% * ${testimonialIndex}))`,
                        }}
                      >
                        {cardData.testimonials.map((testimonial, idx) => (
                          <div
                            key={idx}
                            className="flex-shrink-0"
                            style={{
                              flex: "0 0 100%",
                              width: "100%",
                            }}
                          >
                            <div className="flex items-center gap-4 mb-2 px-2">
                              {testimonial.image && (
                                <div className="rounded-full overflow-hidden flex-shrink-0">
                                  <img
                                    src={testimonial.image}
                                    alt={testimonial.name}
                                    className="w-28 h-28 object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-[10px] text-gray-700 italic">
                                  "{testimonial.reviewText || "Great service!"}"
                                </p>
                                <p className="font-medium text-xs text-gray-900">
                                  {testimonial.name || "Customer"}
                                </p>
                                {testimonial.rating && (
                                  <div className="flex items-center gap-0.5">
                                    {(() => {
                                      const ratingValue =
                                        Number(testimonial.rating) || 0;
                                      return Array.from({ length: 5 }).map(
                                        (_, i) => (
                                          <Star
                                            key={i}
                                            className={`h-3 w-3 ${i < ratingValue
                                              ? "text-yellow-400 fill-yellow-400"
                                              : "text-gray-300"
                                              }`}
                                          />
                                        )
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Arrow */}
                    {cardData.testimonials.length > 1 && (
                      <button
                        onClick={() =>
                          setTestimonialIndex((prev) =>
                            prev === cardData.testimonials.length - 1
                              ? 0
                              : prev + 1
                          )
                        }
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2"
                        aria-label="Next testimonial"
                      >
                        <img
                          src="/testimonial-arrow.png"
                          alt="Previous testimonial"
                          className="h-4 w-4 rotate-180"
                        />
                      </button>
                    )}

                    {/* Dots Indicator */}
                    {/* {cardData.testimonials.length > 1 && (
                      <div className="flex justify-center gap-2 mt-4">
                        {cardData.testimonials.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setTestimonialIndex(idx)}
                            className={`h-2 rounded-full transition-all ${idx === testimonialIndex
                              ? "w-6 bg-[#0092FE]"
                              : "w-2 bg-gray-300"
                              }`}
                            aria-label={`Go to testimonial ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )} */}
                  </div>
                </div>
              )}

            {/* Why Choose Us Section */}
            {!isFieldHidden("whyChooseUs") &&
              Array.isArray(cardData.whyChooseUs) &&
              cardData.whyChooseUs.length > 0 && (
                <div className="mt-20 mb-8 px-12">
                  <h4 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#151213] to-[#524EDA] mb-8 text-center">
                    Why Choose Us ?
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {cardData.whyChooseUs.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-start gap-2"
                      >
                        <span className="bg-[#2196F3] text-white rounded-full p-1 inline-block">
                          <Check className="h-2 w-2" />
                        </span>
                        {/* <h5 className="font-semibold text-gray-900 mb-1">{item.title}</h5> */}
                        <p className="text-[11px] text-black font-medium">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            {/* Map Embed Section */}
            {!isFieldHidden("mapEmbedLink") && cardData.mapEmbedLink && (
              <div className="mb-6 pt-8 px-7">
                <h4 className="text-2xl text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#151213] to-[#524EDA] mb-8">
                  We are located at{" "}
                </h4>
                <div className="rounded-3xl overflow-hidden border border-gray-200">
                  <iframe
                    src={cardData.mapEmbedLink}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            )}

            {/* Headquarters Section */}
            {!isFieldHidden("headquarters") &&
              Array.isArray(cardData.headquarters) &&
              cardData.headquarters.length > 0 && (
                <div className="mb-6 pt-2 px-6">
                  <div className="space-y-4">
                    {cardData.headquarters.map((hq, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg p-0 flex items-center justify-start gap-6 px-8"
                      >
                        <img
                          src="/location-pin.png"
                          alt="Location Icon"
                          className="w-20"
                        />
                        <div>
                          <h5 className="font-semibold text-lg text-gray-900 mb-1 leading-[1.1]">
                            {hq.city || "City"}
                          </h5>
                          <p className="text-[10px] text-gray-700 mb-2 leading-[1.15]">
                            {hq.address || "Address"}
                          </p>
                          {hq.mapUrl && (
                            <a
                              href={hq.mapUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className=""
                            >
                              <img src="/get-directions.svg" alt="Map Pin" className="h-[1.25rem]" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Gallery Images Section (Mobile) */}
            {!isFieldHidden("galleryImages") &&
              (Array.isArray(cardData.galleryImages) && cardData.galleryImages.length > 0 ||
                (Array.isArray(cardData.galleryCategories) && cardData.galleryCategories.some(
                  (cat) => cat && Array.isArray(cat.images) && cat.images.length > 0
                ))) &&
              (() => {
                let galleryCategories = Array.isArray(cardData.galleryCategories)
                  ? cardData.galleryCategories.filter(
                    (cat) =>
                      cat &&
                      Array.isArray(cat.images) &&
                      cat.images.length > 0
                  )
                  : [];
                // Fallback: show gallery from flat galleryImages when no categories
                if (galleryCategories.length === 0 && Array.isArray(cardData.galleryImages) && cardData.galleryImages.length > 0) {
                  galleryCategories = [{
                    category: "Gallery",
                    images: cardData.galleryImages.map((url) => ({ image: typeof url === "string" ? url : url?.url || url?.image })),
                  }].filter((cat) => cat.images.some((img) => img.image));
                }

                if (galleryCategories.length === 0) return null;

                const safeIndex = Math.min(
                  activeGalleryCategoryIndex,
                  galleryCategories.length - 1
                );
                const activeCategory = galleryCategories[safeIndex];

                return (
                  <div className="my-12 px-6">
                    <h4 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#151213] to-[#524EDA] mb-4 gap-2 text-center">
                      Our Gallery
                    </h4>

                    {/* Category tabs in a single horizontal line */}
                    <div className="flex items-center justify-center gap-2 mb-4 px-3 py-2 rounded-xl overflow-x-auto scrollbar-hide bg-white/80">
                      {galleryCategories.map((category, idx) => {
                        const isActive = idx === safeIndex;
                        const label =
                          (category.category && category.category.length > 0
                            ? category.category
                            : `Category ${idx + 1}`) || `Category ${idx + 1}`;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveGalleryCategoryIndex(idx)}
                            className={`text-xs font-semibold transition-colors whitespace-nowrap py-1.5 px-3 ${isActive
                              ? "text-white bg-[#0092FE] rounded-full"
                              : "bg-white text-black hover:bg-[#00000014] rounded-full"
                              }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Images for active category */}
                    {activeCategory && (
                      <div className="columns-2 gap-2 [column-fill:_balance]">
                        {activeCategory.images.map((image, idx) => (
                          <div
                            key={idx}
                            className="break-inside-avoid mb-2 group overflow-hidden rounded-lg border"
                          >
                            {image.image && (
                              <img
                                src={image.image}
                                alt={`Gallery ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}



            {/* App Store Links */}
            {(cardData.appStoreUrl || cardData.playStoreUrl) && (
              <div className="mb-6 pt-8 px-6">
                <h4 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#151213] to-[#524EDA] mb-4 ">
                  Get Our App
                </h4>
                <div className="flex gap-3 justify-center">
                  {cardData.appStoreUrl && (
                    <a
                      href={cardData.appStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:scale-105 transition-transform"
                    >
                      <img
                        src="/apple-download.svg"
                        alt="App Store"
                        className="h-12"
                      />
                    </a>
                  )}
                  {cardData.playStoreUrl && (
                    <a
                      href={cardData.playStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:scale-105 transition-transform"
                    >
                      <img
                        src="/g-play-download.svg"
                        alt="Play Store"
                        className="h-12"
                      />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* YouTube Video Section */}
            {!isFieldHidden("youtubeVideo") &&
              cardData.youtubeVideo &&
              (() => {
                const videoId = getYouTubeVideoId(cardData.youtubeVideo);
                return videoId ? (
                  <div className="mb-6 mt-16 p-0.5 mx-4 bg-white rounded-xl relative z-10">
                    <div
                      className="relative w-full"
                      style={{ paddingBottom: "56.25%" }}
                    >
                      <iframe
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : null;
              })()}

            <div className={`px-4 bg-gradient-to-b from-[#000000] via-[#000000] to-[#071828] ${isFieldHidden("youtubeVideo") ? "mt-0 pt-12" : "-mt-28 pt-36"}`}>
              {/* CTA Section */}
              {!isFieldHidden("ctaTitle") &&
                (cardData.ctaTitle ||
                  cardData.ctaSubtitle ||
                  (Array.isArray(cardData.buttons) &&
                    cardData.buttons.length > 0)) && (
                  <div className="mb-6 pt-4 text-center">
                    {cardData.ctaSubtitle && (
                      <p className="text-lg text-white mb-1">
                        {cardData.ctaSubtitle}
                      </p>
                    )}
                    {cardData.ctaTitle && (
                      <h4 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ffffff] to-[#48C44F] mb-4">
                        {cardData.ctaTitle}
                      </h4>
                    )}

                    {/* {Array.isArray(cardData.buttons) &&
                cardData.buttons.length > 0 && (
                  <div className="space-y-2">
                    {cardData.buttons.map((button, idx) => (
                      <ContactButton
                        key={idx}
                        icon={ExternalLink}
                        label={button.label || "Button"}
                        href={button.url}
                        isExternal={true}
                      />
                    ))}
                  </div>
                )} */}
                  </div>
                )}

              {/* <p className="text-center text-white text-sm font-semibold">
                This is Digital Business card
                <br /> To get more info Contact us{" "}
              </p> */}

              <p className="text-center text-white text-xs font-light mt-4 px-6">
              I know you might forget this contact, so <br /> Download, Import, and Save It in your contacts.
              </p>
              {/* <button
                className={`text-black font-semibold bg-white border-2 border-white text-center rounded-lg px-4 py-1.5 w-full mb-2 transition-all duration-300 mt-4 flex items-center justify-center gap-2
          ${user?.isAdmin ||
                    user?.role === "admin" ||
                    user?.role === "superadmin"
                    ? "bg-gray-400 border-gray-400 cursor-not-allowed"
                    : isCardSaved
                      ? "bg-green-600 border-green-600 hover:bg-green-700"
                      : "bg-white border-white hover:bg-white/90"
                  } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={handleSaveCard}
                disabled={
                  saving ||
                  user?.isAdmin ||
                  user?.role === "admin" ||
                  user?.role === "superadmin"
                }
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isCardSaved ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <><img src="/save-black.png" alt="Save" className="w-4 h-4 mb-1" /></>
                )}
                <span>{isCardSaved ? "Card Saved" : "Save Contact"}</span>
              </button> */}

              {cardData.website && (
                <a
                  href={cardData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 text-center text-white bg-gradient-to-r from-[#c7c3ff] to-[#4541C2] rounded-lg px-4 py-1.5 w-full mb-4 transition-all duration-300 max-w-72 mx-auto flex items-center justify-center"
                >
                  Visit Website
                </a>
              )}

              <button
                type="button"
                onClick={openVcfDownloadModal}
                className={`text-black font-semibold bg-white border-2 text-center rounded-lg px-4 w-full mb-2 transition-all duration-300 flex items-center justify-center gap-1 max-w-72 mx-auto ${cardData.website ? "mt-0" : "mt-6"}`}
              >
                <Lottie animationData={downloadAnimation} loop={true} className="max-w-10 max-h-10" />
                Download Contact
              </button>

              <p className="text-center flex items-center justify-center gap-1 text-white text-[13px] font-light mt-6 pb-6">
                Powered by{" "}
                {/* <span className="text-white font-semibold">VisitingLink</span>
                <ExternalLink className="h-3 w-3  text-[#06FF7A] mb-[2px]" /> */}
                <img src="/visitingLink-logo-white.png" alt="Logo" className="h-[16px] mb-[2px]" />
              </p>


            </div>

            <AppointmentModal
              isOpen={isApptOpen}
              onClose={() => setIsApptOpen(false)}
              cardId={effectiveCardId}
            />

            <UserAuthModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
              onSuccess={handleAuthSuccess}
              cardId={cardId}
            />

            <AdminNotificationModal
              isOpen={showAdminModal}
              onClose={() => setShowAdminModal(false)}
            />

            <UnsaveConfirmModal
              isOpen={showUnsaveModal}
              onClose={() => setShowUnsaveModal(false)}
              onConfirm={handleUnsaveConfirm}
              cardTitle={cardData?.CompanyName || "Business Card"}
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
        </>
      )}
    </>
  );
};

export default LinkPro;
