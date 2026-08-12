const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { connectToDatabase } = require("../config/db");
const User = require("../models/User");
const Site = require("../models/Site");
const Location = require("../models/Location");

dotenv.config();

async function upsertSites() {
  const sites = [
    { siteCode: "JNB", siteName: "Johannesburg" },
    { siteCode: "DBN", siteName: "Durban" },
    { siteCode: "CPT", siteName: "Cape Town" },
  ];

  for (const site of sites) {
    await Site.updateOne({ siteCode: site.siteCode }, { $set: site }, { upsert: true });
  }
}

async function upsertLocations() {
  const sites = await Site.find().select("_id siteCode");
  const siteIdByCode = new Map(sites.map((site) => [site.siteCode, site._id]));

  const locations = [
    { siteCode: "JNB", locationName: "Boardrooms", inspectionType: "Server Room" },
    { siteCode: "JNB", locationName: "Ground Floor Server Room", inspectionType: "Server Room" },
    { siteCode: "JNB", locationName: "4th Floor North Server Room", inspectionType: "Server Room" },
    { siteCode: "JNB", locationName: "4th Floor South Server Room", inspectionType: "Server Room" },
    { siteCode: "JNB", locationName: "5th Floor North Server Room", inspectionType: "Server Room" },
    { siteCode: "JNB", locationName: "5th Floor South Server Room", inspectionType: "Server Room" },
    { siteCode: "JNB", locationName: "6th Floor North Server Room", inspectionType: "Server Room" },
    { siteCode: "JNB", locationName: "6th Floor South Server Room", inspectionType: "Server Room" },
    { siteCode: "DBN", locationName: "Durban Server Room", inspectionType: "Server Room" },
    { siteCode: "DBN", locationName: "Boardrooms", inspectionType: "Server Room" },
    { siteCode: "CPT", locationName: "Cape Town Server Room", inspectionType: "Server Room" },
    { siteCode: "CPT", locationName: "Boardrooms", inspectionType: "Server Room" },
  ];

  for (const location of locations) {
    const siteId = siteIdByCode.get(location.siteCode);

    if (!siteId) {
      throw new Error(`Missing site for code ${location.siteCode}.`);
    }

    await Location.updateOne(
      { siteCode: siteId, locationName: location.locationName },
      {
        $set: {
          siteCode: siteId,
          locationName: location.locationName,
          inspectionType: location.inspectionType,
          active: true,
        },
      },
      { upsert: true }
    );
  }
}

async function upsertUsers() {
  const defaultPassword = process.env.INIT_USER_PASSWORD;

  if (!defaultPassword) {
    throw new Error("INIT_USER_PASSWORD is required to seed users.");
  }

  const users = [
    { username: "Shaun", role: "Administrator" },
    { username: "Diran", role: "Inspector" },
    { username: "Lelwa", role: "Inspector" },
    { username: "Salome", role: "Manager" },
  ];

  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  for (const user of users) {
    const existingUser = await User.findOne({ username: user.username });

    if (existingUser) {
      existingUser.role = user.role;
      existingUser.active = true;
      await existingUser.save();
      continue;
    }

    await User.create({
      username: user.username,
      role: user.role,
      active: true,
      mustChangePassword: true,
      passwordHash,
    });
  }
}

async function seed() {
  await connectToDatabase();
  await upsertSites();
  await upsertLocations();
  await upsertUsers();
  console.log("Initial data seeded successfully.");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error.message);
  process.exit(1);
});
