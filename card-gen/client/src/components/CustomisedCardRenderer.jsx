import { Globe, Mail, MapPinIcon, Phone, X, Heart, Loader2, Check, InstagramIcon, LinkedinIcon, FacebookIcon, YoutubeIcon, ChevronLeft, ChevronRight, PhoneCall } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { createAppointment } from '../api/appointments.js';
import UserAuthModal from './UserAuthModal.jsx';
import AdminNotificationModal from './AdminNotificationModal.jsx';
import UnsaveConfirmModal from './UnsaveConfirmModal.jsx';
import { useAuth } from '../contexts/AuthContext';
import { saveCard, getSavedCards, removeSavedCard } from '../api/auth';

// Normalize raw values into arrays when entered as comma/newline separated strings
function normalizeList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(/\n|,/)
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
}

// Respect hidden fields for contact/info items
function isVisible(fieldName, hiddenFields) {
  return !(hiddenFields || []).includes(fieldName);
}

// Animated counter component
const AnimatedCounter = ({ value, duration = 2000, style, className = '' }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const counterRef = React.useRef(null);

  // Extract numeric value from string (handles formats like "100+", "50", "1.5K", etc.)
  const extractNumber = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') return 0;
    
    // Remove non-numeric characters except +, ., K, M
    const clean = val.replace(/[^\d.+KMkm]/g, '');
    const num = parseFloat(clean);
    
    if (isNaN(num)) return 0;
    
    // Handle K and M suffixes
    if (/k/i.test(val)) return num * 1000;
    if (/m/i.test(val)) return num * 1000000;
    
    return num;
  };

  const targetValue = extractNumber(value);
  // Extract suffix (preserves +, %, etc. but removes K/M since we handle those in formatting)
  const suffix = typeof value === 'string' 
    ? value.replace(/[\d.]+/g, '').replace(/[km]/gi, '') 
    : '';

  useEffect(() => {
    if (hasAnimated || targetValue === 0) return;

    let observer = null;
    let scrollTimeout = null;

    // Helper function to start the animation (defined inside useEffect to avoid stale closures)
    const startAnimation = () => {
      setHasAnimated((prev) => {
        if (!prev) {
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(easeOutQuart * targetValue);
            
            setCount(current);
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(targetValue);
            }
          };
          
          requestAnimationFrame(animate);
          return true;
        }
        return prev;
      });
    };

    // Check if element is already visible on mount (using requestAnimationFrame for DOM readiness)
    const checkInitialVisibility = () => {
      requestAnimationFrame(() => {
        if (!counterRef.current) return;
        
        const rect = counterRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        
        // Check if element is partially or fully visible
        const isPartiallyVisible = (
          rect.top < viewportHeight &&
          rect.bottom > 0 &&
          rect.left < viewportWidth &&
          rect.right > 0
        );
        
        if (isPartiallyVisible) {
          // Start animation after a small delay to ensure everything is ready
          setTimeout(() => {
            startAnimation(); // Function updater in startAnimation will check hasAnimated
          }, 150);
        }
      });
    };

    // Check immediately
    checkInitialVisibility();

    // Set up Intersection Observer with more lenient settings
    const setupObserver = () => {
      if (!counterRef.current) return;
      
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              startAnimation(); // Function updater will check hasAnimated
            }
          });
        },
        { 
          threshold: 0.1, // Lower threshold - triggers when 10% visible
          rootMargin: '0px 0px -50px 0px' // Trigger a bit before fully visible
        }
      );

      observer.observe(counterRef.current);
    };

    // Set up observer after a small delay to ensure ref is set
    setTimeout(setupObserver, 50);

    // Also check on scroll as a fallback
    const handleScroll = () => {
      if (!counterRef.current) return;
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (!counterRef.current) return;
        
        const rect = counterRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const isVisible = rect.top < viewportHeight && rect.bottom > 0;
        
        if (isVisible) {
          startAnimation(); // Function updater will check hasAnimated
        }
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', checkInitialVisibility, { passive: true });

    return () => {
      if (observer && counterRef.current) {
        observer.unobserve(counterRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkInitialVisibility);
      clearTimeout(scrollTimeout);
    };
  }, [targetValue, duration, hasAnimated]);

  // Format the number for display
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return Math.floor(num).toString();
  };

  // Determine display value
  const displayValue = () => {
    if (!hasAnimated) return '0' + suffix;
    
    // If original value had K/M suffix, use formatting
    if (typeof value === 'string' && /[km]/i.test(value)) {
      return formatNumber(count) + suffix;
    }
    
    // Otherwise, show the count with suffix (preserves +, %, etc.)
    return Math.floor(count).toString() + suffix;
  };

  return (
    <div ref={counterRef} className={className} style={style}>
      {displayValue()}
    </div>
  );
};

const CustomisedCardRenderer = ({ cardData, cardId, hiddenFields = [], customisations = {} }) => {
  const { user, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showUnsaveModal, setShowUnsaveModal] = useState(false);
  const [isCardSaved, setIsCardSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCards, setSavedCards] = useState([]);
  const [activeTab, setActiveTab] = useState('services'); // 'services' | 'products'
  const [coverIndex, setCoverIndex] = useState(0);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [mouseStart, setMouseStart] = useState(null);
  const [mouseEnd, setMouseEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Support the new structured customCardData API as the primary source
  const structured = cardData?.customCardData || {};

  // Theme/colors
  const theme = structured.theme || {};
  const themeTextColors = theme.textColor || {};

  // Section ordering/visibility (new API)
  const layoutConf = structured.layout || {};

  // Default section order if not specified; prefer new API
  const defaultSectionOrder = ['cover', 'about', 'achievements', 'primaryCTA', 'clients', 'affiliation', 'socialLinks', 'services', 'products', 'contact', 'visitOffice', 'appLinks', 'founder', 'team', 'finalCTA'];
  const sectionOrder = Array.isArray(layoutConf.sectionOrder) && layoutConf.sectionOrder.length > 0
    ? layoutConf.sectionOrder
    : (customisations.sectionOrder || defaultSectionOrder);
  
  // Default text colors
  const textColors = {
    heading: themeTextColors.heading || customisations.textColors?.heading || '#111827',
    paragraph: themeTextColors.paragraph || customisations.textColors?.paragraph || '#374151'
  };

  // Default section visibility (all visible by default)
  const sectionVisibility = {
    // old API
    ...(customisations.sectionVisibility || {}),
    // new API - map array of hidden sections into boolean map
    ...(Array.isArray(layoutConf.hiddenSections)
      ? layoutConf.hiddenSections.reduce((acc, key) => { acc[key] = false; return acc; }, {})
      : {})
  };

  // Determine if a section should be shown based on visibility from both old/new APIs
  const shouldShowSection = React.useCallback((key) => {
    const alias = {
      socialLinks: 'social',
      cover: 'cover',
      primaryCTA: 'primaryCTA',
      visitOffice: 'visitOffice',
      appLinks: 'appLinks',
      finalCTA: 'finalCTA'
    };
    const k = key;
    const alt = alias[key];
    const hiddenOld = sectionVisibility[k] === false || (alt && sectionVisibility[alt] === false);
    return !hiddenOld; // true means visible
  }, [sectionVisibility]);

  // Get section icon (support aliases like socialLinks -> social)
  const getSectionIcon = (sectionId) => {
    const aliases = {
      socialLinks: 'social',
      contact: 'contact',
      clients: 'clients',
      achievements: 'achievements',
      services: 'services',
      products: 'products',
      about: 'about',
      visitOffice: 'visitOffice',
      appLinks: 'appLinks',
      founder: 'founder',
      finalCTA: 'finalCTA',
      // portfolio: 'portfolio',
      affiliation: 'affiliation'
    };
    const icons = customisations.sectionIcons || {};
    return icons[sectionId] || icons[aliases[sectionId]] || null;
  };

  // Get section heading (custom or default)
  const getSectionHeading = (sectionId, defaultHeading) => {
    return structured.sectionHeadings?.[sectionId] || defaultHeading;
  };

  // Create a normalized view of card data to support multiple key names
  const normalized = React.useMemo(() => {
    const get = (...keys) => keys.find(k => cardData && cardData[k] !== undefined && cardData[k] !== null);

    // Prefer new structured API
    const coverImage = structured.coverImage || customisations.coverImage || '';
    const coverImages = Array.isArray(structured.coverImages) && structured.coverImages.length > 0
      ? structured.coverImages
      : (Array.isArray(customisations.coverImages) ? customisations.coverImages : (coverImage ? [coverImage] : []));
    const backgroundImage = theme.backgroundImage || customisations.backgroundImage || customisations.background || '';
    const backgroundColor = theme.backgroundColor || '';
    const gradientStart = theme.gradientStart || '';
    const gradientEnd = theme.gradientEnd || '';
    const gradientDirection = theme.gradientDirection || 'to bottom';

    const name = cardData?.name || structured.companyName || cardData?.company || cardData?.businessName || cardData?.companyName || '';
    const company = structured.companyName || cardData?.company || cardData?.businessName || cardData?.companyName || cardData?.name || '';
    const profilePic = structured.profileImage || cardData?.profilePic || cardData?.logo || cardData?.profile || '';
    const tagline = structured.tagline || cardData?.tagline || cardData?.title || '';

    const aboutBlock = structured.about || {};
    const aboutRawKey = get('about', 'aboutUs', 'about_us', 'aboutText', 'description', 'bio', 'message');
    const about = aboutBlock.description || (typeof aboutRawKey === 'string' ? aboutRawKey : (aboutRawKey || ''));
    const aboutIcons = Array.isArray(aboutBlock.icons) ? aboutBlock.icons : [];

    // Check new structured services first, then fallback to old format
    const structuredServices = Array.isArray(structured.services) ? structured.services : [];
    const products = Array.isArray(structured.products) ? structured.products : [];
    const servicesVal = structuredServices.length > 0 ? structuredServices : (cardData?.services ?? cardData?.serviceList ?? cardData?.servicesList ?? cardData?.offerings);
    let services = Array.isArray(servicesVal) ? servicesVal : normalizeList(servicesVal);
    if (services.length === 0) {
      // Auto-collect string fields like service1, service_2, Services3
      const collected = Object.entries(cardData || {})
        .filter(([k, v]) => /service/i.test(k) && typeof v === 'string')
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([, v]) => v)
        .filter(Boolean);
      if (collected.length) services = collected;
    }

    const workGallery = Array.isArray(cardData?.workGallery) ? cardData.workGallery.map(url => ({ image: url, title: '' })) : [];
    let portfolio = []; // portfolio removed for custom card
    // achievements grid in new API is separate from portfolio visuals
    const achievementsGrid = Array.isArray(structured.achievements) ? structured.achievements : [];
    // New sections
    const features = Array.isArray(structured.features) ? structured.features : [];
    const certifications = structured.certifications || { description: '', tags: [] };
    const stats = Array.isArray(structured.stats) ? structured.stats : [];
    const headquarters = Array.isArray(structured.headquarters)
      ? structured.headquarters
      : (structured.headquarters && typeof structured.headquarters === 'object')
        ? [structured.headquarters]
        : [];
    const gallery = Array.isArray(structured.gallery) ? structured.gallery : [];
    const galleryLink = structured.galleryLink || cardData?.customCardData?.galleryLink || cardData?.galleryLink || '';
    const testimonials = Array.isArray(structured.testimonials) ? structured.testimonials : [];
    // const testimonialsTopImage = structured.testimonialsTopImage || '';
    // const testimonialsBottomImage = structured.testimonialsBottomImage || '';
    if (portfolio.length === 0) {
      // Collect keys like work1Image, portfolio1Image, gallery1
      const imageEntries = Object.entries(cardData || {})
        .filter(([k, v]) => typeof v === 'string' && /^((work|portfolio|gallery).*(image)?\d+|image\d+)$/i.test(k))
        .map(([, url]) => ({ image: url, title: '' }));
      if (imageEntries.length) portfolio = imageEntries;
    }

    const achievementsVal = cardData?.achievements ?? cardData?.awards ?? cardData?.milestones ?? cardData?.achievementList;
    let achievements = normalizeList(achievementsVal);
    if (achievements.length === 0) {
      const collected = Object.entries(cardData || {})
        .filter(([k, v]) => /achievement/i.test(k) && typeof v === 'string')
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([, v]) => v)
        .filter(Boolean);
      if (collected.length) achievements = collected;
    }

    const clientsLogos = (structured.clients && Array.isArray(structured.clients.logos)) ? structured.clients.logos : [];
    const clientsGallery = (structured.clients && Array.isArray(structured.clients.gallery)) ? structured.clients.gallery : [];
    const clientsVal = cardData?.clients ?? cardData?.clientLogos ?? cardData?.logos ?? cardData?.ourClients;
    let clients = Array.isArray(clientsVal) ? clientsVal : normalizeList(clientsVal);
    if (clients.length === 0) {
      const collected = Object.entries(cardData || {})
        .filter(([k, v]) => /client/i.test(k) && typeof v === 'string')
        .sort(([a], [b]) => (a > b ? 1 : -1))
        .map(([, v]) => v)
        .filter(Boolean);
      if (collected.length) clients = collected;
    }

    const teamStructured = Array.isArray(structured.team) ? structured.team : [];
    const teamVal = teamStructured.length > 0 ? teamStructured : (cardData?.team ?? cardData?.teamMembers ?? []);
    let team = Array.isArray(teamVal) ? teamVal : [];
    if (team.length === 0) {
      // Try teamName1/teamRole1/teamPhoto1 pattern
      const members = [];
      for (let i = 1; i <= 12; i++) {
        const name = cardData?.[`teamName${i}`] || cardData?.[`memberName${i}`];
        const role = cardData?.[`teamRole${i}`] || cardData?.[`memberRole${i}`];
        const photo = cardData?.[`teamPhoto${i}`] || cardData?.[`memberPhoto${i}`];
        if (name || role || photo) members.push({ name, role, photo });
      }
      if (members.length) team = members;
    }

    const social = structured.socialLinks || cardData?.social || cardData?.socialLinks || {};

    const contactObj = cardData?.contact || {};
    const phone = (structured.contact && structured.contact.phone) || cardData?.phone || contactObj.phone || '';
    const email = (structured.contact && structured.contact.email) || cardData?.email || contactObj.email || '';
    const website = (structured.contact && structured.contact.website) || cardData?.website || contactObj.website || '';
    const address = (structured.contact && structured.contact.location) || cardData?.address || cardData?.location || contactObj.address || '';
    const whatsappRaw = (structured.contact && (structured.contact.whatsapp || structured.contact.whatsappNumber)) || cardData?.whatsapp || cardData?.whatsappNumber || contactObj.whatsapp || contactObj.whatsappNumber || '';
    const whatsappNumber = (whatsappRaw || '').trim();
    // Build a wa.me link if a number is provided and link is not already a URL
    const whatsapp = whatsappNumber
      ? (/^https?:\/\//i.test(whatsappNumber) ? whatsappNumber : `https://wa.me/${whatsappNumber.replace(/\D/g,'')}`)
      : '';

    const officeAddress = cardData?.officeAddress || address;
    const directionsLink = (structured.visitOffice && structured.visitOffice.mapUrl) || cardData?.directionsLink || '';
    const mapImage = (structured.visitOffice && structured.visitOffice.mapImage) || cardData?.mapImage || cardData?.officeImage || '';
    // Address field to display after "Your Landmark"
    const landmarkAddress = (structured.visitOffice && structured.visitOffice.address) || cardData?.landmarkAddress || '';

    const appStoreUrl = (structured.appLinks && structured.appLinks.appStore) || cardData?.appStoreUrl || cardData?.appDownload?.appStoreUrl || '';
    const playStoreUrl = (structured.appLinks && structured.appLinks.playStore) || cardData?.playStoreUrl || cardData?.appDownload?.playStoreUrl || '';

    const founderName = (structured.founder && structured.founder.name) || cardData?.founderName || '';
    const founderTitle = (structured.founder && structured.founder.position) || cardData?.founderTitle || 'Post of Founder';
    const founderPhoto = (structured.founder && structured.founder.photo) || cardData?.founderPhoto || '';
    const founderMessage = (structured.founder && structured.founder.message) || cardData?.founderMessage || '';

    const primaryCtaText = (structured.finalCTA && structured.finalCTA.bookAppointment && structured.finalCTA.bookAppointment.text) || cardData?.primaryCtaText || '';
    const primaryCtaLink = (structured.finalCTA && structured.finalCTA.bookAppointment && structured.finalCTA.bookAppointment.url) || cardData?.primaryCtaLink || '';

    // CTA Title and Subtitle
    const ctaTitle = (structured.finalCTA && structured.finalCTA.ctaTitle) || cardData?.ctaTitle || 'Ready for Your Next Adventure?';
    const ctaSubtitle = (structured.finalCTA && structured.finalCTA.ctaSubtitle) || cardData?.ctaSubtitle || 'Contact Us Today!!';

    // YouTube Video
    const youtubeVideoUrl = (structured.youtubeVideo && structured.youtubeVideo.url) || cardData?.youtubeVideo?.url || '';

    // Secondary buttons from new API
    const secondaryButtons = (structured.finalCTA && Array.isArray(structured.finalCTA.secondaryButtons)) ? structured.finalCTA.secondaryButtons : [];
    const cta1Text = cardData?.cta1Text || (secondaryButtons[0]?.text || '');
    const cta1Link = cardData?.cta1Link || (secondaryButtons[0]?.url || '');
    const cta2Text = cardData?.cta2Text || (secondaryButtons[1]?.text || '');
    const cta2Link = cardData?.cta2Link || (secondaryButtons[1]?.url || '');
    const cta3Text = cardData?.cta3Text || (secondaryButtons[2]?.text || '');
    const cta3Link = cardData?.cta3Link || (secondaryButtons[2]?.url || '');

    const affiliationImage = (structured.affiliation && structured.affiliation.image) || cardData?.affiliationImage || '';
    const affiliationText = (structured.affiliation && structured.affiliation.text) || cardData?.affiliationText || '';
    const affiliationLink = (structured.affiliation && structured.affiliation.link) || cardData?.affiliationLink || '';

    return {
      coverImage,
      coverImages,
      backgroundImage,
      backgroundColor,
      gradientStart,
      gradientEnd,
      gradientDirection,
      name,
      company,
      profilePic,
      tagline,
      about,
      aboutIcons,
      services,
      products,
      portfolio,
      achievementsGrid,
      features,
      certifications,
      stats,
      headquarters,
      gallery,
      galleryLink,
      testimonials,
      // testimonialsTopImage,
      // testimonialsBottomImage,
      achievements,
      clients,
      clientsLogos,
      clientsGallery,
      team,
      social,
      phone,
      email,
      website,
      address,
      officeAddress,
      directionsLink,
      mapImage,
      appStoreUrl,
      playStoreUrl,
      founderName,
      founderTitle,
      founderPhoto,
      founderMessage,
      primaryCtaText,
      primaryCtaLink,
      ctaTitle,
      ctaSubtitle,
      youtubeVideoUrl,
      cta1Text,
      cta1Link,
      cta2Text,
      cta2Link,
      cta3Text,
      cta3Link,
      affiliationImage,
      affiliationText,
      affiliationLink,
      landmarkAddress,
      whatsappNumber,
      whatsapp,
    };
  }, [cardData]);

  const [isAppointmentOpen, setIsAppointmentOpen] = React.useState(false);
  const [apptName, setApptName] = React.useState('');
  const [apptEmail, setApptEmail] = React.useState('');
  const [apptPhone, setApptPhone] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitMessage, setSubmitMessage] = React.useState('');
  const [apptMessage, setApptMessage] = React.useState('');

  const effectiveCardId = cardId || cardData?._id || cardData?.cardId;

  // Helper function to extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      // Only check saved cards for regular users, not admin users
      if (!user?.isAdmin && user?.role !== 'admin' && user?.role !== 'superadmin') {
        checkIfCardSaved();
      }
    }
  }, [isAuthenticated, user, cardId]);

  const checkIfCardSaved = async () => {
    try {
      // Skip checking saved cards for admin users
      if (user?.isAdmin || user?.role === 'admin' || user?.role === 'superadmin') {
        setIsCardSaved(false);
        return;
      }

      const response = await getSavedCards();
      const userSavedCards = response.data.savedCards || [];
      const isSaved = userSavedCards.some(savedCard => savedCard._id === cardId);
      setIsCardSaved(isSaved);
      setSavedCards(userSavedCards);
    } catch (error) {
      // console.error('Error checking saved cards:', error);
      // If it's an admin user error, just set as not saved
      if (error.message.includes('Admin users cannot access saved cards')) {
        setIsCardSaved(false);
      }
    }
  };

  // Manual navigation handlers for cover images
  const handlePrevCover = () => {
    const covers = normalized.coverImages || [];
    if (covers.length <= 1) return;
    setCoverIndex((prev) => (prev - 1 + covers.length) % covers.length);
  };

  const handleNextCover = () => {
    const covers = normalized.coverImages || [];
    if (covers.length <= 1) return;
    setCoverIndex((prev) => (prev + 1) % covers.length);
  };

  const handleDotClick = (index) => {
    setCoverIndex(index);
  };

  // Swipe handlers for touch events
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
    // Prevent scrolling while swiping
    if (touchStart !== null) {
      e.preventDefault();
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    const covers = normalized.coverImages || [];
    if (covers.length <= 1) return;
    
    if (isLeftSwipe) {
      handleNextCover();
    } else if (isRightSwipe) {
      handlePrevCover();
    }
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Swipe handlers for mouse events (desktop)
  const onMouseDown = (e) => {
    setIsDragging(true);
    setMouseEnd(null);
    setMouseStart(e.clientX);
  };

  const handleMouseMove = React.useCallback((e) => {
    if (!isDragging) return;
    setMouseEnd(e.clientX);
  }, [isDragging]);

  const handleMouseUp = React.useCallback(() => {
    if (!isDragging || mouseStart === null) {
      setIsDragging(false);
      return;
    }
    
    if (mouseEnd !== null) {
      const distance = mouseStart - mouseEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;
      
      const covers = normalized.coverImages || [];
      if (covers.length > 1) {
        if (isLeftSwipe) {
          setCoverIndex((prev) => (prev + 1) % covers.length);
        } else if (isRightSwipe) {
          setCoverIndex((prev) => (prev - 1 + covers.length) % covers.length);
        }
      }
    }
    
    setIsDragging(false);
    setMouseStart(null);
    setMouseEnd(null);
  }, [isDragging, mouseStart, mouseEnd, normalized.coverImages]);

  // Add global event listeners for mouse drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Auto rotate testimonials every 3 seconds
  useEffect(() => {
    const list = normalized.testimonials || [];
    if (!Array.isArray(list) || list.length <= 1) return;
    const id = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % list.length);
    }, 3000);
    return () => clearInterval(id);
  }, [normalized.testimonials]);

  const handleSaveCard = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    // Check if user is admin/superadmin
    if (user?.isAdmin || user?.role === 'admin' || user?.role === 'superadmin') {
      setShowAdminModal(true);
      return;
    }

    if (isCardSaved) {
      // Show confirmation modal for unsaving
      setShowUnsaveModal(true);
      return;
    }

    setSaving(true);
    try {
      // Save the card
      await saveCard(cardId);
      setIsCardSaved(true);
      alert('Card saved successfully!');
    } catch (error) {
      // console.error('Error saving card:', error);
      if (error.message.includes('Admin users cannot save cards')) {
        setShowAdminModal(true);
      } else {
        alert('Failed to save card. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUnsaveConfirm = async () => {
    setSaving(true);
    setShowUnsaveModal(false);
    
    try {
      await removeSavedCard(cardId);
      setIsCardSaved(false);
      alert('Card removed from saved cards!');
    } catch (error) {
      // console.error('Error removing card:', error);
      alert('Failed to remove card. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAuthSuccess = async (userData, cardIdToSave) => {
    // After successful login/registration, save the card
    try {
      await saveCard(cardIdToSave);
      setIsCardSaved(true);
      alert('Card saved successfully!');
    } catch (error) {
      // console.error('Error saving card after auth:', error);
      alert('Failed to save card. Please try again.');
    }
  };

  const handleOpenAppointment = (e) => {
    e.preventDefault();
    setIsAppointmentOpen(true);
  };

  const handleSubmitAppointment = async (e) => {
    e.preventDefault();
    if (!effectiveCardId) {
      alert('Card ID not found. This might be a preview mode. Please save the card first or try again later.');
      return;
    }
    if (!apptName || !apptEmail || !apptPhone || !apptMessage) {
      alert('Please fill in name, email, phone number, and message.');
      return;
    }
    try {
      setSubmitting(true);
      setSubmitMessage('');
      await createAppointment({
        cardId: effectiveCardId,
        name: apptName,
        email: apptEmail,
        phone: apptPhone,
        message: apptMessage
      });
      setSubmitMessage('Appointment submitted successfully!');
      setApptName('');
      setApptEmail('');
      setApptPhone('');
      setApptMessage('');
      setIsAppointmentOpen(false);
    } catch (err) {
      setSubmitMessage(err?.message || 'Failed to submit appointment');
      alert(submitMessage || 'Failed to submit appointment');
    } finally {
      setSubmitting(false);
    }
  };

  // Render a section based on its type
  const renderSection = (sectionId) => {
    // Skip if section is hidden (except 'services' which handles both services and products)
    if (sectionId !== 'services' && !shouldShowSection(sectionId)) {
      return null;
    }

    const sectionIcon = getSectionIcon(sectionId);
    
    switch (sectionId) {
      case 'about':
        return (
          <div key="about" className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              {sectionIcon && <img src={sectionIcon} alt="About" className="h-7 w-7" />}
              <h3 className="text-lg font-semibold" style={{ color: textColors.heading }}>
                {getSectionHeading('about', 'About')}
              </h3>
            </div>
            <p className="text-sm" style={{ color: textColors.paragraph }}>
              {normalized.about || 'We are a passionate team delivering quality services to our clients.'}
            </p>
          </div>
        );

      case 'services':
        // Combined services and products with tabs
        const services = normalized.services && normalized.services.length > 0
          ? normalized.services
          : [
              { name: 'Quality Service', description: 'High-quality solutions tailored to your needs', price: '$99' },
              { name: 'Expert Support', description: '24/7 professional support and guidance', price: '$149' },
              { name: 'Premium Experience', description: 'Unmatched service experience and results', price: '$199' }
            ];
        const products = Array.isArray(normalized.products) ? normalized.products : [];
        const showServices = shouldShowSection('services');
        const showProducts = shouldShowSection('products');
        const showTabs = showServices && showProducts;
        
        // If neither is visible, return null
        if (!showServices && !showProducts) return null;
        
        // If only one is visible, show that one without tabs
        if (!showTabs) {
          if (showServices) {
            // Only services visible
            return (
              <div key="services" className="mb-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-2">
                    {sectionIcon && <img src={sectionIcon} alt="Services" className="h-7 w-7" />}
                    <h3 className="text-lg font-semibold" style={{ color: textColors.heading }}>
                      {getSectionHeading('services', 'Services')}
                    </h3>
                  </div>
                  <div className="flex items-center justify-center">
                    {normalized.whatsapp && (
                      <a href={`${normalized.whatsapp}`} target="_blank" rel="noreferrer" className='font-semibold bg-transparent text-center text-[6px] flex items-center justify-center flex-col' style={{ color: textColors.paragraph }}>
                        <img src={'/Enquire-now.svg'} alt="Enquire Now" className="w-6 h-6" />
                        Enquire Now
                      </a>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  {services.map((service, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-[#ffffff3d] duration-300">
                      <div className="flex items-center gap-3">
                        {typeof service === 'object' && service.image ? (
                          <img src={service.image} alt={service.name || `service-${index+1}`} className="w-12 h-12 object-cover rounded" />
                        ) : null}
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h4 className="font-medium text-[14px] leading-[1.25]" style={{ color: textColors.heading }}>
                              {typeof service === 'string' ? service : service.name || `Service ${index + 1}`}
                            </h4>
                            {typeof service === 'object' && service.price && (
                              <span className="text-[13px] font-semibold" style={{ color: textColors.heading }}>Rs.{service.price}</span>
                            )}
                          </div>
                          {typeof service === 'object' && service.description && (
                            <p className="text-[10px] leading-[1.25]" style={{ color: textColors.paragraph }}>
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          } else {
            // Only products visible - get products icon
            const productsIcon = getSectionIcon('products');
            return (
              <div key="products" className="mb-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-2">
                    {productsIcon && <img src={productsIcon} alt="Products" className="h-7 w-7" />}
                    <h3 className="text-lg font-semibold" style={{ color: textColors.heading }}>
                      {getSectionHeading('products', 'Products')}
                    </h3>
                  </div>
                  <div className="flex items-center justify-center">
                    {normalized.whatsapp && (
                      <a href={`${normalized.whatsapp}`} target="_blank" rel="noreferrer" className='font-semibold bg-transparent text-center text-[6px] flex items-center justify-center flex-col' style={{ color: textColors.paragraph }}>
                        <img src={'/Enquire-now.svg'} alt="Enquire Now" className="w-6 h-6" />
                        Enquire Now
                      </a>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {products.length === 0 ? (
                    <div className="col-span-2 text-center text-sm text-gray-500">No products added</div>
                  ) : (
                    products.map((p, idx) => (
                      <div key={`p-${idx}`} className="border border-gray-200 rounded-2xl overflow-hidden relative">
                        {p?.image ? (
                          <img src={p.image} alt={`product-${idx}`} className="w-full h-full aspect-square object-cover" />
                        ) : (
                          <div className="w-full h-full aspect-square bg-gray-200" />
                        )}
                        <div className="p-2 absolute bottom-0 right-0">
                          {p?.link ? (
                          <a href={p.link} target="_blank" rel="noreferrer" className="text-[8px] text-white bg-[#FF0000] rounded-full font-semibold px-2 py-0.5 break-all">View Product</a>
                          ) : (
                            <span className="text-xs text-white bg-[#FF0000] rounded-full px-2 py-1">No link</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          }
        }
        
        // Both visible - show tabs
        return (
          <div key="services" className="mb-6">
            {/* Tabs */}
            <div className="flex justify-between border-0 border-gray-200 mb-6">
              <div className="flex items-center justify-center">
                <button onClick={()=>setActiveTab('services')} className={`px-2 py-1 text-base font-bold ${activeTab==='services' ? ' text-white bg-[#FF0000] rounded-full ' : 'text-black hover:bg-[#ffffff51] transition-colors duration-300 rounded-full'}`}>Our Services</button>
                <button onClick={()=>setActiveTab('products')} className={`ml-2 px-2 py-1 text-base font-bold ${activeTab==='products' ? ' text-white bg-[#FF0000] rounded-full ' : 'text-black hover:bg-[#ffffff51] transition-colors duration-300 rounded-full'}`}>Our Products</button>
              </div>
              <div className="flex items-center justify-center">
                  {normalized.whatsapp && (
                  <a href={`${normalized.whatsapp}`} target="_blank" rel="noreferrer" className='font-semibold bg-transparent text-center text-[6px] flex items-center justify-center flex-col' style={{ color: textColors.paragraph }}>
                    <img src={'/Enquire-now.svg'} alt="Enquire Now" className="w-6 h-6" />
                    Enquire Now
                  </a>
                )}
              </div>
            </div>
            {activeTab === 'services' ? (
              <div className="space-y-3">
                {services.map((service, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-[#ffffff3d] duration-300">
                    <div className="flex items-center gap-3">
                      {typeof service === 'object' && service.image ? (
                        <img src={service.image} alt={service.name || `service-${index+1}`} className="w-12 h-12 object-cover rounded" />
                      ) : null}
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-medium text-[14px] leading-[1.25]" style={{ color: textColors.heading }}>
                            {typeof service === 'string' ? service : service.name || `Service ${index + 1}`}
                          </h4>
                          {typeof service === 'object' && service.price && (
                            <span className="text-[13px] font-semibold" style={{ color: textColors.heading }}>Rs.{service.price}</span>
                          )}
                        </div>
                        {typeof service === 'object' && service.description && (
                          <p className="text-[10px] leading-[1.25]" style={{ color: textColors.paragraph }}>
                            {service.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.length === 0 ? (
                  <div className="col-span-2 text-center text-sm text-gray-500">No products added</div>
                ) : (
                  products.map((p, idx) => (
                    <div key={`p-${idx}`} className="border border-gray-200 rounded-2xl overflow-hidden relative">
                      {p?.image ? (
                        <img src={p.image} alt={`product-${idx}`} className="w-full h-full aspect-square object-cover" />
                      ) : (
                        <div className="w-full h-full aspect-square bg-gray-200" />
                      )}
                      <div className="p-2 absolute bottom-0 right-0">
                        {p?.link ? (
                        <a href={p.link} target="_blank" rel="noreferrer" className="text-[8px] text-white bg-[#FF0000] rounded-full font-semibold px-2 py-0.5 break-all">View Product</a>
                        ) : (
                          <span className="text-xs text-white bg-[#FF0000] rounded-full px-2 py-1">No link</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );

      case 'products':
        // Products are handled in the services case when both are visible
        // If only products is visible, it's handled in the services case above
        // This case should only render if services is hidden but products is visible
        // However, we're handling this in the services case for the tabbed interface
        return null;

      case 'portfolio':
        // Portfolio is removed for custom card
        return null;

      case 'achievements':
        const achievements = normalized.achievements && normalized.achievements.length > 0
          ? normalized.achievements
          : [];
        return achievements.length > 0 ? (
          <div key="achievements" className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              {sectionIcon && <img src={sectionIcon} alt="Achievements" className="h-7 w-7" />}
              <h3 className="text-lg font-semibold" style={{ color: textColors.heading }}>
                {getSectionHeading('achievements', 'Achievements')}
              </h3>
            </div>
            <ul className="text-sm space-y-1" style={{ color: textColors.paragraph }}>
              {achievements.map((achievement, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <span className="w-1 h-1 bg-current rounded-full"></span>
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null;

      case 'clients':
        const clients = Array.isArray(normalized.clients) && normalized.clients.length > 0
          ? normalized.clients
          : Array.from({ length: 6 }).map(() => '');
        return (
          <div key="clients" className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              {sectionIcon && <img src={sectionIcon} alt="Clients" className="h-7 w-7" />}
              <h3 className="text-lg font-semibold" style={{ color: textColors.heading }}>Clients</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {clients.map((client, index) => (
                client ? (
                  <img key={index} src={client} alt={`Client ${index + 1}`} className="w-full h-12 object-cover rounded bg-white" />
                ) : (
                  <div key={index} className="w-full h-12 rounded bg-white/70" />
                )
              ))}
            </div>
          </div>
        );

      case 'team':
        const team = Array.isArray(normalized.team) && normalized.team.length > 0
          ? normalized.team
          : Array.from({ length: 3 }).map(() => ({ name: 'Team name', role: 'Team role', photo: '' }));
        return (
          <div key="team" className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              {sectionIcon && <img src={sectionIcon} alt="Team" className="h-7 w-7" />}
              <h3 className="text-lg font-semibold" style={{ color: textColors.heading }}>
                {getSectionHeading('team', 'Our Team of Experts')}
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-x-2 gap-y-4 mt-8">
              {team.map((member, index) => (
                <div key={index} className="flex items-center flex-col space-y-2 group">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="w-16 h-16 object-cover rounded-full group-hover:translate-y-[-5px] transition-all duration-300" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/60" />
                  )}       
                    <div className="space-y-0.5 text-center">
                    <p className="text-[12px] font-medium" style={{ color: textColors.heading }}>{member.name}</p>
                    <p className="text-[10px]" style={{ color: textColors.paragraph }}>{member.role}</p>
                    </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'contact':
        const showPhone = normalized.phone && isVisible('phone', hiddenFields);
        const showEmail = normalized.email && isVisible('email', hiddenFields);
        const showWebsite = normalized.website && isVisible('website', hiddenFields);
        const showAddress = normalized.address && isVisible('address', hiddenFields);
        if (!showPhone && !showEmail && !showWebsite && !showAddress) return null;
        return (
          <div key="contact" className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              {sectionIcon && <img src={sectionIcon} alt="Contact" className="h-7 w-7" />}
              <h3 className="text-lg font-semibold" style={{ color: textColors.heading }}>Contact</h3>
            </div>
            <div className="space-y-2 text-sm" style={{ color: textColors.paragraph }}>
              {showPhone && (
                <p className="flex items-center space-x-2">
                  <span>📞</span>
                  <span>{normalized.phone}</span>
                </p>
              )}
              {showEmail && (
                <p className="flex items-center space-x-2">
                  <span>✉️</span>
                  <span>{normalized.email}</span>
                </p>
              )}
              {showWebsite && (
                <p className="flex items-center space-x-2">
                  <span>🌐</span>
                  <span>{normalized.website}</span>
                </p>
              )}
              {showAddress && (
                <p className="flex items-center space-x-2">
                  <span>📍</span>
                  <span>{normalized.address}</span>
                </p>
              )}
            </div>
          </div>
        );

      case 'social':
        const socialLinks = social || {};
        const hasSocialLinks = Object.values(socialLinks).some(link => link && String(link).trim() !== '');
        if (!hasSocialLinks) return null;
        const pill = (label, href, bg, text) => (
          <a href={href} target="_blank" rel="noreferrer" className={`px-3 py-1.5 rounded-full text-xs font-medium ${bg} ${text}`}>
            {label}
          </a>
        );
        return (
          <div key="social" className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              {sectionIcon && <img src={sectionIcon} alt="Social" className="h-7 w-7" />}
              <h3 className="text-lg font-semibold" style={{ color: textColors.heading }}>Social</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {socialLinks.instagram && pill('Instagram', socialLinks.instagram, 'bg-pink-600/10 border border-pink-600/30', 'text-pink-700')}
              {socialLinks.linkedin && pill('LinkedIn', socialLinks.linkedin, 'bg-blue-600/10 border border-blue-600/30', 'text-blue-700')}
              {socialLinks.facebook && pill('Facebook', socialLinks.facebook, 'bg-blue-500/10 border border-blue-500/30', 'text-blue-600')}
              {socialLinks.youtube && pill('YouTube', socialLinks.youtube, 'bg-red-600/10 border border-red-600/30', 'text-red-700')}
              {socialLinks.twitter && pill('Twitter', socialLinks.twitter, 'bg-sky-500/10 border border-sky-500/30', 'text-sky-600')}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Build background style with priority: image > gradient > color
  const getBackgroundStyle = () => {
    // Helper to check if a value is a valid non-empty string
    const isValidString = (val) => val && typeof val === 'string' && val.trim() !== '';
    
    // Read directly from theme as primary source
    // Check if customCardData.theme exists - if it does, always respect it (even if empty)
    const hasThemeObject = structured.theme !== undefined;
    
    let bgImage = null;
    if (hasThemeObject) {
      // Theme object exists in customCardData - always check it first
      if ('backgroundImage' in theme) {
        // Property exists in theme - check if it's explicitly null (removed) or a valid string
        if (theme.backgroundImage === null || theme.backgroundImage === undefined) {
          // Explicitly set to null/undefined - was removed
          bgImage = null;
        } else if (isValidString(theme.backgroundImage)) {
          // Valid background image string
          bgImage = theme.backgroundImage;
        } else {
          // Empty string or invalid - treat as removed
          bgImage = null;
        }
      } else {
        // Theme exists but backgroundImage property doesn't - it was removed
        bgImage = null;
      }
    } else {
      // Theme doesn't exist in customCardData - check legacy sources
      bgImage = isValidString(normalized.backgroundImage)
        ? normalized.backgroundImage 
        : (isValidString(customisations.backgroundImage)
          ? customisations.backgroundImage 
          : null);
    }
    
    const bgColor = isValidString(theme.backgroundColor)
      ? theme.backgroundColor
      : (isValidString(normalized.backgroundColor) ? normalized.backgroundColor : null);
    
    const gradStart = isValidString(theme.gradientStart)
      ? theme.gradientStart
      : (isValidString(normalized.gradientStart) ? normalized.gradientStart : null);
    
    const gradEnd = isValidString(theme.gradientEnd)
      ? theme.gradientEnd
      : (isValidString(normalized.gradientEnd) ? normalized.gradientEnd : null);
    
    const gradDir = theme.gradientDirection || normalized.gradientDirection || 'to bottom';
    
    const style = {};
    
    // Priority 1: Background Image
    if (bgImage) {
      style.backgroundImage = `url(${bgImage})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
      style.backgroundRepeat = 'no-repeat';
    }
    // Priority 2: Background Gradient (only if both colors are set and not empty)
    else if (gradStart && gradEnd) {
      style.background = `linear-gradient(${gradDir}, ${gradStart}, ${gradEnd})`;
    }
    // Priority 3: Background Color (only if not empty)
    else if (bgColor) {
      style.backgroundColor = bgColor;
    }
    
    return style;
  };

  return (
    <div 
      className="rounded-xl shadow-lg max-w-sm mx-auto relative overflow-hidden border border-gray-200"
      style={getBackgroundStyle()}
    >
      {/* Top cover (manual slider with dots) */}
      <div 
        className="relative h-[465px] m-4 rounded-2xl"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        {Array.isArray(normalized.coverImages) && normalized.coverImages.length > 0 ? (
          <>
            <div className="absolute rounded-2xl overflow-hidden inset-0 select-none pointer-events-none">
              <div 
                className="flex h-full transition-transform duration-500 ease-in-out"
                style={{ 
                  transform: `translateX(calc(-100% / ${normalized.coverImages.length} * ${coverIndex}))`, 
                  width: `${normalized.coverImages.length * 100}%` 
                }}
              >
                {normalized.coverImages.map((url, idx) => (
                  <img
                    key={`cover-${idx}`}
                    src={url}
                    alt={`cover-${idx}`}
                    className="h-full object-cover"
                    style={{ 
                      flex: `0 0 ${100 / normalized.coverImages.length}%`,
                      width: `${100 / normalized.coverImages.length}%`
                    }}
                    draggable="false"
                    loading="eager"
                  />
                ))}
              </div>
            </div>
            {/* Navigation buttons
            {normalized.coverImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevCover}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextCover}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )} */}
            {/* Dot indicators */}
            {normalized.coverImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 items-center pointer-events-auto">
                {normalized.coverImages.map((_, idx) => (
                  <button
                    key={`dot-${idx}`}
                    onClick={() => handleDotClick(idx)}
                    className={`transition-all rounded-full ${
                      idx === coverIndex
                        ? 'w-2 h-2 bg-white'
                        : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : normalized.coverImage ? (
          <img src={normalized.coverImage} alt="Cover" className="absolute inset-0 w-full h-full rounded-2xl object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-200 to-indigo-300" />
        )}
        <div className="absolute inset-0 bg-black/10 rounded-2xl" />
      </div>

      {/* Header card */}
      <div className="px-5 pt-1 mb-4">
        <div className="rounded-2xl py-4 flex items-center gap-4">
          <div className="mb-2 flex justify-center">
            <div className="relative">
              {normalized.profilePic ? (
                <img src={normalized.profilePic} alt={normalized.name} className="w-[72px] h-[72px] rounded-full object-cover" />
              ) : (
                <div className="w-[72px] h-[72px] rounded-full border-4 border-white shadow bg-gray-200" />
              )}
              {/* Ripple animation circles */}
              <div className="absolute inset-0 rounded-full border-2 border-white/50 animate-ping" style={{ animationDuration: '2s', animationTimingFunction: 'ease-in', animationDelay: '2s' }}></div>
              {/* <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping" style={{ animationDuration: '2s',animationTimingFunction: 'ease-out', animationDelay: '2.5s' }}></div> */}
              {/* <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" style={{ animationDuration: '2s',animationTimingFunction: 'ease-out', animationDelay: '3s' }}></div> */}
            </div>
          </div>
          <div className="relative z-10 space-y-1">
            <div className="text-2xl font-bold" style={{ color: textColors.heading }}>{normalized.company || 'Company Name'}</div>
            <div className="text-[11px]" style={{ color: textColors.paragraph }}>{normalized.tagline || 'since 2012'}</div>
          </div>
        </div>
      </div>

      {/* Body sections in desired layout */}
      <div className="space-y-6">
        {/* About */}
        <div className="px-6">
        {shouldShowSection('about') && renderSection('about')}
        {/* About icons row (new API) */}
        {shouldShowSection('about') && Array.isArray(normalized.aboutIcons) && normalized.aboutIcons.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {normalized.aboutIcons.slice(0, 8).map((it, idx) => (
              <div key={`about-icon-${idx}`} className="flex flex-col items-center text-center">
                {it.icon ? (
                  <img src={it.icon} alt={it.label || `icon-${idx}`} className="w-10 h-10 object-contain rounded-full  bg-white/70" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/50" />
                )}
                {it.label && (
                  <div className="mt-1 text-[10px] text-gray-600 truncate w-full">{it.label}</div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>

        {/* Stats after About */}
        {Array.isArray(normalized.stats) && normalized.stats.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-6">
            {normalized.stats.map((s, idx) => (
              <div key={`stat-${idx}`} className="rounded-lg text-center transition min-w-[23%]">
                <AnimatedCounter 
                  value={s?.value} 
                  duration={2000}
                  style={{ color: textColors.heading }}
                  className="text-2xl font-bold"
                />
                <div className="text-[12px] font-normal" style={{ color: textColors.paragraph }}>{s?.label}</div>
              </div>
            ))}
          </div>
        )}


        
        {/* Certifications */}
       <div>
       {(normalized.certifications?.description) && (
          <div className="space-x-2 flex items-center mb-2 px-6">
            
            <div className="flex items-center space-x-2">
              {getSectionIcon('certifications') && <img src={getSectionIcon('certifications')} alt="Certifications" className="h-7 w-7" />}
              <h3 className="text-lg font-semibold" style={{ color: textColors.heading }}>Certified</h3>
            </div>
            {normalized.certifications.description && (
              <p className="text-sm border-l-2 pl-2" style={{ color: textColors.paragraph, borderColor: textColors.heading }}>{normalized.certifications.description}</p>
            )}
            </div>
        )}
            {Array.isArray(normalized.certifications.tags) && normalized.certifications.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 px-6">
                {normalized.certifications.tags.map((tag, idx) => (
                  <span key={`ct-${idx}`} className="px-2 py-0.5 text-xs rounded-lg border bg-white/40 active:scale-95 transition-all duration-300" style={{ color: textColors.paragraph, borderColor: textColors.heading }}>{tag}</span>
                ))}
              </div>
            )}
       </div>


        {/* Achievements grid (use portfolio as visual grid) */}
        {shouldShowSection('achievements') && (
        <div className="bg-[#f0f1f554] w-[95%] mx-auto rounded-[20px] pt-5 pb-1 px-2">
          <div className="flex items-center space-x-2 mb-6 px-2">
            {getSectionIcon('achievements') && <img src={getSectionIcon('achievements')} alt="Achievements" className="h-7 w-7" />}
            <h3 className="text-lg font-semibold" style={{ color: textColors.heading }}>
              {getSectionHeading('achievements', 'Achievements')}
            </h3>
          </div>
          {/* Visual grid (work/portfolio) */}
          {/* Prefer new structured achievements grid if provided */}
          {Array.isArray(normalized.achievementsGrid) && normalized.achievementsGrid.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 mb-3">
              {normalized.achievementsGrid.map((item, index) => (
                <div key={`ach-${index}`} className="relative">
                  {item.image ? (
                    <div className="hover:bg-white/40 transition-all duration-300 rounded-2xl overflow-hidden">
                    <img src={item.image} alt={item.title || `ach-${index}`} className="w-full aspect-square object-cover rounded-2xl" />
                    <p className="text-sm font-light py-1 px-2 text-center" style={{ color: textColors.paragraph }}>{item.title}</p>
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-white/60 rounded" />
                  )}
                </div>
              ))}
            </div>
          ) : null}
          {/* Textual achievements list if provided */}
          {renderSection('achievements')}
        </div>
        )}        
        
        
        {/* Services and Products (tabbed when both visible, independent when one hidden) */}
        <div className="px-4">
        {(shouldShowSection('services') || shouldShowSection('products')) && renderSection('services')}
        </div>




        {/* Primary CTA (if provided) */}
        {/* Primary CTA (always shown with fallback) */}
        {/* {shouldShowSection('primaryCTA') && (
          <a href={normalized.primaryCtaLink || '#'} target="_blank" rel="noreferrer" className="block">
            <div className="h-10 rounded-lg bg-blue-600 hover:bg-blue-700 transition text-white text-sm font-medium flex items-center justify-center">
              {normalized.primaryCtaText || 'Book your Appointment'}
            </div>
          </a>
        )} */}

        {/* Clients row + gallery */}
        {shouldShowSection('clients') && (
        <div className="space-y-3 px-6 pt-4 pb-2">
          <div className="flex items-center space-x-2">
            {getSectionIcon('clients') && <img src={getSectionIcon('clients')} alt="Clients" className="h-7 w-7" />}
            <h3 className="text-xl font-semibold" style={{ color: textColors.heading }}>
              {getSectionHeading('clients', 'Our Clients')}
            </h3>
          </div>
          {Array.isArray(normalized.clientsLogos) && normalized.clientsLogos.length > 0 ? (
            <div className="flex gap-3 items-center overflow-x-auto scrollbar-hide">
              {normalized.clientsLogos.slice(0, 8).map((logo, idx) => (
                <img key={`logo-${idx}`} src={logo} alt={`client-${idx}`} className="h-24 w-24 object-contain" />
              ))}
            </div>
          ) : null}
          {/* {Array.isArray(normalized.clientsGallery) && normalized.clientsGallery.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {normalized.clientsGallery.slice(0, 8).map((img, idx) => (
                <img key={`gal-${idx}`} src={img} alt={`client-gal-${idx}`} className="w-full h-16 object-cover rounded" />
              ))}
            </div>
          ) : renderSection('clients')} */}
        </div>
        )}

        {/* Features */}
        {Array.isArray(normalized.features) && normalized.features.length > 0 && (
          <div className="space-y-2 px-6 pt-5 border-t border-gray-200">
            {/* <div className="flex items-center space-x-2 mb-2">
              {getSectionIcon('features') && <img src={getSectionIcon('features')} alt="Features" className="h-7 w-7" />}
              <h3 className="text-lg font-semibold" style={{ color: textColors.heading }}>Features</h3>
            </div> */}
            <div className="grid grid-cols-4 gap-2">
              {normalized.features.map((f, idx) => (
                <div key={`f-${idx}`} className="flex flex-col items-center gap-3 p-2">
                  {f?.image ? <img src={f.image} alt="feature" className="w-12 h-12 object-cover rounded" /> : <div className="w-14 h-14 bg-white/60 rounded" />}
                  <div className="text-[13px] font-semibold text-center" style={{ color: textColors.paragraph }}>{f?.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Affiliation section (use about/extraContent image if exists) */}
        {shouldShowSection('affiliation') && (normalized.affiliationText || normalized.affiliationImage) && (
          <div className="px-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 mb-1">
                {getSectionIcon('affiliation') && <img src={getSectionIcon('affiliation')} alt="Affiliation" className="h-7 w-7" />}
                <div className="text-lg font-semibold" style={{ color: textColors.heading }}>Affiliation & potential</div>
              </div>
              {normalized.affiliationLink && (
                <a href={normalized.affiliationLink} target="_blank" rel="noreferrer" className="mt-1 px-3 py-[3px] rounded-2xl  bg-blue-500/60 text-[10px] text-white text-center font-semibold hover:bg-blue-500 hover:text-white transition-colors duration-300 flex items-center justify-center w-fit"><span>Visit Us</span></a>
              )}
            </div>
            {normalized.affiliationText && (
              <p className="text-xs leading-[1.25]" style={{ color: textColors.paragraph }}>{normalized.affiliationText}</p>
            )}
            {normalized.affiliationImage && (
              <img src={normalized.affiliationImage} alt="Affiliation" className="w-full h-32 object-cover rounded mt-3" />
            )}
            
          </div>
        )}

        {/* Social - always render with placeholders */}
        {shouldShowSection('socialLinks') && (
        <div className="pb-4">
          <div className="flex items-center space-x-2 mb-2 px-6 pt-4">
            {getSectionIcon('socialLinks') && <img src={getSectionIcon('socialLinks')} alt="Social" className="h-7 w-7" />}
            <h3 className="text-lg font-semibold" style={{ color: textColors.heading }}>
              {getSectionHeading('socialLinks', 'Follow Me')}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-6 pt-4">
            {['instagram','linkedin','facebook','youtube', 'twitter', 'behance', 'pinterest']
              .filter((key) => Boolean(normalized.social && normalized.social[key] && String(normalized.social[key]).trim()))
              .map((key) => (
                <a key={key} href={normalized.social[key]} target="_blank" rel="noreferrer" className="rounded-full text-sm font-medium flex items-center justify-start hover:scale-105 transition-all duration-300">
                  {key === 'instagram' && <img src="/instagram.png" alt="Instagram" className="w-full h-full object-cover" />}
                  {key === 'linkedin' && <img src="/linkedin.png" alt="Linkedin" className="w-full h-full object-cover" />}
                  {key === 'facebook' && <img src="/facebook.png" alt="Facebook" className="w-full h-full object-cover" />}
                  {key === 'youtube' && <img src="/youtube.png" alt="Youtube" className="w-full h-full object-cover" />}
                  {key === 'twitter' && <img src="/twitter.png" alt="Twitter" className="w-full h-full object-cover" />}
                  {key === 'behance' && <img src="/behance.png" alt="Behance" className="w-full h-full object-cover" />}
                  {key === 'pinterest' && <img src="/pinterest.png" alt="Pinterest" className="w-full h-full object-cover" />}
                </a>
              ))}
          </div>
        </div>
        )}


        {/* Office / Directions */}
        {/* Visit our Office - always render */}
        {shouldShowSection('visitOffice') && (
        <div className="space-y-2 px-5 pt-4 border-y border-gray-200 pb-8">
          {/* <div className="flex items-center space-x-2">
            {getSectionIcon('visitOffice') && <img src={getSectionIcon('visitOffice')} alt="Visit Office" className="h-7 w-7" />}
            <div className="text-base font-semibold" style={{ color: textColors.heading }}>Visit Our Office</div>
          </div> */}
          <div className="flex items-center gap-3">
            <div className="w-2/5 h-32 rounded-xl overflow-hidden">
              <img 
                src={normalized.mapImage || '/map-img-2.png'} 
                alt="Visit Office" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="w-3/5">
              <h3 className="text-lg font-semibold mb-1" style={{ color: textColors.heading }}>Your Landmark</h3>
              <p className="text-[10px] leading-[1.25]" style={{ color: textColors.paragraph }}>{normalized.landmarkAddress || normalized.officeAddress || 'Visit our office'}</p>
              <div className="mt-2">
              <a href={normalized.directionsLink || '#'} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-2xl  bg-black text-[10px] text-white text-center font-semibold hover:bg-blue-700 hover:text-white transition-colors duration-300 flex items-center justify-center w-fit">
                <MapPinIcon className="w-3 h-3 mr-[2px] mb-[1px]" />
                <span>Get Directions</span>
                </a>
              </div>
            </div>
          </div>
            
          {Array.isArray(normalized.headquarters) && normalized.headquarters.length > 0 && (
            <div className="mt-2 flex px-2 gap-x-3 overflow-x-auto scrollbar-hide">
              {normalized.headquarters.map((hq, idx) => (
                <div key={`hq-${idx}`} className="min-w-[40%]">
                  <div className="text-sm font-bold" style={{ color: textColors.heading }}>{hq?.name || 'Headquarters'}</div>
                  {hq?.address && (
                    <div className="text-[9px] leading-[1.45] mt-1 mb-2" style={{ color: textColors.paragraph }}>{hq.address}</div>
                  )}
                  {hq?.mapUrl && (
                    <a href={hq.mapUrl} target="_blank" rel="noreferrer" className="px-2 py-1 rounded-2xl  bg-black text-[10px] text-white text-center font-semibold hover:bg-blue-700 hover:text-white transition-colors duration-300 flex items-center justify-center w-fit">
                <MapPinIcon className="w-3 h-3 mr-[2px]" /> <span>Get Directions</span></a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        )}


        {/* Founder */}
        {/* Founder - always render */}
        {shouldShowSection('founder') && (
        <div className="px-6 pt-4">
          {/* <div className="flex items-center space-x-2">
            {getSectionIcon('founder') && <img src={getSectionIcon('founder')} alt="Founder" className="h-7 w-7" />}
            <div className="text-lg mb-4 font-semibold" style={{ color: textColors.heading }}>Founder</div>
          </div> */}
          <div className="flex items-center space-x-3">
            {normalized.founderPhoto ? (
              <img src={normalized.founderPhoto} alt={normalized.founderName} className="w-[70px] h-[70px] rounded-full object-cover" />
            ) : (
              <div className="w-[70px] h-[70px] rounded-full bg-gray-200" />
            )}
            <div>
              <div className="text-xl font-medium" style={{ color: textColors.heading }}>{normalized.founderName || 'Founder name'}</div>
              <div className="text-[11px]" style={{ color: textColors.paragraph }}>{normalized.founderTitle || 'Post of Founder'} · {normalized.company || 'Company name'}</div>
            </div>
          </div>
          {/* <p className="text-sm font-medium mt-4" style={{ color: textColors.heading }}>Founder Message</p> */}
          <p className="text-xs leading-5 mt-6" style={{ color: textColors.paragraph }}>{normalized.founderMessage || 'Founder message placeholder...'}</p>
        </div>
        )}

        {/* Team */}
        <div className="px-6 pt-4 border-b border-gray-200 pb-2">
        {renderSection('team')}
        </div>


        {/* Gallery (masonry columns) */}
        {Array.isArray(normalized.gallery) && normalized.gallery.length > 0 && (
          <div className="px-6">
            <div className="flex items-center justify-between space-x-2 mb-2">
              <div className="flex items-center space-x-2">
                {getSectionIcon('gallery') && <img src={getSectionIcon('gallery')} alt="Gallery" className="h-7 w-7" />}
                <h3 className="text-lg font-semibold" style={{ color: textColors.heading }}>
                  {getSectionHeading('gallery', 'Gallery')}
                </h3>
              </div>
              <a href={normalized.galleryLink || '#'} target="_blank" rel="noreferrer" className="text-[10px]" style={{ color: textColors.paragraph }}>View all</a>
            </div>
            <div className="columns-2 gap-2 [column-fill:_balance] mt-4">
              {normalized.gallery.map((url, idx) => (
                <div key={`g-${idx}`} className="mb-2 break-inside-avoid group overflow-hidden rounded-lg border">
                  <img src={url} alt={`g-${idx}`} className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105" />
                </div>
              ))}
            </div>
          </div>
        )}

       
        {/* Contact cards - always render with placeholders */}
        {shouldShowSection('contact') && (
        <div className="space-y-2 px-6 pt-2">
          <div className="flex items-center space-x-2 pb-4">
            {getSectionIcon('contact') && <img src={getSectionIcon('contact')} alt="Contact" className="h-7 w-7" />}
            <div className="text-xl font-semibold" style={{ color: textColors.heading }}>
              {getSectionHeading('contact', 'Contact us')}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-3 gap-x-2">
            {normalized.email && (
            <a href={`mailto:${normalized.email}`} className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#838DD3] to-[#9EAAFA] text-white border text-sm flex items-center justify-center hover:bg-blue-300 transition-colors duration-300">
              <span className="text-white"><Mail className="w-4 h-4 mr-2" /></span>
              <span className="text-white">Email</span>
            </a>
            )}
            {normalized.phone && (
            <a href={`tel:${normalized.phone}`} className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#838DD3] to-[#9EAAFA] text-white border text-sm flex items-center justify-center hover:bg-blue-300 transition-colors duration-300">
              <span className="text-white"><Phone className="w-[18px] h-4 mr-1" /></span>
              <span className="text-white">Phone</span>
            </a>
            )}
            {normalized.whatsapp && (
            <a href={normalized.whatsapp} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#838DD3] to-[#9EAAFA] text-white border text-sm flex items-center justify-center hover:bg-blue-300 transition-colors duration-300">
              <img src="/whatsapp.svg" alt="Whatsapp" className="w-5 h-5 mr-2" />
              <span className="text-white">Whatsapp</span>
            </a>
            )}
            {normalized.website && (
            <a href={normalized.website} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#838DD3] to-[#9EAAFA] text-white border text-sm flex items-center justify-center hover:bg-blue-300 transition-colors duration-300">
              <span className="text-white"><Globe className="w-4 h-4 mr-2" /></span>
              <span className="text-white">Website</span>
            </a>
            )}
          </div>
        </div>
        )}

        {/* App download */}
        {/* App links - always render */}
        {shouldShowSection('appLinks') && (
        <div className="space-y-2 px-6">
          <div className="flex items-center space-x-2">
            {getSectionIcon('appLinks') && <img src={getSectionIcon('appLinks')} alt="App Links" className="h-7 w-7" />}
            <div className="text-base font-semibold" style={{ color: textColors.heading }}>Download Our App</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a href={normalized.appStoreUrl || '#'} target="_blank" rel="noreferrer" className="transition-colors duration-300">
              <img src="/apple-download.svg" alt="App Store" className="w-full hover:scale-105 transition-all duration-300" />
              </a>
            <a href={normalized.playStoreUrl || '#'} target="_blank" rel="noreferrer" className="transition-colors duration-300">
              <img src="/g-play-download.svg" alt="Play Store" className="w-full hover:scale-105 transition-all duration-300" />
              </a>
          </div>
        </div>
        )}


        {/* Testimonials - before YouTube */}
        {Array.isArray(normalized.testimonials) && normalized.testimonials.length > 0 && (
          <div className="rounded-xl overflow-hidden px-6 py-4">
            <div className='mt-4 flex items-center gap-2 mb-6'>
              {getSectionIcon('testimonials') && <img src={getSectionIcon('testimonials')} alt="Testimonials" className="h-7 w-7" />}
              <h3 className="text-xl font-semibold" style={{ color: textColors.heading }}>{getSectionHeading('testimonials', 'Client Testimonials')}</h3>
            </div>
              <img src='/custom-testimonial-t.svg' alt="top" className="w-full object-cover" />
            <div className="p-4 my-4 relative min-h-[100px]">
              {normalized.testimonials.map((t, idx) => {
                const active = idx === (testimonialIndex % normalized.testimonials.length);
                const stars = Math.max(0, Math.min(5, parseInt(t?.rating || '0', 10)));
                return (
                  <div
                    key={`tt-${idx}`}
                    className={`absolute inset-0 px-0 transition-opacity duration-700 ease-in-out ${active ? 'opacity-100' : 'opacity-0'} flex flex-col justify-center`}
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-light leading-5" style={{ color: textColors.paragraph }}>{t?.text}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {t?.image ? (
                          <img src={t.image} alt={t?.name} className="w-6 h-6 object-cover" />
                        ) : (
                          <div className="w-6 h-6 bg-gray-300" />
                        )}
                        <div className="text-sm font-medium" style={{ color: textColors.heading }}>-{t?.name || 'Client'}</div>
                        <div className="flex ml-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`text-sm ${i < stars ? 'text-yellow-500' : 'text-gray-300'}`}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
              <img src='/custom-testimonial-b.svg' alt="bottom" className="w-full object-cover" />
          </div>
        )}


        {/* YouTube Video Section */}
        {normalized.youtubeVideoUrl && getYouTubeVideoId(normalized.youtubeVideoUrl) && (
          <div className="mt-4 rounded-xl overflow-hidden pb-4 px-6">
            <div className="">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(normalized.youtubeVideoUrl)}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}

        {/* Call to Action Section */}
        {(normalized.ctaTitle || normalized.ctaSubtitle) && (
          <div className="rounded-xl overflow-hidden">
            <div className="px-6">
              {normalized.ctaTitle && (
                <p className="text-lg font-medium italic text-center mb-1" style={{ color: textColors.heading }}>{normalized.ctaTitle}</p>
              )}
              {normalized.ctaSubtitle && (
                <p className="text-5xl font-bold leading-[1.1] text-center" style={{ color: textColors.paragraph }}>{normalized.ctaSubtitle}</p>
              )}
            </div>
          </div>
        )}

        {/* Static Business Growth Section */}
        <div className='mt-4  overflow-hidden px-6'>
          <div className='space-y-2 bg-white py-4 px-6 rounded-t-2xl'>
            <p className='text-[#1D40B0] text-base leading-[1.25] font-medium italic'>Contact Us with Confirm Booking ?</p>
            <p className='text-xs text-black leading-[1.25]'>Book your appointment today to connect with our expert team, discuss your needs, and get personalized solutions crafted just for you.</p>
            <button onClick={handleOpenAppointment} className="text-white font-semibold bg-black text-center rounded-full px-4 py-1 inline-block w-full mb-2">Book Appointment</button>
            <p className='text-xs text-black/80 text-center leading-[1.25] border-t border-black/40 pt-2'>Thank you for your interest! Our team will connect with you within 24 hours to share details and discuss opportunities further</p>
          </div>
          <div className='px-6 py-4' style={{background: 'linear-gradient(to bottom, #EBAADF, #DDC7F9)'}}>
            <a href={`${normalized.website || '#'}`} className='text-white font-semibold border border-white hover:bg-white/40 hover:text-[#231F20] transition-colors duration-300 bg-[#231F20] text-center rounded-lg px-4 py-2 inline-block w-full mb-2'>
              Visit Website
            </a>
            <a href={`tel:${normalized.phone || '#'}`} className='text-white font-semibold border border-white hover:bg-white/40 hover:text-[#231F20] transition-colors duration-300 bg-[#231F20] text-center rounded-lg px-4 py-2 w-full mb-2 flex items-center justify-center'>
              <PhoneCall className='w-5 h-5 mr-2' />
              Need urgent Call
            </a>
            <button 
              onClick={handleSaveCard}
              disabled={saving || (user?.isAdmin || user?.role === 'admin' || user?.role === 'superadmin')}
              className={`text-white font-semibold border text-center rounded-lg px-4 py-1 inline-block w-full mb-2 transition-all duration-300 hover:scale-105${
                (user?.isAdmin || user?.role === 'admin' || user?.role === 'superadmin')
                  ? 'bg-gray-400 border-gray-400 cursor-not-allowed'
                  : isCardSaved 
                    ? 'bg-green-600 border-green-600 hover:bg-green-700' 
                    : 'bg-[#2047B5]'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className='flex items-center justify-center gap-2'>
                {saving ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : isCardSaved ? (
                  <Check className='h-4 w-4' />
                ) : (
                  <Heart className='h-4 w-4' />
                )}
                <span>
                  {saving ? (isCardSaved ? 'Removing...' : 'Saving...') : 
                   (user?.isAdmin || user?.role === 'admin' || user?.role === 'superadmin') ? 'Admin' :
                   isCardSaved ? 'Remove' : 'Save this card'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {isAppointmentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl w-[90%] max-w-sm p-5 relative">
              <button className="absolute top-3 right-3 text-gray-500" onClick={() => setIsAppointmentOpen(false)} aria-label="Close">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold mb-3">Book Appointment</h3>
              {!effectiveCardId ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">This card is in preview mode. Please save the card first to enable appointment booking.</p>
                  <button onClick={() => setIsAppointmentOpen(false)} className="px-4 py-2 bg-gray-600 text-white rounded-lg">
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitAppointment} className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Name</label>
                  <input value={apptName} onChange={(e) => setApptName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input type="email" value={apptEmail} onChange={(e) => setApptEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Phone</label>
                  <input value={apptPhone} onChange={(e) => setApptPhone(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="+91 90000 00000" />
                </div>
                <div>
                  <label className="block text-sm mb-1">Message</label>
                  <textarea value={apptMessage} onChange={(e) => setApptMessage(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Tell us briefly about your requirement" />
                </div>
                <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </form>
              )}
            </div>
          </div>
        )}

        {/* User Authentication Modal */}
        <UserAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          cardId={cardId}
        />

        {/* Admin Notification Modal */}
        <AdminNotificationModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
        />

        {/* Unsave Confirmation Modal */}
        <UnsaveConfirmModal
          isOpen={showUnsaveModal}
          onClose={() => setShowUnsaveModal(false)}
          onConfirm={handleUnsaveConfirm}
          cardTitle={normalized.company || 'Business Card'}
        />
      </div>
    </div>
  );
};

export default CustomisedCardRenderer;
