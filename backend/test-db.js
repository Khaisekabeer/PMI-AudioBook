import mongoose from "mongoose";

const mongoUri = "mongodb+srv://audiobook123_db_user:F73KyCipZkcSOxaN@cluster0.k5bhi5k.mongodb.net/?appName=Cluster0";

console.log("Connecting to MongoDB...");
try {
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });
  console.log("SUCCESS: Connected to database!");
  process.exit(0);
} catch (err) {
  console.error("FAILURE: Could not connect to database!");
  console.error(err.message || err);
  process.exit(1);
}
