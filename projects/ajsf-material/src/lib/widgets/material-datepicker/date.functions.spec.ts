import { getOrdinal, parseDate } from './date.functions';

describe('Date functions', () => {
  describe('ordinal', () => {
    it('first day of the month', () => {
      expect(getOrdinal(1)).toEqual('st');
    });
    it('second day of the month', () => {
      expect(getOrdinal(2)).toEqual('nd');
    });
    it('third day of the month', () => {
      expect(getOrdinal(3)).toEqual('rd');
    });
    it('eleventh day of the month', () => {
      expect(getOrdinal(11)).toEqual('th');
    });
    it('twenty-first day of the month', () => {
      expect(getOrdinal(21)).toEqual('st');
    });
  });

  describe('parseDate', () => {
    it('should return valid Date from from string Date', () => {
      expect(parseDate(undefined)).toBeNull();
      expect(parseDate(null)).toBeNull();
      expect(parseDate('invalid')).toBeNull();
      expect(parseDate('invalid')).toBeNull();
    });
    it('should return valid Date from string YYYY-MM-DD', () => {
      expect(parseDate('1999-09-21')).toEqual(new Date(1999, 8, 21));
    });
    it('should return valid Date from string YYYY-MM', () => {
      expect(parseDate('1999-09')).toEqual(new Date(1999, 8, 1));
    });
    it('should return valid Date from string YYYY-MM-DDThh:mm:ss', () => {
      expect(parseDate('2018-05-02T00:00:00')).toEqual(new Date(2018, 4, 2));
    });
  });
});
