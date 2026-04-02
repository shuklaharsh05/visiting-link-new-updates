import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category.js";
dotenv.config();

// Updated categories data structure - only categories with corresponding card components
const categoriesData = [
  {
    categoryId: "basic-info",
    categoryName: "Basic Info",
    description: "Simple profile card with basic info, socials, and CTA",
    icon: "🪪",
    order: 0,
    isActive: true,
    templates: [
      {
        templateId: "basic-info-default",
        type: "static",
        name: "Basic Info Card",
        description: "Clean, LinkPro-style basic info card",
        icon: "🪪",
        preview: "Basic info + socials + founder + catalogue + address + CTA",
        fields: [
          { name: "customCardData", type: "object", label: "Custom Card Data" },
          { name: "announcementType", type: "text", label: "Announcement type" },
          { name: "name", type: "text", label: "Name", required: true },
          { name: "number", type: "tel", label: "Number" },
          { name: "email", type: "email", label: "Email" },
          { name: "website", type: "url", label: "Website" },
          {
            name: "businessType",
            type: "text",
            label: "Business Type",
            placeholder: "(interior designer, makeup artist, doctor, freelancer)",
          },
          { name: "media", type: "image", label: "Image / GIF" },
          { name: "heading", type: "text", label: "Heading" },
          { name: "subHeading", type: "text", label: "Sub-Heading" },
          { name: "socialLinks", type: "object", label: "Social Media Links" },
          { name: "aboutCompany", type: "textarea", label: "About Company" },
          { name: "founderName", type: "text", label: "Founder’s name" },
          { name: "founderImage", type: "image", label: "Founder’s Image" },
          { name: "founderDesignation", type: "text", label: "Founder’s designation" },
          { name: "vision", type: "textarea", label: "Vision" },
          { name: "catalogue", type: "url", label: "Catalogue PDF" },
          { name: "addresses", type: "object", label: "Address + Map links" },
          { name: "bottomHeadline", type: "text", label: "Bottom Headline" },
          { name: "ctaText", type: "textarea", label: "CTA Text" },
          { name: "forDesktop", type: "checkbox", label: "For Desktop" },
        ],
        sampleData: {
          announcementType: "New launch",
          name: "Basic Info Card",
          number: "+91 98765 43210",
          email: "hello@example.com",
          website: "https://example.com",
          businessType: "Freelancer",
          heading: "Available for new projects",
          subHeading: "Branding · Websites · Social Media",
          socialLinks: {
            instagram: "https://instagram.com/",
            facebook: "https://facebook.com/",
            behance: "https://behance.net/",
            youtube: "https://youtube.com/",
            twitter: "https://twitter.com/",
          },
          aboutCompany:
            "We help businesses build a strong online presence with modern design and clear messaging.",
          founderName: "Harsh",
          founderDesignation: "Founder",
          vision: "Make business networking effortless and beautiful.",
          catalogue: "",
          addresses: [
            {
              address: "Main Office, Your City",
              mapLink: "https://maps.google.com/",
            },
          ],
          bottomHeadline: "Let’s work together",
          ctaText: "Tap the contact buttons above or visit our website to get started.",
        },
        layout: { card: "basic-info" },
        theme: {
          colors: {
            primary: "#4F46E5",
            background: "#ffffff",
            accent: "#F59E0B",
          },
          fonts: { primary: "Inter", secondary: "Roboto" },
        },
        isActive: true,
        isDefault: true,
      },
    ],
  },
  {
    categoryId: "digital-business",
    categoryName: "Digital Business",
    description: "Digital business card with reviews, app links, and media",
    icon: "💼",
    order: 1,
    isActive: true,
    templates: [
      {
        templateId: "digital-business-default",
        type: "static",
        name: "Digital Business Card",
        description: "LinkPro-style digital business card",
        icon: "💼",
        preview: "Basic info + Google reviews + socials + app links + addresses + CTA",
        fields: [
          { name: "customCardData", type: "object", label: "Custom Card Data" },
          { name: "announcementType", type: "text", label: "Announcement type" },
          { name: "name", type: "text", label: "Name", required: true },
          { name: "number", type: "tel", label: "Number" },
          { name: "email", type: "email", label: "Email" },
          { name: "website", type: "url", label: "Website" },
          {
            name: "businessType",
            type: "text",
            label: "Business Type",
            placeholder: "(interior designer, makeup artist, doctor, freelancer)",
          },
          { name: "media", type: "image", label: "Image / GIF" },
          { name: "heading", type: "text", label: "Heading" },
          { name: "subHeading", type: "text", label: "Sub-Heading" },
          { name: "googleReviewLink", type: "url", label: "Google Review Link" },
          { name: "socialLinks", type: "object", label: "Social Media Links" },
          { name: "aboutCompany", type: "textarea", label: "About Company" },
          { name: "founderName", type: "text", label: "Founder’s name" },
          { name: "founderImage", type: "image", label: "Founder’s Image" },
          { name: "founderDesignation", type: "text", label: "Founder’s designation" },
          { name: "vision", type: "textarea", label: "Vision" },
          { name: "catalogue", type: "url", label: "Catalogue PDF" },
          { name: "playStoreUrl", type: "url", label: "Google Play link" },
          { name: "appStoreUrl", type: "url", label: "App Store link" },
          { name: "youtubeVideo", type: "url", label: "YouTube Video Link" },
          { name: "addresses", type: "object", label: "Address + Map links" },
          { name: "bottomHeadline", type: "text", label: "Bottom Headline" },
          { name: "ctaText", type: "textarea", label: "CTA Text" },
          { name: "forDesktop", type: "checkbox", label: "For Desktop" },
        ],
        sampleData: {
          announcementType: "Book a free demo",
          name: "Digital Business",
          number: "+91 98765 43210",
          email: "hello@digitalbusiness.com",
          website: "https://digitalbusiness.com",
          businessType: "Freelancer",
          heading: "Grow your business online",
          subHeading: "Websites · Ads · Social Media",
          googleReviewLink: "https://www.google.com/search?q=google+reviews",
          socialLinks: {
            instagram: "https://instagram.com/",
            facebook: "https://facebook.com/",
            behance: "https://behance.net/",
            youtube: "https://youtube.com/",
            twitter: "https://twitter.com/",
          },
          aboutCompany:
            "We help brands acquire customers through performance marketing and conversion-first design.",
          founderName: "Harsh",
          founderDesignation: "Founder",
          vision: "Make digital growth simple and affordable for every business.",
          catalogue: "",
          playStoreUrl: "",
          appStoreUrl: "",
          youtubeVideo: "",
          addresses: [
            {
              address: "Main Office, Your City",
              mapLink: "https://maps.google.com/",
            },
          ],
          bottomHeadline: "Ready to scale?",
          ctaText: "Tap the links above or visit our website to get started.",
        },
        layout: { card: "digital-business" },
        theme: {
          colors: {
            primary: "#A855F7",
            background: "#ffffff",
            accent: "#06B6D4",
          },
          fonts: { primary: "Inter", secondary: "Roboto" },
        },
        isActive: true,
        isDefault: true,
      },
    ],
  },
  {
    categoryId: "company-profile",
    categoryName: "Company Profile",
    description: "Company profile card with banner, team, services, and products",
    icon: "🏢",
    order: 2,
    isActive: true,
    templates: [
      {
        templateId: "company-profile-default",
        type: "static",
        name: "Company Profile Card",
        description: "LinkPro-style company profile card",
        icon: "🏢",
        preview: "Banner + team + services + products + catalogue + links + CTA",
        fields: [
          { name: "customCardData", type: "object", label: "Custom Card Data" },
          { name: "announcementType", type: "text", label: "Announcement type" },
          { name: "name", type: "text", label: "Name", required: true },
          { name: "number", type: "tel", label: "Number" },
          { name: "email", type: "email", label: "Email" },
          { name: "website", type: "url", label: "Website" },
          {
            name: "businessType",
            type: "text",
            label: "Business Type",
            placeholder: "(interior designer, makeup artist, doctor, freelancer)",
          },
          { name: "media", type: "image", label: "Image / GIF" },
          { name: "heading", type: "text", label: "Heading" },
          { name: "subHeading", type: "text", label: "Sub-Heading" },
          { name: "googleReviewLink", type: "url", label: "Google Review Link" },
          { name: "socialLinks", type: "object", label: "Social Media Links" },
          { name: "bannerImage", type: "image", label: "Banner Image" },
          { name: "aboutCompany", type: "textarea", label: "About Company" },
          { name: "founderName", type: "text", label: "Founder’s name" },
          { name: "founderImage", type: "image", label: "Founder’s Image" },
          { name: "founderDesignation", type: "text", label: "Founder’s designation" },
          { name: "founderMessage", type: "textarea", label: "Founder’s Message" },
          { name: "vision", type: "textarea", label: "Vision" },
          { name: "teamMembers", type: "object", label: "Our Team" },
          { name: "services", type: "object", label: "Services Section" },
          { name: "products", type: "object", label: "Product Section" },
          { name: "catalogue", type: "url", label: "Catalogue PDF" },
          { name: "playStoreUrl", type: "url", label: "Google Play link" },
          { name: "appStoreUrl", type: "url", label: "App Store link" },
          { name: "youtubeVideo", type: "url", label: "YouTube Video Link" },
          { name: "addresses", type: "object", label: "Address + Map links" },
          { name: "bottomHeadline", type: "text", label: "Bottom Headline" },
          { name: "ctaText", type: "textarea", label: "CTA Text" },
          { name: "forDesktop", type: "checkbox", label: "For Desktop" },
        ],
        sampleData: {
          announcementType: "We’re hiring",
          name: "Company Profile",
          number: "+91 98765 43210",
          email: "hello@company.com",
          website: "https://company.com",
          businessType: "Interior Designer",
          heading: "Designing spaces people love",
          subHeading: "Residential · Commercial · Turnkey",
          googleReviewLink: "https://www.google.com/search?q=google+reviews",
          socialLinks: {
            instagram: "https://instagram.com/",
            facebook: "https://facebook.com/",
            behance: "https://behance.net/",
            youtube: "https://youtube.com/",
            twitter: "https://twitter.com/",
          },
          aboutCompany:
            "We build thoughtful, functional interiors with a premium finish and transparent process.",
          founderName: "Harsh",
          founderDesignation: "Founder",
          founderMessage:
            "Our mission is to create beautiful spaces with on-time delivery and world-class craftsmanship.",
          vision: "Make premium design accessible to everyone.",
          teamMembers: [
            { name: "Ayesha", role: "Designer", image: "" },
            { name: "Rohit", role: "Project Manager", image: "" },
          ],
          services: [
            {
              heading: "Consultation",
              description: "On-site visit + design brief + budget planning.",
              price: "₹999",
              url: "https://company.com/services",
            },
          ],
          products: [
            {
              name: "Design Package",
              description: "Complete 2D + 3D with material selection.",
              rating: "5",
              price: "₹25,000",
              url: "https://company.com/products",
            },
          ],
          catalogue: "",
          playStoreUrl: "",
          appStoreUrl: "",
          youtubeVideo: "",
          addresses: [
            { address: "Main Office, Your City", mapLink: "https://maps.google.com/" },
          ],
          bottomHeadline: "Let’s build something beautiful",
          ctaText: "Tap the contact buttons above or visit our website to get started.",
        },
        layout: { card: "company-profile" },
        theme: {
          colors: {
            primary: "#4F46E5",
            background: "#ffffff",
            accent: "#F59E0B",
          },
          fonts: { primary: "Inter", secondary: "Roboto" },
        },
        isActive: true,
        isDefault: true,
      },
    ],
  },
  // {
  //   categoryId: "makeup-artist",
  //   categoryName: "Makeup Artist",
  //   description:
  //     "Professional makeup artist cards for beauty and cosmetic professionals",
  //   icon: "💄",
  //   order: 1,
  //   isActive: true,
  //   templates: [
  //     {
  //       templateId: "makeup-artist-classic",
  //       type: "static",
  //       name: "Makeup Artist Card",
  //       description: "Professional makeup artist card with portfolio showcase",
  //       icon: "💄",
  //       preview: "Elegant makeup artist layout with work gallery and services",
  //       fields: [
  //         { name: "customCardData", type: "object", label: "Custom Card Data" },
  //         { name: "profileImage", type: "image", label: "Profile Image" },
  //         {
  //           name: "companyName",
  //           type: "text",
  //           label: "Company Name",
  //           required: true,
  //         },
  //         { name: "tagline", type: "text", label: "Tagline" },
  //         { name: "aboutUs", type: "textarea", label: "About Us" },
  //         {
  //           name: "certifications",
  //           type: "text",
  //           label: "Certifications",
  //           multiple: true,
  //         },
  //         {
  //           name: "certificationsText",
  //           type: "text",
  //           label: "Certification Description",
  //         },
  //         {
  //           name: "features",
  //           type: "text",
  //           label: "Features",
  //           multiple: true,
  //           itemSchema: { title: "", description: "", image: "" },
  //         },
  //         {
  //           name: "workImages",
  //           type: "image",
  //           label: "Work Images",
  //           multiple: true,
  //         },
  //         {
  //           name: "services",
  //           type: "text",
  //           label: "Services",
  //           multiple: true,
  //           itemSchema: {
  //             serviceName: "",
  //             serviceDescription: "",
  //             serviceImage: "",
  //             price: "",
  //           },
  //         },
  //         {
  //           name: "socialLinks",
  //           type: "text",
  //           label: "Social Links",
  //           itemSchema: { instagram: "", linkedin: "", facebook: "" },
  //         },
  //         {
  //           name: "clientLogos",
  //           type: "image",
  //           label: "Client Logos",
  //           multiple: true,
  //         },
  //         {
  //           name: "testimonials",
  //           type: "text",
  //           label: "Testimonials",
  //           multiple: true,
  //           itemSchema: { name: "", reviewText: "", rating: "", image: "" },
  //         },
  //         { name: "email", type: "email", label: "Email" },
  //         { name: "phoneNumber", type: "tel", label: "Phone Number" },
  //         { name: "website", type: "url", label: "Website" },
  //         { name: "forDesktop", type: "checkbox", label: "For Desktop" },
  //         { name: "address", type: "textarea", label: "Address" },
  //         { name: "mapEmbedLink", type: "url", label: "Map Embed Link" },
  //         { name: "appStoreUrl", type: "url", label: "App Store URL" },
  //         { name: "playStoreUrl", type: "url", label: "Play Store URL" },
  //         { name: "founderImage", type: "image", label: "Founder Image" },
  //         { name: "founderName", type: "text", label: "Founder Name" },
  //         {
  //           name: "founderDescription",
  //           type: "textarea",
  //           label: "Founder Description",
  //         },
  //         {
  //           name: "teamMembers",
  //           type: "text",
  //           label: "Team Members",
  //           multiple: true,
  //           itemSchema: { name: "", post: "", image: "" },
  //         },
  //         { name: "youtubeVideo", type: "url", label: "YouTube Video URL" },
  //         { name: "ctaTitle", type: "text", label: "CTA Title" },
  //         { name: "ctaSubtitle", type: "text", label: "CTA Subtitle" },
  //         {
  //           name: "buttons",
  //           type: "text",
  //           label: "Buttons",
  //           multiple: true,
  //           itemSchema: { label: "", link: "" },
  //         },
  //       ],
  //       sampleData: {
  //         companyName: "Glamour Studio",
  //         tagline: "Professional Makeup & Beauty Services",
  //         aboutUs:
  //           "Glamour Studio is a premier makeup artistry service specializing in bridal, special events, and professional makeup applications.",
  //         certifications: [
  //           "Certified Makeup Artist",
  //           "Bridal Specialist",
  //           "Beauty Consultant",
  //         ],
  //         certificationsText:
  //           "Licensed and certified makeup artist with 5+ years of experience",
  //         services: [
  //           {
  //             serviceName: "Bridal Makeup",
  //             serviceDescription: "Complete bridal makeup package with trial",
  //             price: "₹5000",
  //           },
  //           {
  //             serviceName: "Party Makeup",
  //             serviceDescription:
  //               "Glamorous party makeup for special occasions",
  //             price: "₹2500",
  //           },
  //         ],
  //         email: "info@glamourstudio.com",
  //         phoneNumber: "+91 98765 43210",
  //         website: "https://glamourstudio.com",
  //       },
  //       layout: { card: "makeup" },
  //       theme: {
  //         colors: {
  //           primary: "#E91E63",
  //           background: "#1F1B24",
  //           accent: "#FFC107",
  //         },
  //         fonts: { primary: "Inter", secondary: "Roboto" },
  //       },
  //       isActive: true,
  //       isDefault: true,
  //     },
  //   ],
  // },
  // {
  //   categoryId: "interior-designer",
  //   categoryName: "Interior Designer",
  //   description:
  //     "Professional interior designer cards for home and commercial design professionals",
  //   icon: "🏠",
  //   order: 2,
  //   isActive: true,
  //   templates: [
  //     {
  //       templateId: "interior-designer-classic",
  //       type: "static",
  //       name: "Interior Designer Card",
  //       description:
  //         "Professional interior designer card with portfolio showcase",
  //       icon: "🏠",
  //       preview:
  //         "Elegant interior designer layout with work gallery and services",
  //       fields: [
  //         { name: "customCardData", type: "object", label: "Custom Card Data" },
  //         { name: "profileImage", type: "image", label: "Profile Image" },
  //         {
  //           name: "companyName",
  //           type: "text",
  //           label: "Company Name",
  //           required: true,
  //         },
  //         { name: "tagline", type: "text", label: "Tagline" },
  //         { name: "aboutUs", type: "textarea", label: "About Us" },
  //         {
  //           name: "certifications",
  //           type: "text",
  //           label: "Certifications",
  //           multiple: true,
  //         },
  //         {
  //           name: "certificationsText",
  //           type: "text",
  //           label: "Certification Description",
  //         },
  //         {
  //           name: "features",
  //           type: "text",
  //           label: "Features",
  //           multiple: true,
  //           itemSchema: { title: "", description: "", image: "" },
  //         },
  //         {
  //           name: "workImages",
  //           type: "image",
  //           label: "Work Images",
  //           multiple: true,
  //         },
  //         {
  //           name: "services",
  //           type: "text",
  //           label: "Services",
  //           multiple: true,
  //           itemSchema: {
  //             serviceName: "",
  //             serviceDescription: "",
  //             serviceImage: "",
  //             price: "",
  //           },
  //         },
  //         {
  //           name: "socialLinks",
  //           type: "text",
  //           label: "Social Links",
  //           itemSchema: { instagram: "", linkedin: "", facebook: "" },
  //         },
  //         {
  //           name: "clientLogos",
  //           type: "image",
  //           label: "Client Logos",
  //           multiple: true,
  //         },
  //         {
  //           name: "testimonials",
  //           type: "text",
  //           label: "Testimonials",
  //           multiple: true,
  //           itemSchema: { name: "", reviewText: "", rating: "", image: "" },
  //         },
  //         { name: "email", type: "email", label: "Email" },
  //         { name: "phoneNumber", type: "tel", label: "Phone Number" },
  //         { name: "website", type: "url", label: "Website" },
  //         { name: "address", type: "textarea", label: "Address" },
  //         { name: "mapEmbedLink", type: "url", label: "Map Embed Link" },
  //         { name: "appStoreUrl", type: "url", label: "App Store URL" },
  //         { name: "playStoreUrl", type: "url", label: "Play Store URL" },
  //         { name: "founderImage", type: "image", label: "Founder Image" },
  //         { name: "founderName", type: "text", label: "Founder Name" },
  //         {
  //           name: "founderDescription",
  //           type: "textarea",
  //           label: "Founder Description",
  //         },
  //         {
  //           name: "teamMembers",
  //           type: "text",
  //           label: "Team Members",
  //           multiple: true,
  //           itemSchema: { name: "", post: "", image: "" },
  //         },
  //         { name: "youtubeVideo", type: "url", label: "YouTube Video URL" },
  //         { name: "ctaTitle", type: "text", label: "CTA Title" },
  //         { name: "ctaSubtitle", type: "text", label: "CTA Subtitle" },
  //         {
  //           name: "buttons",
  //           type: "text",
  //           label: "Buttons",
  //           multiple: true,
  //           itemSchema: { label: "", link: "" },
  //         },
  //       ],
  //       sampleData: {
  //         companyName: "Elegant Interiors",
  //         tagline: "Transform Your Space, Transform Your Life",
  //         aboutUs:
  //           "Elegant Interiors specializes in creating beautiful, functional spaces that reflect your personal style and enhance your daily living experience.",
  //         certifications: [
  //           "Certified Interior Designer",
  //           "Green Building Specialist",
  //           "Space Planning Expert",
  //         ],
  //         certificationsText:
  //           "Licensed interior designer with 8+ years of experience",
  //         services: [
  //           {
  //             serviceName: "Residential Design",
  //             serviceDescription:
  //               "Complete home interior design and renovation",
  //             price: "₹50,000",
  //           },
  //           {
  //             serviceName: "Commercial Design",
  //             serviceDescription: "Office and commercial space design",
  //             price: "₹75,000",
  //           },
  //         ],
  //         email: "info@elegantinteriors.com",
  //         phoneNumber: "+91 98765 43210",
  //         website: "https://elegantinteriors.com",
  //       },
  //       layout: { card: "interior" },
  //       theme: {
  //         colors: {
  //           primary: "#3B82F6",
  //           background: "#1F1B24",
  //           accent: "#F59E0B",
  //         },
  //         fonts: { primary: "Inter", secondary: "Roboto" },
  //       },
  //       isActive: true,
  //       isDefault: true,
  //     },
  //   ],
  // },
  // {
  //   categoryId: "travel-agent",
  //   categoryName: "Travel Agent",
  //   description:
  //     "Professional travel agent cards for tourism and travel professionals",
  //   icon: "✈️",
  //   order: 3,
  //   isActive: true,
  //   templates: [
  //     {
  //       templateId: "travel-agent-classic",
  //       type: "static",
  //       name: "Travel Agent Card",
  //       description:
  //         "Professional travel agent card with destinations and services",
  //       icon: "✈️",
  //       preview: "Travel-focused layout with destinations and booking options",
  //       fields: [
  //         { name: "customCardData", type: "object", label: "Custom Card Data" },
  //         { name: "profileImage", type: "image", label: "Profile Image" },
  //         {
  //           name: "companyName",
  //           type: "text",
  //           label: "Company Name",
  //           required: true,
  //         },
  //         { name: "tagline", type: "text", label: "Tagline" },
  //         { name: "aboutUs", type: "textarea", label: "About Us" },
  //         {
  //           name: "certifications",
  //           type: "text",
  //           label: "Certifications",
  //           multiple: true,
  //         },
  //         {
  //           name: "certificationsText",
  //           type: "text",
  //           label: "Certification Description",
  //         },
  //         {
  //           name: "features",
  //           type: "text",
  //           label: "Features",
  //           multiple: true,
  //           itemSchema: { title: "", description: "", image: "" },
  //         },
  //         {
  //           name: "destinations",
  //           type: "text",
  //           label: "Destinations",
  //           multiple: true,
  //           itemSchema: {
  //             destinationName: "",
  //             destinationImage: "",
  //             description: "",
  //             price: "",
  //           },
  //         },
  //         {
  //           name: "services",
  //           type: "text",
  //           label: "Services",
  //           multiple: true,
  //           itemSchema: {
  //             serviceName: "",
  //             serviceDescription: "",
  //             serviceImage: "",
  //             price: "",
  //           },
  //         },
  //         {
  //           name: "socialLinks",
  //           type: "text",
  //           label: "Social Links",
  //           itemSchema: { instagram: "", linkedin: "", facebook: "" },
  //         },
  //         {
  //           name: "clientLogos",
  //           type: "image",
  //           label: "Client Logos",
  //           multiple: true,
  //         },
  //         {
  //           name: "testimonials",
  //           type: "text",
  //           label: "Testimonials",
  //           multiple: true,
  //           itemSchema: { name: "", reviewText: "", rating: "", image: "" },
  //         },
  //         { name: "email", type: "email", label: "Email" },
  //         { name: "phoneNumber", type: "tel", label: "Phone Number" },
  //         { name: "website", type: "url", label: "Website" },
  //         { name: "address", type: "textarea", label: "Address" },
  //         { name: "mapEmbedLink", type: "url", label: "Map Embed Link" },
  //         { name: "appStoreUrl", type: "url", label: "App Store URL" },
  //         { name: "playStoreUrl", type: "url", label: "Play Store URL" },
  //         { name: "founderImage", type: "image", label: "Founder Image" },
  //         { name: "founderName", type: "text", label: "Founder Name" },
  //         {
  //           name: "founderDescription",
  //           type: "textarea",
  //           label: "Founder Description",
  //         },
  //         {
  //           name: "teamMembers",
  //           type: "text",
  //           label: "Team Members",
  //           multiple: true,
  //           itemSchema: { name: "", post: "", image: "" },
  //         },
  //         { name: "youtubeVideo", type: "url", label: "YouTube Video URL" },
  //         { name: "ctaTitle", type: "text", label: "CTA Title" },
  //         { name: "ctaSubtitle", type: "text", label: "CTA Subtitle" },
  //         {
  //           name: "buttons",
  //           type: "text",
  //           label: "Buttons",
  //           multiple: true,
  //           itemSchema: { label: "", link: "" },
  //         },
  //       ],
  //       sampleData: {
  //         companyName: "Wanderlust Travels",
  //         tagline: "Your Gateway to Amazing Destinations",
  //         aboutUs:
  //           "Wanderlust Travels is your trusted partner for creating unforgettable travel experiences. We specialize in customized travel packages and exclusive destinations.",
  //         certifications: [
  //           "IATA Certified",
  //           "Travel Consultant",
  //           "Destination Specialist",
  //         ],
  //         certificationsText:
  //           "Certified travel agent with 10+ years of experience",
  //         destinations: [
  //           {
  //             destinationName: "Bali, Indonesia",
  //             description:
  //               "Tropical paradise with beautiful beaches and culture",
  //             price: "₹45,000",
  //           },
  //           {
  //             destinationName: "Switzerland",
  //             description: "Alpine beauty and charming cities",
  //             price: "₹1,20,000",
  //           },
  //         ],
  //         services: [
  //           {
  //             serviceName: "Flight Booking",
  //             serviceDescription:
  //               "Best deals on domestic and international flights",
  //             price: "Free",
  //           },
  //           {
  //             serviceName: "Hotel Reservations",
  //             serviceDescription: "Luxury and budget hotel bookings worldwide",
  //             price: "Free",
  //           },
  //         ],
  //         email: "info@wanderlusttravels.com",
  //         phoneNumber: "+91 98765 43210",
  //         website: "https://wanderlusttravels.com",
  //       },
  //       layout: { card: "travel" },
  //       theme: {
  //         colors: {
  //           primary: "#10B981",
  //           background: "#1F1B24",
  //           accent: "#F59E0B",
  //         },
  //         fonts: { primary: "Inter", secondary: "Roboto" },
  //       },
  //       isActive: true,
  //       isDefault: true,
  //     },
  //   ],
  // },
  // {
  //   categoryId: "ecommerce",
  //   categoryName: "E-commerce",
  //   description:
  //     "Professional e-commerce cards for online stores and retail businesses",
  //   icon: "🛒",
  //   order: 4,
  //   isActive: true,
  //   templates: [
  //     {
  //       templateId: "ecommerce-classic",
  //       type: "static",
  //       name: "E-commerce Card",
  //       description:
  //         "Professional e-commerce card with products and store showcase",
  //       icon: "🛒",
  //       preview:
  //         "E-commerce focused layout with products and shopping features",
  //       fields: [
  //         { name: "customCardData", type: "object", label: "Custom Card Data" },
  //         { name: "logo", type: "image", label: "Store Logo" },
  //         {
  //           name: "storeName",
  //           type: "text",
  //           label: "Store Name",
  //           required: true,
  //         },
  //         { name: "tagline", type: "text", label: "Tagline" },
  //         { name: "aboutUs", type: "textarea", label: "About Us" },
  //         {
  //           name: "certifications",
  //           type: "text",
  //           label: "Certifications",
  //           multiple: true,
  //         },
  //         {
  //           name: "certificationsText",
  //           type: "text",
  //           label: "Certification Description",
  //         },
  //         {
  //           name: "features",
  //           type: "text",
  //           label: "Features",
  //           multiple: true,
  //           itemSchema: { title: "", description: "", image: "" },
  //         },
  //         {
  //           name: "categories",
  //           type: "text",
  //           label: "Categories",
  //           multiple: true,
  //           itemSchema: { categoryName: "", categoryImage: "" },
  //         },
  //         {
  //           name: "products",
  //           type: "text",
  //           label: "Products",
  //           multiple: true,
  //           itemSchema: { productName: "", productImage: "", price: "" },
  //         },
  //         {
  //           name: "socialLinks",
  //           type: "text",
  //           label: "Social Links",
  //           itemSchema: { instagram: "", linkedin: "", facebook: "" },
  //         },
  //         {
  //           name: "testimonials",
  //           type: "text",
  //           label: "Testimonials",
  //           multiple: true,
  //           itemSchema: { name: "", reviewText: "", rating: "", image: "" },
  //         },
  //         { name: "email", type: "email", label: "Email" },
  //         { name: "phoneNumber", type: "tel", label: "Phone Number" },
  //         { name: "website", type: "url", label: "Website" },
  //         { name: "address", type: "textarea", label: "Address" },
  //         { name: "mapEmbedLink", type: "url", label: "Map Embed Link" },
  //         { name: "appStoreUrl", type: "url", label: "App Store URL" },
  //         { name: "playStoreUrl", type: "url", label: "Play Store URL" },
  //         { name: "founderImage", type: "image", label: "Founder Image" },
  //         { name: "founderName", type: "text", label: "Founder Name" },
  //         {
  //           name: "founderDescription",
  //           type: "textarea",
  //           label: "Founder Description",
  //         },
  //         {
  //           name: "teamMembers",
  //           type: "text",
  //           label: "Team Members",
  //           multiple: true,
  //           itemSchema: { name: "", post: "", image: "" },
  //         },
  //         { name: "youtubeVideo", type: "url", label: "YouTube Video URL" },
  //         { name: "ctaTitle", type: "text", label: "CTA Title" },
  //         { name: "ctaSubtitle", type: "text", label: "CTA Subtitle" },
  //         {
  //           name: "buttons",
  //           type: "text",
  //           label: "Buttons",
  //           multiple: true,
  //           itemSchema: { label: "", link: "" },
  //         },
  //       ],
  //       sampleData: {
  //         storeName: "Fashion Hub",
  //         tagline: "Trendy Fashion for Every Occasion",
  //         aboutUs:
  //           "Fashion Hub is your one-stop destination for trendy and affordable fashion. We offer the latest styles for men, women, and kids.",
  //         certifications: [
  //           "Verified Seller",
  //           "Quality Assured",
  //           "Fast Shipping",
  //         ],
  //         certificationsText:
  //           "Trusted online retailer with 5+ years of experience",
  //         categories: [
  //           {
  //             categoryName: "Women's Fashion",
  //             categoryImage: "",
  //           },
  //           {
  //             categoryName: "Men's Fashion",
  //             categoryImage: "",
  //           },
  //         ],
  //         products: [
  //           {
  //             productName: "Designer Dress",
  //             productImage: "",
  //             price: "₹2,999",
  //           },
  //           {
  //             productName: "Casual Shirt",
  //             productImage: "",
  //             price: "₹1,299",
  //           },
  //         ],
  //         email: "info@fashionhub.com",
  //         phoneNumber: "+91 98765 43210",
  //         website: "https://fashionhub.com",
  //       },
  //       layout: { card: "ecommerce" },
  //       theme: {
  //         colors: {
  //           primary: "#8B5CF6",
  //           background: "#ffffff",
  //           accent: "#F59E0B",
  //         },
  //         fonts: { primary: "Inter", secondary: "Roboto" },
  //       },
  //       isActive: true,
  //       isDefault: true,
  //     },
  //   ],
  // },
  {
    categoryId: "link-pro",
    categoryName: "Link Pro",
    description:
      "Professional link pro cards for comprehensive business profiles",
    icon: "🔗",
    order: 5,
    isActive: true,
    templates: [
      {
        templateId: "link-pro-classic",
        type: "static",
        name: "Link Pro Card",
        description:
          "Professional link pro card with comprehensive business information",
        icon: "🔗",
        preview:
          "Comprehensive business card layout with services, products, and portfolio",
        fields: [
          { name: "customCardData", type: "object", label: "Custom Card Data" },
          {
            name: "leftBgImage",
            type: "image",
            label: "Left Background Image",
          },
          {
            name: "rightBgImage",
            type: "image",
            label: "Right Background Image",
          },
          { name: "logo", type: "image", label: "Logo" },
          {
            name: "CompanyName",
            type: "text",
            label: "Company Name",
            required: true,
          },
          { name: "foundedYear", type: "text", label: "Founded Year" },
          { name: "tagline", type: "text", label: "Tagline" },
          { name: "heading", type: "text", label: "Heading" },
          {
            name: "businessCategory",
            type: "text",
            label: "Business Category",
          },
          { name: "email", type: "email", label: "Email" },
          { name: "phoneNumber", type: "tel", label: "Phone Number" },
          { name: "whatsappNumber", type: "tel", label: "Whatsapp Number" },
          { name: "website", type: "url", label: "Website" },
          {
            name: "socialLinks",
            type: "text",
            label: "Social Links",
            itemSchema: {
              instagram: "",
              linkedin: "",
              facebook: "",
              twitter: "",
              youtube: "",
              behance: "",
              pinterest: "",
            },
          },
          {
            name: "socialCustomButtons",
            type: "text",
            label: "Custom Social Buttons",
            multiple: true,
            itemSchema: {
              icon: "",
              text: "",
              url: "",
            },
          },
          {
            name: "shopLinks",
            type: "text",
            label: "Shop Links",
            multiple: true,
            itemSchema: { icon: "", label: "", url: "" },
          },
          {
            name: "companyInfo",
            type: "textarea",
            label: "Company Information",
          },
          { name: "catalogue", type: "url", label: "Catalogue PDF" },
          {
            name: "ourNumbers",
            type: "text",
            label: "Our Numbers",
            multiple: true,
            itemSchema: { icon: "", number: "", description: "" },
          },
          { name: "founderImage", type: "image", label: "Founder Image" },
          { name: "founderName", type: "text", label: "Founder Name" },
          {
            name: "founderDescription",
            type: "textarea",
            label: "Founder Description",
          },
          {
            name: "founderMessage",
            type: "textarea",
            label: "Founder Message",
          },
          {
            name: "vission",
            type: "textarea",
            label: "Vission",
          },
          {
            name: "ourServices",
            type: "text",
            label: "Our Services",
            multiple: true,
            itemSchema: { title: "", description: "" },
          },
          {
            name: "ourProducts",
            type: "text",
            label: "Our Products",
            multiple: true,
            itemSchema: {
              image: "",
              title: "",
              price: "",
              description: "",
              rating: "",
              link: "",
            },
          },
          {
            name: "banner",
            type: "image",
            label: "Banner Image",
          },
          {
            name: "bannerLink",
            type: "url",
            label: "Banner Link",
          },
          {
            name: "whyChooseUs",
            type: "text",
            label: "Why Choose Us",
            multiple: true,
            itemSchema: { description: "" },
          },
          { name: "mapEmbedLink", type: "url", label: "Map Embed Link" },
          {
            name: "headquarters",
            type: "text",
            label: "Headquarters",
            multiple: true,
            itemSchema: { city: "", address: "", mapUrl: "" },
          },
          {
            name: "ourClients",
            type: "image",
            label: "Our Clients",
            multiple: true,
            itemSchema: { image: "" },
          },
          {
            name: "testimonials",
            type: "text",
            label: "Testimonials",
            multiple: true,
            itemSchema: { name: "", reviewText: "", rating: "", image: "" },
          },
          {
            name: "galleryCategories",
            type: "image",
            label: "Gallery Categories",
            multiple: true,
            itemSchema: { category: "", images: [{ image: "" }] },
          },
          { name: "appStoreUrl", type: "url", label: "App Store URL" },
          { name: "playStoreUrl", type: "url", label: "Play Store URL" },
          { name: "youtubeVideo", type: "url", label: "YouTube Video URL" },
          { name: "ctaTitle", type: "text", label: "CTA Title" },
          { name: "ctaSubtitle", type: "text", label: "CTA Subtitle" },
          {
            name: "buttons",
            type: "text",
            label: "Buttons",
            multiple: true,
            itemSchema: { label: "", url: "" },
          },
        ],
        sampleData: {
          CompanyName: "Tech Solutions Pro",
          tagline: "Innovative Technology Solutions for Your Business",
          companyInfo:
            "Tech Solutions Pro is a leading technology consulting firm specializing in digital transformation, cloud solutions, and enterprise software development.",
          ourNumbers: [
            {
              number: "500+",
              description: "Happy Clients",
            },
            {
              number: "10+",
              description: "Years Experience",
            },
          ],
          ourServices: [
            {
              title: "Cloud Migration",
              description: "Seamless migration to cloud infrastructure",
            },
            {
              title: "Software Development",
              description: "Custom software solutions for your business",
            },
          ],
          ourProducts: [
            {
              title: "Enterprise CRM",
              price: "₹50,000",
              description: "Complete customer relationship management solution",
            },
          ],
          email: "info@techsolutionspro.com",
          phoneNumber: "+91 98765 43210",
          whatsappNumber: "+91 98765 43210",
          website: "https://techsolutionspro.com",
          socialLinks: {
            instagram: "https://instagram.com/techsolutionspro",
            linkedin: "https://linkedin.com/company/techsolutionspro",
            facebook: "https://facebook.com/techsolutionspro",
          },
        },
        layout: { card: "link-pro" },
        theme: {
          colors: {
            primary: "#8B5CF6",
            background: "#ffffff",
            accent: "#F59E0B",
          },
          fonts: { primary: "Inter", secondary: "Roboto" },
        },
        isActive: true,
        isDefault: true,
      },
    ],
  },
];

// Function to seed categories and templates
async function seedCategories() {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI;
    // console.log('🔌 Connecting to MongoDB:', mongoURI);
    await mongoose.connect(mongoURI);
    // console.log('✅ Connected to MongoDB successfully');

    // Clear existing categories
    // console.log('🗑️ Clearing existing categories...');
    await Category.deleteMany({});
    // console.log('✅ Existing categories cleared');

    // Insert new categories
    // console.log('📊 Inserting categories and templates...');
    const insertedCategories = await Category.insertMany(categoriesData);
    // console.log(`✅ Successfully inserted ${insertedCategories.length} categories`);

    // Log summary
    let totalTemplates = 0;
    insertedCategories.forEach((category) => {
      const templateCount = category.templates?.length || 0;
      totalTemplates += templateCount;
      // console.log(`  📁 ${category.categoryName}: ${templateCount} templates`);
    });

    // console.log('\n🎉 Seeding completed successfully!');
    // console.log(`📊 Summary:`);
    // console.log(`  - Categories: ${insertedCategories.length}`);
    // console.log(`  - Templates: ${totalTemplates}`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    // Close connection
    await mongoose.connection.close();
    // console.log('🔌 Database connection closed');
  }
}

// Run seeding if this file is executed directly
seedCategories()
  .then(() => console.log("✅ Done"))
  .catch((error) => console.error("❌ Error:", error));
