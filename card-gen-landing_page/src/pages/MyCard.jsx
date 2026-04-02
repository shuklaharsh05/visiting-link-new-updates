import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { apiService } from "../lib/api.js";
import { Plus, Eye, Trash2, CreditCard, ArrowLeft, Send, X } from "lucide-react";
import CardPreviewModal from "../components/CardPreviewModal.jsx";
import UserCardGenerator from "../components/UserCardGenerator.jsx";
import { useTemplateRazorpay } from "../hooks/useTemplateRazorpay.js";

export default function MyCard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [view, setView] = useState("list"); // "list" | "create" | "edit"
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

  const { initiateTemplatePayment, loading: paymentLoading } = useTemplateRazorpay();

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

    setTemplates(
      resolvedTemplates.length > 0
        ? resolvedTemplates
        : [{ categoryId: "link-pro", templateId: "link-pro-classic", name: "Link Pro" }]
    );
  };

  const startEdit = (card) => {
    setEditingCard(card);
    setSelectedTemplate({
      categoryId: card.categoryId,
      templateId: card.templateId,
      name: card.templateId,
    });
    setView("edit");
  };

  const handleSaved = async () => {
    setView("list");
    setEditingCard(null);
    const res = await apiService.getMyCards();
    if (res.success && Array.isArray(res.data)) setCards(res.data);
  };

  const handlePreview = async (card) => {
    setPreviewCard(card);
    const res = await apiService.getMyCards();
    if (res.success && Array.isArray(res.data)) setCards(res.data);
  };

  const handleDelete = async (cardId) => {
    if (!window.confirm("Delete this card?")) return;
    await apiService.deleteCard(cardId);
    setCards((prev) => prev.filter((c) => c._id !== cardId));
    if (editingCard?._id === cardId) {
      setView("list");
      setEditingCard(null);
    }
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
          <button
            type="button"
            onClick={() => setView("list")}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h2 className="text-lg font-semibold text-slate-900">Choose a template</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {templates.map((tpl) => (
            <div
              key={`${tpl.categoryId}-${tpl.templateId}`}
            >
              <div className="relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-center transition-colors">
                <button
                  type="button"
                  onClick={() => setTemplatePreview(tpl)}
                  className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <CreditCard className="w-8 h-8 text-slate-500" />
                <span className="text-sm font-medium text-slate-900">{tpl.name}</span>
                {tpl.description ? (
                  <span className="text-xs text-slate-500">{tpl.description}</span>
                ) : null}
                <div className="mt-1 text-xs font-semibold text-slate-900">
                  {typeof tpl.price === "number" && tpl.price > 0 ? `₹${tpl.price}` : "Free"}
                </div>

                <button
                  type="button"
                  disabled={creatingCard || paymentLoading}
                  onClick={() => setPayingTemplate(tpl)}
                  className="mt-2 w-full inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-3 py-2 text-xs font-semibold disabled:opacity-60"
                >
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Template preview modal (lightweight: metadata + preview text) */}
        {templatePreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">
                  {templatePreview.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setTemplatePreview(null)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-2">
                <div className="text-sm text-slate-700">
                  <div className="font-semibold">
                    Price:{" "}
                    {typeof templatePreview.price === "number" && templatePreview.price > 0
                      ? `₹${templatePreview.price}`
                      : "Free"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {templatePreview.categoryName || templatePreview.categoryId} ·{" "}
                    {templatePreview.templateId}
                  </div>
                </div>
                {templatePreview.description ? (
                  <p className="text-sm text-slate-700">{templatePreview.description}</p>
                ) : null}
                {templatePreview.preview ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {templatePreview.preview}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">
                    Preview not available for this template.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment popup */}
        {payingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">Complete payment</h3>
                <button
                  type="button"
                  onClick={() => !creatingCard && !paymentLoading && setPayingTemplate(null)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 disabled:opacity-60"
                  aria-label="Close"
                  disabled={creatingCard || paymentLoading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div className="text-sm text-slate-800">
                  <div className="font-semibold">{payingTemplate.name}</div>
                  <div className="text-xs text-slate-500">
                    {payingTemplate.categoryName || payingTemplate.categoryId} · {payingTemplate.templateId}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-slate-700">Amount</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {typeof payingTemplate.price === "number" && payingTemplate.price > 0
                      ? `₹${payingTemplate.price}`
                      : "Free"}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={creatingCard || paymentLoading}
                  onClick={async () => {
                    if (!user) return;
                    setCreatingCard(true);
                    try {
                      const onPaid = async () => {
                        // Create blank card immediately after payment (or free selection)
                        const payload = {
                          name: "",
                          categoryId: payingTemplate.categoryId,
                          templateId: payingTemplate.templateId,
                          data: {},
                          hiddenFields: [],
                          customizations: {},
                          isCustom: false,
                        };
                        const res = await apiService.createCard(payload);
                        if (!res.success) throw new Error(res.error || "Failed to create card");
                        const created = res.data?.card || res.card || res.data || null;
                        if (!created?._id) throw new Error("Card created but missing id");

                        setEditingCard(created);
                        setSelectedTemplate({
                          categoryId: created.categoryId,
                          templateId: created.templateId,
                          name: payingTemplate.name,
                        });
                        setPayingTemplate(null);
                        setView("edit");
                      };

                      const price = typeof payingTemplate.price === "number" ? payingTemplate.price : 0;
                      if (price <= 0) {
                        await onPaid();
                        return;
                      }

                      await initiateTemplatePayment({
                        categoryId: payingTemplate.categoryId,
                        templateId: payingTemplate.templateId,
                        templateName: payingTemplate.name,
                        customerName: user.name,
                        customerEmail: user.email,
                        customerPhone: user.phone,
                        onSuccess: async () => {
                          await onPaid();
                        },
                        onFailure: () => {},
                      });
                    } catch (e) {
                      // keep modal open; user can retry
                      console.error(e);
                      alert(e?.message || "Failed to create card");
                    } finally {
                      setCreatingCard(false);
                    }
                  }}
                  className="w-full inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                >
                  {creatingCard || paymentLoading ? "Processing…" : "Pay & Create Card"}
                </button>

                <p className="text-xs text-slate-500">
                  After payment, your card will be created immediately and you’ll be redirected to edit it.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === "create" || view === "edit") {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <UserCardGenerator
          key={
            editingCard?._id ||
            (selectedTemplate
              ? `${selectedTemplate.categoryId}-${selectedTemplate.templateId}`
              : "new")
          }
          user={user}
          existingCard={editingCard}
          selectedTemplate={selectedTemplate}
          onBack={() => {
            if (editingCard) {
              setView("list");
              setEditingCard(null);
            } else {
              setView("template");
            }
          }}
          onSaved={handleSaved}
          onPreview={handlePreview}
        />
        <CardPreviewModal
          isOpen={!!previewCard}
          onClose={() => setPreviewCard(null)}
          card={previewCard}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My cards</h1>
          <p className="text-sm text-slate-600">
            Choose a template, complete payment, then edit your card anytime.
          </p>
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

      {cards.length > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card._id}
              className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between bg-white"
            >
              <div>
                <h2 className="text-sm font-semibold text-slate-900 mb-1">
                  {card.name || card.data?.CompanyName || card.data?.name || "Untitled card"}
                </h2>
                <p className="text-xs text-slate-500 mb-2">
                  {card.categoryId} · {card.templateId}
                  <br />
                  Updated {card.updatedAt ? new Date(card.updatedAt).toLocaleDateString() : ""}
                  {card.lastEditedBy ? (
                    <>
                      <br />
                      Edited by {card.lastEditedBy}
                    </>
                  ) : null}
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewCard(card)}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-700"
                >
                  <Eye className="w-3 h-3" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(card)}
                  className="flex-1 inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-3 py-1.5 text-xs"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(card._id)}
                  className="inline-flex items-center justify-center rounded-full border border-red-200 text-red-600 px-2 py-1 text-xs"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CardPreviewModal
        isOpen={!!previewCard}
        onClose={() => setPreviewCard(null)}
        card={previewCard}
      />

      {requestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Request a card</h3>
              <button
                type="button"
                onClick={() => setRequestOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>
            <form
              className="p-5 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setRequestResult({ ok: "", err: "" });
                setRequestSubmitting(true);
                try {
                  const res = await apiService.submitInquiry(requestForm);
                  if (!res.success) {
                    setRequestResult({ ok: "", err: res.error || "Failed to submit request" });
                    return;
                  }
                  setRequestResult({ ok: "Request submitted. Our team will contact you soon.", err: "" });
                } finally {
                  setRequestSubmitting(false);
                }
              }}
            >
              {requestResult.ok ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {requestResult.ok}
                </div>
              ) : null}
              {requestResult.err ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {requestResult.err}
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
                  <input
                    value={requestForm.name}
                    onChange={(e) => setRequestForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    required
                    disabled={requestSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    value={requestForm.phone}
                    onChange={(e) => setRequestForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    required
                    disabled={requestSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={requestForm.email}
                  onChange={(e) => setRequestForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  required
                  disabled={requestSubmitting}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Business type (optional)</label>
                <input
                  value={requestForm.businessType}
                  onChange={(e) => setRequestForm((p) => ({ ...p, businessType: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  disabled={requestSubmitting}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Message (optional)</label>
                <textarea
                  value={requestForm.message}
                  onChange={(e) => setRequestForm((p) => ({ ...p, message: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  rows={4}
                  disabled={requestSubmitting}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRequestOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm border border-slate-300 text-slate-700"
                  disabled={requestSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm bg-slate-900 text-white"
                  disabled={requestSubmitting}
                >
                  {requestSubmitting ? "Submitting…" : "Submit request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
