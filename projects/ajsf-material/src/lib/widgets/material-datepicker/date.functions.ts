export const REGEX_PARSE = /^(\d{4})-?(\d{1,2})-?(\d{0,2})[^0-9]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?.?(\d{1,3})?$/;

export function parseDate(date: string): Date {
  if (!date) { return null; }

  const d = date.match(REGEX_PARSE);
  if (d) {
    return new Date(
      Number(d[1]),
      Number(d[2]) - 1,
      Number(d[3]) || 1,
      Number(d[4]) || 0,
      Number(d[5]) || 0,
      Number(d[6]) || 0,
      Number(d[7]) || 0
    );
  }
  return null;
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
