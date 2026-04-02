const DEFAULT_CARD_SITE = import.meta.env.VITE_CARD_PUBLIC_URL || "https://teamserver.cloud";

/**
 * Preview is always the real card UI served from the main app (iframe).
 * Unsaved cards should not open this modal — gate in the parent.
 */
export default function CardPreviewModal({ isOpen, onClose, card }) {
  if (!isOpen || !card) return null;

  const isDraft = card._isDraft === true;
  const hasId = !isDraft && !!card._id;
  const backendUrl =
    card.shareableLink ||
    card.shareable_link ||
    card.publicUrl ||
    card.public_url ||
    null;
  const siteUrl =
    backendUrl || (hasId ? `${DEFAULT_CARD_SITE.replace(/\/$/, "")}/cards/${card._id}` : null);

  if (!hasId || !siteUrl) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center">
          <p className="text-sm text-slate-700">Save your card first to preview it.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 sm:px-8">
      <div className="bg-black rounded-2xl w-full max-w-3xl h-[80vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <h2 className="text-sm font-medium text-slate-100">Live preview</h2>
          <div className="flex items-center gap-2">
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 underline"
            >
              Open in new tab
            </a>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
        <iframe title="Card preview" src={siteUrl} className="flex-1 w-full border-0 bg-slate-900" />
      </div>
    </div>
  );
}
