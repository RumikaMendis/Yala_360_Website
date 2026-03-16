const express = require('express');
const router = express.Router();
const Jeep = require('../models/Jeep');
const Zone = require('../models/Zone');

// POST /api/tracking/update - Driver app sends GPS coords
router.post('/update', async (req, res) => {
  try {
    const { jeepId, coordinates, speed } = req.body; // coordinates: [long, lat]
    const io = req.app.get('io');
    
    // 1. Update jeep location
    const jeep = await Jeep.findOneAndUpdate(
      { jeepId },
      { 
        location: { type: 'Point', coordinates },
        lastUpdated: new Date(),
        status: 'active'
      },
      { upsert: true, new: true }
    );

    // 2. Check if inside any Red Zone (geofencing)
    const redZones = await Zone.find({
      type: 'restricted',
      boundary: {
        $geoIntersects: {
          $geometry: { type: 'Point', coordinates }
        }
      }
    });

    let alerts = [];
    if (redZones.length > 0) {
      alerts = redZones.map(z => z.alertMessage || `Warning: Entering ${z.name}`);
      // Update jeep status to flag violation
      await Jeep.findOneAndUpdate(
        { jeepId }, 
        { status: 'in-red-zone' }
      );
    }

    // Broadcast to admin dashboard
    if (io) {
      io.to('admin-room').emit('location-update', { 
        jeepId, 
        coordinates, 
        status: alerts.length > 0 ? 'violation' : 'active',
        alerts,
        timestamp: new Date()
      });
    }

    res.json({ success: true, alerts, timestamp: new Date() });
  } catch (error) {
    console.error('Tracking update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tracking/live - Admin dashboard gets all active jeeps
router.get('/live', async (req, res) => {
  try {
    const activeJeeps = await Jeep.find(
      { lastUpdated: { $gte: new Date(Date.now() - 10 * 60 * 1000) } } // Active in last 10 mins
    ).select('jeepId driverName location status lastUpdated');
    
    res.json(activeJeeps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
