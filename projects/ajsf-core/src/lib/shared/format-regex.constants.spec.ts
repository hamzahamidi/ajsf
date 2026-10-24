import { jsonSchemaFormatTests } from './format-regex.constants';

describe('JSON Schema IPv6 format', () => {
  it.each([
    ['2001:db8::1', true],
    ['1:2:3:4:5:6:7:8', true],
    ['::ffff:192.0.2.1', true],
    ['  2001:db8::1  ', true],
    ['fe80::1%eth0', true],
    ['fe80::1% ', true],
    ['fe80::1%eth0 \n', true],
    ['1::2::3', false],
    ['1:::2', false],
    ['1:2:3:4:5:6:7', false],
    ['1:2:3:4:5:6:7::8', false],
    ['gggg::1', false],
    ['::ffff:256.0.2.1', false],
    ['::ffff:192.0.2.1:1', false],
    ['fe80::1%', false],
    ['fe80::1%\neth0', false],
    ['fe80::1%eth0\nx', false],
  ] as const)('validates %s as %s', (value, expected) => {
    expect(jsonSchemaFormatTests.ipv6(value)).toBe(expected);
  });
});

describe('JSON Schema URI template format', () => {
  it.each([
    ['https://example.com/{user}{?fields}', true],
    ['/{path:3}/{list*}', true],
    ['/%20', true],
    ['plain-text', true],
    ['{user', false],
    ['{{user}}', false],
    ['{}', false],
    ['{?}', false],
    ['{bad-name}', false],
    ['}', false],
    ['a b', false],
    ['%2', false],
    ['%XZ', false],
    ['line\n', false],
  ] as const)('validates %s as %s', (value, expected) => {
    expect(jsonSchemaFormatTests['uri-template'](value)).toBe(expected);
  });
});
