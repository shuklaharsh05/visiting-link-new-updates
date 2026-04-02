import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { uploadMultipleMedia } from '../api/media';
import { useToast } from '../contexts/ToastContext';

const MediaUpload = ({ onUploaded, defaultType = 'image', currentFolder = '' }) => {
  const { success: showSuccess, error: showError } = useToast();
  const [type, setType] = useState(defaultType);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadFolder, setUploadFolder] = useState(currentFolder);

  React.useEffect(() => {
    setType(defaultType);
    setUploadFolder(currentFolder);
  }, [defaultType, currentFolder]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // Add new files to existing ones
    const newFiles = [...files, ...selectedFiles];

    // Previews for images; PDF/video show name/placeholder only
    const newPreviews =
      type === 'pdf' || type === 'video'
        ? previews
        : [
          ...previews,
          ...selectedFiles.map((f) => URL.createObjectURL(f)),
        ];

    setFiles(newFiles);
    setPreviews(newPreviews);

    e.target.value = '';
  };

  const removeFile = (index) => {
    // Revoke the object URL to free memory (only for image previews)
    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
    }

    // Remove the file and preview at the specified index
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);

    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleUpload = async () => {
    try {
      if (files.length === 0) return showError('Select files to upload');
      setLoading(true);
      const res = await uploadMultipleMedia({ files, type, customFolder: uploadFolder });
      if (res.success) {
        const results = res.results || [];
        const uploadedCount = results.length;
        const duplicateCount = results.filter(r => r.duplicate).length;
        const newCount = uploadedCount - duplicateCount;
        const errorCount = res.errors?.length || 0;

        // If there were any per-file errors, log them for debugging
        if (errorCount > 0 && Array.isArray(res.errors)) {
          console.error('[MediaUpload] Upload errors:', res.errors);
        }

        // Build user-facing message
        let message = `Uploaded ${newCount} new file(s)`;
        if (duplicateCount > 0) message += `, ${duplicateCount} duplicate(s) skipped`;
        if (errorCount > 0) message += `, ${errorCount} error(s)`;

        // If everything failed (no new or duplicate uploads), treat as a hard failure
        if (newCount === 0 && duplicateCount === 0 && errorCount > 0 && res.errors?.length) {
          const firstError = res.errors[0];
          const fileName = firstError.file || 'file';
          const errorMsg = firstError.error || 'Unknown upload error';
          showError(`Upload failed for ${fileName}: ${errorMsg}`);
        } else {
          showSuccess(message);
        }

        // Revoke all preview URLs
        previews.forEach(url => URL.revokeObjectURL(url));

        // Trigger refresh by calling onUploaded with the last successful item
        const successfulResults = results.filter(r => r.media || r.success);
        if (successfulResults.length > 0) {
          const lastResult = successfulResults[successfulResults.length - 1];
          onUploaded && onUploaded(lastResult.media || lastResult);
        } else {
          // Still refresh even if all failed to show error state
          onUploaded && onUploaded(null);
        }
      } else {
        showError('Upload failed');
      }
      setFiles([]);
      setPreviews([]);
    } catch (err) {
      showError(err.message || 'Upload error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3">
      <div className="flex items-center space-x-3 flex-wrap gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className="px-2 py-1 border rounded text-sm">
          <option value="icon">Icon</option>
          <option value="image">Image</option>
          <option value="background">Background</option>
          <option value="pdf">PDF</option>
          <option value="video">Video</option>
        </select>
        <input
          type="text"
          value={uploadFolder}
          onChange={(e) => setUploadFolder(e.target.value)}
          placeholder="Folder name (optional)"
          className="px-2 py-1 border rounded text-sm flex-1 min-w-[150px]"
        />
        <input
          type="file"
          accept={
            type === 'pdf'
              ? 'application/pdf'
              : type === 'video'
                ? 'video/*'
                : 'image/*,.gif,image/gif,image/avif,image/png,image/svg+xml,.avif,.png,.svg'
          }
          onChange={handleFileChange}
          multiple
          className="text-sm"
        />
        <button
          onClick={handleUpload}
          disabled={loading || files.length === 0}
          className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading {files.length}...
            </span>
          ) : (
            'Upload'
          )}
        </button>
      </div>
      {files.length > 0 && (
        <>
          {type === 'pdf' || type === 'video' ? (
            <div className="max-h-32 overflow-y-auto space-y-1 text-xs text-gray-700">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-2 py-1 border rounded bg-gray-50"
                >
                  <span className="truncate max-w-[180px]">{file.name}</span>
                  <button
                    onClick={() => removeFile(idx)}
                    className="ml-2 text-red-600 hover:text-red-800 text-xs font-semibold"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 xl:grid-cols-16 gap-2 max-h-32 overflow-y-auto">
              {previews.map((preview, idx) => (
                <div key={idx} className="relative mx-auto group">
                  <img
                    src={preview}
                    alt={`preview ${idx + 1}`}
                    className="h-20 w-20 object-contain rounded border"
                  />
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute top-0 left-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-opacity shadow-sm"
                    title="Remove"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="text-sm text-gray-600">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </div>
        </>
      )}
    </div>
  );
};

export default MediaUpload;


