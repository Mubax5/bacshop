export type CheckoutPaymentMethod = "bank_transfer" | "qris";

export interface CheckoutDetails {
  recipientEmail: string;
  paymentMethod: CheckoutPaymentMethod;
  termsAccepted: boolean;
}

export function validateCheckoutDetails(input: Partial<CheckoutDetails>): CheckoutDetails {
  const recipientEmail = String(input.recipientEmail ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) throw new Error("Recipient email tidak valid");
  if (input.paymentMethod !== "bank_transfer" && input.paymentMethod !== "qris") throw new Error("Metode pembayaran tidak valid");
  if (input.termsAccepted !== true) throw new Error("Syarat dan ketentuan wajib disetujui");
  return { recipientEmail, paymentMethod: input.paymentMethod, termsAccepted: true };
}
