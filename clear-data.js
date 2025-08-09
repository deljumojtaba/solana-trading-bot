#!/usr/bin/env node

// Simple script to clear all user data before starting the app
import fs from "fs";
import path from "path";

const userDataDir = path.join(process.cwd(), "user_data");

function clearAllData() {
  try {
    console.log("🧹 Clearing all user data...");

    if (fs.existsSync(userDataDir)) {
      // Remove entire user_data directory
      fs.rmSync(userDataDir, { recursive: true, force: true });
      console.log(`🗑️ Deleted: ${userDataDir}`);
    }

    // Recreate empty directory
    fs.mkdirSync(userDataDir, { recursive: true });
    console.log(`📁 Recreated: ${userDataDir}`);

    console.log("✅ All user data cleared successfully!");
  } catch (error) {
    console.error("❌ Failed to clear user data:", error.message);
    process.exit(1);
  }
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  clearAllData();
}

export default clearAllData;
