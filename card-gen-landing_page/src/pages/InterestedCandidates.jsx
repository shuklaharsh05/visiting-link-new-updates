import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { apiService } from "../lib/api.js";
import {
  ClipboardList,
  Phone,
  User,
  Calendar,
  CreditCard,
  Search,
  AlertCircle,
  Loader2,
} from "lucide-react";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

export default function InterestedCandidates() {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      setError("");
      const res = await apiService.getMyVcfLeads();
      if (res.success && Array.isArray(res.data)) {
        setLeads(res.data);
      } else {
        setLeads([]);
        setError(res.error || "Could not load interested candidates");
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((row) => {
      const blob = [
        row.visitorName,
        row.visitorPhone,
        row.purpose,
        row.cardLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [leads, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Interested candidates
            </h1>
            <p className="text-slate-600 text-sm mt-0.5">
              People who entered their details before downloading your VCF
              contact card.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search by name, phone, card, purpose…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-sm text-slate-500">
            {filtered.length} of {leads.length} shown
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading…</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-8 text-red-600">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {leads.length === 0
              ? "No submissions yet. When someone downloads your card and fills the form, they will appear here."
              : "No matches for your search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">Name</th>
                  <th className="px-4 py-3 whitespace-nowrap">Number</th>
                  <th className="px-4 py-3 min-w-[140px]">Purpose</th>
                  <th className="px-4 py-3 whitespace-nowrap">Card</th>
                  <th className="px-4 py-3 whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-900">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        {row.visitorName || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`tel:${row.visitorPhone}`}
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:underline"
                      >
                        <Phone className="w-4 h-4 shrink-0" />
                        {row.visitorPhone || "—"}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-xs">
                      {row.purpose ? (
                        <span className="line-clamp-3">{row.purpose}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-800">
                        <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                        {row.cardLabel || "Card"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        {formatDate(row.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
