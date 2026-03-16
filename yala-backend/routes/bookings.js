const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// POST /api/bookings/create
router.post('/create', async (req, res) => {
  const session = await Booking.startSession();
  session.startTransaction();
  
  try {
    const { date, timeSlot, block, jeepId, touristDetails } = req.body;
    
    // Check capacity (max 200 jeeps per day per your report)
    const existingCount = await Booking.countDocuments({
      date: new Date(date),
      timeSlot,
      block,
      status: { $in: ['confirmed', 'checked-in'] }
    }).session(session);
    
    if (existingCount >= 40) { // 40 per slot per block = ~200/day limit
      await session.abortTransaction();
      return res.status(400).json({ error: 'Time slot full' });
    }
    
    // Create booking with QR code
    const qrCode = `YALA-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const booking = await Booking.create([{
      bookingId: qrCode,
      date: new Date(date),
      timeSlot,
      block,
      jeep: jeepId,
      ...touristDetails,
      qrCode,
      status: 'confirmed'
    }], { session });
    
    await session.commitTransaction();
    res.json({ success: true, booking: booking[0], qrCode });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
