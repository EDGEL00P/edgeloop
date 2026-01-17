type LogLevel = "debug" | "info" | "warn" | "error";

type LogData = Record<string, unknown>;

interface LogEntry extends LogData {
  level: LogLevel;
  type?: string;
  message?: string;
  timestamp: string;
}

class Logger {
  private level: LogLevel;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor() {
    this.level = (process.env.LOG_LEVEL as LogLevel) || "info";
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.level];
  }

  private formatEntry(level: LogLevel, data: LogData): LogEntry {
    return {
      level,
      timestamp: new Date().toISOString(),
      ...data,
    };
  }

  private output(entry: LogEntry) {
    const { level, timestamp, type, message, ...rest } = entry;
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${type}]`;
    
    if (process.env.NODE_ENV === "development") {
      const colors: Record<LogLevel, string> = {
        debug: "\x1b[36m",
        info: "\x1b[32m",
        warn: "\x1b[33m",
        error: "\x1b[31m",
      };
      const reset = "\x1b[0m";
      const msg = message ? `: ${message}` : "";
      const extra = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : "";
      console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
        `${colors[level]}${prefix}${msg}${extra}${reset}`
      );
    } else {
      console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](
        JSON.stringify(entry)
      );
    }
  }

  debug(data: LogData) {
    if (this.shouldLog("debug")) {
      this.output(this.formatEntry("debug", data));
    }
  }

  info(data: LogData) {
    if (this.shouldLog("info")) {
      this.output(this.formatEntry("info", data));
    }
  }

  warn(data: LogData) {
    if (this.shouldLog("warn")) {
      this.output(this.formatEntry("warn", data));
    }
  }

  error(data: LogData) {
    if (this.shouldLog("error")) {
      this.output(this.formatEntry("error", data));
    }
  }
}

export const logger = new Logger();
export default logger;
