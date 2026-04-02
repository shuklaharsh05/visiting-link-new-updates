import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Eye, 
  EyeOff, 
  Upload, 
  Palette, 
  GripVertical,
  Settings,
  Image as ImageIcon,
  Type,
  ChevronDown,
  ChevronUp,
  Navigation
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

// Sortable Section Component
const SortableSection = ({ 
  sectionId, 
  sectionInfo, 
  isVisible, 
  onToggleVisibility, 
  onOpenMediaForIcon,
  onRemoveSectionIcon,
  sectionIcon 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 border rounded-lg bg-white transition-all ${
        isDragging ? 'shadow-lg border-blue-300 opacity-50' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <span className="text-2xl">{sectionInfo.icon}</span>
          <div>
            <h4 className="font-medium text-gray-900">{sectionInfo.label}</h4>
            <p className="text-sm text-gray-500">Section ID: {sectionId}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Section Icon Upload */}
          <button
            type="button"
            onClick={() => onOpenMediaForIcon(sectionId)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center space-x-1"
          >
            <ImageIcon className="h-3 w-3" />
            <span>Icon</span>
          </button>
          
          {/* Visibility Toggle */}
          <button
            type="button"
            onClick={() => onToggleVisibility(sectionId)}
            className={`flex items-center space-x-1 px-3 py-1 rounded text-sm ${
              isVisible 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            {isVisible ? (
              <>
                <Eye className="h-4 w-4" />
                <span>Visible</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Hidden</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      
      {/* Show selected section icon */}
      {sectionIcon && (
        <div className="mt-3 flex items-center space-x-2">
          <span className="text-sm text-gray-600">Section Icon:</span>
          <div className="relative">
            <img 
              src={sectionIcon} 
              alt={`${sectionId} icon`} 
              className="h-8 w-8 object-contain rounded border"
            />
            <button
              type="button"
              onClick={() => onRemoveSectionIcon(sectionId)}
              className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full h-4 w-4 text-xs"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Collapsible Section Component
const CollapsibleSection = ({ 
  title, 
  sectionKey, 
  isExpanded, 
  onToggle, 
  children,
  icon: Icon,
  className = ""
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-xl"
      >
        <div className="flex items-center space-x-2">
          {Icon && <Icon className="h-5 w-5 text-gray-600" />}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-600" />
        )}
      </button>
      {isExpanded && (
        <div className="px-6 pb-6">
          {children}
        </div>
      )}
    </div>
  );
};

const CustomisedCardBuilder = ({ 
  cardData, 
  onCardDataChange, 
  onCustomizationChange,
  customizations = {},
  mediaOpen,
  setMediaOpen,
  setMediaTargetField
}) => {
  const { success: showSuccess, error: showError } = useToast();
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Default sections that can be reordered and toggled
  const defaultSections = [
    { id: 'about', name: 'About', label: 'About Section', icon: '👤' },
    { id: 'services', name: 'Services', label: 'Services Section', icon: '🛠️' },
    { id: 'products', name: 'Products', label: 'Products Section', icon: '🛍️' },
    { id: 'achievements', name: 'Achievements', label: 'Achievements Section', icon: '🏆' },
    { id: 'clients', name: 'Clients', label: 'Clients Section', icon: '👥' },
    { id: 'team', name: 'Team', label: 'Team Section', icon: '👨‍💼' },
    { id: 'contact', name: 'Contact', label: 'Contact Section', icon: '📞' },
    { id: 'social', name: 'Social', label: 'Follow Us Section', icon: '🔗' },
    { id: 'testimonials', name: 'Testimonials', label: 'Testimonials Section', icon: '⭐' }
  ];

  // Initialize customizations with defaults
  const [localCustomizations, setLocalCustomizations] = useState({
    coverImage: '',
    coverImages: [],
    backgroundImage: '',
    sectionIcons: {},
    textColors: {
      heading: '#111827',
      paragraph: '#374151'
    },
    sectionOrder: defaultSections.map(s => s.id),
    sectionVisibility: defaultSections.reduce((acc, section) => {
      acc[section.id] = true;
      return acc;
    }, {}),
    ...customizations
  });

  const [newCertTag, setNewCertTag] = useState('');

  // State to track which sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    sectionHeadings: false,
    mediaImages: false,
    sectionManagement: false,
    headerAbout: false,
    quickStats: false,
    certifications: false,
    achievements: false,
    services: false,
    products: false,
    clients: false,
    features: false,
    affiliation: false,
    socialLinks: false,
    officeApps: false,
    founderTeam: false,
    gallery: false,
    contact: false,
    appLinks: false,
    testimonials: false,
    youtubeVideo: false,
    callToAction: false,
    textColors: false,
  });

  // Refs for scrolling to sections
  const sectionRefs = useRef({});

  // All available sections for navigation dropdown
  const navigationSections = [
    { key: 'sectionHeadings', label: 'Section Headings' },
    { key: 'mediaImages', label: 'Media & Images' },
    { key: 'sectionManagement', label: 'Section Order & Visibility' },
    { key: 'headerAbout', label: 'Header & About' },
    { key: 'quickStats', label: 'Quick Stats' },
    { key: 'certifications', label: 'Certifications' },
    { key: 'achievements', label: 'Achievements' },
    { key: 'services', label: 'Services' },
    { key: 'products', label: 'Products' },
    { key: 'clients', label: 'Clients' },
    { key: 'features', label: 'Features' },
    { key: 'affiliation', label: 'Affiliation' },
    { key: 'socialLinks', label: 'Social Links' },
    { key: 'officeApps', label: 'Office & Apps' },
    { key: 'founderTeam', label: 'Founder & Team' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'contact', label: 'Contact' },
    { key: 'appLinks', label: 'App Links' },
    { key: 'testimonials', label: 'Client Testimonials' },
    { key: 'youtubeVideo', label: 'YouTube Video' },
    { key: 'callToAction', label: 'Call to Action' },
    { key: 'textColors', label: 'Text Colors' },
  ];

  // Function to navigate to a section
  const navigateToSection = (sectionKey) => {
    // Expand the section if it's collapsed
    if (!expandedSections[sectionKey]) {
      setExpandedSections(prev => ({
        ...prev,
        [sectionKey]: true
      }));
    }
    
    // Scroll to the section
    setTimeout(() => {
      const sectionElement = sectionRefs.current[sectionKey];
      if (sectionElement) {
        sectionElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  // Toggle section expansion
  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Update parent when local customizations change
  useEffect(() => {
    onCustomizationChange(localCustomizations);
  }, [localCustomizations, onCustomizationChange]);

  // Ensure newly added default sections (e.g., 'testimonials') appear in order/visibility
  useEffect(() => {
    setLocalCustomizations(prev => {
      const desiredIds = defaultSections.map(s => s.id);
      const currentOrder = Array.isArray(prev.sectionOrder) ? [...prev.sectionOrder] : [];
      let changed = false;
      // Append any missing default sections to the end
      desiredIds.forEach(id => {
        if (!currentOrder.includes(id)) {
          currentOrder.push(id);
          changed = true;
        }
      });
      // Ensure visibility map has keys for all default sections
      const currentVisibility = { ...(prev.sectionVisibility || {}) };
      desiredIds.forEach(id => {
        if (currentVisibility[id] === undefined) {
          currentVisibility[id] = true;
          changed = true;
        }
      });
      if (!changed) return prev;
      return { ...prev, sectionOrder: currentOrder, sectionVisibility: currentVisibility };
    });
  }, [defaultSections]);

  // Keep local coverImages in sync with upstream props (preview thumbnails)
  useEffect(() => {
    const upstream = (cardData?.customCardData?.coverImages && Array.isArray(cardData.customCardData.coverImages))
      ? cardData.customCardData.coverImages
      : (Array.isArray(customizations?.coverImages) ? customizations.coverImages : []);
    setLocalCustomizations(prev => {
      if (JSON.stringify(prev.coverImages || []) === JSON.stringify(upstream)) return prev;
      return { ...prev, coverImages: upstream };
    });
  }, [cardData?.customCardData?.coverImages, customizations?.coverImages]);

  // Keep local backgroundImage in sync with upstream props (removed to prevent infinite loop)
  // We read directly from cardData instead

  // Handle drag and drop reordering
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setLocalCustomizations(prev => ({
        ...prev,
        sectionOrder: arrayMove(prev.sectionOrder, prev.sectionOrder.indexOf(active.id), prev.sectionOrder.indexOf(over.id))
      }));
      // mirror order into customCardData.layout.sectionOrder
      onCardDataChange && onCardDataChange(prev => ({
        ...(prev || {}),
        customCardData: {
          ...(prev?.customCardData || {}),
          layout: {
            ...(prev?.customCardData?.layout || {}),
            sectionOrder: (prev?.customCardData?.layout?.sectionOrder && prev.customCardData.layout.sectionOrder.length > 0)
              ? arrayMove(prev.customCardData.layout.sectionOrder, prev.customCardData.layout.sectionOrder.indexOf(active.id), prev.customCardData.layout.sectionOrder.indexOf(over.id))
              : prev?.customCardData?.layout?.sectionOrder || []
          }
        }
      }));
    }
  };

  // Toggle section visibility
  const toggleSectionVisibility = (sectionId) => {
    setLocalCustomizations(prev => ({
      ...prev,
      sectionVisibility: {
        ...prev.sectionVisibility,
        [sectionId]: !prev.sectionVisibility[sectionId]
      }
    }));
    // Mirror into customCardData.layout.hiddenSections (false => hidden)
    onCardDataChange && onCardDataChange(prev => {
      const current = prev?.customCardData || {};
      const layout = current.layout || {};
      const hidden = Array.isArray(layout.hiddenSections) ? [...layout.hiddenSections] : [];
      const isHidden = hidden.includes(sectionId);
      const nextHidden = isHidden ? hidden.filter(s => s !== sectionId) : [...hidden, sectionId];
      return {
        ...(prev || {}),
        customCardData: {
          ...current,
          layout: { ...layout, hiddenSections: nextHidden }
        }
      };
    });
  };

  // Handle media selection for different types
  const openMediaForCustomization = (type, sectionId = null) => {
    setMediaTargetField(`custom_${type}${sectionId ? `_${sectionId}` : ''}`);
    setMediaOpen(true);
  };

  // Handle media selection callback
  const handleMediaSelect = (media) => {
    if (!mediaTargetField) return;
    
    const fieldParts = mediaTargetField.split('_');
    const type = fieldParts[1];
    const sectionId = fieldParts[2];

    setLocalCustomizations(prev => {
      const newCustomizations = { ...prev };
      
      if (type === 'cover') {
        // Maintain legacy single coverImage for backward compatibility
        newCustomizations.coverImage = media.url;
        // Handle multi-cover with index if provided, else append
        const idx = sectionId !== undefined ? parseInt(sectionId, 10) : undefined;
        const updatedCovers = Array.isArray(prev.coverImages) ? [...prev.coverImages] : [];
        if (!Number.isNaN(idx) && idx !== undefined) {
          updatedCovers[idx] = media.url;
        } else {
          updatedCovers.push(media.url);
        }
        newCustomizations.coverImages = updatedCovers;
        // mirror into customCardData
        onCardDataChange && onCardDataChange(prevData => {
          const cc = { ...(prevData?.customCardData || {}) };
          cc.coverImage = media.url; // legacy support
          cc.coverImages = updatedCovers;
          return { ...(prevData || {}), customCardData: cc };
        });
      } else if (type === 'background') {
        // Background image is stored directly in cardData, not in localCustomizations
        onCardDataChange && onCardDataChange(prevData => ({
          ...(prevData || {}),
          customCardData: {
            ...(prevData?.customCardData || {}),
            theme: {
              ...(prevData?.customCardData?.theme || {}),
              backgroundImage: media.url
            }
          }
        }));
      } else if (type === 'product') {
        const idx = parseInt(sectionId, 10) || 0;
        onCardDataChange && onCardDataChange(prevData => {
          const cc = { ...(prevData?.customCardData || {}) };
          const arr = Array.isArray(cc.products) ? [...cc.products] : [];
          arr[idx] = { ...(arr[idx] || {}), image: media.url };
          cc.products = arr;
          return { ...(prevData || {}), customCardData: cc };
        });
      } else if (type === 'service') {
        const idx = parseInt(sectionId, 10) || 0;
        onCardDataChange && onCardDataChange(prevData => {
          const cc = { ...(prevData?.customCardData || {}) };
          const arr = Array.isArray(cc.services) ? [...cc.services] : [];
          arr[idx] = { ...(arr[idx] || {}), image: media.url };
          cc.services = arr;
          return { ...(prevData || {}), customCardData: cc };
        });
      } else if (type === 'feature') {
        const idx = parseInt(sectionId, 10) || 0;
        onCardDataChange && onCardDataChange(prevData => {
          const cc = { ...(prevData?.customCardData || {}) };
          const arr = Array.isArray(cc.features) ? [...cc.features] : [];
          arr[idx] = { ...(arr[idx] || {}), image: media.url };
          cc.features = arr;
          return { ...(prevData || {}), customCardData: cc };
        });
      } else if (type === 'gallery') {
        const idx = parseInt(sectionId, 10) || 0;
        onCardDataChange && onCardDataChange(prevData => {
          const cc = { ...(prevData?.customCardData || {}) };
          const arr = Array.isArray(cc.gallery) ? [...cc.gallery] : [];
          arr[idx] = media.url;
          cc.gallery = arr;
          return { ...(prevData || {}), customCardData: cc };
        });
      } else if (type === 'testimonialPhoto') {
        const idx = parseInt(sectionId, 10) || 0;
        onCardDataChange && onCardDataChange(prevData => {
          const cc = { ...(prevData?.customCardData || {}) };
          const arr = Array.isArray(cc.testimonials) ? [...cc.testimonials] : [];
          arr[idx] = { ...(arr[idx] || {}), image: media.url };
          cc.testimonials = arr;
          return { ...(prevData || {}), customCardData: cc };
        });
      } else if (type === 'testimonialTop') {
        onCardDataChange && onCardDataChange(prevData => ({
          ...(prevData || {}),
          customCardData: { ...(prevData?.customCardData || {}), testimonialsTopImage: media.url }
        }));
      } else if (type === 'testimonialBottom') {
        onCardDataChange && onCardDataChange(prevData => ({
          ...(prevData || {}),
          customCardData: { ...(prevData?.customCardData || {}), testimonialsBottomImage: media.url }
        }));
      } else if (type === 'profile') {
        onCardDataChange && onCardDataChange(prevData => ({
          ...(prevData || {}),
          customCardData: {
            ...(prevData?.customCardData || {}),
            profileImage: media.url
          }
        }));
      } else if (type === 'affiliation') {
        onCardDataChange && onCardDataChange(prevData => ({
          ...(prevData || {}),
          customCardData: {
            ...(prevData?.customCardData || {}),
            affiliation: {
              ...(prevData?.customCardData?.affiliation || {}),
              image: media.url
            }
          }
        }));
      } else if (type === 'clientsLogo') {
        const idx = parseInt(sectionId, 10) || 0;
        onCardDataChange && onCardDataChange(prevData => {
          const cc = { ...(prevData?.customCardData || {}) };
          const logos = cc.clients?.logos ? [...cc.clients.logos] : [];
          logos[idx] = media.url;
          cc.clients = { ...(cc.clients || {}), logos };
          return { ...(prevData || {}), customCardData: cc };
        });
      } else if (type === 'clientsGallery') {
        const idx = parseInt(sectionId, 10) || 0;
        onCardDataChange && onCardDataChange(prevData => {
          const cc = { ...(prevData?.customCardData || {}) };
          const gallery = cc.clients?.gallery ? [...cc.clients.gallery] : [];
          gallery[idx] = media.url;
          cc.clients = { ...(cc.clients || {}), gallery };
          return { ...(prevData || {}), customCardData: cc };
        });
      } else if (type === 'achievement') {
        const idx = parseInt(sectionId, 10) || 0;
        onCardDataChange && onCardDataChange(prevData => {
          const cc = { ...(prevData?.customCardData || {}) };
          const arr = Array.isArray(cc.achievements) ? [...cc.achievements] : [];
          arr[idx] = { ...(arr[idx] || {}), image: media.url };
          cc.achievements = arr;
          return { ...(prevData || {}), customCardData: cc };
        });
      } else if (type === 'teamPhoto') {
        const idx = parseInt(sectionId, 10) || 0;
        onCardDataChange && onCardDataChange(prevData => {
          const cc = { ...(prevData?.customCardData || {}) };
          const arr = Array.isArray(cc.team) ? [...cc.team] : [];
          arr[idx] = { ...(arr[idx] || {}), photo: media.url };
          cc.team = arr;
          return { ...(prevData || {}), customCardData: cc };
        });
      } else if (type === 'icon' && sectionId) {
        newCustomizations.sectionIcons = {
          ...prev.sectionIcons,
          [sectionId]: media.url
        };
      } else if (type === 'mapImage') {
        onCardDataChange && onCardDataChange(prevData => ({
          ...(prevData || {}),
          customCardData: {
            ...(prevData?.customCardData || {}),
            visitOffice: {
              ...(prevData?.customCardData?.visitOffice || {}),
              mapImage: media.url
            }
          }
        }));
      }
      
      return newCustomizations;
    });
  };

  // Remove section icon
  const removeSectionIcon = (sectionId) => {
    setLocalCustomizations(prev => ({
      ...prev,
      sectionIcons: {
        ...prev.sectionIcons,
        [sectionId]: ''
      }
    }));
  };

  // Handle color changes
  const handleColorChange = (colorType, color) => {
    setLocalCustomizations(prev => ({
      ...prev,
      textColors: {
        ...prev.textColors,
        [colorType]: color
      }
    }));
  };

  // Get section info by ID
  const getSectionInfo = (sectionId) => {
    return defaultSections.find(s => s.id === sectionId) || { id: sectionId, name: sectionId, label: sectionId, icon: '📄' };
  };

  return (
    <div className="space-y-6">
      {/* Header with Navigation Dropdown */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
            <Settings className="h-5 w-5" />
            <span>Customised Card Builder</span>
          </div>
          {/* <div className="relative">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Navigation className="h-4 w-4" />
              <span>Navigate to Section:</span>
            </label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  navigateToSection(e.target.value);
                  e.target.value = ''; // Reset dropdown
                }
              }}
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>Select a section...</option>
              {navigationSections.map((section) => (
                <option key={section.key} value={section.key}>
                  {section.label}
                </option>
              ))}
            </select>
          </div> */}
        </div>
      </div>

      <div className="bg-gray-200 p-2 rounded-xl space-y-2 border border-gray-100">
        
          {/* Section Headings */}
          <div ref={(el) => sectionRefs.current['sectionHeadings'] = el}>
            <CollapsibleSection
              title="Section Headings"
              sectionKey="sectionHeadings"
              isExpanded={expandedSections.sectionHeadings}
              onToggle={toggleSection}
              icon={Type}
            >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'about', label: 'About Section', default: 'About' },
                { key: 'services', label: 'Services Section', default: 'Services' },
                { key: 'products', label: 'Products Section', default: 'Products' },
                { key: 'gallery', label: 'Gallery Section', default: 'Gallery' },
                { key: 'achievements', label: 'Achievements Section', default: 'Achievements' },
                { key: 'clients', label: 'Clients Section', default: 'Our Clients' },
                { key: 'team', label: 'Team Section', default: 'Our Team' },
                { key: 'contact', label: 'Contact Section', default: 'Contact' },
                { key: 'socialLinks', label: 'Social Links Section', default: 'Follow Us' },
                { key: 'testimonials', label: 'Testimonials Section', default: 'Testimonials' }
              ].map(({ key, label, default: defaultValue }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input 
                    className="w-full px-3 py-2 border rounded" 
                    placeholder={defaultValue}
                    value={cardData?.customCardData?.sectionHeadings?.[key] || ''}
                    onChange={(e)=> onCardDataChange(prev => ({ 
                      ...(prev||{}), 
                      customCardData: { 
                        ...(prev?.customCardData||{}), 
                        sectionHeadings: { 
                          ...(prev?.customCardData?.sectionHeadings||{}), 
                          [key]: e.target.value 
                        } 
                      } 
                    }))}
                  />
                </div>
              ))}
            </div>
          </CollapsibleSection>
          </div>

          {/* Media Uploads Section */}
          <div ref={(el) => sectionRefs.current['mediaImages'] = el}>
            <CollapsibleSection
            title="Media & Images"
            sectionKey="mediaImages"
            isExpanded={expandedSections.mediaImages}
            onToggle={toggleSection}
            icon={ImageIcon}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cover Images (multiple) */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Cover Images
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => openMediaForCustomization('cover', String((localCustomizations.coverImages || []).length))}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Add Cover</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {(localCustomizations.coverImages || []).map((url, idx) => (
                      <div key={`cover-${idx}`} className="relative">
                        <img 
                          src={url} 
                          alt={`Cover ${idx+1}`} 
                          className="h-16 w-16 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLocalCustomizations(prev => {
                              const arr = Array.isArray(prev.coverImages) ? [...prev.coverImages] : [];
                              arr.splice(idx, 1);
                              return { ...prev, coverImages: arr };
                            });
                            onCardDataChange && onCardDataChange(prev => {
                              const cc = { ...(prev?.customCardData || {}) };
                              const next = Array.isArray(cc.coverImages) ? [...cc.coverImages] : [];
                              next.splice(idx, 1);
                              cc.coverImages = next;
                              return { ...(prev || {}), customCardData: cc };
                            });
                          }}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Background Image */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Background Image
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => openMediaForCustomization('background')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Select Background</span>
                  </button>
                  {cardData?.customCardData?.theme && 
                   'backgroundImage' in cardData.customCardData.theme &&
                   cardData.customCardData.theme.backgroundImage !== null &&
                   cardData.customCardData.theme.backgroundImage !== undefined &&
                   typeof cardData.customCardData.theme.backgroundImage === 'string' && 
                   cardData.customCardData.theme.backgroundImage.trim() !== '' && (
                    <div className="relative">
                      <img 
                        src={cardData.customCardData.theme.backgroundImage} 
                        alt="Background" 
                        className="h-16 w-16 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          // Remove backgroundImage by setting it to null (persists in MongoDB)
                          onCardDataChange && onCardDataChange(prev => {
                            const currentCustomCardData = prev?.customCardData || {};
                            const currentTheme = currentCustomCardData.theme || {};
                            
                            return {
                              ...(prev || {}),
                              customCardData: {
                                ...currentCustomCardData,
                                theme: {
                                  ...currentTheme,
                                  backgroundImage: null // Set to null to mark as explicitly removed
                                }
                              }
                            };
                          });
                        }}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 text-xs flex items-center justify-center hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className='mt-6 space-y-3'>
                {/* Background Color */}
                <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Background Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={cardData?.customCardData?.theme?.backgroundColor || '#ffffff'}
                    onChange={(e) => onCardDataChange(prev => ({
                      ...(prev || {}),
                      customCardData: {
                        ...(prev?.customCardData || {}),
                        theme: {
                          ...(prev?.customCardData?.theme || {}),
                          backgroundColor: e.target.value
                        }
                      }
                    }))}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={cardData?.customCardData?.theme?.backgroundColor || '#ffffff'}
                    onChange={(e) => onCardDataChange(prev => ({
                      ...(prev || {}),
                      customCardData: {
                        ...(prev?.customCardData || {}),
                        theme: {
                          ...(prev?.customCardData?.theme || {}),
                          backgroundColor: e.target.value
                        }
                      }
                    }))}
                    className="flex-1 px-3 py-2 border rounded"
                    placeholder="#ffffff"
                  />
                  <button
                    type="button"
                    onClick={() => onCardDataChange(prev => ({
                      ...(prev || {}),
                      customCardData: {
                        ...(prev?.customCardData || {}),
                        theme: {
                          ...(prev?.customCardData?.theme || {}),
                          backgroundColor: ''
                        }
                      }
                    }))}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Background Gradient */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Background Gradient
                </label>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={cardData?.customCardData?.theme?.gradientStart || '#000000'}
                        onChange={(e) => onCardDataChange(prev => ({
                          ...(prev || {}),
                          customCardData: {
                            ...(prev?.customCardData || {}),
                            theme: {
                              ...(prev?.customCardData?.theme || {}),
                              gradientStart: e.target.value
                            }
                          }
                        }))}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cardData?.customCardData?.theme?.gradientStart || ''}
                        onChange={(e) => onCardDataChange(prev => ({
                          ...(prev || {}),
                          customCardData: {
                            ...(prev?.customCardData || {}),
                            theme: {
                              ...(prev?.customCardData?.theme || {}),
                              gradientStart: e.target.value
                            }
                          }
                        }))}
                        className="flex-1 px-2 py-2 border rounded text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={cardData?.customCardData?.theme?.gradientEnd || '#ffffff'}
                        onChange={(e) => onCardDataChange(prev => ({
                          ...(prev || {}),
                          customCardData: {
                            ...(prev?.customCardData || {}),
                            theme: {
                              ...(prev?.customCardData?.theme || {}),
                              gradientEnd: e.target.value
                            }
                          }
                        }))}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cardData?.customCardData?.theme?.gradientEnd || ''}
                        onChange={(e) => onCardDataChange(prev => ({
                          ...(prev || {}),
                          customCardData: {
                            ...(prev?.customCardData || {}),
                            theme: {
                              ...(prev?.customCardData?.theme || {}),
                              gradientEnd: e.target.value
                            }
                          }
                        }))}
                        className="flex-1 px-2 py-2 border rounded text-sm"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-gray-600 mb-1">Direction</label>
                  <select
                    value={cardData?.customCardData?.theme?.gradientDirection || 'to bottom'}
                    onChange={(e) => onCardDataChange(prev => ({
                      ...(prev || {}),
                      customCardData: {
                        ...(prev?.customCardData || {}),
                        theme: {
                          ...(prev?.customCardData?.theme || {}),
                          gradientDirection: e.target.value
                        }
                      }
                    }))}
                    className="w-full px-3 py-2 border rounded text-sm"
                  >
                    <option value="to bottom">Top to Bottom</option>
                    <option value="to top">Bottom to Top</option>
                    <option value="to right">Left to Right</option>
                    <option value="to left">Right to Left</option>
                    <option value="to bottom right">Top Left to Bottom Right</option>
                    <option value="to bottom left">Top Right to Bottom Left</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => onCardDataChange(prev => ({
                    ...(prev || {}),
                    customCardData: {
                      ...(prev?.customCardData || {}),
                      theme: {
                        ...(prev?.customCardData?.theme || {}),
                        gradientStart: '',
                        gradientEnd: '',
                        gradientDirection: ''
                      }
                    }
                  }))}
                  className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                >
                  Clear Gradient
                </button>
              </div>
            </div>
          </CollapsibleSection>
          </div>

          {/* Section Management */}
          <div ref={(el) => sectionRefs.current['sectionManagement'] = el}>
            <CollapsibleSection
            title="Section Order & Visibility"
            sectionKey="sectionManagement"
            isExpanded={expandedSections.sectionManagement}
            onToggle={toggleSection}
            icon={GripVertical}
          >
            <p className="text-sm text-gray-600 mb-4">
              Toggle visibility to show/hide sections.
            </p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localCustomizations.sectionOrder}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {localCustomizations.sectionOrder.map((sectionId) => {
                    const sectionInfo = getSectionInfo(sectionId);
                    const isVisible = localCustomizations.sectionVisibility[sectionId];
                    const sectionIcon = localCustomizations.sectionIcons[sectionId];
                    
                    return (
                      <SortableSection
                        key={sectionId}
                        sectionId={sectionId}
                        sectionInfo={sectionInfo}
                        isVisible={isVisible}
                        onToggleVisibility={toggleSectionVisibility}
                        onOpenMediaForIcon={(id) => openMediaForCustomization('icon', id)}
                        onRemoveSectionIcon={removeSectionIcon}
                        sectionIcon={sectionIcon}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </CollapsibleSection>
          </div> 
      </div>

      <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
        {/* <Settings className="h-5 w-5" /> */}
        <span>Customised Card Fields</span>
      </div>

      {/* Header & About (custom card fields) */}
      <div ref={(el) => sectionRefs.current['headerAbout'] = el}>
        <CollapsibleSection
        title="Header & About"
        sectionKey="headerAbout"
        isExpanded={expandedSections.headerAbout}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              className="w-full px-3 py-2 border rounded"
              value={cardData?.customCardData?.companyName || ''}
              onChange={(e)=> onCardDataChange(prev => ({
                ...(prev||{}),
                customCardData: { ...(prev?.customCardData||{}), companyName: e.target.value }
              }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tagline</label>
            <input
              className="w-full px-3 py-2 border rounded"
              value={cardData?.customCardData?.tagline || ''}
              onChange={(e)=> onCardDataChange(prev => ({
                ...(prev||{}),
                customCardData: { ...(prev?.customCardData||{}), tagline: e.target.value }
              }))}
            />
          </div>

          {/* Profile image selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Profile Image</label>
            <div className="flex items-center space-x-3">
              <button type="button" onClick={() => openMediaForCustomization('profile')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Select Profile</span>
              </button>
              {cardData?.customCardData?.profileImage && (
                <img src={cardData.customCardData.profileImage} alt="profile" className="h-12 w-12 rounded-full object-cover border" />
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">About Description</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border rounded"
              value={cardData?.customCardData?.about?.description || ''}
              onChange={(e)=> onCardDataChange(prev => ({
                ...(prev||{}),
                customCardData: {
                  ...(prev?.customCardData||{}),
                  about: { ...(prev?.customCardData?.about||{}), description: e.target.value }
                }
              }))}
            />
          </div>
        </div>
      </CollapsibleSection>
      </div>
      
      {/* Quick Stats (after About) */}
      <div ref={(el) => sectionRefs.current['quickStats'] = el}>
        <CollapsibleSection
          title="Quick Stats"
          sectionKey="quickStats"
          isExpanded={expandedSections.quickStats}
          onToggle={toggleSection}
        >
        <p className="text-xs text-gray-500 mb-2">Add items like Projects Done, Happy Clients etc.</p>
        <div className="space-y-3">
          {(cardData?.customCardData?.stats || []).map((item, idx) => (
            <div key={`stat-${idx}`} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <input className="px-3 py-2 border rounded" placeholder="Label (e.g., Projects)" value={item.label || ''} onChange={(e)=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.stats)?[...cc.stats]:[]; arr[idx] = { ...(arr[idx]||{}), label: e.target.value }; cc.stats = arr; return { ...(prev||{}), customCardData: cc}; })} />
              <input className="px-3 py-2 border rounded" placeholder="Value (e.g., 120+)" value={item.value || ''} onChange={(e)=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.stats)?[...cc.stats]:[]; arr[idx] = { ...(arr[idx]||{}), value: e.target.value }; cc.stats = arr; return { ...(prev||{}), customCardData: cc}; })} />
              <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=(cc.stats||[]).filter((_,i)=>i!==idx); cc.stats = arr; return { ...(prev||{}), customCardData: cc}; })} className="px-3 py-2 bg-red-600 text-white rounded">Remove</button>
            </div>
          ))}
          <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.stats)?[...cc.stats]:[]; arr.push({ label:'', value:'' }); cc.stats = arr; return { ...(prev||{}), customCardData: cc}; })} className="px-3 py-1 bg-gray-800 text-white rounded">Add Stat</button>
        </div>
      </CollapsibleSection>
      </div>


      {/* Certifications */}
      <div ref={(el) => sectionRefs.current['certifications'] = el}>
        <CollapsibleSection
          title="Certifications"
          sectionKey="certifications"
          isExpanded={expandedSections.certifications}
          onToggle={toggleSection}
        >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea rows={2} className="w-full px-3 py-2 border rounded" value={cardData?.customCardData?.certifications?.description || ''} onChange={(e)=> onCardDataChange(prev => ({ ...(prev||{}), customCardData: { ...(prev?.customCardData||{}), certifications: { ...(prev?.customCardData?.certifications||{}), description: e.target.value } } }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tags</label>
            <div className="flex gap-2 mb-2">
              <input className="flex-1 px-3 py-2 border rounded" placeholder="Add a tag" value={newCertTag} onChange={(e)=> setNewCertTag(e.target.value)} />
              <button type="button" onClick={()=> {
                const trimmed = (newCertTag || '').trim();
                if (!trimmed) return;
                onCardDataChange(prev => {
                  const cc = { ...(prev?.customCardData || {}) };
                  const cert = { ...(cc.certifications || {}) };
                  const tags = Array.isArray(cert.tags) ? [...cert.tags] : [];
                  tags.push(trimmed);
                  cert.tags = tags;
                  cc.certifications = cert;
                  return { ...(prev || {}), customCardData: cc };
                });
                setNewCertTag('');
              }} className="px-3 py-2 bg-gray-800 text-white rounded">Add</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(cardData?.customCardData?.certifications?.tags || []).map((tag, idx) => (
                <span key={`ctag-${idx}`} className="inline-flex items-center gap-2 px-2 py-1 text-xs rounded-full border bg-white">
                  {tag}
                  <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const cert={...(cc.certifications||{})}; const tags=Array.isArray(cert.tags)?[...cert.tags]:[]; tags.splice(idx,1); cert.tags = tags; cc.certifications = cert; return { ...(prev||{}), customCardData: cc}; })} className="text-red-600">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>
      </div>
      
      {/* Achievements Grid */}
      <div ref={(el) => sectionRefs.current['achievements'] = el}>
        <CollapsibleSection
        title="Achievements"
        sectionKey="achievements"
        isExpanded={expandedSections.achievements}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          {(cardData?.customCardData?.achievements || []).map((item, idx) => (
            <div key={`ach-${idx}`} className="flex items-center space-x-3">
              <button type="button" onClick={()=>openMediaForCustomization('achievement', String(idx))} className="px-3 py-1 bg-purple-600 text-white rounded">Select Image</button>
              <input
                className="flex-1 px-3 py-2 border rounded"
                placeholder="Title"
                value={item?.title || ''}
                onChange={(e)=> onCardDataChange(prev => { const cc = { ...(prev?.customCardData||{}) }; const arr = Array.isArray(cc.achievements)?[...cc.achievements]:[]; arr[idx] = { ...(arr[idx]||{}), title: e.target.value }; cc.achievements = arr; return { ...(prev||{}), customCardData: cc }; })}
              />
              <button type="button" onClick={()=> onCardDataChange(prev => { const cc = { ...(prev?.customCardData||{}) }; const arr = (cc.achievements||[]).filter((_,i)=>i!==idx); cc.achievements = arr; return { ...(prev||{}), customCardData: cc }; })} className="px-2 py-1 bg-red-600 text-white rounded">Remove</button>
            </div>
          ))}
          <button type="button" onClick={()=> onCardDataChange(prev => { const cc = { ...(prev?.customCardData||{}) }; const arr = Array.isArray(cc.achievements)?[...cc.achievements]:[]; arr.push({ image:'', title:'' }); cc.achievements = arr; return { ...(prev||{}), customCardData: cc }; })} className="px-3 py-1 bg-gray-800 text-white rounded">Add Achievement</button>
        </div>
      </CollapsibleSection>
      </div>

      
      {/* Services */}
      <div ref={(el) => sectionRefs.current['services'] = el}>
        <CollapsibleSection
        title="Services"
        sectionKey="services"
        isExpanded={expandedSections.services}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          {(cardData?.customCardData?.services || []).map((service, idx) => (
            <div key={`srv-${idx}`} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Image</label>
                  <button type="button" onClick={()=>openMediaForCustomization('service', String(idx))} className="px-3 py-1 bg-purple-600 text-white rounded">Select Image</button>
                  {service?.image && <img src={service.image} alt="service" className="h-16 w-24 object-cover border rounded mt-2" />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                  <input 
                    className="w-full px-3 py-2 border rounded" 
                    placeholder="Service Name" 
                    value={service?.name || ''}
                    onChange={(e)=> onCardDataChange(prev => { 
                      const cc = { ...(prev?.customCardData||{}) }; 
                      const arr = Array.isArray(cc.services)?[...cc.services]:[]; 
                      arr[idx] = { ...(arr[idx]||{}), name: e.target.value }; 
                      cc.services = arr; 
                      return { ...(prev||{}), customCardData: cc }; 
                    })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <input 
                    className="w-full px-3 py-2 border rounded" 
                    placeholder="Price" 
                    value={service?.price || ''}
                    onChange={(e)=> onCardDataChange(prev => { 
                      const cc = { ...(prev?.customCardData||{}) }; 
                      const arr = Array.isArray(cc.services)?[...cc.services]:[]; 
                      arr[idx] = { ...(arr[idx]||{}), price: e.target.value }; 
                      cc.services = arr; 
                      return { ...(prev||{}), customCardData: cc }; 
                    })}
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    type="button" 
                    onClick={()=> onCardDataChange(prev => { 
                      const cc = { ...(prev?.customCardData||{}) }; 
                      const arr = (cc.services||[]).filter((_,i)=>i!==idx); 
                      cc.services = arr; 
                      return { ...(prev||{}), customCardData: cc }; 
                    })} 
                    className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  className="w-full px-3 py-2 border rounded" 
                  placeholder="Service description" 
                  rows="2"
                  value={service?.description || ''}
                  onChange={(e)=> onCardDataChange(prev => { 
                    const cc = { ...(prev?.customCardData||{}) }; 
                    const arr = Array.isArray(cc.services)?[...cc.services]:[]; 
                    arr[idx] = { ...(arr[idx]||{}), description: e.target.value }; 
                    cc.services = arr; 
                    return { ...(prev||{}), customCardData: cc }; 
                  })}
                />
              </div>
            </div>
          ))}
          <button 
            type="button" 
            onClick={()=> onCardDataChange(prev => { 
              const cc = { ...(prev?.customCardData||{}) }; 
              const arr = Array.isArray(cc.services)?[...cc.services]:[]; 
              arr.push({ name: '', description: '', price: '' }); 
              cc.services = arr; 
              return { ...(prev||{}), customCardData: cc }; 
            })} 
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
          >
            Add Service
          </button>
        </div>
      </CollapsibleSection>
      </div>

      {/* Products */}
      <div ref={(el) => sectionRefs.current['products'] = el}>
        <CollapsibleSection
        title="Products"
        sectionKey="products"
        isExpanded={expandedSections.products}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          {(cardData?.customCardData?.products || []).map((product, idx) => (
            <div key={`prd-${idx}`} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                  <button type="button" onClick={()=>openMediaForCustomization('product', String(idx))} className="px-3 py-1 bg-purple-600 text-white rounded">Select Image</button>
                  {product?.image && <img src={product.image} alt="product" className="h-16 w-24 object-cover border rounded mt-2" />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Link</label>
                  <input 
                    className="w-full px-3 py-2 border rounded" 
                    placeholder="https://..." 
                    value={product?.link || ''}
                    onChange={(e)=> onCardDataChange(prev => { 
                      const cc = { ...(prev?.customCardData||{}) }; 
                      const arr = Array.isArray(cc.products)?[...cc.products]:[]; 
                      arr[idx] = { ...(arr[idx]||{}), link: e.target.value }; 
                      cc.products = arr; 
                      return { ...(prev||{}), customCardData: cc }; 
                    })}
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    type="button" 
                    onClick={()=> onCardDataChange(prev => { 
                      const cc = { ...(prev?.customCardData||{}) }; 
                      const arr = (cc.products||[]).filter((_,i)=>i!==idx); 
                      cc.products = arr; 
                      return { ...(prev||{}), customCardData: cc }; 
                    })} 
                    className="w-full px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button 
            type="button" 
            onClick={()=> onCardDataChange(prev => { 
              const cc = { ...(prev?.customCardData||{}) }; 
              const arr = Array.isArray(cc.products)?[...cc.products]:[]; 
              arr.push({ image: '', link: '' }); 
              cc.products = arr; 
              return { ...(prev||{}), customCardData: cc }; 
            })} 
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
          >
            Add Product
          </button>
        </div>
      </CollapsibleSection>
      </div>

      {/* Clients */}
      <div ref={(el) => sectionRefs.current['clients'] = el}>
        <CollapsibleSection
        title="Clients"
        sectionKey="clients"
        isExpanded={expandedSections.clients}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Logos</h4>
            <div className="space-y-2">
              {(cardData?.customCardData?.clients?.logos || []).map((url, idx) => (
                <div key={`logo-${idx}`} className="flex items-center space-x-3">
                  <button type="button" onClick={()=>openMediaForCustomization('clientsLogo', String(idx))} className="px-3 py-1 bg-purple-600 text-white rounded">Select Logo</button>
                  {url && <img src={url} alt="logo" className="h-8 w-16 object-contain border rounded" />}
                  <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=(cc.clients?.logos||[]).filter((_,i)=>i!==idx); cc.clients={...(cc.clients||{}), logos: arr}; return { ...(prev||{}), customCardData: cc}; })} className="px-2 py-1 bg-red-600 text-white rounded">Remove</button>
                </div>
              ))}
              <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr = cc.clients?.logos ? [...cc.clients.logos] : []; arr.push(''); cc.clients={...(cc.clients||{}), logos: arr}; return { ...(prev||{}), customCardData: cc}; })} className="px-3 py-1 bg-gray-800 text-white rounded">Add Logo</button>
            </div>
          </div>
          {/* <div>
            <h4 className="text-sm font-medium mb-2">Gallery</h4>
            <div className="space-y-2">
              {(cardData?.customCardData?.clients?.gallery || []).map((url, idx) => (
                <div key={`gal-${idx}`} className="flex items-center space-x-3">
                  <button type="button" onClick={()=>openMediaForCustomization('clientsGallery', String(idx))} className="px-3 py-1 bg-purple-600 text-white rounded">Select Image</button>
                  {url && <img src={url} alt="gallery" className="h-10 w-16 object-cover border rounded" />}
                  <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=(cc.clients?.gallery||[]).filter((_,i)=>i!==idx); cc.clients={...(cc.clients||{}), gallery: arr}; return { ...(prev||{}), customCardData: cc}; })} className="px-2 py-1 bg-red-600 text-white rounded">Remove</button>
                </div>
              ))}
              <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr = cc.clients?.gallery ? [...cc.clients.gallery] : []; arr.push(''); cc.clients={...(cc.clients||{}), gallery: arr}; return { ...(prev||{}), customCardData: cc}; })} className="px-3 py-1 bg-gray-800 text-white rounded">Add Image</button>
            </div>
          </div> */}
        </div>
      </CollapsibleSection>
      </div>


      {/* Features */}
      <div ref={(el) => sectionRefs.current['features'] = el}>
        <CollapsibleSection
        title="Features"
        sectionKey="features"
        isExpanded={expandedSections.features}
        onToggle={toggleSection}
      >
        <div className="space-y-3">
          {(cardData?.customCardData?.features || []).map((f, idx) => (
            <div key={`feat-${idx}`} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <button type="button" onClick={()=>openMediaForCustomization('feature', String(idx))} className="px-3 py-1 bg-purple-600 text-white rounded">Select Image</button>
                {f?.image && <img src={f.image} alt="feature" className="h-16 w-24 object-cover border rounded mt-2" />}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                <input className="w-full px-3 py-2 border rounded" placeholder="Feature text" value={f?.text || ''} onChange={(e)=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.features)?[...cc.features]:[]; arr[idx] = { ...(arr[idx]||{}), text: e.target.value }; cc.features = arr; return { ...(prev||{}), customCardData: cc}; })} />
              </div>
              <div className="md:col-span-3">
                <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=(cc.features||[]).filter((_,i)=>i!==idx); cc.features = arr; return { ...(prev||{}), customCardData: cc}; })} className="px-2 py-1 bg-red-600 text-white rounded">Remove</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.features)?[...cc.features]:[]; arr.push({ image:'', text:'' }); cc.features = arr; return { ...(prev||{}), customCardData: cc}; })} className="px-3 py-1 bg-gray-800 text-white rounded">Add Feature</button>
        </div>
      </CollapsibleSection>
      </div>


      {/* Affiliation (image + text) */}
      <div ref={(el) => sectionRefs.current['affiliation'] = el}>
        <CollapsibleSection
        title="Affiliation"
        sectionKey="affiliation"
        isExpanded={expandedSections.affiliation}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Affiliation Image</label>
            <div className="flex items-center space-x-3">
              <button type="button" onClick={()=> openMediaForCustomization('affiliation')} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Select Image</span>
              </button>
              {cardData?.customCardData?.affiliation?.image && (
                <img src={cardData.customCardData.affiliation.image} alt="affiliation" className="h-12 w-16 object-cover border rounded" />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Affiliation Text</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border rounded"
              value={cardData?.customCardData?.affiliation?.text || ''}
              onChange={(e)=> onCardDataChange(prev => ({
                ...(prev||{}),
                customCardData: {
                  ...(prev?.customCardData||{}),
                  affiliation: { ...(prev?.customCardData?.affiliation||{}), text: e.target.value }
                }
              }))}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Affiliation Link</label>
          <input
            type="url"
            className="w-full px-3 py-2 border rounded"
            placeholder="https://example.com"
            value={cardData?.customCardData?.affiliation?.link || ''}
            onChange={(e)=> onCardDataChange(prev => ({
              ...(prev||{}),
              customCardData: {
                ...(prev?.customCardData||{}),
                affiliation: { ...(prev?.customCardData?.affiliation||{}), link: e.target.value }
              }
            }))}
          />
          <p className="text-xs text-gray-500 mt-1">URL for the "Visit Us" button in affiliation section</p>
        </div>
      </CollapsibleSection>
      </div>

      {/* Social Links */}
      <div ref={(el) => sectionRefs.current['socialLinks'] = el}>
        <CollapsibleSection
        title="Social Links"
        sectionKey="socialLinks"
        isExpanded={expandedSections.socialLinks}
        onToggle={toggleSection}
      >
        {['instagram','linkedin','facebook','youtube','twitter','behance','pinterest'].map((k)=> (
          <div key={k} className="mb-3">
            <label className="block text-sm font-medium text-gray-700 capitalize">{k}</label>
            <input className="w-full px-3 py-2 border rounded" value={cardData?.customCardData?.socialLinks?.[k] || ''} onChange={(e)=> onCardDataChange(prev => ({ ...(prev||{}), customCardData: { ...(prev?.customCardData||{}), socialLinks: { ...(prev?.customCardData?.socialLinks||{}), [k]: e.target.value } } }))} />
          </div>
        ))}
      </CollapsibleSection>
      </div>

      {/* Visit Office & App Links */}
      <div ref={(el) => sectionRefs.current['officeApps'] = el}>
        <CollapsibleSection
        title="Office & Apps"
        sectionKey="officeApps"
        isExpanded={expandedSections.officeApps}
        onToggle={toggleSection}
      >
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700">Map URL</label>
          <input className="w-full px-3 py-2 border rounded" value={cardData?.customCardData?.visitOffice?.mapUrl || ''} onChange={(e)=> onCardDataChange(prev => ({ ...(prev||{}), customCardData: { ...(prev?.customCardData||{}), visitOffice: { ...(prev?.customCardData?.visitOffice||{}), mapUrl: e.target.value } } }))} />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Map Image
          </label>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => openMediaForCustomization('mapImage')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>Select Map Image</span>
            </button>
            {cardData?.customCardData?.visitOffice?.mapImage && 
             cardData.customCardData.visitOffice.mapImage.trim() !== '' && (
              <div className="relative">
                <img 
                  src={cardData.customCardData.visitOffice.mapImage} 
                  alt="Map" 
                  className="h-16 w-16 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => {
                    onCardDataChange && onCardDataChange(prev => {
                      const currentCustomCardData = prev?.customCardData || {};
                      const currentVisitOffice = currentCustomCardData.visitOffice || {};
                      return {
                        ...(prev || {}),
                        customCardData: {
                          ...currentCustomCardData,
                          visitOffice: {
                            ...currentVisitOffice,
                            mapImage: ''
                          }
                        }
                      };
                    });
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Leave empty to use default map image</p>
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700">Landmark Address</label>
          <input 
            className="w-full px-3 py-2 border rounded" 
            placeholder="Address displayed after 'Your Landmark' heading"
            value={cardData?.customCardData?.visitOffice?.address || ''} 
            onChange={(e)=> onCardDataChange(prev => ({ 
              ...(prev||{}), 
              customCardData: { 
                ...(prev?.customCardData||{}), 
                visitOffice: { 
                  ...(prev?.customCardData?.visitOffice||{}), 
                  address: e.target.value 
                } 
              } 
            }))} 
          />
          <p className="text-xs text-gray-500 mt-1">Address text to display after "Your Landmark" heading</p>
        </div>
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Headquarters</h4>
          <div className="space-y-3">
            {(cardData?.customCardData?.headquarters || []).map((hq, idx) => (
              <div key={`hq-${idx}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <input className="px-3 py-2 border rounded" placeholder="Name" value={hq?.name || ''} onChange={(e)=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.headquarters)?[...cc.headquarters]:[]; arr[idx] = { ...(arr[idx]||{}), name: e.target.value }; cc.headquarters = arr; return { ...(prev||{}), customCardData: cc}; })} />
                <input className="px-3 py-2 border rounded" placeholder="Address" value={hq?.address || ''} onChange={(e)=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.headquarters)?[...cc.headquarters]:[]; arr[idx] = { ...(arr[idx]||{}), address: e.target.value }; cc.headquarters = arr; return { ...(prev||{}), customCardData: cc}; })} />
                <input className="px-3 py-2 border rounded" placeholder="Map URL" value={hq?.mapUrl || ''} onChange={(e)=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.headquarters)?[...cc.headquarters]:[]; arr[idx] = { ...(arr[idx]||{}), mapUrl: e.target.value }; cc.headquarters = arr; return { ...(prev||{}), customCardData: cc}; })} />
                <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=(cc.headquarters||[]).filter((_,i)=>i!==idx); cc.headquarters = arr; return { ...(prev||{}), customCardData: cc}; })} className="px-3 py-2 bg-red-600 text-white rounded">Remove</button>
              </div>
            ))}
            <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.headquarters)?[...cc.headquarters]:[]; arr.push({ name:'', address:'', mapUrl:'' }); cc.headquarters = arr; return { ...(prev||{}), customCardData: cc}; })} className="px-3 py-1 bg-gray-800 text-white rounded">Add Headquarters</button>
          </div>
        </div>
       
      </CollapsibleSection>
      </div>

      {/* Founder & Team */}
      <div ref={(el) => sectionRefs.current['founderTeam'] = el}>
        <CollapsibleSection
        title="Founder & Team"
        sectionKey="founderTeam"
        isExpanded={expandedSections.founderTeam}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Founder Name</label>
            <input className="w-full px-3 py-2 border rounded" value={cardData?.customCardData?.founder?.name || ''} onChange={(e)=> onCardDataChange(prev => ({ ...(prev||{}), customCardData: { ...(prev?.customCardData||{}), founder: { ...(prev?.customCardData?.founder||{}), name: e.target.value } } }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Founder Position</label>
            <input className="w-full px-3 py-2 border rounded" value={cardData?.customCardData?.founder?.position || ''} onChange={(e)=> onCardDataChange(prev => ({ ...(prev||{}), customCardData: { ...(prev?.customCardData||{}), founder: { ...(prev?.customCardData?.founder||{}), position: e.target.value } } }))} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Founder Message</label>
            <textarea rows={3} className="w-full px-3 py-2 border rounded" value={cardData?.customCardData?.founder?.message || ''} onChange={(e)=> onCardDataChange(prev => ({ ...(prev||{}), customCardData: { ...(prev?.customCardData||{}), founder: { ...(prev?.customCardData?.founder||{}), message: e.target.value } } }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Founder Photo</label>
            <button type="button" onClick={()=>openMediaForCustomization('teamPhoto', 'founder') } className="px-3 py-1 bg-purple-600 text-white rounded">Select Photo</button>
          </div>
        </div>
        <div className="space-y-3">
          {(cardData?.customCardData?.team || []).map((m, idx) => (
            <div key={`member-${idx}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
              <button type="button" onClick={()=>openMediaForCustomization('teamPhoto', String(idx))} className="px-3 py-1 bg-purple-600 text-white rounded">Photo</button>
              <input className="px-3 py-2 border rounded" placeholder="Name" value={m?.name || ''} onChange={(e)=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.team)?[...cc.team]:[]; arr[idx] = { ...(arr[idx]||{}), name: e.target.value }; cc.team = arr; return { ...(prev||{}), customCardData: cc}; })} />
              <input className="px-3 py-2 border rounded" placeholder="Role" value={m?.role || ''} onChange={(e)=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.team)?[...cc.team]:[]; arr[idx] = { ...(arr[idx]||{}), role: e.target.value }; cc.team = arr; return { ...(prev||{}), customCardData: cc}; })} />
              <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=(cc.team||[]).filter((_,i)=>i!==idx); cc.team = arr; return { ...(prev||{}), customCardData: cc}; })} className="px-2 py-1 bg-red-600 text-white rounded">Remove</button>
            </div>
          ))}
          <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.team)?[...cc.team]:[]; arr.push({ name:'', role:'', photo:'' }); cc.team=arr; return { ...(prev||{}), customCardData: cc}; })} className="px-3 py-1 bg-gray-800 text-white rounded">Add Team Member</button>
        </div>
      </CollapsibleSection>
      </div>

      {/* Gallery (masonry) */}
      <div ref={(el) => sectionRefs.current['gallery'] = el}>
        <CollapsibleSection
        title="Gallery"
        sectionKey="gallery"
        isExpanded={expandedSections.gallery}
        onToggle={toggleSection}
      >
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Gallery Link</label>
          <input
            className="w-full px-3 py-2 border rounded"
            placeholder="https://..."
            value={cardData?.customCardData?.galleryLink || ''}
            onChange={(e)=> onCardDataChange(prev => ({
              ...(prev||{}),
              customCardData: { ...(prev?.customCardData||{}), galleryLink: e.target.value }
            }))}
          />
        </div>
        <div className="space-y-2">
          {(cardData?.customCardData?.gallery || []).map((url, idx) => (
            <div key={`gal-${idx}`} className="flex items-center gap-3">
              <button type="button" onClick={()=>openMediaForCustomization('gallery', String(idx))} className="px-3 py-1 bg-purple-600 text-white rounded">Change Image</button>
              {url && <img src={url} alt="gallery" className="h-16 w-24 object-cover rounded border" />}
              <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=(cc.gallery||[]).filter((_,i)=>i!==idx); cc.gallery = arr; return { ...(prev||{}), customCardData: cc}; })} className="px-2 py-1 bg-red-600 text-white rounded">Remove</button>
            </div>
          ))}
          <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.gallery)?[...cc.gallery]:[]; arr.push(''); cc.gallery = arr; return { ...(prev||{}), customCardData: cc}; })} className="px-3 py-1 bg-gray-800 text-white rounded">Add Image</button>
        </div>
      </CollapsibleSection>
      </div>

      
      {/* Contact */}
      <div ref={(el) => sectionRefs.current['contact'] = el}>
        <CollapsibleSection
        title="Contact"
        sectionKey="contact"
        isExpanded={expandedSections.contact}
        onToggle={toggleSection}
      >
        {['email','phone','website','location','whatsapp'].map((k)=> (
          <div key={k} className="mb-3">
            <label className="block text-sm font-medium text-gray-700 capitalize">{k}</label>
            <input className="w-full px-3 py-2 border rounded" value={cardData?.customCardData?.contact?.[k] || ''} onChange={(e)=> onCardDataChange(prev => ({ ...(prev||{}), customCardData: { ...(prev?.customCardData||{}), contact: { ...(prev?.customCardData?.contact||{}), [k]: e.target.value } } }))} />
          </div>
        ))}
      </CollapsibleSection>
      </div>

      {/* App Links */}
      <div ref={(el) => sectionRefs.current['appLinks'] = el}>
        <CollapsibleSection
        title="App Links"
        sectionKey="appLinks"
        isExpanded={expandedSections.appLinks}
        onToggle={toggleSection}
      >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">App Store</label>
            <input className="w-full px-3 py-2 border rounded" value={cardData?.customCardData?.appLinks?.appStore || ''} onChange={(e)=> onCardDataChange(prev => ({ ...(prev||{}), customCardData: { ...(prev?.customCardData||{}), appLinks: { ...(prev?.customCardData?.appLinks||{}), appStore: e.target.value } } }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Play Store</label>
            <input className="w-full px-3 py-2 border rounded" value={cardData?.customCardData?.appLinks?.playStore || ''} onChange={(e)=> onCardDataChange(prev => ({ ...(prev||{}), customCardData: { ...(prev?.customCardData||{}), appLinks: { ...(prev?.customCardData?.appLinks||{}), playStore: e.target.value } } }))} />
          </div>
        </div>
      </CollapsibleSection>
      </div>

      {/* Testimonials */}
      <div ref={(el) => sectionRefs.current['testimonials'] = el}>
        <CollapsibleSection
        title="Client Testimonials"
        sectionKey="testimonials"
        isExpanded={expandedSections.testimonials}
        onToggle={toggleSection}
      >
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center gap-2">
            <button type="button" onClick={()=> openMediaForCustomization('icon', 'testimonials')} className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Section Icon</button>
            {localCustomizations.sectionIcons?.testimonials && (
              <div className="flex items-center gap-2">
                <img src={localCustomizations.sectionIcons.testimonials} alt="testimonials icon" className="h-6 w-6 object-contain rounded border" />
                <button type="button" onClick={()=> removeSectionIcon('testimonials')} className="text-xs text-red-600">Remove</button>
              </div>
            )}
          </div>
        </div>
        {/* Testimonial Top and Bottom Images - Commented out */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Top Decoration Image</label>
            <button type="button" onClick={()=> openMediaForCustomization('testimonialTop')} className="px-3 py-1 bg-purple-600 text-white rounded">Select Image</button>
            {cardData?.customCardData?.testimonialsTopImage && (
              <img src={cardData.customCardData.testimonialsTopImage} alt="top" className="h-16 w-24 object-cover border rounded mt-2" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bottom Decoration Image</label>
            <button type="button" onClick={()=> openMediaForCustomization('testimonialBottom')} className="px-3 py-1 bg-purple-600 text-white rounded">Select Image</button>
            {cardData?.customCardData?.testimonialsBottomImage && (
              <img src={cardData.customCardData.testimonialsBottomImage} alt="bottom" className="h-16 w-24 object-cover border rounded mt-2" />
            )}
          </div>
        </div> */}
        <div className="space-y-4">
          {(cardData?.customCardData?.testimonials || []).map((t, idx) => (
            <div key={`t-${idx}`} className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Person Image</label>
                  <button type="button" onClick={()=> openMediaForCustomization('testimonialPhoto', String(idx))} className="px-3 py-1 bg-purple-600 text-white rounded">Select Image</button>
                  {t?.image && <img src={t.image} alt="person" className="h-16 w-16 object-cover rounded-full border mt-2" />}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input className="w-full px-3 py-2 border rounded" value={t?.name || ''} onChange={(e)=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.testimonials)?[...cc.testimonials]:[]; arr[idx] = { ...(arr[idx]||{}), name: e.target.value }; cc.testimonials = arr; return { ...(prev||{}), customCardData: cc}; })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                  <input className="w-full px-3 py-2 border rounded" value={t?.rating || ''} onChange={(e)=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.testimonials)?[...cc.testimonials]:[]; arr[idx] = { ...(arr[idx]||{}), rating: e.target.value }; cc.testimonials = arr; return { ...(prev||{}), customCardData: cc}; })} />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=(cc.testimonials||[]).filter((_,i)=>i!==idx); cc.testimonials = arr; return { ...(prev||{}), customCardData: cc}; })} className="w-full px-3 py-2 bg-red-600 text-white rounded">Remove</button>
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                <textarea rows={2} className="w-full px-3 py-2 border rounded" value={t?.text || ''} onChange={(e)=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.testimonials)?[...cc.testimonials]:[]; arr[idx] = { ...(arr[idx]||{}), text: e.target.value }; cc.testimonials = arr; return { ...(prev||{}), customCardData: cc}; })} />
              </div>
            </div>
          ))}
          <button type="button" onClick={()=> onCardDataChange(prev => { const cc={...(prev?.customCardData||{})}; const arr=Array.isArray(cc.testimonials)?[...cc.testimonials]:[]; arr.push({ image:'', name:'', text:'', rating:'' }); cc.testimonials = arr; return { ...(prev||{}), customCardData: cc}; })} className="px-3 py-1 bg-gray-800 text-white rounded">Add Testimonial</button>
        </div>
      </CollapsibleSection>
      </div>

      {/* YouTube Video */}
      <div ref={(el) => sectionRefs.current['youtubeVideo'] = el}>
        <CollapsibleSection
          title="YouTube Video"
          sectionKey="youtubeVideo"
          isExpanded={expandedSections.youtubeVideo}
          onToggle={toggleSection}
        >
        <div>
          <label className="block text-sm font-medium text-gray-700">YouTube Video URL</label>
          <input 
            className="w-full px-3 py-2 border rounded" 
            placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
            value={cardData?.customCardData?.youtubeVideo?.url || ''} 
            onChange={(e)=> onCardDataChange(prev => ({ 
              ...(prev||{}), 
              customCardData: { 
                ...(prev?.customCardData||{}), 
                youtubeVideo: { 
                  ...(prev?.customCardData?.youtubeVideo||{}), 
                  url: e.target.value 
                } 
              } 
            }))} 
          />
          <p className="text-xs text-gray-500 mt-1">Enter the full YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID)</p>
        </div>
      </CollapsibleSection>
      </div>

      {/* Call to Action */}
      <div ref={(el) => sectionRefs.current['callToAction'] = el}>
        <CollapsibleSection
          title="Call to Action"
          sectionKey="callToAction"
          isExpanded={expandedSections.callToAction}
          onToggle={toggleSection}
        >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">CTA Title</label>
            <input 
              className="w-full px-3 py-2 border rounded" 
              placeholder="Ready for Your Next Adventure?"
              value={cardData?.customCardData?.finalCTA?.ctaTitle || ''} 
              onChange={(e)=> onCardDataChange(prev => ({ 
                ...(prev||{}), 
                customCardData: { 
                  ...(prev?.customCardData||{}), 
                  finalCTA: { 
                    ...(prev?.customCardData?.finalCTA||{}), 
                    ctaTitle: e.target.value 
                  } 
                } 
              }))} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">CTA Subtitle</label>
            <input 
              className="w-full px-3 py-2 border rounded" 
              placeholder="Contact Us Today!!"
              value={cardData?.customCardData?.finalCTA?.ctaSubtitle || ''} 
              onChange={(e)=> onCardDataChange(prev => ({ 
                ...(prev||{}), 
                customCardData: { 
                  ...(prev?.customCardData||{}), 
                  finalCTA: { 
                    ...(prev?.customCardData?.finalCTA||{}), 
                    ctaSubtitle: e.target.value 
                  } 
                } 
              }))} 
            />
          </div>
        </div>
      </CollapsibleSection>
      </div>
     
      
      {/* Color Customization */}
      <div ref={(el) => sectionRefs.current['textColors'] = el}>
        <CollapsibleSection
          title="Text Colors"
          sectionKey="textColors"
          isExpanded={expandedSections.textColors}
          onToggle={toggleSection}
          icon={Palette}
        >
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Heading Color */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Type className="h-4 w-4" />
              <span>Heading Color</span>
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={localCustomizations.textColors.heading}
                onChange={(e) => handleColorChange('heading', e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={localCustomizations.textColors.heading}
                onChange={(e) => handleColorChange('heading', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#111827"
              />
            </div>
          </div>

          {/* Paragraph Color */}
          <div className="space-y-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Type className="h-4 w-4" />
              <span>Paragraph Color</span>
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={localCustomizations.textColors.paragraph}
                onChange={(e) => handleColorChange('paragraph', e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={localCustomizations.textColors.paragraph}
                onChange={(e) => handleColorChange('paragraph', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#374151"
              />
            </div>
          </div>
        </div>
      </CollapsibleSection>
      </div>


      {/* Customization Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Customization Summary</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Cover Image: {localCustomizations.coverImage ? 'Set' : 'Not set'}</p>
          <p>• Background Image: {localCustomizations.backgroundImage ? 'Set' : 'Not set'}</p>
          <p>• Section Icons: {Object.keys(localCustomizations.sectionIcons).filter(key => localCustomizations.sectionIcons[key]).length} set</p>
          <p>• Hidden Sections: {Object.values(localCustomizations.sectionVisibility).filter(visible => !visible).length}</p>
          <p>• Section Order: {localCustomizations.sectionOrder.join(' → ')}</p>
        </div>
      </div>
    </div>
  );
};
export default CustomisedCardBuilder;