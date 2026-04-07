import { useState, useEffect, useCallback, useMemo } from "react";
import { apiService } from "../lib/api.js";
import { Folder, FolderOpen, Plus, Trash2, Upload, X } from "lucide-react";

const MEDIA_TABS = [
  { id: "icon", label: "Icons" },
  { id: "image", label: "Images" },
  { id: "background", label: "Backgrounds" },
  { id: "pdf", label: "PDFs" },
  { id: "video", label: "Videos" },
];

function getFolderLabel(folder = "") {
  const parts = String(folder).split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : folder || "All";
}

function getImmediateChildren(folders, parentPath = "") {
  const set = new Set();
  if (!parentPath) {
    folders.forEach((f) => {
      const seg = f.split("/")[0];
      if (seg) set.add(seg);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }
  const prefix = parentPath + "/";
  folders.forEach((f) => {
    if (f.startsWith(prefix)) {
      const rest = f.slice(prefix.length);
      const seg = rest.split("/")[0];
      if (seg) set.add(`${parentPath}/${seg}`);
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export default function MediaManager({
  isOpen,
  onClose,
  onSelect,
  defaultTab = "image",
  multiSelect = false,
  enableLibrary = true,
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [currentFolder, setCurrentFolder] = useState("");
  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [uploading, setUploading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("");
  const [uploadFiles, setUploadFiles] = useState([]);
  const [pasteUrl, setPasteUrl] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showRenameFolder, setShowRenameFolder] = useState(false);
  const [renameFolderOld, setRenameFolderOld] = useState("");
  const [renameFolderNew, setRenameFolderNew] = useState("");
  const [renaming, setRenaming] = useState(false);

  const load = useCallback(async () => {
    if (!isOpen) return;
    if (!enableLibrary) return;
    setLoading(true);
    try {
      const res = await apiService.listMedia({
        type: activeTab,
        q: q.trim() || undefined,
        folder: currentFolder || undefined,
      });
      setItems(res.items ?? []);
      setFolders(res.folders ?? []);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [isOpen, activeTab, currentFolder, q, enableLibrary]);

  useEffect(() => {
    load();
  }, [load]);

  const uniqueFolders = useMemo(() => {
    const set = new Set();
    (folders || []).filter(Boolean).forEach((f) => {
      const parts = String(f).split("/").filter(Boolean);
      let path = "";
      parts.forEach((p) => {
        path = path ? `${path}/${p}` : p;
        set.add(path);
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [folders]);

  const rootFolders = useMemo(
    () => getImmediateChildren(uniqueFolders, ""),
    [uniqueFolders]
  );

  const renderFolderNode = (folderPath, depth = 0) => {
    const label = getFolderLabel(folderPath);
    const isActive = currentFolder === folderPath;
    const children = getImmediateChildren(uniqueFolders, folderPath);
    const hasChildren = children.length > 0;
    const paddingLeft = { paddingLeft: `${12 + depth * 14}px` };

    return (
      <div key={folderPath}>
        <button
          type="button"
          onClick={() => setCurrentFolder(folderPath)}
          className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${
            isActive ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"
          }`}
          style={paddingLeft}
        >
          {hasChildren ? (
            <FolderOpen className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 flex-shrink-0" />
          )}
          <span className="truncate">{label}</span>
        </button>
        {hasChildren && (
          <div className="mt-0.5">
            {children.map((child) => renderFolderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    setUploading(true);
    try {
      const res = await apiService.uploadMultipleMedia(uploadFiles, {
        type: activeTab,
        customFolder: uploadFolder.trim() || undefined,
      });
      if (res.success) {
        setUploadFiles([]);
        if (enableLibrary) {
          load();
        }

        const medias = (res.results || [])
          .map((r) => r?.media)
          .filter((m) => m && m.url);
        if (!enableLibrary && medias.length > 0) {
          if (multiSelect) {
            onSelect?.(medias);
          } else {
            onSelect?.(medias[medias.length - 1]);
          }
          onClose?.();
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleUsePasteUrl = () => {
    const url = pasteUrl.trim();
    if (!url) return;
    onSelect?.({ url });
    setPasteUrl("");
    onClose?.();
  };

  const handleUseSelected = () => {
    const selected = items.filter((i) => selectedIds.has(i._id));
    if (multiSelect) {
      onSelect?.(selected.length ? selected : null);
    } else {
      onSelect?.(selected[0] || null);
    }
    onClose?.();
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} item(s)?`)) return;
    await apiService.deleteMultipleMedia(Array.from(selectedIds));
    load();
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i._id)));
    }
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    setCurrentFolder(name);
    setUploadFolder(name);
    setShowNewFolder(false);
    setNewFolderName("");
  };

  const handleRenameFolder = async () => {
    const newName = renameFolderNew.trim();
    if (!newName || newName === renameFolderOld) {
      setShowRenameFolder(false);
      return;
    }
    setRenaming(true);
    try {
      await apiService.renameFolder(renameFolderOld, newName);
      if (currentFolder === renameFolderOld) setCurrentFolder(newName);
      setShowRenameFolder(false);
      setRenameFolderOld("");
      setRenameFolderNew("");
      load();
    } finally {
      setRenaming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Media Manager</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paste URL (single image) - library mode only */}
        {enableLibrary && activeTab === "image" && !multiSelect && (
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-medium text-slate-600 mb-2">Or paste image URL</p>
            <div className="flex gap-2 flex-wrap">
              <input
                type="url"
                value={pasteUrl}
                onChange={(e) => setPasteUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 min-w-[200px] px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <button
                type="button"
                onClick={handleUsePasteUrl}
                disabled={!pasteUrl.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Use this link
              </button>
            </div>
          </div>
        )}

        {/* Upload bar */}
        <div className="px-6 py-3 border-b border-slate-200 flex flex-wrap items-center gap-3">
          {enableLibrary && (
            <>
              <select
                value={activeTab}
                onChange={(e) => { setActiveTab(e.target.value); setCurrentFolder(""); setUploadFolder(""); }}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {MEDIA_TABS.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={uploadFolder}
                onChange={(e) => setUploadFolder(e.target.value)}
                placeholder="Folder (optional)"
                className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </>
          )}
          <label className="cursor-pointer px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 inline-flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Choose file{multiSelect ? "s" : ""}
            <input
              type="file"
              multiple={!!multiSelect}
              accept={
                activeTab === "pdf"
                  ? "application/pdf"
                  : activeTab === "video"
                    ? "video/*"
                    : "image/*"
              }
              className="hidden"
              onChange={(e) => setUploadFiles((prev) => [...prev, ...Array.from(e.target.files || [])])}
            />
          </label>
          {uploadFiles.length > 0 && (
            <span className="text-sm text-slate-600">
              {uploadFiles.length} file(s) selected
            </span>
          )}
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || uploadFiles.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>

        {enableLibrary ? (
        <div className="flex-1 flex min-h-0">
          {/* Sidebar - Folders */}
          <div className="w-56 border-r border-slate-200 flex flex-col bg-slate-50/50 overflow-hidden">
            <div className="p-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setShowNewFolder(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-200 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                New folder
              </button>
            </div>
            <div className="p-2 overflow-y-auto flex-1">
              <button
                type="button"
                onClick={() => setCurrentFolder("")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
                  currentFolder === "" ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              {rootFolders.map((f) => renderFolderNode(f))}
              {currentFolder && (
                <button
                  type="button"
                  onClick={() => {
                    setRenameFolderOld(currentFolder);
                    setRenameFolderNew(currentFolder);
                    setShowRenameFolder(true);
                  }}
                  className="mt-3 w-full text-left px-3 py-2 rounded-lg text-xs text-slate-500 hover:bg-slate-200"
                >
                  Rename this folder
                </button>
              )}
            </div>
          </div>

          {/* Main - Grid + toolbar */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-3 border-b border-slate-200 flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search..."
                className="flex-1 min-w-[120px] px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedIds.size === items.length ? "Deselect all" : "Select all"}
                </button>
              )}
              {selectedIds.size > 0 && (
                <>
                  <span className="text-sm text-slate-500">
                    {selectedIds.size} selected
                  </span>
                  <button
                    type="button"
                    onClick={handleUseSelected}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
                  >
                    Use selected
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSelected}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium"
                  >
                    Delete selected
                  </button>
                </>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <p className="text-center text-slate-500 py-16">
                  {q ? "No results." : "No media in this folder. Upload files above."}
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {items.map((item) => {
                    const selected = selectedIds.has(item._id);
                    const isImage = item.type === "image" || item.type === "icon" || item.type === "background";
                    return (
                      <div
                        key={item._id}
                        className={`relative rounded-xl border-2 overflow-hidden bg-white ${
                          selected ? "border-blue-600 ring-2 ring-blue-200" : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div
                          className="aspect-square flex items-center justify-center bg-slate-100 cursor-pointer"
                          onClick={() => multiSelect ? toggleSelect(item._id) : (onSelect?.(item), onClose?.())}
                        >
                          {isImage ? (
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-2">
                              <span className="text-xs font-medium text-slate-600 block">{item.type}</span>
                              <span className="text-[10px] text-slate-500 truncate block">{item.name}</span>
                            </div>
                          )}
                        </div>
                        {multiSelect && (
                          <div className="absolute top-2 left-2">
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleSelect(item._id)}
                              className="w-5 h-5 rounded border-slate-300 text-blue-600"
                            />
                          </div>
                        )}
                        <div className="p-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => (multiSelect ? onSelect?.([item]) : onSelect?.(item), onClose?.())}
                            className="w-full py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg"
                          >
                            Use
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        ) : (
          <div className="flex-1 min-h-0" />
        )}
      </div>

      {/* New folder modal */}
      {showNewFolder && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">New folder</h3>
            <p className="text-sm text-slate-600 mb-4">
              Enter a name. Uploads will go here when this folder is selected.
            </p>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4"
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename folder modal */}
      {showRenameFolder && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Rename folder</h3>
            <p className="text-sm text-slate-600 mb-4">
              New name for <strong>{renameFolderOld}</strong>
            </p>
            <input
              type="text"
              value={renameFolderNew}
              onChange={(e) => setRenameFolderNew(e.target.value)}
              placeholder="New name"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4"
              onKeyDown={(e) => e.key === "Enter" && handleRenameFolder()}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowRenameFolder(false); setRenameFolderOld(""); setRenameFolderNew(""); }}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRenameFolder}
                disabled={!renameFolderNew.trim() || renaming}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {renaming ? "Renaming…" : "Rename"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
