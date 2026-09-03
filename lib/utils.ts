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
  
  // If the string lacks timezone info, force it to UTC by appending 'Z'
  if (typeof timestamp === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
    dateStr += 'Z';
  }
  
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Invalid Date";

  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    ...options
  });
}
