import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Logger } from "./utils/logger.js";
import { JupiterApi } from "./services/jupiter.js";
import { delay, getRandomAmount, getRandomInterval } from "./utils/helpers.js";
import { SOL_MINT_ADDRESS } from "./constants.js";

export class TradingBot {
  constructor(connection, keypair, config) {
    this.connection = connection;
    this.keypair = keypair;
    this.config = config;
    this.logger = new Logger();
    this.jupiter = new JupiterApi();
    this.isRunning = false;
    this.tokenMint = new PublicKey(config.tokenAddress);
    this.stats = {
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalVolume: 0,
    };
  }

  // Validate bot configuration before starting
  validateConfig() {
    const requiredFields = [
      { key: "tokenAddress", name: "Token Address" },
      { key: "solAmountMin", name: "SOL Amount Min" },
      { key: "solAmountMax", name: "SOL Amount Max" },
      { key: "tradeIntervalMin", name: "Trade Interval Min" },
      { key: "tradeIntervalMax", name: "Trade Interval Max" },
      { key: "buyPercentage", name: "Buy Percentage" },
    ];

    const missingFields = [];
    const invalidFields = [];

    // Check for missing required fields
    for (const field of requiredFields) {
      const value = this.config[field.key];
      if (!value || value === "REPLACE_WITH_YOUR_ACTUAL_PRIVATE_KEY" || value === "your_private_key_here" || value === "") {
        missingFields.push(field.name);
        continue;
      }

      // Additional validation for numeric fields
      if (["solAmountMin", "solAmountMax", "tradeIntervalMin", "tradeIntervalMax", "buyPercentage"].includes(field.key)) {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
          invalidFields.push(`${field.name} (must be a positive number)`);
        }
      }
    }

    // Check private key specifically
    if (!this.keypair || !this.keypair.secretKey || this.keypair.secretKey.length === 0) {
      missingFields.push("Private Key");
    }

    // Validate buy percentage range
    const buyPercentage = parseFloat(this.config.buyPercentage);
    if (!isNaN(buyPercentage) && (buyPercentage < 1 || buyPercentage > 99)) {
      invalidFields.push("Buy Percentage (must be between 1 and 99)");
    }

    // Validate amount ranges
    const minAmount = parseFloat(this.config.solAmountMin);
    const maxAmount = parseFloat(this.config.solAmountMax);
    if (!isNaN(minAmount) && !isNaN(maxAmount) && minAmount >= maxAmount) {
      invalidFields.push("SOL Amount Max must be greater than SOL Amount Min");
    }

    // Validate interval ranges
    const minInterval = parseFloat(this.config.tradeIntervalMin);
    const maxInterval = parseFloat(this.config.tradeIntervalMax);
    if (!isNaN(minInterval) && !isNaN(maxInterval) && minInterval >= maxInterval) {
      invalidFields.push("Trade Interval Max must be greater than Trade Interval Min");
    }

    if (missingFields.length > 0 || invalidFields.length > 0) {
      let errorMessage = "❌ Bot configuration validation failed:\n\n";

      if (missingFields.length > 0) {
        errorMessage += "⚠️ Missing required fields:\n";
        missingFields.forEach((field) => (errorMessage += `   • ${field}\n`));
        errorMessage += "\n";
      }

      if (invalidFields.length > 0) {
        errorMessage += "❗ Invalid field values:\n";
        invalidFields.forEach((field) => (errorMessage += `   • ${field}\n`));
        errorMessage += "\n";
      }

      errorMessage += "💡 Please configure all required fields before starting the bot.";

      throw new Error(errorMessage);
    }

    this.logger.info("✅ Configuration validation passed");
  }

  async start() {
    this.logger.info("🤖 Trading bot starting...");

    // Validate configuration before starting
    try {
      this.validateConfig();
    } catch (error) {
      this.logger.error(error.message);
      throw error;
    }

    this.logger.info(`📊 Token: ${this.config.tokenAddress}`);
    this.logger.info(`💰 Trade range: ${this.config.solAmountMin} - ${this.config.solAmountMax} SOL`);
    this.logger.info(`⏰ Interval range: ${this.config.tradeIntervalMin} - ${this.config.tradeIntervalMax} seconds`);
    this.logger.info(`📈 Buy/Sell ratio: ${this.config.buyPercentage}% buy, ${100 - this.config.buyPercentage}% sell`);

    this.isRunning = true;

    // Start the trading loop
    this.tradingLoop();
  }

  async stop() {
    this.logger.info("🛑 Stopping trading bot...");
    this.isRunning = false;
  }

  async tradingLoop() {
    while (this.isRunning) {
      try {
        // Check if we have enough SOL balance
        const balance = await this.connection.getBalance(this.keypair.publicKey);
        const solBalance = balance / LAMPORTS_PER_SOL;

        if (solBalance < this.config.minSolBalance) {
          this.logger.warn(`⚠️  Low SOL balance: ${solBalance.toFixed(4)} SOL. Pausing trading.`);
          await delay(60000); // Wait 1 minute before checking again
          continue;
        }

        // Decide whether to buy or sell based on configured percentage
        const shouldBuy = Math.random() < this.config.buyPercentage / 100;

        if (shouldBuy) {
          await this.executeBuy();
        } else {
          await this.executeSell();
        }

        // Wait for random interval before next trade
        const interval = getRandomInterval(this.config.tradeIntervalMin, this.config.tradeIntervalMax);

        this.logger.info(`⏳ Waiting ${interval} seconds before next trade...`);
        await delay(interval * 1000);
      } catch (error) {
        this.logger.error("❌ Error in trading loop:", error.message);
        this.stats.failedTrades++;

        // Wait before retrying
        await delay(30000);
      }
    }
  }

  async executeBuy() {
    try {
      const solAmount = getRandomAmount(this.config.solAmountMin, this.config.solAmountMax);

      this.logger.info(`🟢 Executing BUY: ${solAmount} SOL`);

      // Get quote from Jupiter
      const quote = await this.jupiter.getQuote(
        SOL_MINT_ADDRESS, // SOL mint
        this.config.tokenAddress,
        solAmount * LAMPORTS_PER_SOL
      );

      if (!quote) {
        throw new Error("Failed to get quote from Jupiter");
      }

      // Get swap transaction
      const swapTransaction = await this.jupiter.getSwapTransaction(quote, this.keypair.publicKey.toString());

      if (!swapTransaction) {
        throw new Error("Failed to get swap transaction");
      }

      // Execute the transaction
      let signature;
      if (swapTransaction.version !== undefined) {
        // Versioned transaction - sign it first
        swapTransaction.sign([this.keypair]);
        signature = await this.connection.sendTransaction(swapTransaction);
      } else {
        // Legacy transaction
        signature = await this.connection.sendTransaction(swapTransaction, [this.keypair], { skipPreflight: false });
      }

      await this.connection.confirmTransaction(signature);

      this.logger.info(`✅ BUY executed! Signature: ${signature}`);
      this.stats.successfulTrades++;
      this.stats.totalVolume += solAmount;
    } catch (error) {
      this.logger.error("❌ Buy execution failed:", error.message);
      this.stats.failedTrades++;
    }

    this.stats.totalTrades++;
  }

  async executeSell() {
    try {
      // Get token account
      const tokenAccount = await getOrCreateAssociatedTokenAccount(this.connection, this.keypair, this.tokenMint, this.keypair.publicKey);

      const tokenBalance = await this.connection.getTokenAccountBalance(tokenAccount.address);

      if (!tokenBalance.value.uiAmount || tokenBalance.value.uiAmount === 0) {
        this.logger.info("📭 No tokens to sell, skipping sell order");
        return;
      }

      // Sell 1-10% of token balance (reduced from 10-50%)
      const sellPercentage = 0.01 + Math.random() * 0.09; // 1-10%
      const sellAmount = Math.floor(tokenBalance.value.amount * sellPercentage);

      if (sellAmount === 0) {
        this.logger.info("📭 Sell amount too small, skipping");
        return;
      }

      // Cap the sell amount to prevent liquidity issues
      const maxSellAmount = 1000000000000; // 1 trillion tokens max
      const finalSellAmount = Math.min(sellAmount, maxSellAmount);

      this.logger.info(`🔴 Executing SELL: ${finalSellAmount} tokens`);

      // Get quote from Jupiter
      const quote = await this.jupiter.getQuote(
        this.config.tokenAddress,
        SOL_MINT_ADDRESS, // SOL mint
        finalSellAmount
      );

      if (!quote) {
        throw new Error("Failed to get sell quote from Jupiter");
      }

      // Get swap transaction
      const swapTransaction = await this.jupiter.getSwapTransaction(quote, this.keypair.publicKey.toString());

      if (!swapTransaction) {
        throw new Error("Failed to get sell swap transaction");
      }

      // Execute the transaction
      let signature;
      if (swapTransaction.version !== undefined) {
        // Versioned transaction - sign it first
        swapTransaction.sign([this.keypair]);
        signature = await this.connection.sendTransaction(swapTransaction);
      } else {
        // Legacy transaction
        signature = await this.connection.sendTransaction(swapTransaction, [this.keypair], { skipPreflight: false });
      }

      await this.connection.confirmTransaction(signature);

      this.logger.info(`✅ SELL executed! Signature: ${signature}`);
      this.stats.successfulTrades++;
    } catch (error) {
      this.logger.error("❌ Sell execution failed:", error.message);
      this.stats.failedTrades++;
    }

    this.stats.totalTrades++;
  }

  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalTrades > 0 ? ((this.stats.successfulTrades / this.stats.totalTrades) * 100).toFixed(2) + "%" : "0%",
    };
  }
}
