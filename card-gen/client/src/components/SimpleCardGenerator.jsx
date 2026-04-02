import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Link2,
  Loader2,
} from "lucide-react";
import { getCategories } from "../api/categories";
import { createCard, updateCard, getCardById } from "../api/cards";
import { getInquiryById } from "../api/inquiries";
import { ensureDetailsToken, getDetailsForCard } from "../api/details";
import { useToast } from "../contexts/ToastContext";
import CardRenderer from "./CardRenderer";
import CustomisedCardBuilder from "./CustomisedCardBuilder";
import CustomisedCardRenderer from "./CustomisedCardRenderer";
import { uploadMedia, destroyMediaAsset } from "../api/media";
import MediaManager from "./MediaManager";
import { cardSchemas, getDefaultCardData } from "../schemas/cardSchemas";
import { resellerAPI } from "../api/reseller";

const SimpleCardGenerator = ({
  inquiryId,
  onBack,
  onCardGenerated,
  mode = "inquiry", // "inquiry" | "reseller"
  targetUserId,
  editCardId,
}) => {
  const [inquiry, setInquiry] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [cardData, setCardData] = useState({});
  const [hiddenFields, setHiddenFields] = useState([]);
  const [collapsedFields, setCollapsedFields] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [mediaTargetField, setMediaTargetField] = useState(null);
  const [mediaDefaultTab, setMediaDefaultTab] = useState("image");
  const [mediaMultiSelect, setMediaMultiSelect] = useState(false);
  const [detailsUrl, setDetailsUrl] = useState(null);
  const [detailsSubmitted, setDetailsSubmitted] = useState(false);
  // Persisted custom flag
  const [isCustom, setIsCustom] = useState(false);
  const [customizations, setCustomizations] = useState({});
  const { success: showSuccess, error: showError } = useToast();
  // Determine if custom card data actually contains meaningful content
  const hasMeaningfulCustomData = (customData) => {
    if (!customData || typeof customData !== "object") return false;
    const stack = [customData];
    while (stack.length) {
      const current = stack.pop();
      for (const key of Object.keys(current || {})) {
        const value = current[key];
        if (value == null) continue;
        if (typeof value === "string" && value.trim() !== "") return true;
        if (Array.isArray(value) && value.length > 0) return true;
        if (typeof value === "object") stack.push(value);
      }
    }
    return false;
  };

  const hasMeaningfulCustomizationsObject = (obj) => {
    if (!obj || typeof obj !== "object") return false;
    const keys = Object.keys(obj);
    if (keys.length === 0) return false;
    for (const key of keys) {
      const value = obj[key];
      if (value == null) continue;
      if (typeof value === "string" && value.trim() !== "") return true;
      if (Array.isArray(value) && value.length > 0) return true;
      if (typeof value === "object") {
        if (hasMeaningfulCustomData(value)) return true;
      }
      if (typeof value === "boolean" && value === true) return true;
      if (typeof value === "number" && !Number.isNaN(value) && value !== 0)
        return true;
    }
    return false;
  };

  // (isCustom persisted via state and backend)

  // Debug: log why custom mode is considered ON/OFF
  useEffect(() => {
    const hasCustomData = hasMeaningfulCustomData(cardData?.customCardData);
    const hasMeaningfulCustomizations =
      hasMeaningfulCustomizationsObject(customizations);
    // console.log('[Custom Debug] isCustom =', isCustom);
    // console.log('[Custom Debug] hasCustomData(customCardData) =', hasCustomData, 'customCardData keys =', cardData?.customCardData ? Object.keys(cardData.customCardData) : []);
    // console.log('[Custom Debug] hasMeaningfulCustomizations(customizations) =', hasMeaningfulCustomizations, 'customizations keys =', Object.keys(customizations || {}));
  }, [isCustom, cardData?.customCardData, customizations]);

  // Helper function to parse stringified arrays in card data
  const parseCardDataArrays = (data) => {
    const parsed = { ...data };
    const arrayFields = [
      "workImages",
      "clientLogos",
      "testimonials",
      "teamMembers",
      "destinations",
      "galleryImages",
      "categories",
      "products",
      "specialOffers",
      "buttons",
      "certifications",
      "services",
      "features",
      "socialCustomButtons",
    ];

    arrayFields.forEach((field) => {
      if (typeof parsed[field] === "string") {
        try {
          parsed[field] = JSON.parse(parsed[field]);
        } catch (e) {
          // console.error(`Failed to parse ${field}:`, e);
          parsed[field] = [];
        }
      }
    });

    return parsed;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (mode === "reseller") {
          const categoriesData = await getCategories();
          const categories = Array.isArray(categoriesData)
            ? categoriesData
            : Array.isArray(categoriesData?.data)
              ? categoriesData.data
              : Array.isArray(categoriesData?.categories)
                ? categoriesData.categories
                : [];

          setCategories(Array.isArray(categories) ? categories : []);
          setInquiry({ cardId: editCardId || null, cardGenerated: !!editCardId });

          if (editCardId) {
            const cardResponse = await getCardById(editCardId);
            const card = cardResponse.card || cardResponse;
            const parsedCardData = parseCardDataArrays(card.data || {});
            setCardData(parsedCardData);
            setHiddenFields(card.hiddenFields || []);
            setIsCustom(!!card.isCustom);
            setCustomizations(card.customizations || {});
            setSelectedCategory(card.categoryId || "");
            setSelectedTemplateId(card.templateId || "");
          } else {
            const firstCategory = categories[0];
            if (firstCategory) {
              handleCategoryChange(firstCategory.categoryId, true);
              const defaultTemplate =
                firstCategory?.templates?.find((t) => t.isDefault) ||
                firstCategory?.templates?.[0];
              setSelectedTemplateId(defaultTemplate?.templateId || "");
            }
            setCustomizations({});
          }
          return;
        }

        const [categoriesData, inquiryData] = await Promise.all([
          getCategories(),
          getInquiryById(inquiryId),
        ]);

        // Handle different possible response formats
        const categories = Array.isArray(categoriesData)
          ? categoriesData
          : Array.isArray(categoriesData?.data)
            ? categoriesData.data
            : Array.isArray(categoriesData?.categories)
              ? categoriesData.categories
              : [];

        setCategories(Array.isArray(categories) ? categories : []);
        setInquiry(inquiryData);

        if (inquiryData?.cardId) {
          // If there's an existing card, fetch the card data
          try {
            const cardResponse = await getCardById(inquiryData.cardId);
            const card = cardResponse.card || cardResponse;

            if (card && card.data) {
              // Parse any stringified arrays in the loaded data
              const parsedCardData = parseCardDataArrays(card.data);
              setCardData(parsedCardData);

              // Set the category without resetting the data
              const categoryId = card.categoryId || "";
              handleCategoryChange(categoryId, false);

              // If the saved card has meaningful customizations or customCardData, prepare customizations
              const customFromServer = card.customizations || {};
              const normalizedCustom =
                customFromServer && customFromServer.constructor === Object
                  ? customFromServer
                  : {};
              if (
                hasMeaningfulCustomizationsObject(normalizedCustom) ||
                hasMeaningfulCustomData(parsedCardData?.customCardData)
              ) {
                setCustomizations(normalizedCustom);
              } else {
                // Standard card path: clear customizations
                setCustomizations({});
              }

              // Persisted flag from server
              if (typeof card.isCustom === "boolean") {
                setIsCustom(card.isCustom);
              }
            } else {
              throw new Error("No card data found");
            }
          } catch (cardError) {
            // console.error('Error loading card data:', cardError);
            // Fallback to default data
            const firstCategory = categories[0];
            if (firstCategory) {
              handleCategoryChange(firstCategory.categoryId, true);
            }
            setCustomizations({});
          }
        } else if (inquiryData?.generatedCard?.data) {
          // If there's generated card data embedded in the inquiry
          try {
            const generatedCard = inquiryData.generatedCard;

            if (generatedCard.data) {
              // Parse any stringified arrays in the loaded data
              const parsedCardData = parseCardDataArrays(generatedCard.data);
              setCardData(parsedCardData);

              // Set the category without resetting the data
              const categoryId = generatedCard.categoryId || "";
              handleCategoryChange(categoryId, false);

              // Set hidden fields if available
              if (generatedCard.hiddenFields) {
                setHiddenFields(generatedCard.hiddenFields);
              }

              // If the generated card has meaningful customizations, prepare customizations
              const customFromServer = generatedCard.customizations || {};
              if (hasMeaningfulCustomizationsObject(customFromServer)) {
                setCustomizations(customFromServer);
              } else {
                setCustomizations({});
              }
              // If embedded flag exists
              if (typeof generatedCard.isCustom === "boolean") {
                setIsCustom(generatedCard.isCustom);
              }
            }
          } catch (err) {
            // console.error('Error loading generated card data:', err);
            // Reset to standard mode on error
            setCustomizations({});
          }
        } else if (inquiryData?.cardData) {
          // Parse any stringified arrays in the loaded data
          const parsedCardData = parseCardDataArrays(inquiryData.cardData);
          setCardData(parsedCardData);
          handleCategoryChange(parsedCardData.categoryId || "", false);
          setCustomizations({});
        } else {
          // Initialize with default data for the first category
          const firstCategory = categories[0];
          if (firstCategory) {
            handleCategoryChange(firstCategory.categoryId, true);
          }
          setCustomizations({});
        }
      } catch (err) {
        // console.error('Error fetching data:', err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [inquiryId, mode, editCardId]);

  const handleCategoryChange = (categoryId, resetData = true) => {
    setSelectedCategory(categoryId);
    // Set default template for this category (when available)
    const cat = categories.find((c) => c.categoryId === categoryId);
    const defaultTemplate =
      cat?.templates?.find((t) => t.isDefault) || cat?.templates?.[0];
    setSelectedTemplateId(defaultTemplate?.templateId || "");
    if (resetData) {
      setCardData(getDefaultCardData(categoryId));
      setHiddenFields([]);
    }
  };

  // Fetch details link info when card exists
  useEffect(() => {
    if (!inquiry?.cardId) {
      setDetailsUrl(null);
      setDetailsSubmitted(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await ensureDetailsToken(inquiry.cardId);
        if (cancelled || !res?.data) return;
        setDetailsUrl(res.data.detailsUrl || null);
        setDetailsSubmitted(!!res.data.submittedAt);
      } catch {
        if (!cancelled) {
          setDetailsUrl(null);
          setDetailsSubmitted(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [inquiry?.cardId]);

  const handleCopyDetailsLink = async () => {
    if (!inquiry?.cardId) return;
    try {
      const res = await ensureDetailsToken(inquiry.cardId);
      const url = res?.data?.detailsUrl;
      if (url) {
        await navigator.clipboard.writeText(url);
        showSuccess("Details link copied to clipboard");
      } else {
        showError("Could not get details link");
      }
    } catch (err) {
      showError(err?.message || "Failed to get details link");
    }
  };

  const toggleFieldCollapse = (fieldName) => {
    setCollapsedFields((prev) => ({
      ...prev,
      [fieldName]: !prev?.[fieldName],
    }));
  };

  const handleFieldChange = (fieldName, value) => {
    setCardData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleArrayItemChange = (fieldName, index, subField, value) => {
    setCardData((prev) => {
      const newData = { ...prev };
      if (!Array.isArray(newData[fieldName])) {
        newData[fieldName] = [];
      }
      const newArray = [...newData[fieldName]];
      if (!newArray[index]) {
        newArray[index] = {};
      }
      // Support nested array editing like destinations[idx].packages
      if (subField.includes(".")) {
        const [parentKey, childKey] = subField.split(".");
        const parentVal = newArray[index][parentKey];
        if (Array.isArray(parentVal)) {
          // value here should be a full array replacement for nested array
          newArray[index] = {
            ...newArray[index],
            [parentKey]: value,
          };
        } else if (typeof parentVal === "object") {
          newArray[index] = {
            ...newArray[index],
            [parentKey]: {
              ...(parentVal || {}),
              [childKey]: value,
            },
          };
        } else {
          newArray[index] = {
            ...newArray[index],
            [parentKey]: value,
          };
        }
      } else {
        newArray[index] = {
          ...newArray[index],
          [subField]: value,
        };
      }
      newData[fieldName] = newArray;
      return newData;
    });
  };

  const handleObjectFieldChange = (fieldName, subField, value) => {
    setCardData((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        [subField]: value,
      },
    }));
  };

  const addArrayItem = (fieldName, defaultItem) => {
    setCardData((prev) => ({
      ...prev,
      [fieldName]: [...(prev[fieldName] || []), defaultItem],
    }));
  };

  const removeArrayItem = async (fieldName, index) => {
    const pids = getMediaPidList(fieldName);
    const pid = pids?.[index];

    setCardData((prev) => {
      const next = {
        ...prev,
        [fieldName]: (prev[fieldName] || []).filter((_, i) => i !== index),
      };
      if (Array.isArray(prev?.__mediaPublicIds?.[fieldName])) {
        const nextPids = [...(prev.__mediaPublicIds[fieldName] || [])].filter(
          (_, i) => i !== index
        );
        next.__mediaPublicIds = { ...(prev.__mediaPublicIds || {}), [fieldName]: nextPids };
      }
      return next;
    });

    if (pid) {
      try {
        await destroyMediaAsset({ publicId: pid });
      } catch {}
    }
  };

  // Nested array helpers: e.g., destinations[idx].packages
  const addNestedArrayItem = (fieldName, index, nestedKey, defaultItem) => {
    setCardData((prev) => {
      const newData = { ...prev };
      const arr = Array.isArray(newData[fieldName])
        ? [...newData[fieldName]]
        : [];
      const parent = { ...(arr[index] || {}) };
      const nestedArr = Array.isArray(parent[nestedKey])
        ? [...parent[nestedKey]]
        : [];
      nestedArr.push(defaultItem);
      parent[nestedKey] = nestedArr;
      arr[index] = parent;
      newData[fieldName] = arr;
      return newData;
    });
  };

  const updateNestedArrayItem = (
    fieldName,
    index,
    nestedKey,
    nestedIndex,
    subField,
    value
  ) => {
    setCardData((prev) => {
      const newData = { ...prev };
      const arr = Array.isArray(newData[fieldName])
        ? [...newData[fieldName]]
        : [];
      const parent = { ...(arr[index] || {}) };
      const nestedArr = Array.isArray(parent[nestedKey])
        ? [...parent[nestedKey]]
        : [];
      const item = { ...(nestedArr[nestedIndex] || {}) };
      item[subField] = value;
      nestedArr[nestedIndex] = item;
      parent[nestedKey] = nestedArr;
      arr[index] = parent;
      newData[fieldName] = arr;
      return newData;
    });
  };

  const removeNestedArrayItem = (fieldName, index, nestedKey, nestedIndex) => {
    setCardData((prev) => {
      const newData = { ...prev };
      const arr = Array.isArray(newData[fieldName])
        ? [...newData[fieldName]]
        : [];
      const parent = { ...(arr[index] || {}) };
      const nestedArr = Array.isArray(parent[nestedKey])
        ? [...parent[nestedKey]]
        : [];
      parent[nestedKey] = nestedArr.filter((_, i) => i !== nestedIndex);
      arr[index] = parent;
      newData[fieldName] = arr;
      return newData;
    });
  };

  const toggleFieldVisibility = (fieldName) => {
    setHiddenFields((prev) =>
      prev.includes(fieldName)
        ? prev.filter((f) => f !== fieldName)
        : [...prev, fieldName]
    );
  };

  const setMediaPid = (fieldKey, publicId) => {
    setCardData((prev) => ({
      ...prev,
      __mediaPublicIds: { ...(prev.__mediaPublicIds || {}), [fieldKey]: publicId || "" },
    }));
  };

  const getMediaPid = (fieldKey) => {
    const map = cardData?.__mediaPublicIds || {};
    return typeof map?.[fieldKey] === "string" ? map[fieldKey] : "";
  };

  const getMediaPidList = (fieldKey) => {
    const map = cardData?.__mediaPublicIds || {};
    return Array.isArray(map?.[fieldKey]) ? map[fieldKey] : [];
  };

  const uploadAndReplace = async ({ fieldKey, file, type, resourceType, setValue }) => {
    if (!file) return;
    setMediaUploading(true);
    try {
      const prevPid = getMediaPid(fieldKey);
      const resp = await uploadMedia({ file, type });
      const media = resp?.media;
      const nextUrl = media?.url || "";
      const nextPid = media?.publicId || "";

      if (nextUrl) setValue(nextUrl);
      if (nextPid) setMediaPid(fieldKey, nextPid);

      if (prevPid && prevPid !== nextPid) {
        try {
          await destroyMediaAsset({ publicId: prevPid, resourceType });
        } catch {}
      }
    } catch (e) {
      showError(e?.error || e?.message || "Upload failed");
    } finally {
      setMediaUploading(false);
    }
  };

  const openMediaForField = (fieldName, defaultTab = "image", options = {}) => {
    setMediaTargetField(fieldName);
    setMediaDefaultTab(defaultTab || "image");
    setMediaMultiSelect(options?.multiSelect ?? false);
    setMediaOpen(true);
  };

  const handleMediaSelect = (media) => {
    if (!mediaTargetField || !media?.url) {
      setMediaOpen(false);
      setMediaTargetField(null);
      return;
    }

    // Custom builder routing: custom_<type>_<tail?>
    if (mediaTargetField.startsWith("custom_")) {
      const parts = mediaTargetField.split("_");
      const type = parts[1] || "";
      const tail = parts.slice(2).join("_");

      setCustomizations((prev) => {
        const next = { ...(prev || {}) };
        if (type === "cover") next.coverImage = media.url;
        if (type === "background") next.backgroundImage = media.url;
        if (type === "icon" && tail) {
          next.sectionIcons = { ...(next.sectionIcons || {}), [tail]: media.url };
        }
        return next;
      });

      setCardData((prev) => {
        const cc = { ...(prev.customCardData || {}) };
        if (type === "cover") cc.coverImage = media.url;
        if (type === "background") {
          cc.theme = { ...(cc.theme || {}), backgroundImage: media.url };
        }
        if (type === "icon" && tail) {
          cc.sectionIcons = { ...(cc.sectionIcons || {}), [tail]: media.url };
        }
        return { ...prev, customCardData: cc };
      });

      setMediaOpen(false);
      setMediaTargetField(null);
      return;
    }

    if (mediaTargetField === "catalogue") {
      handleFieldChange("catalogue", media.url);
      setMediaOpen(false);
      setMediaTargetField(null);
      return;
    }

    // Support simple nested pattern: "field[0].subField"
    const match = mediaTargetField.match(/^(.+)\[(\d+)\]\.([^\.]+)$/);
    if (match) {
      const [, fieldName, index, subField] = match;
      handleArrayItemChange(fieldName, parseInt(index, 10), subField, media.url);
      setMediaOpen(false);
      setMediaTargetField(null);
      return;
    }

    handleFieldChange(mediaTargetField, media.url);
    setMediaOpen(false);
    setMediaTargetField(null);
  };

  // (removed duplicate hasMeaningfulCustomData)

  // Media Manager selection removed (direct uploads only)

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Debug: Log the cardData structure
      // console.log('Original cardData:', cardData);
      // console.log('Services field type:', typeof cardData.services);
      // console.log('Services field value:', cardData.services);

      // Fix any stringified arrays in the data
      let fixedCardData = parseCardDataArrays(cardData);

      // If not using custom mode, strip out customCardData to prevent it from being saved
      if (!isCustom && fixedCardData.customCardData) {
        const { customCardData, ...rest } = fixedCardData;
        fixedCardData = rest;
      }

      // console.log('Fixed cardData:', fixedCardData);

      // Resolve categoryId: map businessType display names to actual category IDs
      const businessTypeToCategoryId = {
        Business: "business",
        Doctor: "doctor",
        Lawyer: "lawyer",
        Artist: "artist",
        "Makeup Artist": "makeup-artist",
        "makeup-artist": "makeup-artist",
        "Interior Designer": "interior-designer",
        "interior-designer": "interior-designer",
        "Travel Agent": "travel-agent",
        "travel-agent": "travel-agent",
        "E-commerce": "ecommerce",
        ecommerce: "ecommerce",
      };
      // For custom cards, derive from inquiry.businessType; otherwise use selectedCategory directly
      const resolvedCategoryIdRaw = isCustom
        ? inquiry?.businessType || ""
        : selectedCategory || "";
      const categoryId =
        businessTypeToCategoryId[resolvedCategoryIdRaw] ||
        resolvedCategoryIdRaw;

      // Get template for the category
      let templateIdToUse = "custom-default";
      if (!isCustom) {
        const selectedCategoryData = categories.find(
          (cat) => cat.categoryId === categoryId
        );
        const defaultTemplate =
          selectedCategoryData?.templates?.find((template) => template.isDefault) ||
          selectedCategoryData?.templates?.[0];

        const resolvedTemplateId =
          selectedTemplateId ||
          defaultTemplate?.templateId ||
          "";

        if (!resolvedTemplateId) {
          throw new Error(`No template found for category: ${categoryId}`);
        }
        templateIdToUse = resolvedTemplateId;
      }

      // Structure the payload according to server expectations
      const cardPayload = {
        ...(mode === "inquiry" ? { clientId: inquiryId } : {}),
        categoryId: categoryId,
        templateId: templateIdToUse,
        data: fixedCardData,
        hiddenFields: hiddenFields || [],
        customizations: isCustom ? customizations || {} : {},
        isCustom: !!isCustom,
      };

      // console.log('Final cardPayload:', cardPayload);

      let response;
      if (inquiry?.cardId) {
        // console.log('Updating existing card with ID:', inquiry.cardId);
        response = await updateCard(inquiry.cardId, cardPayload);
      } else {
        if (mode === "reseller") {
          if (!targetUserId) throw new Error("Missing target user");
          response = await resellerAPI.createCardForUser(targetUserId, cardPayload);
        } else {
          // console.log('Creating new card');
          response = await createCard(cardPayload);
        }
      }

      if (response.success) {
        showSuccess(
          inquiry?.cardId
            ? "Card updated successfully!"
            : "Card generated successfully!"
        );

        // Update local inquiry state if this was a new card creation
        if (!inquiry?.cardId && response.card) {
          // console.log('Updating inquiry with card ID:', response.card._id);
          setInquiry((prev) => {
            const updated = {
              ...prev,
              cardId: response.card._id,
              cardGenerated: true,
            };
            // console.log('Updated inquiry state:', updated);
            return updated;
          });

          if (mode === "inquiry") {
            // Also refresh the inquiry data from the server to ensure consistency
            try {
              const refreshedInquiry = await getInquiryById(inquiryId);
              // console.log('Refreshed inquiry from server:', refreshedInquiry);
              setInquiry(refreshedInquiry);
            } catch (refreshErr) {
              // console.warn('Failed to refresh inquiry data:', refreshErr);
            }
          }
        }

        if (onCardGenerated) {
          onCardGenerated(response);
        }
      } else {
        throw new Error(response.message || "Failed to save card");
      }
    } catch (err) {
      // console.error('Error saving card:', err);
      const rawMsg =
        typeof err === "string"
          ? err
          : err?.error ||
            err?.message ||
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            "Failed to save card";

      const msg =
        typeof rawMsg === "string" && rawMsg.toLowerCase().includes("insufficient wallet balance")
          ? "Not enough wallet balance to create this card. Please recharge your wallet and try again."
          : rawMsg;

      setError(msg);
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleViewCard = async () => {
    try {
      if (!inquiry?.cardId) return;
      const resp = await getCardById(inquiry.cardId);
      const card = resp.card || resp;
      const link =
        resp.shareableLink ||
        resp.publicUrl ||
        card?.shareableLink ||
        card?.publicUrl ||
        `/cards/${inquiry.cardId}`;
      const maskedLink = link.replace(
        "https://teamserver.cloud",
        "https://www.visitinglink.com"
      );
      window.open(maskedLink, "_blank", "noopener");
    } catch (e) {
      // Fallback to app route if API fails
      if (inquiry?.cardId) {
        window.open(`/cards/${inquiry.cardId}`, "_blank", "noopener");
      }
    }
  };

  const getCurrentSchema = () => {
    return cardSchemas[selectedCategory];
  };

  const renderField = (fieldName, fieldConfig, options = {}) => {
    const isHidden = hiddenFields.includes(fieldName);
    const value = cardData[fieldName];
    const noFieldCollapse = options.noFieldCollapse === true;
    const isCollapsed = noFieldCollapse ? false : !!collapsedFields?.[fieldName];

    switch (fieldConfig.type) {
      case "text":
      case "email":
      case "tel":
      case "url":
        // Special UI for Link Pro catalogue: allow upload via MediaManager to auto-fill URL
        if (fieldName === "catalogue") {
          return (
            <div
              key={fieldName}
              className={`mb-3 rounded-lg border p-3 ${isHidden
                ? "border-gray-300 bg-gray-50 opacity-60"
                : "border-gray-200 bg-white"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!noFieldCollapse && (
                    <button
                      type="button"
                      onClick={() => toggleFieldCollapse(fieldName)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label={isCollapsed ? "Expand field" : "Collapse field"}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : "rotate-0"
                          }`}
                      />
                    </button>
                  )}
                  <label
                    className={`block text-base font-medium ${isHidden ? "text-gray-500" : "text-gray-700"
                      }`}
                  >
                    {fieldConfig.label}
                    {fieldConfig.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    {isHidden && (
                      <span className="ml-2 text-xs text-gray-400">
                        (Hidden from card)
                      </span>
                    )}
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFieldVisibility(fieldName)}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  {isHidden ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Hidden</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Visible</span>
                    </>
                  )}
                </button>
              </div>
              {!isCollapsed && (
                <>
                  <div className="mt-3 flex flex-col md:flex-row md:items-center gap-2">
                    <input
                      type={fieldConfig.type}
                      value={value || ""}
                      onChange={(e) =>
                        handleFieldChange(fieldName, e.target.value)
                      }
                      placeholder={fieldConfig.label}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isHidden ? "bg-gray-100" : ""
                        }`}
                    />
                    <label
                      className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer text-center ${isHidden
                        ? "bg-gray-400 text-gray-600"
                        : "bg-purple-600 text-white hover:bg-purple-700"
                        }`}
                    >
                      Upload Catalogue (PDF)
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        disabled={isHidden || mediaUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          uploadAndReplace({
                            fieldKey: "catalogue",
                            file,
                            type: "pdf",
                            resourceType: "raw",
                            setValue: (v) => handleFieldChange("catalogue", v),
                          });
                        }}
                      />
                    </label>
                  </div>
                  {value && (
                    <div className="text-xs text-blue-600 break-all mt-1">
                      <a href={value} target="_blank" rel="noopener noreferrer">
                        Current URL: {value}
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        }

        // Compact layout for section fields (cleaner, no per-field card)
        if (noFieldCollapse) {
          return (
            <div key={fieldName} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label
                  className={`text-sm font-medium ${isHidden ? "text-gray-400" : "text-gray-700"}`}
                >
                  {fieldConfig.label}
                  {fieldConfig.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <button
                  type="button"
                  onClick={() => toggleFieldVisibility(fieldName)}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  title={isHidden ? "Show on card" : "Hide from card"}
                >
                  {isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <input
                type={fieldConfig.type}
                value={value || ""}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                placeholder={fieldConfig.label}
                className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-400 ${isHidden ? "bg-gray-50 text-gray-500" : "bg-white"}`}
              />
            </div>
          );
        }

        return (
          <div
            key={fieldName}
            className={`mb-3 rounded-lg border p-3 ${isHidden
              ? "border-gray-300 bg-gray-50 opacity-60"
              : "border-gray-200 bg-white"
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!noFieldCollapse && (
                  <button
                    type="button"
                    onClick={() => toggleFieldCollapse(fieldName)}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label={isCollapsed ? "Expand field" : "Collapse field"}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : "rotate-0"
                        }`}
                    />
                  </button>
                )}
                <label
                  className={`block text-base font-medium ${isHidden ? "text-gray-500" : "text-gray-700"
                    }`}
                >
                  {fieldConfig.label}
                  {fieldConfig.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                  {isHidden && (
                    <span className="ml-2 text-xs text-gray-400">
                      (Hidden from card)
                    </span>
                  )}
                </label>
              </div>
              <button
                type="button"
                onClick={() => toggleFieldVisibility(fieldName)}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
              >
                {isHidden ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span>Hidden</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Visible</span>
                  </>
                )}
              </button>
            </div>
            {!isCollapsed && (
              <div className="mt-3">
                <input
                  type={fieldConfig.type}
                  value={value || ""}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  placeholder={fieldConfig.label}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isHidden ? "bg-gray-100" : ""
                    }`}
                />
              </div>
            )}
          </div>
        );

      case "textarea":
        return (
          <div
            key={fieldName}
            className={`mb-3 rounded-lg border p-3 ${isHidden
              ? "border-gray-300 bg-gray-50 opacity-60"
              : "border-gray-200 bg-white"
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!noFieldCollapse && (
                  <button
                    type="button"
                    onClick={() => toggleFieldCollapse(fieldName)}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label={isCollapsed ? "Expand field" : "Collapse field"}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : "rotate-0"
                        }`}
                    />
                  </button>
                )}
                <label
                  className={`block text-sm font-medium ${isHidden ? "text-gray-500" : "text-gray-700"
                    }`}
                >
                  {fieldConfig.label}
                  {fieldConfig.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                  {isHidden && (
                    <span className="ml-2 text-xs text-gray-400">
                      (Hidden from card)
                    </span>
                  )}
                </label>
              </div>
              <button
                type="button"
                onClick={() => toggleFieldVisibility(fieldName)}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
              >
                {isHidden ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span>Hidden</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Visible</span>
                  </>
                )}
              </button>
            </div>
            {!isCollapsed && (
              <div className="mt-3">
                <textarea
                  value={value || ""}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  placeholder={fieldConfig.label}
                  rows={3}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isHidden ? "bg-gray-100" : ""
                    }`}
                />
              </div>
            )}
          </div>
        );

      case "image":
        return (
          <div
            key={fieldName}
            className={`mb-3 rounded-lg border p-3 ${isHidden
              ? "border-gray-300 bg-gray-50 opacity-60"
              : "border-gray-200 bg-white"
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!noFieldCollapse && (
                  <button
                    type="button"
                    onClick={() => toggleFieldCollapse(fieldName)}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label={isCollapsed ? "Expand field" : "Collapse field"}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : "rotate-0"
                        }`}
                    />
                  </button>
                )}
                <label
                  className={`block text-base font-medium ${isHidden ? "text-gray-500" : "text-gray-700"
                    }`}
                >
                  {fieldConfig.label}
                  {fieldConfig.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                  {isHidden && (
                    <span className="ml-2 text-xs text-gray-400">
                      (Hidden from card)
                    </span>
                  )}
                </label>
              </div>
              <button
                type="button"
                onClick={() => toggleFieldVisibility(fieldName)}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
              >
                {isHidden ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span>Hidden</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Visible</span>
                  </>
                )}
              </button>
            </div>
            {!isCollapsed && (
              <div className="mt-3 flex items-center gap-2">
                <label
                  className={`px-3 py-2 rounded-lg cursor-pointer ${isHidden
                    ? "bg-gray-400 text-gray-600"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                    }`}
                >
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                      disabled={isHidden || mediaUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      uploadAndReplace({
                        fieldKey: fieldName,
                        file,
                        type: "image",
                        resourceType: "image",
                        setValue: (v) => handleFieldChange(fieldName, v),
                      });
                    }}
                  />
                </label>
                {value && (
                  <div className="flex items-center gap-2">
                    <img
                      src={value}
                      alt={fieldConfig.label}
                      className="h-12 w-12 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const pid = getMediaPid(fieldName);
                        handleFieldChange(fieldName, "");
                        setMediaPid(fieldName, "");
                        if (pid) {
                          try {
                            await destroyMediaAsset({ publicId: pid });
                          } catch {}
                        }
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case "select":
        return (
          <div
            key={fieldName}
            className={`mb-3 rounded-lg border p-3 ${isHidden
              ? "border-gray-300 bg-gray-50 opacity-60"
              : "border-gray-200 bg-white"
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!noFieldCollapse && (
                  <button
                    type="button"
                    onClick={() => toggleFieldCollapse(fieldName)}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label={isCollapsed ? "Expand field" : "Collapse field"}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : "rotate-0"
                        }`}
                    />
                  </button>
                )}
                <label
                  className={`block text-base font-medium ${isHidden ? "text-gray-500" : "text-gray-700"
                    }`}
                >
                  {fieldConfig.label}
                  {fieldConfig.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                  {isHidden && (
                    <span className="ml-2 text-xs text-gray-400">
                      (Hidden from card)
                    </span>
                  )}
                </label>
              </div>
              <button
                type="button"
                onClick={() => toggleFieldVisibility(fieldName)}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
              >
                {isHidden ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span>Hidden</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Visible</span>
                  </>
                )}
              </button>
            </div>
            {!isCollapsed && (
              <div className="mt-3">
                <select
                  value={value || ""}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isHidden ? "bg-gray-100" : ""
                    }`}
                >
                  <option value="">Select {fieldConfig.label}</option>
                  {fieldConfig.options?.map((option) => (
                    <option key={option} value={option}>
                      {option} Star{option !== "1" ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );

      case "array":
        if (fieldConfig.itemType === "text") {
          return (
            <div
              key={fieldName}
              className={`mb-3 rounded-lg border p-3 ${isHidden
                ? "border-gray-300 bg-gray-50 opacity-60"
                : "border-gray-200 bg-white"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!noFieldCollapse && (
                    <button
                      type="button"
                      onClick={() => toggleFieldCollapse(fieldName)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label={isCollapsed ? "Expand field" : "Collapse field"}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : "rotate-0"
                          }`}
                      />
                    </button>
                  )}
                  <label
                    className={`block text-base font-medium ${isHidden ? "text-gray-500" : "text-gray-700"
                      }`}
                  >
                    {fieldConfig.label}
                    {fieldConfig.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    {isHidden && (
                      <span className="ml-2 text-xs text-gray-400">
                        (Hidden from card)
                      </span>
                    )}
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFieldVisibility(fieldName)}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  {isHidden ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Hidden</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Visible</span>
                    </>
                  )}
                </button>
              </div>
              {!isCollapsed && (
                <div className="mt-3 space-y-2">
                  {Array.isArray(value) &&
                    value.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const newArray = Array.isArray(value)
                              ? [...value]
                              : [];
                            newArray[idx] = e.target.value;
                            handleFieldChange(fieldName, newArray);
                          }}
                          placeholder={`${fieldConfig.label} ${idx + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => removeArrayItem(fieldName, idx)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  <button
                    type="button"
                    onClick={() => addArrayItem(fieldName, "")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isHidden
                      ? "bg-gray-400 text-gray-600"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                  >
                    <Plus className="h-4 w-4" />
                    Add {fieldConfig.label}
                  </button>
                </div>
              )}
            </div>
          );
        }

        if (fieldConfig.itemType === "image") {
          return (
            <div
              key={fieldName}
              className={`mb-3 rounded-lg border p-3 ${isHidden
                ? "border-gray-300 bg-gray-50 opacity-60"
                : "border-gray-200 bg-white"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!noFieldCollapse && (
                    <button
                      type="button"
                      onClick={() => toggleFieldCollapse(fieldName)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label={isCollapsed ? "Expand field" : "Collapse field"}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : "rotate-0"
                          }`}
                      />
                    </button>
                  )}
                  <label
                    className={`block text-base font-medium ${isHidden ? "text-gray-500" : "text-gray-700"
                      }`}
                  >
                    {fieldConfig.label}
                    {fieldConfig.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    {isHidden && (
                      <span className="ml-2 text-xs text-gray-400">
                        (Hidden from card)
                      </span>
                    )}
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFieldVisibility(fieldName)}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  {isHidden ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Hidden</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Visible</span>
                    </>
                  )}
                </button>
              </div>
              {!isCollapsed && (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    {Array.isArray(value) &&
                      value.map((imageUrl, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={imageUrl}
                            alt={`${fieldConfig.label} ${idx + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeArrayItem(fieldName, idx)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                  </div>
                  <label
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${isHidden
                      ? "bg-gray-400 text-gray-600"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                      }`}
                  >
                    <Plus className="h-4 w-4" />
                    {`Add ${fieldConfig.label}`}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={isHidden || mediaUploading}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        e.target.value = "";
                        if (files.length === 0) return;
                        setMediaUploading(true);
                        try {
                          const existingUrls = Array.isArray(cardData[fieldName])
                            ? [...cardData[fieldName]]
                            : [];
                          const existingPids = getMediaPidList(fieldName);

                          const newUrls = [];
                          const newPids = [];

                          for (const f of files) {
                            try {
                              const resp = await uploadMedia({ file: f, type: "image" });
                              const media = resp?.media;
                              if (media?.url) newUrls.push(media.url);
                              if (media?.publicId) newPids.push(media.publicId);
                            } catch {}
                          }

                          if (newUrls.length > 0) {
                            setCardData((prev) => ({
                              ...prev,
                              [fieldName]: [...existingUrls, ...newUrls],
                              __mediaPublicIds: {
                                ...(prev.__mediaPublicIds || {}),
                                [fieldName]: [...(existingPids || []), ...newPids],
                              },
                            }));
                          }
                        } finally {
                          setMediaUploading(false);
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          );
        }

        // Complex array with itemSchema
        if (fieldConfig.itemSchema) {
          return (
            <div
              key={fieldName}
              className={`mb-3 rounded-lg border p-3 ${isHidden
                ? "border-gray-300 bg-gray-50 opacity-60"
                : "border-gray-200 bg-white"
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {!noFieldCollapse && (
                    <button
                      type="button"
                      onClick={() => toggleFieldCollapse(fieldName)}
                      className="text-gray-500 hover:text-gray-700"
                      aria-label={isCollapsed ? "Expand field" : "Collapse field"}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : "rotate-0"
                          }`}
                      />
                    </button>
                  )}
                  <label
                    className={`block text-base font-medium ${isHidden ? "text-gray-500" : "text-gray-700"
                      }`}
                  >
                    {fieldConfig.label}
                    {fieldConfig.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    {isHidden && (
                      <span className="ml-2 text-xs text-gray-400">
                        (Hidden from card)
                      </span>
                    )}
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFieldVisibility(fieldName)}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  {isHidden ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Hidden</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Visible</span>
                    </>
                  )}
                </button>
              </div>
              {!isCollapsed && (
                <div className="mt-3 space-y-3">
                  {Array.isArray(value) &&
                    value.map((item, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-medium text-gray-700">
                            {fieldConfig.label} {idx + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeArrayItem(fieldName, idx)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {Object.entries(fieldConfig.itemSchema).map(
                            ([subField, subConfig]) => (
                              <div key={subField}>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  {subConfig.label}
                                  {subConfig.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </label>
                                {subConfig.type === "array" &&
                                  subConfig.itemSchema ? (
                                  <div className="space-y-3">
                                    <div className="space-y-2">
                                      {(item[subField] || []).map(
                                        (nestedItem, nIdx) => (
                                          <div
                                            key={nIdx}
                                            className="border border-gray-200 rounded-lg p-3 bg-white"
                                          >
                                            <div className="flex justify-between items-center mb-2">
                                              <h5 className="text-xs font-medium text-gray-700">
                                                {subConfig.label} {nIdx + 1}
                                              </h5>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  removeNestedArrayItem(
                                                    fieldName,
                                                    idx,
                                                    subField,
                                                    nIdx
                                                  )
                                                }
                                                className="text-red-600 hover:text-red-800 text-xs"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2">
                                              {Object.entries(
                                                subConfig.itemSchema
                                              ).map(
                                                ([pSubField, pSubConfig]) => (
                                                  <div key={pSubField}>
                                                    <label className="block text-[11px] font-medium text-gray-600 mb-1">
                                                      {pSubConfig.label}
                                                    </label>
                                                    {pSubConfig.type ===
                                                      "textarea" ? (
                                                      <textarea
                                                        value={
                                                          nestedItem[
                                                          pSubField
                                                          ] || ""
                                                        }
                                                        onChange={(e) =>
                                                          updateNestedArrayItem(
                                                            fieldName,
                                                            idx,
                                                            subField,
                                                            nIdx,
                                                            pSubField,
                                                            e.target.value
                                                          )
                                                        }
                                                        rows={2}
                                                        placeholder={
                                                          pSubConfig.label
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                      />
                                                    ) : pSubConfig.type ===
                                                      "image" ? (
                                                      <div className="flex items-center gap-2">
                                                        <label className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 cursor-pointer">
                                                          Upload Image
                                                          <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            disabled={isHidden || mediaUploading}
                                                            onChange={(e) => {
                                                              const file = e.target.files?.[0];
                                                              e.target.value = "";
                                                              const fieldKey = `${fieldName}[${idx}].${subField}[${nIdx}].${pSubField}`;
                                                              uploadAndReplace({
                                                                fieldKey,
                                                                file,
                                                                type: "image",
                                                                resourceType: "image",
                                                                setValue: (v) =>
                                                                  updateNestedArrayItem(
                                                                    fieldName,
                                                                    idx,
                                                                    subField,
                                                                    nIdx,
                                                                    pSubField,
                                                                    v
                                                                  ),
                                                              });
                                                            }}
                                                          />
                                                        </label>
                                                        {nestedItem[
                                                          pSubField
                                                        ] && (
                                                            <div className="flex items-center gap-2">
                                                              <img
                                                                src={
                                                                  nestedItem[
                                                                  pSubField
                                                                  ]
                                                                }
                                                                alt={
                                                                  pSubConfig.label
                                                                }
                                                                className="h-8 w-8 object-cover rounded border"
                                                              />
                                                              <button
                                                                type="button"
                                                                onClick={() =>
                                                                  updateNestedArrayItem(
                                                                    fieldName,
                                                                    idx,
                                                                    subField,
                                                                    nIdx,
                                                                    pSubField,
                                                                    ""
                                                                  )
                                                                }
                                                                className="text-red-600 text-xs"
                                                              >
                                                                Remove
                                                              </button>
                                                            </div>
                                                          )}
                                                      </div>
                                                    ) : (
                                                      <input
                                                        type={pSubConfig.type}
                                                        value={
                                                          nestedItem[
                                                          pSubField
                                                          ] || ""
                                                        }
                                                        onChange={(e) =>
                                                          updateNestedArrayItem(
                                                            fieldName,
                                                            idx,
                                                            subField,
                                                            nIdx,
                                                            pSubField,
                                                            e.target.value
                                                          )
                                                        }
                                                        placeholder={
                                                          pSubConfig.label
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                      />
                                                    )}
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const defaultNested = {};
                                          Object.keys(
                                            subConfig.itemSchema
                                          ).forEach((k) => {
                                            defaultNested[k] = "";
                                          });
                                          addNestedArrayItem(
                                            fieldName,
                                            idx,
                                            subField,
                                            defaultNested
                                          );
                                        }}
                                        className={`px-3 py-1 rounded text-xs ${isHidden
                                          ? "bg-gray-400 text-gray-600"
                                          : "bg-blue-600 text-white hover:bg-blue-700"
                                          }`}
                                      >
                                        Add {subConfig.label}
                                      </button>
                                      {fieldName === "galleryCategories" && subField === "images" && (
                                        <label
                                          className={`px-3 py-1 rounded text-xs cursor-pointer ${isHidden
                                            ? "bg-gray-400 text-gray-600"
                                            : "bg-purple-600 text-white hover:bg-purple-700"
                                            }`}
                                        >
                                          Upload images for this category
                                          <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            disabled={isHidden || mediaUploading}
                                            onChange={async (e) => {
                                              const files = Array.from(e.target.files || []);
                                              e.target.value = "";
                                              if (files.length === 0) return;
                                              setMediaUploading(true);
                                              try {
                                                const uploaded = [];
                                                for (const f of files) {
                                                  try {
                                                    const resp = await uploadMedia({ file: f, type: "image" });
                                                    if (resp?.media?.url) uploaded.push({ image: resp.media.url });
                                                  } catch {}
                                                }

                                                if (uploaded.length > 0) {
                                                  setCardData((prev) => {
                                                    const cats = Array.isArray(prev.galleryCategories)
                                                      ? [...prev.galleryCategories]
                                                      : [];
                                                    if (!cats[idx]) return prev;
                                                    const existing = Array.isArray(cats[idx][subField])
                                                      ? [...cats[idx][subField]]
                                                      : [];
                                                    cats[idx] = {
                                                      ...cats[idx],
                                                      [subField]: [...existing, ...uploaded],
                                                    };
                                                    return { ...prev, galleryCategories: cats };
                                                  });
                                                }
                                              } finally {
                                                setMediaUploading(false);
                                              }
                                            }}
                                          />
                                        </label>
                                      )}
                                    </div>
                                  </div>
                                ) : subConfig.type === "textarea" ? (
                                  <textarea
                                    value={item[subField] || ""}
                                    onChange={(e) =>
                                      handleArrayItemChange(
                                        fieldName,
                                        idx,
                                        subField,
                                        e.target.value
                                      )
                                    }
                                    placeholder={subConfig.label}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                ) : subConfig.type === "select" ? (
                                  <select
                                    value={item[subField] || ""}
                                    onChange={(e) =>
                                      handleArrayItemChange(
                                        fieldName,
                                        idx,
                                        subField,
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  >
                                    <option value="">
                                      Select {subConfig.label}
                                    </option>
                                    {subConfig.options?.map((option) => (
                                      <option key={option} value={option}>
                                        {option} Star{option !== "1" ? "s" : ""}
                                      </option>
                                    ))}
                                  </select>
                                ) : subConfig.type === "image" ? (
                                  <div className="flex items-center gap-2">
                                    <label className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 cursor-pointer">
                                      Upload Image
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={isHidden || mediaUploading}
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          e.target.value = "";
                                          const fieldKey = `${fieldName}[${idx}].${subField}`;
                                          uploadAndReplace({
                                            fieldKey,
                                            file,
                                            type: "image",
                                            resourceType: "image",
                                            setValue: (v) =>
                                              handleArrayItemChange(fieldName, idx, subField, v),
                                          });
                                        }}
                                      />
                                    </label>
                                    {item[subField] && (
                                      <div className="flex items-center gap-2">
                                        <img
                                          src={item[subField]}
                                          alt={subConfig.label}
                                          className="h-8 w-8 object-cover rounded border"
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleArrayItemChange(
                                              fieldName,
                                              idx,
                                              subField,
                                              ""
                                            )
                                          }
                                          className="text-red-600 text-xs"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <input
                                    type={subConfig.type}
                                    value={item[subField] || ""}
                                    onChange={(e) =>
                                      handleArrayItemChange(
                                        fieldName,
                                        idx,
                                        subField,
                                        e.target.value
                                      )
                                    }
                                    placeholder={subConfig.label}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const defaultItem = {};
                        Object.keys(fieldConfig.itemSchema).forEach((key) => {
                          defaultItem[key] = "";
                        });
                        addArrayItem(fieldName, defaultItem);
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${isHidden
                        ? "bg-gray-400 text-gray-600"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                    >
                      <Plus className="h-4 w-4" />
                      Add {fieldConfig.label}
                    </button>
                    {fieldName === "ourClients" && (
                      <label
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm cursor-pointer ${isHidden
                          ? "bg-gray-400 text-gray-600"
                          : "bg-purple-600 text-white hover:bg-purple-700"
                          }`}
                      >
                        <Plus className="h-4 w-4" />
                        Upload client images
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          disabled={isHidden || mediaUploading}
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            e.target.value = "";
                            if (files.length === 0) return;

                            setMediaUploading(true);
                            try {
                              const newItems = [];
                              const newPids = [];
                              for (const f of files) {
                                try {
                                  const resp = await uploadMedia({ file: f, type: "image" });
                                  if (resp?.media?.url) newItems.push({ image: resp.media.url });
                                  if (resp?.media?.publicId) newPids.push(resp.media.publicId);
                                } catch {}
                              }

                              if (newItems.length > 0) {
                                setCardData((prev) => ({
                                  ...prev,
                                  ourClients: [...(prev.ourClients || []), ...newItems],
                                  __mediaPublicIds: {
                                    ...(prev.__mediaPublicIds || {}),
                                    ourClients: [
                                      ...(Array.isArray(prev?.__mediaPublicIds?.ourClients)
                                        ? prev.__mediaPublicIds.ourClients
                                        : []),
                                      ...newPids,
                                    ],
                                  },
                                }));
                              }
                            } finally {
                              setMediaUploading(false);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        }

        return null;

      case "object":
        return (
          <div
            key={fieldName}
            className={`mb-3 rounded-lg border p-3 ${isHidden
              ? "border-gray-300 bg-gray-50 opacity-60"
              : "border-gray-200 bg-white"
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {!noFieldCollapse && (
                  <button
                    type="button"
                    onClick={() => toggleFieldCollapse(fieldName)}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label={isCollapsed ? "Expand field" : "Collapse field"}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : "rotate-0"
                        }`}
                    />
                  </button>
                )}
                <label
                  className={`block text-base font-medium ${isHidden ? "text-gray-500" : "text-gray-700"
                    }`}
                >
                  {fieldConfig.label}
                  {fieldConfig.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                  {isHidden && (
                    <span className="ml-2 text-xs text-gray-400">
                      (Hidden from card)
                    </span>
                  )}
                </label>
              </div>
              <button
                type="button"
                onClick={() => toggleFieldVisibility(fieldName)}
                className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
              >
                {isHidden ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span>Hidden</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Visible</span>
                  </>
                )}
              </button>
            </div>
            {!isCollapsed && (
              <div className="mt-3 space-y-3">
                {Object.entries(fieldConfig.schema).map(
                  ([subField, subConfig]) => (
                    <div key={subField}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {subConfig.label}
                        {subConfig.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      <input
                        type={subConfig.type}
                        value={(value && value[subField]) || ""}
                        onChange={(e) =>
                          handleObjectFieldChange(
                            fieldName,
                            subField,
                            e.target.value
                          )
                        }
                        placeholder={subConfig.label}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isHidden ? "bg-gray-100" : ""
                          }`}
                      />
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  if (error && !inquiry) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  const schema = getCurrentSchema();
  const isLinkProCategory =
    selectedCategory === "link-pro" ||
    inquiry?.businessType === "Link Pro" ||
    inquiry?.businessType === "link-pro";

  return (
    <div className="p-6 relative">
      {mediaUploading && (
        <div className="absolute inset-0 z-50 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <div className="bg-white border border-gray-200 shadow-lg px-4 py-3 rounded-xl flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              Uploading media...
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleViewCard}
            disabled={!inquiry?.cardId}
            className="flex items-center space-x-2 bg-gray-800 text-gray-100 px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-300 disabled:opacity-50"
          >
            <Eye className="h-4 w-4" />
            <span>View Card</span>
          </button>
          {/* <button
            onClick={handleCopyDetailsLink}
            disabled={!inquiry?.cardId}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-300 disabled:opacity-50 border border-gray-200"
            title="Copy shareable link for client to fill details (no login)"
          >
            <Link2 className="h-4 w-4" />
            <span>{detailsSubmitted ? "Details available" : "Details link"}</span>
          </button> */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save Card"}</span>
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center space-x-2 mb-4">
          <CheckCircle className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center space-x-2 mb-4">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-6">
        {/* Form Section */}
        <div className="space-y-6 overflow-y-auto w-[70%] h-[90vh]">
          {/* Card Type Toggle */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Card Type
            </h3>
            <label className="inline-flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={isCustom}
                onChange={(e) => {
                  const checked = e.target.checked;
                  if (checked) {
                    if (
                      confirm(
                        "Switch to Custom Card? This enables the custom builder for this card."
                      )
                    ) {
                      setIsCustom(true);
                      setCardData((prev) => ({
                        ...prev,
                        customCardData: { ...(prev?.customCardData || {}) },
                      }));
                      if (
                        inquiry?.businessType &&
                        selectedCategory !== inquiry.businessType
                      ) {
                        setSelectedCategory(inquiry.businessType);
                      }
                    }
                  } else {
                    if (
                      confirm(
                        "Disable Custom Card and revert to standard template?"
                      )
                    ) {
                      setIsCustom(false);
                      setCustomizations({});
                      setCardData((prev) => {
                        const { customCardData, ...rest } = prev;
                        return rest;
                      });
                      if (!selectedCategory && inquiry?.businessType) {
                        setSelectedCategory(inquiry.businessType);
                      }
                    }
                  }
                }}
              />
              Use Custom Card Builder
            </label>
          </div>

          {/* Desktop Link Pro Toggle */}
          {isLinkProCategory && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Desktop Version
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Turn this on to generate the desktop Link Pro card variant.
              </p>
              <label className="inline-flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={!!cardData.forDesktop}
                  onChange={(e) =>
                    handleFieldChange("forDesktop", e.target.checked)
                  }
                />
                <span>For Desktop</span>
              </label>
            </div>
          )}

          {/* Category Selection - Hidden when custom card is enabled */}
          {!isCustom && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Category Selection
              </h3>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {Array.isArray(categories) &&
                  categories.map((category) => (
                    <option
                      key={category.categoryId}
                      value={category.categoryId}
                    >
                      {category.categoryName}
                    </option>
                  ))}
              </select>

              {/* Template selection (per category) */}
              {(() => {
                const cat = categories.find((c) => c.categoryId === selectedCategory);
                const templates = cat?.templates || [];
                if (!Array.isArray(templates) || templates.length <= 1) return null;
                return (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template
                    </label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {templates.map((t) => (
                        <option key={t.templateId} value={t.templateId}>
                          {t.name || t.templateId} {t.isDefault ? "(default)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Card Fields or Custom Builder */}
          {!isCustom && schema && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Card Fields
              </h3>
              <div className="space-y-4">
                {schema.sections && schema.sections.length > 0 ? (
                  <>
                    {schema.sections.map((section) => {
                      const isCollapsed = collapsedSections[section.id] ?? true;
                      return (
                        <div
                          key={section.id}
                          className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setCollapsedSections((prev) => {
                                const current = prev[section.id] ?? true;
                                return {
                                  ...prev,
                                  [section.id]: !current,
                                };
                              })
                            }
                            className="w-full flex items-center justify-between px-5 py-3.5 text-left font-medium text-gray-900 bg-gray-50/80 hover:bg-gray-100/80 border-b border-gray-100 transition-colors"
                          >
                            <span className="text-[15px]">{section.label}</span>
                            <ChevronDown
                              className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                            />
                          </button>
                          {!isCollapsed && (
                            <div className="p-5 bg-white grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
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
                    <div className="mt-6 pt-2 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
                        More fields
                      </p>
                      <div className="space-y-4">
                        {Object.entries(schema.fields)
                          .filter(([fieldName]) => {
                            const inSection = (schema.sections || []).some((s) =>
                              (s.fields || []).includes(fieldName)
                            );
                            return !inSection;
                          })
                          .map(([fieldName, fieldConfig]) =>
                            renderField(fieldName, fieldConfig, { noFieldCollapse: true })
                          )}
                      </div>
                    </div>
                  </>
                ) : (
                  Object.entries(schema.fields).map(([fieldName, fieldConfig]) =>
                    renderField(fieldName, fieldConfig)
                  )
                )}
              </div>
            </div>
          )}

          {isCustom && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 mb-4">
                Custom Card Builder
              </h3>
              <CustomisedCardBuilder
                cardData={cardData}
                onCardDataChange={setCardData}
                onCustomizationChange={setCustomizations}
                customizations={customizations}
                mediaOpen={mediaOpen}
                setMediaOpen={setMediaOpen}
                setMediaTargetField={setMediaTargetField}
              />
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="flex flex-col gap-4 min-w-[450px] w-[30%]">
          <h3 className="text-base font-semibold text-gray-900">Preview</h3>
          <div className="bg-gray-50 p-6 rounded-xl overflow-y-auto h-[85vh]">
            <div className="flex justify-center">
              {isCustom ? (
                <CustomisedCardRenderer
                  cardData={cardData}
                  hiddenFields={hiddenFields}
                  customisations={customizations}
                />
              ) : (
                <CardRenderer
                  cardData={cardData}
                  category={{
                    categoryId: selectedCategory,
                    categoryName: schema?.name,
                  }}
                  hiddenFields={hiddenFields}
                  customisations={{}}
                  isCustom={false}
                />
              )}
            </div>
            {/* Debug info */}
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
              <div>isCustom: {isCustom ? "true" : "false"}</div>
              <div>selectedCategory: {selectedCategory}</div>
              <div>inquiry.businessType: {inquiry?.businessType}</div>
              <div>
                customizations keys:{" "}
                {Object.keys(customizations || {}).join(", ")}
              </div>
              <div>
                cardData.customCardData:{" "}
                {cardData?.customCardData ? "exists" : "missing"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Manager */}
      {mediaOpen && (
        <MediaManager
          isOpen={mediaOpen}
          onClose={() => {
            setMediaOpen(false);
            setMediaTargetField(null);
            setMediaMultiSelect(false);
          }}
          onSelect={handleMediaSelect}
          defaultTab={mediaDefaultTab}
          multiSelect={mediaMultiSelect}
        />
      )}
    </div>
  );
};

export default SimpleCardGenerator;
