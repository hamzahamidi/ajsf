// updated from AJV fast format regular expressions:
// https://github.com/epoberezkin/ajv/blob/master/lib/compile/formats.js

function isUrl(value: string): boolean {
  const scheme = /^(https?|ftp):\/\//i.exec(value)?.[1].toLowerCase();
  if (!scheme || /\s/.test(value)) {
    return false;
  }

  try {
    const parsed = new URL(value);
    const authority = value.slice(value.indexOf('://') + 3).split(/[/?#]/, 1)[0];
    const rawHost = authority.slice(authority.lastIndexOf('@') + 1);
    const portSeparator = rawHost.lastIndexOf(':');
    if (
      !parsed.hostname ||
      parsed.hostname.startsWith('[') ||
      rawHost.startsWith('[') ||
      (portSeparator !== -1 && !/^\d{2,5}$/.test(rawHost.slice(portSeparator + 1)))
    ) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    const labels = hostname.split('.');
    if (hostname.endsWith('.') || labels.length < 2) {
      return false;
    }

    const octets = labels.map(Number);
    const isIpv4 = labels.length === 4 && labels.every(label => /^\d{1,3}$/.test(label));
    if (isIpv4) {
      const [first, second, , fourth] = octets;
      const inPrivateRange =
        first === 10 || first === 127 ||
        (first === 169 && second === 254) ||
        (first === 192 && second === 168) ||
        (first === 172 && second >= 16 && second <= 31);
      return (
        octets.every(octet => Number.isInteger(octet) && octet >= 0 && octet <= 255) &&
        first >= 1 && first <= 223 && fourth >= 1 && fourth <= 254 && !inPrivateRange
      );
    }

    return labels.at(-1)!.length >= 2 && labels.every(label =>
      label.length <= 63 &&
      /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)
    );
  } catch {
    return false;
  }
}

const ipv6HextetPattern = /^[\da-f]{1,4}$/i;
const ipv6Ipv4OctetPattern = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

function isIpv4Address(value: string): boolean {
  const octets = value.split('.');
  return octets.length === 4 && octets.every(octet => ipv6Ipv4OctetPattern.test(octet));
}

function isIpv6(value: string): boolean {
  let input = value.trimStart();
  let address = input;
  const zoneIndex = address.indexOf('%');
  if (zoneIndex !== -1) {
    const zone = address.slice(zoneIndex + 1);
    const lineTerminatorIndex = zone.search(/[\r\n\u2028\u2029]/);
    if (
      zone.length === 0 ||
      lineTerminatorIndex === 0 ||
      (lineTerminatorIndex !== -1 && !/^\s+$/.test(zone.slice(lineTerminatorIndex)))
    ) {
      return false;
    }
    address = address.slice(0, zoneIndex);
  } else {
    input = input.trimEnd();
    address = input;
  }

  const compressionIndex = address.indexOf('::');
  const compressed = compressionIndex !== -1;
  if (compressed && address.indexOf('::', compressionIndex + 2) !== -1) return false;
  const left = compressed ? address.slice(0, compressionIndex) : address;
  const right = compressed ? address.slice(compressionIndex + 2) : '';
  const groups = [
    ...(left.length === 0 ? [] : left.split(':')),
    ...(right.length === 0 ? [] : right.split(':')),
  ];
  if (groups.some(group => group.length === 0)) return false;

  let groupCount = groups.length;
  const ipv4Index = groups.findIndex(group => group.includes('.'));
  if (ipv4Index !== -1) {
    if (ipv4Index !== groups.length - 1 || !isIpv4Address(groups[ipv4Index]!)) return false;
    groups.pop();
    groupCount += 1;
  }

  if (!groups.every(group => ipv6HextetPattern.test(group))) return false;
  return compressed ? groupCount < 8 : groupCount === 8;
}

const uriTemplateOperators = '+#./;?&=,!@|';
const uriTemplateVariablePattern = /^(?:[a-z0-9_]|%[\da-f]{2})+(?::[1-9]\d{0,3}|\*)?$/i;
const uriTemplateForbiddenLiteralCharacter = /[\x00-\x20"'<>\\^`{|}]/;
const uriTemplatePercentEncoding = /^%[\da-f]{2}$/i;

function isUriTemplateExpression(expression: string): boolean {
  const operator = expression[0] ?? '';
  const body = uriTemplateOperators.includes(operator) ? expression.slice(1) : expression;
  return body.length > 0 && body.split(',').every(variable => uriTemplateVariablePattern.test(variable));
}

function isUriTemplate(value: string): boolean {
  let index = 0;
  while (index < value.length) {
    const character = value[index]!;
    if (character === '{') {
      const closingIndex = value.indexOf('}', index + 1);
      if (closingIndex === -1) return false;
      const expression = value.slice(index + 1, closingIndex);
      if (expression.includes('{') || !isUriTemplateExpression(expression)) return false;
      index = closingIndex + 1;
      continue;
    }
    if (character === '%') {
      if (!uriTemplatePercentEncoding.test(value.slice(index, index + 3))) return false;
      index += 3;
      continue;
    }
    if (character === '}' || uriTemplateForbiddenLiteralCharacter.test(character)) return false;
    index += 1;
  }
  return true;
}

export const jsonSchemaFormatTests = {

  'date': /^\d\d\d\d-[0-1]\d-[0-3]\d$/,

  'time': /^[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?(?:z|[+-]\d\d:\d\d)?$/i,

  // Modified to allow incomplete entries, such as
  // "2000-03-14T01:59:26.535" (needs "Z") or "2000-03-14T01:59" (needs ":00Z")
  'date-time': /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s][0-2]\d:[0-5]\d(?::[0-5]\d)?(?:\.\d+)?(?:z|[+-]\d\d:\d\d)?$/i,

  // email (sources from jsen validator):
  // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
  // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'willful violation')
  'email': /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,

  'hostname': /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*$/i,

  // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
  'ipv4': /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,

  'ipv6': isIpv6,

  // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
  'uri': /^(?:[a-z][a-z0-9+-.]*)[:/]\/?[^\s]*$/i,

  // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
  'uri-reference': /^(?:(?:[a-z][a-z0-9+-.]*:)?\/\/)?[^\s]*$/i,

  // uri-template: https://tools.ietf.org/html/rfc6570
  'uri-template': isUriTemplate,

  // For the source: https://gist.github.com/dperini/729294
  // For test cases: https://mathiasbynens.be/demo/url-regex
  // @todo Delete current URL in favour of the commented out URL rule when this ajv issue is fixed https://github.com/eslint/eslint/issues/7983.
  // URL: /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u{00a1}-\u{ffff}0-9]+-?)*[a-z\u{00a1}-\u{ffff}0-9]+)(?:\.(?:[a-z\u{00a1}-\u{ffff}0-9]+-?)*[a-z\u{00a1}-\u{ffff}0-9]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
  'url': isUrl,

  // uuid: http://tools.ietf.org/html/rfc4122
  'uuid': /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,

  // optimized https://gist.github.com/olmokramer/82ccce673f86db7cda5e
  'color': /^\s*(#(?:[\da-f]{3}){1,2}|rgb\((?:\d{1,3},\s*){2}\d{1,3}\)|rgba\((?:\d{1,3},\s*){3}\d*\.?\d+\)|hsl\(\d{1,3}(?:,\s*\d{1,3}%){2}\)|hsla\(\d{1,3}(?:,\s*\d{1,3}%){2},\s*\d*\.?\d+\))\s*$/i,

  // JSON-pointer: https://tools.ietf.org/html/rfc6901
  'json-pointer': /^(?:\/(?:[^~/]|~0|~1)*)*$|^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,

  'relative-json-pointer': /^(?:0|[1-9]\d*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,

  'regex': function (str) {
    if (/[^\\]\\Z/.test(str)) { return false; }
    return true;
  }

};

export type JsonSchemaFormatNames =
  'date' | 'time' | 'date-time' | 'email' | 'hostname' | 'ipv4' | 'ipv6' |
  'uri' | 'uri-reference' | 'uri-template' | 'url' | 'uuid' | 'color' |
  'json-pointer' | 'relative-json-pointer' | 'regex';
