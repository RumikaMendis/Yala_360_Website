const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  name: { type: String, required: true }, // "Leopard Breeding Area"
  type: { 
    type: String, 
    enum: ['restricted', 'sensitive', 'general'], 
    required: true 
  },
  boundary: {
    type: { type: String, enum: ['Polygon'], default: 'Polygon' },
    coordinates: { type: [[[Number]]], required: true } // GeoJSON Polygon
  },
  maxSpeed: Number, // km/h for speed limit alerts
  alertMessage: String
}, { timestamps: true });

// CRITICAL: For $geoWithin queries (checking if jeep is inside zone)
zoneSchema.index({ boundary: '2dsphere' });

module.exports = mongoose.model('Zone', zoneSchema);
