import { z } from "zod";

/** The runtime mode is deliberately explicit. Production never uses seeded data. */
export const runtimeSchema = z.enum(["database", "development"]);
export type BacshopRuntime = z.infer<typeof runtimeSchema>;

const nonEmpty = z.string().trim().min(1);
const optionalNonEmpty = nonEmpty.optional();

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off", ""].includes(normalized)) return false;
  return value;
}, z.boolean());

const optionalBooleanFromEnv = booleanFromEnv.optional();
const positiveInteger = z.coerce.number().int().positive();
const optionalPositiveInteger = positiveInteger.optional();

/**
 * Raw environment schema. Cross-field and production rules live in
 * `loadConfig`, so importing this module never validates the host environment.
 */
export const environmentSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    BACSHOP_RUNTIME: runtimeSchema.optional(),
    APP_ORIGIN: z.string().trim().url().optional(),
    TRUSTED_ORIGINS: optionalNonEmpty,

    DATABASE_URL: optionalNonEmpty,
    DIRECT_URL: optionalNonEmpty,
    DB_POOL_MAX: optionalPositiveInteger,
    DB_CONNECT_TIMEOUT_MS: optionalPositiveInteger,

    SESSION_SECRET: optionalNonEmpty,
    MFA_ENCRYPTION_KEY: optionalNonEmpty,
    ENCRYPTION_KEY: optionalNonEmpty,
    SESSION_TTL_SECONDS: optionalPositiveInteger,
    ADMIN_SESSION_TTL_SECONDS: optionalPositiveInteger,
    ADMIN_REAUTH_TTL_SECONDS: optionalPositiveInteger,
    TRUST_PROXY: optionalBooleanFromEnv,

    EMAIL_ENABLED: optionalBooleanFromEnv,
    EMAIL_REQUIRED: optionalBooleanFromEnv,
    SMTP_HOST: optionalNonEmpty,
    SMTP_PORT: optionalPositiveInteger,
    SMTP_USER: optionalNonEmpty,
    SMTP_PASSWORD: optionalNonEmpty,
    SMTP_FROM: optionalNonEmpty,
    SMTP_SECURE: optionalBooleanFromEnv,

    MIDTRANS_ENABLED: optionalBooleanFromEnv,
    MIDTRANS_SERVER_KEY: optionalNonEmpty,
    MIDTRANS_MERCHANT_ID: optionalNonEmpty,
    MIDTRANS_IS_PRODUCTION: optionalBooleanFromEnv,
    MIDTRANS_API_BASE_URL: z.string().trim().url().optional(),
    MIDTRANS_TIMEOUT_MS: optionalPositiveInteger,

    MEDIA_STORAGE: z.enum(["local", "object"]).optional(),
    MEDIA_LOCAL_DIR: optionalNonEmpty,
    OBJECT_STORAGE_PROVIDER: optionalNonEmpty,
    OBJECT_STORAGE_ENDPOINT: z.string().trim().url().optional(),
    OBJECT_STORAGE_REGION: optionalNonEmpty,
    OBJECT_STORAGE_BUCKET: optionalNonEmpty,
    OBJECT_STORAGE_ACCESS_KEY: optionalNonEmpty,
    OBJECT_STORAGE_SECRET_KEY: optionalNonEmpty,
    OBJECT_STORAGE_PUBLIC_BASE_URL: z.string().trim().url().optional(),
    OBJECT_STORAGE_USE_IAM: optionalBooleanFromEnv,

    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
    LOG_FORMAT: z.enum(["json", "pretty"]).optional(),
    ERROR_REPORTING_DSN: z.string().trim().url().optional(),
    ERROR_REPORTING_ENVIRONMENT: optionalNonEmpty,

    ANALYTICS_ENABLED: optionalBooleanFromEnv,
    ANALYTICS_PROVIDER: optionalNonEmpty,
    ANALYTICS_ENVIRONMENT: optionalNonEmpty,
    ANALYTICS_API_KEY: optionalNonEmpty,
    ANALYTICS_ENDPOINT: z.string().trim().url().optional(),

    RATE_LIMIT_PROVIDER: z.enum(["memory", "database", "redis"]).optional(),
    REDIS_URL: optionalNonEmpty,
    PORT: optionalPositiveInteger,
  })
  .passthrough();

export type RawEnvironment = z.infer<typeof environmentSchema>;

export interface AppConfig {
  runtime: BacshopRuntime;
  nodeEnv: "development" | "test" | "production";
  isProduction: boolean;
  appOrigin: string;
  trustedOrigins: string[];
  database: {
    url?: string;
    directUrl?: string;
    poolMax: number;
    connectTimeoutMs: number;
  };
  auth: {
    sessionSecret?: string;
    mfaEncryptionKey?: string;
    sessionTtlSeconds: number;
    adminSessionTtlSeconds: number;
    adminReauthTtlSeconds: number;
  };
  email: {
    enabled: boolean;
    required: boolean;
    smtp?: {
      host: string;
      port: number;
      user?: string;
      password?: string;
      from: string;
      secure: boolean;
    };
  };
  payments: {
    midtrans: {
      enabled: boolean;
      serverKey?: string;
      merchantId?: string;
      production: boolean;
      apiBaseUrl: string;
      timeoutMs: number;
    };
  };
  media: {
    storage: "local" | "object";
    localDir: string;
    object?: {
      provider?: string;
      endpoint?: string;
      region?: string;
      bucket?: string;
      accessKey?: string;
      secretKey?: string;
      publicBaseUrl?: string;
      useIam: boolean;
    };
  };
  observability: {
    logLevel: "debug" | "info" | "warn" | "error";
    logFormat: "json" | "pretty";
    errorReportingDsn?: string;
    errorReportingEnvironment: string;
  };
  analytics: {
    enabled: boolean;
    provider?: string;
    environment?: string;
    apiKey?: string;
    endpoint?: string;
  };
  rateLimit: {
    provider: "memory" | "database" | "redis";
    redisUrl?: string;
  };
  trustProxy: boolean;
  port: number;
}

export class ConfigurationError extends Error {
  readonly issues: readonly z.ZodIssue[];

  constructor(issues: readonly z.ZodIssue[]) {
    super(`Invalid application configuration (${issues.length} issue${issues.length === 1 ? "" : "s"})`);
    this.name = "ConfigurationError";
    this.issues = issues;
  }
}

const isPureOrigin = (origin: string) => {
  try {
    const url = new URL(origin);
    return Boolean(url.protocol && url.hostname && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash);
  } catch {
    return false;
  }
};

const isProductionOrigin = (origin: string) => {
  if (!isPureOrigin(origin)) return false;
  const url = new URL(origin);
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (url.protocol !== "https:") return false;
  if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname) || hostname.endsWith(".local")) return false;
  if (/^10\.|^192\.168\.|^169\.254\./.test(hostname)) return false;
  const private172 = hostname.match(/^172\.(\d+)\./);
  if (private172 && Number(private172[1]) >= 16 && Number(private172[1]) <= 31) return false;
  return true;
};

const isPlaceholder = (value: string | undefined) => {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return !normalized || /^<[^>]+>$/.test(normalized) || normalized.includes("replace-with") || normalized.includes("example.invalid") || /^(user|password|host|database|bucket|secret|key)([-_]|$)/.test(normalized);
};

const decodedByteLength = (value: string) => {
  if (/^[0-9a-f]+$/i.test(value) && value.length % 2 === 0) return value.length / 2;
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    try {
      return Buffer.from(value, "base64").length;
    } catch {
      return 0;
    }
  }
  return 0;
};

const isSecretAtLeast32Bytes = (value: string | undefined) => {
  if (isPlaceholder(value)) return false;
  const bytes = decodedByteLength(value!.trim());
  return bytes >= 32 && !/^(.)\1+$/.test(value!.trim());
};

const isSecretExactly32Bytes = (value: string | undefined) => {
  if (isPlaceholder(value)) return false;
  const bytes = decodedByteLength(value!.trim());
  return bytes === 32 && !/^(.)\1+$/.test(value!.trim());
};

const isHttpsUrl = (value: string | undefined) => {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const isOfficialMidtransUrl = (value: string) => {
  try {
    const url = new URL(value);
    return !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash && ["https://api.midtrans.com", "https://api.sandbox.midtrans.com"].includes(url.origin);
  } catch {
    return false;
  }
};

const listOrigins = (value: string | undefined, fallback: string) => {
  const values = value
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return values?.length ? Array.from(new Set(values)) : [fallback];
};

const addIssue = (issues: z.ZodIssue[], path: string, message: string) => {
  issues.push({ code: "custom", path: [path], message });
};

export function loadConfig(input: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): AppConfig {
  const parsed = environmentSchema.safeParse(input);
  if (!parsed.success) throw new ConfigurationError(parsed.error.issues);

  const raw = parsed.data;
  const nodeEnv = raw.NODE_ENV ?? "development";
  const isProduction = nodeEnv === "production";
  const runtime = raw.BACSHOP_RUNTIME ?? (isProduction ? undefined : "development");
  const issues: z.ZodIssue[] = [];

  if (!runtime) addIssue(issues, "BACSHOP_RUNTIME", "must be set to database or development");
  if (isProduction && runtime !== "database") addIssue(issues, "BACSHOP_RUNTIME", "production requires database runtime");

  if (runtime === "database" || isProduction) {
    let validDatabaseUrl = false;
    try {
      const databaseUrl = new URL(raw.DATABASE_URL ?? "");
      validDatabaseUrl = ["postgres:", "postgresql:"].includes(databaseUrl.protocol) && Boolean(databaseUrl.hostname) && databaseUrl.pathname.length > 1;
      if (isProduction && [databaseUrl.username, databaseUrl.password, databaseUrl.hostname, databaseUrl.pathname.slice(1)].some((part) => isPlaceholder(decodeURIComponent(part)))) validDatabaseUrl = false;
    } catch { /* Report only the variable name; never include its value. */ }
    if (!validDatabaseUrl) addIssue(issues, "DATABASE_URL", "database runtime requires a configured PostgreSQL connection URL");
  }

  const appOrigin = raw.APP_ORIGIN ?? "http://localhost:3000";
  if (!isPureOrigin(appOrigin)) addIssue(issues, "APP_ORIGIN", "must be a pure origin without path, query, or credentials");
  if (isProduction && !isProductionOrigin(appOrigin)) addIssue(issues, "APP_ORIGIN", "production requires a public HTTPS origin");

  const trustedOrigins = listOrigins(raw.TRUSTED_ORIGINS, appOrigin);
  if (isProduction) {
    for (const origin of trustedOrigins) {
      if (!isPureOrigin(origin)) addIssue(issues, "TRUSTED_ORIGINS", "trusted origins must be pure origins without paths or credentials");
      if (!isProductionOrigin(origin)) addIssue(issues, "TRUSTED_ORIGINS", "production trusted origins must use public HTTPS origins");
    }
  } else {
    for (const origin of trustedOrigins) if (!isPureOrigin(origin)) addIssue(issues, "TRUSTED_ORIGINS", "trusted origins must be pure origins without paths or credentials");
  }
  if (!trustedOrigins.includes(appOrigin)) addIssue(issues, "TRUSTED_ORIGINS", "must include APP_ORIGIN");

  const mfaKey = raw.MFA_ENCRYPTION_KEY ?? raw.ENCRYPTION_KEY;
  if ((runtime === "database" || isProduction) && !isSecretAtLeast32Bytes(raw.SESSION_SECRET)) addIssue(issues, "SESSION_SECRET", "must be at least 32 random bytes encoded as hex or base64");
  if ((runtime === "database" || isProduction) && !isSecretExactly32Bytes(mfaKey)) addIssue(issues, "MFA_ENCRYPTION_KEY", "must be exactly 32 random bytes encoded as hex or base64");

  const emailEnabled = raw.EMAIL_ENABLED ?? false;
  const emailRequired = raw.EMAIL_REQUIRED ?? false;
  if (emailRequired && !emailEnabled) addIssue(issues, "EMAIL_ENABLED", "must be true when email is required");
  if (emailEnabled && isPlaceholder(raw.SMTP_HOST)) addIssue(issues, "SMTP_HOST", "is required when email is enabled");
  if (emailEnabled && isPlaceholder(raw.SMTP_FROM)) addIssue(issues, "SMTP_FROM", "is required when email is enabled");
  if (emailEnabled && Boolean(raw.SMTP_USER) !== Boolean(raw.SMTP_PASSWORD)) addIssue(issues, "SMTP_USER", "SMTP user and password must be configured together");

  const mediaStorage = raw.MEDIA_STORAGE ?? (isProduction ? "object" : "local");
  if (isProduction && mediaStorage !== "object") addIssue(issues, "MEDIA_STORAGE", "production requires object media storage");
  if (mediaStorage === "object") {
    if (isPlaceholder(raw.OBJECT_STORAGE_PROVIDER)) addIssue(issues, "OBJECT_STORAGE_PROVIDER", "is required for object media storage");
    if (isPlaceholder(raw.OBJECT_STORAGE_BUCKET)) addIssue(issues, "OBJECT_STORAGE_BUCKET", "is required for object media storage");
    if (isProduction && !isHttpsUrl(raw.OBJECT_STORAGE_ENDPOINT)) addIssue(issues, "OBJECT_STORAGE_ENDPOINT", "production object storage requires an HTTPS endpoint");
    if (isProduction && !isProductionOrigin(raw.OBJECT_STORAGE_PUBLIC_BASE_URL ?? "")) addIssue(issues, "OBJECT_STORAGE_PUBLIC_BASE_URL", "production object storage requires a public HTTPS base origin");
    const hasAccess = !isPlaceholder(raw.OBJECT_STORAGE_ACCESS_KEY);
    const hasSecret = !isPlaceholder(raw.OBJECT_STORAGE_SECRET_KEY);
    if (hasAccess !== hasSecret) addIssue(issues, "OBJECT_STORAGE_ACCESS_KEY", "access and secret credentials must be configured together");
    if (isProduction && !raw.OBJECT_STORAGE_USE_IAM && (!hasAccess || !hasSecret)) addIssue(issues, "OBJECT_STORAGE_USE_IAM", "configure both object storage credentials or enable IAM");
  }

  const midtransProduction = raw.MIDTRANS_IS_PRODUCTION ?? isProduction;
  const midtransBaseUrl = raw.MIDTRANS_API_BASE_URL ?? (midtransProduction ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com");
  if (!isOfficialMidtransUrl(midtransBaseUrl)) addIssue(issues, "MIDTRANS_API_BASE_URL", "must be an official Midtrans HTTPS endpoint");
  const midtransHost = (() => {
    try {
      return new URL(midtransBaseUrl).hostname;
    } catch {
      return "";
    }
  })();
  if (midtransProduction && midtransHost !== "api.midtrans.com") addIssue(issues, "MIDTRANS_API_BASE_URL", "production Midtrans must use api.midtrans.com");
  if (!midtransProduction && midtransHost !== "api.sandbox.midtrans.com") addIssue(issues, "MIDTRANS_API_BASE_URL", "sandbox Midtrans must use api.sandbox.midtrans.com");
  const midtransEnabled = raw.MIDTRANS_ENABLED ?? Boolean(raw.MIDTRANS_SERVER_KEY);
  if (midtransEnabled && isPlaceholder(raw.MIDTRANS_SERVER_KEY)) addIssue(issues, "MIDTRANS_SERVER_KEY", "is required when Midtrans is enabled");

  const analyticsEnabled = raw.ANALYTICS_ENABLED ?? Boolean(raw.ANALYTICS_PROVIDER);
  if (analyticsEnabled && isPlaceholder(raw.ANALYTICS_PROVIDER)) addIssue(issues, "ANALYTICS_PROVIDER", "is required when analytics is enabled");

  const rateLimitProvider = raw.RATE_LIMIT_PROVIDER ?? (isProduction ? "database" : "memory");
  if (isProduction && rateLimitProvider === "memory") addIssue(issues, "RATE_LIMIT_PROVIDER", "production requires a shared rate limit provider");
  if (rateLimitProvider === "redis" && isPlaceholder(raw.REDIS_URL)) addIssue(issues, "REDIS_URL", "is required for redis rate limiting");

  if (issues.length) throw new ConfigurationError(issues);

  return {
    runtime: runtime as BacshopRuntime,
    nodeEnv,
    isProduction,
    appOrigin,
    trustedOrigins,
    database: {
      url: raw.DATABASE_URL,
      directUrl: raw.DIRECT_URL,
      poolMax: raw.DB_POOL_MAX ?? 10,
      connectTimeoutMs: raw.DB_CONNECT_TIMEOUT_MS ?? 5_000,
    },
    auth: {
      sessionSecret: raw.SESSION_SECRET,
      mfaEncryptionKey: mfaKey,
      sessionTtlSeconds: raw.SESSION_TTL_SECONDS ?? 60 * 60 * 24 * 30,
      adminSessionTtlSeconds: raw.ADMIN_SESSION_TTL_SECONDS ?? 60 * 60 * 8,
      adminReauthTtlSeconds: raw.ADMIN_REAUTH_TTL_SECONDS ?? 60 * 5,
    },
    email: {
      enabled: emailEnabled,
      required: emailRequired,
      ...(emailEnabled && raw.SMTP_HOST && raw.SMTP_FROM
        ? {
            smtp: {
              host: raw.SMTP_HOST,
              port: raw.SMTP_PORT ?? 587,
              user: raw.SMTP_USER,
              password: raw.SMTP_PASSWORD,
              from: raw.SMTP_FROM,
              secure: raw.SMTP_SECURE ?? (raw.SMTP_PORT === 465),
            },
          }
        : {}),
    },
    payments: {
      midtrans: {
        enabled: midtransEnabled,
        serverKey: raw.MIDTRANS_SERVER_KEY,
        merchantId: raw.MIDTRANS_MERCHANT_ID,
        production: raw.MIDTRANS_IS_PRODUCTION ?? isProduction,
        apiBaseUrl: midtransBaseUrl,
        timeoutMs: raw.MIDTRANS_TIMEOUT_MS ?? 10_000,
      },
    },
    media: {
      storage: mediaStorage,
      localDir: raw.MEDIA_LOCAL_DIR ?? ".bacshop-uploads",
      ...(mediaStorage === "object"
        ? {
            object: {
              provider: raw.OBJECT_STORAGE_PROVIDER,
              endpoint: raw.OBJECT_STORAGE_ENDPOINT,
              region: raw.OBJECT_STORAGE_REGION,
              bucket: raw.OBJECT_STORAGE_BUCKET,
              accessKey: raw.OBJECT_STORAGE_ACCESS_KEY,
              secretKey: raw.OBJECT_STORAGE_SECRET_KEY,
              publicBaseUrl: raw.OBJECT_STORAGE_PUBLIC_BASE_URL,
              useIam: raw.OBJECT_STORAGE_USE_IAM ?? false,
            },
          }
        : {}),
    },
    observability: {
      logLevel: raw.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
      logFormat: raw.LOG_FORMAT ?? "json",
      errorReportingDsn: raw.ERROR_REPORTING_DSN,
      errorReportingEnvironment: raw.ERROR_REPORTING_ENVIRONMENT ?? nodeEnv,
    },
    analytics: {
      enabled: analyticsEnabled,
      provider: raw.ANALYTICS_PROVIDER,
      environment: raw.ANALYTICS_ENVIRONMENT,
      apiKey: raw.ANALYTICS_API_KEY,
      endpoint: raw.ANALYTICS_ENDPOINT,
    },
    rateLimit: { provider: rateLimitProvider, redisUrl: raw.REDIS_URL },
    trustProxy: raw.TRUST_PROXY ?? false,
    port: raw.PORT ?? 3000,
  };
}

let cachedConfig: AppConfig | undefined;

/** Lazy config accessor keeps Next's static build independent from deployment secrets. */
export function getConfig(): AppConfig {
  cachedConfig ??= loadConfig();
  return cachedConfig;
}

/** Test-only reset hook; no application code should need this. */
export function resetConfigCache() {
  cachedConfig = undefined;
}

export const validateEnvironment = loadConfig;
export const envSchema = environmentSchema;
