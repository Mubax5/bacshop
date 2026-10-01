import { randomUUID } from "node:crypto";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogRecord {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  requestId?: string;
  route?: string;
  operation?: string;
  durationMs?: number;
  entityRef?: string;
  context?: Record<string, unknown>;
  errorType?: string;
}

export type LogSink = (record: LogRecord) => void | Promise<void>;

export interface LoggerOptions {
  level?: LogLevel;
  service?: string;
  sink?: LogSink;
  now?: () => Date;
}

const levelRank: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const sensitiveKey = /(?:pass(?:word|phrase)?|hash|secret|token|cookie|authorization|credential|api[-_]?key|server[-_]?key|client[-_]?key|signature|recovery|mfa|otp|email|phone|payload|body|headers?|connection(?:string)?|database[_-]?url)/i;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const bearerPattern = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const secretQueryPattern = /([?&](?:token|secret|key|signature|password|code)=)[^&\s]+/gi;
const postgresUrlPattern = /\bpostgres(?:ql)?:\/\/[^\s'"<>]+/gi;
const secretAssignmentPattern = /\b(password|passphrase|secret|token|api[-_]?key|server[-_]?key|client[-_]?key|signature|credential)\s*[:=]\s*("[^"]*"|'[^']*'|[^\s,;}]+)/gi;

const redactString = (value: string) => value
  .replace(postgresUrlPattern, "[REDACTED_DATABASE_URL]")
  .replace(emailPattern, "[REDACTED_EMAIL]")
  .replace(bearerPattern, "Bearer [REDACTED]")
  .replace(secretQueryPattern, "$1[REDACTED]")
  .replace(secretAssignmentPattern, "$1=[REDACTED]");

const safeErrorType = (value: unknown) => {
  if (!(value instanceof Error)) return undefined;
  const type = value.name || "Error";
  return /^[A-Za-z][A-Za-z0-9_$]{0,80}$/.test(type) ? type : "Error";
};

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[TRUNCATED]";
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") return redactString(value.length > 500 ? `${value.slice(0, 500)}…` : value);
  if (value instanceof Error) return { type: safeErrorType(value) ?? "Error" };
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitize(item, depth + 1));
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 50)) {
      output[key] = sensitiveKey.test(key) ? "[REDACTED]" : sanitize(item, depth + 1);
    }
    return output;
  }
  return undefined;
}

function sanitizeMessage(message: string) {
  return redactString(message.length > 500 ? `${message.slice(0, 500)}…` : message);
}

export function createRequestId(value?: string | null) {
  return value && /^[A-Za-z0-9._:-]{1,128}$/.test(value) ? value : randomUUID();
}

export function createLogger(options: LoggerOptions = {}) {
  const minimum = options.level ?? "info";
  const service = options.service ?? "bacshop";
  const now = options.now ?? (() => new Date());
  const sink: LogSink = options.sink ?? ((record) => {
    const line = JSON.stringify(record);
    if (record.level === "error") process.stderr.write(`${line}\n`);
    else process.stdout.write(`${line}\n`);
  });

  const write = (level: LogLevel, message: string, context?: Record<string, unknown>) => {
    if (levelRank[level] < levelRank[minimum]) return;
    const safeContext = context ? (sanitize(context) as Record<string, unknown>) : undefined;
    const record: LogRecord = {
      timestamp: now().toISOString(),
      level,
      service,
      message: sanitizeMessage(message),
      ...(safeContext?.requestId && typeof safeContext.requestId === "string" ? { requestId: safeContext.requestId } : {}),
      ...(safeContext?.route && typeof safeContext.route === "string" ? { route: safeContext.route } : {}),
      ...(safeContext?.operation && typeof safeContext.operation === "string" ? { operation: safeContext.operation } : {}),
      ...(typeof safeContext?.durationMs === "number" ? { durationMs: safeContext.durationMs } : {}),
      ...(safeContext?.entityRef && typeof safeContext.entityRef === "string" ? { entityRef: safeContext.entityRef } : {}),
      ...(context?.error instanceof Error ? { errorType: safeErrorType(context.error) } : {}),
      ...(safeContext && Object.keys(safeContext).length ? { context: safeContext } : {}),
    };
    return sink(record);
  };

  return {
    debug: (message: string, context?: Record<string, unknown>) => write("debug", message, context),
    info: (message: string, context?: Record<string, unknown>) => write("info", message, context),
    warn: (message: string, context?: Record<string, unknown>) => write("warn", message, context),
    error: (message: string, context?: Record<string, unknown>) => write("error", message, context),
  };
}

export type Logger = ReturnType<typeof createLogger>;

export const logger = createLogger();

export function safeLogContext(context: Record<string, unknown>) {
  return sanitize(context) as Record<string, unknown>;
}
