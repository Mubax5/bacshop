import nodemailer, { type Transporter } from "nodemailer";
import type { AppConfig } from "@/infrastructure/config/env";

export interface EmailDelivery {
  sendVerification(email: string, token: string): Promise<void>;
  sendPasswordReset(email: string, token: string): Promise<void>;
}

export class EmailDeliveryUnavailableError extends Error {
  constructor() {
    super("Transactional email delivery is unavailable");
    this.name = "EmailDeliveryUnavailableError";
  }
}

export class DisabledEmailDelivery implements EmailDelivery {
  async sendVerification(email: string, token: string): Promise<void> {
    void email;
    void token;
    throw new EmailDeliveryUnavailableError();
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    void email;
    void token;
    throw new EmailDeliveryUnavailableError();
  }
}

export class NodemailerEmailDelivery implements EmailDelivery {
  private readonly transporter: Transporter;
  private readonly appOrigin: string;
  private readonly from: string;

  constructor(input: { appOrigin: string; smtp: NonNullable<AppConfig["email"]["smtp"]> }) {
    this.appOrigin = assertAppOrigin(input.appOrigin);
    if (!isSafeSmtpValue(input.smtp.host, 255) || !isSafeSmtpValue(input.smtp.from, 320) || !Number.isInteger(input.smtp.port) || input.smtp.port < 1 || input.smtp.port > 65535) throw new Error("Invalid SMTP configuration");
    if (Boolean(input.smtp.user) !== Boolean(input.smtp.password)) throw new Error("SMTP user and password must be configured together");
    this.from = input.smtp.from;
    this.transporter = nodemailer.createTransport({
      host: input.smtp.host,
      port: input.smtp.port,
      secure: input.smtp.secure,
      requireTLS: !input.smtp.secure,
      auth: input.smtp.user ? { user: input.smtp.user, pass: input.smtp.password ?? "" } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 30_000,
    });
  }

  async sendVerification(email: string, token: string): Promise<void> {
    const recipient = assertEmail(email);
    const verificationUrl = absoluteTokenUrl(this.appOrigin, "/auth/verify", token);
    await this.transporter.sendMail({
      from: this.from,
      to: recipient,
      subject: "Verifikasi email Bacshop",
      text: `Verifikasi email akun Bacshop melalui tautan berikut:\n${verificationUrl}`,
    });
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const recipient = assertEmail(email);
    const resetUrl = absoluteTokenUrl(this.appOrigin, "/auth/reset-password", token);
    await this.transporter.sendMail({
      from: this.from,
      to: recipient,
      subject: "Atur ulang kata sandi Bacshop",
      text: `Atur ulang kata sandi akun Bacshop melalui tautan berikut:\n${resetUrl}`,
    });
  }
}

function isSafeSmtpValue(value: string, maxLength: number): boolean {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength && !/[\r\n]/.test(value);
}

export function createEmailDelivery(config: Pick<AppConfig, "appOrigin" | "email">): EmailDelivery {
  if (!config.email.enabled || !config.email.smtp) return new DisabledEmailDelivery();
  return new NodemailerEmailDelivery({ appOrigin: config.appOrigin, smtp: config.email.smtp });
}

function assertAppOrigin(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") throw new Error();
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error();
    return url.origin;
  } catch {
    throw new Error("APP_ORIGIN must be a safe origin");
  }
}

function assertEmail(value: string): string {
  if (typeof value !== "string" || value.length > 320 || /[\r\n]/.test(value) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("Invalid email address");
  return value;
}

function absoluteTokenUrl(origin: string, pathname: string, token: string): string {
  if (typeof token !== "string" || token.length === 0 || token.length > 4096 || /[\r\n]/.test(token)) throw new Error("Invalid email token");
  const url = new URL(pathname, origin);
  url.searchParams.set("token", token);
  return url.toString();
}
