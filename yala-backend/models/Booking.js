const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true },
  touristName: String,
  email: String,
  date: { type: Date, required: true },
  timeSlot: { 
    type: String, 
    enum: ['06:00-09:00', '15:00-18:00'], 
    required: true 
  },
  block: { type: String, enum: ['Block I', 'Block II', 'Block III', 'Block IV', 'Block V'], required: true },
  jeep: { type: mongoose.Schema.Types.ObjectId, ref: 'Jeep' },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'checked-in', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  qrCode: String,
  passengerCount: { type: Number, default: 2 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// For finding available slots quickly
bookingSchema.index({ date: 1, timeSlot: 1, block: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
