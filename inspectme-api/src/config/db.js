const mongoose = require("mongoose");

async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  const connection = await mongoose.connect(mongoUri, {
    dbName: "InspectMe",
  });

  return connection;
}

module.exports = {
  connectToDatabase,
};
