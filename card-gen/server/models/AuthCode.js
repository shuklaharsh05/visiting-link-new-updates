import mongoose from 'mongoose';

const authCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  used: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
  allowedOrigin: { type: String },
});

authCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('AuthCode', authCodeSchema);


