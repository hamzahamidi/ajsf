import { longDays, longMonths, shortDays, shortMonths } from '../locale-dates/en-US';

/**
 *
 * @param date
 * @param options
 * return a date string which follows the JSON schema standard
 */
export function dateToString(date: string | Date, options: any = {}): string {
  const dateFormat = options.dateFormat || 'YYYY-MM-DD';
  // TODO: Use options.locale to change default format and names
  // const locale = options.locale || 'en-US';
  date = new Date(date || undefined);
  if (!date.getDate()) { return null; }
  const year = date.getFullYear().toString();
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  return dateFormat
    .replace(/S/g, getOrdinal(day))
    .replace(/YYYY/g, year)
    .replace(/YY/g, year.slice(-2))
    .replace(/MMMM/g, longMonths[month])
    .replace(/MMM/g, shortMonths[month])
    .replace(/MM/g, ('0' + (month + 1)).slice(-2))
    .replace(/M/g, month + 1)
    .replace(/DDDD/g, longDays[dayOfWeek])
    .replace(/DDD/g, shortDays[dayOfWeek])
    .replace(/DD/g, ('0' + day).slice(-2))
    .replace(/D/g, day);
}

export function getOrdinal(day: number): string {
  if (day > 3 && day < 21) { return 'th'; }
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
