const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');

// POST /api/incidents/sync
router.post('/sync', async (req, res) => {
  try {
    // Accepts array of incidents from app that were stored locally
    const { incidents } = req.body; 
    
    if (!Array.isArray(incidents)) {
        return res.status(400).json({ error: 'Incidents must be an array' });
    }

    const results = await Promise.all(incidents.map(async (inc) => {
      // Check for duplicates based on timestamp + jeepId + type
      const exists = await Incident.findOne({
        jeepId: inc.jeepId,
        timestamp: inc.timestamp,
        type: inc.type
      });
      
      if (!exists) {
        return await Incident.create({ ...inc, synced: true });
      }
      return null;
    }));
    
    const syncedCount = results.filter(r => r).length;
    const duplicateCount = results.filter(r => !r).length;

    res.json({ success: true, synced: syncedCount, duplicates: duplicateCount });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
