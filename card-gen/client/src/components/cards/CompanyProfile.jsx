import React, { useEffect, useMemo, useState } from "react";
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
    Star,
    Download,
    AppWindow,
    Tag,
} from "lucide-react";

const safeUrl = (v) => {
    if (!v || typeof v !== "string") return "";
    const s = v.trim();
    if (!s) return "";
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
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
        case "behance":
            return <ExternalLink className="h-4 w-4" />;
        default:
            return <ExternalLink className="h-4 w-4" />;
    }
};

const Stars = ({ rating }) => {
    const n = Math.max(0, Math.min(5, Number(rating || 0)));
    const filled = Math.round(n);
    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < filled ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                        }`}
                />
            ))}
        </div>
    );
};

export default function CompanyProfile({ cardData = {}, hiddenFields = [] }) {
    const isHidden = (k) => hiddenFields?.includes?.(k);
    const [activeTab, setActiveTab] = useState("services");
    const [theme, setTheme] = useState(() => {
        try {
            return localStorage.getItem("card-theme") === "dark" ? "dark" : "light";
        } catch {
            return "light";
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem("card-theme", theme);
        } catch {
            // ignore
        }
    }, [theme]);

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

    const team = useMemo(() => {
        const v = cardData?.teamMembers;
        if (!Array.isArray(v)) return [];
        return v
            .map((m) => ({
                image: typeof m?.image === "string" ? m.image : "",
                name: typeof m?.name === "string" ? m.name.trim() : "",
                role: typeof m?.role === "string" ? m.role.trim() : "",
            }))
            .filter((m) => m.image || m.name || m.role);
    }, [cardData?.teamMembers]);

    const services = useMemo(() => {
        const v = cardData?.services;
        if (!Array.isArray(v)) return [];
        return v
            .map((s) => ({
                image: typeof s?.image === "string" ? s.image : "",
                heading: typeof s?.heading === "string" ? s.heading.trim() : "",
                description: typeof s?.description === "string" ? s.description.trim() : "",
                price: typeof s?.price === "string" ? s.price.trim() : "",
                url: safeUrl(s?.url),
            }))
            .filter((s) => s.image || s.heading || s.description || s.price || s.url);
    }, [cardData?.services]);

    const products = useMemo(() => {
        const v = cardData?.products;
        if (!Array.isArray(v)) return [];
        return v
            .map((p) => ({
                image: typeof p?.image === "string" ? p.image : "",
                name: typeof p?.name === "string" ? p.name.trim() : "",
                description: typeof p?.description === "string" ? p.description.trim() : "",
                rating: typeof p?.rating === "string" ? p.rating : p?.rating,
                price: typeof p?.price === "string" ? p.price.trim() : "",
                url: safeUrl(p?.url),
            }))
            .filter((p) => p.image || p.name || p.description || p.price || p.url || p.rating);
    }, [cardData?.products]);

    const websiteUrl = safeUrl(cardData?.website);
    const catalogueUrl = safeUrl(cardData?.catalogue);
    const googleReviewUrl = safeUrl(cardData?.googleReviewLink);
    const playStoreUrl = safeUrl(cardData?.playStoreUrl);
    const appStoreUrl = safeUrl(cardData?.appStoreUrl);
    const youtubeVideoUrl = safeUrl(cardData?.youtubeVideo);

    return (
        <div className={theme === "dark" ? "dark" : ""}>
            <div className="relative w-full max-w-md mx-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xl overflow-hidden">
                <button
                    type="button"
                    onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                    className={`absolute right-3 top-2 z-20 w-[2.5rem] h-5 flex items-center rounded-full p-1 transition-colors duration-300 ${theme === "dark" ? "bg-slate-700" : "bg-gray-300"
                        }`}
                    aria-label="Toggle theme"
                >
                    <div
                        className={`w-3 h-3 rounded-full bg-white shadow-md transform transition-transform duration-300 ${theme === "dark" ? "translate-x-5" : "translate-x-0"
                            }`}
                    />
                </button>

                {/* Body */}
                <div className="p-5 space-y-5 bg-white dark:bg-slate-900">

                    {!isHidden("announcementType") && cardData?.announcementType ? (
                        <div className="relative mt-4 rounded-2xl bg-black text-white/90 border border-white/15 px-6 pb-5 pt-7 text-xs font-medium">
                            {/* <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10">
                                <img src='/company-profile/bell.png' alt="Announcement" />
                            </div>
                            <p className="text-base font-medium mb-1.5">Announcement</p>
                            <span className="text-xs font-normal leading-[1.5]">{cardData.announcementType}</span>
                        </div>
                    ) : null}
                    {/* Header */}
                    <div className="relative bg-[#FCE9E3] dark:bg-slate-800 px-5 pt-6 pb-5">

                        <div className="mt-3 mb-6">
                            {!isHidden("name") && (
                                <div className="text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">
                                    {cardData?.name || "Your Name"}
                                </div>
                            )}
                            {!isHidden("businessType") && (
                                <div className="text-sm text-slate-900 dark:text-slate-100 mt-0.5 truncate">
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
                                        <div className="text-base font-medium text-slate-900 dark:text-slate-100 truncate">
                                            {cardData?.number || "Your Number"}
                                        </div>
                                    )}
                                    {!isHidden("email") && (
                                        <div className="text-base font-medium text-slate-900 dark:text-slate-100 truncate">
                                            {cardData?.email || "Your Email"}
                                        </div>
                                    )}
                                    {!isHidden("website") && (
                                        <div className="text-base font-medium text-slate-900 dark:text-slate-100 truncate">
                                            {cardData?.website || "Your Website"}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="px-12 py-12 rounded-[35px]" style={{ background: 'linear-gradient(180deg, #9C9BC2 15%, #431D71 100%)' }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <img src='/company-profile/hello.png' alt="Profile" className="w-32" />

                            </div>
                            <div>
                                <img src='/company-profile/share.png' alt="Profile" />
                            </div>
                        </div>
                        <p className="text-sm font-bold mt-2">Myself Visiting link</p>


                        {/* Heading strip */}
                        {!isHidden("heading") && cardData?.heading ? (
                            <div className="relative mt-24">
                                <p className="font-bold text-white text-4xl">{cardData.heading}</p>
                            </div>
                        ) : null}
                        {!isHidden("subHeading") && cardData?.subHeading ? (
                            <div className="text-xs text-white mt-2 line-clamp-2">
                                {cardData.subHeading}
                            </div>
                        ) : null}
                    </div>

                    <div>

                        {/* Google Reviews */}
                        {!isHidden("googleReviewLink") && googleReviewUrl ? (
                            <a
                                href={googleReviewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gradient-to-br from-[#9C9BC2] to-[#431D71] px-4 pt-8 pb-24 rounded-[35px] flex items-center justify-center -mb-20"
                            >
                                <img src="/company-profile/google-reviews.png" alt="Google Review" className="w-full max-w-80 mx-auto rounded-3xl" />
                            </a>
                        ) : null}

                        {/* Social links */}
                        {!isHidden("socialLinks") && cardData.socialLinks && (
                            <div className="mb-6 py-6 px-4 border border-black dark:border-slate-700 rounded-[35px] bg-white dark:bg-slate-900">
                                <h4 className="text-center text-xl font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-center gap-2">
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
                    </div>


                    <div>
                        <div className="bg-[#B04747] rounded-[35px] px-4 pt-6 pb-24 -mb-20">
                            <div className="text-2xl text-center font-semibold text-white ">Claim 10 % Coupon </div>
                        </div>

                        <div className="px-6 py-8 bg-white dark:bg-slate-900 rounded-[35px] border border-black dark:border-slate-700 relative z-10">
                            <form className="">
                                <input type="text" placeholder="Enter your name" className="w-full rounded-full px-4 py-2 border border-gray-600 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                                <input type="tel" placeholder="Enter your phone number" className="w-full rounded-full px-4 py-2 border border-gray-600 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 mt-2 mb-4" />
                                <button type="submit" className="bg-black text-white w-full py-2 rounded-full">Submit</button>
                            </form>
                            <p className="text-xs text-center text-slate-900 dark:text-slate-200 mt-3">Submit the form to download this contact and claim your coupon</p>
                        </div>
                    </div>




                    <div className="bg-white dark:bg-slate-900 rounded-[45px] p-4 border border-black dark:border-slate-700">

                        {/* Banner */}
                        {!isHidden("bannerImage") && cardData?.bannerImage ? (
                            <div className="relative max-w-[22rem] mx-auto mb-4 mt-4">
                                <img
                                    src={cardData.bannerImage}
                                    alt="Banner"
                                    className="h-full w-full object-cover"
                                />
                                {/* <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" /> */}
                            </div>
                        ) : null}

                        {/* About */}
                        {!isHidden("aboutCompany") && cardData?.aboutCompany ? (
                            <div className="p-4">
                                <div className="text-xl text-center font-semibold text-slate-900 dark:text-slate-100">About My Company</div>
                                <div className="mt-2 text-[10px] leading-[1.5] text-center text-slate-900 dark:text-slate-200 whitespace-pre-line">
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
                                            className="min-h-28 max-h-28 min-w-28 max-w-28 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="min-h-28 max-h-28 min-w-28 max-w-28 rounded-full bg-gray-100" />
                                    )}
                                    <div className="min-w-0">
                                        {!isHidden("founderName") && (
                                            <div className="text-xl font-semibold leading-5 text-gray-900 dark:text-slate-100">
                                                {cardData.founderName || ""}
                                            </div>
                                        )}
                                        {!isHidden("founderDesignation") && (
                                            <div className="text-xs text-gray-500 dark:text-slate-300 truncate">
                                                {cardData.founderDesignation || ""}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* Founder Message */}
                        {!isHidden("founderMessage") && cardData?.founderMessage ? (
                            <div className={`rounded-3xl bg-white dark:bg-slate-900 border border-black dark:border-slate-700 py-6 mt-4 px-6 ${!isHidden("vision") ? "mb-[-15px] relative z-10" : ""}`}>
                                <div className="text-base font-semibold text-slate-900 dark:text-slate-100 text-center mb-2">Founder Message</div>
                                <div className="text-[10px] leading-[1.5] text-slate-900 dark:text-slate-200 whitespace-pre-line">
                                    {cardData.founderMessage}
                                </div>
                            </div>
                        ) : null}

                        {/* Vision */}
                        {!isHidden("vision") && cardData?.vision ? (
                            <div className={`rounded-3xl bg-gradient-to-br from-[#000000] to-[#0C1C36] px-4 pb-4 flex items-center justify-around ${!isHidden("founderMessage") ? "pt-8" : "pt-4"}`}>
                                <div className="text-base font-semibold text-white">Vision</div>
                                <div className="text-[10px] leading-[1.5] text-white whitespace-pre-line max-w-60">
                                    {cardData.vision}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Team */}
                    {!isHidden("teamMembers") && team.length > 0 ? (
                        <div>
                            <div className="text-lg font-semibold text-gray-900 text-center">Our Team</div>
                            <div className="mt-3 flex flex-wrap gap-4">
                                {team.map((m, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col items-center gap-2"
                                    >
                                        {m.image ? (
                                            <img
                                                src={m.image}
                                                alt={m.name || "Member"}
                                                className="min-h-16 min-w-16 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="min-h-16 min-w-16 rounded-full bg-gray-100" />
                                        )}
                                        <div className="min-w-0">
                                            <div className="text-xs font-semibold text-gray-900 text-center">
                                                {m.name || "Member"}
                                            </div>
                                            <div className="text-[11px] text-gray-500 text-center">{m.role || ""}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {/* Services and Products Section with Tabs (LinkPro-style) */}
                    {(() => {
                        const hasServices = !isHidden("services") && services.length > 0;
                        const hasProducts = !isHidden("products") && products.length > 0;
                        const showTabs = hasServices && hasProducts;

                        const getHeading = () => {
                            if (hasServices && hasProducts) return "What we offer";
                            if (hasServices) return "Services we Offer";
                            if (hasProducts) return "Our Products";
                            return "";
                        };

                        if (!hasServices && !hasProducts) return null;

                        return (
                            <div className="mb-6 pt-4">
                                <h4 className="text-3xl font-bold text-black mb-4 flex items-center justify-center gap-2">
                                    {getHeading()}
                                </h4>

                                {showTabs && (
                                    <div className="flex justify-start gap-4 mb-4 mt-8 px-4 relative">
                                        <button
                                            onClick={() => setActiveTab("services")}
                                            className={`px-4 py-1.5 rounded-full text-lg font-semibold transition-all ${activeTab === "services"
                                                ? "text-black"
                                                : "text-black/80"
                                                }`}
                                        >
                                            Services
                                        </button>
                                        <button
                                            onClick={() => setActiveTab("products")}
                                            className={`px-4 py-1.5 rounded-full text-lg font-semibold transition-all ${activeTab === "products"
                                                ? "text-black"
                                                : "text-black/80"
                                                }`}
                                        >
                                            Products
                                        </button>
                                        <div className={`absolute bottom-0 left-0 w-6 h-1 bg-[#6083f5] rounded-full transition-all duration-300 ${activeTab === "services" ? "left-[2.25rem]" : "left-[10rem]"}`}></div>
                                    </div>
                                )}

                                {/* Services Content */}
                                {hasServices && (!showTabs || activeTab === "services") && (
                                    <div className="flex flex-col gap-4 px-0 pb-8 pt-4 scrollbar-hide">
                                        {services.map((s, idx) => (
                                            <div
                                                key={idx}
                                                className="bg-[#ffffff] rounded-3xl py-6 px-4 flex items-stretch h-full justify-between gap-6"
                                                style={{ boxShadow: "0 4px 15px 0px rgba(0, 0, 0, 0.2)" }}
                                            >
                                                {s.image ? (
                                                    <div className="w-full rounded-2xl overflow-hidden max-w-40 min-w-40">
                                                        <img
                                                            src={s.image}
                                                            alt={s.heading || "Service"}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : null}

                                                <div className="flex flex-col items-stretch justify-between py-2">
                                                    <div className="space-y-1.5">
                                                        <h5 className="text-black text-xl leading-tight">
                                                            {s.heading || "Service Title"}
                                                        </h5>
                                                        <p className="text-xs text-black whitespace-pre-line">
                                                            {s.description || "Service description"}
                                                        </p>
                                                    </div>

                                                    {(s.price || s.url) ? (
                                                        <div className="mt-4 flex items-center justify-between gap-3">
                                                            {s.price ? (
                                                                <div className="shrink-0 text-black text-base font-semibold">
                                                                    {/* <Tag className="h-3.5 w-3.5" /> */}
                                                                    {s.price}
                                                                </div>
                                                            ) : (
                                                                <span />
                                                            )}
                                                            {s.url ? (
                                                                <a
                                                                    href={s.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-white bg-[#000000] rounded-full px-2 py-1 inline-flex items-center gap-1 hover:bg-[#ffffff] hover:text-[#000000] border border-black transition-all duration-300"
                                                                >
                                                                    {/* Learn more <ExternalLink className="h-3.5 w-3.5" /> */}
                                                                    Buy Now
                                                                </a>
                                                            ) : null}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Products Content */}
                                {hasProducts && (!showTabs || activeTab === "products") && (
                                    <div className="flex overflow-x-auto scrollbar-hide gap-4 px-0 py-4">
                                        {products.map((p, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3 min-w-[70%] bg-white border border-gray-200 rounded-3xl overflow-hidden"

                                            >
                                                {p.image ? (
                                                    <div className="w-full h-52 rounded-2xl overflow-hidden">
                                                        <img
                                                            src={p.image}
                                                            alt={p.name || "Product"}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ) : null}
                                                <div className="px-2 pt-2">
                                                    <div className="flex items-start justify-between gap-3 mb-2">
                                                        <div className="w-full flex items-center justify-between gap-3">
                                                            <h5 className="font-semibold text-gray-900 text-sm truncate">
                                                                {p.name || "Product Title"}
                                                            </h5>
                                                            {p.rating ? (
                                                                <div className="">
                                                                    <Stars rating={p.rating} />
                                                                </div>
                                                            ) : null}
                                                        </div>

                                                    </div>

                                                    {p.description ? (
                                                        <p className="text-[10px] leading-tight text-black mb-3 whitespace-pre-line">
                                                            {p.description}
                                                        </p>
                                                    ) : null}


                                                    <div className="flex items-center justify-between gap-3">
                                                        {p.price ? (
                                                            <div className="shrink-0 text-black text-base font-semibold">
                                                                {p.price}
                                                            </div>
                                                        ) : null}

                                                        {p.url ? (
                                                            <div className="flex justify-end">
                                                                <a
                                                                    href={p.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-white bg-[#000000] rounded-full px-6 py-1 inline-flex items-center gap-1 hover:bg-[#ffffff] hover:text-[#000000] border border-black transition-all duration-300"
                                                                >
                                                                    {/* Open <ExternalLink className="h-3.5 w-3.5" /> */}Buy Now
                                                                </a>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

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

                    {/* App download + YouTube */}
                    {(!isHidden("playStoreUrl") || !isHidden("appStoreUrl") || !isHidden("youtubeVideo")) &&
                        (playStoreUrl || appStoreUrl || youtubeVideoUrl) ? (
                        <div className="p-4">
                            {/* <div className="text-sm font-semibold text-gray-900">Links</div> */}
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {!isHidden("playStoreUrl") && playStoreUrl ? (
                                    <a
                                        href={playStoreUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <img src="/apple-download.svg" alt="Play Store" className="w-full h-full object-contain" />
                                    </a>
                                ) : null}

                                {!isHidden("appStoreUrl") && appStoreUrl ? (
                                    <a
                                        href={appStoreUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <img src="/g-play-download.svg" alt="App Store" className="w-full h-full object-contain" />
                                    </a>
                                ) : null}
                            </div>
                            {!isHidden("youtubeVideo") && youtubeVideoUrl ? (
                                <div className="mb-6 mt-12 p-0.5 mx-4 bg-white rounded-xl relative z-10">
                                    <div
                                        className="relative w-full"
                                        style={{ paddingBottom: "56.25%" }}
                                    >
                                        <iframe
                                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                                            src={`https://www.youtube.com/embed/${youtubeVideoUrl}`}
                                            title="YouTube video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                        />
                                    </div>
                                </div>
                            ) : null}

                        </div>
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

                    <div className="space-y-4 mt-28 px-5">
                        <button className="flex items-center justify-center gap-2 rounded-xl bg-[#AF8C2A] text-white px-4 py-2 w-full">Book Appointment</button>
                        <button className="flex items-center justify-center gap-2 rounded-xl bg-[#FC6464] text-white px-4 py-2 w-full">Save in Visiting Link</button>
                        <a href={cardData.website} className="flex items-center justify-center gap-2 rounded-xl bg-[#1B13FF] text-white px-4 py-2 w-full">Click to open Website </a>
                        <button className="flex items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-2 w-full">
                            <Download className="h-4 w-4" />
                            Get My Contact Details</button>
                    </div>

                    <button className="text-[12px] flex items-center justify-center gap-2 rounded-full bg-[#D9D9D9] text-black px-4 py-2 mt-10 mx-auto">Get Visiting Link</button>
                </div>
            </div>
        </div>
    );
}