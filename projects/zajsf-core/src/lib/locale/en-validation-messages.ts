export const enValidationMessages: any = { // Default English error messages
  required: 'This field is required.',
  minLength: 'Must be {{minimumLength}} characters or longer (current length: {{currentLength}})',
  maxLength: 'Must be {{maximumLength}} characters or shorter (current length: {{currentLength}})',
  pattern: 'Must match pattern: {{requiredPattern}}',
  format: function (error) {
    switch (error.requiredFormat) {
      case 'date':
        return 'Must be a date, like "2000-12-31"';
      case 'time':
        return 'Must be a time, like "16:20" or "03:14:15.9265"';
      case 'date-time':
        return 'Must be a date-time, like "2000-03-14T01:59" or "2000-03-14T01:59:26.535Z"';
      case 'email':
        return 'Must be an email address, like "name@example.com"';
      case 'hostname':
        return 'Must be a hostname, like "example.com"';
      case 'ipv4':
        return 'Must be an IPv4 address, like "127.0.0.1"';
      case 'ipv6':
        return 'Must be an IPv6 address, like "1234:5678:9ABC:DEF0:1234:5678:9ABC:DEF0"';
      // TODO: add examples for 'uri', 'uri-reference', and 'uri-template'
      // case 'uri': case 'uri-reference': case 'uri-template':
      case 'url':
        return 'Must be a url, like "http://www.example.com/page.html"';
      case 'uuid':
        return 'Must be a uuid, like "12345678-9ABC-DEF0-1234-56789ABCDEF0"';
      case 'color':
        return 'Must be a color, like "#FFFFFF" or "rgb(255, 255, 255)"';
      case 'json-pointer':
        return 'Must be a JSON Pointer, like "/pointer/to/something"';
      case 'relative-json-pointer':
        return 'Must be a relative JSON Pointer, like "2/pointer/to/something"';
      case 'regex':
        return 'Must be a regular expression, like "(1-)?\\d{3}-\\d{3}-\\d{4}"';
      default:
        return 'Must be a correctly formatted ' + error.requiredFormat;
    }
  },
  minimum: 'Must be {{minimumValue}} or more',
  exclusiveMinimum: 'Must be more than {{exclusiveMinimumValue}}',
  maximum: 'Must be {{maximumValue}} or less',
  exclusiveMaximum: 'Must be less than {{exclusiveMaximumValue}}',
  multipleOf: function (error) {
    if ((1 / error.multipleOfValue) % 10 === 0) {
      const decimals = Math.log10(1 / error.multipleOfValue);
      return `Must have ${decimals} or fewer decimal places.`;
    } else {
      return `Must be a multiple of ${error.multipleOfValue}.`;
    }
  },
  minProperties: 'Must have {{minimumProperties}} or more items (current items: {{currentProperties}})',
  maxProperties: 'Must have {{maximumProperties}} or fewer items (current items: {{currentProperties}})',
  minItems: 'Must have {{minimumItems}} or more items (current items: {{currentItems}})',
  maxItems: 'Must have {{maximumItems}} or fewer items (current items: {{currentItems}})',
  uniqueItems: 'All items must be unique',
  // Note: No default error messages for 'type', 'const', 'enum', or 'dependencies'
};
