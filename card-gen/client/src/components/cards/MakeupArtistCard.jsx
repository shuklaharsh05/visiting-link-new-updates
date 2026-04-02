import React, { useState, useEffect } from 'react';
import AppointmentModal from '../AppointmentModal.jsx';
import UserAuthModal from '../UserAuthModal.jsx';
import AdminNotificationModal from '../AdminNotificationModal.jsx';
import UnsaveConfirmModal from '../UnsaveConfirmModal.jsx';
import { useAuth } from '../../contexts/AuthContext';
import { saveCard, getSavedCards, removeSavedCard } from '../../api/auth';
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Sparkles,
  Facebook,
  Instagram,
  Linkedin,
  MessageCircle,
  Star,
  Camera,
  Award,
  Users,
  Heart,
  Calendar,
  ExternalLink,
  Map,
  DollarSign,
  Image as ImageIcon,
  Quote,
  Loader2,
  Check
} from 'lucide-react';

const MakeupArtistCard = ({ cardData, hiddenFields = [], cardId }) => {
  const { user, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showUnsaveModal, setShowUnsaveModal] = useState(false);
  const [isCardSaved, setIsCardSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedCards, setSavedCards] = useState([]);

  const getFieldValue = (fieldName, fallback = 'Not provided') => {
    const value = cardData[fieldName];
    // If the value is an object, return the fallback instead of the object
    if (typeof value === 'object' && value !== null) {
      return fallback;
    }
    return (!value || value === '') ? fallback : value;
  };

  const isFieldHidden = (fieldName) => hiddenFields.includes(fieldName);
  const isFieldEmpty = (fieldName) => !cardData[fieldName] || cardData[fieldName] === '';

  const ContactButton = ({ icon: Icon, label, href, isExternal = false }) => {
    if (!href || href === 'Not provided' || href === '') return null;
    
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : '_self'}
        rel={isExternal ? 'noopener noreferrer' : ''}
        className="flex items-center justify-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm"
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </a>
    );
  };

  const [isApptOpen, setIsApptOpen] = React.useState(false);
  const effectiveCardId = cardId || cardData?._id || cardData?.cardId;

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

  return (
    <div className="bg-[#1F1B24] border-2 border-pink-200 rounded-xl p-6 shadow-lg w-[24rem] mx-auto">
      {/* Hero Section */}
      <div className="mb-8 flex items-center gap-4">
        <div>
        {!isFieldHidden('profileImage') && cardData.profileImage && (
          <div className="w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-pink-300">
            <img src={cardData.profileImage} alt="Profile" className="w-full h-full object-cover" />
          </div>
        )}
        </div>
        <div>
          <h3 className="text-[22px] font-bold text-white mb-1">
            {getFieldValue('companyName', 'Company Name')}
          </h3>
          {!isFieldHidden('tagline') && (
            <p className={`text-sm ${isFieldEmpty('tagline') ? 'text-gray-400 italic' : 'text-white'}`}>
              {getFieldValue('tagline', 'Tagline')}
            </p>
          )}
        </div>
      </div>

      {/* About Us Section */}
      {!isFieldHidden('aboutUs') && (
        <div className="mb-4">
          <h4 className="text-xl font-bold text-white mb-2 flex items-center">
            <img height={16} width={16} src="/about-icon.svg" alt="About Us" className="mr-1 h-6 w-6" />
            About US
          </h4>
          <p className={`text-sm ${isFieldEmpty('aboutUs') ? 'text-gray-400 italic' : 'text-white'}`}>
            {getFieldValue('aboutUs', 'Not provided')}
          </p>
        </div>
      )}
      {/* Features */}
      {!isFieldHidden('features') && Array.isArray(cardData.features) && cardData.features.length > 0 && (
        <div className="mb-4 pt-2">
          <div className="grid grid-cols-3 gap-4">
            {cardData.features.map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 transition-all duration-300 group">
                {feature.image && (
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 transition-all duration-300">
                    <img src={feature.image} alt={feature.title} className="w-full h-full object-cover transition-transform duration-300" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white text-center group-hover:text-pink-300 transition-colors duration-300">{feature.title || 'Feature'}</p>
                  {feature.description && (
                    <p className="text-xs text-gray-300 whitespace-pre-wrap break-words text-center leading-[1.15] mt-1 group-hover:text-gray-200 transition-colors duration-300">{feature.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Certifications */}
      {!isFieldHidden('certifications') && (
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <h4 className="text-xl font-bold text-white flex items-center pr-2">
              <img height={16} width={16} src="/certified-icon.svg" alt="Certified" className="mr-1 h-6 w-6" />
              Certified
            </h4>
            {!isFieldHidden('certificationsText') && cardData.certificationsText && (
              <div className="border-l-2 border-pink-200">
                <p className="text-sm text-white px-2">
                  {cardData.certificationsText}
                </p>
              </div>
            )}
          </div>

          {Array.isArray(cardData.certifications) && cardData.certifications.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {cardData.certifications.map((cert, idx) => (
                <div key={idx} className="text-[12px] text-gray-800 bg-white rounded-full py-[1px] px-2 border border-pink-200 hover:bg-pink-400 hover:border-pink-800 hover:text-white transition-all duration-300">
                  {cert}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No certifications added yet</p>
          )}
        </div>
      )}

      {/* Our Work Section */}
      {!isFieldHidden('workImages') && Array.isArray(cardData.workImages) && cardData.workImages.length > 0 && (
        <div className="mb-6 pt-4 border-t border-pink-200">
          <div className='flex justify-between items-center mb-3'>
          <h4 className="text-xl font-bold text-white flex items-center">
          <img height={16} width={16} src="/our-work-icon.svg" alt="About Us" className="mr-1 h-6 w-6" />
            Our Work
          </h4>

          <a href={getFieldValue('website', 'Not provided')} className="text-xs text-white hover:text-pink-300 duration-300 hover:underline font-medium transition-colors">View All</a>     {/* Client's Website link will be added*/}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {cardData.workImages.map((url, idx) => (
              <div key={`${url}-${idx}`} className="w-full aspect-square overflow-hidden rounded-xl border border-pink-400 hover:shadow-lg hover:border-white transition-all duration-300 group">
                <img src={url} alt={`work-${idx}`} className="w-full h-full object-cover transition-transform duration-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services Section */}
      {!isFieldHidden('services') && (
        <div className="mb-6 pt-4 border-t border-pink-200">
          <div className='flex justify-between items-center mb-3'>
            <h4 className="text-xl font-bold text-white flex items-center">
            <img height={16} width={16} src="/services-icon.svg" alt="Services" className="mr-1 h-6 w-6" />
              Services
            </h4>
            <a href={getFieldValue('website', 'Not provided')} className="text-xs text-white hover:text-pink-300 duration-300 hover:underline font-medium transition-colors">View All</a>     {/* Client's Website link will be added*/}
          </div>
          {Array.isArray(cardData.services) && cardData.services.length > 0 ? (
            <div className="space-y-2">
              {cardData.services.map((service, idx) => (
                <div key={idx} className="rounded-lg p-3 flex items-center gap-4 justify-between hover:bg-[#ffffff23] hover:shadow-md transition-all duration-300 relative group">
                  <div className='flex items-center gap-4'>
                    {service.serviceImage && (
                      <div className="w-12 aspect-square rounded-full overflow-hidden">
                        <img src={service.serviceImage} alt={service.serviceName} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center gap-12">
                        <span className="text-base font-medium text-white">{service.serviceName || 'Service Name'}</span>
                      </div>
                      {service.serviceDescription && (
                        <p className="text-xs text-gray-300">{service.serviceDescription}</p>
                      )}
                    </div>
                  </div>
                  {service.price && (
                        <span className="text-base text-pink-100 font-semibold flex items-center absolute right-2 top-2">
                          {/* <img height={16} width={16} src="/ruppee.svg" alt="Price" className="h-4 w-4" /> */}
                          Rs. {service.price}
                        </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No services added yet</p>
          )}
        </div>
      )}



      {/* Follow Us Section */}
      {!isFieldHidden('socialLinks') && (
        <div className="mb-6 pt-4 border-t border-pink-200">
          <h4 className="text-xl font-bold text-white mb-4 flex items-center">
          <img height={16} width={16} src="/follow-us-icon.svg" alt="Follow Us" className="mr-1 h-6 w-6" />
            Follow Us
          </h4>
          {cardData.socialLinks && (cardData.socialLinks.instagram || cardData.socialLinks.linkedin || cardData.socialLinks.facebook) ? (
            <div className="grid grid-cols-2 justify-center gap-3">
              {cardData.socialLinks.instagram && (
                <a href={cardData.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-white font-bold bg-pink-600 rounded-full px-2 py-1 hover:bg-pink-700 hover:shadow-lg transition-all duration-300 active:scale-95 group">
                  <span className="flex items-center justify-start gap-4">
                  <Instagram className="h-5 w-5 transition-transform duration-300" />
                  Instagram
                  </span>
                </a>
              )}
              {cardData.socialLinks.linkedin && (
                <a href={cardData.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-white font-bold bg-blue-700 rounded-full px-2 py-1 hover:bg-blue-800 hover:shadow-lg transition-all duration-300 active:scale-95 group">
                  <span className="flex items-center justify-start gap-5">
                  <Linkedin className="h-5 w-5 transition-transform duration-300" />
                  Linkedin
                  </span>
                </a>
              )}
              {cardData.socialLinks.facebook && (
                <a href={cardData.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-white font-bold bg-blue-600 rounded-full px-2 py-1 hover:bg-blue-700 hover:shadow-lg transition-all duration-300 active:scale-95 group">
                  <span className="flex items-center justify-start gap-4">
                  <Facebook className="h-5 w-5 transition-transform duration-300" />
                  Facebook
                  </span>
                </a>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No social links added yet</p>
          )}
        </div>
      )}

      {/* Our Clients Section */}
      {!isFieldHidden('clientLogos') && (
        <div className="mb-6 pt-4 border-t border-pink-200">
          <h4 className="text-xl font-bold text-white mb-3 flex items-center">
          {/* <img height={16} width={16} src="/our-clients-icon.svg" alt="Our Clients" className="mr-1 h-6 w-6" /> */}
            Our Clients
          </h4>
          {Array.isArray(cardData.clientLogos) && cardData.clientLogos.length > 0 ? (
            <div className="flex gap-2 items-center overflow-x-auto scrollbar-hide">
              {cardData.clientLogos.map((url, idx) => (
                <div key={`${url}-${idx}`} className="h-16 min-w-[90px] flex items-center justify-center bg-white rounded border border-pink-200 hover:shadow-md hover:border-pink-300 transition-all duration-300">
                  <img src={url} alt={`client-${idx}`} className="max-h-full max-w-full object-contain" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No client logos added yet</p>
          )}
        </div>
      )}
      
      {/* Contact Us Section */}
      <div className="mb-4 pt-4 border-t border-pink-200">
        <h4 className="text-xl font-bold text-white mb-3 flex items-center">
          <img height={16} width={16} src="/contact-icon.svg" alt="Contact Us" className="mr-1 h-6 w-6" />
          Contact Us
        </h4>
        <div className="grid grid-cols-2 gap-2 mb-4 border-b border-pink-200 pb-4">
          {!isFieldHidden('email') && (
            <div className="flex items-center space-x-2 text-base border border-[#453268] rounded-lg bg-[#2E2438] px-4 py-2 hover:bg-[#3a2f47] hover:border-[#5a4178] hover:shadow-md transition-all duration-300 cursor-pointer group">
              <Mail className="h-5 w-5 text-pink-100 group-hover:scale-110 transition-transform duration-300" />
              <span className={`${isFieldEmpty('email') ? 'text-gray-400 italic' : 'text-white'}`}>
                <a href={`mailto:${getFieldValue('email', 'Not provided')}`} className="hover:text-pink-100 duration-300 group-hover:underline transition-colors">Email</a>
              </span>
            </div>
          )}
          
          {!isFieldHidden('phoneNumber') && (
            <div className="flex items-center space-x-2 text-base  border border-[#453268] rounded-lg bg-[#2E2438] px-4 py-2 hover:bg-[#3a2f47] hover:border-[#5a4178] hover:shadow-md transition-all duration-300 cursor-pointer group">
              <Phone className="h-4 w-4 text-pink-100 group-hover:scale-110 transition-transform duration-300" />
              <span className={`${isFieldEmpty('phoneNumber') ? 'text-gray-400 italic' : 'text-white'}`}>
                <a href={`tel:${getFieldValue('phoneNumber', 'Not provided')}`} className="hover:text-pink-100 duration-300 group-hover:underline transition-colors">Phone</a>
              </span>
            </div>
          )}

          {!isFieldHidden('website') && (
            <div className="flex items-center space-x-2 text-base  border border-[#453268] rounded-lg bg-[#2E2438] px-4 py-2 hover:bg-[#3a2f47] hover:border-[#5a4178] hover:shadow-md transition-all duration-300 cursor-pointer group">
              <Globe className="h-4 w-4 text-pink-100 group-hover:scale-110 transition-transform duration-300" />
              <span className={`${isFieldEmpty('website') ? 'text-gray-400 italic' : 'text-white'}`}>
                <a href={`${getFieldValue('website', 'Not provided')}`} className="hover:text-pink-100 duration-300 group-hover:underline transition-colors">Website</a>
              </span>
            </div>
          )}

          {!isFieldHidden('address') && (
            <div className="flex items-center space-x-2 text-base  border border-[#453268] rounded-lg bg-[#2E2438] px-4 py-2 hover:bg-[#3a2f47] hover:border-[#5a4178] hover:shadow-md transition-all duration-300 cursor-default group">
              <MapPin className="h-4 w-4 text-pink-100 group-hover:scale-110 transition-transform duration-300" />
              <span className={`${isFieldEmpty('address') ? 'text-gray-400 italic' : 'text-white'}`}>
                Address
              </span>
            </div>
          )}

          {/* {!isFieldHidden('mapEmbedLink') && cardData.mapEmbedLink && (
            <div className="mt-2">
              <ContactButton
                icon={Map}
                label="View Location"
                href={cardData.mapEmbedLink}
                isExternal={true}
              />
            </div>
          )} */}
        </div>

        {/* Map Section */}
        {!isFieldHidden('mapEmbedLink') && cardData.mapEmbedLink && (
          <div className="mt-4 flex gap-4">
            <img height={16} width={16} src="/map-img.png" alt="Map" className="w-[7.5rem]" />
            <div className="flex flex-col justify-center">
              <p className="text-white font-bold text-lg">Your Landmark</p>
              <p className="text-white text-[11px]">{getFieldValue('address', 'Not provided')}</p>
              <a href={cardData.mapEmbedLink} target="_blank" rel="noopener noreferrer" className="text-white text-sm font-medium bg-[#0157AD] rounded-full px-4 py-1 flex items-center gap-1 mt-3 w-fit hover:bg-[#014088] hover:shadow-lg transition-all duration-300 active:scale-95 group">
                <img height={16} width={16} src="/map-pin.svg" alt="Location" className="h-4 w-4 transition-transform duration-300" />
                Get Direction</a>
            </div>
          </div>
        )}

        {/* App Download Section */}
        {!isFieldHidden('appDownloadLink') && (cardData.appStoreUrl || cardData.playStoreUrl) && (
          <div className="flex gap-4 w-[90%] mx-auto mt-3 items-end justify-center">
            {cardData.appStoreUrl && (
              <a href={cardData.appStoreUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:drop-shadow-lg transition-all duration-300 active:scale-95 inline-block">
              <img height={16} width={16} src="/apple-download.svg" alt="App Download" className="w-36 transition-all duration-300" />
              </a>
            )}
            {cardData.playStoreUrl && (
              <a href={cardData.playStoreUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:drop-shadow-lg transition-all duration-300 active:scale-95 inline-block">
              <img height={16} width={16} src="/g-play-download.svg" alt="App Download" className="w-36 transition-all duration-300" />
              </a>
            )}
          </div>
        )}
      </div>




      {/* Founder Section */}
      {!isFieldHidden('founderName') && (
        <div className="mb-4 pt-4 border-t border-pink-200">
          {/* <h4 className="text-base font-semibold text-white mb-3 flex items-center">
            <User className="h-4 w-4 mr-1" />
            Founder
          </h4> */}
          <div className="bg-transparent rounded-lg">
            <div className="flex items-center gap-4 mb-4">
              {cardData.founderImage && (
                <div className="w-20 h-20 rounded-full overflow-hidden">
                  <img src={cardData.founderImage} alt="Founder" className="w-full h-full object-cover" />
                </div>
              )}
              <p className={`text-lg font-medium text-center ${isFieldEmpty('founderName') ? 'text-gray-400 italic' : 'text-white'}`}>
                {getFieldValue('founderName', 'Not provided')}
              </p>
            </div>
            <p className="text-sm font-medium text-white">
              Founder Message
            </p>
            {!isFieldHidden('founderDescription') && (
              <p className={`text-xs mt-1 ${isFieldEmpty('founderDescription') ? 'text-gray-400 italic' : 'text-white'}`}>
                {getFieldValue('founderDescription', 'Not provided')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Team Section */}
      {!isFieldHidden('teamMembers') && (
        <div className="mb-4">
          <h4 className="text-base font-semibold text-white mb-2 flex items-center">
            {/* <Users className="h-4 w-4 mr-1" /> */}
            Our Team
          </h4>
          {Array.isArray(cardData.teamMembers) && cardData.teamMembers.length > 0 ? (
            <div className="flex gap-2">
              {cardData.teamMembers.map((member, idx) => (
                <div key={idx} className="rounded-lg py-0.5 space-y-2 flex flex-col items-center">
                  {member.image && (
                    <div className="w-16 h-16 rounded-full overflow-hidden">
                      <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className='space-y-0.5'>
                    <p className="text-sm font-medium text-white text-center">{member.name || 'Team Member'}</p>
                    <p className="text-xs text-gray-300 text-center">{member.post || 'Position'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No team members added yet</p>
          )}
        </div>
      )}

      {/* Testimonials Section */}
      {!isFieldHidden('testimonials') && (
        <div className="mb-6 pt-4 border-t border-pink-200">
          <img height={16} width={16} src="/testimonials.png" alt="Testimonials" className="w-24 mx-auto" />
          {Array.isArray(cardData.testimonials) && cardData.testimonials.length > 0 ? (
            <div className="space-y-3 mt-4">
              {cardData.testimonials.map((testimonial, idx) => (
                <div key={idx} className="bg-transparent w-[85%] mx-auto">
                  <img src="/t-upper.svg" alt="Testimonial" className="w-full" />
                  <div className="flex items-center space-x-2 mb-2 pt-2">
                    {testimonial.image && (
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-white">{testimonial.name || 'Customer'}</p>
                      {testimonial.rating && (
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-2 w-2 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-white italic pb-2">"{testimonial.reviewText || 'Great service!'}"</p>
                  <img src="/t-bottom.svg" alt="Testimonial" className="w-full" />

                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No testimonials added yet</p>
          )}
        </div>
      )}



      {/* YouTube Video Section */}
      {!isFieldHidden('youtubeVideo') && getFieldValue('youtubeVideo') && (() => {
        const youtubeUrl = getFieldValue('youtubeVideo');
        const getYouTubeVideoId = (url) => {
          if (!url) return null;
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
          const match = url.match(regExp);
          return (match && match[2].length === 11) ? match[2] : null;
        };
        const videoId = getYouTubeVideoId(youtubeUrl);
        
        return videoId ? (
          <div className="mb-6 mt-8">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        ) : null;
      })()}

      {/* Call to Action Section */}
      {!isFieldHidden('ctaTitle') && (
        <div className="mb-12 pt-4 text-center">
          <p className="text-lg font-medium text-white mb-1">
            {getFieldValue('ctaTitle', 'Ready to Transform?')}
          </p>
          {!isFieldHidden('ctaSubtitle') && (
          <p className={`text-5xl font-bold mb-3 ${isFieldEmpty('ctaSubtitle') ? 'text-gray-400 italic' : 'text-white'}`}>
            {getFieldValue('ctaSubtitle', 'Not provided')}
          </p>
          )}
          {Array.isArray(cardData.buttons) && cardData.buttons.length > 0 && (
            <div className="space-y-2 mt-4">
              {cardData.buttons.map((button, idx) => (
                <ContactButton
                  key={idx}
                  icon={ExternalLink}
                  label={button.label}
                  href={button.link}
                  isExternal={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact Buttons */}
      {/* <div className="flex flex-col space-y-2">
        <ContactButton
          icon={Phone}
          label="Call"
          href={`tel:${cardData.phoneNumber || cardData.phone}`}
        />
        <ContactButton
          icon={Mail}
          label="Email"
          href={`mailto:${cardData.email}`}
        />
      </div> */}


      {/* Book Appointment Section */}
      <div className='mt-4 rounded-xl overflow-hidden'>
        <div className='space-y-2 bg-white py-4 px-6'>
          <p className='text-[#1D40B0] text-lg font-medium italic'>Ready to Grow Your Business?</p>
          <p className='text-sm text-black leading-[1.25]'>Get a free digital marketing consultation and discover how we can help accelerate your growth.</p>
          <button onClick={() => setIsApptOpen(true)} className="text-white font-semibold bg-black text-center rounded-full px-4 py-1 inline-block w-full mb-2 border hover:border-gray-800 hover:bg-white hover:text-black transition-all duration-300 active:scale-95">Book Appointment</button>
          <p className='text-xs text-black/80 text-center leading-[1.25] border-t border-black/40 pt-2'>Thank you for your interest! We'll contact you within 24 hours to discuss your digital marketing goals.</p>
        </div>
        <div className='px-6 py-4' style={{background: 'linear-gradient(to bottom, #1F42B1, #397EF1)'}}>
        <a href={`${cardData.website}`} className='text-blue-600 font-semibold bg-white border border-white text-center rounded-lg px-4 py-2 inline-block w-full mb-2 hover:bg-transparent hover:text-white transition-all duration-300 active:scale-95'>
          Visit Website
        </a>
        <a href={`tel:${cardData.phoneNumber}`} className='text-white font-semibold bg-[#ffffff38] border-2 border-white text-center rounded-lg px-4 py-1 inline-block w-full mb-2 hover:bg-transparent hover:text-white transition-all duration-300 active:scale-95'>
          Urgent ? Call Now
        </a>
        <button 
          onClick={handleSaveCard}
          disabled={saving || (user?.isAdmin || user?.role === 'admin' || user?.role === 'superadmin')}
          className={`text-white font-semibold border text-center rounded-lg px-4 py-1 inline-block w-full mb-2 transition-colors ${
            (user?.isAdmin || user?.role === 'admin' || user?.role === 'superadmin')
              ? 'bg-gray-400 border-gray-400 cursor-not-allowed'
              : isCardSaved 
                ? 'bg-green-600 border-green-600 hover:bg-green-700' 
                : 'bg-[#ffffff38] border-white hover:bg-[#ffffff50]'
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
               isCardSaved ? 'Remove' : 'Save Contact'}
            </span>
          </div>
        </button>
        </div>
      </div>
      <AppointmentModal isOpen={isApptOpen} onClose={() => setIsApptOpen(false)} cardId={effectiveCardId} />

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
        cardTitle={cardData?.companyName || 'Business Card'}
      />
    </div>
  );
};

export default MakeupArtistCard;
