import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['icon', 'image', 'background', 'pdf', 'video'],
    required: true,
  },
  name: { type: String, required: true, trim: true },
  publicId: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  folder: { type: String, required: true },
  // Owner of this media item (per-user media manager)
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
    index: true,
  },
  bytes: { type: Number },
  width: { type: Number },
  height: { type: Number },
  format: { type: String },
  hash: { type: String, index: true },
}, { timestamps: true });

MediaSchema.index({ type: 1, name: 1 }, { unique: true });

export default mongoose.model('Media', MediaSchema);


