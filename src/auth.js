import crypto from "crypto";
import fs from "fs";
import path from "path";

// Simple user authentication and session management
class UserAuth {
  constructor() {
    this.users = new Map(); // In production, use a database
    this.sessions = new Map();
    this.userDataDir = path.join(process.cwd(), "user_data");

    // Create user data directory if it doesn't exist
    if (!fs.existsSync(this.userDataDir)) {
      fs.mkdirSync(this.userDataDir, { recursive: true });
    }

    // Clean up any orphaned directories from previous runs
    this.cleanupOrphanedDirectories();

    // Set up periodic cleanup (every hour)
    setInterval(() => {
      this.cleanupSessions();
    }, 60 * 60 * 1000); // 1 hour
  }

  // Generate unique user ID
  generateUserId() {
    return crypto.randomBytes(16).toString("hex");
  }

  // Create a new user session
  async createUserSession(req) {
    const userId = this.generateUserId();
    const sessionId = crypto.randomBytes(32).toString("hex");

    // Create user-specific directory
    const userDir = path.join(this.userDataDir, userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Create default configuration files for the user
    await this.createDefaultConfigs(userId);

    // Store session
    this.sessions.set(sessionId, {
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
    });

    // Store user info
    this.users.set(userId, {
      id: userId,
      directory: userDir,
      createdAt: new Date(),
      sessionId,
    });

    return { userId, sessionId };
  }

  // Get user from session
  getUserFromSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Update last activity
    session.lastActivity = new Date();

    return this.users.get(session.userId);
  }

  // Get user-specific config file paths
  getUserConfigPaths(userId) {
    const userDir = path.join(this.userDataDir, userId);
    return {
      bot1: path.join(userDir, ".env"),
      bot2: path.join(userDir, ".env.bot2"),
      bot3: path.join(userDir, ".env.bot3"),
    };
  }

  // Get user data directory
  getUserDataDir(userId) {
    return path.join(this.userDataDir, userId);
  }

  // Create default configuration files for a new user
  async createDefaultConfigs(userId) {
    try {
      // Import ConfigManager here to avoid circular imports
      const { ConfigManager } = await import("./config-manager.js");

      const userDataDir = this.getUserDataDir(userId);
      const configManager = new ConfigManager(userDataDir);

      // Create JSON configuration files instead of .env files
      const success = configManager.createDefaultConfigs();

      return success;
    } catch (error) {
      console.error(`❌ Error creating default configs for user ${userId}:`, error.message);
      return false;
    }
  }

  // Clean up old sessions (24 hours)
  cleanupSessions() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    const inactiveAge = 2 * 60 * 60 * 1000; // 2 hours of inactivity

    for (const [sessionId, session] of this.sessions.entries()) {
      const age = now - session.createdAt;
      const inactivity = now - session.lastActivity;

      // Clean up if session is too old OR inactive for too long
      if (age > maxAge || inactivity > inactiveAge) {
        // Clear user data for expired session
        const user = this.users.get(session.userId);
        if (user) {
          this.clearUserData(session.userId);
        } else {
          this.sessions.delete(sessionId);
        }
      }
    }

    // Also clean up any orphaned directories
    this.cleanupOrphanedDirectories();
  }

  // Clear all user data (configs, logs, etc.)
  clearUserData(userId) {
    try {
      const user = this.users.get(userId);
      const userDir = path.join(this.userDataDir, userId);

      // Remove user directory and all files (even if user object doesn't exist)
      if (fs.existsSync(userDir)) {
        fs.rmSync(userDir, { recursive: true, force: true });
      }

      if (user) {
        // Remove from sessions
        if (user.sessionId) {
          this.sessions.delete(user.sessionId);
        }

        // Remove user
        this.users.delete(userId);
      }
    } catch (error) {
      console.error(`❌ Failed to clear data for user ${userId}:`, error);
      throw error;
    }
  }

  // Clear ALL user data (for startup cleanup or complete reset)
  clearAllUserData() {
    try {
      // Clear all in-memory data first
      this.users.clear();
      this.sessions.clear();

      // Remove the entire user_data directory
      if (fs.existsSync(this.userDataDir)) {
        fs.rmSync(this.userDataDir, { recursive: true, force: true });
        console.log(`🗑️ Deleted entire user data directory: ${this.userDataDir}`);
      }

      // Recreate the empty user_data directory
      fs.mkdirSync(this.userDataDir, { recursive: true });
      console.log(`📁 Recreated user data directory: ${this.userDataDir}`);
    } catch (error) {
      console.error(`❌ Failed to clear all user data:`, error);
      throw error;
    }
  }

  // Clean up all orphaned user directories
  cleanupOrphanedDirectories() {
    try {
      if (!fs.existsSync(this.userDataDir)) return;

      const directories = fs
        .readdirSync(this.userDataDir, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);

      const activeUserIds = new Set(this.users.keys());

      for (const dirName of directories) {
        if (!activeUserIds.has(dirName)) {
          const orphanedDir = path.join(this.userDataDir, dirName);
          fs.rmSync(orphanedDir, { recursive: true, force: true });
        }
      }
    } catch (error) {
      console.error("❌ Failed to cleanup orphaned directories:", error);
    }
  }
}

export default UserAuth;
