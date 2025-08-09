import dotenv from "dotenv";
import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TradingBot } from "./bot.js";
import { Logger } from "./utils/logger.js";
import { DEFAULT_CONFIG } from "./constants.js";
import bs58 from "bs58";

// Load environment file based on argument or default to .env
const envFile = process.argv[2] || ".env";
dotenv.config({ path: envFile });

const logger = new Logger();

// Helper function to create keypair from different private key formats
function createKeypairFromPrivateKey(privateKeyString) {
  try {
    // Check if it's comma-separated format (array of numbers)
    if (privateKeyString.includes(",")) {
      const privateKeyBytes = new Uint8Array(privateKeyString.split(",").map((num) => parseInt(num)));
      return Keypair.fromSecretKey(privateKeyBytes);
    }
    // Otherwise, assume it's Base58 format
    else {
      const privateKeyBytes = bs58.decode(privateKeyString);
      return Keypair.fromSecretKey(privateKeyBytes);
    }
  } catch (error) {
    throw new Error(`Invalid private key format. Expected comma-separated bytes or Base58 string. Error: ${error.message}`);
  }
}

async function main() {
  try {
    logger.info(`🚀 Starting Solana Trading Bot (Config: ${envFile})`);

    // Validate environment variables
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY is required in .env file");
    }

    // Check for placeholder private key
    if (
      process.env.PRIVATE_KEY === "REPLACE_WITH_YOUR_ACTUAL_PRIVATE_KEY" ||
      process.env.PRIVATE_KEY === "your_private_key_here" ||
      process.env.PRIVATE_KEY.trim() === ""
    ) {
      throw new Error(`
❌ Private key not configured!

Please edit your ${envFile} file and set a valid private key:

PRIVATE_KEY=your_actual_private_key_here

Supported formats:
1. Base58: 4YDtkEXhiD8o5zhUsD1ve3pNJra
2. Comma-separated bytes: 150,92,38,155,143,205,113,129,...

⚠️  Never share your private key or commit it to version control!
      `);
    }

    // Check for missing token address
    if (!process.env.TOKEN_ADDRESS || process.env.TOKEN_ADDRESS.trim() === "") {
      throw new Error("TOKEN_ADDRESS is required in .env file");
    }

    // Initialize connection
    const connection = new Connection(process.env.RPC_URL || DEFAULT_CONFIG.RPC_URL, "confirmed");

    // Create keypair from private key (supports both comma-separated and Base58 formats)
    const keypair = createKeypairFromPrivateKey(process.env.PRIVATE_KEY);

    logger.info(`💰 Wallet Address: ${keypair.publicKey.toString()}`);

    // Check wallet balance
    const balance = await connection.getBalance(keypair.publicKey);
    logger.info(`💵 SOL Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    if (balance < 0.1 * LAMPORTS_PER_SOL) {
      logger.warn("⚠️  Low SOL balance! Consider adding more SOL for trading");
    }

    // Initialize and start the trading bot
    const bot = new TradingBot(connection, keypair, {
      tokenAddress: process.env.TOKEN_ADDRESS,
      solAmountMin: parseFloat(process.env.SOL_AMOUNT_MIN) || DEFAULT_CONFIG.SOL_AMOUNT_MIN,
      solAmountMax: parseFloat(process.env.SOL_AMOUNT_MAX) || DEFAULT_CONFIG.SOL_AMOUNT_MAX,
      tradeIntervalMin: parseInt(process.env.TRADE_INTERVAL_MIN) || DEFAULT_CONFIG.TRADE_INTERVAL_MIN,
      tradeIntervalMax: parseInt(process.env.TRADE_INTERVAL_MAX) || DEFAULT_CONFIG.TRADE_INTERVAL_MAX,
      maxSlippage: parseFloat(process.env.MAX_SLIPPAGE) || DEFAULT_CONFIG.MAX_SLIPPAGE,
      minSolBalance: parseFloat(process.env.MIN_SOL_BALANCE) || DEFAULT_CONFIG.MIN_SOL_BALANCE,
      buyPercentage: parseInt(process.env.BUY_PERCENTAGE) || DEFAULT_CONFIG.BUY_PERCENTAGE,
    });

    await bot.start();
  } catch (error) {
    logger.error("❌ Failed to start trading bot:", error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  logger.info("🛑 Shutting down trading bot...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("🛑 Shutting down trading bot...");
  process.exit(0);
});

main().catch((error) => {
  logger.error("💥 Unexpected error:", error);
  process.exit(1);
});
