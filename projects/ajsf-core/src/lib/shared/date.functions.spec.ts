import { getOrdinal, dateToString } from './date.functions';

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

  describe('dateToString should return valid JSON schema date', () => {
    it('when Invalid Date', () => {
      expect(dateToString(undefined)).toBeNull();
      expect(dateToString(null)).toBeNull();
      expect(dateToString('invalid')).toBeNull();
    });
    it('when input is Date object', () => {
      expect(dateToString(new Date('1999-09-21'))).toEqual('1999-09-21');
    });
    it('when input is date string', () => {
      expect(dateToString('1999-02-28')).toEqual('1999-02-28');
    });
    it('when input has options with format YY-MMM-DDD', () => {
      const options = {
        dateFormat: 'YY-MMM-DDD'
      };
      expect(dateToString(new Date('1999-02-28'), options)).toEqual('99-Feb-Sun');
      expect(dateToString(new Date('2019-07-15'), options)).toEqual('19-Jul-Mon');
    });
    it('when input has options with format MMMM-DDDD-YYYY', () => {
      const options = {
        dateFormat: 'DDDD-MMMM-YYYY'
      };
      expect(dateToString(new Date('1999-02-28'), options)).toEqual('Sunday-February-1999');
      expect(dateToString(new Date('2019-07-15'), options)).toEqual('Monday-July-2019');
    });
    it('when input has options with format MM-DD-YY', () => {
      const options = {
        dateFormat: 'MM-DD-YY'
      };
      expect(dateToString(new Date('1999-02-28'), options)).toEqual('02-28-99');
    });
    it('when input has options with format YYYY-M-D', () => {
      const options = {
        dateFormat: 'YYYY-M-D'
      };
      expect(dateToString(new Date('1999-02-28'), options)).toEqual('1999-2-28');
    });
    it('when input has options with format YYYY-MM-DD S', () => {
      const options = {
        dateFormat: 'YYYY-MM-DD S'
      };
      expect(dateToString(new Date('1999-02-28'), options)).toEqual('1999-02-28 th');
      expect(dateToString(new Date('2019-07-15'), options)).toEqual('2019-07-15 th');
    });
  });
});
