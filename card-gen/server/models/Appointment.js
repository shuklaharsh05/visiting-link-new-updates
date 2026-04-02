import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  // Reference to the user who made this appointment
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  // Reference to the card through which appointment was made
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    required: true
  },
  // Appointment details
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  // Appointment status
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'],
    default: 'Pending'
  },
  // Appointment date and time (if applicable)
  appointmentDate: {
    type: Date,
    required: false
  },
  appointmentTime: {
    type: String,
    required: false
  },
  // Admin notes
  adminNotes: {
    type: String,
    trim: true
  },
  // Whether the appointment has been responded to
  responded: {
    type: Boolean,
    default: false
  },
  // Response from business owner
  response: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  collection: 'appointments'
});

// Indexes for better query performance
appointmentSchema.index({ userId: 1, createdAt: -1 }); // Compound index for user appointments
appointmentSchema.index({ cardId: 1, createdAt: -1 }); // Compound index for card appointments
appointmentSchema.index({ status: 1, createdAt: -1 }); // Compound index for status filtering
appointmentSchema.index({ email: 1 }); // Single field index for email lookups
appointmentSchema.index({ userId: 1, status: 1 }); // Compound index for user + status filtering
appointmentSchema.index({ cardId: 1, status: 1 }); // Compound index for card + status filtering
appointmentSchema.index({ createdAt: -1 }); // Single field index for sorting

// Static methods
appointmentSchema.statics.getByStatus = function(status) {
  return this.find({ status: status }).sort({ createdAt: -1 });
};

appointmentSchema.statics.getByUser = function(userId) {
  return this.find({ userId: userId }).sort({ createdAt: -1 });
};

appointmentSchema.statics.getByCard = function(cardId) {
  return this.find({ cardId: cardId }).sort({ createdAt: -1 });
};

appointmentSchema.statics.getPendingAppointments = function() {
  return this.find({ status: 'Pending' }).sort({ createdAt: -1 });
};

export default mongoose.model('Appointment', appointmentSchema);
