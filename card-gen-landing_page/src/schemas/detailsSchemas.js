export const detailsSchemas = {
  "link-pro": {
    fields: [
      // Basic Info
      { name: "CompanyName", type: "text", label: "Company Name" },
      { name: "heading", type: "text", label: "We Deals In" },
      { name: "businessCategory", type: "text", label: "Business Category" },
      { name: "foundedYear", type: "text", label: "Founded Year (Like 2020)" },
      { name: "tagline", type: "text", label: "Tagline" },

      // Contact
      { name: "email", type: "email", label: "Email" },
      { name: "phoneNumber", type: "tel", label: "Phone Number" },
      { name: "whatsappNumber", type: "tel", label: "WhatsApp Number" },
      { name: "website", type: "url", label: "Website" },

      // Social Links
      {
        name: "socialLinks",
        type: "array",
        label: "Social Media Links (Instagram, LinkedIn, Facebook, etc.)",
        multiple: true,
        itemSchema: {
          title: "",
          link: "",
        },
      },

      // Company Info
      {
        name: "companyInfo",
        type: "textarea",
        label: "Company Information",
      },
      // { name: "catalogue", type: "url", label: "Catalogue PDF URL" },

      // Founder / Vision
      { name: "founderName", type: "text", label: "Founder Name" },
      {
        name: "founderDescription",
        type: "textarea",
        label: "Founder Designation (Like Founder, CEO, etc.)",
      },
      {
        name: "founderMessage",
        type: "textarea",
        label: "Founder Message",
      },
      { name: "vission", type: "textarea", label: "Vision" },

      // Map & Apps
      { name: "mapEmbedLink", type: "url", label: "Google Map Link" },
      { name: "appStoreUrl", type: "url", label: "App Store URL" },
      { name: "playStoreUrl", type: "url", label: "Play Store URL" },
      { name: "youtubeVideo", type: "url", label: "YouTube Video URL" },

      // CTA
      // { name: "ctaTitle", type: "text", label: "CTA Title" },
      // { name: "ctaSubtitle", type: "text", label: "CTA Subtitle" },
      {
        name: "testimonials",
        type: "array",
        label: "What our clients say about us",
        multiple: true,
        itemSchema: {
          name: "",
          reviewText: "",
        },
      },

      // Metrics
      {
        name: "ourNumbers",
        type: "array",
        label: "What we have done (like 100+ clients, 10+ years of experience, etc.)",
        multiple: true,
        itemSchema: {
          number: "",
          description: "",
        },
      },

      // Services
      {
        name: "ourServices",
        type: "array",
        label: "Our Services",
        multiple: true,
        itemSchema: {
          title: "",
          description: "",
        },
      },

      // Products
      {
        name: "ourProducts",
        type: "array",
        label: "Our Products",
        multiple: true,
        itemSchema: {
          title: "",
          price: "",
          description: "",
        },
      },

      // Why Choose Us
      {
        name: "whyChooseUs",
        type: "array",
        label: "Why Choose Us",
        multiple: true,
        itemSchema: {
          description: "",
        },
      },

      // Headquarters
      {
        name: "headquarters",
        type: "array",
        label: "Your Offices Locations",
        multiple: true,
        itemSchema: {
          city: "",
          address: "",
          mapUrl: "",
        },
      },

      // Buttons
      // {
      //   name: "buttons",
      //   type: "array",
      //   label: "CTA Buttons",
      //   multiple: true,
      //   itemSchema: {
      //     label: "",
      //     url: "",
      //   },
      // },
    ],
  },

  "makeup-artist": {
    fields: [
      { name: "profileImage", type: "image", label: "Profile Image" },
      { name: "companyName", type: "text", label: "Company Name" },
      { name: "tagline", type: "text", label: "Tagline" },
      { name: "aboutUs", type: "textarea", label: "About Us" },
      {
        name: "certifications",
        type: "array",
        label: "Certifications",
        multiple: true,
        itemSchema: { value: "" },
      },
      { name: "certificationsText", type: "text", label: "Certification Description" },
      {
        name: "features",
        type: "array",
        label: "Features",
        multiple: true,
        itemSchema: { title: "", description: "", image: "" },
      },
      {
        name: "workImages",
        type: "array",
        label: "Work Images",
        multiple: true,
        itemSchema: { url: "" },
      },
      {
        name: "services",
        type: "array",
        label: "Services",
        multiple: true,
        itemSchema: {
          serviceName: "",
          serviceDescription: "",
          serviceImage: "",
          price: "",
        },
      },
      {
        name: "socialLinks",
        type: "array",
        label: "Social Links",
        itemSchema: { instagram: "", linkedin: "", facebook: "" },
      },
      {
        name: "clientLogos",
        type: "array",
        label: "Client Logos",
        multiple: true,
        itemSchema: { url: "" },
      },
      {
        name: "testimonials",
        type: "array",
        label: "Testimonials",
        multiple: true,
        itemSchema: { name: "", reviewText: "", rating: "", image: "" },
      },
      { name: "email", type: "email", label: "Email" },
      { name: "phoneNumber", type: "tel", label: "Phone Number" },
      { name: "website", type: "url", label: "Website" },
      { name: "address", type: "textarea", label: "Address" },
      { name: "mapEmbedLink", type: "url", label: "Map Embed Link" },
      { name: "appStoreUrl", type: "url", label: "App Store URL" },
      { name: "playStoreUrl", type: "url", label: "Play Store URL" },
      { name: "founderImage", type: "image", label: "Founder Image" },
      { name: "founderName", type: "text", label: "Founder Name" },
      { name: "founderDescription", type: "textarea", label: "Founder Description" },
      {
        name: "teamMembers",
        type: "array",
        label: "Team Members",
        multiple: true,
        itemSchema: { name: "", post: "", image: "" },
      },
      { name: "youtubeVideo", type: "url", label: "YouTube Video URL" },
      { name: "ctaTitle", type: "text", label: "CTA Title" },
      { name: "ctaSubtitle", type: "text", label: "CTA Subtitle" },
      {
        name: "buttons",
        type: "array",
        label: "Buttons",
        multiple: true,
        itemSchema: { label: "", link: "" },
      },
    ],
  },

  "interior-designer": {
    fields: [
      { name: "profileImage", type: "image", label: "Profile Image" },
      { name: "companyName", type: "text", label: "Company Name" },
      { name: "tagline", type: "text", label: "Tagline" },
      { name: "aboutUs", type: "textarea", label: "About Us" },
      {
        name: "certifications",
        type: "array",
        label: "Certifications",
        multiple: true,
        itemSchema: { value: "" },
      },
      { name: "certificationsText", type: "text", label: "Certification Description" },
      {
        name: "features",
        type: "array",
        label: "Features",
        multiple: true,
        itemSchema: { title: "", description: "", image: "" },
      },
      {
        name: "workImages",
        type: "array",
        label: "Work Images",
        multiple: true,
        itemSchema: { url: "" },
      },
      {
        name: "services",
        type: "array",
        label: "Services",
        multiple: true,
        itemSchema: {
          serviceName: "",
          serviceDescription: "",
          serviceImage: "",
          price: "",
        },
      },
      {
        name: "socialLinks",
        type: "array",
        label: "Social Links",
        itemSchema: { instagram: "", linkedin: "", facebook: "" },
      },
      {
        name: "clientLogos",
        type: "array",
        label: "Client Logos",
        multiple: true,
        itemSchema: { url: "" },
      },
      {
        name: "testimonials",
        type: "array",
        label: "Testimonials",
        multiple: true,
        itemSchema: { name: "", reviewText: "", rating: "", image: "" },
      },
      { name: "email", type: "email", label: "Email" },
      { name: "phoneNumber", type: "tel", label: "Phone Number" },
      { name: "website", type: "url", label: "Website" },
      { name: "address", type: "textarea", label: "Address" },
      { name: "mapEmbedLink", type: "url", label: "Map Embed Link" },
      { name: "appStoreUrl", type: "url", label: "App Store URL" },
      { name: "playStoreUrl", type: "url", label: "Play Store URL" },
      { name: "founderImage", type: "image", label: "Founder Image" },
      { name: "founderName", type: "text", label: "Founder Name" },
      { name: "founderDescription", type: "textarea", label: "Founder Description" },
      {
        name: "teamMembers",
        type: "array",
        label: "Team Members",
        multiple: true,
        itemSchema: { name: "", post: "", image: "" },
      },
      { name: "youtubeVideo", type: "url", label: "YouTube Video URL" },
      { name: "ctaTitle", type: "text", label: "CTA Title" },
      { name: "ctaSubtitle", type: "text", label: "CTA Subtitle" },
      {
        name: "buttons",
        type: "array",
        label: "Buttons",
        multiple: true,
        itemSchema: { label: "", link: "" },
      },
    ],
  },

  "travel-agent": {
    fields: [
      { name: "profileImage", type: "image", label: "Profile Image" },
      { name: "companyName", type: "text", label: "Company Name" },
      { name: "tagline", type: "text", label: "Tagline" },
      { name: "aboutUs", type: "textarea", label: "About Us" },
      {
        name: "certifications",
        type: "array",
        label: "Certifications",
        multiple: true,
        itemSchema: { value: "" },
      },
      { name: "certificationsText", type: "text", label: "Certification Description" },
      {
        name: "features",
        type: "array",
        label: "Features",
        multiple: true,
        itemSchema: { title: "", description: "", image: "" },
      },
      {
        name: "destinations",
        type: "array",
        label: "Destinations",
        multiple: true,
        itemSchema: {
          destinationName: "",
          destinationImage: "",
          description: "",
          price: "",
        },
      },
      {
        name: "services",
        type: "array",
        label: "Services",
        multiple: true,
        itemSchema: {
          serviceName: "",
          serviceDescription: "",
          serviceImage: "",
          price: "",
        },
      },
      {
        name: "socialLinks",
        type: "array",
        label: "Social Links",
        itemSchema: { instagram: "", linkedin: "", facebook: "" },
      },
      {
        name: "clientLogos",
        type: "array",
        label: "Client Logos",
        multiple: true,
        itemSchema: { url: "" },
      },
      {
        name: "testimonials",
        type: "array",
        label: "Testimonials",
        multiple: true,
        itemSchema: { name: "", reviewText: "", rating: "", image: "" },
      },
      { name: "email", type: "email", label: "Email" },
      { name: "phoneNumber", type: "tel", label: "Phone Number" },
      { name: "website", type: "url", label: "Website" },
      { name: "address", type: "textarea", label: "Address" },
      { name: "mapEmbedLink", type: "url", label: "Map Embed Link" },
      { name: "appStoreUrl", type: "url", label: "App Store URL" },
      { name: "playStoreUrl", type: "url", label: "Play Store URL" },
      { name: "founderImage", type: "image", label: "Founder Image" },
      { name: "founderName", type: "text", label: "Founder Name" },
      { name: "founderDescription", type: "textarea", label: "Founder Description" },
      {
        name: "teamMembers",
        type: "array",
        label: "Team Members",
        multiple: true,
        itemSchema: { name: "", post: "", image: "" },
      },
      { name: "youtubeVideo", type: "url", label: "YouTube Video URL" },
      { name: "ctaTitle", type: "text", label: "CTA Title" },
      { name: "ctaSubtitle", type: "text", label: "CTA Subtitle" },
      {
        name: "buttons",
        type: "array",
        label: "Buttons",
        multiple: true,
        itemSchema: { label: "", link: "" },
      },
    ],
  },

  "ecommerce": {
    fields: [
      { name: "logo", type: "image", label: "Store Logo" },
      { name: "storeName", type: "text", label: "Store Name" },
      { name: "tagline", type: "text", label: "Tagline" },
      { name: "aboutUs", type: "textarea", label: "About Us" },
      {
        name: "certifications",
        type: "array",
        label: "Certifications",
        multiple: true,
        itemSchema: { value: "" },
      },
      { name: "certificationsText", type: "text", label: "Certification Description" },
      {
        name: "features",
        type: "array",
        label: "Features",
        multiple: true,
        itemSchema: { title: "", description: "", image: "" },
      },
      {
        name: "categories",
        type: "array",
        label: "Categories",
        multiple: true,
        itemSchema: { categoryName: "", categoryImage: "" },
      },
      {
        name: "products",
        type: "array",
        label: "Products",
        multiple: true,
        itemSchema: { productName: "", productImage: "", price: "" },
      },
      {
        name: "socialLinks",
        type: "array",
        label: "Social Links",
        itemSchema: { instagram: "", linkedin: "", facebook: "" },
      },
      {
        name: "testimonials",
        type: "array",
        label: "Testimonials",
        multiple: true,
        itemSchema: { name: "", reviewText: "", rating: "", image: "" },
      },
      { name: "email", type: "email", label: "Email" },
      { name: "phoneNumber", type: "tel", label: "Phone Number" },
      { name: "website", type: "url", label: "Website" },
      { name: "address", type: "textarea", label: "Address" },
      { name: "mapEmbedLink", type: "url", label: "Map Embed Link" },
      { name: "appStoreUrl", type: "url", label: "App Store URL" },
      { name: "playStoreUrl", type: "url", label: "Play Store URL" },
      { name: "founderImage", type: "image", label: "Founder Image" },
      { name: "founderName", type: "text", label: "Founder Name" },
      { name: "founderDescription", type: "textarea", label: "Founder Description" },
      {
        name: "teamMembers",
        type: "array",
        label: "Team Members",
        multiple: true,
        itemSchema: { name: "", post: "", image: "" },
      },
      { name: "youtubeVideo", type: "url", label: "YouTube Video URL" },
      { name: "ctaTitle", type: "text", label: "CTA Title" },
      { name: "ctaSubtitle", type: "text", label: "CTA Subtitle" },
      {
        name: "buttons",
        type: "array",
        label: "Buttons",
        multiple: true,
        itemSchema: { label: "", link: "" },
      },
    ],
  },
};
