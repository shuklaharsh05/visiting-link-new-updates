import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { apiService } from "../lib/api.js";
import MediaManager from "./MediaManager.jsx";
import TemplateFieldsForm from "./TemplateFieldsForm.jsx";
import { linkProSchema, getDefaultCardData } from "../schemas/linkProSchema.js";

const LINK_PRO_TEMPLATE = "link-pro-classic";

/**
 * User card builder: no inquiry; uses createdBy via API.
 * Link Pro uses the full local schema UI; other templates use API template fields + TemplateFieldsForm.
 * Preview is iframe-only after save (see parent + CardPreviewModal).
 */
export default function UserCardGenerator({ user, existingCard, selectedTemplate, onBack, onSaved, onPreview }) {
  const [cardName, setCardName] = useState("");
  const [cardData, setCardData] = useState({});
  const [templateDetail, setTemplateDetail] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [savedServerCard, setSavedServerCard] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [hiddenFields, setHiddenFields] = useState([]);
  const [collapsedFields, setCollapsedFields] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaTargetField, setMediaTargetField] = useState(null);
  const [mediaDefaultTab, setMediaDefaultTab] = useState("image");
  const [mediaMultiSelect, setMediaMultiSelect] = useState(false);
  const [assetRefs, setAssetRefs] = useState({});
  const [mediaUploading, setMediaUploading] = useState(false);
  const userFilePickerRef = useRef(null);
  const [userFilePicker, setUserFilePicker] = useState({
    accept: "image/*",
    multiple: false,
    mediaType: "image",
  });

  const categoryId = selectedTemplate?.categoryId || existingCard?.categoryId;
  const templateId =
    selectedTemplate?.templateId || existingCard?.templateId || LINK_PRO_TEMPLATE;

  const useRichLinkPro = templateDetail?.layout?.card === "link-pro";

  useEffect(() => {
    if (existingCard?._id) {
      setSavedServerCard(existingCard);
    } else {
      setSavedServerCard(null);
    }
  }, [existingCard?._id]);

  useEffect(() => {
    let cancelled = false;
    async function loadTemplate() {
      const cat = selectedTemplate?.categoryId || existingCard?.categoryId;
      const tid = selectedTemplate?.templateId || existingCard?.templateId;
      if (!cat || !tid) {
        setLoadingTemplate(false);
        setTemplateDetail(null);
        return;
      }
      setLoadingTemplate(true);
      const res = await apiService.getTemplate(cat, tid);
      if (cancelled) return;
      if (!res.success || !res.data?.template) {
        setError(res.error || "Could not load template.");
        setTemplateDetail(null);
        setLoadingTemplate(false);
        return;
      }
      const tpl = res.data.template;
      setTemplateDetail(tpl);

      const rich = tpl.layout?.card === "link-pro";
      if (existingCard) {
        setCardName(existingCard.name || existingCard.data?.CompanyName || user?.name || "");
        if (rich) {
          setCardData({ ...getDefaultCardData(), ...(existingCard.data || {}) });
        } else {
          setCardData({ ...(tpl.sampleData || {}), ...(existingCard.data || {}) });
        }
        setAssetRefs(existingCard.data?._assetRefs || {});
      } else {
        if (rich) {
          const defaults = getDefaultCardData();
          if (user) {
            if (!defaults.CompanyName) defaults.CompanyName = user.name || "";
            if (!defaults.email) defaults.email = user.email || "";
            if (!defaults.phoneNumber) defaults.phoneNumber = user.phone || "";
          }
          setCardName(user?.name || "");
          setCardData(defaults);
        } else {
          const initial = { ...(tpl.sampleData || {}) };
          if (user) {
            if (!initial.companyName) initial.companyName = user.name || "";
            if (!initial.email) initial.email = user.email || "";
            if (!initial.phoneNumber) initial.phoneNumber = user.phone || "";
          }
          setCardName(user?.name || initial.companyName || "");
          setCardData(initial);
        }
        setAssetRefs({});
      }
      setLoadingTemplate(false);
    }
    loadTemplate();
    return () => {
      cancelled = true;
    };
  }, [
    selectedTemplate?.categoryId,
    selectedTemplate?.templateId,
    existingCard?._id,
    user,
  ]);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(""), 3500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const schema = linkProSchema;

  const toggleFieldCollapse = (fieldName) => {
    setCollapsedFields((prev) => ({ ...prev, [fieldName]: !prev?.[fieldName] }));
  };
  const toggleSectionCollapse = (sectionId) => {
    setCollapsedSections((prev) => ({ ...prev, [sectionId]: !prev?.[sectionId] }));
  };
  const toggleFieldVisibility = (fieldName) => {
    setHiddenFields((prev) =>
      prev.includes(fieldName) ? prev.filter((f) => f !== fieldName) : [...prev, fieldName]
    );
  };

  const handleFieldChange = (fieldName, value) => {
    setCardData((prev) => ({ ...prev, [fieldName]: value }));
  };
  const handleObjectFieldChange = (fieldName, subField, value) => {
    setCardData((prev) => ({
      ...prev,
      [fieldName]: { ...(prev[fieldName] || {}), [subField]: value },
    }));
  };
  const handleArrayItemChange = (fieldName, index, subField, value) => {
    setCardData((prev) => {
      const arr = Array.isArray(prev[fieldName]) ? [...prev[fieldName]] : [];
      const item = { ...(arr[index] || {}) };
      item[subField] = value;
      arr[index] = item;
      return { ...prev, [fieldName]: arr };
    });
  };
  const addArrayItem = (fieldName, defaultItem) => {
    setCardData((prev) => ({
      ...prev,
      [fieldName]: [...(prev[fieldName] || []), defaultItem],
    }));
  };
  const removeArrayItem = (fieldName, index) => {
    setCardData((prev) => ({
      ...prev,
      [fieldName]: (prev[fieldName] || []).filter((_, i) => i !== index),
    }));
  };
  const addNestedArrayItem = (fieldName, index, nestedKey, defaultItem) => {
    setCardData((prev) => {
      const arr = Array.isArray(prev[fieldName]) ? [...prev[fieldName]] : [];
      const parent = { ...(arr[index] || {}) };
      const nested = Array.isArray(parent[nestedKey]) ? [...parent[nestedKey]] : [];
      nested.push(defaultItem);
      parent[nestedKey] = nested;
      arr[index] = parent;
      return { ...prev, [fieldName]: arr };
    });
  };
  const removeNestedArrayItem = (fieldName, index, nestedKey, nestedIndex) => {
    setCardData((prev) => {
      const arr = Array.isArray(prev[fieldName]) ? [...prev[fieldName]] : [];
      const parent = { ...(arr[index] || {}) };
      const nested = (parent[nestedKey] || []).filter((_, i) => i !== nestedIndex);
      parent[nestedKey] = nested;
      arr[index] = parent;
      return { ...prev, [fieldName]: arr };
    });
  };
  const updateNestedArrayItem = (fieldName, index, nestedKey, nestedIndex, subField, value) => {
    setCardData((prev) => {
      const arr = Array.isArray(prev[fieldName]) ? [...prev[fieldName]] : [];
      const parent = { ...(arr[index] || {}) };
      const nested = [...(parent[nestedKey] || [])];
      const item = { ...(nested[nestedIndex] || {}) };
      item[subField] = value;
      nested[nestedIndex] = item;
      parent[nestedKey] = nested;
      arr[index] = parent;
      return { ...prev, [fieldName]: arr };
    });
  };

  const openMediaForField = (fieldName, defaultTab = "image", options = {}) => {
    const tab = defaultTab || "image";
    const multi = options?.multiSelect ?? false;
    const accept =
      tab === "pdf"
        ? "application/pdf"
        : tab === "video"
          ? "video/*"
          : "image/*";

    // User flow: open native file picker directly (no media library UI).
    setMediaTargetField(fieldName);
    setMediaDefaultTab(tab);
    setMediaMultiSelect(!!multi);
    setUserFilePicker({ accept, multiple: !!multi, mediaType: tab });
    setTimeout(() => userFilePickerRef.current?.click(), 0);
  };

  const handleUserPickedFiles = async (e) => {
    const picked = Array.from(e.target.files || []);
    // allow re-picking same file next time
    e.target.value = "";
    if (picked.length === 0) return;
    if (!mediaTargetField) return;

    setSaving(true);
    setMediaUploading(true);
    setError("");
    try {
      const type = userFilePicker.mediaType || "image";

      if (userFilePicker.multiple) {
        const res = await apiService.uploadMultipleMedia(picked, {
          type,
          customFolder: "user-cards",
        });
        if (!res.success) {
          setError(res.error || "Upload failed");
          return;
        }
        const medias = (res.results || [])
          .map((r) => r?.media)
          .filter((m) => m && m.url);
        if (medias.length === 0) {
          setError("Upload failed");
          return;
        }
        handleMediaSelect(medias);
        return;
      }

      const file = picked[0];
      const replacePublicId = assetRefs[mediaTargetField] || "";
      const res = await apiService.uploadMedia(file, {
        type,
        customFolder: "user-cards",
        replacePublicId,
      });
      if (!res.success || !res.media?.url) {
        setError(res.error || "Upload failed");
        return;
      }
      const media = res.media;
      if (media.publicId) {
        setAssetRefs((prev) => ({ ...prev, [mediaTargetField]: media.publicId }));
      }
      handleMediaSelect(media);
    } catch (err) {
      setError(err?.message || "Upload failed");
    } finally {
      setSaving(false);
      setMediaUploading(false);
    }
  };

  const handleMediaSelect = (media) => {
    if (!mediaTargetField) {
      setMediaOpen(false);
      setMediaTargetField(null);
      return;
    }
    const url = media?.url;
    const urls = Array.isArray(media) ? media.map((m) => m?.url).filter(Boolean) : url ? [url] : [];

    if (Array.isArray(media) && media.length > 0 && urls.length > 0) {
      const galleryMatch = mediaTargetField.match(/^galleryCategories\[(\d+)\]\.images$/);
      if (galleryMatch) {
        const idx = parseInt(galleryMatch[1], 10);
        setCardData((prev) => {
          const cats = [...(prev.galleryCategories || [])];
          if (!cats[idx]) return prev;
          const newImages = urls.map((u) => ({ image: u }));
          cats[idx] = { ...cats[idx], images: newImages };
          return { ...prev, galleryCategories: cats };
        });
        setMediaOpen(false);
        setMediaTargetField(null);
        setMediaMultiSelect(false);
        return;
      }
      if (mediaTargetField === "ourClients") {
        setCardData((prev) => ({
          ...prev,
          ourClients: [...(prev.ourClients || []), ...urls.map((u) => ({ image: u }))],
        }));
        setMediaOpen(false);
        setMediaTargetField(null);
        setMediaMultiSelect(false);
        return;
      }
    }

    if (mediaTargetField === "catalogue" && url) {
      handleFieldChange("catalogue", url);
      setMediaOpen(false);
      setMediaTargetField(null);
      return;
    }

    if (mediaTargetField.includes("[") && mediaTargetField.includes("]")) {
      const deepMatch = mediaTargetField.match(/^([^\[]+)\[(\d+)\]\.([^\[]+)\[(\d+)\]\.([^\.]+)$/);
      if (deepMatch && url) {
        const [, fieldName, indexStr, nestedKey, nestedIndexStr, leafKey] = deepMatch;
        updateNestedArrayItem(
          fieldName,
          parseInt(indexStr),
          nestedKey,
          parseInt(nestedIndexStr),
          leafKey,
          url
        );
      } else {
        const match = mediaTargetField.match(/^(.+)\[(\d+)\]\.([^\.]+)$/);
        if (match && url) {
          const [, fieldName, indexStr, subField] = match;
          handleArrayItemChange(fieldName, parseInt(indexStr), subField, url);
        }
      }
    } else if (url) {
      const current = cardData[mediaTargetField];
      if (Array.isArray(current)) {
        handleFieldChange(mediaTargetField, [...current, url]);
      } else {
        handleFieldChange(mediaTargetField, url);
      }
    }
    setMediaOpen(false);
    setMediaTargetField(null);
    setMediaMultiSelect(false);
  };

  const handleSave = async () => {
    setError("");
    if (!cardName?.trim()) {
      setError("Please enter a card name.");
      return null;
    }
    if (!categoryId || !templateId) {
      setError("Missing template. Go back and select a template.");
      return null;
    }
    setSaving(true);
    try {
      const payload = {
        name: cardName.trim(),
        categoryId,
        templateId,
        data: { ...cardData, _assetRefs: assetRefs },
        hiddenFields: hiddenFields || [],
        customizations: {},
        isCustom: false,
      };
      let res;
      if (existingCard?._id) {
        res = await apiService.updateCard(existingCard._id, payload);
      } else {
        res = await apiService.createCard(payload);
      }
      if (!res.success) {
        setError(res.error || res.message || "Failed to save card.");
        return null;
      }
      const saved = res.data?.card || res.data || null;
      if (saved) setSavedServerCard(saved);
      if (onSaved) onSaved(saved);
      return saved;
    } catch (err) {
      setError(err?.message || "Failed to save card.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const uploadFieldImage = async (fieldPath, file, mediaType = "image") => {
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      const replacePublicId = assetRefs[fieldPath] || "";
      const result = await apiService.uploadMedia(file, {
        type: mediaType,
        customFolder: "user-cards",
        replacePublicId,
      });
      if (!result.success || !result.media?.url) {
        setError(result.error || "Upload failed");
        return;
      }
      const url = result.media.url;
      const newPublicId = result.media.publicId || "";
      if (fieldPath.includes("[") && fieldPath.includes("]")) {
        const deepMatch = fieldPath.match(/^([^\[]+)\[(\d+)\]\.([^\[]+)\[(\d+)\]\.([^\.]+)$/);
        if (deepMatch) {
          const [, fieldName, indexStr, nestedKey, nestedIndexStr, leafKey] = deepMatch;
          updateNestedArrayItem(fieldName, parseInt(indexStr, 10), nestedKey, parseInt(nestedIndexStr, 10), leafKey, url);
        } else {
          const match = fieldPath.match(/^(.+)\[(\d+)\]\.([^\.]+)$/);
          if (match) {
            const [, fieldName, indexStr, subField] = match;
            handleArrayItemChange(fieldName, parseInt(indexStr, 10), subField, url);
          }
        }
      } else {
        handleFieldChange(fieldPath, url);
      }
      setAssetRefs((prev) => ({ ...prev, [fieldPath]: newPublicId }));
    } catch (uploadErr) {
      setError(uploadErr?.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const id = existingCard?._id || savedServerCard?._id;
    if (!id) {
      setToastMessage("Save the card to get the preview.");
      return;
    }
    if (!onPreview) return;
    const base = savedServerCard || existingCard;
    onPreview({
      ...base,
      _id: id,
      name: cardName.trim(),
      data: { ...cardData, _assetRefs: assetRefs },
      hiddenFields,
      customizations: {},
      categoryId: categoryId || base?.categoryId,
      templateId: templateId || base?.templateId,
    });
  };

  const renderField = (fieldName, fieldConfig, options = {}) => {
    const isHidden = hiddenFields.includes(fieldName);
    const value = cardData[fieldName];
    const noFieldCollapse = options.noFieldCollapse === true;
    const isCollapsed = noFieldCollapse ? false : !!collapsedFields?.[fieldName];

    const labelBlock = (labelContent) => (
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!noFieldCollapse && (
            <button
              type="button"
              onClick={() => toggleFieldCollapse(fieldName)}
              className="text-gray-500 hover:text-gray-700"
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
            </button>
          )}
          <label className={`block text-sm font-medium ${isHidden ? "text-gray-500" : "text-gray-700"}`}>
            {labelContent}
            {fieldConfig.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        </div>
        <button
          type="button"
          onClick={() => toggleFieldVisibility(fieldName)}
          className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          title={isHidden ? "Show on card" : "Hide from card"}
        >
          {isHidden ? "Hidden" : "Visible"}
        </button>
      </div>
    );

    const inputClass = `w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isHidden ? "bg-gray-50" : ""}`;
    const blockClass = `mb-3 rounded-lg border p-3 ${isHidden ? "border-gray-300 bg-gray-50 opacity-60" : "border-gray-200 bg-white"}`;

    switch (fieldConfig.type) {
      case "text":
      case "email":
      case "tel":
      case "url": {
        if (fieldName === "catalogue") {
          return (
            <div key={fieldName} className={blockClass}>
              {labelBlock(fieldConfig.label)}
              {!isCollapsed && (
                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={value || ""}
                    onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                    placeholder={fieldConfig.label}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => openMediaForField("catalogue", "pdf")}
                    className="px-3 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Upload Catalogue (PDF)
                  </button>
                </div>
              )}
            </div>
          );
        }
        if (noFieldCollapse) {
          return (
            <div key={fieldName} className="space-y-1.5">
              {labelBlock(fieldConfig.label)}
              <input
                type={fieldConfig.type}
                value={value || ""}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                placeholder={fieldConfig.label}
                className={inputClass}
              />
            </div>
          );
        }
        return (
          <div key={fieldName} className={blockClass}>
            {labelBlock(fieldConfig.label)}
            {!isCollapsed && (
              <input
                type={fieldConfig.type}
                value={value || ""}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                placeholder={fieldConfig.label}
                className={`mt-3 ${inputClass}`}
              />
            )}
          </div>
        );
      }

      case "textarea":
        return (
          <div key={fieldName} className={blockClass}>
            {labelBlock(fieldConfig.label)}
            {!isCollapsed && (
              <textarea
                value={value || ""}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                placeholder={fieldConfig.label}
                rows={3}
                className={`mt-3 ${inputClass}`}
              />
            )}
          </div>
        );

      case "image":
        return (
          <div key={fieldName} className={blockClass}>
            {labelBlock(fieldConfig.label)}
            {!isCollapsed && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => openMediaForField(fieldName, "image")}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700"
                >
                  Select Image
                </button>
                <label className="px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer">
                  Upload / Replace
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => uploadFieldImage(fieldName, e.target.files?.[0], "image")}
                  />
                </label>
                {mediaUploading && mediaTargetField === fieldName && (
                  <span className="text-sm text-slate-600">Uploading file…</span>
                )}
                {value && (
                  <>
                    <img src={value} alt={fieldConfig.label} className="h-12 w-12 object-cover rounded border" />
                    <button type="button" onClick={() => handleFieldChange(fieldName, "")} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                  </>
                )}
              </div>
            )}
          </div>
        );

      case "select":
        return (
          <div key={fieldName} className={blockClass}>
            {labelBlock(fieldConfig.label)}
            {!isCollapsed && (
              <select
                value={value || ""}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                className={`mt-3 ${inputClass}`}
              >
                <option value="">Select {fieldConfig.label}</option>
                {(fieldConfig.options || []).map((opt) => (
                  <option key={opt} value={opt}>{opt} Star{opt !== "1" ? "s" : ""}</option>
                ))}
              </select>
            )}
          </div>
        );

      case "object":
        return (
          <div key={fieldName} className={blockClass}>
            {labelBlock(fieldConfig.label)}
            {!isCollapsed && (
              <div className="mt-3 space-y-3">
                {Object.entries(fieldConfig.schema || {}).map(([subField, subConfig]) => (
                  <div key={subField}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {subConfig.label}
                      {subConfig.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <input
                      type={subConfig.type}
                      value={(value && value[subField]) || ""}
                      onChange={(e) => handleObjectFieldChange(fieldName, subField, e.target.value)}
                      placeholder={subConfig.label}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "array":
        if (fieldConfig.itemType === "text") {
          return (
            <div key={fieldName} className={blockClass}>
              {labelBlock(fieldConfig.label)}
              {!isCollapsed && (
                <div className="mt-3 space-y-2">
                  {(Array.isArray(value) ? value : []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const arr = [...(value || [])];
                          arr[idx] = e.target.value;
                          handleFieldChange(fieldName, arr);
                        }}
                        placeholder={`${fieldConfig.label} ${idx + 1}`}
                        className={`flex-1 ${inputClass}`}
                      />
                      <button type="button" onClick={() => removeArrayItem(fieldName, idx)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem(fieldName, "")}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
                  >
                    <Plus className="h-4 w-4" /> Add {fieldConfig.label}
                  </button>
                </div>
              )}
            </div>
          );
        }
        if (fieldConfig.itemSchema) {
          return (
            <div key={fieldName} className={blockClass}>
              {labelBlock(fieldConfig.label)}
              {!isCollapsed && (
                <div className="mt-3 space-y-3">
                  {(Array.isArray(value) ? value : []).map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-gray-700">{fieldConfig.label} {idx + 1}</h4>
                        <button type="button" onClick={() => removeArrayItem(fieldName, idx)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(fieldConfig.itemSchema).map(([subField, subConfig]) => {
                          if (subConfig.type === "array" && subConfig.itemSchema) {
                            const nestedArr = item[subField] || [];
                            return (
                              <div key={subField} className="space-y-2">
                                <label className="block text-xs font-medium text-gray-600">{subConfig.label}</label>
                                {nestedArr.map((nestedItem, nIdx) => (
                                  <div key={nIdx} className="border border-gray-200 rounded p-3 bg-white">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs font-medium text-gray-700">{subConfig.label} {nIdx + 1}</span>
                                      <button type="button" onClick={() => removeNestedArrayItem(fieldName, idx, subField, nIdx)} className="text-red-600 text-xs">Remove</button>
                                    </div>
                                    {Object.entries(subConfig.itemSchema).map(([pSubField, pSubConfig]) => (
                                      <div key={pSubField} className="mb-2">
                                        <label className="block text-[11px] font-medium text-gray-600 mb-0.5">{pSubConfig.label}</label>
                                        {pSubConfig.type === "textarea" ? (
                                          <textarea
                                            value={nestedItem[pSubField] || ""}
                                            onChange={(e) => updateNestedArrayItem(fieldName, idx, subField, nIdx, pSubField, e.target.value)}
                                            rows={2}
                                            className={inputClass}
                                          />
                                        ) : pSubConfig.type === "image" ? (
                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                openMediaForField(
                                                  `${fieldName}[${idx}].${subField}[${nIdx}].${pSubField}`,
                                                  "image"
                                                )
                                              }
                                              className="px-2 py-1 text-xs bg-purple-600 text-white rounded"
                                            >
                                              Select
                                            </button>
                                            <label className="px-2 py-1 text-xs bg-emerald-600 text-white rounded cursor-pointer">
                                              Upload
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => uploadFieldImage(`${fieldName}[${idx}].${subField}[${nIdx}].${pSubField}`, e.target.files?.[0], "image")}
                                              />
                                            </label>
                                            {nestedItem[pSubField] && <img src={nestedItem[pSubField]} alt="" className="h-8 w-8 object-cover rounded" />}
                                          </div>
                                        ) : (
                                          <input
                                            type={pSubConfig.type}
                                            value={nestedItem[pSubField] || ""}
                                            onChange={(e) => updateNestedArrayItem(fieldName, idx, subField, nIdx, pSubField, e.target.value)}
                                            className={inputClass}
                                          />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => addNestedArrayItem(fieldName, idx, subField, Object.fromEntries(Object.keys(subConfig.itemSchema || {}).map((k) => [k, ""])))}
                                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                                >
                                  Add {subConfig.label}
                                </button>
                                {fieldName === "galleryCategories" && subField === "images" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openMediaForField(
                                        `${fieldName}[${idx}].${subField}`,
                                        "image",
                                        { multiSelect: true }
                                      )
                                    }
                                    className="ml-2 px-2 py-1 text-xs bg-purple-600 text-white rounded"
                                  >
                                    Select images for this category
                                  </button>
                                )}
                              </div>
                            );
                          }
                          if (subConfig.type === "textarea") {
                            return (
                              <div key={subField}>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{subConfig.label}{subConfig.required && <span className="text-red-500">*</span>}</label>
                                <textarea value={item[subField] || ""} onChange={(e) => handleArrayItemChange(fieldName, idx, subField, e.target.value)} rows={2} className={inputClass} />
                              </div>
                            );
                          }
                          if (subConfig.type === "select") {
                            return (
                              <div key={subField}>
                                <label className="block text-xs font-medium text-gray-600 mb-1">{subConfig.label}</label>
                                <select value={item[subField] || ""} onChange={(e) => handleArrayItemChange(fieldName, idx, subField, e.target.value)} className={inputClass}>
                                  <option value="">Select</option>
                                  {(subConfig.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              </div>
                            );
                          }
                          if (subConfig.type === "image") {
                            return (
                              <div key={subField} className="flex items-center gap-2">
                                <label className="block text-xs font-medium text-gray-600">{subConfig.label}</label>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openMediaForField(
                                      `${fieldName}[${idx}].${subField}`,
                                      "image"
                                    )
                                  }
                                  className="px-2 py-1 text-xs bg-purple-600 text-white rounded"
                                >
                                  Select
                                </button>
                                <label className="px-2 py-1 text-xs bg-emerald-600 text-white rounded cursor-pointer">
                                  Upload
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => uploadFieldImage(`${fieldName}[${idx}].${subField}`, e.target.files?.[0], "image")}
                                  />
                                </label>
                                {item[subField] && <img src={item[subField]} alt="" className="h-8 w-8 object-cover rounded" />}
                              </div>
                            );
                          }
                          return (
                            <div key={subField}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">{subConfig.label}{subConfig.required && <span className="text-red-500">*</span>}</label>
                              <input
                                type={subConfig.type || "text"}
                                value={item[subField] || ""}
                                onChange={(e) => handleArrayItemChange(fieldName, idx, subField, e.target.value)}
                                placeholder={subConfig.label}
                                className={inputClass}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem(fieldName, Object.fromEntries(Object.keys(fieldConfig.itemSchema || {}).map((k) => [k, ""])))}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" /> Add {fieldConfig.label}
                  </button>
                  {fieldName === "ourClients" && (
                    <button type="button" onClick={() => openMediaForField("ourClients", "image", { multiSelect: true })} className="ml-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-700">
                      <Plus className="h-4 w-4" /> Select client images
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  if (loadingTemplate) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-600">Loading template…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      {toastMessage && (
        <div
          className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 px-4 py-3 rounded-lg bg-slate-900 text-white text-sm shadow-lg max-w-md text-center"
          role="status"
        >
          {toastMessage}
        </div>
      )}

      {/* Sticky Mobile Header / Balanced Desktop Header */}
      <div className="sticky top-0 lg:static z-40 bg-white/80 backdrop-blur-md lg:bg-transparent -mx-4 px-4 lg:mx-0 lg:px-0 py-3 mb-6 border-b border-slate-100 lg:border-none flex items-center justify-between">
        <button 
          type="button" 
          onClick={onBack} 
          className="inline-flex items-center gap-2 p-2 -ml-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-bold text-sm lg:text-base hidden sm:inline">Back</span>
        </button>
        
        <div className="flex items-center gap-2">
          {onPreview && (
            <button
              type="button"
              onClick={handlePreview}
              disabled={saving}
              className="lg:inline-flex hidden items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 disabled:opacity-60 transition-all active:scale-95"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-60 shadow-lg shadow-black/10 active:scale-95 transition-all"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Card"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl p-4 lg:p-0 lg:bg-transparent border border-slate-100 lg:border-none mb-8">
        <div className="space-y-3">
          {(selectedTemplate?.name || templateDetail?.name) && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider">Template</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold">
                {selectedTemplate?.name || templateDetail?.name}
              </span>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700">Card display name</label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="e.g. Personal Portfolio"
              className="w-full bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl px-4 py-3 text-sm font-semibold transition-all focus:ring-0 outline-none shadow-sm"
            />
          </div>
        </div>
      </div>

      {useRichLinkPro ? (
        <div className="space-y-4">
          {(schema.sections || []).map((section) => {
            const isCollapsed = !!collapsedSections[section.id];
            return (
              <div key={section.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSectionCollapse(section.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left font-bold text-slate-900 bg-slate-50/50 hover:bg-slate-100/50 border-b border-slate-100 transition-colors"
                >
                  <span className="text-[14px] lg:text-[15px]">{section.label}</span>
                  <div className={`p-1 rounded-full bg-white shadow-sm transition-transform duration-300 ${isCollapsed ? "-rotate-90" : ""}`}>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </div>
                </button>
                {!isCollapsed && (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    {(section.fields || []).map((fieldName) => {
                      const fieldConfig = schema.fields[fieldName];
                      if (!fieldConfig) return null;
                      return renderField(fieldName, fieldConfig, { noFieldCollapse: true });
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        templateDetail && (
          <TemplateFieldsForm
            template={templateDetail}
            categoryId={categoryId}
            data={cardData}
            onChange={setCardData}
            onOpenMedia={openMediaForField}
            disabled={saving}
          />
        )
      )}

      {/* User: direct file picker (no media library) */}
      <input
        ref={userFilePickerRef}
        type="file"
        accept={userFilePicker.accept}
        multiple={userFilePicker.multiple}
        className="hidden"
        onChange={handleUserPickedFiles}
      />

      {/* Sticky Mobile Preview Button */}
      {onPreview && (
        <div className="lg:hidden fixed bottom-24 right-6 z-[45]">
          <button
            type="button"
            onClick={handlePreview}
            disabled={saving}
            className="w-14 h-14 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 active:scale-90 transition-transform disabled:opacity-50"
          >
            <Eye className="h-6 w-6" />
          </button>
        </div>
      )}

      <MediaManager
        isOpen={mediaOpen}
        onClose={() => { setMediaOpen(false); setMediaTargetField(null); setMediaMultiSelect(false); }}
        onSelect={handleMediaSelect}
        defaultTab={mediaDefaultTab}
        multiSelect={mediaMultiSelect}
        enableLibrary={false}
      />
    </div>
  );
}
