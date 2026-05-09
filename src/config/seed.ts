// Database seeder — wipes and repopulates Experts collection with realistic dummy data
// Each expert gets time slots for the next 7 days starting from today (UTC)
// Run with: npm run seed

import "dotenv/config";

import mongoose from "mongoose";
import { usePublicMongoDns } from "./dns.js";
import { Expert } from "../models/Expert.js";
import { Booking } from "../models/Booking.js";
import type { ExpertCategory, ISlot } from "../types/index.js";
import { logger } from "../utils/logger.js";

usePublicMongoDns();

interface SeedExpert {
  name: string;
  category: ExpertCategory;
  experience: number;
  rating: number;
  bio: string;
  avatar: string;
}

const experts: SeedExpert[] = [
  { name: "Aarav Mehta", category: "Tech", experience: 8, rating: 4.8, bio: "Senior software architect, full-stack specialist", avatar: "https://i.pravatar.cc/150?img=11" },
  { name: "Priya Sharma", category: "Tech", experience: 6, rating: 4.6, bio: "Mobile and React Native expert, ex-Google", avatar: "https://i.pravatar.cc/150?img=12" },
  { name: "Rohan Kapoor", category: "Tech", experience: 10, rating: 4.9, bio: "Cloud architect and DevOps consultant", avatar: "https://i.pravatar.cc/150?img=13" },
  { name: "Anika Iyer", category: "Finance", experience: 12, rating: 4.7, bio: "CFA, investment strategy and portfolio mgmt", avatar: "https://i.pravatar.cc/150?img=14" },
  { name: "Vikram Singh", category: "Finance", experience: 9, rating: 4.5, bio: "Tax planning and personal finance advisor", avatar: "https://i.pravatar.cc/150?img=15" },
  { name: "Dr. Neha Verma", category: "Health", experience: 15, rating: 4.9, bio: "Clinical nutritionist and wellness coach", avatar: "https://i.pravatar.cc/150?img=16" },
  { name: "Dr. Karthik Rao", category: "Health", experience: 11, rating: 4.7, bio: "Mental health and CBT specialist", avatar: "https://i.pravatar.cc/150?img=17" },
  { name: "Adv. Meera Joshi", category: "Legal", experience: 14, rating: 4.8, bio: "Corporate law and contract review", avatar: "https://i.pravatar.cc/150?img=18" },
  { name: "Adv. Sameer Khan", category: "Legal", experience: 7, rating: 4.4, bio: "Startup legal counsel, IP and compliance", avatar: "https://i.pravatar.cc/150?img=19" },
  { name: "Riya Bansal", category: "Marketing", experience: 8, rating: 4.6, bio: "Growth marketing and brand strategy", avatar: "https://i.pravatar.cc/150?img=20" },
  { name: "Arjun Nair", category: "Marketing", experience: 5, rating: 4.3, bio: "Performance marketing, paid acquisition", avatar: "https://i.pravatar.cc/150?img=21" },
  { name: "Sneha Pillai", category: "Marketing", experience: 9, rating: 4.7, bio: "Content strategy and SEO", avatar: "https://i.pravatar.cc/150?img=22" },
  { name: "Kabir Malhotra", category: "Tech", experience: 4, rating: 4.2, bio: "Frontend specialist, React and TypeScript", avatar: "https://i.pravatar.cc/150?img=23" },
  { name: "Ishaan Reddy", category: "Finance", experience: 6, rating: 4.4, bio: "Crypto and DeFi advisor", avatar: "https://i.pravatar.cc/150?img=24" },
  { name: "Tara Banerjee", category: "Other", experience: 12, rating: 4.8, bio: "Career coach and leadership mentor", avatar: "https://i.pravatar.cc/150?img=25" },
];

// Build a 7-day x 8-slot grid of available time slots in UTC
const buildSlots = (): ISlot[] => {
  const slots: ISlot[] = [];
  const times = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() + i);
    const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
    for (const t of times) {
      slots.push({ date: dateStr, time: t, isBooked: false });
    }
  }
  return slots;
};

const seed = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }

  await mongoose.connect(uri);
  logger.info("Connected for seeding");

  // Wipe existing data so seeds are reproducible across runs
  await Promise.all([Expert.deleteMany({}), Booking.deleteMany({})]);
  logger.info("Cleared existing experts and bookings");

  const docs = experts.map((e) => ({ ...e, availableSlots: buildSlots() }));
  await Expert.insertMany(docs);
  logger.info(`Inserted ${docs.length} experts with slots`);

  await mongoose.disconnect();
  logger.info("Seeding complete");
};

seed().catch((err) => {
  logger.error({ err }, "Seeding failed");
  process.exit(1);
});
