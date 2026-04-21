import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { apiService } from "../lib/api.js";
import { Plus, Eye, Trash2, CreditCard, ArrowLeft, Send, X, Share2, Copy, Download, Home, Smartphone, User, ShoppingBag, PlayCircle, HelpCircle, LogOut, ChevronRight, Wifi, MessageCircle } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import CardPreviewModal from "../components/CardPreviewModal.jsx";
import UserCardGenerator from "../components/UserCardGenerator.jsx";
import { useTemplateRazorpay } from "../hooks/useTemplateRazorpay.js";

export default function MyCard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [hasCards, setHasCards] = useState(false);
  const [view, setView] = useState("list"); // "list" | "template" | "edit"
  const [editingCard, setEditingCard] = useState(null);
  const [previewCard, setPreviewCard] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [payingTemplate, setPayingTemplate] = useState(null);
  const [creatingCard, setCreatingCard] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ name: "", email: "", phone: "", message: "", businessType: "" });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestResult, setRequestResult] = useState({ ok: "", err: "" });
  const [shareCard, setShareCard] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const qrCanvasRef = useRef(null);

  const { initiateTemplatePayment, loading: paymentLoading } = useTemplateRazorpay();

  const getShareableLink = (card) => {
    if (!card?.shareableLink) return null;
    return card.shareableLink.replace("teamserver.cloud", "www.visitinglink.com");
  };

  const getCardDisplayName = (card) =>
    card?.name || card?.data?.CompanyName || card?.data?.name || "My card";

  const getBackendQrDataUrl = (card) => {
    const candidates = [
      card?.qr, card?.qrCode, card?.qrcode, card?.qrImage, card?.qr_code, card?.qr_code_image,
      card?.data?.qr, card?.data?.qrCode, card?.data?.qrcode, card?.data?.qrImage, card?.data?.qr_code,
    ];
    const raw = candidates.find((v) => typeof v === "string" && v.trim().length > 0)?.trim() || "";
    if (!raw) return "";
    if (raw.startsWith("data:image/")) return raw;
    if (/^[A-Za-z0-9+/]+=*$/.test(raw) && raw.length > 100) {
      return `data:image/png;base64,${raw}`;
    }
    return "";
  };

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await apiService.getMyCards();
      if (res.success && Array.isArray(res.data)) {
        setCards(res.data);
        setHasCards(res.data.length > 0);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const startCreate = async () => {
    setEditingCard(null);
    setSelectedTemplate(null);
    setView("template");

    const categoriesRes = await apiService.getCategories();
    if (!categoriesRes.success || !Array.isArray(categoriesRes.data)) {
      setTemplates([{ categoryId: "link-pro", templateId: "link-pro-classic", name: "Link Pro" }]);
      return;
    }

    const categories = categoriesRes.data;
    const resolvedTemplates = [];
    for (const cat of categories) {
      if (!cat?.categoryId) continue;
      const templatesRes = await apiService.getTemplatesByCategory(cat.categoryId);
      const list = templatesRes?.data?.templates || [];
      list.forEach((tpl) => {
        resolvedTemplates.push({
          categoryId: cat.categoryId,
          categoryName: cat.categoryName || cat.categoryId,
          templateId: tpl.templateId,
          name: tpl.name || tpl.templateId,
          description: tpl.description || "",
          preview: tpl.preview || "",
          price: typeof tpl.price === "number" ? tpl.price : 0,
        });
      });
    }
    setTemplates(resolvedTemplates.length > 0 ? resolvedTemplates : [{ categoryId: "link-pro", templateId: "link-pro-classic", name: "Link Pro" }]);
  };

  const startEdit = (card) => {
    setEditingCard(card);
    setSelectedTemplate({ categoryId: card.categoryId, templateId: card.templateId, name: card.templateId });
    setView("edit");
  };

  const handleSaved = async () => {
    setView("list");
    setEditingCard(null);
    const res = await apiService.getMyCards();
    if (res.success && Array.isArray(res.data)) {
      setCards(res.data);
      setHasCards(res.data.length > 0);
    }
  };

  const handlePreview = async (card) => {
    setPreviewCard(card);
    const res = await apiService.getMyCards();
    if (res.success && Array.isArray(res.data)) {
      setCards(res.data);
      setHasCards(res.data.length > 0);
    }
  };

  const handleDelete = async (cardId) => {
    if (!window.confirm("Delete this card?")) return;
    await apiService.deleteCard(cardId);
    setCards((prev) => {
      const filtered = prev.filter((c) => c._id !== cardId);
      setHasCards(filtered.length > 0);
      return filtered;
    });
    if (editingCard?._id === cardId) {
      setView("list");
      setEditingCard(null);
    }
  };

  const handleShare = (cardId) => {
    const card = cards.find((c) => c._id === cardId);
    if (!card) return;
    const shareableLink = getShareableLink(card);
    if (!shareableLink) {
      alert("No shareable link is available for this card yet.");
      return;
    }
    setLinkCopied(false);
    setShareCard(card);
  };

  const copyShareLink = async () => {
    const link = shareCard ? getShareableLink(shareCard) : null;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      alert("Could not copy link. Select the link and copy it manually.");
    }
  };

  const downloadQrPng = () => {
    const backendQr = shareCard ? getBackendQrDataUrl(shareCard) : "";
    const dataUrl = backendQr || qrCanvasRef.current?.toDataURL?.("image/png") || "";
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `card-qr-${shareCard?._id?.slice(-8) || "card"}.png`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (view === "template") {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <button type="button" onClick={() => setView("list")} className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <h2 className="text-lg font-semibold text-slate-900">Choose a template</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {templates.map((tpl) => (
            <div key={`${tpl.categoryId}-${tpl.templateId}`} className="relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-center transition-colors">
              <button type="button" onClick={() => setTemplatePreview(tpl)} className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"><Eye className="w-4 h-4" /></button>
              <CreditCard className="w-8 h-8 text-slate-500" />
              <span className="text-sm font-medium text-slate-900">{tpl.name}</span>
              <div className="mt-1 text-xs font-semibold text-slate-900">{tpl.price > 0 ? `₹${tpl.price}` : "Free"}</div>
              <button type="button" disabled={creatingCard || paymentLoading} onClick={() => setPayingTemplate(tpl)} className="mt-2 w-full inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-3 py-2 text-xs font-semibold">Select</button>
            </div>
          ))}
        </div>
        {payingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-slate-900">Complete payment</h3>
                <button onClick={() => setPayingTemplate(null)}><X className="w-5 h-5" /></button>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg flex justify-between">
                <span>{payingTemplate.name}</span>
                <span className="font-bold">₹{payingTemplate.price}</span>
              </div>
              <button
                className="w-full bg-black text-white py-3 rounded-full font-bold"
                onClick={async () => {
                  setCreatingCard(true);
                  try {
                    const onPaid = async () => {
                      const res = await apiService.createCard({ name: "", categoryId: payingTemplate.categoryId, templateId: payingTemplate.templateId, data: {} });
                      if (!res.success) throw new Error(res.error);
                      const created = res.data;
                      setEditingCard(created);
                      setSelectedTemplate({ categoryId: created.categoryId, templateId: created.templateId, name: payingTemplate.name });
                      setPayingTemplate(null);
                      setView("edit");
                    };
                    if (payingTemplate.price <= 0) await onPaid();
                    else await initiateTemplatePayment({ categoryId: payingTemplate.categoryId, templateId: payingTemplate.templateId, templateName: payingTemplate.name, customerName: user.name, customerEmail: user.email, customerPhone: user.phone, onSuccess: onPaid });
                  } catch (e) { alert(e.message); } finally { setCreatingCard(false); }
                }}
              >
                {creatingCard ? "Processing..." : "Pay & Create"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === "edit" || (view === "list" && editingCard)) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <UserCardGenerator user={user} existingCard={editingCard} selectedTemplate={selectedTemplate} onBack={() => { setView("list"); setEditingCard(null); }} onSaved={handleSaved} onPreview={handlePreview} />
        <CardPreviewModal isOpen={!!previewCard} onClose={() => setPreviewCard(null)} card={previewCard} />
      </div>
    );
  }

  return (
    <div className="w-full mx-auto font-poppins px-0 sm:px-6 lg:px-8 mt-0 sm:mt-6 max-w-full overflow-x-hidden pb-10">
      {/* Mobile-Only Wrapper */}
      <div className="lg:hidden">
        {/* Profile Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-10">
            <img src="/visitingLink-logo.png" alt="VisitingLink" className="h-7" />
            <button 
              onClick={() => setIsHelpModalOpen(true)}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full text-xs font-semibold"
            >
              <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">?</span> Help
            </button>
          </div>
          <div className="flex flex-col mb-8 mt-12">
            <div className="w-28 h-28 rounded-full overflow-hidden mb-6 shadow-md border-4 border-white">
              <img src={user?.photoURL || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150"} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Hello, {user?.name?.split(' ')[0] || 'User'}</h1>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium max-w-[280px]">Welcome to the Digital Business Card Collection. Design, create, and share your professional card in seconds.</p>
          </div>
        </div>

        {/* Dynamic Mobile Section */}
        <div className="px-4 pb-6">
          {hasCards ? (
            <div className="cards-active-view">
              <div className="flex items-center gap-2 mb-8 w-full overflow-x-auto scrollbar-hide pb-1">
                <button onClick={() => window.location.href = '/saved-cards'} className="flex items-center gap-3 bg-black text-white px-5 py-3 rounded-full shrink-0">
                  <CreditCard className="w-4 h-4" /><span className="text-[11px] font-bold">My Saved Cards</span>
                </button>
                <button onClick={startCreate} className="flex items-center gap-2 bg-[#6b00ff] text-white px-5 py-3 rounded-full shrink-0">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></div>
                  <span className="text-[11px] font-bold">New Card</span>
                </button>
              </div>
              <div className="grid gap-6">
                {cards.map((card) => (
                  <div key={card._id} className="border border-black/50 rounded-2xl p-6 flex flex-col bg-white relative shadow-sm border-2 border-black/40">
                    <button onClick={() => handleDelete(card._id)} className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
                    <div className="flex items-center gap-6 mb-6">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-inner"><img src={card.data?.logo || card.data?.media || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"} alt="Logo" className="w-full h-full object-cover" /></div>
                      <div>
                        <h2 className="text-lg font-extrabold text-slate-900 uppercase">{getCardDisplayName(card)}</h2>
                        <p className="text-[11px] text-slate-600 font-semibold">Company : {card.data?.companyName || card.data?.CompanyName || ""}</p>
                        <p className="text-[11px] text-slate-500 font-bold">Phone : {card.data?.phone || user?.phone || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setPreviewCard(card)} className="flex-1 py-3 items-center justify-center flex gap-2 border rounded-full text-xs font-bold"><Eye className="w-4 h-4" />Preview</button>
                      <button onClick={() => startEdit(card)} className="flex-[1] py-3 bg-black text-white rounded-full text-xs font-bold">Edit</button>
                      <button onClick={() => handleShare(card._id)} className="w-12 h-12 flex items-center justify-center border rounded-full text-slate-600"><Share2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="marketing-empty-view pb-10">
              {/* View Demo Button */}
              <button 
                onClick={() => navigate("/demo")}
                className="flex items-center gap-2 bg-[#ff1a1a] text-white px-6 py-2.5 rounded-full text-sm font-extrabold shadow-lg w-fit mb-8 transform hover:scale-105 transition-transform relative z-20"
              >
                <div className="p-2 rounded-full bg-white/20">
                  <Send className="w-3.5 h-3.5 -rotate-45" />
                </div> 
                View Demo
              </button>

              {/* Precise Marketing Container from Screenshot */}
              <div className="bg-gradient-to-b from-[#8B5CF6] to-[#F8FAFC] rounded-[2.5rem] px-6 py-3 text-white relative">
                <div className="relative z-10">
                  {/* Top Section: Heading + Image */}
                  <div className="flex flex-row items-start gap-0">
                    <h2 className="text-[32px] font-semibold leading-[1.05] tracking-tight flex-[1.2] pt-4">
                      Get your <img src="/bottom_bar_1.png" alt="Wifi" className="inline-block w-11 h-11 mb-1" /> <br />
                      Smart<br/> card One <br />
                      Step <br />
                      Away
                    </h2>
                    
                    <div className="relative flex-1 min-h-[420px] -mr-6 -mt-16">
                      {/* Black Card */}
                      <img 
                        src="/my-card-bg_card.png" 
                        alt="VisitingLink Card" 
                        className="absolute w-[220px] -rotate- -right-7 -top-10 drop-shadow-2xl max-w-none"
                      />
                      {/* Phone/Hand Foreground */}
                      <img 
                        src="/my-card-phone.png" 
                        alt="Phone Demo" 
                        className="absolute z-10 w-[330px] right-3 -top-2 drop-shadow-[0_25px_50px_rgba(0,0,0,0.6)] max-w-none"
                      />
                    </div>
                  </div>

                  {/* Centered Description */}
                  <p className="text-[14px] text-slate-200/90 leading-snug text-center font-medium max-w-[320px] mx-auto mb-8 -mt-3">
                    Our experts design your card. You'll receive a call after form submission. Your information is used for contact purposes only.
                  </p>

                  {/* Form Fields */}
                  <div className="space-y-3 mb-8">
                    <div className="bg-white rounded-[1.2rem] flex items-center px-6 py-3 gap-4 text-slate-900 shadow-xl">
                      <div className="p-1.5 rounded-full border border-blue-100 flex items-center justify-center">
                         <User className="text-[#3b82f6] w-4 h-4" />
                      </div>
                      <input placeholder="Your Name" className="bg-transparent border-none w-full focus:outline-none text-sm font-semibold placeholder:text-slate-400" />
                    </div>
                    <div className="bg-white rounded-[1.2rem] flex items-center px-6 py-3 gap-4 text-slate-900 shadow-xl">
                      <div className="p-1.5 rounded-full border border-blue-100 flex items-center justify-center">
                        <Smartphone className="text-[#3b82f6] w-4 h-4" />
                      </div>
                      <input placeholder="Your Phone Number" className="bg-transparent border-none w-full focus:outline-none text-sm font-semibold placeholder:text-slate-400" />
                    </div>
                    <div className="bg-white rounded-[1.2rem] flex items-center px-6 py-3 gap-4 text-slate-900 shadow-xl">
                      <div className="p-1.5 rounded-full border border-blue-100 flex items-center justify-center">
                        <HelpCircle className="text-[#3b82f6] w-4 h-4" />
                      </div>
                      <input placeholder="Your Email Address" className="bg-transparent border-none w-full focus:outline-none text-sm font-semibold placeholder:text-slate-400" />
                    </div>
                  </div>


                  {/* Bottom Buttons */}
                  <div className="flex gap-4 mb-6">
                    <button 
                      onClick={() => navigate("/demo")}
                      className="flex-1 bg-black text-white py-4 rounded-[1.2rem] font-bold text-sm shadow-xl border border-white/70 active:scale-95 transition-transform uppercase tracking-wider relative z-20"
                    >
                      Get own Card
                    </button>
                    <button 
                      onClick={() => window.open("https://wa.me/919236553585", "_blank")}
                      className="flex-1 bg-[#332b40] text-white py-4 rounded-[1.2rem] font-bold text-sm flex items-center justify-center gap-2 shadow-xl border border-white/70 active:scale-95 transition-transform"
                    >
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span className="uppercase tracking-wider">Hire Designer</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account & App Info (Visible on both) */}
        <div className="px-4 space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 ml-1">Account</h2>
            <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden px-4">
              {['Link your Number', 'My Profiles', 'My Order'].map((item, idx) => (
                <button key={item} className={`w-full flex items-center justify-between py-4 hover:bg-slate-50 transition-colors ${idx < 2 ? 'border-b border-slate-300' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                      {idx === 0 ? <CreditCard className="w-5 h-5" /> : idx === 1 ? <User className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800 ml-1">App Information</h2>
            <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm px-4 overflow-hidden">
              {['Tutorials', 'FAQs', 'Logout'].map((item, idx) => (
                <button 
                  key={item} 
                  onClick={item === 'Logout' ? async () => { await signOut(); navigate("/login"); } : undefined}
                  className={`w-full flex items-center justify-between py-4 hover:bg-slate-50 transition-colors ${idx < 2 ? 'border-b border-slate-300' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center ${item === 'Logout' ? 'text-red-400' : 'text-slate-400'}`}>
                      {idx === 0 ? <PlayCircle className="w-5 h-5" /> : idx === 1 ? <HelpCircle className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{item}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Content */}
      <div className="hidden lg:block">
        <div className="flex items-center justify-between mb-8 mt-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My cards</h1>
            <p className="text-sm text-slate-600">Choose a template, complete payment, then edit your card anytime.</p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New card
          </button>
        </div>

        {/* Desktop Request Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRequestResult({ ok: "", err: "" });
              setRequestForm({
                name: user?.name || "",
                email: user?.email || "",
                phone: user?.phone || "",
                message: "",
                businessType: "",
              });
              setRequestOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50"
          >
            <Send className="w-4 h-4" />
            Request us to create your card
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.length > 0 ? (
            cards.map((card) => (
              <div
                key={card._id}
                className="border border-black/50 rounded-2xl md:rounded-[2.5rem] p-6 flex flex-col justify-between bg-white relative shadow-sm md:border-b-4 md:border-slate-100 border-2 border-black/40 hover:shadow-md transition-shadow"
              >
                <div className="absolute top-5 right-5">
                  <button
                    type="button"
                    onClick={() => handleDelete(card._id)}
                    className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-row items-center gap-6 mb-6">
                  <div className="shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-inner bg-gradient-to-tr from-slate-50 to-white">
                      <img 
                        src={card.data?.logo || card.data?.media || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150"} 
                        alt={getCardDisplayName(card)} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-extrabold text-slate-900 mb-1 truncate uppercase tracking-tight">
                      {getCardDisplayName(card)}
                    </h2>
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-slate-600 font-semibold truncate">
                        Company Name : {card.data?.companyName || card.data?.CompanyName || ""}
                      </p>
                      <p className="text-[11px] text-slate-500 font-bold mb-1">
                        P : NO : {card.data?.phone || user?.phone || "N/A"}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        Date : {card.updatedAt ? new Date(card.updatedAt).toLocaleDateString('en-GB') : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full mt-auto">
                  <button
                    type="button"
                    onClick={() => setPreviewCard(card)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full border border-slate-200 text-slate-900 text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(card)}
                    className="flex-[1.5] flex items-center justify-center gap-2 py-3 rounded-full bg-black text-white text-xs font-bold shadow-lg shadow-black/10 hover:bg-slate-800 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare(card._id)}
                    className="w-12 h-12 flex items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="sm:col-span-2 lg:col-span-3 py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
               <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
               <p className="text-slate-500 font-medium">No cards found. Create your first one!</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CardPreviewModal isOpen={!!previewCard} onClose={() => setPreviewCard(null)} card={previewCard} />
      {shareCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex justify-between items-center mb-2"><h3 className="font-bold">Share your card</h3><button onClick={() => setShareCard(null)}><X className="w-5 h-5" /></button></div>
            <div className="flex gap-2"><input readOnly value={getShareableLink(shareCard)} className="flex-1 bg-slate-50 p-2 rounded text-xs" /><button onClick={copyShareLink} className="border p-2 rounded text-xs">{linkCopied ? "Copied" : "Copy"}</button></div>
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 border rounded-xl">{getBackendQrDataUrl(shareCard) ? <img src={getBackendQrDataUrl(shareCard)} className="w-[200px]" alt="QR" /> : <QRCodeCanvas ref={qrCanvasRef} value={getShareableLink(shareCard)} size={200} />}</div>
              <button onClick={downloadQrPng} className="border px-4 py-2 rounded-full text-xs">Download QR</button>
            </div>
          </div>
        </div>
      )}
      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 shadow-2xl">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setIsHelpModalOpen(false)}
          />
          <div className="relative bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Help & Support</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Get Assistance</p>
                </div>
              </div>
              <button 
                onClick={() => setIsHelpModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* WhatsApp Section */}
              <div className="bg-gradient-to-br from-[#00D95F]/10 to-emerald-50 rounded-3xl p-6 border border-[#00D95F]/20">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-[#00D95F] flex items-center justify-center shadow-lg shadow-[#00D95F]/20 mb-4">
                    <MessageCircle className="w-8 h-8 text-white fill-white/20" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 mb-2">Chat with an Expert</h4>
                  <p className="text-sm text-slate-600 font-medium mb-6">Need help designing your card or managing your profile? Our team is available 24/7 on WhatsApp.</p>
                  <button 
                    onClick={() => window.open("https://wa.me/919236553585", "_blank")}
                    className="w-full bg-[#00D95F] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-[#00D95F]/20 hover:bg-[#00c556] transition-all flex items-center justify-center gap-2"
                  >
                    Start Chatting
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest ml-1">Quick Guide</h4>
                <div className="space-y-3">
                  {[
                    { q: "How to edit my card?", a: "Simply click the 'Edit' button on your card preview to open the card designer and update your info anytime." },
                    { q: "Can I use my own logo?", a: "Yes! In the designer, you can upload your company logo or a personal profile photo." },
                    { q: "What is a shareable link?", a: "It's a unique link to your digital card. You can share it via WhatsApp, SMS, or post it on social media." }
                  ].map((faq, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                      <p className="text-[13px] font-black text-slate-900 mb-1">{faq.q}</p>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">VisitingLink © 2024</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
