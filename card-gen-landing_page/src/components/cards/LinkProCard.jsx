import { Globe, Mail, Phone, MessageCircle } from "lucide-react";

export default function LinkProCard({ data = {}, hiddenFields = [] }) {
  const isHidden = (fieldName) => hiddenFields.includes(fieldName);
  const companyName = data.CompanyName || data.companyName || "Your Company";
  const logo = data.logo || "";
  const tagline = data.tagline || data.heading || "";
  const about = data.companyInfo || "";
  const socials = data.socialLinks || {};
  const socialButtons = Array.isArray(data.socialCustomButtons) ? data.socialCustomButtons : [];

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl border border-slate-200 bg-white shadow-md overflow-hidden">
      <div className="h-28 bg-gradient-to-r from-indigo-600 to-sky-500" />
      <div className="px-5 pb-5 -mt-10">
        {!isHidden("logo") && (
          <div className="h-20 w-20 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            {logo ? (
              <img src={logo} alt={companyName} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                Logo
              </div>
            )}
          </div>
        )}

        {!isHidden("CompanyName") && (
          <h2 className="mt-4 text-xl font-bold text-slate-900">{companyName}</h2>
        )}
        {!isHidden("tagline") && tagline && (
          <p className="text-sm text-slate-600 mt-1">{tagline}</p>
        )}

        <div className="mt-4 space-y-2 text-sm">
          {!isHidden("phoneNumber") && data.phoneNumber && (
            <a className="flex items-center gap-2 text-slate-700" href={`tel:${data.phoneNumber}`}>
              <Phone className="h-4 w-4" /> {data.phoneNumber}
            </a>
          )}
          {!isHidden("email") && data.email && (
            <a className="flex items-center gap-2 text-slate-700" href={`mailto:${data.email}`}>
              <Mail className="h-4 w-4" /> {data.email}
            </a>
          )}
          {!isHidden("website") && data.website && (
            <a className="flex items-center gap-2 text-slate-700" href={data.website} target="_blank" rel="noreferrer">
              <Globe className="h-4 w-4" /> {data.website}
            </a>
          )}
          {!isHidden("whatsappNumber") && data.whatsappNumber && (
            <a className="flex items-center gap-2 text-slate-700" href={`https://wa.me/${String(data.whatsappNumber).replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" /> {data.whatsappNumber}
            </a>
          )}
        </div>

        {!isHidden("companyInfo") && about && (
          <p className="mt-4 text-sm text-slate-600 line-clamp-4">{about}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(socials)
            .filter(([, url]) => !!url)
            .map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 text-xs rounded-full bg-slate-100 text-slate-700"
              >
                {key}
              </a>
            ))}
          {socialButtons
            .filter((btn) => btn?.url)
            .map((btn, idx) => (
              <a
                key={`${btn.url}-${idx}`}
                href={btn.url}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 text-xs rounded-full bg-blue-50 text-blue-700"
              >
                {btn.text || "Link"}
              </a>
            ))}
        </div>
      </div>
    </div>
  );
}
