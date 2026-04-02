import { useState, useEffect } from 'react';
import { apiService } from '../lib/api.js';

/**
 * Example component demonstrating how to use the getCardAppointments API
 * This shows the exact usage pattern you provided in your query
 */
export default function CardAppointmentsExample({ cardId }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchCardAppointments = async (page = 1, status = '') => {
    if (!cardId) return;

    setLoading(true);
    setError(null);

    try {
      // This is the exact usage pattern you provided
      const response = await apiService.getCardAppointments(cardId, {
        page,
        limit: pagination.limit,
        status: status || undefined
      });

      if (response.success) {
        setAppointments(response.data.appointments || []);
        setPagination(prev => ({
          ...prev,
          page: response.data.pagination?.page || page,
          total: response.data.pagination?.total || 0,
          totalPages: response.data.pagination?.totalPages || 0
        }));
      } else {
        setError(response.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCardAppointments();
  }, [cardId]);

  const handleStatusFilter = (status) => {
    fetchCardAppointments(1, status);
  };

  const handlePageChange = (newPage) => {
    fetchCardAppointments(newPage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-semibold">Card Appointments</h3>
        <select
          onChange={(e) => handleStatusFilter(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded"
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      {appointments.length === 0 ? (
        <p className="text-gray-500">No appointments found for this card.</p>
      ) : (
        <div className="space-y-2">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{appointment.name}</h4>
                  <p className="text-sm text-gray-600">{appointment.email}</p>
                  <p className="text-sm text-gray-600">{appointment.phone}</p>
                  {appointment.message && (
                    <p className="text-sm mt-2">{appointment.message}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  appointment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {appointment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
