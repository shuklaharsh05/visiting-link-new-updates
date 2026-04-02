/**
 * Link Pro card schema only (for UserCardGenerator).
 * Adapted from admin cardSchemas.js "link-pro" entry.
 */

export const linkProSchema = {
  name: "Link Pro",
  fields: {
    leftBgImage: { type: "image", label: "Left Background Image", required: false },
    rightBgImage: { type: "image", label: "Right Background Image", required: false },
    logo: { type: "image", label: "Logo", required: false },
    CompanyName: { type: "text", label: "Company Name", required: true },
    foundedYear: { type: "text", label: "Founded Year (Like 2020)", required: false },
    tagline: { type: "text", label: "Tagline", required: false },
    heading: { type: "text", label: "We Deals In", required: false },
    businessCategory: { type: "text", label: "Business Category", required: false },

    email: { type: "email", label: "Email", required: false },
    phoneNumber: { type: "tel", label: "Phone Number", required: false },
    whatsappNumber: { type: "tel", label: "Whatsapp Number", required: false },
    website: { type: "url", label: "Website", required: false },

    socialLinks: {
      type: "object",
      label: "Social Media Links",
      schema: {
        instagram: { type: "url", label: "Instagram URL", required: false },
        linkedin: { type: "url", label: "LinkedIn URL", required: false },
        facebook: { type: "url", label: "Facebook URL", required: false },
        twitter: { type: "url", label: "Twitter URL", required: false },
        youtube: { type: "url", label: "YouTube URL", required: false },
        behance: { type: "url", label: "Behance URL", required: false },
        pinterest: { type: "url", label: "Pinterest URL", required: false },
      },
      required: false,
    },
    socialCustomButtons: {
      type: "array",
      label: "Other Social Media Links",
      itemSchema: {
        icon: { type: "image", label: "Button Icon", required: false },
        text: { type: "text", label: "Button Text", required: false },
        url: { type: "url", label: "Button URL", required: false },
      },
      required: false,
    },

    shopLinks: {
      type: "array",
      label: "Shop Links (Like Flipkart, Amazon, etc.)",
      itemSchema: {
        icon: { type: "image", label: "Shop Icon", required: false },
        label: { type: "text", label: "Shop Name", required: true },
        url: { type: "url", label: "Shop URL", required: true },
      },
      required: false,
    },

    companyInfo: { type: "textarea", label: "Company Information", required: false },
    catalogue: { type: "url", label: "Catalogue URL", required: false },

    ourNumbers: {
      type: "array",
      label: "What we have done",
      itemSchema: {
        icon: { type: "image", label: "Icon", required: false },
        number: { type: "text", label: "Number", required: true },
        description: { type: "text", label: "Description", required: true },
      },
      required: false,
    },

    founderImage: { type: "image", label: "Founder Image", required: false },
    founderName: { type: "text", label: "Founder Name", required: false },
    founderDescription: { type: "textarea", label: "Founder Designation (Like Founder, CEO, etc.)", required: false },
    founderMessage: { type: "textarea", label: "Founder Message", required: false },
    vission: { type: "textarea", label: "Vission", required: false },

    ourServices: {
      type: "array",
      label: "Our Services",
      itemSchema: {
        title: { type: "text", label: "Title", required: true },
        description: { type: "text", label: "Description", required: true },
      },
    },

    ourProducts: {
      type: "array",
      label: "Our Products",
      itemSchema: {
        image: { type: "image", label: "Product Image", required: false },
        title: { type: "text", label: "Title", required: true },
        price: { type: "text", label: "Price", required: false },
        description: { type: "text", label: "Description", required: false },
        rating: { type: "select", label: "Rating (1-5)", options: ["1", "2", "3", "4", "5"], required: false },
        link: { type: "url", label: "Link", required: false },
      },
      required: false,
    },

    banner: { type: "image", label: "Banner Image", required: false },
    bannerLink: { type: "url", label: "Banner Link (Like https://www.google.com)", required: false },

    whyChooseUs: {
      type: "array",
      label: "Why Choose Us",
      itemSchema: { description: { type: "text", label: "Description", required: true } },
      required: false,
    },

    mapEmbedLink: { type: "url", label: "Google Map Link", required: false },
    headquarters: {
      type: "array",
      label: "Headquarters",
      itemSchema: {
        city: { type: "text", label: "City", required: true },
        address: { type: "textarea", label: "Address", required: true },
        mapUrl: { type: "url", label: "Map URL", required: true },
      },
    },

    ourClients: {
      type: "array",
      label: "Our Clients",
      itemSchema: { image: { type: "image", label: "Client Image", required: false } },
      required: false,
    },

    testimonials: {
      type: "array",
      label: "Testimonials",
      itemSchema: {
        name: { type: "text", label: "Customer Name", required: true },
        reviewText: { type: "textarea", label: "Review Text", required: true },
        rating: { type: "select", label: "Rating", options: ["1", "2", "3", "4", "5"], required: false },
        image: { type: "image", label: "Customer Image", required: false },
      },
      required: false,
    },

    galleryCategories: {
      type: "array",
      label: "Gallery Categories",
      itemSchema: {
        category: { type: "text", label: "Gallery Category Name (e.g. Office, Design)", required: false },
        images: {
          type: "array",
          label: "Category Images",
          itemSchema: { image: { type: "image", label: "Image", required: false } },
          required: false,
        },
      },
      required: false,
    },

    appStoreUrl: { type: "url", label: "App Store URL", required: false },
    playStoreUrl: { type: "url", label: "Play Store URL", required: false },
    youtubeVideo: { type: "url", label: "YouTube Video URL", required: false },
    ctaTitle: { type: "text", label: "Text (Ready to Join us)", required: false },
    ctaSubtitle: { type: "text", label: "Heading (Contact Us Today)", required: false },
  },
  sections: [
    { id: "ImageSection", label: "Images (Logo, Background Images, Catalogue)", fields: ["logo", "leftBgImage", "rightBgImage", "catalogue"] },
    { id: "companyDetails", label: "Company details", fields: ["CompanyName", "foundedYear", "tagline", "heading", "businessCategory"] },
    { id: "contactDetails", label: "Contact details", fields: ["email", "phoneNumber", "whatsappNumber", "website"] },
    { id: "SocialLinks", label: "Social Media and other Links", fields: ["socialLinks", "socialCustomButtons", "shopLinks"] },
    { id: "FounderDetails", label: "Founder details", fields: ["founderImage", "founderName", "founderDescription", "founderMessage", "vission", "companyInfo"] },
    { id: "OurNumbers", label: "What we have done", fields: ["ourNumbers"] },
    { id: "OurServices", label: "Our Services", fields: ["ourServices"] },
    { id: "OurProducts", label: "Our Products", fields: ["ourProducts"] },
    { id: "Banner", label: "Banner", fields: ["banner", "bannerLink"] },
    { id: "OurClients", label: "Our Clients", fields: ["ourClients"] },
    { id: "Testimonials", label: "Testimonials", fields: ["testimonials"] },
    { id: "WhyChooseUs", label: "Why Choose Us", fields: ["whyChooseUs"] },
    { id: "GalleryImages", label: "Gallery Images", fields: ["galleryCategories"] },
    { id: "MapEmbedLink", label: "Google Map Link", fields: ["mapEmbedLink", "headquarters"] },
    { id: "YouTube And AppLinks", label: "YouTube And App Links", fields: ["appStoreUrl", "playStoreUrl", "youtubeVideo"] },
    { id: "CTA", label: "Botton heading and Text", fields: ["ctaTitle", "ctaSubtitle"] },
  ],
};

function getDefaultsForField(fieldConfig) {
  switch (fieldConfig.type) {
    case "text":
    case "textarea":
    case "email":
    case "tel":
    case "url":
    case "image":
      return "";
    case "array":
      return [];
    case "object":
      return {};
    case "select":
      return "";
    default:
      return "";
  }
}

export function getDefaultCardData() {
  const defaultData = {};
  Object.entries(linkProSchema.fields).forEach(([fieldName, fieldConfig]) => {
    defaultData[fieldName] = getDefaultsForField(fieldConfig);
  });
  return defaultData;
}
