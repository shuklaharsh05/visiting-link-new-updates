import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { listMedia, deleteMedia, deleteMultipleMedia, renameFolder as renameFolderApi } from '../api/media';
import { useToast } from '../contexts/ToastContext';

const splitFolderParts = (folder = '') => folder.split('/').filter(Boolean);
const getFolderLabel = (folder = '') => {
  const parts = splitFolderParts(folder);
  return parts.length ? parts[parts.length - 1] : folder;
};
const getFolderDepth = (folder = '') => {
  const parts = splitFolderParts(folder);
  return parts.length > 0 ? parts.length - 1 : 0;
};

const MediaLibrary = ({ onSelect, defaultTab = 'image', onFolderChange, currentFolder: propCurrentFolder, multiSelect = false }) => {
  const { success: showSuccess, error: showError } = useToast();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(propCurrentFolder || '');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showRenameFolder, setShowRenameFolder] = useState(false);
  const [folderToRename, setFolderToRename] = useState('');
  const [renameFolderName, setRenameFolderName] = useState('');
  const [renamingFolder, setRenamingFolder] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [pinnedFolders, setPinnedFolders] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('pinnedFolders') || '[]'));
    } catch {
      return new Set();
    }
  });

  // Save pinned folders to localStorage
  useEffect(() => {
    localStorage.setItem('pinnedFolders', JSON.stringify(Array.from(pinnedFolders)));
  }, [pinnedFolders]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await listMedia({ type: activeTab, q, folder: currentFolder });
      setItems(res.items || []);
      setFolders(res.folders || []);
      setSelectedItems(new Set()); // Clear selection on load
    } catch (err) {
      showError(err.message || 'Load error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    try {
      setDeletingId(item._id);
      await deleteMedia(item._id);
      showSuccess('Media deleted successfully');
      setDeleteConfirm(null);
      load();
    } catch (err) {
      showError(err.message || 'Failed to delete media');
    } finally {
      setDeletingId(null);
    }
  };

  const handleMassDelete = async () => {
    if (selectedItems.size === 0) {
      showError('No items selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedItems.size} item(s)?`)) {
      return;
    }

    try {
      const ids = Array.from(selectedItems);
      await deleteMultipleMedia(ids);
      showSuccess(`Deleted ${ids.length} item(s) successfully`);
      setSelectedItems(new Set());
      load();
    } catch (err) {
      showError(err.message || 'Failed to delete media');
    }
  };

  const handleFolderChange = (folder) => {
    setCurrentFolder(folder);
    setSelectedItems(new Set());
    if (onFolderChange) {
      onFolderChange(folder);
    }
  };

  const openRenameFolderModal = (folder) => {
    setFolderToRename(folder);
    setRenameFolderName(folder);
    setShowRenameFolder(true);
  };

  const handleRenameFolder = async () => {
    if (!renameFolderName.trim()) {
      showError('Folder name cannot be empty');
      return;
    }

    const trimmedNewName = renameFolderName.trim();
    if (trimmedNewName === folderToRename) {
      setShowRenameFolder(false);
      return;
    }

    try {
      setRenamingFolder(true);
      await renameFolderApi(folderToRename, trimmedNewName);
      showSuccess('Folder renamed successfully');
      setShowRenameFolder(false);
      setFolderToRename('');
      setRenameFolderName('');
      if (currentFolder === folderToRename) {
        handleFolderChange(trimmedNewName);
      } else {
        load();
      }
    } catch (err) {
      showError(err.message || 'Failed to rename folder');
    } finally {
      setRenamingFolder(false);
    }
  };

  const togglePin = (folder) => {
    const newPinned = new Set(pinnedFolders);
    if (newPinned.has(folder)) {
      newPinned.delete(folder);
    } else {
      newPinned.add(folder);
    }
    setPinnedFolders(newPinned);
  };

  const toggleSelect = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item._id)));
    }
  };

  useEffect(() => { load(); }, [activeTab, currentFolder, q]);

  const actualFoldersSet = useMemo(() => {
    return new Set((folders || []).filter(Boolean));
  }, [folders]);

  const uniqueFolders = useMemo(() => {
    const set = new Set();
    actualFoldersSet.forEach(folder => {
      const parts = splitFolderParts(folder);
      let path = '';
      parts.forEach(part => {
        path = path ? `${path}/${part}` : part;
        set.add(path);
      });
    });
    return Array.from(set);
  }, [actualFoldersSet]);

  // Sort folders (for pinned section) alphabetically
  const sortedFolders = useMemo(() => {
    return [...(folders || [])]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [folders]);

  const getImmediateChildren = useCallback((parentPath = '') => {
    const childrenSet = new Set();
    if (!parentPath) {
      uniqueFolders.forEach(folder => {
        const child = folder.split('/')[0];
        if (child) childrenSet.add(child);
      });
    } else {
      const prefix = `${parentPath}/`;
      uniqueFolders.forEach(folder => {
        if (folder.startsWith(prefix)) {
          const remainder = folder.slice(prefix.length);
          if (!remainder) return;
          const childSegment = remainder.split('/')[0];
          if (childSegment) {
            childrenSet.add(`${parentPath}/${childSegment}`);
          }
        }
      });
    }
    return Array.from(childrenSet).sort((a, b) => a.localeCompare(b));
  }, [uniqueFolders]);

  const rootFolders = useMemo(() => getImmediateChildren(''), [getImmediateChildren]);

  const renderFolderNode = (folderPath, depth = 0) => {
    const label = getFolderLabel(folderPath);
    const isActive = currentFolder === folderPath;
    const branchOpen = currentFolder && (currentFolder === folderPath || currentFolder.startsWith(`${folderPath}/`));
    const children = getImmediateChildren(folderPath);
    const canModifyFolder = actualFoldersSet.has(folderPath);
    const paddingLeft = depth > 0 ? { paddingLeft: `${12 + depth * 12}px` } : {};

    return (
      <div key={folderPath}>
        <button
          onClick={() => handleFolderChange(folderPath)}
          className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between group transition-colors ${isActive
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-gray-700 hover:bg-gray-200'
            }`}
          style={paddingLeft}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <svg className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-sm truncate font-medium" title={folderPath}>{label}</span>
          </div>
          {canModifyFolder && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); togglePin(folderPath); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePin(folderPath);
                  }
                }}
                className={`${isActive ? 'hover:bg-blue-600' : 'hover:bg-gray-300'} p-1 rounded transition-all cursor-pointer`}
                title={pinnedFolders.has(folderPath) ? 'Unpin folder' : 'Pin folder'}
              >
                <svg
                  className={`w-4 h-4 ${pinnedFolders.has(folderPath) ? (isActive ? 'text-white' : 'text-yellow-600') : (isActive ? 'text-white' : 'text-gray-400')}`}
                  fill={pinnedFolders.has(folderPath) ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); openRenameFolderModal(folderPath); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    openRenameFolderModal(folderPath);
                  }
                }}
                className={`${isActive ? 'hover:bg-blue-600' : 'hover:bg-gray-300'} p-1 rounded transition-all cursor-pointer`}
                title="Rename folder"
              >
                <svg className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5V21h4.5l11-11-4.5-4.5-11 11z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5.5l3.5 3.5" />
                </svg>
              </span>
            </div>
          )}
        </button>
        {branchOpen && children.length > 0 && (
          <div className="space-y-0.5">
            {children.map(child => renderFolderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-gray-50">
      {/* Left Sidebar - Folders (Mac-like style) */}
      <div className="w-64 bg-gray-50 border-r border-gray-300 flex flex-col shadow-sm">
        {/* Tab Selector */}
        <div className="p-3 border-b border-gray-300 bg-white">
          <div className="flex gap-1">
            <button
              className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${activeTab === 'icon' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => { setActiveTab('icon'); setCurrentFolder(''); handleFolderChange(''); }}
            >
              Icons
            </button>
            <button
              className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${activeTab === 'image' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => { setActiveTab('image'); setCurrentFolder(''); handleFolderChange(''); }}
            >
              Images
            </button>
            <button
              className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${activeTab === 'background' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => { setActiveTab('background'); setCurrentFolder(''); handleFolderChange(''); }}
            >
              Backgrounds
            </button>
            <button
              className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${activeTab === 'pdf' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => { setActiveTab('pdf'); setCurrentFolder(''); handleFolderChange(''); }}
            >
              PDFs
            </button>
            <button
              className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${activeTab === 'video' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => { setActiveTab('video'); setCurrentFolder(''); handleFolderChange(''); }}
            >
              Videos
            </button>
          </div>
        </div>

        {/* Folder List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-0.5">


            {/* Create Folder Button */}
            <button
              onClick={() => setShowCreateFolder(true)}
              className="w-full text-left px-3 py-2.5 rounded-md flex items-center gap-2.5 text-gray-600 hover:bg-gray-200 mt-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-sm font-medium">New Folder</span>
            </button>


            {/* All Items */}
            <button
              onClick={() => handleFolderChange('')}
              className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between group transition-colors ${currentFolder === ''
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-700 hover:bg-gray-200'
                }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className={`w-5 h-5 flex-shrink-0 ${currentFolder === '' ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-sm font-medium">All</span>
              </div>
            </button>

            {/* Pinned Folders */}
            {sortedFolders.filter(f => pinnedFolders.has(f)).length > 0 && (
              <>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-3 mb-1">
                  Pinned
                </div>
                {sortedFolders.filter(f => pinnedFolders.has(f)).map(folder => (
                  <button
                    key={`pinned-${folder}`}
                    onClick={() => handleFolderChange(folder)}
                    className={`w-full text-left px-3 py-2.5 rounded-md flex items-center justify-between group transition-colors ${currentFolder === folder
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <svg className={`w-5 h-5 flex-shrink-0 ${currentFolder === folder ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                      <span className="text-sm truncate font-medium">{folder}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); togglePin(folder); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            togglePin(folder);
                          }
                        }}
                        className={`p-1 rounded transition-all cursor-pointer ${currentFolder === folder
                          ? 'hover:bg-blue-600'
                          : 'hover:bg-gray-300'
                          }`}
                        title="Unpin folder"
                      >
                        <svg className={`w-4 h-4 ${currentFolder === folder ? 'text-white' : 'text-yellow-600'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </span>
                      {actualFoldersSet.has(folder) && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); openRenameFolderModal(folder); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              openRenameFolderModal(folder);
                            }
                          }}
                          className={`p-1 rounded transition-all cursor-pointer ${currentFolder === folder
                            ? 'hover:bg-blue-600'
                            : 'hover:bg-gray-300'
                            }`}
                          title="Rename folder"
                        >
                          <svg className={`w-4 h-4 ${currentFolder === folder ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5V21h4.5l11-11-4.5-4.5-11 11z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5.5l3.5 3.5" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </>
            )}

            {/* Regular Folders */}
            {rootFolders.length > 0 && (
              <div className="mt-3 space-y-0.5">
                {rootFolders.map(folder => renderFolderNode(folder, 0))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Content - Images Grid (Mac-like style) */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-300 bg-gray-50">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex-1">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search images..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              {multiSelect && selectedItems.size > 0 && (
                <button
                  onClick={() => {
                    const selected = items.filter((i) => selectedItems.has(i._id));
                    if (onSelect && selected.length) onSelect(selected);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors shadow-sm"
                >
                  Use {selectedItems.size} selected
                </button>
              )}
              {selectedItems.size > 0 && (
                <>
                  {!multiSelect && <span className="text-sm text-gray-600 font-medium">{selectedItems.size} selected</span>}
                  <button
                    onClick={handleMassDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors shadow-sm"
                  >
                    Delete Selected ({selectedItems.size})
                  </button>
                </>
              )}
              <button
                onClick={load}
                className="px-4 py-2 bg-gray-700 text-white rounded-md text-sm hover:bg-gray-800 transition-colors shadow-sm"
              >
                Refresh
              </button>
            </div>
          </div>
          {items.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {selectedItems.size === items.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedItems.size > 0 && (
                <span className="text-xs text-gray-500">•</span>
              )}
              {selectedItems.size > 0 && (
                <span className="text-xs text-gray-600">
                  {selectedItems.size} of {items.length} selected
                </span>
              )}
            </div>
          )}
        </div>

        {/* Images Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {loading ? (
            <div className="text-gray-500 text-center py-12">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-gray-500 text-center py-12">
              {q
                ? 'No media found matching your search'
                : 'No media in this folder'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-8 gap-4">
              {items.map(item => (
                <div
                  key={item._id}
                  className={`relative border border-gray-300 rounded-lg overflow-hidden bg-white hover:shadow-lg transition-all cursor-pointer ${selectedItems.has(item._id) ? 'ring-2 ring-blue-500 border-blue-500 shadow-md' : 'hover:border-gray-400'
                    }`}
                >
                  {/* Checkbox */}
                  <div className="absolute top-2 left-2 z-10 bg-white rounded shadow-sm">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item._id)}
                      onChange={() => toggleSelect(item._id)}
                      className="w-5 h-5 cursor-pointer"
                    />
                  </div>

                  {/* Preview */}
                  <div
                    className="aspect-square bg-gray-100 cursor-pointer flex items-center justify-center"
                    onClick={() => {
                      if (multiSelect) toggleSelect(item._id);
                      else if (onSelect) onSelect(item);
                    }}
                  >
                    {item.type === 'pdf' ? (
                      <div className="flex flex-col items-center justify-center px-2 text-center">
                        <div className="mb-1 text-xs font-semibold text-red-600">
                          PDF
                        </div>
                        <div className="text-[10px] text-gray-700 break-words">
                          {item.name}
                        </div>
                      </div>
                    ) : item.type === 'video' ? (
                      <div className="flex flex-col items-center justify-center px-2 text-center">
                        <div className="mb-1 text-xs font-semibold text-blue-600">
                          Video
                        </div>
                        <div className="text-[10px] text-gray-700 break-words">
                          {item.name}
                        </div>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2 border-t">
                    <div className="text-xs font-medium truncate" title={item.name}>
                      {item.name}
                    </div>
                    <div className="text-[10px] text-gray-500">{item.type}</div>

                    {/* Actions */}
                    <div className="flex gap-1 mt-2">
                      <button
                        onClick={() => {
                          if (multiSelect) onSelect && onSelect([item]);
                          else onSelect && onSelect(item);
                        }}
                        className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        {multiSelect ? 'Use this' : 'Select'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(item)}
                        disabled={deletingId === item._id}
                        className={`px-2 py-1 text-xs rounded ${deletingId === item._id
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                      >
                        {deletingId === item._id ? '...' : 'Del'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 !mt-0 z-[9998] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreateFolder(false)} />
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 relative">
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
            <p className="text-gray-600 mb-4">
              Enter a name for the new folder. Images uploaded to this folder will be organized separately.
            </p>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name (e.g., Products, Team Photos)"
              className="w-full px-3 py-2 border rounded mb-4"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFolderName.trim()) {
                  handleFolderChange(newFolderName.trim());
                  setShowCreateFolder(false);
                  setNewFolderName('');
                  load();
                }
              }}
            />
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateFolder(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newFolderName.trim()) {
                    handleFolderChange(newFolderName.trim());
                    setShowCreateFolder(false);
                    setNewFolderName('');
                    load();
                  }
                }}
                disabled={!newFolderName.trim()}
                className={`px-4 py-2 rounded ${!newFolderName.trim()
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {showRenameFolder && (
        <div className="fixed inset-0 !mt-0 z-[9998] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRenameFolder(false)} />
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 relative">
            <h3 className="text-lg font-semibold mb-4">Rename Folder</h3>
            <p className="text-gray-600 mb-4">
              Enter a new name for <span className="font-medium">{folderToRename}</span>.
            </p>
            <input
              type="text"
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              placeholder="New folder name"
              className="w-full px-3 py-2 border rounded mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameFolderName.trim()) {
                  handleRenameFolder();
                }
              }}
            />
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  setShowRenameFolder(false);
                  setFolderToRename('');
                  setRenameFolderName('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameFolder}
                disabled={!renameFolderName.trim() || renamingFolder}
                className={`px-4 py-2 rounded ${!renameFolderName.trim() || renamingFolder
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {renamingFolder ? 'Renaming...' : 'Rename'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {showRenameFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRenameFolder(false)} />
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 relative">
            <h3 className="text-lg font-semibold mb-4">Rename Folder</h3>
            <p className="text-gray-600 mb-4">
              Enter a new name for <span className="font-medium">{folderToRename}</span>.
            </p>
            <input
              type="text"
              value={renameFolderName}
              onChange={(e) => setRenameFolderName(e.target.value)}
              placeholder="New folder name"
              className="w-full px-3 py-2 border rounded mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameFolderName.trim()) {
                  handleRenameFolder();
                }
              }}
            />
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => {
                  setShowRenameFolder(false);
                  setFolderToRename('');
                  setRenameFolderName('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameFolder}
                disabled={!renameFolderName.trim() || renamingFolder}
                className={`px-4 py-2 rounded ${!renameFolderName.trim() || renamingFolder
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {renamingFolder ? 'Renaming...' : 'Rename'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 !mt-0 z-[9998] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 relative">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deletingId === deleteConfirm._id}
                className={`px-4 py-2 rounded ${deletingId === deleteConfirm._id
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
              >
                {deletingId === deleteConfirm._id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;
