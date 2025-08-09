#!/usr/bin/env node

import { exec } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const botConfig = process.argv[2] || "default";

// Map bot configs to environment files
const configFiles = {
  default: ".env",
  bot1: ".env",
  bot2: ".env.bot2",
  bot3: ".env.bot3",
};

const envFile = configFiles[botConfig];

if (!envFile) {
  console.error(`❌ Unknown bot configuration: ${botConfig}`);
  console.log("Available configurations: default, bot1, bot2, bot3");
  process.exit(1);
}

console.log(`🤖 Starting bot with configuration: ${botConfig} (${envFile})`);

// Set environment file and start bot
process.env.NODE_CONFIG_ENV = envFile;

// Import and run the main bot
import("./index.js");
