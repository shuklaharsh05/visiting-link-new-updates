import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckSquare, Search, Trash2, X } from 'lucide-react';
import { getAllUsers, bulkDeleteUsers } from '../api/users';
import { useToast } from '../contexts/ToastContext';

const UserDetails = () => {
  const navigate = useNavigate();
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSelectionMode, setUserSelectionMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);
  const [deleteUserError, setDeleteUserError] = useState('');
  const selectAllUserRef = useRef(null);
  const loadMoreRef = useRef(null);
  const { success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    resetAndLoadUsers();
  }, []);

  // Debounced search: when searchTerm changes (after initial mount), reset and reload
  const isFirstSearchEffect = useRef(true);
  useEffect(() => {
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setUserList([]);
      setPage(1);
      setHasMore(true);
      loadUsersPage(1, true);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    if (selectAllUserRef.current && userList.length) {
      selectAllUserRef.current.indeterminate =
        selectedUserIds.length > 0 && selectedUserIds.length < userList.length;
    }
  }, [selectedUserIds.length, userList.length]);

  const loadUsersPage = async (pageToLoad, initial = false) => {
    if (initial) setLoading(true);
    try {
      const res = await getAllUsers({
        page: pageToLoad,
        limit: 20,
        raw: true,
        search: searchTerm.trim() || undefined,
      });
      const items = Array.isArray(res.data?.users)
        ? res.data.users
        : Array.isArray(res.data)
          ? res.data
          : res.users || [];
      setUserList(prev => (pageToLoad === 1 ? items : [...prev, ...items]));

      const pagination = res.data?.pagination || res.pagination;
      if (!pagination || !pagination.hasNext) {
        setHasMore(false);
      } else {
        setHasMore(true);
        setPage(pagination.currentPage + 1);
      }
    } catch (err) {
      showError('Failed to load users');
      if (initial) setUserList([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const resetAndLoadUsers = async () => {
    setUserList([]);
    setPage(1);
    setHasMore(true);
    await loadUsersPage(1, true);
  };

  const toggleUserSelectAll = () => {
    if (selectedUserIds.length === userList.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(userList.map((u) => u._id));
    }
  };

  // Infinite scroll for users
  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore && !loading) {
            loadUsersPage(page, false);
          }
        });
      },
      { root: null, rootMargin: '0px', threshold: 1.0 }
    );
    const node = loadMoreRef.current;
    if (node) observer.observe(node);
    return () => {
      if (node) observer.unobserve(node);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, hasMore, loading]);

  const toggleUserSelectOne = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const openDeleteUserModal = () => {
    setDeletePassword('');
    setDeleteUserError('');
    setShowDeleteUserModal(true);
  };

  const closeDeleteUserModal = () => {
    setShowDeleteUserModal(false);
    setDeletePassword('');
    setDeleteUserError('');
  };

  const handleConfirmBulkDeleteUsers = async () => {
    if (!deletePassword.trim()) {
      setDeleteUserError('Please enter your password');
      return;
    }
    setDeleteUserLoading(true);
    setDeleteUserError('');
    try {
      await bulkDeleteUsers(selectedUserIds, deletePassword);
      showSuccess(`${selectedUserIds.length} user(s) deleted`);
      closeDeleteUserModal();
      setUserSelectionMode(false);
      setSelectedUserIds([]);
      setUserList((prev) => prev.filter((u) => !selectedUserIds.includes(u._id)));
    } catch (err) {
      setDeleteUserError(err?.message || 'Invalid password');
      showError(err?.message || 'Failed to delete users');
    } finally {
      setDeleteUserLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">User details</h1>
          </div>

          <div className="relative min-w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="w-full max-w-md pl-9 pr-4 py-2 border border-gray-300 rounded-2xl bg-white text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!userSelectionMode ? (
            <button
              onClick={() => setUserSelectionMode(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <CheckSquare className="h-4 w-4" />
              Select user
            </button>
          ) : (
            <>
              <button
                onClick={() => { setUserSelectionMode(false); setSelectedUserIds([]); }}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={openDeleteUserModal}
                disabled={selectedUserIds.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete selected {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ''}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading users...</div>
        ) : userList.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {userSelectionMode && (
                    <th className="text-left py-3 px-4 w-10">
                      <input
                        ref={selectAllUserRef}
                        type="checkbox"
                        checked={userList.length > 0 && selectedUserIds.length === userList.length}
                        onChange={toggleUserSelectAll}
                        className="rounded border-gray-300 text-blue-600"
                      />
                    </th>
                  )}
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Number of cards</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Created by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {userList.map((user, index) => (
                  <tr key={user._id} className={`hover:bg-gray-50 ${index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}`}>
                    {userSelectionMode && (
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user._id)}
                          onChange={() => toggleUserSelectOne(user._id)}
                          className="rounded border-gray-300 text-blue-600"
                        />
                      </td>
                    )}
                    <td className="py-3 px-4 text-gray-900">{user.name || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{user.email || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">{user.phone || '—'}</td>
                    <td className="py-3 px-4 text-gray-700">
                      {typeof user.cardsCount === 'number' ? user.cardsCount : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {user.createdByType === 'admin' ? (
                        <span className="text-gray-800">
                          admin{user.createdByAdminName ? ` (${user.createdByAdminName})` : ''}
                        </span>
                      ) : (
                        <span className="text-gray-600">self</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {hasMore && (
        <div ref={loadMoreRef} className="py-4 text-center text-sm text-gray-400">
          Loading more...
        </div>
      )}

      {/* Delete users – password confirmation modal */}
      {showDeleteUserModal && (
        <div className="fixed inset-0 top-[-50px] z-[60] flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete selected users</h3>
            <p className="text-sm text-gray-600 mb-4">
              You are about to delete {selectedUserIds.length} user(s). Enter your password to confirm.
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => { setDeletePassword(e.target.value); setDeleteUserError(''); }}
              placeholder="Your password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
            />
            {deleteUserError && <p className="text-sm text-red-600 mb-4">{deleteUserError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={closeDeleteUserModal}
                disabled={deleteUserLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBulkDeleteUsers}
                disabled={deleteUserLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteUserLoading ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;
