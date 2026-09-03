require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ MONGODB_URI is missing from your .env file!');
  process.exit(1);
}

const siteSchema = new mongoose.Schema({
  siteCode: { type: String, required: true, unique: true },
  siteName: { type: String, required: true },
  region: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

const locationSchema = new mongoose.Schema({
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  locationName: { type: String, required: true },
  description: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

const inspectionSchema = new mongoose.Schema({
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  inspectionType: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  score: Number
}, { timestamps: true });

const Site = mongoose.model('Site', siteSchema);
const Location = mongoose.model('Location', locationSchema);
const Inspection = mongoose.model('Inspection', inspectionSchema);

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);

    await Site.collection.dropIndexes().catch(() => {});
    await Location.collection.dropIndexes().catch(() => {});
    await Inspection.collection.dropIndexes().catch(() => {});

    await Promise.all([
      Site.deleteMany({}),
      Location.deleteMany({}),
      Inspection.deleteMany({})
    ]);

    const siteTypes = ['Distribution', 'Headquarters', 'Manufacturing', 'Warehouse', 'Laboratory', 'Substation', 'Data Center', 'Refinery', 'Terminal', 'Plant'];
    const sitesData = siteTypes.map((type, index) => ({
      siteCode: `SITE-${String(index + 1).padStart(3, '0')}`,
      siteName: `${type} Facility ${index + 1}`,
      region: ['North', 'South', 'East', 'West', 'Central'][index % 5],
      active: true
    }));

    const createdSites = await Site.insertMany(sitesData);

    const baseLocations = [
      'Main Entrance & Lobby', 
      'Control Room / Operations', 
      'Server & Electrical Hub', 
      'Loading Dock Bay'
    ];
    
    let allLocations = [];
    let allInspections = [];

    createdSites.forEach((site, index) => {
      for (let i = 0; i < 4; i++) {
        allLocations.push({
          siteId: site._id,
          locationName: `${baseLocations[i]} - Site ${index + 1} Zone ${i + 1}`,
          description: `Primary inspection zone ${i + 1} for ${site.siteName}`,
          active: true
        });
      }

      allInspections.push(
        { siteId: site._id, inspectionType: 'Health and Safety Inspections', status: 'Completed', score: Math.floor(Math.random() * 30) + 70 },
        { siteId: site._id, inspectionType: 'Fire Equipment', status: 'Pending', score: null }
      );
    });

    await Location.insertMany(allLocations);
    await Inspection.insertMany(allInspections);

    console.log('SUCCESS: Seeded 10 sites with 4 unique locations each.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();