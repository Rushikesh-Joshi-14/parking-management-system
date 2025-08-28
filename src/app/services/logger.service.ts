import { Injectable } from '@angular/core';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
}

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly STORAGE_KEY = 'app_logs';
  private readonly MAX_ENTRIES = 500;
  private enabled = true;
  private levelPriority: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
  };
  private currentLevel: LogLevel = 'info';

  setEnabled(isEnabled: boolean): void {
    this.enabled = isEnabled;
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.write('debug', message, context, data);
  }

  info(message: string, context?: string, data?: unknown): void {
    this.write('info', message, context, data);
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.write('warn', message, context, data);
  }

  error(message: string, context?: string, data?: unknown): void {
    this.write('error', message, context, data);
  }

  getLogs(): LogEntry[] {
    return this.readFromStorage();
  }

  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private write(level: LogLevel, message: string, context?: string, data?: unknown): void {
    if (!this.enabled) return;
    if (this.levelPriority[level] < this.levelPriority[this.currentLevel]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
    };

    // Console output for dev visibility
    this.consoleWrite(entry);

    // Persist
    const logs = this.readFromStorage();
    logs.push(entry);
    // Trim to max entries
    if (logs.length > this.MAX_ENTRIES) {
      logs.splice(0, logs.length - this.MAX_ENTRIES);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
  }

  private readFromStorage(): LogEntry[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as LogEntry[];
    } catch {
      return [];
    }
  }

  private consoleWrite(entry: LogEntry): void {
    const parts = [`[${entry.timestamp}]`, entry.level.toUpperCase(), entry.context ? `[${entry.context}]` : '', '-', entry.message]
      .filter(Boolean)
      .join(' ');
    switch (entry.level) {
      case 'debug':
        console.debug(parts, entry.data ?? '');
        break;
      case 'info':
        console.info(parts, entry.data ?? '');
        break;
      case 'warn':
        console.warn(parts, entry.data ?? '');
        break;
      case 'error':
        console.error(parts, entry.data ?? '');
        break;
    }
  }
}

