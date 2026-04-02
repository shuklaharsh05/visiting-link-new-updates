import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { uploadMedia, listMedia, deleteMedia, uploadMultipleMedia, deleteMultipleMedia, renameFolder, destroyAsset } from '../controllers/mediaController.js';

const router = express.Router();
// 10MB for images/pdf; use uploadMultiple for video (100MB)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const uploadMultiple = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

router.get('/', protect, listMedia);
router.post('/upload', protect, upload.single('file'), uploadMedia);
router.post('/upload-multiple', protect, uploadMultiple.array('files', 50), uploadMultipleMedia);
router.post('/destroy', protect, destroyAsset);
router.post('/rename-folder', protect, renameFolder);
router.delete('/:id', protect, deleteMedia);
router.post('/delete-multiple', protect, deleteMultipleMedia);

export default router;


