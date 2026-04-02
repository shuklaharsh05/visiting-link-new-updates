import MakeupArtistCard from "./cards/MakeupArtistCard";
import InteriorDesignerCard from "./cards/InteriorDesignerCard";
import TravelAgentCard from "./cards/TravelAgentCard";
import EcommerceCard from "./cards/EcommerceCard";
import LinkPro from "./cards/LinkPro";
import BasicInfo from "./cards/BasicInfo";
import DigitalBusiness from "./cards/DigitalBusiness";
import CompanyProfile from "./cards/CompanyProfile";
import CustomisedCardRenderer from "./CustomisedCardRenderer";

export default function CardRendererRegistry({
  templateId,
  categoryId,
  cardData = {},
  hiddenFields = [],
  customisations = {},
  isCustom = false,
}) {
  if (isCustom) {
    return (
      <CustomisedCardRenderer
        cardData={cardData}
        cardId={cardData._id || cardData.cardId}
        hiddenFields={hiddenFields}
        customisations={customisations}
      />
    );
  }

  const sharedProps = {
    cardData,
    hiddenFields,
    customisations,
    cardId: cardData._id || cardData.cardId,
  };

  const byTemplate = {
    "link-pro-default": <LinkPro {...sharedProps} />,
    "basic-info-default": <BasicInfo {...sharedProps} />,
    "digital-business-default": <DigitalBusiness {...sharedProps} />,
    "company-profile-default": <CompanyProfile {...sharedProps} />,
  };

  if (templateId && byTemplate[templateId]) {
    return byTemplate[templateId];
  }

  switch (categoryId) {
    case "makeup-artist":
      return <MakeupArtistCard {...sharedProps} />;
    case "interior-designer":
      return <InteriorDesignerCard {...sharedProps} />;
    case "travel-agent":
      return <TravelAgentCard {...sharedProps} />;
    case "ecommerce":
    case "local-shops":
      return <EcommerceCard {...sharedProps} />;
    case "link-pro":
      return <LinkPro {...sharedProps} />;
    case "basic-info":
      return <BasicInfo {...sharedProps} />;
    case "digital-business":
      return <DigitalBusiness {...sharedProps} />;
    case "company-profile":
      return <CompanyProfile {...sharedProps} />;
    default:
      return (
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-lg max-w-sm mx-auto">
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {cardData.name || "Name"}
            </h3>
            <p className="text-sm text-gray-600">
              {categoryId || "Unknown"} - {cardData.email || "Not provided"}
            </p>
          </div>
        </div>
      );
  }
}
