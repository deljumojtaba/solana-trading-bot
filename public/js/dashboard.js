// Dashboard JavaScript with Socket.IO for real-time updates
class TradingBotDashboard {
  constructor() {
    this.socket = io();
    this.autoScroll = true;
    this.logsContainer = document.getElementById("logs-container");
    this.initializeSocketEvents();
    this.initializeUI();
  }

  initializeSocketEvents() {
    // Real-time log updates
    this.socket.on("newLog", (logEntry) => {
      this.addLogToDisplay(logEntry);
      this.updateLogCount();
    });

    // Bot status updates
    this.socket.on("statusUpdate", (status) => {
      this.updateBotStatus(status);
      this.updateRunningCount(status.runningBots);
    });

    // Initial data
    this.socket.on("status", (status) => {
      this.updateBotStatus(status);
    });

    this.socket.on("logs", (logs) => {
      this.displayLogs(logs);
    });
  }

  initializeUI() {
    // Auto-scroll logs to bottom
    if (this.logsContainer) {
      this.logsContainer.scrollTop = this.logsContainer.scrollHeight;
    }
  }

  addLogToDisplay(logEntry) {
    if (!this.logsContainer) return;

    const logElement = document.createElement("div");
    logElement.className = `log-entry ${logEntry.type}`;
    logElement.setAttribute("data-bot", logEntry.bot);

    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();

    logElement.innerHTML = `
            <span class="log-timestamp">${timestamp}</span>
            <span class="log-bot bot-${logEntry.bot}">${logEntry.bot.toUpperCase()}</span>
            <span class="log-message">${this.escapeHtml(logEntry.message)}</span>
        `;

    this.logsContainer.insertBefore(logElement, this.logsContainer.firstChild);

    // Auto-scroll to top (since we're inserting at the beginning)
    if (this.autoScroll) {
      this.logsContainer.scrollTop = 0;
    }

    // Limit logs displayed (keep only last 200)
    const logEntries = this.logsContainer.querySelectorAll(".log-entry");
    if (logEntries.length > 200) {
      logEntries[logEntries.length - 1].remove();
    }
  }

  displayLogs(logs) {
    if (!this.logsContainer) return;

    this.logsContainer.innerHTML = "";
    logs.forEach((log) => this.addLogToDisplay(log));
  }

  updateBotStatus(status) {
    const botGrid = document.getElementById("bot-grid");
    if (!botGrid) return;

    // Update bot cards
    status.bots.forEach((bot) => {
      const botCard = document.querySelector(`[data-bot-id="${bot.id}"]`);
      if (botCard) {
        // Update status class
        botCard.className = `bot-card ${bot.status}`;

        // Update status indicator
        const statusIndicator = botCard.querySelector(".bot-status-indicator");
        if (statusIndicator) {
          statusIndicator.className = `bot-status-indicator ${bot.status}`;
          statusIndicator.innerHTML = bot.status === "running" ? '<i class="fas fa-circle"></i> Running' : '<i class="fas fa-circle"></i> Stopped';
        }

        // Update action button
        const actionButton = botCard.querySelector(".bot-actions button");
        if (actionButton) {
          if (bot.status === "running") {
            actionButton.className = "btn btn-sm btn-danger";
            actionButton.innerHTML = '<i class="fas fa-stop"></i> Stop';
            actionButton.onclick = () => stopBot(bot.id);
          } else {
            actionButton.className = "btn btn-sm btn-success";
            actionButton.innerHTML = '<i class="fas fa-play"></i> Start';
            actionButton.onclick = () => startBot(bot.id);
          }
        }
      }
    });
  }

  updateRunningCount(count) {
    const runningCountElement = document.getElementById("running-count");
    if (runningCountElement) {
      runningCountElement.textContent = count;
    }
  }

  updateLogCount() {
    const logEntries = document.querySelectorAll(".log-entry");
    const logsCountElement = document.getElementById("logs-count");
    if (logsCountElement) {
      logsCountElement.textContent = logEntries.length;
    }
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }
}

// Initialize dashboard
const dashboard = new TradingBotDashboard();

// Bot control functions
async function startBot(botId) {
  try {
    const response = await fetch(`/api/bot/start/${botId}`, { method: "POST" });
    const result = await response.json();

    if (result.success) {
      dashboard.showToast(result.message, "success");
    } else {
      dashboard.showToast(result.message, "error");
    }
  } catch (error) {
    dashboard.showToast("Failed to start bot", "error");
    console.error("Error starting bot:", error);
  }
}

async function stopBot(botId) {
  try {
    const response = await fetch(`/api/bot/stop/${botId}`, { method: "POST" });
    const result = await response.json();

    if (result.success) {
      dashboard.showToast(result.message, "success");
    } else {
      dashboard.showToast(result.message, "error");
    }
  } catch (error) {
    dashboard.showToast("Failed to stop bot", "error");
    console.error("Error stopping bot:", error);
  }
}

async function startAllBots() {
  try {
    const response = await fetch("/api/bot/start", { method: "POST" });
    const result = await response.json();

    if (result.success) {
      dashboard.showToast(result.message, "success");
    } else {
      dashboard.showToast(result.message, "error");
    }
  } catch (error) {
    dashboard.showToast("Failed to start all bots", "error");
    console.error("Error starting all bots:", error);
  }
}

async function stopAllBots() {
  try {
    const response = await fetch("/api/bot/stop", { method: "POST" });
    const result = await response.json();

    if (result.success) {
      dashboard.showToast(result.message, "success");
    } else {
      dashboard.showToast(result.message, "error");
    }
  } catch (error) {
    dashboard.showToast("Failed to stop all bots", "error");
    console.error("Error stopping all bots:", error);
  }
}

async function refreshStatus() {
  try {
    const response = await fetch("/api/status");
    const status = await response.json();
    dashboard.updateBotStatus(status);
    dashboard.updateRunningCount(status.runningBots);
    dashboard.showToast("Status refreshed", "success");
  } catch (error) {
    dashboard.showToast("Failed to refresh status", "error");
    console.error("Error refreshing status:", error);
  }
}

function clearLogDisplay() {
  const logsContainer = document.getElementById("logs-container");
  if (logsContainer) {
    logsContainer.innerHTML = "";
    dashboard.showToast("Log display cleared", "success");
  }
}

function toggleAutoScroll() {
  dashboard.autoScroll = !dashboard.autoScroll;
  const autoScrollText = document.getElementById("autoscroll-text");
  if (autoScrollText) {
    autoScrollText.textContent = `Auto Scroll: ${dashboard.autoScroll ? "ON" : "OFF"}`;
  }
  dashboard.showToast(`Auto scroll ${dashboard.autoScroll ? "enabled" : "disabled"}`, "success");
}

// Configuration Management
function showConfigTab(botId) {
  // Remove active class from all tabs and forms
  document.querySelectorAll(".tab-button").forEach((tab) => tab.classList.remove("active"));
  document.querySelectorAll(".config-form").forEach((form) => form.classList.remove("active"));

  // Add active class to selected tab and form
  event.target.classList.add("active");
  document.getElementById(`config-${botId}`).classList.add("active");
}

async function loadBotConfig(botId) {
  try {
    const response = await fetch(`/api/config/${botId}`);
    const config = await response.json();

    if (config.success) {
      populateConfigForm(botId, config.data);
      dashboard.showToast("Configuration loaded successfully", "success");
    } else {
      dashboard.showToast(config.message || "Failed to load configuration", "error");
    }
  } catch (error) {
    dashboard.showToast("Failed to load configuration", "error");
    console.error("Error loading config:", error);
  }
}

async function saveBotConfig(botId, event) {
  event.preventDefault();

  console.log("🔧 saveBotConfig called for:", botId);

  const form = event.target;
  const formData = new FormData(form);
  const config = {};

  // Convert form data to object
  for (let [key, value] of formData.entries()) {
    config[key] = value;
  }

  console.log("📋 Form data collected:", config);

  try {
    console.log("🚀 Sending POST request to:", `/api/config/${botId}`);

    const response = await fetch(`/api/config/${botId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });

    console.log("📡 Response received:", response.status);

    const result = await response.json();
    console.log("📝 Response data:", result);

    if (result.success) {
      dashboard.showToast("Configuration saved successfully", "success");
    } else {
      dashboard.showToast(result.message || "Failed to save configuration", "error");
    }
  } catch (error) {
    console.error("❌ Error saving config:", error);
    dashboard.showToast("Failed to save configuration", "error");
  }
}

function populateConfigForm(botId, config) {
  const form = document.getElementById(`config-${botId}`);

  // For JSON config mode, field names match directly
  // For .env config mode, we need to map from env variables
  const isJsonConfig = config.name && config.strategy; // JSON configs have these fields

  let fieldMap;
  if (isJsonConfig) {
    // Direct mapping for JSON configs
    fieldMap = {
      privateKey: "privateKey",
      tokenAddress: "tokenAddress",
      rpcUrl: "rpcUrl",
      solAmountMin: "solAmountMin",
      solAmountMax: "solAmountMax",
      tradeIntervalMin: "tradeIntervalMin",
      tradeIntervalMax: "tradeIntervalMax",
      buyPercentage: "buyPercentage",
      maxSlippage: "maxSlippage",
      minSolBalance: "minSolBalance",
    };
  } else {
    // Map from env variable names to form field names (for .env configs)
    fieldMap = {
      PRIVATE_KEY: "privateKey",
      TOKEN_ADDRESS: "tokenAddress",
      RPC_URL: "rpcUrl",
      SOL_AMOUNT_MIN: "solAmountMin",
      SOL_AMOUNT_MAX: "solAmountMax",
      TRADE_INTERVAL_MIN: "tradeIntervalMin",
      TRADE_INTERVAL_MAX: "tradeIntervalMax",
      BUY_PERCENTAGE: "buyPercentage",
      MAX_SLIPPAGE: "maxSlippage",
      MIN_SOL_BALANCE: "minSolBalance",
    };
  }

  // Populate form fields
  Object.entries(fieldMap).forEach(([configKey, fieldName]) => {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (field && config[configKey] !== undefined) {
      field.value = config[configKey];
    }
  });
}

// Logout functionality
function showLogoutConfirmation() {
  const modal = document.getElementById("logout-modal");
  const overlay = document.getElementById("modal-overlay");
  const runningCount = document.getElementById("running-count").textContent;
  const runningBotsWarning = document.getElementById("running-bots-warning");
  const runningBotsCount = document.getElementById("running-bots-count");

  // Show warning if bots are running
  if (parseInt(runningCount) > 0) {
    runningBotsWarning.style.display = "flex";
    runningBotsCount.textContent = runningCount;
  } else {
    runningBotsWarning.style.display = "none";
  }

  modal.classList.add("show");
  overlay.classList.add("show");

  // Prevent body scroll
  document.body.style.overflow = "hidden";
}

function hideLogoutConfirmation() {
  const modal = document.getElementById("logout-modal");
  const overlay = document.getElementById("modal-overlay");

  modal.classList.remove("show");
  overlay.classList.remove("show");

  // Restore body scroll
  document.body.style.overflow = "auto";
}

async function confirmLogout() {
  const logoutBtn = document.querySelector(".modal-footer .btn-danger");
  const originalContent = logoutBtn.innerHTML;

  try {
    // Show loading state
    logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Stopping bots & clearing data...';
    logoutBtn.disabled = true;

    // Stop all bots first
    const runningCount = parseInt(document.getElementById("running-count").textContent);
    if (runningCount > 0) {
      await stopAllBots();
      // Wait a moment for bots to stop
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Call logout API
    const response = await fetch("/api/logout", { method: "POST" });
    const result = await response.json();

    if (result.success) {
      // Show success message
      logoutBtn.innerHTML = '<i class="fas fa-check"></i> Data cleared successfully!';

      // Show clear logout message
      dashboard.showToast("Session ended. Redirecting to login...", "success");

      // Hide modal
      hideLogoutConfirmation();

      // Clear local storage and session storage
      localStorage.clear();
      sessionStorage.clear();

      // Redirect after short delay
      setTimeout(() => {
        window.location.href = "/";
        // Force reload to clear any cached data
        window.location.reload();
      }, 2000);
    } else {
      throw new Error(result.message || "Logout failed");
    }
  } catch (error) {
    dashboard.showToast("Logout failed: " + error.message, "error");
    logoutBtn.innerHTML = originalContent;
    logoutBtn.disabled = false;
  }
}

// Close modal when clicking overlay
document.addEventListener("click", (e) => {
  if (e.target.id === "modal-overlay") {
    hideLogoutConfirmation();
  }
});

// Handle escape key for modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hideLogoutConfirmation();
  }
});

// Handle tab/window close - cleanup user data
window.addEventListener("beforeunload", async (e) => {
  try {
    // Send cleanup request to server
    await fetch("/api/cleanup", {
      method: "POST",
      keepalive: true, // Ensure request completes even if page is closing
    });
  } catch (error) {
    console.log("Cleanup request failed:", error);
  }
});

// Additional cleanup attempts for better reliability
window.addEventListener("unload", async () => {
  try {
    // Alternative cleanup attempt using sendBeacon (more reliable for page unload)
    navigator.sendBeacon("/api/beacon-cleanup", JSON.stringify({}));
  } catch (error) {
    console.log("Beacon cleanup failed:", error);
  }
});

// Heartbeat to keep session alive and detect when user leaves
let heartbeatInterval;
let isPageActive = true;

function startHeartbeat() {
  heartbeatInterval = setInterval(async () => {
    if (isPageActive) {
      try {
        await fetch("/api/heartbeat", { method: "POST" });
      } catch (error) {
        // If heartbeat fails, connection might be lost
        console.log("Heartbeat failed:", error);
      }
    }
  }, 30000); // Send heartbeat every 30 seconds
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// Handle page visibility change (user switching tabs)
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    // User switched away from tab
    console.log("Tab hidden - user switched away");
    isPageActive = false;
  } else {
    // User returned to tab
    console.log("Tab visible - user returned");
    isPageActive = true;
    refreshStatus(); // Refresh status when user returns
  }
});

// Start heartbeat when page loads
document.addEventListener("DOMContentLoaded", () => {
  startHeartbeat();
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case "r":
        e.preventDefault();
        refreshStatus();
        break;
      case "s":
        e.preventDefault();
        startAllBots();
        break;
      case "x":
        e.preventDefault();
        stopAllBots();
        break;
    }
  }
});

// Add loading animation to buttons (except form submit buttons)
document.addEventListener("click", (e) => {
  if (e.target.matches(".btn") && e.target.type !== "submit") {
    const button = e.target;
    const originalContent = button.innerHTML;

    button.innerHTML = '<div class="loading"></div> Processing...';
    button.disabled = true;

    setTimeout(() => {
      button.innerHTML = originalContent;
      button.disabled = false;
    }, 1000);
  }
});

// Load configurations on page load
document.addEventListener("DOMContentLoaded", () => {
  // Load default configuration for bot1
  setTimeout(() => loadBotConfig("bot1"), 1000);
});

// Copy wallet address function
function copyAddress() {
  const address = "66SZQA9sMcjB6am9jvUkUyCwCv6UXCZWdthDN5M7CDXm";

  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        showToast("✅ Wallet address copied to clipboard!", "success");
      })
      .catch(() => {
        fallbackCopyAddress(address);
      });
  } else {
    fallbackCopyAddress(address);
  }
}

// Fallback copy method for older browsers
function fallbackCopyAddress(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand("copy");
    showToast("✅ Wallet address copied to clipboard!", "success");
  } catch (err) {
    showToast("❌ Failed to copy address. Please copy manually.", "error");
  }

  document.body.removeChild(textArea);
}

// Private Key Masking Functions
function togglePrivateKeyVisibility(botId) {
  const input = document.getElementById(`${botId}-private-key`);
  const maskedDiv = document.getElementById(`${botId}-private-key-masked`);
  const eyeIcon = document.getElementById(`${botId}-eye-icon`);

  if (maskedDiv.style.display === "none") {
    // Hide the private key (show asterisks)
    maskPrivateKey(botId);
    maskedDiv.style.display = "block";
    input.style.opacity = "0";
    eyeIcon.className = "fas fa-eye-slash";
  } else {
    // Show the private key
    maskedDiv.style.display = "none";
    input.style.opacity = "1";
    eyeIcon.className = "fas fa-eye";
  }
}

function maskPrivateKey(botId) {
  const input = document.getElementById(`${botId}-private-key`);
  const maskedDiv = document.getElementById(`${botId}-private-key-masked`);
  const value = input.value.trim();

  if (!value) {
    maskedDiv.innerHTML = '<span style="opacity: 0.6;">Private key will be masked here...</span>';
    return;
  }

  // Create asterisk pattern based on content length
  let maskedContent = "";

  if (value.includes(",")) {
    // Comma-separated format: show structure but mask numbers
    const parts = value.split(",");
    maskedContent = parts
      .map((part, index) => {
        if (index === 0) return "[***";
        if (index === parts.length - 1) return "***]";
        return "***";
      })
      .join(",");
  } else {
    // Base58 format: show first/last few chars, mask middle
    if (value.length > 10) {
      const start = value.substring(0, 4);
      const end = value.substring(value.length - 4);
      const middle = "*".repeat(Math.min(value.length - 8, 40));
      maskedContent = `${start}${middle}${end}`;
    } else {
      maskedContent = "*".repeat(value.length);
    }
  }

  maskedDiv.innerHTML = `<span style="color: #ff6b6b;">🔒 ${maskedContent}</span>`;
}

// Auto-mask private key when user stops typing
function setupPrivateKeyAutoMask(botId) {
  const input = document.getElementById(`${botId}-private-key`);
  const maskedDiv = document.getElementById(`${botId}-private-key-masked`);
  let timeout;

  input.addEventListener("input", () => {
    // Clear previous timeout
    clearTimeout(timeout);

    // Show input while typing
    maskedDiv.style.display = "none";
    input.style.opacity = "1";
    document.getElementById(`${botId}-eye-icon`).className = "fas fa-eye";

    // Auto-hide after 3 seconds of no typing
    timeout = setTimeout(() => {
      if (input.value.trim()) {
        maskPrivateKey(botId);
        maskedDiv.style.display = "block";
        input.style.opacity = "0";
        document.getElementById(`${botId}-eye-icon`).className = "fas fa-eye-slash";
      }
    }, 3000);
  });

  // Also mask when field loses focus
  input.addEventListener("blur", () => {
    clearTimeout(timeout);
    if (input.value.trim()) {
      setTimeout(() => {
        maskPrivateKey(botId);
        maskedDiv.style.display = "block";
        input.style.opacity = "0";
        document.getElementById(`${botId}-eye-icon`).className = "fas fa-eye-slash";
      }, 500);
    }
  });
}

// Initialize private key masking for all bots when page loads
document.addEventListener("DOMContentLoaded", () => {
  // Setup for existing bots
  ["bot1", "bot2", "bot3"].forEach((botId) => {
    const input = document.getElementById(`${botId}-private-key`);
    if (input) {
      setupPrivateKeyAutoMask(botId);
    }
  });
});
