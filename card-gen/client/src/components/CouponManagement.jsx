import React, { useEffect, useState } from "react";
import { getCoupons, createCoupon, deleteCoupon } from "../api/coupons";
import { AlertCircle, Trash2, Plus, Percent } from "lucide-react";

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [code, setCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [maxOffAmount, setMaxOffAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getCoupons();
      if (res.success && Array.isArray(res.data)) {
        setCoupons(res.data);
      } else if (Array.isArray(res)) {
        setCoupons(res);
      } else {
        setCoupons([]);
      }
    } catch (err) {
      setError(err.message || "Failed to load coupons");
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const pct = Number(discountPercent);
    const max = maxOffAmount ? Number(maxOffAmount) : undefined;

    if (!code.trim() || Number.isNaN(pct) || pct <= 0) {
      setError("Please provide a code and a valid discount percent.");
      return;
    }

    setSaving(true);
    try {
      const res = await createCoupon({
        code: code.trim(),
        discountPercent: pct,
        maxOffAmount: max,
      });

      if (res.success) {
        setSuccess("Coupon created successfully.");
        setCode("");
        setDiscountPercent("");
        setMaxOffAmount("");
        await loadCoupons();
      } else {
        setError(res.error || "Failed to create coupon.");
      }
    } catch (err) {
      setError(err.message || "Failed to create coupon.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await deleteCoupon(id);
      setSuccess("Coupon deleted.");
      await loadCoupons();
    } catch (err) {
      setError(err.message || "Failed to delete coupon.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupon Codes</h1>
          <p className="text-gray-600 text-sm">
            Create and manage discount coupons for user plan upgrades.
          </p>
        </div>
      </div>

      {/* Create form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3 max-w-xl">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" />
          Create Coupon
        </h2>
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
            {success}
          </div>
        )}
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="TRY50"
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
              Discount % <Percent className="w-3 h-3" />
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder="50"
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">
              Max off amount (₹)
            </label>
            <input
              type="number"
              min="0"
              value={maxOffAmount}
              onChange={(e) => setMaxOffAmount(e.target.value)}
              placeholder="100"
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            />
          </div>
          <div className="flex justify-end md:justify-start">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>

      {/* Coupon list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-3">Existing Coupons</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading coupons…</p>
        ) : coupons.length === 0 ? (
          <p className="text-sm text-gray-500">No coupons created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Code</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Discount</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Max Off (₹)</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Active</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Created</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700"></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs">{c.code}</td>
                    <td className="px-3 py-2">
                      {c.discountType === "percentage"
                        ? `${c.discountValue}%`
                        : `₹${c.discountValue}`}
                    </td>
                    <td className="px-3 py-2">
                      {c.maxDiscountAmount != null ? `₹${c.maxDiscountAmount}` : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          c.active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {c.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-500">
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleDelete(c._id)}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
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
};

export default CouponManagement;

