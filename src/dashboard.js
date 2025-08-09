import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { spawn, exec } from "child_process";
import fs from "fs";
import { EventEmitter } from "events";
import cookieParser from "cookie-parser";
import UserAuth from "./auth.js";
import { ConfigManager } from "./config-manager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// Configuration
const PORT = 3000;

// Initialize authentication
const userAuth = new UserAuth();

// Clear all user data on startup (optional - can be controlled via environment variable)
const CLEAR_DATA_ON_STARTUP = process.env.CLEAR_DATA_ON_STARTUP === "true" || process.argv.includes("--clear-data");
if (CLEAR_DATA_ON_STARTUP) {
  console.log("🧹 Clearing all user data on startup...");
  userAuth.clearAllUserData();
  console.log("✅ All user data cleared");
}

// User-specific Bot Manager (Hybrid JSON/.env Mode)
class UserBotManager extends EventEmitter {
  constructor(userId) {
    super();
    this.userId = userId;
    this.userDataDir = userAuth.getUserDataDir(userId);

    // Check if JSON configs exist, if not fall back to .env mode
    this.useJsonMode = this.checkJsonConfigsExist();

    if (this.useJsonMode) {
      this.configManager = new ConfigManager(this.userDataDir);
    } else {
      this.userConfigPaths = userAuth.getUserConfigPaths(userId);
    }

    this.bots = {
      bot1: { process: null, status: "stopped", name: "Balanced Bot" },
      bot2: { process: null, status: "stopped", name: "Aggressive Bot" },
      bot3: { process: null, status: "stopped", name: "Conservative Bot" },
    };
    this.logs = [];
    this.maxLogs = 1000;
  }

  checkJsonConfigsExist() {
    try {
      const jsonFiles = [
        path.join(this.userDataDir, "bot1-config.json"),
        path.join(this.userDataDir, "bot2-config.json"),
        path.join(this.userDataDir, "bot3-config.json"),
      ];

      // If at least one JSON config exists, use JSON mode
      return jsonFiles.some((file) => fs.existsSync(file));
    } catch (error) {
      return false;
    }
  }

  startBot(botId) {
    if (this.bots[botId].process) {
      return { success: false, message: "Bot is already running" };
    }

    let configPath;
    let validation;

    if (this.useJsonMode) {
      // JSON Configuration Mode
      validation = this.configManager.validateConfig(botId);

      if (!validation.isValid) {
        return {
          success: false,
          message: `❌ Configuration errors for ${this.bots[botId].name}:\n• ${validation.errors.join("\n• ")}`,
        };
      }

      // Create .env file from JSON config for bot startup
      configPath = this.configManager.createEnvFile(botId);
      if (!configPath) {
        return {
          success: false,
          message: `❌ Failed to create environment file for ${this.bots[botId].name}`,
        };
      }
    } else {
      // .env Configuration Mode
      configPath = this.userConfigPaths[botId];
      if (!fs.existsSync(configPath)) {
        return {
          success: false,
          message: `Configuration file not found. Please configure ${this.bots[botId].name} first.`,
        };
      }

      // Read and validate the .env config
      try {
        const configContent = fs.readFileSync(configPath, "utf8");
        const config = {};

        configContent.split("\n").forEach((line) => {
          line = line.trim();
          if (line && !line.startsWith("#")) {
            const [key, ...valueParts] = line.split("=");
            if (key && valueParts.length > 0) {
              config[key.trim()] = valueParts.join("=").trim();
            }
          }
        });

        // Check for required fields
        if (
          !config.PRIVATE_KEY ||
          config.PRIVATE_KEY === "REPLACE_WITH_YOUR_ACTUAL_PRIVATE_KEY" ||
          config.PRIVATE_KEY === "your_private_key_here" ||
          config.PRIVATE_KEY.trim() === ""
        ) {
          return {
            success: false,
            message: `❌ Private key not configured for ${this.bots[botId].name}. Please configure it first.`,
          };
        }

        if (!config.TOKEN_ADDRESS || config.TOKEN_ADDRESS.trim() === "") {
          return {
            success: false,
            message: `❌ Token address not configured for ${this.bots[botId].name}. Please configure it first.`,
          };
        }
      } catch (error) {
        return {
          success: false,
          message: `❌ Failed to validate configuration: ${error.message}`,
        };
      }
    }

    try {
      const botProcess = spawn("node", ["src/index.js", configPath], {
        cwd: process.cwd(),
        env: { ...process.env },
      });

      this.bots[botId].process = botProcess;
      this.bots[botId].status = "starting";

      // Set a timeout to check if bot started successfully
      const startTimeout = setTimeout(() => {
        if (this.bots[botId].status === "starting") {
          this.bots[botId].status = "error";
          this.addLog(botId, "error", `❌ ${this.bots[botId].name} failed to start (timeout)`);
          this.emit("statusUpdate", this.getStatus());
        }
      }, 10000);

      // Handle bot process events
      botProcess.stdout?.on("data", (data) => {
        const message = data.toString().trim();
        if (message) {
          this.addLog(botId, "info", message);

          // Check for successful startup indicators
          if (message.includes("🚀 Starting Solana Trading Bot") || message.includes("💰 Wallet Address:")) {
            clearTimeout(startTimeout);
            this.bots[botId].status = "running";
            this.addLog(botId, "success", `✅ ${this.bots[botId].name} started successfully`);
            this.emit("statusUpdate", this.getStatus());
          }
        }
      });

      botProcess.stderr?.on("data", (data) => {
        const message = data.toString().trim();
        if (message) {
          this.addLog(botId, "error", message);

          // Check for startup errors
          if (message.includes("❌") || message.includes("Error")) {
            clearTimeout(startTimeout);
            this.bots[botId].status = "error";
            this.emit("statusUpdate", this.getStatus());
          }
        }
      });

      botProcess.on("close", (code) => {
        clearTimeout(startTimeout);
        this.bots[botId].process = null;
        this.bots[botId].status = "stopped";

        if (code === 0) {
          this.addLog(botId, "info", `${this.bots[botId].name} stopped normally`);
        } else {
          this.addLog(botId, "error", `${this.bots[botId].name} stopped with error (code: ${code})`);
        }

        this.emit("statusUpdate", this.getStatus());
      });

      return { success: true, message: `${this.bots[botId].name} is starting...` };
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to start ${this.bots[botId].name}: ${error.message}`,
      };
    }
  }

  stopBot(botId) {
    if (!this.bots[botId].process) {
      return { success: false, message: "Bot is not running" };
    }

    this.bots[botId].process.kill();
    this.bots[botId].process = null;
    this.bots[botId].status = "stopped";

    this.emit("statusChange", this.getStatus());
    return { success: true, message: `${this.bots[botId].name} stopped successfully` };
  }

  addLog(botId, type, message) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      bot: botId,
      type: type,
      message: message,
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.emit("newLog", logEntry);
  }

  getStatus() {
    const status = {};
    let runningCount = 0;

    Object.keys(this.bots).forEach((botId) => {
      status[botId] = this.bots[botId].status;
      if (this.bots[botId].status === "running") {
        runningCount++;
      }
    });

    return { ...status, runningBots: runningCount };
  }

  getLogs(limit = 100) {
    return this.logs.slice(0, limit);
  }

  startAllBots() {
    let started = 0;
    let failed = 0;

    Object.keys(this.bots).forEach((botId) => {
      const result = this.startBot(botId);
      if (result.success) started++;
      else failed++;
    });

    return {
      success: started > 0,
      message: `Started ${started} bots${failed > 0 ? `, ${failed} failed` : ""}`,
    };
  }

  stopAllBots() {
    let stopped = 0;
    Object.keys(this.bots).forEach((botId) => {
      const result = this.stopBot(botId);
      if (result.success) stopped++;
    });

    return {
      success: stopped > 0,
      message: `Stopped ${stopped} bots`,
    };
  }

  cleanup() {
    this.stopAllBots();
    if (this.useJsonMode && this.configManager) {
      this.configManager.cleanup();
    }
  }
}

// Store user bot managers
const userBotManagers = new Map();

// Get or create bot manager for user
function getUserBotManager(userId) {
  if (!userBotManagers.has(userId)) {
    const manager = new UserBotManager(userId);
    userBotManagers.set(userId, manager);
  }
  return userBotManagers.get(userId);
}

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Authentication middleware
async function requireAuth(req, res, next) {
  const sessionId = req.cookies.sessionId;
  const user = userAuth.getUserFromSession(sessionId);

  if (!user) {
    // Create new user session
    const { userId, sessionId: newSessionId } = await userAuth.createUserSession(req);
    res.cookie("sessionId", newSessionId, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
    });
    req.user = userAuth.getUserFromSession(newSessionId);
  } else {
    req.user = user;
  }

  next();
}

// Routes
app.get("/", requireAuth, (req, res) => {
  const botManager = getUserBotManager(req.user.id);
  const status = botManager.getStatus();

  // Convert status to format expected by dashboard template
  const dashboardStatus = {
    runningBots: status.runningBots,
    totalLogs: botManager.getLogs().length,
    bots: [
      { id: "bot1", name: "Balanced Bot", status: status.bot1 },
      { id: "bot2", name: "Aggressive Bot", status: status.bot2 },
      { id: "bot3", name: "Conservative Bot", status: status.bot3 },
    ],
  };

  res.render("dashboard", {
    title: "Trading Bot Dashboard",
    status: dashboardStatus,
    logs: botManager.getLogs(50),
    userId: req.user.id,
  });
});

// API Routes
app.get("/api/status", requireAuth, (req, res) => {
  const botManager = getUserBotManager(req.user.id);
  const status = botManager.getStatus();

  // Convert status to format expected by frontend
  const formattedStatus = {
    runningBots: status.runningBots,
    bots: [
      { id: "bot1", name: "Balanced Bot", status: status.bot1 },
      { id: "bot2", name: "Aggressive Bot", status: status.bot2 },
      { id: "bot3", name: "Conservative Bot", status: status.bot3 },
    ],
  };

  res.json(formattedStatus);
});

app.post("/api/bot/:action/:botId", requireAuth, (req, res) => {
  const { action, botId } = req.params;
  const botManager = getUserBotManager(req.user.id);
  let result;

  switch (action) {
    case "start":
      result = botManager.startBot(botId);
      break;
    case "stop":
      result = botManager.stopBot(botId);
      break;
    default:
      result = { success: false, message: "Invalid action" };
  }

  res.json(result);
});

app.post("/api/bot/:action", requireAuth, (req, res) => {
  const { action } = req.params;
  const botManager = getUserBotManager(req.user.id);
  let result;

  switch (action) {
    case "start":
      result = botManager.startAllBots();
      break;
    case "stop":
      result = botManager.stopAllBots();
      break;
    default:
      result = { success: false, message: "Invalid action" };
  }

  res.json(result);
});

// Configuration API Routes (hybrid JSON/.env mode)
app.get("/api/config/:botId", requireAuth, (req, res) => {
  const { botId } = req.params;
  const botManager = getUserBotManager(req.user.id);

  try {
    let config;

    if (botManager.useJsonMode) {
      // JSON Configuration Mode
      config = botManager.configManager.loadConfig(botId);
    } else {
      // .env Configuration Mode
      const configPaths = userAuth.getUserConfigPaths(req.user.id);
      const configFile = configPaths[botId];
      config = loadEnvConfig(configFile);
    }

    res.json({ success: true, data: config });
  } catch (error) {
    res.json({ success: false, message: `Failed to load configuration: ${error.message}` });
  }
});

app.post("/api/config/:botId", requireAuth, (req, res) => {
  const { botId } = req.params;
  const configData = req.body;
  const botManager = getUserBotManager(req.user.id);

  try {
    if (botManager.useJsonMode) {
      // JSON Configuration Mode
      const result = botManager.configManager.saveConfig(botId, configData);

      if (result.success) {
        res.json({ success: true, message: `Configuration saved for ${botId}`, config: result.config });
      } else {
        res.json({ success: false, message: `Failed to save configuration: ${result.error}` });
      }
    } else {
      // .env Configuration Mode
      const configPaths = userAuth.getUserConfigPaths(req.user.id);
      const configFile = configPaths[botId];

      saveEnvConfig(configFile, configData);
      res.json({ success: true, message: `Configuration saved for ${botId}` });
    }
  } catch (error) {
    res.json({ success: false, message: `Failed to save configuration: ${error.message}` });
  }
});

// Logout route - stops all bots and clears user data
app.post("/api/logout", requireAuth, (req, res) => {
  const userId = req.user.id;

  try {
    // Stop all user bots and cleanup
    const botManager = getUserBotManager(userId);
    botManager.cleanup();

    // Clear user data
    userAuth.clearUserData(userId);

    // Remove user from active managers
    userBotManagers.delete(userId);

    // Clear session cookie with explicit options
    res.clearCookie("sessionId", {
      path: "/",
      httpOnly: true,
      secure: false, // set to true in production with HTTPS
      sameSite: "lax",
    });

    res.json({
      success: true,
      message: "Logged out successfully and data cleared",
      redirect: "/",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.json({ success: false, message: `Logout failed: ${error.message}` });
  }
});

// Heartbeat endpoint to keep session alive
app.post("/api/heartbeat", requireAuth, (req, res) => {
  // Just update the last activity time (handled in requireAuth middleware)
  res.json({ success: true, timestamp: new Date().toISOString() });
});

// Cleanup route for tab close
app.post("/api/cleanup", requireAuth, (req, res) => {
  const userId = req.user.id;

  try {
    // Stop all user bots
    const botManager = getUserBotManager(userId);
    botManager.stopAllBots();

    // Clear user data
    userAuth.clearUserData(userId);

    // Remove user from active managers
    userBotManagers.delete(userId);

    res.json({ success: true, message: "Data cleaned up successfully" });
  } catch (error) {
    console.error("Cleanup error:", error);
    res.json({ success: false, message: `Cleanup failed: ${error.message}` });
  }
});

// Beacon cleanup endpoint (for navigator.sendBeacon)
app.all("/api/beacon-cleanup", (req, res) => {
  try {
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
      const user = userAuth.getUserFromSession(sessionId);
      if (user) {
        const botManager = getUserBotManager(user.id);
        if (botManager) {
          botManager.stopAllBots();
        }
        userAuth.clearUserData(user.id);
        userBotManagers.delete(user.id);
      }
    }
    res.json({ success: true, message: "Beacon cleanup completed" });
  } catch (error) {
    console.error("Beacon cleanup error:", error);
    res.json({ success: false, message: `Beacon cleanup failed: ${error.message}` });
  }
});

// Socket.IO with user isolation
io.on("connection", (socket) => {
  const sessionId = socket.request.headers.cookie?.match(/sessionId=([^;]+)/)?.[1];
  const user = userAuth.getUserFromSession(sessionId);

  if (!user) {
    socket.disconnect();
    return;
  }

  const botManager = getUserBotManager(user.id);

  // Send initial data for this user only
  socket.emit("status", botManager.getStatus());
  socket.emit("logs", botManager.getLogs(50));

  // Listen for user-specific events
  const statusHandler = (status) => socket.emit("statusUpdate", status);
  const logHandler = (logEntry) => socket.emit("newLog", logEntry);

  botManager.on("statusChange", statusHandler);
  botManager.on("newLog", logHandler);

  socket.on("disconnect", () => {
    botManager.off("statusChange", statusHandler);
    botManager.off("newLog", logHandler);
  });
});

// Helper functions (same as before)
function loadEnvConfig(filename) {
  if (!fs.existsSync(filename)) {
    return {
      TOKEN_ADDRESS: "CV9oNz7rjTqCsWHHgqWhoZaaw1LSX96H81Vk5p94Hc2E",
      RPC_URL: "https://api.mainnet-beta.solana.com",
      SOL_AMOUNT_MIN: "0.001",
      SOL_AMOUNT_MAX: "0.01",
      TRADE_INTERVAL_MIN: "30",
      TRADE_INTERVAL_MAX: "300",
      BUY_PERCENTAGE: "80",
      MAX_SLIPPAGE: "0.05",
      MIN_SOL_BALANCE: "0.1",
    };
  }

  const envContent = fs.readFileSync(filename, "utf8");
  const config = {};

  envContent.split("\n").forEach((line) => {
    line = line.trim();
    if (line && !line.startsWith("#")) {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        config[key.trim()] = valueParts.join("=").trim();
      }
    }
  });

  return config;
}

function saveEnvConfig(filename, configData) {
  const envVarMap = {
    privateKey: "PRIVATE_KEY",
    tokenAddress: "TOKEN_ADDRESS",
    rpcUrl: "RPC_URL",
    solAmountMin: "SOL_AMOUNT_MIN",
    solAmountMax: "SOL_AMOUNT_MAX",
    tradeIntervalMin: "TRADE_INTERVAL_MIN",
    tradeIntervalMax: "TRADE_INTERVAL_MAX",
    buyPercentage: "BUY_PERCENTAGE",
    maxSlippage: "MAX_SLIPPAGE",
    minSolBalance: "MIN_SOL_BALANCE",
  };

  let existingConfig = {};
  if (fs.existsSync(filename)) {
    const envContent = fs.readFileSync(filename, "utf8");
    envContent.split("\n").forEach((line) => {
      line = line.trim();
      if (line && !line.startsWith("#")) {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
          existingConfig[key.trim()] = valueParts.join("=").trim();
        }
      }
    });
  }

  Object.entries(configData).forEach(([fieldName, value]) => {
    const envVar = envVarMap[fieldName];
    if (envVar && value !== undefined) {
      existingConfig[envVar] = value.trim();
    }
  });

  const envContent = `# Solana Trading Bot Configuration

# Required: Your wallet's private key (supports two formats)
PRIVATE_KEY=${existingConfig.PRIVATE_KEY !== undefined ? existingConfig.PRIVATE_KEY : "REPLACE_WITH_YOUR_ACTUAL_PRIVATE_KEY"}

# Required: Token address to trade
TOKEN_ADDRESS=${existingConfig.TOKEN_ADDRESS !== undefined ? existingConfig.TOKEN_ADDRESS : "CV9oNz7rjTqCsWHHgqWhoZaaw1LSX96H81Vk5p94Hc2E"}

# Optional: Solana RPC endpoint
RPC_URL=${existingConfig.RPC_URL !== undefined ? existingConfig.RPC_URL : "https://api.mainnet-beta.solana.com"}

# Optional: Trading amount range in SOL
SOL_AMOUNT_MIN=${existingConfig.SOL_AMOUNT_MIN !== undefined ? existingConfig.SOL_AMOUNT_MIN : "0.001"}
SOL_AMOUNT_MAX=${existingConfig.SOL_AMOUNT_MAX !== undefined ? existingConfig.SOL_AMOUNT_MAX : "0.01"}

# Optional: Interval between trades in seconds
TRADE_INTERVAL_MIN=${existingConfig.TRADE_INTERVAL_MIN !== undefined ? existingConfig.TRADE_INTERVAL_MIN : "30"}
TRADE_INTERVAL_MAX=${existingConfig.TRADE_INTERVAL_MAX !== undefined ? existingConfig.TRADE_INTERVAL_MAX : "300"}

# Optional: Maximum slippage tolerance
MAX_SLIPPAGE=${existingConfig.MAX_SLIPPAGE !== undefined ? existingConfig.MAX_SLIPPAGE : "0.05"}

# Optional: Minimum SOL balance to maintain
MIN_SOL_BALANCE=${existingConfig.MIN_SOL_BALANCE !== undefined ? existingConfig.MIN_SOL_BALANCE : "0.1"}

# Optional: Buy percentage
BUY_PERCENTAGE=${existingConfig.BUY_PERCENTAGE !== undefined ? existingConfig.BUY_PERCENTAGE : "80"}
`;

  // Ensure directory exists
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filename, envContent);
}

// Cleanup old sessions every hour
setInterval(() => {
  userAuth.cleanupSessions();
}, 60 * 60 * 1000);

// More frequent cleanup of orphaned user data (every 10 minutes)
setInterval(() => {
  userAuth.cleanupOrphanedDirectories();
}, 10 * 60 * 1000);

// Cleanup inactive bot managers (every 5 minutes)
setInterval(() => {
  for (const [userId, manager] of userBotManagers.entries()) {
    const user = userAuth.users.get(userId);
    if (!user) {
      // User no longer exists, cleanup the manager
      manager.cleanup();
      userBotManagers.delete(userId);
    }
  }
}, 5 * 60 * 1000);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Trading Bot Dashboard running at http://localhost:${PORT}`);
});

export default app;
