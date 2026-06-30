import fs from 'fs';
import path from 'path';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: any;
}

class StructuredLogger {
  private isProduction = process.env.NODE_ENV === 'production';
  private logFilePath = path.join(process.cwd(), 'production_audit.log');

  private formatMessage(level: LogLevel, message: string, context?: string, metadata?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata
    };
  }

  private writeLog(entry: LogEntry) {
    if (this.isProduction) {
      // In production, write JSON to standard out for log-aggregators, and append to an audit file
      console.log(JSON.stringify(entry));
      try {
        fs.appendFileSync(this.logFilePath, JSON.stringify(entry) + '\n', 'utf8');
      } catch (err) {
        // Fallback if filesystem write is blocked
      }
    } else {
      // Elegant, readable console logging in development
      const color = levelColors[entry.level] || '';
      const reset = '\x1b[0m';
      const ctxStr = entry.context ? ` [${entry.context}]` : '';
      console.log(`${color}[${entry.level}]${reset} ${entry.timestamp}${ctxStr}: ${entry.message}`);
      if (entry.metadata) {
        console.dir(entry.metadata, { depth: 3, colors: true });
      }
    }
  }

  debug(message: string, context?: string, metadata?: any) {
    if (!this.isProduction) {
      this.writeLog(this.formatMessage(LogLevel.DEBUG, message, context, metadata));
    }
  }

  info(message: string, context?: string, metadata?: any) {
    this.writeLog(this.formatMessage(LogLevel.INFO, message, context, metadata));
  }

  warn(message: string, context?: string, metadata?: any) {
    this.writeLog(this.formatMessage(LogLevel.WARN, message, context, metadata));
  }

  error(message: string, context?: string, metadata?: any) {
    this.writeLog(this.formatMessage(LogLevel.ERROR, message, context, metadata));
  }
}

const levelColors: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[36m', // Cyan
  [LogLevel.INFO]: '\x1b[32m',  // Green
  [LogLevel.WARN]: '\x1b[33m',  // Yellow
  [LogLevel.ERROR]: '\x1b[31m'  // Red
};

export const Logger = new StructuredLogger();
