                    import React from "react";
                    import CardRendererRegistry from "./CardRendererRegistry";

                    const CardRenderer = ({
                      cardData,
                      category,
                      template,
                      hiddenFields = [],
                      customisations = {},
                      isCustom = false,
                    }) => {
                      // Debug logging
                      // console.log('CardRenderer props:', {
                      //   cardData,
                      //   category,
                      //   template,
                      //   hiddenFields,
                      //   customisations
                      // });
                      // console.log('CardRenderer - cardData._id:', cardData?._id);
                      // console.log('CardRenderer - cardData.cardId:', cardData?.cardId);

                      if (!cardData || !category) {
                        // console.log('CardRenderer: Missing cardData or category');
                        return (
                          <div className="bg-gray-100 p-8 rounded-lg text-center text-gray-500">
                            <p>No card data available</p>
                            <p className="text-sm mt-2">CardData: {JSON.stringify(cardData)}</p>
                            <p className="text-sm">Category: {JSON.stringify(category)}</p>
                          </div>
                        );
                      }

                      const safeCardData = cardData || {};
                      const safeCategory = category || {
                        categoryId: "unknown",
                        categoryName: "Unknown",
                      };
                      const safeHiddenFields = hiddenFields || [];
                      const safeCustomisations = customisations || {};

                      try {
                        return (
                          <CardRendererRegistry
                            templateId={template?.templateId || safeCardData.templateId}
                            categoryId={safeCategory.categoryId}
                            cardData={safeCardData}
                            hiddenFields={safeHiddenFields}
                            customisations={safeCustomisations}
                            isCustom={!!isCustom}
                          />
                        );
                      } catch (error) {
                        console.error("Error rendering card:", error);
                        console.error("Category:", safeCategory);
                        console.error("CardData:", cardData);
                        return (
                          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            <p className="font-semibold">Error rendering card</p>
                            <p className="text-sm mt-1">{error.message}</p>
                            <p className="text-xs mt-1">
                              Category: {safeCategory?.categoryId || "Unknown"}
                            </p>
                            <details className="mt-2">
                              <summary className="cursor-pointer text-sm">Show details</summary>
                              <pre className="text-xs mt-1 overflow-auto">
                                {JSON.stringify(
                                  { category: safeCategory, error: error.stack },
                                  null,
                                  2
                                )}
                              </pre>
                            </details>
                          </div>
                        );
                      }
                    };

                    export default CardRenderer;
