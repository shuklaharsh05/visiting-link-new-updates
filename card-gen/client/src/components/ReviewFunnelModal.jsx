import React, { useMemo, useState } from "react";
import { X, Star } from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { submitCardRating, submitNegativeFeedback, trackGoogleReviewClick } from "../api/reviewFunnel";

function StarButton({ filled, active, onMouseEnter, onClick, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseEnter={onMouseEnter}
      onFocus={onMouseEnter}
      onClick={onClick}
      className="p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <Star
        className={[
          "h-10 w-10 transition-transform duration-150",
          active ? "scale-[1.06]" : "scale-100",
          filled ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-slate-300",
        ].join(" ")}
      />
    </button>
  );
}

export default function ReviewFunnelModal({ isOpen, onClose, googleReviewUrl, cardId }) {
  const { success: showSuccess, error: showError } = useToast();
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState("rate"); // rate | negative | positive

  const effectiveRating = hoverRating || selectedRating;
  const showNegative = step === "negative";
  const showPositive = step === "positive";

  const [form, setForm] = useState({ feedback: "", name: "", phone: "" });

  const brandLogo = useMemo(() => "/logo.svg", []);

  if (!isOpen) return null;

  const handleSelectRating = async (r) => {
    if (!cardId) return;
    setSelectedRating(r);
    setSubmitting(true);
    try {
      await submitCardRating(cardId, r);
      if (r <= 2) setStep("negative");
      else setStep("positive");
    } catch (err) {
      showError(err?.message || "Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!cardId) return;
    const feedback = form.feedback.trim();
    if (!feedback) {
      showError("Please enter feedback");
      return;
    }
    setSubmitting(true);
    try {
      await submitNegativeFeedback(cardId, {
        rating: selectedRating || 1,
        feedback,
        name: form.name.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });
      showSuccess("Feedback submitted. Thank you!");
      onClose();
      setStep("rate");
      setSelectedRating(0);
      setHoverRating(0);
      setForm({ feedback: "", name: "", phone: "" });
    } catch (err) {
      showError(err?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToGoogle = async () => {
    if (!googleReviewUrl) return;
    try {
      if (cardId) await trackGoogleReviewClick(cardId);
    } catch {
      // Don't block redirect
    }
    window.open(googleReviewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-funnel-title"
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <img src={brandLogo} alt="Brand logo" className="h-7 w-auto" />
            <h3 id="review-funnel-title" className="text-sm font-semibold text-slate-900 truncate">
              Rate your experience
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-slate-100 text-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {step === "rate" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Tap a star to rate. It only takes a second.
              </p>
              <div
                className="flex items-center justify-center gap-1"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((r) => (
                  <StarButton
                    key={r}
                    label={`${r} star`}
                    active={effectiveRating === r}
                    filled={effectiveRating >= r}
                    onMouseEnter={() => setHoverRating(r)}
                    onClick={() => handleSelectRating(r)}
                  />
                ))}
              </div>
              <div className="text-center text-xs text-slate-500">
                {selectedRating ? `You selected ${selectedRating}/5` : " "}
              </div>
              {submitting ? (
                <div className="text-center text-xs text-slate-500">Saving…</div>
              ) : null}
            </div>
          ) : null}

          {showNegative ? (
            <div className="space-y-4 animate-[fadeIn_.2s_ease-out]">
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
                <p className="text-sm font-semibold text-rose-900">
                  We’re sorry to hear that 😔
                </p>
                <p className="text-xs text-rose-800 mt-1">
                  Please tell us what went wrong. Your feedback helps us improve.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700">Feedback *</label>
                <textarea
                  value={form.feedback}
                  onChange={(e) => setForm((p) => ({ ...p, feedback: e.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300"
                  placeholder="Describe what we can do better…"
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Name (optional)</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300"
                    disabled={submitting}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone (optional)</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300"
                    disabled={submitting}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Feedback"}
              </button>
            </div>
          ) : null}

          {showPositive ? (
            <div className="space-y-4 animate-[fadeIn_.2s_ease-out]">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-sm font-semibold text-emerald-900">Thank you for your feedback ❤️</p>
                <p className="text-xs text-emerald-800 mt-1">
                  If you have a moment, please leave a Google review. It really helps.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGoToGoogle}
                className="w-full inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-700"
              >
                Leave a Review on Google
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Not now
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

