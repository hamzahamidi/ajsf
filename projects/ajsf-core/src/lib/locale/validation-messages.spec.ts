import { deValidationMessages } from './de-validation-messages';
import { enValidationMessages } from './en-validation-messages';
import { esValidationMessages } from './es-validation-messages';
import { frValidationMessages } from './fr-validation-messages';
import { itValidationMessages } from './it-validation-messages';
import { ptValidationMessages } from './pt-validation-messages';
import { zhValidationMessages } from './zh-validation-messages';

const locales: { name: string, messages: any }[] = [
  { name: 'de', messages: deValidationMessages },
  { name: 'en', messages: enValidationMessages },
  { name: 'es', messages: esValidationMessages },
  { name: 'fr', messages: frValidationMessages },
  { name: 'it', messages: itValidationMessages },
  { name: 'pt', messages: ptValidationMessages },
  { name: 'zh', messages: zhValidationMessages },
];

const expectedKeys: string[] = [
  'required',
  'minLength',
  'maxLength',
  'pattern',
  'format',
  'minimum',
  'exclusiveMinimum',
  'maximum',
  'exclusiveMaximum',
  'multipleOf',
  'minProperties',
  'maxProperties',
  'minItems',
  'maxItems',
  'uniqueItems',
];

// Every format name handled by an explicit `case` in the format() switch.
const knownFormats: string[] = [
  'date',
  'time',
  'date-time',
  'email',
  'hostname',
  'ipv4',
  'ipv6',
  'url',
  'uuid',
  'color',
  'json-pointer',
  'relative-json-pointer',
  'regex',
];

// multipleOfValue inputs where (1 / value) % 10 === 0, so the decimal places
// branch runs and the message reports Math.log10(1 / value) instead of the value.
const decimalPlacesCases: { value: number, decimals: string }[] = [
  { value: 0.1, decimals: '1' },
  { value: 0.01, decimals: '2' },
  { value: 0.001, decimals: '3' },
  { value: 0.0001, decimals: '4' },
];

// multipleOfValue inputs that fall through to the "multiple of" branch, which
// interpolates the raw value.
const multipleOfCases: number[] = [1, 2, 3, 0.5, 0.25, 10, 100, -1];

function placeholdersOf(message: string): string[] {
  return message.match(/\{\{[^}]+\}\}/g) || [];
}

describe('Validation messages', () => {

  describe('locale consistency', () => {

    it('every locale exports the same set of keys', () => {
      const reference = Object.keys(enValidationMessages).sort().join(',');
      // Collecting the offending locale names keeps the failure output readable.
      const mismatches = locales
        .filter(({ messages }) => Object.keys(messages).sort().join(',') !== reference)
        .map(({ name }) => name);

      expect(mismatches).toEqual([]);
    });

    it('every locale exports exactly the expected keys', () => {
      const reference = expectedKeys.slice().sort().join(',');
      const mismatches = locales
        .filter(({ messages }) => Object.keys(messages).sort().join(',') !== reference)
        .map(({ name }) => name);

      expect(mismatches).toEqual([]);
      expect(expectedKeys.length).toEqual(15);
    });

    it('format and multipleOf are the only function valued messages', () => {
      const functionKeysOf = (messages: any) => Object.keys(messages)
        .filter(key => typeof messages[key] === 'function')
        .sort();
      const mismatches = locales
        .filter(({ messages }) => functionKeysOf(messages).join(',') !== 'format,multipleOf')
        .map(({ name }) => name);

      expect(functionKeysOf(enValidationMessages)).toEqual(['format', 'multipleOf']);
      expect(mismatches).toEqual([]);
    });

    it('every non function message is a non empty string', () => {
      const offenders: string[] = [];

      locales.forEach(({ name, messages }) => {
        Object.keys(messages)
          .filter(key => typeof messages[key] !== 'function')
          .forEach(key => {
            if (typeof messages[key] !== 'string' || messages[key].length === 0) {
              offenders.push(`${name}.${key}`);
            }
          });
      });

      expect(offenders).toEqual([]);
    });

    it('placeholders match the English ones in every locale except French', () => {
      const reference: { [key: string]: string } = {};
      Object.keys(enValidationMessages)
        .filter(key => typeof enValidationMessages[key] !== 'function')
        .forEach(key => {
          reference[key] = placeholdersOf(enValidationMessages[key]).join(',');
        });
      const offenders: string[] = [];

      // French is excluded on purpose: see the locale quirks block below.
      locales
        .filter(locale => locale.name !== 'fr')
        .forEach(({ name, messages }) => {
          Object.keys(reference).forEach(key => {
            if (placeholdersOf(messages[key]).join(',') !== reference[key]) {
              offenders.push(`${name}.${key}`);
            }
          });
        });

      expect(offenders).toEqual([]);
    });
  });

  locales.forEach(({ name, messages }) => {

    describe(`${name} format()`, () => {

      knownFormats.forEach(format => {
        it(`returns a non empty string for the ${format} format`, () => {
          const result = messages.format({ requiredFormat: format });

          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);
        });
      });

      it('returns a different message for each known format', () => {
        const results = knownFormats.map(
          format => messages.format({ requiredFormat: format })
        );

        expect(new Set(results).size).toEqual(knownFormats.length);
      });

      it('uses the examples shared by every locale', () => {
        expect(messages.format({ requiredFormat: 'time' })).toContain('16:20');
        expect(messages.format({ requiredFormat: 'ipv4' })).toContain('127.0.0.1');
        expect(messages.format({ requiredFormat: 'ipv6' }))
          .toContain('1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0');
        expect(messages.format({ requiredFormat: 'uuid' }))
          .toContain('12345678-9ABC-DEF0-1234-56789ABCDEF0');
        expect(messages.format({ requiredFormat: 'color' })).toContain('#FFFFFF');
        expect(messages.format({ requiredFormat: 'color' })).toContain('rgb(255, 255, 255)');
        expect(messages.format({ requiredFormat: 'regex' }))
          .toContain('(1-)?\\d{3}-\\d{3}-\\d{4}');
      });

      it('falls through to the default branch for an unknown format', () => {
        const result = messages.format({ requiredFormat: 'not-a-real-format' });

        expect(typeof result).toBe('string');
        expect(result).toContain('not-a-real-format');
      });

      it('falls through to the default branch for uri, which has no case', () => {
        const result = messages.format({ requiredFormat: 'uri' });

        expect(result).toContain('uri');
      });

      it('interpolates the string "undefined" when requiredFormat is missing', () => {
        const result = messages.format({});

        expect(typeof result).toBe('string');
        expect(result).toContain('undefined');
      });

      it('interpolates the string "null" when requiredFormat is null', () => {
        const result = messages.format({ requiredFormat: null });

        expect(result).toContain('null');
      });

      it('returns the default branch message for an empty requiredFormat', () => {
        const result = messages.format({ requiredFormat: '' });

        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });

      it('is case sensitive, so an upper case format name misses its case', () => {
        const result = messages.format({ requiredFormat: 'DATE' });

        expect(result).toContain('DATE');
        expect(result).not.toEqual(messages.format({ requiredFormat: 'date' }));
      });

      it('throws when called without an error object', () => {
        expect(() => messages.format(undefined)).toThrow();
        expect(() => messages.format(null)).toThrow();
      });
    });

    describe(`${name} multipleOf()`, () => {

      decimalPlacesCases.forEach(({ value, decimals }) => {
        it(`reports ${decimals} decimal places for a multipleOfValue of ${value}`, () => {
          const result = messages.multipleOf({ multipleOfValue: value });

          expect(typeof result).toBe('string');
          expect(result).toContain(decimals);
          // The decimal places branch never echoes the raw value back.
          expect(result).not.toContain(String(value));
        });
      });

      multipleOfCases.forEach(value => {
        it(`reports a multiple of ${value}`, () => {
          const result = messages.multipleOf({ multipleOfValue: value });

          expect(typeof result).toBe('string');
          expect(result).toContain(String(value));
        });
      });

      it('takes the decimal places branch for a numeric string', () => {
        const result = messages.multipleOf({ multipleOfValue: '0.1' });

        expect(result).toEqual(messages.multipleOf({ multipleOfValue: 0.1 }));
      });

      it('reports a fractional count of decimal places for 0.05', () => {
        // 1 / 0.05 is 20, and 20 % 10 === 0, so Math.log10(20) leaks into the message.
        const result = messages.multipleOf({ multipleOfValue: 0.05 });

        expect(result).toContain('1.3010299956639813');
      });

      it('reports a fractional count of decimal places for 0.005', () => {
        const result = messages.multipleOf({ multipleOfValue: 0.005 });

        expect(result).toContain('2.3010299956639813');
      });

      it('reports 0.00001 as a multiple because 1 / 0.00001 is not exactly 100000', () => {
        const result = messages.multipleOf({ multipleOfValue: 0.00001 });

        expect(result).toContain('0.00001');
      });

      it('reports NaN decimal places for a negative multipleOfValue', () => {
        // 1 / -0.1 is -10 and -10 % 10 is -0, which equals 0, so the decimal
        // places branch runs and Math.log10 of a negative number is NaN.
        const result = messages.multipleOf({ multipleOfValue: -0.1 });

        expect(result).toContain('NaN');
      });

      it('reports minus Infinity decimal places for an infinite multipleOfValue', () => {
        const result = messages.multipleOf({ multipleOfValue: Infinity });

        expect(result).toContain('-Infinity');
      });

      it('reports a multiple of 0 for a zero multipleOfValue', () => {
        const result = messages.multipleOf({ multipleOfValue: 0 });

        expect(typeof result).toBe('string');
        expect(result).toContain('0');
        expect(result).not.toContain('Infinity');
      });

      it('reports a multiple of NaN for a NaN multipleOfValue', () => {
        const result = messages.multipleOf({ multipleOfValue: NaN });

        expect(result).toContain('NaN');
      });

      it('reports a multiple of null for a null multipleOfValue', () => {
        const result = messages.multipleOf({ multipleOfValue: null });

        expect(result).toContain('null');
      });

      it('reports a multiple of undefined when multipleOfValue is missing', () => {
        const result = messages.multipleOf({});

        expect(result).toContain('undefined');
      });

      it('ignores unrelated properties on the error object', () => {
        const result = messages.multipleOf({ multipleOfValue: 2, requiredLength: 5 });

        expect(result).toEqual(messages.multipleOf({ multipleOfValue: 2 }));
      });

      it('throws when called without an error object', () => {
        expect(() => messages.multipleOf(undefined)).toThrow();
        expect(() => messages.multipleOf(null)).toThrow();
      });
    });
  });

  describe('English exact messages', () => {

    it('returns the documented message for every known format', () => {
      const format = enValidationMessages.format;

      expect(format({ requiredFormat: 'date' }))
        .toEqual('Must be a date, like "2000-12-31"');
      expect(format({ requiredFormat: 'time' }))
        .toEqual('Must be a time, like "16:20" or "03:14:15.9265"');
      expect(format({ requiredFormat: 'date-time' }))
        .toEqual('Must be a date-time, like "2000-03-14T01:59" or "2000-03-14T01:59:26.535Z"');
      expect(format({ requiredFormat: 'email' }))
        .toEqual('Must be an email address, like "name@example.com"');
      expect(format({ requiredFormat: 'hostname' }))
        .toEqual('Must be a hostname, like "example.com"');
      expect(format({ requiredFormat: 'ipv4' }))
        .toEqual('Must be an IPv4 address, like "127.0.0.1"');
      expect(format({ requiredFormat: 'ipv6' }))
        .toEqual('Must be an IPv6 address, like "1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0"');
      expect(format({ requiredFormat: 'url' }))
        .toEqual('Must be a url, like "http://www.example.com/page.html"');
      expect(format({ requiredFormat: 'uuid' }))
        .toEqual('Must be a uuid, like "12345678-9ABC-DEF0-1234-56789ABCDEF0"');
      expect(format({ requiredFormat: 'color' }))
        .toEqual('Must be a color, like "#FFFFFF" or "rgb(255, 255, 255)"');
      expect(format({ requiredFormat: 'json-pointer' }))
        .toEqual('Must be a JSON Pointer, like "/pointer/to/something"');
      expect(format({ requiredFormat: 'relative-json-pointer' }))
        .toEqual('Must be a relative JSON Pointer, like "2/pointer/to/something"');
      expect(format({ requiredFormat: 'regex' }))
        .toEqual('Must be a regular expression, like "(1-)?\\d{3}-\\d{3}-\\d{4}"');
    });

    it('returns the documented default branch message', () => {
      expect(enValidationMessages.format({ requiredFormat: 'ipv8' }))
        .toEqual('Must be a correctly formatted ipv8');
      expect(enValidationMessages.format({}))
        .toEqual('Must be a correctly formatted undefined');
      expect(enValidationMessages.format({ requiredFormat: '' }))
        .toEqual('Must be a correctly formatted ');
    });

    it('returns the documented multipleOf messages', () => {
      expect(enValidationMessages.multipleOf({ multipleOfValue: 0.01 }))
        .toEqual('Must have 2 or fewer decimal places.');
      expect(enValidationMessages.multipleOf({ multipleOfValue: 0.0001 }))
        .toEqual('Must have 4 or fewer decimal places.');
      expect(enValidationMessages.multipleOf({ multipleOfValue: 5 }))
        .toEqual('Must be a multiple of 5.');
      expect(enValidationMessages.multipleOf({ multipleOfValue: 0.05 }))
        .toEqual('Must have 1.3010299956639813 or fewer decimal places.');
      expect(enValidationMessages.multipleOf({ multipleOfValue: -0.1 }))
        .toEqual('Must have NaN or fewer decimal places.');
      expect(enValidationMessages.multipleOf({ multipleOfValue: Infinity }))
        .toEqual('Must have -Infinity or fewer decimal places.');
    });

    it('exposes the documented template messages', () => {
      expect(enValidationMessages.required).toEqual('This field is required.');
      expect(enValidationMessages.pattern)
        .toEqual('Must match pattern: {{requiredPattern}}');
      expect(enValidationMessages.uniqueItems).toEqual('All items must be unique');
      expect(enValidationMessages.minLength)
        .toEqual('Must be {{minimumLength}} characters or longer (current length: {{currentLength}})');
      expect(enValidationMessages.maxItems)
        .toEqual('Must have {{maximumItems}} or fewer items (current items: {{currentItems}})');
    });
  });

  describe('locale quirks', () => {

    it('Italian uses day first date examples', () => {
      expect(itValidationMessages.format({ requiredFormat: 'date' }))
        .toContain('"31-12-2000"');
      expect(itValidationMessages.format({ requiredFormat: 'date' }))
        .not.toContain('2000-12-31');
      expect(itValidationMessages.format({ requiredFormat: 'date-time' }))
        .toContain('"14-03-2000T01:59"');
    });

    it('every locale except Italian uses the ISO date example', () => {
      locales
        .filter(locale => locale.name !== 'it')
        .forEach(({ messages }) => {
          expect(messages.format({ requiredFormat: 'date' })).toContain('2000-12-31');
          expect(messages.format({ requiredFormat: 'date-time' })).toContain('2000-03-14T01:59');
        });
    });

    it('Portuguese uses Brazilian examples', () => {
      expect(ptValidationMessages.format({ requiredFormat: 'email' }))
        .toContain('fulano@exemplo.com.br');
      expect(ptValidationMessages.format({ requiredFormat: 'hostname' }))
        .toContain('exemplo.com.br');
      expect(ptValidationMessages.format({ requiredFormat: 'url' }))
        .toContain('http://www.exemplo.com.br/pagina.html');
      expect(ptValidationMessages.format({ requiredFormat: 'json-pointer' }))
        .toContain('/referencia/para/algo');
      expect(ptValidationMessages.format({ requiredFormat: 'relative-json-pointer' }))
        .toContain('2/referencia/para/algo');
    });

    it('every locale except Portuguese uses the example.com examples', () => {
      locales
        .filter(locale => locale.name !== 'pt')
        .forEach(({ messages }) => {
          expect(messages.format({ requiredFormat: 'email' })).toContain('name@example.com');
          expect(messages.format({ requiredFormat: 'hostname' })).toContain('example.com');
          expect(messages.format({ requiredFormat: 'url' }))
            .toContain('http://www.example.com/page.html');
          expect(messages.format({ requiredFormat: 'json-pointer' }))
            .toContain('/pointer/to/something');
        });
    });

    it('French maxItems interpolates minimumItems', () => {
      // Pinned as is: this looks like a copy and paste slip in the source.
      expect(frValidationMessages.maxItems).toContain('{{minimumItems}}');
      expect(frValidationMessages.maxItems).not.toContain('{{maximumItems}}');
    });

    it('French item and property messages drop the current count placeholder', () => {
      expect(frValidationMessages.minItems).not.toContain('{{currentItems}}');
      expect(frValidationMessages.maxItems).not.toContain('{{currentItems}}');
      expect(frValidationMessages.minProperties).not.toContain('{{currentProperties}}');
      expect(frValidationMessages.maxProperties).not.toContain('{{currentProperties}}');
    });

    it('Spanish leaves the pattern message untranslated', () => {
      expect(esValidationMessages.pattern).toEqual(enValidationMessages.pattern);
    });

    it('the other message strings differ between English and Spanish', () => {
      expect(esValidationMessages.required).not.toEqual(enValidationMessages.required);
      expect(esValidationMessages.uniqueItems).not.toEqual(enValidationMessages.uniqueItems);
    });
  });
});
