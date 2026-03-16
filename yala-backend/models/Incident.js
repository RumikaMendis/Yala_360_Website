const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  jeepId: { type: String, required: true },
  type: { type: String, enum: ['breakdown', 'medical', 'violation', 'sighting'], required: true },
  description: String,
  location: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  timestamp: { type: Date, default: Date.now },
  synced: { type: Boolean, default: false } // CRITICAL for offline mode
}, { timestamps: true });

module.exports = mongoose.model('Incident', incidentSchema);
