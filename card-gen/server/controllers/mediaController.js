import crypto from 'crypto';
import cloudinary from '../services/cloudinary.js';
import Media from '../models/Media.js';

const FOLDERS = {
  icon: 'icons',
  image: 'images',
  background: 'backgrounds',
  pdf: 'pdfs',
  video: 'videos',
};

const MEDIA_TYPES = ['icon', 'image', 'background', 'pdf', 'video'];

/** DB label when no customFolder is sent (schema requires non-empty folder) */
const DEFAULT_FOLDER_LABEL = 'default';

function fileBufferHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/** Derive Cloudinary resource_type from file mimetype so video/PDF never get sent as image */
function getResourceTypeFromMimetype(mimetype) {
  if (!mimetype) return 'image';
  const m = mimetype.toLowerCase();
  if (m.startsWith('video/')) return 'video';
  if (m === 'application/pdf') return 'raw';
  return 'image';
}

/** Effective media type for DB/folder: use file type for video/PDF so tabs work correctly */
function getEffectiveType(mimetype, requestedType) {
  const resourceType = getResourceTypeFromMimetype(mimetype);
  if (resourceType === 'video') return 'video';
  if (resourceType === 'raw') return 'pdf';
  return requestedType;
}

export const uploadMedia = async (req, res) => {
  try {
    const { type, customFolder, replacePublicId } = req.body;
    if (!type || !MEDIA_TYPES.includes(type)) {
      return res
        .status(400)
        .json({ error: 'Invalid type. Use icon, image, background, pdf, or video.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const mimetype = req.file.mimetype || '';
    const resourceType = getResourceTypeFromMimetype(mimetype);
    const effectiveType = getEffectiveType(mimetype, type);

    // Compute Cloudinary folder from effective type (so video/PDF go to correct folder)
    const baseFolder = FOLDERS[effectiveType];
    const custom = (customFolder || '').trim();
    const folderLabel = custom || DEFAULT_FOLDER_LABEL;
    const cloudinaryFolder = custom ? `${baseFolder}/${custom}` : baseFolder;
    const timestamp = Date.now();
    const originalName = req.file.originalname.replace(/\s+/g, '-').toLowerCase();
    const baseName = originalName.replace(/\.[^.]+$/, '');
    const publicId = `${cloudinaryFolder}/${baseName}-${timestamp}`;

    const hash = fileBufferHash(req.file.buffer);
    const duplicate = await Media.findOne({ hash });
    if (duplicate) {
      try {
        // Verify the resource still exists on Cloudinary (pass resource_type for video)
        await cloudinary.api.resource(duplicate.publicId, duplicate.type === 'video' ? { resource_type: 'video' } : {});
        // If exists, return duplicate
        return res.status(200).json({ duplicate: true, media: duplicate });
      } catch (e) {
        // If not found on Cloudinary, remove stale DB record and proceed to upload
        try { await duplicate.deleteOne(); } catch {}
      }
    }

    // Check if file exists in Cloudinary but not in database (was previously deleted)
    let existingCloudinaryResource = null;
    try {
      existingCloudinaryResource = await cloudinary.api.resource(publicId, resourceType === 'video' ? { resource_type: 'video' } : {});
    } catch (e) {
      // File doesn't exist in Cloudinary, proceed with upload
    }

    let result;
    
    if (existingCloudinaryResource) {
      result = existingCloudinaryResource;
    } else {
      // Upload: use resource_type from file mimetype so video/GIF/PDF are handled correctly
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: cloudinaryFolder,
            public_id: publicId,
            resource_type: resourceType,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        uploadStream.end(req.file.buffer);
      });
    }

    // Save to database with effective type (video/pdf/image) so tabs and listing work
    const media = await Media.create({
      type: effectiveType,
      name: baseName,
      publicId: result.public_id,
      url: result.secure_url,
      folder: folderLabel, // global folder label, independent of type
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      format: result.format,
      hash,
      uploadedBy: req.user?._id || null,
    });

    if (replacePublicId && replacePublicId !== media.publicId) {
      try {
        await cloudinary.uploader.destroy(replacePublicId, {
          resource_type: media.type === "video" ? "video" : "image",
        });
      } catch (destroyErr) {
        console.warn("Failed to delete replaced asset:", destroyErr?.message);
      }
    }

    return res.json({ success: true, media });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Upload error', details: err.message });
  }
};

export const listMedia = async (req, res) => {
  try {
    const { type, q, folder } = req.query;
    const filter = {};
    const userId = req.user?._id;
    if (userId) {
      filter.uploadedBy = userId;
    }
    // If a folder is selected, show all types inside it; otherwise allow type filter
    if (
      !folder &&
      type &&
      MEDIA_TYPES.includes(type)
    ) {
      filter.type = type;
    }
    if (folder) filter.folder = folder; // global folder label
    if (q) filter.name = { $regex: q, $options: 'i' };
    const items = await Media.find(filter).sort({ createdAt: -1 }).limit(200);

    // Get unique global folders (independent of type) for this user only
    const folderFilter = userId ? { uploadedBy: userId } : {};
    const folders = await Media.distinct('folder', folderFilter);

    return res.json({ success: true, items, folders });
  } catch (err) {
    return res.status(500).json({ error: 'List error', details: err.message });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);
    if (!media) return res.status(404).json({ error: 'Not found' });
    const userId = req.user?._id || req.user?.id;
    const isAdmin = req.user?.role === "admin" || req.user?.role === "superadmin";
    if (!isAdmin && media.uploadedBy && String(media.uploadedBy) !== String(userId)) {
      return res.status(403).json({ error: "Not authorized to delete this media" });
    }
    
    // Only delete from database, keep the file in Cloudinary
    // This prevents 404 errors for existing cards that use this media
    await media.deleteOne();
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Delete error', details: err.message });
  }
};

export const uploadMultipleMedia = async (req, res) => {
  try {
    const { type, customFolder, replacePublicIds } = req.body;
    if (!type || !MEDIA_TYPES.includes(type)) {
      return res
        .status(400)
        .json({ error: 'Invalid type. Use icon, image, background, pdf, or video.' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const custom = (customFolder || '').trim();
    const folderLabel = custom || DEFAULT_FOLDER_LABEL;

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const mimetype = file.mimetype || '';
        const resourceType = getResourceTypeFromMimetype(mimetype);
        const effectiveType = getEffectiveType(mimetype, type);
        const baseFolder = FOLDERS[effectiveType];
        const cloudinaryFolderFile = custom ? `${baseFolder}/${custom}` : baseFolder;

        const timestamp = Date.now();
        const originalName = file.originalname.replace(/\s+/g, '-').toLowerCase();
        const baseName = originalName.replace(/\.[^.]+$/, '');
        const publicId = `${cloudinaryFolderFile}/${baseName}-${timestamp}`;

        const hash = fileBufferHash(file.buffer);
        const duplicate = await Media.findOne({ hash });
        
        let result;
        if (duplicate) {
          try {
            await cloudinary.api.resource(duplicate.publicId, duplicate.type === 'video' ? { resource_type: 'video' } : {});
            result = { public_id: duplicate.publicId, secure_url: duplicate.url, bytes: duplicate.bytes, width: duplicate.width, height: duplicate.height, format: duplicate.format };
            results.push({ duplicate: true, media: duplicate });
            continue;
          } catch (e) {
            try { await duplicate.deleteOne(); } catch {}
          }
        }

        let existingCloudinaryResource = null;
        try {
          existingCloudinaryResource = await cloudinary.api.resource(publicId, resourceType === 'video' ? { resource_type: 'video' } : {});
        } catch (e) {}

        if (existingCloudinaryResource) {
          result = existingCloudinaryResource;
        } else {
          result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: cloudinaryFolderFile,
                public_id: publicId,
                resource_type: resourceType,
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            uploadStream.end(file.buffer);
          });
        }

        const media = await Media.create({
          type: effectiveType,
          name: baseName,
          publicId: result.public_id,
          url: result.secure_url,
          folder: folderLabel,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          format: result.format,
          hash,
          uploadedBy: req.user?._id || null,
        });

        results.push({ success: true, media });
      } catch (err) {
        errors.push({ file: file.originalname, error: err.message });
      }
    }

    // Best-effort cleanup for replaced assets in bulk mode.
    if (replacePublicIds) {
      const ids = String(replacePublicIds)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      for (const publicId of ids) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
        } catch (destroyErr) {
          console.warn("Failed to delete replaced asset (bulk):", destroyErr?.message);
        }
      }
    }

    return res.json({ success: true, results, errors });
  } catch (err) {
    console.error('Mass upload error:', err);
    return res.status(500).json({ error: 'Upload error', details: err.message });
  }
};

export const deleteMultipleMedia = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'No IDs provided' });
    }

    const userId = req.user?._id || req.user?.id;
    const isAdmin = req.user?.role === "admin" || req.user?.role === "superadmin";
    const filter = { _id: { $in: ids } };
    if (!isAdmin) filter.uploadedBy = userId;
    const results = await Media.deleteMany(filter);
    return res.json({ success: true, deletedCount: results.deletedCount });
  } catch (err) {
    return res.status(500).json({ error: 'Delete error', details: err.message });
  }
};

export const renameFolder = async (req, res) => {
  try {
    const { oldFolder, newFolder } = req.body || {};

    if (!oldFolder || !newFolder) {
      return res.status(400).json({ error: 'Both oldFolder and newFolder are required' });
    }

    const trimmedOld = String(oldFolder).trim();
    const trimmedNew = String(newFolder).trim();

    if (!trimmedOld || !trimmedNew) {
      return res.status(400).json({ error: 'Folder names cannot be empty' });
    }

    if (trimmedOld === trimmedNew) {
      return res.status(400).json({ error: 'New folder name must be different' });
    }

    const disallowed = ['..'];
    if (disallowed.some(token => trimmedNew.includes(token))) {
      return res.status(400).json({ error: 'Invalid folder name' });
    }

    const result = await Media.updateMany(
      { folder: trimmedOld },
      { folder: trimmedNew }
    );

    return res.json({
      success: true,
      message: 'Folder renamed successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Rename folder error:', err);
    return res.status(500).json({ error: 'Rename error', details: err.message });
  }
};

/**
 * Permanently delete a Cloudinary asset by publicId.
 * Used by direct-upload flows to clean up replaced assets.
 *
 * Body: { publicId: string, resourceType?: 'image' | 'video' | 'raw' }
 */
export const destroyAsset = async (req, res) => {
  try {
    const { publicId, resourceType } = req.body || {};
    const pid = typeof publicId === "string" ? publicId.trim() : "";
    if (!pid) {
      return res.status(400).json({ success: false, error: "publicId is required" });
    }

    const media = await Media.findOne({ publicId: pid });
    if (!media) {
      return res.status(404).json({ success: false, error: "Media not found" });
    }

    const userId = req.user?._id || req.user?.id;
    const isAdmin = req.user?.role === "admin" || req.user?.role === "superadmin";
    if (!isAdmin && media.uploadedBy && String(media.uploadedBy) !== String(userId)) {
      return res.status(403).json({ success: false, error: "Not authorized to delete this media" });
    }

    // Determine resource_type. Default based on stored type (pdf -> raw).
    const rt =
      resourceType === "image" || resourceType === "video" || resourceType === "raw"
        ? resourceType
        : media.type === "video"
          ? "video"
          : media.type === "pdf"
            ? "raw"
            : "image";

    const result = await cloudinary.uploader.destroy(pid, { resource_type: rt });
    // Remove DB record too so library doesn't retain it.
    try {
      await media.deleteOne();
    } catch {}

    return res.json({ success: true, result });
  } catch (err) {
    console.error("Destroy asset error:", err);
    return res.status(500).json({ success: false, error: "Destroy error", details: err.message });
  }
};


