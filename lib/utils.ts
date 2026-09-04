import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseAndFormatIST(timestamp: string | Date, options?: Intl.DateTimeFormatOptions): string {
  if (!timestamp) return "Invalid Date";
  
  let dateStr = typeof timestamp === 'string' ? timestamp : timestamp.toISOString();
  
  // Replace space with T to ensure ISO 8601 compliance (fixes Safari Invalid Date bug)
  if (typeof timestamp === 'string') {
    dateStr = dateStr.replace(' ', 'T');
  }
  
  // If the string lacks timezone info, assume it is IST by appending '+05:30'
  if (typeof timestamp === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
    dateStr += '+05:30';
  }
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Invalid Date";

  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    ...options
  });
}
