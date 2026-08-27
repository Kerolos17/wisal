import "server-only";

import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { paymentDestinationMethod, paymentDestinations } from "@/db/schema";

export type PaymentDestinationInput = {
  method: typeof paymentDestinationMethod[number];
  labelAr: string;
  labelEn: string;
  recipientName: string;
  accountIdentifier: string;
  bankName: string;
  instructionsAr: string;
  instructionsEn: string;
  active: boolean;
  position: number;
};

const methods = new Set<string>(paymentDestinationMethod);

function clean(value: unknown, field: string, required = true) {
  if (typeof value !== "string") throw new Error(`${field} is required`);
  const normalized = value.trim();
  if (required && !normalized) throw new Error(`${field} is required`);
  if (normalized.length > 500) throw new Error(`${field} is too long`);
  return normalized;
}

export function parsePaymentDestination(input: unknown): PaymentDestinationInput {
  if (!input || typeof input !== "object") throw new Error("Invalid payment destination");
  const value = input as Record<string, unknown>;
  if (typeof value.method !== "string" || !methods.has(value.method)) throw new Error("Invalid payment method");
  if (typeof value.active !== "boolean") throw new Error("Active state is required");
  if (!Number.isInteger(value.position) || Number(value.position) < 0 || Number(value.position) > 100) throw new Error("Invalid destination position");
  return {
    method: value.method as PaymentDestinationInput["method"],
    labelAr: clean(value.labelAr, "Arabic label"),
    labelEn: clean(value.labelEn, "English label"),
    recipientName: clean(value.recipientName ?? "", "Recipient name", value.active),
    accountIdentifier: clean(value.accountIdentifier ?? "", "Account identifier", value.active),
    bankName: clean(value.bankName ?? "", "Bank name", false),
    instructionsAr: clean(value.instructionsAr ?? "", "Arabic instructions", false),
    instructionsEn: clean(value.instructionsEn ?? "", "English instructions", false),
    active: value.active,
    position: Number(value.position),
  };
}

export async function listActivePaymentDestinations() {
  return getDb().select().from(paymentDestinations)
    .where(eq(paymentDestinations.active, true))
    .orderBy(asc(paymentDestinations.position), asc(paymentDestinations.createdAt));
}

export async function listPaymentDestinations() {
  return getDb().select().from(paymentDestinations)
    .orderBy(asc(paymentDestinations.position), asc(paymentDestinations.createdAt));
}

export async function savePaymentDestinations(inputs: PaymentDestinationInput[]) {
  const db = getDb();
  const updatedAt = new Date().toISOString();
  const saved = [];
  for (const input of inputs) {
    const [row] = await db.insert(paymentDestinations).values({ ...input, updatedAt })
      .onConflictDoUpdate({ target: paymentDestinations.method, set: { ...input, updatedAt } })
      .returning();
    saved.push(row);
  }
  return saved.sort((a, b) => a.position - b.position);
}
