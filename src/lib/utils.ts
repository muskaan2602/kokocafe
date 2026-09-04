import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupees.
 * Uses Indian number system: 1,00,000 style for large amounts.
 * Always shows ₹ symbol.
 */
export function formatPrice(amount: number): string {
  if (amount >= 1000) {
    // Indian number system formatting
    return "₹" + amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  }
  return `₹${amount.toFixed(0)}`;
}

/**
 * GST rate — default 5% for food & beverages in India.
 * CGST 2.5% + SGST 2.5% = 5% for restaurant services.
 */
export function calculateTax(subtotal: number, rate = 0.05): number {
  return Math.round(subtotal * rate * 100) / 100;
}

/**
 * Generate a short readable order number.
 */
export function generateOrderNumber(): string {
  return `KOKO${Date.now().toString().slice(-6)}`;
}

/**
 * Format a table token to a display label.
 */
export function formatTableNumber(token: string): string {
  const num = token.replace(/\D/g, "");
  return `Table ${num.padStart(2, "0")}`;
}

/**
 * Format a date in Indian style: dd MMM yyyy (e.g. 01 Sep 2026)
 */
export function formatDateIN(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format date + time in IST-friendly style: dd MMM yyyy, hh:mm AM/PM
 */
export function formatDateTimeIN(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Get today's date string in yyyy-MM-dd in IST.
 * Avoids off-by-one errors on UTC servers.
 */
export function todayIST(): string {
  return new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // en-CA gives yyyy-MM-dd
}

/**
 * Get current month string in yyyy-MM in IST.
 */
export function currentMonthIST(): string {
  return todayIST().slice(0, 7);
}
