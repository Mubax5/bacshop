import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppConfig } from "@/infrastructure/config/env";

const { createTransport, sendMail } = vi.hoisted(() => {
  const sendMail = vi.fn().mockResolvedValue({ messageId: "opaque" });
  return { createTransport: vi.fn(() => ({ sendMail })), sendMail };
});

vi.mock("nodemailer", () => ({ default: { createTransport } }));

import { DisabledEmailDelivery, EmailDeliveryUnavailableError, NodemailerEmailDelivery, createEmailDelivery } from "./email-delivery";

const smtp = { host: "smtp.example.com", port: 587, from: "Bacshop <no-reply@example.com>", secure: false };

describe("transactional email delivery", () => {
  beforeEach(() => {
    createTransport.mockClear();
    sendMail.mockClear();
  });

  it("sends canonical absolute verification and reset links without logging token data", async () => {
    const delivery = new NodemailerEmailDelivery({ appOrigin: "https://shop.example.com", smtp });
    await delivery.sendVerification("customer@example.com", "verify-token");
    await delivery.sendPasswordReset("customer@example.com", "reset-token");

    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({ host: "smtp.example.com", port: 587, secure: false, requireTLS: true, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 30_000 }));
    expect(sendMail).toHaveBeenNthCalledWith(1, expect.objectContaining({ to: "customer@example.com", text: expect.stringContaining("https://shop.example.com/auth/verify?token=verify-token") }));
    expect(sendMail).toHaveBeenNthCalledWith(2, expect.objectContaining({ to: "customer@example.com", text: expect.stringContaining("https://shop.example.com/auth/reset-password?token=reset-token") }));
  });

  it("fails honestly when email delivery is disabled", async () => {
    const disabled = new DisabledEmailDelivery();
    await expect(disabled.sendVerification("customer@example.com", "token")).rejects.toBeInstanceOf(EmailDeliveryUnavailableError);
    await expect(disabled.sendPasswordReset("customer@example.com", "token")).rejects.toBeInstanceOf(EmailDeliveryUnavailableError);
    expect(createEmailDelivery({ appOrigin: "http://localhost:3000", email: { enabled: false, required: false } } as Pick<AppConfig, "appOrigin" | "email">)).toBeInstanceOf(DisabledEmailDelivery);
  });

  it("rejects unsafe origins, SMTP header injection, partial auth, and invalid recipients", async () => {
    expect(() => new NodemailerEmailDelivery({ appOrigin: "https://shop.example.com/path", smtp })).toThrow("APP_ORIGIN");
    expect(() => new NodemailerEmailDelivery({ appOrigin: "https://shop.example.com", smtp: { ...smtp, host: "smtp.example.com\r\nX-Injected: yes" } })).toThrow("SMTP");
    expect(() => new NodemailerEmailDelivery({ appOrigin: "https://shop.example.com", smtp: { ...smtp, user: "smtp-user" } })).toThrow("SMTP user");
    const delivery = new NodemailerEmailDelivery({ appOrigin: "https://shop.example.com", smtp });
    await expect(delivery.sendVerification("attacker@example.com\r\nBcc: victim@example.com", "token")).rejects.toThrow("email");
    await expect(delivery.sendPasswordReset("customer@example.com", "token\r\nX-Injected: yes")).rejects.toThrow("token");
    expect(sendMail).not.toHaveBeenCalled();
  });
});
