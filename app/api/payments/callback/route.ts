import { NextResponse } from "next/server";
import { handlePaymentCallback } from "@/application/payments/handle-payment-callback";
import { developmentRetailOrders } from "@/infrastructure/orders/retail-order-repository";
import { developmentNotifications } from "@/infrastructure/notifications/notification-repository";
import { DevelopmentPaymentCallbackVerifier } from "@/infrastructure/payments/payment-provider";

export async function POST(request: Request) {
  if (String(process.env.NODE_ENV) === "production") return NextResponse.json({ accepted: false }, { status: 503 });
  const result = await handlePaymentCallback(request, new DevelopmentPaymentCallbackVerifier(), developmentRetailOrders, developmentNotifications);
  if (!result.accepted) return NextResponse.json({ accepted: false }, { status: 400 });
  return NextResponse.json({ accepted: true, duplicate: result.duplicate });
}
