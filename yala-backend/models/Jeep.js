const mongoose = require('mongoose');

const jeepSchema = new mongoose.Schema({
  jeepId: { type: String, required: true, unique: true },
  driverName: String,
  licensePlate: String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  status: { 
    type: String, 
    enum: ['active', 'offline', 'maintenance', 'in-red-zone'], 
    default: 'offline' 
  },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// CRITICAL: For GPS tracking and "near me" queries
jeepSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Jeep', jeepSchema);
