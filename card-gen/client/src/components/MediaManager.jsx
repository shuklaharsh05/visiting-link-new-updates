import React, { useState } from 'react';
import MediaUpload from './MediaUpload';

const MediaManager = ({ isOpen, onClose, onSelect, defaultTab = 'image', multiSelect = false }) => {
  const [currentFolder, setCurrentFolder] = useState('');
  const [pasteUrl, setPasteUrl] = useState('');

  const handleUsePasteUrl = () => {
    const url = (pasteUrl || '').trim();
    if (!url) return;
    onSelect && onSelect({ url });
    setPasteUrl('');
    onClose && onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 !mt-0 z-[9998]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 p-6 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-[85%] h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Media Manager</h2>
            <button onClick={onClose} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Close</button>
          </div>

          {/* Paste image URL (when selecting images) */}
          {defaultTab === 'image' && !multiSelect && (
            <div className="p-4 border-b bg-gray-50">
              <p className="text-sm font-medium text-gray-700 mb-2">Or paste image link (e.g. from Google Images)</p>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="url"
                  value={pasteUrl}
                  onChange={(e) => setPasteUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded text-sm"
                />
                <button
                  type="button"
                  onClick={handleUsePasteUrl}
                  disabled={!pasteUrl.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Use this link
                </button>
              </div>
            </div>
          )}
          
          {/* Upload Section (direct upload only) */}
          <div className="p-4 border-b">
            <MediaUpload
              onUploaded={(m) => {
                // MediaUpload returns last uploaded media item; select it immediately.
                if (m?.url) {
                  onSelect && onSelect(m);
                  onClose && onClose();
                }
              }}
              defaultType={defaultTab}
              currentFolder={currentFolder}
            />
          </div>

          <div className="p-4">
            <div className="text-xs text-gray-500">
              Media library is disabled. Upload from your device to use media.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaManager;


