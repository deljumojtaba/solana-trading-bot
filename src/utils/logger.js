export class Logger {
  constructor() {
    this.logFile = "trading.log";
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  log(level, message, ...args) {
    const timestamp = this.formatTimestamp();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    console.log(logMessage, ...args);

    // You could also write to file here if needed
    // fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  info(message, ...args) {
    this.log("INFO", message, ...args);
  }

  warn(message, ...args) {
    this.log("WARN", message, ...args);
  }

  error(message, ...args) {
    this.log("ERROR", message, ...args);
  }

  success(message, ...args) {
    this.log("SUCCESS", message, ...args);
  }
}
