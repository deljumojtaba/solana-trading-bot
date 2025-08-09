import fs from "fs";
import path from "path";

/**
 * JSON-based Configuration Manager
 * Much simpler and more reliable than .env file parsing
 */
export class ConfigManager {
  constructor(userDataDir) {
    this.userDataDir = userDataDir;
    this.configFiles = {
      bot1: path.join(userDataDir, "bot1-config.json"),
      bot2: path.join(userDataDir, "bot2-config.json"),
      bot3: path.join(userDataDir, "bot3-config.json"),
    };
  }

  // Get default configuration template
  getDefaultConfig(botType = "balanced") {
    const configs = {
      balanced: {
        name: "Balanced Bot",
        strategy: "Balanced (60% buy, 40% sell)",
        privateKey: "",
        tokenAddress: "CV9oNz7rjTqCsWHHgqWhoZaaw1LSX96H81Vk5p94Hc2E",
        rpcUrl: "https://api.mainnet-beta.solana.com",
        solAmountMin: "0.0001",
        solAmountMax: "0.001",
        tradeIntervalMin: "60",
        tradeIntervalMax: "180",
        buyPercentage: "60",
        maxSlippage: "0.05",
        minSolBalance: "0.02",
      },
      aggressive: {
        name: "Aggressive Bot",
        strategy: "Aggressive (75% buy, 25% sell)",
        privateKey: "",
        tokenAddress: "CV9oNz7rjTqCsWHHgqWhoZaaw1LSX96H81Vk5p94Hc2E",
        rpcUrl: "https://api.mainnet-beta.solana.com",
        solAmountMin: "0.001",
        solAmountMax: "0.01",
        tradeIntervalMin: "30",
        tradeIntervalMax: "120",
        buyPercentage: "75",
        maxSlippage: "0.08",
        minSolBalance: "0.05",
      },
      conservative: {
        name: "Conservative Bot",
        strategy: "Conservative (55% buy, 45% sell)",
        privateKey: "",
        tokenAddress: "CV9oNz7rjTqCsWHHgqWhoZaaw1LSX96H81Vk5p94Hc2E",
        rpcUrl: "https://api.mainnet-beta.solana.com",
        solAmountMin: "0.0001",
        solAmountMax: "0.0005",
        tradeIntervalMin: "120",
        tradeIntervalMax: "300",
        buyPercentage: "55",
        maxSlippage: "0.03",
        minSolBalance: "0.01",
      },
    };

    return configs[botType] || configs.balanced;
  }

  // Create default configuration files for all bots
  createDefaultConfigs() {
    try {
      // Ensure user directory exists
      if (!fs.existsSync(this.userDataDir)) {
        fs.mkdirSync(this.userDataDir, { recursive: true });
      }

      // Create default configs for each bot
      const botTypes = ["balanced", "aggressive", "conservative"];
      const botIds = ["bot1", "bot2", "bot3"];

      botIds.forEach((botId, index) => {
        const configFile = this.configFiles[botId];
        if (!fs.existsSync(configFile)) {
          const defaultConfig = this.getDefaultConfig(botTypes[index]);
          this.saveConfig(botId, defaultConfig);
        }
      });

      return true;
    } catch (error) {
      console.error(`❌ Failed to create default configs: ${error.message}`);
      return false;
    }
  }

  // Load configuration for a specific bot
  loadConfig(botId) {
    try {
      const configFile = this.configFiles[botId];

      if (!fs.existsSync(configFile)) {
        // Return default config if file doesn't exist
        const botTypes = { bot1: "balanced", bot2: "aggressive", bot3: "conservative" };
        return this.getDefaultConfig(botTypes[botId]);
      }

      const configData = fs.readFileSync(configFile, "utf8");
      const config = JSON.parse(configData);

      return config;
    } catch (error) {
      console.error(`❌ Failed to load config for ${botId}: ${error.message}`);
      // Return default config on error
      const botTypes = { bot1: "balanced", bot2: "aggressive", bot3: "conservative" };
      return this.getDefaultConfig(botTypes[botId]);
    }
  }

  // Save configuration for a specific bot
  saveConfig(botId, configData) {
    try {
      const configFile = this.configFiles[botId];

      // Ensure directory exists
      const dir = path.dirname(configFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Load existing config to preserve any fields not being updated
      const existingConfig = this.loadConfig(botId);

      // Merge new data with existing config
      const updatedConfig = {
        ...existingConfig,
        ...configData,
        lastUpdated: new Date().toISOString(),
      };

      // Write the configuration
      fs.writeFileSync(configFile, JSON.stringify(updatedConfig, null, 2));

      return { success: true, config: updatedConfig };
    } catch (error) {
      console.error(`❌ Failed to save config for ${botId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Validate configuration for bot startup
  validateConfig(botId) {
    const config = this.loadConfig(botId);
    const errors = [];

    // Check required fields
    if (!config.privateKey || config.privateKey.trim() === "") {
      errors.push("Private key is required");
    }

    if (!config.tokenAddress || config.tokenAddress.trim() === "") {
      errors.push("Token address is required");
    }

    // Check private key format
    if (config.privateKey && config.privateKey.trim() !== "") {
      const pk = config.privateKey.trim();

      // Check if it's a placeholder
      if (pk === "REPLACE_WITH_YOUR_ACTUAL_PRIVATE_KEY" || pk === "your_private_key_here" || pk === "your_actual_private_key_here") {
        errors.push("Please replace the placeholder with your actual private key");
      }

      // Basic format validation
      const isBase58 = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/.test(pk);
      const isCommaList = /^\d+,\d+/.test(pk) && pk.split(",").length >= 32;

      if (!isBase58 && !isCommaList) {
        errors.push("Private key must be in Base58 format or comma-separated bytes");
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      config: config,
    };
  }

  // Convert JSON config to .env format for bot startup
  configToEnv(botId) {
    const config = this.loadConfig(botId);

    return `# Generated from JSON configuration
PRIVATE_KEY=${config.privateKey || ""}
TOKEN_ADDRESS=${config.tokenAddress || "CV9oNz7rjTqCsWHHgqWhoZaaw1LSX96H81Vk5p94Hc2E"}
RPC_URL=${config.rpcUrl || "https://api.mainnet-beta.solana.com"}
SOL_AMOUNT_MIN=${config.solAmountMin || "0.001"}
SOL_AMOUNT_MAX=${config.solAmountMax || "0.01"}
TRADE_INTERVAL_MIN=${config.tradeIntervalMin || "30"}
TRADE_INTERVAL_MAX=${config.tradeIntervalMax || "300"}
BUY_PERCENTAGE=${config.buyPercentage || "60"}
MAX_SLIPPAGE=${config.maxSlippage || "0.05"}
MIN_SOL_BALANCE=${config.minSolBalance || "0.1"}
`;
  }

  // Create .env file from JSON config for bot startup
  createEnvFile(botId) {
    try {
      const envContent = this.configToEnv(botId);
      // Create .env file in user data directory, not replacing the JSON extension
      const envFile = path.join(this.userDataDir, `${botId}.env`);

      fs.writeFileSync(envFile, envContent);

      return envFile;
    } catch (error) {
      console.error(`❌ Failed to create .env file for ${botId}: ${error.message}`);
      return null;
    }
  }

  // Clean up user data
  cleanup() {
    try {
      if (fs.existsSync(this.userDataDir)) {
        fs.rmSync(this.userDataDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.error(`❌ Failed to cleanup user data: ${error.message}`);
    }
  }
}
