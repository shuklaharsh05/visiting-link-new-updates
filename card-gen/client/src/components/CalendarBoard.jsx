import React from 'react';

const fetchCalendarStats = async (startISO, endISO) => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const res = await fetch(`/api/admins/calendar-stats?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}&tz=${encodeURIComponent(tz)}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to load calendar stats: ${res.status}`);
  }
  return res.json();
};

const fetchAdmins = async () => {
  const res = await fetch('/api/admins', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to load admins: ${res.status}`);
  }
  return res.json();
};

const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarBoard = () => {
  const [current, setCurrent] = React.useState(new Date());
  const [loading, setLoading] = React.useState(false);
  const [days, setDays] = React.useState([]); // [{ day: 'YYYY-MM-DD', admins: [{ admin, totalInquiries, totalCards, pendingInquiries }] }]
  const [error, setError] = React.useState('');
  const [admins, setAdmins] = React.useState([]); // array of admin names

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const s = startOfMonth(current);
      const e = endOfMonth(current);
      const [statsRes, adminsRes] = await Promise.all([
        fetchCalendarStats(s.toISOString(), e.toISOString()),
        fetchAdmins().catch(() => [])
      ]);
      setDays(statsRes?.data?.days || []);
      const adminNames = Array.isArray(adminsRes) ? adminsRes.map(a => a.name).filter(Boolean) : [];
      setAdmins(adminNames);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [current]);

  React.useEffect(() => { load(); }, [load]);

  const byDayMap = React.useMemo(() => {
    const map = new Map();
    for (const d of days) map.set(d.day, d.admins);
    return map;
  }, [days]);

  const daysGrid = React.useMemo(() => {
    const s = startOfMonth(current);
    const e = endOfMonth(current);
    const arr = [];
    // Leading blanks so first day aligns to weekday
    const lead = s.getDay();
    for (let i = 0; i < lead; i++) arr.push({ iso: '', empty: true });
    const cur = new Date(s);
    while (cur <= e) {
      // Use local date string in YYYY-MM-DD to match backend timezone bucketing
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      const iso = `${yyyy}-${mm}-${dd}`;
      arr.push({ iso, empty: false, dayNum: cur.getDate() });
      cur.setDate(cur.getDate() + 1);
    }
    // Trailing blanks to complete last week row
    const trailing = (7 - (arr.length % 7)) % 7;
    for (let i = 0; i < trailing; i++) arr.push({ iso: '', empty: true });
    return arr;
  }, [current]);

  const monthLabel = current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goPrev = () => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const goNext = () => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1));

  const [selectedDay, setSelectedDay] = React.useState('');
  const [selectedAdmin, setSelectedAdmin] = React.useState('');

  const intensityClass = (total) => {
    if (total === 0) return 'bg-gray-100';
    if (total === 1) return 'bg-blue-50';
    if (total <= 3) return 'bg-blue-100';
    if (total <= 6) return 'bg-blue-200';
    if (total <= 10) return 'bg-blue-300';
    return 'bg-blue-400';
  };

  const selectedAdmins = selectedDay ? (byDayMap.get(selectedDay) || []) : [];
  const selectedTotals = selectedAdmins.reduce((acc, a) => {
    acc.inq += a.totalInquiries || 0;
    acc.cards += a.totalCards || 0;
    acc.pending += a.pendingInquiries || 0;
    return acc;
  }, { inq: 0, cards: 0, pending: 0 });

  // Aggregate overall totals per admin for the visible month
  const overallPerAdmin = React.useMemo(() => {
    const totalsMap = new Map(); // admin -> { inq, cards, pending }
    for (const d of days) {
      for (const a of (d.admins || [])) {
        const key = a.admin;
        if (!key) continue;
        const cur = totalsMap.get(key) || { inq: 0, cards: 0, pending: 0 };
        cur.inq += a.totalInquiries || 0;
        cur.cards += a.totalCards || 0;
        cur.pending += a.pendingInquiries || 0;
        totalsMap.set(key, cur);
      }
    }
    // Ensure admins with zero activity appear when admin list is available
    const names = admins.length > 0 ? admins : Array.from(totalsMap.keys());
    const rows = names.map(name => ({
      admin: name,
      ...(totalsMap.get(name) || { inq: 0, cards: 0, pending: 0 })
    }));
    // Sort by total activity desc
    rows.sort((a, b) => (b.inq + b.cards) - (a.inq + a.cards));
    return rows;
  }, [days, admins]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Admin Calendar</h2>
        <div className="flex items-center space-x-2">
          <button onClick={goPrev} className="px-3 py-1 border rounded-lg">Prev</button>
          <div className="font-medium">{monthLabel}</div>
          <button onClick={goNext} className="px-3 py-1 border rounded-lg">Next</button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-7 gap-2 text-xs text-gray-500 mb-2">
          {weekdayLabels.map((w) => (
            <div key={w} className="text-center">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
        {daysGrid.map((cell, idx) => {
          if (cell.empty) {
            return <div key={`empty-${idx}`} className="h-12 rounded-md border border-dashed border-gray-200 bg-gray-50" />;
          }
          const iso = cell.iso;
          const adminsForDay = byDayMap.get(iso) || [];
          const totals = adminsForDay.reduce((acc, a) => {
            acc.inq += a.totalInquiries || 0;
            acc.cards += a.totalCards || 0;
            acc.pending += a.pendingInquiries || 0;
            return acc;
          }, { inq: 0, cards: 0, pending: 0 });

          const totalActivity = totals.inq + totals.cards;
          const title = `${iso}\n${totals.inq} inquiries, ${totals.cards} cards, ${totals.pending} pending`;

          return (
            <button
              key={iso}
              title={title}
              onClick={() => setSelectedDay(iso)}
              className={`h-12 rounded-md border border-gray-200 ${intensityClass(totalActivity)} hover:ring-2 hover:ring-blue-400 flex items-start justify-end p-1 relative`}
            >
              <span className="text-[10px] text-gray-700">{cell.dayNum}</span>
              {totalActivity > 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] text-gray-700 font-medium">{totalActivity}</span>
              )}
            </button>
          );
        })}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">Legend:</span>
            <span className="inline-block h-3 w-5 rounded bg-gray-100 border border-gray-200" />
            <span className="text-gray-500">0</span>
            <span className="inline-block h-3 w-5 rounded bg-blue-50 border border-gray-200" />
            <span className="text-gray-500">1</span>
            <span className="inline-block h-3 w-5 rounded bg-blue-100 border border-gray-200" />
            <span className="text-gray-500">2-3</span>
            <span className="inline-block h-3 w-5 rounded bg-blue-200 border border-gray-200" />
            <span className="text-gray-500">4-6</span>
            <span className="inline-block h-3 w-5 rounded bg-blue-300 border border-gray-200" />
            <span className="text-gray-500">7-10</span>
            <span className="inline-block h-3 w-5 rounded bg-blue-400 border border-gray-200" />
            <span className="text-gray-500">10+</span>
          </div>
          <div className="text-gray-500">Click a date to view details</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-500">{selectedDay || 'Select a date'}</div>
          {selectedDay && (
            <div className="text-xs text-gray-600">Total: {selectedTotals.inq} inq · {selectedTotals.cards} cards · {selectedTotals.pending} pending</div>
          )}
        </div>
        {!selectedDay ? (
          <div className="text-xs text-gray-400">Click on a date block to view per-admin details</div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-gray-600">Per admin breakdown</div>
              <div className="flex items-center space-x-2">
                <label className="text-xs text-gray-500">Filter</label>
                <select value={selectedAdmin} onChange={(e) => setSelectedAdmin(e.target.value)} className="text-xs border rounded px-2 py-1">
                  <option value="">All admins</option>
                  {admins.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
            {(admins.length === 0 && selectedAdmins.length === 0) ? (
              <div className="text-xs text-gray-400">No data</div>
            ) : (
              (admins.length > 0 ? admins : selectedAdmins.map(a => a.admin)).filter((name) => !selectedAdmin || name === selectedAdmin).map((adminName) => {
                const found = selectedAdmins.find(a => a.admin === adminName) || { totalInquiries: 0, totalCards: 0, pendingInquiries: 0 };
                return (
                  <div key={adminName} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
                    <div className="font-medium text-gray-800">{adminName}</div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-0.5 text-[11px] rounded-full bg-blue-50 text-blue-700 border border-blue-200">{found.totalInquiries || 0} inq</span>
                      <span className="inline-flex items-center px-2 py-0.5 text-[11px] rounded-full bg-green-50 text-green-700 border border-green-200">{found.totalCards || 0} cards</span>
                      <span className="inline-flex items-center px-2 py-0.5 text-[11px] rounded-full bg-orange-50 text-orange-700 border border-orange-200">{found.pendingInquiries || 0} pending</span>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-gray-800">Overall (this month)</div>
          <div className="text-xs text-gray-500">Sorted by total activity</div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="py-2 pr-4">Admin</th>
                <th className="py-2 pr-4">Inquiries</th>
                <th className="py-2 pr-4">Cards</th>
                <th className="py-2 pr-4">Pending</th>
                {/* <th className="py-2 pr-4">Total</th> */}
              </tr>
            </thead>
            <tbody>
              {overallPerAdmin.map((row) => (
                <tr key={row.admin} className="border-t border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-800">{row.admin}</td>
                  <td className="py-2 pr-4">{row.inq}</td>
                  <td className="py-2 pr-4">{row.cards}</td>
                  <td className="py-2 pr-4">{row.pending}</td>
                  {/* <td className="py-2 pr-4 font-medium">{row.inq + row.cards}</td> */}
                </tr>
              ))}
              {overallPerAdmin.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-xs text-gray-400">No activity this month</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CalendarBoard;


