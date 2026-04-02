import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiService } from "../lib/api.js";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Header from "../components/sections/Header.jsx";
import Footer from "../components/sections/Footer.jsx";
import { detailsSchemas } from "../schemas/detailsSchemas.js";

function keyToLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .replace(/_/g, " ")
    .trim();
}

export default function DetailsForm() {
  const { detailsId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [config, setConfig] = useState(null);
  // All details values (single + multiple) keyed by field.name
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  useEffect(() => {
    if (!detailsId) {
      setError("Invalid link");
      setLoading(false);
      return;
    }
    const fetchConfig = async () => {
      try {
        const response = await apiService.getDetailsByToken(detailsId);
        if (response.success && response.data) {
          const cfg = response.data;
          const schema = detailsSchemas[cfg.categoryId] || { fields: [] };

          setConfig({
            categoryId: cfg.categoryId,
            fields: schema.fields || [],
          });

          // Prefill only from previously submitted details (not from card data)
          const initialDetails = cfg.detailsData || {};
          setValues(initialDetails);

          if (cfg.submittedAt) {
            setSubmitted(true);
          }
        } else {
          setError(response.error || "Link not found or expired");
        }
      } catch (err) {
        setError(err?.message || "Failed to load form");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [detailsId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await apiService.submitDetailsByToken(detailsId, values);
      if (response.success) {
        setSubmitted(true);
        setShowThankYou(true);
      } else {
        setError(response.error || "Failed to submit");
      }
    } catch (err) {
      setError(err?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!showThankYou) return;
    const timer = setTimeout(() => {
      setShowThankYou(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [showThankYou]);

  const pageContent = (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 pt-24 pb-12 px-2">
      <div className="max-w-[1250px] mx-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Loader2 className="h-12 w-12 text-blue-700 animate-spin" />
            <p className="mt-4 text-gray-600">Loading your form…</p>
          </div>
        )}

        {!loading && error && !config && (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid or expired link</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-700 text-white rounded-full font-semibold hover:bg-blue-800 transition"
              >
                Back to VisitingLink
              </Link>
            </div>
          </div>
        )}

        {/* Success popup: shows for 3 seconds after successful submission */}
        {!loading && showThankYou && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            role="alert"
            aria-live="polite"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md w-full text-center">
              <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-600">
                Your details have been submitted. They will be used to complete your digital card on VisitingLink.
              </p>
              <p className="mt-3 text-sm text-gray-500">This message will close in 3 seconds.</p>
            </div>
          </div>
        )}

        {!loading && config && (!config.fields || config.fields.length === 0) && (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
              <p className="text-gray-600 mb-6">No fields to fill for this card.</p>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-700 text-white rounded-full font-semibold hover:bg-blue-800 transition"
              >
                Back to VisitingLink
              </Link>
            </div>
          </div>
        )}

        {!loading && config && (config.fields || []).length > 0 && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-8">
              <div className="text-center mb-6 p-2">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete your digital card</h1>
                <p className="text-gray-600">
                  You’ve been sent a link to add your details. Fill in the fields below so we can build your all-in-one digital identity on VisitingLink.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Render fields from template schema */}
                <div className="space-y-4">
                  {config.fields.map((field) => {
                    const name = field.name;
                    const type = field.type;
                    const isMultiple = !!field.multiple;

                    // Skip pure image fields on details page
                    if (type === "image") return null;

                    // Single-value text-like fields
                    if (
                      !isMultiple &&
                      ["text", "textarea", "email", "tel", "url", "number"].includes(
                        type
                      )
                    ) {
                      const val = values[name] ?? "";
                      return (
                        <div key={name}>
                          <label
                            htmlFor={name}
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            {field.label || keyToLabel(name)}
                          </label>
                          {type === "textarea" ? (
                            <textarea
                              id={name}
                              name={name}
                              value={val}
                              onChange={handleChange}
                              rows={3}
                              className="text-sm lg:text-base w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
                            />
                          ) : (
                            <input
                              id={name}
                              name={name}
                              type="text"
                              value={val}
                              onChange={handleChange}
                              className="text-sm lg:text-base w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
                            />
                          )}
                        </div>
                      );
                    }

                    // Multiple (array) fields with itemSchema
                    if (
                      isMultiple &&
                      field.itemSchema &&
                      typeof field.itemSchema === "object"
                    ) {
                      const items = Array.isArray(values[name])
                        ? values[name]
                        : [];
                      const subKeys = Object.keys(field.itemSchema || {});
                      const label = field.label || keyToLabel(name);

                      return (
                        <div
                          key={name}
                          className="border-t border-gray-100 pt-4 space-y-3"
                        >
                          <h2 className="text-sm font-semibold text-gray-900 mb-1">
                            {label}
                          </h2>
                          <p className="text-xs text-gray-500 mb-2">
                            Add one or more entries for {label.toLowerCase()}.
                          </p>
                          <div className="space-y-3">
                            {items.map((item, idx) => (
                              <div
                                key={idx}
                                className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-medium text-gray-600">
                                    {label} #{idx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setValues((prev) => {
                                        const current = Array.isArray(prev[name])
                                          ? [...prev[name]]
                                          : [];
                                        const next = current.filter(
                                          (_, i) => i !== idx
                                        );
                                        return { ...prev, [name]: next };
                                      })
                                    }
                                    className="text-xs text-red-500 hover:text-red-600"
                                  >
                                    Remove
                                  </button>
                                </div>
                                {subKeys.map((subKey) => {
                                  // Skip obviously image-like subfields
                                  if (subKey.toLowerCase().includes("image")) {
                                    return null;
                                  }
                                  const subVal = item?.[subKey] ?? "";
                                  const subLabel = keyToLabel(subKey);
                                  return (
                                    <div key={subKey}>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        {subLabel}
                                      </label>
                                      <input
                                        type="text"
                                        value={subVal}
                                        onChange={(e) =>
                                          setValues((prev) => {
                                            const current = Array.isArray(
                                              prev[name]
                                            )
                                              ? [...prev[name]]
                                              : [];
                                            const updated = current[idx] || {};
                                            updated[subKey] = e.target.value;
                                            current[idx] = updated;
                                            return { ...prev, [name]: current };
                                          })
                                        }
                                        className="text-sm lg:text-base w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                setValues((prev) => {
                                  const current = Array.isArray(prev[name])
                                    ? [...prev[name]]
                                    : [];
                                  const emptyItem = {};
                                  subKeys.forEach((k) => {
                                    emptyItem[k] = "";
                                  });
                                  current.push(emptyItem);
                                  return { ...prev, [name]: current };
                                })
                              }
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700"
                            >
                              + Add {label.toLowerCase()}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-6 py-3 px-4 bg-blue-700 text-white font-semibold rounded-full hover:bg-blue-800 focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? "Submitting…" : submitted ? "Edit details" : "Add details"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );

  return (
    <div className="overflow-x-hidden">
      <Header />
      {pageContent}
      <Footer />
    </div>
  );
}
