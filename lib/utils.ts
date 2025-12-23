import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely renders an address whether it's a string or an object with { street, location }
 */
export function renderAddress(address: any): string {
  if (!address) return "";
  if (typeof address === "string") return address;
  if (typeof address === "object" && address.street) return address.street;
  return "";
}

