// Card schemas for different card types
export const cardSchemas = {
  "basic-info": {
    name: "Basic Info",
    fields: {
      announcementType: {
        type: "text",
        label: "Announcement type",
        required: false,
      },
      name: { type: "text", label: "Name", required: true },
      number: { type: "tel", label: "Number", required: false },
      email: { type: "email", label: "Email", required: false },
      website: { type: "url", label: "Website", required: false },
      businessType: {
        type: "text",
        label: "Business Type",
        required: false,
        placeholder: "(interior designer, makeup artist, doctor, freelancer)",
      },
      logo: { type: "image", label: "Logo", required: false },

      heading: { type: "text", label: "Heading", required: false },
      subHeading: { type: "text", label: "Sub-Heading", required: false },

      socialLinks: {
        type: "object",
        label: "Social Media Links",
        schema: {
          instagram: { type: "url", label: "Instagram", required: false },
          facebook: { type: "url", label: "Facebook", required: false },
          behance: { type: "url", label: "Behance", required: false },
          youtube: { type: "url", label: "YouTube", required: false },
          twitter: { type: "url", label: "Twitter", required: false },
        },
        required: false,
      },

      aboutCompany: {
        type: "textarea",
        label: "About Company",
        required: false,
      },

      founderName: { type: "text", label: "Founder’s name", required: false },
      founderImage: {
        type: "image",
        label: "Founder’s Image",
        required: false,
      },
      founderDesignation: {
        type: "text",
        label: "Founder’s designation",
        required: false,
      },

      vision: { type: "textarea", label: "Vision", required: false },

      // Keep the field name as "catalogue" so SimpleCardGenerator's PDF upload helper UI works.
      catalogue: { type: "url", label: "Catalogue PDF", required: false },

      // Address + Map links can be more than one
      addresses: {
        type: "array",
        label: "Address + Map links",
        itemSchema: {
          address: { type: "textarea", label: "Address", required: false },
          mapLink: { type: "url", label: "Map link", required: false },
        },
        required: false,
      },

      bottomHeadline: {
        type: "text",
        label: "Bottom Headline",
        required: false,
      },
      ctaText: { type: "textarea", label: "CTA Text", required: false },
    },
    sections: [
      {
        id: "basic",
        label: "Basic info",
        fields: [
          "announcementType",
          "name",
          "businessType",
          "logo",
          "heading",
          "subHeading",
        ],
      },
      {
        id: "contact",
        label: "Contact",
        fields: ["number", "email", "website"],
      },
      { id: "social", label: "Social links", fields: ["socialLinks"] },
      { id: "about", label: "About company", fields: ["aboutCompany"] },
      {
        id: "founder",
        label: "Founder",
        fields: ["founderName", "founderImage", "founderDesignation"],
      },
      { id: "vision", label: "Vision", fields: ["vision"] },
      { id: "catalogue", label: "Catalogue", fields: ["catalogue"] },
      { id: "address", label: "Address", fields: ["addresses"] },
      {
        id: "cta",
        label: "Bottom headline & CTA",
        fields: ["bottomHeadline", "ctaText"],
      },
    ],
  },

  "digital-business": {
    name: "Digital Business",
    fields: {
      announcementType: {
        type: "text",
        label: "Announcement type",
        required: false,
      },
      name: { type: "text", label: "Name", required: true },
      number: { type: "tel", label: "Number", required: false },
      email: { type: "email", label: "Email", required: false },
      website: { type: "url", label: "Website", required: false },
      businessType: {
        type: "text",
        label: "Business Type",
        required: false,
        placeholder: "(interior designer, makeup artist, doctor, freelancer)",
      },
      logo: { type: "image", label: "Logo", required: false },

      heading: { type: "text", label: "Heading", required: false },
      subHeading: { type: "text", label: "Sub-Heading", required: false },

      googleReviewLink: {
        type: "url",
        label: "Google Review Link",
        required: false,
      },

      socialLinks: {
        type: "object",
        label: "Social Media Links",
        schema: {
          instagram: { type: "url", label: "Instagram", required: false },
          facebook: { type: "url", label: "Facebook", required: false },
          behance: { type: "url", label: "Behance", required: false },
          youtube: { type: "url", label: "YouTube", required: false },
          twitter: { type: "url", label: "Twitter", required: false },
        },
        required: false,
      },

      aboutCompany: {
        type: "textarea",
        label: "About Company",
        required: false,
      },

      founderName: { type: "text", label: "Founder’s name", required: false },
      founderImage: {
        type: "image",
        label: "Founder’s Image",
        required: false,
      },
      founderDesignation: {
        type: "text",
        label: "Founder’s designation",
        required: false,
      },

      vision: { type: "textarea", label: "Vision", required: false },
      // Keep as "catalogue" for PDF upload helper UI.
      catalogue: { type: "url", label: "Catalogue PDF", required: false },

      playStoreUrl: { type: "url", label: "Google Play link", required: false },
      appStoreUrl: { type: "url", label: "App Store link", required: false },
      youtubeVideo: {
        type: "url",
        label: "YouTube Video Link",
        required: false,
      },

      addresses: {
        type: "array",
        label: "Address + Map links",
        itemSchema: {
          address: { type: "textarea", label: "Address", required: false },
          mapLink: { type: "url", label: "Map link", required: false },
        },
        required: false,
      },

      bottomHeadline: {
        type: "text",
        label: "Bottom Headline",
        required: false,
      },
      ctaText: { type: "textarea", label: "CTA Text", required: false },
    },
    sections: [
      {
        id: "basic",
        label: "Basic info",
        fields: [
          "announcementType",
          "name",
          "businessType",
          "logo",
          "heading",
          "subHeading",
        ],
      },
      {
        id: "contact",
        label: "Contact",
        fields: ["number", "email", "website"],
      },
      { id: "reviews", label: "Google reviews", fields: ["googleReviewLink"] },
      { id: "social", label: "Social links", fields: ["socialLinks"] },
      { id: "about", label: "About company", fields: ["aboutCompany"] },
      {
        id: "founder",
        label: "Founder",
        fields: ["founderName", "founderImage", "founderDesignation"],
      },
      { id: "vision", label: "Vision", fields: ["vision"] },
      { id: "catalogue", label: "Catalogue", fields: ["catalogue"] },
      {
        id: "apps",
        label: "App & video links",
        fields: ["playStoreUrl", "appStoreUrl", "youtubeVideo"],
      },
      { id: "address", label: "Address", fields: ["addresses"] },
      {
        id: "cta",
        label: "Bottom headline & CTA",
        fields: ["bottomHeadline", "ctaText"],
      },
    ],
  },

  "company-profile": {
    name: "Company Profile",
    fields: {
      announcementType: {
        type: "text",
        label: "Announcement type",
        required: false,
      },
      name: { type: "text", label: "Name", required: true },
      number: { type: "tel", label: "Number", required: false },
      email: { type: "email", label: "Email", required: false },
      website: { type: "url", label: "Website", required: false },
      businessType: {
        type: "text",
        label: "Business Type",
        required: false,
        placeholder: "(interior designer, makeup artist, doctor, freelancer)",
      },
      logo: { type: "image", label: "Logo", required: false },

      heading: { type: "text", label: "Heading", required: false },
      subHeading: { type: "text", label: "Sub-Heading", required: false },

      googleReviewLink: {
        type: "url",
        label: "Google Review Link",
        required: false,
      },

      socialLinks: {
        type: "object",
        label: "Social Media Links",
        schema: {
          instagram: { type: "url", label: "Instagram", required: false },
          facebook: { type: "url", label: "Facebook", required: false },
          behance: { type: "url", label: "Behance", required: false },
          youtube: { type: "url", label: "YouTube", required: false },
          twitter: { type: "url", label: "Twitter", required: false },
        },
        required: false,
      },

      bannerImage: { type: "image", label: "Banner Image", required: false },

      aboutCompany: {
        type: "textarea",
        label: "About Company",
        required: false,
      },

      founderName: { type: "text", label: "Founder’s name", required: false },
      founderImage: {
        type: "image",
        label: "Founder’s Image",
        required: false,
      },
      founderDesignation: {
        type: "text",
        label: "Founder’s designation",
        required: false,
      },
      founderMessage: {
        type: "textarea",
        label: "Founder’s Message",
        required: false,
      },

      vision: { type: "textarea", label: "Vision", required: false },

      teamMembers: {
        type: "array",
        label: "Our Team",
        itemSchema: {
          image: { type: "image", label: "Member Image", required: false },
          name: { type: "text", label: "Member Name", required: false },
          role: { type: "text", label: "Member role", required: false },
        },
        required: false,
      },

      services: {
        type: "array",
        label: "Services Section",
        itemSchema: {
          image: { type: "image", label: "Service Image", required: false },
          heading: { type: "text", label: "Heading", required: false },
          description: {
            type: "textarea",
            label: "Description",
            required: false,
          },
          price: { type: "text", label: "Price", required: false },
          url: { type: "url", label: "URL", required: false },
        },
        required: false,
      },

      products: {
        type: "array",
        label: "Product Section",
        itemSchema: {
          image: { type: "image", label: "Product Image", required: false },
          name: { type: "text", label: "Name", required: false },
          description: {
            type: "textarea",
            label: "Description",
            required: false,
          },
          rating: {
            type: "select",
            label: "Rating (1-5)",
            options: ["1", "2", "3", "4", "5"],
            required: false,
          },
          price: { type: "text", label: "Price", required: false },
          url: { type: "url", label: "URL", required: false },
        },
        required: false,
      },

      // Keep as "catalogue" for PDF upload helper UI.
      catalogue: { type: "url", label: "Catalogue PDF", required: false },

      playStoreUrl: { type: "url", label: "Google Play link", required: false },
      appStoreUrl: { type: "url", label: "App Store link", required: false },
      youtubeVideo: {
        type: "url",
        label: "YouTube Video Link",
        required: false,
      },

      addresses: {
        type: "array",
        label: "Address + Map links",
        itemSchema: {
          address: { type: "textarea", label: "Address", required: false },
          mapLink: { type: "url", label: "Map link", required: false },
        },
        required: false,
      },

      bottomHeadline: {
        type: "text",
        label: "Bottom Headline",
        required: false,
      },
      ctaText: { type: "textarea", label: "CTA Text", required: false },
    },
    sections: [
      {
        id: "basic",
        label: "Basic info",
        fields: [
          "announcementType",
          "name",
          "businessType",
          "logo",
          "heading",
          "subHeading",
        ],
      },
      {
        id: "contact",
        label: "Contact",
        fields: ["number", "email", "website"],
      },
      { id: "reviews", label: "Google reviews", fields: ["googleReviewLink"] },
      { id: "social", label: "Social links", fields: ["socialLinks"] },
      { id: "banner", label: "Banner", fields: ["bannerImage"] },
      { id: "about", label: "About company", fields: ["aboutCompany"] },
      {
        id: "founder",
        label: "Founder",
        fields: [
          "founderName",
          "founderImage",
          "founderDesignation",
          "founderMessage",
        ],
      },
      { id: "vision", label: "Vision", fields: ["vision"] },
      { id: "team", label: "Our team", fields: ["teamMembers"] },
      { id: "services", label: "Services", fields: ["services"] },
      { id: "products", label: "Products", fields: ["products"] },
      { id: "catalogue", label: "Catalogue", fields: ["catalogue"] },
      {
        id: "apps",
        label: "App & video links",
        fields: ["playStoreUrl", "appStoreUrl", "youtubeVideo"],
      },
      { id: "address", label: "Address", fields: ["addresses"] },
      {
        id: "cta",
        label: "Bottom headline & CTA",
        fields: ["bottomHeadline", "ctaText"],
      },
    ],
  },

  "makeup-artist": {
    name: "Makeup Artist",
    fields: {
      // Basic Info
      profileImage: { type: "image", label: "Profile Image", required: false },
      companyName: { type: "text", label: "Company Name", required: true },
      tagline: { type: "text", label: "Tagline", required: false },
      aboutUs: { type: "textarea", label: "About Us", required: false },

      // Features
      features: {
        type: "array",
        label: "Features",
        itemSchema: {
          title: { type: "text", label: "Feature Title", required: true },
          description: {
            type: "text",
            label: "Feature Description",
            required: false,
          },
          image: { type: "image", label: "Feature Image", required: false },
        },
        required: false,
      },

      // Certifications
      certifications: {
        type: "array",
        label: "Certifications",
        itemType: "text",
        required: false,
      },
      certificationsText: {
        type: "text",
        label: "Certification Description",
        required: false,
      },

      // Work & Services
      workImages: {
        type: "array",
        label: "Work Images",
        itemType: "image",
        required: false,
      },
      services: {
        type: "array",
        label: "Services",
        itemSchema: {
          serviceName: { type: "text", label: "Service Name", required: true },
          serviceDescription: {
            type: "textarea",
            label: "Service Description",
            required: false,
          },
          serviceImage: {
            type: "image",
            label: "Service Image",
            required: false,
          },
          price: { type: "text", label: "Price", required: false },
        },
        required: false,
      },

      // Social & Clients
      socialLinks: {
        type: "object",
        label: "Social Links",
        schema: {
          instagram: { type: "url", label: "Instagram URL", required: false },
          linkedin: { type: "url", label: "LinkedIn URL", required: false },
          facebook: { type: "url", label: "Facebook URL", required: false },
        },
        required: false,
      },
      clientLogos: {
        type: "array",
        label: "Client Logos",
        itemType: "image",
        required: false,
      },

      // Contact Info
      email: { type: "email", label: "Email", required: false },
      phoneNumber: { type: "tel", label: "Phone Number", required: false },
      website: { type: "url", label: "Website", required: false },
      address: { type: "textarea", label: "Address", required: false },
      mapEmbedLink: { type: "url", label: "Map Embed Link", required: false },
      appStoreUrl: { type: "url", label: "App Store URL", required: false },
      playStoreUrl: { type: "url", label: "Play Store URL", required: false },

      // Founder & Team
      founderImage: { type: "image", label: "Founder Image", required: false },
      founderName: { type: "text", label: "Founder Name", required: false },
      founderDescription: {
        type: "textarea",
        label: "Founder Description",
        required: false,
      },
      teamMembers: {
        type: "array",
        label: "Team Members",
        itemSchema: {
          name: { type: "text", label: "Name", required: true },
          post: { type: "text", label: "Post/Position", required: false },
          image: { type: "image", label: "Profile Image", required: false },
        },
        required: false,
      },

      // Testimonials
      testimonials: {
        type: "array",
        label: "Testimonials",
        itemSchema: {
          name: { type: "text", label: "Customer Name", required: true },
          reviewText: {
            type: "textarea",
            label: "Review Text",
            required: true,
          },
          rating: {
            type: "select",
            label: "Rating",
            options: ["1", "2", "3", "4", "5"],
            required: false,
          },
          image: { type: "image", label: "Customer Image", required: false },
        },
        required: false,
      },
      // YouTube Video
      youtubeVideo: {
        type: "url",
        label: "YouTube Video URL",
        required: false,
      },
      // CTA
      ctaTitle: { type: "text", label: "CTA Title", required: false },
      ctaSubtitle: { type: "text", label: "CTA Subtitle", required: false },
      buttons: {
        type: "array",
        label: "Buttons",
        itemSchema: {
          label: { type: "text", label: "Button Label", required: true },
          url: { type: "url", label: "Button URL", required: true },
        },
        required: false,
      },
    },
  },

  "interior-designer": {
    name: "Interior Designer",
    fields: {
      // Basic Info
      profileImage: { type: "image", label: "Profile Image", required: false },
      companyName: { type: "text", label: "Company Name", required: true },
      tagline: { type: "text", label: "Tagline", required: false },
      aboutUs: { type: "textarea", label: "About Us", required: false },

      // Features
      features: {
        type: "array",
        label: "Features",
        itemSchema: {
          title: { type: "text", label: "Feature Title", required: true },
          description: {
            type: "text",
            label: "Feature Description",
            required: false,
          },
          image: { type: "image", label: "Feature Image", required: false },
        },
        required: false,
      },

      // Certifications
      certifications: {
        type: "array",
        label: "Certifications",
        itemType: "text",
        required: false,
      },
      certificationsText: {
        type: "text",
        label: "Certification Description",
        required: false,
      },

      // Work & Services
      workImages: {
        type: "array",
        label: "Work Images",
        itemType: "image",
        required: false,
      },
      services: {
        type: "array",
        label: "Services",
        itemSchema: {
          serviceName: { type: "text", label: "Service Name", required: true },
          serviceDescription: {
            type: "textarea",
            label: "Service Description",
            required: false,
          },
          serviceImage: {
            type: "image",
            label: "Service Image",
            required: false,
          },
          price: { type: "text", label: "Price", required: false },
        },
        required: false,
      },

      // Social & Clients
      socialLinks: {
        type: "object",
        label: "Social Links",
        schema: {
          instagram: { type: "url", label: "Instagram URL", required: false },
          linkedin: { type: "url", label: "LinkedIn URL", required: false },
          facebook: { type: "url", label: "Facebook URL", required: false },
        },
        required: false,
      },
      clientLogos: {
        type: "array",
        label: "Client Logos",
        itemType: "image",
        required: false,
      },

      // Contact Info
      email: { type: "email", label: "Email", required: false },
      phoneNumber: { type: "tel", label: "Phone Number", required: false },
      website: { type: "url", label: "Website", required: false },
      address: { type: "textarea", label: "Address", required: false },
      mapEmbedLink: { type: "url", label: "Map Embed Link", required: false },
      appStoreUrl: { type: "url", label: "App Store URL", required: false },
      playStoreUrl: { type: "url", label: "Play Store URL", required: false },

      // Founder & Team
      founderImage: { type: "image", label: "Founder Image", required: false },
      founderName: { type: "text", label: "Founder Name", required: false },
      founderDescription: {
        type: "textarea",
        label: "Founder Description",
        required: false,
      },
      teamMembers: {
        type: "array",
        label: "Team Members",
        itemSchema: {
          name: { type: "text", label: "Name", required: true },
          post: { type: "text", label: "Post/Position", required: false },
          image: { type: "image", label: "Profile Image", required: false },
        },
        required: false,
      },

      // Testimonials
      testimonials: {
        type: "array",
        label: "Testimonials",
        itemSchema: {
          name: { type: "text", label: "Customer Name", required: true },
          reviewText: {
            type: "textarea",
            label: "Review Text",
            required: true,
          },
          rating: {
            type: "select",
            label: "Rating",
            options: ["1", "2", "3", "4", "5"],
            required: false,
          },
          image: { type: "image", label: "Customer Image", required: false },
        },
        required: false,
      },

      // YouTube Video
      youtubeVideo: {
        type: "url",
        label: "YouTube Video URL",
        required: false,
      },
      // CTA
      ctaTitle: { type: "text", label: "CTA Title", required: false },
      ctaSubtitle: { type: "text", label: "CTA Subtitle", required: false },
      buttons: {
        type: "array",
        label: "Buttons",
        itemSchema: {
          label: { type: "text", label: "Button Label", required: true },
          url: { type: "url", label: "Button URL", required: true },
        },
        required: false,
      },
    },
  },

  "travel-agent": {
    name: "Travel Agent",
    fields: {
      // Basic Info
      profileImage: { type: "image", label: "Profile Image", required: false },
      companyName: { type: "text", label: "Company Name", required: true },
      tagline: { type: "text", label: "Tagline", required: false },
      aboutUs: { type: "textarea", label: "About Us", required: false },

      // Certifications
      certifications: {
        type: "array",
        label: "Certifications",
        itemType: "text",
        required: false,
      },
      certificationsText: {
        type: "text",
        label: "Certification Description",
        required: false,
      },

      // Features
      features: {
        type: "array",
        label: "Features",
        itemSchema: {
          title: { type: "text", label: "Feature Title", required: true },
          description: {
            type: "text",
            label: "Feature Description",
            required: false,
          },
          image: { type: "image", label: "Feature Image", required: false },
        },
        required: false,
      },

      // Destinations & Services
      destinations: {
        type: "array",
        label: "Destinations",
        itemSchema: {
          destinationName: {
            type: "text",
            label: "Destination Name",
            required: true,
          },
          packages: {
            type: "array",
            label: "Packages",
            itemSchema: {
              packageName: {
                type: "text",
                label: "Package Name",
                required: true,
              },
              description: {
                type: "textarea",
                label: "Description",
                required: false,
              },
              price: { type: "text", label: "Price", required: false },
              packageImage: {
                type: "image",
                label: "Package Image",
                required: false,
              },
            },
            required: false,
          },
        },
        required: false,
      },
      services: {
        type: "array",
        label: "Services",
        itemSchema: {
          serviceName: { type: "text", label: "Service Name", required: true },
          serviceDescription: {
            type: "textarea",
            label: "Service Description",
            required: false,
          },
          serviceImage: {
            type: "image",
            label: "Service Image",
            required: false,
          },
          price: { type: "text", label: "Price", required: false },
        },
        required: false,
      },

      // Testimonials
      testimonials: {
        type: "array",
        label: "Testimonials",
        itemSchema: {
          name: { type: "text", label: "Customer Name", required: true },
          reviewText: {
            type: "textarea",
            label: "Review Text",
            required: true,
          },
          rating: {
            type: "select",
            label: "Rating",
            options: ["1", "2", "3", "4", "5"],
            required: false,
          },
          image: { type: "image", label: "Customer Image", required: false },
        },
        required: false,
      },

      // Social & Clients
      socialLinks: {
        type: "object",
        label: "Social Links",
        schema: {
          instagram: { type: "url", label: "Instagram URL", required: false },
          linkedin: { type: "url", label: "LinkedIn URL", required: false },
          facebook: { type: "url", label: "Facebook URL", required: false },
        },
        required: false,
      },
      clientLogos: {
        type: "array",
        label: "Client Logos",
        itemType: "image",
        required: false,
      },

      // Contact Info
      email: { type: "email", label: "Email", required: false },
      phoneNumber: { type: "tel", label: "Phone Number", required: false },
      website: { type: "url", label: "Website", required: false },
      address: { type: "textarea", label: "Address", required: false },
      mapEmbedLink: { type: "url", label: "Map Embed Link", required: false },
      appStoreUrl: { type: "url", label: "App Store URL", required: false },
      playStoreUrl: { type: "url", label: "Play Store URL", required: false },

      // Founder & Team
      founderImage: { type: "image", label: "Founder Image", required: false },
      founderName: { type: "text", label: "Founder Name", required: false },
      founderDescription: {
        type: "textarea",
        label: "Founder Description",
        required: false,
      },
      teamMembers: {
        type: "array",
        label: "Team Members",
        itemSchema: {
          name: { type: "text", label: "Name", required: true },
          post: { type: "text", label: "Post/Position", required: false },
          image: { type: "image", label: "Profile Image", required: false },
        },
        required: false,
      },

      galleryImages: {
        type: "array",
        label: "Gallery Images",
        itemType: "image",
        required: false,
      },

      // YouTube Video
      youtubeVideo: {
        type: "url",
        label: "YouTube Video URL",
        required: false,
      },
      // CTA
      ctaTitle: { type: "text", label: "CTA Title", required: false },
      ctaSubtitle: { type: "text", label: "CTA Subtitle", required: false },
      buttons: {
        type: "array",
        label: "Buttons",
        itemSchema: {
          label: { type: "text", label: "Button Label", required: true },
          url: { type: "url", label: "Button URL", required: true },
        },
        required: false,
      },
    },
  },

  ecommerce: {
    name: "Local Shops / E-commerce",
    fields: {
      // Basic Info
      logo: { type: "image", label: "Logo", required: false },
      storeName: { type: "text", label: "Store Name", required: true },
      tagline: { type: "text", label: "Tagline", required: false },
      aboutUs: { type: "textarea", label: "About Us", required: false },

      // Features
      features: {
        type: "array",
        label: "Features",
        itemSchema: {
          title: { type: "text", label: "Feature Title", required: true },
          description: {
            type: "text",
            label: "Feature Description",
            required: false,
          },
          image: { type: "image", label: "Feature Image", required: false },
        },
        required: false,
      },

      // Certifications
      certifications: {
        type: "array",
        label: "Certifications",
        itemType: "text",
        required: false,
      },
      certificationsText: {
        type: "text",
        label: "Certification Description",
        required: false,
      },

      // Products & Categories
      categories: {
        type: "array",
        label: "Categories",
        itemSchema: {
          categoryName: {
            type: "text",
            label: "Category Name",
            required: true,
          },
          categoryImage: {
            type: "image",
            label: "Category Image",
            required: false,
          },
        },
        required: false,
      },
      products: {
        type: "array",
        label: "Products",
        itemSchema: {
          productName: { type: "text", label: "Product Name", required: true },
          price: { type: "text", label: "Price", required: false },
          productImage: {
            type: "image",
            label: "Product Image",
            required: false,
          },
        },
        required: false,
      },
      // specialOffers: {
      //   type: 'array',
      //   label: 'Special Offers',
      //   itemSchema: {
      //     offerText: { type: 'textarea', label: 'Offer Text', required: true },
      //     ctaButton: {
      //       type: 'object',
      //       label: 'CTA Button',
      //       schema: {
      //         label: { type: 'text', label: 'Button Label', required: true },
      //         url: { type: 'url', label: 'Button URL', required: true }
      //       },
      //       required: false
      //     }
      //   },
      //   required: false
      // },

      // Social Links
      socialLinks: {
        type: "object",
        label: "Social Links",
        schema: {
          instagram: { type: "url", label: "Instagram URL", required: false },
          linkedin: { type: "url", label: "LinkedIn URL", required: false },
          facebook: { type: "url", label: "Facebook URL", required: false },
        },
        required: false,
      },

      // Contact Info
      email: { type: "email", label: "Email", required: false },
      phoneNumber: { type: "tel", label: "Phone Number", required: false },
      website: { type: "url", label: "Website", required: false },
      address: { type: "textarea", label: "Address", required: false },
      mapEmbedLink: { type: "url", label: "Map Embed Link", required: false },
      appStoreUrl: { type: "url", label: "App Store URL", required: false },
      playStoreUrl: { type: "url", label: "Play Store URL", required: false },

      // Founder & Team
      founderImage: { type: "image", label: "Founder Image", required: false },
      founderName: { type: "text", label: "Founder Name", required: false },
      founderDescription: {
        type: "textarea",
        label: "Founder Description",
        required: false,
      },
      teamMembers: {
        type: "array",
        label: "Team Members",
        itemSchema: {
          name: { type: "text", label: "Name", required: true },
          post: { type: "text", label: "Post/Position", required: false },
          image: { type: "image", label: "Profile Image", required: false },
        },
        required: false,
      },

      // Testimonials
      testimonials: {
        type: "array",
        label: "Testimonials",
        itemSchema: {
          name: { type: "text", label: "Customer Name", required: true },
          reviewText: {
            type: "textarea",
            label: "Review Text",
            required: true,
          },
          rating: {
            type: "select",
            label: "Rating",
            options: ["1", "2", "3", "4", "5"],
            required: false,
          },
          image: { type: "image", label: "Customer Image", required: false },
        },
        required: false,
      },

      // YouTube Video
      youtubeVideo: {
        type: "url",
        label: "YouTube Video URL",
        required: false,
      },
      // CTA
      ctaTitle: { type: "text", label: "CTA Title", required: false },
      ctaSubtitle: { type: "text", label: "CTA Subtitle", required: false },
      buttons: {
        type: "array",
        label: "Buttons",
        itemSchema: {
          label: { type: "text", label: "Button Label", required: true },
          url: { type: "url", label: "Button URL", required: true },
        },
        required: false,
      },
    },
  },

  "link-pro": {
    name: "Link Pro",
    fields: {
      // Basic Info
      leftBgImage: {
        type: "image",
        label: "Left Background Image",
        required: false,
      },
      rightBgImage: {
        type: "image",
        label: "Right Background Image",
        required: false,
      },
      logo: { type: "image", label: "Logo", required: false },
      CompanyName: { type: "text", label: "Company Name", required: true },
      foundedYear: {
        type: "text",
        label: "Founded Year (Like 2020)",
        required: false,
      },
      tagline: { type: "text", label: "Tagline", required: false },

      heading: { type: "text", label: "We Deals In", required: false },
      businessCategory: {
        type: "text",
        label: "Business Category",
        required: false,
      },

      // Contact Info
      email: { type: "email", label: "Email", required: false },
      phoneNumber: { type: "tel", label: "Phone Number", required: false },
      whatsappNumber: {
        type: "tel",
        label: "Whatsapp Number",
        required: false,
      },
      website: { type: "url", label: "Website", required: false },

      // Social Links
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

      // Shop Links
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

      //company info
      companyInfo: {
        type: "textarea",
        label: "Company Information",
        required: false,
      },
      catalogue: {
        type: "url",
        label: "Catalogue URL",
        required: false,
      },
      // Our Numbers
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

      // Founder & Team
      founderImage: { type: "image", label: "Founder Image", required: false },
      founderName: { type: "text", label: "Founder Name", required: false },
      founderDescription: {
        type: "textarea",
        label: "Founder Designation (Like Founder, CEO, etc.)",
        required: false,
      },
      founderMessage: {
        type: "textarea",
        label: "Founder Message",
        required: false,
      },
      vission: {
        type: "textarea",
        label: "Vission",
        required: false,
      },

      // Our Services
      ourServices: {
        type: "array",
        label: "Our Services",
        itemSchema: {
          title: { type: "text", label: "Title", required: true },
          description: { type: "text", label: "Description", required: true },
        },
      },

      // Our Products
      ourProducts: {
        type: "array",
        label: "Our Products",
        itemSchema: {
          image: { type: "image", label: "Product Image", required: false },
          title: { type: "text", label: "Title", required: true },
          price: { type: "text", label: "Price", required: false },
          description: { type: "text", label: "Description", required: false },
          rating: {
            type: "select",
            label: "Rating (1-5)",
            options: ["1", "2", "3", "4", "5"],
            required: false,
          },
          link: { type: "url", label: "Link", required: false },
        },
        required: false,
      },

      // Banner
      banner: { type: "image", label: "Banner Image", required: false },
      bannerLink: {
        type: "url",
        label: "Banner Link (Like https://www.google.com)",
        required: false,
      },

      whyChooseUs: {
        type: "array",
        label: "Why Choose Us",
        itemSchema: {
          description: { type: "text", label: "Description", required: true },
        },
        required: false,
      },

      // Map Embed Link
      mapEmbedLink: { type: "url", label: "Google Map Link", required: false },
      // Headquarters
      headquarters: {
        type: "array",
        label: "Headquarters",
        itemSchema: {
          city: { type: "text", label: "City", required: true },
          address: { type: "textarea", label: "Address", required: true },
          mapUrl: { type: "url", label: "Map URL", required: true },
        },
      },

      // Our Clients
      ourClients: {
        type: "array",
        label: "Our Clients",
        itemSchema: {
          image: { type: "image", label: "Client Image", required: false },
        },
        required: false,
      },

      // Testimonials
      testimonials: {
        type: "array",
        label: "Testimonials",
        itemSchema: {
          name: { type: "text", label: "Customer Name", required: true },
          reviewText: {
            type: "textarea",
            label: "Review Text",
            required: true,
          },
          rating: {
            type: "select",
            label: "Rating",
            options: ["1", "2", "3", "4", "5"],
            required: false,
          },
          image: { type: "image", label: "Customer Image", required: false },
        },
        required: false,
      },

      //Gallery Images
      galleryCategories: {
        type: "array",
        label: "Gallery Categories",
        itemSchema: {
          category: {
            type: "text",
            label: "Gallery Category Name (e.g. Office, Design)",
            required: false,
          },
          images: {
            type: "array",
            label: "Category Images",
            itemSchema: {
              image: { type: "image", label: "Image", required: false },
            },
            required: false,
          },
        },
        required: false,
      },

      appStoreUrl: { type: "url", label: "App Store URL", required: false },
      playStoreUrl: { type: "url", label: "Play Store URL", required: false },

      // YouTube Video
      youtubeVideo: {
        type: "url",
        label: "YouTube Video URL",
        required: false,
      },
      // CTA
      ctaTitle: {
        type: "text",
        label: "Text (Ready to Join us)",
        required: false,
      },
      ctaSubtitle: {
        type: "text",
        label: "Heading (Contact Us Today)",
        required: false,
      },
    },
    sections: [
      {
        id: "ImageSection",
        label: "Images (Logo, Background Images, Catalogue)",
        fields: ["logo", "leftBgImage", "rightBgImage", "catalogue"],
      },
      {
        id: "companyDetails",
        label: "Company details",
        fields: [
          "CompanyName",
          "foundedYear",
          "tagline",
          "heading",
          "businessCategory",
        ],
      },
      {
        id: "contactDetails",
        label: "Contact details",
        fields: ["email", "phoneNumber", "whatsappNumber", "website"],
      },
      {
        id: "SocialLinks",
        label: "Social Media and other Links",
        fields: ["socialLinks", "socialCustomButtons", "shopLinks"],
      },
      {
        id: "FounderDetails",
        label: "Founder details",
        fields: [
          "founderImage",
          "founderName",
          "founderDescription",
          "founderMessage",
          "vission",
          "companyInfo",
        ],
      },
      {
        id: "OurNumbers",
        label: "What we have done",
        fields: ["ourNumbers"],
      },
      {
        id: "OurServices",
        label: "Our Services",
        fields: ["ourServices"],
      },
      {
        id: "OurProducts",
        label: "Our Products",
        fields: ["ourProducts"],
      },

      {
        id: "OurClients",
        label: "Our Clients",
        fields: ["ourClients"],
      },
      {
        id: "Testimonials",
        label: "Testimonials",
        fields: ["testimonials"],
      },
      {
        id: "WhyChooseUs",
        label: "Why Choose Us",
        fields: ["whyChooseUs"],
      },
      {
        id: "GalleryImages",
        label: "Gallery Images",
        fields: ["galleryCategories"],
      },
      {
        id: "MapEmbedLink",
        label: "Google Map Link",
        fields: ["mapEmbedLink", "headquarters"],
      },
      {
        id: "YouTube And AppLinks",
        label: "YouTube And App Links",
        fields: ["appStoreUrl", "playStoreUrl", "youtubeVideo"],
      },
      {
        id: "CTA",
        label: "Botton heading and Text",
        fields: ["ctaTitle", "ctaSubtitle"],
      },
    ],
  },
};

// Helper function to get default values for a card type
export const getDefaultCardData = (cardType) => {
  const schema = cardSchemas[cardType];
  if (!schema) return {};

  const defaultData = {};

  Object.entries(schema.fields).forEach(([fieldName, fieldConfig]) => {
    switch (fieldConfig.type) {
      case "text":
      case "textarea":
      case "email":
      case "tel":
      case "url":
      case "image":
        defaultData[fieldName] = "";
        break;
      case "array":
        defaultData[fieldName] = [];
        break;
      case "object":
        defaultData[fieldName] = {};
        break;
      case "select":
        defaultData[fieldName] = "";
        break;
      default:
        defaultData[fieldName] = "";
    }
  });

  return defaultData;
};
