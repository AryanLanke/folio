// Gentle checks for fields that have an expected format. They return a short
// warning to show under the field, or null. They never block typing.

import { splitLinks } from "@/lib/links";
import { PRESENT } from "@/lib/resume";

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

export function checkEmail(value: string): string | null {
  const text = value.trim();
  if (!text) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text) ? null : "This doesn't look like an email address.";
}

export function checkPhone(value: string): string | null {
  const text = value.trim();
  if (!text) return null;
  if (/[^\d\s()+\-.]/.test(text)) return "Use only digits, spaces and + ( ) -";
  const digits = text.replace(/\D/g, "").length;
  if (digits < 7 || digits > 15) return "Phone numbers usually have 7 to 15 digits.";
  return null;
}

// A link field may hold several links separated by commas; each must look like a web address
export function checkLink(value: string): string | null {
  const bad = splitLinks(value).filter((link) => !/^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(link));
  if (bad.length === 0) return null;
  return value.includes(",") || bad.length > 1 || splitLinks(value).length > 1
    ? `"${bad[0]}" isn't a web address. Separate links with commas, like linkedin.com/in/you, github.com/you`
    : "Use a web address, like linkedin.com/in/you";
}

function toYear(text: string) {
  const year = Number(text);
  return year >= 1950 && year <= 2100 ? year : null;
}

function toMonth(word: string) {
  const lower = word.toLowerCase().replace(/\.$/, "");
  if (lower.length < 3) return null;
  const index = MONTHS.findIndex((month) => month.startsWith(lower));
  return index >= 0 ? index : null;
}

// Converts a resume date into a comparable number (months since year 0), or null if unreadable.
// Accepts "2023", "Jun 2023", "June 2023", "06/2023" and "2023-06".
export function parseDate(value: string): number | null {
  const text = value.trim();
  let match: RegExpMatchArray | null;

  if ((match = text.match(/^(\d{4})$/))) {
    const year = toYear(match[1]);
    return year === null ? null : year * 12;
  }
  if ((match = text.match(/^([a-z]+\.?)\s+(\d{4})$/i))) {
    const month = toMonth(match[1]);
    const year = toYear(match[2]);
    return month === null || year === null ? null : year * 12 + month;
  }
  if ((match = text.match(/^(\d{1,2})[/\-.](\d{4})$/))) {
    const month = Number(match[1]) - 1;
    const year = toYear(match[2]);
    return month < 0 || month > 11 || year === null ? null : year * 12 + month;
  }
  if ((match = text.match(/^(\d{4})[/\-.](\d{1,2})$/))) {
    const month = Number(match[2]) - 1;
    const year = toYear(match[1]);
    return month < 0 || month > 11 || year === null ? null : year * 12 + month;
  }
  return null;
}

export function checkDate(value: string): string | null {
  const text = value.trim();
  if (!text || text.toLowerCase() === PRESENT.toLowerCase()) return null;
  return parseDate(text) === null ? 'Use a date like "Jun 2023" or "2023".' : null;
}

// Warns when the end date comes before the start date
export function checkDateRange(start: string, end: string): string | null {
  const from = parseDate(start);
  const to = parseDate(end);
  if (from === null || to === null) return null;
  return to < from ? "The end date is before the start date." : null;
}
