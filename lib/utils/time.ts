/**
 * Parses a database timestamp and forces it to be treated as UTC.
 * Useful when the DB stores UTC but returns strings without the 'Z' suffix.
 */
export function parseAsUTC(timestamp: string | Date | null | undefined): Date | null {
  if (!timestamp) return null;
  
  let dateStr = timestamp instanceof Date ? timestamp.toISOString() : timestamp;
  
  if (typeof dateStr === 'string') {
    // Replace space with 'T' to ensure standard ISO 8601 parsing across all browsers
    dateStr = dateStr.replace(' ', 'T');
    
    // If it lacks timezone info, append 'Z' to explicitly treat as UTC
    if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
      dateStr += 'Z';
    }
  }
  
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Formats a timestamp into Asia/Kolkata (IST) timezone.
 * Returns format: "YYYY-MM-DD HH:mm:ss"
 */
export function formatIST(timestamp: string | Date | null | undefined): string {
  const date = parseAsUTC(timestamp);
  if (!date) return "--";
  
  const formatter = new Intl.DateTimeFormat('en-CA', { // en-CA gives YYYY-MM-DD
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  return formatter.format(date).replace(', ', ' ');
}

/**
 * Formats a timestamp into Asia/Kolkata (IST) timezone (Time only).
 * Returns format: "HH:mm:ss" (24-hour format)
 */
export function formatISTTime(timestamp: string | Date | null | undefined): string {
  const date = parseAsUTC(timestamp);
  if (!date) return "--:--:--";
  
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
}

/**
 * Formats a timestamp into Asia/Kolkata (IST) timezone (Time with AM/PM).
 * Returns format: "hh:mm:ss AM/PM" (12-hour format)
 */
export function formatISTTime12(timestamp: string | Date | null | undefined): string {
  const date = parseAsUTC(timestamp);
  if (!date) return "--:--:--";
  
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(date);
}
