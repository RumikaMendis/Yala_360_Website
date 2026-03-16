const Zone = require('../models/Zone');

// Run this once to seed restricted areas
const seedZones = async () => {
  try {
    const zones = [
      {
        name: "Leopard Breeding Sanctuary",
        type: "restricted",
        boundary: {
          type: "Polygon",
          coordinates: [[[81.4, 6.4], [81.41, 6.4], [81.41, 6.41], [81.4, 6.41], [81.4, 6.4]]]
        },
        alertMessage: "CRITICAL: You have entered a restricted breeding zone. Exit immediately."
      }
    ];
    
    await Zone.deleteMany({}); // Clear existing
    await Zone.insertMany(zones);
    console.log('Zones seeded successfully');
  } catch (error) {
    console.error('Error seeding zones:', error);
  }
};

module.exports = { seedZones };
