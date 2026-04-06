import React, { useMemo } from "react";
import {
    Mail,
    Phone,
    Globe,
    MapPin,
    Facebook,
    Instagram,
    Twitter,
    Youtube,
    ExternalLink,
    FileText,
    Download,
} from "lucide-react";

const safeUrl = (v) => {
    if (!v || typeof v !== "string") return "";
    const s = v.trim();
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    // best-effort normalize for display/navigation
    return `https://${s}`;
};

const SocialIcon = ({ kind }) => {
    switch (kind) {
        case "instagram":
            return <Instagram className="h-4 w-4" />;
        case "facebook":
            return <Facebook className="h-4 w-4" />;
        case "youtube":
            return <Youtube className="h-4 w-4" />;
        case "twitter":
            return <Twitter className="h-4 w-4" />;
        default:
            return <ExternalLink className="h-4 w-4" />;
    }
};

export default function BasicInfo({ cardData = {}, hiddenFields = [] }) {
    const isHidden = (k) => hiddenFields?.includes?.(k);

    const socials = cardData?.socialLinks || {};
    const socialLinks = useMemo(() => {
        const rows = [
            { key: "instagram", label: "Instagram", url: socials.instagram },
            { key: "facebook", label: "Facebook", url: socials.facebook },
            { key: "behance", label: "Behance", url: socials.behance },
            { key: "youtube", label: "YouTube", url: socials.youtube },
            { key: "twitter", label: "Twitter", url: socials.twitter },
        ];
        return rows
            .map((r) => ({ ...r, url: safeUrl(r.url) }))
            .filter((r) => r.url);
    }, [socials]);

    const addresses = useMemo(() => {
        const v = cardData?.addresses;
        if (!Array.isArray(v)) return [];
        return v
            .map((a) => ({
                address: typeof a?.address === "string" ? a.address.trim() : "",
                mapLink: safeUrl(a?.mapLink),
            }))
            .filter((a) => a.address || a.mapLink);
    }, [cardData?.addresses]);

    const catalogueUrl = safeUrl(cardData?.catalogue);

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">

            {!isHidden("announcementType") && cardData?.announcementType ? (
                <div className="relative mt-4 rounded-2xl bg-black text-white/90 border border-white/15 px-6 pb-5 pt-7 text-xs font-medium">
                    {/* <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10">
                        <img src='/company-profile/bell.png' alt="Announcement" />
                    </div>
                    <p className="text-base font-medium mb-1.5">Announcement</p>
                    <span className="text-xs leading-[1.5]">{cardData.announcementType}</span>
                </div>
            ) : null}
            {/* Header */}
            <div className="relative bg-[#FCE9E3] px-5 pt-6 pb-5">

                <div className="mt-3 mb-6">
                    {!isHidden("name") && (
                        <div className="text-xl font-semibold text-black truncate">
                            {cardData?.name || "Your Name"}
                        </div>
                    )}
                    {!isHidden("businessType") && (
                        <div className="text-sm text-black mt-0.5 truncate">
                            {cardData?.businessType || "Business type"}
                        </div>
                    )}
                </div>

                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.9),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(236,72,153,0.8),transparent_40%)]" />
                <div className="relative flex items-start gap-4">
                    {!isHidden("media") && (cardData?.media || cardData?.image) ? (
                        <img
                            src={cardData.media || cardData.image}
                            alt={cardData?.name || "Profile"}
                            className="h-16 w-16 rounded-2xl object-cover ring-2 ring-white/20 shadow-lg"
                        />
                    ) : (
                        <div className="h-16 w-16 rounded-2xl bg-black ring-2 ring-white/10" />
                    )}

                    <div className="min-w-0 flex-1">

                        <div>
                            {!isHidden("number") && (
                                <div className="text-base font-medium text-black truncate">
                                    {cardData?.number || "Your Number"}
                                </div>
                            )}
                            {!isHidden("email") && (
                                <div className="text-base font-medium text-black truncate">
                                    {cardData?.email || "Your Email"}
                                </div>
                            )}
                            {!isHidden("website") && (
                                <div className="text-base font-medium text-black truncate">
                                    {cardData?.website || "Your Website"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-br from-[#9C9BC2] to-[#431D71] px-6 py-6 rounded-2xl">
                <div className="flex items-center justify-between">
                    <div>
                        <p>Hello!</p>
                        <p>Myself Visiting link</p>
                    </div>
                    <div>
                        <img src='/company-profile/share.png' alt="Profile" />
                    </div>
                </div>


                {/* Heading strip */}
                {!isHidden("heading") && cardData?.heading ? (
                    <div className="relative mt-5 rounded-xl">
                        <p className="font-semibold text-white text-4xl">{cardData.heading}</p>
                    </div>
                ) : null}
                {!isHidden("subHeading") && cardData?.subHeading ? (
                    <div className="text-xs text-white mt-2 line-clamp-2">
                        {cardData.subHeading}
                    </div>
                ) : null}
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">

                {/* Social Links Section */}
                {!isHidden("socialLinks") && cardData.socialLinks && (
                    <div className="mb-6 pt-4 px-4">
                        <h4 className="text-center text-xl font-bold text-black mb-4 flex items-center justify-center gap-2">
                            <span className="text-3xl">#</span>
                            All Social Media links
                        </h4>
                        <div className="grid grid-cols-3 gap-3 px-4">
                            {cardData.socialLinks.instagram && (
                                <a
                                    href={cardData.socialLinks.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className=""
                                >
                                    {/* <Instagram className="w-12 h-12" /> */}
                                    {/* <img src="/icons/instagram-icon.svg" alt="Instagram" className="w-12 h-12" />
                      <span>Instagram</span> */}
                                    <img src="/icons/insta.png" alt="Instagram" className="w-full h-full object-contain" />
                                </a>
                            )}
                            {cardData.socialLinks.linkedin && (
                                <a
                                    href={cardData.socialLinks.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className=""
                                >
                                    {/* <Linkedin className="w-12 h-12" /> */}
                                    <img src="/icons/li.png" alt="LinkedIn" className="w-full h-full object-contain" />
                                </a>
                            )}
                            {cardData.socialLinks.facebook && (
                                <a
                                    href={cardData.socialLinks.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className=""
                                >
                                    {/* <Facebook className="w-12 h-12" /> */}
                                    <img src="/icons/fb.png" alt="Facebook" className="w-full h-full object-contain" />
                                </a>
                            )}
                            {cardData.socialLinks.twitter && (
                                <a
                                    href={cardData.socialLinks.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className=""
                                >
                                    {/* <Twitter className="w-12 h-12" /> */}
                                    <img src="/icons/x.png" alt="Twitter" className="w-full h-full object-contain" />
                                </a>
                            )}
                            {cardData.socialLinks.youtube && (
                                <a
                                    href={cardData.socialLinks.youtube}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className=""
                                >
                                    {/* <Youtube className="w-12 h-12" /> */}
                                    <img src="/icons/yt.png" alt="YouTube" className="w-full h-full object-contain" />
                                    {/* <span>YouTube</span> */}
                                </a>
                            )}
                            {cardData.socialLinks.behance && (
                                <a
                                    href={cardData.socialLinks.behance}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center flex-col justify-center gap-1 px-4 py-1 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-colors"
                                >
                                    {/* <Behance className="w-12 h-12" /> */}
                                    <img src="/icons/behance-icon.svg" alt="Behance" className="w-14 h-14 mt-3" />
                                    <span className="text-[8px] font-semibold">Behance</span>
                                </a>
                            )}
                            {cardData.socialLinks.pinterest && (
                                <a
                                    href={cardData.socialLinks.pinterest}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center flex-col justify-center gap-1 px-4 py-1 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors"
                                >
                                    {/* <Pinterest className="w-12 h-12" /> */}
                                    <img src="/icons/pinterest-icon.svg" alt="Pinterest" className="w-14 h-14 mt-3 mb-1" />
                                    <span className="text-[8px] font-semibold">Pinterest</span>
                                </a>
                            )}

                        </div>


                        <div className="space-y-2 mt-7 max-w-80 mx-auto">
                            <a href={`tel:${cardData.number}`} className="flex items-center justify-center gap-2 rounded-xl bg-black text-white px-4 py-2">
                                <Phone className="h-4 w-4" />
                                <span className="text-sm font-light">Call Us</span>
                            </a>
                            <a href={`mailto:${cardData.email}`} className="flex items-center justify-center gap-2 rounded-xl bg-black text-white px-4 py-2">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm font-light">Email</span>
                            </a>
                            <a href={cardData.website} className="flex items-center justify-center gap-2 rounded-xl bg-black text-white px-4 py-2">
                                <Globe className="h-4 w-4" />
                                <span className="text-sm font-light">Website</span>
                            </a>
                        </div>

                    </div>
                )}

                <div>

                    {/* About */}
                    {!isHidden("aboutCompany") && cardData?.aboutCompany ? (
                        <div className="p-4">
                            <div className="text-xl text-center font-semibold text-gray-900">About My Company</div>
                            <div className="mt-2 text-[10px] leading-[1.5] text-center text-gray-700 whitespace-pre-line">
                                {cardData.aboutCompany}
                            </div>
                        </div>
                    ) : null}

                    {/* Founder */}
                    {(!isHidden("founderName") ||
                        !isHidden("founderImage") ||
                        !isHidden("founderDesignation")) &&
                        (cardData?.founderName || cardData?.founderImage || cardData?.founderDesignation) ? (
                        <div className="p-4">
                            {/* <div className="text-sm font-semibold text-gray-900">Founder</div> */}
                            <div className="flex items-center gap-3 px-8">
                                {!isHidden("founderImage") && cardData?.founderImage ? (
                                    <img
                                        src={cardData.founderImage}
                                        alt={cardData.founderName || "Founder"}
                                        className="min-h-28 min-w-28 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="min-h-28 min-w-28 rounded-full bg-gray-100" />
                                )}
                                <div className="min-w-0">
                                    {!isHidden("founderName") && (
                                        <div className="text-xl font-semibold leading-5 text-gray-900">
                                            {cardData.founderName || ""}
                                        </div>
                                    )}
                                    {!isHidden("founderDesignation") && (
                                        <div className="text-xs text-gray-500 truncate">
                                            {cardData.founderDesignation || ""}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Vision */}
                    {!isHidden("vision") && cardData?.vision ? (
                        <div className="rounded-2xl bg-gradient-to-br from-[#000000] to-[#0C1C36] p-4 flex items-center justify-around mt-4">
                            <div className="text-base font-semibold text-white">Vision</div>
                            <div className="text-[10px] leading-[1.5] text-white whitespace-pre-line max-w-60">
                                {cardData.vision}
                            </div>
                        </div>
                    ) : null}
                </div>

                
                {/* Catalogue */}
                {!isHidden("catalogue") && catalogueUrl ? (
                    <div className="mb-6 pt-4 px-4">
                    <div className="flex items-center justify-center border border-black rounded-[30px] px-4 py-6">
                      <h4 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-[#151213] to-[#524EDA] flex items-center gap-2 mb-4">
                        Download our Catalogue
                      </h4>
                    </div>
                    <a
                      href={catalogueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-black text-white rounded-xl w-fit mx-auto -mt-5 disabled:cursor-not-allowed"
                    >
                      {/* {catalogueDownloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span className="text-sm">{catalogueDownloading ? "Downloading..." : "Download Now"}</span> */}
                      <Download className="h-4 w-4" />
                      <span> Download Catalogue</span>
                  </a></div>
                    
                ) : null}


                {/* Addresses */}
                {!isHidden("addresses") && addresses.length > 0 ? (
                    <div>
                        <div className="text-xl font-semibold text-center text-gray-900 mt-12">We are located at</div>
                        <div className="mt-3 space-y-2">
                            {addresses.map((a, idx) => (
                               <div
                               key={idx}
                               className="rounded-lg p-0 flex items-center justify-start gap-6 px-8"
                             >
                               <img
                                 src="/location-pin.png"
                                 alt="Location Icon"
                                 className="w-20"
                               />
                               <div>
                                 <h5 className="font-semibold text-lg text-gray-900 mb-1 leading-[1.1]">
                                   {a.city || "Your Landmark"}
                                 </h5>
                                 <p className="text-[10px] text-gray-700 mb-2 leading-[1.15]">
                                   {a.address || "Address"}
                                 </p>
                                 {a.mapLink && (
                                   <a
                                     href={a.mapLink}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className=""
                                   >
                                     <img src="/get-directions.svg" alt="Map Pin" className="h-[1.25rem]" />
                                   </a>
                                 )}
                               </div>
                             </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="px-5 pb-8" style={{ background: 'linear-gradient(0deg, #000000 75%, #ffffff 100%)' }}>
            {/* Footer CTA */}
            {(!isHidden("bottomHeadline") || !isHidden("ctaText")) &&
                (cardData?.bottomHeadline || cardData?.ctaText) ? (
                <div className="pb-5">
                    <div className="text-white px-5 pb-4 pt-20">
                        {!isHidden("bottomHeadline") && cardData?.bottomHeadline ? (
                            <div className="text-base text-center font-semibold">{cardData.bottomHeadline}</div>
                        ) : null}
                        {!isHidden("ctaText") && cardData?.ctaText ? (
                            <div className="text-5xl text-center text-white font-bold mt-1 whitespace-pre-line">
                                {cardData.ctaText}
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}

            <p className="text-white text-center text-sm font-light">This is Digital Business card</p>
            <p className="text-white text-center text-sm font-light">To get more info Contact us</p>

            <div className="space-y-2 mt-6 px-5">
                <button className="flex items-center justify-center gap-2 rounded-xl bg-[#FC6464] text-white px-4 py-2 w-full">Save in Visiting Link</button>
                <a href={cardData.website} className="flex items-center justify-center gap-2 rounded-xl bg-[#1B13FF] text-white px-4 py-2 w-full">Click to open Website </a>
                <button className="flex items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-2 w-full">
                    <Download className="h-4 w-4" />
                    Get My Contact Details</button>
            </div>

            <button className="text-[12px] flex items-center justify-center gap-2 rounded-full bg-[#D9D9D9] text-black px-4 py-2 mt-10 mx-auto">Get Visiting Link</button>
            </div>

            
        </div>
    );
}
