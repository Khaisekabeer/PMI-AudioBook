/**
 * seed.js - Upload local audio + cover files to Cloudinary and seed MongoDB
 * Run from project root: node backend/seed.js
 */
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

dotenv.config({ path: "./backend/.env" });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const authorSchema = new mongoose.Schema({ name: String });
const genreSchema = new mongoose.Schema({ name: String, color: String });
const bookSchema = new mongoose.Schema({
  title: String,
  description: String,
  authors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Author" }],
  genres: [{ type: mongoose.Schema.Types.ObjectId, ref: "Genre" }],
  narrator: String,
  duration: Number,
  audioFile: String,
  coverImage: String,
  rating: { type: Number, default: 0 },
  totalPlays: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  releaseDate: Date,
  language: { type: String, default: "ml" },
}, { timestamps: true });

const Author = mongoose.models.Author || mongoose.model("Author", authorSchema);
const Genre = mongoose.models.Genre || mongoose.model("Genre", genreSchema);
const Book = mongoose.models.Book || mongoose.model("Book", bookSchema);

async function uploadFile(filePath, folder) {
  const resourceType = folder === "covers" ? "image" : "video";
  const name = path.basename(filePath, path.extname(filePath)).replace(/\s+/g, "-").slice(0, 40);
  const publicId = "pmi-audiobook/" + folder + "/" + Date.now() + "-" + name;
  console.log("  Uploading " + path.basename(filePath) + "...");
  const result = await cloudinary.uploader.upload(filePath, { resource_type: resourceType, public_id: publicId });
  console.log("  Done: " + result.secure_url);
  return result.secure_url;
}

const books = [
  {
    title: "Ramayana - Book 1",
    description: "The timeless epic of Ramayana narrated in audio. Book 1 covers the early life of Rama.",
    author: "Valmiki",
    genre: "Epic",
    narrator: "PMI Narrator",
    language: "ml",
    audioFile: "1763646950075-ramayana_bk1_01_griffith_64kb.mp3",
    coverFile: "1763646950426-voruxfavi.ico",
  },
  {
    title: "PMI Audio Chapter 1",
    description: "First chapter of the PMI audiobook collection.",
    author: "PMI Author",
    genre: "General",
    narrator: "PMI Narrator",
    language: "ml",
    audioFile: "1768422177777-audch1.mpeg",
    coverFile: "1768422177716-urban-luxe-.png",
  },
];

async function seed() {
  console.log("\n PMI AudioBook Seeder\n");
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("Connected to MongoDB\n");

  const audioDir = path.join(__dirname, "uploads", "audio");
  const coverDir = path.join(__dirname, "uploads", "covers");

  for (const entry of books) {
    console.log("Processing: " + entry.title);
    const audioPath = path.join(audioDir, entry.audioFile);
    const coverPath = entry.coverFile ? path.join(coverDir, entry.coverFile) : null;

    if (!fs.existsSync(audioPath)) {
      console.log("  Audio not found, skipping: " + entry.audioFile);
      continue;
    }

    const audioUrl = await uploadFile(audioPath, "audio");
    const coverUrl = (coverPath && fs.existsSync(coverPath)) ? await uploadFile(coverPath, "covers") : null;

    const authorDoc = await Author.findOneAndUpdate({ name: entry.author }, { name: entry.author }, { upsert: true, new: true });
    const genreDoc = await Genre.findOneAndUpdate({ name: entry.genre }, { name: entry.genre, color: "#4f86f7" }, { upsert: true, new: true });

    const existing = await Book.findOne({ title: entry.title });
    if (existing) {
      console.log("  Already exists, skipping: " + entry.title);
      continue;
    }

    const book = await Book.create({
      title: entry.title,
      description: entry.description,
      authors: [authorDoc._id],
      genres: [genreDoc._id],
      narrator: entry.narrator,
      language: entry.language,
      audioFile: audioUrl,
      coverImage: coverUrl,
      isActive: true,
      rating: 4.5,
      releaseDate: new Date(),
    });
    console.log("  Created book: " + book._id + "\n");
  }

  console.log("Seeding complete!");
  await mongoose.disconnect();
}

seed().catch(err => { console.error("Seeder failed:", err.message); mongoose.disconnect(); process.exit(1); });
