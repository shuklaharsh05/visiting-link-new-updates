import React, { useState, useEffect } from "react";
import { X, Eye, RefreshCw, Copy } from "lucide-react";
import CardRenderer from "./CardRenderer";
import { useToast } from "../contexts/ToastContext";
import { getCardById } from "../api/cards";

const CardPreviewModal = ({
  isOpen,
  onClose,
  inquiry,
  cardData,
  category,
  template,
  categories = [],
  hiddenFields = [],
  cardId,
  onRefresh,
}) => {
  const { error: showError, success: showSuccess } = useToast();
  const [actualCardData, setActualCardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resolvedCategory, setResolvedCategory] = useState(category);
  const [resolvedTemplate, setResolvedTemplate] = useState(template);

  useEffect(() => {
    setResolvedCategory(category);
    setResolvedTemplate(template);
  }, [category, template]);

  // Fetch actual card data when cardId is available
  useEffect(() => {
    const fetchCardData = async () => {
      if (!cardId || !isOpen) return;

      setLoading(true);
      try {
        // console.log('Fetching card data for cardId:', cardId);
        const response = await getCardById(cardId);
        // console.log('Fetched card response:', response);
        // The API returns { card: {...}, shareableLink: "...", qrCode: "...", publicUrl: "..." }
        const card = response.card || response;
        // console.log('Extracted card data:', card);
        // console.log('Card data field:', card.data);
        // console.log('Card data type:', typeof card.data);

        // Check for problematic data in the card data
        if (card.data && typeof card.data === "object") {
          Object.entries(card.data).forEach(([key, value]) => {
            if (
              typeof value === "object" &&
              value !== null &&
              !Array.isArray(value)
            ) {
              // console.log(`Warning: Card data field '${key}' is an object:`, value);
            }
          });
        }
        setActualCardData(card);
      } catch (error) {
        // console.error('Error fetching card data:', error);
        showError("Failed to load card data");
      } finally {
        setLoading(false);
      }
    };

    fetchCardData();
  }, [cardId, isOpen, showError]);

  // Update derived category/template when actual card data arrives
  useEffect(() => {
    const categoryIdFromCard =
      actualCardData?.card?.categoryId ||
      actualCardData?.categoryId ||
      category?.categoryId;

    if (
      categoryIdFromCard &&
      Array.isArray(categories) &&
      categories.length > 0
    ) {
      const matchedCategory = categories.find(
        (cat) => cat.categoryId === categoryIdFromCard
      );
      if (matchedCategory) {
        setResolvedCategory(matchedCategory);
        const templateIdFromCard =
          actualCardData?.card?.templateId ||
          actualCardData?.templateId ||
          template?.templateId;
        if (templateIdFromCard && Array.isArray(matchedCategory.templates)) {
          const matchedTemplate = matchedCategory.templates.find(
            (t) => t.templateId === templateIdFromCard
          );
          if (matchedTemplate) {
            setResolvedTemplate(matchedTemplate);
          }
        }
      }
    }
  }, [actualCardData, categories, category?.categoryId, template?.templateId]);

  // Debug logging
  // console.log('CardPreviewModal props:', {
  //   isOpen,
  //   inquiry,
  //   cardData,
  //   category,
  //   template,
  //   hiddenFields,
  //   cardId,
  //   actualCardData
  // });

  // Check for problematic data types in cardData
  if (cardData && typeof cardData === "object") {
    Object.entries(cardData).forEach(([key, value]) => {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // console.log(`Warning: CardPreviewModal cardData field '${key}' is an object:`, value);
      }
    });
  }

  // Check for problematic data types in actualCardData
  if (actualCardData?.data && typeof actualCardData.data === "object") {
    Object.entries(actualCardData.data).forEach(([key, value]) => {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // console.log(`Warning: CardPreviewModal actualCardData.data field '${key}' is an object:`, value);
      }
    });
  }

  // Validate required props
  if (!inquiry) {
    showError("No inquiry data available for preview");
    return null;
  }

  // Allow preview without a strict category by falling back to a generic one

  if (!isOpen) return null;

  const maskedShareableLink = actualCardData?.shareableLink
    ? actualCardData.shareableLink.replace(
        "https://teamserver.cloud",
        "https://www.visitinglink.com"
      )
    : actualCardData?.shareableLink;

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      // Fallback: reload the page
      window.location.reload();
    }
  };

  const CopyToClipboard = () => {
    if (maskedShareableLink) {
      navigator.clipboard.writeText(maskedShareableLink);
    }
    showSuccess("Copied");
  };

  // Better fallback that handles link-pro and other categories
  const getDefaultCategory = () => {
    // Try to get category from actualCardData first
    const categoryIdFromData =
      actualCardData?.card?.categoryId ||
      actualCardData?.categoryId ||
      category?.categoryId;

    if (
      categoryIdFromData &&
      Array.isArray(categories) &&
      categories.length > 0
    ) {
      const found = categories.find(
        (cat) => cat.categoryId === categoryIdFromData
      );
      if (found) return found;
    }

    // Fallback to provided category
    if (category) return category;

    // Last resort: try to find link-pro or default to first category
    const linkProCategory = categories.find(
      (cat) => cat.categoryId === "link-pro"
    );
    if (linkProCategory) return linkProCategory;

    // Default fallback
    return (
      categories[0] || { categoryId: "business", categoryName: "Business" }
    );
  };

  const safeCategory = resolvedCategory || getDefaultCategory();
  const safeTemplate = resolvedTemplate || template;

  return (
    <div className="fixed inset-0 !mt-0 z-[9998] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Eye className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Card Preview
                </h2>
                <p className="text-sm text-gray-600">
                  {inquiry?.name} - {safeCategory?.categoryName || "Business"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh Preview"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Card Preview */}
              <div className="flex justify-center">
                {loading ? (
                  <div className="bg-gray-100 p-8 rounded-lg text-center text-gray-500">
                    <p>Loading card data...</p>
                  </div>
                ) : actualCardData && actualCardData.data ? (
                  (() => {
                    // Debug: Log category resolution
                    console.log(
                      "CardPreviewModal - actualCardData:",
                      actualCardData
                    );
                    console.log(
                      "CardPreviewModal - safeCategory:",
                      safeCategory
                    );
                    console.log(
                      "CardPreviewModal - categoryId from card:",
                      actualCardData.card?.categoryId ||
                        actualCardData.categoryId
                    );
                    return (
                      <CardRenderer
                        cardData={actualCardData.data}
                        category={safeCategory}
                        template={safeTemplate}
                        hiddenFields={actualCardData.hiddenFields || []}
                        isCustom={!!actualCardData.isCustom}
                        customisations={actualCardData.customizations || {}}
                      />
                    );
                  })()
                ) : cardData && Object.keys(cardData).length > 0 ? (
                  (() => {
                    // Debug: Log category resolution
                    console.log("CardPreviewModal - Using cardData prop");
                    console.log(
                      "CardPreviewModal - safeCategory:",
                      safeCategory
                    );
                    return (
                      <CardRenderer
                        cardData={cardData}
                        category={safeCategory}
                        template={safeTemplate}
                        hiddenFields={hiddenFields}
                        isCustom={!!inquiry?.isCustom}
                        customisations={inquiry?.customizations || {}}
                      />
                    );
                  })()
                ) : (
                  <div className="bg-gray-100 p-8 rounded-lg text-center text-gray-500">
                    <p>No card data available for preview</p>
                    <p className="text-sm mt-2">
                      Card may not be fully generated yet
                    </p>
                  </div>
                )}
              </div>

              {/* Card Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Card Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-600">
                      {safeCategory?.categoryName || "Business"}
                    </span>
                  </div>
                  {/* <div>
                    <span className="font-medium text-gray-700">Template:</span>
                    <span className="ml-2 text-gray-600">{template?.name || 'Default'}</span>
                  </div> */}
                  <div>
                    <span className="font-medium text-gray-700">
                      Hidden Fields:
                    </span>
                    <span className="ml-2 text-gray-600">
                      {actualCardData?.hiddenFields.length > 0
                        ? actualCardData?.hiddenFields.join(", ")
                        : "None"}
                    </span>
                  </div>
                  {/* <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className="ml-2 text-gray-600">
                      {inquiry?.cardId ? 'Generated' : 'Not Generated'}
                    </span>
                  </div> */}
                  <div>
                    <span className="font-medium text-gray-700">
                      Shareable Link:
                    </span>
                    <a
                      href={maskedShareableLink}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      Link
                    </a>
                    <Copy
                      onClick={CopyToClipboard}
                      className="ml-2 text-gray-600 hover:text-gray-800 w-4 h-4 inline-block"
                    />
                  </div>
                  {/* <div>
                    <span className="font-medium text-gray-700">QR Code:</span>
                    <div className="ml-2">
                      {actualCardData?.qrCode ? (
                        <img 
                          src={actualCardData.qrCode} 
                          alt="QR Code" 
                          className="w-32 h-32 object-contain border rounded-lg"
                        />
                      ) : (
                        <span className="text-gray-500">Not available</span>
                      )}
                    </div>
                  </div> */}
                </div>
              </div>

              {/* Field Information */}
              {/* {template?.fields && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Field Information</h3>
                  <div className="space-y-2">
                    {template.fields.map(field => {
                      try {
                        const value = (actualCardData?.data || cardData)?.[field.name];
                        const isHidden = (actualCardData?.hiddenFields || hiddenFields).includes(field.name);
                        
                        let displayValue;
                        if (isHidden) {
                          displayValue = 'Hidden';
                        } else if (typeof value === 'object' && value !== null) {
                          if (Array.isArray(value)) {
                            displayValue = `${value.length} item${value.length !== 1 ? 's' : ''}`;
                          } else {
                            displayValue = 'Object data';
                          }
                        } else {
                          displayValue = value || 'Not provided';
                        }
                        
                        return (
                          <div key={field.name} className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">{field.label}:</span>
                            <span className={`text-gray-600 ${isHidden ? 'line-through text-gray-400' : ''}`}>
                              {displayValue}
                            </span>
                          </div>
                        );
                      } catch (error) {
                        console.error(`Error rendering field ${field.name}:`, error);
                        return (
                          <div key={field.name} className="flex items-center justify-between text-sm">
                            <span className="font-medium text-gray-700">{field.label}:</span>
                            <span className="text-red-600">Error displaying field</span>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              )} */}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardPreviewModal;
