/**
 * 'dateToString' function
 *
 * //  { Date | string } date
 * //   options
 * // { string }
 */
export function dateToString(date, options: any = {}) {
  const dateFormat = options.dateFormat || 'YYYY-MM-DD';
  // TODO: Use options.locale to change default format and names
  // const locale = options.locale || 'en-US';
  if (typeof date === 'string') { date = stringToDate(date); }
  if (Object.prototype.toString.call(date) !== '[object Date]') { return null; }
  const longMonths = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const longDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return dateFormat
    .replace(/YYYY/ig, date.getFullYear() + '')
    .replace(/YY/ig, (date.getFullYear() + '').slice(-2))
    .replace(/MMMM/ig, longMonths[date.getMonth()])
    .replace(/MMM/ig, shortMonths[date.getMonth()])
    .replace(/MM/ig, ('0' + (date.getMonth() + 1)).slice(-2))
    .replace(/M/ig, (date.getMonth() + 1) + '')
    .replace(/DDDD/ig, longDays[date.getDay()])
    .replace(/DDD/ig, shortDays[date.getDay()])
    .replace(/DD/ig, ('0' + date.getDate()).slice(-2))
    .replace(/D/ig, date.getDate() + '')
    .replace(/S/ig, ordinal(date.getDate()));
}

export function ordinal(number: number|string): string {
  if (typeof number === 'number') { number = number + ''; }
  const last = number.slice(-1);
  const nextToLast = number.slice(-2, 1);
  return (nextToLast !== '1' && { '1': 'st', '2': 'nd', '3': 'rd' }[last]) || 'th';
}

/**
 * 'stringToDate' function
 *
 * //  { string } dateString
 * // { Date }
 */
export function stringToDate(dateString) {
  const getDate: string = findDate(dateString);
  if (!getDate) { return null; }
  let dateParts: number[] = [];
  // Split x-y-z to [x, y, z]
  if (/^\d+[^\d]\d+[^\d]\d+$/.test(getDate)) {
    dateParts = getDate.split(/[^\d]/).map(part => +part);
  // Split xxxxyyzz to [xxxx, yy, zz]
  } else if (/^\d{8}$/.test(getDate)) {
    dateParts = [+getDate.slice(0, 4), +getDate.slice(4, 6), +getDate.slice(6)];
  }
  const thisYear = +(new Date().getFullYear() + '').slice(-2);
  // Check for [YYYY, MM, DD]
  if (dateParts[0] > 1000 && dateParts[0] < 2100 && dateParts[1] <= 12 && dateParts[2] <= 31) {
    return new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  // Check for [MM, DD, YYYY]
  } else if (dateParts[0] <= 12 && dateParts[1] <= 31 && dateParts[2] > 1000 && dateParts[2] < 2100) {
    return new Date(dateParts[2], dateParts[0] - 1, dateParts[1]);
  // Check for [MM, DD, YY]
  } else if (dateParts[0] <= 12 && dateParts[1] <= 31 && dateParts[2] < 100) {
    const year = (dateParts[2] <= thisYear ? 2000 : 1900) + dateParts[2];
    return new Date(year, dateParts[0] - 1, dateParts[1]);
  // Check for [YY, MM, DD]
  } else if (dateParts[0] < 100 && dateParts[1] <= 12 && dateParts[2] <= 31) {
    const year = (dateParts[0] <= thisYear ? 2000 : 1900) + dateParts[0];
    return new Date(year, dateParts[1] - 1, dateParts[2]);
  }
  return null;
}

/**
 * 'findDate' function
 *
 * //  { string } text
 * // { string }
 */
export function findDate(text) {
  if (!text) { return null; }
  let foundDate: any[];
  // Match ...YYYY-MM-DD...
  foundDate = text.match(/(?:19|20)\d\d[-_\\\/\. ](?:0?\d|1[012])[-_\\\/\. ](?:[012]?\d|3[01])(?!\d)/);
  if (foundDate) { return foundDate[0]; }
  // Match ...MM-DD-YYYY...
  foundDate = text.match(/(?:[012]?\d|3[01])[-_\\\/\. ](?:0?\d|1[012])[-_\\\/\. ](?:19|20)\d\d(?!\d)/);
  if (foundDate) { return foundDate[0]; }
  // Match MM-DD-YY...
  foundDate = text.match(/^(?:[012]?\d|3[01])[-_\\\/\. ](?:0?\d|1[012])[-_\\\/\. ]\d\d(?!\d)/);
  if (foundDate) { return foundDate[0]; }
  // Match YY-MM-DD...
  foundDate = text.match(/^\d\d[-_\\\/\. ](?:[012]?\d|3[01])[-_\\\/\. ](?:0?\d|1[012])(?!\d)/);
  if (foundDate) { return foundDate[0]; }
  // Match YYYYMMDD...
  foundDate = text.match(/^(?:19|20)\d\d(?:0\d|1[012])(?:[012]\d|3[01])/);
  if (foundDate) { return foundDate[0]; }
}
